# Publishing the CallPrep GPT to the GPT Store

ChatGPT plugins were discontinued by OpenAI in 2024. The discoverable equivalents today are:

1. **A GPT in the GPT Store** — what this folder sets up. Live today, no OpenAI review beyond store policies.
2. **A ChatGPT App (Apps SDK)** — the newer, deeper integration (MCP-based, in-chat UI components). Requires a hosted MCP server **with OAuth** so each user connects their own CallPrep account. See `../DISTRIBUTION.md` — this needs backend work on CallPrep first.

## Create the GPT

1. Go to https://chatgpt.com/gpts/editor (requires ChatGPT Plus/Pro/Team).
2. **Configure** tab:
   - Name: `CallPrep — Sales Call Prep`
   - Description: `Research any B2B prospect from their email: LinkedIn activity, company insights, talking points, discovery questions, and decision makers — before your sales call.`
   - Instructions: paste the contents of `gpt-instructions.md`.
   - Conversation starters: use the four listed at the bottom of `gpt-instructions.md`.
3. **Actions** → Create new action:
   - Schema: paste `openapi.yaml`.
   - Authentication: **API Key**, Auth Type **Bearer**, and paste a CallPrep API key (`cp_live_...`).
4. Test in the preview pane with a real email, then **Publish → Everyone** to list it in the GPT Store (requires a verified Builder Profile: Settings → Builder profile → verify domain callprep.app or link a social account).

## ⚠️ The shared-key caveat (important)

GPT Actions support only builder-level auth (one API key for the whole GPT) or OAuth. With the API-key option, **every GPT user consumes credits from the single CallPrep account whose key you configured**, and results are personalized to that account's product context.

Implications:

- Fine for: a demo/lead-gen GPT using a dedicated CallPrep account with a capped plan (treat it as marketing spend; expect the free credits to be consumed by strangers).
- Not fine for: paying customers using their own CallPrep accounts through the public GPT.

For per-user accounts, CallPrep needs an **OAuth 2.0 authorization-code flow** (`/oauth/authorize`, `/oauth/token`) — then the GPT can use OAuth auth and each user connects their own account. The same OAuth work also unlocks the ChatGPT Apps SDK and the Claude connectors directory, so it is the single highest-leverage backend task for distribution.
