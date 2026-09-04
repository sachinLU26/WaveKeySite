# WaveKeySite — how the code works

Written so you can change things without reading all 3,500 lines. Every section
ends with the specific knobs for that behaviour.

---

## 1. The file map

```
index.html                  the only content page (hero, products, story, mechanism, contact form)
products/byo-app.html       \
products/sdk.html            }  three near-identical product pages
products/chrome-plugin.html /
styles.css      1,537 lines   all styling, in labelled sections
script.js         771 lines   text splitting, reveals, scroll effects, page router
field.js          758 lines   the canvas behind everything + scroll-velocity engine
```

No build step. No dependencies. `styles.css`, `script.js`, and `field.js` are
loaded directly by every page. `field.js` loads **before** `script.js`, because
`script.js` calls into `window.WaveKeyField` after a page swap.

Editing loop: save the file, hard-reload the browser. That's it.

---

## 2. The design tokens — start here for any visual change

Top of `styles.css`, in `:root`. **Nothing in the stylesheet hardcodes a colour.**
Change a token and it propagates everywhere.

```css
--bg: #06070b;                          /* page background */
--surface: rgba(255,255,255,0.025);     /* barely-there raised fill */
--text: #f2f3f6;                        /* primary text, never pure white */
--muted: rgba(242,243,246,0.58);        /* body copy — 6.2:1 contrast */
--faint: rgba(242,243,246,0.52);        /* eyebrows, meta — 5.1:1 contrast */
--line: rgba(255,255,255,0.09);         /* every hairline on the site */
--line-hover: rgba(255,255,255,0.2);
--accent: #f1f4ff;                      /* near-white */
--positive: #7ef2c0;                    /* the green. Presence only. */
--max: 1120px;                          /* content width */
```

**If you change `--muted` or `--faint`, re-check contrast.** Those two comments
are calculated ratios against `--bg`; drop the alpha and you fail WCAG AA.

Motion tokens live in the same block:

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* everything arriving */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* everything leaving */
--dur-xs: 0.22s;  --dur-sm: 0.38s;  --dur-md: 0.6s;  --dur-lg: 0.78s;
```

The asymmetry between arrive and leave is deliberate. Symmetrical easing is
what default styling looks like.

### Stylesheet layout

`styles.css` reads top to bottom as: tokens → base/layout → components →
responsive, then five labelled blocks appended in the order they were built:

| Line (approx) | Block |
|---|---|
| 959 | `MOTION LAYER` — line masking, entrance, hero drift, header state, step progression |
| 1182 | `PRESENCE FIELD` — canvas positioning and the readout caption |
| 1303 | `FLOW` — scroll-velocity shear |
| 1387 | `STORY + READING ILLUMINATION` |
| 1434 | `REQUEST ACCESS` — the contact form |

**Later blocks override earlier ones at equal specificity.** That is load-bearing
and it is also where every bug in this project came from. See §8.

---

## 3. `script.js` — ten numbered sections

The file is commented with `/* --- N. Name --- */` headers. In order:

### 1. Environment
`prefersReducedMotion`, `canHover`, `clamp`. Nothing interesting.

### 2. Scroll driver
```js
const scrollSubscribers = new Set();
```
**One** passive scroll listener, batched into **one** `requestAnimationFrame`.
Every scroll-linked effect in `script.js` pushes a function into this Set. If
you add a scroll effect, add it here — do not add another listener.

The Set is **cleared and rebuilt** by `setupScrollEffects()` on every page swap.
Anything you register outside that function will be wiped.

### 3. Line splitter
```js
const SPLIT_SELECTOR = 'h1, h2, .lead:not([data-read])';
```
Headings are split into their *rendered* lines, each wrapped in a clipping mask
so it can rise from below.

How it works: lay every word out as an `inline-block`, read each one's
`offsetTop`, group words that share a top into a line, rebuild the element as
`<span class="line"><span class="line-inner">…`.

Two constraints you must not break:

- **It runs after `document.fonts.ready`.** Measure line breaks against the
  fallback font and the masks land mid-line once Inter arrives.
- **Only elements with no child elements are split** (`el.children.length === 0`).
  Put a `<a>` or `<em>` inside an `h2` and it is silently skipped, by design —
  splitting would destroy the markup.

`collectSplitTargets()` finds *unsplit* elements. `collectSplitElements()` finds
*already-split* ones. Mixing those two up was a real bug; the names are the fix.

### 3b. Reading illumination
```js
const READ_SELECTOR = '[data-read]';
```
`splitIntoWords()` wraps each word in `<span class="w" style="--i:N">`.

The clever part is that JavaScript never touches a word again. The paragraph
gets one `--head` property per frame, and CSS resolves all 140 words:

```css
[data-read] .w {
  opacity: clamp(0.16, calc(0.16 + (var(--head, 99) - var(--i, 0)) * 0.32), 1);
}
```

`0.16` is the unread floor. `0.32` is how sharply the reading head falls off —
raise it for a crisper edge, lower it for a softer gradient. **The `99` fallback
is why the text is readable with JavaScript disabled.** Do not remove it.

### 4. Reveal controller
One `IntersectionObserver`, threshold `0.05`, `rootMargin: '0px 0px -12% 0px'`
so elements commit just before reaching the fold. Fires once, then unobserves.

`setupReveals()` builds the target list:
```js
const self = scope.matches('.section:not(.hero), .panel') ? [scope] : [];
```
That first line exists because **`querySelectorAll` never matches the scope
element itself**. Forgetting it left `<main class="product-page section">`
permanently at `opacity: 0`. If you add a new revealing container, add it to
the `groups` array.

Stagger is `index * 90ms`, capped at `360ms`, written to `--reveal-delay`.

### 5. Entrance choreography
```js
const ENTER_ORDER = ['.kicker', '.presence-badge', '.breadcrumb', '.icon-badge',
                     'h1', '.lead', '.hero-actions', '.feature-list',
                     '.product-cta', '.micro-note'];
```
Direct children of `.hero-inner` (or `.product-hero`) arrive in this order.
**Reorder this array to reorder the hero animation.** Base delay 120ms, 110ms
per step. A split `h1` consumes extra slots proportional to its line count, so
the lead paragraph never steps on the headline's last line.

Split in two on purpose:
- `prepareEntrance()` runs **synchronously, before first paint** — applies the
  hidden state.
- `releaseEntrance()` runs **after fonts load** — assigns delays and triggers.

Merging them back into one function reintroduces a flash of visible content.

### 6. Scroll effects
`setupScrollEffects()` registers four subscribers:

| Effect | What it writes | Tuning |
|---|---|---|
| Header state | `.is-scrolled` past 24px | the `24` |
| Hero drift | `--drift` (0 to −56px), `--dim` (1 to 0.25) | `0.85` viewport span, `56`, `0.75` |
| Step progression | `.is-active` on flow-panel `<li>` | `0.55` focal line |
| Reading head | `--head` per story paragraph | `0.88` / `0.32` band |

### 7–9. Pointer glow, click ripple, mobile nav
The pointer glow is the site's oldest interaction and the one worth protecting.
It writes `--pointer-x` / `--pointer-y` on `:root`, rAF-batched. Those are
**registered with `@property` in the CSS**, which is the only reason the glow
*transitions* to the cursor instead of snapping to it. Replace this with a
direct `background-position` write and you lose the trail.

### 10. View router
Internal links do not navigate. The destination's `<main>` is fetched, lifted,
and swapped in; **the URL bar never changes.** Every page still works as a real
URL when opened directly.

- `warm()` prefetches on `pointerover` and `focusin`. This, not the animation,
  is why transitions feel instant.
- `swapToUrl()` runs the fetch and the exit animation **concurrently**.
- The incoming `<main>` is inserted with inline `opacity: 0`, or the browser
  paints one frame at full opacity first.
- `swapToken` guards against a second click landing mid-swap.

**Known limitation, unfixed:** there is no `pushState` and no `popstate`
listener. After navigating in-page, the browser Back button leaves the site.

---

## 4. `field.js` — the canvas

Self-contained IIFE. Creates its own `<canvas>` and caption, mounts them as the
first child of `<body>` so everything after them in document order paints on
top. No `z-index` needed.

### The act table — edit this first
Lines 61–128. Five plain objects, one per act:

```js
{
  key: 'exfil',
  label: 'Token exfiltrated',                          // caption headline
  detail: 'Session still valid · no re-authentication due',
  tone: 'warn',          // 'ok' | 'warn' | 'off' — drives the caption dot colour
  endpoints: 3,          // how many receivers are radiating
  coherence: 1,          // 1 = ordered lattice, 0 = noise
  intensity: 1,          // overall brightness
  emitRate: 0.55,        // emission rings per second
  sourceDrift: 0,        // 0 = emitter present, 1+ = drifted off-screen
  token: 1,              // stolen-token opacity
  hue: 'threat',         // key into HUES
}
```

Every value between acts is interpolated with `smoothstep`, so editing these is
safe — you cannot produce a jump.

### How scroll picks the act
```js
const sel = ['.hero', '#products', '#story', '#difference', '#contact'];
```
Act boundaries are anchored to **real section offsets**, re-measured on resize,
`load`, and `fonts.ready`. Rename a section id and you must change it here too,
or the story silently stops running (`anchors` becomes `null` and the field
idles in act 1).

`CONFIG.focalRatio` (0.42) is where on screen the playhead sits.

### The interference maths
Every lattice point sums each source:
```
v = Σ sin((distance + advect) · k − t·ω + phase) / (1 + distance · falloff)
```
Then decoherence replaces order with noise:
```js
v = v * coherence + noise * (1 - coherence)
```
That second line is the whole "presence lost" effect. It is not a fade — each
point loses its shared phase reference and starts oscillating alone.

### The flow engine
`updateFlow(dt)` computes scroll velocity once per frame and does two jobs:

1. Feeds the canvas — `advect` (wavefronts dragged along), `streak` (dots
   elongate into lines), `shear` (lateral smear).
2. Writes `--flow-skew` and `--flow-stretch` onto every `.section`, each one
   lagging 6% more than the one above it, so a fast scroll ripples down the
   document rather than shearing it as a single plate.

**Native scroll is never intercepted.** No wheel handler. Find-in-page,
keyboard paging, and `position: sticky` all work normally.

Recovery uses a slower damping constant than onset — that asymmetry is what
makes it read as liquid rather than elastic.

### CONFIG — all the knobs
```js
spacing: 26,       // lattice pitch (px). Higher = sparser and cheaper.
maxAlpha: 0.4,     // THE LEGIBILITY DIAL. Lower this first if the field
                   // competes with your copy.
falloff: 0.0055,   // how fast amplitude decays with distance
advect: 0.30,      // how far scrolling drags the wavefronts
streak: 0.012,     // px of streak per px/s of scroll
skewMax: 0.85,     // deg — page shear ceiling. Set 0 to keep the fluid
                   // field but leave the layout rigid.
focalRatio: 0.42,
```

Measured cost: 0.45 ms/frame of maths at 1440×900, 1.12 ms at 2560×1440,
against a 16.7 ms budget.

### Public API
```js
window.WaveKeyField = { setView, remeasure, refreshTargets, velocity };
```
`script.js` calls `setView('home' | 'other')` and `refreshTargets()` after a
page swap. On non-home pages the field idles in act 1 — those pages are too
short to set the story up.

---

## 5. Common edits

**Change a colour** → one token in `:root`.

**Change the hero animation order** → `ENTER_ORDER` in `script.js`.

**Change the story copy** → `#story` in `index.html`. Word splitting is
automatic; just keep `data-read` on each `<p>` and keep them free of child
elements.

**Add a new section that reveals** → give it `class="section"`, put
`class="reveal"` on inner items if you want them staggered. Add its id to
`field.js`'s `sel` array only if it should own an act.

**Make the background quieter** → `CONFIG.maxAlpha` in `field.js`.

**Turn off the page shear but keep the field** → `CONFIG.skewMax: 0`.

**Turn the field off entirely** → remove the `<script src="field.js">` tag from
all four pages. Everything else keeps working; the shear simply stops (its
`var()` fallbacks are `0deg` and `1`).

**Change the reading speed** → `start`/`end` in the reading-head subscriber
(`script.js` §6). Wider band = slower read.

---

## 6. Rules that will bite you

1. **`querySelectorAll` never matches the scope element.** If a container both
   *is* the thing and *contains* the things, handle it explicitly.
2. **A `transition` shorthand resets `transition-delay` to `0s`.** Restating
   `transition` later in the file silently kills any stagger set earlier.
3. **Specificity, not order, decides.** `.section.reveal` (0,2,0) beats
   `.section` (0,1,0) regardless of which comes later. Setting
   `transform: none` in the more specific rule stripped the shear from every
   section on the site.
4. **Split before you reveal, or handle the race.** Containers set
   `data-revealed="1"`; `applySplits()` checks for it and releases lines whose
   container already fired.
5. **Anything hidden by JS must be hidden before first paint.** `prepareView()`
   is synchronous for exactly this reason.
6. **Registered `@property` values need Safari 16.4+.** Below that the pointer
   glow is static. Everything else degrades cleanly.

---

## 7. Accessibility invariants

Do not break these:

- `prefers-reduced-motion` disables **all** of it — splitting, shear, field
  animation, glow, ripple. The field renders one static frame.
- `html:not(.js-ready)` shows everything at full opacity, so a JS failure
  leaves a readable page rather than a blank one.
- `--head`'s `99` fallback does the same for story text.
- Global `:focus-visible` ring. The form deliberately does **not** set
  `outline: none`.
- Skip link on every page; every `<main>` carries `id="top"` so the anchor
  survives a router swap.

---

## 8. Testing without a browser

`node --check script.js && node --check field.js` catches syntax errors.

Beyond that, the four jsdom suites written during this build (execution, router,
field acts, reading head) are not in this repo — they lived in a scratch
directory. If you want them permanently, ask and they can be added under
`test/` with an npm script. They caught four real bugs, so they earned their
keep.

**What none of it covers:** how any of this looks. There is no layout engine in
jsdom, so line splitting always measures one line, and nothing verifies that
the field is legible behind your copy. That still needs your eyes.
