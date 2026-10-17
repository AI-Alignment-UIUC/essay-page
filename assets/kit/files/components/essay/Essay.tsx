import { Fragment, type CSSProperties, type ReactNode } from "react";
import EssayMotion from "@/components/essay/EssayMotion";
import EssayTheme from "@/components/essay/EssayTheme";
import { newsreader, plexMono } from "@/lib/essay/font";
import type { Block, EssayConfig, EssayDoc, Pic, Quote as QuoteBlock, Section } from "@/lib/essay/types";

const two = (n: number) => String(n).padStart(2, "0");
const html = (s: string) => ({ __html: s });
const unlabeled = (t: string) => t === "" || /^(intro|close)$/i.test(t);
const textOf = (b: Block) => (b.t === "p" ? b.html : b.t === "quote" ? b.paras.join(" ") : b.items.join(" "));
const plain = (s: string) => s.replace(/<[^>]+>/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
// the text a cue or an anchor is matched on: plain, straight quotes, no case
const norm = (s: string) => plain(s).toLowerCase();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Before first paint: the theme the reader last chose, the dial, and the class that holds the
// words back until EssayMotion is there to bring them up. If it never arrives, they show anyway.
const boot = `(function(r){try{var t=localStorage.getItem("lt-theme");if(t)r.dataset.theme=t}catch(e){}var l=/[?&]loud=([^&]*)/.exec(location.search);if(l)r.style.setProperty("--lt-loud",Math.min(1,Math.max(0,+l[1]||0)));r.classList.add("lt-js");setTimeout(function(){r.classList.contains("lt-live")||r.classList.remove("lt-js")},4000)})(document.currentScript.parentElement)`;

// Everything the config decides, worked out once per render: picture addresses, the mood lookups,
// the thread, the list of picture credits and the <style> that carries this essay's tints and tokens.
function prepare(config: EssayConfig) {
  const dir = config.pictures.replace(/\/+$/, "");
  const url = (f: string) => (/^(\/|https?:\/\/)/.test(f) ? f : `${dir}/${f}`);
  const srcset = (s?: string) =>
    s?.split(",").map((e) => { const [f, w] = e.trim().split(/\s+/); return `${url(f)} ${w}`; }).join(", ");
  const pic = <T extends Pic>(p: T): T => ({ ...p, src: url(p.src), set: srcset(p.set) });
  const figures = (config.figures ?? []).map((f) => ({ ...pic(f), key: norm(f.at) }));
  const strips = (config.strips ?? []).map((s) => ({ ...s, key: norm(s.at), pics: s.pics.map(pic) }));
  const faces = (config.faces ?? []).map((f) => ({ ...pic(f), key: norm(f.match) }));

  // moods: a section opens on the mood its title names; a block holding a cue's text changes it from there on
  const m = config.moods;
  const bands = m.bands ?? {};
  const moodOfTitle = (title: string) => (m.byTitle ?? []).find(([k]) => norm(title).includes(norm(k)))?.[1] ?? m.default;
  const moodOfText = (low: string) => (m.cues ?? []).find(([k]) => low.includes(norm(k)))?.[1];
  const endMood = Object.keys(bands).find((k) => bands[k] === "end") ?? "night";

  // the thread: short lines that open on one word
  const thread = config.thread ? new RegExp(`^\\s*${escape(plain(config.thread))}(?![\\p{L}\\p{N}_])`, "iu") : null;

  // the closing credits for the pictures: who made each one, then what it is
  const pictures = [
    ...figures.map((f) => [f.credit, f.name]),
    ...strips.flatMap((s) => s.pics.map((p) => [p.credit, p.name])),
    ...faces.map((f) => [f.credit, f.what]),
  ];

  // The mood tints and the config's token overrides, scoped to this essay's root. --lt-tint names
  // the tint of the mood in view; essay.css mixes it into the paper.
  const id = config.slug.replace(/[^\w-]/g, "");
  const scope = `.lt-root[data-essay="${id}"]`;
  const decls = (o?: Record<string, string>) => Object.entries(o ?? {}).filter(([k]) => k.startsWith("--")).map(([k, v]) => `${k}:${v}`);
  const tints = Object.entries(m.tints ?? {}).filter(([k]) => /^[\w-]+$/.test(k));
  const light = [...tints.map(([k, [l]]) => `--lt-m-${k}:${l}`), ...decls(config.tokens)].join(";");
  const dark = [...tints.map(([k, [, d]]) => `--lt-m-${k}:${d}`), ...decls(config.tokensDark)].join(";");
  // every mood the essay names points the paper at its tint: the config's, else the palette's.
  // A mood with neither leaves --lt-tint invalid, and the paper stays plain.
  const named = new Set([m.default, ...(m.byTitle ?? []).map(([, v]) => v), ...(m.cues ?? []).map(([, v]) => v), ...tints.map(([k]) => k)]);
  const style = (
    `${scope}{${light}}${scope}[data-theme="dark"]{${dark}}` +
    [...named].filter((k) => /^[\w-]+$/.test(k)).map((k) => `${scope}[data-mood="${k}"]{--lt-tint:var(--lt-m-${k})}`).join("")
  ).replace(/</g, "\\3c ");

  return {
    id, url, figures, strips, faces, bands, endMood, pictures, thread, style,
    mood: m.default, moodOfTitle, moodOfText,
    keys: config.keys ?? [], odds: config.odds ?? [],
  };
}
type Ctx = ReturnType<typeof prepare>;

// Every word in its own span, tags left alone, so a block can ink itself in word by word.
const inked = (s: string) =>
  s.split(/(<[^>]+>)/).map((part) => (part.startsWith("<") ? part : part.replace(/\S+/g, '<span class="lt-w">$&</span>'))).join("");

// The first mention of each phrase goes in a span of its own, in text, never in a tag: a marker
// stroke under the numbers the essay leans on, the accent on the odds in the opening quote.
function mark(s: string, phrases: string[], cls: string) {
  for (const phrase of phrases) {
    let done = false;
    s = s.split(/(<[^>]+>)/).map((part) => {
      if (done || part.startsWith("<") || !part.includes(phrase)) return part;
      done = true;
      return part.replace(phrase, `<span class="${cls}">${phrase}</span>`);
    }).join("");
  }
  return s;
}

// A recommendation opens on its own short label ("Be agentic", "Just do it"): set that in bold.
const lead = (s: string) =>
  s.replace(/^([^<]{3,72}?)(\?|—| - )/, (_, a: string, b: string) => (b === "?" ? `<strong>${a}?</strong>` : `<strong>${a}</strong>${b}`));

// The essay's opening words, set in capitals after the drop cap.
function opening(s: string) {
  const words = s.split("<")[0].split(" ");
  let n = 0, len = 0;
  while (n < words.length - 1 && len < 28) len += words[n++].length + 1;
  const head = words.slice(0, n).join(" ");
  return n < 3 ? s : `<span class="lt-lead">${head}</span>${s.slice(head.length)}`;
}

// A quote that closes on one short sentence ("It is not so.") gives that sentence a line to itself.
function beat(p: string) {
  const m = p.match(/^(.*[.!?])\s+([^.!?<>]{2,28}[.!?])$/s);
  return m ? `${inked(m[1])} <span class="lt-beat">${inked(m[2])}</span>` : inked(p);
}

// A source as a film credit: who, then the work.
const credit = (s: string) => s.match(/^([^<,]{2,48}),\s+(.+)$/s)?.slice(1, 3) ?? ["", s];

// The default end mark: three asterisks, one above two, in the colour of the text around them.
function Asterism({ size }: { size: number }) {
  const star = (cx: number, cy: number) =>
    [30, 90, 150].map((a) => {
      const dx = Math.cos((a * Math.PI) / 180) * 3.4, dy = Math.sin((a * Math.PI) / 180) * 3.4;
      return `M${(cx - dx).toFixed(2)} ${(cy - dy).toFixed(2)}L${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}`;
    }).join("");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d={star(12, 6.5) + star(6.5, 16.5) + star(17.5, 16.5)} />
    </svg>
  );
}

// A heading's words, each behind its own baseline so it can rise into place. One may lean.
function Rise({ text, lean }: { text: string; lean?: string }) {
  return (
    <>
      {text.split(/\s+/).map((w, i) => (
        <Fragment key={i}>
          <span className="lt-hw">
            <span style={{ "--i": i } as CSSProperties}>{lean && w.toLowerCase() === lean.toLowerCase() ? <em>{w}</em> : w}</span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

function Shot({ pic, className, sizes }: { pic: Pic; className?: string; sizes?: string }) {
  return (
    <span className={className ? `lt-shot ${className}` : "lt-shot"}>
      <img src={pic.src} srcSet={pic.set} sizes={pic.set ? sizes : undefined} alt={pic.alt} width={pic.w} height={pic.h} loading="lazy" decoding="async" />
    </span>
  );
}

function Figure({ fig, mood }: { fig: Ctx["figures"][number]; mood: string }) {
  return (
    <figure className={`lt-fig lt-fig-${fig.lay} lt-rv`} data-mood={mood} style={{ "--ar": (fig.w / fig.h).toFixed(4) } as CSSProperties}>
      <Shot pic={fig} sizes="100vw" />
      <figcaption>
        <span>{fig.name}</span>
      </figcaption>
    </figure>
  );
}

function Strip({ strip, mood }: { strip: Ctx["strips"][number]; mood: string }) {
  return (
    <figure className="lt-strip lt-rv" data-mood={mood}>
      {strip.pics.map((pic, i) => (
        <div key={i} className="lt-strip-item" style={{ "--ar": (pic.w / pic.h).toFixed(4), "--i": i } as CSSProperties}>
          <Shot pic={pic} />
          <span className="lt-strip-name">{pic.name}</span>
        </div>
      ))}
    </figure>
  );
}

function Quote({ q, mood, ctx }: { q: QuoteBlock; mood: string; ctx: Ctx }) {
  const key = norm(q.cite ?? q.paras.join(" "));
  const at = ctx.faces.findIndex((f) => key.includes(f.key));
  const face = ctx.faces[at];
  const said = (
    <blockquote className="lt-say">
      {q.paras.map((p, i) => (
        <p
          key={i}
          className={/^<em>.*<\/em>$/.test(p) ? "lt-orig" : undefined}
          dangerouslySetInnerHTML={html(i === q.paras.length - 1 ? beat(p) : inked(p))}
        />
      ))}
    </blockquote>
  );
  const label = q.cite ? <span dangerouslySetInnerHTML={html(q.cite)} /> : face?.name ? <span>{face.name}</span> : null;
  const cite = label ? (
    <figcaption>
      {label}
      {face?.note ? <span className="lt-note">{face.note}</span> : null}
      {face?.name ? <span className="lt-photo">{face.what}</span> : null}
    </figcaption>
  ) : null;
  if (!face) {
    return (
      <figure className="lt-pull lt-rv" data-mood={mood}>
        {said}
        {cite}
      </figure>
    );
  }
  return (
    <figure className="lt-spread lt-rv" data-side={face.side ?? (at % 2 ? "r" : "l")} data-land={face.w > face.h ? "" : undefined} data-mood={mood}>
      <Shot pic={face} className="lt-face" />
      <div className="lt-spread-say">
        {said}
        {cite}
      </div>
    </figure>
  );
}

function Blocks({ section, first, ctx }: { section: Section; first: boolean; ctx: Ctx }) {
  // the essay may open on a greeting; the paragraph after it takes the drop cap
  const hello = first && section.blocks[0]?.t === "p" && section.blocks[0].html.length < 60;
  let mood = ctx.moodOfTitle(section.title);
  const laid = section.blocks.map((b, i): { mood: string; node: ReactNode; perhaps?: boolean } => {
    const text = plain(textOf(b));
    const low = text.toLowerCase();
    mood = ctx.moodOfText(low) ?? mood;
    if (b.t === "quote") return { mood, node: <Quote key={i} q={b} mood={mood} ctx={ctx} /> };
    if (b.t === "ol") {
      return {
        mood,
        node: (
          <ol key={i} className="lt-steps" data-mood={mood}>
            {b.items.map((item, j) => <li key={j} className="lt-rv lt-ink" dangerouslySetInnerHTML={html(inked(lead(item)))} />)}
          </ol>
        ),
      };
    }
    if (b.t === "ul") {
      return {
        mood,
        node: (
          <ul key={i} className="lt-list lt-rv lt-ink" data-mood={mood}>
            {b.items.map((item, j) => <li key={j} dangerouslySetInnerHTML={html(inked(item))} />)}
          </ul>
        ),
      };
    }
    const fig = ctx.figures.find((f) => low.includes(f.key));
    const strip = ctx.strips.find((s) => low.includes(s.key));
    const drop = first && i === (hello ? 1 : 0);
    const cls = hello && i === 0 ? "lt-hello" : drop ? "lt-p lt-drop" : "lt-p";
    const body = mark(drop ? opening(b.html) : b.html, ctx.keys, "lt-key");
    // a line that opens on the thread word is one of the set a thread links (see below); its first word takes the accent
    const perhaps = !!ctx.thread && ctx.thread.test(text);
    const words = perhaps ? inked(body).replace('<span class="lt-w">', '<span class="lt-w lt-pw">') : inked(body);
    const para = <p className={`${cls}${perhaps ? " lt-perhaps" : ""} lt-rv lt-ink`} data-mood={mood} dangerouslySetInnerHTML={html(words)} />;
    if (fig?.lay === "side") {
      return {
        mood,
        perhaps,
        node: (
          <div key={i} className="lt-row">
            <Figure fig={fig} mood={mood} />
            {para}
          </div>
        ),
      };
    }
    return {
      mood,
      perhaps,
      node: (
        <Fragment key={i}>
          {fig && !fig.after ? <Figure fig={fig} mood={mood} /> : null}
          {strip && !strip.after ? <Strip strip={strip} mood={mood} /> : null}
          {para}
          {fig?.after ? <Figure fig={fig} mood={mood} /> : null}
          {strip?.after ? <Strip strip={strip} mood={mood} /> : null}
        </Fragment>
      ),
    };
  });
  // The thread lines, found by their text: from the first one's picture to the last one, in one box (.lt-maybe)
  const flags = laid.map((l) => !!l.perhaps);
  const from = flags.indexOf(true), to = flags.lastIndexOf(true);
  if (to > from) {
    const run = laid.slice(from, to + 1);
    laid.splice(from, run.length, { mood: run[0].mood, node: <div key={`maybe-${from}`} className="lt-maybe">{run.map((l) => l.node)}</div> });
  }
  // a run of blocks in a dark mood is one band, as wide as the window
  const out: ReactNode[] = [];
  for (let i = 0; i < laid.length; i++) {
    const m = laid[i].mood;
    const band = ctx.bands[m];
    if (!band) {
      out.push(laid[i].node);
      continue;
    }
    const run: ReactNode[] = [];
    for (; i < laid.length && laid[i].mood === m; i++) run.push(laid[i].node);
    i--;
    out.push(
      <div key={`night-${i}`} className={`lt-night lt-night-${band}`} data-mood={m}>
        {run}
      </div>,
    );
  }
  return <>{out}</>;
}

// An essay, lit like a film. It opens at night: a title card over a rising globe, then the opening
// quote alone on the dark. The essay is a sheet of paper that slides up over that, one serif column
// in the middle of the window with nothing beside it. What the essay itself holds gets the room:
// quotes and photographs break out past the column and the recommendations sit two across. The
// lights go out in the middle for any passage the config calls a band, and again at the end, for
// the last picture and the sources, which run as the credits. A row of dots at the left edge is the
// only contents list.
// The words come from `doc` (scripts/sync_essay.py writes it from a Markdown note) and everything
// else about this essay comes from `config`. Two slots let a site add its own: `afterByline` (a
// view count) and `afterCredits` (comments). `endMark` draws the mark that closes the essay.
// lib/essay/motion.ts brings the words up; EssayTheme switches light and dark.
export default function Essay({
  doc,
  config,
  draft = false,
  afterByline,
  afterCredits,
  endMark = (size) => <Asterism size={size} />,
}: {
  doc: EssayDoc;
  config: EssayConfig;
  draft?: boolean;
  afterByline?: ReactNode;
  afterCredits?: ReactNode;
  endMark?: (size: number) => ReactNode;
}) {
  const ctx = prepare(config);
  const hero = config.hero;
  let n = 0;
  const numbered = doc.sections.filter((s) => !unlabeled(s.title));
  return (
    <div className={`lt-root ${newsreader.variable} ${plexMono.variable}`} data-palette={config.palette ?? "illinois"} data-essay={ctx.id} suppressHydrationWarning>
      <style dangerouslySetInnerHTML={html(ctx.style)} />
      <script dangerouslySetInnerHTML={html(boot)} />
      <EssayMotion />
      <span className="lt-progress" aria-hidden="true" />
      <header className="lt-hero" data-mood={ctx.mood}>
        {hero ? (
          // three layers of one frame; they move apart on the way down
          <div className="lt-scene" aria-hidden="true">
            <img className="lt-sky" src={ctx.url(hero.sky)} alt="" width={hero.w} height={hero.h} fetchPriority="high" decoding="async" />
            <span className="lt-orb">
              <img src={ctx.url(hero.orb)} alt="" width={hero.w} height={hero.h} decoding="async" />
            </span>
            <img className="lt-land" src={ctx.url(hero.land)} alt="" width={hero.w} height={hero.h} decoding="async" />
          </div>
        ) : (
          // no pictures: a night sky and one soft orb, drawn in CSS, moving the same way
          <div className="lt-scene lt-scene-css" aria-hidden="true">
            <span className="lt-sky" />
            <span className="lt-orb">
              <span className="lt-orb-glow" />
            </span>
          </div>
        )}
        <div className="lt-hero-in">
          <p className="lt-kicker">
            {config.kicker}
            {draft ? <span className="lt-draft">Draft</span> : null}
          </p>
          <h1 className="lt-title">
            <Rise text={doc.title} lean={config.titleLean} />
          </h1>
          <p className="lt-by">{config.byline}</p>
          {afterByline}
          <EssayTheme />
        </div>
        <span className="lt-cue" aria-hidden="true" />
      </header>
      {doc.epigraph ? (
        <div className="lt-open" data-mood={ctx.mood}>
          <figure className="lt-epi lt-rv">
            <blockquote className="lt-say">
              {doc.epigraph.paras.map((p, i) => <p key={i} dangerouslySetInnerHTML={html(inked(mark(p, ctx.odds, "lt-odds")))} />)}
            </blockquote>
            {doc.epigraph.cite ? <figcaption dangerouslySetInnerHTML={html(doc.epigraph.cite)} /> : null}
          </figure>
        </div>
      ) : null}
      <div className="lt-sheet">
        {numbered.length ? (
          <nav className="lt-dots" aria-label="Sections">
            <ol>
              {numbered.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="lt-dot" aria-hidden="true" />
                    <span className="lt-dot-name">
                      {two(i + 1)} {s.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <article className="lt-text">
          {doc.sections.map((s, i) => {
            const bare = unlabeled(s.title);
            return (
              <section key={s.id} id={s.id} className={bare ? "lt-sec lt-bare" : "lt-sec"}>
                {/* the close has no title; it opens on the end mark between the two rules, so it reads as the end */}
                {bare ? (
                  i > 0 ? (
                    <header className="lt-head lt-break lt-rv" data-mood={ctx.moodOfTitle(s.title)} aria-hidden="true">
                      <span className="lt-n">{endMark(44)}</span>
                    </header>
                  ) : null
                ) : (
                  <header className="lt-head lt-rv" data-mood={ctx.moodOfTitle(s.title)}>
                    <span className="lt-n" aria-hidden="true">{two(++n)}</span>
                    <h2 className="lt-h">
                      <Rise text={s.title} />
                    </h2>
                  </header>
                )}
                {s.blocks.length ? (
                  <Blocks section={s} first={i === 0} ctx={ctx} />
                ) : (
                  <p className="lt-todo" data-mood={ctx.moodOfTitle(s.title)}>Not written yet</p>
                )}
              </section>
            );
          })}
          <footer className="lt-credits" data-mood={ctx.endMood}>
            <div className="lt-end" aria-hidden="true">{endMark(30)}</div>
            {doc.sources.length ? (
              <section id="sources" aria-labelledby="sources-h">
                <h2 id="sources-h" className="lt-credits-h">Sources</h2>
                <ul className="lt-roll lt-rv">
                  {doc.sources.map((item, j) => {
                    const [who, work] = credit(item);
                    return (
                      <li key={j} style={{ "--i": j } as CSSProperties}>
                        {who ? <span className="lt-who">{who}</span> : null}
                        <span className="lt-work" dangerouslySetInnerHTML={html(work)} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
            {ctx.pictures.length ? (
              <section id="pictures" aria-labelledby="pictures-h">
                <h2 id="pictures-h" className="lt-credits-h">Pictures</h2>
                <ul className="lt-roll lt-rv">
                  {ctx.pictures.map(([who, work], j) => (
                    <li key={j} style={{ "--i": j } as CSSProperties}>
                      <span className="lt-who">{who}</span>
                      <span className="lt-work">{work}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </footer>
          {afterCredits}
        </article>
      </div>
    </div>
  );
}
