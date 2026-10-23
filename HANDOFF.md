# Handoff: PM tools

_Read this before starting work on this repo. Update it in the same commit whenever you make progress._

Updated: 2026-10-23 (new-project onboarding kit)

## Current state
- PMT-M1 is done (Oct 21): the repo holds the source of **Build Slate** and the **Near-Term Roadmap** (`apps/`), sample-data demos of both (`demo/`), generic PM templates (`templates/`) and routines (`routines/`).
- Demos are live at **chaseholroyd.com/pm-tools/** (Actions deploy from `main`). The portfolio's "How I work" page links here, and its own copies were removed (portfolio PR #3), so this repo is the only source.
- `npm test`: 8 build and privacy tests, 10 persona-check tests. `npm run check:private` is clean.

## Recruiter-ready review (Oct 22)
ux-reviewer and qa-tdd reviewed the demos; the ranked list is in the portfolio repo, `docs/reviews/2026-10-22-recruiter-ready.md`.
- PMT-M2.2: demo seeds now match the portfolio pages. Build Slate: ccwatts Beta, Energy Scanner Launched (photo aura app), Stock Agent dropped so the demo sits at 5 of 5; Role Radar copy says nothing about resume tooling. Roadmap: ccwatts M1.1 to M1.7 in Done, plus a second board (Role Radar). `tests/seeds.test.mjs` fails if a stage drifts from the portfolio or the slate passes its cap.
- PMT-M2.3: the /pm-tools/ landing has a "← Chase Holroyd" link at the top and named CTAs.
- The live Build Slate and roadmap themselves are still at their Oct 20 state (ccwatts "Spec", one board). The demo seeds were updated from GitHub, not from the live apps. Updating the live apps writes Chase's real data, so that waits on Chase.
- Overnight loop (Chase, Oct 22: iterate through P2s). Round 1: PMT-M2.4 demo bar goes back to How I work ("← How I work", `back`/`backLabel` in each seed); PMT-M2.5 roadmap demo hides the developer schema panel; QA-11 browser tests (`npm run test:e2e`, Playwright, CI job `e2e` gates deploy; passed 3 runs locally).
- Round 2 (deep ux-reviewer showcase pass, R1-UX findings): Energy Scanner card matches the portfolio (bedtime routine, palm or photo scan, "Web app"); ccwatts stage set to Building (no beta running yet; portfolio says "playground live"); family app notes match the portfolio numbers; roadmap no longer names a real outside person; product cards get "Open live demo ↗" links; demo-only AA colors, 44px move buttons and phone chips, "work sessions", "Chase's tasks", "Active projects · 5 of 5 max", stronger landing focus ring. Demo-only page changes live in `EDITS` in `scripts/build-demo.mjs`.
- Round 3 (ux-reviewer re-check, R2-UX): demo CSS overrides now load after the app CSS (move-button gap and stage-tag size really apply); Role Radar's next step and card say the demo moves to its own repo (it already exists) and its link opens the demo; links read "Try <product> ↗" with a spacer so the grid lines up; Developer tool kind option; light-mode Later/Done lane colors pass AA; phone buttons 44px; landing says "five active projects" and "Later, Next, Now and Done".
- Round 4: moving a roadmap card shows a pinned "Moved … to Next · Undo" notice for 6 seconds (R1-UX-12, with an e2e test); meta text and owner chips at 13px (R1-UX-10). All review findings from rounds 1-3 are now fixed or listed under Decisions to review.
- Round 5 (final UX + QA check, R4 findings): Undo puts the card back in its old spot and says "Move undone" instead of a second notice (R4-1, e2e checks the position); roadmap card meta at 13px (R4-2). R4-3 (portfolio copy: "five active projects", lane order) belongs to the portfolio repo. Merged to main on Oct 22 with Chase's go-ahead (#9 to #13). Nothing at P0-P2 left in pm-tools. Next step: port the demo polish to the live apps if Chase wants it (see Decisions to review).
- Studio agents synced into `.claude/agents/` from studio-agents (includes the upgraded ux-reviewer with the visual pass and showcase review, studio-agents draft PR #6 or later); re-sync with its `scripts/sync.sh`.

## New-project onboarding kit (Oct 23)
- `docs/ONBOARDING.md`: how a new product project (next: Charlie, Crew Clock) joins the studio in one paste: portfolio and hosting, studio rules, repo setup, studio agents and when to use them by default, recruiter-ready bar, shifts and digest, Atlas Story, INTAKE format, the two pastes, and a refresh paste for existing projects. Linked from STUDIO-STATUS.
- Why: product repos had the agents copied in, but no CLAUDE.md said when to use them, so they ran only when a paste named them. Companion studio-agents PR #7 adds the when-to-use table, proactive agent descriptions and `templates/CLAUDE-agents.md`.
- Merged Oct 23 with Chase's go-ahead, together with `STACK.md` (#15) and studio-agents #7.
- `/onboard` skill (Chase, Oct 23): runs this kit in any project (studio-agents `plugins/studio/skills/onboard`); `/onboard refresh` for existing projects. ONBOARDING.md leads with it; the pastes stay as the fallback.

## Where each tool came from
| Here | Came from | Snapshot |
|---|---|---|
| `apps/build-slate.html` | Live Build Slate artifact (db collection `projects`) | 1792119995-cea2 |
| `apps/roadmap.html` | Live Near-Term Roadmap artifact (db `boards`, `cards`) | 1792243476-857c |
| `demo/*/seed.js`, `demo/fake-db.js` | The portfolio repo's demo copies (already scrubbed); stages refreshed from GitHub | Oct 22 |
| `templates/` | Hearth repo `docs/product/PM-TOOLS.md` and the docs it lists, made generic (no family names or Hearth specifics) | Oct 21 |
| `scripts/check-persona-checks.sh` | Hearth's TDPM check, with "Chase override" generalized to "<who> override" | Oct 21 |
| `routines/night-shift.md` | The night-shift paste (Role Radar project), with the owner's goal made a placeholder | Oct 21 |
| `routines/shared-doc-inbox/` | The career-docs pending inbox and `pending.py`, made generic | Oct 21 |
| `scripts/check-private.mjs`, `.githooks/` | Role Radar repo | Oct 21 |

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
- 2026-10-22: demo bar links back to chaseholroyd.com/pm-tools.html (How I work) instead of the home page.
- 2026-10-22: demo seeds refreshed so Build Slate and the roadmap agree with the product pages (PMT-M2.2); landing links back to chaseholroyd.com (PMT-M2.3).
- 2026-10-21: the portfolio home page lists these as "How I run product work", tagged "Live demos".
- **Keep in sync:** when a change here alters what the portfolio page or demo shows (features, numbers, screenshots, privacy claims), tell the portfolio thread ("Portfolio research and upgrade plan") or update the page in `holroydchase-afk.github.io` (`tools/build.py`). Any portfolio change that touches this product adds a dated line here.

## Studio stack guide (Oct 22)
- `STACK.md`: the default stack per kind of product, when to use something else, and what not to add. Project instructions in every project point here (paste given to Chase in the Product Studio thread "Studio tech stack guide").

## Exact next step
Chase pastes the kit into Charlie and Crew Clock (in progress Oct 23), and the refresh paste into the existing product projects. Then add their repos to STUDIO-STATUS from their INTAKE blocks.

Roadmap demo seed: ccwatts cards use the planning IDs (`CCW-M1.1` and so on, old S1–S10), matching the live board as of Oct 21.

PMT-M2.1: a drift check that compares `apps/*.html` with each live artifact's current version (see `PLAN.md`).

## Decisions to review
- Onboarding: agents are installed by copy (`sync.sh`), not the plugin, because copies load in cloud sessions with no setup. Every PR ends with an `Agents:` line so use is visible.
- Recruiter-ready polish is demo-only (`EDITS`): port the AA colors, bigger buttons, card links and plain words to the live Build Slate and roadmap? That republishes the live artifacts, so it waits on Chase.
- ccwatts shows "Building" on the slate (not Beta) until the friend beta starts.
- Energy Scanner's slate card uses the portfolio's story (bedtime routine with palm or photo scan); the energy-scanner repo's CLAUDE.md describes only the photo app. The Energy Scanner project should confirm which is current.
- Planning IDs (CCW-M…) stay on the roadmap demo cards.
- MIT license, matching ccwatts.
- Templates are generic rewrites, not copies: Hearth's persona roster (real family members) stays private in Hearth. Example personas are NV / PU / SK.
- Hearth Test Log is not moved yet: it's built from Hearth's own test output (`tracker/build_seed.py`), so it stays with Hearth until a second product needs it.
- No build dependencies; Node only, so CI and the night shift need no install.

## Blockers
- None.
