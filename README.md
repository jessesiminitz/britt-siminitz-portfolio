# Brittany Siminitz — portfolio site

A static, no-build portfolio site profiling Britt Siminitz's published
jewelry/luxury trade journalism. Plain HTML/CSS/JS — no framework, no
dependencies to install.

## Preview locally

Any static file server works, e.g.:

```bash
cd britt-siminitz-portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly by
double-clicking won't work — the page fetches `data/articles.json` via
`fetch()`, which browsers block on the `file://` origin.)

## Adding an outlet or article

All content lives in [`data/articles.json`](data/articles.json). To add a
new outlet, append an object to the `outlets` array:

```json
{
  "id": "rio-grande",
  "name": "Rio Grande",
  "url": "https://example.com/author/brittany-siminitz",
  "description": "One-line description of the outlet.",
  "articles": [
    { "title": "...", "url": "...", "date": "2026-01-01", "excerpt": "..." }
  ]
}
```

`date` and `excerpt` can be `null` if unknown — the card just omits that
line. The page picks up new outlets/articles automatically; no HTML/JS
changes needed. A filter button for the outlet is generated automatically
from its `name`.

To update the bio, photo, or contact links, edit the `bio` object at the
top of the same file. Swap the photo by replacing
`assets/images/headshot.jpg` (any image works — the CSS crops it to a
circle).

## Deploying to GitHub Pages (free hosting)

1. Create a new GitHub repository (e.g. `britt-siminitz-portfolio`).
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: repo → **Settings** → **Pages** → under "Build and
   deployment," set Source to **Deploy from a branch**, branch **main**,
   folder **/(root)**. Save.
4. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

To use a custom domain later, add a `CNAME` file with the domain name and
point the domain's DNS at GitHub Pages (GitHub's docs cover the exact DNS
records).

## Content notes

Every article listed under JCK, Gem + Jewel, Rio Grande, and Jenny Lauren
Jewelry was individually fetched and its byline verified before being
added — nothing here is guessed or paraphrased from a search snippet.
JCK Insider titles/URLs come from her confirmed author archive, but that
site blocks automated fetches, so those specific dates/excerpts couldn't be
independently re-verified the same way (flagged in the JSON via `"note"`).

The Jenny Lauren Jewelry piece has no publish date displayed on the page,
so its `date` is `null` rather than a guess.

Still outstanding: AGTA, "Gem and Jewel" as a separate print title (distinct
from the Gem + Jewel Substack, which is included), and any travel/
meeting-planning work. None could be found online under either "Brittany
Siminitz" or "Britt Siminitz" despite extensive searching — they are
intentionally left off rather than guessed at. Add them via the
instructions above once real links/files are available.
