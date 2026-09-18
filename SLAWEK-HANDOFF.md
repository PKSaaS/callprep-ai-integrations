# Task for Slawek — CallPrep as a connector in Claude & ChatGPT

**Goal:** a user in Claude or ChatGPT clicks "Connect CallPrep", logs in with their CallPrep account, and the AI can research leads with *their* credits and product context. One backend (an MCP server + OAuth on callprep.app) serves both platforms.

**Why now (Sep 2026):**
- OpenAI is retiring custom GPTs (public sharing already gone; all GPTs stop Dec 11, 2026). The only public ChatGPT path is now the **Apps SDK**, which is built on MCP + OAuth.
- Anthropic's **connectors directory** (claude.ai / Claude Desktop "Browse connectors") has the same requirement: remote MCP server + OAuth.
- A CallPrep skill/plugin is already submitted to Anthropic's community plugin directory (2026-09-18, from hello@callprep.app) and listed on skills.sh — but those only cover Claude Code, with user-pasted API keys. OAuth+MCP is what unlocks the mainstream "click to connect" surfaces.

**What already exists (working, tested):**
- Prototype remote MCP server: `https://callprep-mcp.netlify.app/mcp` — source in this repo at `mcp-server/netlify/functions/mcp.mts` (~200 lines, zero dependencies, stateless Streamable HTTP). It wraps the existing public API (`POST /research`, `GET /research-status/{id}`) and forwards `Authorization: Bearer cp_*` keys; verified end-to-end against the production Supabase functions.
- The tool definitions, descriptions, and error handling in that file are directory-quality — port them as-is.

---

## Phase A — Move the MCP endpoint into call_prep_API (~half a day)

1. Port `mcp-server/netlify/functions/mcp.mts` to a Next.js route handler, e.g. `app/api/mcp/route.ts` (POST). It is plain JSON-RPC over HTTP: `initialize`, `ping`, `tools/list`, `tools/call`, notifications → 202. No SDK strictly needed; `@modelcontextprotocol/sdk` is optional.
2. Auth: reuse the exact same `cp_live_` key validation the `research` edge function uses.
3. Serve it at **`mcp.callprep.app`** (subdomain preferred for directory listings; a rewrite to `/api/mcp` is fine).
4. Smoke test (same three curls we used):
   - `initialize` → protocolVersion negotiation
   - `tools/list` → `research_lead`, `get_research_result`
   - `tools/call` with a bad key → clean 401 message, with a good key → real research JSON
5. Dev-surface test: `claude mcp add --transport http callprep https://mcp.callprep.app/mcp --header "Authorization: Bearer cp_live_..."`, and ChatGPT → Settings → Connectors → developer mode.

## Phase B — OAuth 2.1 in front of it (~2–4 days; this is the real unlock)

Both directories require the MCP auth spec: **OAuth 2.1 authorization-code + PKCE, Dynamic Client Registration (RFC 7591), AS metadata (RFC 8414), protected-resource metadata (RFC 9728)**.

1. Discovery endpoints:
   - `/.well-known/oauth-protected-resource` (on the MCP host, pointing at the authorization server)
   - `/.well-known/oauth-authorization-server`
2. `/oauth/register` — DCR: accept a client registration POST, return client_id (no secret; public clients + PKCE).
3. `/oauth/authorize` — a page in the existing Next.js app: user logs in via the existing Supabase Auth session, sees a consent screen ("Claude wants to research leads with your CallPrep account"), gets redirected back with a code.
4. `/oauth/token` — exchange code + PKCE verifier for an access token (+ refresh token). Token can be a JWT carrying `user_id`, or opaque with a DB lookup.
5. Identity mapping: simplest is per-user internal API key — on first OAuth connect, create (or reuse) an internal key for that account and resolve tokens to it, so the MCP route hits the same code path as `cp_live_` keys, same credits, same product context.
6. Unauthenticated MCP requests must return **401 with a `WWW-Authenticate` header** referencing the protected-resource metadata — that's how Claude/ChatGPT auto-discover the OAuth flow and show the "Connect" button.
7. Shortcut option: an off-the-shelf AS (Auth0 / WorkOS / Supabase's OAuth server) is fine **if it supports DCR**; otherwise hand-rolling on Supabase is ~4 small endpoints.

## Phase C — Submit to both directories (~1 day + review time)

- **Anthropic connectors directory**: submission via Anthropic's connector partner form (anthropic.com); needs working OAuth, privacy policy (exists: callprep.app/privacy), support contact (hello@callprep.app).
- **ChatGPT Apps (Apps SDK)**: register the connector in ChatGPT developer mode, test, then submit through OpenAI's app review. Optional later: Apps SDK UI components (a rendered lead card / sequence view inside ChatGPT).
- Until approvals land, both platforms already support user-added custom connectors pointing at `mcp.callprep.app` — shippable to design partners immediately after Phase B.

## Phase D — later, the product play (see ROADMAP.md)

Extend the tool set beyond research by exposing the existing autopilot internals through the same authenticated MCP: `qualify_lead`, `create_journey`, `start_journey`, `pause_journey`, `get_hot_leads`. That's when "ChatGPT/Claude as the control surface, CallPrep as the execution engine" becomes real — but it is NOT needed for Phase A–C.

## Acceptance checklist

- [ ] `POST https://mcp.callprep.app/mcp` passes the three smoke curls
- [ ] Bad key → clean error; good key → research data (same credits/context as the raw API)
- [ ] Unauthenticated request → 401 + `WWW-Authenticate` → OAuth discovery works
- [ ] "Add custom connector" in claude.ai completes the OAuth dance and lists 2 tools
- [ ] Same in ChatGPT developer mode
- [ ] Submissions filed to both directories

Questions → Pawel. Prototype source, tool descriptions, and roadmap all live in this repo.
