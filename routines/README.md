# Routines

| Routine | What it does | Proven |
|---|---|---|
| [`night-shift.md`](night-shift.md) | Paste before bed: the coordinator picks the next milestone and schedules one unattended overnight build run that works through milestones in stacked PRs, keeping HANDOFF.md current. | Two overnight runs, Oct 21, 2026 |
| [`shared-doc-inbox/`](shared-doc-inbox/) | An inbox and merge pass for plain-text docs that several AI threads edit at once, so last-write-wins never erases work. `pending.py check / show / apply`. | Career docs edited by 9 threads, Oct 20–21, 2026 |
| Privacy check ([`../scripts/check-private.ts`](../scripts/check-private.ts)) | Fails a commit that contains emails, phone numbers, private app links, task ids or terms from a private denylist kept outside git. | Every public repo in the studio |
