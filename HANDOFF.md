# Handoff: PM tools

_Read this before starting work on this repo. Update it in the same commit whenever you make progress._

Updated: 2026-10-29 (STACK.md: Role Radar on TypeScript; open-PR cleanup; STUDIO-STATUS refreshed; shared messenger library STU-DEC-1, AGPL-3.0, merged; security audit and kit merged; TypeScript: scripts and tests are .ts; studio refresh: agents by default in this repo; ONBOARDING: agents forced by CI, one refresh paste for every product; studio architect agent: ONBOARDING row, STACK.md gate; STACK.md: API row with GraphQL as an option; STUDIO-STATUS: Role Radar and Hearth demos, ccwatts intake, Charlie and Crew Clock; night shift: demo bar rename, 44px back link)

## Security audit (Oct 24)
- All 9 studio repos audited (report: `docs/security/2026-10-24-audit.md`): no secrets in any history, no personal data on public repos. Security kit from studio-agents installed here (`security.yml`, `codeql.yml`, `dependabot.yml`, `privacy-scan.py`, `SECURITY.md`); `.env` added to `.gitignore`. INTAKE for the product projects: `docs/intakes/security-kit.md`. STUDIO-STATUS lists Chase's settings toggles.
- Kit PRs merged Oct 29 (this repo #24, studio-agents #12, portfolio #24). Until Chase turns on Dependency graph, the `dependencies` job is red on every PR here (it isn't a required check). qa-tdd follow-ups: SECURITY.md needs private vulnerability reporting on (QA-R2); `actions/checkout@v4` and `dependency-review-action@v4` warn about Node 20 (QA-R3, fix in studio-agents `templates/security/`).
- Next: Chase does the toggles; each product project pastes the intake.

## Open-PR cleanup (Oct 29)
- Merged #24 (security audit and kit) and #28 (STU-DEC-1, AGPL-3.0). Closed with notes, branches kept: #27 STEERING.md (steering loop on hold; reopen as is when Chase revives it), #5 resume lint (a new routine, so it waits for the Polish Freeze to lift; port its test to `.ts` then), #25 (stale STUDIO-STATUS snapshot, folded into the refresh). qa-tdd ran typecheck, unit, e2e and check:private 3x on each merged head: green.

## Current state
- TypeScript (Oct 29, Chase: TypeScript is the studio standard for onboarding and AI coding): `scripts/build-demo.ts`, `scripts/check-private.ts` and every test are now `.ts`. Node 22 runs them directly (type stripping), so there is no build step. `npm run typecheck` (`tsc -p .`, strict, noEmit, erasable syntax only) is in CI before `npm test`. Dev deps only: typescript, @types/node (pinned to Node 22) and playwright 1.56.1 (was a CI-only `--no-save` install; now in the lockfile so the e2e test is typechecked too). Left as JS on purpose: `demo/*.js` and `demo/fake-db.js` (browser files served as they are), `apps/*.html` (exact copies of the live artifact pages), and `scripts/check-logs.mjs` (a studio-agents copy; convert it there). Actions minutes are out until about Nov 1, so typecheck, unit tests (24) and e2e (8) were run locally 3 times each: "CI skipped". Studio order for the rest: Role Radar (converted Oct 29, role-radar PR on `claude/project-thread-wz6fjj`; STACK.md ladder row updated), Crew Clock (intake in its project), then the portfolio.
- Studio refresh (Oct 28, PR "studio refresh: agents by default"): studio-agents `sync.sh` and `install-rules.sh` applied. `.claude/agents/` now has architect plus refreshed staff-pm, qa-tdd, engineer, ux-reviewer, privacy-security, positioning; orchestrator and focus-coach kept (studio-only, synced by name). CLAUDE.md has the "Studio agents" section (chief of staff rule, table with the two studio-only rows). New: `.claude/settings.json` (SessionStart prints this file), `handoff-check.yml`, `agents-check.yml` (PR body needs an `Agents:` line; code PRs name qa-tdd), `scripts/check-agents.sh` (now part of `npm test`, so CI runs it), `scripts/check-logs.mjs` and `studio-checks.json` (log roots `scripts`, `demo`; passes, not yet wired into CI). Next: Chase reviews and merges; then consider adding `node scripts/check-logs.mjs` to `npm test`.
- Agents by default, enforced (Oct 28): ONBOARDING section 4 and the refresh paste now point at studio-agents' `agents-check.yml` (PR body needs an `Agents:` line; code PRs must name qa-tdd) and Hearth's chief-of-staff rule. Next: Chase pastes the refresh into ccwatts, Role Radar, Energy Scanner, Charlie and Crew Clock once the studio-agents PR merges.
- PMT-M1 is done (Oct 21): the repo holds the source of **Build Slate** and the **Near-Term Roadmap** (`apps/`), sample-data demos of both (`demo/`), generic PM templates (`templates/`) and routines (`routines/`).
- Demos are live at **chaseholroyd.com/pm-tools/** (Actions deploy from `main`). The portfolio's "How I keep it all moving" page (formerly "How I work") links here, and its own copies were removed (portfolio PR #3), so this repo is the only source.
- `npm test`: 8 build and privacy tests, 10 persona-check tests. `npm run check:private` is clean.

## Recruiter-ready review (Oct 22)
ux-reviewer and qa-tdd reviewed the demos; the ranked list is in the portfolio repo, `docs/reviews/2026-10-22-recruiter-ready.md`.
- PMT-M2.2: demo seeds now match the portfolio pages. Build Slate: ccwatts Beta, Energy Scanner Launched (photo aura app), Stock Agent dropped so the demo sits at 5 of 5; Role Radar copy says nothing about resume tooling. Roadmap: ccwatts M1.1 to M1.7 in Done, plus a second board (Role Radar). `tests/seeds.test.ts` fails if a stage drifts from the portfolio or the slate passes its cap.
- PMT-M2.3: the /pm-tools/ landing has a "← Chase Holroyd" link at the top and named CTAs.
- The live Build Slate and roadmap themselves are still at their Oct 20 state (ccwatts "Spec", one board). The demo seeds were updated from GitHub, not from the live apps. Updating the live apps writes Chase's real data, so that waits on Chase.
- Overnight loop (Chase, Oct 22: iterate through P2s). Round 1: PMT-M2.4 demo bar goes back to How I work ("← How I work", `back`/`backLabel` in each seed); PMT-M2.5 roadmap demo hides the developer schema panel; QA-11 browser tests (`npm run test:e2e`, Playwright, CI job `e2e` gates deploy; passed 3 runs locally).
- Round 2 (deep ux-reviewer showcase pass, R1-UX findings): Energy Scanner card matches the portfolio (bedtime routine, palm or photo scan, "Web app"); ccwatts stage set to Building (no beta running yet; portfolio says "playground live"); family app notes match the portfolio numbers; roadmap no longer names a real outside person; product cards get "Open live demo ↗" links; demo-only AA colors, 44px move buttons and phone chips, "work sessions", "Chase's tasks", "Active projects · 5 of 5 max", stronger landing focus ring. Demo-only page changes live in `EDITS` in `scripts/build-demo.ts`.
- Round 3 (ux-reviewer re-check, R2-UX): demo CSS overrides now load after the app CSS (move-button gap and stage-tag size really apply); Role Radar's next step and card say the demo moves to its own repo (it already exists) and its link opens the demo; links read "Try <product> ↗" with a spacer so the grid lines up; Developer tool kind option; light-mode Later/Done lane colors pass AA; phone buttons 44px; landing says "five active projects" and "Later, Next, Now and Done".
- Round 4: moving a roadmap card shows a pinned "Moved … to Next · Undo" notice for 6 seconds (R1-UX-12, with an e2e test); meta text and owner chips at 13px (R1-UX-10). All review findings from rounds 1-3 are now fixed or listed under Decisions to review.
- Round 5 (final UX + QA check, R4 findings): Undo puts the card back in its old spot and says "Move undone" instead of a second notice (R4-1, e2e checks the position); roadmap card meta at 13px (R4-2). R4-3 (portfolio copy: "five active projects", lane order) belongs to the portfolio repo. Merged to main on Oct 22 with Chase's go-ahead (#9 to #13). Nothing at P0-P2 left in pm-tools. Next step: port the demo polish to the live apps if Chase wants it (see Decisions to review).
- Studio agents synced into `.claude/agents/` from studio-agents (includes the upgraded ux-reviewer with the visual pass and showcase review, studio-agents draft PR #6 or later); re-sync with its `scripts/sync.sh`.

## Night shift Oct 23 (PMT-M2.6)
- The portfolio renamed "How I work" to "How I keep it all moving" (WEB-M5.2), so both demo bars now read "← How I keep it all moving" (`backLabel` in each seed; `tests/seeds.test.ts` pins it).
- The demo bar's back link was 20px tall on phones; it is now a 44px tap target, with an e2e test per demo. Unit and e2e suites passed 3x each. Sweep at 390px and 1280px: no overflow, console errors or broken images. Chips at 28px on desktop are left as is (pointer input; 44px on phones already).
- Next: none at P2 or above. The live apps still differ from the demos (see Decisions to review).

## New-project onboarding kit (Oct 23)
- `docs/ONBOARDING.md`: how a new product project (next: Charlie, Crew Clock) joins the studio in one paste: portfolio and hosting, studio rules, repo setup, studio agents and when to use them by default, recruiter-ready bar, shifts and digest, Atlas Story, INTAKE format, the two pastes, and a refresh paste for existing projects. Linked from STUDIO-STATUS.
- Why: product repos had the agents copied in, but no CLAUDE.md said when to use them, so they ran only when a paste named them. Companion studio-agents PR #7 adds the when-to-use table, proactive agent descriptions and `templates/CLAUDE-agents.md`.
- Merged Oct 23 with Chase's go-ahead, together with `STACK.md` (#15) and studio-agents #7.
- `/onboard` skill (Chase, Oct 23): runs this kit in any project (studio-agents `plugins/studio/skills/onboard`); `/onboard refresh` for existing projects. ONBOARDING.md leads with it; the pastes stay as the fallback.

## Charlie and Crew Clock intake (Oct 23)
- Both repos (public: `charlie`, `crew-clock`) are in STUDIO-STATUS's ownership table, so the morning digest covers them. Planning codes CHL and CRW.
- Live Build Slate: the Stock Agent card became Charlie (stage Building); Crew Clock added (Building). The slate now holds 6 cards against its goal of 5. The demo seed is unchanged until either has a recruiter-ready demo.
- Onboarding gaps found: neither repo has CLAUDE.md, `.claude/agents/`, handoff-check, dependabot or a PLAN.md with planning IDs. Charlie also lacks CI, a LICENSE and Pages (it's a Python server). Crew Clock has CI and Pages, but Pages deploys on push without waiting for CI, and its HANDOFF.md links two claude.ai artifacts in a public repo. Tailored first-message pastes went to Chase in the intake thread.

## Shared messenger library (Oct 23, STU-DEC-1)
- Hearth's intake asked whether its encrypted messenger should be reusable or its own product. Decision, logged in `DECISIONS.md` (new studio decision log): a shared library, `packages/messenger` inside the Hearth repo, extracted after Hearth's Nov 22 beta. Not its own product for now.
- Hearth's project does the extraction; Product Studio only decides and schedules. Hearth started the extraction on Oct 26, ahead of the beta (Chase), so the go-ahead INTAKE in `docs/intakes/hearth-messenger-extraction.md` is reference only and needs no paste. A post-beta card is on the live roadmap (new Studio board).
- Second user (Chase, Oct 23): Crew Clock, then others. Crew Clock's integration is its own intake, after Hearth's extraction.
- License (Chase, Oct 26): AGPL-3.0. Chase owns the copyright, so his own products can use it under any terms and it can be loosened later. Recorded in STU-DEC-1, the Hearth intake and STUDIO-STATUS.

## Stack check (Oct 26)
- Chase asked whether TypeScript, React Native, GraphQL and YAML should be the stack. Repo check: TypeScript in ccwatts and Energy Scanner, `@ts-check` JS in Role Radar and pm-tools, Expo/React Native in Hearth, YAML for workflows and Role Radar's `criteria.yaml`, no GraphQL. `STACK.md` now has an API row: Supabase REST/RPC by default, Supabase's built-in GraphQL (`pg_graphql`) when screens need nested reads across many tables (Chase, Oct 26: keep GraphQL as an option).

## Reusable building blocks (Oct 23)
- `STACK.md` gained a "Reusable building blocks" section: the rule (extract when a second product needs it, one home, product repos change only through INTAKE), the form ladder (stack row, skill, copied file + sync, package), and a table of eight blocks with home and timing. Supabase rules added to STACK.md; Hearth's after-beta intake is `docs/intakes/hearth-supabase-starter.md`.
- Next (Product Studio, no Chase step): build the repo kit (`templates/repo/` with ci.yml per stack, CI-gated pages.yml, dependabot) and the shared privacy check in studio-agents, add an RLS checklist to the privacy-security agent, then add all three to `/onboard refresh`.

## Hearth reusable blocks (Oct 27, Hearth intake)
- `templates/ACCOUNTS.md` (accounts, logins, where the name is, rename cost, "Decide the name before" list; no secrets or ids) and `templates/architecture/` (README with the reader and seven writing rules, plus system overview, data flow and threat model starters). `templates/CLAUDE.md` gained the matching two rules; `docs/ONBOARDING.md` lists both in the day-one file table, plus the shared checks `install-rules.sh` now installs.
- `STACK.md`: three rows (accounts, architecture docs, roster and log checks), and Hearth's one-user pieces named under "Not extracting yet".
- Companion studio-agents PR: `check-agents.sh`, `check-logs.mjs` and `studio-checks.json`, installed by `install-rules.sh`.
- Next: merge both PRs; products pick them up on the next `/onboard refresh`. Hearth keeps its own copies until it swaps to the shared ones (its call).

## Where each tool came from
| Here | Came from | Snapshot |
|---|---|---|
| `apps/build-slate.html` | Live Build Slate artifact (db collection `projects`) | 1792119995-cea2 |
| `apps/roadmap.html` | Live Near-Term Roadmap artifact (db `boards`, `cards`) | 1792243476-857c |
| `demo/*/seed.js`, `demo/fake-db.js` | The portfolio repo's demo copies (already scrubbed); stages refreshed from GitHub | Oct 22 |
| `templates/` | Hearth repo `docs/product/PM-TOOLS.md` and the docs it lists, made generic (no family names or Hearth specifics) | Oct 21 |
| `scripts/check-persona-checks.sh` | Hearth's TDPM check, with "Chase override" generalized to "<who> override" | Oct 21 |
| `templates/ACCOUNTS.md`, `templates/architecture/` | Hearth `docs/product/ACCOUNTS.md` and `docs/architecture/README.md`, made generic (no ids, emails or Hearth names) | Oct 27 |
| `routines/night-shift.md` | The night-shift paste (Role Radar project), with the owner's goal made a placeholder | Oct 21 |
| `routines/shared-doc-inbox/` | The career-docs pending inbox and `pending.py`, made generic | Oct 21 |
| `scripts/check-private.ts` (was `.mjs`), `.githooks/` | Role Radar repo | Oct 21 |

The live artifact links are in project memory (`pm-tools`), not here: this repo is public.

## Keeping the live apps and the repo in sync
The live apps hold Chase's real data in their databases; the page source holds none.
1. **App changed live:** save its page over `apps/<app>.html` (Claude: Artifact tool, read with `path: "index.html"`), run `npm test`, record the new snapshot above.
2. **Change made here:** test the demo, then republish the same page to the live artifact (same URL, no capability changes, never touch its db). Record the new snapshot.

## Portfolio
The portfolio (repo `holroydchase-afk.github.io`) links to /pm-tools/build-slate/ and /pm-tools/roadmap/ and keeps no copies. It still uses its own `demo/fake-db.js` for the Role Radar and Energy Scanner demos.
- **Pages:** https://chaseholroyd.com/pm-tools.html ("How I work") links https://chaseholroyd.com/pm-tools/build-slate/ and https://chaseholroyd.com/pm-tools/roadmap/. Source: `tools/build.py` in `holroydchase-afk.github.io`.
- **Demo data:** scrubbed snapshots of the real slate and roadmap (`demo/*/seed.js`), saved only in the visitor's browser.
- **Studio-wide status:** `STUDIO-STATUS.md` in this repo (added Oct 21) is the one cross-project list of what's done (portfolio, domain, every demo) and what's waiting on Chase. Product HANDOFF.md files link to it. Refresh it from every repo's HANDOFF.md and GitHub after any portfolio change.
- 2026-10-23: STUDIO-STATUS lists the new Charlie repo (owner, Done, Waiting on Chase). No change to the demos.
- 2026-10-22: demo bar links back to chaseholroyd.com/pm-tools.html (How I work) instead of the home page.
- 2026-10-22: demo seeds refreshed so Build Slate and the roadmap agree with the product pages (PMT-M2.2); landing links back to chaseholroyd.com (PMT-M2.3).
- 2026-10-21: the portfolio home page lists these as "How I run product work", tagged "Live demos".
- **Keep in sync:** when a change here alters what the portfolio page or demo shows (features, numbers, screenshots, privacy claims), tell the portfolio thread ("Portfolio research and upgrade plan") or update the page in `holroydchase-afk.github.io` (`tools/build.py`). Any portfolio change that touches this product adds a dated line here.

## Studio architect (Oct 27, Chase's go)
- studio-agents adds an `architect` agent: owns STACK.md fit, reuse before build, architecture docs matching code, cross-repo consistency, and a weekly drift sweep. `docs/ONBOARDING.md` lists it in the agents table (synced to product repos, unlike orchestrator and focus-coach); STACK.md "Adding something not on this page" runs it first. Paired PR in studio-agents.

## Studio stack guide (Oct 22)
- `STACK.md`: the default stack per kind of product, when to use something else, and what not to add. Project instructions in every project point here (paste given to Chase in the Product Studio thread "Studio tech stack guide").

## Exact next step
Merge this and the paired studio-agents architect PR; product projects pick the agent up on their next `scripts/sync.sh`. The weekly architect drift sweep goes into the Product Studio night shift's prompt (Sundays) when that shift is turned back on; it is paused, and its prompt can only be edited from the thread it posts into.

Chase pastes the tailored onboarding first message into the Charlie and Crew Clock projects (repos are already in STUDIO-STATUS and Build Slate, so their INTAKE blocks need nothing more), and the refresh paste into the existing product projects.

Roadmap demo seed: ccwatts cards use the planning IDs (`CCW-M1.1` and so on, old S1–S10), matching the live board as of Oct 21.

PMT-M2.1: a drift check that compares `apps/*.html` with each live artifact's current version (see `PLAN.md`).

## Decisions to review
- Build Slate goal is 5 and it now holds 6 (Charlie took over the Stock Agent card; Crew Clock is new). Pause one, or raise the goal?
- Onboarding: agents are installed by copy (`sync.sh`), not the plugin, because copies load in cloud sessions with no setup. Every PR ends with an `Agents:` line so use is visible.
- Recruiter-ready polish is demo-only (`EDITS`): port the AA colors, bigger buttons, card links and plain words to the live Build Slate and roadmap? That republishes the live artifacts, so it waits on Chase.
- ccwatts shows "Building" on the slate (not Beta) until the friend beta starts.
- Energy Scanner's slate card uses the portfolio's story (bedtime routine with palm or photo scan); the energy-scanner repo's CLAUDE.md describes only the photo app. The Energy Scanner project should confirm which is current.
- Planning IDs (CCW-M…) stay on the roadmap demo cards.
- Reusable blocks: Chase moved the Supabase starter to now (Oct 24) so Crew Clock can use it; Hearth adds its proven patterns after the beta. Shared repo files are copied with a sync script rather than published as packages.
- MIT license, matching ccwatts.
- Templates are generic rewrites, not copies: Hearth's persona roster (real family members) stays private in Hearth. Example personas are NV / PU / SK.
- Hearth Test Log is not moved yet: it's built from Hearth's own test output (`tracker/build_seed.py`), so it stays with Hearth until a second product needs it.
- No build dependencies; Node only, so CI and the night shift need no install.

## Blockers
- None.
