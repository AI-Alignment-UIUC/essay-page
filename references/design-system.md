# The design set

This is the reference for every value and every component of an essay page. It is for long pieces
that people read top to bottom in one sitting: an open letter, an essay, the lead piece of a
newsletter. The set came from one finished page, the October 2026 exec letter of AI Alignment @
Illinois. That page is now one instance of the set: its quotes, pictures and moods live in a config
file, and everything below is general.

All classes start with `lt-` (for "letter"), the prefix of the page the set came from, so the two
can be compared line by line.

## 1. Principles

Each principle is here because a version of the page broke it and was rejected. The history is in
`history.md`.

1. **The essay is the focus.** One centred serif column with nothing beside it. A sticky side panel
   beside the text made the essay feel boxed in. The room on a wide window goes to what the essay
   itself holds: a large title, quotes and pictures that break out past the column, a portrait in
   the margin.
2. **Readable first.** Warm paper, dark ink, a serif at about 20 to 24 px, line height 1.62. The
   first two versions (a cream sheet on a navy table, a sans body, dark washes) were hard to read.
3. **Clean type and whole pictures.** No halftone, grain, blur, ghosted or misregistered headings,
   and no crop that changes what a picture shows. Effects that sit on top of the thing being read
   get in the way of reading it.
4. **The page follows the essay.** The paper takes a light tint per passage. The heaviest passage
   and the ending are set in cream on black from edge to edge. Motion belongs to the words: they ink
   in as you reach them, and quotes light up as you scroll.
5. **One dial for all of it.** `--lt-loud` (set from `?loud=0..1`) scales every animation and every
   tint. 1 is the full page, 0 is still text on plain paper. Reduced motion keeps a short fade only.
6. **Lit like a film.** Three acts: a night title card, the paper, a black ending where the last
   picture sits in its own sky and the sources roll as credits.
7. **A caption says what the picture is.** One short centred line. Who made it and under what
   licence goes in the Pictures roll at the end.
8. **A face beside a quote is read as its author.** Beside a quote, show the person who said it or a
   picture with no person in it.

## 2. Tokens

All tokens live in `app/essay-tokens.css`. Component CSS (`app/essay.css`) uses only tokens, so a
new look is a new palette block and nothing else.

### Colour roles

| Token | Role |
|---|---|
| `--lt-paper` | The sheet the essay is printed on |
| `--lt-ink` | Body text, headings, captions |
| `--lt-soft` | Secondary text: attributions, credits, the view count, labels |
| `--lt-line` | Hairlines: section rules, list rules, borders. Ink at 16% |
| `--lt-accent` | Marks that are not text: quote marks, the thread, link underlines, list markers, the progress line, the active dot, marker strokes under key numbers |
| `--lt-accent-text` | The accent where it is text: kicker, byline, section numbers, the hello line, step numbers. Darker than `--lt-accent` so it passes AA on paper |
| `--lt-focus` | Keyboard focus ring |
| `--lt-night` | The ground of the dark acts: title card, opening quote, dark bands, credits |
| `--lt-cream` | Text on the night ground |
| `--lt-night-soft` | Secondary text on the night ground |
| `--lt-amber` | The accent where it is text on the night ground |
| `--lt-glow` | The accent as a mark on the night ground |
| `--lt-horizon` | The lit edge of the sky in the CSS-only title card |
| `--lt-black` | The ending's own ground, so the last picture has no edge |

Inside the dark acts (`.lt-hero`, `.lt-open`, `.lt-night`, `.lt-credits`, `.lt-comments`) the same
names are rebound to the night's colours, so a component looks right on either ground without its
own dark rules.

### Palettes

Two ship with the set. `data-palette` on `.lt-root` picks one, from `palette` in the config. Each
has a light and a dark mode (`data-theme`, from the reader's switch).

**illinois** (the reference page; the club's navy and orange):

| Token | Light | Dark |
|---|---|---|
| `--lt-paper` | `#FBF8F1` | `#0E1A30` |
| `--lt-ink` | `#13294B` | `#EFE9DC` |
| `--lt-soft` | `#4B5A70` | `#A7B2C5` |
| `--lt-accent` | `#FF5F05` | `#FF5F05` |
| `--lt-accent-text` | `#AD3E08` | `#FF8B4A` |
| `--lt-focus` | `#C84113` | `#FF5F05` |
| `--lt-night` | `#0A0A10` | same |
| `--lt-black` | `#000000` | same |
| `--lt-cream` | `#F1EBDD` | same |
| `--lt-night-soft` | `#A9AEC2` | same |
| `--lt-amber` | `#F2A65A` | same |

**plain** (neutral, after ai-2027.com, which measured `#FFFFF8` paper and black serif text). Use it
for an essay that is not the club's.

| Token | Light | Dark |
|---|---|---|
| `--lt-paper` | `#FFFFF8` | `#151513` |
| `--lt-ink` | `#111111` | `#ECEAE0` |
| `--lt-soft` | `#595959` | `#A3A39A` |
| `--lt-accent` | `#9E1A1A` | `#E0594A` |
| `--lt-accent-text` | `#9E1A1A` | `#F27B6C` |
| `--lt-night` | `#0B0B0D` | same |
| `--lt-cream` | `#F3F0E4` | same |
| `--lt-amber` | `#F28C7C` | same |

### Making a palette

1. Copy a palette block in `essay-tokens.css` and rename it.
2. Start from the paper. A warm off-white reads as paper; pure white reads as a screen.
3. Pick ink with at least 7:1 on the paper. Soft and accent-text need at least 4.5:1 on the paper
   and on every mood tint (section 6) in both modes. Check each pair; do not trust the eye.
4. The accent is for marks, so it may be bright. Never set body-size text in it.
5. Dark mode is a deep blue or warm black at about 8% lightness with cream ink, so the page still
   reads as paper at night.
6. Give the six mood tints (section 6) values in both modes: the paper leaned a few percent toward
   each mood's hue.
7. Run `node scripts/check_contrast.mjs <essay-tokens.css> <essay.css>` from the skill folder. It
   finds every palette block and must end `all pass`.
8. Small one-off changes go in the config instead: `tokens` and `tokensDark` (maps of custom
   property to value) are emitted for that essay only.

## 3. Type

Two families, both from Google Fonts through `next/font` in `lib/essay/font.ts`, preloaded by the
essay route only.

- **Newsreader** for everything a reader reads: title, headings, body, quotes, notes, credits'
  works. It has an optical size axis (`opsz`), so one family serves 164 px titles and 16 px notes.
  Its figures are tabular unless asked, so `.lt-root` sets `font-variant-numeric:
  proportional-nums` (ten ones measured 602 units wide by default and 422 with it). It has no true
  small caps, so the opening words use capitals at 0.8em.
- **IBM Plex Mono** for labels: the kicker, section numbers, captions, attributions, credits'
  makers, the view count, buttons. Always uppercase, tracked out, weight 500.

A sans body (Geist) was tried first and read as cheap for a letter.

| Element | Class | Size | Other |
|---|---|---|---|
| Title | `.lt-title` | `clamp(46px, min(max(7.5vw, min(13vw, 9svh)), 17svh), 164px)` | weight 400, line height 0.98, tracking -0.03em, `text-wrap: balance`. One line across a wide window, two larger lines on a tall one. One word may lean (italic 300) |
| Kicker | `.lt-kicker` | `clamp(12px, .95vw, 14px)` mono | tracking 0.2em, accent-text, a 44 px rule under it |
| Byline | `.lt-by` | `clamp(19px, 1.6vw, 26px)` | italic, accent-text |
| Epigraph | `.lt-epi p` | `clamp(21px, min(3.05vw, 4.6svh), 45px)` | line height 1.3, balance |
| Section number | `.lt-n` | 13 px mono | tracking 0.2em, between two hairlines |
| Section heading | `.lt-h` | `clamp(34px, 5.1cqi, 80px)` | line height 1.02, tracking -0.028em, centred like a title card |
| Body | `.lt-text` | `clamp(19px, .7vw + 12.4px, 24px)` | line height 1.62, `text-wrap: pretty` |
| Hello line | `.lt-hello` | 1.36em | italic, accent-text |
| Drop cap | `.lt-drop::first-letter` | 3.55em | floats left, line height 0.8 |
| Opening words | `.lt-lead` | 0.8em | weight 500, tracking 0.09em, capitals, about 28 characters |
| Pull quote | `.lt-pull p` | `clamp(1.16em, 2.5cqi, 1.5em)` | line height 1.36 |
| Spread quote | `.lt-spread p` | `clamp(1.08em, 2.15cqi, 1.4em)` | line height 1.38 |
| Quote in a dark band | `.lt-night .lt-pull p` | `clamp(1.3em, 3.25cqi, 2.4em)` | line height 1.24 |
| Quote mark | `::before` | `clamp(84px, 8cqi, 128px)`; spread `clamp(64px, 5.4cqi, 92px)` | weight 600, accent |
| Attribution | `figcaption` | `clamp(13px, 1vw, 14.5px)` mono | tracking 0.1em, soft |
| Note under a quote | `.lt-note` | `clamp(16px, 1.25vw, 18px)` | serif italic, ink, one line on a laptop |
| Caption | `.lt-fig figcaption` | `clamp(13px, .95vw, 14px)` mono | centred, ink |
| Thread line | `.lt-perhaps` | 1.5em (1.35em on a phone) | centred, balance, first word in accent-text |
| Step | `.lt-steps li` | 0.93em | its number italic 2.5em in accent-text |
| Credits maker | `.lt-who` | 13 px mono | tracking 0.12em, soft, right-aligned |
| Credits work | `.lt-work` | `clamp(16px, .82em, 19px)` | left-aligned |

**The 13 px floor.** Captions, credits and attributions never go below 13 px. Mono capitals at 10 to
11 px were too small to read. 13 px scaling to about 14.5 px on wide windows was accepted.

## 4. Layout

The text block (`.lt-text`) is as wide as the page and is a size container, so `cqi` is a hundredth
of the page width without the scrollbar. Each child of a section is centred at a width set by what
it is.

| Token or rule | Value | Used by |
|---|---|---|
| `--lt-col` | `clamp(600px, 52vw, 820px)` | Paragraphs, lists, captions. 749 px at a 1440 px window |
| Section head | `min(1060px, ...)` | `.lt-head` |
| Pull quote | `min(960px, ...)`; in a dark band `min(1100px, ...)` | `.lt-pull` |
| `--lt-wide` | `1120px` | Spreads, steps, strips, wide figures |
| `--lt-tall` | `min(74vh, 760px)` | A wide figure is never taller than this: its width is `min(--lt-wide, --lt-tall * aspect ratio)` |
| Bleed | `100cqi` | `.lt-fig-bleed`, dark bands |
| `--lt-pad` | `clamp(20px, 4vw, 56px)` | Side gutter; every width above subtracts twice this |
| `--lt-headh` | `0px` by default | Height of the site's sticky header, if any. Pads the title card and offsets anchor jumps |

For comparison, measured at 1440 px: ai-2027.com sets a 685 px column at 16 px (77 characters a
line); situational-awareness.ai a 740 px column at 18 px (96 characters). This set runs a little
larger, about 66 characters a line, because the page is read once, slowly.

**Breakpoints.** Container queries on the text block unless marked.

| Width | What changes |
|---|---|
| 560 | A side figure stops floating: portrait and caption sit side by side above the paragraph. Captions stack. Thread lines drop to 1.35em |
| 700 | Strip height drops from 150 to 90 px. The credits roll stacks, centred |
| 860 | A spread stacks: portrait (62%, at most 300 px) above the quote; a landscape picture goes full width |
| 900 | Steps go two across. (Media query) the light switch moves to the top right corner of the title card |
| 1180 | (Media query) the section dots appear at the left edge |
| 1380 | A side figure hangs in the margin beside its paragraph, `clamp(210px, 17cqi, 290px)` wide |

Check every page at 1440, 1280, 820 and 390 px, and at the width of the author's own window. No
width may scroll sideways.

## 5. Rhythm

Four vertical steps, each about twice the last, in em so they follow the text size. Each has one
meaning. Before this, gaps were set one by one and read as random.

| Token | Value | Meaning | At 1440 px |
|---|---|---|---|
| `--lt-s1` | 1.05em | One paragraph to the next, inside one thought | 24 px |
| `--lt-s2` | 2.1em | A beat: above and below a picture, a quote, a list; from a heading to its first block | 47 px |
| `--lt-s3` | 4.2em | A new section; the outer edge of a dark band | 94 px |
| `--lt-s4` | 8.4em | The end: before and after the closing mark, the largest gap on the page | 189 px |

## 6. Moods

A mood is a name for the feeling of a stretch of the essay. The config maps section titles to moods
(`moods.byTitle`) and lets a phrase inside a block change the mood from there on (`moods.cues`).
Motion writes the mood at the reading line (46% down the window) to `data-mood` on `.lt-root`.

- **Tints** recolour the sheet over 1400 ms. Each palette names six moods in each mode, as
  `--lt-m-doubt`, `--lt-m-ask`, `--lt-m-knowing`, `--lt-m-honor`, `--lt-m-act` and
  `--lt-m-together` in `essay-tokens.css`, so an essay that switches palette or mode keeps tints that
  suit it. Name a section's mood from that list and the tint comes with it; a config's
  `moods.tints` adds a mood or overrides one for that essay. Keep tints within a few percent of the
  paper.

  | Mood | What the stretch feels like | illinois light | illinois dark | plain light | plain dark |
  |---|---|---|---|---|---|
  | doubt | the problem, unsettled | `#EDECE7` | `#121821` | `#F3F3EE` | `#1A1A19` |
  | ask | a question put to the reader | `#F6F1E5` | `#101C34` | `#FAF6EA` | `#1C1A15` |
  | knowing | facing what is known | `#EDF2F7` | `#0E2646` | `#F1F5F8` | `#161A1F` |
  | honor | people and what they did | `#FBE8D7` | `#2B1B1F` | `#FCEDE6` | `#231716` |
  | act | what to do | `#FFF3E2` | `#251C1D` | `#FFF6E6` | `#211C16` |
  | together | the close, warm | `#FFEFD9` | `#2D1E17` | `#FFF1DF` | `#241C14` |

  Text must pass AA on every tint; `scripts/check_contrast.mjs` tests ink, soft and accent-text on
  each one. The tint is mixed in by `--lt-loud`, so `?loud=0` keeps plain paper. A mood with no tint
  anywhere keeps plain paper too.
- **Bands** (`moods.bands`) are moods where the lights go out. A run of blocks in a band mood is
  gathered into one full-width block of cream on black. `band` is the mid-essay kind: its quote runs
  as large as the epigraph and the paragraphs answering it keep the quote's left edge. `end` is the
  ending: pure black, so the last picture has no edge and its sky is the page; the credits follow on
  the same black. Use at most one `band` and one `end`. A heavy tint on the paper was tried before
  the band and did less.

## 7. Components

What each piece is for, its markup, and the config that drives it. `Essay.tsx` writes all of this
from the doc and the config; the markup is listed so the CSS and `lib/essay/motion.ts` can be used
from another framework.

### Title card

`header.lt-hero` fills the first window (`min-height: max(100svh, 600px)`). Inside: `.lt-scene` with
three images (`.lt-sky`, `.lt-orb` around an img, `.lt-land`), then `.lt-hero-in` with
`p.lt-kicker` (plus `span.lt-draft` while a draft), `h1.lt-title` (each word in `span.lt-hw >
span`, so it can rise from behind its own baseline), `p.lt-by`, the view count slot and the light
switch `button.lt-theme`. `span.lt-cue` is a hairline at the fold with a light running down it.

The three layers are one frame drawn in three parts (sky, globe, land), each anchored to the bottom
edge with `object-fit: cover`, so the ridge sits on the fold at any window shape and the globe can
rise behind it. The reference frame is a few tiny figures on a ridge at night facing a vast globe as
it rises: the club's deck motif. Draw yours with `assets/kit/title-card/` and the cinematic-slides
kit. With no `hero` in the config, the card draws a CSS night sky with a glowing orb instead.

Config: `kicker`, `byline`, `titleLean` (the word set in italic), `hero`.

### Opening quote

`div.lt-open > figure.lt-epi` holds the epigraph alone on the night, one window tall, sticky, so the
paper sheet slides up over it. It falls back (opacity and scale) as the sheet covers it. Phrases in
`odds` are set in italic amber (`span.lt-odds`): use it for the one figure or phrase the opening
quote turns on.

### Sheet and sections

`div.lt-sheet` is the paper. `nav.lt-dots` (section dots), then `article.lt-text` with one
`section.lt-sec` per section. A titled section opens like a title card: `header.lt-head` with
`span.lt-n` (two-digit number between two hairlines) and `h2.lt-h`. Sections titled Intro or Close
have no head (`.lt-bare`). The close opens on the end mark between two long rules
(`header.lt-break`), so the ending reads as the ending.

### Paragraphs

- `p.lt-p`: body. Every word is wrapped in `span.lt-w` so it can ink in.
- `p.lt-hello`: a short first line of the essay ("Dear reader,"), under 60 characters, italic accent.
- `p.lt-drop`: the first paragraph after it, with a drop cap and the opening words in capitals
  (`span.lt-lead`).
- `span.lt-key`: the first mention of each phrase in `keys` gets a marker stroke drawn under it
  (accent at 42%, 0.34em tall). Use it for the three to six numbers the essay leans on.
- Links: ink colour, a 1.5 px accent underline offset 3 px.

### Quotes

A quote block whose attribution (or text) contains a face's `match` becomes a spread; any other
quote is a pull.

- **Pull** `figure.lt-pull > blockquote.lt-say + figcaption`: large, wider than the column, under a
  big accent quote mark. A last sentence of 28 characters or fewer gets its own line (`span.lt-beat`).
- **Spread** `figure.lt-spread` with `data-side="l|r"`: the portrait (`.lt-face`, 0.78fr) on one side
  and the words (`.lt-spread-say`, 1.22fr) on the other. Sides alternate down the page unless a face
  sets `side`. A landscape picture (`data-land`) takes half. The figcaption holds the attribution,
  then `span.lt-note` (one line on what the quote means for the reader, in the reading face), then
  `span.lt-photo` (what the picture is, only when the picture is not the speaker).
- `p.lt-orig`: a paragraph set entirely in italics (an original-language line above a translation)
  is set smaller and soft.

### Pictures

Every picture is shown whole, `width: 100%; height: auto`, 3 px corners on wide and side figures.

- `figure.lt-fig.lt-fig-bleed`: edge to edge across the window. For a wide landscape the essay turns
  on.
- `figure.lt-fig.lt-fig-wide`: past the column, up to 1120 px, never taller than `--lt-tall`.
- `figure.lt-fig.lt-fig-side`: a portrait in the margin beside its paragraph (`div.lt-row` holds
  both). Floats right inside the column below 1380 px.
- `figure.lt-strip`: several pictures side by side at one height, each `div.lt-strip-item` growing in
  proportion to its shape (`flex: var(--ar) 1 calc(var(--ar) * 150px)`), a label under each. For a
  sequence the reader should see all at once. Oldest first.
- `figcaption`: one centred line saying what the picture is.

A figure goes before the paragraph whose text holds its `at` anchor, or after it with `after: true`
(when the paragraph should be read first). Pictures above a line make the reader see, then read.

### Steps and lists

`ol.lt-steps`: a numbered list becomes recommendations, two across from 900 px, each under a hairline
with a large italic number. A step that opens on a short label ending in `?`, an em dash or ` - `
gets that label in bold. `ul.lt-list`: a plain list with square accent markers.

### Dark bands

`div.lt-night.lt-night-band` and `div.lt-night.lt-night-end`, as wide as the window, padded
`clamp(96px, 18vh, 210px)` top and bottom. See Moods.

### The thread

When three or more short lines open on the same word (the reference: three lines starting
"Perhaps"), set `thread` to that word. The run from the first such line to the last, with the
pictures above them, goes in `div.lt-maybe`: centred, the lines at 1.5em with the word in
accent-text, and a 2 px accent thread drawn by the scroll down the gaps between them, never across
a word or a picture. A node at the head of each line is a ring until its line inks in, then it fills
and a halo spreads from it.

### Credits

`footer.lt-credits` on black: the end mark, then two rolls, Sources (from the note) and Pictures
(from the config's `credit` fields), each `ul.lt-roll` of `li > span.lt-who + span.lt-work`: who on
the right of a centre line, the work on the left, like film credits. Sources are split at their
first comma ("Vannevar Bush, Science, the Endless Frontier (1945)").

### Navigation and chrome

- `nav.lt-dots`: one 7 px dot per titled section at the left edge, from 1180 px, shown only while
  the paper is in view. The active dot turns accent and grows 1.6x. The section name shows on hover.
  A labelled contents rail was tried and dropped as furniture.
- `span.lt-progress`: a 3 px accent line along the top edge, drawn by a CSS scroll timeline (motion
  draws it where scroll timelines are missing). Shown while the site header is tucked away.
- `button.lt-theme`: light and dark, a half-filled dot that turns over. Light is the default; the
  choice is kept in localStorage `lt-theme` and applied before first paint.
- `[data-essay-masthead]`: put this on the site's sticky header. Over the night it loses its ground;
  on the way down it slides away so the essay has the window; on the way up it comes back.
- `span.lt-draft`: a dashed "Draft" tag beside the kicker while unpublished.
- `p.lt-todo`: a dashed "Not written yet" box for a titled section with no text, so a draft can be
  looked at before it is finished.

### Views and comments (optional module)

`p.lt-views` under the byline: one count per browser, its line height held while it loads so nothing
moves. `section.lt-comments` after the credits, on the same black, one column wide: the list, then a
name and comment form. Comments render as text only. See `publishing.md`.

## 8. Accessibility

- Every picture has alt text: one sentence that says what is in it, ending with a full stop.
- The title card's art and the dots' decorations are `aria-hidden`.
- Reduced motion: no transforms, no word ink, no thread drawing; each block fades in over 240 ms.
- If the motion script never runs, a fail-safe in the boot script shows everything after 4 s.
- Focus rings use `--lt-focus`. The comment form's honeypot field is out of the tab order.
