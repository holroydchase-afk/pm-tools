import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { landing } from "../scripts/build-demo.mjs";

const seed = (id) => {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(`demo/${id}/seed.js`, "utf8"), ctx);
  return ctx.window.DEMO.seed;
};

// Stages must match what chaseholroyd.com says about each product (PMT-M2.2).
const PORTFOLIO_STAGE = { ccwatts: ["beta", "live"], "Energy Scanner": ["beta", "live"], "Role Radar": ["beta", "live"] };

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
  assert.equal(playground.lane, "done");
});

test("PMT-M2.3 landing page links back to the portfolio at the top and names each demo", () => {
  const html = landing();
  const back = html.indexOf('href="/"'), h1 = html.indexOf("<h1");
  assert.ok(back > 0 && back < h1, "back link before the heading");
  assert.ok(html.includes("Try Build Slate") && html.includes("Try the Near-Term Roadmap"));
});

test("PMT-M2.4 demo bar goes back to the How I work page, not the home page", () => {
  for (const id of ["build-slate", "roadmap"]) {
    const ctx = { window: {} };
    vm.runInNewContext(readFileSync(`demo/${id}/seed.js`, "utf8"), ctx);
    assert.equal(ctx.window.DEMO.back, "../../pm-tools.html", id);
    assert.match(ctx.window.DEMO.backLabel, /How I work/, id);
  }
  assert.match(readFileSync("demo/fake-db.js", "utf8"), /cfg\.backLabel/);
});

test("PMT-M2.5 roadmap demo hides the developer schema panel", async () => {
  const { toDemo } = await import("../scripts/build-demo.mjs");
  const html = toDemo("roadmap", readFileSync("apps/roadmap.html", "utf8"));
  assert.match(html, /details\.agents\{display:none\}/);
});
