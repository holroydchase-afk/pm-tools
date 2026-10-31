# Studio status

_The one cross-project list of what's done and what's waiting on Chase. Every product repo's HANDOFF.md links it. Last checked: 2026-10-29 03:45 UTC, against GitHub (merged PRs and Actions deploys)._

Before asking Chase to do something, check this file and the repo's own `HANDOFF.md`. If it's under "Done", it's done. If it's under "Waiting on Chase", it has already been asked.

**New project?** Start with [docs/ONBOARDING.md](docs/ONBOARDING.md): the two pastes, repo setup, the studio agents and when to use them, the recruiter-ready bar, shifts and the story log.

## Done
**Portfolio and domain**
- chaseholroyd.com is live: domain (Porkbun), DNS and the Pages custom domain are set. The repo is `holroydchase-afk.github.io` (renamed from `portfolio` on Oct 21), so each repo's Pages site serves at chaseholroyd.com/<repo>/.
- Pages: Work, Studio, Role Radar, ccwatts, Energy Scanner, How I keep it all moving (PM tools), family photo app ("name coming"), About, Resume, 404. Share card, SEO and the Staff PM hero are merged (WEB-M2.1, M2.2, M2.5).
- License audit done in every repo (Oct 21).

**Live demos (no login, sample data only)**
- Role Radar: chaseholroyd.com/role-radar/, built and deployed from the role-radar repo. The portfolio page links it, and the old /demo/role-radar/ snapshot is deleted (portfolio PR #14, merged Oct 22).
- Hearth (placeholder name): chaseholroyd.com/demo/hearth/, a no-login demo of a made-up family that lives only in the browser. It's copied into the portfolio repo from Hearth's `app/dist-demo-site/`, and family-photos.html has been refreshed with "Try the demo" and screenshots (portfolio PR #15, merged Oct 22). Neither expo.app nor the repo is linked.
- Home page (WEB-M5.5, portfolio PR #16, merged Oct 23): numbered AI journey plus the Patter, ADT and Palmetto career cards. Page checks in CI and a 404 noindex (WEB-M4.9, #20, merged Oct 23).
- Oct 23-24: prose resume (WEB-M5.6, #19), Studio page (WEB-M6.1, #17), ADT card naming (#21) and the senior Staff-PM voice rewrite (WEB-M5.7, #22) merged and deployed. HTTPS verified Oct 24 02:31Z: the certificate is valid and Enforce HTTPS is on.
- ccwatts playground: chaseholroyd.com/ccwatts/ (Pages is on; deploys from `main` have succeeded since Oct 21).
- Energy Scanner: chaseholroyd.com/energy-scanner/ (Pages is on; first deploy succeeded Oct 21 23:32 UTC). The portfolio's Energy Scanner page links it (ES-M2.3, portfolio PR #8, merged Oct 21).
- Build Slate and Near-Term Roadmap: chaseholroyd.com/pm-tools/build-slate/ and /pm-tools/roadmap/.

- Role Radar (Oct 22-23): recruiter-ready fixes (PRs #20-#25), dream-role scoring (#16) and the job description preview (#18) merged; the private live page was republished with all of them.
- Recruiter-ready sprint (Oct 22): sprint v2 pasted into every product project; portfolio PR #10 (deploy allowlist, hero tense, resume CTA, CI checks), pm-tools PR #8 (demo seeds) and studio-agents PR #6 (deeper ux-reviewer) merged and deployed.

**Charlie**
- MVP (stock and options idea helper, paper trading only) pushed to the `charlie` repo on Oct 23. On the Build Slate since the intake; not on the portfolio yet.

**Studio setup**
- Oct 29: open-PR cleanup. Merged pm-tools #24 (security audit) and #28 (STU-DEC-1 messenger, AGPL-3.0), studio-agents #11 (Supabase starter) and #12 (security kit), and portfolio #24 (security kit). Closed with a note, branches kept: pm-tools #27 (steering loop on hold), #5 (resume lint, a feature under the Polish Freeze), #25 (stale status, folded in here); portfolio #23 and #25 (stale voice drafts, see its HANDOFF.md).
- Oct 24: security audit of all 9 repos. No leaked secrets in any history (gitleaks) and no personal data on public repos or the site. Security kit (gitleaks, privacy scan, dependency review, CodeQL, Dependabot) built in studio-agents; product projects install it from [docs/intakes/security-kit.md](docs/intakes/security-kit.md).
- Oct 23: Hearth's messenger becomes a shared library, not its own product (pm-tools `DECISIONS.md` STU-DEC-1). Hearth's project is extracting it into `packages/messenger` now (started Oct 26, ahead of the Nov 22 beta). Crew Clock is the second user (Chase, Oct 23), then others. License: AGPL-3.0 (Chase, Oct 26).
- Oct 23: Charlie (CHL) and Crew Clock (CRW) taken in: added to the ownership table below, the live Build Slate (Charlie replaces the Stock Agent card; Crew Clock added) and the product inventory. Both repos are public and still need their `M0.1: studio setup` PR.
- Oct 23: new-project onboarding kit (pm-tools docs/ONBOARDING.md), stack guide (STACK.md, #15) and agents used by default (studio-agents #7) merged.
- Shared agents (studio-agents) are merged into ccwatts, Role Radar and Energy Scanner. Session rules (HANDOFF hook, handoff-check workflow) are in those three and the portfolio.
- ccwatts recruiter-ready PRs #22-#29 merged to main Oct 22; the Pages deploy succeeded (run 39831937429). PR #2 is closed.
- ccwatts v1 (CCW-M1.1 to M1.9) is merged. The Energy Scanner v1 stack and ES-M2.1 (bedtime flow) are merged.

## Waiting on Chase
- **GitHub settings still off** (checked by API on Oct 31; click paths under "GitHub settings" below): private vulnerability reporting and Dependabot security updates on all 8 public repos, secret scanning and push protection on Charlie, push protection on Crew Clock. Optional: rename Energy Scanner's default branch to `main` and protect `main`.
- Portfolio WEB-M4.8: add a "Jan 2026 – present" line to the resume page? (recruiter-ready review, Oct 22)
- Portfolio WEB-M2.6: LinkedIn Featured link and headline (the headshot is on the site since Oct 26).
- ccwatts CCW-M2.1: one run on real logs on the laptop.
- ccwatts name (P1): the availability check is clear (npm, PyPI and crates.io unclaimed; nothing on the web, GitHub or trademarks). Not locked: say "lock" to make it final.
- Energy Scanner: a publishable photo for README screenshots; its CLAUDE.md still says "never deploy" although Pages is now on.
- Role Radar: try "Import from Gmail" on the live page.
- Hearth: the new name.
- Portfolio: three [check] answers unlock the Patter and ADT case studies (WEB-M5.4): Patter's URL, who uses Energy Scanner, Role Radar and ccwatts today, and whether "about an hour a night" is OK to publish.
- Studio: paste the onboarding kit into Charlie and Crew Clock (docs/ONBOARDING.md, "The two pastes", or `/onboard` once that skill is saved; tailored first messages were given in the Product Studio intake thread, Oct 23), and the refresh paste into the existing product projects.
- Charlie: one laptop run on real Cboe and SEC data (the cloud blocks market-data hosts), plus the next-feature pick: earnings or alpaca (Power Hour, Oct 22).
- Crew Clock: Supabase setup (docs/SETUP.md steps 1.1 to 1.4) before the crew beta.

- Every project: paste the Intake check setup once (docs/INTAKE.md, "The paste"; Chase approved Oct 30). Product Studio's own check is already scheduled.

## GitHub settings (Chase's account and repo config)
Every GitHub setting Chase changes is logged here with its date, so no thread asks twice. Threads can read these settings through the API but can't change them.

| Date | Setting | Where | Why |
|---|---|---|---|
| 2026-10-31 | Dependency graph on | pm-tools, holroydchase-afk.github.io (both `dependencies` checks re-ran green) | Lets GitHub map each repo's packages. It powers the `dependencies` PR check (fails a PR that adds a package with a known vulnerability) and Dependabot alerts. Until it was on, that check was red on every PR. Verified green on the pm-tools #48 re-run. |
| 2026-10-24 | Pages custom domain chaseholroyd.com, Enforce HTTPS | holroydchase-afk.github.io, Settings → Pages | The portfolio's domain (Porkbun DNS). |

State on 2026-10-31 (API check of the public repos): secret scanning and push protection are on everywhere except Charlie (both off) and Crew Clock (push protection off). Dependabot security updates and private vulnerability reporting are off everywhere. Hearth is private, so its settings aren't readable here.

Still to switch on, one page per repo (Settings → Code security):
```
https://github.com/holroydchase-afk/pm-tools/settings/security_analysis
https://github.com/holroydchase-afk/holroydchase-afk.github.io/settings/security_analysis
https://github.com/holroydchase-afk/studio-agents/settings/security_analysis
https://github.com/holroydchase-afk/ccwatts/settings/security_analysis
https://github.com/holroydchase-afk/role-radar/settings/security_analysis
https://github.com/holroydchase-afk/energy-scanner/settings/security_analysis
https://github.com/holroydchase-afk/charlie/settings/security_analysis
https://github.com/holroydchase-afk/crew-clock/settings/security_analysis
```
On each: Private vulnerability reporting → Enable, and Dependabot security updates → Enable. On Charlie also Secret scanning and Push protection → Enable; on Crew Clock, Push protection → Enable.

## Next without Chase
- Recruiter-ready review (Oct 22): ranked list in holroydchase-afk.github.io `docs/reviews/2026-10-22-recruiter-ready.md`. Overnight: WEB-M4.7 product screenshots, P2 polish.
- Portfolio: WEB-M3.1 (outcomes on the Role Radar and ccwatts pages). After one release, delete the old `demo/energy-scanner/` copy.

## PR queue rule (Oct 31)
New PRs are fine; each names its owning thread and a `Merge after:` line. Threads merge their own PRs on green, oldest first, without asking Chase. The one gate: a merge that changes a live demo or live product (portfolio `main`, a public demo or live app, a release) waits for Chase, and that ask lists the repo's open PRs in merge order. Before merging #N, a thread merges older ones first or warns Chase about any it can't (with its thread). Full rule: studio-agents `docs/session-rules.md`, "Pull requests"; the PR QUEUE block in [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Who owns which repo
| Repo | Owning project |
|---|---|
| ccwatts | ccwatts |
| role-radar | Role Radar |
| energy-scanner | Energy Scanner |
| Hearth | Hearth |
| charlie | Charlie |
| crew-clock | Crew Clock |
| holroydchase-afk.github.io (portfolio), pm-tools, studio-agents, and anything spanning more than one project | Product Studio |

The repo decides who does the work:
- The change lands in a product's repo: that product's project does it.
- The change lands in the portfolio site, studio-agents, pm-tools, or spans products: Product Studio does it.
- Any other project files an intake issue (label `intake`) in the owner's repo, and the owner's "Intake check" scheduled task picks it up ([docs/INTAKE.md](docs/INTAKE.md)). It never edits that repo itself.
- After shipping, the owner logs it in each affected repo's HANDOFF.md.

## How this stays current
- Product projects record progress in their own repo's `HANDOFF.md` (its "Done" and "Portfolio / public presence" sections).
- The Product Studio project refreshes this file from every repo's `HANDOFF.md` and GitHub, and after any portfolio change.
