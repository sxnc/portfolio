# portfolio

Victor Künzig's one-page portfolio. An online companion to the CV.

Pure static site: HTML + CSS + vanilla JS, IcoFont via CDN, two short looping walk-cycle videos, and a single SVG for the baby variant. No build step, no framework, no trackers.

## What's in it

- **Single vertical timeline**, reverse-chronological (today at the top, 1986 at the bottom). Each event lives next to a bending SVG spine.
- **Bending spine** — the spine is an SVG path that bulges permanently around the walking character (fixed at viewport centre). The bulge side is a proximity-weighted blend of the nearby events' sides (blended temporally with an EMA so opposite-side transitions cross-fade instead of snapping). The upper reach is clamped so the spine always terminates cleanly at the black top dot.
- **Three-stage character** that morphs with scroll: baby (static SVG in a crib-rock) below the midpoint of Born → Minerva; teen between that midpoint and Summer Love 2018; adult above. Swap is a game-style pop rather than a cross-fade. A `LEVEL UP!` popup fires on upward transitions.
- **Hero-stage sky** behind the big character during the intro: drifting clouds with a sun during the day, a moon and twinkling stars at night, with warm dawn / dusk variants. Derived from the user's local clock in JS (no API).
- **Backpack inventory** (hover the character or the green hint dot): skills split across four tabs — **Tech · People · Craft · Hobby** — with a click-to-switch grid of IcoFont icons + labels and a live count badge. The Hobby tab carries era-linked entries: Reading (from SRF), Electric Guitar (Amazee Labs dev role), Skateboarding (eye media), Video Games + Movies (Minerva apprenticeship); two "baby-era" hobbies (Annoying Everyone, Lego Traps) appear only while the character is in baby era.
- **Bidirectional scroll collection**: starts full at the top of the page. Scrolling down past an event animates that event's skills *out* of the bag toward the event; scrolling back up re-collects them. A `+N SKILL` popup floats above the character on each gain. Skills fly to / from the small green hint dot sitting at the edge of the backpack.
- **Speech-bubble CTA** in front of the character's face. Shows `...` by default; on hover the bubble expands leftward first, then the `Let's talk!` text fades in at its final position (no letter-spacing snap mid-animation).
- **Hero interactivity**: the hint dot stays active in the intro stage, so clicking it opens the backpack and dismisses the big intro speech bubble in a video-game UI swap; closing the backpack restores the bubble.
- **Event connector lines** grow from each card outward toward the spine as the event approaches viewport centre, and are fully drawn when the event is centred on the character.
- **Year labels** sit beside their card on the same side of the timeline (not pinned to the spine).
- **Paper texture** background: three stacked static layers (fine grain + coloured mottle + fibrous structure) for a slightly-aged production-binder feel.

## Stack

- `index.html` — markup, event data (each `<article class="event">` carries a `data-skills="..."` list), the backpack panel, the intro speech bubble, the hero sky primitives, and an inline SVG `<filter>` (`#char-backdrop`) used to fill the character's transparent interior with paper
- `styles.css` — layout, the character rig, speech bubble, skills panel, all animations, paper texture, hero sky, spine styling
- `main.js` — skill registry, scroll-linked transforms, bidirectional collection, hover persistence, fly-to-hint-dot / fly-to-event animations, `+N` popups, bending-spine builder, three-stage era detection, time-of-day sky classification
- `assets/adult.webm|mov` + `assets/teen.webm|mov` — the walk-cycle loops with alpha backgrounds (WebM for Chrome / Firefox, MOV HEVC for Safari). `assets/*.svg` are the static fallback traces; `assets/baby.svg` is the static baby variant
- IcoFont (jsdelivr CDN) for every icon — events and skills

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing events + skills

- **Events** live as `<article class="event">` elements in `index.html`. Each carries:
  - `data-skills="skill-id skill-id ..."` — space-separated IDs from the `SKILLS` registry in `main.js`. Determines which skills are removed / restored as that event crosses viewport midline
  - Optional `data-branch-anchor="bottom"` — marks the teen ↔ adult gate (Summer Love 2018)
  - Optional `data-baby-source="true"` — marks the fly-from / fly-to anchor for the baby hobbies (1986 Born)
  - Optional `data-school-gate="true"` — marks the boundary between baby and teen era (Minerva 2008). The baby hobbies pop into the bag once this event crosses above the viewport midline; the character's baby ↔ teen transition happens at the midpoint between this event and `data-baby-source`.
- **Skills** are defined in one place — the `SKILLS` object at the top of `main.js`. Each entry has `{ name, cat, icon, baby? }` where `icon` is an IcoFont class suffix (e.g. `icon: "brain"` → `<i class="icofont-brain">`) and `baby: true` flags an entry that's handled by the baby-hobby gate rather than the normal scroll flow. Order within each category controls grid order; first = most prominent.
- **Categories** are `tech`, `people`, `craft`, or `hobby`. Adding a fifth would require a new tab button in the panel HTML + an extra `.char-skills-grid[data-active-cat="..."]` filter rule in CSS + a `catCounters` slot in `main.js`.

## Character video assets

The two walk-cycle clips are at `assets/{adult,teen}.webm|mov` with an alpha background (the character on transparency). Because line-drawn characters only have opaque linework — not filled bodies — the inline `#char-backdrop` SVG filter uses morphological closing on the alpha channel to build a solid paper-coloured silhouette behind the character so the timeline doesn't show through the body. Two stacked `drop-shadow` cream glows finish the edge. The baby variant at `assets/baby.svg` passes through the same filter, plus a gentle rocking rotation animation while in baby era.

## Design + code

Designed and built by Victor Künzig with Claude (Anthropic).
