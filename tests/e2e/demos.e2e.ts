// Browser test of the built demos (QA-11): each page loads with no errors, and an edit
// survives a reload until "Reset demo". Needs Chromium: `npx playwright install chromium`, then `npm run test:e2e`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { build } from "../../scripts/build-demo.ts";
import { chromium, type Browser } from "playwright";

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
  browser = await chromium.launch();
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
