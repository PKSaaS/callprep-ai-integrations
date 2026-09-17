# Roadmap — from "research API" to "Inbound Sales Autopilot control surface"

Context: the product brief (Sep 2026) describes CallPrep as an Inbound Sales Autopilot where ChatGPT/Claude are natural-language control interfaces — `research_lead`, `qualify_lead`, `create_journey`, `start_journey`, `get_hot_leads`, etc.

## Reality check against the codebase (call_prep_API, Sep 2026)

Most of the brief's engine **already exists** — it is not a greenfield build:

| Brief concept | Already in the codebase |
| --- | --- |
| Enrich the lead (structured JSON) | `supabase/functions/research-worker/` — Apollo → PDL fallback → LinkedIn scraping → Claude insights → Apify decision makers |
| Seller profile | `app/api/settings/product/` — per-account product context (name, features, ICP, target customers) that already personalizes research output |
| Multichannel journeys | `app/api/autopilot/sales/*` — enroll, generate, preview-step, save, worker, sweep; templates; email + LinkedIn/WhatsApp/Telegram via Unipile seats |
| Reply detection → stop → classify | `app/api/autopilot/sales/reply-poll`, `app/api/inbox/*` (draft, reply, close, resume) |
| CRM trigger | `app/api/autopilot/hubspot/events` + reconcile (HubSpot webhooks) |
| Human handoff | Inbox flow + reminders |

**The actual gap:** all of the autopilot surface is *internal* — authenticated by worker secrets and Supabase session cookies. The only capability reachable with a `cp_live_` API key is `POST /research` / `GET /research-status`. ChatGPT and Claude can therefore research leads today, but cannot qualify, build, modify, or launch journeys.

## Phase 1 — ship now (this repo, no backend changes)

- Claude skill + Claude Code plugin marketplace on `/research`.
- GPT Store GPT on `/research` (shared-key caveat, see `chatgpt/SETUP.md`).

## Phase 2 — public Autopilot API (backend work, needs Slawek)

Expose the existing engine under API-key (and later OAuth) auth, e.g.:

```
POST /v1/leads/research          → wraps existing research pipeline (exists today as /research)
GET  /v1/leads                   → list enriched leads, filter by priority/status
GET  /v1/leads/{id}              → full brief + qualification
POST /v1/journeys                → create journey for a lead (wraps autopilot/sales/generate + save)
POST /v1/journeys/{id}/start     → wraps enroll
POST /v1/journeys/{id}/pause
PATCH /v1/journeys/{id}          → modify steps/channels ("make it less aggressive", "no WhatsApp")
GET  /v1/inbox/hot               → positive-reply / handoff queue ("which leads should I focus on today?")
```

Design notes:

- These should mostly be thin auth-translation wrappers over `lib/autopilot/*` — the logic exists; the work is exposing it safely per-account with `cp_live_` keys instead of session cookies.
- Qualification scoring ("ICP fit 84/100 + reasons") is the one genuinely new capability in the brief: the pieces (seller profile + research JSON) exist, but there is no explicit scoring step. Worth building as `POST /v1/leads/{id}/qualify` with a *transparent* reasons array, not a bare number.

## Phase 3 — OAuth + hosted MCP server

- OAuth 2.0 authorization-code flow on callprep.app (Supabase Auth can back it).
- A hosted MCP server (`mcp.callprep.app`) exposing the Phase 2 endpoints as tools: `research_lead`, `qualify_lead`, `create_journey`, `update_journey`, `start_journey`, `pause_journey`, `get_lead_status`, `get_hot_leads`.
- Submit to **both** the Claude connectors directory and the ChatGPT app directory (Apps SDK) — one server, two marketplaces. This is the point where "ChatGPT/Claude as the control interface, CallPrep as the execution engine" becomes real.
