# Pictures

Pictures on an essay page show what the words name. They are chosen with the author, shown whole,
captioned with what they are, and credited at the end. This file covers choosing, finding,
licensing, preparing and placing them.

## 1. Choosing

- **A picture earns its place by carrying a point.** Add one where the reader would otherwise have to
  imagine something the essay leans on: an event, a place, a person who is quoted. Skip one where it
  would only decorate. A stock photo of a stranger standing in for someone the essay describes
  weakens the paragraph; leave the paragraph alone.
- **A face beside a quote reads as the quote's author.** The reader assumes the person in a portrait
  next to a quote said it, whatever the caption says. Beside a quote, show the speaker, or a picture
  with no person in it (the reference put an empty Apollo Mission Control room beside a quote from an essay, after a
  photo of a president there was read as the quote's author). Name the author first in the attribution.
- **Show the event over a famous face alone.** When the essay talks about a moment, a picture of the
  moment beats a studio portrait of the person in it (Lincoln reading his second inaugural address
  above the crowd, over a seated portrait of Lincoln).
- **Pick the picture that shows what the words name.** A line about a birthplace took a stellar nursery
  (Webb's Carina Nebula); a line about the industrial revolution took the furnaces of Coalbrookdale
  at night.
- **Colour when the moment allows it.** A colour photograph of the same scene reads closer than a
  black and white one. Many historical subjects only exist in black and white; that is fine.
- **A sequence goes side by side.** Several pictures of one idea over time (people claiming the vote:
  Lexington 1775, Peterloo 1819, Kennington Common 1848, an inked finger in India 2024) sit in one
  strip, oldest first, so the reader sees the whole arc at once. End the strip on the picture that
  leads into the next paragraph.
- **The author has the last word on every picture.** When the author vetoes a subject or an era, use
  the one they name and do not offer the vetoed one again. When the picture they ask for does not
  exist (a "1864" photo of an event only photographed in 1865), offer the nearest real one with its
  true date, and caption the true date.

## 2. Finding

Search in this order: Wikimedia Commons, the Library of Congress, NASA, the U.S. Department of Energy
and other federal archives, museum open-access collections.

**Wikimedia Commons API** (the source of most pictures on the reference page):

```bash
UA="essay-page/1.0 (https://your-site.example; contact@your-site.example)"
# find files
curl -s -A "$UA" "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=20&format=json&srsearch=Coalbrookdale%20by%20Night"
# size, URL, author, licence and date of one or more files (join titles with |)
curl -s -A "$UA" "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|size|extmetadata&format=json&titles=File:Philipp_Jakob_Loutherbourg_d._J._002.jpg"
```

- Send a User-Agent with a contact address. Use a project address, never a person's email.
- After about ten quick calls the API answers 429. Sleep 2 to 3 s between calls and batch titles.
- Guessed file titles are often wrong ("Philip James de Loutherbourg - Coalbrookdale by Night.jpg"
  does not exist). Search first, then read `extmetadata` for `Artist`, `LicenseShortName` and
  `DateTimeOriginal`.
- A full-size download can come back as a text error page. Check with `file` before using it. A
  large thumbnail (`iiurlwidth=2400`) is often enough.
- "Public domain" on a file page can hide a notice in its description (a 4K film of a bomb test
  carried a YouTube channel's copyright line). Read the description. Prefer the agency's own file.
- Library of Congress masters can be 40 MB TIFFs; Pillow needs `Image.MAX_IMAGE_PIXELS = None`.

**Making a choice.** Put the candidates side by side before deciding: resize each to one height (380
to 420 px), paste them in a row with 10 px gaps, save, and look at the sheet. To check that two files
are the same photograph, compare small grayscale thumbnails by correlation (above 0.98 is the same
picture).

## 3. Licences and credits

| Licence | Use | Credit |
|---|---|---|
| Public domain (US federal works, works published before 1930, NASA, DOE) | Free | Name the maker anyway, in the Pictures roll |
| CC0 | Free | Name the maker anyway |
| CC BY, CC BY-SA | Free with visible credit | Required: maker and licence, in the Pictures roll |
| Agency notices (e.g. Los Alamos National Laboratory) | Usually free with the notice | Name the lab |
| Anything else, or no licence shown | Do not use | |

Every picture in the config has a `credit` ("William Barnes Wollen (1910), National Army Museum",
"Daniel Schwen, CC BY-SA 4.0"). The page shows credits only in the Pictures roll of the closing
credits. Check every licence before the page is made public, and say in the hand-off which ones you
could not confirm.

## 4. Preparing

`assets/kit/files/scripts/photos.py` resizes originals for the page: width only, no crop, no effect.

```bash
python3 -I scripts/photos.py <originals dir> public/essays/<slug> lexington.jpg:2000 szilard.jpg:672 --quality 84
# cut a scan's mount by hand: crop box in the original's pixels, then resize, then rename
python3 -I scripts/photos.py <originals dir> public/essays/<slug> "peterloo-scan.tif:1400@19,26,1367,1099=peterloo.jpg" --edges
```

- Keep originals outside the repo (`essay-src/<slug>/photos/` or similar). Only the outputs ship.
- Widths: 2000 px for wide figures, 2400 to 2800 px for bleeds, 1000 to 1400 px for strip pictures,
  the original width (about 700 px) for portraits. JPEG quality 82 to 88, progressive, optimised.
- **Scan borders.** Library of Congress scans and prints often carry a dark or white mount. Find it by
  reading row and column means with numpy (the mount sits at a flat value, the picture varies), then
  crop by hand: automatic trims returned zero on these. `photos.py --edges` prints how many flat
  lines sit at each edge. It never crops, because a dark studio background is flat too (the Szilard
  portrait has 110 flat rows of background at the top that belong to the picture). Look at the edge,
  then write the box.
- **Shrinking.** Re-encode only where it saves at least 5% at a structural similarity (SSIM) of 0.985
  or more. Do not recompress a picture whose point is fine detail: the Pale Blue Dot got dimmer and
  blockier at a lower quality, so its original stayed.
- Write the real pixel size of every output into the config (`w`, `h`); `scripts/check_essay.py`
  compares them with the files. Wrong sizes shift the layout while images load.
- A near-square picture in a dark ending gets a 2400 px `set` entry for wide windows.

## 5. Placing

| Layout | Config | Use for |
|---|---|---|
| `bleed` | `figures[].lay` | A wide landscape the section turns on (a campus, a skyline). Edge to edge |
| `wide` | `figures[].lay` | Most pictures. Past the column, up to 1120 px, never taller than the window |
| `side` | `figures[].lay` | A portrait hung in the margin beside its paragraph |
| strip | `strips[]` | A sequence, side by side at one height |
| spread | `faces[]` | A portrait beside the quote of the person in it, or a picture with no person beside a quote |

- `at` is a short phrase from the paragraph the picture goes with. It must appear in exactly one
  paragraph. Choose words the author is unlikely to edit; when the text changes, run
  `scripts/check_essay.py`, because a lost anchor drops the picture with no error.
- Put a picture before its paragraph by default (the reader sees, then reads). Use `after: true` when
  the paragraph sets the picture up.
- In a spread, `match` is a word from the quote's attribution (the speaker's surname). `what` is what
  the picture shows; `note` is one line on what the quote means for the reader, written with the
  author and in their words where possible.
- Big portraits need horizontal room: when a portrait looks small, widen the spread past the column,
  and keep the text column as it is.

## 6. Captions and alt text

- **Caption:** one short line, centred under the picture, that says what it is: "The Castle Bravo
  hydrogen bomb, 1954". No "Photo:" line, no maker, no licence. At most about 60 characters.
- **Alt text:** one or two full sentences describing what is in the frame, for someone who cannot
  see it: "The fireball of Castle Bravo, the largest American nuclear test, rising through a red sky
  above the clouds over Bikini Atoll in March 1954."
- **Attribution under a quote** (spreads and pulls): author first, then the work and year, from the
  note's last quote paragraph: "Leo Szilard, *Ten Commandments* (1940)".
