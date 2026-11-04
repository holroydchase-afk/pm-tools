# Review process (numbered rounds)

Adapted from the review-rounds skill (role-radar `.claude/skills/review-rounds`), which ran as ES-R1..R68 on Energy Scanner.

1. **Scope (staff-pm):** rank the touchpoints the target persona hits; name the biggest risk.
2. **Check last round:** each earlier finding is Verified, Verified in code, or Not fixed, with evidence.
3. **Review (ux-reviewer):** serve the build locally; screenshot every screen at 320x640, 390x844, 1280x800, light and dark; hunt P0, then P1, then P2.
4. **Write it down:** `docs/reviews/<YYYY-MM-DD>-<name>.md`; IDs `<CODE>-R<n>` continue and are never reused.
5. **Fix:** qa-tdd writes a failing test named with the ID (red), engineer fixes, qa-tdd runs all suites 3x (green). Real-device items get a manual AC and stay "confirm on device".
6. **Log:** HANDOFF.md lists each ID; PR body has the `Agents:` line.
7. **Stop:** when a round finds nothing at P2 or above, or when told to. Never stop with an unverified P0.

**Priorities:** P0 blocks shipping or showing (broken core flow, privacy breach, false public claim). P1 hurts the impression or strands a core persona. P2 polish.
**Rules:** claim only what you ran or opened; say "verified in code" or "confirm on device" otherwise. Each finding gives exact fix wording.

**Resume variant (private):** a fresh-context loop of reviewer, engineering manager and hiring manager reads, then a writer applying sourced edits; max 3 rounds, stop on READY.
