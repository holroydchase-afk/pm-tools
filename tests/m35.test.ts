// PMT-M3.5: the portfolio page pm-tools.html is now "Studio Console". The /pm-tools/ landing redirects
// to the console, the two old demos stay up but are labelled archived, and the console header goes
// back to the portfolio home. CON-M35-3 and CON-M35-4 are ux-reviewer findings CON-P-R5 and CON-P-R7.
// Real-phone check of the tab fade (CON-M35-4) is manual: see the case at the bottom of this file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { landing } from "../scripts/build-demo.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const consoleHtml = () => readFileSync(join(ROOT, "console", "index.html"), "utf8");
const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const links = (html: string) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: (m[1].match(/\bhref="([^"]*)"/) || [])[1],
    text: text(m[2]),
    index: m.index ?? -1,
  }));

// ---------------------------------------------------------------- CON-M35-1

test("CON-M35-1 /pm-tools/ redirects to the Studio Console straight away", () => {
  assert.match(landing(), /<meta http-equiv="refresh" content="0; url=console\/">/);
});

test("CON-M35-1 /pm-tools/ shows a visible \"Open the Studio Console\" link to console/", () => {
  const a = links(landing()).find((l) => l.href === "console/");
  assert.ok(a, "a link to console/");
  assert.equal(a.text, "Open the Studio Console");
});

test("CON-M35-1 /pm-tools/ keeps the ← Chase Holroyd link to / before the heading", () => {
  const html = landing();
  const back = links(html).find((l) => l.href === "/" && l.text === "← Chase Holroyd");
  assert.ok(back, "← Chase Holroyd link to /");
  assert.ok(back.index < html.indexOf("<h1"), "back link before the h1");
});

test("CON-M35-1 /pm-tools/ lists Build Slate and the Roadmap as archived, with no Try call to action", () => {
  const html = landing();
  for (const href of ["build-slate/", "roadmap/"]) {
    const a = links(html).find((l) => l.href === href);
    assert.ok(a, `a link to ${href}`);
    const near = text(html.slice(Math.max(0, a.index - 300), a.index + 300));
    assert.match(near, /Archived/, `"Archived" near the ${href} link`);
  }
  assert.doesNotMatch(html, /Try Build Slate/);
  assert.doesNotMatch(html, /Try the Near-Term Roadmap/);
});

// ---------------------------------------------------------------- CON-M35-2

test("CON-M35-2 both demo bars go back to the Studio Console portfolio page", () => {
  for (const id of ["build-slate", "roadmap"]) {
    const ctx = { window: {} as { DEMO: { back: string; backLabel: string } } };
    vm.runInNewContext(readFileSync(join(ROOT, "demo", id, "seed.js"), "utf8"), ctx);
    assert.equal(ctx.window.DEMO.back, "../../pm-tools.html", id);
    assert.equal(ctx.window.DEMO.backLabel, "← Studio Console", id);
  }
});

// ---------------------------------------------------------------- CON-M35-3 (CON-P-R5)

test("CON-M35-3 console header back link reads ← Chase Holroyd and goes to /", () => {
  const html = consoleHtml();
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
  const back = links(header).find((l) => l.text.startsWith("←"));
  assert.ok(back, "a ← back link in the header");
  assert.equal(back.text, "← Chase Holroyd");
  assert.equal(back.href, "/");
  assert.doesNotMatch(text(header), /← PM tools/);
});

// ---------------------------------------------------------------- CON-M35-4 (CON-P-R7)

// Bodies of every @media block whose query has a max-width, brace-matched.
function maxWidthMediaBodies(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/@media[^{]*max-width[^{]*\{/g)) {
    let depth = 1, i = (m.index ?? 0) + m[0].length;
    const start = i;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    out.push(css.slice(start, i - 1));
  }
  return out;
}

test("CON-M35-4 on phones the tab row fades at the right edge (mask-image linear-gradient on nav)", () => {
  const css = [...consoleHtml().matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const found = maxWidthMediaBodies(css).some((body) =>
    [...body.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(([, sel, decl]) =>
      sel.split(",").some((s) => /^(nav|#nav|nav#nav|header\.site nav)$/.test(s.trim())) &&
      /(?:-webkit-)?mask-image\s*:\s*linear-gradient\(/.test(decl),
    ),
  );
  assert.ok(found, "a max-width media query gives nav a mask-image linear-gradient");
});

// Manual case CON-M35-4m (needs a real phone; not run here):
//   Steps: open chaseholroyd.com/pm-tools/console/ on a 390px-wide phone, light then dark mode.
//   Expected: the last visible tab fades out at the right edge; swiping the row reveals the rest;
//   every tab stays readable and tappable once scrolled into view.
