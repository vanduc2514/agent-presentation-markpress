/* ── PRESENTATION RUNTIME ─────────────────────────────────────────────
 * Extracted from build.cjs's navScript template literal.
 * Loaded via <script src> in the generated presentation HTML.
 * Must be placed AFTER <script>impress().init();</script>.
 * ────────────────────────────────────────────────────────────────────*/

(() => {
  'use strict';

  // ── SVG icon constants ─────────────────────────────────────────────
  const SVG_HOME = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  const SVG_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  const SVG_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  const SVG_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  // ── Slide navigation bar ───────────────────────────────────────────
  const nav = Object.assign(document.createElement('nav'), {
    className: 'slide-nav',
    ariaLabel: 'Slide navigation',
    innerHTML: `
      <button class="slide-nav-btn" id="nav-home" type="button" title="Home">${SVG_HOME}Home</button>
      <button class="slide-nav-btn" id="nav-prev" type="button" title="Previous slide">${SVG_PREV}Previous</button>
      <button class="slide-nav-btn" id="nav-next" type="button" title="Next slide">Next${SVG_NEXT}</button>
    `,
  });
  document.body.append(nav);

  // ── PDF download button ────────────────────────────────────────────
  const pdfFilename = window.__PDF_FILENAME__ || 'presentation.pdf';
  document.body.append(Object.assign(document.createElement('a'), {
    className: 'slide-download-link',
    href: `./${pdfFilename}`,
    download: pdfFilename,
    title: 'Download presentation as PDF',
    ariaLabel: 'Download PDF',
    innerHTML: SVG_DOWNLOAD,
  }));

  // ── Navigation helpers ─────────────────────────────────────────────
  const api = window.impress();

  const goToStep = (idx) => {
    const steps = document.querySelectorAll('.step');
    if (idx >= 0 && idx < steps.length) api.goto(steps[idx].id);
  };

  const currentStepIndex = () => {
    const active = document.querySelector('.step.present, .step.active');
    if (!active) return 0;
    return [...document.querySelectorAll('.step')].indexOf(active);
  };

  document.getElementById('nav-home').addEventListener('click', () => goToStep(0));
  document.getElementById('nav-prev').addEventListener('click', () => goToStep(currentStepIndex() - 1));
  document.getElementById('nav-next').addEventListener('click', () => goToStep(currentStepIndex() + 1));

  // Disable impress.js built-in keyboard navigation
  api.next = () => {};
  api.prev = () => {};

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToStep(currentStepIndex() - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goToStep(currentStepIndex() + 1); }
    else if (e.key === 'Home') { e.preventDefault(); goToStep(0); }
  });

  // ── Touch swipe navigation ─────────────────────────────────────────
  let sx = 0, sy = 0;
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, { passive: true, capture: true });
  document.addEventListener('touchend', (e) => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      if (dx > 0) goToStep(currentStepIndex() - 1);
      else goToStep(currentStepIndex() + 1);
    }
  }, { passive: false, capture: true });

  // ── Language switcher — preserve current slide via hash ────────────
  document.body.addEventListener('click', (e) => {
    if (e.target.id !== 'lang-switcher') return;
    e.preventDefault();
    const active = document.querySelector('.step.present, .step.active');
    const href = e.target.getAttribute('href').split('?')[0].split('#')[0];
    window.location.href = `${href}#/${active?.id || 'step-1'}`;
  });

  // ── Image zoom modal ───────────────────────────────────────────────
  (() => {
    const modal = Object.assign(document.createElement('div'), {
      className: 'img-modal',
      innerHTML: '<button class="close-btn" type="button" aria-label="Close">&times;</button><img alt="">',
    });
    document.body.append(modal);

    const modalImg = modal.querySelector('img');
    const closeBtn = modal.querySelector('.close-btn');

    const openModal = (src) => { modalImg.src = src; modal.classList.add('open'); };
    const closeModal = () => { modal.classList.remove('open'); modalImg.src = ''; };

    document.querySelectorAll('.step img').forEach((img) => {
      img.addEventListener('click', (e) => { e.stopPropagation(); openModal(img.src); });
    });

    modal.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  })();
})();
