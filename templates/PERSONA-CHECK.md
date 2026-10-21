# Persona check (TDPM: test-driven product management)

TDD for product decisions: the check is the test, and a decision ships only when it passes.

## The rule
**No product decision is final until it has a persona check recorded.**

- A check is one file in `decisions/`, one row per persona below, each **Green** or **Red** with a why of 15 words or fewer.
- **Red blocks** unless the file has `Resolution: <ID> mitigation: ...` (what changes so the persona is safe) or `Resolution: <ID> owner override (<date>): ...` (the owner accepts the cost, in their words).
- `scripts/check-persona-checks.sh` enforces this in CI: a missing persona, a value other than Green/Red, a why over 15 words, or an unresolved Red fails the build.
- **Adding a persona breaks every old decision on purpose.** Each needs the new row before CI is green again: that is the re-run.

## How to run one
1. Name the decision in one line and link its source (the owner's words or a spec ID).
2. For each card, ask: does this trip a hard red? Does it serve the yes? Write Green or Red and the why. Judge the decision as specced, not as hoped.
3. For each Red, write the mitigation (a spec change, with its test ID) or ask the owner for an override. Never turn a Red Green by rewording the why.
4. Run `bash scripts/check-persona-checks.sh`.
5. Copy `decisions/0001-example.md`.

## Roster
The script reads the IDs between these markers (two capital letters, then a colon). Replace these examples with your own.

<!-- personas:start -->
- NV: Newcomer who won't read instructions
- PU: Power user short on time
- SK: Skeptic who checks every claim
<!-- personas:end -->

## Cards
**NV Newcomer who won't read instructions**
- Yes: the first screen does the job with nothing to learn.
- Hard reds: a new choice or setting on their screens; anything that needs a help call.

**PU Power user short on time**
- Yes: the common task in three taps, then they stop thinking about it.
- Hard reds: anything slower than what they use today; a setting to babysit.

**SK Skeptic who checks every claim**
- Yes: every claim the product makes is true today and checkable.
- Hard reds: a claim the code doesn't back.

_Cards start as one-liners. Each needs evidence (interviews, test logs, support calls) before its Green can be trusted._
