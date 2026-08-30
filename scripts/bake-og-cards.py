#!/usr/bin/env python3
"""Bakes the per-entry share cards (v0.6.24, Phase 4).

    npm run og:manifest && python3 scripts/bake-og-cards.py

**What this is.** A 1200x630 Open Graph image for every shareable catalogue
entry -- the card a grape or region unfurls with when its link is pasted into
a chat -- instead of the one logo tile every entry shared until now. The
ground is the category's livery, the art is the entry's own pixel sprite or
country outline scaled with hard edges, and the type is the device's: Press
Start 2P for the name, VT323 for the line of prose.

**Why baked and committed, not rendered at build.** The same reasoning as
`bake-footer-caps.py`: Pillow exists on a maintainer's machine, not on the CI
runner or on Vercel, and Node has no rasteriser for text without a native
dependency. So the output is committed and `ogCards.test.ts` holds it to the
manifest: a card baked against a renamed entry, a retuned livery or a redrawn
sprite fails the gate, naming the fix as "re-run the bake".

**What the pixels depend on** is exactly `scripts/og/manifest.json`, which
`scripts/og-manifest.ts` writes from the same art resolvers the tiles use.
This script never decides which art an entry shows; it only draws it.

**The output directory is `web/public/og/`**, which no sync leg mirrors, and
which the service worker must NOT precache (440 files; see `globIgnores` in
vite.config.ts). Cards are fetched by crawlers, not by the app.

Fonts: `scripts/og/fonts/` carries the two OFL faces (licences alongside).
"""
import hashlib
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'scripts', 'og', 'manifest.json')
PUBLIC = os.path.join(ROOT, 'web', 'public')
OUT = os.path.join(PUBLIC, 'og')
FONTS = os.path.join(ROOT, 'scripts', 'og', 'fonts')

W, H = 1200, 630
PANEL = (11, 18, 16)        # the dark LCD ground
GRID = (22, 34, 28)         # the LCD's faint grid
CREAM = (242, 232, 213)
MUTED = (166, 178, 168)
WHITE = (255, 255, 255)


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if draw.textlength(trial, font=fnt) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_art(path, kind, box):
    im = Image.open(path).convert('RGBA')
    if kind == 'outline':
        # The outlines are drawn on a transparent margin; crop to the shape.
        bbox = im.getchannel('A').getbbox()
        if bbox:
            im = im.crop(bbox)
    w, h = im.size
    scale = min(box / w, box / h)
    if scale >= 1:
        scale = max(1, int(scale))  # whole pixels: hard edges stay hard
    size = (max(1, int(w * scale)), max(1, int(h * scale)))
    return im.resize(size, Image.NEAREST)


def draw_card(spec):
    solid, deep = hex_rgb(spec['livery']['solid']), hex_rgb(spec['livery']['deep'])
    im = Image.new('RGB', (W, H), deep)
    d = ImageDraw.Draw(im)

    # The LCD panel, inset in the livery ground.
    d.rounded_rectangle((36, 36, W - 36, H - 36), radius=28, fill=PANEL, outline=solid, width=6)
    for x in range(64, W - 64, 32):
        d.line((x, 48, x, H - 48), fill=GRID, width=1)
    for y in range(64, H - 64, 32):
        d.line((48, y, W - 48, y), fill=GRID, width=1)

    # The art well.
    well = (84, 135, 84 + 360, 135 + 360)
    d.rounded_rectangle(well, radius=20, fill=solid)
    art = fit_art(os.path.join(PUBLIC, spec['art'].lstrip('/')), spec['artKind'], 300 if spec['artKind'] != 'menu' else 240)
    ax = well[0] + (360 - art.width) // 2
    ay = well[1] + (360 - art.height) // 2
    im.paste(art, (ax, ay), art)

    # The type column.
    x0, x1 = 500, W - 84
    label_f = font('PressStart2P-Regular.ttf', 20)
    d.text((x0, 140), spec['category'], font=label_f, fill=solid)

    name_f = font('PressStart2P-Regular.ttf', 44)
    lines = wrap(d, spec['name'].upper(), name_f, x1 - x0)
    if len(lines) > 2:
        name_f = font('PressStart2P-Regular.ttf', 34)
        lines = wrap(d, spec['name'].upper(), name_f, x1 - x0)[:3]
    y = 190
    for line in lines:
        d.text((x0, y), line, font=name_f, fill=CREAM)
        y += int(name_f.size * 1.45)

    blurb_f = font('VT323-Regular.ttf', 36)
    y += 14
    for line in wrap(d, spec['blurb'], blurb_f, x1 - x0)[:3]:
        d.text((x0, y), line, font=blurb_f, fill=MUTED)
        y += 40

    # The footer: the wordmark and where to find it.
    mark_f = font('PressStart2P-Regular.ttf', 24)
    d.text((x0, H - 36 - 44 - 30), 'VINODEX', font=mark_f, fill=WHITE)
    url_f = font('VT323-Regular.ttf', 32)
    d.text((x0 + d.textlength('VINODEX', font=mark_f) + 24, H - 36 - 44 - 30 - 2), 'vinodex.vercel.app', font=url_f, fill=MUTED)

    return im.convert('P', palette=Image.ADAPTIVE, colors=96)


def main():
    with open(MANIFEST) as f:
        manifest = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    wanted = {spec['id'] for spec in manifest['cards']}
    for name in os.listdir(OUT):
        if name.endswith('.png') and name[:-4] not in wanted:
            os.remove(os.path.join(OUT, name))
    files, total = {}, 0
    for spec in manifest['cards']:
        card = draw_card(spec)
        path = os.path.join(OUT, spec['id'] + '.png')
        card.save(path, 'PNG', optimize=True)
        with open(path, 'rb') as f:
            data = f.read()
        files[spec['id']] = hashlib.sha256(data).hexdigest()
        total += len(data)
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump({'digest': manifest['digest'], 'files': files}, f, indent=1, sort_keys=True)
    print('bake-og-cards: %d cards, %.1f MB total, largest %.0f KB -> web/public/og/' % (
        len(files), total / 1e6, max(os.path.getsize(os.path.join(OUT, i + '.png')) for i in files) / 1024))


if __name__ == '__main__':
    sys.exit(main())
