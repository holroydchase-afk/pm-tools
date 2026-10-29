# Studio status

_The one cross-project list of what's done and what's waiting on Chase. Every product repo's HANDOFF.md links it. Last checked: 2026-10-24 05:00 UTC, against GitHub (merged PRs and Actions deploys)._

Before asking Chase to do something, check this file and the repo's own `HANDOFF.md`. If it's under "Done", it's done. If it's under "Waiting on Chase", it has already been asked.

**New project?** Start with [docs/ONBOARDING.md](docs/ONBOARDING.md): the two pastes, repo setup, the studio agents and when to use them, the recruiter-ready bar, shifts and the story log.

## Done
**Portfolio and domain**
- chaseholroyd.com is live: domain (Porkbun), DNS and the Pages custom domain are set. The repo is `holroydchase-afk.github.io` (renamed from `portfolio` on Oct 21), so each repo's Pages site serves at chaseholroyd.com/<repo>/.
- Pages: Work, Role Radar, ccwatts, Energy Scanner, How I work (PM tools), family photo app ("name coming"), About, Resume, 404. Share card, SEO and the Staff PM hero are merged (WEB-M2.1, M2.2, M2.5).
- License audit done in every repo (Oct 21).

**Live demos (no login, sample data only)**
- Role Radar: chaseholroyd.com/role-radar/, built and deployed from the role-radar repo. The portfolio page links it, and the old /demo/role-radar/ snapshot is deleted (portfolio PR #14, merged Oct 22).
- Hearth (placeholder name): chaseholroyd.com/demo/hearth/, a no-login demo of a made-up family that lives only in the browser. It's copied into the portfolio repo from Hearth's `app/dist-demo-site/`, and family-photos.html has been refreshed with "Try the demo" and screenshots (portfolio PR #15, merged Oct 22). Neither expo.app nor the repo is linked.
- Home page (WEB-M5.5, portfolio PR #16, merged Oct 23): numbered AI journey plus the Patter, ADT and Palmetto career cards. Page checks in CI and a 404 noindex (WEB-M4.9, #20, merged Oct 23).
- ccwatts playground: chaseholroyd.com/ccwatts/ (Pages is on; deploys from `main` have succeeded since Oct 21).
- Energy Scanner: chaseholroyd.com/energy-scanner/ (Pages is on; first deploy succeeded Oct 21 23:32 UTC). The portfolio's Energy Scanner page links it (ES-M2.3, portfolio PR #8, merged Oct 21).
- Build Slate and Near-Term Roadmap: chaseholroyd.com/pm-tools/build-slate/ and /pm-tools/roadmap/.

- Role Radar (Oct 22-23): recruiter-ready fixes (PRs #20-#25), dream-role scoring (#16) and the job description preview (#18) merged; the private live page was republished with all of them.
- Recruiter-ready sprint (Oct 22): sprint v2 pasted into every product project; portfolio PR #10 (deploy allowlist, hero tense, resume CTA, CI checks), pm-tools PR #8 (demo seeds) and studio-agents PR #6 (deeper ux-reviewer) merged and deployed.

**Charlie**
- MVP (stock and options idea helper, paper trading only) pushed to the `charlie` repo on Oct 23. On the Build Slate since the intake; not on the portfolio yet.

**Studio setup**
- Oct 24: security audit of all 9 repos. No leaked secrets in any history (gitleaks) and no personal data on public repos or the site. Security kit (gitleaks, privacy scan, dependency review, CodeQL, Dependabot) built in studio-agents; product projects install it from [docs/intakes/security-kit.md](docs/intakes/security-kit.md).
- Oct 23: Hearth's messenger becomes a shared library, not its own product (pm-tools `DECISIONS.md` STU-DEC-1). Hearth's project is extracting it into `packages/messenger` now (started Oct 26, ahead of the Nov 22 beta). Crew Clock is the second user (Chase, Oct 23), then others. License: AGPL-3.0 (Chase, Oct 26).
- Oct 23: Charlie (CHL) and Crew Clock (CRW) taken in: added to the ownership table below, the live Build Slate (Charlie replaces the Stock Agent card; Crew Clock added) and the product inventory. Both repos are public and still need their `M0.1: studio setup` PR.
- Oct 23: new-project onboarding kit (pm-tools docs/ONBOARDING.md), stack guide (STACK.md, #15) and agents used by default (studio-agents #7) merged.
- Shared agents (studio-agents) are merged into ccwatts, Role Radar and Energy Scanner. Session rules (HANDOFF hook, handoff-check workflow) are in those three and the portfolio.
- ccwatts recruiter-ready PRs #22-#29 merged to main Oct 22; the Pages deploy succeeded (run 39831937429). PR #2 is closed.
- ccwatts v1 (CCW-M1.1 to M1.9) is merged. The Energy Scanner v1 stack and ES-M2.1 (bedtime flow) are merged.

## Waiting on Chase
- **Security toggles** (Oct 24 audit, about 10 min): the numbered list at the end of [docs/security/2026-10-24-audit.md](docs/security/2026-10-24-audit.md). Dependabot alerts for every repo at once, secret scanning and push protection on Charlie, push protection on Crew Clock; optional: rename Energy Scanner's default branch to `main` and protect `main`. Then merge the three security kit PRs (studio-agents, pm-tools, portfolio).
- Portfolio WEB-M4.8: add a "Jan 2026 – present" line to the resume page? (recruiter-ready review, Oct 22)
- Portfolio WEB-M2.3 and M2.4: review the case-study [check] questions (planned Oct 22).
- Portfolio WEB-M2.6: headshot, LinkedIn Featured link and headline.
- ccwatts CCW-M2.1: one run on real logs on the laptop.
- ccwatts name (P1): the availability check is clear (npm, PyPI and crates.io unclaimed; nothing on the web, GitHub or trademarks). Not locked: say "lock" to make it final.
- chaseholroyd.com HTTPS: open https://chaseholroyd.com/ccwatts/ on your phone and confirm there's no certificate warning. The cloud can't check it (it gets GitHub's *.github.io certificate).
- Energy Scanner: a publishable photo for README screenshots; its CLAUDE.md still says "never deploy" although Pages is now on.
- Role Radar: try "Import from Gmail" on the live page.
- Hearth: the new name.
- Portfolio: three [check] answers unlock the Patter and ADT case studies (WEB-M5.4): Patter's URL, who uses Energy Scanner, Role Radar and ccwatts today, and whether "about an hour a night" is OK to publish.
- Studio: paste the onboarding kit into Charlie and Crew Clock (docs/ONBOARDING.md, "The two pastes", or `/onboard` once that skill is saved; tailored first messages were given in the Product Studio intake thread, Oct 23), and the refresh paste into the existing product projects.
- Charlie: one laptop run on real Cboe and SEC data (the cloud blocks market-data hosts), plus the next-feature pick: earnings or alpaca (Power Hour, Oct 22).
- Crew Clock: Supabase setup (docs/SETUP.md steps 1.1 to 1.4) before the crew beta.

## Next without Chase
- Recruiter-ready review (Oct 22): ranked list in holroydchase-afk.github.io `docs/reviews/2026-10-22-recruiter-ready.md`. Overnight: WEB-M4.7 product screenshots, P2 polish.
- Portfolio: WEB-M3.1 (outcomes on the Role Radar and ccwatts pages). After one release, delete the old `demo/energy-scanner/` copy.

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
- Any other project writes an INTAKE block and Chase pastes it into the owner. It never edits that repo itself.
- After shipping, the owner logs it in each affected repo's HANDOFF.md.

## How this stays current
- Product projects record progress in their own repo's `HANDOFF.md` (its "Done" and "Portfolio / public presence" sections).
- The Product Studio project refreshes this file from every repo's `HANDOFF.md` and GitHub, and after any portfolio change.
