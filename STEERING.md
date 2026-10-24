# Studio steering

_Chase's current steer for every project. The Product Studio coordinator rewrites this file from Chase's messages, usually daily; no other project edits it. Every scheduled run (day shift, night shift) reads it first, and the steer here wins over the run's own plan. CLAUDE.md hard rules still win over everything._

Updated: 2026-10-24

## How runs use this file
1. Read the studio-wide section, then your product's section.
2. Check the job-hunt gate (below). If it's closed, do only job-hunt support and stop.
3. Do the steered work. If your section says "default", finish HANDOFF.md's exact next step, then staff-pm's top priority, within the freeze.
4. At the end, add one status line as a comment on [pm-tools issue #26](https://github.com/holroydchase-afk/pm-tools/issues/26) (format in the issue). If your session can't reach pm-tools, put the same line at the top of your repo's HANDOFF.md as "Last shift: ...". Only Product Studio edits this repo; its day shift copies the latest line per project into the "Shift status" table in [STUDIO-STATUS.md](STUDIO-STATUS.md).

## Studio-wide
**Polish Freeze (since Oct 24, until Chase says "lift Polish Freeze")**
- No new products, features or to-dos. Park ideas in HANDOFF.md under "Parked (Polish Freeze)".
- Allowed: hardening (bugs, tests, a11y, performance) and small UI-polish items.
- UI target 8/10 per product. Assume a 2/10 baseline unless Chase rated it. Build Slate and the portfolio are the reference. ux-reviewer scores before and after at 390 and 1280 px.
- Job-hunt gate: build only after today's 3 (applications or follow-up actions, any mix). The count is in the project files job-hunt tracker.
- Near the weekly token limit: short runs, one PR per run, smallest model that fits, no re-reads.
- Never merge, deploy or publish.

## ccwatts
Default.

## Role Radar
Default. Applications themselves are never gated.

## Energy Scanner
Default.

## Hearth
Default. Beta target Nov 22; the new name is still waiting on Chase.

## Charlie
Default. Paper trading only.

## Crew Clock
Default. Supabase setup is waiting on Chase, so polish the demo build.

## Portfolio and Product Studio (portfolio, pm-tools, studio-agents)
Default. Keep Chase's [check] items flagged; never invent them.
