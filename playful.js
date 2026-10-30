(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const printMedia = window.matchMedia('print');
  let printing = printMedia.matches;
  const particles = new Map();
  const noteAnimations = new Set();
  let hintTimer;

  const portraitButton = document.querySelector('.portrait-trigger');
  const portraitLayer = document.querySelector('.portrait-sparks');
  const portraitHint = document.querySelector('.portrait-hint');
  const originalHint = portraitHint?.textContent || 'psst… tap the photo ✳';

  function motionAllowed() {
    return !reducedMotion.matches && !printing;
  }

  function clearParticles() {
    particles.forEach((animation, particle) => {
      animation.cancel();
      particle.remove();
    });
    particles.clear();
  }

  function cancelNoteAnimations() {
    noteAnimations.forEach(animation => animation.cancel());
    noteAnimations.clear();
  }

  function animateNote(element, keyframes, options) {
    if (!element || typeof element.animate !== 'function') return;
    const animation = element.animate(keyframes, options);
    noteAnimations.add(animation);
    const release = () => noteAnimations.delete(animation);
    animation.finished.then(release, release);
  }

  function resetHint() {
    window.clearTimeout(hintTimer);
    if (portraitHint) portraitHint.textContent = originalHint;
  }

  function burstStars(event) {
    // A new burst replaces the previous one, so even rapid taps create at most eight stars.
    clearParticles();
    if (!motionAllowed() || !portraitLayer || typeof portraitLayer.animate !== 'function') return;

    const bounds = portraitLayer.getBoundingClientRect();
    const width = portraitLayer.clientWidth;
    const height = portraitLayer.clientHeight;
    if (!bounds.width || !bounds.height) return;
    const pointerClick = event.detail > 0;
    const x = pointerClick ? (event.clientX - bounds.left) * width / bounds.width : width / 2;
    const y = pointerClick ? (event.clientY - bounds.top) * height / bounds.height : height / 2;
    const originX = Math.min(width, Math.max(0, x));
    const originY = Math.min(height, Math.max(0, y));
    const colors = ['#365849', '#ac5c43', '#8b7b9a'];
    const glyphs = ['✦', '✧', '✳'];

    for (let index = 0; index < 8; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'portrait-spark';
      particle.textContent = glyphs[index % glyphs.length];
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.color = colors[index % colors.length];
      particle.style.fontSize = `${17 + index % 3 * 5}px`;
      portraitLayer.append(particle);

      const angle = index / 8 * Math.PI * 2 - Math.PI / 2;
      const distance = 42 + index % 3 * 15;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const rotation = index % 2 ? 70 : -70;
      const animation = particle.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(.3)' },
        { opacity: 1, offset: 0.18, transform: `translate(-50%, -50%) translate(${dx * 0.2}px, ${dy * 0.2}px) rotate(${rotation * 0.2}deg) scale(1)` },
        { opacity: 0, transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(.65)` }
      ], { duration: 780 + index * 25, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
      particles.set(particle, animation);
      const remove = () => {
        particles.delete(particle);
        particle.remove();
      };
      animation.finished.then(remove, remove);
    }
  }

  if (portraitButton) {
    portraitButton.addEventListener('click', event => {
      window.clearTimeout(hintTimer);
      if (portraitHint) {
        portraitHint.textContent = 'A little curiosity goes a long way.';
        hintTimer = window.setTimeout(resetHint, 3000);
      }
      burstStars(event);
    });
    portraitButton.disabled = false;
  }

  const ideas = [
    ['What could you make simpler today?', 'Start with one small, useful thing.'],
    ['Which assumption deserves a second look?', 'A good question can change the shape of the answer.'],
    ['What tiny experiment could teach you something?', 'Make it small enough to try before tomorrow.'],
    ['Who could this little tool help?', 'Useful things begin with someone worth listening to.'],
    ['What would you build just to understand it?', 'Follow the part that makes you pause and wonder.'],
    ['What could you remove and still keep the magic?', 'Leave room for the idea to breathe.'],
    ['Which unfinished idea is worth another page?', 'Progress sometimes starts by coming back.'],
    ['What did you learn that someone else could use?', 'Turn a small discovery into something worth sharing.']
  ];
  const card = document.querySelector('.curiosity-card');
  const drawButton = card?.querySelector('.curiosity-draw');
  const message = card?.querySelector('.curiosity-message');
  const prompt = message?.querySelector('.curiosity-prompt');
  const caption = message?.querySelector('.curiosity-caption');
  const count = card?.querySelector('.curiosity-count');
  const doodle = card?.querySelector('.curiosity-doodle');
  let ideaIndex = 0;

  function displayIdea() {
    prompt.textContent = ideas[ideaIndex][0];
    caption.textContent = ideas[ideaIndex][1];
    if (count) count.textContent = `${String(ideaIndex + 1).padStart(2, '0')} / ${String(ideas.length).padStart(2, '0')}`;
  }

  if (drawButton && message && prompt && caption) {
    displayIdea();
    drawButton.addEventListener('click', () => {
      cancelNoteAnimations();
      ideaIndex = (ideaIndex + 1) % ideas.length;
      displayIdea();
      if (!motionAllowed()) return;

      animateNote(message, [
        { opacity: 0.45, transform: 'perspective(500px) rotateX(-8deg) translateY(5px)' },
        { opacity: 1, offset: 0.65, transform: 'perspective(500px) rotateX(2deg) translateY(-2px)' },
        { opacity: 1, transform: 'perspective(500px) rotateX(0deg) translateY(0px)' }
      ], { duration: 400, easing: 'cubic-bezier(.22, 1, .36, 1)' });

      if (doodle) {
        // Compose the nod with the doodle's resting paper angle.
        const transform = window.getComputedStyle(doodle).transform;
        const base = transform === 'none' ? '' : transform;
        animateNote(doodle, [
          { transform: `${base} rotate(0deg)` },
          { transform: `${base} rotate(-12deg)`, offset: 0.3 },
          { transform: `${base} rotate(7deg)`, offset: 0.65 },
          { transform: `${base} rotate(0deg)` }
        ], { duration: 480, easing: 'ease-out' });
      }
    });
    drawButton.disabled = false;
  }

  function clearMotion() {
    clearParticles();
    cancelNoteAnimations();
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches) clearMotion();
  });
  function preparePrint() {
    printing = true;
    clearMotion();
    resetHint();
  }
  printMedia.addEventListener('change', event => {
    printing = event.matches;
    if (printing) preparePrint();
  });
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', () => { printing = false; });
})();
