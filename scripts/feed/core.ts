// Studio Console feed builder (PMT-M3.1): turns HANDOFFs, open PRs, intake issues and agent-run
// logs into studio.json. Pure: takes data and returns data, no I/O and no clock reads (`now` is
// passed in). The rules it follows are written up in ./types.ts; tests: tests/feed.test.ts.
import { redact, termRe } from "../private-patterns.ts";
import type {
  AgentsLineEntry, CallSheet, CallSheetPr, DecideItem, Feed, FeedInput, GateRow, GateState, Goal, Handoff,
  Health, HorizonCard, HorizonRow, MergedPr, OffGoalItem, ProductSummary, PullRequest, RunEntry, Track,
} from "./types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const AGENT = /^[a-z0-9][a-z0-9-]{0,40}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const DEPENDABOT = "dependabot[bot]";
const CORE_GATES = ["staff-pm", "qa-tdd", "engineer", "ux-reviewer", "privacy-security"];
const DEFAULT_WIP_CAP = 5;

// ------------------------------------------------------------------ HANDOFF (CON-1, CON-2)

// The status header: `<!-- status` within the first 15 lines, closed by `-->`.
function readHeader(lines: string[]): Map<string, string | string[]> | null {
  const start = lines.slice(0, 15).findIndex((l) => l.trim().startsWith("<!-- status"));
  if (start < 0) return null;
  const fields = new Map<string, string | string[]>();
  let list: string[] | null = null;
  for (const line of lines.slice(start + 1)) {
    if (line.trim().startsWith("-->")) return fields;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) { list.push(item[1].trim()); continue; }
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (!kv) { list = null; continue; }
    const [, key, value] = kv;
    if (value === "" || value === "[]") { list = []; fields.set(key, list); if (value === "[]") list = null; }
    else { list = null; fields.set(key, value.trim()); }
  }
  return null; // never closed: treat as no header
}

// First `max` top-level bullets under `## <title>`, one line each.
function sectionBullets(lines: string[], title: string, max = 3): string[] {
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${title.toLowerCase()}`);
  if (start < 0) return [];
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const m = /^[-*]\s+(.*)$/.exec(line);
    if (m && m[1].trim()) out.push(m[1].trim());
    if (out.length >= max) break;
  }
  return out;
}

const asList = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const asScalar = (v: string | string[] | undefined): string | null => (typeof v === "string" ? v : null);

export function parseHandoff(md: string): Handoff {
  const lines = md.split(/\r?\n/);
  const decisions = sectionBullets(lines, "Decisions to review");
  const h = readHeader(lines);
  if (!h) {
    return {
      header: "missing", stage: null, goal: null, milestone: null,
      now: sectionBullets(lines, "In progress"), next: sectionBullets(lines, "Exact next step"),
      decisions, waiting_on_chase: [], blockers: sectionBullets(lines, "Blockers"), later: sectionBullets(lines, "Later"),
    };
  }
  return {
    header: "present", stage: asScalar(h.get("stage")), goal: asScalar(h.get("goal")), milestone: asScalar(h.get("milestone")),
    now: asList(h.get("now")), next: asList(h.get("next")), decisions,
    waiting_on_chase: asList(h.get("waiting_on_chase")), blockers: asList(h.get("blockers")),
    later: h.has("later") ? asList(h.get("later")) : sectionBullets(lines, "Later"),
  };
}

// ------------------------------------------------------------------ run logs and Agents: line (CON-5, CON-6)

export function parseRunLog(text: string): RunEntry[] {
  const out: RunEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 2) continue;
    const [at, agent] = parts;
    if (ISO_UTC.test(at) && !Number.isNaN(Date.parse(at)) && AGENT.test(agent)) out.push({ at, agent });
  }
  return out;
}

export function parseAgentsLine(prBody: string): AgentsLineEntry[] {
  const line = prBody.split(/\r?\n/).find((l) => l.trimStart().startsWith("Agents:"));
  if (!line) return [];
  const byAgent = new Map<string, AgentsLineEntry>();
  for (const seg of line.trimStart().slice("Agents:".length).split(";")) {
    const [agent, second = ""] = seg.trim().split(/\s+/);
    if (!agent || !AGENT.test(agent)) continue;
    const status = /^skipped\b/.test(second) ? "skipped" : "ran";
    const seen = byAgent.get(agent);
    if (!seen) byAgent.set(agent, { agent, status });
    else if (status === "ran") seen.status = "ran";
  }
  return [...byAgent.values()];
}

// ------------------------------------------------------------------ goals and effort (CON-3)

// Planning ID: the leading token of a PR title before ":" ("CCW-M4.1: Pace spike" -> "CCW-M4.1").
const planningId = (title: string): string | null => /^([A-Za-z0-9][A-Za-z0-9.-]*):/.exec(title.trim())?.[1] ?? null;

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasKeyword = (title: string, kw: string) => new RegExp(`(?:^|[^A-Za-z0-9])${escRe(kw)}`, "i").test(title);

function goalFor(goals: Goal[], repo: string, title: string | null): string | null {
  const id = title === null ? null : planningId(title);
  if (id) {
    const byPrefix = goals.find((g) => (g.match.idPrefixes ?? []).some((p) => id.startsWith(p)));
    if (byPrefix) return byPrefix.id;
  }
  if (title !== null) {
    const byKeyword = goals.find((g) => (g.match.keywords ?? []).some((k) => k.trim() !== "" && hasKeyword(title, k.trim())));
    if (byKeyword) return byKeyword.id;
  }
  return goals.find((g) => (g.match.repos ?? []).includes(repo))?.id ?? null;
}

// Integer percents that sum to exactly 100, by largest remainder (ties: earlier bucket first).
function shares(units: number[]): number[] {
  const total = units.reduce((a, b) => a + b, 0);
  if (total === 0) return units.map(() => 0);
  const out = units.map((u) => Math.floor((u * 100) / total));
  const order = units.map((u, i) => ({ i, rem: (u * 100) % total })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  for (const { i } of order) { if (left-- <= 0) break; out[i]++; }
  return out;
}

// ------------------------------------------------------------------ Build Slate and Horizon (CON-12, CON-14)

const TRACK: Record<string, Track> = { idea: "idea", build: "building", building: "building", beta: "beta", live: "live", parked: "parked" };
const trackOf = (stage: string | null): Track | null => (stage === null ? null : TRACK[stage.trim().toLowerCase()] ?? null);

// The newest entry; on a tie the first one read wins.
function newestRun(logs: Iterable<RunEntry[]>): RunEntry | null {
  let best: RunEntry | null = null;
  for (const entries of logs) for (const e of entries) if (!best || e.at.localeCompare(best.at) > 0) best = e;
  return best && { agent: best.agent, at: best.at };
}

const count = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function healthOf(prs: PullRequest[], blockers: number, nowMs: number): Health {
  const own = prs.filter((pr) => pr.author !== DEPENDABOT);
  const failing = own.filter((pr) => !pr.draft && pr.checks === "failure").length;
  const idle = own.filter((pr) => pr.draft && Date.parse(pr.updatedAt) < nowMs - DAY_MS).length;
  if (failing || blockers) {
    const why = [failing ? `${count(failing, "PR")} failing checks` : "", blockers ? count(blockers, "blocker") : ""].filter(Boolean);
    return { level: "bad", note: why.join(", ") };
  }
  if (idle) return { level: "warn", note: `${count(idle, "draft")} idle over 24h` };
  return { level: "ok", note: "No failing checks or blockers" };
}

// A leading planning ID: "CCW-M4.1: Pace spike" and "CCW-M4.1 pace spike" -> { id: "CCW-M4.1", title: "Pace spike" / "pace spike" }.
const LEADING_ID = /^([A-Z][A-Z0-9]{0,7}(?:-[A-Z0-9]+(?:\.[A-Z0-9]+)*)+):?\s+(\S.*)$/;
function splitId(text: string): { id: string | null; title: string } {
  const m = LEADING_ID.exec(text.trim());
  return m ? { id: m[1], title: m[2].trim() } : { id: null, title: text.trim() };
}

// A Horizon card from a HANDOFF bullet or PR title (UX-S9): markdown off, no leading date, first
// sentence only; a planning ID goes to the label (a leading one, else the first one in the text) and
// never stays in the title.
const MD_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const LEADING_DATE = /^(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2})\b[:,]?\s*/;
const MID_ID = /\b[A-Z][A-Z0-9]{1,7}-(?:M\d+(?:\.\d+)*|R\d+)\b/g;
function cardOf(text: string): { id: string | null; title: string } {
  const plainText = text.replace(MD_LINK, "$1").replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim().replace(LEADING_DATE, "");
  const sentence = /^(.+?[.!?])(?=\s|$)/.exec(plainText)?.[1] ?? plainText;
  const lead = splitId(sentence);
  const id = lead.id ?? sentence.match(MID_ID)?.[0] ?? null;
  const title = (lead.id ? lead.title : sentence).replace(MID_ID, "").replace(/\(\s*\)/g, "").replace(/\s+([,.;:!?)])/g, "$1").replace(/\s+/g, " ").replace(/^[\s:,;-]+/, "").trim();
  return { id, title: title || sentence };
}

function horizonRow(s: ProductSummary, prs: PullRequest[], merged: MergedPr[]): HorizonRow {
  const prById = new Map<string, number>();
  for (const pr of prs) {
    const { id } = splitId(pr.title);
    if (id && pr.author !== DEPENDABOT && !prById.has(id)) prById.set(id, pr.number);
  }
  const seen = new Set<string>();
  const place = (cards: HorizonCard[]) => cards.filter((c) => {
    if (c.id === null) return true;
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const fromText = (xs: string[]) => xs.map((t) => { const c = cardOf(t); return { ...c, pr: c.id === null ? null : prById.get(c.id) ?? null }; });
  const done = place(merged.map((m) => ({ ...cardOf(m.title), pr: m.number })));
  return { repo: s.repo, now: place(fromText(s.now)), next: place(fromText(s.next)), later: place(fromText(s.later)), done };
}

// ------------------------------------------------------------------ privacy (CON-7)

// Redacts personal-data patterns; returns null when the text names a private repo (drop the item).
function cleaner(privateRepos: string[]) {
  const res = privateRepos.map(termRe);
  return (text: string): string | null => (res.some((re) => re.test(text)) ? null : redact(text));
}

// A HANDOFF decision that is really "merge this PR", already listed under merge (UX-C3).
const FILLER = new Set(["merge", "the", "and", "for", "pr"]);
function duplicatesMerge(text: string, pr: CallSheetPr): boolean {
  if (new RegExp(`#${pr.number}(?![0-9])`).test(text)) return true;
  if (!/^merge\b/i.test(text.trim())) return false;
  const words = (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => !FILLER.has(w));
  const title = pr.title.toLowerCase();
  return words.length > 0 && words.every((w) => title.includes(w));
}

// ------------------------------------------------------------------ the feed

export function buildFeed(input: FeedInput, now: Date): Feed {
  const clean = cleaner(input.privateRepos ?? []);
  const cleanList = (xs: string[]) => xs.map(clean).filter((x): x is string => x !== null);
  const nowMs = now.getTime();
  const inWindow = (at: string) => { const t = Date.parse(at); return t > nowMs - 7 * DAY_MS && t <= nowMs; };
  const isBot = (pr: PullRequest) => pr.author === DEPENDABOT;
  const roster = new Set([...CORE_GATES, ...input.agents]);
  const knownGoals = new Set(input.goals.map((g) => g.id));
  // Call Sheet group (CON-4, CON-R1): every non-Dependabot PR lands in exactly one.
  const groupFor = (pr: PullRequest): "merge" | "failing" | "inProgress" | "idleDrafts" => {
    if (pr.draft) return Date.parse(pr.updatedAt) < nowMs - DAY_MS ? "idleDrafts" : "inProgress";
    return pr.checks === "success" ? "merge" : pr.checks === "failure" ? "failing" : "inProgress";
  };
  const products = input.products.filter((p) => clean(p.repo) !== null);

  const units = new Map<string | null, number>(); // goal id (null = off-goal) -> effort units
  const bump = (goal: string | null, n = 1) => units.set(goal, (units.get(goal) ?? 0) + n);
  const offGoalPrs: OffGoalItem[] = [];
  const offGoalRuns: OffGoalItem[] = [];
  const callSheet: CallSheet = { merge: [], failing: [], inProgress: [], decide: [], idleDrafts: [], dependabot: [] };
  const summaries: ProductSummary[] = [];
  const gates: GateRow[] = [];
  const runs: Feed["runs"] = {};
  const horizon: HorizonRow[] = [];

  for (const p of products) {
    const parsed = parseHandoff(p.handoff);
    // UX-S1: no status header -> the config stage (a header's stage wins).
    const h = parsed.header === "missing" && p.stage ? { ...parsed, stage: p.stage } : parsed;
    const logs = new Map(Object.entries(p.runLogs).map(([branch, text]) => [branch, parseRunLog(text)]));
    const prGoal = new Map<string, string | null>(); // branch -> goal of its open PR

    // PRs: effort, off-goal, Call Sheet groups, gates.
    let bots = 0;
    for (const pr of p.prs) {
      const goal = goalFor(input.goals, p.repo, pr.title);
      prGoal.set(pr.branch, goal);
      if (isBot(pr)) { bots++; continue; }
      bump(goal);
      const title = clean(pr.title);
      if (title !== null) {
        const item: CallSheetPr = { repo: p.repo, number: pr.number, title, goal };
        if (goal === null) offGoalPrs.push({ kind: "pr", repo: p.repo, number: pr.number, title });
        callSheet[groupFor(pr)].push(item);
      }
      const logged = new Set((logs.get(pr.branch) ?? []).map((r) => r.agent));
      const row: Record<string, GateState> = Object.fromEntries(CORE_GATES.map((a) => [a, "n/a" as GateState]));
      for (const e of parseAgentsLine(pr.body).filter((x) => roster.has(x.agent))) row[e.agent] = e.status === "skipped" ? "n/a" : logged.has(e.agent) ? "ok" : "missing";
      gates.push({ repo: p.repo, number: pr.number, gates: row });
    }
    if (bots > 0) callSheet.dependabot.push({ repo: p.repo, count: bots });

    // Runs in the last 7 days: per agent, and as effort for the branch's PR goal (else the repo's).
    const perAgent: Record<string, number> = {};
    let offRuns = 0;
    for (const [branch, entries] of logs) {
      const goal = prGoal.has(branch) ? prGoal.get(branch)! : goalFor(input.goals, p.repo, null);
      for (const r of entries.filter((e) => inWindow(e.at))) {
        perAgent[r.agent] = (perAgent[r.agent] ?? 0) + 1;
        bump(goal);
        if (goal === null) offRuns++;
      }
    }
    runs[p.repo] = perAgent;
    if (offRuns > 0) offGoalRuns.push({ kind: "runs", repo: p.repo, count: offRuns });

    const s: ProductSummary = {
      repo: p.repo, name: clean(p.name) ?? p.repo, code: p.code, header: h.header,
      stage: h.stage === null ? null : clean(h.stage), goal: h.goal !== null && knownGoals.has(h.goal) ? h.goal : null, milestone: h.milestone === null ? null : clean(h.milestone),
      now: cleanList(h.now), next: cleanList(h.next), decisions: cleanList(h.decisions),
      waiting_on_chase: cleanList(h.waiting_on_chase), blockers: cleanList(h.blockers),
      openPrs: p.prs.length, intakes: p.intake.length,
      group: p.group ?? null, track: trackOf(h.stage), lastRun: newestRun(logs.values()),
      health: { level: "ok", note: "" }, later: cleanList(h.later),
    };
    s.health = healthOf(p.prs, s.blockers.length, nowMs);
    summaries.push(s);
    // Done: merges in the last 7 days whose title names no private repo.
    const merged = (p.merged ?? []).filter((m) => inWindow(m.mergedAt)).flatMap((m) => {
      const title = clean(m.title);
      return title === null ? [] : [{ ...m, title }];
    });
    horizon.push(horizonRow(s, p.prs.flatMap((pr) => { const title = clean(pr.title); return title === null ? [] : [{ ...pr, title }]; }), merged));
    const merging = callSheet.merge.filter((m) => m.repo === p.repo);
    for (const text of [...s.waiting_on_chase, ...s.decisions]) {
      if (!merging.some((m) => duplicatesMerge(text, m))) callSheet.decide.push({ repo: p.repo, text });
    }
  }

  // STUDIO-STATUS "## Waiting on Chase": every top-level bullet.
  const studio = sectionBullets(input.studioStatus.split(/\r?\n/), "Waiting on Chase", Infinity);
  for (const text of cleanList(studio)) callSheet.decide.push({ repo: null, text } satisfies DecideItem);

  const pct = shares([...input.goals.map((g) => units.get(g.id) ?? 0), units.get(null) ?? 0]);
  return {
    builtAt: now.toISOString(),
    goals: input.goals.map((g, i) => ({
      id: g.id, name: g.name, measure: g.measure, effort: pct[i],
      reads: (g.match.repos ?? []).map((r) => input.repoNames?.[r] ?? input.products.find((p) => p.repo === r)?.name ?? r),
      ...(g.status ? { status: g.status } : {}),
      ...(g.progress ? { progress: g.progress } : {}),
    })),
    offGoalEffort: pct[input.goals.length],
    offGoal: [...offGoalPrs, ...offGoalRuns],
    callSheet,
    products: summaries,
    gates,
    runs,
    wipCap: Number.isInteger(input.wipCap) && input.wipCap! > 0 ? input.wipCap! : DEFAULT_WIP_CAP,
    horizon,
    workItems: [...units.values()].reduce((a, b) => a + b, 0),
  };
}
