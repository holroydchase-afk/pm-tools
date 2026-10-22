# Studio stack

_The default tech choices for every studio product, and when to pick something else. Projects link here from their instructions; change it with a PR. Last reviewed: 2026-10-22._

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
- A new language, host or paid service. If one seems needed, ask Chase with a one-line reason and the cost.

## Adding something not on this page
Say why in one line in the PR ("needs X, the default can't because Y"). If it's likely to repeat in another product, add a row here in the same PR.

Background: the Oct 22 stack review found the stacks fine and the gap was CI on pull requests and visible badges (plan in project memory, `stack-upgrade`).
