// Studio Console (PMT-M3.2): renders studio.json, the feed scripts/build-feed.ts writes hourly.
// Plain browser JS, no build step. The render helpers are pure (feed in, HTML string out) and live
// on window.Console so tests/console.test.ts can load this file in a vm with no document; the page
// only boots (fetches the feed, routes by hash) when a document exists.
// Every string from the feed is escaped and every number forced through Number(): PR titles come
// from anyone with write access, and a tampered feed must not inject markup (SEC-C7).
(function (w) {
  "use strict";
  const GH = "https://github.com/holroydchase-afk/";
  const STALE_MINUTES = 120;
  const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ENT[c]);
  const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
  const pct = (x) => Math.max(0, Math.min(100, Math.round(num(x))));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const repoUrl = (repo) => GH + encodeURIComponent(repo);
  const prUrl = (repo, n) => `${repoUrl(repo)}/pull/${num(n)}`;
  // "CCW-M4.1: Pace spike" -> "Pace spike" (UX-C2: planning IDs are for agents, not the page;
  // off-goal rows keep the full title as a tooltip).
  const bare = (title) => String(title).replace(/^\s*[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9.]+)+:\s*/, "");
  const link = (href, label, primary) =>
    `<a class="btn${primary ? " primary" : ""}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
  const row = (sev, attrs, what, act) =>
    `<div class="call s${sev}" ${attrs}><span class="sev" aria-hidden="true"></span><div class="what">${what}</div><div class="act">${act}</div></div>`;

  // ---------------------------------------------------------------- Focus (CON-8, UX-C1)

  // { text, bar } for a goal's progress: "5 of 7 demos live" (bar done/of) or "22 days to beta"
  // (counted from the feed time; bar = time elapsed since `from`, default 30 days before). null if none.
  const DAY = 86400000;
  function progressOf(p, builtAt) {
    if (!p || typeof p !== "object") return null;
    const label = String(p.label || "");
    if (p.target !== undefined) {
      const end = Date.parse(p.target);
      const now = Date.parse(builtAt);
      if (Number.isNaN(end) || Number.isNaN(now)) return null;
      const start = Number.isNaN(Date.parse(p.from)) ? end - 30 * DAY : Date.parse(p.from);
      const days = Math.max(0, Math.ceil((end - now) / DAY));
      const text = days === 0 ? `Target date reached` : `${plural(days, "day")} ${label}`;
      return { text, bar: pct(((now - start) / Math.max(1, end - start)) * 100) };
    }
    const of = num(p.of);
    const done = num(p.done);
    return of > 0 ? { text: `${done} of ${of} ${label}`, bar: pct((done / of) * 100) } : null;
  }

  function renderFocus(feed) {
    const goals = feed.goals || [];
    const parts = goals.map((g, i) => ({ id: g.id, name: g.name, share: pct(g.effort), cls: "g" + ((i % 4) + 1) }));
    parts.push({ id: "off-goal", name: "Off-goal", share: pct(feed.offGoalEffort), cls: "g0" });
    const shown = parts.filter((p) => p.share > 0);
    const bar = shown.map((p) => `<span class="${p.cls}" data-segment="${esc(p.id)}" data-share="${p.share}" style="width:${p.share}%" title="${esc(p.name)} ${p.share}%">${p.share}%</span>`).join("");
    const legend = shown.length
      ? `<div class="legend">${shown.map((p) => `<span><i class="${p.cls}"></i>${esc(p.name)}</span>`).join("")}</div>`
      : `<p class="muted" style="margin:0">No open PRs or agent runs in the last 7 days.</p>`;
    const cards = goals.map((g, i) => {
      const share = pct(g.effort);
      const p = progressOf(g.progress, feed.builtAt);
      // UX-C1: progress is the headline when the goal has one; the week's share is then one small line.
      // UX-C11: no progress, no card bar (the share already has the bar at the top).
      const head = p
        ? `<div class="big">${esc(p.text)}</div><div class="muted small">${share}% of this week's work</div>`
        : `<div><span class="big">${share}%</span> <span class="muted small">of this week's work</span></div><div class="muted small">Progress kept private</div>`;
      const status = g.status ? `<div><span class="chip acc" data-status>${esc(g.status)}</span></div>` : "";
      const reads = (g.reads || []).length ? `<div class="src">Reads: ${g.reads.map(esc).join(", ")}</div>` : "";
      return `<div class="panel goal" data-goal="${esc(g.id)}">
      <div style="display:flex;gap:8px;align-items:center"><i class="key g${(i % 4) + 1}"></i><h2>${esc(g.name)}</h2></div>
      <div class="muted small">${esc(g.measure)}</div>
      ${head}
      ${p ? `<div class="bar"><i class="g${(i % 4) + 1}" style="width:${p.bar}%"></i></div>` : ""}
      ${status}${reads}</div>`;
    }).join("");
    const off = feed.offGoal || [];
    const items = off.length
      ? off.map((o) => o.kind === "pr"
        ? row(2, "data-offgoal-item", `<strong title="${esc(o.title)}">${esc(noFiles(bare(o.title)))}</strong><div class="meta"><span class="chip">${esc(o.repo)} #${num(o.number)}</span></div>`, link(prUrl(o.repo, o.number), "Open PR"))
        : row(2, "data-offgoal-item", `<strong>${esc(plural(num(o.count), "agent run"))} on ${esc(o.repo)}</strong><div class="why">Runs on a branch with no open PR tied to a goal</div>`, link(repoUrl(o.repo), "Open repo"))).join("")
      : `<p class="empty">Nothing off-goal this week.</p>`;
    return `<h1>Focus</h1>
<p class="lede">Where this week's work went, measured against your goals. Each open PR and agent run is matched to a goal by its planning ID or repo; anything that matches none lands in Off-goal.</p>
<div class="stack">
  <div class="panel pad stack">
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><h2>This week's work by goal</h2><span class="src">Open PRs and agent runs, last 7 days</span></div>
    <div class="effort" role="img" aria-label="Work split by goal">${bar}</div>
    ${legend}
  </div>
  <div class="goals">${cards}</div>
  <div class="panel" data-offgoal-list>
    <div class="pad" style="padding-bottom:4px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><h2>Off-goal: possible rabbit holes</h2><span class="src">Work that matches no goal</span></div>
    ${items}
  </div>
</div>`;
  }

  // ---------------------------------------------------------------- Call Sheet (CON-9, UX-C2, UX-C3)

  // Worst first; severity 1 red, 2 amber, 3 accent, 4 neutral.
  const GROUPS = [
    { key: "failing", label: "Fix failing checks", sev: 1 },
    { key: "merge", label: "Ready to merge", sev: 3 },
    { key: "decide", label: "Decide", sev: 2 },
    { key: "idleDrafts", label: "Drafts idle over 24h", sev: 2 },
    { key: "inProgress", label: "In progress", sev: 4 },
    { key: "dependabot", label: "Dependabot", sev: 4 },
  ];
  const WHY = {
    failing: "Checks are failing; it can't merge until they pass",
    merge: "Checks passed; waiting on your review",
    idleDrafts: "Draft with no update for over a day",
    inProgress: "Agents are still working on it",
  };
  const DEPENDABOT_Q = "?q=" + encodeURIComponent("is:pr is:open author:app/dependabot");
  const VERB = /^(Review|Merge|Decide|Pick|Choose|Turn|Paste|Ship|Approve|Set|Confirm|Name|Rename|Answer|Reply|Sign|Agree|Check|Read|Try|Drop|Keep|Move|Open|Close|Add|Remove|Update|Write|Run|Fix|Test|Book|Send|Schedule)\b/;

  // A decision as a verb-first call with no trailing period: "Goal measures." -> "Decide on goal measures".
  // UX-C10: titles never name files ("Review goal names in goals.json" -> "Review goal names").
  const FILE = /\s+(?:in|for|to|from|of|on)\s+(?:the\s+)?[\w./-]+\.(?:json|md|ya?ml|ts|js)\b/gi;
  const noFiles = (t) => String(t).replace(FILE, "").replace(/\s+[\w./-]+\.(?:json|md|ya?ml)\b/gi, "");
  // UX-C3: a bullet's first sentence is the call; any sentences after it are the reason.
  function splitDecision(text) {
    const m = /^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(String(text).trim());
    return m ? { head: m[1], rest: m[2] } : { head: String(text), rest: "" };
  }

  function asCall(text) {
    const t = noFiles(String(text).trim()).replace(/[.\s]+$/, "");
    if (VERB.test(t)) return t;
    if (/^whether\b/i.test(t)) return "Decide " + t[0].toLowerCase() + t.slice(1);
    const first = t.split(/\s/)[0] || "";
    const lower = /^[A-Z][a-z]+$/.test(first) ? t[0].toLowerCase() + t.slice(1) : t; // keep acronyms and names like "iOS"
    return "Decide on " + lower;
  }

  function callItem(key, sev, x, names) {
    const attrs = `data-group="${key}"`;
    if (key === "decide") {
      const href = x.repo ? `${repoUrl(x.repo)}/blob/main/HANDOFF.md` : `${GH}pm-tools/blob/main/STUDIO-STATUS.md`;
      const source = x.repo ? "Handoff notes" : "Studio status";
      const { head, rest } = splitDecision(x.text);
      // UX-C9: when the reason line names the source, no chip repeats it.
      const reason = rest
        ? `<div class="why" data-reason>${esc(noFiles(rest))}</div><div class="meta"><span class="chip">${source}</span></div>`
        : `<div class="why" data-reason>${x.repo ? `Handoff notes for ${esc(names.product(x.repo))}` : source}</div>`;
      return row(sev, attrs, `<strong>${esc(asCall(head))}</strong>${reason}`,
        link(href, x.repo ? "Open handoff notes" : "Open studio status"));
    }
    if (key === "dependabot") {
      const n = num(x.count);
      return row(sev, attrs, `<strong>${esc(plural(n, "Dependabot PR"))} in ${esc(x.repo)}</strong><div class="why">Dependency bumps, batched so they don't crowd the list</div>`,
        link(`${repoUrl(x.repo)}/pulls${DEPENDABOT_Q}`, `Review ${n}`));
    }
    const goal = x.goal ? `<span class="chip acc">${esc(names.goal(x.goal))}</span>` : `<span class="chip warn">Off-goal</span>`;
    return row(sev, attrs, `<strong>${esc(noFiles(bare(x.title)))}</strong><div class="why">${WHY[key]}</div><div class="meta"><span class="chip">${esc(x.repo)} #${num(x.number)}</span>${goal}</div>`,
      link(prUrl(x.repo, x.number), key === "merge" ? "Review and merge" : "Open PR", sev === 1));
  }

  function renderCallSheet(feed) {
    const cs = feed.callSheet || {};
    const list = (k) => cs[k] || [];
    const n = (k) => list(k).length;
    const goalNames = new Map((feed.goals || []).map((g) => [g.id, g.name]));
    const productNames = new Map((feed.products || []).map((p) => [p.repo, p.name]));
    const names = { goal: (id) => goalNames.get(id) || "Another goal", product: (repo) => productNames.get(repo) || repo };
    const bots = list("dependabot").reduce((s, d) => s + num(d.count), 0);
    const strip = `<div class="strip">
  <div class="panel stat"><b>${n("failing") + n("merge")}</b><span>PRs failing or ready to merge</span></div>
  <div class="panel stat"><b>${n("decide")}</b><span>Decisions only you can make</span></div>
  <div class="panel stat"><b>${n("idleDrafts")}</b><span>Drafts idle over 24h</span></div>
  <div class="panel stat"><b>${bots}</b><span>Dependabot PRs, batched</span></div>
</div>`;
    const groups = GROUPS.filter((g) => n(g.key) > 0).map((g) =>
      `<div class="panel callgroup"><div class="gh"><h2>${g.label}</h2><span class="count">${n(g.key)}</span></div>${list(g.key).map((x) => callItem(g.key, g.sev, x, names)).join("")}</div>`);
    const body = groups.length ? `<div class="stack">${groups.join("")}</div>` : `<div class="panel"><p class="empty">Nothing is waiting on you right now.</p></div>`;
    return `<h1>Call Sheet</h1>
<p class="lede">Everything waiting on you across the studio, one step each, worst first. Pulled from open PRs, the decisions in each product's handoff notes, and the studio status.</p>
${strip}
${body}`;
  }

  const callCount = (feed) => GROUPS.reduce((s, g) => s + ((feed.callSheet || {})[g.key] || []).length, 0);

  // ---------------------------------------------------------------- feed status (CON-10)

  // Age in whole minutes (a future time from clock skew counts as 0); no valid time is stale.
  function feedAge(feed, now) {
    const t = Date.parse(feed && feed.builtAt);
    if (!feed || !feed.builtAt || Number.isNaN(t)) return { minutes: null, stale: true };
    const minutes = Math.max(0, Math.floor((now.getTime() - t) / 60000));
    return { minutes, stale: minutes > STALE_MINUTES };
  }

  function ageText(m) {
    if (m < 60) return plural(m, "minute") + " old";
    const h = Math.floor(m / 60);
    return h < 48 ? plural(h, "hour") + " old" : plural(Math.floor(h / 24), "day") + " old";
  }

  function renderFeedStatus(feed, now) {
    const flag = feed.sample ? `<span class="flag">Sample feed</span>` : "";
    const age = feedAge(feed, now);
    if (age.minutes === null) {
      return `${flag}<span>Feed build time unknown</span><p class="stale" role="alert">This feed has no valid build time, so treat it as stale.</p>`;
    }
    const d = new Date(Date.parse(feed.builtAt));
    const when = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const time = `<time datetime="${esc(feed.builtAt)}">${esc(when)}</time>`;
    if (!age.stale) return `${flag}<span>Feed built ${time} · ${ageText(age.minutes)}</span>`;
    return `${flag}<p class="stale" role="alert">Stale feed: last built ${time}, ${ageText(age.minutes)}. It should update every hour.</p>`;
  }

  w.Console = { renderFocus, renderCallSheet, renderFeedStatus, feedAge };

  // ---------------------------------------------------------------- page (browser only)

  if (typeof document === "undefined") return;
  const $ = (id) => document.getElementById(id);
  // A Map, so a hash like #constructor can never pick a view.
  const VIEWS = new Map([
    ["focus", (f) => renderFocus(f)],
    ["calls", (f) => renderCallSheet(f)],
    ["slate", () => later("Build Slate", "Every product's stage, milestone and health, with its handoff notes in ten lines.")],
    ["horizon", () => later("Horizon Board", "Milestones for every product in Now, Next, Later and Done, by planning ID.")],
    ["agents", () => later("Agent Roster", "Agent runs per product and the gates on each open PR.")],
  ]);
  function later(title, what) {
    return `<h1>${title}</h1><p class="lede">${what}</p><div class="panel"><p class="empty">Not built yet.</p></div>`;
  }
  let feed = null;
  let state = "loading"; // loading | ready | failed

  function route() {
    const v = VIEWS.has(location.hash.slice(1)) ? location.hash.slice(1) : "focus";
    document.querySelectorAll("#nav a").forEach((a) => (a.dataset.v === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const main = $("main");
    if (state === "failed") {
      // CON-R11: a designed error with one way out.
      main.innerHTML = `<div class="panel pad stack" style="max-width:60ch"><h1>The feed didn't load</h1>
<p class="muted" style="margin:0">The console couldn't read studio.json. The hourly build may have failed, or the connection dropped.</p>
<div><button class="btn primary" type="button" id="retry">Retry</button></div></div>`;
      $("retry").addEventListener("click", load);
    } else if (state === "ready") main.innerHTML = (VIEWS.get(v) || VIEWS.get("focus"))(feed);
    else main.innerHTML = `<p class="muted">Loading the feed…</p>`;
  }

  function showStatus() {
    $("status").innerHTML = renderFeedStatus(feed, new Date());
    const off = (feed.offGoal || []).length;
    const calls = callCount(feed);
    $("nOff").textContent = off + " off-goal";
    $("nOff").hidden = off === 0;
    $("nCalls").textContent = String(calls);
    $("nCalls").hidden = calls === 0;
  }

  async function load() {
    state = "loading";
    route();
    try {
      const res = await fetch("studio.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      feed = await res.json();
      state = "ready";
      showStatus();
    } catch {
      feed = null;
      state = "failed";
      $("status").innerHTML = `<span>No feed</span>`;
    }
    route();
  }

  w.addEventListener("hashchange", () => { route(); w.scrollTo(0, 0); });
  setInterval(() => { if (feed) showStatus(); }, 60000);
  load();
})(window);
