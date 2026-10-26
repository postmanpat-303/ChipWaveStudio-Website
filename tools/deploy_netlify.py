"""Deploy the site folder to Netlify and attach a custom domain.

  python tools/deploy_netlify.py --site chipwavestudio --dir public \
      --domain chipwavestudio.com

Token: --token, or the NETLIFY_AUTH_TOKEN environment variable.
Never commit a token; this script never writes one to disk.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import zipfile
import io

API = "https://api.netlify.com/api/v1"


def call(method, path, token, data=None, content_type="application/json", raw=False):
    url = API + path
    body = None
    if data is not None:
        body = data if isinstance(data, bytes) else json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Content-Type", content_type)
    req.add_header("User-Agent", "chipwavestudio-site-deploy")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            payload = r.read()
            return (payload if raw else json.loads(payload or b"{}")), dict(r.headers)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:800]
        sys.exit(f"Netlify API {method} {path} failed: HTTP {e.code}\n{detail}")


def zip_dir(folder):
    buf = io.BytesIO()
    base = os.path.abspath(folder)
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(base):
            for name in files:
                full = os.path.join(root, name)
                rel = os.path.relpath(full, base).replace(os.sep, "/")
                z.write(full, rel)
    return buf.getvalue()


def find_site(token, name):
    sites, _ = call("GET", "/sites?per_page=100", token)
    for s in sites:
        if s.get("name") == name:
            return s
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default=os.environ.get("NETLIFY_AUTH_TOKEN"))
    ap.add_argument("--site", default="chipwavestudio")
    ap.add_argument("--dir", default="public")
    ap.add_argument("--domain", default="")
    ap.add_argument("--aliases", default="www.chipwavestudio.com")
    args = ap.parse_args()

    if not args.token:
        sys.exit("No token. Pass --token or set NETLIFY_AUTH_TOKEN.")
    if not os.path.isdir(args.dir):
        sys.exit(f"Publish folder not found: {args.dir}")

    site = find_site(args.token, args.site)
    if site:
        print(f"Using existing site: {site['name']} ({site['id']})")
    else:
        site, _ = call("POST", "/sites", args.token, {"name": args.site})
        print(f"Created site: {site['name']} ({site['id']})")

    site_id = site["id"]
    blob = zip_dir(args.dir)
    print(f"Uploading {len(blob)/1024/1024:.1f} MB …")
    deploy, _ = call("POST", f"/sites/{site_id}/deploys", args.token, blob, "application/zip")

    print(f"Deploy {deploy['id']} state={deploy.get('state')}")
    for _ in range(60):
        if deploy.get("state") in ("ready", "current"):
            break
        time.sleep(2)
        deploy, _ = call("GET", f"/deploys/{deploy['id']}", args.token)

    url = deploy.get("ssl_url") or deploy.get("deploy_ssl_url") or site.get("ssl_url")
    print(f"Deployed: {url}  state={deploy.get('state')}")

    if args.domain:
        patch = {"custom_domain": args.domain}
        aliases = [a.strip() for a in args.aliases.split(",") if a.strip()]
        if aliases:
            patch["domain_aliases"] = aliases
        updated, _ = call("PATCH", f"/sites/{site_id}", args.token, patch)
        print(f"Custom domain: {updated.get('custom_domain')} "
              f"(aliases: {', '.join(updated.get('domain_aliases') or []) or 'none'})")

    print("\nSite data for DNS:")
    print(f"  netlify name : {site['name']}")
    print(f"  site id      : {site_id}")
    print(f"  default host : {site.get('default_domain') or site['name'] + '.netlify.app'}")
    print(f"  admin url    : {url}")


if __name__ == "__main__":
    main()
