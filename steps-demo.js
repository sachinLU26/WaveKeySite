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
      dashPill: "Syncing",
      linkText: "Connecting"
    },
    3: {
      laptopUrl: "presence.wavekey.internal",
      micActive: true,
      dashPill: "Handshake Active",
      linkText: "Pairing (0.5m)"
    },
    4: {
      laptopUrl: "salesforce.com/lightning/home",
      micActive: true,
      dashPill: "Session Authenticated",
      linkText: "Locked (0.6m)"
    },
    5: {
      laptopUrl: "salesforce.com/lightning/presence",
      micActive: true,
      dashPill: "Continuously Authenticating",
      linkText: "Active Guarding"
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

    // 3. Laptop mic badge in the browser chrome (active steps 2–5)
    const micBadge = document.getElementById('laptopMicIndicator');
    if (micBadge) micBadge.classList.toggle('opacity-0', !data.micActive);

    // 4. Acoustic wave animation — visible only in step 3 and step 5
    const acousticWave = document.getElementById('acousticWaveConnector');
    const waveBars = [
      document.getElementById('waveBar1'),
      document.getElementById('waveBar2'),
      document.getElementById('waveBar3'),
      document.getElementById('waveBar4'),
      document.getElementById('waveBar5')
    ];

    if (acousticWave) {
      if (step === 3 || step === 5) {
        acousticWave.classList.remove('opacity-0', 'scale-90');
        acousticWave.classList.add('opacity-100', 'scale-100');

        waveBars.forEach((b) => {
          if (!b) return;
          if (step === 5) {
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

    // 5. Phone UI switching
    const lockScreen = document.getElementById('phoneLockScreen');
    const pushBanner = document.getElementById('phonePushBanner');
    const appVerifying = document.getElementById('phoneAppVerifying');
    const appConfirmed = document.getElementById('phoneAppConfirmed');
    const appContinuous = document.getElementById('phoneAppContinuous');
    const islandPing = document.getElementById('islandPing');
    const phoneEmittingText = document.getElementById('phoneEmittingText');

    if (lockScreen) lockScreen.classList.add('hidden');
    if (appVerifying) appVerifying.classList.add('hidden');
    if (appConfirmed) appConfirmed.classList.add('hidden');
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
      if (appConfirmed) appConfirmed.classList.remove('hidden');
    } else if (step === 5) {
      if (appContinuous) appContinuous.classList.remove('hidden');
    }

    // 6. Laptop workstation UI switching
    const laptopForm = document.getElementById('laptopLoginForm');
    const laptopDash = document.getElementById('laptopDashboard');
    const step1Action = document.getElementById('loginStep1Action');
    const step2Action = document.getElementById('loginStep2Action');
    const step3Action = document.getElementById('loginStep3Action');
    const laptopDashStatusPill = document.getElementById('laptopDashStatusPill');
    const dashLinkField = document.getElementById('dashLinkField');

    if (step <= 3) {
      if (laptopForm) laptopForm.classList.remove('hidden');
      if (laptopDash) laptopDash.classList.add('hidden');

      if (step === 1) {
        if (step1Action) step1Action.classList.remove('hidden');
        if (step2Action) step2Action.classList.add('hidden');
        if (step3Action) step3Action.classList.add('hidden');
      } else if (step === 2) {
        if (step1Action) step1Action.classList.add('hidden');
        if (step2Action) step2Action.classList.remove('hidden');
        if (step3Action) step3Action.classList.add('hidden');
      } else if (step === 3) {
        if (step1Action) step1Action.classList.add('hidden');
        if (step2Action) step2Action.classList.add('hidden');
        if (step3Action) step3Action.classList.remove('hidden');
      }
    } else {
      if (laptopForm) laptopForm.classList.add('hidden');
      if (laptopDash) laptopDash.classList.remove('hidden');

      if (laptopDashStatusPill) laptopDashStatusPill.innerText = data.dashPill;
      if (dashLinkField) dashLinkField.innerText = data.linkText;
    }
  }

  function advanceStep() {
    let nextStep = currentStep + 1;
    if (nextStep > 5) nextStep = 1;
    updateUIForStep(nextStep);
  }

  function handleStepClick(step) {
    // Manual scrub — restart the autonomous cycle after the interaction.
    clearInterval(autoInterval);
    updateUIForStep(step);
    autoInterval = setInterval(advanceStep, stepDuration);
  }
  window.handleStepClick = handleStepClick;

  // Clicking/tapping a step card scrubs straight to it; Enter/Space too,
  // since the cards are role="button" divs rather than real <button>s.
  document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('narrativeStepsList');
    if (!list) return;

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
  });

  // Initialize at step 1 and start the autonomous loop.
  updateUIForStep(1);
  autoInterval = setInterval(advanceStep, stepDuration);

})();
