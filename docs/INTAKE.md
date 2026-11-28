# Intakes as GitHub issues

Since Oct 30 (Chase), cross-project work travels as GitHub issues, not chat pastes. Projects can't see each other's chats, but every project can read GitHub. Chase no longer carries INTAKE blocks between projects; each project pastes one routine once (below) and picks up its own intakes.

## Sending an intake
1. The repo decides the owner (STUDIO-STATUS, "Who owns which repo"). File the issue in **that repo**.
2. Search the repo's open `intake` issues first. Don't file a duplicate; comment on the open one instead.
3. Title: `INTAKE: <one-line ask>`. Label: `intake` (GitHub creates it on first use). Body:

```
From: <sending project>, <YYYY-MM-DD>
Ask: <one sentence>
Why: <one sentence; whose call it was>
Facts: <URLs, PRs, numbers, file paths; all true today>
Done when: <a checkable result>
Reply: <what the sender needs back, or "none">
```

4. Most product repos are **public**: no personal data, real names, emails, claude.ai links, artifact, trigger or environment ids. Keep anything private in the sender's project memory and say "ask Chase" in the issue.
5. Tell Chase in one line that it's filed (link), not as a paste.

## Picking intakes up (the routine)
Each project runs a scheduled task that lists open `intake` issues in the repos it owns:
- None open: stop at once. A quiet check costs one GitHub call.
- One open: comment `Picked up by <project>`, check whether it is already done (merged PRs, HANDOFF.md). If done, comment the evidence and close it as completed.
- Otherwise do it the normal way (staff-pm scopes, qa-tdd, a PR that says `Closes #<n>`, HANDOFF.md updated). One intake per run, oldest first.
- Needs Chase (a purchase, login, product call, or a step that can't be undone): comment what's needed, add the `needs-chase` label, and put it in HANDOFF.md under Blockers so the digest shows it. Never sit on it.
- The routine never merges to `main` on its own unless that repo's rules already allow it.

Reply to the sender happens on the issue (the sender's routine or digest reads it), so no chat relay is needed.

## The inbox rule (every turn, not only 4 times a day)
The scheduled check is the safety net. The inbox is also read by the coordinator itself (Chase, Nov 23: "couldn't we build an mcp so you can talk to the other coordinators"; answer: no MCP, the GitHub issue list already is the shared inbox, and every project can read it). The rule text to keep in each project's instructions (also in ONBOARDING block 1):

```
INBOX: At the start of every thread, and before asking Chase anything, list open GitHub issues labeled intake in the repos this project owns (pm-tools STUDIO-STATUS, "Who owns which repo"). Anything open is already asked: act on it or reply on it, don't ask Chase. To hand work to another project, file an intake issue in that project's repo, or in pm-tools for Product Studio work (docs/INTAKE.md), and give Chase the link, never a paste. Replies come back as comments on the same issue; check them the same way.
```

How it works:
- **One inbox per repo, one label.** The issue lives in the owner's repo, so the repo is the address and the `intake` label is the inbox. A label per target project would say the same thing twice, so there isn't one. `needs-chase` marks one that waits on him.
- **Product Studio's inbox is pm-tools.** Product projects' GitHub access covers only their own repo plus pm-tools (live case: Role Radar could not read studio-agents, Nov 23). So an intake for Product Studio work (portfolio site, studio-agents, pm-tools, anything spanning products) is filed in **pm-tools**, with the target repo named in the title, e.g. `INTAKE: studio-agents: ...`. Never in studio-agents or the site repo, where the sender can't see replies.
- **Reading is one call.** `list_issues` with `labels: ["intake"]`, `state: OPEN` on each owned repo. None open means carry on with no reply.
- **Product Studio owns several repos** (portfolio site, pm-tools, studio-agents): it reads the `intake` list in pm-tools (the shared inbox) and in each of the three.
- **Replies are comments on the issue.** The sender looks at its filed intakes' comments on its next turn; done is the issue closed as completed with the evidence.
- **Limits, plainly:** it is pull, not push. A project learns of an intake when its next thread starts or its scheduled check runs, not the instant it is filed. A live push between sessions would need a server and a credential, which this studio doesn't run; revisit only if the delay hurts.

## Keeping the inbox from stacking up (Nov 27, Chase)
Twenty-three intakes were open across pm-tools, studio-agents and the portfolio. Four rules stop that:
1. **Supersede means close.** An intake that replaces an older one names it ("Supersedes #n") and the sender closes the old one as a duplicate in the same step. The Hearth page refresh went through four open intakes (#49, #51, #55, #66) before this rule.
2. **Audits are reports, not intakes.** A one-time drift or quality check goes in the project files or a `docs/` report. Only an ask with a checkable "Done when" is an intake. Ongoing drift is caught by the `factory-check` claims gate (pm-tools intake #85, Gate 1), not by hand-filed issues.
3. **Portfolio intakes batch into one PR per night.** Live-site changes ride the release train, so Product Studio picks up every open portfolio intake in one run and ships one PR that says `Closes #a, #b, #c`. Label it for release so the nightly run (1:17 AM Eastern) ships it once it is green; drafts and do-not-merge PRs are held.
4. **The Intake check closes what is done or moot.** Each run closes finished, superseded or moot intakes with a comment (reopenable), and labels any intake older than 7 days `stale` so the digest shows it. Hidden products (the Nov 25 prune) count as moot.

## The paste (once per project)
Chase pastes this into each project's chat once. It schedules the routine and switches the project to filing intakes as issues. The same text lives in Chase's thread; keep the two in sync.

```
Set up the studio intake routine (pm-tools docs/INTAKE.md, Chase approved Oct 30):
1. Create a scheduled task for this project, 4 times a day (8am, noon, 4pm, 8pm ET), named "Intake check". Its prompt: "List open GitHub issues labeled intake in the repos this project owns (STUDIO-STATUS 'Who owns which repo'). If none, stop now with no reply. Otherwise take the oldest one and follow pm-tools docs/INTAKE.md 'Picking intakes up': comment that you picked it up, close it with evidence if it's already done, else do it with the studio agents in a PR that says Closes #n and updates HANDOFF.md. If it needs me, comment, label needs-chase and add it to HANDOFF Blockers. One intake per run."
2. Save to project memory: "Intakes travel as GitHub issues labeled intake in the owning repo (pm-tools docs/INTAKE.md). Never hand Chase an INTAKE paste; file the issue and send him the link."
3. Run the check once now and reply with the task's schedule and what it found.
```
