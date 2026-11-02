/* Demo stand-in for the Claude artifact runtime.
 * The real apps save to a shared database through window.claude.use("db").
 * Here the same calls read and write sample data kept only in this browser
 * (localStorage), so a visitor can click around with no login.
 * Each demo page sets window.DEMO = {key, seed} before loading this file:
 *   seed = {collectionName: {docId: {...fields}}}                         */
(function () {
  const cfg = window.DEMO || { key: "demo", seed: {} };
  const KEY = "chdemo:" + cfg.key;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { store = null; }
  if (!store) store = clone(cfg.seed || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} };

  const listeners = []; // {col, id|null, cb}
  const docSnap = (col, id) => {
    const d = store[col] && store[col][id];
    return { id, exists: !!d, data: () => (d ? clone(d) : undefined) };
  };
  const colSnap = (col) => {
    const docs = Object.keys(store[col] || {}).map((id) => docSnap(col, id));
    return { docs, size: docs.length, empty: !docs.length, forEach: (f) => docs.forEach(f) };
  };
  const notify = (col) => setTimeout(() => {
    listeners.filter((l) => l.col === col).forEach((l) => l.cb(l.id == null ? colSnap(col) : docSnap(col, l.id)));
  }, 0);
  const subscribe = (col, id, cb) => {
    const l = { col, id, cb };
    listeners.push(l);
    setTimeout(() => cb(id == null ? colSnap(col) : docSnap(col, id)), 0);
    return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); };
  };
  const plain = (v) => JSON.parse(JSON.stringify(v === undefined ? null : v));
  const setPath = (obj, path, v) => {
    const parts = path.split("."); let o = obj;
    while (parts.length > 1) { const p = parts.shift(); if (typeof o[p] !== "object" || !o[p]) o[p] = {}; o = o[p]; }
    if (v && v.__delete__) delete o[parts[0]]; else o[parts[0]] = plain(v);
  };
  let n = 0;
  const newId = () => "d" + Date.now().toString(36) + (n++).toString(36);

  function docRef(col, id) {
    id = id || newId();
    return {
      id,
      get: async () => docSnap(col, id),
      set: async (data, opts) => {
        (store[col] = store[col] || {});
        store[col][id] = opts && opts.merge ? Object.assign(store[col][id] || {}, plain(data)) : plain(data);
        save(); notify(col);
      },
      update: async (patch) => {
        (store[col] = store[col] || {});
        const d = store[col][id] || (store[col][id] = {});
        Object.keys(patch).forEach((k) => setPath(d, k, patch[k]));
        save(); notify(col);
      },
      delete: async () => { if (store[col]) delete store[col][id]; save(); notify(col); },
      onSnapshot: (cb) => subscribe(col, id, cb),
    };
  }
  function colRef(col) {
    return {
      doc: (id) => docRef(col, id),
      add: async (data) => { const r = docRef(col); await r.set(data); return r; },
      get: async () => colSnap(col),
      onSnapshot: (cb) => subscribe(col, null, cb),
    };
  }
  const db = {
    collection: colRef,
    doc: (path) => { const [c, id] = path.split("/"); return docRef(c, id); },
  };
  const user = { can: async () => true, id: "demo-visitor", name: "Visitor" };
  window.claude = { use: async (cap) => (cap === "db" ? db : cap === "user" ? user : null) };

  // The studio demo bar (docs/DEMO-BANNER.md): a slim "Demo" bar whose Details button opens a
  // push-down drawer with the standard copy, Reset demo and the way back. It is drawn in the
  // app's own tokens (--surface, --ink, --muted, --line, --accent, --accent-ink, --f-body), so
  // each app keeps its own look; the --demo-* variables override any of them.
  const CSS =
    ".demo-bar{--db-bg:var(--demo-bg,var(--surface,#fff));--db-fg:var(--demo-fg,var(--ink,#1c2420));--db-muted:var(--demo-muted,var(--muted,#5c6b63));" +
    "--db-line:var(--demo-line,var(--line,#d5dcd7));--db-badge-bg:var(--demo-badge-bg,transparent);--db-badge-fg:var(--demo-badge-fg,var(--ink,#1c2420));" +
    "position:relative;z-index:30;background:var(--db-bg);color:var(--db-fg);border-bottom:1px solid var(--db-line);font-family:var(--demo-font,var(--f-body,system-ui,sans-serif));font-size:14px;line-height:1.4}" +
    ".demo-bar *{box-sizing:border-box}" +
    ".demo-bar__row{display:flex;align-items:stretch;padding-left:max(16px,env(safe-area-inset-left,0px))}" +
    ".demo-bar__home{flex:none;display:inline-flex;align-items:center;min-height:44px;padding-right:12px;margin-right:2px;border-right:1px solid var(--db-line);color:inherit;font-weight:600;text-decoration:none;white-space:nowrap}" +
    ".demo-bar__home:hover{text-decoration:underline;text-underline-offset:3px}" +
    ".demo-bar__toggle{display:flex;align-items:center;gap:10px;flex:1;min-width:0;min-height:44px;margin:0;padding:0 max(16px,env(safe-area-inset-right,0px)) 0 12px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}" +
    ".demo-bar__toggle:hover .demo-bar__more{text-decoration:underline}" +
    ".demo-bar__toggle:focus-visible,.demo-bar__home:focus-visible,.demo-bar__panel a:focus-visible,.demo-bar__panel button:focus-visible{outline:2px solid var(--db-fg);outline-offset:-4px}" +
    ".demo-bar__badge{flex:none;padding:2px 8px;border-radius:999px;border:1px solid var(--db-fg);background:var(--db-badge-bg);color:var(--db-badge-fg);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}" +
    ".demo-bar__sum{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--db-muted)}" +
    ".demo-bar__long{display:none}@media (min-width:600px){.demo-bar__long{display:inline}}@media (max-width:359px){.demo-bar__sum{display:none}}" +
    ".demo-bar__more{flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-weight:600}" +
    ".demo-bar__chev{width:10px;height:10px;transition:transform .15s}.demo-bar__toggle[aria-expanded=true] .demo-bar__chev{transform:rotate(180deg)}" +
    "@media (prefers-reduced-motion:reduce){.demo-bar__chev{transition:none}}" +
    ".demo-bar__panel{padding:4px max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px))}.demo-bar__panel[hidden]{display:none}" +
    ".demo-bar__panel p{margin:0 0 12px;max-width:70ch;font-size:16px;line-height:1.5;text-wrap:pretty}" +
    ".demo-bar__actions{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}" +
    ".demo-bar__confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.demo-bar__confirm[hidden]{display:none}" +
    ".demo-bar__reset,.demo-bar__yes,.demo-bar__no{min-height:44px;padding:0 16px;border:1px solid var(--db-line);border-radius:8px;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}" +
    ".demo-bar__back{display:inline-flex;align-items:center;min-height:44px;color:inherit;font-weight:600;text-underline-offset:3px}";
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const bar = () => {
    const name = cfg.name || document.title || "this app";
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.append(style);
    const b = document.createElement("section");
    b.className = "demo-bar";
    b.setAttribute("aria-label", "Demo");
    const back = esc(cfg.back || "../../index.html");
    b.innerHTML =
      '<div class="demo-bar__row"><a class="demo-bar__home" href="' + back + '">' + esc(cfg.backShort || "← Portfolio") + "</a>" +
      '<button type="button" class="demo-bar__toggle" aria-expanded="false" aria-controls="demo-bar-panel" aria-label="Demo details">' +
      '<span class="demo-bar__badge">Demo</span>' +
      '<span class="demo-bar__sum">Sample data<span class="demo-bar__long"> · changes stay in this browser</span></span>' +
      '<span class="demo-bar__more">Details<svg class="demo-bar__chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>' +
      "</button></div>" +
      '<div class="demo-bar__panel" id="demo-bar-panel" hidden>' +
      "<p>This is the real " + esc(name) + ", running on made-up sample data. Anything you change is saved only in this browser and is never sent anywhere. Reset demo puts the sample data back.</p>" +
      '<div class="demo-bar__actions"><button type="button" class="demo-bar__reset">Reset demo</button>' +
      '<span class="demo-bar__confirm" role="group" aria-label="Confirm reset" hidden><span>Put the sample data back? Your changes will be lost.</span>' +
      '<button type="button" class="demo-bar__yes">Reset</button><button type="button" class="demo-bar__no">Keep</button></span>' +
      '<a class="demo-bar__back" href="' + back + '">' + esc(cfg.backLabel || "← Chase Holroyd") + "</a></div>" +
      "</div>";
    const toggle = b.querySelector(".demo-bar__toggle"), panel = b.querySelector(".demo-bar__panel");
    const reset = b.querySelector(".demo-bar__reset"), confirm = b.querySelector(".demo-bar__confirm");
    const setOpen = (open) => { toggle.setAttribute("aria-expanded", String(open)); panel.hidden = !open; };
    toggle.onclick = () => setOpen(panel.hidden);
    b.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); } });
    // Reset asks once, inline, before it throws the visitor's changes away.
    reset.onclick = () => { reset.hidden = true; confirm.hidden = false; b.querySelector(".demo-bar__no").focus(); };
    b.querySelector(".demo-bar__no").onclick = () => { confirm.hidden = true; reset.hidden = false; reset.focus(); };
    b.querySelector(".demo-bar__yes").onclick = () => { try { if (cfg.clearAll) localStorage.clear(); else localStorage.removeItem(KEY); sessionStorage.setItem("chdemo:reset", "1"); } catch (_) {} location.reload(); };
    // After a reset, open the drawer once to say it worked.
    let wasReset = false;
    try { wasReset = sessionStorage.getItem("chdemo:reset") === "1"; sessionStorage.removeItem("chdemo:reset"); } catch (_) {}
    if (wasReset) { panel.querySelector("p").textContent = "Sample data restored. " + panel.querySelector("p").textContent; setOpen(true); }
    document.body.prepend(b);
  };
  if (document.body) bar(); else document.addEventListener("DOMContentLoaded", bar);
})();
