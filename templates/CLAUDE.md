# <product>

<One line on what it is.>

## Hard rules (these win over any other instructions)
- <If public:> This repo is PUBLIC. Never commit personal data (names, emails, phone numbers, private links, real user records). Use clearly labeled demo data for examples, tests and screenshots. Run `npm run check:private` before every push.
- No secrets, tokens, database ids or scheduled-task ids in the repo.
- Never deploy, publish, buy anything, merge to `main`, force-push, rewrite history or delete branches without the owner's go.
- Keep `HANDOFF.md` current in every push.
- Run the tests (and lint and typecheck, if present) before every push. Never skip, delete or weaken a test to get green.

## When to stop and ask
- A product decision not covered by `PLAN.md` or `ANCHORS.md`. Pick the simplest reversible option, build it, and log it under "Decisions to review" in `HANDOFF.md`.
- Anything that weakens the privacy or security story.
