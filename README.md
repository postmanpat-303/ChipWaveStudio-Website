![ChipWave Studio — a free music sequencer with a retro heart](media-src/banner-1600x500.png)

# chipwavestudio.com

The website for **ChipWave Studio** — a plain static site, no build step, no framework.
Live at **[chipwavestudio.com](https://chipwavestudio.com/)**, published by Netlify.

```
public/            the whole site (this is what gets published)
  index.html       the landing page
  assets/site.css  styles
  assets/site.js   menu, lightbox, reveal animations
  assets/shots/    screenshots converted to WebP (1600 and 800 wide)
  assets/marketing/ composed artwork (the collage), also WebP
  assets/video/    the promo film, served from this site
  assets/fonts/    Atkinson Hyperlegible Next + Mono (OFL 1.1)
  manual/          the user manual: the PDF plus index.html, the reader page
  404.html  robots.txt  sitemap.xml
media-src/         the original marketing artwork and the cicada engraving the site uses
tools/
  build_images.py     rebuilds assets/shots, assets/marketing, icons and the social image
  deploy_netlify.py   creates/updates the Netlify site and attaches the domain
netlify.toml       publish dir and redirect shortcuts (headers live in public/_headers)
```

## Rebuild the pictures

The screenshots come straight from the app repository (no mockups). After a new
ChipWave release:

```powershell
python tools/build_images.py ..\ChipWaveStudio
```

It writes `assets/shots/*.webp`, the icon sizes and `assets/og-image.jpg`.
Add or remove shots in `SHOT_SET` at the top of the script.

## Preview locally

```powershell
python -m http.server 8787 --directory public
```

Then open http://127.0.0.1:8787/ . Append `?nolazy=1` to load every image at once
(handy for full-page screenshots).

## Deploy

```powershell
$env:NETLIFY_AUTH_TOKEN = "<token>"
python tools/deploy_netlify.py --site chipwavestudio --domain chipwavestudio.com
```

The script zips `public/`, creates the site if it does not exist, uploads the
deploy, waits for it to go live and sets the custom domain. Never commit the token.

If Netlify is ever switched to building from this repository instead, the settings
are: publish directory `public`, no build command, and `netlify.toml` at the root.
The 62 MB promo must stay in the repository for the video to survive a git build.

### DNS

The domain is registered at Cloudflare, so point it at Netlify in the Cloudflare
dashboard (DNS → Records). Netlify gives the exact target host after the first
deploy; in short:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` (chipwavestudio.com) | `<site>.netlify.app` | DNS only |
| CNAME | `www` | `<site>.netlify.app` | DNS only |

Cloudflare flattens the apex CNAME, so no ALIAS record is needed. Keep both
records on **DNS only**: Netlify issues the HTTPS certificate itself, and proxying
stops it.

## Content notes

- Windows and Linux downloads are **0.2.22.0**, pinned to
  [`v0.2.22.0`](https://github.com/postmanpat-303/ChipWaveStudio/releases/tag/v0.2.22.0):
  `ChipWave-0.2.22.0-setup-x64.exe`, `ChipWave-0.2.22.0-windows-x64.zip`,
  `chipwave-studio_0.2.22.0_amd64.deb`, `chipwave-studio-0.2.22.0-1.x86_64.rpm`,
  `ChipWave-0.2.22.0-linux-x86_64.AppImage`, `ChipWave-0.2.22.0-linux-x86_64.tar.gz`,
  and `SHA256SUMS-0.2.22.0.txt`. Do not point Linux at `releases/latest`.
- The Mac download stays **0.2.21.0**, pinned to
  `releases/download/v0.2.21.0/ChipWave-macos-universal.dmg` (and the matching zip and
  `SHA256SUMS.txt`). A 0.2.22.0 Mac package is not published.
- Acid Bass is in Windows and Linux 0.2.22.0 only. Credit OpenRB-338, pingw33n and the
  OpenRB-338 authors, GPL-3.0-only. The on-site manual is still the 0.2.21.0 PDF.
  The promo and Short are still the 0.2.20.0 films.
- The page is one scroll in the option B graphic language. The opening is a 1960s-style poster;
  later sections shift in colour and shape (warm curves, synth geometry, 90s editorial, cool chrome,
  then a quiet luminous close). That is page design, not a claim about when ChipWave was made.
  Syne (OFL) is the display face; Atkinson stays the body face.
- Every claim on the page comes from the app's README, docs and source
  (the themes, for example, are `SLATE`, `DARK` and `AMIGA` in `src/theme.rs` —
  Slate is the default, and the page used to say there were only two).
- Pictures are real captures; keep it that way.
- The user manual lives in `public/manual/`. To publish a new one, drop the PDF in there,
  render page 1 as a PNG into `media-src/manual-cover.png` (Windows PowerShell can do it
  with `Windows.Data.Pdf`, see the commit log), rebuild the cover WebPs and update the
  page count, file size and version on the home page and in `manual/index.html`.
- The cicada in the header, footer, hero and social card is `media-src/cicada-source.png`, re-inked by `build_images.py` into white line art for the dark page.
- The Watch section embeds the YouTube promo and Short (`tWuAjS5rmDY`, `9mD4wTHEJ1k`)
  behind local posters (`assets/shots/promo-0220-960.webp`, `short-0220-540.webp`):
  nothing loads from YouTube until a visitor presses play, and then it uses
  youtube-nocookie.com. For a new video, change the `data-yt` id, the link and the poster.
  The older self-hosted promo is still in `public/assets/video/` but no longer used.
- The other artwork in the media folder (captioned `feature-*.png`, `hero-1920`,
  `banner`, `og-image`) is deliberately not used: the captions duplicate this
  page and some are out of date (16-pad drum kit, "Windows and Linux"), while the
  raw captures are sharper. `hero-1920` and `banner-1600x500` are good for the
  GitHub repo and social cards.

## Licence

The site text and layout belong to the project (GPL-3.0-or-later, like ChipWave
Studio). The fonts are under the SIL Open Font License 1.1 — see
`public/assets/LICENSE-AtkinsonHyperlegible.txt`.
