# Handoff: PM tools

_Read this before starting work on this repo. Update it in the same commit whenever you make progress._

Updated: 2026-10-21

## Current state
- PMT-M1 is done (Oct 21): the repo holds the source of **Build Slate** and the **Near-Term Roadmap** (`apps/`), sample-data demos of both (`demo/`), generic PM templates (`templates/`) and routines (`routines/`).
- Demos are live at **chaseholroyd.com/pm-tools/** (Actions deploy from `main`). The portfolio's "How I work" page links here, and its own copies were removed (portfolio PR #3), so this repo is the only source.
- `npm test`: 8 build and privacy tests, 10 persona-check tests. `npm run check:private` is clean.

## Where each tool came from
| Here | Came from | Snapshot |
|---|---|---|
| `apps/build-slate.html` | Live Build Slate artifact (db collection `projects`) | 1792119995-cea2 |
| `apps/roadmap.html` | Live Near-Term Roadmap artifact (db `boards`, `cards`) | 1792243476-857c |
| `demo/*/seed.js`, `demo/fake-db.js` | The portfolio repo's demo copies (already scrubbed) | Oct 21 |
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

## Exact next step
PMT-M2.1: a drift check that compares `apps/*.html` with each live artifact's current version (see `PLAN.md`).

## Decisions to review
- MIT license, matching ccwatts.
- Templates are generic rewrites, not copies: Hearth's persona roster (real family members) stays private in Hearth. Example personas are NV / PU / SK.
- Hearth Test Log is not moved yet: it's built from Hearth's own test output (`tracker/build_seed.py`), so it stays with Hearth until a second product needs it.
- No build dependencies; Node only, so CI and the night shift need no install.

## Blockers
- None.
