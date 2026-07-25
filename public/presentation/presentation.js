/* ── PRESENTATION RUNTIME ─────────────────────────────────────────────
 * Extracted from build.cjs's navScript template literal.
 * Loaded via <script src> in the generated presentation HTML.
 * Must be placed AFTER <script>impress().init();</script>.
 * ────────────────────────────────────────────────────────────────────*/

(function () {
  'use strict';

  // ── SVG icon constants ─────────────────────────────────────────────
  var SVG_HOME = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var SVG_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  var SVG_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  var SVG_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  // ── Slide navigation bar ───────────────────────────────────────────
  var nav = document.createElement('nav');
  nav.className = 'slide-nav';
  nav.setAttribute('aria-label', 'Slide navigation');
  nav.innerHTML =
    '<button class="slide-nav-btn" id="nav-home" type="button" title="Home">'
    + SVG_HOME + 'Home</button>'
    + '<button class="slide-nav-btn" id="nav-prev" type="button" title="Previous slide">'
    + SVG_PREV + 'Previous</button>'
    + '<button class="slide-nav-btn" id="nav-next" type="button" title="Next slide">'
    + 'Next' + SVG_NEXT + '</button>';
  document.body.appendChild(nav);

  // ── PDF download button ────────────────────────────────────────────
  var downloadLink = document.createElement('a');
  downloadLink.className = 'slide-download-link';
  downloadLink.href = './' + (window.__PDF_FILENAME__ || 'presentation.pdf');
  downloadLink.download = window.__PDF_FILENAME__ || 'presentation.pdf';
  downloadLink.title = 'Download presentation as PDF';
  downloadLink.setAttribute('aria-label', 'Download PDF');
  downloadLink.innerHTML = SVG_DOWNLOAD;
  document.body.appendChild(downloadLink);

  // ── Navigation helpers ─────────────────────────────────────────────
  var api = window.impress();

  function goToStep(idx) {
    var steps = document.querySelectorAll('.step');
    if (idx >= 0 && idx < steps.length) {
      api.goto(steps[idx].id);
    }
  }

  function currentStepIndex() {
    var steps = document.querySelectorAll('.step');
    var active = document.querySelector('.step.present, .step.active');
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] === active) return i;
    }
    return 0;
  }

  document.getElementById('nav-home').addEventListener('click', function () {
    goToStep(0);
  });
  document.getElementById('nav-prev').addEventListener('click', function () {
    goToStep(currentStepIndex() - 1);
  });
  document.getElementById('nav-next').addEventListener('click', function () {
    goToStep(currentStepIndex() + 1);
  });

  // Disable impress.js built-in keyboard navigation
  api.next = function () {};
  api.prev = function () {};

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToStep(currentStepIndex() - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goToStep(currentStepIndex() + 1); }
    else if (e.key === 'Home') { e.preventDefault(); goToStep(0); }
  });

  // ── Touch swipe navigation ─────────────────────────────────────────
  var _sx = 0, _sy = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) { _sx = e.touches[0].clientX; _sy = e.touches[0].clientY; }
  }, { passive: true, capture: true });
  document.addEventListener('touchend', function (e) {
    if (!e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - _sx;
    var dy = e.changedTouches[0].clientY - _sy;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      if (dx > 0) goToStep(currentStepIndex() - 1); else goToStep(currentStepIndex() + 1);
    }
  }, { passive: false, capture: true });

  // ── Language switcher — preserve current slide via hash ────────────
  document.body.addEventListener('click', function (e) {
    var switcher = e.target.closest('#lang-switcher');
    if (!switcher) return;
    e.preventDefault();
    var active = document.querySelector('.step.present, .step.active');
    var href = switcher.getAttribute('href').split('?')[0].split('#')[0];
    window.location.href = href + '#/' + (active ? active.id : 'step-1');
  });

  // ── Image zoom modal ───────────────────────────────────────────────
  (function () {
    var modal = document.createElement('div');
    modal.className = 'img-modal';
    modal.innerHTML =
      '<button class="close-btn" type="button" aria-label="Close">&times;</button>'
      + '<img alt="">';
    document.body.appendChild(modal);

    var modalImg = modal.querySelector('img');
    var closeBtn = modal.querySelector('.close-btn');

    function openModal(src) {
      modalImg.src = src;
      modal.classList.add('open');
    }

    function closeModal() {
      modal.classList.remove('open');
      modalImg.src = '';
    }

    document.querySelectorAll('.step img').forEach(function (img) {
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        openModal(img.src);
      });
    });

    modal.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  })();
})();
