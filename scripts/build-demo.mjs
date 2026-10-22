// Builds the public demo site into _site/ from the real app pages in apps/.
// Each app page is the live Claude artifact's page, saved as is. This script strips the
// artifact-only tags and loads the demo's seed.js and ../fake-db.js first, so the app runs
// on sample data kept only in the visitor's browser. Seeds (demo/<app>/seed.js) are edited
// by hand and never written here.
// Usage: node scripts/build-demo.mjs [outDir]   (default _site; GitHub Pages serves it at /pm-tools/)
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const APPS = [
  { id: "build-slate", name: "Build Slate", blurb: "One board for every product: stage, the very next step, and a milestone date. It caps the slate at five live projects." },
  { id: "roadmap", name: "Near-Term Roadmap", blurb: "Now, Next, Later and Done lanes with a board per product, owners, session-size estimates and a blocked flag." },
];

// Demo-only changes to an app, as [old, new] pairs. Each must still match, or the build fails.
export const EDITS = {
  // The "use this board from other chats" panel documents the live database schema; visitors don't need it (PMT-M2.5).
  roadmap: [["</head>", "<style>details.agents{display:none}</style></head>"]],
};

export function toDemo(id, html) {
  let t = html.replace(/<meta name="claude:[^"]*"[^>]*>\s*/g, "");
  for (const [from, to] of EDITS[id] || []) {
    if (!t.includes(from)) throw new Error(`${id}: app changed, update EDITS (${from})`);
    t = t.replace(from, to);
  }
  const once = (from, to) => {
    if (!t.includes(from)) throw new Error(`${id}: page has no ${from}`);
    t = t.replace(from, to);
  };
  once("<html>", '<html lang="en">');
  once("</head>", '<meta name="robots" content="noindex"><link rel="icon" href="../favicon.svg"></head>');
  once("<body>", '<body>\n<script src="seed.js"></script><script src="../fake-db.js"></script>\n');
  return t;
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function landing() {
  const cards = APPS.map((a) => `<a class="card" href="${a.id}/"><h2>${esc(a.name)}</h2><p>${esc(a.blurb)}</p><span>${a.id === "build-slate" ? "Try Build Slate" : "Try the Near-Term Roadmap"}</span></a>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PM tools · Chase Holroyd</title>
<meta name="description" content="Live demos of the product management tools behind a one-person product studio.">
<link rel="icon" href="favicon.svg">
<style>
:root{--bg:#F6F7F4;--fg:#1C2420;--muted:#5C6B63;--line:#D5DCD7;--accent:#2F6B4F;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#121815;--fg:#E3EAE5;--muted:#9AAAA1;--line:#2C3832;--accent:#7FC6A1;--card:#1A221E}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:860px;margin:0 auto;padding:40px 16px 64px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;margin:0 0 8px}
.lede{color:var(--muted);max-width:60ch;margin:0 0 28px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px}
.card{display:flex;flex-direction:column;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;color:inherit;text-decoration:none}
.card:hover,.card:focus-visible{border-color:var(--accent);outline:none}
.card h2{margin:0;font-size:20px}.card p{margin:0;color:var(--muted)}.card span{color:var(--accent);font-weight:600;margin-top:auto}
.back{display:inline-block;padding:12px 0;margin-bottom:12px;font-weight:600;text-decoration:none}
footer{margin-top:40px;color:var(--muted);font-size:14px}a{color:var(--accent)}
</style></head><body><main>
<a class="back" href="/">← Chase Holroyd</a>
<h1>PM tools</h1>
<p class="lede">The tools I run my product studio with, live on sample data. Anything you change stays in your browser.</p>
<div class="grid">
${cards}
</div>
<footer><a href="https://github.com/holroydchase-afk/pm-tools">Source and templates on GitHub</a> · <a href="https://chaseholroyd.com/">chaseholroyd.com</a></footer>
</main></body></html>
`;
}

export function build(out = join(ROOT, "_site")) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  copyFileSync(join(ROOT, "demo", "fake-db.js"), join(out, "fake-db.js"));
  copyFileSync(join(ROOT, "assets", "favicon.svg"), join(out, "favicon.svg"));
  for (const { id } of APPS) {
    const seed = join(ROOT, "demo", id, "seed.js");
    if (!existsSync(seed)) throw new Error(`${id}: write demo/${id}/seed.js first`);
    mkdirSync(join(out, id), { recursive: true });
    copyFileSync(seed, join(out, id, "seed.js"));
    writeFileSync(join(out, id, "index.html"), toDemo(id, readFileSync(join(ROOT, "apps", `${id}.html`), "utf8")));
  }
  writeFileSync(join(out, "index.html"), landing());
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Built", build(process.argv[2]));
}
