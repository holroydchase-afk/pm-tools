// Test-only fake GitHub API for tests/feed-fetch.test.ts (CON-R2, CON-R4). Never used by the app.
// In-process: `globalThis.fetch = stubFetch(scenario)`. In a child process:
// `node --import ./tests/fixtures/feed-fetch/stub-fetch.ts ...` with STUB_FETCH_SCENARIO=<json file>.
// Any request that is not api.github.com throws, so a test can never reach the network.
import { readFileSync } from "node:fs";

// prs: open PRs as the REST API returns them (SEC-C2 reads user.login and author_association).
export type StubPr = { number: number; title: string; login: string; author_association: string; draft?: boolean };
// closed: closed PRs (state=closed); merged_at null means closed without merging (PMT-M3.3 Done column).
// login and author_association default to the repo owner (CON-R14 sets them).
export type StubClosed = { number: number; title: string; merged_at: string | null; closed_at: string; login?: string; author_association?: string };
export type StubRepo = { status?: number; body?: string; private?: boolean; handoff?: string; prs?: StubPr[]; closed?: StubClosed[] };
export type Scenario = { repos: Record<string, StubRepo> };

const json = (status: number, data: unknown) =>
  new Response(typeof data === "string" ? data : JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export function stubFetch(scenario: Scenario): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.host !== "api.github.com") throw new Error(`stub-fetch: no network in tests (${url.host})`);
    const m = /^\/repos\/[^/]+\/([^/]+)(\/.*)?$/.exec(url.pathname);
    const entry = m ? scenario.repos[m[1]] : undefined;
    if (!m || !entry) return json(404, { message: "Not Found" });
    if (entry.status) return json(entry.status, entry.body ?? { message: "stub error" });
    const rest = m[2] ?? "";
    if (rest === "") return json(200, { private: !!entry.private });
    if (rest === "/contents/HANDOFF.md") return entry.handoff === undefined ? json(404, { message: "Not Found" }) : new Response(entry.handoff, { status: 200 });
    if (rest.startsWith("/contents/")) return json(404, { message: "Not Found" });
    if (rest === "/pulls" && url.searchParams.get("state") === "closed") return json(200, (entry.closed ?? []).map((p) => ({
      number: p.number, title: p.title, draft: false, user: { login: p.login ?? "sample-owner" }, author_association: p.author_association ?? "OWNER",
      updated_at: p.closed_at, closed_at: p.closed_at, merged_at: p.merged_at, body: "", head: { ref: `branch-${p.number}`, sha: `sha${p.number}` },
    })));
    if (rest === "/pulls") return json(200, (entry.prs ?? []).map((p) => ({
      number: p.number, title: p.title, draft: !!p.draft, user: { login: p.login }, author_association: p.author_association,
      updated_at: "2026-10-31T11:00:00Z", body: "", head: { ref: `branch-${p.number}`, sha: `sha${p.number}` },
    })));
    if (rest === "/issues") return json(200, []);
    if (rest.includes("/check-runs")) return json(200, { check_runs: [] });
    return json(404, { message: "Not Found" });
  }) as typeof fetch;
}

if (process.env.STUB_FETCH_SCENARIO) {
  globalThis.fetch = stubFetch(JSON.parse(readFileSync(process.env.STUB_FETCH_SCENARIO, "utf8")) as Scenario);
}
