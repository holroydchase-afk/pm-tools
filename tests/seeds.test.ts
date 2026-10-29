import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { landing } from "../scripts/build-demo.ts";

// Shape of the sample data each demo/<app>/seed.js sets on window.DEMO.
type Doc = Record<string, string>;
type Demo = { key: string; back: string; backLabel: string; seed: Record<string, Record<string, Doc>> };
const sandbox = () => ({ window: {} as { DEMO: Demo } });

const seed = (id: string) => {
  const ctx = sandbox();
  vm.runInNewContext(readFileSync(`demo/${id}/seed.js`, "utf8"), ctx);
  return ctx.window.DEMO.seed;
};

// Stages must match what chaseholroyd.com says about each product (PMT-M2.2). ccwatts: "playground live", beta not started yet.
const PORTFOLIO_STAGE = { ccwatts: ["build", "beta", "live"], "Energy Scanner": ["beta", "live"], "Role Radar": ["beta", "live"] };

test("PMT-M2.2 Build Slate demo stays within its own five-project cap", () => {
  const active = Object.values(seed("build-slate").projects).filter((p) => p.stage !== "paused");
  assert.ok(active.length <= 5, `${active.length} active projects`);
});

test("PMT-M2.2 Build Slate stages match the portfolio pages", () => {
  const byName = Object.fromEntries(Object.values(seed("build-slate").projects).map((p) => [p.name, p]));
  for (const [name, ok] of Object.entries(PORTFOLIO_STAGE)) {
    assert.ok(byName[name], `${name} is on the slate`);
    assert.ok(ok.includes(byName[name].stage), `${name} is ${byName[name].stage}`);
  }
});

test("PMT-M2.2 Roadmap demo shows more than one board and ccwatts v1 as done", () => {
  const { boards, cards } = seed("roadmap");
  assert.ok(Object.keys(boards).length >= 2, "board switcher needs two boards");
  const playground = Object.values(cards).find((c) => /playground/i.test(c.title));
  assert.equal(playground?.lane, "done");
});

test("PMT-M2.3 landing page links back to the portfolio at the top and names each demo", () => {
  const html = landing();
  const back = html.indexOf('href="/"'), h1 = html.indexOf("<h1");
  assert.ok(back > 0 && back < h1, "back link before the heading");
  assert.ok(html.includes("Try Build Slate") && html.includes("Try the Near-Term Roadmap"));
});

test("PMT-M2.4 demo bar goes back to the portfolio's system page (How I keep it all moving), not the home page", () => {
  for (const id of ["build-slate", "roadmap"]) {
    const ctx = sandbox();
    vm.runInNewContext(readFileSync(`demo/${id}/seed.js`, "utf8"), ctx);
    assert.equal(ctx.window.DEMO.back, "../../pm-tools.html", id);
    // The portfolio renamed "How I work" to "How I keep it all moving" (WEB-M5.2, Oct 22).
    assert.equal(ctx.window.DEMO.backLabel, "← How I keep it all moving", id);
  }
  assert.match(readFileSync("demo/fake-db.js", "utf8"), /cfg\.backLabel/);
});

test("PMT-M2.5 roadmap demo hides the developer schema panel", async () => {
  const { toDemo } = await import("../scripts/build-demo.ts");
  const html = toDemo("roadmap", readFileSync("apps/roadmap.html", "utf8"));
  assert.match(html, /details\.agents\{display:none\}/);
});

// Round 2 of the recruiter-ready loop (R1-UX findings).
const demoPage = async (id: string) => (await import("../scripts/build-demo.ts")).toDemo(id, readFileSync(`apps/${id}.html`, "utf8"));

test("R1-UX-1/7/8 Build Slate tells the same story as the portfolio pages", () => {
  const P = seed("build-slate").projects;
  assert.match(P["energy-scanner"].pitch, /palm/i);
  assert.match(P["energy-scanner"].why, /bedtime/i);
  assert.equal(P["energy-scanner"].kind, "Web app");
  assert.equal(P["ai-climate-impact"].stage, "build", "no beta is running yet");
  assert.doesNotMatch(P.hearth.notes, /name coming/i);
});

test("R1-UX-2 product cards link to the live demos", async () => {
  const P = seed("build-slate").projects;
  for (const id of ["role-radar", "energy-scanner", "ai-climate-impact"]) assert.match(P[id].link, /^https:\/\/chaseholroyd\.com\//, id);
  assert.match(await demoPage("build-slate"), /class="live"/);
});

test("R1-UX-3 roadmap demo names no real outside people as targets", () => {
  assert.doesNotMatch(readFileSync("demo/roadmap/seed.js", "utf8"), /Zeke/);
});

test("R1-UX-4/5/6/11 demo pages: bigger move buttons, AA colors, plain words", async () => {
  const rm = await demoPage("roadmap"), bs = await demoPage("build-slate");
  assert.match(rm, /button\[data-mv\]\{min-height:44px/);
  assert.match(rm, /--now:#A8380A/);
  assert.match(rm, /Chase's tasks/);
  assert.doesNotMatch(rm, /\} sess`/);
  assert.match(bs, /Active projects/);
  assert.match(bs, /\.stage-tag\{font-size:12px/);
});

// Round 3 (R2-UX findings).
test("R2-UX-1/2 Role Radar: demo already exists, link goes to it, each link names its product", async () => {
  const P = seed("build-slate").projects;
  assert.equal(P["role-radar"].link, "https://chaseholroyd.com/demo/role-radar/");
  assert.match(P["role-radar"].next, /^Move the public demo/);
  const rm = Object.values(seed("roadmap").cards).map((c) => c.title);
  assert.ok(rm.includes("Move the demo into its own repo"));
  assert.doesNotMatch(readFileSync("demo/roadmap/seed.js", "utf8"), /Hausfather/);
  const bs = await demoPage("build-slate");
  assert.match(bs, /Try \$\{esc\(p\.name\)\}/);
  assert.match(bs, /<option>Developer tool<\/option>/);
});

test("R2-UX-4/6 demo overrides load after the app's CSS and fix lane contrast and button size", async () => {
  const rm = await demoPage("roadmap");
  assert.ok(rm.indexOf("button[data-mv]{min-height:44px") > rm.lastIndexOf(".move button{"), "override comes after the app's own rule");
  assert.match(rm, /--later:#565E6C; --done:#256845;/);
  assert.match(rm, /\.btn\{min-height:44px\}/);
  assert.doesNotMatch(rm, /“My tasks” owner/);
});

test("R2-UX-7 landing words match the apps", async () => {
  const { landing } = await import("../scripts/build-demo.ts");
  const html = landing();
  assert.match(html, /five active projects/);
  assert.match(html, /Later, Next, Now and Done/);
});

// Round 4 (remaining P2s).
test("R1-UX-12 moving a card shows a pinned notice with Undo", async () => {
  const rm = await demoPage("roadmap");
  assert.match(rm, /function showMoved\(/);
  assert.match(rm, /showMoved\(id,c\.title/);
  assert.match(rm, /id="movedToast"[^>]*aria-live="polite"/);
});

test("R4-1 Undo restores the card's old position quietly", async () => {
  const rm = await demoPage("roadmap");
  assert.match(rm, /async function moveCard\(id,lane,order,quiet\)/);
  assert.match(rm, /const was=c\.lane,wasOrder=c\.order;/);
  assert.match(rm, /moveCard\(id,was,wasOrder,true\)/);
  assert.match(rm, /Move undone/);
});

test("R1-UX-10 meta text is at least 13px in the demos", async () => {
  assert.match(await demoPage("build-slate"), /\.meta\{font-size:13px\}/);
  assert.match(await demoPage("roadmap"), /\.owner\{font-size:13px\}/);
  assert.match(await demoPage("roadmap"), /\.card \.m\{font-size:13px\}/);
});
