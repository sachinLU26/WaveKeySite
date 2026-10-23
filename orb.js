/* ===========================================================================
   WaveKey — Why-It-Matters Orb
   ---------------------------------------------------------------------------
   Replaces the static why_it_matters.webp with a live particle sphere,
   adapted from the Three.js reference in assets/why-it-matters-orb-reference.html
   (see assets/why-it-matters-orb-design.md) into a dependency-free 2D canvas
   so it matches the rest of the site's hand-rolled canvas work (field.js)
   instead of pulling in a ~600KB WebGL library for one decorative shape.

   The particle field, wave-displacement equations and rotation speeds are
   carried over numerically from the Three.js source; only the renderer
   changed. Points are additive-blended ('lighter'), which is order
   independent, so there is no need to depth-sort the cloud every frame.

   Pausing: script.js already toggles `.problem-art.is-paused` while the
   section is off-screen (one shared scroll driver, see setupScrollEffects).
   This file just watches that class instead of adding a second observer.
   =========================================================================== */

(function () {
  'use strict';

  const CONFIG = {
    particleCount: 7000,
    numLayers: 9,
    rMin: 28,
    rMax: 72,
    camDist: 230,
    dprCap: 1.75,
    renderFps: 30,
    pointSize: 2.2,
    waveAmplitude: 0.78, // tones the reference's wave sum down from a spiky burst to a folded, ball-like surface at this particle density
    waveSpeedScale: 0.8, // elapsed time -> wave time, matches the Three.js source's `t`
  };

  const cGold = [255, 189, 89];
  const cOrange = [255, 81, 30];
  const cCoral = [214, 34, 44];
  const cRuby = [198, 40, 206];
  const cViolet = [104, 40, 176];
  const cIndigo = [44, 32, 94];

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerpRGB = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  // Same three-band palette as the reference: amber/gold rim, coral/orange
  // mid ridge, indigo/violet core — with a ruby bias at the poles.
  function particleColor(layerNorm, yNorm) {
    let c;
    if (layerNorm > 0.65) {
      c = lerpRGB(cOrange, cGold, (layerNorm - 0.65) / 0.35);
    } else if (layerNorm > 0.3) {
      c = lerpRGB(cCoral, cOrange, (layerNorm - 0.3) / 0.35);
    } else {
      c = lerpRGB(cIndigo, cViolet, layerNorm / 0.3);
    }
    const poleBias = Math.abs(yNorm);
    if (poleBias > 0.5) {
      c = lerpRGB(c, cRuby, (poleBias - 0.5) * 0.7);
    }
    return c;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let canvas, container, ctx;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let pxPerUnit = 1;

  /* --- Particle field ----------------------------------------------------
     Positions, depth and polar coordinates are static per particle — only
     the wave displacement and the shared rotation angles change per frame —
     so everything that doesn't change is computed once here.
     --------------------------------------------------------------------- */

  let count = 0;
  let baseX, baseY, baseZ, baseR, baseU, baseV, depthOf, fillOf;

  function buildParticles() {
    const n = CONFIG.particleCount;
    baseX = new Float32Array(n);
    baseY = new Float32Array(n);
    baseZ = new Float32Array(n);
    baseR = new Float32Array(n);
    baseU = new Float32Array(n);
    baseV = new Float32Array(n);
    depthOf = new Float32Array(n);
    fillOf = new Array(n);

    const perLayer = Math.floor(n / CONFIG.numLayers);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    let idx = 0;

    for (let L = 0; L < CONFIG.numLayers; L++) {
      const layerNorm = L / (CONFIG.numLayers - 1);
      const layerR = CONFIG.rMin + Math.pow(layerNorm, 0.8) * (CONFIG.rMax - CONFIG.rMin);
      const countInLayer = L === CONFIG.numLayers - 1 ? n - idx : perLayer;

      for (let k = 0; k < countInLayer; k++) {
        if (idx >= n) break;

        const yNorm = 1 - (k / (countInLayer - 1 || 1)) * 2;
        const rAtY = Math.sqrt(Math.max(0.001, 1 - yNorm * yNorm));
        // A small random offset on top of the golden-angle spiral — without
        // it, the lattice is regular enough that at this particle count it
        // resolves into visible spiral arms (worst at near-polar viewing
        // angles) instead of reading as an even, fluffy shell.
        const theta = goldenAngle * k + (Math.random() - 0.5) * 0.22;
        const rJitter = 1 + (Math.random() - 0.5) * 0.05;

        const x = Math.cos(theta) * rAtY * layerR * rJitter;
        const y = yNorm * layerR * rJitter;
        const z = Math.sin(theta) * rAtY * layerR * rJitter;
        const r = Math.sqrt(x * x + y * y + z * z) || 1;

        baseX[idx] = x;
        baseY[idx] = y;
        baseZ[idx] = z;
        baseR[idx] = r;
        baseU[idx] = Math.atan2(z, x);
        baseV[idx] = Math.asin(clamp(y / r, -1, 1));
        depthOf[idx] = layerNorm;

        const [cr, cg, cb] = particleColor(layerNorm, yNorm);
        const alpha = (0.5 + layerNorm * 0.4).toFixed(2);
        fillOf[idx] = 'rgba(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ',' + alpha + ')';

        idx++;
      }
    }

    count = idx;
  }

  /* --- Render -------------------------------------------------------------
     `elapsed` is a free-running clock in seconds; 0 on the still frame used
     for prefers-reduced-motion.
     --------------------------------------------------------------------- */

  function render(elapsed) {
    ctx.clearRect(0, 0, W, H);
    if (count === 0) return;

    const cx = W / 2;
    const cy = H / 2;
    const t = elapsed * CONFIG.waveSpeedScale;
    const morphCycle = Math.sin(t * 0.4);
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.7);

    // Rotation is applied to the whole cloud (object-level, as in the Three.js
    // source) rather than baked into each particle's base position.
    const ry = elapsed * 0.26;
    const rx = Math.sin(elapsed * 0.16) * 0.22 + 0.12;
    const rz = Math.cos(elapsed * 0.12) * 0.15;
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

    // Ambient back-glow, additive, pulsing gently — the 2D stand-in for the
    // reference's haloMesh plane.
    const glowAlpha = 0.26 + Math.sin(elapsed * 1.2) * 0.06;
    const glowR = Math.min(W, H) * 0.56 * (1 + Math.sin(elapsed * 0.6) * 0.04);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = glowAlpha;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, glowR));
    grad.addColorStop(0, 'rgba(104,40,176,0.5)');
    grad.addColorStop(0.45, 'rgba(255,81,30,0.3)');
    grad.addColorStop(0.8, 'rgba(255,140,60,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < count; i++) {
      const r = baseR[i];
      const u = baseU[i];
      const v = baseV[i];
      const d = depthOf[i];

      // Three overlapping waves: fluted ridges, slow torus<->sphere morph,
      // and high-frequency acoustic flutter — identical constants to the
      // Three.js reference.
      const wave1 = Math.sin(u * 5 + t * 1.5) * Math.cos(v * 4 - t * 0.8) * 12 * (0.35 + 0.65 * d);
      const wave2 = Math.sin(u * 3 - t * 1.1) * Math.sin(v * 6 + t * 1.3) * (7 + morphCycle * 5) * (0.3 + 0.7 * d);
      const wave3 = Math.cos(v * 8 + u * 2 + t * 2) * 4.5 * (0.4 + 0.6 * d);
      const newR = Math.max(12, r + (wave1 + wave2 + wave3) * pulse * CONFIG.waveAmplitude);
      const scale = newR / r;

      const px = baseX[i] * scale;
      const py = baseY[i] * (scale * (1 + 0.12 * Math.sin(t * 0.9 + v * 3)));
      const pz = baseZ[i] * scale;

      // Yaw, then pitch, then roll — one shared set of trig values per
      // frame, applied to every particle.
      const x1 = px * cosY + pz * sinY;
      const z1 = -px * sinY + pz * cosY;
      const y2 = py * cosX - z1 * sinX;
      const z2 = py * sinX + z1 * cosX;
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      const persp = CONFIG.camDist / (CONFIG.camDist - z2);
      const sx = cx + x3 * persp * pxPerUnit;
      const sy = cy - y3 * persp * pxPerUnit;
      const s = Math.max(0.6, CONFIG.pointSize * persp);

      ctx.fillStyle = fillOf[i];
      ctx.beginPath();
      ctx.arc(sx, sy, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /* --- Sizing -------------------------------------------------------------
     Driven by the container's actual box (a grid column), not the viewport —
     this orb is never full-screen.
     --------------------------------------------------------------------- */

  function resize() {
    const rect = container.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fit the sphere's worst-case radius (rMax plus wave displacement, ~100
    // units) inside the shorter side of the box, with a small margin.
    pxPerUnit = (Math.min(W, H) * 0.47) / 100;

    if (motionQuery.matches || container.classList.contains('is-paused')) {
      render(0);
    }
  }

  /* --- Loop ----------------------------------------------------------------
     Throttled to CONFIG.renderFps, same reasoning as field.js: this is slow,
     ambient motion, and painting it faster than the eye needs just burns
     main-thread time the scroll never gets back.
     --------------------------------------------------------------------- */

  let running = false;
  let rafId = null;
  let clockStart = null;
  let lastRender = 0;
  const RENDER_INTERVAL = 1000 / CONFIG.renderFps;

  function frame(now) {
    if (!running) return;
    if (clockStart === null) clockStart = now;
    if (now - lastRender >= RENDER_INTERVAL) {
      lastRender = now;
      render((now - clockStart) / 1000);
    }
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || motionQuery.matches || container.classList.contains('is-paused')) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* --- Wiring --------------------------------------------------------------
     Reduced motion gets one calm static frame, same convention as field.js's
     renderStill(). Visibility and the shared is-paused class both just
     start/stop the loop; whichever fires last wins, which is fine since both
     checks are idempotent.
     --------------------------------------------------------------------- */

  function init() {
    canvas = document.querySelector('.problem-orb');
    if (!canvas) return;
    container = canvas.closest('.problem-art');
    if (!container) return;
    ctx = canvas.getContext('2d', { alpha: true });

    buildParticles();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    if (motionQuery.matches) {
      render(0);
    } else {
      start();
    }

    const classObserver = new MutationObserver(() => {
      if (container.classList.contains('is-paused')) stop();
      else start();
    });
    classObserver.observe(container, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    motionQuery.addEventListener('change', () => {
      if (motionQuery.matches) {
        stop();
        render(0);
      } else {
        start();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
