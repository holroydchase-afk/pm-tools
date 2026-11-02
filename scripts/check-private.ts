// Fails if any file git would commit contains personal data. This repo is public.
// Checks generic patterns (emails, phone numbers, claude.ai artifact links, scheduled-task ids,
// Gmail links) plus an optional private denylist of names kept OUTSIDE the repo:
//   PRIVATE_DENYLIST=/path/to/denylist.txt npm run check:private
// Usage: node scripts/check-private.ts [--staged]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { scanText } from "./private-patterns.ts";

// The patterns live in a pure module so the feed builder can share them; re-exported for callers.
export { PATTERNS, scanText } from "./private-patterns.ts";

export function loadDenylist(path: string | undefined): string[] {
  if (!path || !existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
}

function filesToCheck(staged: boolean): string[] {
  const git = (...a: string[]) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
  if (staged) return git("diff", "--cached", "--name-only", "--diff-filter=ACMR");
  return [...new Set([...git("ls-files"), ...git("ls-files", "--others", "--exclude-standard")])];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const staged = process.argv.includes("--staged");
  const denyPath = process.env.PRIVATE_DENYLIST;
  const deny = loadDenylist(denyPath);
  if (!deny.length) console.warn("check-private: no PRIVATE_DENYLIST loaded; checking generic patterns only.");
  let bad = 0;
  for (const f of filesToCheck(staged)) {
    if (!existsSync(f) || /\.(png|jpe?g|gif|webp|ico|woff2?)$/i.test(f) || f === "package-lock.json") continue;
    const text = staged ? execFileSync("git", ["show", ":" + f], { encoding: "utf8" }) : readFileSync(f, "utf8");
    for (const h of scanText(text, deny)) {
      bad++;
      // Never echo denylisted terms back in full: logs can be public too.
      const shown = h.kind === "denylisted term" ? h.match.slice(0, 2) + "…" : h.match;
      console.error(`${f}: ${h.kind}: ${shown}`);
    }
  }
  if (bad) { console.error(`check-private: ${bad} problem(s). Remove personal data before committing.`); process.exit(1); }
  console.log("check-private: clean");
}
