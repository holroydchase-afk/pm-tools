/* Sample data for the demo. */
window.DEMO = {
 "key": "build-slate",
 "back": "../../pm-tools.html",
 "backLabel": "← How I work",
 "seed": {
  "projects": {
   "role-radar": {
    "kind": "AI tool",
    "link": "https://chaseholroyd.com/demo/role-radar/",
    "name": "Role Radar",
    "next": "Move the public demo into its own repo, then tune scan cost and fit quality",
    "notes": "Still to build: more job-alert sources, and making it reusable for other job seekers.",
    "order": 1,
    "pitch": "Job-search radar: a weekday scan of ~110 company boards, ZipRecruiter, Himalayas and job-alert emails, scoring each role 0–100 against my own criteria.",
    "stack": "Claude artifact + db, scheduled scan on Sonnet, Gmail + ZipRecruiter connectors",
    "stage": "beta",
    "started": "2026-10-14",
    "target": "2026-11-04",
    "updatedAt": "2026-10-22T02:00:00Z",
    "why": "Most of a job search is sifting. Say no faster, with reasons, and spend time only on roles worth it. Built so other job seekers can copy and customize it later."
   },
   "energy-scanner": {
    "kind": "Web app",
    "link": "https://chaseholroyd.com/energy-scanner/",
    "name": "Energy Scanner",
    "next": "Add a publishable sample photo and README screenshots",
    "notes": "Photo scan added Oct 21. Person segmentation runs on the device, so photos never leave it. Live at chaseholroyd.com/energy-scanner/.",
    "order": 5,
    "pitch": "A bedtime routine for kids that ends in an energy scan: a palm pad, or a photo with an on-device aura.",
    "stack": "TypeScript + Vite, on-device person segmentation, GitHub Pages",
    "stage": "live",
    "started": "2026-10-19",
    "target": "",
    "updatedAt": "2026-10-22T02:00:00Z",
    "why": "Bedtime was a nightly negotiation. A neutral 'machine says so' authority takes the argument off the parent."
   },
   "ai-climate-impact": {
    "kind": "Developer tool",
    "link": "https://chaseholroyd.com/ccwatts/",
    "name": "ccwatts",
    "next": "Run it on a month of real logs, then invite 3–5 friend devs to a beta",
    "notes": "v1 merged Oct 21: CLI summary, history, share receipt, local dashboard, and a browser playground at chaseholroyd.com/ccwatts/. Plan lives on the Near-Term Roadmap ccwatts board.",
    "order": 3,
    "pitch": "\"ccusage for kilowatt-hours\": a local CLI that estimates the electricity your Claude Code usage consumes, always as a sourced low/central/high range.",
    "stack": "TypeScript monorepo, npx CLI + offline HTML dashboard",
    "stage": "build",
    "started": "2026-10-15",
    "target": "",
    "updatedAt": "2026-10-22T02:00:00Z",
    "why": "AI usage has an electricity cost almost nobody can see. Climate passion project plus public product work. Logs never leave the machine."
   },
   "hearth": {
    "kind": "Mobile app",
    "link": "",
    "name": "Family photo app",
    "next": "Finish milestone 1 setup, then run the 2-day phone demo with family",
    "notes": "940+ tests passing (600+ backend checks, 340 app tests), built test-first by a team of AI agents. Private beta with about a dozen family members, mostly grandparents, targeted for Nov 22.",
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
    "order": 5,
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
