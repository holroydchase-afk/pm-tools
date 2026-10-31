# Feed fixtures (PMT-M3.1)

Made-up sample data for `tests/feed.test.ts` (CON-1 to CON-7). No real people, emails or links.
Fixed clock: `now = 2026-10-31T12:00:00Z`. Hand counts the tests check live in the test file's comments.

- `goals.json`: a frozen copy of the root `goals.json`, so editing the real goals doesn't move the counts.
- `products.json`: repos, open PRs, intake issues, and which file holds each HANDOFF and run log. PMT-M3.3 adds `group` (pm-tools is a studio tool) and `merged` (recent merges for Horizon's Done column; one is older than 7 days).
- `handoff-*.md`: pm-tools and role-radar have a status header; ccwatts has none.
- `runlogs/<repo>/<branch with / as ->.log`: agent-run logs, including junk lines and old entries.
- `studio-status.md`: a STUDIO-STATUS snippet; it names `family-vault`, a made-up private repo.
