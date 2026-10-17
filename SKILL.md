---
name: essay-page
description: Builds long-form essay and letter pages for the web with the AI Alignment @ Illinois essay design set, the look of the club's October 2026 exec letter. One centred serif column on warm paper with nothing beside it, quotes and photographs that break out past the column, a night title card, a paper tint that follows each passage, dark bands for the heaviest passage and the ending, words that ink in as you read, sources rolled as film credits, light and dark modes, and one dial that turns all motion down. Ships as themeable tokens, component CSS, a framework-free motion script and a Next.js App Router kit that renders straight from a Markdown or Obsidian note. Use it whenever someone wants an essay, open letter, newsletter lead piece, manifesto or long blog post on a website to look good, read well or feel like ai-2027.com, wants to turn a Markdown note into a web page, wants a reading page "like the club letter", or wants the design tokens and components for long-form reading. Also use it to restyle an existing article page into this set or to add a new palette. Skip it for documentation sites, landing pages, dashboards and slide decks.
---

# essay-page

Turns an essay the author is still writing into a web page people read top to bottom. The author
keeps the words in one Markdown note. This skill decides where each picture and quote goes and how
each passage should feel, sets it all in a reading design set, and checks the result by looking at
it.

The design set has five parts, and a page needs all of them:

1. **The essay is the focus.** One centred serif column on paper, nothing beside it. The room on a
   wide window goes to what the essay holds: the title, quotes and pictures breaking out past the
   column.
2. **Readable first.** Newsreader at about 20 to 24 px, line height 1.62, a 600 to 820 px column,
   AA contrast everywhere, captions never under 13 px.
3. **Lit like a film.** A night title card, the paper, a black ending where the sources roll as
   credits. The paper takes a light tint per passage, and the heaviest passage goes dark edge to edge.
4. **Motion belongs to the words.** Words ink in as the reader reaches them, headings rise, quotes
   light with the scroll. One dial (`?loud=0..1`) turns all of it down; reduced motion gets a fade.
5. **Pictures are whole and true.** No effects on them, one centred caption saying what each is,
   makers and licences in the closing credits, and never a face beside a quote that face did not say.

## Files in this skill

`SKILL` below means this skill's folder.

| Path | What it is | Read it when |
|---|---|---|
| `references/design-system.md` | Principles, tokens, palettes, type scale, layout widths and breakpoints, rhythm, moods, every component with its markup | Before the first build, and before changing any look |
| `references/motion.md` | Each kind of motion, its timing, the dial, the boot script, what was tried and dropped | Before touching motion |
| `references/pictures.md` | Choosing, finding (Commons API), licences, preparing, placing, captions, alt text | Before adding any picture |
| `references/content.md` | The note's format, the sync, the author's words, every config field | When setting up an essay and when the note changes |
| `references/publishing.md` | Draft switch, local preview, unlisted link, tunnel, deploy, checks, publishing, views and comments | Before sharing anything |
| `references/history.md` | How the reference page was built: each version, what was rejected and why | Before proposing a new idea for the set |
| `assets/kit/files/` | The design set's code, copied into the user's repo: `app/essay-tokens.css`, `app/essay.css`, `components/essay/*`, `lib/essay/*`, `scripts/sync_essay.py`, `scripts/photos.py` | Read `Essay.tsx` when adding a component |
| `assets/kit/talk/files/` | Optional views and comments module (Turso over HTTP) | Only with `--talk` |
| `assets/kit/templates/` | Route, unlisted route and config templates | No need |
| `assets/kit/title-card/` | The night title card scene and its renderer (needs the cinematic-slides kit) | When drawing a title card |
| `assets/example/` | A demo essay that uses every component: its note, JSON, config and public-domain pictures | As a model for a config |
| `scripts/` | `init_essay.py` (set up), `check_essay.py` (config against text), `check_contrast.mjs` (AA on every palette, mode and tint), `shoot.mjs` (screenshots), `selftest.sh` | Run them |

## Before starting

Find out three things, from the conversation or the repo before asking:

1. **Where the essay lives.** A Markdown or Obsidian note. If the author only has a doc, ask them to
   paste it into a note; the page always renders from the note.
2. **Which site.** A Next.js App Router repo (the kit's home). For any other stack, see "Outside
   Next.js" below.
3. **Whose look.** The club's essays use the `illinois` palette. Anyone else's start on `plain` or a
   new palette.

Ask at most one question, and only when the answer changes what you build. Otherwise choose, say how
you read the request, and go.

## Workflow

### 1. Read the essay and plan the page

Read the whole note. Then write a plan table in your reply, one row per section: its mood (one word
for how the stretch feels), the pictures it could use (what each would show, and the phrase it
anchors to), the quotes and whether each gets the speaker's portrait, and the key numbers. Mark the
one passage the essay treats as heaviest (it becomes the dark band) and the ending. Keep most moods
close to plain paper. See `references/content.md` section 4.

### 2. Set up the essay in the repo

```bash
python3 SKILL/scripts/init_essay.py --repo <repo> --slug <slug> --title "<Title>" \
  --description "<one line>" --note "<path to the note>.md" [--talk]
```

This copies the design set into the repo (never overwriting a file you changed, unless `--force`),
writes `app/essays/<slug>/page.tsx` with its publish switch off, an unlisted copy at
`app/essays/<slug>/<token>/page.tsx`, a starter `content/essays/<slug>.config.json`, and syncs the
note into `content/essays/<slug>.json`. The sync needs `markdown-it-py`
(`pip install markdown-it-py`).

If the site has a sticky header, put `data-essay-masthead` on it and set `--lt-headh` to its height
in `essay-tokens.css`, so the title card clears it and the header tucks away while reading. If the
site wraps pages in a layout shell, wrap the route's `<Essay>` in it.

### 3. Fill the config

Write `content/essays/<slug>.config.json` from the plan: kicker, byline, title lean word, palette,
moods (titles, cues, bands; name moods from the palette's six, `doubt`, `ask`, `knowing`, `honor`,
`act`, `together`, and the tints come with them), keys, the opening quote's accent phrase, the thread word if the
essay closes on a run of lines that open on the same word. Then pictures (step 4). Every field is in
`references/content.md` section 4; `assets/example/the-page-is-the-essay.config.json` uses all of
them.

### 4. Pictures

Follow `references/pictures.md`. In short: propose pictures that show what the words name, find
public domain or openly licensed files (Commons API first), confirm each licence, keep originals out
of the repo, size them with `scripts/photos.py`, put each in the config with its real `w` and `h`, a
one-line `name`, a `credit`, full-sentence `alt` text and an `at` phrase. A portrait goes beside its
speaker's quote as a face; a sequence goes in a strip.

```bash
python3 -I <repo>/scripts/photos.py <originals> <repo>/public/essays/<slug> inauguration.jpg:2000 szilard.jpg:672
python3 SKILL/scripts/check_essay.py <repo>/content/essays/<slug>.json <repo>/content/essays/<slug>.config.json <repo>/public/essays/<slug>
```

`check_essay.py` must end `0 problems`. It catches anchors that no longer match the text, captions
that grew a credit or a second line, missing credits and alt text, wrong picture sizes, missing
tints.

### 5. Title card

Either leave `hero` null (a CSS night sky with a glowing orb) or draw one. The reference card is a
few tiny figures on a ridge at night facing a vast rising globe, drawn with the cinematic-slides
skill's kit in three layers that move apart as the reader scrolls:

```bash
node SKILL/assets/kit/title-card/render.mjs <repo>/public/essays/<slug> [your-scene.html]
```

Copy `rise.html` to change the scene. Keep the upper half of the frame calm: the title sits there.

### 6. Build and look

```bash
cd <repo> && npx tsc --noEmit && npx next build
npx next dev -p 3112    # in tmux; first compile is slow
node SKILL/scripts/shoot.mjs http://localhost:3112/essays/<slug> shots --widths 1440,390
node SKILL/scripts/shoot.mjs http://localhost:3112/essays/<slug> shots/dark --widths 1440,390 --dark
```

`shoot.mjs` takes the top, five frames down the page, the opening quote, the dark band, the ending,
the credits and the full page at each width, and exits 1 on a page error or sideways scroll. Read the
PNGs. This is the step that makes the page good, so do it after every change that moves
anything. Look for what the checker cannot see: a caption on two lines, a portrait too small to read
as a face, text over a busy picture, a gap that breaks the rhythm, a dark band starting mid-thought,
a picture beside the wrong quote, sideways scroll on the phone. Fix and look again until a full pass
finds nothing. Then open the page in a real browser and scroll it once at reading speed: stills cannot
show motion (`references/motion.md`, "Checking motion").

### 7. Share the draft

The main route returns 404 on production until `PUBLISHED` is true. Share the unlisted copy: deploy
a commit from a clean export, then check the unlisted path answers 200, the main path 404, and the
robots tag says noindex. Commands are in `references/publishing.md`. For a quick look without a
deploy, a tunnel serves a local preview build.

### 8. Publish

Only when the author says so: final sync and check, `PUBLISHED = true`, delete the unlisted folder,
link the essay from the site, reset the view count, deploy, check. `references/publishing.md`
section 5.

## Working with the author

- The words are the author's. The page renders the note as it is; edits go into the note, and only
  when asked. When asked to improve a passage, keep their sentences, list each change, and put any
  rewrite below as an option.
- A quote is real or absent: word for word, with its source. Offer short lists of real candidates.
- Every picture choice is theirs. When they veto a subject, drop it and do not offer it again.
- When the ask is clear, build it and say how you read it. Do not answer a clear ask with a menu.
- Build the full version (loud = 1) first; turn it down when asked.
- Keep the draft unpublished until they say otherwise, and keep the unlisted path out of anything
  public.

## Changing the design set

- **A new palette.** Add a block to `essay-tokens.css`: copy one, rename it, set every colour role
  and the six mood tints in both modes, then run `scripts/check_contrast.mjs` until it ends
  `all pass`. Set `palette` in the config. `references/design-system.md` section 2.
- **A one-off change** for one essay goes in the config's `tokens` and `tokensDark`.
- **A new component** gets one job, uses tokens only (no colour, size or timing written in), sits at
  one of the layout widths, uses the rhythm steps for its margins, ships its reduced-motion rule and
  multiplies its motion by `--lt-loud`. Add its markup to `design-system.md` section 7.
- Read `references/history.md` first. Side panels, print effects, scroll montages and biography
  notes under quotes were all tried and rejected.

## Outside Next.js

The design set is three files and a contract: `app/essay-tokens.css`, `app/essay.css`,
`lib/essay/motion.ts` (`startEssayMotion(root)`; plain TypeScript, strip the types for plain JS), and
the markup in `references/design-system.md` section 7. Render that markup from the same JSON and
config in any framework or template engine, include the boot script from `Essay.tsx` as the first
child of `.lt-root`, and call `startEssayMotion` after the page loads.

## Hand-off

Tell the author, in a short message:

- the link to look at (local, tunnel or unlisted) and that the main route is still 404;
- the plan in one line per section: mood, pictures, quotes;
- every picture with its licence, and any licence you could not confirm;
- anything left in the note that stayed off the page (notes to self, an empty section);
- choices that were judgment calls and what you would change if they disagree.

## Self-test

```bash
bash SKILL/scripts/selftest.sh <empty scratch folder>
```

It builds the demo essay in a fresh Next.js app, checks the draft and unlisted routes, and must end
`selftest: ok`. Run it after any change to the kit.
