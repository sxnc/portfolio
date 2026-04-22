/* ================================================================
   Victor Künzig — timeline one-pager

   · Walking character fixed at viewport centre. Age morphs at 2018.
   · Parallel video branch (2018 → 2025) laid out in JS.
   · Per-event scroll progress drives layered scroll animations.
   · Backpack inventory: starts full. Scrolling down past an event
     removes that event's skills (fly from bag → event); scrolling
     back up re-adds them (fly from event → bag).
================================================================= */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal-on-scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal, .event').forEach(el => revealIO.observe(el));

  /* ---------- 2. Counters ----------
     Animate from 0 → target whenever the number enters the viewport,
     regardless of scroll direction. Each run cancels its predecessor,
     and the observer keeps observing (no unobserve) so scrolling back
     up to the event re-fires the count. */
  const counterAnims = new WeakMap();   // element → rAF id
  const runCounter = (el) => {
    const target   = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 1600;
    const start    = performance.now();
    cancelAnimationFrame(counterAnims.get(el) || 0);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) counterAnims.set(el, requestAnimationFrame(tick));
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    counterAnims.set(el, requestAnimationFrame(tick));
  };
  const counterIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        runCounter(e.target);
      } else {
        // Reset to 0 when scrolled out so the re-entry animation is
        // visibly a count-up (not a no-op).
        cancelAnimationFrame(counterAnims.get(e.target) || 0);
        const decimals = parseInt(e.target.dataset.decimals || '0', 10);
        const suffix   = e.target.dataset.suffix || '';
        e.target.textContent = (0).toFixed(decimals) + suffix;
      }
    }
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count-to]').forEach(el => counterIO.observe(el));

  /* ---------- 3. Refs ---------- */
  const timeline = document.getElementById('timeline');
  const events = Array.from(document.querySelectorAll('.event'));

  const character   = document.getElementById('character');
  const charPanel   = character ? character.querySelector('.char-skills') : null;
  const charBackpack = character ? character.querySelector('.char-backpack') : null;
  const charHint    = character ? character.querySelector('.char-hint') : null;
  const skillsGrid  = document.getElementById('char-skills-grid');
  const skillsCount = document.getElementById('char-count');
  const tabs        = Array.from(document.querySelectorAll('.char-skills-tabs button'));

  const branchBottomEl = document.querySelector('[data-branch-anchor="bottom"]'); // 2018 Summer Love — teen ↔ adult threshold
  const schoolGateEl   = document.querySelector('[data-school-gate]');            // 2008 Minerva — school gate (baby hobbies boundary)

  /* ---------- 4. Skill registry ----------
     Ordered within each category by market relevance today (top = most
     in-demand in 2026). Icons are IcoFont classes.
  ------------------------------------------------- */
  const SKILLS = {
    // ── TECH ──────────────────────────────────────────────────
    'ai':              { name: 'AI Pipelines',      cat: 'tech',   icon: 'brain' },
    'claude-code':     { name: 'Claude Code',       cat: 'tech',   icon: 'ui-text-chat' },
    'prompt-eng':      { name: 'Prompt Engineering',cat: 'tech',   icon: 'magic' },
    'llm-tools':       { name: 'LLM Integration',   cat: 'tech',   icon: 'robot-face' },
    'automation':      { name: 'Workflow Automation', cat: 'tech', icon: 'automation' },
    'python':          { name: 'Python',            cat: 'tech',   icon: 'terminal' },
    'aws':             { name: 'AWS',               cat: 'tech',   icon: 'brand-amazon' },
    'streaming-infra': { name: 'Streaming Infra',   cat: 'tech',   icon: 'network-tower' },
    'js':              { name: 'JavaScript',        cat: 'tech',   icon: 'code' },
    'css':             { name: 'CSS',               cat: 'tech',   icon: 'code-alt' },
    'drupal':          { name: 'Drupal',            cat: 'tech',   icon: 'brand-drupal' },
    'software-eng':    { name: 'Software Eng.',     cat: 'tech',   icon: 'gears' },
    'php':             { name: 'PHP',               cat: 'tech',   icon: 'code' },
    'typo3':           { name: 'Typo3',             cat: 'tech',   icon: 'typo3' },
    // ── PEOPLE ────────────────────────────────────────────────
    'team-lead':        { name: 'Team Leadership',  cat: 'people', icon: 'users-alt-3' },
    'stakeholder':      { name: 'Stakeholder Mgmt', cat: 'people', icon: 'share-alt' },
    'talent-coach':     { name: 'Talent Coaching',  cat: 'people', icon: 'graduate-alt' },
    'hiring':           { name: 'Hiring',           cat: 'people', icon: 'users' },
    'performance-coach':{ name: 'Perf. Coaching',   cat: 'people', icon: 'award' },
    'scrum':            { name: 'SCRUM',            cat: 'people', icon: 'chart-flow' },
    'safe':             { name: 'SAFe Agile',       cat: 'people', icon: 'chart-flow-1' },
    'delivery':         { name: 'Delivery Mgmt',    cat: 'people', icon: 'delivery-time' },
    'kpi':              { name: 'KPI Management',   cat: 'people', icon: 'chart-bar-graph' },
    'it-security':      { name: 'IT Security',      cat: 'people', icon: 'shield-alt' },
    // ── CRAFT ─────────────────────────────────────────────────
    'video-prod':       { name: 'Video Production', cat: 'craft',  icon: 'video-alt' },
    'content-strategy': { name: 'Content Strategy', cat: 'craft',  icon: 'light-bulb' },
    'storytelling':     { name: 'Storytelling',     cat: 'craft',  icon: 'book-alt' },
    'post-prod':        { name: 'Post-Production',  cat: 'craft',  icon: 'film' },
    'video-edit':       { name: 'Video Editing',    cat: 'craft',  icon: 'movie' },
    'directing':        { name: 'Directing',        cat: 'craft',  icon: 'video-clapper' },
    'cinematography':   { name: 'Cinematography',   cat: 'craft',  icon: 'camera-alt' },
    'screenwriting':    { name: 'Screenwriting',    cat: 'craft',  icon: 'pencil-alt-1' },
    'livestream':       { name: 'Livestream',       cat: 'craft',  icon: 'live-support' },
    'thumbnail':        { name: 'Thumbnail Design', cat: 'craft',  icon: 'image' },
    // ── HOBBY ─────────────────────────────────────────────────
    // Adult-era hobbies, collected by scrolling from today down through
    // each event that "introduced" them. The two baby hobbies are only
    // active while the character is in baby era (gated in main.js).
    'reading':          { name: 'Reading',          cat: 'hobby',  icon: 'read-book' },
    'cycling':          { name: 'Cycling',          cat: 'hobby',  icon: 'bicycle-alt-1' },
    'electric-guitar':  { name: 'Electric Guitar',  cat: 'hobby',  icon: 'music-alt' },
    'skateboarding':    { name: 'Skateboarding',    cat: 'hobby',  icon: 'racings-wheel' },
    'video-games':      { name: 'Video Games',      cat: 'hobby',  icon: 'game-controller' },
    'movies':           { name: 'Movies',           cat: 'hobby',  icon: 'movie' },
    'annoying-everyone':{ name: 'Annoying Everyone',cat: 'hobby',  icon: 'ghost',    baby: true },
    'lego-traps':       { name: 'Lego Traps',       cat: 'hobby',  icon: 'cubes',    baby: true },
  };

  /* Build per-event skill lists from data-skills="id id id" attributes */
  const eventSkills = new Map(); // event element → [skill ids]
  for (const ev of events) {
    const raw = ev.dataset.skills;
    if (!raw) continue;
    const ids = raw.split(/\s+/).filter(id => id && SKILLS[id]);
    if (ids.length) eventSkills.set(ev, ids);
  }

  /* Build the grid: every skill rendered once; filter by category via CSS.
     --i is the skill's index within its category — used by CSS to stagger
     the cascade-in animation when the panel opens. */
  const skillEls = new Map(); // skill id → DOM element
  if (skillsGrid) {
    const catCounters = { tech: 0, people: 0, craft: 0, hobby: 0 };
    for (const [id, s] of Object.entries(SKILLS)) {
      const i = catCounters[s.cat]++;
      const el = document.createElement('div');
      el.className = 'char-skill';
      el.dataset.cat = s.cat;
      el.dataset.skillId = id;
      el.style.setProperty('--i', i);
      el.innerHTML =
        '<span class="char-skill-icon"><i class="icofont-' + s.icon + '" aria-hidden="true"></i></span>' +
        '<span class="char-skill-label">' + s.name + '</span>';
      // Baby hobbies start out of the bag — they appear once the user
      // scrolls past the school gate (into baby era).
      if (s.baby) el.classList.add('is-removed');
      skillsGrid.appendChild(el);
      skillEls.set(id, el);
    }
  }

  /* Tracks which events' skills are currently REMOVED from the backpack.
     State starts empty (= bag is full). Events near the bottom of the page
     won't affect initial state because they're all below viewport mid. */
  const removed = new Set();

  /* Count how many skills are currently in each category (not-removed) */
  const countByCat = () => {
    const c = { tech: 0, people: 0, craft: 0, hobby: 0 };
    for (const el of skillEls.values()) {
      if (el.classList.contains('is-removed')) continue;
      c[el.dataset.cat]++;
    }
    return c;
  };

  /* Tab visibility — Hobby surfaces as soon as at least one hobby is in
     the bag; the others wait until they carry a usable amount. */
  const updateTabVisibility = () => {
    const counts = countByCat();
    let activeEmpty = false;
    let firstVisible = null;
    for (const btn of tabs) {
      const cat = btn.dataset.cat;
      const threshold = cat === 'hobby' ? 1 : 2;
      const visible = counts[cat] >= threshold;
      btn.classList.toggle('is-hidden', !visible);
      if (visible && !firstVisible) firstVisible = btn;
      if (!visible && btn.classList.contains('is-active')) activeEmpty = true;
    }
    if (activeEmpty && firstVisible) {
      tabs.forEach(b => b.classList.remove('is-active'));
      firstVisible.classList.add('is-active');
      if (skillsGrid) skillsGrid.dataset.activeCat = firstVisible.dataset.cat;
    }
  };

  /* Animate the panel's height as its content changes, but only while
     the panel is open — no reason to animate a hidden box. FLIP-style. */
  let heightRaf = null;
  const animatePanelHeight = () => {
    if (!charPanel || !character.classList.contains('is-open')) return;
    cancelAnimationFrame(heightRaf);
    const from = charPanel.offsetHeight;
    charPanel.style.height = 'auto';
    const to = charPanel.offsetHeight;
    if (Math.abs(from - to) < 2) {
      charPanel.style.height = '';
      return;
    }
    charPanel.style.height = from + 'px';
    void charPanel.offsetHeight;  // flush layout
    charPanel.style.transition = 'height 380ms cubic-bezier(0.45, 0, 0.55, 1)';
    charPanel.style.height = to + 'px';
    heightRaf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (!charPanel) return;
        charPanel.style.height = '';
        charPanel.style.transition = '';
      }, 400);
    });
  };

  /* Assign each *visible* skill a per-category `--i` index so the
     cascade-in animation runs in reading order (top-down, left-right).
     Without this, hidden (removed) skills leave gaps in the stagger
     and later rows appear to animate out of order. */
  const renumberVisibleSkills = () => {
    const perCat = { tech: 0, people: 0, craft: 0, hobby: 0 };
    // Iterate DOM order (which is SKILLS declaration order = grid order)
    // rather than Map iteration, to be resilient to any future resort.
    const grid = skillsGrid;
    if (!grid) return;
    for (const el of grid.children) {
      if (el.classList.contains('is-removed')) continue;
      const cat = el.dataset.cat;
      if (!(cat in perCat)) continue;
      el.style.setProperty('--i', perCat[cat]++);
    }
  };

  const updateCount = () => {
    if (!skillsCount) return;
    let n = 0;
    for (const el of skillEls.values()) {
      if (!el.classList.contains('is-removed')) n++;
    }
    skillsCount.textContent = n;
    skillsCount.classList.remove('bump');
    void skillsCount.offsetWidth;
    skillsCount.classList.add('bump');
    character?.classList.toggle('has-skills', n > 0);
    renumberVisibleSkills();
    updateTabVisibility();
    animatePanelHeight();
  };

  /* ---------- 5. Tab switching ---------- */
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-hidden')) return;
      tabs.forEach(b => b.classList.toggle('is-active', b === btn));
      if (skillsGrid) skillsGrid.dataset.activeCat = btn.dataset.cat;
      // A new category may drastically resize the panel, causing the
      // pointer to fall outside it. Extend the close-grace so the panel
      // doesn't vanish under the user's mouse.
      bumpCloseGrace(600);
      animatePanelHeight();
    });
  });

  /* ---------- 6. Hover persistence ----------
     Panel stays open while pointer is over character OR panel. A short
     hide delay bridges the gap between them when the pointer transitions
     from one to the other. */
  let hideTimer = null;
  // Users can temporarily extend the hover grace (e.g. right after a
  // category switch resizes the panel out from under the pointer) by
  // bumping this with bumpCloseGrace().
  let extraGraceUntil = 0;
  const bumpCloseGrace = (ms) => { extraGraceUntil = Math.max(extraGraceUntil, Date.now() + ms); };

  const openPanel  = () => {
    clearTimeout(hideTimer);
    if (!character || character.classList.contains('is-open')) return;
    // No inventory in baby era.
    if (character.classList.contains('is-baby')) return;
    // Refresh per-category indices so the cascade-in animation on the
    // char-skills follows the *current* visible grid order, not the
    // order at panel-build time. Also strip any lingering just-added
    // class (whose animation-delay uses --batch-i and would otherwise
    // override the cascade ordering) and force a reflow so the browser
    // restarts the animation cleanly every open.
    renumberVisibleSkills();
    if (skillsGrid) {
      for (const el of skillsGrid.children) {
        el.classList.remove('just-added');
        el.style.animation = 'none';
      }
      void skillsGrid.offsetWidth;
      for (const el of skillsGrid.children) {
        el.style.animation = '';
      }
    }
    character.classList.add('is-open');
    // Intro bubble stays visible alongside the backpack — the user
    // wants both readable at once in the hero stage.
    // Auto-switch if the tab that was active is now empty (can happen
    // if the panel was opened after scrolling drained the category).
    updateTabVisibility();
  };
  const scheduleClose = () => {
    clearTimeout(hideTimer);
    const base = 260;
    const grace = Math.max(0, extraGraceUntil - Date.now());
    hideTimer = setTimeout(() => {
      // If the pointer actually re-entered the panel/hint during the
      // grace window, bail out of closing.
      if (charPanel && charPanel.matches(':hover')) return;
      if (charHint  && charHint.matches(':hover'))  return;
      if (character && character.matches(':hover')) return;
      character?.classList.remove('is-open');
    }, base + grace);
  };
  if (character && charPanel) {
    character.addEventListener('mouseenter', openPanel);
    character.addEventListener('mouseleave', scheduleClose);
    charPanel.addEventListener('mouseenter', openPanel);
    charPanel.addEventListener('mouseleave', scheduleClose);
    character.addEventListener('focus', openPanel);
    character.addEventListener('blur',  scheduleClose);
  }
  // The green hint dot has its own pointer handlers: hovering it opens
  // the backpack panel + CTA bubble, and clicking toggles it explicitly.
  // In intro mode it also dismisses the big "Hi..." speech bubble, so
  // opening the backpack in the hero stage feels like a game UI swap.
  if (charHint) {
    charHint.addEventListener('mouseenter', openPanel);
    charHint.addEventListener('mouseleave', scheduleClose);
    charHint.addEventListener('click', (e) => {
      e.preventDefault();
      if (character.classList.contains('is-open')) {
        character.classList.remove('is-open');
      } else {
        openPanel();
      }
    });
  }

  /* ---------- 7. (legacy branch layout removed — single spine now) --- */
  const layoutBranches = () => { /* no-op: there is no video branch */ };

  /* ---------- 8. Bending timeline spine ----------
     An SVG <path> rebuilt every scroll frame. The bulge is always
     centred on the character (viewport mid → timeline y). Its direction
     is a proximity-weighted blend of the nearby events' sides, so the
     spine leans toward whichever event card is currently in view — and
     cross-fades smoothly when the character moves between cards on
     opposite sides.

     Path + mark offsets share the same `bendAt(y)` function (smoothstep
     bulge), so every dot sits exactly on the generated polyline.
  ------------------------------------------------- */
  const spineSvg   = document.getElementById('timeline-spine');
  const spinePath  = document.getElementById('spine-path');
  const spineTrace = document.getElementById('spine-trace');
  const BEND_MAX   = 95;   // horizontal bulge amplitude, px
  const APPROACH   = 220;  // vertical ramp-in on each side of peak, px (wider = gentler)
  const DIR_EASE   = 0.12; // per-frame EMA factor on bulge direction (smaller = gentler)
  const TOP_LOCK   = 8;    // spine must terminate at x=cx at this y (where the "Today" dot sits)
  const narrowMQ   = window.matchMedia('(max-width: 900px)');

  // Smoothed bulge direction across frames — gives a gentle ease when
  // the weighted event side changes sign (crossing between opposite-side
  // events), rather than snapping through zero.
  let smoothedDir = 0;

  // Per-event mark alignment offset (so the bulge peak sits next to the
  // event's TITLE rather than its icon). Populated by measureMarkOffsets
  // after layout is stable.
  const measureMarkOffsets = () => {
    for (const ev of events) {
      const title = ev.querySelector('.event-title');
      const mark  = ev.querySelector('.event-mark');
      if (!title || !mark) continue;
      // Measure the title's vertical centre relative to the event's
      // own content box (since the mark spans all grid rows and starts
      // at the event top). This makes the mark sit at the title's
      // height regardless of whether the year label is above the card.
      const eR = ev.getBoundingClientRect();
      const tR = title.getBoundingClientRect();
      const titleMid = (tR.top + tR.height * 0.5) - eR.top;
      const markHalf = mark.offsetHeight * 0.5;
      ev.style.setProperty('--mark-align', (titleMid - markHalf).toFixed(1) + 'px');
    }
  };

  let vbW = 0, vbH = 0;   // cached viewBox dims — only re-set when changed
  const buildSpine = () => {
    if (!timeline || !spineSvg || !spinePath) return;
    const w = timeline.clientWidth;
    const h = timeline.clientHeight;
    if (w !== vbW || h !== vbH) {
      spineSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      vbW = w; vbH = h;
    }
    const narrow = narrowMQ.matches;
    const cx = narrow ? 28 : w / 2;
    const vh = window.innerHeight;
    const mid = vh * 0.5;
    const tlRect = timeline.getBoundingClientRect();

    // Character's y in timeline coords. The bulge's *peak* is clamped
    // so its upper reach (peakY - APPROACH) can never cross TOP_LOCK —
    // that guarantees the path is always dead-straight from y=0 through
    // the "Today" dot. When the character is above the clamp point,
    // the bulge stays anchored at the clamp and instead fades out.
    const charY = mid - tlRect.top;
    const minPeakY = TOP_LOCK + APPROACH;
    const maxPeakY = Math.max(minPeakY, h - APPROACH);
    const peakY = Math.max(minPeakY, Math.min(maxPeakY, charY));

    // Amplitude fade as the character enters / leaves the timeline zone.
    let fade;
    if (charY <= TOP_LOCK || charY >= h) fade = 0;
    else if (charY < minPeakY) fade = (charY - TOP_LOCK) / APPROACH;
    else if (charY > maxPeakY) fade = (h - charY) / APPROACH;
    else fade = 1;
    fade = Math.max(0, Math.min(1, fade));
    fade = fade * fade * (3 - 2 * fade);

    // Direction: weighted blend of nearby events' sides, with linear
    // falloff and a wide reach so several events contribute at once.
    // Then smoothed across frames (EMA) so the bulge eases gently into
    // its new direction instead of swinging through zero quickly.
    const reach = vh * 0.6;
    let sideSum = 0, weightSum = 0;
    for (const ev of events) {
      const mark = ev.querySelector('.event-mark');
      if (!mark) continue;
      const r = mark.getBoundingClientRect();
      const mc = r.top + r.height * 0.5;
      const p = Math.max(0, 1 - Math.abs(mc - mid) / reach);
      if (p <= 0) continue;
      const side = ev.classList.contains('event-left')  ? -1
                 : ev.classList.contains('event-right') ?  1
                 : 0;
      sideSum   += side * p;
      weightSum += p;
    }
    const rawDir = weightSum > 0
      ? Math.max(-1, Math.min(1, sideSum / weightSum))
      : 0;
    smoothedDir += (rawDir - smoothedDir) * DIR_EASE;

    const bendOffset = narrow ? 0 : BEND_MAX * smoothedDir * fade;

    // Shared bulge function — used for each event mark's horizontal
    // offset, so dots always land on the curve. Matches the cubic
    // bezier shape exactly: with control points at ±APPROACH/3 the
    // bezier's x(y) reduces to cx + bendOffset · smoothstep(t).
    const bendAt = (y) => {
      const t = Math.max(0, 1 - Math.abs(y - peakY) / APPROACH);
      const te = t * t * (3 - 2 * t);
      return bendOffset * te;
    };

    // Build the path from two cubic beziers flanked by straight lines.
    // Control points chosen so x(y) is a smoothstep — the same formula
    // bendAt uses — which keeps the bezier's tangent vertical at both
    // endpoints and at the peak (C¹-continuous, no visible kinks).
    let d;
    if (Math.abs(bendOffset) < 0.2) {
      d = 'M' + cx + ' 0 L' + cx + ' ' + h;
    } else {
      const y0 = peakY - APPROACH;
      const y1 = peakY + APPROACH;
      const bx = cx + bendOffset;
      const r  = APPROACH / 3;
      d =
        'M' + cx + ' 0' +
        ' L' + cx + ' ' + y0.toFixed(3) +
        ' C' + cx + ' ' + (y0 + r).toFixed(3) +
        ' '  + bx.toFixed(3) + ' ' + (peakY - r).toFixed(3) +
        ' '  + bx.toFixed(3) + ' ' + peakY.toFixed(3) +
        ' C' + bx.toFixed(3) + ' ' + (peakY + r).toFixed(3) +
        ' '  + cx + ' ' + (y1 - r).toFixed(3) +
        ' '  + cx + ' ' + y1.toFixed(3) +
        ' L' + cx + ' ' + h;
    }
    spinePath.setAttribute('d', d);
    if (spineTrace) spineTrace.setAttribute('d', d);

    // Each mark: offset by bendAt(its y) — identical formula to the
    // path, so the dot lands precisely on the generated curve.
    for (const ev of events) {
      const mark = ev.querySelector('.event-mark');
      if (!mark) continue;
      const r = mark.getBoundingClientRect();
      const my = r.top + r.height * 0.5 - tlRect.top;
      mark.style.setProperty('--bend-offset', bendAt(my).toFixed(3) + 'px');
    }

    // Moss trace: reveal the path from top down to the character's
    // actual y (not the clamped peakY — otherwise the trace stops at
    // h - APPROACH when scrolled all the way down). Arclength proxy
    // uses y directly; the curve is near-vertical, so the few px of
    // slack around the bulge are imperceptible.
    if (spineTrace) {
      const visY = Math.max(0, Math.min(h, charY));
      timeline.style.setProperty('--trace-len', visY.toFixed(3));
    }
  };

  /* ---------- 9. Character visibility + era ---------- */
  const spawnLevelUpPopup = () => {
    if (!character || reduceMotion) return;
    const rect = character.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'level-popup';
    el.innerHTML =
      '<i class="icofont-star" aria-hidden="true"></i>' +
      'LEVEL UP!' +
      '<i class="icofont-star" aria-hidden="true"></i>';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top - 56) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  /* Intro scroll handler — enlarges the character at the top of the
     page, scales it down to 1.0 as the user scrolls through the intro
     zone, and fades the intro speech bubble + sky backdrop alongside it. */
  const INTRO_SCALE_MAX = 2.2;
  const introBubble = document.getElementById('char-intro-bubble');
  const introEl    = document.querySelector('.intro');
  const skyEl      = document.getElementById('sky');
  const updateIntroScale = () => {
    if (!character) return;
    const vh = window.innerHeight;
    const introEnd = (introEl ? introEl.offsetHeight : vh) - vh * 0.2;
    const p = introEnd > 0 ? Math.min(1, Math.max(0, window.scrollY / introEnd)) : 1;
    const scale = INTRO_SCALE_MAX + (1 - INTRO_SCALE_MAX) * p;
    character.style.setProperty('--char-scale', scale.toFixed(3));
    character.classList.toggle('intro-mode', p < 0.55);
    if (introBubble) {
      const op = Math.max(0, 1 - p * 1.4);
      introBubble.style.setProperty('--intro-opacity', op.toFixed(3));
      introBubble.classList.toggle('is-hidden', op <= 0.02);
    }
    if (skyEl) {
      const op = Math.max(0, 1 - p * 1.2);
      skyEl.style.setProperty('--sky-opacity', op.toFixed(3));
    }
  };

  /* Time-of-day classification for the hero sky. Pulled from the
     user's local clock. Just two buckets (day/night) — the sky is
     outline line art with no colour wash, so dawn/dusk don't need
     their own visual. The #sky element's data-time attr drives
     sun/moon/cloud/star visibility in CSS. */
  const classifyTime = () => {
    const h = new Date().getHours();
    return (h >= 7 && h < 20) ? 'day' : 'night';
  };
  if (skyEl) {
    skyEl.dataset.time = classifyTime();
    // Re-check every 10 minutes in case the page sits open across
    // dawn/dusk boundaries.
    setInterval(() => {
      const t = classifyTime();
      if (skyEl.dataset.time !== t) skyEl.dataset.time = t;
    }, 600000);
  }

  let bootedEra = false;
  /* Three-stage era detection, tied to two boundaries:
       · Midpoint between 1986 Born and 2008 Minerva  → baby gate
       · 2018 Summer Love                             → teen gate
     Hysteresis buffer keeps the state from thrashing at the midline.
     LEVEL UP fires whenever the level number increases (UP-scroll). */
  const ERA_HY = 40;
  const updateCharacter = () => {
    if (!character || !timeline) return;
    const rect = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.5;
    const inside = rect.bottom > mid - 20;
    character.classList.toggle('is-visible', inside);

    const wasBaby  = character.classList.contains('is-baby');
    const wasYoung = character.classList.contains('is-young');
    const prevLevel = wasBaby ? 0 : wasYoung ? 1 : 2;

    // Baby gate = midpoint between Born (babySource) and Minerva
    // (schoolGateEl). Falls back to Born alone if the school gate is
    // missing.
    let isBaby = wasBaby;
    if (babySource) {
      let bc;
      if (schoolGateEl) {
        const bR = babySource.getBoundingClientRect();
        const sR = schoolGateEl.getBoundingClientRect();
        const bornY   = bR.top + bR.height * 0.5;
        const schoolY = sR.top + sR.height * 0.5;
        bc = (bornY + schoolY) * 0.5;
      } else {
        const bR = babySource.getBoundingClientRect();
        bc = bR.top + bR.height * 0.5;
      }
      if (bc < mid - ERA_HY) isBaby = true;
      else if (bc > mid + ERA_HY) isBaby = false;
    }

    // Summer-Love gate — teen era ceiling (same hysteresis)
    let summerPassed = wasYoung || wasBaby;
    if (branchBottomEl) {
      const sR = branchBottomEl.getBoundingClientRect();
      const sc = sR.top + sR.height * 0.5;
      if (sc < mid - ERA_HY) summerPassed = true;
      else if (sc > mid + ERA_HY) summerPassed = false;
    }

    const isYoung = summerPassed && !isBaby;
    character.classList.toggle('is-baby',  isBaby);
    character.classList.toggle('is-young', isYoung);
    // Baby has no inventory — force the panel closed if the era
    // change catches it open.
    if (isBaby && character.classList.contains('is-open')) {
      character.classList.remove('is-open');
    }

    const newLevel = isBaby ? 0 : isYoung ? 1 : 2;
    if (bootedEra && inside && newLevel > prevLevel) {
      spawnLevelUpPopup();
    }
    bootedEra = true;
  };

  /* ---------- 10. Per-event scroll-linked transforms ---------- */
  const applyScroll = () => {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    const vc = vh * 0.5;
    const half = vh * 0.5;
    for (const el of events) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -400 || rect.top > vh + 400) continue;
      const ec = rect.top + rect.height * 0.5;
      const raw = (ec - vc) / half;
      const s = Math.max(-1.3, Math.min(1.3, raw));
      const sAbs = Math.abs(s);
      el.style.setProperty('--s', s.toFixed(3));
      el.style.setProperty('--s-abs', sAbs.toFixed(3));
      el.classList.toggle('is-active', sAbs < 0.18);
    }
  };

  /* ---------- 11. Skill fly animations ---------- */

  const flyElement = (fromRect, toRect, iconClass, label, onArrive) => {
    const clone = document.createElement('span');
    clone.className = 'flying-skill';
    clone.innerHTML = '<i class="icofont-' + iconClass + '" aria-hidden="true"></i>';
    // Size the clone like a tile so it reads as a "chip"
    const size = 36;
    clone.style.width  = size + 'px';
    clone.style.height = size + 'px';
    clone.style.left   = (fromRect.left + fromRect.width/2  - size/2) + 'px';
    clone.style.top    = (fromRect.top  + fromRect.height/2 - size/2) + 'px';
    if (label) clone.setAttribute('title', label);
    document.body.appendChild(clone);

    // Force reflow then kick the transition
    void clone.getBoundingClientRect();
    const dx = (toRect.left + toRect.width/2) - (fromRect.left + fromRect.width/2);
    const dy = (toRect.top  + toRect.height/2) - (fromRect.top  + fromRect.height/2);
    clone.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px) scale(0.4) rotate(' + (dx > 0 ? 30 : -30) + 'deg)';
    clone.style.opacity = '0.1';

    setTimeout(() => {
      clone.remove();
      if (onArrive) onArrive();
    }, 680);
  };

  const bagTargetRect = () => {
    // Fly target = the small moss "hint" dot sitting at the backpack
    // edge, so arriving skills visibly converge on the interaction cue.
    const target = charHint || charBackpack;
    return target ? target.getBoundingClientRect() : null;
  };
  const eventTargetRect = (ev) => {
    const icon = ev.querySelector('.event-icon') || ev.querySelector('.event-mark');
    return icon ? icon.getBoundingClientRect() : ev.getBoundingClientRect();
  };

  const bump = (() => {
    let t = null;
    return () => {
      if (!character) return;
      character.classList.add('is-collecting');
      clearTimeout(t);
      t = setTimeout(() => character.classList.remove('is-collecting'), 480);
    };
  })();

  /* RPG-style "+N SKILL" popup floating above the character's head. */
  const spawnSkillPopup = (count) => {
    if (!character || reduceMotion || !count) return;
    const rect = character.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'skill-popup';
    el.textContent = '+' + count + ' SKILL' + (count > 1 ? 'S' : '');
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top - 8) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  };

  /* Removing skills — fly from bag to event */
  const removeEventSkills = (ev, animate) => {
    const ids = eventSkills.get(ev);
    if (!ids) return;
    const evRect = eventTargetRect(ev);
    for (const id of ids) {
      const el = skillEls.get(id);
      if (!el || el.classList.contains('is-removed')) continue;
      if (animate && !reduceMotion) {
        const srcRect = el.getBoundingClientRect();
        // If panel not visible, skip the chip flight and use the bag as the source
        const from = (srcRect.width > 0 && srcRect.height > 0) ? srcRect : (bagTargetRect() || srcRect);
        el.classList.add('is-removed');
        flyElement(from, evRect, SKILLS[id].icon, SKILLS[id].name);
      } else {
        el.classList.add('is-removed');
      }
    }
    updateCount();
  };

  /* Adding skills back — fly from event to bag */
  const addEventSkills = (ev, animate) => {
    const ids = eventSkills.get(ev);
    if (!ids) return;
    const evRect = eventTargetRect(ev);
    const bag = bagTargetRect();
    let pendingAdds = 0;
    let batchIdx = 0;
    for (const id of ids) {
      const el = skillEls.get(id);
      if (!el || !el.classList.contains('is-removed')) continue;
      pendingAdds++;
      if (animate && !reduceMotion && bag) {
        const bi = batchIdx++;
        flyElement(evRect, bag, SKILLS[id].icon, SKILLS[id].name, () => {
          el.classList.remove('is-removed');
          el.classList.remove('just-added');
          el.style.setProperty('--batch-i', bi);
          void el.offsetWidth;
          el.classList.add('just-added');
          // Auto-remove the class after the pop completes so the next
          // arrival can re-trigger it.
          el.addEventListener('animationend', function onEnd() {
            el.classList.remove('just-added');
            el.removeEventListener('animationend', onEnd);
          });
          bump();
          updateCount();
        });
      } else {
        el.classList.remove('is-removed');
      }
    }
    if (animate && pendingAdds > 0) {
      setTimeout(() => spawnSkillPopup(pendingAdds), 520);
    }
    if (!animate || reduceMotion) updateCount();
  };

  /* ---------- 12. Bidirectional collection ----------
     Hysteresis buffer around viewport midline so tiny scroll jitter
     doesn't toggle states. */
  const HY = 36;

  const babySource = document.querySelector('[data-baby-source]');

  /* Baby hobbies are the inverse of normal skills: NOT in the bag at
     the top of the page, they appear when the user scrolls past the
     school gate (Minerva, 2008) into baby era, and vanish again when
     scrolled back up. Each skill has its own "pending" flag so rapid
     scroll doesn't spawn multiple overlapping fly animations for the
     same icon (fixes the "skill spam" bug at the Born event). */
  const babyHobbyIds = Object.entries(SKILLS)
    .filter(([, s]) => s.baby)
    .map(([id]) => id);
  const babyPending = new Set();   // ids with an in-flight fly animation

  const updateBabyHobbies = (animate) => {
    if (!babySource) return;
    const mid = window.innerHeight * 0.5;
    // Gate = midpoint between Born and Minerva (same point the
    // character's baby→teen flip uses), so baby hobbies vanish at
    // exactly the moment the teen variant appears.
    let ec;
    if (schoolGateEl) {
      const bR = babySource.getBoundingClientRect();
      const sR = schoolGateEl.getBoundingClientRect();
      ec = ((bR.top + bR.height * 0.5) + (sR.top + sR.height * 0.5)) * 0.5;
    } else {
      const bR = babySource.getBoundingClientRect();
      ec = bR.top + bR.height * 0.5;
    }
    const gatePassed = ec < mid - HY;   // we're past the gate going "back in time"

    for (const id of babyHobbyIds) {
      const el = skillEls.get(id);
      if (!el) continue;
      if (babyPending.has(id)) continue;         // avoid double-fires
      const isInBag = !el.classList.contains('is-removed');

      if (gatePassed && !isInBag) {
        // Enter the bag — fly from Born's icon up to the hint dot.
        if (animate && !reduceMotion) {
          const bag = bagTargetRect();
          const srcRect = eventTargetRect(babySource);
          if (bag) {
            babyPending.add(id);
            flyElement(srcRect, bag, SKILLS[id].icon, SKILLS[id].name, () => {
              el.classList.remove('is-removed');
              el.classList.remove('just-added');
              el.style.setProperty('--batch-i', 0);
              void el.offsetWidth;
              el.classList.add('just-added');
              babyPending.delete(id);
              bump();
              updateCount();
            });
            continue;
          }
        }
        el.classList.remove('is-removed');
      } else if (!gatePassed && isInBag) {
        // Leave the bag — fly down to Born's icon.
        if (animate && !reduceMotion) {
          const srcRect = el.getBoundingClientRect();
          const evRect  = eventTargetRect(babySource);
          if (srcRect.width > 0) {
            el.classList.add('is-removed');
            babyPending.add(id);
            flyElement(srcRect, evRect, SKILLS[id].icon, SKILLS[id].name, () => {
              babyPending.delete(id);
            });
            continue;
          }
        }
        el.classList.add('is-removed');
      }
    }
    updateCount();
  };

  const updateCollection = (initial) => {
    const mid = window.innerHeight * 0.5;
    for (const [ev] of eventSkills) {
      const rect = ev.getBoundingClientRect();
      const ec = rect.top + rect.height * 0.5;
      const above = ec < mid - HY;
      const below = ec > mid + HY;
      if (above && !removed.has(ev)) {
        removed.add(ev);
        removeEventSkills(ev, !initial);
      } else if (below && removed.has(ev)) {
        removed.delete(ev);
        addEventSkills(ev, !initial);
      }
    }
    updateBabyHobbies(!initial);
  };

  /* ---------- 13. rAF-throttled scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateIntroScale();
      updateCharacter();
      applyScroll();   // set per-event --s *before* measuring mark positions
      buildSpine();
      updateCollection(false);
      ticking = false;
    });
  };

  /* ---------- 15. Boot ---------- */
  const onResize = () => {
    layoutBranches();
    measureMarkOffsets();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Initial populate: count reflects "all skills in backpack"
  updateCount();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layoutBranches();
      measureMarkOffsets();
      updateCollection(true); // silent seed based on current scroll
      onScroll();
    });
  } else {
    updateCollection(true);
  }

  window.addEventListener('load', onResize);

  layoutBranches();
  measureMarkOffsets();
  onScroll();

  /* ---------- Footer year auto-updates ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Intro cinematic ----------
     Four phases on first load:
       A. 1986 text alone on a cream curtain         (~1.2 s)
       B. Year fades out, baby character fades in    (~0.9 s)
       C. Curtain fades away, baby scales 2.8x → 1x  (~1.0 s)
       D. Auto-scroll from bottom → top              (~10 s, easeInOut)
     Any wheel / touch / keydown / mousedown in phase D cancels the
     auto-scroll and hands control back to the user. Reduced motion
     skips the whole thing.
  ------------------------------------------------- */
  const introCurtain = document.getElementById('intro-sequence');
  const introYearBig = document.getElementById('intro-year-big');
  const sleep        = (ms) => new Promise(r => setTimeout(r, ms));

  const setScroll = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });

  const startAutoScroll = () => {
    const startY = window.scrollY;
    const endY   = 0;
    // Hide the intro bubble immediately so it can't flicker in during
    // the scroll (we manually reveal it when the scroll finishes).
    introBubble?.classList.add('is-intro-held');
    if (startY <= endY + 4) {
      revealIntroBubble();
      return;
    }
    const duration = 12000;
    const start = performance.now();
    let cancelled = false;

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      cleanup();
      revealIntroBubble();
    };
    const cleanup = () => {
      window.removeEventListener('wheel',      cancel, { passive: true });
      window.removeEventListener('touchstart', cancel, { passive: true });
      window.removeEventListener('keydown',    cancel);
      window.removeEventListener('mousedown',  cancel);
    };
    window.addEventListener('wheel',      cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown',    cancel);
    window.addEventListener('mousedown',  cancel);

    const ease = (t) => (t < 0.5) ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;

    const tick = (now) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / duration);
      const p = ease(t);
      setScroll(Math.round(startY + (endY - startY) * p));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        cleanup();
        revealIntroBubble();
      }
    };
    requestAnimationFrame(tick);
  };

  /* Unlocks the intro speech bubble with a little pop after the
     auto-scroll lands at the top (or after the user cancels it). */
  const revealIntroBubble = () => {
    if (!introBubble) return;
    introBubble.classList.remove('is-intro-held');
    introBubble.classList.add('is-intro-revealed');
    // Scroll-driven opacity can keep it visible from here on.
    onScroll();
  };

  const playIntro = async () => {
    if (!introCurtain) return;
    if (reduceMotion) {
      introCurtain.remove();
      return;
    }

    document.body.classList.add('playing-intro');

    // Kill any browser scroll restoration so the page actually starts
    // at the bottom on refresh.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // Instant jump to the bottom so era detection places the baby.
    // Wait one frame so layout is measured before we scroll.
    await new Promise(r => requestAnimationFrame(r));
    setScroll(document.documentElement.scrollHeight);
    // Re-run scroll-driven updates immediately.
    onScroll();

    // Phase A: year alone on the curtain.
    await sleep(1200);

    // Phase B: year fades out, character fades in (big, baby variant).
    introYearBig?.classList.add('is-gone');
    document.body.classList.add('intro-phase-show');
    await sleep(900);

    // Phase C: curtain fades away, character scales 2.8 → 1.
    introCurtain.classList.add('is-gone');
    document.body.classList.add('intro-phase-zoom');
    await sleep(1000);

    // Hand off: remove all intro classes so normal scroll-driven
    // scale / opacity kick in. Remove the curtain from the DOM.
    document.body.classList.remove('playing-intro', 'intro-phase-show', 'intro-phase-zoom');
    introCurtain.remove();

    // Let the scroll handler reassert scroll-linked character scale,
    // then kick the auto-scroll immediately (no pause).
    onScroll();
    startAutoScroll();
  };

  // Kick off after layout settles. document.fonts.ready also gates the
  // measurement calls above, but the intro curtain covers anything
  // that isn't measured yet.
  requestAnimationFrame(() => { playIntro(); });
})();
