# Redesign pass — what changed

Visual and motion only. No copy was altered on any page.

## Preserved deliberately

- **The pointer-tracked ambient glow.** `@property --pointer-x` / `--pointer-y`,
  the `.bg-glow` rule, its `0.9s` transition, and the rAF-batched `pointermove`
  handler are all intact. Only the gradient's alpha (0.12 → 0.09) and stop
  (44% → 46%) were retuned for the darker background.
- **The WaveKey mark.** `∞` glyph, wordmark, and the inline SVG favicon are
  untouched.
- **All pill radii** (header, brand mark, buttons, presence badge, step index).
- **The in-place view router**, other than the one-line base-path fix below.

## Removed

| Effect | Why |
|---|---|
| `.noise` overlay | Soft-light dot grid at 0.18 opacity; texture for its own sake |
| `.section::before` signal sweep | A scan line on every section arrival is one metaphor too many |
| `.tilt-card` 3D tilt | Competed with the ambient glow for the same pointer input |
| `page-enter` on header/footer | Site chrome should not animate in |
| `presence-ping` on icon badges and step indices | The concept now appears once, on the hero dot, where it means something |
| `scroll-snap-type: y proximity` | Fought scroll momentum; blocked the continuous-scroll feel |
| Hidden scrollbar | Removed the user's only scroll-position feedback |
| Card `box-shadow` and button `translateY` lift | Replaced with surface/opacity changes |
| `backdrop-filter: blur(12px)` on cards | Frosted glass is off-direction; blur kept on the header only |

Twelve animated behaviours across four homepage sections, down to five.

## Palette

`--line` moved from `rgba(255,255,255,0.2)` to `0.09`. This is the single
largest contributor to the change in feel — the old hairlines read as visible
grey boxes. `--bg` deepened `#0c1019` → `#06070b`, and the body's grey radial
wash was replaced with a much subtler top vignette. All one-off `rgba(255,255,255,x)`
values across the stylesheet were consolidated onto tokens; two new tokens,
`--faint` and `--line-hover`, were added.

## Type and space

Headings dropped to weight 500 with tighter tracking (`-0.035em` on `h1`).
Section padding went from a flat `5.2rem` to `clamp(6rem, 11vw, 10rem)`, and
the hero to `clamp(8rem, 16vh, 12rem)`. The Google Fonts request was trimmed
from five weights to three; 300 and 700 were never used.

## Structure

The product cards are now a hairline-divided panel rather than three separate
tiles. The grid's own background supplies the dividers and stays translucent,
so the ambient glow still reads through the cards — an opaque card background
would have occluded it.

## Dead code removed

`.hero.panel` set `border-radius: 30px` and a border colour, but the later
`section.panel` rule zeroed the border *width* and the background. Specificity
gave `.hero.panel` the radius and `section.panel` the transparency, so the hero
rendered a 30px radius on an invisible, borderless, transparent box. The `panel`
class was dropped from the hero and the reset rule deleted.

## Accessibility

- Global `:focus-visible` ring on links, buttons, inputs, and textareas. The
  previous `.contact-form input:focus { outline: none }` was a WCAG 2.4.7 failure.
- "Skip to content" link on all five pages; every `<main>` now carries `id="top"`
  so the anchor survives a router view swap.
- `--muted` and `--faint` were both set at alphas that clear 4.5:1 against the
  new background (≈6.2:1 and ≈5.1:1 by calculation — worth confirming with a
  contrast checker in the browser).

## Bug fix — outside the design scope

`handleInternalLinkClick` resolved the homepage as `` `${destination.origin}/index.html` ``.
On GitHub Pages the site lives under `/WaveKeySite/`, so that URL 404s, the
`catch` fires, and `window.location.assign()` sends the visitor to
`sachinlu26.github.io/index.html` — off the site. Every "back to home" link from
Contact or any product page was affected. Now resolved with
`new URL('index.html', destination)`.


---

# Pass 2 — motion layer rebuild

Pass 1 fixed how the site *looks*. This pass fixes how it *moves*, which was
the actual complaint. Four things were wrong, all diagnosable from the code.

## 1. Every reveal was the same block fade

`opacity 0 → 1` plus a 22px lift, applied uniformly to every element on the
page. Uniform motion is what reads as templated.

Headings and lead paragraphs are now **split into lines at render time** and
each line is pushed up out of a clipping mask, staggered 85ms apart. This is
the single largest perceptual change in the build.

Two details that are easy to get wrong and are handled:

- **Splitting waits on `document.fonts.ready`.** Measuring line breaks against
  Inter's fallback metrics gives wrap points that are wrong the moment Inter
  arrives, so the mask boundaries land mid-line. A 1200ms timeout ensures a
  stalled font request can never leave the page blank.
- **`overflow: hidden` shears descenders** (g, y, p). The `padding-bottom` /
  negative `margin-bottom` pair on `.line` gives them room.

Body copy travels a shorter distance and settles in 0.72s against a heading's
0.95s, so a paragraph never reads as slower than the headline above it.

## 2. Page transitions had a dead gap

The old `swapToUrl` awaited the network, *then* faded out (320ms), *then*
faded in (460ms). Click to content was latency plus 780ms of nothing.

- Destinations are now **prefetched on `pointerover` and `focusin`**, so the
  response is usually already cached before the click lands. Most of the
  perceived speed of a good transition is this, not the animation.
- The fetch and the exit animation now **run concurrently**.
- The incoming `<main>` is inserted with inline `opacity: 0`. Previously the
  browser painted one frame of it at full opacity before the entrance
  animation's first keyframe landed.
- Exit adds a 3px blur alongside the fade, on a different curve
  (`0.65, 0, 0.35, 1`) than the entrance (`0.16, 1, 0.3, 1`). Symmetrical
  in/out easing is a common tell of default styling.

## 3. Nothing was scroll-linked

Everything was a binary in-view trigger at threshold 0.16, so elements popped
at a fixed point regardless of scroll velocity. Added, all through a single
passive listener and one rAF loop:

- **Hero drift.** The hero translates up 56px and dims to 25% across the first
  85vh of scroll, tying the first gesture to the page rather than sliding
  content past a static block.
- **Step progression.** The three flow-panel steps light in sequence as the
  section crosses a focal line at 55% viewport height, with the left column
  pinned on desktop. The three-step story now reads as a progression.
- **Header state.** Condenses past 24px: tighter padding, brighter border,
  a drop shadow, and the brand mark shrinks.

Reveal thresholds also moved from `0.05 / -12%` so elements commit slightly
before reaching the fold, which removes the pop at speed.

## 4. Nothing was choreographed

The hero arrived as one block. It now sequences — eyebrow, presence badge,
headline (whose own per-line stagger nests inside the sequence and consumes
proportionally more of the timeline), lead, buttons, micro-note. Same
treatment on each product page hero.

## Bugs found and fixed during this pass

- **`querySelectorAll` never matches the scope element itself.** Product pages
  carried `class="reveal"` on `<main>`, which is also the `.section`. It was
  given the hidden state but never observed, so the entire page body would
  have sat at `opacity: 0`. The whole-page fade has been dropped (it is exactly
  the block fade this pass removes) and `setupReveals` now checks the scope
  element too.
- **Flash of visible content.** Reveal classes were applied after
  `document.fonts.ready`, so content painted fully visible, snapped to
  `opacity: 0`, then faded back in. Hiding is now synchronous and pre-paint;
  only the measuring work waits on fonts.
- **Split-after-reveal race.** If the IntersectionObserver fired before a
  heading was split, its lines would park below the mask permanently.
  Containers now record `data-revealed`, and `applySplits` releases lines
  whose container has already fired.
- **`pointerenter` does not bubble.** Prefetch warming uses `pointerover`.

## Testing performed

Executed in jsdom across index, contact, and a product page: no runtime
errors; headline text is byte-identical after splitting; all reveal targets
receive `visible`; the entrance sequence completes. The router was exercised
from contact → home: one fetch total (the hover prefetch was reused), title
and `<h1>` update correctly, lines rebuild, and no hard navigation occurs.

jsdom has no layout engine, so `offsetTop` is always 0 and every heading
measures as a single line. **The line-splitting maths itself is therefore
untested** — it is correct by construction but nobody has watched a
three-line headline wrap. Check that first.

---

# Pass 3 — the Presence Field

`field.js` (self-contained, ~470 lines, no dependencies) draws a scroll-driven
canvas behind the whole site. It is not wallpaper. It runs WaveKey's argument
as a five-act sequence anchored to the homepage sections.

| Act | Section | Readout | What the field does |
|---|---|---|---|
| 1 | Hero | Presence verified | One emitter, one endpoint. Coherent standing interference, green tint, emission rings pulsing outward at ~0.5 Hz |
| 2 | Products | Coverage extended | Endpoints multiply to three — app, SDK, browser — inside the same single field |
| 3 | Why it matters | Token exfiltrated | A stolen credential drifts in from the right and settles among the endpoints. **The field does not react.** MFA already fired hours ago. This is the gap |
| 4 | Why it matters (latter half) | Presence lost | The emitter drifts off the left edge. Amplitude falls, the lattice loses its shared phase reference and starts decohering into noise |
| 5 | CTA | Session terminated | Coherence collapses to 0.02, the field goes dark, and the stolen token is expelled off-screen with it |

## Why interference and not "some waves"

Every lattice point sums the contribution of each source:
`Σ sin(d·k − ωt + φ) / (1 + d·falloff)`. That is a fair caricature of what the
product actually measures — an acoustic channel between an emitter and a set of
verifying endpoints. Crests take the presence tint; troughs stay neutral, which
keeps the pattern readable rather than a flat colour wash.

Decoherence is the honest part. When presence is lost, the field does not
simply fade. Each point loses its shared phase reference and begins
oscillating independently: `v = v·coherence + noise·(1−coherence)`. Order
becomes noise. That is what losing a verification channel looks like, and it
is visually distinct from "someone turned the brightness down".

## The readout

A pattern nobody can read is decoration. A small caption pins itself
bottom-left and names the current state — "Presence verified · Continuous
acoustic channel · 19.5–21 kHz", through to "Session terminated · Token
invalidated across providers" — with a status dot that shifts green → amber →
grey.

This is the piece that converts the background from atmosphere into a demo.
An investor scrolling the page watches the failure mode happen and get closed,
with the mechanism named as it goes.

## Engineering

- Act boundaries are **anchored to real section offsets**, re-measured on
  resize, load, and `fonts.ready`. If the copy in a section grows, the story
  still lands on the right words.
- Parameters ease toward their act targets with a frame-rate-independent
  critically-damped step, so a fast scroll never snaps the field between
  states.
- One `requestAnimationFrame` loop, paused on `visibilitychange`.
- Canvas is the first child of `<body>`, so it paints beneath everything after
  it in document order. No `z-index` needed.
- Below 780px the readout is hidden and the field drops to 55% opacity: the
  interference pattern is not legible at that pitch and would only cost battery.
- `prefers-reduced-motion` renders **one static coherent frame** and stops. No
  loop, no story, no state changes. Toggling the setting live is handled.
- On contact and product pages the field idles in act 1. Those pages are too
  short to set the story up, and a contact form that dramatically terminates
  your session while you fill it in would be an odd choice.
- The router calls `WaveKeyField.setView()` after a swap.

### Measured performance

Per-frame field maths, benchmarked directly (draw calls excluded):

| Viewport | Dots | Maths |
|---|---|---|
| 1440×900 | 2,052 | 0.45 ms |
| 2560×1440 | 5,700 | 1.12 ms |
| 390×844 | 300 | 0.06 ms |

Against a 16.7 ms budget. Roughly 1,500 `fillRect` calls per frame at 1440×900
after the alpha cull, which should add another 1–2 ms. Comfortable on desktop.
**Not measured on real hardware** — see the caveat at the end.

### Testing performed

Driven through a full simulated scroll in jsdom with a recording canvas stub.
The five acts fire in the correct order at the correct anchors; 447,626
`fillRect` calls across 286 frames produced zero non-finite coordinates, zero
`NaN` fill styles, and zero out-of-range alpha values. No runtime errors. The
line-splitting and router suites still pass unchanged.

### First things to tune

1. **`CONFIG.maxAlpha`** (currently `0.4`). This is the legibility dial. If the
   field competes with the copy, lower it before changing anything else.
2. **`CONFIG.spacing`** (`26`). Tighter reads as a denser instrument and costs
   more; looser reads as sparser and calmer.
3. **`CONFIG.focalRatio`** (`0.42`). Where on screen the act playhead sits. Raise
   it if the state changes feel like they arrive too early.
4. The act table at the top of `field.js` is plain data. Every target value —
   coherence, intensity, emission rate, tint — is editable without touching the
   render loop.

---

# Pass 4 — de-boxed and fluid

## Every rectangle is gone

Not softened, removed. Audited: the only remaining `border` declarations in
the stylesheet belong to the brand mark, the presence dot's pulse ring, the
primary button pill, and the click ripple — all circles. Zero rectangles. On
the canvas, `strokeRect` count is now zero: endpoint markers and the stolen
token are circles.

Removed: the product card panel and its dividers, all three card boxes, the
flow-step boxes, the feature-list boxes, the CTA panel, the contact page's two
panels, the product page panel, the icon badge boxes, the ghost button
outline, the nav toggle outline, the presence badge pill, the mobile nav
panel, the readout pill, the skip-link outline, and the footer's edge.

What replaced them:

- **The header** is no longer a floating pill. It sits flush at `top: 0` with
  no border, and its backdrop is a gradient that dissolves downward under a
  `mask-image`, fading in only past 24px of scroll. Nothing on the page
  terminates in a hard line.
- **Contact fields** are underlines, not boxes, with 1.6rem between them.
- **The footer rule** is a gradient hairline that fades to transparent at both
  ends rather than spanning edge to edge.
- **The step accent bar** is likewise a gradient that dissolves top and bottom.
- **Icon badges** are now just the glyph at 1.65rem, brightening on hover.
- **Separation is space.** Product grid gap went from 1px to
  `clamp(2.6rem, 5vw, 4.5rem)`; feature list to `1.4rem 2.4rem`; contact shell
  to `clamp(3rem, 6vw, 6rem)`.
- **Flow steps** now express state through type weight and colour rather than a
  filled box — the inactive steps sit at `--muted` and resolve to `--text` as
  each becomes active.

## Scroll velocity drives the page

One shared velocity signal, computed once per frame in `field.js`, feeds
everything. **Native scrolling is not intercepted.** No wheel handler, no
transform-based scroll hijack. Find-in-page, keyboard paging, trackpad
momentum, and `position: sticky` all behave exactly as the OS intends — which
is the trade a lerped-scroll library asks you to give up, and it isn't worth it
on a page an investor might Ctrl+F.

What the velocity does instead:

- **Sections shear.** Each `.section` takes a `skewY` proportional to velocity,
  with each successive section lagging 6% more than the one above it, so a fast
  scroll ripples down the document rather than shearing it as one plate.
- **Type shears less than layout.** Inner blocks counter-shear at 55%. Full
  cancellation would leave nothing to see; none would shear the copy as hard as
  the frame. Residual on text stays under 0.4° even at maximum velocity.
- **Recovery is slower than onset.** Different damping constants each way, so
  the page settles rather than snapping back. That asymmetry is the difference
  between elastic and liquid.
- **The field advects.** Wavefront phase accumulates with scroll and keeps
  drifting after the scroll stops — the medium carries momentum.
- **Dots become streaks.** Above a walking pace each lattice point elongates
  along the direction of travel, up to 34px. The field stops reading as a grid
  and starts reading as something moving through frame.
- **The lattice smears laterally** in a slow standing wave whose amplitude
  rises with speed, so the medium visibly shears rather than sliding rigidly.

### Measured response

| Input | Velocity | Section shear |
|---|---|---|
| Steady scroll | 1,796 px/s | 0.62° |
| Hard flick | 5,000 px/s | 0.84° (cap 0.85°) |

Settle after the scroll stops: 0.60° at 0.25s, 0.22° at 0.50s, 0.02° at 1.00s,
zero by 1.3s — a clean exponential decay, no oscillation.

The first-pass constants were wrong: they saturated every effect at ordinary
scroll speeds, because a normal trackpad flick is 1500–3000 px/s and the gains
had been set for a tenth of that. Recalibrated so typical scrolling lands
mid-range and only a hard flick reaches the ceiling.

## Cascade bugs found and fixed

Four, all introduced by layering the flow system onto the existing rules:

- `.section.reveal` (specificity 0,2,0) set `transform: none`, which outranked
  the `.section` shear rule (0,1,0). Every revealed section — that is, all of
  them — would have had the shear silently stripped.
- Restating the `transition` shorthand later in the file **resets
  `transition-delay` to zero**. The reveal stagger was being dropped.
- `.flow-panel li:hover` (0,2,1) outranks the flow rule, so it had to carry the
  skew itself or hovering a step would flatten it.
- The reduced-motion override didn't cover the `.section.reveal` variant.

## Tuning knobs

All at the top of `field.js` under `// --- Flow ---`:

`skewPerVel` and `skewMax` control how much the page shears. `streak` and
`streakMax` control how far dots elongate. `shear` controls the lateral smear.
`advect` controls how far scrolling drags the wavefronts. Set `skewMax: 0` to
keep the fluid field but leave the layout rigid.

---

# Pass 5 — story, reading illumination, on-page Request Access

## The reading illumination

Story copy is split into words at runtime, each carrying its index as `--i`.
The paragraph carries a `--head` that advances with scroll. Every word's
opacity then resolves from a single `calc()`:

```
opacity: clamp(0.16, calc(0.16 + (var(--head, 99) - var(--i, 0)) * 0.32), 1);
```

So JavaScript writes **one property per paragraph per frame** and the browser
does all the per-word work. 140 words across five paragraphs cost five style
writes, not 140.

The `--head` fallback of `99` matters: with JavaScript disabled, or before the
first scroll event fires, every word is fully lit. Text must never depend on a
script to be readable.

**The first calibration was wrong**, and the test caught it. Driving progress
by the paragraph's own height meant a short paragraph went from cold to fully
lit across about 200px of scroll, which reads as a flash rather than as
reading. Progress is now measured against a fixed reading band spanning 88% to
32% of viewport height, plus 60% of the paragraph's height so long paragraphs
aren't rushed. Measured on a 22-word paragraph at 900px viewport:

| Scroll | Words lit |
|---|---|
| 1100 | 0 / 22 |
| 1400 | 5 / 22 |
| 1550 | 12 / 22 |
| 1700 | 19 / 22 |
| 1850 | 22 / 22 |

Roughly 600px of scroll to read a paragraph. Under `prefers-reduced-motion` no
splitting happens at all and the text is simply text.

## The story section

A new `#story` section sits between the products and the mechanism. Five
paragraphs, one per act of the field behind them:

> A sign-in is a photograph. It proves who was at the keyboard in one moment.
> It proves nothing about the next one.
>
> The standards accept this. NIST SP 800-63B allows a session to run for twelve
> hours at its highest assurance level before anyone is asked to prove
> themselves again. That window is not an oversight. It is the honest limit of
> what a single check can do.
>
> An attacker holding a stolen session token does not need to defeat the second
> factor. They only need to arrive after it.
>
> WaveKey spends that window asking a different question. Not who signed in,
> but whether the person who signed in is still there.
>
> A phone answers continuously, in a band above hearing. When the answer stops,
> the session stops with it, terminated at the provider rather than cleared on
> the device.

Two deliberate choices in that copy. The last clause distinguishes termination
at the provider from clearing a local session, because conflating those is the
single most damaging error available in this pitch. And no invented statistics
appear anywhere: the only number is the NIST reauthentication interval.

**Verify the NIST claim before this goes near an investor.** It is stated from
knowledge, not from a fetched source, and it is the load-bearing fact of the
section.

## Field re-anchored

The five acts now map one-to-one onto the new section order, and the awkward
midpoint split of the old "why" section is gone:

`.hero` → verified · `#products` → coverage · `#story` → token exfiltrated
(the copy is literally about the stolen token) · `#difference` → presence lost
· `#contact` → session terminated.

## Request Access

`contact.html` is deleted. The form now lives at `#contact` on the homepage,
laid out per the reference: eyebrow with a status dot, oversized display
heading, large type-scale field labels with amber required-markers, a
two-column Phone / Email row, and a full-width submit.

**One deliberate exception to the no-boundaries pass.** Form fields are soft
fills (`rgba(255,255,255,0.038)`, 10px radius) rather than nothing at all. An
input with no edge whatsoever gives the user no target to aim at, and a form is
the one place where affordance beats restraint. There are still no *borders* in
it. If you disagree, the fill is one declaration.

The submit button uses `--text` rather than the reference's gold. Introducing a
second accent for one button would undo the palette discipline from pass 1.

Dead `.contact-*` rules were removed from the stylesheet, and the router no
longer carries a `contact` view.

### Verified

All four pages parse, and **every file link and every fragment anchor resolves**
— checked programmatically, including `../index.html#contact` from the product
pages against the actual set of ids on the homepage. Word splitting preserves
paragraph text exactly. The router still swaps product page → home with a
single prefetched fetch and no hard navigation.

---

## Known issues NOT addressed

- **The router pushes no history.** No `pushState`, no `popstate` listener. After
  navigating home → contact in-page, the browser Back button leaves the site.
  On an investor-facing site that is a poor first impression. Fixing it means
  either adding history management or dropping the in-place routing.
- **The Request Access form still posts to `mailto:` with
  `enctype="text/plain"`.** Rebuilding its layout did not fix its plumbing.
  Chrome and most modern browsers handle this badly or not at all; where it
  does work it opens the user's mail client with a raw text body. **An investor
  who fills in that form is quite likely sending you nothing.** Formspree,
  Basin, or a Cloudflare Worker would each fix it in under an hour. This is the
  highest-value hour of work left in the repository.
- **The form promises a privacy policy that does not exist.** The note reads
  "processed in line with our privacy policy" with no link, because there is no
  page to link to. For a UK company collecting names, emails, and phone numbers,
  that page is a legal requirement, not a nicety. Write it, then link it.
- **Deleting `contact.html` breaks any existing link to that URL.** If the
  address has been shared anywhere, add a stub that redirects to
  `index.html#contact`.
- **No visual verification was performed on this build.** There is no browser
  in the environment it was produced in — an attempt to install Chromium
  failed on missing Ubuntu packages. The JS was executed in jsdom against a
  recording canvas stub, the maths was benchmarked, and the CSS parses with
  balanced braces. But **nobody has seen a single pixel of the presence field**.
  Its composition, density, tint, and legibility behind text are unverified.
  Budget an hour to tune it.
- **Safari below 16.4 has no `@property` support**, so the ambient glow falls
  back to a static gradient there. The line reveals and everything else work.
