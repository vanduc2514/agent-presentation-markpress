'use strict';

/**
 * generate-pdf.cjs — Playwright-based PDF generator
 *
 * Serves the built HTML on a local port, navigates through every slide,
 * captures screenshots, assembles them into an A4-landscape print HTML,
 * and converts it to PDF.
 *
 * Usage: node generate-pdf.cjs <html-filename> <lang-suffix>
 *   <lang-suffix> is e.g. 'en' or 'vi'
 * Pre-condition: `npm run build` must have run first.
 */

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const http         = require('http');
const fs           = require('fs');
const path         = require('path');

// ── Configuration ─────────────────────────────────────────────────────────────

const PORT         = 4174;
const BASE_URL     = `http://localhost:${PORT}`;
const OUTPUT_DIR   = path.join(__dirname, 'output');
const NAV_TIMEOUT  = 10_000;

const HTML_FILENAME = process.argv[2];
const LANG_SUFFIX   = process.argv[3] || '';

if (!HTML_FILENAME) {
  console.error('Usage: node generate-pdf.cjs <html-filename> <lang-suffix>');
  process.exit(1);
}

const GIT_HASH = process.env.BUILD_GIT_SHA
  ? process.env.BUILD_GIT_SHA.toString().trim().slice(0, 7)
  : '';

const PDF_FILENAME = 'presentation' + (LANG_SUFFIX ? '-' + LANG_SUFFIX : '') + (GIT_HASH ? '-' + GIT_HASH : '') + '.pdf';

const HTML_PATH  = path.join(OUTPUT_DIR, HTML_FILENAME);
const PDF_OUT    = path.join(OUTPUT_DIR, PDF_FILENAME);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installChromium() {
  console.log('Playwright Chromium not found. Installing browser binary\u2026');
  execFileSync('npx', ['playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    cwd: __dirname,
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (
      message.includes("Executable doesn't exist") ||
      message.includes('Please run the following command to download new browsers') ||
      message.includes('browserType.launch')
    ) {
      installChromium();
      return await chromium.launch();
    }
    throw err;
  }
}

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath  = req.url === '/' ? '/' + HTML_FILENAME : req.url.split('?')[0];
      const filePath = path.join(OUTPUT_DIR, urlPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(PORT, 'localhost', () => resolve(server));
    server.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(HTML_PATH)) {
    console.error('ERROR: ' + HTML_PATH + ' not found. Run `npm run build` first.');
    process.exit(1);
  }

  console.log('Starting server on port ' + PORT + ' for ' + HTML_FILENAME + '\u2026');
  const serverProcess = await startServer();

  const browser = await launchBrowser();

  try {
    // ── Capture slide screenshots ─────────────────────────────────────────────

    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 2, // 2x resolution for crisp PDF output
    });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('.impress-on', { timeout: NAV_TIMEOUT }).catch(function () {});
    await sleep(800);

    // Hide all interactive UI overlays — they must not appear in the PDF
    await page.addStyleTag({
      content: '.slide-nav, .gh-badge, .slide-download-link, #lang-switcher, #rc-btn, #rc-overlay { display: none !important; }',
    });

    // Collect step IDs in presentation order
    const stepIds = await page.evaluate(function () {
      return Array.from(document.querySelectorAll('.step')).map(function (s) { return s.id; });
    });

    const screenshots = []; // base64 PNG strings

    for (var i = 0; i < stepIds.length; i++) {
      await page.evaluate(function (id) { window.impress().goto(id); }, stepIds[i]);
      await sleep(700);

      var buf = await page.screenshot({ type: 'png' });
      screenshots.push(buf.toString('base64'));
      console.log('  Captured slide ' + (i + 1) + '/' + stepIds.length + ': ' + stepIds[i]);
    }

    await context.close();

    // ── Build print HTML ──────────────────────────────────────────────────────

    var totalPages = screenshots.length;

    var pagesHtml = screenshots.map(function (img, i) {
      return '\n  <div class="pdf-page">\n    <img class="pdf-slide-img" src="data:image/png;base64,' + img + '" alt="Slide ' + (i + 1) + '">\n    <div class="pdf-footer">\n      <span class="pdf-repo-url">github.com/vanduc2514</span>\n      <span class="pdf-page-num">' + (i + 1) + ' / ' + totalPages + '</span>\n    </div>\n  </div>';
    }).join('\n');

    var printHtml = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<style>\n* { margin: 0; padding: 0; box-sizing: border-box; }\n@page { size: A4 landscape; margin: 0; }\nbody { background: white; font-family: "Space Grotesk", "Inter", "Segoe UI", sans-serif; }\n.pdf-page {\n  width: 297mm;\n  height: 210mm;\n  position: relative;\n  break-after: page;\n  overflow: hidden;\n  background: white;\n  display: flex;\n  flex-direction: column;\n}\n.pdf-page:last-child { break-after: auto; }\n.pdf-slide-img {\n  display: block;\n  width: 100%;\n  flex: 1;\n  object-fit: contain;\n  object-position: center;\n  min-height: 0;\n}\n.pdf-footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 0 12px;\n  height: 22px;\n  flex-shrink: 0;\n  background: #f1f5f9;\n  border-top: 1px solid #e4e4e7;\n  font-size: 8pt;\n  color: #52525b;\n}\n</style>\n</head>\n<body>\n' + pagesHtml + '\n</body>\n</html>';

    // ── Generate PDF ──────────────────────────────────────────────────────────

    var printPage = await browser.newPage();
    await printPage.setContent(printHtml, { waitUntil: 'networkidle' });
    await sleep(500);

    await printPage.pdf({
      path: PDF_OUT,
      format: 'A4',
      landscape: true,
      printBackground: true,
    });

    console.log('PDF generated: ' + PDF_OUT);
    await printPage.close();
  } finally {
    await browser.close();
    serverProcess.close();
  }
})().catch(function (err) {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
