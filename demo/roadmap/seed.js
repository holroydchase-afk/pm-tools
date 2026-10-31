/* Sample data for the demo. */
window.DEMO = {
 "key": "roadmap",
 "name": "Near-Term Roadmap",
 "back": "../../pm-tools.html",
 "backLabel": "← Studio Console",
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
   },
   "role-radar": {
    "goal": "A weekday radar that scores senior PM roles against my own criteria, so I spend time only on the ones worth applying to.",
    "me": "Chase",
    "name": "Role Radar",
    "order": 2,
    "phases": [
     "Beta",
     "Polish",
     "Share"
    ]
   }
  },
  "cards": {
   "c01": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Confirm ccwatts is free on npm and GitHub. Create the repo, add PLAN.md and ANCHORS.md at the root, MIT license.",
    "lane": "done",
    "order": 2,
    "owner": "Chase",
    "phase": "MVP",
    "size": 0.5,
    "tags": "setup",
    "title": "Create public GitHub repo (name still a working name)"
   },
   "c02": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "ANCHORS.md has C1–C4 in Claude's wording. Mark which ones you adopt so Claude Code checks work against them.",
    "lane": "done",
    "order": 3,
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
    "lane": "done",
    "order": 4,
    "owner": "Claude Code",
    "phase": "MVP",
    "size": 1,
    "tags": "build",
    "title": "CCW-M1.1 · Scaffold + parse spike"
   },
   "c04": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Seed parameters from EcoLogits and the research sources. Separate cache-read factor. Sanity-check against published research, Microsoft and Google figures.",
    "lane": "done",
    "order": 5,
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
    "lane": "done",
    "order": 6,
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
    "lane": "done",
    "order": 7,
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
    "lane": "done",
    "order": 8,
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
    "lane": "done",
    "order": 9,
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
    "lane": "done",
    "order": 10,
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
    "lane": "done",
    "order": 11,
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
    "order": 1,
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
    "lane": "now",
    "order": 1,
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
    "lane": "now",
    "order": 2,
    "owner": "Chase",
    "phase": "Beta",
    "size": 0.5,
    "tags": "beta",
    "title": "Recruit 3–5 friend devs for the beta"
   },
   "c14": {
    "blocked": false,
    "board": "ccwatts",
    "detail": "Send METHODOLOGY.md to an outside climate researcher and the EcoLogits maintainers.",
    "lane": "next",
    "order": 1,
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
    "lane": "next",
    "order": 2,
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
    "order": 2,
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
    "lane": "next",
    "order": 3,
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
    "order": 3,
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
    "order": 4,
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
   },
   "r01": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Scheduled scan scores each new role 0–100 with reasons.",
    "lane": "done",
    "order": 1,
    "owner": "Claude Code",
    "phase": "Beta",
    "size": 1,
    "tags": "build",
    "title": "Weekday scan across company boards, job alerts and email"
   },
   "r02": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Weights, hard excludes and dream-role anchors in one YAML file.",
    "lane": "done",
    "order": 2,
    "owner": "Chase",
    "phase": "Beta",
    "size": 1,
    "tags": "decision",
    "title": "Editable criteria file drives every score"
   },
   "r03": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Scan, score and pipeline on made-up data.",
    "lane": "done",
    "order": 3,
    "owner": "Claude Code",
    "phase": "Polish",
    "size": 0.5,
    "tags": "portfolio",
    "title": "Public demo shows the radar only"
   },
   "r04": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Deploy the demo build with Pages from main.",
    "lane": "now",
    "order": 1,
    "owner": "Claude Code",
    "phase": "Polish",
    "size": 1,
    "tags": "portfolio",
    "title": "Move the demo into its own repo"
   },
   "r05": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Read the posting without leaving the radar.",
    "lane": "now",
    "order": 2,
    "owner": "Claude Code",
    "phase": "Polish",
    "size": 1,
    "tags": "build",
    "title": "Job description preview panel"
   },
   "r06": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Compare scores with what I actually applied to.",
    "lane": "next",
    "order": 1,
    "owner": "Chase",
    "phase": "Polish",
    "size": 1,
    "tags": "method",
    "title": "Tune scan cost and fit quality after a week of runs"
   },
   "r07": {
    "blocked": false,
    "board": "role-radar",
    "detail": "Template criteria file and a setup guide.",
    "lane": "later",
    "order": 1,
    "owner": "Claude Code",
    "phase": "Share",
    "size": 2,
    "tags": "build",
    "title": "Make it reusable for other job seekers"
   }
  }
 }
};
