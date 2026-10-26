# chipwavestudio.com

The website for **ChipWave Studio** — a plain static site, no build step, no framework.

```
public/            the whole site (this is what gets published)
  index.html       the landing page
  assets/site.css  styles
  assets/site.js   menu, theme switch, video facade, lightbox
  assets/shots/    screenshots converted to WebP (1600 and 800 wide)
  assets/fonts/    Atkinson Hyperlegible Next + Mono (OFL 1.1)
  404.html  robots.txt  sitemap.xml
tools/
  build_images.py     rebuilds assets/shots, icons and the social image from the app repo
  deploy_netlify.py   creates/updates the Netlify site and attaches the domain
netlify.toml       publish dir, cache and security headers, /download shortcuts
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

### DNS

The domain is registered at Cloudflare, so point it at Netlify in the Cloudflare
dashboard (DNS → Records). Netlify gives the exact target host after the first
deploy; in short:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` (chipwavestudio.com) | `<site>.netlify.app` | DNS only |
| CNAME | `www` | `<site>.netlify.app` | DNS only |

Cloudflare flattens the apex CNAME, so no ALIAS record is needed.

## Content notes

- Version, download URLs, sizes and the “new in” section are for **0.2.16.0**.
  Download links use `releases/latest/download/...`, so they follow new releases;
  the version text and the new-in cards need a manual edit per release.
- Every claim on the page comes from the app's README and docs.
- Pictures are real captures; keep it that way.

## Licence

The site text and layout belong to the project (GPL-3.0-or-later, like ChipWave
Studio). The fonts are under the SIL Open Font License 1.1 — see
`public/assets/LICENSE-AtkinsonHyperlegible.txt`.
