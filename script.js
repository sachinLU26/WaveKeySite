const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;

// ---------------------------------------------------------------------------
// Staggered scroll reveal — re-run after every view swap so freshly injected
// content gets observed too. Already-observed elements are skipped so we
// never register the same node twice.
// ---------------------------------------------------------------------------
const observedReveals = new WeakSet();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
);

function setupReveals() {
  const revealGroups = [
    [...document.querySelectorAll('.section')],
    [...document.querySelectorAll('.panel')],
    [...document.querySelectorAll('.product-grid .card')],
    [...document.querySelectorAll('.feature-list li')],
    [...document.querySelectorAll('.flow-panel li')],
  ];

  revealGroups.forEach((group) => {
    group.forEach((target, index) => {
      target.classList.add('reveal');
      target.style.setProperty('--reveal-delay', `${Math.min(index * 70, 280)}ms`);
    });
  });

  [...new Set(revealGroups.flat())].forEach((target) => {
    if (observedReveals.has(target)) return;
    observedReveals.add(target);
    revealObserver.observe(target);
  });
}

setupReveals();

// ---------------------------------------------------------------------------
// Smooth, rAF-batched pointer-driven ambient glow + card tilt. Delegated on
// document so it keeps working for cards injected by a later view swap,
// with no need to re-bind listeners.
// ---------------------------------------------------------------------------
if (canHover && !prefersReducedMotion) {
  let pendingPointer = null;
  let pendingCard = null;
  let pendingTilt = null;
  let rafScheduled = false;

  const applyPending = () => {
    rafScheduled = false;
    if (pendingPointer) {
      root.style.setProperty('--pointer-x', `${pendingPointer.x}%`);
      root.style.setProperty('--pointer-y', `${pendingPointer.y}%`);
      pendingPointer = null;
    }
    if (pendingCard && pendingTilt) {
      pendingCard.style.setProperty('--tilt-x', `${pendingTilt.x}deg`);
      pendingCard.style.setProperty('--tilt-y', `${pendingTilt.y}deg`);
      pendingCard = null;
      pendingTilt = null;
    }
  };

  const schedule = () => {
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(applyPending);
    }
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      pendingPointer = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      const card = event.target.closest('.tilt-card');
      if (card) {
        const bounds = card.getBoundingClientRect();
        const offsetX = (event.clientX - bounds.left) / bounds.width;
        const offsetY = (event.clientY - bounds.top) / bounds.height;
        pendingCard = card;
        pendingTilt = {
          y: (offsetX - 0.5) * 8,
          x: (0.5 - offsetY) * 6,
        };
      }

      schedule();
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerout',
    (event) => {
      const card = event.target.closest('.tilt-card');
      if (!card || card.contains(event.relatedTarget)) return;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    },
    { passive: true }
  );
}

// ---------------------------------------------------------------------------
// Click "presence" pulse ripple — untouched, fires on every click regardless
// of navigation.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Mobile nav toggle (hamburger) — the header never gets swapped, so this is
// bound once and stays valid for the life of the page.
// ---------------------------------------------------------------------------
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-header nav');

function closeMobileNav() {
  if (!header || !navToggle) return;
  header.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

if (header && navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.contains('nav-open');
    if (isOpen) {
      closeMobileNav();
    } else {
      header.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) {
      closeMobileNav();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
      navToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) {
      closeMobileNav();
    }
  });
}

// ---------------------------------------------------------------------------
// Keep standard multi-page navigation so URLs change and work correctly on
// GitHub Pages subpaths. Only enhance same-page hash links with smooth scroll.
// ---------------------------------------------------------------------------
function scrollToHash(hash) {
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const link = event.target.closest('a[href]');
  if (!link) return;

  if (siteNav && siteNav.contains(link)) {
    closeMobileNav();
  }

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;

  event.preventDefault();
  scrollToHash(href);
});
