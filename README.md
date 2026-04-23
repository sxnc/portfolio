# portfolio

Victor Künzig's one-page portfolio. An online companion to the CV.

Pure static site: HTML + CSS + vanilla JS, IcoFont via CDN, three short looping videos (walking adult, walking teen, waving adult), and a single SVG for the baby variant. No build step, no framework, no trackers.

## What's in it

- **Intro cinematic** on first load: a cream curtain with a big `Est. 1986` cross-fades to the baby character alone, the curtain lifts while the baby scales down to normal size, and the page auto-scrolls from bottom to top over ~12 seconds with ease-in-out pacing. Any wheel / touch / keydown / mousedown cancels the auto-scroll. `prefers-reduced-motion` skips the whole thing.
- **Single vertical timeline**, reverse-chronological (today at the top, 1986 at the bottom). Plain black dots at both the top ("Today") and bottom (birth) as terminators.
- **Bending SVG spine** — the spine is a cubic-bezier path that bulges permanently around the walking character (fixed at viewport centre). The bulge side is a proximity-weighted blend of the nearby events' sides, smoothed by a two-stage EMA (one on the raw direction, one on the final bend offset) so opposite-side transitions cross-fade gently and fast-scroll doesn't wobble the curve. The upper reach is clamped so the path always terminates cleanly at the top dot. A moss trace reveals the path from the top down to the character's current position.
- **Three-stage character** that morphs with scroll: baby (static SVG in a crib rock) below the midpoint of Born → Minerva; teen between that midpoint and Summer Love 2018; adult above. Variant swap is a game-style scale/opacity pop rather than a cross-fade. A `LEVEL UP!` popup fires on upward transitions.
- **Waving hero greeting**: right at the peak of the hero stage (`p < 0.1` in the intro-scroll zone, i.e. the top few vh), the walking-adult clip swaps to a waving variant so the character actively greets the viewer. Scrolling down even a little reverts to walking.
- **Three interactive hint dots** on the hero-stage character:
  - **Backpack** (right side, green pulsing dot) — opens the skills panel.
  - **Creative** (upper-left of head) — opens a paper bio card on the left with a short creative manifesto.
  - **Technical** (upper-right of head, mirrored to creative) — opens a matching bio card on the right.
  Each dot has a hand-drawn Caveat-font label + curved arrow, all scoped to the hero stage and hidden on the timeline. Mobile (≤720 px) hides the two head-dot hints; the backpack hint stays.
- **Backpack inventory** (hover the character or the green hint dot): skills split across four tabs — **Tech · People · Craft · Hobby** — with a click-to-switch grid of IcoFont icons + labels and a live count badge. The backpack panel is locked vertically to viewport centre (not the dot) and sized to its content, so short categories don't leave empty space and tall ones still cap at `calc(100vh - 60px)` with an internal scroll. If the bag is empty, the green hint dot hides.
- **Bidirectional scroll collection**: starts full at the top of the page. Scrolling down past an event animates that event's skills *out* of the bag toward the event; scrolling back up re-collects them. A `+N SKILL` popup floats above the character on each gain. Skills fly to / from the small green hint dot sitting at the edge of the backpack.
- **Hobby tab** carries era-linked entries that appear as you pass each event: Reading + Cycling (from SRF), Electric Guitar (Amazee Labs dev role), Skateboarding (eye media), Video Games + Movies (Minerva apprenticeship). Two baby-only hobbies (Annoying Everyone, Lego Traps) appear only while the character is in baby era and vanish exactly at the baby → teen flip.
- **Speech-bubble CTA** in front of the character's face. Shows `...` by default; on hover the bubble expands leftward first, then the `Let's talk!` text fades in at its final position. Baby era hides it entirely.
- **Intro speech bubble** (`Hi! I'm Victor.`): kept hidden during the intro auto-scroll, then pops in with a soft spring once the page lands at the top.
- **Event cards**: moss-green paper cards branching left / right of the spine, justified descriptions with hyphenation, bold links. Year labels sit beside the card on the same side and share its scroll transform so they track as a unit.
- **Metric counters** animate from 0 → target whenever a metric enters the viewport, and reset when it leaves, so the count-up plays no matter which direction the user scrolls in from.
- **Notebook grid** fills the page as the only background decoration — the cream body colour carries the rest.

## Stack

- `index.html` — markup, event data (each `<article class="event">` carries a `data-skills="..."` list), the backpack panel, the two creative/technical bio cards, the three hero-stage hint arrows, the intro speech bubble, the intro-cinematic curtain, and an inline SVG `<filter>` (`#char-backdrop`) used to fill the character's transparent interior with paper.
- `styles.css` — layout, character rig, speech bubbles, backpack + bio panels, hero-stage hint dots / arrows / labels, all animations, spine styling, intro cinematic.
- `main.js` — skill registry, scroll-linked transforms, bidirectional collection, hover-persistence + mutually-exclusive panel state machine (backpack / creative / technical), fly-to-hint-dot / fly-to-event animations, `+N` popups, two-stage spine builder, three-stage era detection, hero-peak gating for the waving variant, and the intro-cinematic orchestrator + auto-scroll.
- `events.md` — source of truth for event-card content (kicker, title, where, stats, tags, description, links). Used by hand to sync the HTML.
- `assets/adult.webm|mov` + `assets/teen.webm|mov` + `assets/waving.webm|mov` — character clips with alpha backgrounds (WebM for Chrome / Firefox, MOV HEVC for Safari). `assets/baby.svg` is the static baby variant. `assets/adult.svg` / `teen.svg` are static fallback traces.
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
