// Contrast check for the essay set. Reads the palettes from essay-tokens.css and the night rebinding
// from essay.css, then tests every text role against the ground it is set on, in both palettes and
// both modes, on the night, on the black ending and on every mood tint of the configs it is given.
// usage: node check_contrast.mjs [--all] <essay-tokens.css> <essay.css> [config.json ...]
// It prints the lowest text pair per palette and mode and any failure; --all prints every pair.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const all = args.includes("--all");
const [tokensPath, cssPath, ...configs] = args.filter((a) => a !== "--all");
if (!tokensPath || !cssPath) { console.error("usage: node check_contrast.mjs [--all] <essay-tokens.css> <essay.css> [config.json ...]"); process.exit(2); }

const rules = (path) => {
  const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim(),
    decl: Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)].map(([, k, v]) => [k, v.trim()])),
  }));
};

// which selector alternatives apply to a palette and mode
const applies = (sel, palette, mode) =>
  sel.replace(/^:where\(|\)$/g, "").split(/,(?![^\[]*\])/).some((alt) => {
    alt = alt.trim();
    if (!alt.startsWith(".lt-root")) return false;
    const dark = /\[data-theme="dark"\]/.test(alt);
    const pal = alt.match(/\[data-palette="(\w+)"\]/)?.[1];
    return (!dark || mode === "dark") && (!pal || pal === palette);
  });

const resolve = (vars, v, depth = 0) =>
  depth > 8 ? v : v.replace(/var\((--[\w-]+)\)/g, (_, n) => (vars[n] ? resolve(vars, vars[n], depth + 1) : n));

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const tokenRules = rules(tokensPath).filter((r) => r.sel.includes(".lt-root"));
const night = rules(cssPath).find((r) => r.sel.includes(".lt-hero") && r.decl["--lt-ink"]);
if (!night) { console.error("no night rebinding rule (.lt-hero, .lt-open, ...) found in essay.css"); process.exit(2); }

const tints = {};
for (const c of configs) {
  const t = JSON.parse(readFileSync(c, "utf8")).moods?.tints ?? {};
  for (const [m, [l, d]] of Object.entries(t)) (tints[`${m}`] ??= []).push([l, d]);
}

let worst = 99, failed = 0;
const rows = [], low = {};
const test = (where, role, fg, bg, min) => {
  const r = ratio(fg, bg);
  worst = Math.min(worst, r);
  const ok = r >= min;
  if (!ok) failed++;
  const key = where.split(" /")[0];
  if (min >= 4.5 && (!low[key] || r < low[key].r)) low[key] = { r, role, where, fg, bg };
  rows.push(`${ok ? "ok  " : "FAIL"} ${where.padEnd(22)} ${role.padEnd(26)} ${fg} on ${bg}  ${r.toFixed(2)}:1 (need ${min})`);
};

// every palette the token file names, the default one first
const palettes = ["illinois", ...new Set(tokenRules.flatMap((r) => [...r.sel.matchAll(/data-palette="(\w+)"/g)].map((x) => x[1])))].filter((p, i, a) => a.indexOf(p) === i);
for (const palette of palettes) {
  for (const mode of ["light", "dark"]) {
    const vars = {};
    for (const r of tokenRules) if (applies(r.sel, palette, mode)) Object.assign(vars, r.decl);
    const root = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, resolve(vars, v)]));
    const at = `${palette} ${mode}`;
    // the night's own names: the rebinding rule read against the root's values
    const dim = Object.fromEntries(Object.entries(night.decl).map(([k, v]) => [k, resolve({ ...root, ...night.decl }, v)]));
    const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
    const need = (o, k) => { const v = hex(o[k]); if (!v) throw new Error(`${at}: ${k} is not a plain hex (${o[k]})`); return v; };

    // on the paper
    const paper = need(root, "--lt-paper");
    test(at, "ink on paper", need(root, "--lt-ink"), paper, 4.5);
    test(at, "soft on paper", need(root, "--lt-soft"), paper, 4.5);
    test(at, "accent-text on paper", need(root, "--lt-accent-text"), paper, 4.5);
    test(at, "focus ring on paper (3:1)", need(root, "--lt-focus"), paper, 3);
    // on every tint, mixed in at full strength (--lt-loud: 1)
    for (const [m, list] of Object.entries(tints)) {
      for (const [l, d] of list) {
        const bg = mode === "dark" ? d : l;
        if (!hex(bg)) continue;
        for (const role of ["ink", "soft", "accent-text"]) test(`${at} / ${m}`, `${role} on tint`, need(root, `--lt-${role}`), bg, 4.5);
      }
    }
    // on the palette's own mood tints
    for (const k of Object.keys(root).filter((k) => k.startsWith("--lt-m-")))
      for (const role of ["ink", "soft", "accent-text"]) test(`${at} / ${k.slice(7)}`, `${role} on tint`, need(root, `--lt-${role}`), need(root, k), 4.5);
    // on the night, and on the black ending
    const ground = need(root, "--lt-night");
    for (const [name, bg] of [["night", ground], ["black ending", need(root, "--lt-black")]]) {
      test(`${at} / ${name}`, "cream (ink) on night", need(root, "--lt-cream"), bg, 4.5);
      test(`${at} / ${name}`, "night-soft (soft) on night", need(root, "--lt-night-soft"), bg, 4.5);
      test(`${at} / ${name}`, "amber (accent-text) on night", need(root, "--lt-amber"), bg, 4.5);
      test(`${at} / ${name}`, "glow (accent mark) 3:1", need(root, "--lt-glow"), bg, 3);
    }
    // the rebinding really points the text roles at those three
    for (const [role, to] of [["--lt-ink", "--lt-cream"], ["--lt-soft", "--lt-night-soft"], ["--lt-accent-text", "--lt-amber"]])
      if (dim[role] !== root[to]) { failed++; rows.push(`FAIL ${at}: ${role} on the night is ${dim[role]}, expected ${to}`); }
  }
}

console.log((all ? rows : rows.filter((r) => r.startsWith("FAIL"))).join("\n"));
for (const [k, v] of Object.entries(low)) console.log(`${k.padEnd(15)} lowest text pair ${v.r.toFixed(2)}:1  ${v.role} (${v.fg} on ${v.bg}) at ${v.where}`);
console.log(`contrast: ${rows.length} pairs, lowest ${worst.toFixed(2)}:1, ${failed ? failed + " failed" : "all pass"}`);
process.exit(failed ? 1 : 0);
