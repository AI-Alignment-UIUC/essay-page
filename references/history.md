# How the reference page was built

The design set comes from about a week of work (11 to 16 October 2026) on one page: the October exec
letter of AI Alignment @ Illinois, a 1,900-word essay with an epigraph, seven sections, three quotes
with portraits, a list of recommendations and fourteen sources. It was built in seven Claude Code
sessions, with the author reacting to screenshots and links after each change. This file records each
version, what the author said no to, and the rule that came out of it. Read it before changing the
design set: most ideas that look good have been tried.

## Version 1: the site's own look (rejected)

The first draft put the essay on a long cream sheet over a navy table, in the site's sans (Geist),
with the site's riso print effects: halftone dot screens on the photos, blue and orange ghost copies
behind headings, grain and crop marks. A stock photo stood in for a person the essay describes.

What the author said, in substance: use more space; the photos have a weird blur, show the whole
thing; drop the stock photo; no weird effects; centre the essay; it is hard to read; look at how other
sites do it.

Rules that came out of it:
- Pictures are shown whole with no effect (`design-system.md` principle 3).
- No stock photo standing in for a real person.
- Start from named references and measure them. ai-2027.com and ai-2040.com: `#FFFFF8` paper, a black
  serif (ET Book), a 685 px column at 16 px, a section rail on the left, a sticky panel on the right.
  situational-awareness.ai: a 740 px column at 18 px.
- A serif reading face (Newsreader) at about 20 px in a centred column.

## Version 2: AI 2027's layout (rejected)

Paper page, centred serif column, a contents rail on the left and a sticky panel on the right that
drew dot fields from the essay's numbers and changed caption with each passage. A light and dark
switch. Captions at 10 to 11 px mono capitals. The paper took a tint per passage, with a `?loud=`
dial.

What the author said: captions too small; make it a joy to read, with more animation; change mood as
you scroll; respond to the essay; then, a day later, on screenshots: not a fan of the panel; the essay
feels boxed in; we are wasting a lot of space and it feels like slop; the essay should be the primary
focus; better positioned quotes; a better picture of Szilard; animations as the words come up. An
earlier request in between, to make the two portraits much bigger and use more horizontal space, made
the portraits twice as wide and did not fix the feeling.

Rules:
- Captions start at 13 px (`clamp(13px, 1vw, 14.5px)`).
- Ship a dark mode; light is the default.
- Mood belongs to the essay: tints per passage stay, the panel goes.
- One centred column with nothing beside it. The room goes to what the essay holds: a big title,
  quotes and pictures breaking out past the column (`design-system.md` principle 1).
- Motion belongs to the words: ink, rise, speak (`motion.md`).
- Navigation shrinks to dots.

## Version 3: essay first, lit like a film (kept)

The author asked for a presentation that looks cool, "kino", with taste, and shows effort. The page
became three acts: a night title card drawn in the club's slide-deck style (a few tiny figures on a
ridge facing a vast rising globe, in three parallax layers), an opening quote alone on the dark that
the paper slides over, the essay on paper, one full-width dark band for the heaviest passage, and a
black ending where the last picture sits in its own sky and the sources roll as film credits. The
author's verdict on the contact sheet of frames: it looks incredible.

Rules:
- The three acts (`design-system.md` principle 6).
- A dark band beats a heavy tint for the heaviest passage.
- The title sets one line across a wide window and two larger lines on a tall one.
- Newsreader's figures need `proportional-nums`.

## Refinements after version 3

Each line is one request from the author and what it changed.

- **Quotes.** The author asked for new quote candidates twice and chose among short lists with
  source text. The original quote came back with its portrait when a swap lost the portrait. Rule:
  give candidates with sources; the author picks.
- **A line under each portrait quote.** First drafts were biography; the author asked for how the
  quote connects to the reader, then dictated one line. Rule: the note says what the quote means for
  the reader, in the author's words (`.lt-note`).
- **Pictures by era.** A civil rights photo was vetoed in favour of the American Revolution; a
  Lincoln portrait gave way to a picture of an event everyone knows Lincoln for. Rule: show the
  event, use the era the author names.
- **A picture beside a quote.** Earthrise, set full width inside the dark band at a quote, was
  rejected: pictures for quotes go beside them like the portraits. A black and white committee photo
  gave way to a colour one on request. Then the colour photo of a president beside a quote by
  someone else was read as the president saying it, so an empty mission control room replaced it.
  Rule: a face beside a quote reads as its author (`pictures.md`).
- **The ending.** The author asked for a break between the essay's last section and its true end:
  the end mark between two long rules, with the largest gap on the page around it.
- **Spacing.** Gaps were inconsistent; they became four steps with one meaning each
  (`design-system.md` section 5).
- **The three closing lines.** Three short lines opening on "Perhaps" got a picture above each and a
  thread drawn by the scroll between them. A repeated sentence frame stays identical across the
  three lines.
- **Captions.** "Photo: U.S. Department of Energy" under a picture was rejected: say what it is, put
  the source in the credits. Then: centre every label. Rule: one centred line; makers in the
  Pictures roll.
- **A sequence.** A scroll-driven montage of voting pictures was proposed and rejected for a strip,
  side by side.
- **Smaller files.** Nine photos were re-encoded about 10% smaller at the same look; the Pale Blue Dot
  was left alone because recompression dimmed it.
- **A share link that survives the laptop.** The tunnel link died with the laptop, so an unlisted
  copy went to production at a random path, noindex, while the main route stayed 404.
- **Views and comments.** A view count under the byline and comments after the credits, on the same
  black.
- **A picture that does not exist.** A request for an 1864 photo got the nearest real one (1865,
  the second inauguration), offered as one recommended option and captioned with its true year.

## Process lessons

- Keep it unpublished until the author says so. Every change went to a local preview, a tunnel, or
  the unlisted copy. The main route stayed 404 throughout.
- Look at the pixels before reporting. Every change was screenshotted at 1440 and 390 px, light and
  dark, and read. Motion was judged from stills only, which is a gap: check it in a browser too.
- When the author's ask is clear, build it and say how you read it. A two-option question on a clear
  ask was rejected.
- Build the loud version, with a dial to turn it down.
- Re-sync the note before each build. The author edits the essay while the page is built, and a
  passage written four minutes after the last sync was missing from one share link.
- The notes to self the author leaves in the essay must stay off the page.
- Deploy a commit from a clean export. The repo always held someone else's untracked work.
