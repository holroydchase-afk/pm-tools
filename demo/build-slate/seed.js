/* Sample data for the demo. */
window.DEMO = {
 "key": "build-slate",
 "seed": {
  "projects": {
   "role-radar": {
    "kind": "AI tool",
    "link": "",
    "name": "Role Radar",
    "next": "Let a week of daily scans run, then tune cost and fit quality",
    "notes": "Still to build: a fast lane in the intake skill, more job-alert sources, and making it reusable for other job seekers.",
    "order": 1,
    "pitch": "Job-search radar: a weekday scan of ~110 company boards, ZipRecruiter, Himalayas and job-alert emails, feeding one tracker with one-tap resume intake.",
    "stack": "Claude artifact + db, scheduled task on Sonnet, Gmail + ZipRecruiter connectors, job-intake skill, Google Docs template",
    "stage": "beta",
    "started": "2026-10-14",
    "target": "2026-11-04",
    "updatedAt": "2026-10-16T03:20:00Z",
    "why": "Make found-role-to-submitted-application fast and nearly hands-off. Success check ~Nov 4: fast-lane applications under 20 min, 5–10 submissions a week, 2+ contacts per target. Built so other job seekers can copy and customize it later."
   },
   "energy-scanner": {
    "kind": "Mobile app",
    "link": "",
    "name": "Energy Scanner",
    "next": "Try it with the kids for a few nights and see if the novelty holds",
    "notes": "Decided (Chase, Oct 19): routine-based tracker, with the scan as the finale. Scan uses a vision model to interpret the photo into an energy color (grey, yellow, rainbow, etc.), each with its own summary.\nOpen questions (Claude's, not decided): let routine progress and time of day bias the color so it trends toward 'sleepy' at bedtime; kids' face photos going to a cloud API is a privacy call, so consider on-device or no image storage; could live inside Hearth (which already has on-device AI work) or stand alone.",
    "order": 5,
    "pitch": "A bedtime routine tracker whose finale is an energy scan: a vision model reads the kid's photo and gives an energy color (grey, yellow, rainbow...) with a fun summary.",
    "stack": "Claude artifact (HTML), no camera yet",
    "stage": "build",
    "started": "2026-10-19",
    "target": "",
    "updatedAt": "2026-10-20T00:10:00Z",
    "why": "Bedtime fights. A neutral 'machine says so' authority takes the argument off the parent."
   },
   "stock-agent": {
    "kind": "AI tool",
    "link": "",
    "name": "Stock Agent",
    "next": "Decide scope: research and watch only, or also suggest trades within rules you set",
    "notes": "Draft concept from Claude, not yet confirmed. Possible agents: thesis keeper, filings/earnings reader, news and sentiment watcher, risk checker against your rules. Open questions: which market data API, paper-trade first or watch-only, and whether it ever touches a brokerage account (default: never, you place trades).",
    "order": 4,
    "pitch": "A personal research desk: you write the thesis, agents watch filings, earnings and news against it, and a morning digest says what changed and whether the thesis still holds.",
    "stack": "Reuse the Role Radar pattern: scheduled scan + artifact db + digest. Market data source TBD.",
    "stage": "idea",
    "started": "2026-10-16",
    "target": "",
    "updatedAt": "2026-10-16T05:27:00Z",
    "why": "Plays to the same muscles as your career: a rules engine with guardrails (position limits and stop rules work like margin floors and discount limits), multi-agent orchestration, and explainable AI that shows which rule or signal drove each flag. You've invested since the early LLM days, so you're the first user."
   },
   "ai-climate-impact": {
    "kind": "Other",
    "link": "https://github.com/holroydchase-afk/ccwatts",
    "name": "ccwatts",
    "next": "Start building the MVP per PLAN.md (roadmap board: Near-Term Roadmap › ccwatts)",
    "notes": "Renamed from 'AI Climate Impact' Oct 20. Anchors and plan written Oct 16–18. Plan lives on the Near-Term Roadmap ccwatts board.",
    "order": 3,
    "pitch": "\"ccusage for kilowatt-hours\": a local CLI that estimates the electricity your Claude Code usage consumes, always as a sourced low/central/high range.",
    "stack": "TypeScript monorepo, npx CLI + offline HTML dashboard",
    "stage": "spec",
    "started": "2026-10-15",
    "target": "",
    "updatedAt": "2026-10-20T01:45:00Z",
    "why": "AI usage has an electricity cost almost nobody can see. Climate passion project plus public product work. Logs never leave the machine."
   },
   "hearth": {
    "kind": "Mobile app",
    "link": "",
    "name": "Family photo app",
    "next": "Finish milestone 1 setup, then run the 2-day phone demo with family",
    "notes": "Hundreds of tests passing; built test-first by a team of AI agents. Beta target: about 12 grandparents by Nov 22. Name coming.",
    "order": 2,
    "pitch": "Private family photo app for split families and grandparents who avoid social media. Each post goes to a chosen audience.",
    "stack": "Expo / React Native, Supabase (row-level security), Backblaze B2",
    "stage": "build",
    "started": "2026-08-22",
    "target": "2026-11-22",
    "updatedAt": "2026-10-20T01:45:00Z",
    "why": "Tinybeans, FamilyAlbum and Ente Photos didn't fit. The differentiator is audience-segmented visibility per photo."
   },
   "build-slate": {
    "kind": "AI tool",
    "name": "Build Slate",
    "stage": "live",
    "order": 6,
    "link": "",
    "pitch": "This tracker: every project in the studio, its stage, its next move and its milestone date.",
    "why": "Too many side projects in flight. One slate keeps the next step for each in view.",
    "stack": "Claude artifact + shared database",
    "started": "2026-10-15",
    "target": "",
    "next": "Add a portfolio flag (feature / list / hidden) so the website follows the slate",
    "notes": "",
    "updatedAt": "2026-10-21T12:00:00Z"
   }
  }
 }
};
