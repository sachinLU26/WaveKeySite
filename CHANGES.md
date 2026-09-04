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

# Pass 6 — restructured to the pitch narrative

The page is now six sections: **hero → working with → how it works → the
problem and the gap → the solution → request access**. The old products grid,
`#story` and `#difference` sections are gone; the three products now live
inside the Software-first pillar of the solution section, and the three product
pages are unchanged and still linked.

## Hero

Removed: the "Presence Security Layer" kicker and the closing "One deliberate
user action…" line. "Session actively verified" became **"Presence assured
security"**, green dot retained.

New headline: *"An inaudible signal that protects the sign-in, the session and
every sensitive action."* Small line beneath the buttons: *"Ultrasonic MFA ·
Passive, on-demand authentication."* Primary button is now **Request Access**.

Two alternates if that headline is not the one:

- *"Above hearing. Across the whole session."* — shorter, more assertive, but
  it drops the "sensitive actions" third of the coverage claim.
- *"Your phone proves you are there. The sign-in, the session and every
  sensitive action."* — clearer mechanism, less elegant.

## Working with

A masked, continuously scrolling marquee. Two identical sets translating -50%,
so the seam is invisible. Pauses on hover and on focus-within. Under reduced
motion the animation stops, the mask is dropped, and the duplicate set is
hidden from the accessibility tree rather than being read twice.

The UKRI Innovate UK logo was converted from the supplied JPEG into a
transparent white PNG (`assets/ukri-innovate-uk.png`, 484×160, 12KB): alpha is
derived from the ink's darkness so the white background drops out entirely.
The knocked-out "UKRI" letters stay knocked out, which is correct.

## How it works

Three stages from the slide, with the scroll-linked progression previously
attached to the old flow panel now driving them: each stage lights in turn as
the section crosses the focal line, with a gradient rule down its left edge.
Verified passing through all three in order.

The JS hook is now generic: `[data-progress]` on any container, its children
become the sequence.

## The problem and the gap

One section, four beats:

1. **Reading-illuminated prose** carrying the argument, including the insider
   angle you asked for: people stay signed in on purpose, leave a laptop
   unlocked for a colleague, skip the step that costs ten minutes every
   morning. *"Nobody in that story is malicious. They are busy."* Then:
   *"Friction is the reason controls get bypassed. Remove the friction and the
   reason goes with it."*
2. **Three figures** — 0 / 8.6bn / 82%, with sources.
3. **A pull line** — *"Modern MFA secured the login. Attackers moved to the
   session."*
4. **The gap** — $23.4bn / 20.9% / 0.

Figures are set as large numerals over a hairline that fades out to the right.
No boxes, consistent with pass 4.

## The solution

Three numbered steps, the patents line, and three pillars: Passive on-demand,
Presence-enforced, Software-first. The product pages are linked from the third.

## JS and CSS follow-through

Reveal groups repointed to `.stage`, `.figure`, `.pillar`, `.steps li`. The
flow counter-shear list and the reduced-motion resets were updated to match, or
the new blocks would have sheared as hard as their containers. `ENTER_ORDER`
gained `.hero-meta`. Field acts re-anchored to
`['.hero', '#how', '#problem', '#solution', '#contact']`, which now maps
one-to-one with no midpoint fudge:

| Section | Act |
|---|---|
| hero | Presence verified |
| how | Coverage extended (login, session, sensitive actions) |
| problem | Token exfiltrated |
| solution | Presence lost (the device leaves, the signal stops) |
| contact | Session terminated |

Verified firing in order across a simulated scroll. Dead `.flow-panel`,
`.product-grid` and `.card` rules removed.

### Verified

All four pages parse; every file link and fragment anchor resolves, checked
programmatically — which caught three `../index.html#products` links left
pointing at a section that no longer exists. Zero runtime errors on the
homepage and on a product page. 135 words split for reading illumination
across four paragraphs, 20 reveal targets all firing, 6 figures, 3 stages,
2 marquee sets.

---

# Pass 7 — type scale unification, alignment fix, hero art

## The type scale

Before this pass, eleven components had each picked their own `clamp()`
independently. The audit: **nine differently-sized headings with no
declared relationship to each other**, two real hierarchy inversions, and
eyebrow-style labels ranging from 0.68rem to 0.82rem with letter-spacing from
0.02em to 0.16em for what is visually the same kind of text throughout the
page.

The two inversions, found by literally listing every `font-size` in the
file and sorting them:

- **The Request Access heading was the single biggest text on the site**
  (5.5rem max) — bigger than the homepage `h1` (4.8rem max). A repeated
  section heading outranking the hero headline is a hierarchy error a
  designer would catch on sight.
- **The hero's own lead paragraph had no explicit size** and sat at the
  browser default (1rem), while the story prose two sections later ran up to
  1.6rem. The less important text was reading larger than the more important
  text.

Twelve tokens now live in `:root`, and every `font-size` in the stylesheet
resolves to one of them:

```
--text-2xs   0.68rem                              source lines, fine print
--text-xs    0.72rem                              every eyebrow / kicker / label
--text-sm    0.9rem                                form notes, breadcrumbs
--text-base  1rem                                  default reading size
--text-md    clamp(0.98rem, 0.9rem + 0.4vw, 1.1rem)   buttons, list emphasis
--text-lg    clamp(1.1rem, 1rem + 0.7vw, 1.45rem)     component headings
--text-xl    clamp(1.3rem, 1.1rem + 1.2vw, 1.9rem)    form field labels
--text-lead  clamp(1.05rem, 0.98rem + 0.5vw, 1.25rem) hero lead, sub-heads
--display-sm clamp(1.6rem, 1.2rem + 2.4vw, 2.3rem)    pull quotes, sub-titles
--display-md clamp(1.8rem, 1.2rem + 3.4vw, 2.8rem)    h2 — every section heading
--display-lg clamp(2.2rem, 1.1rem + 6vw, 4.6rem)      h1 — the one biggest thing
--display-stat clamp(2.6rem, 1.4rem + 5.2vw, 4rem)    figure numbers, Request Access
```

Request Access now sits on `--display-stat`, the same tier as the figure
numbers — big, but never bigger than the hero. The hero lead is now
`--text-lead`. `.pull` and `.sub-title` were two separately-chosen clamps that
happened to be nearly identical by coincidence; both now reference
`--display-sm` explicitly, so they can never drift apart again. Every
eyebrow/label across the page — `.kicker`, `.presence-badge`,
`.hero-meta`, `.stage-label`, `.figure-label`, `.patent-note` — is now
`--text-xs` at a consistent `0.16em` tracking.

**Change one token and it moves everywhere that tier is used.** That is the
actual fix, not the specific numbers — the numbers are a reasonable starting
point, not a final answer.

## The alignment bug

`.story` (the four paragraphs under "The problem") carried
`margin-left: auto`, which right-aligned that block against every other
left-aligned element on the page — the section heading above it, the figures
below it. It produced a visible zig-zag left edge scrolling through
`#problem`. This was a leftover from an earlier layout where that text sat
beside the canvas's emitter graphic; it no longer applies to the current
one-column layout and has been removed. `.story` now shares the same left
edge as everything else on the page, at `max-width: 58ch`.

## Hero art

Your uploaded image is now the background art for the hero, as a masked
accent on the right rather than stretched full-bleed. **The source file is
360×1330 (originally under 100KB re-exported as an optimised JPEG at
720×2660, 95KB).** That is far too low-resolution to stretch across an entire
desktop viewport — doing so would need a ~4× upscale and look visibly soft.
Instead it sits in a fixed-width column (`clamp(260px, 32vw, 520px)`) on the
right of the hero, double-masked so it fades to nothing on its left edge and
top/bottom — no visible rectangle, consistent with the no-boxes pass. Hidden
below 900px, where there isn't room for it beside the headline without
crowding the text.

**This is explicitly the placeholder you asked for.** Swap
`assets/hero-field.jpg` for a proper high-resolution export and nothing else
needs to change — the CSS scales to whatever you provide. If you want it
full-bleed across the whole hero eventually, that needs a source image at
least 1600px wide or the softness will be visible even behind the mask.

### Verified

All four pages still parse; every file link and fragment anchor still
resolves. Zero runtime errors. Reveal, entrance, act-sequence and stage-
progression suites all still pass unchanged — this pass touched sizes,
alignment and one new image, not structure or behaviour.

### One process note, in the interest of not hiding a mistake

Three of these edits were lost on the first attempt: a Python patch script
raised an assertion error partway through and exited before its `write_text`
call, so two "successful"-looking edits earlier in that same script were
silently never saved to disk. A later audit — listing every remaining
hardcoded `font-size` in the file — caught all three, and they're now
correctly applied and verified in the final grep. Flagging this because the
same class of mistake could hide a future edit; the audit step is now worth
keeping as a habit, not a one-off.

---

# Pass 8 — real logos in the marquee

The five "Working with" entries were styled text (`Sprintworks`,
`OneLogin`, etc.). They are now your actual uploaded logos, all converted to
white silhouettes so a red disc, a navy wordmark, and a plain wordmark read as
one consistent monochrome voice instead of a row of clashing brand colours —
same treatment as the UKRI mark from pass 6.

## Conversion, and the mistake in the middle of it

Each source was RGB with a flat background (black, navy, or white) and no
real transparency. The approach: sample the background colour from the four
corners, then set alpha by each pixel's colour distance from it — far from
the background becomes opaque white, close to it becomes transparent.

That's simple, and it is genuinely the correct approach here, but it took
two wrong turns to get back to it, worth recording because the failure mode
is instructive:

1. **First attempt** used exactly this method and looked right for
   Sprintworks and Barclays, but produced a solid white disc for PA and
   OneLogin's icon marks with their letters/numeral rendered as legible dark
   cutouts. I misread that as an inversion bug.
2. **"Fixing" it** by switching to a border-flood-fill (only remove
   background pixels actually connected to the image edge, so enclosed
   same-coloured regions survive as opaque) fixed nothing that was broken and
   broke what wasn't: it filled in the letter counters of "sprintworks" and
   "BARCLAYS" — the holes in every p, a, o, e — because those counters are
   background-coloured pixels enclosed by ink, geometrically identical to
   PA's enclosed letters. The two cases are visually indistinguishable by
   pixel connectivity alone; only meaning distinguishes them, and pixels
   don't carry meaning.
3. **Reverted to the first method for all four.** A dark cutout numeral
   inside a white disc is a legible, standard silhouette treatment — it was
   never actually broken. I was looking for a bug that wasn't there for two
   of the four logos and introduced a real one trying to fix it.

Each output was visually inspected before being accepted this time, not just
generated and assumed correct.

## What's in the marquee now

Sprintworks, Barclays | Eagle Labs, PA Consulting, OneLogin, and UKRI Innovate
UK — five images, same treatment, one shared height so each keeps its own
aspect ratio (wordmarks render wide, the two icon marks render closer to
square, which is correct and not a sizing inconsistency).

`.logo-item` no longer carries any text styling — font-size, colour, and
letter-spacing rules were dead code once every entry became an image. Removed.
Opacity dropped slightly at rest (0.62, was 0.72/0.85 split across two now-
merged rules) since five real logos read as more visually present than five
words did at the same opacity.

### Verified

All four pages still parse, every link and anchor still resolves, zero
runtime errors, both marquee sets (visible + duplicate for the seamless loop)
still present.

### One thing worth a look

`assets/logo-onelogin.png` is the wordmark and the icon **stacked vertically
in one image**, because that's how it was supplied. In a single-row marquee
at a shared 2rem height, that means OneLogin's wordmark renders smaller than
the other four wordmarks at the same visual height, since it's sharing that
height with the icon above it. If it reads as too small once you see it
rendered, the fix is a five-minute crop — split it into a wordmark-only PNG
for the marquee — not a redesign.

---

# Pass 9 — final hero image, and the problem/solution copy trim

## Hero image swap

The placeholder from pass 7 (360×1330, visibly soft under any real
enlargement) is replaced with your new upload (1584×2816). Re-exported at
1040×1848 — full source resolution isn't needed since the image never
renders wider than its column, and doubling the column's max width covers
retina displays without shipping the full 1584px original.

Because the resolution problem that justified keeping the image small and
heavily masked is gone, the column widened
(`clamp(300px, 40vw, 640px)`, was `clamp(260px, 32vw, 520px)`) and got
brighter (opacity 0.78, was 0.6). The fade masks stay — a hard-edged
rectangle would still look wrong regardless of source quality — but the
transition is now more gradual (edges pushed from 30%/85% to 38%/92%) since a
sharper image can afford a longer, more visible presence before it dissolves.
It's still a right-hand accent column, not a full-bleed background: at
1040px wide it would still need roughly a 1.4× upscale to cover a large
desktop viewport, and more importantly a full-bleed treatment would sit
directly behind the headline and compete with it for contrast.

## Problem section — compressed to scannable

Per your supplied brief:

- **H2**: "Attackers are not breaking in, they are resuming a session..."
  → **"Attackers don't break in. They hijack trusted sessions."**
- **Story**: four long narrative paragraphs (the photograph metaphor, the key
  in the door, the friction argument) → four one-line statements ending on
  "WaveKey exists to close that session gap." The reading-illumination effect
  is untouched — it operates on whatever text is inside `[data-read]`, so it
  needed no code change, only shorter content. Word count for that block:
  135 → 49.
- **Figures 1**: labels and notes tightened per your brief — "Easy to
  acquire" → "Stolen session tokens", "No hacking required" → "No malware
  needed", notes shortened to single sentences. Numbers (0, 8.6bn, 82%) and
  sources unchanged.
- **The gap**: sub-heading tightened, and all three metric labels replaced
  ("The market" → "Identity spend at login", "The shift" → "Shift to
  zero-trust", "The gap" → "Products covering both") with the shorter notes
  you supplied. Numbers and sources unchanged.

## Solution section — trimmed per brief

- **H2** sharpened to name the mechanism: "...with continuous, presence-based
  MFA."
- **Three steps** shortened to your exact phrasing — "signal", "authenticates
  you", "Sign-in" replacing "Login".
- **Three pillar descriptions** replaced with your single-line versions.
- **Patent note**: "2 patents · more filing" → "2 patents granted or pending
  · more filing underway" — meaningfully different claim (see the flag from
  pass 6 about this line: if these are still applications rather than
  granted patents, "granted or pending" is accurate where "2 patents" alone
  was not).

### Verified

All four pages still parse, every link and anchor still resolves, zero
runtime errors. Reveal count and marquee/stage/figure counts confirmed
unchanged in structure (still 3 stages, 6 figures, 2 marquee sets); the
`[data-read]` paragraph count is unchanged at 4, word count dropped from 135
to 49 as expected from the trim.

---

# Pass 10 — sixth marquee logo (Parker Neal)

Added your Parker Neal mark to both marquee sets, positioned after OneLogin.
Same conversion method as the other five: colour-distance alpha from the
sampled corner background, recoloured to white. The source already sat on a
near-black background with high-contrast ink (a purple/magenta monogram and a
white wordmark), so this was a straightforward case — no repeat of the
enclosed-glyph issue from pass 8, since nothing in this mark is the same
colour as its own background. Visually inspected before accepting: the "P"
and "R" counters and the monogram's negative space all read correctly.

The marquee is now six logos: Sprintworks, Barclays | Eagle Labs, PA
Consulting, OneLogin, Parker Neal, UKRI Innovate UK.

### Verified

Both marquee sets confirmed at 6 entries each (12 `.logo-item` spans total).
All four pages still parse, every link and anchor still resolves, zero
runtime errors.

---

# Pass 11 — hero integration and the centred gap heading

## The image looked pasted on because it was

Two separate causes, and the mask was not one of them.

**Structural.** `.hero-art` was `position: absolute; inset: 0 0 0 auto` — a
panel floating over the section, bleeding to the viewport's right edge and
running up under the sticky header, with no relationship to the content
column beside it. It is now a real second column of a hero grid
(`1.15fr / 0.85fr`), aligned to the same content width as everything else on
the page. That alone fixes most of the disjointedness.

**Material.** A rectangular JPEG cannot dissolve into a page, however far its
edges are faded — the interior is still an opaque rectangle of near-black
sitting on near-black. Measured: the page background is luminance ~6.8 and the
image's median luminance is 7.8, so roughly half of that picture was
duplicating the background it sat on while still reading as a distinct panel.

The asset now carries **an alpha channel baked from its own luminance**
(`assets/hero-field.webp`, 680×1208, 304KB): dark pixels become genuinely
transparent, bright arcs stay opaque. ~20% of the image is now fully
transparent. A `<picture>` element serves it with the JPEG (95KB) as fallback
for browsers without WebP-alpha (pre-Safari 14).

### Two failures on the way there, both caught by looking

1. First alpha build was **blotchy** in the dark regions. Cause: the
   un-premultiply step (`rgb = original / alpha`) amplifies sensor noise
   without bound as alpha approaches zero, and lossy alpha compression then
   quantised that noise into visible patches. Fixed by capping the gain at
   2.5× — those regions are nearly invisible anyway, so recovering their exact
   colour was not worth the artefacts.
2. First size pass produced a **2.9MB PNG / 1.2MB WebP**. The dotted texture is
   high-entropy and compresses badly. Settled at 680px wide, 304KB, after
   confirming visually that 740/680/640 were indistinguishable at display size.

304KB is still the heaviest asset on the page. If that matters more than the
effect, the JPEG path is one line away.

## The gap heading

`.section-head-sub` is now centred, with `.sub-title` capped at 30ch and
`margin-inline: auto`. The lone "Products covering both / 0" figure beneath it
is removed per your edit, and the `.figures-single` rule that existed only to
serve it has been deleted rather than left as dead CSS.

### Verified

All four pages parse; every link, anchor and asset path resolves including the
new `srcset`. Zero runtime errors. Reveal count 28 (was 29 — the removed
figure), acts and stage progression still firing in order.

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
- **The hero image is now your final higher-resolution upload**, no longer a
  placeholder — the note above about a 720px-wide asset being too soft no
  longer applies.
- **Every statistic on the page is unverified by me.** The 0 / 8.6bn / 82% and
  $23.4bn / 20.9% / 0 figures were transcribed from your slides exactly as
  given, with your attributions. All of them post-date my knowledge and none
  was fetched from a source in this session. The Gartner and SpyCloud numbers
  in particular will be checked by any technical investor. Confirm each against
  the primary document before this is public.
- **"0 products protecting both login and session" is an assertion, not a
  citation.** Your slide carried no source for it, so it is attributed to
  "WaveKey analysis" rather than borrowing the Gartner credit sitting beside
  it. A reviewer who finds one counter-example will treat the whole figures
  block as unreliable, so either narrow the claim or be ready to defend it.
- **"2 patents · more filing" needs to be exactly true.** If these are
  applications rather than granted patents, "patents" is the wrong word and it
  is the kind of thing diligence checks first.
- **"Working with" is doing heavy lifting for five named organisations.**
  Sprintworks, OneLogin, PA Consulting, Barclays Eagle Labs and Innovate UK
  each imply a different relationship — accelerator, grant, pilot, customer,
  integration target. Label it for whatever is actually true and get written
  permission for each mark. The wrong label here is a legal problem, not a
  design one.
- **Four of the five logos are wordmarks, not logos.** Only UKRI had an asset
  to work from. Replace the others with real SVGs once you have permission.
- **The UKRI mark has been recoloured to monochrome white.** UKRI publishes
  official reversed versions and their brand guidelines generally prohibit
  altering the logo. Use their supplied white version instead of mine.
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
