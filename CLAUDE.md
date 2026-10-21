# PM tools

The product management tools Chase runs his studio with: the source of each app, generic PM templates and routines, and a sample-data demo build served at chaseholroyd.com/pm-tools/.

## Hard rules (these win over any other instructions)
- **This repo is PUBLIC.** Never commit real data from the live apps (Build Slate projects, roadmap cards, notes), personal data, emails, phone numbers, or private links. That includes claude.ai artifact links and database or trigger ids; those live in project memory, not here. `npm run check:private` enforces the patterns; run it before every push (`npm run hooks` installs it as a pre-commit hook).
- **The live apps hold Chase's real data. Keep them working.** `apps/*.html` are copies of the live artifact pages. Change an app here first, test the demo, then republish the same page to the live artifact without touching its database or capabilities. Never write to a live app's database from this repo.
- Demo seeds (`demo/<app>/seed.js`) are sample data: a scrubbed snapshot with private links and notes removed, or made up. Never paste live data into them.
- Never merge to `main`, force-push, rewrite history or delete branches. Never deploy by hand; Pages deploys from `main` only.
- Keep `HANDOFF.md` current in every push.
- Run `npm test` and `npm run check:private` before every push.

## Layout
- `apps/`: the real app pages, exactly as published.
- `demo/`: seeds and `fake-db.js`, the stand-in for the artifact database.
- `scripts/build-demo.mjs`: builds `_site/` (what Pages serves).
- `templates/`: generic PM docs to copy into a product repo.
- `routines/`: night shift, the shared-doc inbox, and pointers to the privacy check.
