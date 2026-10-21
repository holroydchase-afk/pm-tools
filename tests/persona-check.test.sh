#!/usr/bin/env bash
# Tests for scripts/check-persona-checks.sh: the templates pass, and each kind of bad decision fails.
set -u
cd "$(dirname "$0")/.."
CHECK=scripts/check-persona-checks.sh
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
pass=0; fail=0
expect() { # expect <ok|fail> <label> <decision file content> [grep pattern for output]
  mkdir -p "$tmp/$2"; printf '%s\n' "$3" > "$tmp/$2/d.md"
  out=$(bash $CHECK "$tmp/$2" templates/PERSONA-CHECK.md 2>&1); code=$?
  if { [ "$1" = ok ] && [ $code -eq 0 ]; } || { [ "$1" = fail ] && [ $code -ne 0 ] && echo "$out" | grep -q "${4:-.}"; }; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $2 -> $out"; fi
}
HEAD='| Persona | Green/Red | Why |
|---|---|---|'
NV='| NV Newcomer | Green | Nothing new to learn |'
PU='| PU Power user | Green | Saves two taps |'
SK='| SK Skeptic | Green | Claim is checkable in the code |'

out=$(bash $CHECK 2>&1) && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: templates -> $out"; }
expect ok all-green "$HEAD
$NV
$PU
$SK"
expect fail missing-row "$HEAD
$NV
$PU" "no row for SK"
expect fail bad-value "$HEAD
$NV
$PU
| SK Skeptic | Amber | Unsure |" "must be Green or Red"
expect fail long-why "$HEAD
$NV
$PU
| SK Skeptic | Green | one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen |" "max 15"
expect fail red-unresolved "$HEAD
$NV
$PU
| SK Skeptic | Red | No proof yet |" "is Red with no"
expect ok red-mitigated "$HEAD
$NV
$PU
| SK Skeptic | Red | No proof yet |

Resolution: SK mitigation: publish the test that proves it (T-12)"
expect ok red-override "$HEAD
$NV
$PU
| SK Skeptic | Red | No proof yet |

Resolution: SK owner override (2026-10-21): ship now, prove it next week"
expect fail unknown "$HEAD
$NV
$PU
$SK
| ZZ Nobody | Green | Fine |" "unknown persona"
expect fail no-table "# Decision: nothing" "no '| Persona"
echo "persona-check tests: $pass passed, $fail failed"
[ $fail -eq 0 ]
