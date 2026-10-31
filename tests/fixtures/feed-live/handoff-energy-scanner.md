# Handoff: Energy Scanner

## In progress
- **ES-M2.3 aura presets**: three presets (`calm`, `storm`, `sunrise`) in `src/presets.ts`, each a palette and a particle speed. The preset picker sits under the photo on phones and beside it on desktop.

## Exact next step
- Run `npm run lint`, `npm run typecheck` and `npm test`, then open the draft PR for ES-M2.3 with screenshots at 390px.

## Decisions to review
- 2026-10-30: Keep the fake segmenter in the e2e suite only (labeled as a test fake in `tests/fakes/segmenter.ts`), or also ship a "demo photo" mode on the public page. The demo mode would need a licensed sample image recorded in `samples/SOURCES.md`.
- Default preset on first load: `calm` reads as the brand, `storm` shows the effect off better on a first visit.
- Whether the share button saves a PNG or a short looping video. Video needs `MediaRecorder`, which older iOS Safari lacks.
