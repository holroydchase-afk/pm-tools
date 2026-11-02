// PMT-M3.3 review round 3 on the live-shape feed (ux-reviewer 6/10): UX-S9 to UX-S13, plus CON-R16
// and CON-R17. Render helpers on window.Console loaded in a vm, fed by tests/fixtures/feed-live/ built
// through core.ts. Browser checks (Decide button gap, Roster gates at 390px) are in
// tests/e2e/demos.e2e.ts.
//
// Markup hooks these tests read (none new): Horizon [data-card] with data-id, its PR link <a>;
// Call Sheet [data-group="decide"] rows, <strong> call, [data-reason]; Focus [data-goal];
// Roster [data-gate-row], [data-gate] with data-state; Slate [data-product]; drawer [data-summary].
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildFeed } from "../scripts/feed/core.ts";
import type { Feed } from "../scripts/feed/types.ts";
import { liveInput, LIVE_NOW } from "./fixtures/feed-live/load.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
type Api = Record<"renderFocus" | "renderCallSheet" | "renderSlate" | "renderHorizon" | "renderRoster", (f: Feed) => string> & { renderDrawer(f: Feed, repo: string): string };

function app(): Api {
  const ctx = { window: {} as { Console?: Api }, console };
  vm.runInNewContext(readFileSync(join(ROOT, "console", "app.js"), "utf8"), ctx);
  return ctx.window.Console!;
}
const live = (): Feed => buildFeed(liveInput(), LIVE_NOW);

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
const els = (html: string, a: string) => tagsWith(html, a).map((t) => ({ tag: t.tag, at: t.at, html: element(html, t.at) }));
const MD = /\*\*|`|\[[^\]]*\]\([^)]*\)/;
const PLAN_ID = /\b[A-Z]{2,4}-(?:M\d+(?:\.\d+)?|R\d+)\b/;
const LEADING_DATE = /^(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2})\b/;
// Markdown off, for comparing feed text with what a person reads.
const plainMd = (s: string) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------- UX-S9 Horizon cards

// A card's title: its text without the planning ID label and the PR link.
function hzCards(f: Feed) {
  return els(app().renderHorizon(f), "data-card").map((c) => {
    const id = attr(c.tag, "data-id");
    const prText = (c.html.match(/<a\b[\s\S]*?<\/a>/g) ?? []).map(text).join(" ");
    let t = text(c.html);
    if (prText) t = t.replace(prText, "").trim();
    return { id, all: t, title: id && t.startsWith(id + " ") ? t.slice(id.length + 1) : t, html: c.html };
  });
}

test("UX-S9 Horizon cards: plain text, first sentence only, at most 140 characters, no leading date", () => {
  const cards = hzCards(live());
  assert.ok(cards.length >= 8, `live-shape feed has Horizon cards (${cards.length})`);
  for (const c of cards) {
    assert.doesNotMatch(c.all, MD, `markdown left in: ${c.all.slice(0, 60)}`);
    assert.ok(c.title.length <= 140, `${c.title.length} chars: ${c.title.slice(0, 60)}…`);
    assert.doesNotMatch(c.title, /[.!?]\s+\S/, `more than one sentence: ${c.title.slice(0, 80)}`);
    assert.doesNotMatch(c.title, LEADING_DATE, `leading date: ${c.title.slice(0, 40)}`);
  }
});

test("UX-S9 Horizon cards: a planning ID shows only in the card's small label, never in its title", () => {
  const cards = hzCards(live());
  for (const c of cards) {
    if (c.id) assert.ok(c.all.startsWith(c.id + " "), `${c.id}: the label leads the card`);
    assert.doesNotMatch(c.title, PLAN_ID, `planning ID in the title: ${c.title.slice(0, 60)}`);
  }
  // "**RR-M4 Home and declutter** (approved ...)" reads as label RR-M4, title "Home and declutter ...".
  const rr = cards.find((c) => c.all.includes("Home and declutter"));
  assert.ok(rr, "the RR-M4 card is on the board");
  assert.equal(rr.id, "RR-M4");
});

test("UX-S9 Horizon: no card sits inside another card or panel", () => {
  const html = app().renderHorizon(live());
  const boxes = [...html.matchAll(/<[a-z]+\b[^>]*>/gi)].filter((m) => /\sdata-card\b|\sclass="[^"]*\b(?:card|panel)\b/.test(m[0]));
  for (const c of els(html, "data-card")) {
    const inner = c.html.slice(c.tag.length);
    assert.doesNotMatch(inner, /\sdata-card\b|\sclass="[^"]*\b(?:card|panel)\b/, `card inside a card: ${text(c.html).slice(0, 40)}`);
    // Any card or panel that opens before this card and closes after it contains it.
    const outer = boxes.filter((b) => b.index! < c.at && b.index! + element(html, b.index!).length > c.at + c.html.length);
    assert.deepEqual(outer.map((b) => b[0]), [], `card nested in: ${text(c.html).slice(0, 40)}`);
  }
});

// ---------------------------------------------------------------- UX-S10 Decide

type Row = { strong: string; reason: string; all: string; html: string };
function decideRows(html: string): Row[] {
  return els(html, "data-group").filter((r) => attr(r.tag, "data-group") === "decide").map((r) => ({
    strong: text(r.html.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? ""),
    reason: text(els(r.html, "data-reason")[0]?.html ?? ""),
    all: text(r.html),
    html: r.html,
  }));
}

test("UX-S10 Decide: no \"Decide on\" prefix unless the call is a question", () => {
  for (const r of decideRows(app().renderCallSheet(live()))) {
    if (/^Decide on\b/.test(r.strong)) assert.match(r.strong, /\?$/, `"Decide on" added to a statement: ${r.strong.slice(0, 70)}`);
  }
});

// A reason worth reading is a whole sentence: 4 words or more, not ending on a dangling word.
const DANGLING = /\b(?:is|are|was|were|be|the|a|an|to|of|in|on|for|with|and|or|but|from|by|at)\.$/i;
test("UX-S10 Decide: a reason that isn't a whole sentence is hidden (live: \"The paste is.\")", () => {
  const rows = decideRows(app().renderCallSheet(live()));
  assert.ok(!rows.some((r) => r.all.includes("The paste is.")), "\"The paste is.\" is shown");
  const f = live();
  f.callSheet.decide = [
    { repo: null, text: "Pick a launch day. Two options." },
    { repo: null, text: "Name the beta. The list is in." },
    { repo: null, text: "Review the rubric. The first evals run once it's approved." },
  ];
  const r = decideRows(app().renderCallSheet(f));
  assert.ok(!r[0].all.includes("Two options."), `under 4 words shown: ${r[0].all}`);
  assert.ok(!r[1].all.includes("The list is in."), `ends mid-phrase, shown: ${r[1].all}`);
  assert.ok(r[2].all.includes("The first evals run once it's approved."), "a whole-sentence reason still shows");
  for (const x of r) if (x.reason) assert.ok(x.reason.split(/\s+/).length >= 4 && !DANGLING.test(x.reason), `reason shown: "${x.reason}"`);
});

test("UX-S10 Decide: no \"Handoff notes\" chip on a decision row", () => {
  for (const r of decideRows(app().renderCallSheet(live()))) {
    const chips = [...r.html.matchAll(/<span\b[^>]*class="[^"]*\bchip\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
    assert.ok(!chips.includes("Handoff notes"), `chip "Handoff notes" on: ${r.strong.slice(0, 50)}`);
  }
});

// ---------------------------------------------------------------- UX-S11 Focus

test("UX-S11 Focus: under 10 items no goal shows a \"% of this week's work\" line", () => {
  const f = live();
  assert.ok(f.workItems < 10, `fixture: ${f.workItems} items`);
  assert.doesNotMatch(text(app().renderFocus(f)), /% of this week's work/);
});

// ---------------------------------------------------------------- UX-S13 zero run logs

test("UX-S13 Roster: with zero run logs anywhere, gates say \"Not logged yet\", not missing", () => {
  const f = live();
  assert.ok(Object.values(f.runs).every((m) => Object.keys(m).length === 0), "fixture: zero runs");
  const gates = els(app().renderRoster(f), "data-gate-row").flatMap((r) => tagsWith(r.html, "data-gate").filter((g) => attr(g.tag, "data-gate") !== undefined).map((g) => ({ state: attr(g.tag, "data-state"), text: text(element(r.html, g.at)) })));
  assert.ok(gates.length > 0, "gates are shown");
  for (const g of gates) {
    assert.notEqual(g.state, "missing", `a gate reads as missing: ${g.text}`);
    assert.doesNotMatch(g.text, /missing/i);
    assert.match(g.text, /Not logged yet/);
  }
});

test("UX-S13 Slate: with zero run logs, cards leave out \"Last agent run: none\"", () => {
  assert.doesNotMatch(text(app().renderSlate(live())), /Last agent run: none/);
});

// ---------------------------------------------------------------- CON-R16, CON-R17

test("CON-R16 drawer: every decision Decide holds for a product is readable in its drawer (no cap)", () => {
  const f = live();
  for (const p of f.products) {
    const ds = f.callSheet.decide.filter((d) => d.repo === p.repo);
    const t = text(app().renderDrawer(f, p.repo));
    for (const d of ds) {
      const first = plainMd(d.text).replace(/^\d{4}-\d{2}-\d{2}:\s*/, "").split(/(?<=[.!?])\s/)[0].slice(0, 50);
      assert.ok(t.includes(first), `${p.repo}: drawer leaves out "${first}"`);
    }
  }
});

test("CON-R17 Decide: the 10-row cap holds, and the rows over it are counted, not dropped silently", () => {
  const f = live();
  f.callSheet.decide = Array.from({ length: 14 }, (_, i) => ({ repo: `sample-${i}`, text: `Pick option ${i}. It holds release ${i} for the week.` }));
  const html = app().renderCallSheet(f);
  const rows = decideRows(html);
  assert.equal(rows.length, 10, "exactly 10 Decide rows");
  assert.deepEqual(rows.map((r) => r.strong), Array.from({ length: 10 }, (_, i) => `Pick option ${i}`), "the first 10, in feed order");
  assert.match(text(html), /\b4 more\b/, "says how many are not shown");
});
