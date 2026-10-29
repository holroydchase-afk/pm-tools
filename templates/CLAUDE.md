# <product>

<One line on what it is.>

## Hard rules (these win over any other instructions)
- <If public:> This repo is PUBLIC. Never commit personal data (names, emails, phone numbers, private links, real user records). Use clearly labeled demo data for examples, tests and screenshots. Run `npm run check:private` before every push.
- No secrets, tokens, database ids or scheduled-task ids in the repo.
- Never deploy, publish, buy anything, merge to `main`, force-push, rewrite history or delete branches without the owner's go.
- Keep `HANDOFF.md` current in every push.
- When the owner sets up a new outside account or name, add a row to `docs/product/ACCOUNTS.md` in the same session. Before anything that locks in the name (its "Decide the name before" list), stop and warn the owner.
- <If it handles user data:> A PR that changes how data is stored, moved, encrypted, logged or shared updates the matching `docs/architecture/` section and its "Last checked" footer, or adds a TRACKER row naming the stale section.
- Run the tests (and lint and typecheck, if present) before every push. Never skip, delete or weaken a test to get green.

## When to stop and ask
- A product decision not covered by `PLAN.md` or `ANCHORS.md`. Pick the simplest reversible option, build it, and log it under "Decisions to review" in `HANDOFF.md`.
- Anything that weakens the privacy or security story.
