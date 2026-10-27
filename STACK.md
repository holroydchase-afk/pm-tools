# Studio stack

_The default tech choices for every studio product, and when to pick something else. Projects link here from their instructions; change it with a PR. Last reviewed: 2026-10-26._

Rule of thumb: start at the top of the ladder and climb only when the product needs it. Reuse what a sibling repo already does before adding anything new.

## The ladder (pick the lowest rung that works)
| Need | Default | Studio example | Use something else when |
|---|---|---|---|
| A tool only Chase uses, with saved data | claude.ai artifact with its database | Build Slate, Near-Term Roadmap, Role Radar (live) | More than one real user needs a login, or data must outlive the artifact: go to Supabase. |
| A public page or demo | Public repo + static site on GitHub Pages, deployed by Actions from `main` | Portfolio, pm-tools demos, Role Radar and Energy Scanner demos | It needs server code or secrets: use a Supabase edge function, never a server of our own. |
| Demo data | Sample seed in the repo, saved only in the visitor's browser (`fake-db.js`) | pm-tools and portfolio demos | Never: demos have no login, no backend, no real data. |
| A web app with real logic | Vite + TypeScript (strict), runs in the browser | Energy Scanner | It's one page with simple logic: plain HTML + JS modules with `// @ts-check` (Role Radar, pm-tools). |
| A developer tool | Node CLI in TypeScript, npm workspaces, tsup build | ccwatts | It's a one-off script: a plain Node `.mjs` file in `scripts/`. |
| A mobile app or multi-user product | Expo (React Native) + Supabase (Postgres with row-level security, edge functions) | Hearth | A responsive web page would do: use a static site or Vite instead. |
| Content pages | Generated HTML from a small script (`tools/build.py`) | Portfolio | Over ~20 pages or a blog: consider Astro. Not before. |

## Hosting rule
- Default: a **public** repo on **GitHub Pages**. It's free, the public code is portfolio proof, and it serves at chaseholroyd.com/<repo>/ with no DNS work.
- No GitHub Pro: its only gain here is Pages from private repos, and our repos are public on purpose.
- Cloudflare Pages only when a repo must stay private, or needs edge functions or per-PR preview deploys. Give the one-line reason in the PR. It would need its own subdomain (for example app.chaseholroyd.com), not a /<repo>/ path.

## Always (every repo)
- Tests with what the stack already has: Node test runner for plain JS, Vitest for TypeScript, Playwright for browser flows.
- CI on every pull request (`ci.yml`): install, typecheck, test, build, plus any privacy check. Deploy only from `main`, and only after the same checks pass. CI badge at the top of the README.
- `handoff-check` workflow and `HANDOFF.md`; studio agents synced from studio-agents (`scripts/sync.sh`).
- Dependabot for npm and GitHub Actions, weekly, minor and patch grouped.
- No secrets in the repo; the repo is public. Privacy-first products (ccwatts, Energy Scanner, Hearth) ship no analytics or telemetry.

## Don't add (until a real need shows up)
- A backend, login or database for a demo.
- Framework ports (React, Next, full TypeScript rewrites) of working plain-JS apps.
- Monorepo or team tooling: Turborepo, Nx, Docker, Storybook, changesets, CodeQL, 100% coverage targets.
- Sentry, analytics or tracking.
- GraphQL (Chase, 2026-10-26). Supabase already gives every app a typed REST and RPC API from Postgres, and RLS does the access control. Revisit only if one client must stitch several backends together.
- A new language, host or paid service. If one seems needed, ask Chase with a one-line reason and the cost.

## Reusable building blocks
_Added 2026-10-23. Same rule as the messenger decision (STU-DEC-1, pm-tools PR #22): extract a piece only when a second product needs it, keep one home for it, and schedule work in a product repo through an INTAKE block that the owning project runs. Product Studio never edits a product repo itself._

Pick the lightest form that works, in this order:
1. **Stack doc row** (this file): a pattern to follow, no shared code.
2. **studio-agents skill or agent**: a checklist or review that runs in any project.
3. **Copied file + sync script**: one canonical copy, pulled into each repo the way `sync.sh` copies agents. No versions, no publishing.
4. **Shared package in its own repo**: only for real code that needs versions and tests of its own (the messenger, once Crew Clock uses it).

| Block | Used by today | Next user | Form | Home | When |
|---|---|---|---|---|---|
| Studio agents, session rules, handoff-check | All repos but Hearth, Charlie, Crew Clock | Charlie, Crew Clock | Copied files + sync (done) | studio-agents `sync.sh`, `install-rules.sh` | Done; `/onboard` adds new repos |
| CI, Pages deploy gated on CI, dependabot, README badge | pm-tools, portfolio, Role Radar, ccwatts, Energy Scanner, Crew Clock (each hand-written) | Charlie, Crew Clock (gate fix) | Copied files + sync: `templates/repo/` with one `ci.yml` per stack (plain JS, TypeScript, Python), a `pages.yml` that waits for CI, `dependabot.yml` | studio-agents, applied by `/onboard` | **Now** (5+ users already) |
| Privacy check (`check-private.mjs`, pre-commit hook) | Role Radar, pm-tools | Crew Clock (artifact links in a public HANDOFF), Charlie (keys, SEC email) | Copied file + sync, with each repo's extra patterns in a small config file | studio-agents `scripts/` | **Now** |
| Demo kit (`fake-db.js`, seed file, demo bar with "Sample data" and a back link) | pm-tools, portfolio | Crew Clock demo, Charlie static demo | Copied files + sync | pm-tools `demo/` is canonical; the portfolio copy retires with its last old demo | When Crew Clock or Charlie builds its public demo |
| Supabase starter (project setup, migrations folder, auth, RLS policy patterns and RLS tests, edge-function relay) | Hearth | Crew Clock (needs Supabase before its crew beta) | Template folder (migrations, auth, RLS patterns and tests, edge-function skeleton) plus an RLS checklist in the privacy-security agent | studio-agents `templates/supabase/`; Hearth adds its proven patterns after the beta | **Now** (Chase, Oct 24: Crew Clock connects Supabase next) |
| Encrypted messenger | Hearth | Crew Clock | Shared package (STU-DEC-1) | Hearth repo, then its own repo | After Nov 22 beta |
| Accounts and names (`ACCOUNTS.md`: service, login, where the name is, rename cost; "Decide the name before" list) | Hearth | Crew Clock, Charlie (both pre-name, pre-store) | Template | pm-tools `templates/ACCOUNTS.md`, listed in `docs/ONBOARDING.md` | Done (Oct 27, Hearth intake) |
| Architecture docs (reader, seven writing rules, "Last checked" footer, docs-as-we-go CLAUDE.md rule) | Hearth | Crew Clock (crew location data), Charlie | Template folder: README + system overview, data flow, threat model | pm-tools `templates/architecture/` | Done (Oct 27, Hearth intake) |
| Agent roster check (`check-agents.sh`) and log check (`check-logs.mjs`, roots and banned words in `studio-checks.json`) | Hearth | Every repo with `.claude/agents/`; every JS/TS repo | Copied files, installed by `install-rules.sh` | studio-agents `templates/scripts/` | Done (Oct 27, Hearth intake); products pick it up on `/onboard refresh` |
| PM docs (HANDOFF, PLAN, decision log, gate review) | Every repo | New projects | Templates (done) | pm-tools `templates/` | Done |
| Story log, shifts, digest | Every project | New projects | Skills and routines (done) | studio-agents skills, pm-tools `routines/` | Done |

**Supabase rules:**
- Schema changes only as numbered files in `supabase/migrations/`, made with the Supabase CLI and committed. Never edit the hosted database by hand.
- Row-level security on every table from its first migration, with a policy per role. Each policy gets a test that a non-member is refused.
- The browser or app holds only the anon key. The service-role key lives only in edge-function secrets, never in the repo or the client.
- Public demos never point at the real project: demo mode uses the demo kit, and production uses its own build or URL (Crew Clock risk, Oct 23 intake).
- The privacy-security agent reviews every migration that adds a table or policy.

Not extracting yet (one user each): Hearth's Expo Go check, photo pipeline, crypto kit, upload queue and problem log, Expo app shell and push (Hearth only; Crew Clock is a PWA), Python server layout (Charlie only), Node CLI layout (ccwatts only), the Hearth Test Log, `tools/build.py`. Revisit when a second product needs one.

**How a block lands in product repos:** Product Studio builds the block in studio-agents or pm-tools and adds it to `/onboard refresh`. Each product project picks it up in its own small PR when Chase pastes the refresh (or the INTAKE) there. Extractions out of a product repo (Supabase starter, messenger) are done by that product's project from an INTAKE in `docs/intakes/`.

## Adding something not on this page
Say why in one line in the PR ("needs X, the default can't because Y"). If it's likely to repeat in another product, add a row here in the same PR.

Background: the Oct 22 stack review found the stacks fine and the gap was CI on pull requests and visible badges (plan in project memory, `stack-upgrade`).
