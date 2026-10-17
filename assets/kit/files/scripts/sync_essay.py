"""Turn an essay's Markdown note into the JSON the essay page reads.
Run: python3 -I scripts/sync_essay.py "<path to the note>.md" content/essays/<slug>.json   (again whenever the note changes)
Needs markdown-it-py.

What the note may hold, top to bottom:
  a > quote above the first heading      the epigraph; its last paragraph is the attribution
  ## Intro / ## Close                    sections with no number or title on the page
  ## Any other title                     a numbered section ("Section 3 - " in front is dropped)
  > quote, blank > line, > attribution   a quote; one paragraph alone is a quote with no attribution
  1) item  or  - item                    a numbered list (two across on the page) or a plain list
  ## Sources with - items                the closing credits
  ## Notes                               dropped, with everything under it
  text ## note to self                   the tail from " ## " on stays in the note and is printed
  %% comment %%                          dropped
The note's file name is the essay's title."""
import json, pathlib, re, sys
from markdown_it import MarkdownIt

if len(sys.argv) != 3: sys.exit(__doc__)
NOTE, DST = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
md = MarkdownIt("commonmark", {"typographer": True}).enable(["smartquotes"])

def inline(s):
    s = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", s.strip())
    return md.renderInline(s).replace("<a href=", '<a rel="noreferrer" href=')

def quote(lines):
    paras, cur = [], []
    for l in lines + [""]:
        l = re.sub(r"^>\s?", "", l).strip()
        if l: cur.append(l)
        elif cur: paras.append(inline(" ".join(cur))); cur = []
    cite = paras.pop() if len(paras) > 1 else None
    return {"t": "quote", "paras": paras, "cite": cite}

text = re.sub(r"%%.*?%%", "", NOTE.read_text(encoding="utf-8"), flags=re.S)
lines = text.split("\n")
sections, cur, i, dropped = [], {"title": "", "blocks": []}, 0, []
while i < len(lines):
    l = lines[i]
    if m := re.match(r"^#{1,6}\s+(?:Section\s+\d+\s*-\s*)?(.*)$", l):
        sections.append(cur); cur = {"title": m.group(1).strip().strip('"'), "blocks": []}
    elif l.startswith(">"):
        j = i
        while j < len(lines) and lines[j].startswith(">"): j += 1
        cur["blocks"].append(quote(lines[i:j])); i = j; continue
    elif m := re.match(r"^\s*(?:\d+\)|-)\s+(.*)$", l):
        kind = "ul" if l.lstrip().startswith("-") else "ol"
        if not (cur["blocks"] and cur["blocks"][-1]["t"] == kind): cur["blocks"].append({"t": kind, "items": []})
        cur["blocks"][-1]["items"].append(inline(m.group(1)))
    elif l.strip():
        # a note to self left in the draft ("... ## move this") stays in the note and off the page
        if m := re.search(r"\s+##\s.*$", l): dropped.append(m.group(0).strip()); l = l[:m.start()]
        cur["blocks"].append({"t": "p", "html": inline(l)})
    i += 1
sections.append(cur)

head = sections.pop(0)                        # what sits above the first heading: the opening quote
if (k := next((n for n, s in enumerate(sections) if s["title"].lower().startswith("notes")), None)) is not None:
    sections = sections[:k]
sources = next((s for s in sections if s["title"].lower() == "sources"), None)
if sources: sections.remove(sources)
plain = re.sub(r"<[^>]+>", " ", " ".join(b.get("html", "") + " ".join(b.get("paras", []) + b.get("items", [])) for s in sections for b in s["blocks"]))
out = {
    "title": NOTE.stem,
    "epigraph": next((b for b in head["blocks"] if b["t"] == "quote"), None),
    "sections": [dict(s, id=re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-") or f"part-{n}") for n, s in enumerate(sections)],
    "sources": sources["blocks"][0]["items"] if sources and sources["blocks"] else [],
    "words": len(plain.split()),
}
DST.parent.mkdir(parents=True, exist_ok=True)
DST.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(DST, "|", len(out["sections"]), "sections |", out["words"], "words |", len(out["sources"]), "sources")
for s in out["sections"]: print("  ", repr(s["title"]), [b["t"] for b in s["blocks"]])
for d in dropped: print("   left in the note:", d)
