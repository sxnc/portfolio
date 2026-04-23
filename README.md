# portfolio

Victor's one-page portfolio. An online companion to the CV.

Pure static site: HTML + CSS + vanilla JS, IcoFont via CDN, three short looping videos (walking adult, walking teen, waving adult), and a single SVG for the baby variant. No build step, no framework, no trackers. Hosted on GitHub Pages. Noindex across the board (meta tags + `robots.txt`) — the site is meant to be linked from job applications, not crawled.

## What's in it

- **Intro cinematic** on first load: a cream curtain with a big `Est. 1986` cross-fades to the baby character alone, the curtain lifts while the baby scales down to normal size, and the page auto-scrolls from bottom to top over ~12 seconds with ease-in-out pacing. Any wheel / touch / keydown / mousedown cancels the auto-scroll. `prefers-reduced-motion` skips the whole thing.
- **Single vertical timeline**, reverse-chronological (today at the top, 1986 at the bottom). Plain black dots at both the top ("Today") and bottom (birth) as terminators.
- **Bending SVG spine** — the spine is a cubic-bezier path that bulges permanently around the walking character. The bulge side is a proximity-weighted blend of the nearby events' sides, smoothed by a two-stage EMA so opposite-side transitions cross-fade gently and fast-scroll doesn't wobble the curve. The upper reach is clamped so the path always terminates cleanly at the top dot. A moss trace reveals the path from the top down to the character's current position.
- **Three-stage character** that morphs with scroll: baby (static SVG in a crib rock) below the midpoint of Born → Minerva; teen between that midpoint and Summer Love 2018; adult above. Variant swap is a game-style scale/opacity pop rather than a cross-fade. A `LEVEL UP!` popup fires on upward transitions.
- **Waving hero greeting**: right at the peak of the hero stage (`p < 0.1` in the intro-scroll zone), the walking-adult clip swaps to a waving variant so the character actively greets the viewer. Scrolling down even a little reverts to walking.
- **Three interactive hint dots** on the hero-stage character:
  - **Backpack** (right side, green pulsing dot) — opens the skills panel.
  - **Creative** (upper-left of head) — opens a paper bio card on the left with a short creative manifesto.
  - **Technical** (upper-right of head, mirrored to creative) — opens a matching bio card on the right.
  On desktop each dot carries a hand-drawn Caveat-font label + curved SVG arrow. On mobile the arrows are dropped; the dots get bigger tap targets and carry plain Caveat labels (`Creative` · `Technical` · `Skills`) drawn via `::after`. All three labels are gated on `body.at-top` — they only surface at the very top of the page and vanish the instant the user starts scrolling.
- **Backpack inventory** (hover the character or the green hint dot on desktop, tap the circular character on mobile): skills split across four tabs — **Tech · People · Craft · Hobby** — with a click-to-switch grid of IcoFont icons + labels and a live count badge. Grid rows have a fixed height (`grid-auto-rows: 68px` + `align-content: start`), and the grid's `min-height` is set in JS to reserve exactly the tallest currently-visible category's row count — so flipping tabs holds the panel steady and never stretches the tiles. Tall categories cap at `max-height` with an internal scroll. If the bag is empty, the green hint dot hides.
- **Bidirectional scroll collection**: starts full at the top of the page. Scrolling down past an event animates that event's skills *out* of the bag toward the event; scrolling back up re-collects them. A `+N SKILL` popup floats above the character on each gain. On desktop the icons fly to / from the small green hint dot; on mobile they fly to / from the centre of the character's circular backdrop, even when the panel is closed.
- **Hobby tab** carries era-linked entries that appear as you pass each event: Reading + Cycling (from SRF), Electric Guitar (Amazee Labs dev role), Skateboarding (eye media), Video Games + Movies (Minerva apprenticeship). Two baby-only hobbies (Annoying Everyone, Lego Traps) appear only while the character is in baby era and vanish exactly at the baby → teen flip.
- **Speech-bubble CTA** (`Let's talk!` · `mailto:`) in front of the character's face. Desktop: defaults to `...`, expands on hover or whenever the backpack is open. Mobile: always shown in its expanded state, centred above the head — visible at the very top of the hero stage and whenever the backpack is open on the timeline, hidden everywhere else. Doubles in size when the backpack is open on the timeline so it's comfortable to tap.
- **Intro speech bubble** (`Hi! I'm Victor.`): kept hidden during the intro auto-scroll, then pops in with a soft spring once the page lands at the top.
- **Event cards**: moss-green paper cards branching left / right of the spine on desktop, single-column sheet layout on mobile with hyphenation, bold links. Year labels sit beside the card on desktop, above it on mobile.
- **Metric counters** animate from 0 → target whenever a metric enters the viewport, and reset when it leaves, so the count-up plays no matter which direction the user scrolls in from.
- **Notebook grid** fills the page as the only background decoration — the cream body colour carries the rest.

## Mobile (≤900 px — phones + portrait iPads)

The mobile layout is a separate pass consolidated at the end of `styles.css` with the JS `isMobile` flag mirroring the same breakpoint.

- **Character bottom-anchors** at `bottom: 32px` with a continuously interpolated `--hero-lift` that raises the feet toward viewport centre during the hero stage and relaxes back to 0 on the timeline. `transform-origin: 50% 100%` so the scale animation grows upward from the feet. A rAF-throttled scroll handler drives the transforms directly — no CSS transition on the normal path (a short one is swapped in via `.intro-landing` for the hand-off after the intro cinematic).
- **Circular cream backdrop** (178 px, 6 px semi-transparent moss ring) frames the character on the timeline. Opacity driven by `--circle-opacity` (JS) so it fades in over the first 15 % of scroll — before any moss card could reach the character.
- **Panels are lifted out of `.character` into `<body>`** at boot so their `position: fixed` actually reaches the viewport edges (the character's scale transform would otherwise create a fixed-containing-block that confines them). Open-state mirrored via body classes: `body.panel-skills-open`, `body.panel-creative-open`, `body.panel-technical-open`.
- **Sheet-style panels** — fill the top of the viewport (16 px inset, content-sized with a `max-height` cap so they can't spill into the character's circle). `overflow: visible` so the × button can sit half outside.
- **Big circular × close button** on each panel, beige with a border and drop shadow. The × mark is drawn via two rotated `::before`/`::after` bars so it reads crisp and thick (the `&times;` glyph is hidden with `font-size: 0`). Positioned at `bottom: -28px` — straddling the panel's bottom edge, 50 % inside, 50 % outside, well within thumb-reach.
- **Baby variant re-centred** inside the circle (`top: -25px`, `translateY(0)`).
- **CTA pruning**: desktop hover-driven "..." glyph is suppressed (`content: none !important`) so it never flashes in during mobile transitions.
- **iPad-range coverage**: the mobile media query is `max-width: 900px`, so iPad-mini (768) and iPad-Air portrait (820) inherit the same treatment.

## Privacy / indexing

- `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />` plus explicit per-bot tags (`googlebot`, `bingbot`, `GPTBot`, `ChatGPT-User`, `Google-Extended`, `CCBot`, `anthropic-ai`, `Claude-Web`, `ClaudeBot`, `PerplexityBot`, `Applebot-Extended`) in the `<head>`.
- `robots.txt` at the repo root with `Disallow: /` for `*` plus explicit entries for every AI / training crawler with a published user-agent string.

Both mechanisms are opt-in conventions — they block honest crawlers but can't stop a scraper that chooses to ignore them. For a public GitHub Pages repo this is the ceiling of what's achievable without moving off that host.

## Stack

- `index.html` — markup, event data (each `<article class="event">` carries a `data-skills="..."` list), the backpack panel, the two creative/technical bio cards, the three hero-stage hint arrows (desktop) + dots (mobile), the intro speech bubble, the intro-cinematic curtain, the noindex meta tags, the favicon link, and an inline SVG `<filter>` (`#char-backdrop`) used to fill the character's transparent interior with paper.
- `styles.css` — layout, character rig, speech bubbles, backpack + bio panels, hero-stage hint dots / arrows / labels, all animations, spine styling, intro cinematic, and the consolidated `@media (max-width: 900px)` mobile + iPad block at the bottom of the file.
- `main.js` — skill registry, scroll-linked transforms, bidirectional collection, hover-persistence + mutually-exclusive panel state machine (backpack / creative / technical), fly-to-bag / fly-to-event animations, `+N` popups, two-stage spine builder, three-stage era detection, hero-peak gating for the waving variant, mobile-only panel reparenting + `body.at-top` / `body.panel-*-open` class mirroring, and the intro-cinematic orchestrator + auto-scroll.
- `events.md` — source of truth for event-card content (kicker, title, where, stats, tags, description, links). Used by hand to sync the HTML.
- `assets/adult.webm|mov` + `assets/teen.webm|mov` + `assets/waving.webm|mov` — character clips with alpha backgrounds (WebM for Chrome / Firefox, MOV HEVC for Safari). `assets/baby.svg` is the static baby variant.
- `icon.png` — 192×192 favicon (used for both the browser tab and iOS home-screen icon).
- `robots.txt` — crawler opt-out, see above.
- IcoFont (jsdelivr CDN) for every icon — events and skills.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing events + skills

- **Events** live as `<article class="event">` elements in `index.html`. Each carries:
  - `data-skills="skill-id skill-id ..."` — space-separated IDs from the `SKILLS` registry in `main.js`. Determines which skills are removed / restored as that event crosses viewport midline.
  - Optional `data-branch-anchor="bottom"` — marks the teen ↔ adult gate (Summer Love 2018).
  - Optional `data-baby-source="true"` — marks the fly-from / fly-to anchor for the baby hobbies (1986 Born).
  - Optional `data-school-gate="true"` — marks Minerva 2008. The character's baby ↔ teen transition happens at the *midpoint* between this event and `data-baby-source`, and the same midpoint gates the baby-hobby pair.
- **Skills** are defined in one place — the `SKILLS` object at the top of `main.js`. Each entry has `{ name, cat, icon, baby? }` where `icon` is an IcoFont class suffix (e.g. `icon: "brain"` → `<i class="icofont-brain">`) and `baby: true` flags an entry that's handled by the baby-hobby gate rather than the normal scroll flow. Order within each category controls grid order; first = most prominent.
- **Categories** are `tech`, `people`, `craft`, or `hobby`. Adding a fifth would require a new tab button in the panel HTML + an extra `.char-skills-grid[data-active-cat="..."]` filter rule in CSS + a `catCounters` slot in `main.js`.
- **Event content** — the canonical text for each card (kicker, title, where, stats, tags, description) lives in `events.md`. Edit there first, then mirror into the HTML.

## Character video assets

The three looping clips are at `assets/{adult,teen,waving}.webm|mov` with an alpha background (the character on transparency). Because line-drawn characters only have opaque linework — not filled bodies — the inline `#char-backdrop` SVG filter uses morphological closing on the alpha channel to build a solid paper-coloured silhouette behind the character so the timeline doesn't show through the body. Two stacked `drop-shadow` cream glows finish the edge. The baby variant at `assets/baby.svg` passes through the same filter, plus a gentle rocking rotation animation while in baby era.

## Design + code

Designed and built by Victor Künzig with Claude (Anthropic).
