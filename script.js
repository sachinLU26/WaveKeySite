const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Staggered scroll reveal
const revealGroups = [
  [...document.querySelectorAll('.section')],
  [...document.querySelectorAll('.panel')],
  [...document.querySelectorAll('.product-grid .card')],
  [...document.querySelectorAll('.feature-list li')],
];

revealGroups.forEach((group) => {
  group.forEach((target, index) => {
    target.classList.add('reveal');
    target.style.setProperty('--reveal-delay', `${Math.min(index * 70, 280)}ms`);
  });
});

const revealTargets = [...new Set(revealGroups.flat())];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
);

revealTargets.forEach((target) => observer.observe(target));

// Smooth, rAF-batched pointer-driven ambient glow + card tilt (skips on touch/reduced motion)
const root = document.documentElement;
const tiltCards = [...document.querySelectorAll('.tilt-card')];
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (canHover && !prefersReducedMotion) {
  let pendingPointer = null;
  let rafScheduled = false;

  const applyPointer = () => {
    rafScheduled = false;
    if (!pendingPointer) return;
    const { x, y } = pendingPointer;
    root.style.setProperty('--pointer-x', `${x}%`);
    root.style.setProperty('--pointer-y', `${y}%`);
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      pendingPointer = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(applyPointer);
      }
    },
    { passive: true }
  );

  tiltCards.forEach((card) => {
    let pendingTilt = null;
    let tiltRafScheduled = false;

    const applyTilt = () => {
      tiltRafScheduled = false;
      if (!pendingTilt) return;
      card.style.setProperty('--tilt-x', `${pendingTilt.x}deg`);
      card.style.setProperty('--tilt-y', `${pendingTilt.y}deg`);
    };

    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width;
      const offsetY = (event.clientY - bounds.top) / bounds.height;
      pendingTilt = {
        y: (offsetX - 0.5) * 8,
        x: (0.5 - offsetY) * 6,
      };
      if (!tiltRafScheduled) {
        tiltRafScheduled = true;
        requestAnimationFrame(applyTilt);
      }
    });

    card.addEventListener('pointerleave', () => {
      pendingTilt = { x: 0, y: 0 };
      requestAnimationFrame(applyTilt);
    });
  });
}

// Click "presence" pulse ripple
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

// Cross-page transition (ripple + fade) for same-origin navigation
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
      }, 420);
    });
  });
}

// Mobile nav toggle (hamburger)
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-header nav');

if (header && navToggle && siteNav) {
  const closeNav = () => {
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const openNav = () => {
    header.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
  };

  navToggle.addEventListener('click', () => {
    if (header.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) {
      closeNav();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
      navToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) {
      closeNav();
    }
  });
}
