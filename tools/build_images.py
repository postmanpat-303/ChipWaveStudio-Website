"""Build web images for chipwavestudio.com from the app repo's real captures.

Usage: python tools/build_images.py <path-to-ChipWaveStudio-repo>

Writes into public/assets: shots/*.webp (1600 + 800 wide), icon pngs, og-image.jpg.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
REPO = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "ChipWaveStudio")
SHOTS = REPO / "docs" / "screenshots"
UNIFIED = REPO / "docs" / "unified"
ICONS = REPO / "assets" / "icon"
FONTS = REPO / "assets" / "fonts"

OUT_SHOTS = PUB / "assets" / "shots"
OUT_MARKETING = PUB / "assets" / "marketing"
OUT = PUB / "assets"
OUT_SHOTS.mkdir(parents=True, exist_ok=True)
OUT_MARKETING.mkdir(parents=True, exist_ok=True)
MEDIA = Path(__file__).resolve().parents[1] / "media-src"

# slug -> (source path, is_wide_app_shot)
SHOT_SET = {
    "timeline": SHOTS / "timeline-oceans-11.png",
    "launcher": SHOTS / "unified-launcher.png",
    "racks": SHOTS / "racks-panel.png",
    "waveforge": SHOTS / "dark-generators-waveforge.png",
    "drumkit": SHOTS / "drumkit-editor.png",
    "mixer": SHOTS / "dark-mixer-limiter.png",
    "tracker": SHOTS / "dark-pattern.png",
    "browser": SHOTS / "dark-browser.png",
    "voice": SHOTS / "dark-voice.png",
    "fx": SHOTS / "dark-fx-chrome.png",
    "chords": SHOTS / "dark-chord-helper.png",
    "slices": SHOTS / "dark-sample-slicing.png",
    "pressure": SHOTS / "pressure-lane-slate.png",
    "variations": SHOTS / "rr-variations-slate.png",
    "glow": SHOTS / "lcd-glow-shine-slate.png",
    "controller-map": SHOTS / "midi-controller-map-amiga.png",
    "plugin": SHOTS / "plugin-clap.png",
    "order-list": SHOTS / "dark-arranger.png",
    "amiga-tracker": SHOTS / "amiga-pattern.png",
    "amiga-timeline": SHOTS / "amiga-timeline.png",
    "amiga-arranger": SHOTS / "amiga-arranger.png",
    "amiga-mixer": SHOTS / "amiga-mixer.png",
    "palettes": SHOTS / "theme-palettes.png",
    "drop": UNIFIED / "03-launcher-to-timeline-drag-1920x1080.png",
    "layout-1366": UNIFIED / "01-default-layout-REAL-1366x768.png",
    "slate-timeline": SHOTS / "timeline-selected-slate.png",
    "dark-timeline": SHOTS / "dark-timeline.png",
    "amiga-timeline-2": SHOTS / "amiga-timeline.png",
}


def webp(img: Image.Image, dest: Path, width: int, quality: int = 82) -> None:
    h = round(img.height * width / img.width)
    out = img.convert("RGB").resize((width, h), Image.LANCZOS)
    out.save(dest, "WEBP", quality=quality, method=6)
    print(f"  {dest.name}  {width}x{h}  {dest.stat().st_size/1024:.0f} KB")


def main() -> None:
    missing = []
    for slug, src in SHOT_SET.items():
        if not src.exists():
            missing.append(str(src))
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            w = min(1600, im.width)
            webp(im, OUT_SHOTS / f"{slug}-1600.webp", w, 84)
            webp(im, OUT_SHOTS / f"{slug}-800.webp", 800, 80)

    # the promo thumbnail, used as the video poster
    promo = SHOTS / "promo-studio.jpg"
    if promo.exists():
        with Image.open(promo) as im:
            webp(im.convert("RGB"), OUT_SHOTS / "promo-960.webp", 960, 86)

    # composed marketing artwork (kept in media-src/)
    for slug, src in {
        "collage": MEDIA / "collage-1920x1080.png",
        "three-themes": MEDIA / "feature-8-themes.png",
    }.items():
        if src.exists():
            with Image.open(src) as im:
                im = im.convert("RGB")
                webp(im, OUT_MARKETING / f"{slug}-1600.webp", min(1600, im.width), 84)
                webp(im, OUT_MARKETING / f"{slug}-800.webp", 800, 80)

    # the cicada engraving: the original is black ink on transparent paper, so
    # invert the luminance to get light line art that shows on the dark page
    cicada = MEDIA / "cicada-source.png"
    if cicada.exists():
        with Image.open(cicada) as im:
            im = im.convert("RGBA")
            alpha = im.split()[3]
            ink = ImageChops.multiply(
                ImageOps.invert(im.convert("L")).point(lambda v: min(255, int(v * 1.12))),
                alpha,
            )
            pad = int(max(im.size) * 0.025)
            white = Image.new("RGBA", im.size, (228, 240, 255, 255))
            white.putalpha(ink)
            art = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (228, 240, 255, 0))
            art.alpha_composite(white, (pad, pad))
            art.save(OUT / "cicada.png")
            for w in (800, 400):
                h = round(art.height * w / art.width)
                art.resize((w, h), Image.LANCZOS).save(OUT / f"cicada-{w}.webp", "WEBP", quality=92, method=6)
                print(f"  cicada-{w}.webp  {w}x{h}")

    if missing:
        print("MISSING:")
        for m in missing:
            print("  " + m)

    # Icons straight from the app
    for size in (256, 180, 32, 16):
        src = ICONS / f"chipwave_studio_{size}.png"
        if src.exists():
            with Image.open(src) as im:
                im.convert("RGBA").save(OUT / f"icon-{size}.png")
    print("icons done")

    # Social card 1200x630
    og = Image.new("RGB", (1200, 630), (7, 11, 28))
    bg = Image.open(SHOTS / "timeline-oceans-11.png").convert("RGB")
    # scale hero to cover the right/bottom, blur it, darken
    scale = max(1200 / bg.width, 630 / bg.height) * 1.15
    big = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
    big = big.crop((0, 0, 1200, 630)).filter(ImageFilter.GaussianBlur(14))
    og.paste(big, (0, 0))
    shade = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    d = ImageDraw.Draw(shade)
    for x in range(1200):
        a = int(232 * (1 - min(1, max(0, (x - 300) / 900)) ** 1.2))
        d.line([(x, 0), (x, 630)], fill=(5, 8, 23, a))
    og = Image.alpha_composite(og.convert("RGBA"), shade).convert("RGB")
    draw = ImageDraw.Draw(og)

    # the cicada engraving, large and faint, on the right of the card
    art = Image.open(OUT / "cicada.png").convert("RGBA")
    art = art.resize((560, round(art.height * 560 / art.width)), Image.LANCZOS)
    faded = art.copy()
    faded.putalpha(faded.split()[3].point(lambda v: int(v * 0.42)))
    og.paste(faded, (640, 245), faded)

    def font(name, size):
        p = FONTS / name
        return ImageFont.truetype(str(p), size) if p.exists() else ImageFont.load_default()

    draw.text((80, 268), "ChipWave Studio", font=font("AtkinsonHyperlegibleNext-SemiBold.ttf", 62), fill=(230, 240, 255))
    draw.text((80, 348), "A free music sequencer", font=font("AtkinsonHyperlegibleNext-Regular.ttf", 44), fill=(230, 240, 255))
    draw.text((80, 398), "with a retro heart.", font=font("AtkinsonHyperlegibleNext-Regular.ttf", 44), fill=(34, 227, 255))
    meta_font = font("AtkinsonHyperlegibleMono-Medium.ttf", 20)
    draw.text((80, 486), "Windows \u00b7 macOS \u00b7 Linux", font=meta_font, fill=(169, 183, 220))
    draw.text((80, 526), "FREE \u00b7 OPEN SOURCE \u00b7 GPL-3.0", font=meta_font, fill=(169, 183, 220))

    og.save(OUT / "og-image.jpg", "JPEG", quality=88, optimize=True)
    print("og done")


if __name__ == "__main__":
    main()
