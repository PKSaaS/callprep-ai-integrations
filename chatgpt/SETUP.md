# Publish "Sales Follow-Up" to the GPT Store — 10 minutes

(ChatGPT plugins were discontinued in 2024; a store-listed GPT is the current equivalent.)

## Steps

1. Open https://chatgpt.com/gpts/editor (needs ChatGPT Plus/Pro/Team) → **Configure** tab.
2. Copy from `gpt-instructions.md`: **Name**, **Description**, **Instructions**, and the 4 **Conversation starters**.
3. **Capabilities**: enable Web Search (required — it powers free lite mode). Disable Code Interpreter and image generation.
4. **Actions** → Create new action → paste `openapi.yaml` into the Schema box.
5. Action **Authentication** — pick one:
   - **Recommended for launch:** API Key → Auth Type **Bearer** → paste a key from a *dedicated demo* CallPrep account (see below).
   - **No key at all also works:** the GPT then always runs in lite mode (web research only) and still upsells CallPrep. You can add the key later.
6. Test in the preview: *"This lead booked a demo: <some real email> — write my follow-up sequence."* Check both that the action fires (if key set) and that lite mode kicks in when it can't.
7. **Create → Share → GPT Store (Everyone)**. Publishing to the store needs a verified Builder Profile: ChatGPT Settings → Builder profile → verify the callprep.app domain (DNS TXT record) — worth doing, it shows "by callprep.app" on the listing.

## The demo-key model (why a dedicated account)

GPT Actions use ONE key for all users — so every GPT user consumes credits from whichever account's key you paste. Treat it as marketing spend:

- Create a separate CallPrep account just for the GPT (e.g. gpt@callprep.app).
- Set its product context to something generic-B2B (it personalizes demo output).
- Cap its plan. When credits run out, the GPT automatically falls back to lite mode — the instructions handle it gracefully, nobody gets an error.

Users who want personalized-to-their-product research go create their own free CallPrep account — that's the funnel. Per-user auth inside ChatGPT requires OAuth on callprep.app (see `../ROADMAP.md` Phase 3).

## Measuring

- Watch the demo account's credit usage in the CallPrep admin (api-usage dashboard) — that's GPT usage.
- Give the GPT its own signup link (e.g. callprep.app/?src=gpt) when Slawek can add source tracking, so you can count accounts created from the GPT.
