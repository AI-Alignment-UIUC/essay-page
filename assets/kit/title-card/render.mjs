// Paint a title card (rise.html, or another scene file) and write its three layers for the page:
// <out dir>/rise-{sky,orb,land}.avif at 2560x1440. The scene is drawn with the cinematic-slides
// skill's kit (https://github.com/AI-Alignment-UIUC/cinematic-slides); open the scene beside a copy
// of kit.js to see the whole frame.
// Run: node render.mjs <out dir> [scene.html]
// Needs playwright-core and a Chromium (PLAYWRIGHT_CORE and CHROMIUM override where they are), the
// kit's kit.js (KIT overrides ~/.claude/skills/cinematic-slides/assets/scenes/kit.js), and Pillow
// with AVIF support for the encode (PYTHON overrides python3).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [outArg, sceneArg] = process.argv.slice(2);
if (!outArg) {
  console.error("usage: node render.mjs <out dir> [scene.html]");
  process.exit(2);
}
const out = path.resolve(outArg);
const scene = path.resolve(sceneArg ?? path.join(here, "rise.html"));
const kit = process.env.KIT ?? path.join(os.homedir(), ".claude/skills/cinematic-slides/assets/scenes/kit.js");
const py = process.env.PYTHON ?? "python3";

const load = async () => {
  if (process.env.PLAYWRIGHT_CORE) return (await import(pathToFileURL(process.env.PLAYWRIGHT_CORE).href)).default;
  try { return await import("playwright-core"); } catch {}
  return await import("playwright");
};
const { chromium } = await load();

fs.mkdirSync(out, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), "title-card-"));
fs.copyFileSync(kit, path.join(work, "kit.js"));
fs.copyFileSync(scene, path.join(work, "scene.html"));

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2560 / 1920 });
for (const layer of ["sky", "orb", "land"]) {
  const page = await ctx.newPage();
  await page.goto(`${pathToFileURL(path.join(work, "scene.html")).href}?layer=${layer}`);
  await page.waitForFunction(() => window.__ready === true);
  await page.screenshot({ path: path.join(work, `${layer}.png`), omitBackground: true });
  await page.close();
}
await browser.close();

// quality 55 kept the globe's glow clean at about 110 KB; 45 banded it and 65 cost half again
const encode = `
import sys
from PIL import Image
work, out = sys.argv[1], sys.argv[2]
for layer, mode in (("sky", "RGB"), ("orb", "RGBA"), ("land", "RGBA")):
    Image.open(f"{work}/{layer}.png").convert(mode).save(f"{out}/rise-{layer}.avif", quality=55, speed=4)
`;
execFileSync(py, ["-I", "-c", encode, work, out], { stdio: "inherit" });
fs.rmSync(work, { recursive: true });
console.log(`rise-sky.avif, rise-orb.avif, rise-land.avif -> ${out}`);
