# Resume lint

A small script that reads the exported PDF of a resume and prints only what to fix. It started on Oct 19, 2026 as a catcher for the tells of AI-written copy (tildes, stacked hedges, "leverage"), after a resume went out with 15 tildes in it. On Oct 21 the owner caught two things it had waved through, duplicate opening verbs and "two weeks" where "2 weeks" belonged, and asked for the standard rules too, the ones "readily available 10000000 times online." So it now checks those as well.

The idea is the same as a linter in a code repo: every miss becomes a check, so the same mistake cannot ship twice, and nobody has to proofread for the mechanical stuff.

## Run it

```
python3 resume_lint.py resume.pdf            # needs pdftotext (poppler); pdfplumber is optional
python3 resume_lint.py resume.txt            # plain text works too
python3 resume_lint.py resume.pdf --current  # the top role is a current job, so present tense is fine there
python3 resume_lint.py answer.txt --answer  # a form answer or cover letter: allows "I" and present tense, expects 80–100 words
```

It prints one line per finding, tagged **FIX** (change it) or **LOOK** (a judgment call for the owner), with the offending bullet under it. Nothing printed means clean. Fix every FIX, decide each LOOK, re-export, run again.

## What it checks

| # | Check | Tag | Why |
|---|---|---|---|
| 1 | Tildes ("~60%") | FIX | Resume numbers already read as rounded; "~" just sounds unsure. |
| 2 | More than one parenthetical on the page | FIX | Most people don't write that way; it reads as AI copy. |
| 3 | Semicolons or em dashes inside a bullet | FIX | Strong AI-writing tells. En dashes in ranges are fine. |
| 4 | Stacked hedges in one bullet ("helped … about … estimated") | FIX | Each hedge shrinks the claim; one is plenty. More than 4 on the page is a LOOK. |
| 5 | AI-favorite vocabulary and buzzword adjectives | LOOK / FIX | leverage, utilize, spearhead, robust, seamless, results-driven, seasoned, proven track record, team player, and so on. Once is a LOOK, twice is a FIX. |
| 6 | The same ", cutting / reducing …" tail on 3+ bullets | FIX | Rhythm. Lead some bullets with the result instead. |
| 7 | The same opening verb on two bullets | FIX | 72% of resumes in an 800-resume review repeated verbs. |
| 7b | Spelled-out metrics ("two weeks," "a month to a week," "one a day") | FIX | Recruiters skim for digits. |
| 8 | "A, B, and C" lists in most bullets | LOOK | A triplet everywhere is an AI rhythm. |
| 9 | Filler: "responsible for," "various," "etc.," "in order to," "and more" | FIX | Says nothing. |
| 10 | Plus signs on a range, a price, a repeated figure, or a single digit; more than 8 per page | FIX / LOOK | "+" means "at least"; a page full of them reads like the writer never knows a number. |
| 11 | Small counts ("4 partners," "1 to 5 designers") | LOOK | Can undersell or signal small-company scale. The owner decides; usually a rank, a name, or a ratio works better. |
| 12 | Hidden text: white or near-white type, under 6 pt, or off the page | FIX | AI screeners treat it as keyword stuffing and some reject the resume outright. Reads the PDF's actual characters. |
| 13 | First-person pronouns | FIX | Standard rule. |
| 14 | Weak or duty-style openers: helped, assisted, worked on, managed, responsible for, coordinated | FIX | 56% of resumes in the same review opened with process verbs instead of results. |
| 15 | An opener that is not past tense | LOOK | Past roles take past tense. `--current` allows present tense. |
| 16 | Some bullets end with a period and some don't | FIX | Consistency. |
| 17 | Date formats: "Current" or "Now," "'23," "01/2023," full month names, a hyphen instead of an en dash | FIX | One format, "Jan 2023 – Jan 2026," with "Present" for a current role. |
| 18 | An industry acronym never spelled out (PPA, PV, PTO, NTP, TPO) | LOOK | A reader outside the industry may not know it. Universal ones (AI, API, SQL, B2B, KPI) and company names are skipped. |
| 19 | A bullet with no number in it | LOOK | 85% of resumes in the review lacked quantified results. The bullet has to earn its place without one. |
| 20 | Word count outside 400–850 | LOOK | Strong two-page resumes land around 450–800 words. |

`--answer` is for application form answers and cover letters, which should go through the same scan as the resume: it skips the pronoun, tense, period and length checks that only make sense on bullets, and flags an answer over 110 words.

The script joins bullets that wrap across lines, and the summary and skills lines, so a wrapped fragment never shows up as a fake bullet.

## The rules behind it

Most of these are common knowledge; the point of the script is that nobody has to remember them. The sources the rules came from, which are also the ones to hand someone who asks:

- **Google's XYZ formula** (Laszlo Bock, Google's former head of People Operations): "Accomplished [X] as measured by [Y], by doing [Z]." Every bullet carries a result and a number. [Inc.: Google recruiters say using the X-Y-Z formula will improve your odds](https://www.inc.com/bill-murphy-jr/google-recruiters-say-these-5-resume-tips-including-x-y-z-formula-will-improve-your-odds-of-getting-hired-at-google.html)
- **Eugene Hayden's 800-resume review**: 85% lacked quantifiable achievements, 72% repeated action verbs, 56% used weak verbs, 32% listed responsibilities instead of accomplishments; 2–5 bullets per role, 450–650 words, standard section titles, no tables or icons. [I've reviewed 800 resumes in 65 hours](https://eugenehayden.substack.com/p/ive-reviewed-800-resumes-in-65-hours)
- **The Muse, 20 basic resume rules**: past tense for past roles, no first-person pronouns, consistent formatting and punctuation, quantify everything, PDF with a clear file name, no "references available." [20 basic resume writing rules](https://www.themuse.com/advice/20-basic-resume-writing-rules-thatll-put-you-ahead-of-the-competition)
- **Emory Career Center, Creating Impressive Resume Bullets**: action verb + what you did + quantified result; 3–5 bullets per role; one line each, two at most; no daily duties. [Creating impressive resume bullets](https://cpd.emory.edu/resources/creating-impressive-resume-bullets/)
- **Cleveland State, Grammar Tips for Resume Writing**: tense, pronouns, abbreviations, apostrophes, fragments, consistent punctuation. [Grammar tips for resume writing (PDF)](https://www.csuohio.edu/sites/default/files/Grammar%20Tips%20for%20Resume%20Writing.pdf)
- **ATS Verification, ATS-friendly resume format guide 2026**: single column, no tables, text boxes, headers or footers, icons or photos; standard headings; 10–12 pt standard fonts; "Jan 2023 – Present" dates; contact line in the body; text-based PDF. [ATS-friendly resume format guide](https://atsverification.com/blog/ats-friendly-resume-format-guide-2026/)

The AI-tell checks (1–8, 10) come from reading our own drafts: the tildes, hedges, semicolons, triplet lists and "leverage" that a model reaches for when it writes a resume.

## What it doesn't do

It checks style, not truth. A finding never justifies inventing precision: if a number is an honest estimate, keep one qualifier rather than stating it as exact. Page count, bullet budget per role, character limits per bullet, and whether a claim would survive a skeptical interviewer are still a person's job.
