#!/usr/bin/env python3
"""Usage: check_essay.py <doc.json> <config.json> <public pictures dir>"""
import html
import json
import os
import re
import sys

TAG = re.compile(r"<[^>]+>")
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
FORBIDDEN = ["Photo:", "Credit", "courtesy", "CC BY", "©", "Library of Congress"]
MAX_CAPTION = 60
MAX_KB = 700
PIL_MISSING = False


def norm(s):
    s = html.unescape(TAG.sub("", s or ""))
    s = s.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    return " ".join(s.split())


def block_text(b):
    t = b.get("t")
    if t == "p":
        return norm(b.get("html"))
    if t == "quote":
        return norm(" ".join(list(b.get("paras", [])) + [b.get("cite") or ""]))
    if t in ("ol", "ul"):
        return norm(" ".join(b.get("items", [])))
    return ""


def pixel_size(path):
    global PIL_MISSING
    try:
        from PIL import Image
    except ImportError:
        PIL_MISSING = True
        return None
    with Image.open(path) as im:
        return im.size


def check_caption(problems, where, text):
    text = text or ""
    if len(text) > MAX_CAPTION:
        problems.append(f"caption is {len(text)} characters, max {MAX_CAPTION} ({where})")
    if "\n" in text or "\r" in text:
        problems.append(f"caption has a line break ({where})")
    low = text.lower()
    for bad in FORBIDDEN:
        if bad.lower() in low:
            problems.append(f'caption contains "{bad}" ({where})')


def check_picture(problems, notes, where, e, pic_dir):
    src = e.get("src", "")
    path = os.path.join(pic_dir, src)
    if not src or not os.path.isfile(path):
        problems.append(f"picture file not found: {src or '(unset)'} ({where}.src)")
        return
    size = None
    try:
        size = pixel_size(path)
    except Exception as exc:
        problems.append(f"cannot read pixel size of {src}: {exc} ({where}.src)")
    if size is not None and size != (e.get("w"), e.get("h")):
        problems.append(
            f"config size {e.get('w')}x{e.get('h')} but {src} is {size[0]}x{size[1]} ({where})"
        )
    alt = (e.get("alt") or "").strip()
    if not alt:
        problems.append(f"alt is empty ({where}.alt)")
    elif not alt.endswith("."):
        problems.append(f"alt does not end with a full stop ({where}.alt)")
    if not (e.get("credit") or "").strip():
        problems.append(f"credit is empty ({where}.credit)")
    if os.path.getsize(path) > MAX_KB * 1024:
        notes.append(f"{src} is over {MAX_KB} KB ({where})")


def main(argv):
    if len(argv) != 4:
        print(__doc__, file=sys.stderr)
        return 2
    doc_path, cfg_path, pic_dir = argv[1:]
    with open(doc_path, encoding="utf-8") as f:
        doc = json.load(f)
    with open(cfg_path, encoding="utf-8") as f:
        cfg = json.load(f)

    problems, notes = [], []

    blocks = [b for s in doc.get("sections", []) for b in s.get("blocks", [])]
    epi = doc.get("epigraph") or {}
    epi_text = block_text(epi)
    para_texts = [block_text(b) for b in blocks if b.get("t") == "p"]
    body_texts = [block_text(b) for b in blocks]
    all_texts = [block_text(b) for b in [epi] + blocks]
    quote_texts = [block_text(b) for b in [epi] + blocks if b.get("t") == "quote"]

    for kind in ("figures", "strips"):
        for i, item in enumerate(cfg.get(kind, [])):
            anchor = norm(item.get("at", ""))
            n = sum(1 for p in para_texts if anchor in p)
            if n != 1:
                problems.append(f'anchor "{item.get("at", "")}" is in {n} paragraphs, needs 1 ({kind}[{i}].at)')

    for i, f in enumerate(cfg.get("faces", [])):
        m = norm(f.get("match", ""))
        if not any(m in t for t in quote_texts):
            problems.append(f'face match "{f.get("match", "")}" is in no quote (faces[{i}].match)')

    for i, row in enumerate(cfg.get("moods", {}).get("cues", [])):
        if not any(norm(row[0]) in t for t in all_texts):
            problems.append(f'mood cue "{row[0]}" is in no block (moods.cues[{i}][0])')

    for i, k in enumerate(cfg.get("keys", [])):
        if not any(norm(k) in t for t in body_texts):
            problems.append(f'key "{k}" is not in the body (keys[{i}])')
    for i, o in enumerate(cfg.get("odds", [])):
        if norm(o) not in epi_text:
            problems.append(f'odd "{o}" is not in the epigraph (odds[{i}])')

    th = cfg.get("thread")
    if th:
        n = sum(1 for p in para_texts if p.startswith(norm(th)))
        if n < 2:
            problems.append(f'thread "{th}" starts {n} paragraph(s), needs 2 (thread)')

    entries = [(f"figures[{i}]", f) for i, f in enumerate(cfg.get("figures", []))]
    entries += [
        (f"strips[{i}].pics[{j}]", p)
        for i, s in enumerate(cfg.get("strips", []))
        for j, p in enumerate(s.get("pics", []))
    ]
    entries += [(f"faces[{i}]", f) for i, f in enumerate(cfg.get("faces", []))]
    for where, e in entries:
        check_picture(problems, notes, where, e, pic_dir)
        if "name" in e:
            check_caption(problems, f"{where}.name", e["name"])

    for i, f in enumerate(cfg.get("figures", [])):
        if f.get("lay") == "side" and f.get("w", 0) > f.get("h", 0):
            notes.append(f"figures[{i}] has lay side but is landscape ({f.get('w')}x{f.get('h')})")
    for i, f in enumerate(cfg.get("faces", [])):
        if not f.get("note"):
            notes.append(f"faces[{i}] ({f.get('src')}) has no note")

    hero = cfg.get("hero") or {}
    if hero:
        for k in ("sky", "orb", "land"):
            name = hero.get(k, "")
            path = os.path.join(pic_dir, name)
            if not name or not os.path.isfile(path):
                problems.append(f"hero file not found: {name or '(unset)'} (hero.{k})")
            elif os.path.getsize(path) > MAX_KB * 1024:
                notes.append(f"{name} is over {MAX_KB} KB (hero.{k})")

    mo = cfg.get("moods") or {}
    bands = mo.get("bands") or {}
    tints = mo.get("tints") or {}
    used = {}
    for i, row in enumerate(mo.get("byTitle") or []):
        used.setdefault(row[1], f"moods.byTitle[{i}]")
    for i, row in enumerate(mo.get("cues") or []):
        used.setdefault(row[1], f"moods.cues[{i}]")
    palette_moods = {"doubt", "ask", "knowing", "honor", "act", "together"}
    for mood, where in used.items():
        if mood not in bands and mood not in tints and mood not in palette_moods:
            notes.append(f'mood "{mood}" has no tint, so the paper stays plain there ({where})')
    for mood, pair in tints.items():
        ok = isinstance(pair, list) and len(pair) == 2 and all(
            isinstance(c, str) and HEX.match(c) for c in pair
        )
        if not ok:
            problems.append(f'tint for "{mood}" is not a pair of #RRGGBB colors (moods.tints.{mood})')

    if PIL_MISSING:
        notes.append("Pillow not installed, picture pixel sizes not checked")

    for p in problems:
        print(f"problem: {p}")
    for n in notes:
        print(f"note: {n}")
    print(f"{len(problems)} problems, {len(notes)} notes")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
