# LinkedIn voice and posting rules

The one source for Chase's LinkedIn posts and profile copy. Written Nov 20 by the Product Studio LinkedIn thread; Role Radar owns LinkedIn work from here. Public repo: no private data, no job-search details.

## Voice
Casual and prolific, like someone who makes things all the time and mentions them offhand. Smart and a little dry. Never pontificating, never junior.

- 1 to 2 lines (up to about 50 words). Say what was made, then link. The pace of the work is the flex; never say "I build a lot".
- Open source posts: "Whipped up X. [one line why.] Fork it. [repo]". Vary the verb (whipped up, made, put together, pulled out). Not five "whipped up" in a row.
- Tool posts with no repo: same shape, end with "[link]".
- One honest limit in a line when it matters (for example "No security review yet.").
- Link goes in the first comment or at the end, never as a pitch.

Never: morals, aphorisms, "what I'd tell anyone", closing questions to the reader, "thrilled", "humbled", "game-changer", hashtags, emoji bullets, "Thought it might be useful to some folks".

## Teaser opener (Chase, Nov 23, proposed; confirm before it replaces the shapes above)
Each post and blog starts with a short personal-story teaser, then the work. Write it confident: plain statements, no hedging ("kind of", "I think", "just"), no apology. The teaser is a true moment from Chase's life that explains why the thing exists (for example the grandma-photo juggling behind Hearth), one line, ending before the payoff so the next line lands.

Open question for Chase: this adds a line to the 1 to 2 line shape. Either posts become 2 to 3 lines, or the teaser replaces the "why" clause. Blogs follow the same opener, then run longer. Keep the no-morals and no-overclaiming rules.

## Review gate: no draft reaches Chase until it passes
1. A fresh-context reviewer (Fable for copy) gets only the draft, this file and the claims register. No author reasoning.
2. Voice check against the rules above.
3. Claim check: every fact traced to a repo file, the claims register or the career master. Unverifiable claims are cut or marked [check] for Chase.
4. Verdict PASS or FIX with a reason. Fix and re-review, two rounds max, then ask Chase.
5. Chase sees only PASS drafts, with a one-line verdict.

Facts rules: no "$6M", no "3-5 points", no product dates. Stage words (beta, MVP) are fine.

## Rotation (every other day)
Alternate Path A (small tools) and Path B (open source projects) until every project and tool has had a post. A blocked slot never delays the next one.

| Slot | Path | Post | Status |
|---|---|---|---|
| 0 | opener | Spinner joke | ready |
| 1 | B | Hearth | ready |
| 2 | A | Color palette tool | needs name and link |
| 3 | B | ccwatts | ready |
| 4 | A | Build Slate and Roadmap | ready |
| 5 | B | MLS messenger library | ready |
| 6 | A | Interview flashcards (templates/interview-flashcards) | to draft |
| 7 | A | Energy Scanner | to draft |
| 8 | B | Crew Clock | hold until claims verified |
| 9 | A | Studio agent kit | to draft |
| 10 | B | Charlie | hold until a real test total is quoted |
| 11 | A | Role Radar demo | hold until criteria.yaml privacy fix |
| 12 | A | Nudge | parked until after Hearth beta |

## Drafts that passed review (Nov 20)
Opener (confirm the spinner word was actually seen on screen):
```
Claude's loading state says "Pontificating…" and I got a little defensive.

Anyway. Gonna start posting what I make here.
```
Hearth (repo public, AGPL-3.0, verified Nov 20):
```
Whipped up a private family photo app so I'd stop juggling group chats to send grandma a picture. Open source, fork it. [repo]
```
ccwatts:
```
Made a CLI that estimates the electricity your Claude Code usage burns. Gives a range, runs locally. Fork it. [repo]
```
MLS messenger (lives in Hearth's packages/messenger, no outside review yet):
```
Pulled the encrypted group chat out of Hearth into its own library. Built on MLS. No security review yet. Fork it. [repo]
```
Build Slate and Roadmap (sample-data demos live under pm-tools):
```
Put together a project slate and a Now/Next/Later board for my side projects. Demo's live. [demo]
```
Interview flashcards (Chase's own wording; the folder is public, fictional demo deck):
```
Whipped up these notecards for interview prep. Fork it. [repo]
```

## Profile copy
Headline and About are written for the roles Chase is applying to. Role Radar knows those, so it writes them, one step at a time, headline first. A stiff first headline was rejected on Nov 20: keep it short and casual, no pipes of buzzwords.

## Chase's calls so far
- Posts every other day; he writes them in one sitting and schedules them.
- Alternate small tools and open source projects (Path A and B).
- Spinner joke as opener ("Pontificating…").
- Nov 23: start each post and blog with a short personal-story teaser, confident voice (see Teaser opener).
