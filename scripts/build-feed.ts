// Builds the Studio Console feed (PMT-M3) from the public repos in console.config.json and the
// goals in goals.json. Writes studio.json; skipped repos are reported on stderr, never in the feed.
// PRIVATE_DENYLIST (optional, as for check:private) names terms that must never be published.
// Usage: GITHUB_TOKEN=<optional> node scripts/build-feed.ts [--out <path>]   (default _site/console/studio.json)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeed } from "./feed/core.ts";
import { fetchFeedInput, type ConsoleConfig } from "./feed/fetch.ts";
import type { Goal } from "./feed/types.ts";
import { loadDenylist } from "./check-private.ts";
import { scanText } from "./private-patterns.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = <T>(f: string): T => JSON.parse(readFileSync(join(ROOT, f), "utf8")) as T;

const outFlag = process.argv.indexOf("--out");
const out = resolve(outFlag >= 0 && process.argv[outFlag + 1] ? process.argv[outFlag + 1] : join(ROOT, "_site", "console", "studio.json"));

const config = readJson<ConsoleConfig>("console.config.json");
const { input: fetched, skipped } = await fetchFeedInput(config, readJson<Goal[]>("goals.json"), process.env.GITHUB_TOKEN);
// Feed items naming an unreadable repo or a denylisted term are dropped by core (CON-R2, CON-R4).
const deny = loadDenylist(process.env.PRIVATE_DENYLIST);
const agents = readdirSync(join(ROOT, ".claude", "agents")).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)).sort();
const repoNames = Object.fromEntries(config.products.map((p) => [p.repo, p.name]));
const input = { ...fetched, privateRepos: [...(fetched.privateRepos ?? []), ...deny], agents, repoNames };
for (const s of skipped) console.warn(`build-feed: skipped ${s.repo}: ${s.reason}`);
if (input.products.length === 0) { console.error("build-feed: no repo could be read; studio.json not written."); process.exit(1); }

const feed = buildFeed(input, new Date());
const json = JSON.stringify(feed, null, 2) + "\n";
// Last guard (CON-7): core already redacts, but never write a feed check:private would reject.
// Only data that came from GitHub is checked: goals.json and the config are trusted, and a goal
// name may well mention an unreadable repo ("Hearth beta"), which must not block the feed (CON-R2).
const hits = scanText(JSON.stringify({ ...feed, goals: [] }), input.privateRepos);
if (hits.length) { console.error(`build-feed: ${hits.length} private-data hit(s) in the feed; not written.`); process.exit(1); }

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
console.log(`build-feed: ${input.products.length} repos, ${skipped.length} skipped -> ${out}`);
