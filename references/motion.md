# Motion

Motion on an essay page is for the reading. Each kind below has one job, and each one is tied to
what the essay says or where the reader is in it. Generic reveal animations alone were tried first
and did not carry the essay's arc; motion that follows the words did.

All of it lives in `lib/essay/motion.ts` (a plain function, `startEssayMotion(root)`, that returns
its own cleanup) and in the motion section of `app/essay.css`. `components/essay/EssayMotion.tsx`
only calls the function, so the same motion runs on a page built without React.

## The dial

`--lt-loud`, from 0 to 1, multiplies every distance, scale, opacity drop and tint.

- Set it from the address: `?loud=0.4` turns everything down, `?loud=0` holds the page still on
  plain paper. The boot script in the page reads it before first paint.
- Ship the full version first (loud = 1) and turn it down only when asked. A page that starts quiet
  never shows what it could do.
- `prefers-reduced-motion: reduce` replaces all of it with a 240 ms fade per block.

## Eases and durations

| Token | Value | For |
|---|---|---|
| `--lt-ease-emphasized` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Things arriving: blocks, words rising, photos opening |
| `--lt-ease-standard` | `cubic-bezier(0.2, 0, 0.38, 0.9)` | Fades and colour changes |
| `--lt-ease-spring` | a `linear()` curve with a 1% overshoot | Quote marks, dots, the theme dot |
| `--lt-ease-smooth` | a `linear()` curve, no overshoot | The masthead's ground |
| `--lt-dur-state` | 240 ms | Hover and state changes |
| `--lt-dur-control` | 280 ms | Controls |
| Word ink (script) | `cubic-bezier(0.23, 1, 0.32, 1)`, 520 ms per word | |

Rules taken from the build: animate only transform, opacity, clip-path and colour. Never ease-in on
something arriving. Never scale from 0: start at 0.6 to 0.97 with opacity 0. Stagger 30 to 160 ms.

## The kinds

### On load (title card)

| What | Animation |
|---|---|
| Scene | fades in, 900 ms |
| Globe | rises from 26% lower over 3600 ms (`lt-dawn`), then keeps rising with the scroll over the first window (`lt-lift`, a scroll timeline) |
| Kicker | letter spacing closes from 0.54em to 0.2em, 1100 ms; its rule draws out from the centre, 900 ms after 500 ms |
| Title | each word rises from behind its baseline, 1200 ms, 260 ms + 110 ms per word |
| Byline | rises 18 px, 900 ms after 900 ms |
| Cue | the fold hairline appears at 2200 ms; a light runs down it every 2400 ms |
| Title block on scroll | drifts up 9vh and fades over the first 60vh (`lt-away`) |

### ink: words come up as the reader reaches them

Every block marked `.lt-rv` is watched by an IntersectionObserver (bottom margin -7%). When it
enters, it gets `.lt-in`: it settles up 16 px over 1000 ms, and if it is `.lt-ink` its words fade in
in reading order. The whole block's words spread over `min(words x 16 ms, 720 ms)`, so a long
paragraph does not keep the reader waiting. The marker stroke under a key number draws across after
650 ms.

### rise: headings

Each word of a section heading rises from behind its baseline (`span.lt-hw` clips it), 1050 ms,
140 ms + 60 ms per word. The section number fades in and its two hairlines draw out from it over
1300 ms.

### speak: quotes light with the scroll

Words in a quote (`.lt-say`) wait at 24% opacity. As the quote moves from 88% to 44% of the window
height, its words light in order, tied to the scroll position, and stay lit once lit. If the reader
stops partway through a quote for 900 ms, the rest lights on its own at 22 ms a word, so nobody is
left with half a quote. The big quote mark springs in (scale 0.6 to 1, a 12 degree turn).

### open: photos

A photo opens from the top (`clip-path` from fully clipped to none, 1200 ms) while the image inside
settles from 107% to 100% (1700 ms). Nothing stays on the photo afterwards. In the dark ending the
last picture does not open: it comes up out of the black over 2400 ms. Strip pictures open one after
another, 160 ms apart, oldest first.

### mood: the paper follows the passage

On every scroll frame the script finds the last block with `data-mood` whose top is above the
reading line (46% down the window) and writes that mood to `.lt-root`. The sheet's colour moves to
the mood's tint over 1400 ms. See `design-system.md` section 6.

### cover: the opening quote falls back

The paper sheet slides up over the sticky opening quote. The script writes `--lt-cover` (0 to 1,
in 0.5% steps) and the quote fades to 15% and shrinks 6% as it goes under. At full cover it is
hidden, so it costs nothing further down.

### tuck: the site header steps aside

Scrolling down past 260 px (or 24 px while over the title card, so the title never passes under it)
adds `html.lt-tuck` and the site header slides up 104% in 460 ms. Scrolling up removes it. While the
night is under the header (`html.lt-top`), the header has no ground of its own.

### thread

Each piece of the thread grows as it reaches the lower fifth of the window (`animation-timeline:
view()`, range `cover 22vh` to `cover 22vh + gap`). Where view timelines are missing, each piece
draws over 900 ms when its block arrives. A line's node fills and sends out one ring (1500 ms) when
the line inks in.

### credits roll

Each credit line rises 12 px and fades in, 75 ms after the one before.

## The boot script

An inline script, first child of `.lt-root`, runs before first paint. It:

1. applies the reader's saved theme (`localStorage["lt-theme"]`), so a dark reader never sees a white
   flash;
2. reads `?loud=` into `--lt-loud`;
3. adds `.lt-js`, which hides words until they ink in;
4. removes `.lt-js` after 4 s unless the motion script has added `.lt-live`. If the script fails to
   load, the essay still shows.

Every storage access is wrapped in try and catch: private windows and blocked storage throw.

## What was tried and dropped

- A sticky panel beside the text that drew dot fields from the essay's numbers and changed with each passage. It competed with the essay and squeezed it.
- A scroll-driven montage that swapped one frame through a sequence of pictures. A side-by-side strip
  shows the whole sequence at once and was preferred.
- A reading progress bar in the first version (removed, then brought back as the 3 px line that
  shows only while the header is away).
- Riso print effects: misregistered ink copies behind headings, halftone screens on photos, grain,
  crop marks. They sat on top of the thing being read.

## Checking motion

Stills cannot show motion. After the screenshots (`scripts/shoot.mjs`), look at the page in a real
browser at full loudness, at `?loud=0.4`, and with reduced motion on (Chrome DevTools, Rendering,
"Emulate CSS prefers-reduced-motion"). Scroll the whole essay once at reading speed and once fast.
Check: no word stays hidden, no quote stays half lit, the header never covers the title, and the
mood never jumps back and forth at a boundary.
