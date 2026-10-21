import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { APPS, build, toDemo } from "../scripts/build-demo.mjs";
import { scanText } from "../scripts/check-private.mjs";

const out = build(mkdtempSync(join(tmpdir(), "pmtools-")));

for (const { id } of APPS) {
  test(`${id}: demo page loads the seed and fake db before the app`, () => {
    const html = readFileSync(join(out, id, "index.html"), "utf8");
    assert.ok(!html.includes('name="claude:'), "artifact-only meta tags are stripped");
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<meta name="robots" content="noindex">/);
    const seedAt = html.indexOf('<script src="seed.js">'), dbAt = html.indexOf('<script src="../fake-db.js">');
    assert.ok(seedAt > 0 && dbAt > seedAt, "seed.js, then fake-db.js");
    assert.ok(dbAt < html.indexOf("<script>"), "both load before the app's own script");
  });

  test(`${id}: seed is valid and has data`, () => {
    const ctx = { window: {} };
    vm.runInNewContext(readFileSync(join(out, id, "seed.js"), "utf8"), ctx);
    assert.equal(ctx.window.DEMO.key, id);
    const cols = Object.values(ctx.window.DEMO.seed);
    assert.ok(cols.length && cols.every((c) => Object.keys(c).length), "every collection has documents");
  });

  test(`${id}: app source and seed hold no personal data`, () => {
    for (const f of [join("apps", `${id}.html`), join("demo", id, "seed.js")]) {
      assert.deepEqual(scanText(readFileSync(f, "utf8")), [], f);
    }
  });
}

test("site has a landing page linking every demo, plus shared files", () => {
  const html = readFileSync(join(out, "index.html"), "utf8");
  for (const { id } of APPS) assert.ok(html.includes(`href="${id}/"`), id);
  assert.ok(existsSync(join(out, "fake-db.js")) && existsSync(join(out, "favicon.svg")));
});

test("toDemo fails loudly when the page shape changes", () => {
  assert.throws(() => toDemo("x", "<html><head></head></html>"), /no <body>/);
});
