// PMT-M3.3 review on the real feed (ux-reviewer 4/10): UX-S1 to UX-S8, console side. Render helpers
// on window.Console (loaded in a vm, as in tests/console.test.ts), fed by the live-shape fixture
// (tests/fixtures/feed-live/, built through core.ts) or small hand-made feeds. Browser checks (pill
// wrap, contrast, the "N more" button opening the drawer) are in tests/e2e/demos.e2e.ts.
//
// Markup hooks these tests read (new ones marked *):
//   Slate card: <button data-product> with aria-label "<name>, <Stage>, open details"*;
//               its Now and Next values in [data-line="now"] and [data-line="next"]*;
//               a shown stage word in [data-stage]*.
//   Drawer:     [data-summary] <li> lines; a shown stage word in [data-stage]*.
//   Call Sheet: decide rows [data-group="decide"]; "N more from <name>" is a <button data-product="<repo>">*.
//   Horizon:    [data-col] cells; Roster: [data-runs-row], [data-gate-row], [data-gate].
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildFeed } from "../scripts/feed/core.ts";
import type { Feed, PullRequest } from "../scripts/feed/types.ts";
import { liveInput, LIVE_NOW } from "./fixtures/feed-live/load.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GH = "https://github.com/holroydchase-afk/";
type Api = Record<"renderFocus" | "renderCallSheet" | "renderSlate" | "renderHorizon" | "renderRoster", (f: Feed) => string> & { renderDrawer(f: Feed, repo: string): string };

function app(): Api {
  const ctx = { window: {} as { Console?: Api }, console };
  vm.runInNewContext(readFileSync(join(ROOT, "console", "app.js"), "utf8"), ctx);
  return ctx.window.Console!;
}
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const live = (): Feed => buildFeed(liveInput(), LIVE_NOW);
const sample = (): Feed => JSON.parse(readFileSync(join(ROOT, "console", "sample-studio.json"), "utf8")) as Feed;

const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const text = (html: string) => unesc(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const tagsWith = (html: string, a: string) => [...html.matchAll(new RegExp(`<[a-z][^>]*\\s${a}(?:="[^"]*")?[^>]*>`, "gi"))].map((m) => ({ tag: m[0], at: m.index }));
const attr = (tag: string, name: string) => { const v = tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]; return v === undefined ? undefined : unesc(v); };
function element(html: string, at: number): string {
  const name = html.slice(at + 1).match(/^[a-z0-9]+/i)![0];
  const re = new RegExp(`<(/?)${name}\\b[^>]*>`, "gi");
  re.lastIndex = at;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[1] ? -1 : m[0].endsWith("/>") ? 0 : 1;
    if (depth === 0) return html.slice(at, m.index + m[0].length);
  }
  return html.slice(at);
}
const els = (html: string, a: string) => tagsWith(html, a).map((t) => ({ tag: t.tag, html: element(html, t.at) }));
const MD = /\*\*|`|\[[^\]]*\]\([^)]*\)/;
const STAGES = ["Idea", "Building", "Beta", "Live", "Parked"];

// Every view of a feed, plus each product's drawer: the text a person can read.
function allViews(f: Feed): string {
  const c = app();
  return [c.renderFocus(f), c.renderCallSheet(f), c.renderSlate(f), c.renderHorizon(f), c.renderRoster(f), ...f.products.map((p) => c.renderDrawer(f, p.repo))].join("\n");
}

// ---------------------------------------------------------------- UX-S1 empty states on the real feed

test("UX-S1 Horizon: with no cards at all it says \"Milestones appear once each product's plan is read.\"", () => {
  const f = live();
  f.horizon = f.horizon.map((r) => ({ repo: r.repo, now: [], next: [], later: [], done: [] }));
  const t = text(app().renderHorizon(f));
  assert.ok(t.includes("Milestones appear once each product's plan is read."), t.slice(0, 300));
});

test("UX-S1 Roster: all-zero runs hide the runs table and say \"No agent runs logged this week.\"", () => {
  const f = live();
  assert.ok(Object.values(f.runs).every((m) => Object.keys(m).length === 0), "fixture: zero runs");
  const html = app().renderRoster(f);
  assert.equal(els(html, "data-runs-row").length, 0, "no table of zeros");
  assert.ok(text(html).includes("No agent runs logged this week."));
});

test("UX-S1 Roster: with runs, the table shows and the empty line doesn't", () => {
  const html = app().renderRoster(sample());
  assert.ok(els(html, "data-runs-row").length > 0);
  assert.ok(!text(html).includes("No agent runs logged this week."));
});

// ---------------------------------------------------------------- UX-S2 Slate text vs drawer text

const LONG = "**RR-M4 Home and declutter** (approved on 2026-10-30 with `go`). One draft PR from `claude/rr-m4-1`, one commit per step.";

test("UX-S2 Slate: Now and Next are markdown-stripped, first sentence only", () => {
  const f = live();
  const p = f.products[0];
  p.now = [LONG];
  p.next = ["Run `npm test` [three times](https://example.com/qa). Then open the PR."];
  const card = els(app().renderSlate(f), "data-product").find((c) => attr(c.tag, "data-product") === p.repo)!;
  const now = els(card.html, "data-line").find((l) => attr(l.tag, "data-line") === "now");
  const next = els(card.html, "data-line").find((l) => attr(l.tag, "data-line") === "next");
  assert.ok(now && next, "card marks its Now and Next lines with data-line");
  assert.equal(text(now.html), "RR-M4 Home and declutter (approved on 2026-10-30 with go).");
  assert.equal(text(next.html), "Run npm test three times.");
});

test("UX-S2 Slate: on the live-shape feed every Now/Next line is plain text of at most 140 characters", () => {
  const f = live();
  const lines = els(app().renderSlate(f), "data-line");
  assert.ok(lines.length >= f.products.length, "every product shows at least a Now line");
  for (const l of lines) {
    const t = text(l.html);
    assert.ok(t.length <= 140, `${t.length} chars: ${t.slice(0, 60)}…`);
    assert.doesNotMatch(t, MD, `markdown left in: ${t.slice(0, 60)}`);
  }
});

test("UX-S2 drawer: keeps the fuller text, still without markdown", () => {
  const f = live();
  const p = f.products[0];
  p.now = [LONG];
  const s = els(app().renderDrawer(f, p.repo), "data-summary")[0];
  const t = text(s.html);
  assert.ok(t.includes("One draft PR from claude/rr-m4-1, one commit per step."), "second sentence kept in the drawer");
  for (const li of els(s.html, "data-summary")[0].html.match(/<li\b[\s\S]*?<\/li>/g) ?? []) assert.doesNotMatch(text(li), MD);
});

// ---------------------------------------------------------------- UX-S3 Call Sheet Decide

type Row = { repo: string | null; strong: string; reason: string };
function decideRows(html: string): Row[] {
  return els(html, "data-group").filter((r) => attr(r.tag, "data-group") === "decide").map((r) => {
    const href = r.html.match(/href="([^"]*HANDOFF\.md|[^"]*STUDIO-STATUS\.md)"/)?.[1] ?? "";
    const repo = href.includes("STUDIO-STATUS") ? null : href.slice(GH.length).split("/")[0];
    const strong = text(r.html.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? "");
    const reason = text(els(r.html, "data-reason")[0]?.html ?? "");
    return { repo, strong, reason };
  });
}

test("UX-S3 Decide: at most 1 decision per product and 3 from studio status", () => {
  const f = live();
  const rows = decideRows(app().renderCallSheet(f));
  const per = new Map<string | null, number>();
  for (const r of rows) per.set(r.repo, (per.get(r.repo) ?? 0) + 1);
  for (const [repo, n] of per) assert.ok(repo === null ? n <= 3 : n <= 1, `${repo ?? "studio status"}: ${n} rows`);
  assert.equal(per.get(null), 3, "studio status shows 3 of its 5");
});

test("UX-S3 Decide: a product with more decisions gets a \"N more from <product>\" button that opens its drawer", () => {
  const f = live();
  const html = app().renderCallSheet(f);
  for (const p of f.products) {
    const n = f.callSheet.decide.filter((d) => d.repo === p.repo).length;
    const more = els(html, "data-product").filter((b) => attr(b.tag, "data-product") === p.repo);
    if (n > 1) {
      assert.equal(more.length, 1, `${p.repo}: one "more" button`);
      assert.match(more[0].tag, /^<button\b/);
      assert.equal(text(more[0].html), `${n - 1} more from ${p.name}`);
    } else assert.equal(more.length, 0, `${p.repo}: no "more" button`);
  }
});

test("UX-S3 Decide: at most 10 rows in a group", () => {
  const f = live();
  f.callSheet.decide = Array.from({ length: 14 }, (_, i) => ({ repo: `sample-${i}`, text: `Pick option ${i}.` }));
  f.callSheet.inProgress = Array.from({ length: 14 }, (_, i) => ({ repo: "ccwatts", number: 100 + i, title: `CCW-M9.${i}: Work ${i}`, goal: null }));
  const html = app().renderCallSheet(f);
  for (const g of ["decide", "inProgress"]) {
    const n = els(html, "data-group").filter((r) => attr(r.tag, "data-group") === g).length;
    assert.ok(n <= 10, `${g}: ${n} rows`);
  }
});

test("UX-S3 Decide: no \"Decide on <date>:\" prefix, and the call and its reason are each at most 120 characters", () => {
  for (const r of decideRows(app().renderCallSheet(live()))) {
    assert.doesNotMatch(r.strong, /^Decide on \d{4}-\d{2}-\d{2}/, r.strong);
    assert.doesNotMatch(r.strong, /^\d{4}-\d{2}-\d{2}:/, r.strong);
    assert.ok(r.strong.length <= 120, `call ${r.strong.length} chars: ${r.strong.slice(0, 60)}…`);
    assert.ok(r.reason.length <= 120, `reason ${r.reason.length} chars: ${r.reason.slice(0, 60)}…`);
  }
});

// ---------------------------------------------------------------- UX-S4 Focus counts

test("UX-S4 Focus: shows the off-goal item count next to its share (\"3 of 7\")", () => {
  const t = text(app().renderFocus(live()));
  assert.match(t, /\b3 of 7\b/, "3 off-goal of 7 open PRs (zero runs; Dependabot not counted)");
});

test("UX-S4 Focus: under 10 items it says \"Too little work this week to split.\" instead of the bar", () => {
  const html = app().renderFocus(live());
  assert.ok(text(html).includes("Too little work this week to split."));
  assert.equal(tagsWith(html, "data-segment").length, 0, "no split bar");
});

test("UX-S4 Focus: at 10 items or more the bar shows and the message doesn't", () => {
  const input = liveInput();
  const extra: PullRequest[] = Array.from({ length: 4 }, (_, i) => ({ number: 200 + i, title: `RR-M5.${i}: More work`, draft: false, author: "sample-builder", updatedAt: "2026-10-31T09:00:00Z", body: "", checks: "pending", branch: `extra-${i}` }));
  input.products[0].prs.push(...extra);
  const html = app().renderFocus(buildFeed(input, LIVE_NOW));
  assert.ok(tagsWith(html, "data-segment").length > 0);
  assert.ok(!text(html).includes("Too little work this week to split."));
});

// ---------------------------------------------------------------- UX-S6 words

// The console's own words only: quoted HANDOFF or PR text that happens to say "intake" is the
// product's content, so those strings are swapped out before rendering.
const BANNED = /\.claude|Agents: line|HANDOFF\.md status header|\bintakes?\b/i;
const chromeOnly = (f: Feed): Feed => JSON.parse(JSON.stringify(f), (_k, v) => (typeof v === "string" && BANNED.test(v) ? "Sample text." : v)) as Feed;

test("UX-S6 no view says .claude, \"Agents: line\", \"HANDOFF.md status header\" or intake", () => {
  for (const [name, f] of [["live-shape", chromeOnly(live())], ["sample", chromeOnly(sample())]] as const) {
    const t = text(allViews(f));
    for (const bad of [".claude", "Agents: line", "HANDOFF.md status header"]) assert.ok(!t.includes(bad), `${name}: "${bad}" shown`);
    assert.doesNotMatch(t, /\bintakes?\b/i, `${name}: says "intake" (use "new idea")`);
  }
});

test("UX-S6 Slate: intake issues read as new ideas", () => {
  const f = live();
  const html = app().renderSlate(f);
  const card = (repo: string) => text(els(html, "data-product").find((c) => attr(c.tag, "data-product") === repo)!.html);
  assert.match(card("charlie"), /\b2 new ideas\b/);
  assert.match(card("role-radar"), /\b1 new idea\b/);
});

test("UX-S6 one stage vocabulary (Idea, Building, Beta, Live, Parked) in card and drawer", () => {
  const f = live();
  const set = (i: number, stage: string, track: Feed["products"][number]["track"]) => Object.assign(f.products[i], { stage, track });
  set(0, "beta", "beta"); set(1, "polish", null); set(2, "build", "building"); set(3, "idea", "idea"); set(4, "build", "building");
  const c = app();
  const cards = c.renderSlate(f);
  for (const p of f.products) {
    const card = els(cards, "data-product").find((x) => attr(x.tag, "data-product") === p.repo)!.html;
    for (const html of [card, c.renderDrawer(f, p.repo)]) {
      for (const s of els(html, "data-stage")) assert.ok(STAGES.includes(text(s.html)), `${p.repo}: stage word "${text(s.html)}"`);
      assert.doesNotMatch(text(html), /\b(build|polish)\b/, `${p.repo}: a raw stage word`);
    }
  }
  assert.ok(els(c.renderDrawer(f, f.products[2].repo), "data-stage").some((s) => text(s.html) === "Building"), "the drawer names the stage");
});

// ---------------------------------------------------------------- UX-S7 gates

test("UX-S7 Roster: gates show only passed and missing; a PR with neither says \"No gates needed\"", () => {
  const f = sample();
  f.gates = [
    { repo: "ccwatts", number: 74, gates: { "staff-pm": "ok", "qa-tdd": "missing", engineer: "n/a", "ux-reviewer": "n/a", "privacy-security": "n/a", positioning: "ok" } },
    { repo: "charlie", number: 28, gates: { "staff-pm": "n/a", "qa-tdd": "n/a", engineer: "n/a", "ux-reviewer": "n/a", "privacy-security": "n/a" } },
  ];
  const rows = els(app().renderRoster(f), "data-gate-row");
  // The row's own <tr data-gate-row> tag also matches "data-gate"; keep only the gate cells.
  const cells = (i: number) => tagsWith(rows[i].html, "data-gate").filter((g) => attr(g.tag, "data-gate") !== undefined).map((g) => `${attr(g.tag, "data-gate")}=${attr(g.tag, "data-state")}`);
  assert.deepEqual(cells(0), ["staff-pm=ok", "qa-tdd=missing", "positioning=ok"]);
  assert.doesNotMatch(text(rows[0].html), /n\/a/);
  assert.deepEqual(cells(1), []);
  assert.ok(text(rows[1].html).includes("No gates needed"));
});

test("UX-S7 Roster: the positioning agent is labeled \"Copy\"", () => {
  const f = sample();
  f.runs = { ...f.runs, [f.products[0].repo]: { ...(f.runs[f.products[0].repo] ?? {}), positioning: 2 } };
  f.gates = [{ repo: "ccwatts", number: 74, gates: { "staff-pm": "n/a", "qa-tdd": "n/a", engineer: "n/a", "ux-reviewer": "n/a", "privacy-security": "n/a", positioning: "ok" } }];
  const html = app().renderRoster(f);
  const cell = tagsWith(html, "data-gate").find((g) => attr(g.tag, "data-gate") === "positioning")!;
  assert.match(text(element(html, cell.at)), /^Copy\b/);
  const head = html.match(/<thead>[\s\S]*?<\/thead>/)![0];
  assert.ok(text(head).split(" ").includes("Copy"), "runs table column header");
  assert.ok(!text(head).includes("positioning"));
});

// ---------------------------------------------------------------- UX-S8 accessibility

test("UX-S8 Slate: each product card's accessible name is \"<name>, <Stage>, open details\"", () => {
  const f = live();
  const tracks = ["beta", "live", "building", "idea", "building"] as const;
  f.products.forEach((p, i) => { p.track = tracks[i]; });
  const cards = els(app().renderSlate(f), "data-product");
  cards.forEach((c, i) => {
    const p = f.products[i];
    const stage = STAGES.find((s) => s.toLowerCase() === p.track)!;
    assert.equal(attr(c.tag, "aria-label"), `${p.name}, ${stage}, open details`);
  });
});

test("UX-S8 Horizon: an empty cell has no text (no dot or dash for a screen reader or the eye)", () => {
  const f = live();
  f.horizon[0] = { repo: f.horizon[0].repo, now: [{ id: "RR-M4.1", title: "Header and tabs", pr: 61 }], next: [], later: [], done: [] };
  const row = els(app().renderHorizon(f), "data-hz-row")[0];
  for (const c of els(row.html, "data-col").filter((x) => attr(x.tag, "data-col") !== "now")) assert.equal(text(c.html), "", `${attr(c.tag, "data-col")} cell`);
});
