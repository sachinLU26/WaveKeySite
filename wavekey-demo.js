/* ===========================================================================
   WaveKey — device demo (ported verbatim from assets/wavekey-demo-reference.html)
   ---------------------------------------------------------------------------
   This is the exact controller script from the source file, wrapped in an
   IIFE only to keep its globals (currentStep, stepsData, updateUIForStep,
   ...) out of the page's global scope. No logic below has been changed —
   see assets/wavekey-demo-reference.html for the unmodified original,
   including the preview-only header controls (step-jump buttons, play/pause,
   timeline) that this embed intentionally omits; the functions below that
   exist only to drive those controls (jumpToStep, togglePlayPause,
   resetFlow) are harmless dead code here since nothing calls them.
   =========================================================================== */

(function () {
  'use strict';

      // State management
      let currentStep = 1;
      let isPlaying = true;
      let cycleTimer = null;
      const stepDuration = 3600; // ms per step

      // Step configuration data
      const stepsData = {
        1: {
          laptopUrl: "auth.acme-corp.internal",
          laptopStatus: "Ready",
          phoneStatus: "Locked"
        },
        2: {
          laptopUrl: "auth.acme-corp.internal/handshake",
          laptopStatus: "Awaiting Push",
          phoneStatus: "Push Received"
        },
        3: {
          laptopUrl: "presence.verify(wavekey_token)",
          laptopStatus: "Authenticating Presence",
          phoneStatus: "Emitting Signal"
        },
        4: {
          laptopUrl: "app.acme-corp.internal/dashboard",
          laptopStatus: "Access Granted",
          phoneStatus: "Verified"
        },
        5: {
          laptopUrl: "app.acme-corp.internal/session#active",
          laptopStatus: "Continuously Verified",
          phoneStatus: "Guarding"
        }
      };

      function updateUIForStep(step) {
        currentStep = step;
        const data = stepsData[step];

        // Update text indicators
        const urlDisp = document.getElementById('laptopUrlDisplay');
        if (urlDisp) urlDisp.innerText = data.laptopUrl;

        const laptopPill = document.getElementById('laptopStatusPill');
        if (laptopPill) laptopPill.innerText = data.laptopStatus;

        const phonePill = document.getElementById('phoneStatusPill');
        if (phonePill) phonePill.innerText = data.phoneStatus;

        // Update step buttons
        for (let i = 1; i <= 5; i++) {
          const btn = document.getElementById(`btnStep${i}`);
          if (btn) {
            if (i === step) {
              btn.className = "step-btn px-2.5 py-1 rounded-full text-xs font-medium transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm";
            } else {
              btn.className = "step-btn px-2.5 py-1 rounded-full text-xs font-medium transition-all text-slate-400 hover:text-white";
            }
          }
        }

        // Update Timeline progress
        const timeline = document.getElementById('timelineProgress');
        if (timeline) timeline.style.width = `${step * 20}%`;

        // ------------------------------------
        // LAPTOP STATES
        // ------------------------------------
        const loginForm = document.getElementById('laptopLoginForm');
        const dashboard = document.getElementById('laptopDashboard');
        const standardBtn = document.getElementById('loginStandardBtn');
        const pollingBox = document.getElementById('loginPollingBox');
        const acousticBox = document.getElementById('loginAcousticBox');
        const topRightBadge = document.getElementById('laptopTopRightBadge');
        const footerChannel = document.getElementById('loginFooterChannel');

        if (step <= 3) {
          if (loginForm) loginForm.classList.remove('hidden');
          if (dashboard) dashboard.classList.add('hidden');
          if (topRightBadge) topRightBadge.classList.add('opacity-0');

          if (step === 1) {
            if (standardBtn) standardBtn.classList.remove('hidden');
            if (pollingBox) pollingBox.classList.add('hidden');
            if (acousticBox) acousticBox.classList.add('hidden');
            if (footerChannel) {
              footerChannel.innerText = "Ready";
              footerChannel.className = "text-slate-500";
            }
          } else if (step === 2) {
            if (standardBtn) standardBtn.classList.add('hidden');
            if (pollingBox) pollingBox.classList.remove('hidden');
            if (acousticBox) acousticBox.classList.add('hidden');
            if (footerChannel) {
              footerChannel.innerText = "Channel Open";
              footerChannel.className = "text-cyan-400";
            }
          } else if (step === 3) {
            if (standardBtn) standardBtn.classList.add('hidden');
            if (pollingBox) pollingBox.classList.add('hidden');
            if (acousticBox) acousticBox.classList.remove('hidden');
            if (footerChannel) {
              footerChannel.innerText = "Binding Key";
              footerChannel.className = "text-cyan-400 font-bold";
            }
          }
        } else {
          if (loginForm) loginForm.classList.add('hidden');
          if (dashboard) dashboard.classList.remove('hidden');
          if (topRightBadge) topRightBadge.classList.remove('opacity-0');
        }

        // ------------------------------------
        // PHONE STATES
        // ------------------------------------
        const lockScreen = document.getElementById('phoneLockScreen');
        const pushBanner = document.getElementById('phonePushBanner');
        const lockAppBadge = document.getElementById('phoneLockAppBadge');
        const appVerifying = document.getElementById('phoneAppVerifying');
        const appConfirmed = document.getElementById('phoneAppConfirmed');
        const appContinuous = document.getElementById('phoneAppContinuous');
        const acousticRings = document.getElementById('phoneAcousticRings');
        const islandPing = document.getElementById('islandPing');

        // Hide all phone screens first
        if (lockScreen) lockScreen.classList.add('hidden');
        if (appVerifying) appVerifying.classList.add('hidden');
        if (appConfirmed) appConfirmed.classList.add('hidden');
        if (appContinuous) appContinuous.classList.add('hidden');
        if (acousticRings) acousticRings.classList.add('opacity-0');
        if (islandPing) islandPing.classList.add('opacity-0');

        if (step === 1) {
          if (lockScreen) lockScreen.classList.remove('hidden');
          if (pushBanner) pushBanner.classList.add('opacity-0', '-translate-y-6');
          if (lockAppBadge) lockAppBadge.classList.remove('opacity-0');
        } else if (step === 2) {
          if (lockScreen) lockScreen.classList.remove('hidden');
          if (pushBanner) pushBanner.classList.remove('opacity-0', '-translate-y-6');
          if (lockAppBadge) lockAppBadge.classList.add('opacity-0');
          if (islandPing) islandPing.classList.remove('opacity-0');
        } else if (step === 3) {
          if (appVerifying) appVerifying.classList.remove('hidden');
          if (acousticRings) acousticRings.classList.remove('opacity-0');
          if (islandPing) islandPing.classList.remove('opacity-0');
        } else if (step === 4) {
          if (appConfirmed) appConfirmed.classList.remove('hidden');
        } else if (step === 5) {
          if (appContinuous) appContinuous.classList.remove('hidden');
          if (acousticRings) acousticRings.classList.remove('opacity-0');
        }
      }

      // Step progression logic
      function advanceStep() {
        let nextStep = currentStep + 1;
        if (nextStep > 5) nextStep = 1;
        updateUIForStep(nextStep);
      }

      function jumpToStep(step) {
        updateUIForStep(step);
        if (isPlaying) {
          resetTimer();
        }
      }

      function togglePlayPause() {
        isPlaying = !isPlaying;
        const btn = document.getElementById('togglePlayBtn');
        const text = document.getElementById('playPauseText');
        const icon = document.getElementById('playPauseIcon');

        if (isPlaying) {
          if (text) text.innerText = "Looping";
          if (btn) btn.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/25";
          if (icon) icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
          resetTimer();
        } else {
          if (text) text.innerText = "Paused";
          if (btn) btn.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-white/10";
          if (icon) icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
          clearInterval(cycleTimer);
        }
      }

      function resetTimer() {
        clearInterval(cycleTimer);
        cycleTimer = setInterval(advanceStep, stepDuration);
      }

      function resetFlow() {
        updateUIForStep(1);
        if (isPlaying) {
          resetTimer();
        }
      }

      // Initialize on load
      updateUIForStep(1);
      cycleTimer = setInterval(advanceStep, stepDuration);
  
})();
