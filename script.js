(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');
  const mobile = window.matchMedia('(max-width: 600px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeMenu(returnFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menuButton.querySelector('.menu-label').textContent = 'Menu';
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    menuButton.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !event.target.closest('.site-header')) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());

  // Keep the nav useful without making page visibility depend on JavaScript.
  if ('IntersectionObserver' in window) {
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }

  // Entry effects never hide the underlying content or replace its paper rotations.
  const activeAnimations = new Set();
  const revealed = new WeakSet();
  const revealSettings = new Map();
  const chapters = [...document.querySelectorAll('.hero, .section')];
  let printing = window.matchMedia('print').matches;

  function reveal(element, { delay = 0, distance = 24, duration = 760 } = {}) {
    if (revealed.has(element)) return;
    revealed.add(element);
    if (reducedMotion.matches || printing || typeof element.animate !== 'function') return;

    const restingOpacity = window.getComputedStyle(element).opacity;
    const animation = element.animate([
      { opacity: 0, translate: `0 ${distance}px` },
      { opacity: restingOpacity, translate: '0 0' }
    ], {
      duration,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'backwards'
    });
    activeAnimations.add(animation);
    const release = () => activeAnimations.delete(animation);
    animation.finished.then(release, release);
  }

  function addRevealGroup(selector, { stagger = 0, ...settings } = {}) {
    document.querySelectorAll(selector).forEach((element, index) => {
      revealSettings.set(element, {
        ...settings,
        delay: Math.min(index * stagger, 240)
      });
    });
  }

  addRevealGroup('.section-label', { distance: 14 });
  addRevealGroup('.about h2, .about-copy p, .about-link', { stagger: 65 });
  addRevealGroup('.desk-note', { distance: 32, duration: 920 });
  addRevealGroup('.toolkit > p', { distance: 16 });
  addRevealGroup('.toolkit-items span', { stagger: 45, distance: 12, duration: 600 });
  addRevealGroup('.section-heading, .work-footer', { distance: 20 });
  addRevealGroup('.project-card', { stagger: 120, distance: 34, duration: 900 });
  addRevealGroup('.notes-intro > :not(.scribble-note)', { stagger: 60, distance: 18 });
  addRevealGroup('.scribble-note', { stagger: 90, distance: 18, duration: 850 });
  addRevealGroup('.research-note', { stagger: 70, distance: 22 });
  addRevealGroup('.motto-kicker, .motto-quote', { stagger: 110, distance: 26, duration: 950 });
  addRevealGroup('.site-footer > *', { stagger: 50, distance: 12, duration: 650 });

  const hero = document.querySelector('.hero');
  hero?.classList.add('is-visible');

  function revealHeroElement(element, settings) {
    const bounds = element.getBoundingClientRect();
    // Keep below-the-fold mobile content and restored scroll positions in view.
    if (bounds.bottom > 0 && bounds.top < window.innerHeight) reveal(element, settings);
    else revealSettings.set(element, { ...settings, delay: 0 });
  }

  document.querySelectorAll('.hero-copy > *').forEach((element, index) => {
    revealHeroElement(element, { delay: 60 + index * 85, distance: 22, duration: 850 });
  });
  document.querySelectorAll('.portrait-composition, .scroll-note').forEach((element, index) => {
    revealHeroElement(element, { delay: 220 + index * 90, distance: 26, duration: 1000 });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target.matches('.hero, .section')) entry.target.classList.add('is-visible');
        if (revealSettings.has(entry.target)) reveal(entry.target, revealSettings.get(entry.target));
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    chapters.forEach(chapter => revealObserver.observe(chapter));
    revealSettings.forEach((settings, element) => revealObserver.observe(element));
  } else {
    // Older browsers retain the complete page and its decorative line work.
    chapters.forEach(chapter => chapter.classList.add('is-visible'));
  }

  function cancelReveals() {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) cancelReveals();
  });
  window.addEventListener('beforeprint', () => {
    printing = true;
    cancelReveals();
  });
  window.addEventListener('afterprint', () => {
    printing = false;
  });

  // Schedule at most one progress update per frame; no animation loop runs at rest.
  let progressFrame = null;
  function updateReadingProgress() {
    progressFrame = null;
    const root = document.documentElement;
    const distance = root.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--reading-progress', String(progress));
  }
  function requestProgressUpdate() {
    if (progressFrame === null) progressFrame = window.requestAnimationFrame(updateReadingProgress);
  }
  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('load', requestProgressUpdate, { once: true });
  window.addEventListener('pageshow', requestProgressUpdate);
  // Opening a notebook page changes the document height without a viewport resize.
  document.querySelectorAll('.research-note').forEach(note => {
    note.addEventListener('toggle', requestProgressUpdate);
  });
  document.fonts?.ready.then(requestProgressUpdate);
  updateReadingProgress();

  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
