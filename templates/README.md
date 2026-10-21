# PM templates

Copy what you need into a product repo (most go in `docs/product/`; `HANDOFF.md`, `PLAN.md` and `CLAUDE.md` go at the root). Each file says what it's for at the top. They grew out of building a family photo app, a job-search radar and a CLI with an AI agent team, so they assume one human owner and AI sessions that start cold.

| File | Use it for | Read by |
|---|---|---|
| `HANDOFF.md` | Current state: done, in progress, exact next step, decisions to review, blockers. Updated in every commit. | Every session, first |
| `PLAN.md` | Milestones in order, each with done-criteria. One PR per milestone. | Builders, the night shift |
| `CLAUDE.md` | Hard rules for AI builders. Wins over everything else. | Every AI session |
| `ANCHORS.md` | The few principles every feature is checked against, plus the ideas log. | Product calls |
| `TRACKER.md` | The one to-do list: critical path, what's waiting on whom. | The owner, daily |
| `DECISION-LOG.md` | Every call with why and what it beat (DEC-n). | Anyone retelling the story |
| `PERSONA-CHECK.md` + `decisions/` | Test-driven product management: each persona gets Green or Red before a decision is final, and CI enforces it (`scripts/check-persona-checks.sh`). | Product calls, CI |
| `GATE-REVIEW.md` | A go/no-go review of a plan or milestone, with measurable gates. | Before each milestone |
| `UAT-LOG.md` | The owner's running list from trying the product, newest first. | Builders |
| `IDEAS.md` | The #idea inbox: logged word for word, no discussion. | Planning |
| `LESSONS.md` | Post mortems. Each one adds a rule. | Builders |
| `PM-TOOLS.md` | Which of these a product uses, and its action items. | The owner |
