/* =====================================================================
   Mabiat Advisor Marketing — behaviour
   Nav dropdowns · mobile menu · production calculator
   No scroll-triggered animation anywhere. The only motion is the
   calculator ticking between two real numbers on input.
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

  /* ---------- desktop dropdowns ----------
     The trigger is a real anchor, so with JS off it still navigates to
     the section. JS upgrades it to a menu on pointer devices only. */
  var hasHover = window.matchMedia('(hover: hover) and (min-width: 861px)').matches;

  if (hasHover) {
    var items = document.querySelectorAll('[data-dropdown]');

    Array.prototype.forEach.call(items, function (item) {
      var trigger = item.querySelector('.nav-link');
      var closeTimer;

      function open() {
        window.clearTimeout(closeTimer);
        closeAll(item);
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function close() {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', function () {
        closeTimer = window.setTimeout(close, 120);
      });
      item.addEventListener('focusin', open);
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { close(); trigger.focus(); }
      });
    });

    function closeAll(except) {
      Array.prototype.forEach.call(items, function (i) {
        if (i !== except) {
          i.classList.remove('open');
          var t = i.querySelector('.nav-link');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-dropdown]')) closeAll(null);
    });
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
