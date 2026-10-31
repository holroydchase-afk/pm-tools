# Handoff: ccwatts

## In progress
- M2.2 ship prep (everything except the npm publish). Done so far: fixed a packaging bug (the CLI listed the unpublished `@ccwatts/core` as a runtime dependency, so `npm install` of the tarball failed with a 404; it is bundled anyway, so it is now a devDependency), added a test that the CLI has no runtime dependencies, and ran a clean install of `npm pack` output into an empty project.
- Oct 23: name decided (ccwatts, ANCHORS P1). The CLI package is publish-ready: `private` removed, `publishConfig.access` public, an npm README (`packages/cli/README.md`).

## Exact next step
- **CCW-M4.2 Pace core** (test-first): pure `packages/core/src/pace.ts` per PLAN M4 and the privacy constraints at the end of the spike doc. Before M4.3, settle the Pace decisions below.

## Decisions to review
- Ship pace during the release freeze or wait. It holds the Pace release and two PRs, and the spike doc in `docs/spikes/pace.md` argues for waiting.
- Range label wording on the summary line (`packages/cli/src/summary.ts`). It is the first number every user reads, and the current "~" reads as a typo on small terminals.
- 2026-10-29: Whether `--json` output keeps the method version on every row or once at the top. Every row is safer for people who pipe into spreadsheets.
