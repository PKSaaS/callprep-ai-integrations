---
name: callprep
description: Research a B2B prospect with CallPrep and turn any inbound lead into a ready-to-send outreach sequence (3 emails + LinkedIn invite + LinkedIn follow-up). Use when the user asks to "prep for a call", "research this lead/prospect", "who is <email>", wants talking points or discovery questions, or asks to create follow-up emails / an outreach sequence / a journey for an inbound lead identified by a work email address.
---

# CallPrep — Lead Research & Inbound Sequences

CallPrep enriches a prospect from their email address: professional summary, recent LinkedIn activity, company profile, synergy points with the user's product, tailored discovery questions, and key decision makers. This skill uses that research for two jobs:

1. **Call prep brief** — before a sales call.
2. **Inbound lead sequence** — a 5-touch outreach plan (3 emails + LinkedIn connection invite + LinkedIn follow-up) written from the research.

## Requirements

The environment variable `CALLPREP_API_KEY` must be set (a key starting with `cp_live_`, generated free at https://callprep.app → API Keys — the free plan includes monthly research credits). If it is not set, ask the user to create a free account and set the key — never proceed with a made-up key, and never echo the key back.

Each research request consumes 1 CallPrep credit. Results are cached server-side, so re-running a recent email is fast and does not consume the full pipeline again.

## Step 1 — Run the research

Use the bundled script (Python 3, stdlib only — submits the job and polls until done, typically ~30–60 seconds):

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

The script prints the final JSON to stdout. On error it prints `{"error": ...}` and exits non-zero.

The response is already personalized to the user's product (the API key carries their product context): `synergy_points`, `problems`, `discovery_questions`, and `insights` connect the prospect's company to what the user sells.

## Job A — Call prep brief

Do not dump raw JSON. Format a scannable brief:

1. **Prospect** — name, title, company; 2–3 sentence summary.
2. **Openers** — `opening_talk` starters, plus anything notable from recent `posts`.
3. **Company snapshot** — description, industry, size, revenue, HQ, technologies, recent `news`.
4. **Why they'd care** — `synergy_points` and `problems`.
5. **Discovery questions** — from `discovery_questions`.
6. **Insights** — competitive positioning, market gaps, likely concerns.
7. **Decision makers** — only if present (plan-gated; omit if empty).

If the user asked a narrower question ("give me 3 openers"), answer just that from the data.

## Job B — Inbound lead sequence

When the user wants outreach/follow-up for an inbound lead, first make sure you know **what the lead did** (booked a demo, started a trial, filled the contact form, attended a webinar, etc.). If not stated, ask — Email 1 must reference it. Also ask what the user sells only if the research response lacks product context.

Then write a 5-touch sequence:

| # | Touch | Timing | Content rules |
|---|---|---|---|
| 1 | **Email 1** | ASAP after the inbound action | Reference their action + ONE concrete research fact (a synergy point, recent news, or a post they wrote). Soft CTA: offer a specific time or ask one easy question. |
| 2 | **LinkedIn invite note** | Day 1 | Max 280 characters. Human, no pitch, no link. Mention the inbound action or a shared context. |
| 3 | **Email 2** | Day 3 | NEW angle — a different synergy point, a relevant capability, or a customer example. Never "just following up". |
| 4 | **LinkedIn follow-up** | Day 5 (after they accept) | 1–2 sentences, conversational, references the emails without repeating them. |
| 5 | **Email 3** | Day 7 | Light close-the-loop. Give an easy out, add one final new reason to reply (news item, insight, or problem from research). |

### Writing rules (mandatory)

- Simple, high-school-level words. Short sentences.
- Never open with "quick question".
- No em dashes in any outreach copy.
- Under ~120 words per email; one CTA per message.
- Every touch must add something new — never rephrase the previous message.
- Every personalized claim must come from the research JSON or from what the user told you. Never invent facts about the prospect or their company.
- Match the prospect's seniority: more direct and concrete for executives.

### Output format

Present the sequence as a schedule the user can copy: for each touch show the day, the channel, the subject line (emails only), the full copy, and for the LinkedIn invite the character count. End with a one-line "why this angle" note per touch, citing which research fact it uses.

If the user asks for changes ("less pushy", "no LinkedIn", "shorter"), revise the sequence — do not re-run the research; reuse the JSON already in the conversation.

## Errors

- `401` — invalid/revoked key: tell the user to check their key in the dashboard.
- `402`/`403` or an out-of-credits message — the free-plan monthly credits are used up; they reset monthly or the user can upgrade at callprep.app.
- `failed` status or timeout — report it plainly; suggest retrying with `--name`/`--company` hints or checking the email address.
