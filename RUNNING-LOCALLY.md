# Running WaveKeySite locally

## Why you cannot just double-click index.html

`script.js` swaps page content in place by `fetch()`-ing the destination HTML.
Browsers block `fetch()` on `file://` URLs, so opening the file directly puts the
site permanently in its fallback mode: every internal link becomes a full page
reload. The site still works, but you will not be testing what actually ships.

Serve it over HTTP instead. Any of these will do.

## Option A — Python (nothing to install)

From the repository root:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

Windows, if `python3` is not on PATH:

```powershell
py -m http.server 8080
```

## Option B — Node

```bash
npx serve -l 8080 .
```

## Option C — VS Code

Install the "Live Server" extension, right-click `index.html`, choose
**Open with Live Server**. It also reloads on save, which is useful while you
are tuning values.

## What to check before pushing

Motion first — that is what changed most.

1. **Headline line reveal.** Hard-reload the homepage. The h1 should arrive
   line by line, each line rising out of a mask, roughly 85ms apart. If all
   lines move together, the split did not run. If lines break in visibly wrong
   places, the split measured before Inter loaded — check the Network tab for
   a slow font request.

2. **Descenders.** Look closely at the "g" in "sign-in" and the "y" in "your
   way" on the BYO App page. If they are shaved flat, the `.line` padding
   compensation needs raising above `0.14em`.

3. **Resize.** Drag the window narrower so the headline rewraps to a different
   number of lines. After ~180ms it should re-split silently, still visible.
   Height-only changes (mobile URL bar) must *not* trigger a rebuild.

4. **Page transition.** Hover "Contact" for a moment, then click. It should
   feel effectively instant — the prefetch fires on hover. Then try clicking
   without hovering first (keyboard: Tab to it, press Enter) and compare. In
   DevTools → Network, throttle to Slow 3G and confirm the exit animation
   still plays rather than the page hanging on a blank main.

5. **Hero drift.** Scroll down slowly from the top. The hero should lift and
   dim as it leaves. It should feel attached to the scroll, not triggered by it.

6. **Step progression.** Scroll through "From sign-in certainty to session
   certainty". The left column pins, and steps 01 / 02 / 03 should light in
   sequence with a green bar sliding down the left edge of each.

7. **Header.** It should tighten and gain a shadow past ~24px of scroll, and
   the ∞ mark should shrink slightly.

8. **Ambient glow.** Move the cursor slowly. The light should *trail* the
   pointer with visible lag, not stick to it. Safari below 16.4 has no
   `@property` support and will show a static glow — expected.

9. **Keyboard.** Tab from the very top. A "Skip to content" pill slides down.
   Every link, button, and form field shows a visible ring.

10. **Reduced motion.** DevTools → Rendering → *Emulate CSS
    prefers-reduced-motion: reduce*, then hard-reload. No line splitting, no
    drift, no glow, no ripple, everything visible immediately. Toggling it
    live should also un-split the headings without a reload.

11. **No-JS.** Disable JavaScript and reload. Every page must render fully
    visible — the `html:not(.js-ready)` guard exists for this.

12. **The presence field.** Scroll the homepage top to bottom slowly and watch
    the caption bottom-left. It should walk: Presence verified → Coverage
    extended → Token exfiltrated → Presence lost → Session terminated, each
    landing while you are reading the matching section. Watch for the amber
    token drifting in during "Why it matters" and getting flung off-screen when
    the field collapses.

    If the field is too loud behind the copy, lower `CONFIG.maxAlpha` at the top
    of `field.js` — that is the first dial, before touching anything else.

    Open DevTools → Performance and record a scroll. The field should hold 60fps
    on desktop; if it does not, raise `CONFIG.spacing` from 26 to 32.

13. **Field on other pages.** Visit Contact. The field should idle calmly in
    act 1 with no caption and no termination sequence.

14. **The shear.** Flick-scroll the homepage hard, then stop dead. Sections
    should lean into the direction of travel and settle back over roughly a
    second, with sections further down lagging slightly behind the ones above.
    If the type itself looks distorted rather than the composition, lower
    `CONFIG.skewPerVel` or `CONFIG.skewMax`; set `skewMax: 0` to keep the fluid
    field and leave the layout rigid.

15. **Streaking.** During a fast scroll the field's dots should elongate into
    streaks trailing the direction of travel, then relax back to points when
    you stop. If they smear too far, lower `CONFIG.streak`.

16. **No boxes.** Scan every page for a rectangle. There should not be one —
    only circles (the brand mark, the presence dot, the primary button pill,
    the click ripple). If you find a rectangle, it is a leftover.

17. **Sticky under transform.** The `.section` shear makes each section a
    containing block. Confirm the left column of "From sign-in certainty to
    session certainty" still pins correctly while you scroll past it, in both
    Chrome and Safari. This is the single most likely thing to misbehave.

18. **Reading illumination.** Scroll slowly through "Everything happens after
    the sign-in." Words should light left to right as they cross the reading
    band, roughly 600px of scroll per paragraph. If it feels like a flash,
    widen the band in `script.js` (`start`/`end` in the reading-head
    subscriber). Then disable JavaScript and reload: every word must be fully
    lit, not dim.

19. **Request Access.** It is now a section on the homepage at `#contact`.
    Check that "Contact" and "Book a demo" in the header scroll there smoothly
    from the top of the homepage, and that the same links from a product page
    swap back to home *and then* scroll to the form.

    Then actually submit it and watch what happens. It posts to `mailto:` and
    will most likely do nothing useful. Fix that before sending this to anyone.

20. **The marquee.** Logos should scroll continuously with no visible seam
    when the loop wraps. Hover it: the scroll should pause. Check the UKRI
    logo reads cleanly white on the dark background and is not a grey slab.

21. **Stage progression.** Scroll through "How it works". Stages 1, 2 and 3
    should light in order with a green rule down the left edge, one at a time.

22. **Console + Network.** No errors, no 404s.

## Deploying

Unchanged. Push to `main`; `.github/workflows/deploy-pages.yml` publishes the
repository root to GitHub Pages. There is no build step.
