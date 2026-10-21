import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const py = spawnSync("python3", ["--version"]);
const hasPython = py.status === 0;

test("resume lint flags the standard mistakes in the sample", { skip: !hasPython && "python3 not installed" }, () => {
  const r = spawnSync("python3", ["-I", "routines/resume-lint/resume_lint.py", "routines/resume-lint/sample/needs-work.txt"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const out = r.stdout;
  for (const expect of [
    "tilde",                       // ~15%
    "parenthetical",               // (pilot) plus others
    "Semicolon",                   // bullet 1
    "Em dash",                     // bullet 4
    "Stacked hedges",              // enabling + supporting
    "'leverag",                    // summary buzzwords
    "'seasoned'",
    "bullets open with 'led'",     // repeated opener
    "write metrics as digits",     // one month to one week
    "Vague filler",                // responsible for, various, in order to
    "on a single digit",           // 3+ partners
    "First-person pronoun",        // I tracked
    "Weak opener",                 // Helped, Managed, Worked
    "may not be past tense",       // Build
    "end with a period",           // mixed periods
    "'Present', not 'Current'",    // January 2022 - Current
    "Full month name",             // January
    "Hyphen in a date range",      // 2022 - Current
    "Acronym 'PPA'",               // never spelled out
    "No number in this bullet",    // bullet 1
  ]) {
    assert.ok(out.includes(expect), `expected a finding containing: ${expect}\n--- output ---\n${out}`);
  }
});

test("resume lint is quiet on a clean bullet list", { skip: !hasPython && "python3 not installed" }, () => {
  const clean = [
    "Jordan Example", "Product Manager", "Springfield, IL | jordan@example.com", "",
    "EXPERIENCE", "Product Manager\tJan 2020 – Jan 2024", "Acme\tRemote",
    "● Built a checkout flow that lifted conversion 12% across 40,000 monthly sessions, then rolled it out to 3 markets behind feature flags.",
    "● Cut partner onboarding from 4 weeks to 1 week with a rules engine, then took 5 partners through compliance reviews with 0 findings.",
    "● Shipped dashboards that tracked approval and decline rates for 12,000 applications a month and flagged a 9% drop within a day.",
  ].join("\n");
  const f = join(mkdtempSync(join(tmpdir(), "lint-")), "clean.txt");
  writeFileSync(f, clean);
  const r = spawnSync("python3", ["-I", "routines/resume-lint/resume_lint.py", f], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!/^FIX/m.test(r.stdout), `unexpected FIX:\n${r.stdout}`);
});
