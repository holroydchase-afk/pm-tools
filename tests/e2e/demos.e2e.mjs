// Browser test of the built demos (QA-11): each page loads with no errors, and an edit
// survives a reload until "Reset demo". Needs Playwright: `npm run test:e2e` (CI installs it).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { build } from "../../scripts/build-demo.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const out = build(mkdtempSync(join(tmpdir(), "pmtools-e2e-")));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".css": "text/css" };
let server, browser, base;

before(async () => {
  // Serve the build at /pm-tools/, like GitHub Pages does.
  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (!path.startsWith("/pm-tools/")) { res.writeHead(404).end(); return; }
    let file = join(out, path.slice("/pm-tools/".length));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}/pm-tools/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function open(path, width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const errors = [];
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
