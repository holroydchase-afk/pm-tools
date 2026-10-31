// PMT-M3.1 Studio Console feed builder: CON-1 to CON-7 (PLAN.md, "PMT-M3").
// Runs on recorded fixtures in tests/fixtures/feed/ with a fixed clock; no network.
// Contract and rules: scripts/feed/types.ts. The builder is scripts/feed/core.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { scanText } from "../scripts/check-private.ts";
import type { Feed, FeedCore, FeedInput, Goal, ProductInput, PullRequest } from "../scripts/feed/types.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIX = join(ROOT, "tests", "fixtures", "feed");
const CORE = join(ROOT, "scripts", "feed", "core.ts");
const NOW = new Date("2026-10-31T12:00:00Z");

// Load core.ts by path so typecheck passes before it exists; until then every test that needs it
// fails with the load error (the red).
let loaded: FeedCore | undefined;
let loadError: unknown;
try {
  loaded = (await import(pathToFileURL(CORE).href)) as FeedCore;
} catch (e) {
  loadError = e;
}
function core(): FeedCore {
  if (!loaded) throw loadError;
  for (const fn of ["parseHandoff", "parseRunLog", "parseAgentsLine", "buildFeed"] as const) {
    assert.equal(typeof loaded[fn], "function", `core.ts exports ${fn}`);
  }
  return loaded;
}

const read = (f: string) => readFileSync(join(FIX, f), "utf8");
type FixtureProduct = Omit<ProductInput, "handoff" | "runLogs"> & { handoffFile: string; runLogFiles: Record<string, string> };

function fixtureInput(): FeedInput {
  const goals = JSON.parse(read("goals.json")) as Goal[];
  const raw = JSON.parse(read("products.json")) as FixtureProduct[];
  const products: ProductInput[] = raw.map(({ handoffFile, runLogFiles, ...p }) => ({
    ...p,
    handoff: read(handoffFile),
    runLogs: Object.fromEntries(Object.entries(runLogFiles).map(([branch, f]) => [branch, read(f)])),
  }));
  return { goals, products, studioStatus: read("studio-status.md"), privateRepos: ["family-vault"], agents: roster() };
}
// The agent roster as build-feed passes it: .claude/agents/*.md file names.
const roster = () => readdirSync(join(ROOT, ".claude", "agents")).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)).sort();
const build = (input: FeedInput = fixtureInput()): Feed => core().buildFeed(input, NOW);
const key = (x: { repo: string; number: number }) => `${x.repo}#${x.number}`;
const allPrs = (input: FeedInput) => input.products.flatMap((p) => p.prs.map((pr) => ({ repo: p.repo, ...pr })));

// ---------------------------------------------------------------- CON-1: status header

test("CON-1 header: stage, goal, milestone, now, next, waiting_on_chase and blockers come from the status header", () => {
  const h = core().parseHandoff(read("handoff-pm-tools.md"));
  assert.equal(h.header, "present");
  assert.equal(h.stage, "build");
  assert.equal(h.goal, "agent-team");
  assert.equal(h.milestone, "PMT-M3");
  assert.deepEqual(h.now, ["PMT-M3.1 feed builder tests are red"]);
  assert.deepEqual(h.next, ["engineer builds scripts/feed/core.ts"]);
  assert.deepEqual(h.waiting_on_chase, ["Review goal names in goals.json", "Merge the demo bar PR"]);
  assert.deepEqual(h.blockers, [], "`blockers: []` is an empty list");
});

test("CON-1 header wins over the fallback sections; decisions still come from the section", () => {
  const h = core().parseHandoff(read("handoff-pm-tools.md"));
  const all = JSON.stringify(h);
  assert.ok(!all.includes("Section text that the header overrides"), "In progress / next / blockers sections are ignored when a header exists");
  assert.deepEqual(h.decisions, ["Whether off-goal items get a park action later.", "Goal measures for goals.json."]);
});

test("CON-1 header list keys: multiple blockers and a one-item waiting list", () => {
  const h = core().parseHandoff(read("handoff-role-radar.md"));
  assert.equal(h.header, "present");
  assert.equal(h.goal, "staff-pm-role");
  assert.deepEqual(h.waiting_on_chase, ["Pick the weekday scan time"]);
  assert.deepEqual(h.blockers, ["Scan cost over budget on long job posts", "Demo bar e2e fails on narrow screens"]);
});

test("CON-1 feed: products with a header carry its fields", () => {
  const p = build().products.find((x) => x.repo === "pm-tools");
  assert.ok(p, "pm-tools product in the feed");
  assert.equal(p.header, "present");
  assert.equal(p.stage, "build");
  assert.equal(p.goal, "agent-team");
  assert.equal(p.milestone, "PMT-M3");
  assert.deepEqual(p.now, ["PMT-M3.1 feed builder tests are red"]);
  assert.equal(p.openPrs, 3);
  assert.equal(p.intakes, 1);
});

test("CON-R3 header goal: kept when it is a goals.json id, dropped (null) otherwise", () => {
  const input = fixtureInput();
  const email = ["sam.rivera", "mailbox-sample.io"].join("@");
  const pm = input.products.find((p) => p.repo === "pm-tools")!;
  pm.handoff = pm.handoff.replace("goal: agent-team", `goal: agent-team ${email}`);
  const rr = input.products.find((p) => p.repo === "role-radar")!;
  rr.handoff = rr.handoff.replace("goal: staff-pm-role", "goal: moonshot");
  const f = build(input);
  const goalOf = (repo: string) => f.products.find((p) => p.repo === repo)!.goal;
  assert.equal(goalOf("pm-tools"), null, "an email-bearing goal is not a goal id");
  assert.equal(goalOf("role-radar"), null, "an unknown goal id is dropped");
  assert.deepEqual(scanText(JSON.stringify(f)), [], "nothing from the bad goal reaches the feed");
  assert.equal(build().products.find((p) => p.repo === "role-radar")!.goal, "staff-pm-role", "a known id is kept");
});

// ---------------------------------------------------------------- CON-2: fallback sections

test("CON-2 no header: now/next/decisions/blockers come from the four sections, marked header missing", () => {
  const h = core().parseHandoff(read("handoff-ccwatts.md"));
  assert.equal(h.header, "missing");
  assert.equal(h.stage, null);
  assert.equal(h.goal, null);
  assert.equal(h.milestone, null);
  assert.deepEqual(h.next, ["Decide whether pace ships behind an opt-in flag."]);
  assert.deepEqual(h.decisions, ["Ship pace during the Polish Freeze or wait.", "Range label wording on the summary line."]);
  assert.deepEqual(h.blockers, ["Waiting on the 0.1.2 release review."]);
  assert.deepEqual(h.waiting_on_chase, []);
});

test("CON-2 no header: at most 3 top-level bullets, one line each, nested bullets and wrapped lines dropped", () => {
  const h = core().parseHandoff(read("handoff-ccwatts.md"));
  assert.deepEqual(h.now, [
    "CCW-M4.1 pace spike: a burnout signal from session length,",
    "CCW-M4.0 notes for the pace tracker.",
    "Methodology page copy pass.",
  ]);
  assert.ok(!JSON.stringify(h).includes("M2.6 release plan"), "## Done is not a source section");
});

test("CON-2 no header and no sections: empty lists, not a crash", () => {
  const h = core().parseHandoff("# Handoff\n\nJust prose, nothing structured.\n");
  assert.equal(h.header, "missing");
  for (const k of ["now", "next", "decisions", "blockers", "waiting_on_chase"] as const) assert.deepEqual(h[k], [], k);
});

test("CON-2 feed: the product without a header is marked header: missing", () => {
  const p = build().products.find((x) => x.repo === "ccwatts");
  assert.ok(p, "ccwatts product in the feed");
  assert.equal(p.header, "missing");
  assert.equal(p.now.length, 3);
  assert.deepEqual(build().products.map((x) => [x.repo, x.header]), [
    ["pm-tools", "present"],
    ["ccwatts", "missing"],
    ["role-radar", "present"],
  ]);
});

// ---------------------------------------------------------------- CON-3: goals and off-goal

test("CON-3 root goals.json has the four goals with name, measure and a match rule", () => {
  const goals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as Goal[];
  assert.deepEqual(goals.map((g) => g.id), ["staff-pm-role", "portfolio", "hearth-beta", "agent-team"]);
  for (const g of goals) {
    assert.ok(g.name && g.measure, g.id);
    assert.ok((g.match.repos?.length ?? 0) + (g.match.idPrefixes?.length ?? 0) > 0, `${g.id} matches something`);
  }
});

test("CON-3 off-goal: PRs and runs that match no goal are listed; nothing on-goal is", () => {
  const f = build();
  const prs = f.offGoal.filter((x) => x.kind === "pr").map((x) => key(x as { repo: string; number: number })).sort();
  assert.deepEqual(prs, ["ccwatts#71", "ccwatts#72"], "both ccwatts feature PRs; Dependabot PRs are not off-goal effort");
  const runs = f.offGoal.filter((x) => x.kind === "runs");
  assert.deepEqual(runs, [{ kind: "runs", repo: "ccwatts", count: 4 }], "ccwatts runs in the last 7 days");
});

test("CON-3 planning-ID prefix wins over repo; repo is the fallback", () => {
  const f = build();
  const merge = new Map(f.callSheet.merge.map((x) => [key(x), x.goal]));
  assert.equal(merge.get("pm-tools#48"), "portfolio", "DEMO-BAR in pm-tools goes to portfolio via DEMO-");
  assert.equal(merge.get("ccwatts#72"), null, "CCW- matches no prefix and ccwatts no repo");
  const idle = new Map(f.callSheet.idleDrafts.map((x) => [key(x), x.goal]));
  assert.equal(idle.get("ccwatts#71"), null);
});

// Hand count, effort units (open non-Dependabot PRs + runs in the last 7 days):
//   agent-team    PRs pm-tools#50 (PMT-), pm-tools#47 (repo), role-radar#64 (AGT-) = 3
//                 runs feed-builder 2, old-polish 1 (no PR, repo), rr-evals 1 = 4      -> 7
//   portfolio     PR pm-tools#48 (DEMO-) = 1; runs demo-bar 4                         -> 5
//   staff-pm-role PR role-radar#63 (RR- no prefix, repo) = 1; runs rr-demo-bar 4      -> 5
//   hearth-beta   nothing                                                               -> 0
//   off-goal      PRs ccwatts#72, #71 = 2; runs pace-spike 4                            -> 6
//   total 23 -> 30.43, 21.74, 21.74, 0, 26.09 -> largest remainder: 30, 22, 22, 0, 26
test("CON-3 effort: integer shares by goal plus off-goal match the hand count and sum to 100", () => {
  const f = build();
  assert.deepEqual(f.goals.map((g) => [g.id, g.effort]), [
    ["staff-pm-role", 22],
    ["portfolio", 22],
    ["hearth-beta", 0],
    ["agent-team", 30],
  ]);
  assert.equal(f.offGoalEffort, 26);
  assert.equal(f.goals.reduce((s, g) => s + g.effort, 0) + f.offGoalEffort, 100);
  for (const g of f.goals) assert.ok(Number.isInteger(g.effort), g.id);
  assert.deepEqual(f.goals.map((g) => [g.name, g.measure]), JSON.parse(read("goals.json")).map((g: Goal) => [g.name, g.measure]));
});

test("CON-3 effort: a PR in a matching repo counts toward its goal when it is the only work", () => {
  const input = fixtureInput();
  const only = input.products.find((p) => p.repo === "role-radar")!;
  only.prs = [only.prs[0]];
  only.runLogs = {};
  input.products = [only];
  const f = build(input);
  assert.equal(f.goals.find((g) => g.id === "staff-pm-role")?.effort, 100);
  assert.equal(f.offGoalEffort, 0);
  assert.deepEqual(f.offGoal, []);
});

// ---------------------------------------------------------------- CON-4: Call Sheet groups

test("CON-4 ready to merge: not draft, not Dependabot, checks success", () => {
  assert.deepEqual(build().callSheet.merge.map(key).sort(), ["ccwatts#72", "pm-tools#48"]);
});

test("CON-4 idle drafts: draft and updated more than 24h before now (23h old stays out)", () => {
  const idle = build().callSheet.idleDrafts.map(key).sort();
  assert.deepEqual(idle, ["ccwatts#71"], "role-radar#64 was updated 23h ago, pm-tools#50 3h ago");
});

test("CON-4 Dependabot PRs collapse into one item per repo, whatever their checks", () => {
  const f = build();
  assert.deepEqual(f.callSheet.dependabot, [{ repo: "ccwatts", count: 2 }]);
  const listed = [...f.callSheet.merge, ...f.callSheet.idleDrafts].map(key);
  assert.ok(!listed.includes("ccwatts#69") && !listed.includes("ccwatts#70"), "Dependabot PRs are only in the batch");
});

test("CON-R1 CON-4 every PR lands in exactly one group: merge, failing, inProgress, idleDrafts or the Dependabot batch", () => {
  const input = fixtureInput();
  const f = build(input);
  const sets = {
    merge: new Set((f.callSheet.merge ?? []).map(key)),
    failing: new Set((f.callSheet.failing ?? []).map(key)),
    inProgress: new Set((f.callSheet.inProgress ?? []).map(key)),
    idleDrafts: new Set((f.callSheet.idleDrafts ?? []).map(key)),
  };
  const bots = new Map(f.callSheet.dependabot.map((d) => [d.repo, d.count]));
  let botCount = 0;
  for (const pr of allPrs(input)) {
    const isBot = pr.author === "dependabot[bot]";
    if (isBot) botCount++;
    const groups = [...Object.entries(sets).filter(([, s]) => s.has(key(pr))).map(([g]) => g), ...(isBot && bots.has(pr.repo) ? ["dependabot"] : [])];
    assert.equal(groups.length, 1, `${key(pr)} is in ${JSON.stringify(groups)}`);
  }
  assert.equal([...bots.values()].reduce((a, b) => a + b, 0), botCount, "batch counts cover every Dependabot PR");
});

test("CON-R1 failing: not draft with failing checks; inProgress: pending/none checks or a draft updated within 24h", () => {
  const f = build();
  assert.deepEqual((f.callSheet.failing ?? []).map(key).sort(), ["role-radar#63"], "RR-M2.3 checks failure");
  assert.deepEqual((f.callSheet.inProgress ?? []).map(key).sort(), ["pm-tools#47", "pm-tools#50", "role-radar#64"],
    "#47 checks none, #50 draft 3h old, #64 draft 23h old");
  const rr63 = (f.callSheet.failing ?? []).find((x) => key(x) === "role-radar#63");
  assert.deepEqual(rr63, { repo: "role-radar", number: 63, title: "RR-M2.3: Demo bar", goal: "staff-pm-role" });
});

test("CON-R1 a draft with failing checks updated over 24h ago is an idle draft, not failing", () => {
  const input = fixtureInput();
  const rr = input.products.find((p) => p.repo === "role-radar")!;
  rr.prs = rr.prs.map((pr): PullRequest => (pr.number === 63 ? { ...pr, draft: true, updatedAt: "2026-10-29T12:00:00Z" } : pr));
  const f = build(input);
  assert.ok(f.callSheet.idleDrafts.map(key).includes("role-radar#63"));
  assert.ok(!(f.callSheet.failing ?? []).map(key).includes("role-radar#63"));
});

test("CON-4 a Dependabot draft still goes to the batch, not idle drafts", () => {
  const input = fixtureInput();
  const cc = input.products.find((p) => p.repo === "ccwatts")!;
  cc.prs = cc.prs.map((pr): PullRequest => (pr.number === 70 ? { ...pr, draft: true } : pr));
  const f = build(input);
  assert.ok(!f.callSheet.idleDrafts.map(key).includes("ccwatts#70"));
  assert.deepEqual(f.callSheet.dependabot, [{ repo: "ccwatts", count: 2 }]);
});

// ---------------------------------------------------------------- CON-5: gates

test("CON-5 parseAgentsLine: ran and skipped agents from the Agents: line", () => {
  const body = "Summary.\n\nAgents: staff-pm scoped M1.2; qa-tdd red then green, 3x; ux-reviewer skipped: docs only\n\nMore text.";
  assert.deepEqual(core().parseAgentsLine(body), [
    { agent: "staff-pm", status: "ran" },
    { agent: "qa-tdd", status: "ran" },
    { agent: "ux-reviewer", status: "skipped" },
  ]);
});

test("CON-5 parseAgentsLine: no Agents: line gives an empty list; a mention mid-line is not the line", () => {
  assert.deepEqual(core().parseAgentsLine("No agents line here.\nSee the Agents: section in CLAUDE.md."), []);
  assert.deepEqual(core().parseAgentsLine(""), []);
});

test("CON-5 parseAgentsLine: an agent named twice counts once, as ran", () => {
  assert.deepEqual(core().parseAgentsLine("Agents: qa-tdd red; engineer built; qa-tdd green 3x"), [
    { agent: "qa-tdd", status: "ran" },
    { agent: "engineer", status: "ran" },
  ]);
});

test("CON-5 gates: ok when named and logged, missing when named but not logged, n/a otherwise", () => {
  const gates = new Map(build().gates.map((g) => [key(g), g.gates]));
  const na = { "staff-pm": "n/a", "qa-tdd": "n/a", engineer: "n/a", "ux-reviewer": "n/a", "privacy-security": "n/a" };
  assert.deepEqual(gates.get("pm-tools#48"), { "staff-pm": "ok", "qa-tdd": "ok", engineer: "ok", "ux-reviewer": "missing", "privacy-security": "n/a" });
  assert.deepEqual(gates.get("ccwatts#72"), { "staff-pm": "missing", "qa-tdd": "ok", engineer: "ok", "ux-reviewer": "n/a", "privacy-security": "n/a", positioning: "ok" });
  assert.deepEqual(gates.get("pm-tools#50"), { ...na, "staff-pm": "ok", "qa-tdd": "ok" });
  assert.deepEqual(gates.get("role-radar#63"), { "staff-pm": "ok", "qa-tdd": "ok", engineer: "ok", "ux-reviewer": "ok", "privacy-security": "n/a" });
  assert.deepEqual(gates.get("role-radar#64"), { ...na, architect: "ok", "qa-tdd": "ok" }, "a log entry older than 7 days still proves the gate");
  assert.deepEqual(gates.get("pm-tools#47"), na, "no Agents: line");
  assert.deepEqual(gates.get("ccwatts#71"), na, "skipped is n/a, not missing");
});

test("CON-R5 gates: only roster agents become gate keys; other first words on the Agents: line are ignored", () => {
  const input = fixtureInput();
  const pm = input.products.find((p) => p.repo === "pm-tools")!;
  pm.prs = pm.prs.map((pr): PullRequest => (pr.number === 47
    ? { ...pr, body: "Agents: none of these ran; see notes below; architect picked the stack; chase-only-note here; qa-tdd red" }
    : pr));
  pm.runLogs = { ...pm.runLogs, "claude/studio-refresh": "2026-10-31T09:00:00Z architect\n" };
  const row = build(input).gates.find((g) => key(g) === "pm-tools#47")!.gates;
  assert.deepEqual(row, { "staff-pm": "n/a", "qa-tdd": "missing", engineer: "n/a", "ux-reviewer": "n/a", "privacy-security": "n/a", architect: "ok" },
    "architect (on the roster) is kept; none, see and chase-only-note are not");
});

test("CON-R5 gates: every gate key in the fixture feed is a core gate or on the roster", () => {
  const known = new Set(["staff-pm", "qa-tdd", "engineer", "ux-reviewer", "privacy-security", ...roster()]);
  for (const g of build().gates) for (const k of Object.keys(g.gates)) assert.ok(known.has(k), `${key(g)}: ${k}`);
});

test("CON-5 gates: one row per open non-Dependabot PR", () => {
  assert.deepEqual(build().gates.map(key).sort(), ["ccwatts#71", "ccwatts#72", "pm-tools#47", "pm-tools#48", "pm-tools#50", "role-radar#63", "role-radar#64"]);
});

// ---------------------------------------------------------------- CON-6: runs per agent

test("CON-6 parseRunLog: '<ISO time> <agent>' lines, junk skipped", () => {
  assert.deepEqual(core().parseRunLog(read("runlogs/pm-tools/claude-feed-builder.log")), [
    { at: "2026-10-31T08:00:00Z", agent: "staff-pm" },
    { at: "2026-10-31T08:30:00Z", agent: "qa-tdd" },
  ]);
  assert.deepEqual(core().parseRunLog(""), []);
  assert.deepEqual(core().parseRunLog("2026-10-30T20:00:00Z staff-pm\r\n2026-10-30T21:10:00Z qa-tdd\r\n").map((r) => r.agent), ["staff-pm", "qa-tdd"], "CRLF endings");
});

// Hand count, runs with now - 7d < at <= now (2026-10-24T12:00Z to 2026-10-31T12:00Z):
//   pm-tools   demo-bar: staff-pm, qa-tdd x2, engineer; feed-builder: staff-pm, qa-tdd (5 junk lines);
//              old-polish: ux-reviewer Oct 26 (Oct 20 is too old)    -> staff-pm 2, qa-tdd 3, engineer 1, ux-reviewer 1
//   ccwatts    pace-spike: qa-tdd x2, engineer, positioning           -> qa-tdd 2, engineer 1, positioning 1
//   role-radar rr-demo-bar: staff-pm, qa-tdd, engineer, ux-reviewer; rr-evals: qa-tdd Oct 30
//              (architect Oct 21 too old, qa-tdd Nov 2 in the future) -> staff-pm 1, qa-tdd 2, engineer 1, ux-reviewer 1
test("CON-6 runs per agent per product for the last 7 days match the hand count", () => {
  assert.deepEqual(build().runs, {
    "pm-tools": { "staff-pm": 2, "qa-tdd": 3, engineer: 1, "ux-reviewer": 1 },
    ccwatts: { "qa-tdd": 2, engineer: 1, positioning: 1 },
    "role-radar": { "staff-pm": 1, "qa-tdd": 2, engineer: 1, "ux-reviewer": 1 },
  });
});

test("CON-6 a product with no run logs has an empty runs entry", () => {
  const input = fixtureInput();
  for (const p of input.products) p.runLogs = {};
  assert.deepEqual(build(input).runs, { "pm-tools": {}, ccwatts: {}, "role-radar": {} });
});

// ---------------------------------------------------------------- CON-7: schema and privacy

function assertFeedShape(f: Feed) {
  assert.deepEqual(Object.keys(f).sort(), ["builtAt", "callSheet", "gates", "goals", "offGoal", "offGoalEffort", "products", "runs"]);
  assert.equal(f.builtAt, NOW.toISOString());
  assert.ok(Array.isArray(f.goals) && f.goals.every((g) => typeof g.id === "string" && typeof g.name === "string" && typeof g.measure === "string" && Number.isInteger(g.effort)));
  assert.ok(Number.isInteger(f.offGoalEffort));
  assert.ok(f.offGoal.every((o) => (o.kind === "pr" && typeof o.number === "number" && typeof o.title === "string") || (o.kind === "runs" && Number.isInteger(o.count))));
  assert.deepEqual(Object.keys(f.callSheet).sort(), ["decide", "dependabot", "failing", "idleDrafts", "inProgress", "merge"]);
  for (const g of [f.callSheet.merge, f.callSheet.failing, f.callSheet.inProgress, f.callSheet.idleDrafts]) {
    assert.ok(g.every((x) => typeof x.repo === "string" && Number.isInteger(x.number) && typeof x.title === "string" && (x.goal === null || typeof x.goal === "string")));
  }
  assert.ok(f.callSheet.decide.every((d) => typeof d.text === "string" && (d.repo === null || typeof d.repo === "string")));
  assert.ok(f.callSheet.dependabot.every((d) => typeof d.repo === "string" && Number.isInteger(d.count) && d.count > 0));
  assert.ok(f.products.every((p) => ["present", "missing"].includes(p.header) && Array.isArray(p.now) && Number.isInteger(p.openPrs)));
  assert.ok(f.gates.every((g) => Object.values(g.gates).every((s) => ["ok", "missing", "n/a"].includes(s))));
  assert.ok(Object.values(f.runs).every((m) => Object.values(m).every((n) => Number.isInteger(n) && n > 0)));
  assert.deepEqual(JSON.parse(JSON.stringify(f)), f, "plain JSON, no Dates or undefined");
}

test("CON-7 studio.json validates against the Feed schema", () => {
  assertFeedShape(build());
});

test("CON-7 same input and clock give the same feed", () => {
  assert.deepEqual(build(), build());
});

test("CON-7 output holds no PR body text (the Agents: line included)", () => {
  const input = fixtureInput();
  const out = JSON.stringify(build(input));
  for (const pr of allPrs(input)) {
    for (const line of pr.body.split("\n").map((l) => l.trim()).filter((l) => l.length >= 20)) {
      assert.ok(!out.includes(line), `${key(pr)} body line leaked: ${line.slice(0, 30)}`);
    }
  }
  assert.ok(!out.includes("Sentinel body"));
});

test("CON-7 output passes check-private and never names a private repo, even when inputs carry personal data", () => {
  const input = fixtureInput();
  // Built at runtime so this test file itself stays clean for check:private.
  const email = ["sam.rivera", "mailbox-sample.io"].join("@");
  const phone = ["415", "555", "0134"].join("-");
  const artifact = "claude" + ".ai/artifact/" + "0f3c9a2b-sample-1234";
  const pm = input.products.find((p) => p.repo === "pm-tools")!;
  pm.prs[1] = { ...pm.prs[1], title: `DEMO-BAR: slim demo bar (preview ${artifact})`, body: `Reach me at ${email}.\n${pm.prs[1].body}` };
  const cc = input.products.find((p) => p.repo === "ccwatts")!;
  cc.handoff = cc.handoff.replace("- Methodology page copy pass.", `- Methodology page copy pass with ${email}.`);
  const rr = input.products.find((p) => p.repo === "role-radar")!;
  rr.handoff = rr.handoff.replace("  - Pick the weekday scan time", `  - Pick the weekday scan time, call ${phone}`);
  const f = build(input);
  assertFeedShape(f);
  const out = JSON.stringify(f, null, 2);
  assert.deepEqual(scanText(out, ["family-vault"]), [], "check-private patterns and the private repo name");
  assert.ok(f.callSheet.merge.some((x) => key(x) === "pm-tools#48"), "the PR is still listed, its title redacted");
});

test("CON-7 core.ts is pure: no I/O, network or clock imports", () => {
  const src = readFileSync(CORE, "utf8");
  for (const bad of [/from\s+["']node:(fs|fs\/promises|http|https|net|child_process|dns|tls|os)["']/, /\bfetch\s*\(/, /\bDate\.now\s*\(/, /new Date\(\s*\)/, /\bprocess\.(env|argv|cwd)/, /check-private\.ts/]) {
    assert.ok(!bad.test(src), `core.ts must not use ${bad}`);
  }
});

test("CON-7 the fixtures themselves hold no personal data", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  for (const f of walk(FIX)) assert.deepEqual(scanText(readFileSync(f, "utf8")), [], f);
});
