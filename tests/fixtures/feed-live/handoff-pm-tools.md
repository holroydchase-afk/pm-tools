# Handoff: PM tools

## In progress
- **PMT-M3.3 Console UI** (uncommitted on `claude/pmt-m3-3`): Build Slate with a drawer, Horizon Board and Agent Roster in `console/app.js`; new feed fields in `scripts/feed/*`. typecheck, `npm test` (136), check:private and e2e (25) green 3x.

## Exact next step
- ux-reviewer on the three views at 390px, light and dark, on the real feed.

## Decisions to review
- Health "failing" counts non-draft PRs only, as the Call Sheet does.
- Studio tools stay in the slate grid with a group chip rather than a separate section.
- 2026-10-31: Gate cells read "passed", "missing from run log" or "n/a". The n/a cells are most of the table on the real feed.
