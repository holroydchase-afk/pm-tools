// The Studio Console feed's only I/O: reads public repos through the GitHub REST API and returns
// a FeedInput for core.ts (minus the agent roster, which build-feed reads from disk). Global
// fetch, no dependencies; GITHUB_TOKEN (optional) raises the rate limit. A repo that 404s, is private or errors is skipped and reported, never fatal.
import type { Checks, FeedInput, Goal, IntakeIssue, MergedPr, ProductInput, PullRequest } from "./types.ts";

export type ConsoleConfig = {
  owner: string;
  statusRepo: string; // the repo holding STUDIO-STATUS.md
  products: { repo: string; name: string; code: string; group?: string; stage?: string }[];
  wipCap?: number; // active products allowed on the Build Slate (CON-12); the feed defaults to 5
};
export type Skipped = { repo: string; reason: string };

const API = "https://api.github.com";

class NotFound extends Error {}

function client(token: string | undefined) {
  const headers = (raw: boolean): Record<string, string> => ({
    Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "pm-tools-studio-console",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
  async function get(path: string, raw = false): Promise<Response> {
    const res = await fetch(API + path, { headers: headers(raw) });
    if (res.status === 404) throw new NotFound(path);
    if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}: ${(await res.text()).slice(0, 120)}`);
    return res;
  }
  return {
    json: async <T>(path: string): Promise<T> => (await (await get(path)).json()) as T,
    // A file's text, or "" when it doesn't exist.
    file: async (repo: string, path: string, ref?: string): Promise<string> => {
      const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
      try { return await (await get(`/repos/${repo}/contents/${path}${q}`, true)).text(); }
      catch (e) { if (e instanceof NotFound) return ""; throw e; }
    },
  };
}
type Client = ReturnType<typeof client>;

// Check-runs on a commit, rolled up: any failure wins, then anything unfinished, then success.
const FAILED = new Set(["failure", "timed_out", "cancelled", "action_required", "startup_failure"]);
async function checksFor(gh: Client, repo: string, sha: string): Promise<Checks> {
  type Run = { status: string; conclusion: string | null };
  const { check_runs } = await gh.json<{ check_runs: Run[] }>(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`);
  if (check_runs.length === 0) return "none";
  if (check_runs.some((r) => r.conclusion !== null && FAILED.has(r.conclusion))) return "failure";
  if (check_runs.some((r) => r.status !== "completed")) return "pending";
  return "success";
}

const TRUSTED = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

async function fetchProduct(gh: Client, owner: string, p: ConsoleConfig["products"][number]): Promise<ProductInput> {
  const repo = `${owner}/${p.repo}`;
  type ApiPr = { number: number; title: string; draft: boolean; user: { login: string }; author_association: string; updated_at: string; body: string | null; head: { ref: string; sha: string } };
  type ApiIssue = { number: number; title: string; pull_request?: unknown };
  type ApiClosed = { number: number; title: string; user: { login: string }; author_association: string; merged_at: string | null };
  const [handoff, apiPrs, issues, closed] = await Promise.all([
    gh.file(repo, "HANDOFF.md"),
    gh.json<ApiPr[]>(`/repos/${repo}/pulls?state=open&per_page=100`),
    gh.json<ApiIssue[]>(`/repos/${repo}/issues?state=open&labels=intake&per_page=100`),
    // Horizon's Done column (PMT-M3.3): the newest closed PRs; core keeps merges in the last 7 days.
    gh.json<ApiClosed[]>(`/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`),
  ]);
  // SEC-C2: only PRs from people with write access (or Dependabot) reach the feed; a stranger's
  // PR title would otherwise be published on the console.
  const trusted = apiPrs.filter((pr) => TRUSTED.has(pr.author_association) || pr.user.login === "dependabot[bot]");
  const prs: PullRequest[] = [];
  const runLogs: Record<string, string> = {};
  await Promise.all(trusted.map(async (pr) => {
    const branch = pr.head.ref;
    const [checks, log] = await Promise.all([
      checksFor(gh, repo, pr.head.sha),
      gh.file(repo, `.claude/agent-runs/${branch.replaceAll("/", "-")}.log`, branch),
    ]);
    prs.push({ number: pr.number, title: pr.title, draft: pr.draft, author: pr.user.login, updatedAt: pr.updated_at, body: pr.body ?? "", checks, branch });
    if (log) runLogs[branch] = log;
  }));
  prs.sort((a, b) => b.number - a.number); // Promise.all finishes in any order; keep the output stable
  const intake: IntakeIssue[] = issues.filter((i) => !i.pull_request).map((i) => ({ number: i.number, title: i.title }));
  // Merged only (not closed unmerged), from people with write access; Dependabot bumps stay off the board.
  const merged: MergedPr[] = closed
    .filter((pr) => pr.merged_at !== null && TRUSTED.has(pr.author_association) && pr.user.login !== "dependabot[bot]")
    .map((pr) => ({ number: pr.number, title: pr.title, mergedAt: pr.merged_at! }));
  return { repo: p.repo, name: p.name, code: p.code, handoff, prs, intake, runLogs, merged, ...(p.group ? { group: p.group } : {}), ...(p.stage ? { stage: p.stage } : {}) };
}

export async function fetchFeedInput(config: ConsoleConfig, goals: Goal[], token?: string): Promise<{ input: Omit<FeedInput, "agents">; skipped: Skipped[] }> {
  const gh = client(token || undefined);
  const products: ProductInput[] = [];
  const skipped: Skipped[] = [];
  for (const p of config.products) {
    try {
      const meta = await gh.json<{ private: boolean }>(`/repos/${config.owner}/${p.repo}`);
      if (meta.private) { skipped.push({ repo: p.repo, reason: "private" }); continue; }
      products.push(await fetchProduct(gh, config.owner, p));
    } catch (e) {
      skipped.push({ repo: p.repo, reason: e instanceof NotFound ? "not found" : (e as Error).message });
    }
  }
  let studioStatus = "";
  try { studioStatus = await gh.file(`${config.owner}/${config.statusRepo}`, "STUDIO-STATUS.md"); }
  catch (e) { skipped.push({ repo: `${config.statusRepo} STUDIO-STATUS.md`, reason: (e as Error).message }); }
  // SEC-C4: we can't tell whether a repo we couldn't read is private (GitHub answers 404 for
  // those, and errors hide it), so every skipped repo's name is kept out of the feed.
  const privateRepos = skipped.filter((s) => config.products.some((p) => p.repo === s.repo)).map((s) => s.repo);
  return { input: { goals, products, studioStatus, privateRepos, ...(config.wipCap !== undefined ? { wipCap: config.wipCap } : {}) }, skipped };
}
