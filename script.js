const revealTargets = [...document.querySelectorAll('.section, .card, .panel')];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.18 }
);

revealTargets.forEach((target) => {
  target.classList.add('reveal');
  observer.observe(target);
});

const root = document.documentElement;
const tiltCards = [...document.querySelectorAll('.tilt-card')];

window.addEventListener(
  'pointermove',
  (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    root.style.setProperty('--pointer-x', `${x}%`);
    root.style.setProperty('--pointer-y', `${y}%`);
  },
  { passive: true }
);

tiltCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width;
    const offsetY = (event.clientY - bounds.top) / bounds.height;
    const tiltY = (offsetX - 0.5) * 8;
    const tiltX = (0.5 - offsetY) * 6;
    card.style.setProperty('--tilt-x', `${tiltX}deg`);
    card.style.setProperty('--tilt-y', `${tiltY}deg`);
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) {
        return;
      }

      const pulse = document.createElement('span');
      pulse.className = 'wave-pulse';
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      document.body.appendChild(pulse);

      pulse.addEventListener('animationend', () => {
        pulse.remove();
      });
    },
    { passive: true }
  );
}

if (!prefersReducedMotion) {
  const navigationLinks = [...document.querySelectorAll('a[href]')];
  const currentPage = `${window.location.origin}${window.location.pathname}${window.location.search}`;

  navigationLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || link.target === '_blank' || link.hasAttribute('download')) {
        return;
      }

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (
        destination.origin !== window.location.origin ||
        destination.protocol === 'mailto:' ||
        destination.protocol === 'tel:'
      ) {
        return;
      }

      const destinationPage = `${destination.origin}${destination.pathname}${destination.search}`;
      if (destinationPage === currentPage) {
        return;
      }

      event.preventDefault();
      document.body.style.setProperty('--transition-x', `${event.clientX}px`);
      document.body.style.setProperty('--transition-y', `${event.clientY}px`);
      document.body.classList.add('page-transitioning');

      window.setTimeout(() => {
        window.location.assign(destination.href);
      }, 360);
    });
  });
}
