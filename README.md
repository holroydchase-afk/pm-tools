# PM tools

The tools I run a one-person product studio with. I have about an hour a night, a few products in motion at once, and a team of AI agents that start every session cold. These tools are how nothing gets lost.

**Try them:** [chaseholroyd.com/pm-tools](https://chaseholroyd.com/pm-tools/) runs the real apps on sample data. Anything you change stays in your browser.

## Apps
| App | What it does |
|---|---|
| [Build Slate](https://chaseholroyd.com/pm-tools/build-slate/) | One board for every product: stage (idea, spec, building, beta, launched, paused), the very next step, and a milestone date. It caps the slate at five live projects so I go deep, not wide. |
| [Near-Term Roadmap](https://chaseholroyd.com/pm-tools/roadmap/) | Now, Next, Later and Done lanes with a board per product, owners, session-size estimates and a blocked flag. Any AI session can read and update it, so the roadmap stays current without me retyping it. |

Both are single-file pages that run as Claude artifacts with a small shared database. `apps/` holds the exact pages; `demo/fake-db.js` stands in for the database so the demos run anywhere with no login.

## Templates
[`templates/`](templates/) holds the docs every product repo gets: `HANDOFF.md` (read first, updated in every commit), `PLAN.md`, `CLAUDE.md` hard rules, a tracker, a decision log, gate reviews, a UAT log, an ideas inbox and post mortems.

The one I'd point a PM at first is the **persona check**, test-driven product management: before a product decision is final, every persona gets Green or Red with a one-line reason, and CI fails if a decision skips one or leaves a Red unresolved (`scripts/check-persona-checks.sh`). Adding a persona breaks every old decision on purpose, so each gets re-checked.

## Routines
[`routines/`](routines/): the **night shift** (paste before bed; an overnight AI run works through the next milestones in stacked PRs), the **shared-doc inbox** (a merge pass for docs several AI threads edit at once), and the **privacy check** that keeps personal data out of public repos.

## Run it
```
npm test              # build tests, privacy scan of apps and seeds, persona-check tests
npm run build         # writes _site/
npx serve _site       # or any static server
```
No dependencies. Node 20+.

## License
MIT.
