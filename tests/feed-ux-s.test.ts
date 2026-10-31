// PMT-M3.3 review on the real feed (ux-reviewer 4/10): feed-side decisions UX-S1 and UX-S4, and
// qa-tdd findings CON-R12 to CON-R14. Pure core.ts tests plus fetch.ts on the test-only stub.
// The live-shape fixture (tests/fixtures/feed-live/) copies the real feed's shape with made-up text.
//
// New inputs these tests pin (types.ts gains them):
//   ProductInput.stage?: string   console.config.json `stage`; used when the HANDOFF has no status
//                                 header (a header's stage wins). Feeds ProductSummary.stage and .track.
//   Goal.match.keywords?: string[] a PR title containing a keyword (case-insensitive) counts toward
//                                 that goal. Order: ID prefix, then keyword, then repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFeed } from "../scripts/feed/core.ts";
import { fetchFeedInput, type ConsoleConfig } from "../scripts/feed/fetch.ts";
import { scanText } from "../scripts/check-private.ts";
import type { Feed, FeedInput, Goal, ProductInput, PullRequest } from "../scripts/feed/types.ts";
import { stubFetch, type Scenario } from "./fixtures/feed-fetch/stub-fetch.ts";
import { liveInput, LIVE_NOW } from "./fixtures/feed-live/load.ts";

const NOW = LIVE_NOW;
async function withStub<T>(scenario: Scenario, fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = stubFetch(scenario);
  try { return await fn(); } finally { globalThis.fetch = real; }
}
const ago = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const build = (input: FeedInput) => buildFeed(input, NOW);
const header = (lines: string) => `# Handoff\n\n<!-- status\n${lines}\n-->\n`;
function product(repo: string, extra: Record<string, unknown> = {}): ProductInput {
  return { repo, name: repo, code: "X", handoff: "# Handoff\n\n## In progress\n- Work.\n", prs: [], intake: [], runLogs: {}, ...extra } as ProductInput;
}
const input = (products: ProductInput[], extra: Record<string, unknown> = {}): FeedInput =>
  ({ goals: [], products, studioStatus: "", privateRepos: [], agents: ["staff-pm", "qa-tdd", "engineer"], ...extra }) as FeedInput;
const pr = (number: number, title: string, o: Partial<PullRequest> = {}): PullRequest =>
  ({ number, title, draft: false, author: "sample-builder", updatedAt: ago(1), body: "", checks: "success", branch: `b${number}`, ...o });

// ---------------------------------------------------------------- UX-S1 stage fallback

test("UX-S1 feed: with no status header, stage comes from the product's console.config.json `stage`", () => {
  const f = build(input([product("a", { stage: "beta" }), product("b", { stage: "build" }), product("c")]));
  assert.deepEqual(f.products.map((p) => p.stage), ["beta", "build", null]);
  assert.deepEqual(f.products.map((p) => p.track), ["beta", "building", null]);
});

test("UX-S1 feed: a status header's stage wins over the config stage", () => {
  const f = build(input([product("a", { stage: "idea", handoff: header("stage: live") })]));
  assert.equal(f.products[0].stage, "live");
  assert.equal(f.products[0].track, "live");
});

test("UX-S1 feed: on the live-shape fixture (no headers) every product gets its config stage", () => {
  const f = build(liveInput());
  assert.deepEqual(f.products.map((p) => p.track), ["beta", "live", "building", "idea", "building"]);
});

test("UX-S1 fetch: a product's console.config.json `stage` reaches the feed input", async () => {
  const cfg = { owner: "sample-owner", statusRepo: "pm-tools", products: [{ repo: "ccwatts", name: "ccwatts", code: "CCW", stage: "live" }, { repo: "pm-tools", name: "PM tools", code: "PMT" }] } as ConsoleConfig;
  const { input: got } = await withStub({ repos: { ccwatts: { handoff: "# H\n" }, "pm-tools": { handoff: "# H\n" } } }, () => fetchFeedInput(cfg, []));
  assert.deepEqual(got.products.map((p) => (p as { stage?: string }).stage ?? null), ["live", null]);
});

// ---------------------------------------------------------------- UX-S4 goal keywords

const GOALS: Goal[] = [
  { id: "staff-pm-role", name: "Role", measure: "m", match: { repos: ["role-radar"] } },
  { id: "portfolio", name: "Portfolio", measure: "m", match: { repos: ["site"], idPrefixes: ["WEB-"], keywords: ["portfolio card", "demo bar"] } as Goal["match"] },
  { id: "hearth-beta", name: "Hearth", measure: "m", match: { repos: ["Hearth"], idPrefixes: ["HRT-"] } },
];
const goalOf = (f: Feed, repo: string, n: number) => {
  for (const k of ["merge", "failing", "inProgress", "idleDrafts"] as const) {
    const x = f.callSheet[k].find((y) => y.repo === repo && y.number === n);
    if (x) return x.goal;
  }
  throw new Error(`${repo}#${n} not in the Call Sheet`);
};

test("UX-S4 feed: a PR title with a goal keyword counts toward that goal (case-insensitive), not off-goal", () => {
  const f = build(input([product("charlie", { prs: [pr(28, "Log the Portfolio Card in HANDOFF"), pr(29, "CHL-R3: CI runs the browser test")] })], { goals: GOALS }));
  assert.equal(goalOf(f, "charlie", 28), "portfolio");
  assert.equal(goalOf(f, "charlie", 29), null);
  assert.deepEqual(f.offGoal.map((o) => (o.kind === "pr" ? o.number : o.kind)), [29]);
});

test("UX-S4 feed: order is ID prefix, then keyword, then repo", () => {
  const f = build(input([
    product("role-radar", { prs: [pr(62, "Demo bar: link the sample tracker")] }),
    product("Hearth", { prs: [pr(90, "HRT-M2.1: demo bar for the beta page")] }),
  ], { goals: GOALS }));
  assert.equal(goalOf(f, "role-radar", 62), "portfolio", "keyword beats repo");
  assert.equal(goalOf(f, "Hearth", 90), "hearth-beta", "ID prefix beats keyword");
});

test("UX-S4 feed: a keyword must be in the title; a goal with no keywords matches as before", () => {
  const f = build(input([product("charlie", { prs: [pr(30, "Portfolio tweaks"), pr(31, "Card layout")] })], { goals: GOALS }));
  assert.equal(goalOf(f, "charlie", 30), null);
  assert.equal(goalOf(f, "charlie", 31), null);
});

test("UX-S4 feed: on the live-shape fixture 3 of the 7 open PRs are off-goal", () => {
  const f = build(liveInput());
  assert.deepEqual(f.offGoal.filter((o) => o.kind === "pr").map((o) => `${o.repo}#${(o as { number: number }).number}`).sort(), ["ccwatts#74", "charlie#29", "energy-scanner#37"]);
});

// ---------------------------------------------------------------- CON-R12 privacy on Horizon inputs (P1)

test("CON-R12 a merged PR title or Later bullet naming a private repo is dropped; an email in one is redacted", () => {
  const email = ["sam.rivera", "mailbox-sample.io"].join("@");
  const handoff = header(`stage: beta\nlater:\n  - Move secrets out of family-vault\n  - Ask ${email} about the docs site\n  - Docs site`);
  const merged = [
    { number: 70, title: "Copy the deploy key from family-vault", mergedAt: ago(5) },
    { number: 71, title: `CCW-M2.7: Thank ${email} in the README`, mergedAt: ago(6) },
    { number: 72, title: "CCW-M2.8: Release notes", mergedAt: ago(7) },
  ];
  const f = build(input([product("ccwatts", { handoff, merged })], { privateRepos: ["family-vault"] }));
  const row = f.horizon[0];
  assert.deepEqual(row.done.map((c) => c.pr).sort(), [71, 72], "the merge naming the private repo is dropped");
  assert.equal(row.later.length, 2, "the Later bullet naming the private repo is dropped");
  const out = JSON.stringify(f);
  assert.deepEqual(scanText(out, ["family-vault"]), [], "no email or private repo name anywhere in the feed");
  assert.ok(out.includes("[redacted]"), "the email is redacted, the item kept");
});

// ---------------------------------------------------------------- CON-R13 shape of the M3.3 fields (P2)

test("CON-R13 feed shape: horizon cards, wipCap, health and track have their declared types", () => {
  const f = build(liveInput());
  assert.ok(Number.isInteger(f.wipCap) && f.wipCap > 0);
  assert.ok(f.products.every((p) => ["ok", "warn", "bad"].includes(p.health.level) && typeof p.health.note === "string" && p.health.note.length > 0));
  assert.ok(f.products.every((p) => p.track === null || ["idea", "building", "beta", "live", "parked"].includes(p.track)));
  assert.ok(f.products.every((p) => p.group === null || typeof p.group === "string"));
  assert.ok(f.products.every((p) => p.lastRun === null || (typeof p.lastRun.agent === "string" && typeof p.lastRun.at === "string")));
  assert.deepEqual(f.horizon.map((r) => r.repo), f.products.map((p) => p.repo));
  for (const r of f.horizon) {
    assert.deepEqual(Object.keys(r).sort(), ["done", "later", "next", "now", "repo"]);
    for (const k of ["now", "next", "later", "done"] as const) {
      for (const c of r[k]) {
        assert.deepEqual(Object.keys(c).sort(), ["id", "pr", "title"], `${r.repo}.${k} card keys`);
        assert.ok((c.id === null || typeof c.id === "string") && typeof c.title === "string" && (c.pr === null || Number.isInteger(c.pr)));
      }
    }
  }
});

test("CON-R13 feed: an invalid wipCap (0, negative, fraction, string) falls back to 5", () => {
  for (const bad of [0, -1, 2.5, "7", null]) assert.equal(build(input([product("a")], { wipCap: bad })).wipCap, 5, `wipCap ${JSON.stringify(bad)}`);
});

// ---------------------------------------------------------------- CON-R14 fetch: which merged PRs count (P2)

test("CON-R14 fetch: merged PRs from people without write access, and Dependabot merges, stay off Horizon", async () => {
  const closed = [
    { number: 9, title: "CCW-M2.6: Release plan", merged_at: "2026-10-30T10:00:00Z", closed_at: "2026-10-30T10:00:00Z" },
    { number: 10, title: "Drive-by typo fix", merged_at: "2026-10-30T11:00:00Z", closed_at: "2026-10-30T11:00:00Z", login: "stranger", author_association: "CONTRIBUTOR" },
    { number: 11, title: "First-time fix", merged_at: "2026-10-30T12:00:00Z", closed_at: "2026-10-30T12:00:00Z", login: "newcomer", author_association: "NONE" },
    { number: 12, title: "Bump vitest", merged_at: "2026-10-30T13:00:00Z", closed_at: "2026-10-30T13:00:00Z", login: "dependabot[bot]", author_association: "NONE" },
    { number: 13, title: "CCW-M2.7: Docs", merged_at: "2026-10-30T14:00:00Z", closed_at: "2026-10-30T14:00:00Z", login: "teammate", author_association: "COLLABORATOR" },
  ];
  const cfg: ConsoleConfig = { owner: "sample-owner", statusRepo: "pm-tools", products: [{ repo: "ccwatts", name: "ccwatts", code: "CCW" }] };
  const { input: got } = await withStub({ repos: { ccwatts: { handoff: "# H\n", closed } } }, () => fetchFeedInput(cfg, []));
  assert.deepEqual(((got.products[0] as { merged?: { number: number }[] }).merged ?? []).map((m) => m.number).sort(), [13, 9].sort());
});
