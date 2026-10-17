#!/usr/bin/env python3
"""Set up an essay page in a Next.js repo from the essay-page kit.

python3 init_essay.py --repo <app root> --slug <kebab-slug> --title "<Title>" [--description "<line>"] [--note <file.md>] [--talk] [--force] [--kit <dir>]
"""
import argparse, json, re, secrets, shutil, string, subprocess, sys
from pathlib import Path

SLUG_RE = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")
ALPHABET = string.ascii_lowercase + string.digits
DEFAULT_KIT = Path(__file__).resolve().parents[1] / "assets" / "kit"
ARRAY_RE = re.compile(r"(ESSAY_SLUGS: string\[\] = \[)(.*?)(\];)", re.S)


def fail(msg):
    print(f"init_essay: {msg}", file=sys.stderr)
    sys.exit(2)


def wire_talk(route):
    """Uncomment the views and comments lines a route template ships with, and load their styles."""
    text = route.read_text(encoding="utf-8")
    new = re.sub(r"^(\s*)// (import Essay(?:Views|Comments) |after(?:Byline|Credits)=)", r"\1\2", text, flags=re.M)
    if "essay-talk.css" not in new:
        new = re.sub(r'^(import "((?:\.\./)+)essay\.css";)$', r'\1\nimport "\2essay-talk.css";', new, count=1, flags=re.M)
    if new == text:
        return False
    route.write_text(new, encoding="utf-8")
    return True


def copy_tree(src, repo, force):
    for f in sorted(p for p in src.rglob("*") if p.is_file()):
        dst = repo / f.relative_to(src)
        rel = dst.relative_to(repo).as_posix()
        if dst.exists() and not force:
            print("kept", rel)
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
        print("added", rel)


def render(tpl, dst, values, repo, force):
    rel = dst.relative_to(repo).as_posix()
    if dst.exists() and not force:
        print("kept", rel)
        return
    text = tpl.read_text(encoding="utf-8")
    for k, v in values.items():
        text = text.replace("{{" + k + "}}", v)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")
    print("added", rel)


def add_slug(path, slug):
    text = path.read_text(encoding="utf-8")
    m = ARRAY_RE.search(text)
    if not m:
        print(f'warning: no ESSAY_SLUGS array in {path}; add "{slug}" by hand', file=sys.stderr)
        return False
    body = m.group(2)
    if re.search(r"""["']%s["']""" % re.escape(slug), body):
        return False
    stripped = body.rstrip()
    tail = body[len(stripped):]
    item = f'"{slug}"'
    if not stripped.strip():
        new = item
    else:
        multi = "\n" in stripped
        last = stripped.rsplit("\n", 1)[-1]
        indent = last[: len(last) - len(last.lstrip())] if multi else ""
        if stripped.endswith(","):
            new = stripped + ("\n" + indent if multi else " ") + item + ","
        elif multi:
            new = stripped + ",\n" + indent + item
        else:
            new = stripped + ", " + item
    path.write_text(text[: m.start(2)] + new + tail + text[m.end(2):], encoding="utf-8")
    return True


def main():
    ap = argparse.ArgumentParser(description="Set up an essay page from the essay-page kit.")
    ap.add_argument("--repo", required=True, help="Next.js app root (has package.json)")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--note", help="essay .md note; runs the kit's sync script")
    ap.add_argument("--talk", action="store_true", help="also copy the talk files")
    ap.add_argument("--force", action="store_true", help="overwrite existing kit and template files")
    ap.add_argument("--kit", default=str(DEFAULT_KIT), help="kit root (default: the skill's assets/kit)")
    a = ap.parse_args()

    if not SLUG_RE.fullmatch(a.slug):
        fail(f"bad slug {a.slug!r}: use lowercase letters, digits and single hyphens, e.g. my-essay")
    repo = Path(a.repo).resolve()
    if not (repo / "package.json").is_file():
        fail(f"no package.json in {repo}")
    kit = Path(a.kit).resolve()
    tpls = kit / "templates"
    for name in ("page.tsx", "unlisted.tsx", "config.json"):
        if not (tpls / name).is_file():
            fail(f"kit has no templates/{name} under {kit}")
    if a.note and not Path(a.note).is_file():
        fail(f"no note at {a.note}")

    essay = repo / "app" / "essays" / a.slug
    unlisted = sorted(p.parent.name for p in essay.glob("*/page.tsx"))
    token = unlisted[0] if unlisted else "".join(secrets.choice(ALPHABET) for _ in range(10))
    if len(unlisted) > 1:
        print(f"warning: {len(unlisted)} unlisted folders under {essay}; using {token}", file=sys.stderr)

    if (kit / "files").is_dir():
        copy_tree(kit / "files", repo, a.force)
    if a.talk and (kit / "talk" / "files").is_dir():
        copy_tree(kit / "talk" / "files", repo, a.force)

    vals = {"slug": a.slug, "title": a.title, "description": a.description, "token": token}
    render(tpls / "page.tsx", essay / "page.tsx", vals, repo, a.force)
    render(tpls / "unlisted.tsx", essay / token / "page.tsx", vals, repo, a.force)
    if a.talk:
        for route in (essay / "page.tsx", essay / token / "page.tsx"):
            if wire_talk(route):
                print("wired views and comments into", route.relative_to(repo).as_posix())
    jvals = {k: json.dumps(v)[1:-1] for k, v in vals.items()}
    render(tpls / "config.json", repo / "content" / "essays" / f"{a.slug}.config.json", jvals, repo, a.force)

    (repo / "public" / "essays" / a.slug).mkdir(parents=True, exist_ok=True)

    slugs = repo / "lib" / "essay" / "slugs.ts"
    if slugs.is_file() and add_slug(slugs, a.slug):
        print("updated", slugs.relative_to(repo).as_posix())

    out = repo / "content" / "essays" / f"{a.slug}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    if a.note:
        sync = repo / "scripts" / "sync_essay.py"
        if not sync.is_file():
            fail(f"no {sync}; the kit's sync script is missing")
        r = subprocess.run([sys.executable, "-I", str(sync), str(Path(a.note).resolve()), str(out)],
                           capture_output=True, text=True, encoding="utf-8")
        sys.stdout.write(r.stdout)
        sys.stderr.write(r.stderr)
        if r.returncode:
            sys.exit(r.returncode)
    elif out.exists():
        print("kept", out.relative_to(repo).as_posix())
    else:
        doc = {"title": a.title, "epigraph": None, "sections": [], "sources": [], "words": 0}
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("added", out.relative_to(repo).as_posix())

    print(f"check: /essays/{a.slug}  (draft; 404 on production while PUBLISHED is false)")
    print(f"check: /essays/{a.slug}/{token}  (unlisted)")


if __name__ == "__main__":
    main()
