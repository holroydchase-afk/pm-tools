# Ancillary tools

_Chase's small, useful side tools, as opposed to the six main products (Hearth, ccwatts, Role Radar, Energy Scanner, Charlie, Crew Clock). Model: `hero-backgrounds`, a one-file library with a literal name that Chase can post as "whipped up X. Fork it." Compiled 2026-11-20 from BOARD.md, STUDIO-STATUS.md, the studio inventory, the Product Studio artifacts and every repo this project can read. Verified means read in a repo or listed in the project; nothing was run. Hearth's list is merged (Nov 20). Other projects can't be seen from here, so the last section is a paste-in ask that gets their tools reported back._

## Top 3 to mature next
1. **hero-backgrounds.** Already a public repo with a live demo, MIT, no dependencies. Smallest step to a LinkedIn post: add a short GIF to the README and one more mode or a preset gallery.
2. **Cut-Open Palettes.** Builds an app palette from a cut fruit: editable hex, light and dark modes, readability checks, CSS and JSON export. Done with 9 presets and already reads like a post. Needs its own repo and a one-file page.
3. **Stakeholder Twins.** The most distinctive (AI persona tester: pick a stakeholder, upload a screenshot, chat in character). Needs its own public repo and a first stage 1 run. The reviewer personas in `docs/reviewers/` are natural seed personas.

Next in line: **Live color tester** (make it general with your own screenshot), **Demo live-check** (needs one retry added), **Interview flashcards** (lift out of `templates/`, sample deck only).

## The list

| Tool | What it does | Where it lives | State | Mature? |
|---|---|---|---|---|
| **hero-backgrounds** | Animated canvas hero backgrounds, 8 modes, one JS file, no dependencies | repo `hero-backgrounds` (+ Pages demo) | Shipped v0, MIT, README and demo | **Yes** |
| **Stakeholder Twins** | Stakeholder persona dropdown, screenshot upload, chat in character | Claude page in another project (no repo yet) | Built; stage 1 not run yet | **Yes** |
| **Cut-Open Palettes** | Builds an app palette from a cut fruit, editable hex, light and dark, readability checks, CSS and JSON export | Artifact in Hearth project | Done, 9 presets, ready to share | **Yes** |
| **Live color tester** | Swatches plus a hex box that recolor a mock screen live (Paper Color Tester, Paper White Picker) | Artifacts in Hearth project | Works, tied to Hearth | **Yes** (make general with your own screenshot) |
| **Demo live-check** | Checks a deployed demo before and after each publish: version.txt matches the commit, for new and returning visitors | `hearth` repo, demo workflow (PR 112) | Runs in CI daily | **Yes** (needs one retry added) |
| **Fruit theme tester** | Breaks a Hass avocado into layers, each layer a UI role (Avocado Evolved) | Artifact in Hearth project | Done | Maybe (covered by Cut-Open Palettes) |
| **Screen option tester** | Compares 3 layout options live on one page (Share Screen Tester) | Artifact in Hearth project | Done | Maybe (could be a generic A/B/C mock page) |
| **Font picker** | Compares fonts side by side (Hearth Font Choices) | Artifact in Hearth project | Static | Maybe (small, quick to make general) |
| **Glass bar mock** | Tab bar that looks like iOS 26 glass, for the web | `hearth` repo, web demo | Live in the demo | Maybe (as a small CSS snippet) |
| **Photo-app layout study** | How photo apps lay out their screens | Artifact in Hearth project | Doc | No (research, not a tool) |
| **Interview flashcards** | Load a JSON deck, flip cards, mark Got it or Again, saved in the browser | pm-tools `templates/interview-flashcards` | Working, fictional sample deck | **Yes** |
| **Studio agents kit** | 10 agents (staff-pm, qa-tdd, engineer, ux-reviewer and more), 9 skills, repo templates, CI checks | repo `studio-agents` | In daily use across all repos | Maybe (tied to studio conventions; needs a generic README) |
| **ux-shots and ux-rules** | Screenshot a UI at set sizes and check it against design rules | `studio-agents/tools`, copied into Hearth | In use | Maybe (bundle with the agents kit or split out) |
| **@holroyd/messenger** | End-to-end encrypted group chat library on MLS, with a Supabase relay | `hearth/packages/messenger` | Works in Hearth; no outside security review; AGPL | Maybe (not before a security review) |
| **Build Slate** | Project tracker: each product, stage, next step | pm-tools `apps/`, demo at chaseholroyd.com/pm-tools/ | Live | Maybe (one repo with the roadmap) |
| **Near-Term Roadmap** | Now / Next / Later / Done boards, one per product | pm-tools `apps/`, demo | Live | Maybe (same repo as Build Slate) |
| **Studio Console** | Goal-first dashboard built from each repo's HANDOFF status header | pm-tools `console/` | Hidden until stronger | Maybe |
| **Nudge** | ADHD task app that keeps coming back until done | concept page in this project | Concept; parked until after Hearth beta | Maybe (after Nov 22) |
| **Lessons and Sayings** | Spaced repeat of lessons learned; one phrase a day; same engine as Nudge | idea only | Not started | No (follow Nudge) |
| **Skills filter preview** | Skill chips that filter products on the portfolio | preview page in this project | Preview made, waits for Chase's look | No (a site feature, not a repo) |
| **Shared-doc inbox** | Python script that lists pending edits for docs several chats touch | pm-tools `routines/shared-doc-inbox` | Working | No |
| **Reviewer personas** | Recruiter, hiring manager, senior engineer and least-tech-savvy user reviewer prompts | pm-tools `docs/reviewers/` | In use | No (feeds Stakeholder Twins) |
| **Hearth Test Log** | Test cases, tickets and runs built from real test output | hearth `tracker/` | Live for Hearth | No (Hearth-specific) |
| **LinkedIn voice guide** | Voice rules and a review gate for posts | pm-tools `docs/linkedin-voice.md` | Merged | No (a doc) |

Personal career tools (Job Search Toolkit, Application Answer Bank, Referral Kit, resume pages, job-intake, morning and digest skills) are left off on purpose: they hold personal data and don't belong in a public repo.

## Paste-in ask for other projects
Chase pastes this into each other project's chat. Each reply lands in that project, so Chase brings the answers back here (or says "file it" and a thread adds them).

```
Hi, I'm collecting every small side tool Chase has built here, the kind that could become its own public, literally named repo he shares on LinkedIn ("whipped up X. Fork it."). Not the main products. Examples: a color palette tool, a prompt helper, a prototype page, a script, a Claude page. Please list every one you know of, in this project's artifacts, files, repos and old threads. For each give one table row: tool, what it does in a few words, where it lives (repo path or artifact title, no private links), current state, and whether it is worth maturing (yes, maybe or no) with a one-line reason. Lead with your top 3. Leave out anything with personal data. Keep it short: one table, no extras.
```
