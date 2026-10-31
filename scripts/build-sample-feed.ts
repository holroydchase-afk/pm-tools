// Writes console/sample-studio.json: the feed built from the made-up fixtures in tests/fixtures/feed/
// at their fixed clock, flagged `sample: true`, with the real goals from the root goals.json (their
// status and progress), so the sample looks like the live page. The console shows it (with a "Sample feed" flag)
// until the hourly Action writes a real feed. Regenerate after changing the fixtures or core.ts:
//   npm run feed:sample
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeed } from "./feed/core.ts";
import type { FeedInput, Goal, ProductInput } from "./feed/types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = join(ROOT, "tests", "fixtures", "feed");
const NOW = new Date("2026-10-31T12:00:00Z"); // the fixtures' clock
const read = (f: string) => readFileSync(join(FIX, f), "utf8");

type FixtureProduct = Omit<ProductInput, "handoff" | "runLogs"> & { handoffFile: string; runLogFiles: Record<string, string> };
// goals: "fixture" (the frozen tests/fixtures/feed/goals.json the unit tests count on) or "root".
export function sampleInput(goals: "fixture" | "root" = "fixture"): FeedInput {
  const raw = JSON.parse(read("products.json")) as FixtureProduct[];
  const products: ProductInput[] = raw.map(({ handoffFile, runLogFiles, ...p }) => ({
    ...p,
    handoff: read(handoffFile),
    runLogs: Object.fromEntries(Object.entries(runLogFiles).map(([branch, f]) => [branch, read(f)])),
  }));
  const agents = readdirSync(join(ROOT, ".claude", "agents")).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)).sort();
  const config = JSON.parse(readFileSync(join(ROOT, "console.config.json"), "utf8")) as { products: { repo: string; name: string }[] };
  const repoNames = Object.fromEntries(config.products.map((p) => [p.repo, p.name]));
  const goalsJson = goals === "root" ? readFileSync(join(ROOT, "goals.json"), "utf8") : read("goals.json");
  return { goals: JSON.parse(goalsJson) as Goal[], products, studioStatus: read("studio-status.md"), privateRepos: ["family-vault"], agents, repoNames };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = join(ROOT, "console", "sample-studio.json");
  writeFileSync(out, JSON.stringify({ sample: true, ...buildFeed(sampleInput("root"), NOW) }, null, 2) + "\n");
  console.log("Wrote", out);
}
