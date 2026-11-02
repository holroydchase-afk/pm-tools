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
  // UX-S2: HANDOFF bullets are markdown; the page shows plain text. Links keep their words.
  const plain = (t) => String(t).replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim();
  const firstSentence = (t) => { const m = /^(.+?[.!?])(?=\s|$)/.exec(t); return m ? m[1] : t; };
  // At most n characters, cut at a word with an ellipsis.
  const clip = (t, n) => (t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
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
    // UX-S4: under 10 PRs and runs, a percent split says more than the data does.
    const items = feed.workItems === undefined ? null : num(feed.workItems);
    const tooLittle = items !== null && items < 10;
    const bar = shown.map((p) => `<span class="${p.cls}" data-segment="${esc(p.id)}" data-share="${p.share}" style="width:${p.share}%" title="${esc(p.name)} ${p.share}%">${p.share}%</span>`).join("");
    const legend = shown.length
      ? `<div class="legend">${shown.map((p) => `<span><i class="${p.cls}"></i>${esc(p.name)}</span>`).join("")}</div>`
      : `<p class="muted" style="margin:0">No open PRs or agent runs in the last 7 days.</p>`;
    const cards = goals.map((g, i) => {
      const share = pct(g.effort);
      const p = progressOf(g.progress, feed.builtAt);
      // UX-C1: progress is the headline when the goal has one; the week's share is then one small line.
      // UX-C11: no progress, no card bar (the share already has the bar at the top).
      // UX-S11: under 10 items the week's share means little, so it isn't shown.
      const head = p
        ? `<div class="big">${esc(p.text)}</div>${tooLittle ? "" : `<div class="muted small">${share}% of this week's work</div>`}`
        : tooLittle
          ? `<div class="muted small">Progress kept private</div>`
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
    const offN = off.reduce((s, o) => s + (o.kind === "pr" ? 1 : num(o.count)), 0);
    const offCount = items === null ? "" : ` · ${offN} of ${items} this week`;
    const offItems = off.length
      ? off.map((o) => o.kind === "pr"
        ? row(2, "data-offgoal-item", `<strong title="${esc(o.title)}">${esc(noFiles(bare(o.title)))}</strong><div class="meta"><span class="chip">${esc(o.repo)} #${num(o.number)}</span></div>`, link(prUrl(o.repo, o.number), "Open PR"))
        : row(2, "data-offgoal-item", `<strong>${esc(plural(num(o.count), "agent run"))} on ${esc(o.repo)}</strong><div class="why">Runs on a branch with no open PR tied to a goal</div>`, link(repoUrl(o.repo), "Open repo"))).join("")
      : `<p class="empty">Nothing off-goal this week.</p>`;
    return `<h1>Focus</h1>
<p class="lede">Where this week's work went, measured against your goals. Each open PR and agent run is matched to a goal by its planning ID or repo; anything that matches none lands in Off-goal.</p>
<div class="stack">
  <div class="panel pad stack">
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><h2>This week's work by goal</h2><span class="src">Open PRs and agent runs, last 7 days</span></div>
    ${tooLittle
      ? `<p class="muted" style="margin:0">Too little work this week to split. ${esc(plural(items, "open PR or agent run", "open PRs and agent runs"))} so far.</p>`
      : `<div class="effort" role="img" aria-label="Work split by goal">${bar}</div>
    ${legend}`}
  </div>
  <div class="goals">${cards}</div>
  <div class="panel" data-offgoal-list>
    <div class="pad" style="padding-bottom:4px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><h2>Off-goal: possible rabbit holes</h2><span class="src">Work that matches no goal${offCount}</span></div>
    ${offItems}
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
  const MAX_ROWS = 10;
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
    // UX-S10: "Decide on" only fits a question; a statement is something to review.
    const first = t.split(/\s/)[0] || "";
    const lower = /^[A-Z][a-z]+$/.test(first) ? t[0].toLowerCase() + t.slice(1) : t; // keep acronyms and names like "iOS"
    return /\?$/.test(t) ? "Decide on " + lower : "Review: " + t;
  }

  // UX-S10: a reason worth a line is a whole sentence: 4 words or more, not ending on a dangling word.
  const DANGLING = /\b(?:is|are|was|were|be|the|a|an|to|of|in|on|for|with|and|or|but|from|by|at)[.!?]?$/i;
  const wholeSentence = (t) => t.split(/\s+/).length >= 4 && !DANGLING.test(t);

  function callItem(key, sev, x, names) {
    const attrs = `data-group="${key}"`;
    if (key === "decide") {
      const href = x.repo ? `${repoUrl(x.repo)}/blob/main/HANDOFF.md` : `${GH}pm-tools/blob/main/STUDIO-STATUS.md`;
      // UX-S3: plain text, no leading date, call and reason at most 120 characters each.
      const { head, rest } = splitDecision(plain(x.text).replace(/^\d{4}-\d{2}-\d{2}:\s*/, ""));
      // UX-S10: no source chip (the button names the source); a fragment reason gives way to the source.
      const why = rest && wholeSentence(noFiles(rest)) ? clip(noFiles(rest), 120) : null;
      const reason = `<div class="why" data-reason>${why !== null ? esc(why) : x.repo ? `Handoff notes for ${esc(names.product(x.repo))}` : "Listed in the Studio status"}</div>`;
      const more = x.more ? `<button class="btn" type="button" data-product="${esc(x.repo)}" aria-haspopup="dialog">${num(x.more)} more from ${esc(names.product(x.repo))}</button>` : "";
      return row(sev, attrs, `<strong>${esc(clip(asCall(head), 120))}</strong>${reason}`,
        link(href, x.repo ? "Open handoff notes" : "Open studio status") + more);
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
    // UX-S3: Decide shows one call per product (the rest are in its drawer) and 3 from studio status;
    // no group shows more than 10 rows.
    const rowsOf = (k) => {
      if (k !== "decide") return list(k);
      const out = [];
      const byRepo = new Map();
      let studio = 0;
      for (const d of list(k)) {
        if (d.repo === null || d.repo === undefined) { if (studio++ < 3) out.push(d); continue; }
        const first = byRepo.get(d.repo);
        if (first) { first.more++; continue; }
        const item = { ...d, more: 0 };
        byRepo.set(d.repo, item);
        out.push(item);
      }
      // A "more" button opens the product's drawer, so only products on the slate get one.
      for (const item of out) if (item.more && !productNames.has(item.repo)) item.more = 0;
      return out;
    };
    const groups = GROUPS.filter((g) => n(g.key) > 0).map((g) => {
      const rows = rowsOf(g.key);
      const hidden = Math.max(0, rows.length - MAX_ROWS);
      const tail = hidden ? `<p class="empty small">${esc(plural(hidden, "more item"))} not shown here.</p>` : "";
      return `<div class="panel callgroup"><div class="gh"><h2>${g.label}</h2><span class="count">${n(g.key)}</span></div>${rows.slice(0, MAX_ROWS).map((x) => callItem(g.key, g.sev, x, names)).join("")}${tail}</div>`;
    });
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

  // ---------------------------------------------------------------- Build Slate and drawer (CON-12, CON-13)

  const TRACK = [["idea", "Idea"], ["building", "Building"], ["beta", "Beta"], ["live", "Live"], ["parked", "Parked"]];
  const HEALTH = { ok: { cls: "ok", mark: "●" }, warn: { cls: "warn", mark: "▲" }, bad: { cls: "bad", mark: "■" } };
  const handoffUrl = (repo) => `${repoUrl(repo)}/blob/main/HANDOFF.md`;
  // UX-S6: one stage vocabulary, the track's words; a stage off the track shows no word.
  const stageWord = (p) => (TRACK.find(([k]) => k === p.track) || [])[1] || "";
  // UX-S13: no run log read anywhere yet (the logs aren't wired up), so "none" and "missing" would mislead.
  const anyLogs = (feed) => (feed.products || []).some((p) => p.lastRun);
  const isActive = (p) => p.track !== "parked" && !p.group;
  const capOf = (feed) => { const n = num(feed.wipCap); return n > 0 ? n : 5; };
  const waitingOn = (feed, repo) => ((feed.callSheet || {}).decide || []).filter((d) => d.repo === repo).length;

  // "3h ago" from the feed's build time; null for a time after it or no valid time.
  function agoText(at, builtAt) {
    const m = Math.floor((Date.parse(builtAt) - Date.parse(at)) / 60000);
    if (Number.isNaN(m) || m < 0) return null;
    if (m < 60) return m < 1 ? "just now" : `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  function trackOf(p) {
    const cur = TRACK.findIndex(([k]) => k === p.track);
    const bars = TRACK.map(([k], i) => `<span data-step="${k}"${i === cur ? ` class="cur" aria-current="step"` : i < cur && p.track !== "parked" ? ` class="done"` : ""}></span>`).join("");
    const labels = TRACK.map(([, label]) => `<span>${label}</span>`).join("");
    return `<span class="trk"><span class="track">${bars}</span><span class="tracklbl" aria-hidden="true">${labels}</span></span>`;
  }

  function productCard(feed, p) {
    const h = HEALTH[p.health && p.health.level] || HEALTH.ok;
    const waiting = waitingOn(feed, p.repo);
    const last = p.lastRun
      ? `${esc(p.lastRun.agent)}${agoText(p.lastRun.at, feed.builtAt) ? " · " + agoText(p.lastRun.at, feed.builtAt) : ""}`
      : "none";
    const group = p.group ? `<span class="chip" title="Not counted in the cap">${esc(p.group)}</span>` : "";
    // UX-S2: the card shows a plain first sentence (at most 140 characters); the drawer has the rest.
    const short = (t) => clip(firstSentence(plain(t)), 140);
    const kv = [["Milestone", p.milestone, ""], ["Now", (p.now || [])[0], "now"], ["Next", (p.next || [])[0], "next"]]
      .filter(([, v]) => v).map(([k, v, line]) => `<span class="k">${k}</span><span class="v"${line ? ` data-line="${line}"` : ""}>${esc(line ? short(v) : v)}</span>`).join("");
    const word = stageWord(p);
    // UX-S8: the button's name is short; the card's details are read in the drawer.
    const label = `${p.name}, ${word ? word + ", " : ""}open details`;
    return `<button class="panel prod" type="button" data-product="${esc(p.repo)}" aria-haspopup="dialog" aria-label="${esc(label)}">
      <span class="row"><span class="pname">${esc(p.name)}</span>${group}<span class="code">${esc(p.code)}</span></span>
      ${trackOf(p)}
      ${kv ? `<span class="kv">${kv}</span>` : `<span class="muted small">No status in the handoff notes yet</span>`}
      <span class="sig">
        <span class="chip ${h.cls}" data-health="${h.cls}"><span aria-hidden="true">${h.mark}</span> ${esc((p.health && p.health.note) || "")}</span>
        ${waiting ? `<span class="chip acc">${waiting} waiting on you</span>` : ""}
        <span class="chip">${esc(plural(num(p.openPrs), "PR"))}</span><span class="chip">${esc(plural(num(p.intakes), "new idea"))}</span>
      </span>
      ${anyLogs(feed) ? `<span class="src">Last agent run: ${last}</span>` : ""}
    </button>`;
  }

  function renderSlate(feed) {
    const products = feed.products || [];
    const active = products.filter(isActive).length;
    const cap = capOf(feed);
    const over = active > cap;
    const pips = Array.from({ length: Math.max(active, cap) }, (_, i) => `<i class="${i >= cap ? "over" : i < active ? "on" : ""}"></i>`).join("");
    const note = over
      ? `Park one, or raise the cap.`
      : `Parked products and studio tools don't count.`;
    const cards = products.length
      ? `<div class="slate">${products.map((p) => productCard(feed, p)).join("")}</div>`
      : `<div class="panel"><p class="empty">No products in the feed.</p></div>`;
    return `<h1>Build Slate</h1>
<p class="lede">Every product's stage and health, read from its repo each hour. Open a product for its handoff notes in ten lines.</p>
<div class="wip panel pad" data-wip data-active="${active}" data-cap="${cap}"${over ? " data-over" : ""}>
  <strong>Active products</strong>
  <span class="pips" aria-hidden="true">${pips}</span>
  <span class="chip${over ? " warn" : ""}">${active} of ${cap} cap</span>
  <span class="muted small">${note}</span>
</div>
${cards}`;
  }

  // Summary at most 10 lines (CON-13): up to 2 each of now, next and blockers. Every decision the
  // Call Sheet holds for the product follows in its own section, uncapped (CON-R16).
  function renderDrawer(feed, repo) {
    const p = (feed.products || []).find((x) => x.repo === repo);
    if (!p) return "";
    const two = (xs) => (xs || []).slice(0, 2);
    const parts = [["Now", two(p.now)], ["Exact next step", two(p.next)], ["Blockers", two(p.blockers)]]
      .filter(([, xs]) => xs.length);
    const summary = parts.length
      ? parts.map(([h, xs]) => `<div><h3>${h}</h3><ul>${xs.map((x) => `<li>${esc(plain(x))}</li>`).join("")}</ul></div>`).join("")
      : `<ul><li class="muted">No status in the handoff notes yet.</li></ul>`;
    const src = "From the product's handoff notes";
    const ds = ((feed.callSheet || {}).decide || []).filter((d) => d.repo === p.repo);
    const decisions = ds.length
      ? `<div data-decisions><h3>Decisions waiting on you</h3><ul>${ds.map((d) => `<li>${esc(plain(d.text).replace(/^\d{4}-\d{2}-\d{2}:\s*/, ""))}</li>`).join("")}</ul></div>`
      : "";
    const word = stageWord(p);
    return `<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dTitle" data-drawer="${esc(p.repo)}">
  <div class="row"><h2 id="dTitle">${esc(p.name)}</h2>${word ? `<span class="chip acc" data-stage>${word}</span>` : ""}<button class="btn" type="button" data-close>Close</button></div>
  <p class="src">${src}</p>
  <div class="stack summary" data-summary>${summary}</div>
  ${decisions}
  <div class="acts">${link(handoffUrl(p.repo), "Open handoff notes", true)}${link(repoUrl(p.repo), "Open repo")}<a class="btn" href="#horizon">See on Horizon Board</a></div>
</aside>`;
  }

  // ---------------------------------------------------------------- Horizon Board (CON-14)

  const COLS = [["now", "Now"], ["next", "Next"], ["later", "Later"], ["done", "Done this week"]];

  function hzCard(repo, c) {
    const pr = c.pr ? `<a class="pr tap" href="${esc(prUrl(repo, c.pr))}" target="_blank" rel="noopener">PR #${num(c.pr)} ↗</a>` : "";
    return `<div class="card" data-card${c.id ? ` data-id="${esc(c.id)}"` : ""}>${c.id ? `<span class="id">${esc(c.id)}</span>` : ""}<span class="t">${esc(clip(String(c.title), 140))}</span>${pr}</div>`;
  }

  function renderHorizon(feed) {
    const names = new Map((feed.products || []).map((p) => [p.repo, p.name]));
    const rows = feed.horizon || [];
    const head = `<div class="colh rowh">Product</div>${COLS.map(([k, label]) => `<div class="colh${k === "now" ? " now" : ""}">${label}</div>`).join("")}`;
    const body = rows.map((r) => `<div class="hzrow" data-hz-row="${esc(r.repo)}"><div class="rowh">${esc(names.get(r.repo) || r.repo)}</div>${COLS.map(([k, label]) => {
      const cards = r[k] || [];
      return `<div class="cell${k === "now" ? " now" : ""}" data-col="${k}" aria-label="${label}">${cards.map((c) => hzCard(r.repo, c)).join("")}</div>`;
    }).join("")}</div>`).join("");
    return `<h1>Horizon Board</h1>
<p class="lede">Milestones for every product on one board, by planning ID. A card moves to Done when its PR merges, not when someone drags it.</p>
${rows.some((r) => COLS.some(([k]) => (r[k] || []).length)) ? `<div class="board hz" tabindex="0" role="region" aria-label="Horizon Board, scrolls sideways"><div class="hzgrid">${head}${body}</div></div>` : `<div class="panel"><p class="empty">Milestones appear once each product's plan is read.</p></div>`}`;
  }

  // ---------------------------------------------------------------- Agent Roster (CON-15)

  const CORE = ["staff-pm", "qa-tdd", "engineer", "ux-reviewer", "privacy-security"];
  const SHORT = { "privacy-security": "privacy", "story-keeper": "story", positioning: "Copy" };
  const GATE_LABEL = { "staff-pm": "Scoped", "qa-tdd": "Tested", engineer: "Built", "ux-reviewer": "UX", "privacy-security": "Privacy", positioning: "Copy" };
  const GATE_WORD = { ok: "passed", missing: "missing from run log", unlogged: "Not logged yet" };
  const GATE_TIP = { ok: "the PR says it ran, and its run log shows it", missing: "the PR says it ran, but its run log doesn't show it", unlogged: "the PR says it ran; run logs aren't read yet" };
  const heat = (n) => (n === 0 ? "heat0" : n < 3 ? "heat1" : n < 6 ? "heat2" : "heat3");

  function renderRoster(feed) {
    const products = feed.products || [];
    const runs = feed.runs || {};
    const gates = feed.gates || [];
    const extra = new Set();
    for (const m of Object.values(runs)) for (const a of Object.keys(m)) if (!CORE.includes(a)) extra.add(a);
    for (const g of gates) for (const a of Object.keys(g.gates || {})) if (!CORE.includes(a)) extra.add(a);
    const agents = [...CORE, ...[...extra].sort()];
    const runRows = products.map((p) => `<tr data-runs-row="${esc(p.repo)}"><th scope="row">${esc(p.name)}</th>${agents.map((a) => {
      const n = num((runs[p.repo] || {})[a]);
      return `<td class="n ${heat(n)}" data-agent="${esc(a)}">${n}</td>`;
    }).join("")}</tr>`).join("");
    const anyRuns = products.some((p) => Object.values(runs[p.repo] || {}).some((n) => num(n) > 0));
    const runTable = `<table><thead><tr><th scope="col">Product</th>${agents.map((a) => `<th scope="col" title="${esc(a)}">${esc(SHORT[a] || a)}</th>`).join("")}</tr></thead><tbody>${runRows}</tbody></table>`;
    const titles = new Map();
    const cs = feed.callSheet || {};
    for (const k of ["merge", "failing", "inProgress", "idleDrafts"]) for (const x of cs[k] || []) titles.set(`${x.repo}#${num(x.number)}`, x.title);
    const logs = anyLogs(feed);
    const gateRows = gates.map((g) => {
      const key = `${g.repo}#${num(g.number)}`;
      // UX-S7: only gates that ran or should have; skipped and unnamed ones are left out.
      // UX-S13: with no run log read anywhere, a gate the PR names reads "Not logged yet", not missing.
      const cells = Object.entries(g.gates || {}).filter(([, st]) => GATE_WORD[st]).map(([a, raw]) => {
        const st = logs ? raw : "unlogged";
        const cls = st === "ok" ? "ok" : st === "missing" ? "bad" : "";
        return `<span class="gate ${cls}" data-gate="${esc(a)}" data-state="${st}" title="${esc(a)}: ${GATE_TIP[st]}">${esc(GATE_LABEL[a] || a)}: ${GATE_WORD[st]}</span>`;
      }).join("")
        || `<span class="muted small">No gates needed</span>`;
      const title = titles.has(key) ? esc(noFiles(bare(titles.get(key)))) : "";
      return `<tr data-gate-row="${esc(key)}"><td class="nowrap"><a class="tap" href="${esc(prUrl(g.repo, g.number))}" target="_blank" rel="noopener">${esc(g.repo)} #${num(g.number)} ↗</a></td><td class="what">${title}</td><td><div class="pipe">${cells}</div></td></tr>`;
    }).join("");
    const gateTable = gates.length
      ? `<div class="gates"><table><thead><tr><th scope="col">PR</th><th scope="col">What</th><th scope="col">Gates</th></tr></thead><tbody>${gateRows}</tbody></table></div>`
      : `<p class="empty">No open PRs to check.</p>`;
    return `<h1>Agent Roster</h1>
<p class="lede">Who on the team ran this week, and whether each open PR really passed its gates. Runs come from each branch's run log; a gate passes when the PR says the agent ran and the log shows it.</p>
<div class="grid2">
  <div class="panel">
    <div class="pad" style="padding-bottom:0"><h2>Runs in the last 7 days</h2><p class="src" style="margin:4px 0 8px">From the run log on each open PR's branch</p></div>
    ${anyRuns ? `<div class="tablewrap">${runTable}</div>` : `<p class="empty">No agent runs logged this week.</p>`}
  </div>
  <div class="panel pad stack" data-evals>
    <h2>Eval scores</h2>
    <p class="muted" style="margin:0"><span class="chip">No evals yet</span></p>
    <p class="src" style="margin:0">Scores show here once the studio-agents evals run. Until then no agent is scored.</p>
  </div>
</div>
<div class="panel" style="margin-top:16px">
  <div class="pad" style="padding-bottom:0"><h2>Gates on open PRs</h2><p class="src" style="margin:4px 0 8px">Missing means the PR says the agent ran, but its run log doesn't show it.</p></div>
  ${gateTable}
</div>`;
  }

  w.Console = { renderFocus, renderCallSheet, renderFeedStatus, feedAge, renderSlate, renderDrawer, renderHorizon, renderRoster };

  // ---------------------------------------------------------------- page (browser only)

  if (typeof document === "undefined") return;
  const $ = (id) => document.getElementById(id);
  // A fixed switch, so nothing in the URL hash can pick which function runs.
  const VIEW_IDS = ["focus", "calls", "slate", "horizon", "agents"];
  function renderView(v, f) {
    switch (v) {
      case "calls": return renderCallSheet(f);
      case "slate": return renderSlate(f);
      case "horizon": return renderHorizon(f);
      case "agents": return renderRoster(f);
      default: return renderFocus(f);
    }
  }
  let feed = null;
  let state = "loading"; // loading | ready | failed

  function route() {
    const v = VIEW_IDS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "focus";
    document.querySelectorAll("#nav a").forEach((a) => (a.dataset.v === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const main = $("main");
    if (state === "failed") {
      // CON-R11: a designed error with one way out.
      main.innerHTML = `<div class="panel pad stack" style="max-width:60ch"><h1>The feed didn't load</h1>
<p class="muted" style="margin:0">The console couldn't read studio.json. The hourly build may have failed, or the connection dropped.</p>
<div><button class="btn primary" type="button" id="retry">Retry</button></div></div>`;
      $("retry").addEventListener("click", load);
    } else if (state === "ready") main.innerHTML = renderView(v, feed);
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

  // ---------------------------------------------------------------- product drawer (CON-13)

  let opener = null; // the card that opened the drawer; focus goes back to it
  function openDrawer(card) {
    const html = renderDrawer(feed, card.dataset.product);
    if (!html) return;
    opener = card;
    $("drawer").innerHTML = html;
    $("drawer").hidden = false;
    $("scrim").hidden = false;
    document.body.classList.add("locked");
    $("drawer").querySelector("[data-close]").focus();
  }
  function closeDrawer(restore) {
    if ($("drawer").hidden) return;
    $("drawer").hidden = true;
    $("scrim").hidden = true;
    $("drawer").innerHTML = "";
    document.body.classList.remove("locked");
    if (restore && opener && document.contains(opener)) opener.focus();
    opener = null;
  }
  $("main").addEventListener("click", (e) => {
    const card = e.target.closest("button[data-product]");
    if (card) openDrawer(card);
  });
  $("drawer").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeDrawer(true);
    else if (e.target.closest('a[href^="#"]')) closeDrawer(false);
  });
  $("scrim").addEventListener("click", () => closeDrawer(true));
  document.addEventListener("keydown", (e) => {
    if ($("drawer").hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(true); return; }
    if (e.key !== "Tab") return;
    // Keep Tab inside the open dialog.
    const f = [...$("drawer").querySelectorAll("a[href], button")];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  w.addEventListener("hashchange", () => { closeDrawer(false); route(); w.scrollTo(0, 0); });
  setInterval(() => { if (feed) showStatus(); }, 60000);
  load();
})(window);
