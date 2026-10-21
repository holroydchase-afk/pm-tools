#!/usr/bin/env python3
"""Inbox for changes to shared master docs: check, show, and apply pending entries.

Usage (run from anywhere):
  python3 pending.py check              # validate every open entry (the "CI" step)
  python3 pending.py show <target> [N]  # open entries touching a file (and section N)
  python3 pending.py apply [--by NAME]  # merge pass: apply clean entries under a lock
  python3 pending.py baseline           # record the masters' current state (after a manual fix)

Defaults: inbox = this script's folder, root (where targets live) = its parent.
Override with --inbox DIR and --root DIR to reuse the process in another project.
Entry format is described in README.md in this folder.
"""
import argparse, datetime as dt, hashlib, json, os, re, shutil, sys, time

LOCK_NAME = ".merge-lock"
LOCK_STALE_SECONDS = 30 * 60
OPS = {"add-after", "replace", "remove", "new-file"}
DONE = {"merged", "dropped"}
STATE_NAME = ".master-state.json"
OLD_DAYS = 3


def masters(root):
    """Every master doc: the .md files directly in root."""
    return sorted(n for n in os.listdir(root) if n.endswith(".md") and os.path.isfile(os.path.join(root, n)))


def digest(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def save_state(root, inbox):
    state = {n: digest(os.path.join(root, n)) for n in masters(root)}
    json.dump(state, open(os.path.join(inbox, STATE_NAME), "w"), indent=1)


def drift(root, inbox):
    """Masters changed since the last merge or baseline, i.e. edited directly."""
    path = os.path.join(inbox, STATE_NAME)
    if not os.path.exists(path):
        return None
    state = json.load(open(path))
    now = {n: digest(os.path.join(root, n)) for n in masters(root)}
    return sorted(n for n in set(state) | set(now) if state.get(n) != now.get(n))


class Entry:
    def __init__(self, path, entry_id, start, end):
        self.path, self.id, self.start, self.end = path, entry_id, start, end
        self.fields, self.blocks = {}, {}

    def get(self, key, default=""):
        return self.fields.get(key, default).strip()

    @property
    def status(self):
        return self.get("status", "open").lower()

    @property
    def depends(self):
        return [d.strip() for d in self.get("depends").split(",") if d.strip()]


def parse_file(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    entries, cur, block, buf = [], None, None, []
    for i, line in enumerate(lines):
        if block is not None:
            if line.strip() == ">>>":
                cur.blocks[block] = "\n".join(buf)
                block, buf = None, []
            else:
                buf.append(line)
            continue
        if line.startswith("## "):
            if cur:
                cur.end = i
            cur = Entry(path, line[3:].strip(), i, len(lines))
            entries.append(cur)
        elif cur and line.startswith("<<<"):
            block = line[3:].strip()
        elif cur:
            m = re.match(r"^-?\s*([a-z]+):\s*(.*)$", line)
            if m and m.group(1) not in cur.fields:
                cur.fields[m.group(1)] = m.group(2)
    if block is not None:
        cur.fields["_error"] = f"block <<<{block} has no closing >>>"
    return entries


def load(inbox):
    entries = []
    for name in sorted(os.listdir(inbox)):
        if name.endswith(".md") and name.upper() not in {"README.md".upper()}:
            entries += parse_file(os.path.join(inbox, name))
    return entries


def read(path):
    return open(path, encoding="utf-8").read() if os.path.exists(path) else None


def problems(e, root, open_ids, all_ids):
    """Return a list of reasons this entry can't merge cleanly right now."""
    out = []
    if e.get("_error"):
        out.append(e.get("_error"))
    op, target = e.get("op"), e.get("target")
    if op not in OPS:
        out.append(f"op must be one of {sorted(OPS)}")
    if not target:
        return out + ["missing target"]
    text = read(os.path.join(root, target))
    if op == "new-file":
        if text is not None:
            out.append("new-file target already exists")
        if "new" not in e.blocks:
            out.append("missing <<<new block")
        return out
    if text is None:
        return out + [f"target {target} not found"]
    waits = [d for d in e.depends if d in open_ids]
    if waits:
        # base is expected to match only after the dependency merges
        return out + [f"waits on {d}" for d in waits]
    sec = e.get("section")
    if sec and not re.search(rf"^#{{1,4}} {re.escape(sec)}\.", text, re.M):
        out.append(f"section {sec} heading not found in {target}")
    base = e.blocks.get("base")
    if base is None:
        out.append("missing <<<base block")
    else:
        n = text.count(base)
        if n == 0:
            out.append("STALE: base text no longer in target (someone changed it); rebase the entry")
        elif n > 1:
            out.append(f"AMBIGUOUS: base text appears {n} times; quote more context")
    if op in {"add-after", "replace"} and "new" not in e.blocks:
        out.append("missing <<<new block")
    for d in e.depends:
        if d not in all_ids:
            out.append(f"depends on unknown entry {d}")
        elif d in open_ids:
            out.append(f"waits on {d}")
    return out


def overlaps(entries, root):
    """Pairs of open entries whose base text overlaps in the same target."""
    spans, found = {}, []
    for e in entries:
        base = e.blocks.get("base")
        text = read(os.path.join(root, e.get("target")))
        if not base or text is None or text.count(base) != 1:
            continue
        s = text.index(base)
        spans.setdefault(e.get("target"), []).append((s, s + len(base), e))
    for items in spans.values():
        items.sort(key=lambda x: x[0])
        for i, (s1, e1, a) in enumerate(items):
            for s2, e2, b in items[i + 1:]:
                if s2 < e1 and not (a.get("op") == b.get("op") == "add-after"):
                    found.append((a, b))
    return found


def cmd_check(entries, root, inbox):
    open_e = [e for e in entries if e.status == "open"]
    open_ids, all_ids = {e.id for e in open_e}, {e.id for e in entries}
    dupes = {i for i in all_ids if sum(e.id == i for e in entries) > 1}
    bad = 0
    for e in open_e:
        p = problems(e, root, open_ids - {e.id}, all_ids)
        if e.id in dupes:
            p.append("duplicate entry id")
        waiting = p and all(x.startswith("waits on") for x in p)
        tag = "OK  " if not p else "WAIT" if waiting else "FAIL"
        bad += bool(p) and not waiting
        print(f"{tag} {e.id}  [{os.path.basename(e.path)}] {e.get('op')} {e.get('target')} §{e.get('section') or '-'}")
        for x in p:
            print(f"       - {x}")
    for a, b in overlaps(open_e, root):
        bad += 1
        print(f"CONFLICT {a.id} and {b.id} change the same text in {a.get('target')}; merge decides order or asks the owner")
    others = [e for e in entries if e.status not in {"open"} | DONE]
    for e in others:
        print(f"HOLD {e.id} status={e.status}")
    today = dt.date.today()
    for e in open_e:
        try:
            age = (today - dt.date.fromisoformat(e.get("date"))).days
        except ValueError:
            age = 0
        if age > OLD_DAYS:
            print(f"OLD  {e.id} has waited {age} days; time for a merge pass")
    changed = drift(root, inbox)
    if changed is None:
        print("NOTE no baseline yet; the first apply (or `baseline`) records one")
    elif changed:
        bad += 1
        print("DRIFT edited directly since the last merge, not through the inbox: " + ", ".join(changed))
        print("      the merge pass should check what changed, then run `baseline` once it's accepted")
    print(f"\n{len(open_e)} open, {bad} problem(s)")
    if len(open_e) >= 10:
        print("10+ open entries: run a merge pass")
    return bad


def cmd_show(entries, target, section):
    hits = [e for e in entries if e.status not in DONE and os.path.basename(e.get("target")) == os.path.basename(target)
            and (not section or e.get("section") == section)]
    for e in hits:
        print(f"## {e.id}  ({e.status}, {e.get('date')}, {e.get('by')})\n   op={e.get('op')} §{e.get('section')}  why: {e.get('why')}")
        for k in ("base", "new"):
            if k in e.blocks:
                print(f"   <<<{k}\n" + "\n".join("   | " + l for l in e.blocks[k].split("\n")))
    if not hits:
        print("no unmerged entries")


def take_lock(inbox, who):
    path = os.path.join(inbox, LOCK_NAME)
    if os.path.exists(path) and time.time() - os.path.getmtime(path) > LOCK_STALE_SECONDS:
        os.remove(path)
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        sys.exit(f"merge already running: {open(path).read().strip()}")
    token = f"{who} {os.getpid()} {dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}\n"
    os.write(fd, token.encode())
    os.close(fd)
    # the shared folder is a network mount, so confirm no one else grabbed the lock at the same moment
    time.sleep(3)
    if open(path).read() != token:
        sys.exit("lost the merge lock to another session; try again later")
    return path


def set_status(e, status, note=""):
    lines = open(e.path, encoding="utf-8").read().split("\n")
    head = next(i for i, l in enumerate(lines) if l.startswith("## ") and l[3:].strip() == e.id)
    end = next((i for i in range(head + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    val = status + (f" ({note})" if note else "")
    for i in range(head + 1, end):
        if re.match(r"^-?\s*status:", lines[i]):
            lines[i] = re.sub(r"status:.*", f"status: {val}", lines[i])
            break
    else:
        lines.insert(head + 1, f"status: {val}")
    open(e.path, "w", encoding="utf-8").write("\n".join(lines))


def cmd_apply(entries, root, inbox, who):
    lock = take_lock(inbox, who)
    today = dt.date.today().isoformat()
    changed = drift(root, inbox)
    if changed:
        print("WARNING edited directly since the last merge: " + ", ".join(changed) + " (merging on top; review those edits)")
    stamp = dt.datetime.now().strftime("%Y-%m-%d-%H%M%S")
    backup = os.path.join(inbox, "merged", "backup", stamp)
    try:
        merged, held = [], []
        pending = sorted([e for e in entries if e.status == "open"], key=lambda e: (e.get("date"), e.path, e.start))
        all_ids = {e.id for e in entries}
        # overlapping edits never merge first-come-first-served; a person or the merger decides
        for a, b in overlaps(pending, root):
            for x, y in ((a, b), (b, a)):
                if x in pending:
                    pending.remove(x)
                    set_status(x, "conflict", f"overlaps {y.id}")
                    held.append((x, [f"overlaps {y.id}"]))
        progress = True
        while progress:
            progress = False
            for e in list(pending):
                open_ids = {x.id for x in pending if x is not e} | {h.id for h, _ in held}
                p = problems(e, root, open_ids, all_ids)
                if p and all(x.startswith("waits on") for x in p):
                    continue
                pending.remove(e)
                progress = True
                if p:
                    set_status(e, "conflict", "; ".join(p))
                    held.append((e, p))
                    continue
                tpath = os.path.join(root, e.get("target"))
                if os.path.exists(tpath) and not os.path.exists(os.path.join(backup, e.get("target"))):
                    os.makedirs(os.path.dirname(os.path.join(backup, e.get("target"))), exist_ok=True)
                    shutil.copy2(tpath, os.path.join(backup, e.get("target")))
                text, op, new = read(tpath), e.get("op"), e.blocks.get("new", "")
                if op == "new-file":
                    os.makedirs(os.path.dirname(tpath), exist_ok=True)
                    text = new + "\n"
                else:
                    base = e.blocks["base"]
                    repl = {"add-after": base + "\n" + new, "replace": new, "remove": ""}[op]
                    text = text.replace(base, repl, 1)
                open(tpath, "w", encoding="utf-8").write(text)
                set_status(e, "merged", today)
                merged.append(e)
        for e in pending:
            set_status(e, "conflict", "dependency never merged")
            held.append((e, ["dependency never merged"]))
        archive = os.path.join(inbox, "merged")
        os.makedirs(archive, exist_ok=True)
        for path in {e.path for e in entries}:
            if all(x.status in DONE or x in merged for x in entries if x.path == path):
                os.replace(path, os.path.join(archive, os.path.basename(path)))
        print(f"merged {len(merged)}: " + ", ".join(f"{e.id}→{e.get('target')}" for e in merged))
        for e, p in held:
            print(f"held {e.id}: " + "; ".join(p))
        touched = sorted({e.get("target") for e in merged})
        if touched:
            print("re-read these after ~10s to confirm the writes stuck: " + ", ".join(touched))
            print(f"pre-merge copies are in {os.path.relpath(backup, root)}")
        save_state(root, inbox)
    finally:
        os.remove(lock)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "show", "apply", "baseline"])
    ap.add_argument("args", nargs="*")
    ap.add_argument("--inbox", default=here)
    ap.add_argument("--root", default=os.path.dirname(here))
    ap.add_argument("--by", default="merge-pass")
    a = ap.parse_args()
    entries = load(a.inbox)
    if a.cmd == "baseline":
        save_state(a.root, a.inbox)
        print("recorded the current state of: " + ", ".join(masters(a.root)))
        return
    if a.cmd == "check":
        sys.exit(1 if cmd_check(entries, a.root, a.inbox) else 0)
    if a.cmd == "show":
        if not a.args:
            sys.exit("show needs a target file name")
        cmd_show(entries, a.args[0], a.args[1] if len(a.args) > 1 else "")
    else:
        cmd_apply(entries, a.root, a.inbox, a.by)


if __name__ == "__main__":
    main()
