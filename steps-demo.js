/* ===========================================================================
   WaveKey — live flow demo (ported from assets/wavekey-live-flow-reference.html)
   ---------------------------------------------------------------------------
   The step controller from the source file, wrapped in an IIFE only to keep
   its globals out of the page's global scope — same convention as the demo
   this file used to drive. `handleStepClick` stays on `window` since the
   markup calls it inline (onclick="handleStepClick(n)"); everything else is
   scoped locally. See assets/wavekey-live-flow-reference.html for the
   unmodified original.
   =========================================================================== */

(function () {
  'use strict';

  let currentStep = 1;
  const stepDuration = 3800; // 3.8s fluid transition loop
  let autoInterval = null;
  let step3Timeout = null;

  const stepsData = {
    1: {
      laptopUrl: "auth.acme-corp.internal",
      micActive: false,
      dashPill: "Pending",
      linkText: "Standby"
    },
    2: {
      laptopUrl: "auth.acme-corp.internal",
      micActive: true,
      dashPill: "Awaiting Mobile",
      linkText: "Connecting"
    },
    3: {
      laptopUrl: "crm.acme-corp.internal/customer/8942",
      micActive: true,
      dashPill: "Active & Verified",
      linkText: "Acoustic Handshake"
    },
    4: {
      laptopUrl: "crm.acme-corp.internal/presence",
      micActive: true,
      dashPill: "Continuous Guarding",
      linkText: "Zero-Touch Link"
    }
  };

  function highlightStepItem(step) {
    const items = document.querySelectorAll('#narrativeStepsList .step-item');
    items.forEach((item) => {
      const itemStep = parseInt(item.getAttribute('data-step'), 10);
      item.classList.toggle('active', itemStep === step);
    });
  }

  function updateUIForStep(step) {
    currentStep = step;
    const data = stepsData[step];
    if (!data) return;

    // 1. Sync left step card highlight
    highlightStepItem(step);

    // 2. Laptop URL update
    const urlDisp = document.getElementById('laptopUrlDisplay');
    if (urlDisp) urlDisp.innerText = data.laptopUrl;

    // 3. Laptop mic badge in the browser chrome
    const micBadge = document.getElementById('laptopMicIndicator');
    if (micBadge) micBadge.classList.toggle('opacity-0', !data.micActive);

    // 4. Acoustic wave animation — visible only in step 3 and step 4
    const acousticWave = document.getElementById('acousticWaveConnector');
    const waveBars = [
      document.getElementById('waveBar1'),
      document.getElementById('waveBar2'),
      document.getElementById('waveBar3'),
      document.getElementById('waveBar4'),
      document.getElementById('waveBar5')
    ];

    if (acousticWave) {
      if (step === 3 || step === 4) {
        acousticWave.classList.remove('opacity-0', 'scale-90');
        acousticWave.classList.add('opacity-100', 'scale-100');

        waveBars.forEach((b) => {
          if (!b) return;
          if (step === 4) {
            b.classList.remove('wave-bar');
            b.classList.add('wave-bar-gentle');
          } else {
            b.classList.remove('wave-bar-gentle');
            b.classList.add('wave-bar');
          }
        });
      } else {
        acousticWave.classList.add('opacity-0', 'scale-90');
        acousticWave.classList.remove('opacity-100', 'scale-100');
      }
    }

    // Step 4 badges, and the retry/resync glyph between phone and laptop
    const step4Badges = document.getElementById('step4AuthBadges');
    const retryIcon = document.getElementById('step4RetryIcon');

    if (step === 4) {
      if (step4Badges) {
        step4Badges.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        step4Badges.classList.add('opacity-100', 'scale-100');
      }
      if (retryIcon) {
        retryIcon.classList.remove('opacity-0', 'scale-90');
        retryIcon.classList.add('opacity-100', 'scale-100');
      }
    } else {
      if (step4Badges) {
        step4Badges.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        step4Badges.classList.remove('opacity-100', 'scale-100');
      }
      if (retryIcon) {
        retryIcon.classList.add('opacity-0', 'scale-90');
        retryIcon.classList.remove('opacity-100', 'scale-100');
      }
    }

    // 5. Phone UI switching
    const lockScreen = document.getElementById('phoneLockScreen');
    const appVerifying = document.getElementById('phoneAppVerifying');
    const appContinuous = document.getElementById('phoneAppContinuous');
    const islandPing = document.getElementById('islandPing');
    const phoneEmittingText = document.getElementById('phoneEmittingText');

    const pushBanner = document.getElementById('phonePushBanner');

    if (lockScreen) lockScreen.classList.add('hidden');
    if (appVerifying) appVerifying.classList.add('hidden');
    if (appContinuous) appContinuous.classList.add('hidden');
    if (islandPing) islandPing.classList.add('opacity-0');

    if (step === 1) {
      if (lockScreen) lockScreen.classList.remove('hidden');
      if (pushBanner) pushBanner.classList.add('opacity-0', 'translate-y-2');
    } else if (step === 2) {
      if (lockScreen) lockScreen.classList.remove('hidden');
      if (pushBanner) pushBanner.classList.remove('opacity-0', 'translate-y-2');
      if (islandPing) islandPing.classList.remove('opacity-0');
    } else if (step === 3) {
      if (appVerifying) appVerifying.classList.remove('hidden');
      if (phoneEmittingText) phoneEmittingText.innerText = "Emitting";
      if (islandPing) islandPing.classList.remove('opacity-0');
    } else if (step === 4) {
      if (appContinuous) appContinuous.classList.remove('hidden');
      if (islandPing) islandPing.classList.remove('opacity-0');
    }

    // 6. Laptop workstation UI switching
    const laptopForm = document.getElementById('laptopLoginForm');
    const laptopDash = document.getElementById('laptopDashboard');
    const laptopCheck = document.getElementById('laptopCheckOverlay');
    const step1Action = document.getElementById('loginStep1Action');
    const step2Action = document.getElementById('loginStep2Action');
    const laptopDashStatusPill = document.getElementById('laptopDashStatusPill');
    const dashLinkField = document.getElementById('dashLinkField');

    if (step3Timeout) clearTimeout(step3Timeout);

    if (step <= 2) {
      if (laptopCheck) laptopCheck.classList.add('hidden');
      if (laptopForm) laptopForm.classList.remove('hidden');
      if (laptopDash) laptopDash.classList.add('hidden');

      if (step === 1) {
        if (step1Action) step1Action.classList.remove('hidden');
        if (step2Action) step2Action.classList.add('hidden');
      } else if (step === 2) {
        if (step1Action) step1Action.classList.add('hidden');
        if (step2Action) step2Action.classList.remove('hidden');
      }
    } else if (step === 3) {
      // Pop the checkmark overlay prominently, then reveal the CRM profile.
      if (laptopForm) laptopForm.classList.add('hidden');
      if (laptopDash) laptopDash.classList.remove('hidden');
      if (laptopCheck) {
        laptopCheck.classList.remove('hidden');
        step3Timeout = setTimeout(() => {
          if (laptopCheck && currentStep === 3) {
            laptopCheck.classList.add('hidden');
          }
        }, 1200);
      }
      if (laptopDashStatusPill) laptopDashStatusPill.innerText = data.dashPill;
      if (dashLinkField) dashLinkField.innerText = data.linkText;
    } else if (step === 4) {
      if (laptopCheck) laptopCheck.classList.add('hidden');
      if (laptopForm) laptopForm.classList.add('hidden');
      if (laptopDash) laptopDash.classList.remove('hidden');
      if (laptopDashStatusPill) laptopDashStatusPill.innerText = data.dashPill;
      if (dashLinkField) dashLinkField.innerText = data.linkText;
    }
  }

  function advanceStep() {
    let nextStep = currentStep + 1;
    if (nextStep > 4) nextStep = 1;
    updateUIForStep(nextStep);
  }

  function pauseAutoLoop() {
    clearInterval(autoInterval);
    autoInterval = null;
    if (step3Timeout) {
      clearTimeout(step3Timeout);
      step3Timeout = null;
    }
  }

  function startAutoLoop() {
    pauseAutoLoop();
    autoInterval = setInterval(advanceStep, stepDuration);
  }

  // Whether the widget is currently on screen — set by the
  // IntersectionObserver below. The auto-advance loop only runs while this
  // is true, so the demo doesn't keep cycling (and burning the step-3
  // checkmark timeout, wave animations, etc.) somewhere off-screen the
  // visitor never scrolled back to.
  let isVisible = false;

  function handleStepClick(step) {
    // Manual scrub — restart the autonomous cycle after the interaction
    // (only if still visible; a click can't happen while off-screen, but
    // this stays consistent with the observer-driven state either way).
    pauseAutoLoop();
    updateUIForStep(step);
    if (isVisible) startAutoLoop();
  }
  window.handleStepClick = handleStepClick;

  document.addEventListener('DOMContentLoaded', () => {
    // Clicking/tapping a step card scrubs straight to it; Enter/Space too,
    // since the cards are role="button" list items rather than real
    // <button>s.
    const list = document.getElementById('narrativeStepsList');
    if (list) {
      list.addEventListener('click', (event) => {
        const item = event.target.closest('.step-item');
        if (!item || !list.contains(item)) return;
        const step = parseInt(item.getAttribute('data-step'), 10);
        if (step) handleStepClick(step);
      });

      list.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const item = event.target.closest('.step-item');
        if (!item || !list.contains(item)) return;
        event.preventDefault();
        const step = parseInt(item.getAttribute('data-step'), 10);
        if (step) handleStepClick(step);
      });
    }

    // Only run the demo while it's actually on screen: start the loop as
    // the widget scrolls into view, and pause + reset to step 1 (Login)
    // the moment it scrolls back out, so it's never mid-cycle — stuck on
    // "Authenticate" or similar — for a visitor scrolling back up to it.
    const root = document.getElementById('wavekeyLiveFlow');
    if (root && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isVisible = true;
              startAutoLoop();
            } else {
              isVisible = false;
              pauseAutoLoop();
              updateUIForStep(1);
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(root);
    } else if (root) {
      // No IntersectionObserver support — fall back to always running
      // rather than never animating at all.
      isVisible = true;
      startAutoLoop();
    }
  });

  // Paint the correct step-1 content immediately so the widget doesn't
  // flash unstyled/default markup before the observer above ever fires —
  // the loop itself only starts once it's confirmed on screen.
  updateUIForStep(1);

})();
