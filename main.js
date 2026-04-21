/* ================================================================
   Victor Künzig — timeline one-pager
   Central orb is fixed at viewport center; timeline scrolls behind
   it. Orb morphs its icons as major career events pass through.
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
  const majorEvents = events.filter(e => e.dataset.state);
  const orb = document.getElementById('orb');
  const orbIcons = orb ? Array.from(orb.querySelectorAll('.orb-icon')) : [];
  const cta = document.querySelector('.cta-float');

  /* Roles that tint the orb moss-green when active */
  const MOSS_ROLES = new Set(['camera', 'slate']);

  /* ---------- 4. Timeline travel ----------
     The moss segment above the orb is "life already traced".
     In pixel space relative to the timeline top, the orb sits at
     viewport midpoint, so the segment height is just (midY - timelineTop).
  ------------------------------------------- */
  const updateTravel = () => {
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.5;
    const trail = Math.max(0, Math.min(rect.height, mid - rect.top));
    timeline.style.setProperty('--travel', trail + 'px');
  };

  /* ---------- 5. Orb visibility + state ---------- */
  let lastState = null;

  const setOrbState = (state) => {
    if (!orb) return;
    const roles = state ? state.split(/\s+/).filter(Boolean) : [];

    // icon actives
    for (const icon of orbIcons) {
      icon.classList.toggle('is-active', roles.includes(icon.dataset.role));
    }

    // pill width by active count
    orb.classList.toggle('has-state', roles.length > 0);
    orb.classList.toggle('has-two',   roles.length === 2);
    orb.classList.toggle('has-three', roles.length >= 3);

    // moss tint when moss roles active
    const hasMoss = roles.some(r => MOSS_ROLES.has(r));
    orb.classList.toggle('has-moss', hasMoss);

    // brief morph pulse on change
    if (!reduceMotion) {
      orb.classList.remove('is-morphing');
      // force reflow so the animation re-plays
      void orb.offsetWidth;
      orb.classList.add('is-morphing');
    }
  };

  const updateOrb = () => {
    if (!orb || !timeline) return;
    const rect = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.5;

    // Visibility: orb appears once the timeline region is under the midline
    // and hides again once we've scrolled past it.
    const inside = rect.top < mid && rect.bottom > mid - 20;
    orb.classList.toggle('is-visible', inside);

    if (!inside) return;

    // Timeline is reverse-chronological (newest at top). The era at the
    // viewport midline = the first event still below mid, i.e. the next
    // "older-but-active" role that hasn't been scrolled past yet.
    let state = null;
    for (const ev of majorEvents) {
      const r = ev.getBoundingClientRect();
      if (r.top > mid) { state = ev.dataset.state; break; }
    }

    if (state !== lastState) {
      lastState = state;
      setOrbState(state);
    }
  };

  /* ---------- 6. Event parallax ---------- */
  const applyParallax = () => {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    const vc = vh * 0.5;

    for (const el of events) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      const speed = parseFloat(el.dataset.parallax) || 0;
      const ec = rect.top + rect.height * 0.5;
      const delta = (ec - vc) * speed;
      el.style.setProperty('--py', `${-delta.toFixed(1)}px`);
    }
  };

  /* ---------- 7. Floating CTA ---------- */
  const updateCta = () => {
    if (!cta) return;
    cta.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.3);
  };

  /* ---------- 8. rAF-throttled scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateTravel();
      updateOrb();
      applyParallax();
      updateCta();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
