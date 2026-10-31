// Launches Chromium for the e2e tests. CI installs Playwright's own build (`npx playwright install
// chromium`). Some sandboxes ship a different build at /opt/pw-browsers/chromium instead; use it only
// when the default launch fails and that file exists, so CI always tests Playwright's pinned build.
import { existsSync } from "node:fs";
import { chromium, type Browser } from "playwright";

export const FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium";

export async function launchChromium(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (e) {
    if (!existsSync(FALLBACK_CHROMIUM)) throw e;
    return await chromium.launch({ executablePath: FALLBACK_CHROMIUM });
  }
}
