#!/usr/bin/env python3
"""Scrape the full JCK article archive for Brittany Siminitz.

JCK's author page (https://www.jckonline.com/writer/brittany-siminitz/)
paginates via a WordPress admin-ajax endpoint rather than normal page URLs.
Clicking "Load more results" POSTs:

    action=more_writers&page=N&item_count=10&item_count_limit=10
    &offset=M&author=6

`author=6` is Brittany's JCK author ID. The endpoint accepts a larger
`item_count` than the UI uses, so this pulls 100 at a time instead of 10.

Writes data/jck_archive.json: a list of
{title, url, date, category} sorted newest first.

Usage:  python3 scripts/scrape_jck_archive.py
"""

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

AJAX_URL = "https://www.jckonline.com/wp-admin/admin-ajax.php"
AUTHOR_ID = 6
BATCH = 100
DELAY_SECONDS = 0.5  # be polite to JCK's server
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"

OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "jck_archive.json"

ARTICLE_SPLIT = re.compile(r"(?=<article itemscope)")
TITLE_RE = re.compile(
    r'<h3 itemprop="headline">\s*<a href="([^"]+)"[^>]*?title="([^"]*)"', re.S
)
DATE_RE = re.compile(r'<time[^>]*datetime="([^"]+)"')
CATEGORY_RE = re.compile(r'<a class="category"[^>]*>([^<]*)</a>')


def fetch_batch(offset, count=BATCH):
    """POST one page of the author archive, return raw HTML."""
    page = offset // count + 1
    body = urllib.parse.urlencode(
        {
            "action": "more_writers",
            "page": page,
            "item_count": count,
            "item_count_limit": count,
            "offset": offset,
            "author": AUTHOR_ID,
        }
    ).encode()

    req = urllib.request.Request(
        AJAX_URL,
        data=body,
        headers={
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_articles(markup):
    """Extract one record per <article> block."""
    out = []
    for block in ARTICLE_SPLIT.split(markup):
        if "itemprop=\"headline\"" not in block:
            continue
        m = TITLE_RE.search(block)
        if not m:
            continue
        # Both need unescaping: some permalinks come through as
        # ?post_type=...&#038;p=<id> rather than a pretty slug.
        url = html.unescape(m.group(1)).strip()
        title = html.unescape(m.group(2)).strip()

        date_m = DATE_RE.search(block)
        date = date_m.group(1)[:10] if date_m else None

        cat_m = CATEGORY_RE.search(block)
        category = html.unescape(cat_m.group(1)).strip() if cat_m else None

        out.append({"title": title, "url": url, "date": date, "category": category})
    return out


def main():
    seen = set()
    records = []
    offset = 0

    while True:
        try:
            markup = fetch_batch(offset)
        except Exception as exc:  # noqa: BLE001 - surface and stop, don't half-write
            print(f"  ! request failed at offset {offset}: {exc}", file=sys.stderr)
            break

        batch = parse_articles(markup)
        if not batch:
            print(f"  offset {offset}: 0 articles -> end of archive")
            break

        new = [r for r in batch if r["url"] not in seen]
        for r in new:
            seen.add(r["url"])
        records.extend(new)

        print(f"  offset {offset}: +{len(new)} new (total {len(records)})")

        # A batch with no new URLs means we've wrapped around; stop.
        if not new:
            break

        offset += BATCH
        time.sleep(DELAY_SECONDS)

    records.sort(key=lambda r: (r["date"] or ""), reverse=True)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    # One record per line: compact enough to ship, still diffable in git.
    lines = ",\n".join(
        json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in records
    )
    OUT_PATH.write_text("[\n" + lines + "\n]\n")

    dated = [r for r in records if r["date"]]
    print(f"\nWrote {len(records)} articles to {OUT_PATH}")
    if dated:
        print(f"Date range: {dated[-1]['date']} .. {dated[0]['date']}")
    cats = {}
    for r in records:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
    print("\nTop categories:")
    for c, n in sorted(cats.items(), key=lambda kv: -kv[1])[:12]:
        print(f"  {n:5d}  {c}")


if __name__ == "__main__":
    main()
