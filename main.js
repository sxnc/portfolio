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

  /* ---------- 2. Counters ---------- */
  const counterIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      const target = parseFloat(el.dataset.countTo);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    }
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count-to]').forEach(el => counterIO.observe(el));

  /* ---------- 3. Refs ---------- */
  const timeline = document.getElementById('timeline');
  const events = Array.from(document.querySelectorAll('.event'));

  const character   = document.getElementById('character');
  const charPanel   = character ? character.querySelector('.char-skills') : null;
  const charBackpack = character ? character.querySelector('.char-backpack') : null;
  const skillsGrid  = document.getElementById('char-skills-grid');
  const skillsCount = document.getElementById('char-count');
  const tabs        = Array.from(document.querySelectorAll('.char-skills-tabs button'));

  const branchTopEl    = document.querySelector('[data-branch-anchor="top"]');
  const branchBottomEl = document.querySelector('[data-branch-anchor="bottom"]'); // 2018 Summer Love — also age threshold

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
  };

  /* Build per-event skill lists from data-skills="id id id" attributes */
  const eventSkills = new Map(); // event element → [skill ids]
  for (const ev of events) {
    const raw = ev.dataset.skills;
    if (!raw) continue;
    const ids = raw.split(/\s+/).filter(id => id && SKILLS[id]);
    if (ids.length) eventSkills.set(ev, ids);
  }

  /* Build the grid: every skill rendered once; filter by category via CSS */
  const skillEls = new Map(); // skill id → DOM element
  if (skillsGrid) {
    for (const [id, s] of Object.entries(SKILLS)) {
      const el = document.createElement('div');
      el.className = 'char-skill';
      el.dataset.cat = s.cat;
      el.dataset.skillId = id;
      el.innerHTML =
        '<span class="char-skill-icon"><i class="icofont-' + s.icon + '" aria-hidden="true"></i></span>' +
        '<span class="char-skill-label">' + s.name + '</span>';
      skillsGrid.appendChild(el);
      skillEls.set(id, el);
    }
  }

  /* Tracks which events' skills are currently REMOVED from the backpack.
     State starts empty (= bag is full). Events near the bottom of the page
     won't affect initial state because they're all below viewport mid. */
  const removed = new Set();

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
  };

  /* ---------- 5. Tab switching ---------- */
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.toggle('is-active', b === btn));
      if (skillsGrid) skillsGrid.dataset.activeCat = btn.dataset.cat;
    });
  });

  /* ---------- 6. Hover persistence ----------
     Panel stays open while pointer is over character OR panel. A short
     hide delay bridges the gap between them when the pointer transitions
     from one to the other. */
  let hideTimer = null;
  const openPanel  = () => { clearTimeout(hideTimer); character?.classList.add('is-open'); };
  const scheduleClose = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => character?.classList.remove('is-open'), 260);
  };
  if (character && charPanel) {
    character.addEventListener('mouseenter', openPanel);
    character.addEventListener('mouseleave', scheduleClose);
    charPanel.addEventListener('mouseenter', openPanel);
    charPanel.addEventListener('mouseleave', scheduleClose);
    character.addEventListener('focus', openPanel);
    character.addEventListener('blur',  scheduleClose);
  }

  /* ---------- 7. Branch layout ---------- */
  const FORK_H = 80;
  const GAP = 12;
  const layoutBranches = () => {
    if (!timeline || !branchTopEl || !branchBottomEl) return;
    if (window.matchMedia('(max-width: 900px)').matches) {
      timeline.classList.remove('has-branch');
      return;
    }
    const tRect = timeline.getBoundingClientRect();
    const topRect = branchTopEl.getBoundingClientRect();
    const bottomRect = branchBottomEl.getBoundingClientRect();
    const topY    = (topRect.bottom - tRect.top) + GAP;
    const bottomY = (bottomRect.top - tRect.top) - GAP;
    const span = bottomY - topY;
    if (span < FORK_H * 2 + 40) { timeline.classList.remove('has-branch'); return; }
    timeline.style.setProperty('--fork-top-y',    topY + 'px');
    timeline.style.setProperty('--fork-bottom-y', (bottomY - FORK_H) + 'px');
    timeline.style.setProperty('--video-line-top',    (topY + FORK_H) + 'px');
    timeline.style.setProperty('--video-line-height', (span - FORK_H * 2) + 'px');
    timeline.classList.add('has-branch');
  };

  /* ---------- 8. Timeline travel ---------- */
  const updateTravel = () => {
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.5;
    const trail = Math.max(0, Math.min(rect.height, mid - rect.top));
    timeline.style.setProperty('--travel', trail + 'px');
  };

  /* ---------- 9. Character visibility + era ---------- */
  const updateCharacter = () => {
    if (!character || !timeline) return;
    const rect = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.5;
    const inside = rect.top < mid && rect.bottom > mid - 20;
    character.classList.toggle('is-visible', inside);
    if (branchBottomEl) {
      const bb = branchBottomEl.getBoundingClientRect();
      const bc = bb.top + bb.height * 0.5;
      character.classList.toggle('is-young', bc < mid);
    }
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
    if (!charBackpack) return null;
    return charBackpack.getBoundingClientRect();
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
    for (const id of ids) {
      const el = skillEls.get(id);
      if (!el || !el.classList.contains('is-removed')) continue;
      pendingAdds++;
      if (animate && !reduceMotion && bag) {
        flyElement(evRect, bag, SKILLS[id].icon, SKILLS[id].name, () => {
          el.classList.remove('is-removed');
          el.classList.remove('just-added');
          void el.offsetWidth;
          el.classList.add('just-added');
          bump();
          updateCount();
        });
      } else {
        el.classList.remove('is-removed');
      }
    }
    if (animate && pendingAdds > 0) {
      // Let the chips start flying, then show the aggregate RPG popup
      // roughly as they're arriving at the backpack.
      setTimeout(() => spawnSkillPopup(pendingAdds), 520);
    }
    if (!animate || reduceMotion) updateCount();
  };

  /* ---------- 12. Bidirectional collection ----------
     Hysteresis buffer around viewport midline so tiny scroll jitter
     doesn't toggle states. */
  const HY = 36;
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
  };

  /* ---------- 13. rAF-throttled scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateTravel();
      updateCharacter();
      applyScroll();
      updateCollection(false);
      ticking = false;
    });
  };

  /* ---------- 15. Boot ---------- */
  const onResize = () => {
    layoutBranches();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Initial populate: count reflects "all skills in backpack"
  updateCount();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layoutBranches();
      updateCollection(true); // silent seed based on current scroll
      onScroll();
    });
  } else {
    updateCollection(true);
  }

  window.addEventListener('load', onResize);

  layoutBranches();
  onScroll();
})();
