/* ===========================================================================
   WaveKey — Presence Field
   ---------------------------------------------------------------------------
   A scroll-driven canvas that runs WaveKey's argument as a five-act sequence,
   synchronised to the sections of the homepage.

     ACT 1  hero        PRESENCE VERIFIED    one phone source, one endpoint,
                                             coherent standing interference
     ACT 2  products    COVERAGE EXTENDED    endpoints multiply — app, SDK,
                                             browser — same single field
     ACT 3  why         TOKEN EXFILTRATED    a stolen credential drifts in.
                                             The field does not react, because
                                             MFA already fired hours ago. This
                                             is the gap the product exists for.
     ACT 4  why (late)  PRESENCE LOST        the phone drifts out of range,
                                             amplitude falls, the lattice
                                             starts to decohere
     ACT 5  cta         SESSION TERMINATED   coherence collapses, the field
                                             goes dark, and the stolen token is
                                             expelled with it

   The interference pattern is not decorative: it is two acoustic sources
   summed at every lattice point, which is a fair caricature of what the
   product actually measures.

   Everything below is behind the content at low alpha. If it ever competes
   with the copy, lower CONFIG.maxAlpha rather than deleting the file.
   =========================================================================== */

(function () {
  'use strict';

  const CONFIG = {
    spacing: 26,        // lattice pitch in CSS px (desktop)
    spacingMobile: 36,
    maxAlpha: 0.4,      // ceiling on any dot's opacity
    dotMax: 2.6,        // px
    waveLength: 62,     // px between wavefronts
    waveSpeed: 1.9,     // rad/s
    falloff: 0.0055,    // amplitude decay per px from source
    ringSpeed: 190,     // px/s
    dprCap: 2,
    focalRatio: 0.42,   // where on screen the "playhead" sits

    // --- Flow ---------------------------------------------------------
    advect: 0.30,       // how far scrolling drags the wavefronts
    streak: 0.012,      // px of streak per px/s of scroll velocity
    streakMax: 34,      // ceiling on streak length
    shear: 0.012,       // lateral smear per px/s
    skewMax: 0.85,      // deg — page shear ceiling
    skewPerVel: 0.00035,
    stretchMax: 0.022,
  };

  /* --- Acts -------------------------------------------------------------
     Each act is a set of target values. Live parameters ease toward the
     current act's targets, so the transitions between them are continuous
     rather than stepped.
     --------------------------------------------------------------------- */

  const ACTS = [
    {
      key: 'verified',
      label: 'Presence verified',
      detail: 'Continuous acoustic channel · 19.5–21 kHz',
      tone: 'ok',
      endpoints: 1,
      coherence: 1,
      intensity: 0.85,
      emitRate: 0.5,
      sourceDrift: 0,
      token: 0,
      hue: 'presence',
    },
    {
      key: 'coverage',
      label: 'Coverage extended',
      detail: 'One field · app, SDK, browser',
      tone: 'ok',
      endpoints: 3,
      coherence: 1,
      intensity: 1,
      emitRate: 0.55,
      sourceDrift: 0,
      token: 0,
      hue: 'presence',
    },
    {
      key: 'exfil',
      label: 'Token exfiltrated',
      detail: 'Session still valid · no re-authentication due',
      tone: 'warn',
      endpoints: 3,
      coherence: 1,
      intensity: 1,
      emitRate: 0.55,
      sourceDrift: 0,
      token: 1,
      hue: 'threat',
    },
    {
      key: 'lost',
      label: 'Presence lost',
      detail: 'Emitter out of range · amplitude falling',
      tone: 'warn',
      endpoints: 3,
      coherence: 0.28,
      intensity: 0.55,
      emitRate: 0.1,
      sourceDrift: 1,
      token: 1,
      hue: 'threat',
    },
    {
      key: 'terminated',
      label: 'Session terminated',
      detail: 'Token invalidated across providers',
      tone: 'off',
      endpoints: 3,
      coherence: 0.02,
      intensity: 0.1,
      emitRate: 0,
      sourceDrift: 1.6,
      token: 0,
      hue: 'neutral',
    },
  ];

  const HUES = {
    presence: [126, 242, 192],
    threat: [244, 186, 122],
    neutral: [200, 206, 220],
  };

  /* --- Environment ------------------------------------------------------ */

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  /* --- DOM -------------------------------------------------------------- */

  const canvas = document.createElement('canvas');
  canvas.className = 'presence-field';
  canvas.setAttribute('aria-hidden', 'true');

  const readout = document.createElement('div');
  readout.className = 'field-readout';
  readout.setAttribute('aria-hidden', 'true');
  readout.innerHTML =
    '<span class="field-readout-dot"></span>' +
    '<span class="field-readout-text">' +
    '<span class="field-readout-label"></span>' +
    '<span class="field-readout-detail"></span>' +
    '</span>';

  const labelEl = readout.querySelector('.field-readout-label');
  const detailEl = readout.querySelector('.field-readout-detail');

  function mount() {
    document.body.insertBefore(canvas, document.body.firstChild);
    document.body.appendChild(readout);
  }

  const ctx = canvas.getContext('2d', { alpha: true });

  /* --- Lattice ---------------------------------------------------------- */

  let W = 0;
  let H = 0;
  let dpr = 1;
  let grid = [];
  let jitter = [];

  function buildLattice() {
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = W < 700 ? CONFIG.spacingMobile : CONFIG.spacing;
    const cols = Math.ceil(W / step) + 1;
    const rows = Math.ceil(H / step) + 1;

    grid = new Float32Array(cols * rows * 2);
    jitter = new Float32Array(cols * rows * 2);

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Slight offset per row: a perfect square grid reads as a spreadsheet.
        grid[i * 2] = c * step + (r % 2 ? step * 0.5 : 0);
        grid[i * 2 + 1] = r * step;
        jitter[i * 2] = Math.random() * Math.PI * 2;
        jitter[i * 2 + 1] = 0.5 + Math.random() * 0.5;
        i++;
      }
    }
    gridCount = i;
  }

  let gridCount = 0;

  /* --- Scroll → act ------------------------------------------------------
     Act boundaries are anchored to real section offsets where they exist, so
     the story lands on the matching copy regardless of how long any section
     grows. Falls back to even division if the anchors are missing (product
     and contact pages), which is why those pages simply idle in act 1.
     --------------------------------------------------------------------- */

  let anchors = null;
  let storyEnabled = false;

  function measureAnchors() {
    if (!storyEnabled) {
      anchors = null;
      return;
    }
    const sel = ['.hero', '#products', '#difference', '.cta-panel'];
    const tops = sel.map((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY;
    });
    if (tops.some((t) => t === null)) {
      anchors = null;
      return;
    }
    const docEnd = document.documentElement.scrollHeight;
    // Five acts, four section anchors: acts 3 and 4 share the "why" section,
    // split at its midpoint, because that is where the copy turns from the
    // problem to the mechanism.
    const whyMid = tops[2] + (tops[3] - tops[2]) * 0.5;
    anchors = [tops[0], tops[1], tops[2], whyMid, tops[3], docEnd];
  }

  function actPosition() {
    if (!anchors) return 0;
    const focal = window.scrollY + window.innerHeight * CONFIG.focalRatio;
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      if (focal < b || i === anchors.length - 2) {
        const t = clamp((focal - a) / Math.max(b - a, 1), 0, 1);
        return clamp(i + t, 0, ACTS.length - 1);
      }
    }
    return 0;
  }

  /* --- Flow: scroll velocity ---------------------------------------------
     One shared velocity signal drives everything fluid: the field's advection
     and streaking, and the page's shear. Native scrolling is never
     intercepted — this only reads it.
     --------------------------------------------------------------------- */

  const flow = {
    y: 0,          // last scroll position
    vel: 0,        // instantaneous px/s
    smooth: 0,     // damped px/s — what everything actually reads
    advected: 0,   // accumulated drag on the wavefronts
    skew: 0,
    stretch: 1,
  };

  let flowTargets = [];

  function collectFlowTargets() {
    flowTargets = [...document.querySelectorAll('.section')];
  }

  function updateFlow(dt) {
    const y = window.scrollY;
    const raw = (y - flow.y) / Math.max(dt, 0.0001);
    flow.y = y;

    // Heavy damping on the way in, so a single wheel notch reads as a swell
    // rather than a spike.
    const ease = 1 - Math.pow(0.0009, dt);
    flow.vel = raw;
    flow.smooth = lerp(flow.smooth, raw, ease);

    // Wavefronts are dragged along by the scroll and keep drifting after it
    // stops, the way a liquid carries momentum.
    flow.advected += flow.smooth * dt * CONFIG.advect;

    const targetSkew = clamp(flow.smooth * CONFIG.skewPerVel, -CONFIG.skewMax, CONFIG.skewMax);
    const targetStretch = 1 + clamp(Math.abs(flow.smooth) * 0.000012, 0, CONFIG.stretchMax);

    // Recovery is slower than onset: the page settles rather than snapping
    // back, which is the difference between elastic and liquid.
    const settle = 1 - Math.pow(0.004, dt);
    flow.skew = lerp(flow.skew, targetSkew, settle);
    flow.stretch = lerp(flow.stretch, targetStretch, settle);

    if (Math.abs(flow.skew) < 0.002 && flow.stretch < 1.0002) {
      flow.skew = 0;
      flow.stretch = 1;
    }

    // Each section lags slightly more than the one before it, so a fast
    // scroll ripples down the document instead of shearing it as one plate.
    for (let i = 0; i < flowTargets.length; i++) {
      const lag = 1 - i * 0.06;
      const k = lag < 0.55 ? 0.55 : lag;
      flowTargets[i].style.setProperty('--flow-skew', (flow.skew * k).toFixed(4) + 'deg');
      flowTargets[i].style.setProperty('--flow-stretch', (1 + (flow.stretch - 1) * k).toFixed(5));
    }
  }

  function clearFlow() {
    flow.skew = 0;
    flow.stretch = 1;
    flowTargets.forEach((el) => {
      el.style.removeProperty('--flow-skew');
      el.style.removeProperty('--flow-stretch');
    });
  }

  /* --- Live parameters --------------------------------------------------- */

  const live = {
    endpoints: 1,
    coherence: 1,
    intensity: 0.85,
    emitRate: 0.5,
    sourceDrift: 0,
    token: 0,
    hue: HUES.presence.slice(),
  };

  function targetsFor(pos) {
    const i = Math.floor(pos);
    const f = smoothstep(pos - i);
    const a = ACTS[clamp(i, 0, ACTS.length - 1)];
    const b = ACTS[clamp(i + 1, 0, ACTS.length - 1)];
    const ha = HUES[a.hue];
    const hb = HUES[b.hue];
    return {
      endpoints: lerp(a.endpoints, b.endpoints, f),
      coherence: lerp(a.coherence, b.coherence, f),
      intensity: lerp(a.intensity, b.intensity, f),
      emitRate: lerp(a.emitRate, b.emitRate, f),
      sourceDrift: lerp(a.sourceDrift, b.sourceDrift, f),
      token: lerp(a.token, b.token, f),
      hue: [lerp(ha[0], hb[0], f), lerp(ha[1], hb[1], f), lerp(ha[2], hb[2], f)],
      act: f < 0.5 ? a : b,
    };
  }

  /* --- Sources ----------------------------------------------------------- */

  // The emitter: the user's phone. Orbits slowly while present, then drifts
  // off the left edge as presence is lost.
  function emitterAt(t, drift) {
    const bx = W * 0.26 - drift * W * 0.55;
    const by = H * 0.46;
    return {
      x: bx + Math.cos(t * 0.23) * W * 0.02,
      y: by + Math.sin(t * 0.31) * H * 0.03,
    };
  }

  const ENDPOINT_POS = [
    [0.74, 0.34],
    [0.83, 0.6],
    [0.66, 0.74],
  ];

  function endpointsAt(count) {
    const out = [];
    for (let i = 0; i < ENDPOINT_POS.length; i++) {
      const strength = clamp(count - i, 0, 1);
      if (strength <= 0.01) continue;
      out.push({ x: ENDPOINT_POS[i][0] * W, y: ENDPOINT_POS[i][1] * H, s: strength });
    }
    return out;
  }

  /* --- Rings ------------------------------------------------------------- */

  const rings = [];
  let emitAccumulator = 0;

  function updateRings(dt, emitter, rate) {
    emitAccumulator += dt * rate;
    while (emitAccumulator >= 1) {
      emitAccumulator -= 1;
      rings.push({ x: emitter.x, y: emitter.y, r: 6, life: 0 });
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.r += CONFIG.ringSpeed * dt;
      ring.life += dt;
      if (ring.life > 3.4) rings.splice(i, 1);
    }
  }

  /* --- Stolen token ------------------------------------------------------
     Drifts in from the right during act 3, sits inside the field unchallenged
     through act 4 — the whole point being that nothing stops it — and is
     expelled when the session terminates.
     --------------------------------------------------------------------- */

  const token = { x: 0, y: 0, vx: 0, vy: 0, ejected: false, spin: 0 };
  let tokenPrev = 0;

  function updateToken(dt, amount, endpoints) {
    token.spin += dt * 0.6;

    if (amount > 0.02 && tokenPrev <= 0.02) {
      token.x = W * 1.08;
      token.y = H * 0.28;
      token.ejected = false;
    }

    if (amount > 0.02 && !token.ejected) {
      const target = endpoints[0] || { x: W * 0.74, y: H * 0.4 };
      const dx = target.x + W * 0.06 - token.x;
      const dy = target.y - H * 0.02 - token.y;
      token.x += dx * dt * 0.55;
      token.y += dy * dt * 0.55 + Math.sin(token.spin * 2) * 0.25;
    }

    // Termination: the drop-off in `amount` is the eject trigger.
    if (tokenPrev > 0.4 && amount <= 0.4 && !token.ejected) {
      token.ejected = true;
      token.vx = W * 0.55;
      token.vy = -H * 0.18;
    }

    if (token.ejected) {
      token.x += token.vx * dt;
      token.y += token.vy * dt;
      token.vy += H * 0.12 * dt;
    }

    tokenPrev = amount;
  }

  /* --- Readout ----------------------------------------------------------- */

  let readoutKey = null;

  function updateReadout(act) {
    if (!storyEnabled) {
      readout.classList.remove('is-on');
      return;
    }
    readout.classList.add('is-on');
    if (act.key === readoutKey) return;
    readoutKey = act.key;
    labelEl.textContent = act.label;
    detailEl.textContent = act.detail;
    readout.dataset.tone = act.tone;
  }

  /* --- Render ------------------------------------------------------------ */

  function render(t) {
    ctx.clearRect(0, 0, W, H);

    const emitter = emitterAt(t, live.sourceDrift);
    const eps = endpointsAt(live.endpoints);
    const [hr, hg, hb] = live.hue;

    const k = (Math.PI * 2) / CONFIG.waveLength;
    const omega = CONFIG.waveSpeed;
    const coh = live.coherence;
    const decoh = 1 - coh;
    const intensity = live.intensity;

    // Emitter counts as a source; each endpoint re-radiates. The interference
    // between them is what "verified presence" looks like.
    const sources = [{ x: emitter.x, y: emitter.y, s: 1 }].concat(eps);
    const norm = 1 / sources.length;

    // Scroll velocity turns discrete points into elongated streaks. Above a
    // walking pace the field stops reading as a grid of dots and starts
    // reading as something moving through the frame.
    const vel = flow.smooth;
    const streak = clamp(Math.abs(vel) * CONFIG.streak, 0, CONFIG.streakMax);
    const streakDir = vel >= 0 ? 1 : -1;
    const shearAmp = clamp(Math.abs(vel) * CONFIG.shear, 0, 26);
    const advect = flow.advected;

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < gridCount; i++) {
      const px = grid[i * 2];
      const py = grid[i * 2 + 1];

      // Lateral smear: the lattice is dragged sideways in a slow standing
      // wave whose amplitude rises with scroll speed, so the medium visibly
      // shears rather than sliding rigidly.
      const sx = px + Math.sin(py * 0.006 + t * 0.5) * shearAmp;
      const sy = py + Math.cos(px * 0.005 - t * 0.4) * shearAmp * 0.4;

      let v = 0;
      for (let s = 0; s < sources.length; s++) {
        const src = sources[s];
        const dx = sx - src.x;
        const dy = sy - src.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const amp = src.s / (1 + d * CONFIG.falloff);
        v += Math.sin((d + advect) * k - t * omega + s * 0.9) * amp;
      }
      v *= norm;

      if (decoh > 0.001) {
        // Decoherence: the lattice loses its shared phase reference and each
        // point starts oscillating on its own. Visually, order becomes noise.
        const nz = Math.sin(t * 1.4 * jitter[i * 2 + 1] + jitter[i * 2]);
        v = v * coh + nz * decoh * 0.55;
      }

      const mag = Math.abs(v);
      const alpha = mag * CONFIG.maxAlpha * intensity;
      if (alpha < 0.012) continue;

      const size = 0.7 + mag * CONFIG.dotMax;
      // Streaks trail behind the direction of travel.
      const len = size + streak * mag;
      // Crests take the presence tint; troughs stay neutral, which keeps the
      // pattern legible instead of a flat colour wash.
      const warm = v > 0 ? 1 : 0.25;
      ctx.fillStyle =
        'rgba(' +
        Math.round(lerp(230, hr, warm * 0.85)) + ',' +
        Math.round(lerp(234, hg, warm * 0.85)) + ',' +
        Math.round(lerp(242, hb, warm * 0.85)) + ',' +
        alpha.toFixed(3) + ')';
      ctx.fillRect(
        sx - size * 0.5,
        streakDir > 0 ? sy - size * 0.5 : sy - len + size * 0.5,
        size,
        len
      );
    }

    // Emission rings.
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const fade = clamp(1 - ring.life / 3.4, 0, 1);
      const a = fade * fade * 0.18 * intensity;
      if (a < 0.004) continue;
      ctx.strokeStyle = 'rgba(' + Math.round(hr) + ',' + Math.round(hg) + ',' + Math.round(hb) + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    // Endpoint markers.
    for (let i = 0; i < eps.length; i++) {
      const ep = eps[i];
      const a = 0.28 * ep.s * intensity;
      ctx.strokeStyle = 'rgba(' + Math.round(hr) + ',' + Math.round(hg) + ',' + Math.round(hb) + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Emitter marker.
    if (live.sourceDrift < 0.98) {
      const a = 0.3 * (1 - live.sourceDrift);
      ctx.strokeStyle = 'rgba(' + Math.round(hr) + ',' + Math.round(hg) + ',' + Math.round(hb) + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(emitter.x, emitter.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Stolen token.
    const tokenAlpha = token.ejected
      ? clamp(1 - (token.x - W) / (W * 0.35), 0, 1) * 0.7
      : live.token * 0.7;
    if (tokenAlpha > 0.01) {
      ctx.save();
      ctx.translate(token.x, token.y);
      ctx.rotate(token.spin);
      ctx.strokeStyle = 'rgba(244, 132, 108,' + tokenAlpha.toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.moveTo(-4.2, -4.2);
      ctx.lineTo(4.2, 4.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* --- Loop --------------------------------------------------------------- */

  let t = 0;
  let last = 0;
  let running = false;
  let rafId = null;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    updateFlow(dt);

    const pos = actPosition();
    const target = targetsFor(pos);

    // Critically-damped ease toward the act targets. Scrolling fast should
    // not make the field snap between states.
    const e = 1 - Math.pow(0.0016, dt);
    live.endpoints = lerp(live.endpoints, target.endpoints, e);
    live.coherence = lerp(live.coherence, target.coherence, e);
    live.intensity = lerp(live.intensity, target.intensity, e);
    live.emitRate = lerp(live.emitRate, target.emitRate, e);
    live.sourceDrift = lerp(live.sourceDrift, target.sourceDrift, e);
    live.token = lerp(live.token, target.token, e);
    live.hue[0] = lerp(live.hue[0], target.hue[0], e);
    live.hue[1] = lerp(live.hue[1], target.hue[1], e);
    live.hue[2] = lerp(live.hue[2], target.hue[2], e);

    const emitter = emitterAt(t, live.sourceDrift);
    updateRings(dt, emitter, live.emitRate);
    updateToken(dt, live.token, endpointsAt(live.endpoints));
    updateReadout(target.act);

    render(t);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || motionQuery.matches) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function renderStill() {
    clearFlow();
    // Reduced motion: one calm, coherent frame. No loop, no state changes.
    const a = ACTS[0];
    live.endpoints = a.endpoints;
    live.coherence = a.coherence;
    live.intensity = a.intensity * 0.8;
    live.sourceDrift = 0;
    live.token = 0;
    live.hue = HUES.presence.slice();
    rings.length = 0;
    render(0);
    readout.classList.remove('is-on');
  }

  /* --- Wiring ------------------------------------------------------------- */

  function setView(view) {
    storyEnabled = view === 'home';
    readoutKey = null;
    rings.length = 0;
    token.ejected = false;
    tokenPrev = 0;
    // The other pages are short, so they idle in act 1 rather than racing
    // through a termination sequence the copy never sets up.
    live.endpoints = 1;
    live.coherence = 1;
    live.intensity = 0.85;
    live.token = 0;
    live.sourceDrift = 0;
    live.hue = HUES.presence.slice();
    requestAnimationFrame(() => {
      collectFlowTargets();
      measureAnchors();
      if (motionQuery.matches) renderStill();
    });
  }

  function onResize() {
    buildLattice();
    collectFlowTargets();
    measureAnchors();
    if (motionQuery.matches) renderStill();
  }

  let resizeTimer = null;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 140);
    },
    { passive: true }
  );

  // Section heights change as reveals fire and fonts land; re-measure cheaply.
  window.addEventListener('load', measureAnchors);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAnchors);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!motionQuery.matches) start();
  });

  motionQuery.addEventListener('change', () => {
    if (motionQuery.matches) {
      stop();
      renderStill();
    } else {
      start();
    }
  });

  function init() {
    mount();
    buildLattice();
    collectFlowTargets();
    flow.y = window.scrollY;
    setView(
      /\/(contact|byo-app|sdk|chrome-plugin)\.html$/.test(window.location.pathname) ? 'other' : 'home'
    );
    if (motionQuery.matches) renderStill();
    else start();
    root.classList.add('field-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // script.js calls this after a router view swap so the field knows whether
  // to run the story or idle.
  window.WaveKeyField = {
    setView,
    remeasure: measureAnchors,
    refreshTargets: collectFlowTargets,
    velocity: () => flow.smooth,
  };
})();
