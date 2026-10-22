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
  { id: "build-slate", name: "Build Slate", blurb: "One board for every product: stage, the very next step, and a milestone date. It caps the slate at five active projects." },
  { id: "roadmap", name: "Near-Term Roadmap", blurb: "Later, Next, Now and Done lanes with a board per product, owners, session-size estimates and a blocked flag." },
];

// Demo-only changes to an app, as [old, new] pairs. Each must still match, or the build fails.
export const EDITS = {
  // Demo-only polish from the recruiter-ready review (R1-UX). Port to the live apps when Chase OKs it.
  "build-slate": [
    // R1-UX-5: stage colors that pass WCAG AA as small text in light mode.
    ["--s-build:#C4731B; --s-beta:#2F7FB6; --s-live:#1F8A55;", "--s-build:#9A5A10; --s-beta:#23679A; --s-live:#17703F;"],
    // Overrides go before </body> so they load after the app's own CSS (R2-UX-4).
    ["</body>", "<style>.stage-tag{font-size:12px;font-weight:600}.cardwrap{display:flex;flex-direction:column;gap:4px;min-width:0}.cardwrap .card{flex:1}@media (max-width:640px){.chip,.btn{min-height:44px}}.cardwrap .live{display:inline-flex;align-self:flex-start;align-items:center;min-height:44px;padding:0 4px;font-weight:600;color:var(--s-beta)}.cardwrap .live.none{visibility:hidden}.meta{font-size:13px}.k{font-size:12px}</style></body>"],
    // R2-UX-5: the seed's kind is a real option.
    ["<option>AI tool</option>", "<option>AI tool</option><option>Developer tool</option>"],
    // R1-UX-11: say what the five squares mean.
    ["`Slate goal · ${n} of ${GOAL}${n > GOAL ? \" — past it\" : \"\"}`", "`Active projects · ${n} of ${GOAL} max${n > GOAL ? \" — over the cap\" : \"\"}`"],
    // R1-UX-2: a link to each live product, next to the card (a link can't sit inside the card button).
    ['return `<button class="card ', 'return `<div class="cardwrap"><button class="card '],
    ['</div>\n    </button>`;', '</div>\n    </button>${p.link ? `<a class="live" href="${esc(p.link)}" target="_blank" rel="noopener">${/github\\.com/.test(p.link) ? `${esc(p.name)} on GitHub` : `Try ${esc(p.name)}`} ↗</a>` : `<span class="live none" aria-hidden="true">&nbsp;</span>`}</div>`;'],
  ],
  roadmap: [
    // The "use this board from other chats" panel documents the live database schema; visitors don't need it (PMT-M2.5).
    // R1-UX-4: move buttons big enough to tap.
    ["</body>", "<style>details.agents{display:none}.move{gap:8px}.move button[data-mv]{min-height:44px;min-width:44px;padding:0 12px;font-size:14px}@media (max-width:640px){.chip,.lanetabs button,#boardSel,.btn{min-height:44px}}.owner{font-size:13px}.card .m{font-size:13px}.lane .hint,.lane h2 small{font-size:13px}#movedToast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9998;display:flex;gap:12px;align-items:center;width:min(480px,calc(100% - 32px));box-sizing:border-box;justify-content:space-between;padding:8px 8px 8px 16px;border-radius:8px;background:var(--ink);color:var(--bg,#fff);font:14px/1.4 var(--f-body);box-shadow:0 4px 16px rgba(0,0,0,.2)}#movedToast[hidden]{display:none}#movedToast button{min-height:44px;padding:0 14px;border:0;border-radius:6px;font:600 14px var(--f-body);cursor:pointer}</style>\n<div id=\"movedToast\" role=\"status\" aria-live=\"polite\" hidden><span></span><button type=\"button\">Undo</button></div>\n<script>function showMoved(id,title,label,was,wasOrder){const t=document.getElementById(\"movedToast\");t.querySelector(\"span\").textContent=\"Moved “\"+title+\"” to \"+label;t.hidden=false;clearTimeout(t._h);t.querySelector(\"button\").onclick=()=>{t.hidden=true;moveCard(id,was,wasOrder,true)};t._h=setTimeout(()=>{t.hidden=true},6000)}</script></body>"],
    // R1-UX-12: a pinned notice with Undo after a move.
    ["async function moveCard(id,lane,order){", "async function moveCard(id,lane,order,quiet){"],
    ["const patch={lane,updated", "const was=c.lane,wasOrder=c.order;const patch={lane,updated"],
    ['$("status").textContent=`Moved to ${LANES.find(l=>l.id===lane).label}`', 'if(quiet)$("status").textContent="Move undone";else showMoved(id,c.title,LANES.find(l=>l.id===lane).label,was,wasOrder)'],
    // R2-UX-4: lane colors that pass AA as text in light mode.
    ["--later:#7A8392; --done:#2F7A52;", "--later:#565E6C; --done:#256845;"],
    ["<span>“My tasks” owner</span>", "<span>Owner for the “Chase's tasks” filter</span>"],
    // R1-UX-5: orange that passes AA as text in light mode.
    ["--accent:#C2410C;", "--accent:#A8380A;"],
    ["--now:#C2410C;", "--now:#A8380A;"],
    // R1-UX-6: plain words for visitors.
    ['o===me?"My tasks"', 'o===me?"Chase\'s tasks"'],
    ["${sess%1?sess.toFixed(1):sess} sess`", "${sess%1?sess.toFixed(1):sess} session${sess===1?\"\":\"s\"}`"],
    ["`<span>${c.size} sess</span>`", "`<span>${c.size} session${Number(c.size)===1?\"\":\"s\"}</span>`"],
    ["sessions left`", "work sessions left`"],
  ],
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
.card:hover{border-color:var(--accent)}.card:focus-visible{border-color:var(--accent);outline:3px solid var(--accent);outline-offset:2px}
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
