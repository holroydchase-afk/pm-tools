// Types for the Studio Console feed builder (PMT-M3.1). Types only: the pure builder lives in
// scripts/feed/core.ts and must export functions matching `FeedCore` below. Tests: tests/feed.test.ts
// (CON-1 to CON-7) on the recorded fixtures in tests/fixtures/feed/.
//
// core.ts rules: pure (takes data, returns data), no I/O, no network, no clock reads (use `now`),
// no new runtime dependencies. Same input and `now` give a deep-equal Feed.

// ---------------------------------------------------------------------------------------------
// HANDOFF status header (the format CON-1 parses; PMT-M3.4 makes it the studio standard)
//
// An HTML comment that opens with `<!-- status` within the first 15 lines of HANDOFF.md and
// closes with `-->`. Inside: a tiny YAML subset, one key per line.
//   scalar keys:  `stage: <text>`, `goal: <goal id>`, `milestone: <planning id>`, `now: <text>`, `next: <text>`
//   list keys:    `waiting_on_chase:` and `blockers:`, followed by `  - <item>` lines; `key: []` is empty.
// Unknown keys are ignored. Example:
//
//   <!-- status
//   stage: build
//   goal: agent-team
//   milestone: PMT-M3
//   now: PMT-M3.1 feed builder tests are red
//   next: engineer builds scripts/feed/core.ts
//   waiting_on_chase:
//     - Review goal names in goals.json
//   blockers: []
//   -->
//
// Without a header, parseHandoff falls back to these sections (first 3 top-level `- ` or `* `
// bullets each, one line per bullet: wrapped continuation lines and nested bullets are dropped,
// the bullet marker is stripped, whitespace trimmed):
//   "## In progress" -> now, "## Exact next step" -> next, "## Decisions to review" -> decisions,
//   "## Blockers" -> blockers.
// With a header, now/next/waiting_on_chase/blockers come from the header only (scalars become a
// one-item list); decisions always come from "## Decisions to review" (the header has no such key).
// ---------------------------------------------------------------------------------------------

export type Handoff = {
  header: "present" | "missing";
  stage: string | null; // null when the header is missing
  goal: string | null; // a goals.json id; null when the header is missing
  milestone: string | null; // null when the header is missing
  now: string[];
  next: string[];
  decisions: string[];
  waiting_on_chase: string[]; // [] when the header is missing
  blockers: string[];
};

// One line of .claude/agent-runs/<branch>.log: "<ISO UTC time> <agent>", e.g.
// "2026-10-31T08:30:00Z qa-tdd". Junk lines (blank, comments, bad time, bad agent name, extra
// words) are skipped. Agent names match /^[a-z0-9][a-z0-9-]{0,40}$/ (as log-agent-run.sh writes them).
export type RunEntry = { at: string; agent: string };

// From the PR body line starting "Agents:". Segments split on ";", the first word is the agent;
// "skipped" right after the name (e.g. "ux-reviewer skipped: docs only") means skipped. An agent
// named twice counts as "ran" if any segment ran. No Agents: line -> [].
export type AgentsLineEntry = { agent: string; status: "ran" | "skipped" };

// ---------------------------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------------------------

// Goal progress (UX-C1): a count ("5 of 7 demos live") or a target date ("22 days to beta", counted
// from the feed time; the card bar shows time elapsed since `from`, default 30 days before the target).
export type GoalProgress = { done: number; of: number; label: string } | { target: string; from?: string; label: string };

// goals.json at the repo root is `Goal[]`.
export type Goal = {
  id: string;
  name: string;
  measure: string;
  status?: string; // optional short, public-safe status line shown as a chip on the goal card (UX-C1)
  progress?: GoalProgress; // optional; leave it out when the numbers are private (UX-C1)
  match: { repos?: string[]; idPrefixes?: string[] };
};

export type Checks = "success" | "failure" | "pending" | "none";

export type PullRequest = {
  number: number;
  title: string;
  draft: boolean;
  author: string; // "dependabot[bot]" marks a Dependabot PR
  updatedAt: string; // ISO UTC
  body: string; // read for the Agents: line only; never copied to the output
  checks: Checks;
  branch: string;
};

export type IntakeIssue = { number: number; title: string };

export type ProductInput = {
  repo: string; // GitHub repo name, e.g. "pm-tools"
  name: string; // display name, e.g. "PM tools"
  code: string; // planning-ID code, e.g. "PMT"
  handoff: string; // HANDOFF.md markdown
  prs: PullRequest[]; // open PRs
  intake: IntakeIssue[]; // open issues labeled intake
  runLogs: Record<string, string>; // key: the branch name exactly as in PullRequest.branch; value: log text
};

export type FeedInput = {
  goals: Goal[];
  products: ProductInput[];
  studioStatus: string; // STUDIO-STATUS.md markdown
  // Repo names that are private. They must never appear in the output: any item whose text
  // mentions one is dropped (CON-7).
  privateRepos?: string[];
  // The agent roster: the file names (minus .md) in .claude/agents/. Only these names (plus the
  // five core gates) become gate keys; any other first word on an Agents: line is ignored (CON-R5).
  agents: string[];
  // Display names by repo (console.config.json), for each goal's "Reads:" line (UX-C1). A repo
  // with no entry falls back to its product's name in `products`, then to the repo name.
  repoNames?: Record<string, string>;
};

// ---------------------------------------------------------------------------------------------
// Output (studio.json). CON-7: no PR body text, and nothing matching scripts/check-private.ts
// PATTERNS (emails, phones, claude.ai artifact links, trigger ids, Gmail links): such matches in
// titles or HANDOFF text are redacted or the item dropped. core.ts may not import
// scripts/check-private.ts (it pulls in child_process and fs); move PATTERNS into a pure module
// both files import instead.
// ---------------------------------------------------------------------------------------------

// Goal matching (CON-3). A PR's planning ID is the leading token of its title before ":"
// (e.g. "CCW-M4.1: Pace spike" -> "CCW-M4.1"). If it starts with any goal's idPrefixes entry, that
// goal wins (goals.json order breaks ties); else the first goal whose repos lists the PR's repo;
// else off-goal. A run is attributed to the goal of the open PR on the same branch, else by repo.
//
// Effort (CON-3, CON-6): one unit per open non-Dependabot PR plus one per agent run in the last
// 7 days (now - 7d < at <= now). Shares are integer percents over goals + off-goal, rounded by the
// largest-remainder method (ties: goals.json order, off-goal last) so they sum to exactly 100.
// With zero units, every share is 0.
// reads: display names of the goal's match.repos, in that order (UX-C1); status only when goals.json has one.
export type GoalEffort = { id: string; name: string; measure: string; effort: number; reads: string[]; status?: string; progress?: GoalProgress };

export type OffGoalItem =
  | { kind: "pr"; repo: string; number: number; title: string }
  | { kind: "runs"; repo: string; count: number }; // one item per repo: its off-goal runs, last 7 days

export type CallSheetPr = { repo: string; number: number; title: string; goal: string | null };

// Call Sheet (CON-4, CON-R1). Every PR lands in exactly one group:
//   dependabot: author "dependabot[bot]", whatever its draft or checks state; one item per repo.
//   merge:      not draft, not Dependabot, checks "success".
//   failing:    not draft, not Dependabot, checks "failure".
//   inProgress: not Dependabot, and either not draft with checks "pending" or "none", or a draft
//               updated within 24h of `now` (whatever its checks).
//   idleDrafts: draft, not Dependabot, updatedAt more than 24h before `now`.
// decide: HANDOFF decisions and waiting_on_chase items plus STUDIO-STATUS "## Waiting on Chase"
// bullets, one line each (shape is pinned in M3.2, CON-9). A HANDOFF item that duplicates a PR in
// `merge` for the same repo is dropped (UX-C3): it names "#<number>", or it starts with "Merge" and
// every other word of 3+ letters (minus "the", "and", "for", "PR") appears in that PR's title.
export type DecideItem = { repo: string | null; text: string };

export type CallSheet = {
  merge: CallSheetPr[];
  failing: CallSheetPr[];
  inProgress: CallSheetPr[];
  decide: DecideItem[];
  idleDrafts: CallSheetPr[];
  dependabot: { repo: string; count: number }[];
};

export type ProductSummary = {
  repo: string;
  name: string;
  code: string;
  header: "present" | "missing";
  stage: string | null;
  goal: string | null; // the header goal only if it is a goals.json id, else null (CON-R3)
  milestone: string | null;
  now: string[];
  next: string[];
  decisions: string[];
  waiting_on_chase: string[];
  blockers: string[];
  openPrs: number;
  intakes: number;
};

export type GateState = "ok" | "missing" | "n/a";

// Gates (CON-5), one entry per open non-Dependabot PR. Keys: the five core gate agents
// (staff-pm, qa-tdd, engineer, ux-reviewer, privacy-security) plus any other roster agent
// (FeedInput.agents) named on the Agents: line; unknown words are ignored (CON-R5). ok = named as ran and in the branch's run log (any date); missing = named as ran
// but not in the log; n/a = skipped or not named.
export type GateRow = { repo: string; number: number; gates: Record<string, GateState> };

export type Feed = {
  builtAt: string; // now.toISOString()
  goals: GoalEffort[]; // goals.json order
  offGoalEffort: number; // the off-goal share; goals[].effort + offGoalEffort === 100 (or all 0)
  offGoal: OffGoalItem[];
  callSheet: CallSheet;
  products: ProductSummary[]; // input order
  gates: GateRow[];
  runs: Record<string, Record<string, number>>; // repo -> agent -> runs in the last 7 days (agents with 0 runs omitted)
};

export type FeedCore = {
  parseHandoff(md: string): Handoff;
  parseRunLog(text: string): RunEntry[];
  parseAgentsLine(prBody: string): AgentsLineEntry[];
  buildFeed(input: FeedInput, now: Date): Feed;
};
