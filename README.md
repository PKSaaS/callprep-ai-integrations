# CallPrep AI Assistant Integrations

Bring [CallPrep](https://callprep.app) into Claude and ChatGPT: research any B2B prospect from their email, and turn inbound leads into ready-to-send outreach sequences (3 emails + LinkedIn invite + LinkedIn follow-up). Free to use with a free CallPrep account (monthly credit limits apply).

Submit a prospect's email address and get an AI-enriched call prep brief: LinkedIn activity, company insights, synergy points, tailored discovery questions, and key decision makers.

## What's in this repo

| Path | What it is |
| --- | --- |
| `skills/sales-follow-up/` | **Claude skill** — installable in Claude Desktop / claude.ai (upload) and Claude Code (plugin) |
| `.claude-plugin/` | Makes this repo a **Claude Code plugin marketplace** — one-command install |
| `chatgpt/` | **ChatGPT GPT** — OpenAPI spec + instructions to publish a CallPrep GPT in the GPT Store |
| `DISTRIBUTION.md` | How to get each one into the official directories, with caveats |

## Quick start

### Claude Code

```
/plugin marketplace add PKSaaS/callprep-ai-integrations
/plugin install sales-follow-up@callprep
```

Then set your API key (from the [CallPrep dashboard](https://callprep.app) → API Keys):

```bash
export CALLPREP_API_KEY=cp_live_...
```

Ask Claude: *"Prep me for my call with john.doe@acme.com"*

### Claude Desktop / claude.ai

Settings → Capabilities → Skills → Upload skill → select a zip of `skills/sales-follow-up/`.

### ChatGPT

See `chatgpt/SETUP.md` — create a GPT with the included OpenAPI action and instructions, then publish to the GPT Store.

## The API underneath

Two endpoints, documented at [callprep.app](https://callprep.app):

```
POST /research               → { research_id, status: "processing" }
GET  /research-status/{id}   → { status: "completed", data: {...} }
```

Auth: `Authorization: Bearer cp_live_...`. Each research call consumes 1 credit.
