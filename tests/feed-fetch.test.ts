// PMT-M3.1 review fixes CON-R2 (one repo failing never kills the feed) and CON-R4 (build-feed's
// privacy guard honours PRIVATE_DENYLIST). The GitHub API is faked by
// tests/fixtures/feed-fetch/stub-fetch.ts (test-only); nothing here touches the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFeedInput, type ConsoleConfig } from "../scripts/feed/fetch.ts";
import type { Goal } from "../scripts/feed/types.ts";
import { stubFetch, type Scenario } from "./fixtures/feed-fetch/stub-fetch.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const STUB = join(ROOT, "tests", "fixtures", "feed-fetch", "stub-fetch.ts");
const BUILD = join(ROOT, "scripts", "build-feed.ts");
const goals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as Goal[];
const HANDOFF = "# Handoff: sample\n\n## In progress\n- Sample work in progress.\n";
const RATE_LIMIT = JSON.stringify({ message: "API rate limit exceeded for 203.0.113.7.", documentation_url: "https://docs.github.com/rest" });

const config = (...repos: string[]): ConsoleConfig => ({
  owner: "sample-owner", statusRepo: "pm-tools", products: repos.map((repo) => ({ repo, name: repo, code: "X" })),
});

async function withStub<T>(scenario: Scenario, fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = stubFetch(scenario);
  try { return await fn(); } finally { globalThis.fetch = real; }
}

test("CON-R2 fetch: a repo answering 500 and one answering 404 are skipped; the other repos still load", async () => {
  const { input, skipped } = await withStub(
    { repos: { "pm-tools": { handoff: HANDOFF }, ccwatts: { status: 500 }, "studio-agents": { handoff: HANDOFF } } },
    () => fetchFeedInput(config("pm-tools", "ccwatts", "role-radar", "studio-agents"), goals),
  );
  assert.deepEqual(input.products.map((p) => p.repo), ["pm-tools", "studio-agents"]);
  assert.deepEqual(skipped.map((s) => s.repo).sort(), ["ccwatts", "role-radar"]);
  assert.equal(skipped.find((s) => s.repo === "role-radar")?.reason, "not found");
});

test("CON-R2 fetch: a 403 rate limit is reported as a skip, not thrown", async () => {
  const { input, skipped } = await withStub(
    { repos: { "pm-tools": { handoff: HANDOFF }, ccwatts: { status: 403, body: RATE_LIMIT } } },
    () => fetchFeedInput(config("pm-tools", "ccwatts"), goals),
  );
  assert.deepEqual(input.products.map((p) => p.repo), ["pm-tools"]);
  assert.match(skipped.find((s) => s.repo === "ccwatts")?.reason ?? "", /rate limit/i);
});

test("CON-R2 fetch: every repo rate limited resolves with no products instead of throwing", async () => {
  const { input, skipped } = await withStub(
    { repos: { "pm-tools": { status: 403, body: RATE_LIMIT }, ccwatts: { status: 403, body: RATE_LIMIT } } },
    () => fetchFeedInput(config("pm-tools", "ccwatts"), goals),
  );
  assert.deepEqual(input.products, []);
  assert.ok(skipped.some((s) => s.repo === "ccwatts" && /rate limit/i.test(s.reason)));
});

// build-feed end to end in a child process, with the stub preloaded and no token.
function runBuild(scenario: Scenario, denylist?: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "feed-fetch-"));
  const scenarioPath = join(dir, "scenario.json");
  writeFileSync(scenarioPath, JSON.stringify(scenario));
  const env: NodeJS.ProcessEnv = { ...process.env, STUB_FETCH_SCENARIO: scenarioPath };
  delete env.GITHUB_TOKEN;
  delete env.PRIVATE_DENYLIST;
  if (denylist) { env.PRIVATE_DENYLIST = join(dir, "denylist.txt"); writeFileSync(env.PRIVATE_DENYLIST, denylist.join("\n") + "\n"); }
  const out = join(dir, "studio.json");
  const r = spawnSync(process.execPath, ["--import", STUB, BUILD, "--out", out], { cwd: ROOT, env, encoding: "utf8" });
  return { status: r.status, logs: r.stdout + r.stderr, feed: existsSync(out) ? readFileSync(out, "utf8") : null };
}

// The rest of console.config.json 404s, including Hearth, whose name is also in a goal name
// ("Hearth beta on Nov 22"): an unreadable repo must not stop the whole feed.
test("CON-R2 build-feed: one repo failing with 500 and the rest 404 (one named in a goal) still writes a feed with the readable repo", () => {
  const r = runBuild({ repos: { "pm-tools": { handoff: HANDOFF }, ccwatts: { status: 500 } } });
  assert.equal(r.status, 0, r.logs);
  assert.ok(r.feed, "studio.json written");
  assert.deepEqual((JSON.parse(r.feed) as { products: { repo: string }[] }).products.map((p) => p.repo), ["pm-tools"]);
  assert.match(r.logs, /skipped ccwatts/);
});

// "Bluebird Labs" is a made-up company standing in for a PRIVATE_DENYLIST entry.
const DENIED = "Bluebird Labs";
// Hearth is readable here so the CON-R2 goal-name problem above doesn't mask this check.
const deniedScenario: Scenario = { repos: {
  "pm-tools": { handoff: `# Handoff\n\n## In progress\n- Pitch deck for ${DENIED}.\n- Sample work in progress.\n` },
  Hearth: { handoff: HANDOFF },
} };

test("CON-R4 build-feed: a PRIVATE_DENYLIST term never reaches studio.json or the build log", () => {
  const r = runBuild(deniedScenario, [DENIED]);
  if (r.feed !== null) assert.ok(!r.feed.toLowerCase().includes(DENIED.toLowerCase()), "denylisted term written to studio.json");
  assert.ok(!r.logs.includes(DENIED), "denylisted term echoed in the build log");
});

test("CON-R4 build-feed: without that term on the denylist, the same text is published (the guard is the denylist, not the text)", () => {
  const r = runBuild(deniedScenario, ["Some Other Sample Co"]);
  assert.equal(r.status, 0, r.logs);
  assert.ok(r.feed?.includes(DENIED));
});

// ---------------------------------------------------------------- PMT-M3.2 security review

test("SEC-C2 fetch: only PRs by an owner, member, collaborator or Dependabot reach the feed; outsiders' PRs are dropped", async () => {
  const prs = [
    { number: 1, title: "Owner PR", login: "sample-owner", author_association: "OWNER" },
    { number: 2, title: "Member PR", login: "sample-member", author_association: "MEMBER" },
    { number: 3, title: "Collaborator PR", login: "sample-collab", author_association: "COLLABORATOR" },
    { number: 4, title: "Bump left-pad", login: "dependabot[bot]", author_association: "NONE" },
    { number: 5, title: "<img src=x> drive-by", login: "sample-stranger", author_association: "NONE" },
    { number: 6, title: "First-time contributor", login: "sample-newcomer", author_association: "FIRST_TIME_CONTRIBUTOR" },
    { number: 7, title: "Past contributor", login: "sample-contributor", author_association: "CONTRIBUTOR" },
  ];
  const { input } = await withStub(
    { repos: { "pm-tools": { handoff: HANDOFF, prs } } },
    () => fetchFeedInput(config("pm-tools"), goals),
  );
  assert.deepEqual(input.products[0].prs.map((p) => p.number).sort((a, b) => a - b), [1, 2, 3, 4], "allowed authors kept");
});

test("SEC-C4 fetch: every repo skipped for any reason (404, 403, 5xx, private) is added to privateRepos", async () => {
  const { input, skipped } = await withStub(
    { repos: { "pm-tools": { handoff: HANDOFF }, ccwatts: { status: 500 }, Hearth: { status: 403, body: RATE_LIMIT }, "family-vault": { private: true } } },
    () => fetchFeedInput(config("pm-tools", "ccwatts", "role-radar", "Hearth", "family-vault"), goals),
  );
  assert.deepEqual(skipped.map((s) => s.repo).sort(), ["Hearth", "ccwatts", "family-vault", "role-radar"]);
  assert.deepEqual([...(input.privateRepos ?? [])].sort(), ["Hearth", "ccwatts", "family-vault", "role-radar"], "500 and 403 repos count as private too");
});

// ---------------------------------------------------------------- PMT-M3.3 (Build Slate group, Horizon Done)

test("CON-12 fetch: a product's console.config.json group reaches the feed input", async () => {
  const cfg: ConsoleConfig = { owner: "sample-owner", statusRepo: "pm-tools", products: [{ repo: "pm-tools", name: "PM tools", code: "PMT", group: "Studio tools" }, { repo: "ccwatts", name: "ccwatts", code: "CCW" }] };
  const { input } = await withStub({ repos: { "pm-tools": { handoff: HANDOFF }, ccwatts: { handoff: HANDOFF } } }, () => fetchFeedInput(cfg, goals));
  assert.deepEqual(input.products.map((p) => (p as { group?: string }).group ?? null), ["Studio tools", null]);
});

test("CON-14 fetch: merged PRs (not ones closed unmerged) reach the input as { number, title, mergedAt }", async () => {
  const closed = [
    { number: 9, title: "CCW-M2.6: Release plan", merged_at: "2026-10-30T10:00:00Z", closed_at: "2026-10-30T10:00:00Z" },
    { number: 8, title: "Abandoned idea", merged_at: null, closed_at: "2026-10-30T09:00:00Z" },
  ];
  const { input } = await withStub({ repos: { ccwatts: { handoff: HANDOFF, closed } } }, () => fetchFeedInput(config("ccwatts"), goals));
  assert.deepEqual((input.products[0] as { merged?: unknown }).merged, [{ number: 9, title: "CCW-M2.6: Release plan", mergedAt: "2026-10-30T10:00:00Z" }]);
});
