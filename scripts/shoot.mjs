import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const pos = [];
let widths = [1440, 390];
let dark = false;
let loud = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--widths") widths = argv[++i].split(",").map(Number);
  else if (argv[i] === "--dark") dark = true;
  else if (argv[i] === "--loud") loud = argv[++i];
  else pos.push(argv[i]);
}
if (pos.length < 2) {
  console.error("usage: node shoot.mjs <url> <out dir> [--widths 1440,390] [--dark] [--loud 0..1]");
  process.exit(2);
}
const [rawUrl, outDir] = pos;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadPlaywright() {
  const specs = [];
  if (process.env.PLAYWRIGHT_CORE) specs.push(pathToFileURL(process.env.PLAYWRIGHT_CORE).href);
  specs.push("playwright-core", "playwright");
  for (const spec of specs) {
    try {
      const m = await import(spec);
      const pw = m.chromium ? m : m.default;
      if (pw?.chromium) return pw;
    } catch {}
  }
  return null;
}

const pw = await loadPlaywright();
if (!pw) {
  console.error("playwright not found. install: npm i -D playwright-core && npx playwright install chromium");
  process.exit(2);
}

const url = new URL(rawUrl);
if (loud !== null) url.searchParams.set("loud", loud);
mkdirSync(outDir, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
let bad = false;
try {
  for (const w of widths) {
    const h = w >= 700 ? 900 : 844;
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    if (dark) await context.addInitScript(() => localStorage.setItem("lt-theme", "dark"));
    const page = await context.newPage();

    const errors = [];
    let consoleCount = 0;
    let pageCount = 0;
    page.on("console", (m) => {
      if (m.type() === "error") {
        consoleCount++;
        errors.push(m.text());
      }
    });
    page.on("pageerror", (e) => {
      pageCount++;
      errors.push(`[page] ${e.message}`);
    });

    await page.goto(url.toString(), { waitUntil: "networkidle" });

    const step = Math.floor(h * 0.8);
    for (let y = 0; ; ) {
      const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      y = Math.min(y + step, max);
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await sleep(120);
      if (y >= max) break;
    }
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);

    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));

    const shots = [];
    const shot = async (name, opts = {}) => {
      await page.screenshot({ path: join(outDir, `${w}-${name}.png`), ...opts });
      shots.push(name);
    };

    await shot("top");
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    for (const f of [0.15, 0.35, 0.55, 0.75, 0.95]) {
      await page.evaluate((v) => window.scrollTo(0, v), Math.round(f * max));
      await sleep(1200);
      await shot(`at${String(Math.round(f * 100)).padStart(2, "0")}`);
    }
    // the parts a fixed fraction can miss: the opening quote, the dark band, the ending
    for (const [name, sel] of [["open", ".lt-open"], ["band", ".lt-night-band"], ["end", ".lt-night-end"], ["credits", ".lt-credits"]]) {
      // measured from the top: the opening quote is sticky, so from further down it reads as wherever the reader is
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(100);
      const top = await page.evaluate((q) => {
        const el = document.querySelector(q);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      }, sel);
      if (top === null) continue;
      await page.evaluate((v) => window.scrollTo(0, v), Math.max(0, Math.round(top - h * 0.1)));
      await sleep(1200);
      await shot(`part-${name}`);
    }
    // back to the top first, so fixed parts (the progress line, the dots) do not land mid-page
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);
    await shot("full", { fullPage: true });

    console.log(`${w}: ${shots.length} shots, ${consoleCount} console errors`);
    for (const e of errors.slice(0, 3)) console.log(`  - ${e.slice(0, 300)}`);

    const over = dims.sw - dims.iw > 1;
    console.log(`${w}: scrollWidth ${dims.sw} vs innerWidth ${dims.iw}${over ? " horizontal overflow" : ""}`);
    if (pageCount > 0 || over) bad = true;

    await context.close();
  }
} catch (e) {
  console.error(e.message);
  bad = true;
} finally {
  await browser.close();
}
process.exit(bad ? 1 : 0);
