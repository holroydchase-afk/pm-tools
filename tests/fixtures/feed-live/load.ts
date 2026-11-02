// Loads the live-shape fixture (README.md here) as a FeedInput. Test-only.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FeedInput, Goal, ProductInput } from "../../../scripts/feed/types.ts";

export const LIVE_DIR = fileURLToPath(new URL(".", import.meta.url));
export const LIVE_NOW = new Date("2026-10-31T12:00:00Z");
const read = (f: string) => readFileSync(join(LIVE_DIR, f), "utf8");
type Raw = Omit<ProductInput, "handoff" | "runLogs"> & { handoffFile: string; stage?: string };

export function liveInput(): FeedInput {
  const goals = JSON.parse(read("goals.json")) as Goal[];
  const products = (JSON.parse(read("products.json")) as Raw[]).map(({ handoffFile, ...p }) => ({ ...p, handoff: read(handoffFile), runLogs: {} }) as ProductInput);
  return { goals, products, studioStatus: read("studio-status.md"), privateRepos: [], agents: ["staff-pm", "qa-tdd", "engineer", "ux-reviewer", "privacy-security", "positioning"] };
}
