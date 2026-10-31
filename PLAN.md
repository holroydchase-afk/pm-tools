# Plan: PM tools (PMT)

_Studio planning IDs (studio-agents `docs/planning-ids.md`): milestone M1, task M1.1 (one PR), step M1.1.1 only if needed. Status: todo, doing, blocked, done, dropped._

## Goal
One public repo holds the source of every PM tool, the generic templates, and a demo build, so a recruiter can try the tools at chaseholroyd.com/pm-tools/ and any product repo can copy the templates.

## PMT-M1: Tools live in one repo, demos served from it
| Task | Status | Done when |
|---|---|---|
| PMT-M1.1 App sources, templates, routines, demo build, HANDOFF.md | done (PR #1) | `npm test` and `npm run check:private` pass; PR merged |
| PMT-M1.2 Pages live at chaseholroyd.com/pm-tools/ | done (deployed Oct 21) | Both demos load there with sample data |
| PMT-M1.3 Portfolio links here and drops its copies | done (portfolio PR #3) | Portfolio "How I work" buttons open /pm-tools/<app>/; `demo/build-slate` and `demo/roadmap` removed from the portfolio repo |

## PMT-M2: Sync stays cheap
| Task | Status | Done when |
|---|---|---|
| PMT-M2.1 Drift check | todo | One command reports whether `apps/*.html` matches the live artifact's current version (run by Claude, since it needs the Artifact tool) |
| PMT-M2.2 Studio agents in the hub | todo | studio-agents docs linked from `routines/README.md` or moved here, whichever Chase prefers |

## PMT-M3: Studio Console (approved Oct 31)
Bet: agents ship faster than Chase can read 5-7 HANDOFFs and ~46 open PRs a day. One goal-first page, built hourly from public repos, keeps him on his goals and out of rabbit holes. For Chase only: not a generic roadmap tool, not for a human team, not commercial. Screens: `/mnt/project-files/pmo/console/studio-console-mock.html`. Location: `chaseholroyd.com/pm-tools/console/` during M3; the `/pm-tools/` landing redirects there in M3.5, so portfolio links never break mid-milestone.
Success: 5 weekdays in a row Chase works from the Call Sheet without opening a HANDOFF.md. Stop or pivot: after 2 weeks live he still reads HANDOFFs daily, or the feed is stale (over 2h) more than once a week.

| Task | Status | Done when |
|---|---|---|
| PMT-M3.1 Feed builder: pure `scripts/feed/` core + thin fetch layer, recorded fixtures, `goals.json` | done (#51) | CON-1 to CON-7 pass on fixtures with no network; `npm test`, typecheck, check:private green; no new runtime deps |
| PMT-M3.2 Console UI: Focus + Call Sheet, scheduled Action (hourly + manual) writes `studio.json` into the Pages build (one deploy path: pages.yml gains the cron and runs `npm run feed` after the build, no separate workflow) | done (#52) | CON-8 to CON-11 pass; ux-reviewer no P0/P1; privacy-security signs off the Action and feed |
| PMT-M3.3 Console UI: Build Slate (drawer), Horizon Board, Agent Roster | done (#53) | CON-12 to CON-15 pass; ux-reviewer no P0/P1 |
| PMT-M3.4 Status-header standard in studio-agents (template + handoff-check) and intake issues to each product repo | in progress (studio-agents #34) | studio-agents PR merged; one intake issue per product; CON-16 passes |
| PMT-M3.5 Portfolio copy (holroydchase-afk.github.io) and retire the old demos | in progress | Portfolio links the console; `/pm-tools/` redirects; demo seeds and the two artifact DBs marked archived (read-only), nothing deleted in M3 |

Acceptance criteria (Given/When/Then; type):
- CON-1 (auto) Given a HANDOFF with a status header, when parsed, then stage, goal, milestone, now, next, waiting_on_chase and blockers come from the header.
- CON-2 (auto) Given a HANDOFF with no header, when parsed, then now/next/decisions/blockers come from "## In progress", "## Exact next step", "## Decisions to review", "## Blockers", and the product is marked `header: missing`.
- CON-3 (auto) Given goals.json and a PR or run whose repo or planning-ID prefix matches no goal, when the feed builds, then it is listed under off-goal; matching items count toward their goal.
- CON-4 (auto) Given open-PR JSON, when built, then every non-Dependabot PR lands in exactly one Call Sheet group (ready to merge, failing, in progress, draft idle over 24h), every Dependabot PR is in the Dependabot batch, and the batch is one item per repo.
- CON-5 (auto) Given a PR body `Agents:` line and the branch's run log, when built, then each gate is ok, missing (named but not in the log) or n/a.
- CON-6 (auto) Given agent-run log text, when built, then runs per agent per product for the last 7 days match the fixture's hand count.
- CON-7 (auto) Given any fixture set, when built, then studio.json matches the Feed shape check and contains no PR body text, emails or private-repo names; check:private passes on the output.
- CON-8 (auto) Given studio.json, when Focus loads, then 3-4 goal cards show name and measure, the effort bar sums to 100%, and off-goal items are listed separately.
- CON-9 (auto) Given studio.json, when Call Sheet loads, then items sort worst first (failing, ready to merge, decisions, drafts idle over 24h, in progress, Dependabot batch; feed order within a group) and each item's one button links to GitHub: the PR, the repo's HANDOFF.md for a decision (STUDIO-STATUS.md when it has no repo), or the repo's open Dependabot PRs.
- CON-10 (auto) Given studio.json older than 2h, when any view loads, then a stale-feed warning shows the build time.
- CON-11 (manual) Given the Action runs on schedule, when Chase opens the console on his phone, then the feed time is under 1h old and every view works at 390px.
- CON-12 (auto) Given more than 5 active products, when Build Slate loads, then the WIP bar shows over cap in warning color.
- CON-13 (auto) Given a product card, when clicked, then a drawer shows its HANDOFF summary in at most 10 lines with a link to the source file.
- CON-14 (auto) Given milestones by planning ID, when Horizon loads, then each sits in exactly one of Now/Next/Later/Done per product, and a card links to its PR.
- CON-15 (auto) Given no eval data, when Agent Roster loads, then eval scores show a placeholder, not a zero.
- CON-16 (auto) Given studio-agents' handoff-check, when a HANDOFF lacks the status header, then the check warns (not fails) until every product has adopted it.

## Later
- Console: eval scores in Agent Roster once studio-agents evals land; "park to Ideas" button that writes back (needs write access, not now).
- Hearth Test Log made generic, once a second product needs a test log.
- A "portfolio: feature / list / hidden" field in Build Slate, so the site follows the slate.
