# Live-shape feed fixture (PMT-M3.3 review, UX-S1 to UX-S8)

Made-up sample data shaped like the real hourly feed on Oct 31, when ux-reviewer scored the console
4/10 on it. No real people, emails or links; the text is invented and only the shape is copied:

- No HANDOFF has a status header, so stage comes from `stage` in products.json (console.config.json
  in production) or nowhere.
- HANDOFF bullets are long markdown: `**bold**`, `code`, file paths, dates, several sentences.
- Every product has 3 decisions (the parser keeps 3 per section), and STUDIO-STATUS has 5 "Waiting on
  Chase" bullets.
- Zero agent runs: no run logs at all.
- 7 open non-Dependabot PRs; 3 match no goal once goal `keywords` count (UX-S4). One Dependabot PR.
- goals.json carries `keywords` and long status chips (UX-S4, UX-S5).

Fixed clock: `NOW = 2026-10-31T12:00:00Z`. `load.ts` turns it into a FeedInput.
