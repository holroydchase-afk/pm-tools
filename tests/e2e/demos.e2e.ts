// Browser test of the built demos (QA-11): each page loads with no errors, and an edit
// survives a reload until "Reset demo". Needs Chromium: `npx playwright install chromium`, then `npm run test:e2e`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { build } from "../../scripts/build-demo.ts";
import { type Browser } from "playwright";
import { launchChromium } from "./launch.ts";
import { buildFeed } from "../../scripts/feed/core.ts";
import { liveInput, LIVE_NOW } from "../fixtures/feed-live/load.ts";

const out = build(mkdtempSync(join(tmpdir(), "pmtools-e2e-")));
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".css": "text/css" };
let server: Server, browser: Browser, base: string;

before(async () => {
  // Serve the build at /pm-tools/, like GitHub Pages does.
  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    if (!path.startsWith("/pm-tools/")) { res.writeHead(404).end(); return; }
    let file = join(out, path.slice("/pm-tools/".length));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, r));
  const addr = server.address();
  assert.ok(addr && typeof addr === "object", "server has a port");
  base = `http://localhost:${addr.port}/pm-tools/`;
  browser = await launchChromium();
});
after(async () => { await browser?.close(); server?.close(); });

async function open(path: string, width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Fonts come from Google; they are optional and not part of what we test.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(base + path);
  await page.waitForLoadState("networkidle");
  return { page, errors };
}

for (const path of ["", "build-slate/", "roadmap/"]) {
  test(`QA-11 /pm-tools/${path} loads with no errors and no sideways scroll at 390px`, async () => {
    const { page, errors } = await open(path);
    assert.deepEqual(errors, []);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `scrolls sideways by ${overflow}px`);
    await page.close();
  });
}

test("QA-11 Build Slate: a new project survives reload and Reset demo removes it", async () => {
  const { page, errors } = await open("build-slate/", 1280);
  await page.getByRole("button", { name: /new project/i }).click();
  await page.locator("#f-name").fill("E2E test project");
  await page.getByRole("button", { name: /^save/i }).click();
  await page.getByText("E2E test project").first().waitFor();
  await page.reload();
  await page.getByText("E2E test project").first().waitFor();
  await page.locator(".demo-bar__toggle").click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForLoadState("networkidle");
  assert.match((await page.locator("#demo-bar-panel").textContent()) ?? "", /Sample data restored/);
  assert.equal(await page.getByText("E2E test project").count(), 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test("QA-11 Roadmap: both sample boards are listed", async () => {
  const { page } = await open("roadmap/", 1280);
  const boards = await page.locator("#boardSel option").allTextContents();
  assert.ok(boards.length >= 2, boards.join(", "));
  await page.close();
});

test("R1-UX-12 Roadmap: moving a card shows a notice, and Undo puts it back", async () => {
  const { page, errors } = await open("roadmap/", 1280);
  const btn = page.locator("button[data-mv]").first();
  const id = await btn.getAttribute("data-mv");
  const laneOf = () => page.evaluate((cid) => document.querySelector(`[data-id="${cid}"]`)?.closest<HTMLElement>("[data-lane]")?.dataset.lane, id);
  const before = await laneOf();
  const indexOf = () => page.evaluate((cid) => { const el = document.querySelector(`[data-id="${cid}"]`); const lane = el?.closest("[data-lane]"); return el && lane ? [...lane.querySelectorAll("[data-id]")].indexOf(el) : -1; }, id);
  const beforeIndex = await indexOf();
  await btn.click();
  await page.locator("#movedToast:not([hidden])").waitFor();
  assert.notEqual(await laneOf(), before);
  await page.locator("#movedToast button").click();
  await page.waitForFunction(([cid, l]) => document.querySelector(`[data-id="${cid}"]`)?.closest<HTMLElement>("[data-lane]")?.dataset.lane === l, [id, before]);
  assert.equal(await indexOf(), beforeIndex);
  assert.equal(await page.locator("#movedToast").isHidden(), true);
  assert.deepEqual(errors, []);
  await page.close();
});

// DEMO-BAR spec (docs/DEMO-BANNER.md): a slim "Demo" bar that opens a push-down drawer.
for (const path of ["build-slate/", "roadmap/"]) {
  for (const width of [390, 1280]) {
    test(`DEMO-BAR /pm-tools/${path} at ${width}px: slim and collapsed on load`, async () => {
      const { page, errors } = await open(path, width);
      const bar = page.getByRole("region", { name: "Demo" });
      const box = await bar.boundingBox();
      assert.ok(box && box.height <= 48, `bar is ${box?.height}px tall`);
      assert.match((await bar.locator(".demo-bar__badge").textContent()) ?? "", /^Demo$/);
      const toggle = bar.locator(".demo-bar__toggle");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.ok(((await toggle.boundingBox())?.height ?? 0) >= 44, "toggle is a 44px tap target");
      assert.equal(await page.locator("#demo-bar-panel").isHidden(), true);
      // DEMO-R1: the way back is on the collapsed bar, not only in the drawer.
      const home = bar.locator(".demo-bar__home");
      assert.equal(await home.isVisible(), true);
      assert.ok(((await home.boundingBox())?.height ?? 0) >= 44, "back link is a 44px tap target");
      // DEMO-R5: one short name for the toggle.
      assert.equal(await toggle.getAttribute("aria-label"), "Demo details");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `scrolls sideways by ${overflow}px`);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  test(`DEMO-BAR /pm-tools/${path}: opens to standard copy, pushes the page down, Esc closes`, async () => {
    const { page } = await open(path);
    const toggle = page.locator(".demo-bar__toggle");
    // The app's first visible element after the bar (the seed and db scripts sit in between).
    const appTop = () => page.evaluate(() => {
      let el = document.querySelector(".demo-bar")?.nextElementSibling;
      while (el && !(el as HTMLElement).getBoundingClientRect().height) el = el.nextElementSibling;
      return el ? el.getBoundingClientRect().top : NaN;
    });
    const closedTop = await appTop();
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    const panel = page.locator("#demo-bar-panel");
    await panel.waitFor();
    const text = (await panel.textContent()) ?? "";
    assert.match(text, /made-up sample data/);
    assert.match(text, /saved only in this browser/);
    assert.ok((await appTop()) > closedTop, "the drawer pushes the app down instead of covering it");
    for (const el of [panel.getByRole("button", { name: "Reset demo" }), panel.getByRole("link", { name: /How I keep it all moving/ })]) {
      const b = await el.boundingBox();
      assert.ok(b && b.height >= 44, `${await el.textContent()} is ${b?.height}px tall`);
    }
    // DEMO-R4: the drawer text is at least 16px.
    assert.ok(parseFloat(await panel.locator("p").evaluate((p) => getComputedStyle(p).fontSize)) >= 16);
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await panel.isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.className), "demo-bar__toggle");
    await page.close();
  });

  test(`DEMO-R3 /pm-tools/${path}: Reset asks first, and Keep leaves the data alone`, async () => {
    const { page } = await open(path, 320);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `scrolls sideways by ${overflow}px at 320px`);
    // Put a visitor's edit in the demo's own store, and mark the page so a reload would show.
    await page.evaluate((key) => { localStorage.setItem(key, JSON.stringify({ probe: { a: { kept: true } } })); (window as unknown as { marker: number }).marker = 1; }, `chdemo:${path.replace("/", "")}`);
    const before = await page.evaluate(() => JSON.stringify(localStorage));
    await page.locator(".demo-bar__toggle").click();
    await page.getByRole("button", { name: "Reset demo" }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), before, "the first tap clears nothing");
    await page.getByRole("button", { name: "Keep" }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), before);
    assert.equal(await page.getByRole("button", { name: "Reset demo" }).isVisible(), true);
    assert.equal(await page.evaluate(() => (window as unknown as { marker?: number }).marker), 1, "Keep must not reload the page");
    await page.close();
  });

  test(`DEMO-BAR /pm-tools/${path}: drawn in the app's own type and colors`, async () => {
    const { page } = await open(path);
    const [barFont, appFont, barBg, appSurface] = await page.evaluate(() => {
      const bar = getComputedStyle(document.querySelector(".demo-bar") as Element);
      const root = getComputedStyle(document.documentElement);
      const probe = document.createElement("i");
      probe.style.background = "var(--surface)";
      document.body.append(probe);
      const surface = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return [bar.fontFamily, root.getPropertyValue("--f-body").trim(), bar.backgroundColor, surface];
    });
    // DEMO-R2: the Demo badge never wears the app's primary action color.
    const badgeBg = await page.locator(".demo-bar__badge").evaluate((el) => getComputedStyle(el).backgroundColor);
    const accent = await page.evaluate(() => { const i = document.createElement("i"); i.style.background = "var(--accent)"; document.body.append(i); const c = getComputedStyle(i).backgroundColor; i.remove(); return c; });
    assert.notEqual(badgeBg, accent);
    assert.equal(barFont.replace(/\s+/g, ""), appFont.replace(/\s+/g, ""));
    assert.equal(barBg, appSurface);
    await page.close();
  });
}

// PMT-M3.2 Studio Console, served with the sample feed the build copies in (built 2026-10-31T12:00Z).
// The page clock is pinned 12h later, so the sample feed is stale on every run (CON-10).
const SAMPLE_BUILT = "2026-10-31T12:00:00.000Z";
async function openConsole(hash: string, width: number, offsite: string[] = []) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const errors: string[] = [];
  page.on("request", (r) => { if (new URL(r.url()).hostname !== "localhost") offsite.push(r.url()); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)\.com/.test(m.location().url)) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.clock.setFixedTime(new Date("2026-11-01T00:00:00Z"));
  await page.goto(base + "console/" + hash);
  await page.waitForLoadState("networkidle");
  return { page, errors };
}

for (const width of [390, 1280]) {
  test(`CON-11 /pm-tools/console/ at ${width}px: Focus, Call Sheet and a later view load with no errors and no sideways scroll`, async () => {
    const { page, errors } = await openConsole("", width);
    const views = page.getByRole("navigation", { name: "Views" });
    const check = async (heading: string | RegExp) => {
      await page.getByRole("heading", { level: 1, name: heading }).waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `${heading}: scrolls sideways by ${overflow}px`);
    };
    await check("Focus"); // the default view
    await views.getByRole("link", { name: /Call Sheet/ }).click();
    await check("Call Sheet");
    const hrefs = await page.getByRole("main").getByRole("link").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    assert.ok(hrefs.length > 0, "the sample Call Sheet has buttons");
    for (const h of hrefs) assert.ok(h.startsWith("https://github.com/"), `CON-9: ${h} goes to GitHub`);
    await views.getByRole("link", { name: /Build Slate/ }).click();
    await check("Build Slate"); // PMT-M3.3: every tab is built now
    assert.equal(await page.getByText("Not built yet").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test("CON-10 /pm-tools/console/: a stale sample feed says so in every view, with its build time", async () => {
  for (const hash of ["#focus", "#calls"]) {
    const { page, errors } = await openConsole(hash, 390);
    await page.getByText("Sample feed").first().waitFor();
    const alert = page.getByRole("alert");
    await alert.waitFor();
    assert.equal(await alert.locator(`time[datetime="${SAMPLE_BUILT}"]`).count(), 1, `${hash}: warning shows the build time`);
    assert.deepEqual(errors, []);
    await page.close();
  }
});

// PMT-M3.2 review fixes.
test("SEC-C5 /pm-tools/console/: the page requests nothing from another host (fonts are self-hosted)", async () => {
  const offsite: string[] = [];
  for (const hash of ["#focus", "#calls"]) {
    const { page, errors } = await openConsole(hash, 390, offsite);
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  assert.deepEqual(offsite, [], "no third-party requests");
});

test("CON-R10 /pm-tools/console/: the stale warning also shows on a view that isn't built yet", async () => {
  const { page, errors } = await openConsole("#slate", 390);
  await page.getByRole("heading", { level: 1, name: "Build Slate" }).waitFor();
  const alert = page.getByRole("alert");
  await alert.waitFor();
  assert.equal(await alert.locator(`time[datetime="${SAMPLE_BUILT}"]`).count(), 1);
  assert.deepEqual(errors, []);
  await page.close();
});

test("CON-R11 /pm-tools/console/: a feed that fails to load says so with a Retry button, and Retry loads it", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.clock.setFixedTime(new Date("2026-11-01T00:00:00Z"));
  const feedUrl = /\/console\/studio\.json/;
  await page.route(feedUrl, (r) => r.fulfill({ status: 404, body: "Not Found" }));
  await page.goto(base + "console/#focus");
  await page.getByRole("heading", { name: /feed didn.t load/i }).waitFor();
  const retry = page.getByRole("button", { name: "Retry" });
  await retry.waitFor();
  await page.unroute(feedUrl);
  await retry.click();
  await page.getByRole("heading", { level: 1, name: "Focus" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: /feed didn.t load/i }).count(), 0, "the error is gone after Retry");
  await page.close();
});

// PMT-M3.3 Build Slate, Horizon Board and Agent Roster (CON-12 to CON-15) in the browser.
for (const width of [390, 1280]) {
  test(`CON-12..15 /pm-tools/console/ at ${width}px: Build Slate, Horizon Board and Agent Roster render with no errors and no sideways scroll`, async () => {
    const { page, errors } = await openConsole("#slate", width);
    for (const [hash, heading] of [["#slate", "Build Slate"], ["#horizon", "Horizon Board"], ["#agents", "Agent Roster"]] as const) {
      await page.goto(base + "console/" + hash);
      await page.getByRole("heading", { level: 1, name: heading }).waitFor();
      assert.equal(await page.getByText("Not built yet").count(), 0, `${heading} is built`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `${heading} at ${width}px: scrolls sideways by ${overflow}px`);
    }
    await page.goto(base + "console/#slate");
    assert.ok(await page.locator("main [data-product]").count() > 0, "the sample slate has product cards");
    await page.goto(base + "console/#horizon");
    assert.ok(await page.locator("main [data-hz-row]").count() > 0, "the sample horizon has rows");
    await page.goto(base + "console/#agents");
    await page.getByText(/no evals yet/i).first().waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test("CON-13 /pm-tools/console/#slate: a product opens its drawer from the keyboard, Escape closes it and focus returns", async () => {
  const { page, errors } = await openConsole("#slate", 390);
  const card = page.locator("main button[data-product]").first();
  await card.waitFor();
  const name = (await card.getAttribute("data-product"))!;
  await card.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.ok(await dialog.getByRole("link", { name: /HANDOFF|handoff notes/i }).count() > 0, "drawer links the HANDOFF");
  const href = await dialog.getByRole("link", { name: /HANDOFF|handoff notes/i }).first().getAttribute("href");
  assert.equal(href, `https://github.com/holroydchase-afk/${name}/blob/main/HANDOFF.md`);
  assert.ok(await dialog.evaluate((d) => d.contains(document.activeElement)), "focus moves into the drawer");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `drawer at 390px scrolls sideways by ${overflow}px`);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("data-product")), name, "focus returns to the product card");
  assert.deepEqual(errors, []);
  await page.close();
});

// PMT-M3.3 review on the real feed (ux-reviewer 4/10): UX-S3, UX-S5 and UX-S8 in the browser, on the
// live-shape fixture (tests/fixtures/feed-live/) built through core.ts and served as studio.json.
async function openLive(hash: string, width: number, colorScheme: "light" | "dark" = "light", feed: unknown = buildFeed(liveInput(), LIVE_NOW)) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route(/\/console\/studio\.json/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(feed) }));
  await page.clock.setFixedTime(new Date("2026-10-31T12:30:00Z"));
  await page.goto(base + "console/" + hash);
  await page.getByRole("heading", { level: 1 }).waitFor();
  return { page, errors };
}

for (const width of [390, 1280]) {
  test(`UX-S5 /pm-tools/console/#focus at ${width}px on the live-shape feed: no element is wider than its goal card (status pills wrap)`, async () => {
    const { page, errors } = await openLive("#focus", width);
    const cards = page.locator("main [data-goal]");
    assert.ok(await cards.count() > 0);
    const over = await cards.evaluateAll((cs) => cs.flatMap((c) => {
      const box = c.getBoundingClientRect();
      return [...c.querySelectorAll("*")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > box.right + 0.5 || r.left < box.left - 0.5); })
        .map((e) => `${(c as HTMLElement).dataset.goal}: ${(e.textContent ?? "").trim().slice(0, 40)}`);
    }));
    assert.deepEqual(over, [], "elements spilling out of their goal card");
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test("UX-S3 /pm-tools/console/#calls on the live-shape feed: \"N more from <product>\" opens that product's drawer", async () => {
  const { page, errors } = await openLive("#calls", 390);
  const more = page.getByRole("button", { name: /^\d+ more from Role Radar$/ });
  await more.click();
  const dialog = page.getByRole("dialog", { name: "Role Radar" });
  await dialog.waitFor();
  assert.deepEqual(errors, []);
  await page.close();
});

for (const scheme of ["light", "dark"] as const) {
  test(`UX-S8 /pm-tools/console/ ${scheme}: green status text has at least 4.5:1 contrast`, async () => {
    const found: string[] = [];
    // Slate on the live-shape feed (health chips), Roster on the sample feed (passed gates).
    for (const [hash, feed] of [["#slate", undefined], ["#agents", JSON.parse(readFileSync(join(out, "console", "studio.json"), "utf8"))]] as const) {
      const { page, errors } = await openLive(hash, 1280, scheme, feed);
      const ratios = await page.locator("main .chip.ok, main .gate.ok, main [data-health='ok']").evaluateAll((els) => {
        const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
        const lum = ([r, g, b]: number[]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const bg = (e: Element | null): number[] => {
          for (; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0)) return c; }
          return [255, 255, 255];
        };
        return els.map((e) => {
          const a = lum(rgb(getComputedStyle(e).color)), b = lum(bg(e));
          return { text: (e.textContent ?? "").trim().slice(0, 30), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        });
      });
      for (const r of ratios) { found.push(r.text); assert.ok(r.ratio >= 4.5, `${hash} ${scheme} "${r.text}": ${r.ratio.toFixed(2)}:1`); }
      assert.deepEqual(errors, []);
      await page.close();
    }
    assert.ok(found.length > 0, "found green status text to check");
  });
}

// PMT-M3.3 review round 3 (ux-reviewer 6/10): UX-S10 and UX-S12 in the browser, live-shape feed.
for (const width of [390, 1280]) {
  test(`UX-S10 /pm-tools/console/#calls at ${width}px on the live-shape feed: a Decide row's two buttons are at least 8px apart`, async () => {
    const { page, errors } = await openLive("#calls", width);
    const gaps = await page.locator("main [data-group='decide']").evaluateAll((rows) => rows.flatMap((r) => {
      const btns = [...r.querySelectorAll("a, button")].map((b) => b.getBoundingClientRect()).filter((b) => b.width > 0);
      if (btns.length < 2) return [];
      const [a, b] = btns;
      // The space between the two boxes, across or down, whichever way they sit.
      const gap = Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);
      return [{ text: (r.querySelector("strong")?.textContent ?? "").slice(0, 40), gap }];
    }));
    assert.ok(gaps.length > 0, "the live-shape feed has Decide rows with a \"more\" button");
    for (const g of gaps) assert.ok(g.gap >= 8, `${width}px "${g.text}": buttons ${g.gap.toFixed(1)}px apart`);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test("UX-S12 /pm-tools/console/#agents at 390px on the live-shape feed: every gate pill is whole and on screen, stacked under its PR title", async () => {
  const { page, errors } = await openLive("#agents", 390);
  const rows = await page.locator("main [data-gate-row]").evaluateAll((trs) => trs.map((tr) => {
    const vw = document.documentElement.clientWidth;
    const pills = [...tr.querySelectorAll("[data-gate]")].map((g) => {
      const r = g.getBoundingClientRect();
      // Clipped: a scrolling or overflow-hidden ancestor cuts the pill off.
      let clipped = false;
      for (let e = g.parentElement; e && e !== document.body; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.overflowX !== "visible") { const c = e.getBoundingClientRect(); if (r.left < c.left - 0.5 || r.right > c.right + 0.5) clipped = true; }
      }
      return { name: (g.textContent ?? "").trim(), left: r.left, right: r.right, top: r.top, clipped, vw };
    });
    const title = tr.querySelector("td.what, [data-gate-row] td:nth-child(2)")?.getBoundingClientRect();
    return { row: (tr as HTMLElement).dataset.gateRow, pills, titleBottom: title ? title.bottom : null };
  }));
  const withPills = rows.filter((r) => r.pills.length);
  assert.ok(withPills.length > 0, "the live-shape feed has gate pills");
  for (const r of withPills) {
    for (const p of r.pills) {
      assert.ok(p.left >= 0 && p.right <= p.vw + 0.5, `${r.row} "${p.name}": outside the viewport (${p.left.toFixed(0)}..${p.right.toFixed(0)} of ${p.vw})`);
      assert.ok(!p.clipped, `${r.row} "${p.name}": clipped by a scrolling box`);
      assert.ok(r.titleBottom !== null && p.top >= r.titleBottom - 0.5, `${r.row} "${p.name}": beside the PR title, not under it`);
    }
  }
  assert.deepEqual(errors, []);
  await page.close();
});
