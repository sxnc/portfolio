# portfolio

Victor Künzig's one-page portfolio site — an online companion to the CV.

**Live:** https://sxnc.github.io/portfolio/ *(once GitHub Pages is enabled)*

## Stack

Pure static HTML / CSS / vanilla JS. No frameworks, no build step, no trackers.

- `index.html` — structure &amp; copy
- `styles.css` — layout, typography, scroll animations, orb
- `main.js` — scroll reveals, stat counters, orb state machine, parallax
- `.nojekyll` — tells GitHub Pages to serve files as-is

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing

- **Copy &amp; events** live in `index.html`. The timeline runs in reverse-chronological order — most recent event at the top. Each `<article class="event">` is one point on the central line.
- **Major events** carry `data-state="…"` with a space-separated list of orb icon roles. Available roles: `computer`, `team`, `cto`, `po`, `camera`, `slate`.
- **Stats** are `<span data-count-to="50" data-suffix="k+">` inside event cards — count up when they scroll into view.
- **Replace placeholder images**: this site uses no images yet. When you add them, create an `assets/` folder and reference from the event cards.

## Deploying

GitHub Pages, `main` branch, root directory. With the `gh` CLI:

```bash
gh api -X POST "repos/sxnc/portfolio/pages" \
  -f "source[branch]=main" -f "source[path]=/"
```

If the repo is private, GitHub Pages requires a GitHub Pro (or higher) plan. Otherwise switch the repo to public first.
