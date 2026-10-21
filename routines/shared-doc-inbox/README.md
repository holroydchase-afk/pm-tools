# Shared-doc inbox and merge pass

Several AI threads work at once, and a shared folder keeps only the last write, so two threads editing the same doc can silently erase each other. This folder fixes that with a small version of how code teams ship:

| Code team | Here |
|---|---|
| `main` branch | the master docs (the `.md` files in the root folder) |
| a pull request | an entry in this folder |
| CI checks | `python3 pending.py check` |
| merge queue | the merge pass (`python3 pending.py apply`), one at a time under a lock |
| changelog | `merged/` (applied inbox files) plus a revision log in your main master doc |

Started Oct 20, 2026 for a set of career docs that several threads edited at once. Generic since then.

## The rules

1. **Only the merge pass edits the master docs.** Every other thread writes entries here. Anything that isn't a master doc (a one-off copy, an app's database, a scratch file) works as before.
2. **One inbox file per thread**, named `YYYY-MM-DD-<short-thread-name>.md`. Only that thread writes it, so threads never collide in the inbox either. If `.merge-lock` exists, a merge is running: don't touch your file until it's gone (or start `...-2.md`).
3. **Write early.** Add an entry the moment the owner confirms a fact or a rule, not at the end of the thread. Unwritten facts are invisible to other threads.
4. **Read through.** Before relying on a section, read the master *and* the unmerged entries for it: `python3 pending.py show specs.md 5`. Open entries count as true but unmerged. They can be used unless tagged [CONFIRM]. When two open entries disagree on a fact, use neither and ask the owner.
5. **Don't edit someone else's entry.** If an entry looks wrong, write your own entry that depends on it or replaces the same text. The overlap check will surface it at merge.

## Entry format

```
## pricing-03
target: specs.md
section: 5
op: replace
status: open
date: 2026-10-21
by: Pricing thread (thread link)
why: the owner confirmed the 40% figure on Oct 21
depends: pricing-02
<<<base
exact text currently in the target, copied character for character
>>>
<<<new
the replacement text
>>>
```

- **id**: `<thread-short-name>-NN`, unique across the folder.
- **target**: a path relative to the root folder. **section**: the shared section number, or blank.
- **op**: `replace` (base becomes new), `add-after` (new is inserted on the line after base), `remove` (base is deleted, no new block), `new-file` (target is created from new, no base).
- **base**: the anchor. It must appear exactly once in the target, so quote enough to be unique. This is what catches a target that changed under you.
- **status**: `open` → `merged` / `conflict (reason)` / `dropped`. Threads set `open` or `dropped`. Only the merge pass sets `merged` or `conflict`.
- **depends** (optional): ids that must merge first, such as a second entry whose base is the first entry's new text.

## Needing what another thread knows

- **It's in an entry:** `show` finds it. That's the whole point of writing early.
- **It's decided but not written down yet:** read the other thread (`fetch_thread`, or `list_thread_sessions` to find it). Use what the owner said there, and cite it. Don't write an entry for that thread's facts; ask it to write one by sending a message through the coordinator.
- **It's still open in the other thread:** don't guess. Mark the dependency [CONFIRM] in your own work and carry on.

## Conflicts

`check` and `apply` report three kinds:
- **STALE**: the base text is no longer in the target because someone merged a change there. Rebase: re-read the target, copy the current text into base, reapply your intent in new, and set status back to `open`.
- **CONFLICT / overlaps**: two open entries change the same text. `apply` holds both and never picks a winner by arrival order. If they're compatible (different facts in the same bullet), the merger writes one combined entry and drops the two originals. If they disagree on a fact, the merger asks the owner one question and drops the loser.
- **WAIT / dependency never merged**: the entry waits on another entry. It merges once that one does.

## The merge pass

**When:** the owner says "merge", or `check` shows 10 or more open entries, or a thread is about to ship something from the masters and wants clean text (reading through also works, so this is optional).

**How (one session at a time, guarded by `.merge-lock`):**
1. `python3 pending.py check` and fix every FAIL and CONFLICT you can (rebase stale entries, combine compatible overlaps). Ask the owner about real disagreements in one message, with one line per question.
2. `python3 pending.py apply --by "<thread title>"`.
3. About 10 seconds later, re-read each target it lists. If a write didn't stick, run `apply` again. Entries already merged are skipped.
4. Add a line to the revision log in your main master doc that names what merged, and update the doc map if a new file was added. The merge pass may edit the master directly. Then run `python3 pending.py baseline` so the merge pass's own edits don't show up as DRIFT.
5. Report in one line: what merged, what was held and why, and any question for the owner.

Fully applied inbox files move to `merged/`, which serves as the changelog. Files with held entries stay here until they're fixed.

## Risks and safeguards

| Risk | Safeguard |
|---|---|
| A thread ignores the rule and edits a master directly | Project rule plus the thread prompt. `check` also hashes the masters after every merge and flags **DRIFT** when one changed outside a merge, so the edit gets caught at the next check. |
| A merge or script bug damages a master | `apply` copies every file it touches to `merged/backup/<time>/` first. Exact-text anchors mean an entry applies only where its base text matches, once. |
| Two merges start at once | `.merge-lock` is created exclusively, then re-read after 3 seconds to confirm this session holds it. A lock older than 30 minutes is treated as abandoned. |
| A merged write is lost on the network mount | The merge re-reads each target about 10 seconds later. Rerunning `apply` is safe. |
| The inbox piles up and nobody merges | `check` flags entries older than 3 days and says to merge once 10 or more are open. |
| Two entries contradict each other in different places (the script only sees overlapping text) | The merge pass reads all entries for a section together and asks the owner instead of guessing. |
| Work uses an unmerged entry that later gets dropped | Entries hold only what the owner said or approved, and inferred text gets [CONFIRM]. When dropping an entry, the merge pass tells the owner what already used it. |
| A thread misses a fact because another thread hasn't written it down | Threads write entries as soon as the owner confirms a fact, and read the other thread when needed. A decision that only exists in the owner's head is still a gap. |

The rule can't be enforced technically, because any thread with folder access can still write to the masters. DRIFT detection catches these edits; it doesn't prevent them.

## Using this in other projects

Copy `pending.py` and this README into any shared folder of plain-text docs (specs, decision logs, research notes), and point the script at it with `--root <docs dir> --inbox <inbox dir>`. For code, git already does this: give each thread its own branch and PR and let CI and review do the checking. Use this inbox only for the shared docs that live outside the repo.
