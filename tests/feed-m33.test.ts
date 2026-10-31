// PMT-M3.3 feed additions for Build Slate, Horizon Board and Agent Roster (CON-12 to CON-15).
// Pure core.ts tests on made-up data. New fields (types.ts gains them in M3.3):
//
//   FeedInput.wipCap?: number            console.config.json `wipCap`; Feed.wipCap defaults to 5.
//   ProductInput.group?: string          console.config.json `group` (e.g. "Studio tools").
//   ProductInput.merged?: MergedPr[]     PRs merged recently: { number, title, mergedAt }.
//   ProductSummary.group: string | null
//   ProductSummary.track: "idea" | "building" | "beta" | "live" | "parked" | null
//                                        stage normalized: idea, build|building, beta, live, parked;
//                                        anything else (e.g. "polish") is null and the raw stage still shows.
//   ProductSummary.lastRun: { agent, at } | null   newest run-log entry across the product's logs (any date).
//   ProductSummary.health: { level: "ok" | "warn" | "bad", note: string }
//                                        bad: a failing non-Dependabot PR or any blocker;
//                                        warn: a draft idle over 24h; else ok. note is never empty.
//   ProductSummary.later: string[]       header `later:` list, else "## Later" section (first 3 bullets).
//   Feed.horizon: { repo, now: Card[], next: Card[], later: Card[], done: Card[] }[]   products order.
//     Card = { id: string | null, title: string, pr: number | null }
//     id: a leading planning ID ("CCW-M4.1" in "CCW-M4.1: Pace spike" or "CCW-M4.1 pace spike"),
//         title: the rest; no ID -> id null, title the whole text.
//     now/next/later come from the summary; done = `merged` with mergedAt in the last 7 days.
//     pr: for done, the merged PR; otherwise the open non-Dependabot PR whose title has the same ID.
//     An ID sits in exactly one column per product: done wins, then now, next, later (CON-14).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFeed, parseHandoff, parseRunLog } from "../scripts/feed/core.ts";
import { sampleInput } from "../scripts/build-sample-feed.ts";
import type { FeedInput, ProductInput, PullRequest } from "../scripts/feed/types.ts";

const NOW = new Date("2026-10-31T12:00:00Z");
const ago = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
type Card = { id: string | null; title: string; pr: number | null };
type Row = { repo: string; now: Card[]; next: Card[]; later: Card[]; done: Card[] };
type Summary = { repo: string; group: string | null; track: string | null; lastRun: { agent: string; at: string } | null; health: { level: string; note: string }; later: string[] };
type M33Feed = { wipCap: number; horizon: Row[]; products: Summary[] };
const build = (input: FeedInput) => buildFeed(input, NOW) as unknown as M33Feed;

const header = (lines: string) => `# Handoff\n\n<!-- status\n${lines}\n-->\n`;
function product(repo: string, extra: Partial<ProductInput> & Record<string, unknown> = {}): ProductInput {
  return { repo, name: repo, code: "X", handoff: header("stage: beta\nblockers: []"), prs: [], intake: [], runLogs: {}, ...extra } as ProductInput;
}
const input = (products: ProductInput[], extra: Record<string, unknown> = {}): FeedInput =>
  ({ goals: [], products, studioStatus: "", privateRepos: [], agents: ["staff-pm", "qa-tdd", "engineer"], ...extra }) as FeedInput;

// ---------------------------------------------------------------- CON-12 WIP cap and slate fields

test("CON-12 feed: wipCap comes from the input and defaults to 5", () => {
  assert.equal(build(input([product("a")])).wipCap, 5);
  assert.equal(build(input([product("a")], { wipCap: 6 })).wipCap, 6);
});

test("CON-12 feed: a product's group passes through (null when none), so studio tools can be left out of the WIP count", () => {
  const f = build(input([product("a"), product("pm-tools", { group: "Studio tools" })]));
  assert.deepEqual(f.products.map((p) => p.group), [null, "Studio tools"]);
});

test("CON-12 feed: stage normalizes to the five-step track; an unknown stage gives no track step", () => {
  const stages: [string, string | null][] = [["idea", "idea"], ["build", "building"], ["building", "building"], ["Beta", "beta"], ["live", "live"], ["parked", "parked"], ["polish", null]];
  const f = build(input(stages.map(([s], i) => product(`r${i}`, { handoff: header(`stage: ${s}`) }))));
  assert.deepEqual(f.products.map((p) => p.track), stages.map(([, t]) => t));
  const none = build(input([product("n", { handoff: "# Handoff\n\n## In progress\n- Work.\n" })]));
  assert.equal(none.products[0].track, null, "no header, no track step");
});

test("CON-12 feed: lastRun is the newest run-log entry across the product's logs, or null", () => {
  const base = sampleInput();
  const f = build(base);
  base.products.forEach((p, i) => {
    const entries = Object.values(p.runLogs).flatMap((t) => parseRunLog(t));
    const newest = entries.sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
    assert.deepEqual(f.products[i].lastRun, newest && { agent: newest.agent, at: newest.at }, p.repo);
  });
  assert.equal(build(input([product("quiet")])).products[0].lastRun, null);
});

test("CON-12 feed: health is bad for a failing PR or a blocker, warn for a draft idle over 24h, else ok, always with a note", () => {
  const pr = (number: number, o: Record<string, unknown>) => ({ number, title: `T${number}`, draft: false, author: "sample-builder", updatedAt: ago(1), body: "", checks: "success", branch: `b${number}`, ...o }) as PullRequest;
  const f = build(input([
    product("failing", { prs: [pr(1, { checks: "failure" })] }),
    product("blocked", { handoff: header("stage: beta\nblockers:\n  - Waiting on a review") }),
    product("idle", { prs: [pr(2, { draft: true, updatedAt: ago(30) })] }),
    product("bot-failing", { prs: [pr(3, { checks: "failure", author: "dependabot[bot]" })] }),
    product("fine", { prs: [pr(4, {})] }),
  ] as ProductInput[]));
  assert.deepEqual(f.products.map((p) => p.health.level), ["bad", "bad", "warn", "ok", "ok"]);
  for (const p of f.products) assert.ok(p.health.note.trim().length > 0, `${p.repo} health has a note`);
});

// ---------------------------------------------------------------- CON-14 Horizon

test("CON-14 parseHandoff: `later:` header list, else the \"## Later\" section", () => {
  const h = parseHandoff(header("stage: beta\nlater:\n  - CCW-M5 MCP server\n  - Docs site")) as unknown as { later: string[] };
  assert.deepEqual(h.later, ["CCW-M5 MCP server", "Docs site"]);
  const s = parseHandoff("# Handoff\n\n## Later\n- RR-M3 MCP server\n- Two\n- Three\n- Four\n") as unknown as { later: string[] };
  assert.deepEqual(s.later, ["RR-M3 MCP server", "Two", "Three"]);
});

test("CON-14 horizon: cards from planning IDs land in exactly one of Now/Next/Later/Done, and link their PR when known", () => {
  const handoff = header("stage: beta\nnow: CCW-M4.1 pace spike\nnext: CCW-M4.2: opt-in flag\nlater:\n  - CCW-M5 MCP server\n  - CCW-M4.1 a duplicate of now\n  - Docs site\nblockers: []");
  const prs = [{ number: 72, title: "CCW-M4.1: Pace spike", draft: false, author: "sample-builder", updatedAt: ago(1), body: "", checks: "success", branch: "pace" }];
  const merged = [
    { number: 68, title: "CCW-M2.6: Release plan", mergedAt: ago(48) },
    { number: 66, title: "CCW-M4.2: Opt-in flag", mergedAt: ago(20) },
    { number: 60, title: "CCW-M1.9: Old work", mergedAt: ago(24 * 10) },
  ];
  const f = build(input([product("ccwatts", { handoff, prs, merged } as Partial<ProductInput>)]));
  assert.equal(f.horizon.length, 1);
  const row = f.horizon[0];
  assert.equal(row.repo, "ccwatts");
  assert.deepEqual(row.now, [{ id: "CCW-M4.1", title: "pace spike", pr: 72 }]);
  assert.deepEqual(row.next, [], "CCW-M4.2 merged this week, so it is Done, not Next");
  assert.deepEqual(row.later, [{ id: "CCW-M5", title: "MCP server", pr: null }, { id: null, title: "Docs site", pr: null }], "the duplicate of a Now ID is dropped");
  assert.deepEqual([...row.done].sort((a, b) => a.pr! - b.pr!), [{ id: "CCW-M4.2", title: "Opt-in flag", pr: 66 }, { id: "CCW-M2.6", title: "Release plan", pr: 68 }], "only merges in the last 7 days");
  const ids = [...row.now, ...row.next, ...row.later, ...row.done].map((c) => c.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "each ID in exactly one column");
});

test("CON-14 horizon: one row per product in products order, empty columns when nothing is known", () => {
  const f = build(input([product("a"), product("b")]));
  assert.deepEqual(f.horizon.map((r) => r.repo), ["a", "b"]);
  for (const r of f.horizon) for (const k of ["now", "next", "later", "done"] as const) assert.ok(Array.isArray(r[k]), `${r.repo}.${k}`);
});
