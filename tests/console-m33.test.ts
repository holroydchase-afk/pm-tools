// PMT-M3.3 Studio Console UI: Build Slate, the product drawer, Horizon Board and Agent Roster
// (CON-12 to CON-15). Same contract as tests/console.test.ts: console/app.js loaded in a vm sets
// window.Console; render helpers return HTML strings. Browser checks (drawer keyboard, 390px and
// 1280px, no errors) are in tests/e2e/demos.e2e.ts. Feed fields: tests/feed-m33.test.ts.
//
// New helpers on window.Console: renderSlate(feed), renderDrawer(feed, repo), renderHorizon(feed),
// renderRoster(feed). Markup hooks the tests read:
//   Slate:   [data-wip] with data-active, data-cap, and data-over when active > cap (warning chip
//            class "warn", text "<active> of <cap>"). Active = not parked and no `group`.
//            Each product is a <button data-product="<repo>">; its track has five [data-step]
//            (idea, building, beta, live, parked), the current one aria-current="step";
//            [data-health="ok|warn|bad"] with its note as text.
//   Drawer:  role="dialog" with aria-labelledby; [data-summary] holds at most 10 <li> lines; a link
//            to the repo's HANDOFF.md on GitHub.
//   Horizon: [data-hz-row="<repo>"] with four [data-col="now|next|later|done"]; each card
//            [data-card] (data-id when it has one) shows the ID in a small .id label only.
//   Roster:  [data-runs-row="<repo>"] cells [data-agent="<agent>"]; [data-gate-row="<repo>#<n>"]
//            cells [data-gate="<agent>" data-state="ok|missing"] with a state word as text (n/a not shown, UX-S7);
//            [data-evals] with a placeholder, never a zero score.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import type { Feed } from "../scripts/feed/types.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GH = "https://github.com/holroydchase-afk/";

type Card = { id: string | null; title: string; pr: number | null };
type Summary = Feed["products"][number] & { group: string | null; track: string | null; lastRun: { agent: string; at: string } | null; health: { level: string; note: string } };
type M33Feed = Omit<Feed, "products"> & { wipCap: number; products: Summary[]; horizon: { repo: string; now: Card[]; next: Card[]; later: Card[]; done: Card[] }[] };
type Api = { renderSlate(f: M33Feed): string; renderDrawer(f: M33Feed, repo: string): string; renderHorizon(f: M33Feed): string; renderRoster(f: M33Feed): string };

function app(): Api {
  const ctx = { window: {} as { Console?: Record<string, unknown> }, console };
  vm.runInNewContext(readFileSync(join(ROOT, "console", "app.js"), "utf8"), ctx);
  const c = ctx.window.Console!;
  for (const fn of ["renderSlate", "renderDrawer", "renderHorizon", "renderRoster"]) assert.equal(typeof c[fn], "function", `Console.${fn} (PMT-M3.3)`);
  return c as unknown as Api;
}
const sample = (): M33Feed => JSON.parse(readFileSync(join(ROOT, "console", "sample-studio.json"), "utf8")) as M33Feed;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const text = (html: string) => unesc(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const tagsWith = (html: string, a: string) => [...html.matchAll(new RegExp(`<[a-z][^>]*\\s${a}(?:="[^"]*")?[^>]*>`, "gi"))].map((m) => ({ tag: m[0], at: m.index }));
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
// The element opened by `tag` at `at`, to its matching close tag.
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
const hrefs = (html: string) => [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => unesc(m[1]));

// A slate with n active products (and one studio tool and one parked product that don't count).
function slateOf(active: number): M33Feed {
  const f = clone(sample());
  const base = f.products[0];
  const mk = (i: number, extra: Partial<Summary>) => ({ ...clone(base), repo: `sample-${i}`, name: `Sample ${i}`, group: null, track: "building", ...extra }) as Summary;
  f.products = [
    ...Array.from({ length: active }, (_, i) => mk(i, {})),
    mk(90, { group: "Studio tools" }),
    mk(91, { track: "parked" }),
  ];
  return f;
}

// ---------------------------------------------------------------- CON-12 Build Slate

test("CON-12 Slate: more than 5 active products shows the WIP bar over cap in the warning color", () => {
  const html = app().renderSlate(slateOf(6));
  const wip = els(html, "data-wip");
  assert.equal(wip.length, 1, "one WIP bar");
  assert.equal(attr(wip[0].tag, "data-active"), "6", "parked and studio-tool products don't count");
  assert.equal(attr(wip[0].tag, "data-cap"), "5");
  assert.ok(/\sdata-over\b/.test(wip[0].tag), "marked over cap");
  assert.match(wip[0].html, /class="[^"]*\bwarn\b[^"]*"[^>]*>[^<]*6 of 5/, "a warning chip reads \"6 of 5\"");
});

test("CON-12 Slate: at or under the cap there is no over-cap warning; the cap comes from the feed", () => {
  for (const [n, cap] of [[5, 5], [3, 5], [6, 6]] as const) {
    const f = slateOf(n);
    f.wipCap = cap;
    const wip = els(app().renderSlate(f), "data-wip")[0];
    assert.equal(attr(wip.tag, "data-cap"), String(cap));
    assert.ok(!/\sdata-over\b/.test(wip.tag), `${n} of ${cap}: not over`);
    assert.doesNotMatch(wip.html, /class="[^"]*\bwarn\b/, `${n} of ${cap}: no warning color`);
    assert.match(text(wip.html), new RegExp(`${n} of ${cap}`));
  }
});

test("CON-12 Slate: each product card shows stage track, milestone, now/next, health, waiting-on-you, PR and intake counts and last agent run", () => {
  const f = sample();
  const html = app().renderSlate(f);
  const cards = els(html, "data-product");
  assert.deepEqual(cards.map((c) => attr(c.tag, "data-product")), f.products.map((p) => p.repo));
  cards.forEach((c, i) => {
    const p = f.products[i];
    assert.match(c.tag, /^<button\b/, `${p.repo}: the card is a button`);
    const t = text(c.html);
    const steps = tagsWith(c.html, "data-step").map((s) => attr(s.tag, "data-step"));
    assert.deepEqual(steps, ["idea", "building", "beta", "live", "parked"], `${p.repo}: five-step track`);
    for (const w of ["Idea", "Building", "Beta", "Live", "Parked"]) assert.ok(t.includes(w), `${p.repo}: track label ${w}`);
    const cur = tagsWith(c.html, "data-step").filter((s) => /aria-current="step"/.test(s.tag)).map((s) => attr(s.tag, "data-step"));
    assert.deepEqual(cur, p.track ? [p.track] : [], `${p.repo}: current step`);
    if (p.milestone) assert.ok(t.includes(p.milestone), `${p.repo}: milestone`);
    // UX-S2: the card shows a plain first sentence, so check the opening words only.
    const lead = (s: string) => s.replace(/\*\*|`/g, "").slice(0, 20);
    if (p.now[0]) assert.ok(t.includes(lead(p.now[0])), `${p.repo}: now`);
    if (p.next[0]) assert.ok(t.includes(lead(p.next[0])), `${p.repo}: next`);
    const health = tagsWith(c.html, "data-health");
    assert.equal(health.length, 1);
    assert.equal(attr(health[0].tag, "data-health"), p.health.level);
    assert.ok(t.includes(p.health.note), `${p.repo}: health note as text, not color only`);
    const waiting = f.callSheet.decide.filter((d) => d.repo === p.repo).length;
    if (waiting) assert.match(t, new RegExp(`\\b${waiting} waiting on you\\b`), `${p.repo}: ${waiting} waiting on you`);
    else assert.doesNotMatch(t, /waiting on you/);
    assert.match(t, new RegExp(`\\b${p.openPrs} PRs?\\b`), `${p.repo}: PR count`);
    assert.match(t, new RegExp(`\\b${p.intakes} new ideas?\\b`), `${p.repo}: intake count reads as new ideas (UX-S6)`);
    assert.match(t, p.lastRun ? new RegExp(`Last agent run: ${p.lastRun.agent}\\b`) : /Last agent run: none/, `${p.repo}: last run`);
  });
});

test("CON-12 Slate: product text from the feed is escaped", () => {
  const f = clone(sample());
  f.products[0].now = [`<img src=x onerror="alert(1)">`];
  f.products[0].name = `<script>alert(2)</script>`;
  const html = app().renderSlate(f) + app().renderDrawer(f, f.products[0].repo);
  assert.ok(!html.includes("<img src=x") && !html.includes("<script>"));
});

// ---------------------------------------------------------------- CON-13 drawer

// The 10-line rule covers the [data-summary] section only; the "Decisions waiting" section after it
// lists every decision for the product, uncapped (CON-R16, decided Oct 31).
test("CON-13 drawer: a labelled dialog with the HANDOFF summary in at most 10 lines and a link to HANDOFF.md", () => {
  const f = sample();
  for (const p of f.products) {
    const html = app().renderDrawer(f, p.repo);
    const dialog = tagsWith(html, "role").filter((d) => attr(d.tag, "role") === "dialog");
    assert.equal(dialog.length, 1, `${p.repo}: role=dialog`);
    const label = attr(dialog[0].tag, "aria-labelledby");
    assert.ok(label && html.includes(`id="${label}"`), `${p.repo}: dialog labelled by its title`);
    const summary = els(html, "data-summary");
    assert.equal(summary.length, 1);
    const lines = [...summary[0].html.matchAll(/<li\b/g)].length;
    assert.ok(lines > 0 && lines <= 10, `${p.repo}: ${lines} summary lines (1 to 10)`);
    const t = text(summary[0].html);
    if (p.now[0]) assert.ok(t.includes(p.now[0]), `${p.repo}: now in the summary`);
    if (p.next[0]) assert.ok(t.includes(p.next[0]), `${p.repo}: next in the summary`);
    assert.ok(hrefs(html).includes(`${GH}${p.repo}/blob/main/HANDOFF.md`), `${p.repo}: links its HANDOFF.md`);
  }
});

test("CON-13 drawer: a product with a long HANDOFF still shows at most 10 lines", () => {
  const f = clone(sample());
  const p = f.products[0];
  p.now = ["n1", "n2", "n3"]; p.next = ["x1", "x2", "x3"]; p.blockers = ["b1", "b2", "b3"];
  p.waiting_on_chase = ["w1", "w2", "w3"]; p.decisions = ["d1", "d2", "d3"];
  const s = els(app().renderDrawer(f, p.repo), "data-summary")[0];
  assert.ok([...s.html.matchAll(/<li\b/g)].length <= 10);
});

// ---------------------------------------------------------------- CON-14 Horizon

test("CON-14 Horizon: one row per product with Now, Next, Later and Done this week columns", () => {
  const f = sample();
  const html = app().renderHorizon(f);
  const t = text(html);
  for (const h of ["Now", "Next", "Later", "Done this week"]) assert.ok(t.includes(h), `column ${h}`);
  const rows = els(html, "data-hz-row");
  assert.deepEqual(rows.map((r) => attr(r.tag, "data-hz-row")), f.horizon.map((r) => r.repo));
  rows.forEach((r) => assert.deepEqual(tagsWith(r.html, "data-col").map((c) => attr(c.tag, "data-col")), ["now", "next", "later", "done"]));
});

test("CON-14 Horizon: each card sits in exactly one column, shows its ID only as the small label, and links its PR when known", () => {
  const f = clone(sample());
  assert.ok(Array.isArray(f.horizon) && f.horizon.length > 0, "the sample feed has horizon rows (npm run feed:sample after core.ts adds them)");
  const repo = f.horizon[0].repo;
  f.horizon[0] = { repo, now: [{ id: "CCW-M4.1", title: "Pace spike", pr: 72 }], next: [{ id: "CCW-M4.3", title: "Opt-in flag", pr: null }], later: [{ id: null, title: "Docs site", pr: null }], done: [{ id: "CCW-M2.6", title: "Release plan", pr: 68 }] };
  const row = els(app().renderHorizon(f), "data-hz-row").find((r) => attr(r.tag, "data-hz-row") === repo)!;
  const cols = Object.fromEntries(els(row.html, "data-col").map((c) => [attr(c.tag, "data-col")!, c.html]));
  for (const [col, cards] of Object.entries(f.horizon[0])) {
    if (col === "repo") continue;
    const shown = els(cols[col], "data-card");
    assert.equal(shown.length, (cards as Card[]).length, `${col}: card count`);
    (cards as Card[]).forEach((c, i) => {
      const h = shown[i].html;
      assert.equal(attr(shown[i].tag, "data-id"), c.id ?? undefined, `${col}: data-id`);
      if (c.id) {
        const label = h.match(/<[a-z]+[^>]*class="[^"]*\bid\b[^"]*"[^>]*>([^<]*)</)?.[1];
        assert.equal(label, c.id, `${col}: ID in the small label`);
        assert.equal(text(h).split(c.id).length - 1, 1, `${col}: ID shown once, not in the title too`);
      }
      assert.ok(text(h).includes(c.title), `${col}: title "${c.title}"`);
      assert.deepEqual(hrefs(h), c.pr ? [`${GH}${repo}/pull/${c.pr}`] : [], `${col}: link only when the PR is known`);
    });
  }
  const ids = els(row.html, "data-card").map((c) => attr(c.tag, "data-id")).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "no ID in two columns");
});

// ---------------------------------------------------------------- CON-15 Agent Roster

test("CON-15 Roster: eval scores show a placeholder, not a zero", () => {
  const html = app().renderRoster(sample());
  const evals = els(html, "data-evals");
  assert.equal(evals.length, 1, "an eval scores section");
  const t = text(evals[0].html);
  assert.match(t, /no evals yet|not scored yet|pending/i, "placeholder text");
  assert.doesNotMatch(t, /(^|\s)0(\.0+)?\s*(%|\/|of\b|$)/, "no zero score");
  assert.doesNotMatch(evals[0].html, /data-score="0/);
});

test("CON-15 Roster: runs per agent per product (7 days) match the feed", () => {
  const f = sample();
  const html = app().renderRoster(f);
  const rows = els(html, "data-runs-row");
  assert.deepEqual(rows.map((r) => attr(r.tag, "data-runs-row")), f.products.map((p) => p.repo));
  for (const r of rows) {
    const repo = attr(r.tag, "data-runs-row")!;
    const cells = Object.fromEntries(tagsWith(r.html, "data-agent").map((c) => [attr(c.tag, "data-agent")!, text(element(r.html, r.html.indexOf(c.tag)))]));
    for (const [agent, n] of Object.entries(f.runs[repo] ?? {})) assert.equal(cells[agent], String(n), `${repo} ${agent}: ${n} runs`);
    for (const a of ["staff-pm", "qa-tdd", "engineer", "ux-reviewer", "privacy-security"]) assert.ok(a in cells, `${repo}: a ${a} column`);
  }
});

test("CON-15 Roster: gates per open PR show ok / missing as words, not color only; n/a gates are left out (UX-S7)", () => {
  const f = sample();
  const html = app().renderRoster(f);
  const WORD: Record<string, RegExp> = { ok: /passed|\bok\b/i, missing: /missing|not in (the )?run log/i, "n/a": /n\/a|not needed|not named/i };
  const rows = els(html, "data-gate-row");
  assert.deepEqual(rows.map((r) => attr(r.tag, "data-gate-row")), f.gates.map((g) => `${g.repo}#${g.number}`));
  rows.forEach((r, i) => {
    for (const [agent, state] of Object.entries(f.gates[i].gates)) {
      const cell = tagsWith(r.html, "data-gate").find((c) => attr(c.tag, "data-gate") === agent);
      if (state === "n/a") { assert.equal(cell, undefined, `${f.gates[i].repo}#${f.gates[i].number}: ${agent} n/a is not shown`); continue; }
      assert.ok(cell, `${f.gates[i].repo}#${f.gates[i].number}: ${agent} gate`);
      assert.equal(attr(cell.tag, "data-state"), state);
      const t = text(element(r.html, r.html.indexOf(cell.tag)));
      assert.match(t, WORD[state], `${agent} ${state} has a text label (got "${t}")`);
    }
  });
});
