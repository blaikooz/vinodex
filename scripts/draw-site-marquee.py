#!/usr/bin/env python3
r"""Draws the company site's marquee mark.

    python3 scripts/draw-site-marquee.py

**This is the first and only web-authored art in the repo, and it lives apart
from the rest on purpose.**

Every other piece of chrome the web draws -- the professor's six expressions,
the passport stamps, the 36 per-route marquee panels, the 20 skin stickers and
the four footer sprites -- is *mirrored one-way from vinodex-ios* by
`sync-shared.ps1`'s art leg (v6 ruling #2). iOS owns it; the web consumes it.

This mark cannot be one of those, because iOS has no company site to have a
mark for. It has to be authored here. And that runs straight into the trap the
sync leg's own comment names:

    robocopy <ios Resources>\MarqueeArt <web public/art>\marquee *.png /MIR

`/MIR` mirrors **deletions**. A web-authored PNG dropped into
`web/public/art/marquee/` is deleted by the very next sync, silently, and the
site's mark falls back to the wineglass with nothing failing anywhere. This is
the same trap the 88 baked footer caps sit next to, and it is solved the same
way: **write somewhere the leg cannot reach.**

So the output is `web/public/art/site/`, which is deliberately NOT one of the
five folders in the leg's `$WebArt` table. `siteMarquee.test.ts` pins that --
both by observing the directory's contents and by reading the sync script -- in
the same shape as `capsManifest.test.ts`'s cap pin. `sync-shared.ps1` carries a
note naming this file, so the next person editing the leg knows why it is not
listed there.

**The drawing.** A sun over a horizon, with two receding lines beneath it and
two dashes of light either side -- Horizon/Godot's own name, drawn. It replaces
the generic wineglass the site inherited by falling through `MARQUEE_ART`,
which was dex iconography on a company page (v8#10).

It is authored to sit beside the iOS panels rather than beside a logo:

  - **One colour, `#FAF4C8`.** Measured off the shipped panels, which are
    single-colour silhouettes -- `marquee-menu`, `marquee-tools` and
    `marquee-data` each resolve to exactly one RGB with a graded alpha. The
    marquee is a phosphor panel; a second colour would read as a sticker.
  - **A coarse pixel grid**, 36 x 36 at 4x, matching the block size the iOS
    panels are drawn on. The chassis renders every panel at 22px with
    `image-rendering: pixelated`, so the grid is the treatment.
  - **Square-ish and filling its box**, like the panels it stands beside
    (they run 111-161px wide and 114-149 tall).

Committed output, no gate runs the script -- same arrangement as the footer
caps, and `siteMarquee.test.ts` carries the hash so a hand-edited PNG or a
stale re-draw fails loudly rather than shipping.
"""

import hashlib
import json
import os
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - developer machine only
    sys.exit("PIL is required: pip install pillow")

# The art grid. One cell is one drawn pixel; SCALE turns it into device pixels.
GRID = 36
SCALE = 4

# The marquee phosphor cream, measured off the shipped iOS panels.
INK = (0xFA, 0xF4, 0xC8)

OUT_DIR = os.path.join("web", "public", "art", "site")
OUT_NAME = "marquee-horizon-godot.png"
MANIFEST = "manifest.json"


def draw():
    """The mark, as a 36x36 grid of 0/1."""
    g = [[0] * GRID for _ in range(GRID)]

    def disc(cx, cy, r):
        for y in range(GRID):
            for x in range(GRID):
                if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r:
                    g[y][x] = 1

    def bar(y0, y1, x0, x1, on=1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g[y][x] = on

    # The sun.
    disc(18, 14, 10.5)
    # The horizon: a full-width rule with a clear cell either side of it, so it
    # reads as a line the sun is standing on rather than as part of the disc.
    bar(23, 23, 0, GRID - 1, on=0)
    bar(24, 26, 0, GRID - 1)
    bar(27, 27, 0, GRID - 1, on=0)
    # Two receding rules: the ground going away. Shortening gives the depth
    # that a second full-width rule would not.
    bar(30, 31, 7, 28)
    bar(34, 35, 13, 22)
    # Light, either side of the sun at its own height.
    bar(11, 12, 0, 3)
    bar(11, 12, 32, 35)
    return g


def main():
    grid = draw()
    img = Image.new("RGBA", (GRID * SCALE, GRID * SCALE), (0, 0, 0, 0))
    px = img.load()
    for y in range(GRID):
        for x in range(GRID):
            if not grid[y][x]:
                continue
            for dy in range(SCALE):
                for dx in range(SCALE):
                    px[x * SCALE + dx, y * SCALE + dy] = (*INK, 255)

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, OUT_NAME)
    img.save(path, optimize=True)

    digest = hashlib.sha256(open(path, "rb").read()).hexdigest()
    with open(os.path.join(OUT_DIR, MANIFEST), "w", newline="\n") as f:
        json.dump(
            {
                "grid": GRID,
                "scale": SCALE,
                "ink": "#%02X%02X%02X" % INK,
                "files": {OUT_NAME: digest},
            },
            f,
            indent=2,
            sort_keys=True,
        )
        f.write("\n")
    print("wrote %s (%d bytes) and %s" % (path, os.path.getsize(path), MANIFEST))


if __name__ == "__main__":
    main()
