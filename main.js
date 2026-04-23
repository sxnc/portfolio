/* ================================================================
   Victor Künzig — timeline one-pager

   · Walking character fixed at viewport centre. Age morphs at the
     midpoints of 2008 (baby ↔ teen) and 2018 (teen ↔ adult).
   · Per-event scroll progress drives layered scroll animations.
   · Bending spine — SVG path rebuilt per scroll frame that leans
     toward whichever event is closest to viewport centre.
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

  document.querySelectorAll('.event').forEach(el => revealIO.observe(el));

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
  const charHint    = character ? character.querySelector('.char-hint-skills') : null;
  const charHintCreative  = character ? character.querySelector('.char-hint-creative')  : null;
  const charHintTechnical = character ? character.querySelector('.char-hint-technical') : null;
  const charBioCreative   = character ? character.querySelector('.char-bio-creative')   : null;
  const charBioTechnical  = character ? character.querySelector('.char-bio-technical')  : null;
  const skillsGrid  = document.getElementById('char-skills-grid');
  const skillsCount = document.getElementById('char-count');
  const tabs        = Array.from(document.querySelectorAll('.char-skills-tabs button'));

  const branchBottomEl = document.querySelector('[data-branch-anchor="bottom"]'); // 2018 Summer Love — teen ↔ adult threshold (upper neighbour)
  const teenFloorEl    = document.querySelector('[data-teen-floor]');             // 2016 HSO       — teen ↔ adult threshold (lower neighbour)
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
    'photography':      { name: 'Photography',      cat: 'hobby',  icon: 'camera' },
    'hiking':           { name: 'Hiking',           cat: 'hobby',  icon: 'tracking' },
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

  /* Reserve grid height equal to the tallest currently-visible category,
     so the panel's vertical centre-of-mass doesn't jump when the user
     flips between tabs with different item counts. Must match
     grid-auto-rows / gap on .char-skills-grid exactly. */
  const TILE_H = 68;
  const TILE_GAP = 5;
  const updateGridReserve = () => {
    if (!skillsGrid) return;
    const counts = countByCat();
    let maxCount = 0;
    for (const btn of tabs) {
      const cat = btn.dataset.cat;
      const threshold = cat === 'hobby' ? 1 : 2;
      if (counts[cat] >= threshold && counts[cat] > maxCount) maxCount = counts[cat];
    }
    if (maxCount === 0) { skillsGrid.style.minHeight = ''; return; }
    const rows = Math.ceil(maxCount / 3);
    skillsGrid.style.minHeight = (rows * TILE_H + (rows - 1) * TILE_GAP) + 'px';
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
    updateGridReserve();
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

  /* Every panel that can "hold the pointer open" — any of these being
     hovered during the close-grace cancels the close. */
  const hoverableRefs = [charPanel, charHint, charHintCreative, charHintTechnical, charBioCreative, charBioTechnical];

  /* Mutually exclusive panel state. Only one panel is open at a time;
     opening one drops the others. `variant` is 'skills' | 'creative'
     | 'technical'. */
  const PANEL_CLASSES = {
    skills:    'is-open',
    creative:  'is-open-bio-creative',
    technical: 'is-open-bio-technical',
  };
  const syncPanelsOpenClass = () => {
    if (!character) return;
    const any = Object.values(PANEL_CLASSES).some(cls => character.classList.contains(cls));
    document.body.classList.toggle('panels-open', any);
  };
  const closeAllPanels = () => {
    Object.values(PANEL_CLASSES).forEach(cls => character?.classList.remove(cls));
    syncPanelsOpenClass();
  };

  const openPanel = () => openVariant('skills');

  const openVariant = (variant) => {
    clearTimeout(hideTimer);
    if (!character) return;
    const cls = PANEL_CLASSES[variant];
    if (!cls) return;
    if (character.classList.contains(cls)) return;
    // No interactions in baby era.
    if (character.classList.contains('is-baby')) return;

    if (variant === 'skills') {
      // Refresh per-category indices so the cascade follows the
      // current visible grid order, strip lingering just-added
      // classes, and force an animation restart.
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
    }

    closeAllPanels();
    character.classList.add(cls);
    syncPanelsOpenClass();

    if (variant === 'skills') {
      // Reset to the first visible tab on every open.
      if (tabs.length) {
        tabs.forEach(b => b.classList.toggle('is-active', b === tabs[0]));
        if (skillsGrid) skillsGrid.dataset.activeCat = tabs[0].dataset.cat;
      }
      updateTabVisibility();
    }
  };
  const scheduleClose = () => {
    clearTimeout(hideTimer);
    const base = 260;
    const grace = Math.max(0, extraGraceUntil - Date.now());
    hideTimer = setTimeout(() => {
      // If the pointer actually re-entered any interactive surface
      // during the grace window, bail out of closing.
      for (const el of hoverableRefs) {
        if (el && el.matches(':hover')) return;
      }
      // On the timeline the character body itself holds the panel
      // open — the pointer can wander anywhere on the walking figure.
      // In the hero stage (intro-mode) the three head/backpack dots
      // live on the character too, but we want ONLY the dots and
      // their opened containers to keep things open, so the pointer
      // sitting on the character's cheek shouldn't lock a panel in.
      const inHero = character && character.classList.contains('intro-mode');
      if (!inHero && character && character.matches(':hover')) return;
      closeAllPanels();
    }, base + grace);
  };

  const bindHover = (el, variant) => {
    if (!el) return;
    el.addEventListener('mouseenter', () => openVariant(variant));
    el.addEventListener('mouseleave', scheduleClose);
    // Focus-open for keyboard users.
    el.addEventListener('focus', () => openVariant(variant));
    el.addEventListener('blur',  scheduleClose);
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const cls = PANEL_CLASSES[variant];
      if (character.classList.contains(cls)) {
        closeAllPanels();
      } else {
        openVariant(variant);
      }
    });
  };

  if (character && charPanel) {
    // Hovering the character body opens skills only on the timeline
    // (intro-mode off). In the hero stage we want the hint dot to be
    // the sole trigger so the character itself stays out of the way
    // of the three dots on its head.
    const onCharEnter = () => {
      if (character.classList.contains('intro-mode')) return;
      openVariant('skills');
    };
    character.addEventListener('mouseenter', onCharEnter);
    character.addEventListener('mouseleave', scheduleClose);
    charPanel.addEventListener('mouseenter', () => openVariant('skills'));
    charPanel.addEventListener('mouseleave', scheduleClose);
    character.addEventListener('focus', onCharEnter);
    character.addEventListener('blur',  scheduleClose);

    // Touch affordance — tapping the character body anywhere on the
    // timeline toggles the skills panel. Ignored if the tap started
    // on a hint dot, panel, bio card, or the CTA mailto link, since
    // those have their own handlers. Only active outside intro-mode
    // so the hero stage keeps its three-dot interaction model.
    character.addEventListener('click', (e) => {
      if (character.classList.contains('intro-mode')) return;
      if (e.target.closest('.char-hint, .char-skills, .char-bio, .char-cta')) return;
      if (character.classList.contains('is-open')) {
        closeAllPanels();
      } else {
        openVariant('skills');
      }
    });
  }
  bindHover(charHint,          'skills');
  bindHover(charHintCreative,  'creative');
  bindHover(charHintTechnical, 'technical');

  // Tap-outside-to-close — on touch devices there's no "leave the
  // panel" gesture, so any tap on the page that isn't inside a panel,
  // dot, CTA, or character shuts everything. Desktop pointer users
  // already close via hover-out; this is harmless for them.
  document.addEventListener('pointerdown', (e) => {
    if (!character) return;
    if (e.target.closest('.char-hint, .char-skills, .char-bio, .char-cta, .character')) return;
    closeAllPanels();
  }, { passive: true });

  // The bio cards themselves keep the panel open while the pointer is
  // over them (same contract as the skills panel).
  if (charBioCreative) {
    charBioCreative.addEventListener('mouseenter', () => openVariant('creative'));
    charBioCreative.addEventListener('mouseleave', scheduleClose);
  }
  if (charBioTechnical) {
    charBioTechnical.addEventListener('mouseenter', () => openVariant('technical'));
    charBioTechnical.addEventListener('mouseleave', scheduleClose);
  }

  /* ---------- 7. Bending timeline spine ----------
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
  const DIR_EASE   = 0.2;  // per-frame EMA factor on bulge direction (smaller = gentler)
  const BEND_EASE  = 0.28; // per-frame EMA on the final bend offset — second-stage smoothing
  const DIR_REACH  = 1.0;  // direction sampling window, as fraction of vh (wider = smoother)
  const TOP_LOCK   = 8;    // spine must terminate at x=cx at this y (where the "Today" dot sits)
  const narrowMQ   = window.matchMedia('(max-width: 900px)');

  // Smoothed bulge direction across frames — gives a gentle ease when
  // the weighted event side changes sign (crossing between opposite-side
  // events), rather than snapping through zero.
  // A second-stage EMA on the final bend offset (`smoothedBend`) filters
  // out any residual high-frequency jitter left over after smoothedDir,
  // which was the main source of visible wobble on fast scroll.
  let smoothedDir  = 0;
  let smoothedBend = 0;

  /* Split every event title into per-character <span> wrappers so the
     shine animation can stagger letter-by-letter. Runs once on boot. */
  const splitTitlesIntoChars = () => {
    for (const ev of events) {
      const title = ev.querySelector('.event-title');
      if (!title || title.dataset.charsSplit === 'done') continue;
      const text = title.textContent;
      title.textContent = '';
      title.style.setProperty('--char-count', text.length);
      // Group characters inside .title-word wrappers so a line wrap
      // never splits a word — the browser may only break at the
      // whitespace tokens emitted between wrappers.
      let idx = 0;
      const tokens = text.split(/(\s+)/);
      for (const token of tokens) {
        if (token === '') continue;
        if (/^\s+$/.test(token)) {
          title.appendChild(document.createTextNode(token));
          continue;
        }
        const wordEl = document.createElement('span');
        wordEl.className = 'title-word';
        for (const ch of token) {
          const span = document.createElement('span');
          span.className = 'title-char';
          span.style.setProperty('--i', idx++);
          span.textContent = ch;
          wordEl.appendChild(span);
        }
        title.appendChild(wordEl);
      }
      title.dataset.charsSplit = 'done';
    }
  };

  /* Mark alignment via layout-space offsetTop walk.
     offsetTop is unaffected by CSS transforms, so we don't need to
     compensate for the event / card / title / mark translate stack.
     Result: the mark's post-transform rendered centre lands exactly on
     the title's post-transform rendered centre, because both share the
     same event-level translate and the mark's own -16*s matches the
     card+title's combined -16*s.

     Pure layout read — independent of scroll position — so we only
     re-run this on layout-changing events (resize, font-load, boot),
     never inside the per-frame scroll loop. */
  const measureMarkOffsets = () => {
    for (const ev of events) {
      const title = ev.querySelector('.event-title');
      const mark  = ev.querySelector('.event-mark');
      if (!title || !mark) continue;
      let titleY = 0;
      let node = title;
      while (node && node !== ev && ev.contains(node)) {
        titleY += node.offsetTop;
        node = node.offsetParent;
      }
      const titleCenter = titleY + title.offsetHeight * 0.5;
      const markHalf = mark.offsetHeight * 0.5;
      const markAlign = titleCenter - markHalf;
      ev.style.setProperty('--mark-align', markAlign.toFixed(1) + 'px');
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
    // On narrow layouts the spine runs straight down the middle of
    // the timeline column (where the event marks now sit), rather
    // than along a left rail.
    const cx = w / 2;
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
    // A wider reach means more events contribute on any given frame,
    // which smooths out the raw direction signal — on fast scroll this
    // keeps it from spiking as individual events enter/exit a narrow
    // sampling window.
    const reach = vh * DIR_REACH;
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

    // Second-stage EMA: smooth the final bend offset itself. Two
    // cascaded first-order filters act as a cheap second-order filter,
    // which kills the fast-scroll wobble that a single EMA left behind
    // without adding much perceptual lag.
    const rawBend = narrow ? 0 : BEND_MAX * smoothedDir * fade;
    smoothedBend += (rawBend - smoothedBend) * BEND_EASE;
    const bendOffset = smoothedBend;

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

  /* ---------- 8. Character visibility + era ---------- */
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
     zone, and fades the hero heading alongside it. --intro-opacity is
     also mirrored on body so arbitrary hero overlays (e.g. the
     "check out my skills!" arrow) can track it via CSS var. */
  /* Base char size bumped to 121×181, but the hero size should stay
     as before (~213 px wide), so scale down to 213/121 ≈ 1.76. */
  const INTRO_SCALE_MAX = 1.76;
  const introBubble = document.getElementById('char-intro-bubble');
  const introEl    = document.querySelector('.intro');
  const updateIntroScale = () => {
    if (!character) return;
    const vh = window.innerHeight;
    const introEnd = (introEl ? introEl.offsetHeight : vh) - vh * 0.2;
    const p = introEnd > 0 ? Math.min(1, Math.max(0, window.scrollY / introEnd)) : 1;
    const scale = INTRO_SCALE_MAX + (1 - INTRO_SCALE_MAX) * p;
    character.style.setProperty('--char-scale', scale.toFixed(3));
    const inHero = p < 0.55;
    character.classList.toggle('intro-mode', inHero);
    // Body mirror of intro-mode so CSS can gate effects (e.g. the
    // backdrop blur) without a :has() query on the character.
    document.body.classList.toggle('hero-stage', inHero);
    // "Peak" of the hero stage — only the last sliver of the intro
    // zone (near scrollY = 0). This is the gate for the waving
    // animation, which should only play once the user is almost all
    // the way to the top — not across the whole intro fade range.
    const atHeroPeak = p < 0.1;
    character.classList.toggle('is-hero-peak', atHeroPeak);
    const op = Math.max(0, 1 - p * 1.4);
    document.body.style.setProperty('--intro-opacity', op.toFixed(3));
    if (introBubble) {
      introBubble.style.setProperty('--intro-opacity', op.toFixed(3));
      introBubble.classList.toggle('is-hidden', op <= 0.02);
    }
  };

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
    // Keep the character visible a bit past the timeline's end, so the
    // baby variant doesn't pop off-screen the moment the 1986 dot is
    // just above viewport mid.
    const inside = rect.bottom > mid - 160;

    // Once viewport mid scrolls past the point where the character's
    // feet would be below the bottom dot (dot sits at timeline.bottom
    // because of .timeline-start { bottom: -9 }), pull the character
    // upward by the overshoot so its feet rest on the dot.
    // Use offsetHeight (layout box, pre-transform) rather than
    // getBoundingClientRect so the scaled hero-stage doesn't change the
    // anchor math — we always anchor to the character's CSS height.
    const charHalfHeight = character.offsetHeight * 0.5;
    const anchorOffset = Math.min(0, rect.bottom - mid - charHalfHeight);
    character.style.setProperty('--char-anchor-offset', anchorOffset.toFixed(2) + 'px');
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

    // Teen-era ceiling — fires at the MIDPOINT between Summer Love (2018)
    // and HSO Leadership (2016), which is where the 2018 year-divider
    // sits. Mirrors the baby gate, which uses the midpoint between Born
    // and Minerva. Falls back to Summer Love alone if the floor anchor
    // is missing.
    let summerPassed = wasYoung || wasBaby;
    if (branchBottomEl) {
      let sc;
      if (teenFloorEl) {
        const sR = branchBottomEl.getBoundingClientRect();
        const fR = teenFloorEl.getBoundingClientRect();
        const summerY = sR.top + sR.height * 0.5;
        const floorY  = fR.top + fR.height * 0.5;
        sc = (summerY + floorY) * 0.5;
      } else {
        const sR = branchBottomEl.getBoundingClientRect();
        sc = sR.top + sR.height * 0.5;
      }
      if (sc < mid - ERA_HY) summerPassed = true;
      else if (sc > mid + ERA_HY) summerPassed = false;
    }

    const isYoung = summerPassed && !isBaby;
    character.classList.toggle('is-baby',  isBaby);
    character.classList.toggle('is-young', isYoung);
    // Baby has no inventory — force the panel closed if the era
    // change catches it open.
    if (isBaby) {
      closeAllPanels();
    }

    const newLevel = isBaby ? 0 : isYoung ? 1 : 2;
    if (bootedEra && inside && newLevel > prevLevel) {
      spawnLevelUpPopup();
    }
    bootedEra = true;
  };

  /* ---------- 9. Per-event scroll-linked transforms ---------- */
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

  /* ---------- 10. Skill fly animations ---------- */

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

  /* ---------- 11. Bidirectional collection ----------
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

  /* ---------- 12. rAF-throttled scroll loop ----------
     Mark offsets are NOT measured here — they depend only on layout,
     not scroll, so we re-measure in onResize() / on font-load instead. */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateIntroScale();
      updateCharacter();
      applyScroll();
      buildSpine();
      updateCollection(false);
      ticking = false;
    });
  };

  /* ---------- 13. Boot ---------- */
  const onResize = () => {
    measureMarkOffsets();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Initial populate: count reflects "all skills in backpack"
  updateCount();

  // Split each event title into per-character spans so the shine
  // animation can stagger letter-by-letter. Runs once, up front.
  splitTitlesIntoChars();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureMarkOffsets();
      updateCollection(true); // silent seed based on current scroll
      onScroll();
    });
  } else {
    updateCollection(true);
  }

  window.addEventListener('load', onResize);

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
     auto-scroll lands at the top (or after the user cancels it).
     About half a second later we also set body.hero-revealed, which
     is the gate the hero hint dots + arrow labels use — so the
     greeting lands first, then the dots/arrows fade in after it. */
  const revealIntroBubble = () => {
    if (!introBubble) return;
    introBubble.classList.remove('is-intro-held');
    introBubble.classList.add('is-intro-revealed');
    onScroll();
    setTimeout(() => document.body.classList.add('hero-revealed'), 520);
  };

  const playIntro = async () => {
    if (!introCurtain) return;
    // Opt-out paths: #skip in the URL, or the user's reduced-motion
    // preference. Either way, dismantle the curtain and leave the
    // intro bubble in its normal scroll-driven state.
    const skipViaHash = /^#skip\b/i.test(window.location.hash || '');
    if (reduceMotion || skipViaHash) {
      introCurtain.remove();
      introBubble?.classList.remove('is-intro-held');
      // No cinematic to wait for — reveal the hints now.
      document.body.classList.add('hero-revealed');
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
