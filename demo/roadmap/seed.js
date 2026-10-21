/* Sample data for the demo. */
window.DEMO = {
 "key": "roadmap",
 "seed": {
  "boards": {
   "ccwatts": {
    "goal": "Ship an open-source CLI that estimates Claude Code electricity as an honest range. Friend devs first, then the portfolio case study and LinkedIn.",
    "me": "Chase",
    "name": "ccwatts",
    "order": 1,
    "phases": [
     "MVP",
     "Beta",
     "Launch"
    ]
   }
  },
  "cards": {
   "c01": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Confirm ccwatts is free on npm and GitHub. Create the repo, add PLAN.md and ANCHORS.md at the root, MIT license.",
    "lane": "now",
    "order": 1,
    "owner": "Chase",
    "phase": "MVP",
    "size": 0.5,
    "tags": "setup",
    "title": "Create public GitHub repo + check the ccwatts name"
   },
   "c02": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "ANCHORS.md has C1–C4 in Claude's wording. Mark which ones you adopt so Claude Code checks work against them.",
    "lane": "now",
    "order": 2,
    "owner": "Chase",
    "phase": "MVP",
    "size": 0.5,
    "tags": "decision",
    "title": "Adopt, edit or cut the candidate anchors"
   },
   "c03": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Workspaces set up. Read Claude Code JSONL, confirm usage fields and log retention, print tokens by model. Stop and tell Chase if the fields aren't there.",
    "lane": "now",
    "order": 3,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build",
    "title": "CCW-M1.1 · Scaffold + parse spike"
   },
   "c04": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Seed parameters from EcoLogits and the research sources. Separate cache-read factor. Sanity-check against Hausfather, Microsoft and Google figures.",
    "lane": "next",
    "order": 1,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build, method",
    "title": "CCW-M1.2 · Energy model + params.json + METHODOLOGY.md draft"
   },
   "c05": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Read METHODOLOGY.md and params.json. Would you defend the central value and range in public? Decide on the cache-read treatment.",
    "lane": "next",
    "order": 2,
    "owner": "Chase",
    "phase": "MVP",
    "size": 1,
    "tags": "decision, method",
    "title": "Review the methodology numbers"
   },
   "c06": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Output matches the mock in PLAN.md. Fixture and snapshot tests.",
    "lane": "next",
    "order": 3,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build",
    "title": "CCW-M1.3 · CLI summary, --by, --json, --method"
   },
   "c07": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Daily rollups to ~/.ccwatts, deduped, counts only. Survives Claude Code log cleanup. CSV export.",
    "lane": "next",
    "order": 4,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build",
    "title": "CCW-M1.4 · History rollups + ccwatts history"
   },
   "c08": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "The screenshot people post. Test kWh-first vs comparison-first wording.",
    "lane": "later",
    "order": 1,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build, share",
    "title": "CCW-M1.5 · Share receipt (line + SVG)"
   },
   "c09": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Single offline HTML file built from the shared core, with history embedded.",
    "lane": "later",
    "order": 2,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build, web",
    "title": "CCW-M1.6 · Local dashboard (ccwatts dashboard)"
   },
   "c10": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Drop a log file or try sample data. CSP blocks network calls, with a test. Mobile-responsive. GitHub Pages.",
    "lane": "later",
    "order": 3,
    "owner": "Claude Code",
    "phase": "Beta",
    "size": 1,
    "tags": "build, web",
    "title": "CCW-M1.7 · Browser playground + deploy"
   },
   "c11": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Test on a clean machine. A friend installs it in under 60 seconds.",
    "lane": "later",
    "order": 4,
    "owner": "Claude Code",
    "phase": "Beta",
    "size": 1,
    "tags": "ship",
    "title": "CCW-M2.2 · npm publish + README with GIF"
   },
   "c12": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Your real numbers and anything surprising become the launch hook.",
    "lane": "later",
    "order": 5,
    "owner": "Chase",
    "phase": "Beta",
    "size": 0.5,
    "tags": "launch",
    "title": "Dogfood a month of your own usage"
   },
   "c13": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Send the install line, a 3-question feedback form, and ask them to send back their numbers.",
    "lane": "later",
    "order": 6,
    "owner": "Chase",
    "phase": "Beta",
    "size": 0.5,
    "tags": "beta",
    "title": "Recruit 3–5 friend devs for the beta"
   },
   "c14": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Reach out to Zeke Hausfather and the EcoLogits maintainers with METHODOLOGY.md.",
    "lane": "later",
    "order": 7,
    "owner": "Chase",
    "phase": "Beta",
    "size": 0.5,
    "tags": "method, outreach",
    "title": "Ask for an outside methodology sanity check"
   },
   "c15": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Top 3 issues from beta feedback.",
    "lane": "later",
    "order": 8,
    "owner": "Claude Code",
    "phase": "Beta",
    "size": 1,
    "tags": "build",
    "title": "CCW-M2.3 · Friend beta fixes"
   },
   "c16": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Apply the outside review. Tag METHODOLOGY v0.2.",
    "lane": "later",
    "order": 9,
    "owner": "Claude Code",
    "phase": "Launch",
    "size": 1,
    "tags": "method",
    "title": "CCW-M3.1 · Methodology hardening → v0.2"
   },
   "c17": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Enterprise idea, the pivot to a dev tool, methodology tradeoffs, what you cut, what's next. Claude drafts, you edit.",
    "lane": "later",
    "order": 10,
    "owner": "Chase",
    "phase": "Launch",
    "size": 2,
    "tags": "portfolio",
    "title": "Write the portfolio case study"
   },
   "c18": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Lead with your month, one insight, the repo link, and ask people to reply with theirs. Only after the friend beta.",
    "lane": "later",
    "order": 11,
    "owner": "Chase",
    "phase": "Launch",
    "size": 1,
    "tags": "linkedin",
    "title": "LinkedIn post 1: launch with your numbers"
   },
   "c19": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Post 3 is the one that does the most for PM credibility.",
    "lane": "later",
    "order": 12,
    "owner": "Chase",
    "phase": "Launch",
    "size": 1,
    "tags": "linkedin",
    "title": "LinkedIn posts 2–3: friends' numbers, then methodology + what we cut"
   },
   "c20": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "PLAN.md and ANCHORS.md written. Staff PM skill drafted.",
    "lane": "done",
    "order": 1,
    "owner": "Chase",
    "phase": "MVP",
    "size": 1,
    "tags": "decision",
    "title": "Decide the direction: research verdict, dev-tool MVP, plan + anchors"
   }
  }
 }
};
