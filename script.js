/* ===========================================================================
   WaveKey — motion layer
   ---------------------------------------------------------------------------
   Structure:
     1.  Environment
     2.  Scroll driver          — one rAF loop, one scroll listener
     3.  Line splitter         — per-line masked text reveals
     4.  Reveal controller     — in-view triggers
     5.  Entrance choreography — sequenced arrival for hero / product hero
     6.  Step progress         — scroll-linked active state on the flow panel
     7.  Pointer glow          — PRESERVED
     8.  Click ripple          — PRESERVED
     9.  Mobile nav            — PRESERVED
     10. View router           — prefetch + overlapped transition
   =========================================================================== */

/* --- 1. Environment ------------------------------------------------------ */

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = motionQuery.matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/* --- 2. Scroll driver ----------------------------------------------------
   Every scroll-linked effect subscribes here. One passive listener, one rAF,
   no layout reads inside the handler beyond a single scrollY.
   ------------------------------------------------------------------------- */

const scrollSubscribers = new Set();
let scrollTicking = false;

function runScrollSubscribers() {
  scrollTicking = false;
  const y = window.scrollY;
  scrollSubscribers.forEach((fn) => fn(y));
}

function onScroll() {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(runScrollSubscribers);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

/* --- 3. Line splitter ----------------------------------------------------
   Wraps each rendered line of text in a clipping box so the line can be
   translated up from below rather than cross-fading in place. This is the
   difference between "text appeared" and "text arrived".

   Two things that are easy to get wrong and are handled here:
     - Splitting before webfonts load measures line breaks against the
       fallback metrics, so lines end up wrapped in the wrong places.
       Everything waits on document.fonts.ready.
     - overflow:hidden on a line clips descenders (g, y, p). The
       padding-bottom / negative-margin pair in the CSS gives them room.
   ------------------------------------------------------------------------- */

const SPLIT_SELECTOR = 'h1, h2, .lead:not([data-read])';
const READ_SELECTOR = '[data-read]';
const splitCache = new WeakMap();

function collectSplitTargets(scope) {
  return [...scope.querySelectorAll(SPLIT_SELECTOR)].filter((el) => {
    // Text-only nodes: anything with child elements is left alone rather than
    // risking the destruction of inline markup.
    return el.children.length === 0 && el.textContent.trim().length > 0;
  });
}

function collectSplitElements(scope) {
  const out = [...scope.querySelectorAll('.is-split')];
  if (scope.classList && scope.classList.contains('is-split')) out.push(scope);
  return out;
}

function splitIntoLines(el) {
  const original = splitCache.get(el) ?? el.textContent;
  splitCache.set(el, original);

  const words = original.trim().split(/\s+/);
  if (words.length === 0) return;

  // Pass 1 — lay every word out individually and read its vertical offset.
  const probe = document.createDocumentFragment();
  const wordEls = words.map((word, i) => {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.textContent = word;
    probe.appendChild(span);
    if (i < words.length - 1) probe.appendChild(document.createTextNode(' '));
    return span;
  });

  el.textContent = '';
  el.appendChild(probe);

  const lines = [];
  let lastTop = null;
  wordEls.forEach((span) => {
    const top = span.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(span.textContent);
  });

  // Pass 2 — rebuild as masked lines.
  el.textContent = '';
  lines.forEach((line, i) => {
    const outer = document.createElement('span');
    outer.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    inner.textContent = line.join(' ');
    inner.style.setProperty('--line-delay', `${i * 85}ms`);
    outer.appendChild(inner);
    el.appendChild(outer);
  });

  el.classList.add('is-split');
}

function unsplit(el) {
  const original = splitCache.get(el);
  if (original === undefined) return;
  el.textContent = original;
  el.classList.remove('is-split', 'split-in');
}

/* --- Reading illumination ------------------------------------------------
   Story copy is split into words, each carrying its index. A single --head
   custom property on the paragraph then drives every word's opacity through
   one calc(), so scrolling advances a reading position across the text
   without JavaScript touching a single word node per frame.
   ------------------------------------------------------------------------- */

function splitIntoWords(el) {
  if (el.dataset.wordsDone === '1') return;
  const words = el.textContent.trim().split(/\s+/);
  if (!words.length) return;

  const frag = document.createDocumentFragment();
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.style.setProperty('--i', String(i));
    span.textContent = word;
    frag.appendChild(span);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });

  el.textContent = '';
  el.appendChild(frag);
  el.dataset.words = String(words.length);
  el.dataset.wordsDone = '1';
}

function applyReadSplits(scope) {
  // Without JS the --head fallback lights every word, so under reduced motion
  // the honest thing is simply to leave the text alone.
  if (prefersReducedMotion) return;
  const self = scope.matches && scope.matches(READ_SELECTOR) ? [scope] : [];
  [...self, ...scope.querySelectorAll(READ_SELECTOR)].forEach((el) => {
    if (el.children.length === 0) splitIntoWords(el);
  });
}

function applySplits(scope) {
  if (prefersReducedMotion) return;
  collectSplitTargets(scope).forEach((el) => {
    splitIntoLines(el);
    // If the container was already revealed before this element got split,
    // release the lines now — otherwise they stay parked below the mask.
    if (el.closest('[data-revealed="1"]')) el.classList.add('split-in');
  });
}

// Re-split on width change only. Height changes (mobile URL bar) must not
// trigger a rebuild — that would restart every reveal mid-scroll.
let lastWidth = window.innerWidth;
let resplitTimer = null;
window.addEventListener(
  'resize',
  () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resplitTimer);
    resplitTimer = setTimeout(() => {
      const main = document.querySelector('main');
      if (!main) return;
      collectSplitElements(main).forEach((el) => {
        const wasIn = el.classList.contains('split-in');
        unsplit(el);
        if (!prefersReducedMotion) {
          splitIntoLines(el);
          if (wasIn) el.classList.add('split-in');
        }
      });
    }, 180);
  },
  { passive: true }
);

/* --- 4. Reveal controller ------------------------------------------------
   Elements fade and lift; split headings release their lines. rootMargin is
   asymmetric so things commit slightly before they reach the fold, which
   removes the "pop" of a threshold trigger at speed.
   ------------------------------------------------------------------------- */

const observed = new WeakSet();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.dataset.revealed = '1';
      collectSplitElements(entry.target).forEach((el) => el.classList.add('split-in'));
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.05, rootMargin: '0px 0px -12% 0px' }
);

function setupReveals(scope = document) {
  const self = scope.matches && scope.matches('.section:not(.hero), .panel') ? [scope] : [];
  const groups = [
    self,
    [...scope.querySelectorAll('.section:not(.hero)')],
    [...scope.querySelectorAll('.panel')],
    [...scope.querySelectorAll('.feature-list li')],
    [...scope.querySelectorAll('.stages .stage')],
    [...scope.querySelectorAll('.figures .figure')],
    [...scope.querySelectorAll('.pillars .pillar')],
    [...scope.querySelectorAll('.compare .compare-row')],
    [...scope.querySelectorAll('.steps li')],
  ];

  groups.forEach((group) => {
    group.forEach((target, index) => {
      target.classList.add('reveal');
      target.style.setProperty('--reveal-delay', `${Math.min(index * 90, 360)}ms`);
    });
  });

  [...new Set(groups.flat())].forEach((target) => {
    if (observed.has(target)) return;
    observed.add(target);
    revealObserver.observe(target);
  });
}

/* --- 5. Entrance choreography -------------------------------------------
   The hero does not fade in as one block. Each element arrives in sequence,
   and the headline's own per-line stagger nests inside that sequence.
   ------------------------------------------------------------------------- */

const ENTER_ORDER = ['.kicker', '.presence-badge', '.breadcrumb', '.icon-badge', 'h1', '.lead', '.hero-actions', '.feature-list', '.product-cta', '.hero-meta', '.micro-note'];

function prepareEntrance(scope) {
  const host = scope.querySelector('.hero-inner') || scope.querySelector('.product-hero');
  if (!host) return;
  ENTER_ORDER.forEach((selector) => {
    const el = host.querySelector(`:scope > ${selector}`);
    if (el) el.classList.add('enter');
  });
}

function releaseEntrance(scope) {
  const host = scope.querySelector('.hero-inner') || scope.querySelector('.product-hero');
  if (!host) return;

  let step = 0;
  ENTER_ORDER.forEach((selector) => {
    const el = host.querySelector(`:scope > ${selector}`);
    if (!el) return;
    el.style.setProperty('--enter-delay', `${120 + step * 110}ms`);
    // A split headline occupies more of the timeline than a single element,
    // so the sequence waits for its lines before continuing.
    const lineCount = el.querySelectorAll('.line').length;
    step += lineCount > 1 ? 1 + (lineCount - 1) * 0.75 : 1;
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      host.classList.add('entered');
      host.querySelectorAll('.is-split').forEach((el) => el.classList.add('split-in'));
    });
  });
}

/* --- 6. Hero parallax + step progress + header state ---------------------
   All scroll-linked, all transform/opacity only.
   ------------------------------------------------------------------------- */

function setupScrollEffects(scope) {
  scrollSubscribers.clear();

  const header = document.querySelector('.site-header');
  if (header) {
    scrollSubscribers.add((y) => {
      header.classList.toggle('is-scrolled', y > 24);
    });
  }

  if (prefersReducedMotion) {
    onScroll();
    return;
  }

  // Hero drifts up and dims as it leaves — ties the first scroll to the page
  // rather than letting content slide past a static block.
  const heroInner = scope.querySelector('.hero-inner');
  if (heroInner) {
    scrollSubscribers.add((y) => {
      const p = clamp(y / (window.innerHeight * 0.85), 0, 1);
      heroInner.style.setProperty('--drift', `${(-p * 56).toFixed(2)}px`);
      heroInner.style.setProperty('--dim', (1 - p * 0.75).toFixed(3));
    });
  }

  // Sequenced highlight: children of [data-progress] light one at a time as
  // the container crosses the focal line, so a set of stages reads as a
  // progression rather than as three parallel columns.
  const flow = scope.querySelector('[data-progress]');
  const steps = flow ? [...flow.children] : [];
  if (steps.length) {
    scrollSubscribers.add(() => {
      const rect = flow.getBoundingClientRect();
      const focal = window.innerHeight * 0.55;
      const progress = clamp((focal - rect.top) / Math.max(rect.height, 1), 0, 0.999);
      const active = Math.floor(progress * steps.length);
      steps.forEach((li, i) => {
        li.classList.toggle('is-active', rect.top < window.innerHeight && rect.bottom > 0 && i === active);
      });
    });
  }

  // Reading illumination: a head advances through each story paragraph as it
  // crosses the reading line, lighting words as they are "read". The overshoot
  // either side means a paragraph is fully lit before it leaves the screen and
  // not still dim when it arrives.
  const readEls = [...scope.querySelectorAll(READ_SELECTOR)];
  if (readEls.length) {
    scrollSubscribers.add(() => {
      const vh = window.innerHeight;
      // Progress is measured against a fixed reading band rather than the
      // paragraph's own height. Driving it by height meant a short paragraph
      // lit from cold to complete in ~200px of scroll, which reads as a flash
      // rather than as reading. The band spans roughly 55% of the viewport,
      // plus a share of the paragraph's height so long ones aren't rushed.
      const start = vh * 0.88;
      const end = vh * 0.32;
      for (let i = 0; i < readEls.length; i++) {
        const el = readEls[i];
        const rect = el.getBoundingClientRect();
        const span = start - end + rect.height * 0.6;
        const p = clamp((start - rect.top) / span, -0.12, 1.15);
        const count = Number(el.dataset.words) || 1;
        el.style.setProperty('--head', (p * (count + 8) - 3).toFixed(2));
      }
    });
  }

  onScroll();
}

/* --- 7. Pointer glow — PRESERVED ----------------------------------------
   Drives --pointer-x / --pointer-y on :root. Those are registered with
   @property in styles.css, which is what lets the .bg-glow gradient
   *transition* between positions instead of snapping. Do not replace this
   with a direct background-position write.
   ------------------------------------------------------------------------- */

if (canHover && !prefersReducedMotion) {
  let pendingPointer = null;
  let pointerTicking = false;

  const applyPointer = () => {
    pointerTicking = false;
    if (!pendingPointer) return;
    root.style.setProperty('--pointer-x', `${pendingPointer.x}%`);
    root.style.setProperty('--pointer-y', `${pendingPointer.y}%`);
    pendingPointer = null;
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      pendingPointer = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };
      if (!pointerTicking) {
        pointerTicking = true;
        requestAnimationFrame(applyPointer);
      }
    },
    { passive: true }
  );
}

/* --- 8. Click ripple — PRESERVED ---------------------------------------- */

if (!prefersReducedMotion) {
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      const pulse = document.createElement('span');
      pulse.className = 'wave-pulse';
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      document.body.appendChild(pulse);
      pulse.addEventListener('animationend', () => pulse.remove());
    },
    { passive: true }
  );
}

/* --- 9. Mobile nav — PRESERVED ------------------------------------------ */

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
    if (!header.contains(event.target)) closeMobileNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
      navToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeMobileNav();
  });
}

/* --- 10. View router ----------------------------------------------------
   The URL bar never changes for internal navigation: instead of following a
   link, the destination page is fetched, its <main> lifted, and swapped into
   the current document. Every page still works as a real, bookmarkable URL
   when opened directly.

   Two changes over the original:
     - Destinations are prefetched on pointerenter/focus, so by the time the
       click lands the response is usually already cached. The perceived
       latency of the transition is mostly this, not the animation.
     - The fetch and the exit animation now run concurrently instead of
       sequentially. Previously it was: await network, then 320ms out, then
       460ms in — a dead gap on every click.
   ------------------------------------------------------------------------- */

const viewCache = new Map();
const inflight = new Map();
let currentView = detectInitialView();
let swapToken = 0;

function viewNameForPath(pathname) {
  if (/\/byo-app\.html$/.test(pathname)) return 'byo-app';
  if (/\/sdk\.html$/.test(pathname)) return 'sdk';
  if (/\/chrome-plugin\.html$/.test(pathname)) return 'chrome-plugin';
  return 'home';
}

function detectInitialView() {
  return viewNameForPath(window.location.pathname);
}

function isHomeTarget(href, pathname) {
  return href.startsWith('#') || /\/index\.html$/.test(pathname) || /\/$/.test(pathname);
}

// Links inside fetched content are relative to *their* source file. Once
// lifted into whichever page is currently showing, those relative paths would
// resolve against the wrong location — so rewrite them to absolute URLs (not
// root-relative, so this still works under a GitHub Pages subpath) before they
// ever enter the live DOM.
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

function updateNavActiveState() {
  // Contact now lives on the homepage, so no nav item is ever a separate
  // "current page" — the underline is driven by hover and focus alone.
  document.querySelectorAll('.site-header nav a').forEach((a) => a.removeAttribute('aria-current'));
}

function fetchView(url) {
  if (viewCache.has(url)) return Promise.resolve(viewCache.get(url));
  if (inflight.has(url)) return inflight.get(url);

  const task = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      return response.text().then((html) => ({ html, finalUrl: response.url }));
    })
    .then(({ html, finalUrl }) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = doc.querySelector('main');
      if (!newMain) throw new Error('No <main> in fetched document');
      absolutizeLinks(newMain, finalUrl);
      const result = { main: newMain, title: doc.title };
      viewCache.set(url, result);
      inflight.delete(url);
      return result;
    })
    .catch((err) => {
      inflight.delete(url);
      throw err;
    });

  inflight.set(url, task);
  return task;
}

function prefetch(url) {
  if (viewCache.has(url) || inflight.has(url)) return;
  fetchView(url).catch(() => {});
}

function animateOut(el) {
  if (prefersReducedMotion || typeof el.animate !== 'function') return Promise.resolve();
  return el.animate(
    [
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(-14px)', filter: 'blur(3px)' },
    ],
    { duration: 260, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
  ).finished;
}

function animateIn(el) {
  if (prefersReducedMotion || typeof el.animate !== 'function') {
    el.style.removeProperty('opacity');
    return Promise.resolve();
  }
  const anim = el.animate(
    [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
  );
  anim.finished.then(() => {
    anim.cancel();
    el.style.removeProperty('opacity');
  });
  return anim.finished;
}

// Synchronous, must run before first paint: puts everything into its hidden
// start state so nothing is ever painted visible and then snapped away.
function prepareView(scope) {
  setupReveals(scope);
  prepareEntrance(scope);
  setupScrollEffects(scope);
}

// Deferred until webfonts have settled: measuring line breaks against Inter's
// fallback metrics produces wrap points that are wrong once Inter arrives.
function activateView(scope) {
  applySplits(scope);
  applyReadSplits(scope);
  releaseEntrance(scope);
  onScroll();
}

async function swapToUrl(url) {
  const token = ++swapToken;

  // Fetch and exit animation run together. With prefetch-on-hover the fetch
  // has usually already resolved before the click even lands.
  const pending = fetchView(url);
  const outgoing = document.querySelector('main');
  const exit = animateOut(outgoing);

  let fetched;
  try {
    fetched = await pending;
  } catch {
    // Fetch/parse failed (e.g. opened via file://) — degrade to a real
    // navigation rather than leaving the click doing nothing.
    window.location.assign(url);
    return;
  }

  await exit;
  if (token !== swapToken) return; // a newer navigation has since started

  const newMain = fetched.main.cloneNode(true);
  // Insert already hidden, or the browser paints one frame at full opacity
  // before the entrance animation's first keyframe lands.
  newMain.style.opacity = '0';
  document.querySelector('main').replaceWith(newMain);

  document.title = fetched.title || document.title;
  currentView = viewNameForPath(new URL(url, window.location.href).pathname);
  updateNavActiveState(currentView);
  window.scrollTo({ top: 0, behavior: 'auto' });

  newMain.setAttribute('tabindex', '-1');
  newMain.focus({ preventScroll: true });

  prepareView(newMain);
  activateView(newMain);
  animateIn(newMain);

  // The presence field runs its five-act story only on the homepage; the other
  // views are too short to set it up, so it idles there instead.
  if (window.WaveKeyField) {
    window.WaveKeyField.setView(currentView === 'home' ? 'home' : 'other');
    window.WaveKeyField.refreshTargets();
  }
}

function scrollToHash(hash) {
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function resolveInternal(link) {
  const href = link.getAttribute('href');
  if (!href || link.target === '_blank' || link.hasAttribute('download')) return null;
  let destination;
  try {
    destination = new URL(link.href, window.location.href);
  } catch {
    return null;
  }
  if (
    destination.origin !== window.location.origin ||
    destination.protocol === 'mailto:' ||
    destination.protocol === 'tel:'
  ) {
    return null;
  }
  return { href, destination };
}

async function handleInternalLinkClick(event, link) {
  const resolved = resolveInternal(link);
  if (!resolved) return;
  const { href, destination } = resolved;

  event.preventDefault();

  if (isHomeTarget(href, destination.pathname)) {
    if (currentView !== 'home') {
      // Resolve against the destination, not the origin: on GitHub Pages the
      // site lives under /WaveKeySite/, so `${origin}/index.html` 404s and the
      // fallback then navigates the visitor clean off the site.
      await swapToUrl(new URL('index.html', destination).href);
    }
    scrollToHash(destination.hash);
    return;
  }

  if (viewNameForPath(destination.pathname) === currentView) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    return;
  }

  swapToUrl(destination.href);
}

// Warm the cache before the click.
function warm(event) {
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  const resolved = resolveInternal(link);
  if (!resolved) return;
  const { href, destination } = resolved;
  const url = isHomeTarget(href, destination.pathname)
    ? new URL('index.html', destination).href
    : destination.href;
  if (viewNameForPath(new URL(url).pathname) === currentView) return;
  prefetch(url);
}

document.addEventListener('pointerover', warm, { passive: true });
document.addEventListener('focusin', warm, { passive: true });

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const link = event.target.closest('a[href]');
  if (!link) return;
  if (siteNav && siteNav.contains(link)) closeMobileNav();
  handleInternalLinkClick(event, link);
});

/* --- Boot ---------------------------------------------------------------
   Splitting waits on webfonts: measuring line breaks against Inter's fallback
   produces wrap points that are wrong once Inter arrives.
   ------------------------------------------------------------------------- */

updateNavActiveState(currentView);
root.classList.add('js-ready');

const bootMain = document.querySelector('main');
let activated = false;

function activateOnce() {
  if (activated || !bootMain) return;
  activated = true;
  activateView(bootMain);
}

if (bootMain) prepareView(bootMain);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(activateOnce);
  // A stalled font request must never leave the page sitting blank.
  setTimeout(activateOnce, 1200);
} else {
  activateOnce();
}

motionQuery.addEventListener('change', (e) => {
  prefersReducedMotion = e.matches;
  const main = document.querySelector('main');
  if (!main) return;
  if (prefersReducedMotion) {
    collectSplitElements(main).forEach(unsplit);
  }
  setupScrollEffects(main);
});
