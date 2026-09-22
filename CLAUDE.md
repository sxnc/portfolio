# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Victor Künzig's one-page portfolio — an interactive scroll-through-time CV. Pure static site (`index.html` + `styles.css` + `main.js`), no build step, no framework, no dependencies beyond IcoFont via CDN. Hosted on GitHub Pages (CNAME → custom domain); every push to `main` deploys automatically within a minute or two. The site is deliberately noindexed (meta tags + robots.txt) — keep it that way when touching `<head>`. Note: robots.txt intentionally **allows** `Googlebot`/`bingbot` — blocked crawlers can't see the noindex tags and Google indexes blocked-but-linked URLs anyway; the meta tags do the real work for search engines, robots.txt handles AI/training crawlers. Never re-add a crawl block for the search bots.

## Commands

- **Preview:** `python3 -m http.server 8000` (or the `portfolio` config in `.claude/launch.json` for the preview panel). No build, lint, or tests exist.
- **Skip the ~15 s intro cinematic while testing:** open `http://localhost:8000/#skip`.
- **Cache busting (required):** when `styles.css` or `main.js` change, bump their `?v=` query strings in `index.html` (format `YYYYMMDD` + letter suffix, e.g. `?v=20260612a`). GitHub Pages + browser caches serve stale assets otherwise.
- **Icons:** everything uses IcoFont. Before using a new icon class, verify it exists:
  `curl -s https://cdn.jsdelivr.net/npm/icofont/dist/icofont.min.css | grep -o '\.icofont-[a-z0-9-]*' | grep <term>`

## Content model (the part you'll edit most)

- **`events.md` is the source of truth** for all card content (kicker, title, where, stats, tags, description). Edit it first, then mirror into the `<article class="event">` blocks in `index.html` by hand.
- **Timeline is reverse-chronological** — today at top, 1986 at bottom. **Year-divider convention: a divider labels the year of the events *above* it** (scrolling down across `2025` means leaving 2025 for earlier years). A new job in year N goes above a `<div class="year-divider">` labelled N.
- **Event anatomy:** `article.event.event-major` + side class (`event-left` for jobs, `event-right` for creative projects, `event-center` for the single currently-active role) containing `.event-mark`, `.event-year` (start month; the active role uses "Since June"), and `.event-card`. Animated metrics use `data-count-to` / `data-decimals` / `data-suffix`.
- **Voice:** playful first person. Current role in present tense, past roles in past tense; most cards end with a small joke or a link with a pun.
- **When the current role changes:** move `event-center` (and the `data-skills` for its new skills) to the new top entry, demote the old one to `event-left` with a normal month label and past-tense copy, and add the new year divider.

## Skills system

- Registry: the `SKILLS` object at the top of `main.js` — `{ name, cat: tech|people|craft|hobby, icon, baby? }`. Order within a category = backpack grid order = intended "market relevance" (first = most prominent).
- Events claim skills via `data-skills="id id ..."`; unknown ids are silently dropped, so registry entry and `data-skills` must match.
- Collection is bidirectional around viewport mid (±36 px hysteresis): scrolling *down past* an event removes its skills from the backpack (they were "acquired" there), scrolling up re-collects them. Baby hobbies (`baby: true`) are inverted and gated at the Born↔Minerva midpoint.
- Adding a fifth category requires: a tab `<button>` in `index.html`, a `.char-skills-grid[data-active-cat]` CSS filter rule, and a `catCounters` slot in `main.js`.

## Things that will break if renamed/removed

- Era-morph anchors in `index.html`: `data-baby-source` (1986 Born), `data-school-gate` (Minerva 2008), `data-branch-anchor="bottom"` (Summer Love 2018), `data-teen-floor` (HSO 2016). The character's baby→teen→adult transitions fire at *midpoints between* these pairs.
- `.event-center` keeps its `.event-mark` in the DOM but `visibility: hidden` (desktop) — the spine's direction sampling reads its geometry as a side-0 contribution. Don't delete the element and don't switch to `display: none`.
- The character pass-behind effect: `updateCharacter()` in `main.js` toggles `.is-behind-card` while the `centerCardEl` rect overlaps the character's; the CSS lives next to `.character.is-visible`.

## Architecture gotchas

- **One mobile breakpoint: 900 px.** CSS mobile/iPad rules live in a consolidated `@media (max-width: 900px)` block at the *end* of `styles.css` that out-cascades earlier desktop rules at equal specificity. New desktop-only rules must either come before it or be scoped `@media (min-width: 901px)` (the `.event-center` layout does the latter).
- **`isMobile` in `main.js` is captured once at boot** (matchMedia 900 px) and drives panel reparenting + scroll math. After resizing a test window across the boundary, *reload* — the flag does not re-evaluate.
- **Stacking:** the spine SVG paints at z-index 1; each `.event` is a transformed (z 0) stacking context, so cards normally sit *under* the spine line — fine left/right, but anything centred on the spine needs an explicit lift (`.event-center` is `position: relative; z-index: 2`); cream `background` on a label is the trick used to "break" the line (`.year-divider-label`, `.event-center .event-year`). The character is fixed at z 70 (90 with a panel open), so no in-timeline z-index can ever beat it — hence the fade-out pass-behind solution rather than true occlusion.
- **Scroll engine:** a single rAF-throttled `onScroll()` runs `updateIntroScale → updateCharacter → applyScroll → buildSpine → updateCollection`. Layout-dependent measurements (`measureMarkOffsets`) run only on resize/font-load/boot — keep per-frame work allocation-free.
- The spine bend direction is a proximity-weighted blend of event sides (`event-left` −1, `event-right` +1, no class 0), double-EMA-smoothed; marks ride the curve via `--bend-offset`.

## Verifying changes

- Desktop layout needs a viewport **wider than 900 px**; below that you're looking at the mobile layout.
- In the preview-panel tooling, screenshots time out under viewport *emulation* (preview_resize with explicit dimensions); use native panel size for screenshots, or verify via `preview_eval` DOM/rect checks. Dispatch `window.dispatchEvent(new Event('scroll'))` after programmatic scrolling, and allow ~700 ms for fly-to-bag animations before asserting skill state.
- The intro auto-scroll cancels on any wheel/touch/keydown/mousedown — a stray event during testing changes scroll state.

## Shipping

- Commit author must be `Victor Künzig <pxoint@gmail.com>` (never the everywow address); pass `-c user.email=... -c user.name=...` if the repo config disagrees.
- Keep `README.md` ("What's in it", "Editing events + skills") and `events.md` in sync with feature/content changes — the "ship it" flow expects it.
- `.claude/` stays untracked.
