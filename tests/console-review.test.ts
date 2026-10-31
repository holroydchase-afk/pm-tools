// PMT-M3.2 review fixes: ux-reviewer UX-C1..C8 (C7 font-size merge not tested), privacy-security
// SEC-C2..C8 (C2 and C4 live in tests/feed-fetch.test.ts), qa-tdd CON-R9. Browser cases (UX-C2
// placeholder copy, SEC-C5 no third-party requests, CON-R10, CON-R11) are in tests/e2e/demos.e2e.ts.
// Same render contract as tests/console.test.ts: console/app.js loaded in a vm sets window.Console.
//
// Hooks these tests add to the contract:
//   Focus card:  a status chip carries data-status (only when goals.json gives the goal a `status`);
//                a "Reads: <display names>" line (names from console.config.json, match.repos order).
//   Decide row:  an element carrying data-reason with the reason line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildFeed } from "../scripts/feed/core.ts";
import { sampleInput } from "../scripts/build-sample-feed.ts";
import type { Feed, Goal } from "../scripts/feed/types.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NOW = new Date("2026-10-31T12:00:00Z");
const GH = "https://github.com/holroydchase-afk/";

type ConsoleApi = {
  renderFocus(feed: Feed): string;
  renderCallSheet(feed: Feed): string;
};
function app(): ConsoleApi {
  const ctx = { window: {} as { Console?: ConsoleApi }, console };
  vm.runInNewContext(readFileSync(join(ROOT, "console", "app.js"), "utf8"), ctx);
  return ctx.window.Console!;
}
const feed = (): Feed => buildFeed(sampleInput(), NOW);
const sample = (): Feed => JSON.parse(readFileSync(join(ROOT, "console", "sample-studio.json"), "utf8")) as Feed;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const text = (html: string) => unesc(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const tagsWith = (html: string, attr: string) => [...html.matchAll(new RegExp(`<[a-z][^>]*\\s${attr}(?:="[^"]*")?[^>]*>`, "gi"))].map((m) => ({ tag: m[0], at: m.index }));
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
// Each element carrying `a`, from its opening tag to the next one (or `stop`, or the end).
function rows(html: string, a: string, stop?: RegExp) {
  const t = tagsWith(html, a);
  const end = stop ? html.search(stop) : -1;
  return t.map((x, i) => ({ tag: x.tag, html: html.slice(x.at, t[i + 1]?.at ?? (end > x.at ? end : html.length)) }));
}
// A leading planning ID like "PMT-M3.1:", "DEMO-BAR:", "AGT-EV1:".
const PLANNING_ID = /\b[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9.]+)+:/;

// ---------------------------------------------------------------- UX-C1 goal cards

test("UX-C1 goal card: the effort share shows once, labelled \"of this week's work\", and no card bar without progress", () => {
  const f = feed();
  const cards = rows(app().renderFocus(f), "data-goal", /\sdata-offgoal-list\b/);
  assert.equal(cards.length, f.goals.length);
  cards.forEach((c, i) => {
    const g = f.goals[i];
    const t = text(c.html);
    assert.equal(t.split(`${g.effort}%`).length - 1, 1, `${g.id}: "${g.effort}%" shows once on the card, not repeated (got: ${t})`);
    assert.match(t, /of this week's work/, `${g.id}: share labelled "of this week's work"`);
    // UX-C11: a goal without progress has no card bar (the effort share has the top bar).
    if (!(g as { progress?: unknown }).progress) assert.doesNotMatch(c.html, /class="bar"/, `${g.id}: no card bar without progress`);
  });
});

test("UX-C1 goal card: a goals.json `status` shows as a chip; a goal without one shows no status chip", () => {
  const input = sampleInput();
  input.goals = input.goals.map((g, i) => (i === 0 ? ({ ...g, status: "On track" } as Goal) : g));
  const f = buildFeed(input, NOW);
  assert.equal((f.goals[0] as { status?: string }).status, "On track", "the feed carries the goal's status");
  const cards = rows(app().renderFocus(f), "data-goal", /\sdata-offgoal-list\b/);
  const chip = tagsWith(cards[0].html, "data-status");
  assert.equal(chip.length, 1, "first goal has one status chip");
  assert.match(text(cards[0].html), /On track/);
  for (const c of cards.slice(1)) assert.equal(tagsWith(c.html, "data-status").length, 0, `${attr(c.tag, "data-goal")}: no status, no chip`);
});

test("UX-C1 goal card: a \"Reads:\" line names the goal's matched repos by their console.config.json display names", () => {
  const config = JSON.parse(readFileSync(join(ROOT, "console.config.json"), "utf8")) as { products: { repo: string; name: string }[] };
  const name = new Map(config.products.map((p) => [p.repo, p.name]));
  const goals = sampleInput().goals;
  const cards = rows(app().renderFocus(sample()), "data-goal", /\sdata-offgoal-list\b/);
  cards.forEach((c, i) => {
    const names = (goals[i].match.repos ?? []).map((r) => name.get(r) ?? r);
    assert.ok(text(c.html).includes(`Reads: ${names.join(", ")}`), `${goals[i].id}: "Reads: ${names.join(", ")}" (got: ${text(c.html)})`);
  });
});

test("UX-C1 goals.json: the Hearth goal's measure is \"TestFlight beta build\"", () => {
  const goals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as Goal[];
  assert.equal(goals.find((g) => g.id === "hearth-beta")?.measure, "TestFlight beta build");
});

// ---------------------------------------------------------------- UX-C2 no planning IDs or slugs

test("UX-C2 Call Sheet: titles drop their planning-ID prefix and goal chips show the goal name, not its id", () => {
  const f = feed();
  const html = app().renderCallSheet(f);
  const goalName = new Map(f.goals.map((g) => [g.id, g.name]));
  const items = ["merge", "failing", "inProgress", "idleDrafts"] as const;
  const prs = items.flatMap((k) => f.callSheet[k]);
  assert.ok(prs.some((p) => PLANNING_ID.test(p.title)), "the sample has prefixed titles to strip");
  const t = text(html);
  assert.doesNotMatch(t, PLANNING_ID, "no planning-ID prefix in visible text");
  for (const p of prs) {
    const bare = p.title.replace(/^[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9.]+)+:\s*/, "");
    assert.ok(t.includes(bare), `"${bare}" (${p.repo}#${p.number}) still shows`);
  }
  for (const id of f.goals.map((g) => g.id).filter((id) => id.includes("-"))) assert.ok(!t.includes(id), `goal id "${id}" not shown`);
  for (const p of prs.filter((p) => p.goal)) assert.ok(t.includes(goalName.get(p.goal!)!), `goal name "${goalName.get(p.goal!)}" shown`);
});

test("UX-C2 Focus: off-goal PR titles drop their planning-ID prefix", () => {
  const f = clone(feed());
  f.offGoal = [{ kind: "pr", repo: "ccwatts", number: 72, title: "CCW-M4.1: Pace spike" }];
  const t = text(app().renderFocus(f));
  assert.ok(t.includes("Pace spike"));
  assert.doesNotMatch(t, PLANNING_ID);
});

test("UX-C2 Call Sheet: decision chips and buttons say \"Handoff notes\" / \"Studio status\", never HANDOFF or STUDIO-STATUS", () => {
  const html = app().renderCallSheet(feed());
  const t = text(html);
  assert.doesNotMatch(t, /HANDOFF|STUDIO-STATUS/, "file names stay in the link, not the words");
  assert.match(t, /Handoff notes/);
  assert.match(t, /Studio status/);
});

// ---------------------------------------------------------------- UX-C3 decisions

// Imperative openers seen in studio HANDOFFs. Extend when a new verb is legitimately needed.
const VERBS = /^(Review|Merge|Decide|Pick|Choose|Turn|Paste|Ship|Approve|Set|Confirm|Name|Rename|Answer|Reply|Sign|Agree|Check|Read|Try|Drop|Keep|Move|Open|Close|Add|Remove|Update|Write|Run|Fix|Test|Book|Send|Schedule)\b/;

test("UX-C3 Call Sheet: every decision has a reason line and a title that starts with a verb, with no trailing period", () => {
  const f = feed();
  const html = app().renderCallSheet(f);
  const decide = rows(html, "data-group").filter((r) => attr(r.tag, "data-group") === "decide");
  // UX-S3: one call per product, at most 3 from studio status; the rest open from the drawer.
  const products = new Set(f.callSheet.decide.map((d) => d.repo).filter((r) => r !== null));
  const studio = f.callSheet.decide.filter((d) => d.repo === null).length;
  assert.equal(decide.length, products.size + Math.min(3, studio));
  for (const r of decide) {
    const reason = tagsWith(r.html, "data-reason");
    assert.equal(reason.length, 1, "one reason line");
    const title = text(r.html.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? "");
    assert.match(title, VERBS, `"${title}" starts with a verb`);
    assert.doesNotMatch(title, /\.$/, `"${title}" has no trailing period`);
    const reasonText = text(r.html.slice(r.html.indexOf(reason[0].tag)));
    assert.ok(reasonText.length > 0, "reason line is not empty");
    // UX-S10 (supersedes the old "any later sentence" rule): a reason shows only as a whole
    // sentence, 4 words or more and not ending on a dangling word; otherwise the line names the source.
    assert.ok(reasonText.split(/\s+/).length >= 4, `reason "${reasonText}" is a whole sentence`);
    assert.doesNotMatch(reasonText, /\b(?:is|are|was|were|be|the|a|an|to|of|in|on|for|with|and|or|but|from|by|at)\.$/i, `reason "${reasonText}" doesn't end mid-phrase`);
  }
});

test("UX-C3 feed: a decision about a PR already in Ready to merge is dropped (no duplicate call)", () => {
  const f = feed();
  const mergeRefs = f.callSheet.merge.map((p) => `${p.repo}#${p.number}`);
  assert.ok(!f.callSheet.decide.some((d) => d.repo === "pm-tools" && /Merge the demo bar PR/.test(d.text)), "pm-tools \"Merge the demo bar PR\" duplicates pm-tools#48 in merge");
  const input = sampleInput();
  const pm = input.products.find((p) => p.repo === "pm-tools")!;
  pm.handoff = pm.handoff.replace(/## Decisions to review\s*\n/, "## Decisions to review\n- Merge #48 once the banner copy is final\n");
  const g = buildFeed(input, NOW);
  assert.ok(mergeRefs.includes("pm-tools#48"));
  assert.ok(!g.callSheet.decide.some((d) => /#48\b/.test(d.text)), "a decision naming pm-tools #48 is dropped while #48 is ready to merge");
});

// ---------------------------------------------------------------- UX-C4 contrast

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h: string) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const expandHex = (h: string) => (h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h).toLowerCase();

test("UX-C4 effort bar: segment colors are the reviewed ones and every label is at least 4.5:1", () => {
  const html = readFileSync(join(ROOT, "console", "index.html"), "utf8");
  const color = (cls: string) => expandHex(html.match(new RegExp(`\\.${cls}\\{background:(#[0-9a-fA-F]{3,6})`))?.[1] ?? "#000000");
  assert.equal(color("g2"), "#2f6e53");
  assert.equal(color("g4"), "#4a6572");
  assert.equal(color("g0"), "#8a5a12");
  const label = expandHex(html.match(/\.effort span\{[^}]*[;{]color:(#[0-9a-fA-F]{3,6})/)?.[1] ?? "#ffffff");
  for (const cls of ["g1", "g2", "g3", "g4", "g0"]) {
    const r = contrast(color(cls), label);
    assert.ok(r >= 4.5, `.${cls} ${color(cls)} vs label ${label}: ${r.toFixed(2)}:1`);
  }
});

// ---------------------------------------------------------------- UX-C5, UX-C6, UX-C8

test("UX-C5 header: subtitle \"Staff PM view of the agent team\" and a \"← PM tools\" link back to /pm-tools/", () => {
  const html = readFileSync(join(ROOT, "console", "index.html"), "utf8");
  assert.match(html, /Staff PM view of the agent team/);
  const a = html.match(/<a\b[^>]*href="([^"]*)"[^>]*>\s*←\s*PM tools\s*<\/a>/);
  assert.ok(a, "a link reading ← PM tools");
  assert.ok(["../", "/pm-tools/"].includes(a[1]), `back link goes to /pm-tools/ (href ${a[1]})`);
});

test("UX-C6 Focus: every off-goal item, PRs and agent runs alike, has one button to GitHub", () => {
  const f = feed();
  assert.ok(f.offGoal.some((o) => o.kind === "runs"), "the sample has an agent-runs item");
  const items = rows(app().renderFocus(f), "data-offgoal-item");
  assert.equal(items.length, f.offGoal.length);
  items.forEach((r, i) => {
    const o = f.offGoal[i];
    const hrefs = [...r.html.matchAll(/\shref="([^"]*)"/g)].map((m) => unesc(m[1]));
    assert.equal(hrefs.length, 1, `off-goal item ${i} (${o.kind} ${o.repo}) has one button`);
    if (o.kind === "runs") {
      assert.equal(hrefs[0], `${GH}${o.repo}`);
      assert.match(text(r.html), /Open repo/);
    }
  });
});

test("UX-C8 Call Sheet intro speaks to \"you\", never names Chase", () => {
  const t = text(app().renderCallSheet(feed()));
  assert.doesNotMatch(t, /\bChase\b/);
  assert.match(t, /\byou\b/i);
});

// ---------------------------------------------------------------- SEC-C5, SEC-C7

test("SEC-C5 page: fonts are self-hosted (console/fonts/, OFL), nothing from Google Fonts, and a CSP limits scripts to 'self'", () => {
  const html = readFileSync(join(ROOT, "console", "index.html"), "utf8");
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
  const dir = join(ROOT, "console", "fonts");
  assert.ok(existsSync(dir), "console/fonts/ exists");
  const files = readdirSync(dir);
  assert.ok(files.some((f) => f.endsWith(".woff2")), "woff2 files");
  assert.ok(files.some((f) => /^OFL/i.test(f)), "the OFL license ships with the fonts");
  const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i)?.[1];
  assert.ok(csp, "a CSP meta tag");
  const script = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src")) ?? csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("default-src"));
  assert.ok(script && /'self'/.test(script), "script-src 'self'");
  assert.doesNotMatch(script, /unsafe-inline|unsafe-eval|https?:/, "no inline, eval or remote scripts");
});

test("SEC-C7 render: effort and share values are forced to numbers, so a tampered feed cannot inject attributes", () => {
  const f = clone(feed()) as unknown as { goals: { effort: unknown }[]; offGoalEffort: unknown };
  f.goals[0].effort = `40" onmouseover="alert(1)`;
  f.offGoalEffort = `5" onclick="alert(2)`;
  const html = app().renderFocus(f as unknown as Feed);
  assert.doesNotMatch(html, /onmouseover|onclick/);
});

// ---------------------------------------------------------------- CON-R9

test("CON-R9 Call Sheet: the Dependabot button opens the repo's open Dependabot PRs (is:pr is:open author:app/dependabot)", () => {
  const f = feed();
  assert.ok(f.callSheet.dependabot.length > 0);
  const html = app().renderCallSheet(f);
  const hrefs = rows(html, "data-group").filter((r) => attr(r.tag, "data-group") === "dependabot").map((r) => unesc(r.html.match(/\shref="([^"]*)"/)![1]));
  f.callSheet.dependabot.forEach((d, i) => {
    const u = new URL(hrefs[i]);
    assert.equal(u.origin + u.pathname, `${GH}${d.repo}/pulls`);
    assert.equal(u.searchParams.get("q"), "is:pr is:open author:app/dependabot");
  });
});

// ---------------------------------------------------------------- SEC-C6, SEC-C8 (pages.yml)

const WF = join(ROOT, ".github", "workflows", "pages.yml");
const yml = () => readFileSync(WF, "utf8");
function block(src: string, re: RegExp) {
  const lines = src.split("\n");
  const start = lines.findIndex((l) => re.test(l));
  if (start < 0) return "";
  const indent = lines[start].match(/^ */)![0].length;
  const end = lines.findIndex((l, i) => i > start && l.trim() && l.match(/^ */)![0].length <= indent);
  return lines.slice(start, end < 0 ? undefined : end).join("\n");
}

test("SEC-C6 pages.yml: every action is pinned to a full commit SHA and checkout does not persist credentials", () => {
  const src = yml();
  const uses = [...src.matchAll(/uses:\s*([^\s#]+)/g)].map((m) => m[1]);
  assert.ok(uses.length > 0);
  for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, `${u} pinned to a 40-char SHA`);
  const checkouts = src.split(/\n(?=\s*- )/).filter((s) => /uses:\s*actions\/checkout@/.test(s));
  assert.ok(checkouts.length > 0);
  for (const c of checkouts) assert.match(c, /persist-credentials:\s*false/, "checkout has persist-credentials: false");
});

test("SEC-C8 pages.yml: one \"pages\" concurrency group that never cancels a run, a timeout on every job, and e2e skipped on the hourly schedule", () => {
  const src = yml();
  const conc = block(src, /^concurrency:/);
  assert.match(conc, /\n\s+group:\s*["']?pages["']?\s*(\n|$)/, "group: pages");
  assert.match(conc, /\n\s+cancel-in-progress:\s*false/, "cancel-in-progress: false");
  const jobs = block(src, /^jobs:/);
  const names = [...jobs.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]);
  for (const n of names) assert.match(block(jobs, new RegExp(`^ {2}${n}:`)), /\n {4}timeout-minutes:\s*\d+/, `${n} has timeout-minutes`);
  const e2e = block(jobs, /^ {2}e2e:/);
  assert.match(e2e, /\n {4}if:.*github\.event_name\s*!=\s*'schedule'/, "e2e skipped on schedule");
  // With e2e skipped, a plain `needs: [test, e2e]` would skip deploy too and the hourly feed would never ship.
  const deploy = block(jobs, /^ {2}deploy:/);
  const cond = deploy.match(/\n {4}if:\s*(.*)/)?.[1] ?? "";
  assert.match(cond, /always\(\)|!cancelled\(\)/, "deploy still runs when e2e is skipped");
  assert.match(cond, /needs\.test\.result\s*==\s*'success'/, "deploy needs a green test job");
  assert.match(cond, /needs\.e2e\.result/, "deploy checks e2e passed or was skipped");
});

// ---------------------------------------------------------------- ux-reviewer re-check (UX-C1, C3, C9, C10)

const withGoals = (edit: (g: Goal[]) => Goal[]): Feed => { const input = sampleInput(); input.goals = edit(input.goals); return buildFeed(input, NOW); };
const cardsOf = (f: Feed) => rows(app().renderFocus(f), "data-goal", /\sdata-offgoal-list\b/);

test("UX-C1 progress: a done/of goal shows \"5 of 7 demos live\" as its big line, its bar is done/of, and the share moves to one small line", () => {
  const f = withGoals((gs) => gs.map((g) => (g.id === "portfolio" ? ({ ...g, progress: { done: 5, of: 7, label: "demos live" } } as Goal) : g)));
  const g = f.goals.find((x) => x.id === "portfolio")!;
  assert.deepEqual((g as { progress?: unknown }).progress, { done: 5, of: 7, label: "demos live" }, "the feed carries the goal's progress");
  const c = cardsOf(f).find((x) => attr(x.tag, "data-goal") === "portfolio")!;
  const big = text(c.html.match(/class="big"[^>]*>([\s\S]*?)<\//)?.[1] ?? "");
  assert.equal(big, "5 of 7 demos live");
  assert.match(c.html, /width:\s*71%/, "bar is 5/7 = 71%");
  const t = text(c.html);
  assert.ok(t.includes(`${g.effort}% of this week's work`), `share on one line (got: ${t})`);
  assert.equal(t.split(`${g.effort}%`).length - 1, 1, "share shows once");
});

test("UX-C1 progress: a target date shows \"N days to beta\" counted from the feed time, and the bar is time elapsed", () => {
  const f = withGoals((gs) => gs.map((g) => (g.id === "hearth-beta" ? ({ ...g, progress: { target: "2026-11-22", label: "to beta" } } as Goal) : g)));
  const c = cardsOf(f).find((x) => attr(x.tag, "data-goal") === "hearth-beta")!;
  const big = text(c.html.match(/class="big"[^>]*>([\s\S]*?)<\//)?.[1] ?? "");
  assert.equal(big, "22 days to beta", "Oct 31 12:00Z to Nov 22");
  const bar = Number(c.html.match(/class="bar"[^>]*><i[^>]*width:\s*([\d.]+)%/)?.[1]);
  assert.ok(bar > 0 && bar < 100, `bar shows elapsed time (got ${bar})`);
  const late = clone(f);
  late.builtAt = "2026-11-30T00:00:00.000Z";
  const lateBig = text(cardsOf(late).find((x) => attr(x.tag, "data-goal") === "hearth-beta")!.html.match(/class="big"[^>]*>([\s\S]*?)<\//)?.[1] ?? "");
  assert.doesNotMatch(lateBig, /-\d|NaN/, `past the target never shows a negative count (got ${lateBig})`);
});

test("UX-C1 progress: a goal with no progress shows its share as the big line and a muted \"Progress kept private\"", () => {
  const f = feed();
  const c = cardsOf(f).find((x) => attr(x.tag, "data-goal") === "staff-pm-role")!;
  const g = f.goals.find((x) => x.id === "staff-pm-role")!;
  assert.equal(text(c.html.match(/class="big"[^>]*>([\s\S]*?)<\//)?.[1] ?? ""), `${g.effort}%`);
  assert.match(text(c.html), /Progress kept private/);
});

test("UX-C1 goals.json: progress for portfolio, hearth-beta and agent-team; none for staff-pm-role (its counts stay private)", () => {
  const goals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as (Goal & { progress?: unknown })[];
  const p = Object.fromEntries(goals.map((g) => [g.id, g.progress]));
  assert.deepEqual(p.portfolio, { done: 5, of: 7, label: "demos live" });
  assert.deepEqual(p["hearth-beta"], { target: "2026-11-22", label: "to beta" });
  assert.deepEqual(p["agent-team"], { done: 0, of: 8, label: "agents with evals" });
  assert.equal(p["staff-pm-role"], undefined);
});

const decideRows = (f: Feed) => rows(app().renderCallSheet(f), "data-group").filter((r) => attr(r.tag, "data-group") === "decide");
const reasonOf = (html: string) => text(html.match(/data-reason[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "");

test("UX-C3 reason: a decision bullet with more than one sentence shows the first as its title and the rest as its reason", () => {
  const f = clone(feed());
  f.callSheet.decide = [{ repo: "ccwatts", text: "Ship pace during the Polish Freeze or wait. The freeze ends Nov 7 and pace is ready." }];
  const [r] = decideRows(f);
  assert.equal(text(r.html.match(/<strong[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? ""), "Ship pace during the Polish Freeze or wait");
  assert.equal(reasonOf(r.html), "The freeze ends Nov 7 and pace is ready.");
});

test("UX-C3/UX-C9 reason: with one sentence the reason names the source, and then no source chip repeats it", () => {
  const f = clone(feed());
  f.callSheet.decide = [{ repo: "ccwatts", text: "Ship pace during the Polish Freeze or wait." }, { repo: null, text: "Paste the intake check into each product project." }];
  const [a, b] = decideRows(f);
  assert.match(reasonOf(a.html), /Handoff notes/);
  assert.match(reasonOf(b.html), /Studio status/);
  for (const r of [a, b]) assert.equal((text(r.html).match(/Handoff notes|Studio status/g) ?? []).length, 1, `source named once: ${text(r.html)}`);
});

// UX-S10 supersedes the source chip: the row's button names the source instead.
test("UX-C9 a decision whose reason comes from the bullet still names its source (on its button, not a chip)", () => {
  const f = clone(feed());
  f.callSheet.decide = [{ repo: "ccwatts", text: "Ship pace now or wait. The freeze ends soon." }];
  const html = decideRows(f)[0].html;
  assert.match(text(html), /Open handoff notes/);
  assert.doesNotMatch(html, /class="[^"]*\bchip\b[^"]*"[^>]*>\s*Handoff notes/);
});

test("UX-C10 no title on the Call Sheet or Focus shows a file name (*.json, *.md, ...)", () => {
  const f = feed();
  const titles = [app().renderCallSheet(f), app().renderFocus(f)].flatMap((h) => [...h.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)].map((m) => text(m[1])));
  assert.ok(titles.length > 0);
  for (const t of titles) assert.doesNotMatch(t, /\b[\w-]+\.(json|md|ya?ml|ts|js)\b/i, `"${t}" names a file`);
});

test("UX-C11 a goal with no progress shows no card bar; a goal with progress keeps its bar", () => {
  const f = withGoals((gs) => gs.map((g) => (g.id === "portfolio" ? ({ ...g, progress: { done: 5, of: 7, label: "demos live" } } as Goal) : g)));
  const cards = cardsOf(f);
  for (const c of cards) {
    const has = /class="bar"/.test(c.html);
    assert.equal(has, attr(c.tag, "data-goal") === "portfolio", `${attr(c.tag, "data-goal")}: card bar ${has ? "shown" : "absent"}`);
  }
});
