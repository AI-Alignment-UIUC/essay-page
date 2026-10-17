// What the essay's stylesheet cannot know on its own. It needs no framework: give it the .lt-root
// element and keep the function it returns to stop it. Five kinds of motion, each with one job:
//   ink     a block's words come up in reading order as the reader reaches it (.lt-ink, .lt-w)
//   speak   a quote lights word by word with the scroll, and stays lit once heard (.lt-say)
//   mood    the paper takes the tint of the stretch at the reading line (data-mood on .lt-root)
//   cover   the opening quote falls back as the sheet slides over it (--lt-cover, data-covered)
//   tuck    the masthead steps aside on the way down and returns on the way up (html.lt-tuck),
//           and has no ground of its own while it is over the night at the top (html.lt-top)
// It also marks the section dots, html.lt-scrolled once the page has moved, and, where CSS scroll
// timelines are missing, the progress line.
// The dial is ?loud=0..1 (written to --lt-loud): 1 is all of it, 0 holds everything still.
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export function startEssayMotion(root: HTMLElement): () => void {
  const page = document.documentElement;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dial = new URLSearchParams(location.search).get("loud");
  const loud = dial === null ? 1 : clamp(Number(dial) || 0);
  if (dial !== null) root.style.setProperty("--lt-loud", String(loud));
  const lively = !still && loud > 0;
  root.classList.add("lt-js", "lt-live");
  const timers: number[] = [];

  // ink
  const ink = (el: HTMLElement) => {
    const words = el.querySelectorAll<HTMLElement>(".lt-w");
    const span = Math.min(words.length * 16, 720) * loud;
    words.forEach((w, i) =>
      w.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: (i / words.length) * span, easing: OUT, fill: "backwards" }),
    );
  };
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add("lt-in");
        if (lively && el.classList.contains("lt-ink")) ink(el);
        seen.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -7% 0px" },
  );
  root.querySelectorAll(".lt-rv").forEach((r) => seen.observe(r));

  // speak
  const says = !lively ? [] : Array.from(root.querySelectorAll<HTMLElement>(".lt-say")).map((el) => ({
    el, words: Array.from(el.querySelectorAll<HTMLElement>(".lt-w")), lit: 0, done: false,
  }));
  if (says.length) root.classList.add("lt-speaks");
  const speak = (vh: number) => {
    for (const s of says) {
      if (s.done) continue;
      const top = s.el.getBoundingClientRect().top;
      if (top > vh) continue;
      const k = Math.round(clamp((vh * 0.88 - top) / (vh * 0.44)) * s.words.length);
      if (k === s.lit) continue;
      for (let i = Math.min(k, s.lit); i < Math.max(k, s.lit); i++) s.words[i].classList.toggle("on", i < k);
      s.lit = k;
      s.done = k === s.words.length;
    }
  };
  // a reader who stops partway through a quote still gets the rest of it
  const finish = () => {
    for (const s of says) {
      if (s.done || !s.lit) continue;
      s.done = true;
      s.words.slice(s.lit).forEach((w, i) => timers.push(window.setTimeout(() => w.classList.add("on"), i * 22)));
    }
  };

  // mood, cover, dots, tuck, progress
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-mood]"));
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".lt-dots a"));
  const sheet = root.querySelector<HTMLElement>(".lt-sheet");
  const stage = root.querySelector<HTMLElement>(".lt-open");
  const bar = root.querySelector<HTMLElement>(".lt-progress");
  const timeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");
  let frame = 0, idle = 0, lastY = window.scrollY, covered = -1, mood = "";
  const read = () => {
    frame = 0;
    const y = window.scrollY, vh = window.innerHeight, line = vh * 0.46;
    let block = blocks[0];
    for (const b of blocks) if (b.getBoundingClientRect().top <= line) block = b;
    if (block && block.dataset.mood !== mood) {
      mood = block.dataset.mood ?? "";
      root.dataset.mood = mood;
    }
    const section = block?.closest("section")?.id;
    for (const a of links) a.toggleAttribute("data-on", a.hash === `#${section}`);
    const edge = sheet ? sheet.getBoundingClientRect().top : 0;
    const cover = Math.round(clamp(1 - edge / vh) * 200) / 200;
    if (cover !== covered) {
      covered = cover;
      stage?.style.setProperty("--lt-cover", String(cover));
      root.toggleAttribute("data-covered", cover === 1);
    }
    page.classList.toggle("lt-top", edge > 60);
    page.classList.toggle("lt-scrolled", y > 8);
    // the dots keep the reader company on the paper, and leave for the ending and the credits
    root.toggleAttribute("data-reading", edge < vh * 0.35 && !block?.closest(".lt-night-end, .lt-credits"));
    if (Math.abs(y - lastY) > 4) {
      // over the title card it goes at once, so the title never passes under it
      page.classList.toggle("lt-tuck", y > lastY && y > (edge > vh ? 24 : 260));
      lastY = y;
    }
    if (bar && !timeline) bar.style.transform = `scaleX(${clamp(y / Math.max(1, page.scrollHeight - vh))})`;
    speak(vh);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(read);
    window.clearTimeout(idle);
    idle = window.setTimeout(finish, 900);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  read();
  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(idle);
    timers.forEach((t) => window.clearTimeout(t));
    seen.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    page.classList.remove("lt-tuck", "lt-top", "lt-scrolled");
    root.classList.remove("lt-js", "lt-live", "lt-speaks");
    root.style.removeProperty("--lt-loud");
    stage?.style.removeProperty("--lt-cover");
    root.removeAttribute("data-reading");
    root.removeAttribute("data-covered");
    delete root.dataset.mood;
  };
}
