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
// In-place view routing.
//
// The URL bar never changes for internal navigation: instead of following a
// link, we fetch the destination page, lift its <main>, and swap it into the
// current document. contact.html (and every other page) still works as a
// normal, real, bookmarkable/shareable URL when opened directly — that fetch
// target has to keep existing as a real page for this to work at all — but
// clicking to it *from inside the site* never touches window.location.
//
// Falls back to a real navigation if fetch/parsing ever fails, so the site
// never breaks outright (e.g. if it's opened via file:// instead of a server).
// ---------------------------------------------------------------------------
const viewCache = new Map();
let currentView = detectInitialView();
let swapToken = 0;

function detectInitialView() {
  const path = window.location.pathname;
  if (/\/contact\.html$/.test(path)) return 'contact';
  if (/\/byo-app\.html$/.test(path)) return 'byo-app';
  if (/\/sdk\.html$/.test(path)) return 'sdk';
  if (/\/chrome-plugin\.html$/.test(path)) return 'chrome-plugin';
  return 'home';
}

function viewNameForPath(pathname) {
  if (/\/contact\.html$/.test(pathname)) return 'contact';
  if (/\/byo-app\.html$/.test(pathname)) return 'byo-app';
  if (/\/sdk\.html$/.test(pathname)) return 'sdk';
  if (/\/chrome-plugin\.html$/.test(pathname)) return 'chrome-plugin';
  return 'home';
}

function isHomeTarget(href, pathname) {
  return href.startsWith('#') || /\/index\.html$/.test(pathname) || /\/$/.test(pathname);
}

// Links inside fetched content are relative to *their* source file. Once
// lifted into whichever page is currently showing, those relative paths
// would resolve against the wrong location — so rewrite them to absolute
// URLs (not root-relative, so this still works under a GitHub Pages
// subpath) before they ever enter the live DOM.
function absolutizeLinks(scope, baseUrl) {
  scope.querySelectorAll('[href]').forEach((el) => {
    const raw = el.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
    try {
      el.setAttribute('href', new URL(raw, baseUrl).href);
    } catch {
      /* leave malformed hrefs alone */
    }
  });
  scope.querySelectorAll('[src]').forEach((el) => {
    const raw = el.getAttribute('src');
    if (!raw) return;
    try {
      el.setAttribute('src', new URL(raw, baseUrl).href);
    } catch {
      /* leave malformed srcs alone */
    }
  });
}

function updateNavActiveState(view) {
  document.querySelectorAll('.site-header nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    let resolved;
    try {
      resolved = new URL(href, window.location.href);
    } catch {
      return;
    }
    const isContactLink = /\/contact\.html$/.test(resolved.pathname);
    if (view === 'contact' && isContactLink) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });
}

function fadeOutMain(mainEl) {
  if (prefersReducedMotion || typeof mainEl.animate !== 'function') return Promise.resolve();
  return mainEl.animate(
    [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(10px)' },
    ],
    { duration: 320, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
  ).finished;
}

function fadeInMain(mainEl) {
  if (prefersReducedMotion || typeof mainEl.animate !== 'function') return Promise.resolve();
  return mainEl.animate(
    [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
  ).finished;
}

async function fetchView(url) {
  if (viewCache.has(url)) return viewCache.get(url);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const newMain = doc.querySelector('main');
  if (!newMain) throw new Error('No <main> in fetched document');

  absolutizeLinks(newMain, response.url);

  const result = { main: newMain, title: doc.title };
  viewCache.set(url, result);
  return result;
}

async function swapToUrl(url) {
  const token = ++swapToken;
  const view = viewNameForPath(new URL(url, window.location.href).pathname);

  let fetched;
  try {
    fetched = await fetchView(url);
  } catch {
    // Fetch/parse failed (e.g. opened via file://) — degrade to a real
    // navigation rather than leaving the click doing nothing.
    window.location.assign(url);
    return;
  }

  if (token !== swapToken) return; // a newer navigation has since started

  const currentMain = document.querySelector('main');
  await fadeOutMain(currentMain);
  if (token !== swapToken) return;

  const newMain = fetched.main.cloneNode(true);
  currentMain.replaceWith(newMain);
  document.title = fetched.title || document.title;
  currentView = view;
  updateNavActiveState(view);
  setupReveals();
  window.scrollTo({ top: 0, behavior: 'auto' });

  newMain.setAttribute('tabindex', '-1');
  newMain.focus({ preventScroll: true });

  fadeInMain(newMain);
}

function scrollToHash(hash) {
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

async function handleInternalLinkClick(event, link) {
  const href = link.getAttribute('href');
  if (!href || link.target === '_blank' || link.hasAttribute('download')) return;

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

  event.preventDefault();

  if (isHomeTarget(href, destination.pathname)) {
    if (currentView !== 'home') {
      await swapToUrl(`${destination.origin}/index.html`);
    }
    scrollToHash(destination.hash);
    return;
  }

  const targetView = viewNameForPath(destination.pathname);
  if (targetView === currentView) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    return;
  }

  swapToUrl(destination.href);
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

  handleInternalLinkClick(event, link);
});

updateNavActiveState(currentView);
