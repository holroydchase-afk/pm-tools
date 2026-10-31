// Test-only fake GitHub API for tests/feed-fetch.test.ts (CON-R2, CON-R4). Never used by the app.
// In-process: `globalThis.fetch = stubFetch(scenario)`. In a child process:
// `node --import ./tests/fixtures/feed-fetch/stub-fetch.ts ...` with STUB_FETCH_SCENARIO=<json file>.
// Any request that is not api.github.com throws, so a test can never reach the network.
import { readFileSync } from "node:fs";

export type StubRepo = { status?: number; body?: string; private?: boolean; handoff?: string };
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
    if (rest === "/pulls" || rest === "/issues") return json(200, []);
    if (rest.includes("/check-runs")) return json(200, { check_runs: [] });
    return json(404, { message: "Not Found" });
  }) as typeof fetch;
}

if (process.env.STUB_FETCH_SCENARIO) {
  globalThis.fetch = stubFetch(JSON.parse(readFileSync(process.env.STUB_FETCH_SCENARIO, "utf8")) as Scenario);
}
