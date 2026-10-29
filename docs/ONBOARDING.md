# New project onboarding

_How a new product project joins Chase's studio in one paste. Owner: Product Studio (change it with a PR here). Last reviewed: 2026-10-23._

**Fastest way:** in the new project, run **`/onboard`** (the studio-agents `onboard` skill). It reads this page, checks the repo, sets up what's missing in one PR, schedules shifts, starts the story log, writes the INTAKE and hands Chase the project-instructions paste. In an existing project, `/onboard refresh` adopts anything new here.

Without the skill, Chase pastes two blocks (see [The two pastes](#the-two-pastes)) and the project sets itself up from this page. Existing projects can use the [refresh paste](#refresh-paste-for-existing-projects).

## 1. What you're part of
- **A portfolio.** Chase is a senior PM job hunting. Every product is a demoable v1 shown at **chaseholroyd.com**: a recruiter or hiring manager opens it from the portfolio and it works, looks finished and tells one true story.
- **Hosting.** Public repo `holroydchase-afk/<repo>`, GitHub Pages deployed by Actions from `main`, served at **chaseholroyd.com/&lt;repo&gt;/** with no DNS work. Stack and hosting defaults: [`STACK.md`](../STACK.md). A private repo needs a one-line reason; it still gets everything below except Pages until it has a public demo.
- **Other projects.** ccwatts, Role Radar, Energy Scanner, Hearth, Charlie, Crew Clock, and **Product Studio**, which owns the portfolio site, pm-tools and studio-agents. Projects can't see each other's chats, files or memory; shared facts live on GitHub.
- **Where things stand studio-wide:** [`STUDIO-STATUS.md`](../STUDIO-STATUS.md). Read it before asking Chase anything.

## 2. Studio rules (short form)
The full text is the project instructions paste below; it's the same in every project.
- **Effort:** do it yourself. When Chase is truly needed, one step: an exact link, a fenced copy box with the click path, or a one-word question with your pick.
- **Tone:** introduce yourself by role the first time you talk to Chase in a thread ("Hi, I'm Crew Clock's staff PM"); warm, short, answer first.
- **Honesty about access:** never say you opened or tested something you didn't load this session. Blocked host: say so in the first line and give the domain(s) in a copy box.
- **Never sit blocked:** flag it, keep working on what you can.
- **Ownership:** the repo decides who does the work. Changes to the portfolio site, pm-tools or studio-agents go to Product Studio as an **INTAKE block** (format below) that Chase pastes. Never edit those repos yourself.
- **Token hygiene:** memory under ~40 lines, one thread per stream of work, read only the doc section you need.

## 3. Repo setup (day one, one PR: `M0.1: studio setup`)
| File | What goes in it | Source |
|---|---|---|
| `CLAUDE.md` | What it is, who it's for, hard rules, stack and test commands, plus the **Studio agents** section | pm-tools `templates/CLAUDE.md` + studio-agents `templates/CLAUDE-agents.md` |
| `HANDOFF.md` | Done, In progress, Exact next step, Decisions to review, Blockers, and **Portfolio / public presence** (see below) | pm-tools `templates/HANDOFF.md` |
| `PLAN.md` | Milestones and tasks with [planning IDs](https://github.com/holroydchase-afk/studio-agents/blob/main/docs/planning-ids.md): `M1` outcome, `M1.1` one PR, branch `m1.1-slug`, PR `M1.1: …`. Your code is in that doc (Charlie `CHL`, Crew Clock `CRW`). `M1` is "recruiter-demoable v1". | staff-pm writes it |
| `docs/product/ACCOUNTS.md` | Every outside account, its login, where the name is baked in, rename cost, and the "Decide the name before" list. No secrets | pm-tools `templates/ACCOUNTS.md` |
| `docs/architecture/` | Only if the product stores or moves anyone's data: writing rules, system overview, data flow, threat model | pm-tools `templates/architecture/` |
| `.claude/agents/` | The studio team | studio-agents `scripts/sync.sh <repo>` |
| `.claude/settings.json`, `.github/workflows/handoff-check.yml`, `scripts/check-agents.sh`, `scripts/check-logs.mjs`, `studio-checks.json` | Prints HANDOFF.md into every session; fails a PR that doesn't update it; checks the CLAUDE.md agent table against `.claude/agents/` and that no `console.*` call logs keys, URLs, emails or raw errors (set the log roots in `studio-checks.json`; run both from the test script and CI) | studio-agents `scripts/install-rules.sh <repo>` |
| `.github/workflows/ci.yml` | On every PR: install, typecheck, test, build, privacy check. CI badge at the top of the README | STACK.md "Always" |
| `.github/workflows/pages.yml` | Deploys the demo from `main`, only after CI passes | Copy from energy-scanner or ccwatts |
| `.github/dependabot.yml` | npm and Actions, weekly, minor and patch grouped | STACK.md |
| `README.md` | What it is, why Chase built it, "Try the demo" link, screenshot, CI badge, license (MIT) | positioning drafts it |

To read pm-tools and studio-agents, attach them read-only to the session (both are public) or clone them.

**HANDOFF.md "Portfolio / public presence" section** (copy this shape from ccwatts): the portfolio page URL, the live demo URL and how it deploys, what the demo data is, a link to STUDIO-STATUS, then one dated line per change to the public demo or portfolio page. The morning digest and Product Studio read this section.

## 4. Studio agents: use them by default
Agents only help if the session calls them. Hearth uses them best because its main session is a **chief of staff** that delegates every piece of work instead of doing it, and CI fails when its roster drifts. Every repo gets the same: the **Studio agents** section in CLAUDE.md (studio-agents `templates/CLAUDE-agents.md`), and `agents-check.yml`, which fails a PR with no `Agents:` line or a code PR that doesn't name `qa-tdd`.

**Install** (pick one; copy is the default because it works in cloud sessions with no setup and the agents are visible in the repo):
- Copy: from a studio-agents clone, `scripts/sync.sh ../<repo>` (skips orchestrator and focus-coach) then `scripts/install-rules.sh ../<repo>` (HANDOFF hook, handoff-check, agents-check, check-agents.sh, check-logs.mjs). Re-run `sync.sh` to pick up improvements.
- Plugin: add `extraKnownMarketplaces` `chase-studio` (github `holroydchase-afk/studio-agents`) and `"enabledPlugins": { "studio@chase-studio": true }` to `.claude/settings.json`.

**When to use which** (delegate with the Agent tool, without waiting for Chase to ask):
| Moment | Agent |
|---|---|
| Start of every session or scheduled run; a new milestone or feature; ranking review findings | `staff-pm` |
| Before building a fix or feature (failing test first); before any PR is marked ready (all suites 3x) | `qa-tdd` |
| Building, once the failing test exists | `engineer` |
| Any screen, word or CLI output a user sees; before anything goes public (showcase review mode) | `ux-reviewer` |
| Personal data, sign-in, secrets, money, location, telemetry; before a public demo, deploy or repo going public | `privacy-security` |
| A new dependency, vendor, paid service, schema change or CI/deploy workflow; picking this project's stack rung | `architect` |
| README, landing or portfolio copy; a name or tagline; after each milestone, the "why I built it" story | `positioning` |
| End of any turn where Chase made a call, a plan changed or a lesson was learned (in the background) | `story-keeper` |

One task, in order: staff-pm, qa-tdd (red), engineer, qa-tdd (green, 3x), ux-reviewer and privacy-security if users or the public will see it, positioning for any copy, story-keeper whenever a call or lesson is worth logging. Every PR body ends with `Agents: staff-pm scoped M1.2; qa-tdd red then green, 3x; ux-reviewer no P0/P1` (or why none ran). `orchestrator` and `focus-coach` are Product Studio's; don't sync them.

## 5. The recruiter-ready bar (definition of done for M1)
- A recruiter on a phone with 90 seconds and a hiring manager on a laptop with 5 minutes can open it from chaseholroyd.com and understand it.
- **No login. Sample data only**, labeled as sample, saved only in the visitor's browser. No real people, accounts or keys. No backend for a demo.
- Works at 390x844 and 1280x800, light and dark; WCAG 2.2 AA; no console errors or dead links; no "coming soon" or TODOs.
- One story: portfolio page, demo, README, screenshots and Build Slate agree on stage, features and numbers. A contradiction is a P0.
- A way back to chaseholroyd.com from the demo.
- Checked by ux-reviewer (showcase review), qa-tdd and privacy-security before Chase is asked to put it on the portfolio. Findings ranked by staff-pm in `docs/reviews/<date>-recruiter-ready.md`.

## 6. Shifts and the morning digest
- **Build shifts.** The project schedules its own runs (America/New_York) in the thread that owns the build: night 2:15am, morning 7:20am, afternoon 12:20pm. Each run's prompt is the OVERNIGHT RUN part of pm-tools [`routines/night-shift.md`](../routines/night-shift.md), with THE BIG PICTURE set to section 1 above, this repo's hard rules added, and GOAL: "First finish HANDOFF.md's exact next step. Then do what staff-pm ranks as top priority from PLAN.md. If Chase gave a steer for tonight, it wins." Every run starts with staff-pm and uses the agents per section 4.
- **Digest.** Chase reads only Product Studio's 6:30am digest, not project threads. The digest reads each repo's HANDOFF.md (Exact next step, Blockers, Portfolio / public presence) and open PRs, so anything Chase needs to see goes there. Your repo gets into the digest when Product Studio adds it to the ownership table in STUDIO-STATUS (send that in your first INTAKE).
- **Waiting on Chase:** put it under Blockers in HANDOFF.md as one step. Check STUDIO-STATUS first so you don't re-ask.

## 7. Story log
Keep a private claude.ai artifact titled **"Atlas Story: &lt;project name&gt;"** (create it the first time, mining the project's history). After any notable decision, fix or pivot, especially one driven by Chase's prompting or a lesson learned, append: date, title, problem, Chase's call, decision and why, result, one-line story angle. Under 120 words, no secrets or personal data. Mirror it to `docs/STORY.md` if the repo has one. Product Studio mines these for the portfolio and LinkedIn. The `story-keeper` agent writes the entries: the main session hands it what just happened at the end of any turn with a call, pivot, win or lesson (in the background), then appends the entry it returns to the artifact. It replies `No entry` for routine turns and never logs the same moment twice.

## 8. INTAKE block (for work Product Studio owns)
```
INTAKE for Product Studio (from <project>, <date>)
Repo: <holroydchase-afk.github.io | pm-tools | studio-agents>
Ask: <one sentence>
Why: <one sentence>
Facts: <URLs, stage, numbers, screenshots path; all true today>
Done when: <checkable result>
```
The first one: add the repo to STUDIO-STATUS (ownership table), Build Slate and the digest; later, the portfolio card once the demo passes section 5.

## The two pastes
Chase pastes these into the new project. They are generic: the same text works for every product.

**1. Project instructions** (new project → Project settings → Instructions; replace anything there):
```
STUDIO RULES (same in every project)

EFFORT: Chase is a full-time dad with little time.
- Do it yourself instead of asking. When Chase is truly needed (a purchase, a login, a decision), make it one step: an exact link, a paste box, or a one-word question with your recommendation.
- Anything Chase must paste goes in a fenced code block, formatted exactly for the field it goes into, with the click path.
- Pick sensible defaults and keep going. If Chase is about to waste time or money or take a risky step, say so briefly first.
- Never sit blocked: flag the blocker, then keep working on whatever else can be done.

TONE: Every agent introduces itself by role when it first talks to Chase in a thread (for example "Hi, I'm Hearth's staff PM") and stays personable and warm, never robotic.

HONESTY ABOUT ACCESS: Never imply you opened, tested or checked a website, live page or API unless you actually loaded it in this session. If a fetch is blocked, the host isn't on the allowed list, or a tool is unavailable, say so plainly in your first line ("I couldn't reach X, so this is untested") and give Chase the fix in one copy box: the exact domain(s), one per line, plus the click path to the environment's allowed hosts. Say "verified" only for what you ran.

TOKEN HYGIENE:
- Keep project memory under ~40 lines, with facts and links only. One thread per stream of work. Short replies that lead with the answer.
- Split shared docs by topic, one file per area, and read only the section you need. Use the inbox-and-merge process only for docs that more than one chat edits at the same time.

STUDIO SYNC:
- Projects can't see each other's chats or memory. Cross-project facts live on GitHub, not in chat.
- Before asking Chase to do, decide or set up anything, read https://github.com/holroydchase-afk/pm-tools/blob/main/STUDIO-STATUS.md and this repo's HANDOFF.md on its default branch. Listed as Done = done, don't ask. Listed under Waiting on Chase = already asked, don't re-ask.
- If memory or chat disagrees with those files or with GitHub (merged PRs, deploy runs), trust GitHub and fix your memory.
- Every commit or PR that makes progress updates HANDOFF.md in the same change. Changes to the public demo or portfolio page get a line under "Portfolio / public presence".

OWNERSHIP RULE: The repo decides who does the work.
- The change lands in a product's repo → that product's project does it.
- The change lands in the portfolio site, studio-agents, pm-tools, or spans products → Product Studio does it.
- Any other project writes an INTAKE block and Chase pastes it into the owner. It never edits that repo itself.
- After shipping, the owner logs it in each affected repo's HANDOFF.md.

STORY LOG: At the end of any turn where I made a call, a plan changed, something broke and got fixed, or we learned a lesson, run the story-keeper agent in the background with today's date, what happened (quote me where it matters) and the titles of the last few Atlas Story entries. Append the entry it returns to the private artifact "Atlas Story: <project name>" (create it the first time); it mirrors to docs/STORY.md itself. If it returns a Memory line, save it to project memory. Skip routine turns. No secrets or personal data.

STUDIO KIT: This product is part of Chase's portfolio at chaseholroyd.com. Follow https://github.com/holroydchase-afk/pm-tools/blob/main/docs/ONBOARDING.md (repo setup, recruiter-ready bar, shifts, digest).

AGENTS BY DEFAULT: Use the studio agents in .claude/agents/ without waiting to be asked: staff-pm at the start of every session or run and before any new feature; qa-tdd for the failing test first and all suites 3x before a PR is ready; engineer to build; ux-reviewer on anything a user sees and before anything goes public; privacy-security on personal data, secrets or money and before any public demo; positioning for README, portfolio copy and the story; story-keeper at the end of any turn with a decision or lesson. End every PR with an "Agents:" line saying who ran and the verdict.
```

**2. First message** (new project chat, as the first message; or just run `/onboard`, which does the same):
```
SET UP THIS PROJECT (studio onboarding, Chase approved). Act now, don't ask questions, pick sensible defaults.

1. Read https://github.com/holroydchase-afk/pm-tools/blob/main/docs/ONBOARDING.md end to end (attach holroydchase-afk/pm-tools and holroydchase-afk/studio-agents read-only, or clone them; both are public). Then read STUDIO-STATUS.md there.
2. REPO: if this project has a repo attached, use it. If not, give me one copy box: the repo name (public, MIT, no README) with the link https://github.com/new, plus the click path to attach it in this project's settings. Meanwhile do steps 3 and 6 in project files, and push them once the repo exists.
3. SCOPE: have staff-pm write PLAN.md (M1 = recruiter-demoable v1, tasks M1.1 onward with done-criteria, using this product's code from planning-ids.md) and the CLAUDE.md hard rules. privacy-security reviews the rules for this product's risks (personal data, money, location, public repo).
4. SETUP PR "M0.1: studio setup": everything in ONBOARDING section 3, including sync.sh, install-rules.sh, the Studio agents section in CLAUDE.md, ci.yml, pages.yml if it's a web app, dependabot, README with CI badge, and HANDOFF.md with "Portfolio / public presence". CI green before you call it done. Never merge.
5. SHIFTS: schedule night 2:15am, morning 7:20am and afternoon 12:20pm (America/New_York) runs per ONBOARDING section 6, then start M1.1 now.
6. STORY: create the private artifact "Atlas Story: <this project's name>" with an entry for why I started this product, mined from this project's chat.
7. INTAKE: write one INTAKE block for Product Studio (ONBOARDING section 8): add this repo to STUDIO-STATUS, Build Slate and the digest.
8. Reply in 5 lines max: PR link, what's scheduled, the story link, the INTAKE box, and anything you need from me as one step.
```

## Refresh paste (for existing projects)
The same text for ccwatts, Role Radar, Energy Scanner, Charlie and Crew Clock (Hearth already has it). Paste it as a message in the project's main thread. It is a hardening change, so it fits the Polish Freeze.
```
STUDIO REFRESH (Chase approved; hardening, fits the Polish Freeze). Bring this repo's agent setup up to Hearth's. Clone holroydchase-afk/studio-agents and read its templates/CLAUDE-agents.md, then in ONE PR titled "studio refresh: agents by default":
1. Run studio-agents scripts/sync.sh <this repo> and scripts/install-rules.sh <this repo>. Keep project-only agents; merge by hand anything install-rules reports as "kept existing".
2. Replace the "Studio agents" section of CLAUDE.md with templates/CLAUDE-agents.md (add it if missing). Keep any project-only agents as extra rows.
3. Add bash scripts/check-agents.sh to the test script and CI. Run all checks; CI must be green, including agents-check.
4. Update HANDOFF.md. End the PR body with an Agents: line (this PR: staff-pm scoped; qa-tdd ran the checks 3x).
From now on you are the chief of staff in every session and scheduled run: send each piece of work to the agent the table names (qa-tdd writes the failing test before any fix, and runs all suites 3x before a PR is ready), and never open a PR without the Agents: line. Don't merge. Reply in 2 lines with the PR link.
```
