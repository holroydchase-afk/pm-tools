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

  // A slim bar so nobody mistakes the demo for the real thing.
  const bar = () => {
    const b = document.createElement("div");
    b.setAttribute("role", "note");
    b.style.cssText = "position:sticky;top:0;z-index:9999;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;" +
      "padding:8px 16px;background:#1F5C44;color:#fff;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    b.innerHTML = '<a href="' + (cfg.back || "../../index.html") + '" style="color:#fff;font-weight:600;text-decoration:none">← Chase Holroyd</a>' +
      '<span style="opacity:.9">Demo · sample data, saved only in your browser</span>' +
      '<button type="button" style="margin-left:auto;font:inherit;color:#1F5C44;background:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer">Reset demo</button>';
    b.querySelector("button").onclick = () => { try { if (cfg.clearAll) localStorage.clear(); else localStorage.removeItem(KEY); } catch (_) {} location.reload(); };
    document.body.prepend(b);
  };
  if (document.body) bar(); else document.addEventListener("DOMContentLoaded", bar);
})();
