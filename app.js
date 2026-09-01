/* =====================================================================
   Mabiat Advisor Marketing — behaviour
   Mobile menu · scroll spy · appointment tabs · production calculator,
   then one IIFE per section: story, compare, creative, proof.
   Every animated section renders complete without JS and is fully
   static under prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  /* ---------- scroll spy ----------
     The nav is flat now — one link, one destination — so the only thing
     left to do is mark which section you are actually in. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  var targets  = navLinks
    .map(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var visible = new Set();

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });

      /* Topmost visible section wins, so overlapping sections can't fight. */
      var best = null;
      targets.forEach(function (t) {
        if (!visible.has(t.el)) return;
        if (!best || t.el.getBoundingClientRect().top < best.el.getBoundingClientRect().top) best = t;
      });

      targets.forEach(function (t) {
        if (best && t === best) t.link.setAttribute('aria-current', 'true');
        else t.link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-84px 0px -55% 0px', threshold: 0 });

    targets.forEach(function (t) { spy.observe(t.el); });
  }

  /* ---------- showcase tabs ----------
     User-driven only. The default card is already marked active in the
     HTML, so with JS off the section still shows a real, readable card. */
  var tablist = document.querySelector('.showcase .tabs');

  if (tablist) {
    var tabs  = Array.prototype.slice.call(tablist.querySelectorAll('.tab'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.showcase .sc'));

    function select(i) {
      tabs.forEach(function (t, n) {
        t.setAttribute('aria-selected', String(n === i));
        t.tabIndex = n === i ? 0 : -1;
      });
      cards.forEach(function (c, n) {
        c.setAttribute('data-state', n === i ? 'active' : 'side');
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
    });

    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = e.key === 'ArrowRight' ? i + 1
               : e.key === 'ArrowLeft'  ? i - 1
               : e.key === 'Home'       ? 0
               : e.key === 'End'        ? tabs.length - 1
               : -1;
      if (next === -1) return;
      e.preventDefault();
      next = (next + tabs.length) % tabs.length;
      select(next);
      tabs[next].focus();
    });
  }

  /* ---------- calculator ---------- */
  var els = {
    appts:   document.getElementById('appts'),
    close:   document.getElementById('close'),
    premium: document.getElementById('premium'),
    rate:    document.getElementById('rate')
  };
  if (!els.appts) return;

  var out = {
    appts:      document.getElementById('apptsVal'),
    close:      document.getElementById('closeVal'),
    premium:    document.getElementById('premiumVal'),
    rate:       document.getElementById('rateVal'),
    headline:   document.getElementById('outHeadline'),
    cases:      document.getElementById('outCases'),
    premMonth:  document.getElementById('outPremMonth'),
    prem90:     document.getElementById('outPrem90'),
    commMonth:  document.getElementById('outCommMonth'),
    commYear:   document.getElementById('outCommYear')
  };

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  /* Paint the slider fill for WebKit, which has no ::-moz-range-progress. */
  function paint(input) {
    var min = parseFloat(input.min), max = parseFloat(input.max);
    var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--fill', pct + '%');
  }

  /* Tick the headline between two real values. Never starts from zero:
     if anything interrupts, the last true number is what stays on screen. */
  var tickFrame = null;
  function setHeadline(from, to) {
    if (tickFrame) cancelAnimationFrame(tickFrame);
    if (reduced || from === to) { out.headline.textContent = money(to); return; }

    var start = performance.now(), dur = 320;
    function step(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      out.headline.textContent = money(from + (to - from) * eased);
      if (t < 1) { tickFrame = requestAnimationFrame(step); }
      else { tickFrame = null; out.headline.textContent = money(to); }
    }
    tickFrame = requestAnimationFrame(step);
  }

  var lastHeadline = null;

  function compute() {
    var appts   = +els.appts.value;
    var closeR  = +els.close.value / 100;
    var premium = +els.premium.value;
    var rate    = +els.rate.value / 100;

    var cases      = appts * closeR;
    var premMonth  = cases * premium;
    var commMonth  = premMonth * rate;
    var comm90     = commMonth * 3;

    out.appts.textContent   = appts;
    out.close.textContent   = els.close.value + '%';
    out.premium.textContent = money(premium);
    out.rate.textContent    = els.rate.value + '%';

    out.cases.textContent     = cases.toFixed(1);
    out.premMonth.innerHTML   = money(premMonth) + '<small>per month</small>';
    out.prem90.innerHTML      = money(premMonth * 3) + '<small>in 90 days</small>';
    out.commMonth.innerHTML   = money(commMonth) + '<small>per month</small>';
    out.commYear.innerHTML    = money(commMonth * 12) + '<small>per year</small>';

    setHeadline(lastHeadline === null ? comm90 : lastHeadline, comm90);
    lastHeadline = comm90;
  }

  Object.keys(els).forEach(function (k) {
    paint(els[k]);
    els[k].addEventListener('input', function () { paint(els[k]); compute(); });
  });

  /* Recompute once on load so a restored slider position (back button,
     bfcache) matches its output. The HTML already carries correct
     defaults, so nothing renders as $0 before this runs. */
  compute();
})();

/* ===== STORY ===== */
/* ===== STORY: animated client-journey narrative ===== */
/* IIFE, no globals. Resting HTML/CSS state is fully visible; this script
   only ever ADDS the hidden/reveal machinery — if it never runs (JS off,
   error, etc.) every beat stays exactly as authored: complete and readable. */
(function () {
  "use strict";

  var section = document.getElementById("story");
  var root = section ? section.querySelector("[data-story]") : null;
  if (!root) return;

  var beats = Array.prototype.slice.call(root.querySelectorAll("[data-story-beat]"));
  var jumpEls = Array.prototype.slice.call(root.querySelectorAll("[data-story-jump]"));
  var dotEls = Array.prototype.slice.call(root.querySelectorAll("[data-story-dots] [data-story-jump]"));
  var playBtn = root.querySelector("[data-story-play]");
  var playLabel = root.querySelector("[data-story-play-label]");
  var fillEl = root.querySelector("[data-story-fill]");
  var statusEl = root.querySelector("[data-story-status]");
  var iconPlay = playBtn ? playBtn.querySelector('[data-icon="play"]') : null;
  var iconPause = playBtn ? playBtn.querySelector('[data-icon="pause"]') : null;

  if (!beats.length) return;

  var total = beats.length;
  var STEP_MS = 1000; /* ~900-1200ms cadence between beats, ~6s total for 6 beats */

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var current = -1;
  var timer = null;
  var playing = false;
  var hasPlayedOnce = false;

  function narrationFor(index) {
    var textEl = beats[index] && beats[index].querySelector(".st-beat-text");
    var timeEl = beats[index] && beats[index].querySelector(".st-eyebrow");
    var time = timeEl ? timeEl.textContent : "";
    var text = textEl ? textEl.textContent : "";
    return time + " — " + text;
  }

  function setActive(index) {
    if (index < 0 || index >= total) return;
    current = index;

    beats.forEach(function (beat, i) {
      beat.classList.toggle("st-beat--in", i <= index);
      beat.classList.toggle("st-beat--current", i === index);
    });

    dotEls.forEach(function (dot, i) {
      var isActive = i === index;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (fillEl) {
      fillEl.style.width = ((index + 1) / total) * 100 + "%";
    }

    if (statusEl) {
      statusEl.textContent = narrationFor(index);
    }
  }

  function resetBeats() {
    beats.forEach(function (beat) {
      beat.classList.remove("st-beat--in", "st-beat--current");
    });
  }

  function stopTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function updatePlayUI() {
    if (!playBtn) return;
    playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (iconPlay) iconPlay.hidden = playing;
    if (iconPause) iconPause.hidden = !playing;
    if (playLabel) {
      playLabel.textContent = playing
        ? "Pause story"
        : hasPlayedOnce
        ? "Replay story"
        : "Play story";
    }
  }

  function playFrom(startIndex) {
    stopTimer();
    playing = true;
    updatePlayUI();

    var i = startIndex;

    function step() {
      setActive(i);
      i += 1;
      if (i < total) {
        timer = window.setTimeout(step, STEP_MS);
      } else {
        playing = false;
        hasPlayedOnce = true;
        stopTimer();
        updatePlayUI();
      }
    }

    step();
  }

  function showAllStatic() {
    beats.forEach(function (beat, i) {
      beat.classList.add("st-beat--in");
      beat.classList.toggle("st-beat--current", i === total - 1);
    });
    dotEls.forEach(function (dot, i) {
      var isLast = i === total - 1;
      dot.classList.toggle("is-active", isLast);
      if (isLast) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
    if (fillEl) fillEl.style.width = "100%";
    if (statusEl) statusEl.textContent = narrationFor(total - 1);
    current = total - 1;
  }

  if (reduceMotion) {
    /* Reduced motion: no story--js class is added, so the default CSS
       (everything visible) is all that applies. No autoplay, no timers,
       the play/pause control is hidden via .st-reduced in story.css. */
    section.classList.add("st-reduced");
    showAllStatic();
    return;
  }

  /* Only now do we switch on the hide-then-reveal CSS machinery. */
  section.classList.add("story--js");

  jumpEls.forEach(function (el) {
    el.addEventListener("click", function () {
      var index = parseInt(el.getAttribute("data-story-jump"), 10);
      if (isNaN(index)) return;
      stopTimer();
      playing = false;
      hasPlayedOnce = true;
      updatePlayUI();
      resetBeats();
      setActive(index);
    });
  });

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (playing) {
        stopTimer();
        playing = false;
        updatePlayUI();
        return;
      }
      var startIndex = current >= total - 1 || current < 0 ? 0 : current + 1;
      if (startIndex === 0) resetBeats();
      playFrom(startIndex);
    });
  }

  var started = false;

  function beginOnce() {
    if (started) return;
    started = true;
    playFrom(0);
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            beginOnce();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(section);
  } else {
    beginOnce();
  }

  updatePlayUI();
})();

/* ===== COMPARE ===== */
/* ===== COMPARE (pipeline comparison) =====
   Vanilla IIFE, no globals. Progressively enhances the static markup in
   parts/compare.html, which is already fully readable without this file.

   - Bails out entirely under prefers-reduced-motion: reduce, leaving the
     CSS resting/complete state exactly as authored (no motion, no replay
     button, nothing to disconnect or clean up).
   - Otherwise arms the section (".cmp-js"), waits for it to scroll into
     view (IntersectionObserver, fires once), then plays the sequence by
     adding a single ".cmp-play" class -- all timing/stagger lives in
     compare.css via transition-delay, this file never touches element
     styles directly or loops with setInterval.
   - A small Replay button lets the visitor re-run the sequence. */
(function () {
  'use strict';

  var section = document.getElementById('compare');
  if (!section) return;

  var reduceMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  if (reduceMotionQuery && reduceMotionQuery.matches) {
    // Static, fully-drawn state defined in compare.css is already correct.
    return;
  }

  var board = section.querySelector('.cmp-board');
  var trackA = section.querySelector('.cmp-track--a');
  var replayBtn = document.getElementById('cmpReplay');

  if (!board || !trackA) return;

  section.classList.add('cmp-js');

  var DIM_DELAY_MS = 1800; // track A re-mutes shortly after its own result appears
  var hasPlayed = false;
  var dimTimer = null;

  function play() {
    if (dimTimer) {
      clearTimeout(dimTimer);
      dimTimer = null;
    }

    // Reset to the pre-animation (armed) state, then force a reflow so the
    // browser registers the reset before the class is re-added -- otherwise
    // a replay right after a previous run wouldn't re-trigger transitions.
    section.classList.remove('cmp-play');
    trackA.classList.remove('is-dimmed');
    void section.offsetWidth;

    section.classList.add('cmp-play');

    dimTimer = window.setTimeout(function () {
      trackA.classList.add('is-dimmed');
    }, DIM_DELAY_MS);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !hasPlayed) {
            hasPlayed = true;
            play();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(board);
  } else {
    // No IntersectionObserver support: just play once on load.
    hasPlayed = true;
    play();
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      play();
    });
  }
})();

/* ===== CREATIVE WORK ===== */
/* ===== CREATIVE SHOWCASE — behaviour =====
   IIFE, no globals. Progressive enhancement only:
   - Base HTML/CSS already renders a complete, static, readable gallery.
   - This script adds: click-to-expand modal (with focus trap + Escape +
     click-outside), plus small per-tile "life" (ticking counts, story
     segment cycling, carousel auto-advance) that runs only for the tile
     currently hovered/focused, and only when the user has not asked for
     reduced motion. CSS handles the video-scrub / landing-scroll / bar-chart
     life on its own via :hover/:focus-visible, so it keeps working even if
     this script fails to load. */
(function () {
  'use strict';

  var section = document.getElementById('creative');
  if (!section) { return; }

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var overlay = section.querySelector('[data-cw-overlay]');
  var modal = section.querySelector('[data-cw-modal]');
  var modalMedia = section.querySelector('[data-cw-modal-media]');
  var modalTitle = section.querySelector('[data-cw-modal-title]');
  var modalDesc = section.querySelector('[data-cw-modal-desc]');
  var closeBtn = section.querySelector('[data-cw-close]');
  var tiles = Array.prototype.slice.call(section.querySelectorAll('[data-cw-tile]'));

  if (!overlay || !modal || !closeBtn) { return; }

  var lastTrigger = null;
  var life = new Map(); // tile -> interval id, for the JS-driven "life" effects

  /* ---------------- modal: open / close / focus trap ---------------- */

  function getFocusable() {
    var nodes = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.slice.call(nodes).filter(function (el) {
      return !el.hasAttribute('disabled') && el.offsetParent !== null;
    });
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      var f = getFocusable();
      if (f.length === 0) { e.preventDefault(); return; }
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onOverlayPointerDown(e) {
    if (e.target === overlay) {
      closeModal();
    }
  }

  function openModal(tile) {
    lastTrigger = tile;

    var mock = tile.querySelector('.cw-mock');
    modalMedia.innerHTML = '';
    if (mock) {
      modalMedia.appendChild(mock.cloneNode(true));
    }
    modalTitle.textContent = tile.getAttribute('data-title') || '';
    modalDesc.textContent = tile.getAttribute('data-desc') || '';

    overlay.hidden = false;
    document.addEventListener('keydown', onKeydown, true);
    overlay.addEventListener('mousedown', onOverlayPointerDown);

    closeBtn.focus();
  }

  function closeModal() {
    if (overlay.hidden) { return; }
    overlay.hidden = true;
    document.removeEventListener('keydown', onKeydown, true);
    overlay.removeEventListener('mousedown', onOverlayPointerDown);
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  closeBtn.addEventListener('click', closeModal);

  /* ---------------- per-tile "life" while hovered/focused ---------------- */

  function tickCounts(tile) {
    var counters = tile.querySelectorAll('[data-cw-count]');
    if (!counters.length) { return null; }
    return window.setInterval(function () {
      counters.forEach(function (c) {
        var base = parseInt(c.getAttribute('data-base'), 10) || 0;
        var current = parseInt(c.textContent, 10);
        if (isNaN(current)) { current = base; }
        var cap = base + 30;
        if (current < cap) {
          c.textContent = String(Math.min(cap, current + 1 + Math.floor(Math.random() * 2)));
        }
      });
    }, 500);
  }

  function cycleStorySegments(tile) {
    var segs = Array.prototype.slice.call(tile.querySelectorAll('.cw-story-seg'));
    if (!segs.length) { return null; }
    var i = 0;
    segs.forEach(function (s) { s.classList.remove('is-active', 'is-done'); });
    segs[0].classList.add('is-active');
    return window.setInterval(function () {
      segs[i].classList.remove('is-active');
      segs[i].classList.add('is-done');
      i = (i + 1) % segs.length;
      if (i === 0) {
        segs.forEach(function (s) { s.classList.remove('is-done'); });
      }
      segs[i].classList.add('is-active');
    }, 1400);
  }

  function cycleCarousel(tile) {
    var panels = Array.prototype.slice.call(tile.querySelectorAll('.cw-carousel-panel'));
    var dots = Array.prototype.slice.call(tile.querySelectorAll('.cw-carousel-dot'));
    var track = tile.querySelector('.cw-carousel-track');
    if (!panels.length) { return null; }
    var i = 0;
    return window.setInterval(function () {
      panels[i].classList.remove('is-active');
      if (dots[i]) { dots[i].classList.remove('is-active'); }
      i = (i + 1) % panels.length;
      panels[i].classList.add('is-active');
      if (dots[i]) { dots[i].classList.add('is-active'); }
      if (track && typeof track.scrollTo === 'function') {
        track.scrollTo({ left: panels[i].offsetLeft, behavior: 'smooth' });
      }
    }, 1700);
  }

  function startLife(tile) {
    if (reduceMotion || life.has(tile)) { return; }
    var type = tile.getAttribute('data-cw-type');
    var handle = null;
    if (type === 'feed') { handle = tickCounts(tile); }
    else if (type === 'story') { handle = cycleStorySegments(tile); }
    else if (type === 'carousel') { handle = cycleCarousel(tile); }
    if (handle) { life.set(tile, handle); }
  }

  function stopLife(tile) {
    var handle = life.get(tile);
    if (handle) {
      window.clearInterval(handle);
      life.delete(tile);
    }
  }

  tiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      openModal(tile);
    });

    if (reduceMotion) { return; }

    tile.addEventListener('mouseenter', function () { startLife(tile); });
    tile.addEventListener('focusin', function () { startLife(tile); });
    tile.addEventListener('mouseleave', function () { stopLife(tile); });
    tile.addEventListener('focusout', function (e) {
      if (!tile.contains(e.relatedTarget)) { stopLife(tile); }
    });
  });
})();

/* ===== PROOF ===== */
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
