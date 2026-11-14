# Interview flashcards

One static page, no build. Open `index.html`, click **Load deck**, pick a `.json` deck. The deck and your Got it / Again marks are saved in your browser.

- `decks/demo.json`: fictional sample deck, safe to commit.
- Real decks: name them `*.private.json` (gitignored). Real job-search content never goes in a public repo.

## Deck format
```
{ "Deck name": [ ["Label", "Question to say out loud", "<p>Answer HTML</p>"] ] }
```
Use `<p class='warn'>...</p>` for "don't claim this".

## Make a deck for any interview
Paste this to Claude with your resume, the job posting and your career notes:
```
Build a flashcard deck JSON for my interview, format {"Deck":[[label,question,answerHTML]]}.
Decks: Terms (every technical term on my resume, explained for a non-technical interviewer, what I did, the number),
Numbers (each metric: what it means, how to defend it, what I must not claim),
Stories (STAR stories behind each bullet), Their lens (each job requirement mapped to my proof, plus honest gaps).
Use only facts I have confirmed. 5 to 9 cards per deck.
```
