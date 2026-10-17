// What the essay page reads. EssayDoc is what scripts/sync_essay.py writes from the Markdown note;
// EssayConfig is the hand-edited file beside it (content/essays/<slug>.config.json).
// JSON imports are typed loosely by TypeScript, so a route passes them through `as unknown as`.

export type Block =
  | { t: "p"; html: string }
  | { t: "quote"; paras: string[]; cite: string | null }
  | { t: "ol"; items: string[] }
  | { t: "ul"; items: string[] };
export type Quote = Extract<Block, { t: "quote" }>;
export type Section = { id: string; title: string; blocks: Block[] };
export type EssayDoc = { title: string; epigraph: Quote | null; sections: Section[]; sources: string[]; words?: number };

// A picture. `src` is a file in the config's picture folder (or a path from the site root, or a URL).
// `set` is an optional srcset: file names and widths, "photo.jpg 1600w, photo-2400.jpg 2400w".
export type Pic = { src: string; set?: string; w: number; h: number; alt: string };
// How a figure sits: bleed (edge to edge), wide (past the column, never taller than the window) or
// side (hung in the margin beside its paragraph).
export type Lay = "bleed" | "wide" | "side";
// A figure lands before the paragraph that holds its `at` text, or after it with `after`. A caption
// says only what a picture is; `credit` is who made it and under what licence, and shows only in
// the Pictures roll of the closing credits.
export type Figure = Pic & { at: string; after?: boolean; lay: Lay; name: string; credit: string };
// A strip: pictures side by side at one height, oldest first, each with its own label.
export type StripPic = Pic & { name: string; credit: string };
export type Strip = { at: string; after?: boolean; pics: StripPic[] };
// A face sits in a spread beside the quote whose attribution (or, with none, text) holds `match`.
// A quote with no attribution gives its picture a `name`. `what` is what the picture shows.
export type Face = Pic & { match: string; what: string; credit: string; note?: string; name?: string; side?: "l" | "r" };

// A mood is a name for the feeling of a stretch of the essay. A section opens on the mood its title
// names (`byTitle`); a block holding a cue's text changes it from there on (`cues`). Both match
// without regard to case, on plain text. The palette tints six moods (doubt, ask, knowing, honor, act,
// together); `tints` gives any other mood, or overrides one, a [light, dark] colour for the paper.
// `bands` names the moods where the lights go out: "band" is a dark stretch mid-essay, "end" is the
// black ending where the last picture sits in its own sky.
export type Moods = {
  default: string;
  byTitle: [string, string][];
  cues: [string, string][];
  tints?: Record<string, [string, string]>;
  bands: Record<string, "band" | "end">;
};

// The three layers of the title card, files in the picture folder, all the same frame size.
export type Hero = { sky: string; orb: string; land: string; w: number; h: number };

export type EssayConfig = {
  slug: string;
  kicker: string;
  byline: string;
  titleLean?: string;           // the one word of the title set in italic
  pictures: string;             // the picture folder, from the site root: "/essays/<slug>"
  hero?: Hero | null;           // null draws the title card in CSS instead
  figures?: Figure[];
  strips?: Strip[];
  faces?: Face[];
  moods: Moods;
  keys?: string[];              // numbers the essay leans on: a marker stroke on first mention
  odds?: string[];              // phrases in the opening quote set in the accent
  thread?: string;              // the word a run of short lines opens on; they get one thread
  palette?: "illinois" | "plain";
  tokens?: Record<string, string>;     // custom property overrides for this essay, both modes
  tokensDark?: Record<string, string>; // and for dark mode only
};
