#!/usr/bin/env python3
"""Resume lint: flags wording that makes claims feel soft, reads as AI-written, or breaks the standard resume rules.

Usage: python3 resume_lint.py resume.pdf   (or a .txt of the resume text)
       python3 resume_lint.py answer.txt --answer   (a form answer or cover letter)
Needs pdftotext (poppler) for PDFs; pdfplumber is optional, for the hidden-text check.
Prints only findings, each tagged FIX (change it) or LOOK (judgment call).
"""
import re, subprocess, sys
from collections import Counter

path = [a for a in sys.argv[1:] if not a.startswith('--')][0]
if path.lower().endswith(".pdf"):
    text = subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True).stdout
else:
    text = open(path, encoding="utf-8").read()

text = text.replace("​", "")
# Re-join wrapped bullets into one line each.
lines, cur, insum = [], "", False
for raw in text.splitlines():
    l = raw.strip()
    if not l:
        continue
    if l.isupper() and len(l) < 30:  # section heading
        if cur:
            lines.append(cur)
            cur = ""
        lines.append(l)
        insum = l.startswith("SUMMARY")
        continue
    if insum:  # the summary is one paragraph wrapped over several lines
        cur = (cur + " " + l).strip()
        continue
    if l.startswith(("●", "•", "-")) or re.match(r"^[A-Z][\w &/]+: ", l):
        if cur:
            lines.append(cur)
        cur = l.lstrip("●•- ").strip()
    elif cur and not re.search(r"\b(19|20)\d\d\b", l) and not (cur.endswith(".") and len(l) < 60 and not l[-1] in ".,;"):
        cur += " " + l
    else:
        if cur:
            lines.append(cur)
            cur = ""
        lines.append(l)
if cur:
    lines.append(cur)
bullets = [l for l in lines if len(l) > 90 and not re.match(r"^[A-Z][\w &/]+:", l)]
body = "\n".join(lines)
out = []
ANSWER = "--answer" in sys.argv  # a form answer or cover letter: first person, any tense, short

def hit(level, what, where=""):
    out.append(f"{level}  {what}" + (f"\n      → {where[:110]}" if where else ""))

# 1. Approximation symbols: soft-sounding and texting-style.
n = body.count("~")
if n:
    hit("FIX", f"{n} tilde(s). Resume numbers read as rounded already; drop '~' (use 'about' at most once or twice).")

# 2. Parentheses: most people don't write that way. Allow at most 1 on the page.
p = re.findall(r"\([^)]*\)", body)
if len(p) > 1:
    hit("FIX", f"{len(p)} parenthetical(s). Rewrite with commas or a second sentence; keep at most 1.", " | ".join(p[:4]))

# 3. Semicolons and em dashes inside bullets: strong AI-writing tells.
for b in bullets:
    if ";" in b:
        hit("FIX", "Semicolon in a bullet. Split into two sentences or join with 'and'/'then'.", b)
    if "—" in b:
        hit("FIX", "Em dash in a bullet.", b)

# 4. Hedges that shrink the claim. One or two on a page is fine; stacked hedges are not.
HEDGES = r"\b(helped|helping|enabled|enabling|supported|supporting|contributed|assisted|estimated|approximately|roughly|nearly|about|up to|various|several)\b"
hedge_hits = [(b, re.findall(HEDGES, b, re.I)) for b in bullets]
total = sum(len(h) for _, h in hedge_hits)
for b, h in hedge_hits:
    if len(h) >= 2:
        hit("FIX", f"Stacked hedges ({', '.join(h)}). Keep one.", b)
if total > 4:
    hit("LOOK", f"{total} hedge words across the page. Keep the ones where you truly shared credit.")

# 5. AI-favorite vocabulary.
AI_WORDS = r"\b(leverag\w*|utiliz\w*|spearhead\w*|robust|seamless\w*|cutting-edge|innovative|dynamic|synerg\w*|holistic|streamlin\w*|empower\w*|orchestrat\w*|pivotal|transformative|end-to-end|best-in-class|world-class|passionate|results-driven|delve\w*|tapestry|navigat\w*|seasoned|proven track record|results-oriented|detail-oriented|team player|hard-working|self-starter|go-getter|strategic thinker|highly motivated|fast-paced)\b"
prose = "\n".join(bullets)  # skills lines are keyword lists, so technical terms there are fine
for w, c in Counter(m.lower() for m in re.findall(AI_WORDS, prose, re.I)).items():
    hit("LOOK" if c == 1 else "FIX", f"'{w}' x{c}: common in AI-written resumes; prefer a plain verb.")

# 6. Repetitive rhythm: the same ', cutting/reducing ...' tail on many bullets.
tails = Counter(m.lower() for b in bullets for m in re.findall(r",\s+(cutting|reducing|saving|enabling|driving|increasing|improving|lowering)\b", b, re.I))
for w, c in tails.items():
    if c >= 3:
        hit("FIX", f"', {w} …' tail on {c} bullets. Lead some bullets with the result instead.")

# 7. Same opening verb on more than one bullet: every bullet opens with its own verb (72% of resumes in an 800-resume review repeated verbs).
openers = Counter(b.replace("\u200b", "").split()[0].lower() for b in bullets if b.replace("\u200b", "").split())
for w, c in openers.items():
    if c >= 2:
        hit("FIX", f"{c} bullets open with '{w}'. Give each bullet its own opening verb.")

# 7b. Spelled-out numbers on metrics: recruiters skim for digits, so "2 weeks to 2 days," never "two weeks to two days".
_units = r"(?:week|day|month|hour|minute|year|rep|client|lender|engineer|product|partner|site|install|home|state|market|team|person|people)s?"
_words = r"(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)"
for b in bullets:
    for m in re.finditer(rf"\b(?:{_words}|an?)\s+{_units}\b(?:\s+(?:of \w+\s+)?to\s+(?:{_words}|an?|\d+)\s+{_units}\b)?", b, re.I):
        frag = m.group(0)
        # "a month" alone is prose; flag it only in a before-and-after ("a month to a week").
        if re.match(r"an?\s", frag, re.I) and " to " not in frag:
            continue
        hit("FIX", f'"{frag}": write metrics as digits (2 weeks, 1 week, 4 a month).', b[:60])
    for m in re.finditer(rf"\b{_words}\s+an?\s+(?:day|week|month|year)\b", b, re.I):
        hit("FIX", f'"{m.group(0)}": write rates as digits (1 a day).', b[:60])

# 8. Triplet lists in most bullets ("A, B, and C"): a strong AI rhythm when it is everywhere.
trip = sum(1 for b in bullets if re.search(r"\w+, [\w\s-]+, and \w+", b))
if bullets and trip / len(bullets) > 0.5:
    hit("LOOK", f"{trip} of {len(bullets)} bullets use an 'A, B, and C' list. Cut a few lists to the strongest item.")

# 9. Vague closers and filler.
for pat in [r"kept \w+ over time", r"and more\b", r"\betc\.?", r"various", r"a wide range", r"in order to", r"responsible for"]:
    for b in bullets:
        if re.search(pat, b, re.I):
            hit("FIX", f"Vague filler '{pat}'.", b)

# 10. Plus signs: one reads as "at least"; a page full of them reads as never knowing a number.
plus = re.findall(r"\$?[\d,.]+[–-]?[\d,.]*\+", body)
for m in plus:
    if "–" in m or re.search(r"\d-\d", m):
        hit("FIX", f"'{m}' puts a + on a range. The range already says it's approximate; drop the +.")
    elif m.startswith("$"):
        hit("FIX", f"'{m}' puts a + on a price. Use the real range if you know it.")
    elif re.fullmatch(r"\d\+", m) and not re.search(rf"{re.escape(m)} years", body):
        hit("LOOK", f"'{m}' on a single digit can read like you lost count. State the exact number if you know it.")
dupes = [k for k, c in Counter(plus).items() if c > 1]
if dupes:
    hit("FIX", f"Same '+' figure repeated: {', '.join(dupes)}. Keep the + in one place.")
if len(plus) > 8:
    hit("FIX", f"{len(plus)} '+' figures on the page. Keep them for big volumes and years; aim for 8 or fewer.")

# 11. Small counts that can undersell or read as small-company scale. Always flag these to the owner; don't change them silently.
NOUNS = r"(people|person|designers?|engineers?|reps?|employees?|partners?|clients?|lenders?|customers?|teams?|hires?|states?|markets?)"
WORDNUM = {"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9}
for b in bullets:
    for m in re.finditer(rf"(?<![\d,.$])\b(?:from )?(\d+|one|two|three|four|five|six|seven|eight|nine)(?:\s+to\s+(\d+|one|two|three|four|five|six|seven|eight|nine))?[- ]{NOUNS}\b", b, re.I):
        nums = [WORDNUM.get(x.lower(), None) if not x.isdigit() else int(x) for x in m.groups()[:2] if x]
        if nums and max(nums) < 10:
            hit("LOOK", f"Small count '{m.group(0).strip()}': flag to the owner. It can undersell or signal small-company scale; consider a rank, name, ratio, or the result instead.", b)

# 12. Hidden text: white or near-white text, tiny type, or text off the page. AI screeners treat
#     this as keyword stuffing and some reject the resume outright. Needs the PDF (pdfplumber).
if path.lower().endswith(".pdf"):
    try:
        import pdfplumber
        def light(c):
            if c is None:
                return False
            vals = list(c) if isinstance(c, (list, tuple)) else [c]
            if len(vals) == 1:   # grayscale: 1 = white
                return vals[0] >= 0.9
            if len(vals) == 3:   # RGB
                return min(vals) >= 0.9
            if len(vals) == 4:   # CMYK: 0,0,0,0 = white
                return max(vals) <= 0.1
            return False
        hidden = {"light": [], "tiny": [], "offpage": []}
        with pdfplumber.open(path) as pdf:
            for n, page in enumerate(pdf.pages, 1):
                for ch in page.chars:
                    t = ch.get("text", "")
                    if not t.strip() or t == "​":
                        continue
                    if light(ch.get("non_stroking_color")):
                        hidden["light"].append((n, t))
                    elif ch.get("size", 10) < 6:
                        hidden["tiny"].append((n, t))
                    elif ch["x1"] < 0 or ch["x0"] > page.width or ch["bottom"] < 0 or ch["top"] > page.height:
                        hidden["offpage"].append((n, t))
        labels = {"light": "white or near-white text", "tiny": "text under 6 pt", "offpage": "text placed off the page"}
        for k, chars in hidden.items():
            if chars:
                sample = "".join(t for _, t in chars[:60])
                pages = sorted({p for p, _ in chars})
                hit("FIX", f"Hidden text: {len(chars)} characters of {labels[k]} on page(s) {pages}. AI screeners flag this as keyword stuffing. Remove it.", sample)
    except ImportError:
        hit("LOOK", "Hidden-text check skipped: pdfplumber isn't installed (pip install pdfplumber).")

# 13. First-person pronouns (standard rule: never "I", "my", "we", "our" on a resume).
for b in ([] if ANSWER else bullets):
    m = re.findall(r"\b(I|me|my|we|our|us)\b", b)
    if m:
        hit("FIX", f"First-person pronoun ({', '.join(sorted(set(m)))}). Rewrite without it.", b)

# 14. Weak or duty-style openers: they describe a process, not a result (56% of resumes in one 800-resume review).
WEAK_OPENERS = {"helped","assisted","worked","participated","supported","contributed","responsible","handled","involved",
                "tasked","served","utilized","leveraged","managed","oversaw","coordinated","collaborated","liaised","engaged","drove"}
for b in bullets:
    w = b.split()[0].lower().strip(",.")
    if w in WEAK_OPENERS:
        hit("FIX", f"Weak opener '{b.split()[0]}'. Open with what was built, shipped, cut, or won, and put the result up front.", b)

# 15. Tense: past tense on past roles. Pass --current to allow present-tense openers (for someone still employed).
PAST_IRREG = {"led","built","cut","ran","won","took","drove","grew","set","sold","brought","made","held","kept","spent","began",
              "wrote","taught","put","laid","got","found","gave","stood","rebuilt","co-led","co-founded","shut","split","bought","met","sent","spent","thought","saw","came","went","did","had","was","were"}
for b in ([] if ANSWER else bullets):
    if re.match(r"^[A-Z][\w &/]+:", b) or len(b) < 100 or b[0].isdigit():
        continue  # skills lines and the summary
    w = b.split()[0].lower().strip(",.")
    if not (w.endswith("ed") or w in PAST_IRREG):
        if "--current" not in sys.argv:
            hit("LOOK", f"Opener '{b.split()[0]}' may not be past tense. Past roles take past tense; pass --current if the top role is current.", b)

# 16. Bullet punctuation: end every bullet with a period, or none of them. A mix looks careless.
ends = Counter(b.rstrip().endswith(".") for b in bullets if not re.match(r"^[A-Z][\w &/]+:", b)) if not ANSWER else Counter()
if len(ends) > 1:
    hit("FIX", f"{ends[True]} bullets end with a period and {ends[False]} do not. Make them consistent.")

# 17. Dates: "Mon YYYY – Mon YYYY" with an en dash; never "Current"/"Now", apostrophe years, numeric months, or a bare hyphen.
for l in lines:
    if re.search(r"\b(19|20)\d\d\b", l) and len(l) < 90:
        if re.search(r"\b(Current|Now|Till date|To date)\b", l):
            hit("FIX", "Write 'Present', not 'Current' or 'Now', in a date range.", l)
        if re.search(r"'\d\d\b", l) or re.search(r"\b\d{1,2}[/.]\d{4}\b", l):
            hit("FIX", "Date written as '23 or 01/2023. Use 'Jan 2023'.", l)
        if re.search(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4} - ", l):
            hit("FIX", "Hyphen in a date range. Use an en dash with spaces (Jan 2023 – Jan 2026).", l)
        if re.search(r"\b(January|February|March|April|June|July|August|September|October|November|December)\b", l):
            hit("FIX", "Full month name. Every date uses the three-letter month (Jan 2023).", l)

# 18. Acronyms a reader outside the industry may not know: spell out or gloss on first use.
UNIVERSAL = {"AI","ML","API","APIs","SQL","B2B","B2C","SaaS","KPI","KPIs","UI","UX","PDF","LLM","LLMs","RAG","REST","JSON","SEO","CRM","ERP","HR",
             "CEO","CTO","CFO","YoY","MoM","DIY","GTM","ROI","USA","US","PM","PMs","MBA","BA","BS","B.A.","B.S.","NC","SC","WV","NY","CA","TX","GA",
             "IT","R&D","QA","ATS","BI","OKR","OKRs","ACH","APR","SSN","ID","IDs","ETL","AWS","GCP","IoT","LTV","CAC","ARR","MRR","NPS","SLA","SDK","IPO","EPC","3D","2D"}
GLOSS = {"PPA": "power purchase agreement", "PPAs": "power purchase agreements", "PV": "solar", "PTO": "permission to operate", "NTP": "notice to proceed",
         "TPO": "third-party ownership", "MDM": "master data management / mobile device management", "EPC": "installer", "HIC": "home-improvement contract"}
seen = {t for l in lines if len(l) < 90 for t in re.findall(r"\b[A-Z][A-Z0-9]{1,4}\b", l)}  # company and title lines name themselves
for b in bullets:
    for m in re.finditer(r"\b([A-Z][A-Z0-9]{1,4}s?)\b", b):
        tok = m.group(1)
        if tok in UNIVERSAL or tok in seen or re.fullmatch(r"\d+[A-Z]*", tok):
            continue
        seen.add(tok)
        base = tok[:-1] if tok.endswith("s") else tok
        if re.search(rf"\({re.escape(base)}s?\)", body) or re.search(rf"{re.escape(tok)}\s*\(", body):
            continue  # glossed somewhere
        g = GLOSS.get(tok)
        hit("LOOK", f"Acronym '{tok}' is never spelled out." + (f" Gloss it on first use: '{g} ({tok})'." if g else " Spell it out on first use unless the reader is sure to know it."), b)

# 19. Bullets with no number at all (85% of resumes in an 800-resume review lacked quantified results).
for b in bullets:
    if re.match(r"^[A-Z][\w &/]+:", b):
        continue
    if not re.search(r"\d", b):
        hit("LOOK", "No number in this bullet. Add a count, %, $, or time saved, or make sure it earns its place without one.", b)

# 20. Word count: strong two-page resumes land around 450–800 words.
words = len(re.findall(r"\b[\w'$%+-]+\b", body))
if ANSWER:
    if words > 110:
        hit("LOOK", f"{words} words. Form answers read best at 80–100; cut a sentence.")
elif words > 850:
    hit("LOOK", f"{words} words. Strong resumes run 450–800; cut the weakest bullets first.")
elif words < 400:
    hit("LOOK", f"{words} words. That is light for 8+ years; check the bullet budget.")

print("\n".join(out) if out else "Clean: nothing to fix.")
