# Studio board

_The one living page for "where is everything, and what's next". Chase never has to find an old plan thread: ask for a plan and the thread checks here first, then picks up the row instead of starting over. Every thread that finishes work updates its row in the same PR as its HANDOFF.md. Cross-project done and waiting-on-Chase items stay in [STUDIO-STATUS.md](STUDIO-STATUS.md); this page is the product-by-product view and the ideas list._

_Last audited: 2026-11-19, from each repo's HANDOFF.md, README, open PRs and review docs. "Verified" means read in the repo; nothing was run for this audit. Stage words only, no product dates (Chase, Nov 19)._

## How to use it
- **Chase:** ask "what's the plan for X" or "where are we on X". The answer comes from this page.
- **Threads:** before starting a plan, search this page. Found a row or idea: continue it and say so. Finished something: update the row (Exists, Needs work, Last reviewed) and the idea's status.
- **Statuses:** `idea` (a sentence exists) → `shaping` (a plan or brief exists, not agreed) → `ready` (agreed, waiting for a slot or Chase's go) → `building` (a branch or PR exists). Done items leave the list; the HANDOFF.md of the owning repo keeps the history.
- **Weekly:** the digest lists what moved, what is `ready`, and what needs a call (not built yet, see Ideas).

## Products

| Product (repo) | Stage | Exists (verified in repo) | Needs work | Should exist (recommended) | Last reviewed |
|---|---|---|---|---|---|
| **Hearth** (`hearth`) | building | Expo app with Supabase backend (RLS, notifications, signed media), upload queue, shared MLS messenger package, public clickable demo, 36+ product docs and a decision log. Redesign round 2 live; Paper theme, Easy view and native iPhone tabs in open PRs. | Nov 18 three-seat review: README and case study had to match the live demo; planning gates written by agents read as Chase's promises; CI lacks lint/coverage/audit gates; HANDOFF.md is 130 KB; threat-model gaps (scheduled purge, key rotation) have no plan. Self-host guide (#89) is a stale draft. | Audience-leak eval with a published zero-leak matrix (R51); CI that obeys its own rules (R52); operations: purge, key rotation, error digest (R53); one design doc; first three relatives' real feedback; scope ledger. | 2026-11-18 (portfolio review) |
| **ccwatts** (`ccwatts`) | beta | CLI that estimates Claude Code electricity as a sourced range; 0.2.0 on npm with provenance; Pace and nudge; MCP server; plugin; browser playground on sample data; methodology v0.1.1 and params with sources. | PR #98 (eval scorecard, method v0.1.2, Fable/Mythos priced at Opus tier) waits on Chase's go; GitHub Release v0.2.0 not posted; portfolio intake not sent; repo settings (secret scanning, push protection, `npm-publish` environment) are off; QA-R6 open (no test pins the chat-query reference). | Leverage (your hours vs agent hours, M4.7); `ccwatts bench` to measure token ratios; sanity check from Hausfather or EcoLogits maintainers; held majors (TypeScript 7, tsup 9, zod 4). | 2026-11-16 (HANDOFF); #98 read 2026-11-19 |
| **Role Radar** (`role-radar`) | live | Weekday scanner, 0-100 scoring from an editable `criteria.yaml`, tracker page backed by a database, public demo, MCP server, install plugin scaffold, velocity and pay features. Scans run on request. | Live page not republished since Dream bucket and Velocity merged (needs Chase's "republish"); one manual MCP run on the laptop; demo seed reshape (RR-DEMO-1, UX-R8); VoiceOver check on a real iPhone (UX-R9); public `criteria.yaml` exposes private criteria (intake to move it private); HANDOFF.md is 80 KB. | Plugin alpha test with one friend; Dream bucket live; restart the weekday scan if wanted. | 2026-11-18 (HANDOFF) |
| **Energy Scanner** (`energy-scanner`) | live | Browser-only aura render from a photo (MediaPipe in the page), sample mode, save and share, public demo, case study. No open PRs. In Polish Freeze (harden and UI polish only). | Four `console.*` calls log whole error objects; `check-logs.mjs` not wired into `npm test`; 60-second phone check and iPhone rescan of three real photos pending; its CLAUDE.md still says "never deploy" though Pages deploys on push. | Product-page refresh when the freeze lifts; decide whether it stays on the featured list or moves to "Built". | 2026-11-10 (HANDOFF) |
| **Charlie** (`charlie`) | live | Profile from resume, Munger-style scoring of about 94 tickers, daily paper-trade ideas, screener, chat, paper portfolio; static public demo in the browser (Pyodide); paper-only guardrails tested. | README is stale (says demo "coming soon", uses a banned claim); engine call (Pyodide vs JS port) and next feature (earnings check vs Alpaca paper) open; SEC live fundamentals unverified from the cloud; Hunch pipeline PR #48 and showcase P3 PR #39 open; five Dependabot PRs (#42 to #46) unmerged; run-log CI check not wired. | Earnings check (recommended); one laptop run on live Cboe and SEC data. | 2026-11-17 (HANDOFF) |
| **Crew Clock** (`crew-clock`) | building | Offline-first GPS clock-in PWA, signed punches, boss map, encrypted chat, retention and delete rules, public demo on sample data, privacy contract. | Local clone and `main` last moved Oct 30, so check the repo before trusting this row. PR #41 (geofence fairness eval) open: the shipped rule is loose toward people just outside the fence and the keep-or-tighten call is Chase's; Supabase project setup (docs/SETUP.md) blocks the crew beta; boss "Erase their data" button and B2 purge function unbuilt; known P2 on stale session refresh. | Beta with one team of five; geofence decision from PR #41; Dependabot-free CI. | 2026-11-19 (PR #41 read; HANDOFF on main is older) |
| **Portfolio site** (`holroydchase-afk.github.io`, `portfolio`) | live | One-page site, v67 home with self-hosted font and share card live; product pages and demos under `/<repo>/`; Studio page hidden. | Greeting-animation fix PR awaits merge; hello@ test email unconfirmed; About and product pages not yet in the new home look; demos still load Google Fonts; Dependabot PR #64 (CodeQL 4) open. | v69 copy pass (preview ready, waiting on go-live; share card must be regenerated with it); large portrait once a 1600px photo exists; reader chooser after launch (do not build yet). | 2026-11-18 (HANDOFF) |
| **pm-tools** (`pm-tools`) | live | Build Slate and Near-Term Roadmap app sources, sample-data demo, templates, routines, reviewer personas, STUDIO-STATUS.md, this board. Studio Console hidden. | STUDIO-STATUS.md was last checked Oct 29 and is stale; Dependabot PRs #36, #41, #60, #62 unmerged; Agent Roster empty until studio-agents #27 merges. | Weekly digest that reads this board; per-product "last reviewed" kept current by each thread. | 2026-11-19 |

## Ideas and plans

Source docs live in the project folder `pmo/` (project files) or in the repo named. Status is the last known; a thread that moves one updates it here.

| Item | Status | Owner | Source |
|---|---|---|---|
| Hearth review backlog, top five (front door true, no agent gates in public docs, audience-leak eval, CI gates, operations) | ready (1, 2 done or in docs PR; 3 to 5 need Chase's merge) | Hearth | hearth `docs/reviews/2026-11-18-portfolio-review.md`, TRACKER R49 to R53 |
| ccwatts eval scorecard and method v0.1.2 | building (PR #98, waits for Chase's go) | ccwatts | ccwatts PR #98 |
| ccwatts Leverage (M4.7) | ready, waits for Chase's go | ccwatts | ccwatts `IDEAS.md` |
| ccwatts bench (measure token-type ratios ourselves) | idea | ccwatts | ccwatts `IDEAS.md` |
| Pace (work-rhythm signals) | building, shipped sample-only; ANCHORS D15 proposal open | ccwatts | `pmo/ideas/2026-10-30-burnout-tracker.md`, ccwatts HANDOFF |
| Crew Clock geofence eval and keep-or-tighten call | building (PR #41) | Crew Clock | crew-clock PR #41, `docs/evals/geofence.md` |
| Role Radar plugin alpha (install in a second account, fix what breaks) | ready, waits for Chase's go | Role Radar | role-radar HANDOFF (RR-PLUGIN) |
| Role Radar private criteria (move `criteria.yaml` private) | shaping | Role Radar | `pmo/` intakes, role-radar HANDOFF |
| Charlie earnings check or Alpaca paper | shaping, waits for Chase's pick | Charlie | charlie HANDOFF, PLAN.md |
| Charlie Hunch pipeline v1 | building (PR #48) | Charlie | charlie PR #48 |
| Portfolio v69 copy pass | ready, preview made, waits for go-live | Portfolio | `pmo/portfolio/` and the copy thread |
| Portfolio hero leads with the work (no "staff product manager" opener) | ready | Portfolio | portfolio HANDOFF |
| Large portrait photo | ready, waits for Chase's 1600px photo | Portfolio | `portfolio/site-v1/v68-large-portrait/` |
| Move Charlie, Role Radar and Energy Scanner to a "Built" section | idea, waits for Chase's call | Portfolio | `pmo/launch/2026-11-04-launch-plan.md` |
| Reader chooser by category on the site | idea, post-launch, do not build | Portfolio | project memory (Nov 14) |
| Site AI: role-aware view and grounded "Ask about Chase" chat | shaping (plan only) | Portfolio | `pmo/site-ai/2026-11-11-harness-and-hallucination-plan.md` |
| Studio Console (real-data dashboard) | idea, hidden until it is stronger; flag `CONSOLE_PUBLIC` | pm-tools | pm-tools HANDOFF |
| Studio OS doneness scorecard and priorities | shaping | pm-tools | `pmo/atlas/2026-11-06-os-scorecard-and-priorities.md` |
| Setup pack for new projects | idea, parked | Studio | `docs/ONBOARDING.md` |
| Run-log hook for cloud sessions (studio-agents #27) | shaping | studio-agents | studio-agents PR #27 |
| Intake issues: demo data, MCP, TypeScript, private-data check | see source | each product | `pmo/intakes/` |
| Burnout and focus guard (evening cutoff) | idea | Studio | `pmo/ideas/2026-10-30-burnout-tracker.md` |
| GitHub settings (private vulnerability reporting, secret scanning, push protection) | ready, Chase's click path in STUDIO-STATUS | Studio | [STUDIO-STATUS.md](STUDIO-STATUS.md) |

## What needs Chase's call now

1. **Hearth:** merge order for the open redesign PRs, then who builds the audience-leak eval (R51).
2. **ccwatts:** go on PR #98 (changes the playground footer) and on Leverage (M4.7).
3. **Crew Clock:** keep or tighten the geofence after PR #41; Supabase setup to start the beta.
4. **Charlie:** earnings check or Alpaca paper; Pyodide or JS port.
5. **Role Radar:** say "republish" for the live page.
6. **Portfolio:** go-live for the v69 copy; a 1600px photo.
7. **Studio:** one sweep of Dependabot PRs across repos (17 open) and the GitHub settings clicks.
