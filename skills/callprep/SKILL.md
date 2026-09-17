---
name: callprep
description: Research a B2B prospect before a sales call or before replying to an inbound lead, using the CallPrep API. Use when the user asks to "prep for a call", "research this lead/prospect", "who is <email>", or wants conversation starters, discovery questions, company insights, or decision makers for a person identified by a work email address.
---

# CallPrep — Sales Call Research

CallPrep enriches a prospect from their email address: professional summary, recent LinkedIn activity, company profile, synergy points with the user's product, tailored discovery questions, and key decision makers.

## Requirements

The environment variable `CALLPREP_API_KEY` must be set (a key that starts with `cp_live_`, generated in the CallPrep dashboard at https://callprep.app → API Keys). If it is not set, ask the user to get a key from the dashboard and set it — never proceed with a made-up key, and never echo the key back.

Each research request consumes 1 CallPrep credit. Results are cached server-side, so re-running a recent email is fast and does not re-trigger the full pipeline.

## How to run research

Use the bundled script (Python 3, stdlib only — it submits the job and polls until done, typically ~30–60 seconds):

```bash
python3 scripts/research.py jane@acme.com
```

Optional accuracy hints:

```bash
python3 scripts/research.py jane@acme.com \
  --name "Jane Smith" \
  --company "Acme Corp" \
  --linkedin-url "https://www.linkedin.com/in/janesmith" \
  --company-linkedin-url "https://www.linkedin.com/company/acme"
```

The script prints the final JSON to stdout. On error it prints a JSON object with an `error` key and exits non-zero.

## How to present the result

Do not dump the raw JSON. Format a call-prep brief:

1. **Prospect** — name, title, company; 2–3 sentence summary.
2. **Openers** — the `opening_talk` conversation starters, and anything notable from recent `posts`.
3. **Company snapshot** — description, industry, size, revenue, HQ, technologies, recent `news`.
4. **Why they'd care** — `synergy_points` and `problems` (these are personalized to the user's product context configured with the API key).
5. **Discovery questions** — the `discovery_questions` list.
6. **Insights** — competitive positioning, market gaps, likely concerns from `insights`.
7. **Decision makers** — name, title, LinkedIn (only present on plans that include it; omit the section if empty).

Keep it scannable. If the user asked a narrower question (e.g. "give me 3 openers"), answer just that from the data.

## Errors

- `401` — invalid/revoked key: tell the user to check their key in the dashboard.
- `402`/`403` or an out-of-credits message — the account has no credits left this month.
- `failed` status or timeout — report it plainly; suggest retrying with `--name`/`--company` hints or checking the email address.

Never invent prospect or company facts that are not in the API response.
