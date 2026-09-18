# ChatGPT status — GPT built (private), public path is now Apps SDK

## ⚠️ Reality check (verified 2026-09-18)

OpenAI is retiring custom GPTs:

- **Aug 16, 2026** — consumer accounts (Free/Go/Plus/Pro) lost the ability to publish new GPTs publicly; the share dialog says "Sharing GPTs with the public is no longer available." GPT Store submissions now require a Business/Enterprise/Edu workspace.
- **Sep 25, 2026** — creation of new custom GPTs ends.
- **Dec 11, 2026** — existing custom GPTs stop running.

So the GPT Store is a dead end for public distribution. The files in this folder remain the source of truth for the GPT's content.

## What exists today

A **private** GPT ("Sales Follow-Up — Lead Research & Email Sequences") was built on 2026-09-18 with the instructions, conversation starters, capabilities (web search on), the CallPrep API action (submitResearch + getResearchStatus, auth: None → lite-mode fallback), and the privacy policy URL. Visible to the owner account only — use it for dogfooding and demos until Dec 11, 2026.

## The real public path on ChatGPT: Apps SDK

Public ChatGPT distribution now runs through **ChatGPT Apps** (the Apps SDK): an MCP server + OAuth, listed in the ChatGPT app directory. This is the same MCP server + OAuth work described in `../ROADMAP.md` Phase 3 — one build serves BOTH the ChatGPT app directory and the Claude connectors directory. That work (on callprep.app's backend) is now the single gateway to public distribution on ChatGPT.

Practical implication: the Claude side (community plugin directory — submitted 2026-09-18 — plus skills.sh and the public repo) is the distribution channel that works *today*; ChatGPT joins when the MCP+OAuth backend exists.
