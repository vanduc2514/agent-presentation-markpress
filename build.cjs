'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// SYNTAX HIGHLIGHTING GUARD
// Must run before requiring markpress. Patches highlightSync to prevent crashes
// from grammar parsing failures in marky-markdown's bundled highlights.
// ─────────────────────────────────────────────────────────────────────────────
const Highlights = require('highlights');
const _origHighlightSync = Highlights.prototype.highlightSync;
Highlights.prototype.highlightSync = function (opts) {
  try {
    return _origHighlightSync.call(this, opts);
  } catch (e) {
    return null;
  }
};

const hljs = require('highlight.js');
const markpress = require('markpress');

const INPUT_EN = path.resolve(__dirname, 'slides/presentation.en.md');
const INPUT_VI = path.resolve(__dirname, 'slides/presentation.vi.md');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const OUTPUT_VI = path.resolve(OUTPUT_DIR, 'index.html');
const OUTPUT_EN = path.resolve(OUTPUT_DIR, 'index.en.html');

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE TAG MANAGER (GA4)
// ─────────────────────────────────────────────────────────────────────────────
const GTM_SCRIPT = `
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-R8QY6LDP67"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-R8QY6LDP67');
  </script>
`;

// ─────────────────────────────────────────────────────────────────────────────
// REMOTE BASE URL
// ─────────────────────────────────────────────────────────────────────────────
const REMOTE_BASE_URL = process.env.REMOTE_BASE_URL ||
  'https://vanduc2514.github.io/agent-presentation-markpress';

// ─────────────────────────────────────────────────────────────────────────────
// REMOTE CONTROL ASSETS
// ─────────────────────────────────────────────────────────────────────────────
const SRC = path.resolve(__dirname, 'src');
const REMOTE_CTRL_CSS = fs.readFileSync(path.join(SRC, 'remote-control.css'), 'utf8');
const REMOTE_CTRL_JS  = fs.readFileSync(path.join(SRC, 'remote-control.js'),  'utf8');
const REMOTE_HTML     = fs.readFileSync(path.join(SRC, 'remote.html'),        'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────────────────────────────────────
const googleFonts = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,200..700;1,14..32,200..700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
`;

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB BADGE
// ─────────────────────────────────────────────────────────────────────────────
const githubBadge = `
  <a href="https://github.com/vanduc2514" target="_blank" rel="noopener noreferrer" class="gh-badge" aria-label="GitHub profile">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" width="22" height="22" aria-hidden="true">
      <path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
    </svg>
  </a>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CSS
// ─────────────────────────────────────────────────────────────────────────────
const customCss = `
  <style>
    :root {
      --ink: #18181b;
      --ink-dim: #52525b;
      --muted: #a1a1aa;
      --line: #e4e4e7;
      --accent: #4f46e5;
      --group-accent: #4f46e5;
      --border-accent-width: 5px;
      --radius: 20px;
    }

    html, body {
      background: #f1f5f9;
      color: var(--ink);
      font-family: "Space Grotesk", "Inter", "Segoe UI", system-ui, sans-serif;
    }

    .step {
      width: min(1160px, 84vw);
      min-height: min(680px, 75vh);
      padding: 2.8rem 3.2rem;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-top: var(--border-accent-width) solid var(--group-accent);
      border-radius: var(--radius);
      background: #ffffff;
      opacity: 0;
      transition: opacity 200ms ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.2rem;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .step.active {
      opacity: 1;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .step > *:first-child { margin-top: 0; }

    .step h1, .step h2, .step h3 {
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      letter-spacing: -0.03em;
      line-height: 1.0;
      color: var(--ink);
      margin-bottom: 0.65rem;
      border-bottom: 0;
    }

    .step h1 {
      font-size: clamp(2.35rem, 4.9vmin, 4.8rem);
      font-weight: 700;
      max-width: 820px;
    }

    .step h2 {
      font-size: clamp(1.05rem, 2.0vmin, 1.6rem);
      color: var(--ink-dim);
      font-weight: 400;
      letter-spacing: -0.01em;
      line-height: 1.3;
      max-width: 34ch;
    }

    .step h3 {
      font-size: clamp(0.85rem, 1.6vmin, 1.2rem);
      color: var(--group-accent);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .step p, .step li, .step td, .step th, .step blockquote {
      font-size: clamp(1rem, 1.65vmin, 1.3rem);
      line-height: 1.45;
      color: var(--ink);
      font-weight: 400;
    }

    .step ul, .step ol { margin-top: 1.2rem; padding-left: 1.1em; }
    .step li { margin: 0.45rem 0; padding-left: 0.3rem; }
    .step li::marker { color: var(--group-accent); content: "\\25b8  "; }
    .step strong { color: var(--group-accent); font-weight: 700; }

    .step code {
      display: inline-block;
      padding: 0.1em 0.52em;
      border-radius: 6px;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      color: #0f172a;
      font-size: 0.88em;
      font-family: "SF Mono", "Fira Code", monospace;
    }

    .step pre {
      padding: 0.95rem 1.1rem;
      border-radius: 18px;
      border: 1px solid #e4e4e7;
      background: #f8fafc;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .step pre code {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
      color: #18181b;
      border-radius: 0;
    }

    .step blockquote {
      margin: 1.4rem 0 0;
      padding: 1rem 0 1rem 1.4rem;
      border-left: 4px solid var(--group-accent);
      color: var(--ink-dim);
      background: #f8fafc;
      border-radius: 0 12px 12px 0;
    }

    .step table {
      width: 100%;
      margin-top: 1.6rem;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: #ffffff;
    }

    .step thead th {
      background: #f4f4f5;
      color: var(--group-accent);
      font-size: clamp(0.8rem, 1.45vmin, 1.05rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .step th, .step td {
      padding: 0.9rem 1.1rem;
      border: 0;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }
    .step tr:last-child td { border-bottom: 0; }

    .step a {
      color: var(--group-accent);
      text-decoration: none;
      border-bottom: 1px solid #e4e4e7;
      transition: border-color 150ms;
    }
    .step a:hover { border-bottom-color: var(--group-accent); }

    .step img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid var(--line);
      cursor: pointer;
    }

    @media (max-width: 900px) {
      .step {
        width: 90vw;
        min-height: 72vh;
        padding: 2rem 1.8rem;
        border-radius: 16px;
        justify-content: flex-start;
      }
      .step h1 { font-size: clamp(1.8rem, 4.6vmin, 2.6rem); line-height: 1.12; }
      .step h2 { font-size: clamp(0.9rem, 2.25vmin, 1.15rem); }
      .step p, .step li, .step td, .step th, .step blockquote {
        font-size: clamp(0.9rem, 2.1vmin, 1.08rem);
        line-height: 1.38;
      }
      .step pre {
        padding: 0.62rem 0.8rem;
        border-radius: 12px;
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .step pre code {
        font-size: clamp(0.7rem, 1.9vmin, 0.95rem);
        white-space: pre;
        word-break: normal;
      }
    }

    /* ── TITLE SLIDE ───────────────────────────────────────────────────── */
    #step-1 {
      --group-accent: #f97316;
      background: #fff7ed;
      border-top-width: calc(var(--border-accent-width) + 1px);
    }
    #step-1 h1 {
      font-size: clamp(3.2rem, 6.4vmin, 6.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1.08;
    }
    #step-1 h2 { margin-top: 0.7rem; font-weight: 400; color: var(--ink-dim); }

    #step-2, #step-3, #step-4 { --group-accent: #ef4444; }
    #step-5, #step-6, #step-7 { --group-accent: #22c55e; }
    #step-8, #step-9, #step-10 { --group-accent: #3b82f6; }
    #step-11, #step-12, #step-13 { --group-accent: #a855f7; }
    #step-14, #step-15, #step-16 { --group-accent: #f59e0b; }

    /* ── THANK YOU SLIDE ───────────────────────────────────────────────── */
    #step-6, #step-7 { justify-content: center; }
    #step-6 table, #step-7 table {
      width: min(100%, 720px);
      margin: 1rem auto 0;
      border: 0;
      background: transparent;
      table-layout: fixed;
      border-spacing: 26px 8px;
    }
    #step-6 thead th, #step-7 thead th {
      background: transparent;
      color: var(--ink-dim);
      text-transform: none;
      letter-spacing: 0;
      font-weight: 600;
      font-size: clamp(0.8rem, 1.45vmin, 1rem);
      text-align: center;
      border: 0;
      padding-bottom: 0.2rem;
    }
    #step-6 td, #step-7 td {
      border: 0;
      text-align: center;
      width: 50%;
      padding: 0.2rem 0.25rem;
      background: transparent;
    }
    #step-6 tbody tr:nth-child(1) img, #step-7 tbody tr:nth-child(1) img {
      width: 180px;
      height: 180px;
      object-fit: contain;
      margin: 0 auto;
    }
    #step-6 tbody tr:nth-child(2) img, #step-7 tbody tr:nth-child(2) img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      margin: 6px auto 0;
      border: 0;
      border-radius: 0;
    }

    /* ── SYNTAX HIGHLIGHTING ────────────────────────────────────────────── */
    .hljs { color: #24292e; background: transparent; }
    .hljs-keyword, .hljs-selector-tag { color: #d73a49; font-weight: 600; }
    .hljs-string, .hljs-attr { color: #032f62; }
    .hljs-number, .hljs-literal { color: #005cc5; }
    .hljs-property, .hljs-built_in { color: #6f42c1; }
    .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
    .hljs-variable, .hljs-title { color: #e36209; }
    .hljs-punctuation { color: #586069; }

    /* ── GITHUB BADGE ───────────────────────────────────────────────────── */
    .gh-badge {
      position: fixed;
      top: 16px;
      left: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      opacity: 0.5;
      transition: opacity 200ms ease, background 200ms ease;
    }
    .gh-badge:hover { opacity: 1; background: rgba(255, 255, 255, 0.98); }
    .gh-badge svg { fill: #18181b; display: block; }
    /* ── SLIDE NAVIGATION BAR ───────────────────────────────────────────── */
    .slide-nav {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9998;
      display: flex;
      gap: 4px;
      padding: 6px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.85);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      border: 1px solid var(--line);
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
    }
    .slide-nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 6px 14px;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--ink-dim);
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .slide-nav-btn:hover,
    .slide-nav-btn:focus-visible {
      background: rgba(15, 23, 42, 0.07);
      color: var(--ink);
      outline: none;
    }
    .slide-nav-btn:active {
      background: rgba(15, 23, 42, 0.12);
      color: var(--ink);
    }
  </style>`;

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────
const SVG_HOME = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const SVG_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const SVG_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE SWITCHER
// ─────────────────────────────────────────────────────────────────────────────
const langSwitcherEn = `
  <a id="lang-switcher" href="./index.html" title="Switch to Ti\u1ebfng Vi\u1ec7t">\u{1F1FB}\u{1F1F3} Ti\u1ebfng Vi\u1ec7t</a>
  <style>
    #lang-switcher {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 9999;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
  </style>`;

const langSwitcherVi = `
  <a id="lang-switcher" href="./index.en.html" title="Switch to English">\u{1F1EC}\u{1F1E7} English</a>
  <style>
    #lang-switcher {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 9999;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
  </style>`;

// ─────────────────────────────────────────────────────────────────────────────
// POST-PROCESSING: SYNTAX HIGHLIGHTING
// ─────────────────────────────────────────────────────────────────────────────
function applyHighlighting(html) {
  return html.replace(
    /<div class="highlight ([^"\s]+)"><pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre><\/div>/g,
    (match, lang, escapedCode) => {
      if (!lang) return match;
      const code = escapedCode
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      try {
        const result = hljs.highlight(code.trim(), { language: lang, ignoreIllegals: true });
        return `<pre><code class="hljs language-${lang}">${result.value}</code></pre>`;
      } catch (e) {
        return `<pre><code class="hljs">${escapedCode}</code></pre>`;
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
function buildPresentation(input, output, langSwitcher) {
  return markpress(input, { theme: false }).then(({ html }) => {
    let stripped = html
      .replace(/<link[^>]+markpress[^>]*>/gi, '')
      .replace(/<link[^>]+theme[^>]*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
        if (/font-family|line-height|blockquote|pre\s*\{/.test(match)) return '';
        return match;
      });

    stripped = stripped.replace(
      /(<div[^>]*id=["']impress["'][^>]*)(>)/,
      '$1 data-transition-duration="200"$2'
    );

    stripped = applyHighlighting(stripped);

    // ── Inject slide navigation bar after impress().init() ──────────────────
    const navScript = `
<script>
(function() {
  var nav = document.createElement('nav');
  nav.className = 'slide-nav';
  nav.setAttribute('aria-label', 'Slide navigation');
  nav.innerHTML =
    '<button class="slide-nav-btn" id="nav-home" type="button" title="Home">'
    + '${SVG_HOME}Home</button>'
    + '<button class="slide-nav-btn" id="nav-prev" type="button" title="Previous slide">'
    + '${SVG_PREV}Prev</button>'
    + '<button class="slide-nav-btn" id="nav-next" type="button" title="Next slide">'
    + 'Next${SVG_NEXT}</button>';
  document.body.appendChild(nav);

  var api = window.impress();
  document.getElementById('nav-home').addEventListener('click', function () {
    var steps = document.querySelectorAll('.step');
    if (steps.length) api.goto(steps[0].id);
  });
  document.getElementById('nav-prev').addEventListener('click', function () {
    api.prev();
  });
  document.getElementById('nav-next').addEventListener('click', function () {
    api.next();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); api.prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); api.next(); }
    else if (e.key === 'Home') { e.preventDefault(); var steps = document.querySelectorAll('.step'); if (steps.length) api.goto(steps[0].id); }
  });

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
      if (dx > 0) api.prev(); else api.next();
    }
  }, { passive: false, capture: true });
})();
</script>
`;

    stripped = stripped.replace(
      '<script>impress().init();</script>',
      '<script>impress().init();</script>' + navScript
    );

    const remoteScripts =
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>\n' +
      `<script>\nvar __REMOTE_BASE__ = ${JSON.stringify(REMOTE_BASE_URL)};\n${REMOTE_CTRL_JS}\n</script>`;

    const finalHtml = stripped
      .replace('<head>', `<head>\n${GTM_SCRIPT}\n${googleFonts}`)
      .replace('</head>', `${customCss}\n<style id="rc-styles">\n${REMOTE_CTRL_CSS}\n</style>\n</head>`)
      .replace('<body>', `<body>\n${githubBadge}`)
      .replace('</body>', `${langSwitcher}\n${remoteScripts}\n</body>`);

    fs.writeFileSync(output, finalHtml, 'utf8');
    console.log(`Built: ${output}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, 'remote.html'), REMOTE_HTML, 'utf8');
console.log(`Built: ${path.join(OUTPUT_DIR, 'remote.html')}`);

Promise.all([
  buildPresentation(INPUT_EN, OUTPUT_EN, langSwitcherEn),
  buildPresentation(INPUT_VI, OUTPUT_VI, langSwitcherVi),
]).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
