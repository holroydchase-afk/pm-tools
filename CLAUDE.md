# PM tools

The product management tools Chase runs his studio with: the source of each app, generic PM templates and routines, and a sample-data demo build served at chaseholroyd.com/pm-tools/.

## Hard rules (these win over any other instructions)
- **This repo is PUBLIC.** Never commit real data from the live apps (Build Slate projects, roadmap cards, notes), personal data, emails, phone numbers, or private links. That includes claude.ai artifact links and database or trigger ids; those live in project memory, not here. `npm run check:private` enforces the patterns; run it before every push (`npm run hooks` installs it as a pre-commit hook).
- **The live apps hold Chase's real data. Keep them working.** `apps/*.html` are copies of the live artifact pages. Change an app here first, test the demo, then republish the same page to the live artifact without touching its database or capabilities. Never write to a live app's database from this repo.
- Demo seeds (`demo/<app>/seed.js`) are sample data: a scrubbed snapshot with private links and notes removed, or made up. Never paste live data into them.
- Never force-push, rewrite history or delete branches. Never deploy by hand; Pages deploys from `main` only, so a PR that changes `apps/`, `demo/` or the demo build waits for Chase's go. Other PRs (docs, templates, routines, tests) merge on green, oldest first (Chase, Oct 31).
- Keep `HANDOFF.md` current in every push.
- Run `npm test` and `npm run check:private` before every push.

## Layout
- `apps/`: the real app pages, exactly as published.
- `demo/`: seeds and `fake-db.js`, the stand-in for the artifact database.
- `scripts/build-demo.ts`: builds `_site/` (what Pages serves).
- `templates/`: generic PM docs to copy into a product repo.
- `routines/`: night shift, the shared-doc inbox, and pointers to the privacy check.

## Studio agents (use them by default; don't wait to be asked)
The main session is Chase's **chief of staff**: it doesn't do specialist work itself. It sends each piece of work to the agent below with the Agent tool, one lane at a time, and reports back briefly. At the start of every session or scheduled run it reads this table and `ls .claude/agents/`. The team comes from holroydchase-afk/studio-agents (re-sync with its `scripts/sync.sh`).

| Moment | Agent |
|---|---|
| Start of a session or run; planning a milestone; before any new feature; triaging findings | `staff-pm` |
| Before building a fix or feature (failing test first); before any PR is marked ready (all suites 3x) | `qa-tdd` |
| Building, once the failing test exists | `engineer` |
| Any screen, word or CLI output a user sees; before anything goes public (showcase review mode) | `ux-reviewer` |
| Personal data, sign-in, secrets, telemetry, vendors; before a public demo, deploy or repo going public | `privacy-security` |
| A new dependency, vendor, paid service, schema change or CI/deploy workflow; picking a new project's stack | `architect` |
| README, landing or portfolio copy; a name or tagline; after a milestone, the "why I built it" story | `positioning` |
| Studio only: the morning digest, a cross-project coordination pass, keeping HANDOFF.md files honest | `orchestrator` |
| Studio only: a portfolio, tooling, renaming or new-project ask during an application window or after the evening cutoff | `focus-coach` |

**One task, in order:** staff-pm scopes it, qa-tdd writes the failing test (red), engineer builds, qa-tdd runs all suites 3x (green), then ux-reviewer and privacy-security if users or the public will see it, positioning for any copy. Review findings get IDs (`<CODE>-R<n>`, P0 to P2) and each fix gets its own failing test first.

**Relay qa-tdd's verdict as-is.** When qa-tdd hands back, paste its final ```qa block verbatim into your reply and the PR body, with every QA-R ID; never summarize a flaky or red verdict as green.

**The `Agents:` line (CI enforces it).** Every PR body has a line starting `Agents:` naming who ran and the verdict, for example `Agents: staff-pm scoped M1.2; qa-tdd red then green, 3x; ux-reviewer no P0/P1`. A PR that changes anything other than docs must name `qa-tdd` on that line, or say `qa-tdd skipped: <reason>`. `.github/workflows/agents-check.yml` fails the PR otherwise, and runs `scripts/check-agents.sh` so this table and `.claude/agents/` never drift. Bot PRs and titles with `[skip agents]` are exempt.
