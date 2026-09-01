/* =====================================================================
   Social proof section (#results) — parts/proof.js
   IIFE, no globals. Progressive enhancement only:

   - With JS disabled: the Slack panel (#pf-slack-panel) is a plain
     native-scroll container — every message is present in the DOM and
     reachable with the mouse wheel, trackpad, or keyboard (it's a
     tabindex="0" scroll region). Nothing in this file is required to
     read the content.
   - With JS enabled AND the user has not requested reduced motion:
     adds a slow, self-pausing auto-scroll of the message list, plus a
     visible pause/resume button (hidden until this script confirms
     it's safe to show it). Auto-scroll pauses on hover, on keyboard
     focus, and whenever the tab is not visible, and stays paused once
     the user pauses it manually.
   - If prefers-reduced-motion is set (or changes to set at runtime):
     no motion ever starts, and the toggle button stays hidden — there
     is nothing to pause because nothing moves.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("pf-slack");
  var panel = document.getElementById("pf-slack-panel");
  var toggle = document.getElementById("pf-marquee-toggle");
  var labelEl = toggle ? toggle.querySelector(".pf-marquee-toggle-label") : null;

  if (!root || !panel || !toggle) return;

  var reduceMotionMql = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: function () {}, removeEventListener: function () {} };

  var SPEED = 0.35; // px per animation frame — deliberately gentle
  var PAUSE_MS = 1500; // dwell time at top/bottom before reversing

  var rafId = null;
  var manuallyPaused = false;
  var hovered = false;
  var focused = false;
  var direction = "down"; // "down" | "up"
  var waitUntil = 0;

  function hasOverflow() {
    return panel.scrollHeight - panel.clientHeight > 4;
  }

  function setPressed(pressed) {
    toggle.setAttribute("aria-pressed", pressed ? "true" : "false");
    if (labelEl) labelEl.textContent = pressed ? "Resume auto-scroll" : "Pause auto-scroll";
  }

  function tick(ts) {
    rafId = requestAnimationFrame(tick);

    if (manuallyPaused || hovered || focused || document.hidden) return;
    if (waitUntil) {
      if (ts < waitUntil) return;
      waitUntil = 0;
    }

    if (direction === "down") {
      var atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
      if (atBottom) {
        direction = "up";
        waitUntil = ts + PAUSE_MS;
        return;
      }
      panel.scrollTop += SPEED;
    } else {
      if (panel.scrollTop <= 0) {
        direction = "down";
        waitUntil = ts + PAUSE_MS;
        return;
      }
      panel.scrollTop -= SPEED;
    }
  }

  function start() {
    if (rafId !== null) return;
    if (!hasOverflow()) return; // nothing to scroll, nothing to pause — skip entirely
    root.classList.add("pf-has-js");
    setPressed(false);
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    root.classList.remove("pf-has-js");
  }

  function onToggleClick() {
    manuallyPaused = !manuallyPaused;
    setPressed(manuallyPaused);
  }

  function onEnter() { hovered = true; }
  function onLeave() { hovered = false; }

  function onFocusIn() { focused = true; }
  function onFocusOut(e) {
    // stay "focused" (paused) only while focus remains inside the panel/root
    if (!root.contains(e.relatedTarget)) focused = false;
  }

  function wireInteractions() {
    toggle.addEventListener("click", onToggleClick);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", function () {
      /* handled inline in tick() via document.hidden — nothing to do here */
    });
  }

  function onReduceMotionChange(e) {
    if (e.matches) {
      stop();
    } else {
      start();
    }
  }

  // Initial setup
  wireInteractions();
  if (!reduceMotionMql.matches) {
    start();
  }

  // React live if the user flips the OS-level reduced-motion setting
  if (typeof reduceMotionMql.addEventListener === "function") {
    reduceMotionMql.addEventListener("change", onReduceMotionChange);
  } else if (typeof reduceMotionMql.addListener === "function") {
    // Safari < 14 fallback
    reduceMotionMql.addListener(onReduceMotionChange);
  }
})();
