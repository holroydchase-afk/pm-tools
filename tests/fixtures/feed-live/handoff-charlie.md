# Handoff: Charlie

## In progress
- **CHL-R3 CI browser test**: the PS1-style menu test runs in CI on `ubuntu-24.04` with Playwright's Chromium; it was flaky on the first run because the font loaded late, so `tests/e2e/menu.e2e.ts` now waits for `document.fonts.ready`.

## Exact next step
- Merge #28 once the portfolio card text is final, then rerun the CI job on #29 three times.

## Decisions to review
- 2026-10-31: Name for the save-slot feature (intake #12). "Memory card" fits the PS1 look but may confuse anyone who never owned one.
- Controller remap (intake #13) now or after the first public demo. It touches every input handler in `src/input/`.
- Whether the portfolio card shows a GIF or a still. A GIF is 2.1 MB at 390px wide.
