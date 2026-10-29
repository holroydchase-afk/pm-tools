# INTAKE for every product project: studio security kit

_From Product Studio, 2026-10-24 (security audit, [docs/security/2026-10-24-audit.md](../security/2026-10-24-audit.md)). Paste the block into each product project: ccwatts, Role Radar, Energy Scanner, Charlie, Crew Clock, Hearth. Each one adds its own line from "Per product" below into the paste where it says so._

```
INTAKE from Product Studio: install the studio security kit (Chase approved, Oct 24 audit)
Why: Chase asked for secret scanning and the rest set up in every repo. The audit found no leaked secrets in any repo's history, but no repo runs a secret, dependency or code scan in CI, and Dependabot alerts are off everywhere. The kit lives in studio-agents (scripts/install-security.sh, templates/security/).
Do, in one PR in this repo, with the privacy-security agent:
1. Clone holroydchase-afk/studio-agents next to this repo (main, after the security kit PR merges) and run: bash ../studio-agents/scripts/install-security.sh .
   It adds .github/workflows/security.yml (gitleaks over full history, privacy scan, dependency review on PRs), .github/workflows/codeql.yml, .github/dependabot.yml, .github/privacy-scan.py and SECURITY.md, and never overwrites a file you already have. If you already have a dependabot.yml, merge the kit's entries into it by hand.
2. Run python3 .github/privacy-scan.py . and gitleaks if you can. Fix real personal data; put known-safe matches (sample data) as regex lines in .privacy-allow.
3. Make sure .gitignore lists .env and .env.* (keep !.env.example if you have one).
4. Do the product line below.
5. Update HANDOFF.md (and the "Portfolio / public presence" section if the public demo changes). PR title: "Security kit". Reply with the PR link and CI result.
Product line: <paste your product's line here>
Settings toggles (Dependabot alerts, push protection, private reporting) are Chase's, listed in pm-tools STUDIO-STATUS.md. Don't ask him again.
```

## Per product
- **ccwatts:** `npm audit` shows 6 dev-only findings (2 critical: vitest and tinypool; high: vite; moderate: esbuild, @vitest/mocker, vite-node). Upgrade vitest (and with it vite and esbuild) to a patched major, keep `npm test` green, and note the bump in the PR (dev dependency, no runtime change).
- **Role Radar:** `npm audit` shows 1 high, a direct dependency: js-yaml prototype pollution through `<<` merge keys. Bump js-yaml to the patched version and add a test that a `<<` key in criteria.yaml can't touch `Object.prototype`.
- **Energy Scanner:** `npm audit` is clean. `.gitignore` has no `.env` line; add it. The default branch is `claude/project-thread-xq47vx`, not `main`, so set the kit's `push: branches:` in security.yml and codeql.yml to that branch too (`[main, claude/project-thread-xq47vx]`) until Chase renames it (his settings list).
- **Charlie:** no Python dependency is pinned (`requirements.txt` uses `>=`). Add `pip-audit -r requirements.txt` to CI (or as a step in security.yml) and pin with a lockfile when the stack settles. The two open PRs (#1, #2) touch CI: land the kit after them, or rebase it.
- **Crew Clock:** already has a dependabot.yml for /messenger and Actions; add an npm entry for `/` if the root package.json gets dependencies. `npm audit` in /messenger shows 1 moderate (esbuild), which Dependabot PR #17 fixes: merge it.
- **Hearth (private repo):** keep only the `secrets` job of security.yml and the dependabot.yml (with npm entries for /app and /e2e). Delete codeql.yml, the `privacy` and `dependencies` jobs and SECURITY.md: CodeQL and dependency review need paid GitHub Code Security on a private repo, and the privacy scan flags 48 matches that are test fixtures and research notes, which is fine while the repo is private. Add a `permissions: contents: read` block to ci.yml (it has none, so it runs with the default token scope). `npm audit` in /app shows 12 (6 high, all Expo SDK transitive, fixed by the next Expo SDK bump): schedule that after the Nov 22 beta, not before. If Hearth ever goes public, run the privacy scan first.
