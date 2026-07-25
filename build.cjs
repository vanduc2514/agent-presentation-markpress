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
const OUTPUT_EN = path.resolve(OUTPUT_DIR, 'index.html');
const OUTPUT_VI = path.resolve(OUTPUT_DIR, 'index.vi.html');

// ─────────────────────────────────────────────────────────────────────────────
// ASSET PATHS
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const PRESENTATION_DIR = path.resolve(PUBLIC_DIR, 'presentation');
const REMOTE_DIR = path.resolve(PUBLIC_DIR, 'remote');

const PRESENTATION_CSS_FILE = path.resolve(PRESENTATION_DIR, 'presentation.css');
const PRESENTATION_JS_FILE = path.resolve(PRESENTATION_DIR, 'presentation.js');
const REMOTE_CTRL_CSS_FILE = path.resolve(REMOTE_DIR, 'remote-control.css');
const REMOTE_CTRL_JS_FILE = path.resolve(REMOTE_DIR, 'remote-control.js');
const REMOTE_HTML_FILE = path.resolve(REMOTE_DIR, 'index.html');

// ─────────────────────────────────────────────────────────────────────────────
// READ ASSETS
// ─────────────────────────────────────────────────────────────────────────────
const PRESENTATION_CSS = fs.readFileSync(PRESENTATION_CSS_FILE, 'utf8');
const PRESENTATION_JS = fs.readFileSync(PRESENTATION_JS_FILE, 'utf8');
const REMOTE_CTRL_CSS = fs.readFileSync(REMOTE_CTRL_CSS_FILE, 'utf8');
const REMOTE_CTRL_JS = fs.readFileSync(REMOTE_CTRL_JS_FILE, 'utf8');
const REMOTE_HTML = fs.readFileSync(REMOTE_HTML_FILE, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE TAG MANAGER (GA4)
// ─────────────────────────────────────────────────────────────────────────────
const GTM_HTML = `
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-R8QY6LDP67"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-R8QY6LDP67');
  </script>
`;

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_FONTS_HTML = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,200..700;1,14..32,200..700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
`;

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB BADGE
// ─────────────────────────────────────────────────────────────────────────────
const GITHUB_BADGE_HTML = `
  <a href="https://github.com/vanduc2514" target="_blank" rel="noopener noreferrer" class="gh-badge" aria-label="GitHub profile">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" width="22" height="22" aria-hidden="true">
      <path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
    </svg>
  </a>
`;

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE SWITCHER
// ─────────────────────────────────────────────────────────────────────────────
const LANG_SWITCHER = {
  en: '<a id="lang-switcher" href="./index.vi.html" title="Switch to Ti\u1ebfng Vi\u1ec7t">\u{1F1FB}\u{1F1F3} Ti\u1ebfng Vi\u1ec7t</a>',
  vi: '<a id="lang-switcher" href="./index.html" title="Switch to English">\u{1F1EC}\u{1F1E7} English</a>',
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF DOWNLOAD CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const GIT_HASH = process.env.BUILD_GIT_SHA
  ? process.env.BUILD_GIT_SHA.toString().trim().slice(0, 7)
  : '';




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
function buildPresentation(input, output, langSwitcherHtml, pdfSuffix) {
  var pdfFilename = 'presentation' + (pdfSuffix ? '-' + pdfSuffix : '') + (GIT_HASH ? '-' + GIT_HASH : '') + '.pdf';
  return markpress(input, { theme: false }).then(function (_ref) {
    var html = _ref.html;

    var stripped = html
      .replace(/<link[^>]+markpress[^>]*>/gi, '')
      .replace(/<link[^>]+theme[^>]*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, function (match) {
        if (/font-family|line-height|blockquote|pre\s*\{/.test(match)) return '';
        return match;
      });

    stripped = stripped.replace(
      /(<div[^>]*id=["']impress["'][^>]*)(>)/,
      '$1 data-transition-duration="200"$2'
    );

    stripped = applyHighlighting(stripped);

    // ── External CSS ──────────────────────────────────────────────────────
    var cssLink = '<link rel="stylesheet" href="presentation/presentation.css">\n';

    // ── Remote control styles (injected inline — small, immediate) ────────
    var remoteCssTag = '<style id="rc-styles">\n' + REMOTE_CTRL_CSS + '\n</style>\n';

    // ── Remote control scripts (CDN + local file) ─────────────────────────
    var remoteScripts =
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>\n'
      + '<script src="remote-control.js"></script>\n';

    // ── PDF filename script + presentation.js ─────────────────────────────
    var pdfScript = '<script>window.__PDF_FILENAME__="' + pdfFilename + '";</script>\n';
    var jsScript = '<script src="presentation/presentation.js"></script>\n';

    // ── Assemble final HTML ───────────────────────────────────────────────
    var finalHtml = stripped
      .replace('<head>', '<head>\n' + GTM_HTML + '\n' + GOOGLE_FONTS_HTML)
      .replace('</head>', cssLink + '\n' + remoteCssTag + '\n</head>')
      .replace('<body>', '<body>\n' + GITHUB_BADGE_HTML)
      .replace('</body>', langSwitcherHtml + '\n' + remoteScripts + '\n</body>')
      .replace(
        '<script>impress().init();</script>',
        '<script>impress().init();</script>\n' + pdfScript + jsScript
      );

    fs.writeFileSync(output, finalHtml, 'utf8');
    console.log('Built: ' + output);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: copy file
// ─────────────────────────────────────────────────────────────────────────────
function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fs.readFileSync(src, 'utf8'), 'utf8');
  console.log('Copied: ' + dest);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy remote control assets
copyFile(REMOTE_HTML_FILE, path.join(OUTPUT_DIR, 'remote.html'));
copyFile(REMOTE_CTRL_CSS_FILE, path.join(OUTPUT_DIR, 'remote-control.css'));
copyFile(REMOTE_CTRL_JS_FILE, path.join(OUTPUT_DIR, 'remote-control.js'));

// Copy presentation assets to subfolder
var presOutDir = path.join(OUTPUT_DIR, 'presentation');
copyFile(PRESENTATION_CSS_FILE, path.join(presOutDir, 'presentation.css'));
copyFile(PRESENTATION_JS_FILE, path.join(presOutDir, 'presentation.js'));

Promise.all([
  buildPresentation(INPUT_EN, OUTPUT_EN, LANG_SWITCHER.en, 'en'),
  buildPresentation(INPUT_VI, OUTPUT_VI, LANG_SWITCHER.vi, 'vi'),
]).catch(function (err) {
  console.error('Build failed:', err);
  process.exit(1);
});
