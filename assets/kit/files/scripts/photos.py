"""Size an essay's pictures for the page. Width only: no effect, each picture as it was made.
Run: python3 -I scripts/photos.py <originals dir> <public/essays/slug> JOB [JOB ...] [--quality 84] [--edges]
A JOB is name.jpg[:width][@left,top,right,bottom][=out.jpg]
  :width    resize to this width (a larger width keeps the original's)
  @l,t,r,b  crop to this box first, in the original's pixels; only to cut a scan's mount or border
  =out.jpg  output name (default: the original's name as .jpg)
--edges prints, per side, how many lines at the edge are flat (a mount or border is flat; a picture
is not). It never crops: dark studio backgrounds are flat too, so read the numbers, look at the edge,
then write the box by hand.
Needs Pillow (and numpy for --edges). Prints each output's real size: copy w and h into the config."""
import pathlib, re, sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # Library of Congress masters run to 40 MB

def edges(im):
    import numpy as np
    a = np.asarray(im.convert("L"), dtype=float)
    def flat(lines):
        n = 0
        while n < len(lines) // 8 and lines[n].std() < 4: n += 1
        return n
    return flat(a), flat(a[::-1]), flat(a.T), flat(a.T[::-1])

args = [a for a in sys.argv[1:] if not a.startswith("--")]
quality = 84
if "--quality" in sys.argv:
    quality = int(sys.argv[sys.argv.index("--quality") + 1])
    args.remove(str(quality))
if len(args) < 3: sys.exit(__doc__)
src, out = pathlib.Path(args[0]), pathlib.Path(args[1])
out.mkdir(parents=True, exist_ok=True)
for job in args[2:]:
    m = re.fullmatch(r"([^:@=]+)(?::(\d+))?(?:@(\d+),(\d+),(\d+),(\d+))?(?:=(.+))?", job)
    if not m: sys.exit(f"bad job: {job}")
    name, width, box, dst = m.group(1), m.group(2), m.group(3, 4, 5, 6), m.group(7)
    im = Image.open(src / name)
    im = im.convert("L" if im.mode in ("L", "LA", "1") else "RGB")
    if "--edges" in sys.argv:
        t, b, l, r = edges(im)
        print(f"{name}  {im.width}x{im.height}  flat lines: top {t} bottom {b} left {l} right {r}")
    if box[0] is not None: im = im.crop(tuple(int(v) for v in box))
    if width and im.width > int(width): im = im.resize((int(width), round(im.height * int(width) / im.width)), Image.LANCZOS)
    p = out / (dst or pathlib.Path(name).with_suffix(".jpg").name)
    im.save(p, quality=quality, optimize=True, progressive=True)
    print(f"{p.name}  w {im.width}  h {im.height}  {p.stat().st_size // 1024} KB")
