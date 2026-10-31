// PMT-M3.2 Studio Console UI: Focus and Call Sheet (CON-8 to CON-10) and the hourly feed Action.
// Browser checks (routing, 390px/1280px, no console errors, CON-11's automatable half) live in
// tests/e2e/demos.e2e.ts. CON-11 itself (Chase's phone, live feed under 1h old) is a manual case.
//
// Contract for console/app.js (plain browser JS, no framework, no build step):
//   - Loaded with only `window` defined (no `document`), it must not throw, and it sets
//     window.Console = { renderFocus(feed), renderCallSheet(feed), renderFeedStatus(feed, now), feedAge(feed, now) }.
//     The render helpers return HTML strings; the page boots (fetches studio.json, routes by hash)
//     only when `document` exists.
//   - Markup hooks the tests read (keep them; style however the mock says):
//       Focus:      each goal card carries data-goal="<goal id>"; each effort-bar segment carries
//                   data-segment="<goal id | off-goal>" data-share="<n>" and style="width:<n>%";
//                   the off-goal list carries data-offgoal-list and each item data-offgoal-item.
//       Call Sheet: each item carries data-group="<callSheet key>" and exactly one link (its button).
//       Status:     the stale warning is role="alert"; the build time is <time datetime="<builtAt>">.
//   - Every text from the feed is HTML-escaped (PR titles come from anyone who can open a PR).
//
// Call Sheet order, worst first (written into PLAN.md CON-9):
//   failing, merge, decide, idleDrafts, inProgress, dependabot.
// Within a group, feed order is kept. Buttons link to GitHub only:
//   PR (failing, merge, idleDrafts, inProgress): https://github.com/holroydchase-afk/<repo>/pull/<n>
//   decide with a repo:  https://github.com/holroydchase-afk/<repo>/blob/main/HANDOFF.md
//   decide, repo null:   https://github.com/holroydchase-afk/pm-tools/blob/main/STUDIO-STATUS.md
//   dependabot batch:    https://github.com/holroydchase-afk/<repo>/pulls?q=... (the repo's open Dependabot PRs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildFeed } from "../scripts/feed/core.ts";
import { scanText } from "../scripts/private-patterns.ts";
import { build } from "../scripts/build-demo.ts";
import type { Feed, FeedInput, Goal, ProductInput } from "../scripts/feed/types.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIX = join(ROOT, "tests", "fixtures", "feed");
const NOW = new Date("2026-10-31T12:00:00Z");
const GH = "https://github.com/holroydchase-afk/";

type ConsoleApi = {
  renderFocus(feed: Feed): string;
  renderCallSheet(feed: Feed): string;
  renderFeedStatus(feed: Feed & { sample?: boolean }, now: Date): string;
  feedAge(feed: Feed, now: Date): { minutes: number; stale: boolean };
};

function app(): ConsoleApi {
  const file = join(ROOT, "console", "app.js");
  if (!existsSync(file)) throw new Error("console/app.js does not exist yet (PMT-M3.2)");
  const ctx = { window: {} as { Console?: ConsoleApi }, console };
  vm.runInNewContext(readFileSync(file, "utf8"), ctx);
  const c = ctx.window.Console;
  assert.ok(c, "app.js sets window.Console");
  for (const fn of ["renderFocus", "renderCallSheet", "renderFeedStatus", "feedAge"] as const) assert.equal(typeof c[fn], "function", `Console.${fn}`);
  return c;
}

// The fixture feed, built the same way as tests/feed.test.ts does.
const read = (f: string) => readFileSync(join(FIX, f), "utf8");
type FixtureProduct = Omit<ProductInput, "handoff" | "runLogs"> & { handoffFile: string; runLogFiles: Record<string, string> };
// Must equal sampleInput() (scripts/build-sample-feed.ts), which adds console.config.json names.
function fixtureInput(): FeedInput {
  const raw = JSON.parse(read("products.json")) as FixtureProduct[];
  const products: ProductInput[] = raw.map(({ handoffFile, runLogFiles, ...p }) => ({
    ...p,
    handoff: read(handoffFile),
    runLogs: Object.fromEntries(Object.entries(runLogFiles).map(([b, f]) => [b, read(f)])),
  }));
  const agents = readdirSync(join(ROOT, ".claude", "agents")).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)).sort();
  const config = JSON.parse(readFileSync(join(ROOT, "console.config.json"), "utf8")) as { products: { repo: string; name: string }[] };
  const repoNames = Object.fromEntries(config.products.map((p) => [p.repo, p.name]));
  return { goals: JSON.parse(read("goals.json")) as Goal[], products, studioStatus: read("studio-status.md"), privateRepos: ["family-vault"], agents, repoNames };
}
const fixtureFeed = (): Feed => buildFeed(fixtureInput(), NOW);
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const ENT: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENT[c]);
// &amp; goes last, so "&amp;lt;" decodes to "&lt;" and not "<".
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
// Opening tags carrying an attribute, and one attribute's value from a tag.
const tagsWith = (html: string, attr: string) => [...html.matchAll(new RegExp(`<[a-z][^>]*\\s${attr}(?:="[^"]*")?[^>]*>`, "gi"))].map((m) => ({ tag: m[0], at: m.index }));
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

// ---------------------------------------------------------------- CON-8: Focus

test("CON-8 Focus: one card per goal (3-4), each with its name, measure and effort share", () => {
  const feed = fixtureFeed();
  assert.ok(feed.goals.length >= 3 && feed.goals.length <= 4, "the fixture has 3-4 goals");
  const html = app().renderFocus(feed);
  const cards = tagsWith(html, "data-goal");
  assert.deepEqual(cards.map((c) => attr(c.tag, "data-goal")), feed.goals.map((g) => g.id), "one card per goal, goals.json order");
  const offAt = html.search(/\sdata-offgoal-list\b/);
  cards.forEach((c, i) => {
    const g = feed.goals[i];
    const body = html.slice(c.at, i + 1 < cards.length ? cards[i + 1].at : offAt > c.at ? offAt : html.length);
    assert.ok(body.includes(esc(g.name)), `${g.id} card shows its name`);
    assert.ok(body.includes(esc(g.measure)), `${g.id} card shows its measure`);
    assert.match(body, new RegExp(`\\b${g.effort}%`), `${g.id} card shows its ${g.effort}% share`);
  });
});

test("CON-8 Focus: the root goals.json has 3-4 goals, so the live page shows 3-4 cards", () => {
  const goals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as Goal[];
  assert.ok(goals.length >= 3 && goals.length <= 4, `goals.json has ${goals.length} goals`);
});

test("CON-8 Focus: effort bar segments are the goal shares plus off-goal and sum to 100%", () => {
  const feed = fixtureFeed();
  const html = app().renderFocus(feed);
  const segs = tagsWith(html, "data-segment").map(({ tag }) => ({
    id: attr(tag, "data-segment"),
    share: Number(attr(tag, "data-share")),
    width: Number(tag.match(/width:\s*([\d.]+)%/)?.[1]),
  }));
  const expected = [...feed.goals.map((g) => ({ id: g.id, share: g.effort })), { id: "off-goal", share: feed.offGoalEffort }].filter((s) => s.share > 0);
  assert.deepEqual(segs.map(({ id, share }) => ({ id, share })), expected, "segments in goals.json order, off-goal last, zero shares omitted");
  for (const s of segs) assert.equal(s.width, s.share, `${s.id} segment is drawn ${s.share}% wide`);
  assert.equal(segs.reduce((n, s) => n + s.share, 0), 100);
});

test("CON-8 Focus: off-goal items are listed separately, after the goal cards", () => {
  const feed = fixtureFeed();
  const html = app().renderFocus(feed);
  const list = html.search(/\sdata-offgoal-list\b/);
  assert.ok(list > 0, "an off-goal list exists");
  const lastCard = tagsWith(html, "data-goal").at(-1)?.at ?? -1;
  assert.ok(list > lastCard, "the off-goal list comes after the goal cards");
  const items = tagsWith(html, "data-offgoal-item");
  assert.equal(items.length, feed.offGoal.length, "one entry per off-goal item");
  // Items in feed order; each item's own markup runs to the next item.
  feed.offGoal.forEach((item, i) => {
    const body = html.slice(items[i].at, items[i + 1]?.at ?? html.length);
    const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    assert.ok(text.includes(item.repo), `item ${i} names its repo`);
    if (item.kind === "pr") {
      // UX-C2: the planning-ID prefix ("CCW-M4.1: ") is stripped; the rest of the title must show.
      const shown = item.title.replace(/^[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9.]+)+:\s*/, "");
      assert.ok(body.includes(esc(shown)), `off-goal PR "${shown}" is listed`);
      assert.ok(body.includes(`href="${GH}${item.repo}/pull/${item.number}"`), `off-goal PR ${item.repo}#${item.number} links to GitHub`);
    } else {
      assert.match(text, new RegExp(`\\b${item.count} (agent )?runs?\\b`), `${item.repo}: ${item.count} off-goal runs`);
    }
  });
});

test("CON-8 Focus edge: no effort yet shows an empty bar, not NaN, and no off-goal items shows none", () => {
  const feed = clone(fixtureFeed());
  feed.goals = feed.goals.map((g) => ({ ...g, effort: 0 }));
  feed.offGoalEffort = 0;
  feed.offGoal = [];
  const html = app().renderFocus(feed);
  assert.doesNotMatch(html, /NaN|undefined|Infinity/);
  assert.equal(tagsWith(html, "data-segment").length, 0, "no segments when nothing was done");
  assert.equal(tagsWith(html, "data-goal").length, feed.goals.length, "goal cards still show");
  assert.equal(tagsWith(html, "data-offgoal-item").length, 0);
});

// ---------------------------------------------------------------- CON-9: Call Sheet

const ORDER = ["failing", "merge", "decide", "idleDrafts", "inProgress", "dependabot"] as const;
// UX-S3: Decide shows the first call per product and the first 3 from studio status (the rest sit
// behind a "N more" button that opens the drawer and has no link).
function shownDecide(decide: Feed["callSheet"]["decide"]) {
  const seen = new Set<string>();
  let studio = 0;
  return decide.filter((d) => (d.repo === null ? studio++ < 3 : !seen.has(d.repo) && !!seen.add(d.repo)));
}

test("CON-9 Call Sheet: items sort worst first (failing, merge, decide, idle drafts, in progress, Dependabot)", () => {
  const feed = fixtureFeed();
  const html = app().renderCallSheet(feed);
  const groups = tagsWith(html, "data-group").map(({ tag }) => attr(tag, "data-group"));
  const expected = ORDER.flatMap((k) => (k === "decide" ? shownDecide(feed.callSheet.decide) : feed.callSheet[k]).map(() => k));
  assert.deepEqual(groups, expected, "one item per feed entry, in worst-first group order");
});

test("CON-9 Call Sheet: every item has one button, and it links to the PR, HANDOFF, status file or Dependabot list on GitHub", () => {
  const feed = fixtureFeed();
  const html = app().renderCallSheet(feed);
  const hrefs = [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => unesc(m[1]));
  for (const h of hrefs) assert.ok(h.startsWith("https://github.com/"), `button goes to GitHub: ${h}`);
  const expected = ORDER.flatMap((k) =>
    k === "decide"
      ? shownDecide(feed.callSheet.decide).map((d) => (d.repo ? `${GH}${d.repo}/blob/main/HANDOFF.md` : `${GH}pm-tools/blob/main/STUDIO-STATUS.md`))
      : k === "dependabot"
        ? feed.callSheet.dependabot.map((d) => `${GH}${d.repo}/pulls?`)
        : feed.callSheet[k].map((p) => `${GH}${p.repo}/pull/${p.number}`),
  );
  assert.equal(hrefs.length, expected.length, "exactly one link per item");
  hrefs.forEach((h, i) => (expected[i].endsWith("?") ? assert.ok(h.startsWith(expected[i]), `${h} opens ${expected[i]}`) : assert.equal(h, expected[i])));
  for (const d of feed.callSheet.dependabot) assert.match(html, new RegExp(`\\b${d.count}\\b[^<]*(Dependabot|bump)`, "i"), `${d.repo}: batch shows its ${d.count} PRs`);
});

test("CON-9 Call Sheet: PR titles and decision text are escaped, never run as HTML", () => {
  const feed = clone(fixtureFeed());
  const evil = `<img src=x onerror="alert(1)">`;
  feed.callSheet.failing[0].title = evil;
  feed.callSheet.decide[0].text = `<script>alert(2)</script>`;
  const html = app().renderCallSheet(feed);
  assert.ok(!html.includes("<img src=x") && !html.includes("<script>"), "no raw markup from the feed");
  assert.ok(html.includes(esc(evil)), "the title still shows, escaped");
  const focus = clone(fixtureFeed());
  focus.goals[0].name = evil;
  focus.offGoal = [{ kind: "pr", repo: "ccwatts", number: 72, title: evil }];
  assert.ok(!app().renderFocus(focus).includes("<img src=x"), "Focus escapes goal names and off-goal titles too");
});

test("CON-9 Call Sheet edge: nothing waiting shows an empty state with no items", () => {
  const feed = clone(fixtureFeed());
  feed.callSheet = { merge: [], failing: [], inProgress: [], decide: [], idleDrafts: [], dependabot: [] };
  const html = app().renderCallSheet(feed);
  assert.equal(tagsWith(html, "data-group").length, 0);
  assert.match(html.replace(/<[^>]*>/g, " "), /nothing/i, "says nothing is waiting");
  assert.doesNotMatch(html, /undefined|NaN/);
});

// ---------------------------------------------------------------- CON-10: stale feed

test("CON-10 feedAge: older than 2h is stale; exactly 2h, newer, or a clock-skewed future time is not", () => {
  const { feedAge } = app();
  const at = (m: number) => ({ ...feedAge({ ...fixtureFeed(), builtAt: minutesAgo(m) }, NOW) }); // copy out of the vm realm
  assert.deepEqual(at(119), { minutes: 119, stale: false });
  assert.deepEqual(at(120), { minutes: 120, stale: false });
  assert.deepEqual(at(121), { minutes: 121, stale: true });
  assert.deepEqual(at(-5), { minutes: 0, stale: false });
});

test("CON-10 status: a stale feed shows a warning with the build time", () => {
  const feed = { ...fixtureFeed(), builtAt: minutesAgo(180) };
  const html = app().renderFeedStatus(feed, NOW);
  const alert = html.match(/<[a-z]+[^>]*role="alert"[^>]*>[\s\S]*$/i)?.[0] ?? "";
  assert.ok(alert, "the warning is role=alert");
  assert.ok(alert.includes(`<time datetime="${feed.builtAt}"`), "the warning shows the build time");
  assert.match(alert.replace(/<[^>]*>/g, " "), /stale|out of date|hours? old|not updated/i);
});

test("CON-10 status: a fresh feed shows its build time and no warning", () => {
  const feed = { ...fixtureFeed(), builtAt: minutesAgo(30) };
  const html = app().renderFeedStatus(feed, NOW);
  assert.doesNotMatch(html, /role="alert"/);
  assert.ok(html.includes(`<time datetime="${feed.builtAt}"`), "the feed time is always visible (CON-11)");
});

test("CON-10 status edge: a missing or bad build time counts as stale and never prints Invalid Date", () => {
  for (const builtAt of ["", "not a date"]) {
    const { feedAge, renderFeedStatus } = app();
    const feed = { ...fixtureFeed(), builtAt };
    assert.equal(feedAge(feed, NOW).stale, true, `builtAt ${JSON.stringify(builtAt)}`);
    const html = renderFeedStatus(feed, NOW);
    assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /Invalid Date|NaN|undefined/);
  }
});

test("CON-10 status: the sample feed is flagged \"Sample feed\"; a real feed is not", () => {
  const { renderFeedStatus } = app();
  const feed = { ...fixtureFeed(), builtAt: minutesAgo(10) };
  assert.match(renderFeedStatus({ ...feed, sample: true }, NOW), /Sample feed/);
  assert.doesNotMatch(renderFeedStatus(feed, NOW), /Sample feed/);
});

// ---------------------------------------------------------------- sample feed and build

test("PMT-M3.2 sample feed: console/sample-studio.json is the fixture feed with the root goals.json, flagged sample, with no private data", () => {
  const file = join(ROOT, "console", "sample-studio.json");
  assert.ok(existsSync(file), "console/sample-studio.json exists");
  const text = readFileSync(file, "utf8");
  const { sample, ...rest } = JSON.parse(text) as Feed & { sample?: boolean };
  assert.equal(sample, true, "flagged sample: true");
  // The sample uses the real goals (status, progress) so it looks like the live page; products, PRs and runs are the fixtures.
  const rootGoals = JSON.parse(readFileSync(join(ROOT, "goals.json"), "utf8")) as Goal[];
  assert.deepEqual(rest, buildFeed({ ...fixtureInput(), goals: rootGoals }, NOW), "regenerated with npm run feed:sample, not hand-edited");
  assert.deepEqual(scanText(text, ["family-vault"]), []);
});

test("PMT-M3.2 build: _site/console/ has the page, app.js and the sample feed as studio.json", () => {
  const out = build(mkdtempSync(join(tmpdir(), "pmtools-console-")));
  for (const f of ["index.html", "app.js", "studio.json"]) assert.ok(existsSync(join(out, "console", f)), `_site/console/${f}`);
  assert.equal(readFileSync(join(out, "console", "studio.json"), "utf8"), readFileSync(join(ROOT, "console", "sample-studio.json"), "utf8"));
  const html = readFileSync(join(out, "console", "index.html"), "utf8");
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<meta name="viewport" content="width=device-width,\s*initial-scale=1/);
  assert.match(html, /<script src="app\.js"/, "loads app.js by a relative path, so it works under /pm-tools/console/");
});

// ---------------------------------------------------------------- the hourly feed (one deploy path)
// Decision: no separate console-feed.yml. pages.yml gains an hourly schedule and runs `npm run feed`
// after `npm run build` (build wipes _site/ and copies the sample feed; the real feed then
// overwrites it) and before the Pages upload. One deploy path; a failed feed fails the run, so the
// live site keeps the last good feed and CON-10's stale warning shows.

const WF = join(ROOT, ".github", "workflows");
const pages = () => readFileSync(join(WF, "pages.yml"), "utf8");
// A top-level YAML block (`key:` at column 0) or a job (`  name:` under jobs:), as text.
const block = (yml: string, re: RegExp) => {
  const lines = yml.split("\n");
  const start = lines.findIndex((l) => re.test(l));
  if (start < 0) return "";
  const indent = lines[start].match(/^ */)![0].length;
  const end = lines.findIndex((l, i) => i > start && l.trim() && l.match(/^ */)![0].length <= indent);
  return lines.slice(start, end < 0 ? undefined : end).join("\n");
};
const steps = (job: string) => job.split(/\n(?=\s*- (?:uses|run|name|id|if|with|env):)/).slice(1);

test("PMT-M3.2 Action: pages.yml runs hourly and on demand; there is one deploy path", () => {
  const on = block(pages(), /^on:/);
  assert.match(on, /\n\s+schedule:\s*\n\s+- cron:\s*["']?([0-5]?\d) \* \* \* \*["']?\s*(\n|$)/, "one hourly cron");
  assert.match(on, /\n\s+workflow_dispatch:/);
  assert.ok(!existsSync(join(WF, "console-feed.yml")), "no second workflow for the feed");
  for (const f of readdirSync(WF).filter((n) => n !== "pages.yml")) {
    const t = readFileSync(join(WF, f), "utf8");
    assert.doesNotMatch(t, /deploy-pages|npm run feed/, `${f} must not deploy or build the feed`);
  }
});

test("PMT-M3.2 Action: least privilege (contents: read; only deploy gets pages and id-token)", () => {
  const yml = pages();
  assert.deepEqual(block(yml, /^permissions:/).split("\n").slice(1).map((l) => l.trim()).filter(Boolean), ["contents: read"]);
  const jobs = block(yml, /^jobs:/);
  const names = [...jobs.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]);
  for (const name of names) {
    const perms = block(block(jobs, new RegExp(`^ {2}${name}:`)), /^ {4}permissions:/).split("\n").slice(1).map((l) => l.trim()).filter(Boolean);
    assert.deepEqual(perms.sort(), name === "deploy" ? ["id-token: write", "pages: write"] : [], `${name} job permissions`);
  }
  assert.deepEqual([...new Set([...yml.matchAll(/secrets\.(\w+)/g)].map((m) => m[1]))].filter((s) => s !== "PRIVATE_DENYLIST"), ["GITHUB_TOKEN"], "the only secret is GITHUB_TOKEN");
});

test("PMT-M3.2 Action: the test job runs npm run feed with GITHUB_TOKEN after the build and before the Pages upload", () => {
  const job = block(block(pages(), /^jobs:/), /^ {2}test:/);
  const s = steps(job);
  const idx = (re: RegExp) => s.findIndex((x) => re.test(x));
  const buildAt = idx(/run:\s*npm run build\s*$/m);
  const feedAt = idx(/run:\s*npm run feed\s*$/m);
  const uploadAt = idx(/uses:\s*actions\/upload-pages-artifact/);
  assert.ok(feedAt >= 0, "a step runs `npm run feed`");
  assert.ok(buildAt >= 0 && buildAt < feedAt, "after npm run build (build wipes _site/)");
  assert.ok(uploadAt > feedAt, "before the Pages upload");
  const feed = s[feedAt];
  assert.match(feed, /\n\s+env:\s*\n(\s+\w+:.*\n)*?\s+GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/, "GITHUB_TOKEN from secrets.GITHUB_TOKEN");
  assert.doesNotMatch(feed, /continue-on-error/, "a failed feed fails the run; the live site keeps its last good feed");
});
