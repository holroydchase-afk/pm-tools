# Handoff: Role Radar

Updated: 2026-10-31 (night run; see PLAN.md "M4").

## Done
- **RR-M3 release plan** merged (#40, #42).

## In progress
- **RR-M4 Home and declutter** (approved on 2026-10-30 with `go`). One draft PR from `claude/rr-m4-1`, one commit per step. Plan: M4.1 header and tabs, M4.2 score split and Home stats (pure functions in `src/score.js`), M4.3 calmer card and a Details sheet, M4.4 Home tab as the default, M4.5 the ready gate.
- RR-M3.2 works for real (`claude/rr-m3-2`, stacked on #42): 11 tests in `tests/works-for-real.test.mjs`, red first. An empty tracker shows the criteria editor with "Start from the example" (the repo's `criteria.yaml` is embedded in the page).
- 2026-10-28 release plan RR-M3 (night run). Stacked draft PRs from `claude/rr-m3-1` on top of #40, with main merged in.

## Exact next step
- **RR-M4.2 score split** (test-first): `scoreParts()` in `src/score.js` returns Fit, Values and Culture that add up to the 0-100 total; `tests/score-split.test.mjs` pins the maxes (60, 45, 10).

## Decisions to review
- 2026-10-31: CI's `test` job is pinned to `ubuntu-24.04` (RR-CI-4) because Playwright can't install Chromium on the newer runner image, so main's next CI run would go red too. Unpin once the Playwright bump (Dependabot) passes there.
- RR intake #59 MCP server: (a) RR-TS-4 narrows from "no runtime deps" to an allow-list of two deps (`@modelcontextprotocol/sdk`, `js-yaml`). (b) js-yaml moves to 4.3.2 for the audit fix. (c) The SDK adds about 1.2k lock lines.
- RR-M4.5 review fixes: culture checks still add no points, so `Culture 0 Great` can appear; the Done tile counts all-time sent roles including ones later closed.

## Blockers
