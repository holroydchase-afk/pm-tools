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
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.waitForLoadState("networkidle");
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

for (const path of ["build-slate/", "roadmap/"]) {
  test(`Night shift Oct 23: /pm-tools/${path} demo bar back link is a 44px tap target at 390px`, async () => {
    const { page } = await open(path);
    const link = page.locator('[role="note"] a').first();
    assert.match((await link.textContent()) ?? "", /How I keep it all moving/);
    const box = await link.boundingBox();
    assert.ok(box, "back link is visible");
    assert.ok(box.height >= 44, `back link is ${box.height}px tall`);
    await page.close();
  });
}
