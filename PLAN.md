# Plan: PM tools (PMT)

_Studio planning IDs (studio-agents `docs/planning-ids.md`): milestone M1, task M1.1 (one PR), step M1.1.1 only if needed. Status: todo, doing, blocked, done, dropped._

## Goal
One public repo holds the source of every PM tool, the generic templates, and a demo build, so a recruiter can try the tools at chaseholroyd.com/pm-tools/ and any product repo can copy the templates.

## PMT-M1: Tools live in one repo, demos served from it
| Task | Status | Done when |
|---|---|---|
| PMT-M1.1 App sources, templates, routines, demo build, HANDOFF.md | doing | `npm test` and `npm run check:private` pass; PR merged |
| PMT-M1.2 Pages live at chaseholroyd.com/pm-tools/ | blocked | Both demos load there with sample data. Needs Pages turned on |
| PMT-M1.3 Portfolio links here and drops its copies | todo | Portfolio "How I work" buttons open /pm-tools/<app>/; `demo/build-slate` and `demo/roadmap` removed from the portfolio repo |

## PMT-M2: Sync stays cheap
| Task | Status | Done when |
|---|---|---|
| PMT-M2.1 Drift check | todo | One command reports whether `apps/*.html` matches the live artifact's current version (run by Claude, since it needs the Artifact tool) |
| PMT-M2.2 Studio agents in the hub | todo | studio-agents docs linked from `routines/README.md` or moved here, whichever Chase prefers |

## Later
- Hearth Test Log made generic, once a second product needs a test log.
- A "portfolio: feature / list / hidden" field in Build Slate, so the site follows the slate.
