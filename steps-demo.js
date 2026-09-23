/* ===========================================================================
   WaveKey — steps demo (ported verbatim from assets/wave-demo-ani-reference.html)
   ---------------------------------------------------------------------------
   The exact controller script from the source file, wrapped in an IIFE only
   to keep its globals (currentStep, stepsData, updateUIForStep, ...) out of
   the page's global scope — same convention as wavekey-demo.js. No logic
   below has been changed; see assets/wave-demo-ani-reference.html for the
   unmodified original.
   =========================================================================== */

(function () {
  'use strict';

      let currentStep = 1;
      const stepDuration = 4800; // Calm observable dwell (~4.8s per step)

      const stepLabels = {
        1: "1. Login",
        2: "2. Tap",
        3: "3. Transmitting",
        4: "4. Authenticated",
        5: "5. Continuously authenticating"
      };

      const stepsData = {
        1: {
          laptopUrl: "auth.acme-corp.internal",
          laptopStatus: "Ready",
          phoneStatus: "Locked"
        },
        2: {
          laptopUrl: "auth.acme-corp.internal",
          laptopStatus: "Awaiting Confirmation",
          phoneStatus: "Prompt Received"
        },
        3: {
          laptopUrl: "presence.wavekey.internal",
          laptopStatus: "Acoustic Handshake",
          phoneStatus: "Transmitting"
        },
        4: {
          laptopUrl: "app.acme-corp.internal/dashboard",
          laptopStatus: "Authenticated",
          phoneStatus: "Verified"
        },
        5: {
          laptopUrl: "app.acme-corp.internal/session",
          laptopStatus: "Continuously Authenticating",
          phoneStatus: "Guarding"
        }
      };

      function updateStepIndicator(step) {
        const wrapper = document.getElementById('stepPillWrapper');
        const textElem = document.getElementById('currentStepText');
        if (!wrapper || !textElem) return;

        // Smooth exit transition
        wrapper.classList.remove('step-pill-enter');
        wrapper.classList.add('step-pill-exit');

        setTimeout(() => {
          textElem.innerText = stepLabels[step];
          wrapper.classList.remove('step-pill-exit');
          wrapper.classList.add('step-pill-enter');
        }, 160);
      }

      function updateUIForStep(step) {
        currentStep = step;
        const data = stepsData[step];

        // Update active step pill
        updateStepIndicator(step);

        // Update text pills & URL
        const urlDisp = document.getElementById('laptopUrlDisplay');
        if (urlDisp) urlDisp.innerText = data.laptopUrl;

        const laptopPill = document.getElementById('laptopStatusPill');
        if (laptopPill) laptopPill.innerText = data.laptopStatus;

        const phonePill = document.getElementById('phoneStatusPill');
        if (phonePill) phonePill.innerText = data.phoneStatus;

        // ------------------------------------
        // ACOUSTIC SOUNDWAVE CONNECTOR
        // Requirement: Active in Step 3 and Step 5!
        // ------------------------------------
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

            if (step === 5) {
              // Calm continuous undulation for continuous presence telemetry
              waveBars.forEach(b => {
                if (b) {
                  b.classList.remove('wave-bar');
                  b.classList.add('wave-bar-gentle');
                }
              });
            } else {
              // Active energetic pulse for transmission handshake
              waveBars.forEach(b => {
                if (b) {
                  b.classList.remove('wave-bar-gentle');
                  b.classList.add('wave-bar-wave');
                  b.classList.add('wave-bar');
                }
              });
            }
          } else {
            acousticWave.classList.add('opacity-0', 'scale-90');
            acousticWave.classList.remove('opacity-100', 'scale-100');
          }
        }

        // ------------------------------------
        // PHONE HARDWARE STATE UPDATES
        // ------------------------------------
        const lockScreen = document.getElementById('phoneLockScreen');
        const pushBanner = document.getElementById('phonePushBanner');
        const appVerifying = document.getElementById('phoneAppVerifying');
        const appConfirmed = document.getElementById('phoneAppConfirmed');
        const appContinuous = document.getElementById('phoneAppContinuous');
        const islandPing = document.getElementById('islandPing');

        // Reset all phone views
        if (lockScreen) lockScreen.classList.add('hidden');
        if (appVerifying) appVerifying.classList.add('hidden');
        if (appConfirmed) appConfirmed.classList.add('hidden');
        if (appContinuous) appContinuous.classList.add('hidden');
        if (islandPing) islandPing.classList.add('opacity-0');

        if (step === 1) {
          // Step 1: Login - Clean locked phone
          if (lockScreen) lockScreen.classList.remove('hidden');
          if (pushBanner) pushBanner.classList.add('opacity-0', '-translate-y-3');
        } else if (step === 2) {
          // Step 2: Tap - Native push notification arrives
          if (lockScreen) lockScreen.classList.remove('hidden');
          if (pushBanner) pushBanner.classList.remove('opacity-0', '-translate-y-3');
          if (islandPing) islandPing.classList.remove('opacity-0');
        } else if (step === 3) {
          // Step 3: Transmitting - Central glowing acoustic speaker icon
          if (appVerifying) appVerifying.classList.remove('hidden');
          if (islandPing) islandPing.classList.remove('opacity-0');
        } else if (step === 4) {
          // Step 4: Authenticated - Confirmation checkmark
          if (appConfirmed) appConfirmed.classList.remove('hidden');
        } else if (step === 5) {
          // Step 5: Continuously authenticating - Security shield & proximity
          if (appContinuous) appContinuous.classList.remove('hidden');
        }

        // ------------------------------------
        // LAPTOP HARDWARE STATE UPDATES
        // ------------------------------------
        const laptopForm = document.getElementById('laptopLoginForm');
        const laptopDash = document.getElementById('laptopDashboard');
        const topBadge = document.getElementById('laptopTopRightBadge');
        const step1Action = document.getElementById('loginStep1Action');
        const step2Action = document.getElementById('loginStep2Action');
        const step3Action = document.getElementById('loginStep3Action');
        const laptopToastText = document.getElementById('laptopToastText');
        const laptopDashStatusPill = document.getElementById('laptopDashStatusPill');

        if (step <= 3) {
          if (laptopForm) laptopForm.classList.remove('hidden');
          if (laptopDash) laptopDash.classList.add('hidden');
          if (topBadge) topBadge.classList.add('opacity-0');

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
          if (topBadge) topBadge.classList.remove('opacity-0');

          if (step === 4) {
            if (laptopToastText) laptopToastText.innerText = "Verified via Wavekey";
            if (laptopDashStatusPill) laptopDashStatusPill.innerText = "Session Authenticated";
          } else if (step === 5) {
            if (laptopToastText) laptopToastText.innerText = "Continuous Telemetry Active";
            if (laptopDashStatusPill) laptopDashStatusPill.innerText = "Continuously Authenticating";
          }
        }
      }

      function advanceStep() {
        let nextStep = currentStep + 1;
        if (nextStep > 5) nextStep = 1;
        updateUIForStep(nextStep);
      }

      // Initialize state 1 and start autonomous continuous loop
      updateUIForStep(1);
      setInterval(advanceStep, stepDuration);

})();
