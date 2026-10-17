# Content: from the author's note to the page

The essay lives in one Markdown note that the author keeps writing in (the reference was an Obsidian
note). The page never holds its own copy of the words. `scripts/sync_essay.py` turns the note into
`content/essays/<slug>.json`, and the page renders that JSON. Everything else about the page (where
pictures go, which passage is heavy, which numbers get marked) lives in
`content/essays/<slug>.config.json`.

## 1. The note's format

```markdown
> Science, by itself, provides no panacea for individual, social, and economic ills. ...
>
> Vannevar Bush, *Science, the Endless Frontier* (1945)

## Intro

Dear reader,

The first paragraph takes the drop cap. ...

## Why one column

A paragraph. A [link](https://example.org) and *italics* work. ...

> A quote on its own, with no attribution paragraph, is a quote with no name.

> A quote with an attribution.
>
> J. Robert Oppenheimer, accepting the Army-Navy Excellence Award (1945)

## What you can do with it

1) Writing a letter? A numbered step that opens on a short label ending in a question mark ...
2) Be specific - or on a label ending in " - " or an em dash, which is set in bold.

## Close

The last section has no title on the page.

## Sources

- Vannevar Bush, *Science, the Endless Frontier* (1945).
- Abraham Lincoln, [Annual Message to Congress](https://example.org) (December 1, 1862).

## Notes

Anything from here down stays off the page.
```

| In the note | On the page |
|---|---|
| A `>` quote above the first heading | The opening quote, alone on the night |
| `## Intro`, `## Close` | Sections with no number or title. The close opens on the end mark |
| `## Title` (any level; a leading `Section 3 - ` is dropped) | A numbered section |
| `>` paragraphs, a blank `>` line, then a last `>` paragraph | A quote; the last paragraph is its attribution |
| A short first line in Intro (under 60 characters) | The hello line, then the drop cap on the next paragraph |
| `1)` items | Recommendations, two across |
| `-` items | A plain list |
| `## Sources` with `-` items | The Sources roll in the closing credits. Write each as "Who, Work (year)." |
| `## Notes` and everything after it | Dropped |
| `text ## note to self` at the end of a line | The tail stays in the note, and the sync prints it as "left in the note" |
| `%% comment %%` | Dropped |
| `[[Wiki link]]` | Plain text |
| The note's file name | The essay's title |

Quotes, dashes and apostrophes are made typographic by the sync (smart quotes on).

**Obsidian lists.** A tab-indented list reads as paragraph text. Put a blank line before the list and
start each item at the margin.

## 2. Syncing

```bash
python3 -I scripts/sync_essay.py "<path to the note>.md" content/essays/<slug>.json
```

It prints the sections with their block types, the word count, the number of sources, and every note
to self it left behind. Read that output each time:

- A section showing `[]` has no text yet; the page shows "Not written yet" there.
- A "left in the note" line means the author left a working note in the essay. It stays off the page;
  tell the author it is there.
- After every sync run `scripts/check_essay.py`. An edit that removes a picture's anchor phrase drops
  that picture silently.

The author keeps editing while you work. Re-read the note right before any edit you make to it, make
each replacement only if the old text occurs exactly once, and write once. The page shows the note as
it was at the last sync, typos included; that is correct, since the words are the author's.

## 3. The author's words

- Never change the essay's words on the page. Fixes go into the note, and only when the author asks.
  When asked to improve a passage, keep the author's sentences, list each change (order, typo,
  grammar, fact, one named word), and put any rewrite below as an option.
- A line the author dictates is the draft: use it as written and list any edit you make to it.
- A quote is real or absent. Find the source, copy it word for word, and give the author the source
  text when proposing one. Short lists of candidate quotes with sources work better than one pick.
- The note line under a quote (`faces[].note`) says what the quote means for the reader, in one
  line. Biography ("He wrote this at 27") was tried and rejected for this slot.
- Facts get checked against the source: one draft called *Situational Awareness* a book; it is an
  essay series.

## 4. The config

`content/essays/<slug>.config.json`. Every field, with the demo's values as examples (the full file is `assets/example/the-page-is-the-essay.config.json`).

```json
{
  "slug": "the-page-is-the-essay",
  "kicker": "Essay Page Kit · Demo",
  "byline": "Your Name",
  "titleLean": "Is",
  "palette": "illinois",
  "pictures": "/essays/the-page-is-the-essay",
  "hero": { "sky": "rise-sky.avif", "orb": "rise-orb.avif", "land": "rise-land.avif", "w": 2560, "h": 1440 },
  "figures": [ { "at": "Abraham Lincoln gave his second", "after": true, "lay": "wide",
                 "src": "inauguration.jpg", "w": 1600, "h": 1263,
                 "name": "Lincoln's second inauguration, 1865", "credit": "Alexander Gardner, Library of Congress",
                 "alt": "Abraham Lincoln reads his second inaugural address from a platform on the east front of the Capitol, above a dense crowd, on 4 March 1865." } ],
  "strips": [ { "at": "People have gathered in public", "after": true, "pics": [ { "src": "lexington.jpg", "w": 1100, "h": 742, "name": "The Battle of Lexington, 1775", "credit": "William Barnes Wollen (1910), National Army Museum", "alt": "..." } ] } ],
  "faces": [ { "match": "Oppenheimer", "src": "oppenheimer.jpg", "w": 728, "h": 997, "alt": "J. Robert Oppenheimer.",
               "what": "J. Robert Oppenheimer", "credit": "Los Alamos National Laboratory",
               "note": "One line on what the quote means for the reader." } ],
  "moods": {
    "default": "civic",
    "byTitle": [["why one column", "doubt"], ["pictures", "ask"], ["weight of knowing", "knowing"]],
    "cues": [["We turned the switch", "heavy"], ["The dark band ends", "knowing"], ["I hope this demo has shown", "night"]],
    "tints": {},
    "bands": { "heavy": "band", "night": "end" }
  },
  "keys": ["685 pixels"],
  "odds": ["no panacea"],
  "thread": "Perhaps",
  "tokens": {},
  "tokensDark": {}
}
```

| Field | What it does |
|---|---|
| `kicker` | The mono line above the title: what this piece is and when |
| `byline` | The author, under the title |
| `titleLean` | One word of the title set in light italic. Pick a small word ("of") |
| `palette` | `illinois` or `plain`, or a palette you add to `essay-tokens.css` |
| `pictures` | The public folder the picture files are served from |
| `hero` | The three title-card layers, or `null` for the CSS night sky |
| `figures`, `strips`, `faces` | Pictures. See `pictures.md` |
| `moods.byTitle` | Section title phrase (case-insensitive) to the mood the section opens in |
| `moods.cues` | A phrase in a block; from that block on, the mood changes. A cue that no longer matches leaves the mood as it was |
| `moods.tints` | Usually empty. The palette already tints six moods: `doubt`, `ask`, `knowing`, `honor`, `act`, `together`. Name moods from that list and the tints follow the palette and the mode. Add `"mood": ["#light", "#dark"]` here only for a mood outside the list, or to override one for this essay. Any other mood keeps plain paper |
| `moods.bands` | Moods where the lights go out: `band` (mid-essay) or `end` (the ending) |
| `keys` | Phrases marked with a stroke on first mention: the numbers the essay leans on. Three to six |
| `odds` | Phrases in the opening quote set in the amber accent |
| `thread` | The word that opens a run of short closing lines (`null` for none) |
| `tokens`, `tokensDark` | Token overrides for this essay only |

**Choosing moods.** Read the essay and name the feeling of each stretch in one word. Keep most of
them close to plain paper. Give the one passage the essay calls heaviest a `band`, and the last
paragraph with its last picture the `end`. The reference used civic (opening), doubt, ask, knowing,
heavy (band), honor, act, together, night (end).

**Choosing keys.** The numbers the argument turns on, in the exact form the note writes them
("685 pixels", "3.2 million"). One stroke per phrase, on first mention only.
