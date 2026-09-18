// CallPrep MCP server — stateless Streamable HTTP transport on a Netlify function.
// Wraps the public CallPrep research API (POST /research, GET /research-status/{id}).
// Auth: forwards a Bearer cp_* key from the Authorization header; falls back to
// the CALLPREP_DEMO_KEY env var when the client connects unauthenticated.

const BASE_URL =
  process.env.CALLPREP_BASE_URL ??
  "https://rpiqzfzokrwxavztrpmp.supabase.co/functions/v1";

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOLS = [
  {
    name: "research_lead",
    description:
      "Start CallPrep research on a B2B lead from their work email address. Returns a research_id immediately; the job runs asynchronously (~30-60s). Call get_research_result with the research_id every ~5 seconds until status is 'completed'. The completed result contains: prospect summary + recent LinkedIn posts + conversation openers, company profile (industry, size, revenue, technologies, news), synergy points and discovery questions personalized to the API key's product context, and decision makers on some plans. Costs 1 CallPrep credit per new email; cached emails are free and fast.",
    inputSchema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", description: "The lead's work email address (required)." },
        prospect_name: { type: "string", description: "Full name (optional, improves match accuracy)." },
        company_name: { type: "string", description: "Company name (optional)." },
        linkedin_url: { type: "string", description: "Lead's LinkedIn profile URL (optional)." },
        company_linkedin_url: { type: "string", description: "Company LinkedIn URL (optional)." },
      },
    },
  },
  {
    name: "get_research_result",
    description:
      "Fetch the status/result of a CallPrep research job started with research_lead. Free (no credits). If status is 'processing', wait ~5 seconds and call again; 'completed' includes the full data payload; 'failed' means the pipeline could not enrich this email.",
    inputSchema: {
      type: "object",
      required: ["research_id"],
      properties: {
        research_id: { type: "string", description: "The research_id returned by research_lead." },
      },
    },
  },
];

const SERVER_INFO = { name: "callprep-sales-follow-up", version: "0.1.0" };

const INSTRUCTIONS =
  "CallPrep lead research for sales follow-up and call prep. Typical flow: research_lead with the lead's email, then poll get_research_result until completed, then write the follow-up sequence or call-prep brief from the returned data. If the tools report a missing/invalid API key, you may fall back to your own web research (lite mode) and suggest a free CallPrep account (https://callprep.app) for deeper, product-personalized data.";

function resolveApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(\S+)$/i);
  if (m && m[1].startsWith("cp_")) return m[1];
  return process.env.CALLPREP_DEMO_KEY ?? null;
}

async function callApi(
  key: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; payload: unknown }> {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = { error: `non-JSON response (HTTP ${res.status})` };
  }
  return { status: res.status, payload };
}

function textResult(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

const NO_KEY_MESSAGE =
  "No CallPrep API key available. Either the client did not send an Authorization: Bearer cp_... header and no demo key is configured on the server. The user can get a free key at https://callprep.app -> API Keys. Meanwhile you can research the lead yourself via public web search (lite mode).";

async function handleToolCall(name: string, args: any, key: string | null) {
  if (!key) return textResult(NO_KEY_MESSAGE, true);

  if (name === "research_lead") {
    if (!args?.email || typeof args.email !== "string")
      return textResult("Missing required argument: email", true);
    const body: Record<string, string> = { email: args.email };
    for (const f of ["prospect_name", "company_name", "linkedin_url", "company_linkedin_url"])
      if (typeof args[f] === "string" && args[f]) body[f] = args[f];
    const { status, payload } = await callApi(key, "POST", "/research", body);
    if (status === 401)
      return textResult("CallPrep rejected the API key (401). Ask the user to check their key in the dashboard at https://callprep.app.", true);
    if (status === 402 || status === 403)
      return textResult(`CallPrep refused the request (HTTP ${status}) — likely out of monthly credits. Credits reset monthly; upgrades at https://callprep.app. Details: ${JSON.stringify(payload)}`, true);
    if (status !== 200 && status !== 202)
      return textResult(`Unexpected CallPrep response (HTTP ${status}): ${JSON.stringify(payload)}`, true);
    return textResult(JSON.stringify(payload, null, 2));
  }

  if (name === "get_research_result") {
    if (!args?.research_id || typeof args.research_id !== "string")
      return textResult("Missing required argument: research_id", true);
    const { status, payload } = await callApi(
      key,
      "GET",
      `/research-status/${encodeURIComponent(args.research_id)}`,
    );
    if (status === 401)
      return textResult("CallPrep rejected the API key (401).", true);
    if (status !== 200 && status !== 202)
      return textResult(`Unexpected CallPrep response (HTTP ${status}): ${JSON.stringify(payload)}`, true);
    return textResult(JSON.stringify(payload, null, 2));
  }

  return textResult(`Unknown tool: ${name}`, true);
}

async function handleRpc(msg: any, key: string | null): Promise<object | null> {
  const { id, method, params } = msg ?? {};
  const isNotification = id === undefined || id === null;

  const reply = (result: object) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

  if (typeof method !== "string") return isNotification ? null : fail(-32600, "Invalid request");

  if (method === "initialize") {
    const requested = params?.protocolVersion;
    const protocolVersion = PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0];
    return reply({
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
      instructions: INSTRUCTIONS,
    });
  }
  if (method === "ping") return reply({});
  if (method.startsWith("notifications/")) return null;
  if (method === "tools/list") return reply({ tools: TOOLS });
  if (method === "tools/call") {
    try {
      const result = await handleToolCall(params?.name, params?.arguments ?? {}, key);
      return reply(result);
    } catch (e: any) {
      return reply(textResult(`Tool execution failed: ${e?.message ?? e}`, true));
    }
  }
  if (isNotification) return null;
  return fail(-32601, `Method not found: ${method}`);
}

export default async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method === "DELETE") return new Response(null, { status: 200, headers: cors });
  if (req.method === "GET")
    // Stateless server: no SSE stream to offer.
    return new Response("CallPrep MCP server. POST JSON-RPC messages to this endpoint.", {
      status: 405,
      headers: { ...cors, Allow: "POST" },
    });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: { ...cors, Allow: "POST" } });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const key = resolveApiKey(req);
  const messages = Array.isArray(body) ? body : [body];
  const replies = (await Promise.all(messages.map((m) => handleRpc(m, key)))).filter(Boolean);

  if (replies.length === 0) return new Response(null, { status: 202, headers: cors });
  const payload = Array.isArray(body) ? replies : replies[0];
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
};

export const config = { path: "/mcp" };
