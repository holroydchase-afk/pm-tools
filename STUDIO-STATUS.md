# Studio status

_The one cross-project list of what's done and what's waiting on Chase. Every product repo's HANDOFF.md links it. Last checked: 2026-10-22 00:05 UTC, against GitHub (merged PRs and Actions deploys)._

Before asking Chase to do something, check this file and the repo's own `HANDOFF.md`. If it's under "Done", it's done. If it's under "Waiting on Chase", it has already been asked.

## Done
**Portfolio and domain**
- chaseholroyd.com is live: domain (Porkbun), DNS and the Pages custom domain are set. The repo is `holroydchase-afk.github.io` (renamed from `portfolio` on Oct 21), so each repo's Pages site serves at chaseholroyd.com/<repo>/.
- Pages: Work, Role Radar, ccwatts, Energy Scanner, How I work (PM tools), family photo app ("name coming"), About, Resume, 404. Share card, SEO and the Staff PM hero are merged (WEB-M2.1, M2.2, M2.5).
- License audit done in every repo (Oct 21).

**Live demos (no login, sample data only)**
- Role Radar: chaseholroyd.com/demo/role-radar/ (a snapshot kept in the portfolio repo).
- ccwatts playground: chaseholroyd.com/ccwatts/ (Pages is on; deploys from `main` have succeeded since Oct 21).
- Energy Scanner: chaseholroyd.com/energy-scanner/ (Pages is on; first deploy succeeded Oct 21 23:32 UTC). The portfolio's Energy Scanner page links it (ES-M2.3, portfolio PR #8, merged Oct 21).
- Build Slate and Near-Term Roadmap: chaseholroyd.com/pm-tools/build-slate/ and /pm-tools/roadmap/.

- Recruiter-ready sprint (Oct 22): sprint v2 pasted into every product project; portfolio PR #10 (deploy allowlist, hero tense, resume CTA, CI checks), pm-tools PR #8 (demo seeds) and studio-agents PR #6 (deeper ux-reviewer) merged and deployed.

**Charlie**
- MVP (stock and options idea helper, paper trading only) pushed to the private repo `charlie` on Oct 23. Not on the Build Slate or portfolio.

**Studio setup**
- Shared agents (studio-agents) are merged into ccwatts, Role Radar and Energy Scanner. Session rules (HANDOFF hook, handoff-check workflow) are in those three and the portfolio.
- ccwatts v1 (CCW-M1.1 to M1.9) is merged. The Energy Scanner v1 stack and ES-M2.1 (bedtime flow) are merged.

## Waiting on Chase
- Portfolio WEB-M4.8: add a "Jan 2026 – present" line to the resume page? (recruiter-ready review, Oct 22)
- Portfolio WEB-M2.3 and M2.4: review the case-study [check] questions (planned Oct 22).
- Portfolio WEB-M2.6: headshot, LinkedIn Featured link and headline.
- ccwatts CCW-M2.1: one run on real logs on the laptop.
- Energy Scanner: a publishable photo for README screenshots; its CLAUDE.md still says "never deploy" although Pages is now on.
- Role Radar: try "Import from Gmail" on the live page.
- Hearth: the new name.
- Charlie: one run on the laptop with real data (Cboe and SEC have only been tested against fixtures), plus two picks: Build Slate add or side, and next feature earnings or alpaca (Power Hour, Oct 22).

## Next without Chase
- Recruiter-ready review (Oct 22): ranked list in holroydchase-afk.github.io `docs/reviews/2026-10-22-recruiter-ready.md`. Overnight: WEB-M4.7 product screenshots, P2 polish.
- Portfolio: WEB-M3.1 (outcomes on the Role Radar and ccwatts pages). After one release, delete the old `demo/energy-scanner/` copy.

## Who owns which repo
| Repo | Owning project |
|---|---|
| ccwatts | ccwatts |
| Role-Radar | Role Radar |
| energy-scanner | Energy Scanner |
| Hearth | Hearth |
| charlie | Charlie |
| holroydchase-afk.github.io (portfolio), pm-tools, studio-agents, and anything spanning more than one project | Product Studio |

The repo decides who does the work:
- The change lands in a product's repo: that product's project does it.
- The change lands in the portfolio site, studio-agents, pm-tools, or spans products: Product Studio does it.
- Any other project writes an INTAKE block and Chase pastes it into the owner. It never edits that repo itself.
- After shipping, the owner logs it in each affected repo's HANDOFF.md.

## How this stays current
- Product projects record progress in their own repo's `HANDOFF.md` (its "Done" and "Portfolio / public presence" sections).
- The Product Studio project refreshes this file from every repo's `HANDOFF.md` and GitHub, and after any portfolio change.
