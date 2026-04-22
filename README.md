# portfolio

Victor Künzig's one-page portfolio — an online companion to the CV.

Pure static site: HTML + CSS + vanilla JS, IcoFont via CDN, and two short looping walk-cycle videos. No build step, no framework, no trackers.

## What's in it

- **Single vertical timeline**, reverse-chronological (today at the top, 1986 at the bottom)
- **Parallel video branch** that splits off the main career line at the 2018 "Summer Love" event and re-joins at EVERYWOW 2025 — career on the left track, film/video on the right track
- **Walking character** fixed at viewport centre. Age morphs at the 2018 threshold: adult variant (curly hair + round glasses) above, teen variant (baseball cap + square glasses) below. Cross-fades on scroll
- **Backpack inventory** (hover the character): 34 skills sorted by today's market relevance, split across three tabs — **Tech · People · Craft**. Grid of IcoFont icons + labels, click-to-switch tabs, live count badge
- **Bidirectional scroll collection**: starts full at the top of the page. Scrolling down past an event animates that event's skills *out* of the bag onto the event on the timeline; scrolling back up animates them home. A `+N SKILL` popup floats above the character on each gain
- **Speech-bubble CTA** floating in front of the character's face — shows `...` by default, widens leftward to `Let's talk!` on hover, links to `mailto:`
- **Paper texture** background: three stacked static layers (fine grain + coloured mottle + fibrous structure) for a slightly-aged production-binder feel

## Stack

- `index.html` — markup, event data (each `<article class="event">` carries a `data-skills="..."` list), an inline SVG `<filter>` used to fill the character's transparent interior with paper
- `styles.css` — layout, the character rig, speech bubble, skills panel, all animations, paper texture
- `main.js` — skill registry, scroll-linked transforms, bidirectional collection, hover persistence, fly-to-bag / fly-to-event animations, `+N` popup
- `assets/adult.webm|mov` and `assets/teen.webm|mov` — the walk-cycle loops with alpha backgrounds. WebM for Chrome/Firefox, MOV (HEVC) for Safari; `assets/*.svg` are the static fallback traces
- IcoFont (jsdelivr CDN) for all icons — events and skills

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing events + skills

- **Events** live as `<article class="event">` elements in `index.html`. Each carries:
  - `data-skills="skill-id skill-id ..."` — space-separated IDs from the `SKILLS` registry in `main.js`. Determines which skills are removed/restored as that event crosses viewport midline
  - Optional `data-branch-anchor="top"|"bottom"` — marks the split / merge points of the parallel video branch
- **Skills** are defined in one place — the `SKILLS` object at the top of `main.js`. Each entry has `{ name, cat, icon }` where `icon` is an IcoFont class suffix (e.g. `icon: "brain"` → rendered as `<i class="icofont-brain">`). Order within each category controls grid order; first = most prominent
- **Categories** are `tech`, `people`, or `craft`. Adding a fourth would require a new tab button in the panel HTML + an extra `.char-skills-grid[data-active-cat="..."]` filter rule in CSS

## Character video assets

The two walk-cycle clips are at `assets/{adult,teen}.webm|mov`. They have an alpha background (the character on transparency). Because line-drawn characters only have opaque linework — not filled bodies — an inline SVG filter (`#char-backdrop` in `index.html`) uses morphological closing on the alpha channel to build a solid paper-coloured silhouette behind the character so the timeline doesn't show through the body. Two stacked `drop-shadow` cream glows finish the edge.
