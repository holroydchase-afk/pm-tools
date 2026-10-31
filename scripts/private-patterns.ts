// The personal-data patterns behind `npm run check:private`, in a pure module (no fs, no
// child_process) so the Studio Console feed builder can redact with the same rules it is checked by.
const ALLOWED_EMAILS = [/^[^@]*no-?reply@/i, /@anthropic\.com$/i, /@example\.(com|org|net)$/i, /@users\.noreply\.github\.com$/i];
export type Pattern = { name: string; re: RegExp; allow?: (match: string) => boolean };
export type Hit = { kind: string; match: string };

export const PATTERNS: Pattern[] = [
  { name: "email address", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, allow: (m: string) => ALLOWED_EMAILS.some((r) => r.test(m)) },
  { name: "phone number", re: /(?<![\d-])(?:\+1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?![\d-])/g },
  { name: "claude.ai artifact link", re: /claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9-]{8,}/g },
  { name: "scheduled task id", re: /\btrig_[A-Za-z0-9]{10,}/g },
  { name: "Gmail link to a thread or search", re: /mail\.google\.com\/mail\/u\/\d+\/#\w+\/[^"'`\s+)]+/g },
];

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A whole-word, case-insensitive match for a denylisted term or private repo name.
export const termRe = (term: string) => new RegExp(`(?<![A-Za-z0-9])${escapeRe(term)}(?![A-Za-z0-9])`, "i");

export function scanText(text: string, denylist: string[] = []): Hit[] {
  const hits: Hit[] = [];
  for (const p of PATTERNS) for (const m of text.matchAll(p.re)) if (!(p.allow && p.allow(m[0]))) hits.push({ kind: p.name, match: m[0] });
  for (const term of denylist) if (termRe(term).test(text)) hits.push({ kind: "denylisted term", match: term });
  return hits;
}

// Replaces every pattern match (allowed emails stay) with "[redacted]".
export function redact(text: string): string {
  let out = text;
  for (const p of PATTERNS) out = out.replace(p.re, (m) => (p.allow && p.allow(m) ? m : "[redacted]"));
  return out;
}
