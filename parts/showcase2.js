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
