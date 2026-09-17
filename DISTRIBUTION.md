# Getting CallPrep into the official directories

## Claude

There are three distribution surfaces, from easiest to most official:

1. **Claude Code plugin marketplace (live now, this repo).** Anyone can run:
   ```
   /plugin marketplace add PKSaaS/callprep-ai-integrations
   /plugin install callprep@callprep
   ```
   Works immediately; no Anthropic approval needed.

2. **Claude Desktop / claude.ai skills.** Users upload a zip of `skills/callprep/` under Settings → Capabilities → Skills. For the *discoverable* skills gallery in the desktop app: Anthropic curates it from the public [anthropics/skills](https://github.com/anthropics/skills) repository — the path is to open a PR there contributing the `callprep` skill folder, following their CONTRIBUTING guidelines (clear description, no bundled secrets — ours takes the API key via env var, which fits). Partner/featured placement is at Anthropic's discretion.

3. **Claude connectors directory (the most "official" placement).** Connectors are hosted remote **MCP servers** with OAuth, listed in claude.ai/Desktop's "Browse connectors". This gives the real "Connect CallPrep" one-click experience for non-technical users. Requirements: a public MCP endpoint (e.g. `mcp.callprep.app`) exposing `research_prospect` / `get_research_result` tools, OAuth 2.0 login against CallPrep accounts, and submission to Anthropic's connector directory (anthropic.com → connectors partner submission). Needs the OAuth backend work described in ROADMAP.md.

## ChatGPT

Plugins are dead (discontinued 2024). Two surfaces:

1. **GPT Store (live now).** See `chatgpt/SETUP.md`. Ships this week; the shared-key caveat applies.
2. **ChatGPT Apps (Apps SDK).** MCP-based apps with in-chat UI, discoverable in the ChatGPT app directory. Requires the same hosted MCP server + OAuth as the Claude connector — **one MCP server powers both directories.** Submission goes through OpenAI's app review.

## The strategic point

Both "most official" placements (Claude connectors directory, ChatGPT app directory) converge on the same missing piece: **a hosted MCP server backed by OAuth on callprep.app.** Everything in this repo works today with API keys; the OAuth+MCP layer is the single backend investment that unlocks both marketplaces properly.
