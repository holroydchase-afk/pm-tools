import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, landing } from "../scripts/build-demo.ts";

const ROOT = join(import.meta.dirname, "..");
const WF = readFileSync(join(ROOT, ".github", "workflows", "pages.yml"), "utf8");

// Chase, Nov 18: the Studio Console reads his real status from public repos and isn't ready to show.
// It is off unless the repo variable CONSOLE_PUBLIC is "true"; nothing is deleted.

test("CON-HIDE-1 by default /pm-tools/ does not redirect to or link the console", () => {
  const html = landing(false);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
  assert.doesNotMatch(html, /href="console\/"/);
  assert.match(html, /isn't public right now/);
  assert.ok(html.includes("Build Slate") && html.includes("Near-Term Roadmap"), "the archived sample demos stay");
});

test("CON-HIDE-2 by default the build ships a stub at console/ and no console app or feed", () => {
  const out = build(mkdtempSync(join(tmpdir(), "pmtools-hidden-")), false);
  const stub = readFileSync(join(out, "console", "index.html"), "utf8");
  assert.match(stub, /<meta name="robots" content="noindex">/);
  assert.match(stub, /isn't public right now/);
  for (const f of ["app.js", "studio.json"]) assert.ok(!existsSync(join(out, "console", f)), `no console/${f}`);
  assert.ok(!existsSync(join(out, "console", "fonts")), "no console fonts");
});

test("CON-HIDE-3 with the console on, the build still ships the page, app and sample feed", () => {
  const out = build(mkdtempSync(join(tmpdir(), "pmtools-shown-")), true);
  for (const f of ["index.html", "app.js", "studio.json"]) assert.ok(existsSync(join(out, "console", f)), `console/${f}`);
  assert.match(landing(true), /href="console\/"/);
});

test("CON-HIDE-4 pages.yml builds with CONSOLE_PUBLIC and only runs the real feed when it is \"true\"", () => {
  assert.match(WF, /CONSOLE_PUBLIC:\s*\$\{\{\s*vars\.CONSOLE_PUBLIC\s*\}\}/, "the build gets the variable");
  const feedStep = WF.split("\n      - ").find((s) => /npm run feed/.test(s)) ?? "";
  assert.match(feedStep, /vars\.CONSOLE_PUBLIC == 'true'/, "the feed step is gated on the variable");
});
