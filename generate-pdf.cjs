"use strict";

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

const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { getPdfFilename } = require("./build.cjs");

// ── Configuration ─────────────────────────────────────────────────────────────

const PORT = 4174;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(__dirname, "output");
const NAV_TIMEOUT = 10_000;

const HTML_FILENAME = process.argv[2];
const LANG_SUFFIX = process.argv[3] || "";

if (!HTML_FILENAME) {
  console.error("Usage: node generate-pdf.cjs <html-filename> <lang-suffix>");
  process.exit(1);
}

const GIT_HASH = (process.env.BUILD_GIT_SHA || "").slice(0, 7);

const PDF_FILENAME = getPdfFilename(LANG_SUFFIX || undefined);

const HTML_PATH = path.join(OUTPUT_DIR, HTML_FILENAME);
const PDF_OUT = path.join(OUTPUT_DIR, PDF_FILENAME);

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const installChromium = () => {
  console.log("Playwright Chromium not found. Installing browser binary...");
  execFileSync("npx", ["playwright", "install", "chromium"], {
    stdio: "inherit",
    cwd: __dirname,
  });
}

const launchBrowser = async () => {
  try {
    return await chromium.launch();
  } catch (err) {
    const message = String(err?.message || err);
    if (
      message.includes("Executable doesn't exist") ||
      message.includes("download new browsers") ||
      message.includes("browserType.launch")
    ) {
      installChromium();
      return await chromium.launch();
    }
    throw err;
  }
}

// MIME types for static file serving
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const startServer = () => new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath =
        req.url === "/" ? "/" + HTML_FILENAME : req.url.split("?")[0];
      const filePath = path.join(OUTPUT_DIR, urlPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        });
        res.end(data);
      });
    });

    server.listen(PORT, "localhost", () => resolve(server));
    server.on("error", reject);
  });

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(HTML_PATH)) {
    console.error(
      `ERROR: ${HTML_PATH} not found. Run \`npm run build\` first.`,
    );
    process.exit(1);
  }

  console.log(`Starting server on port ${PORT} for ${HTML_FILENAME}\u2026`);
  const serverProcess = await startServer();

  const browser = await launchBrowser();

  try {
    // ── Capture slide screenshots ─────────────────────────────────────────────

    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 2, // 2x resolution for crisp PDF output
    });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await page
      .waitForSelector(".impress-on", { timeout: NAV_TIMEOUT })
      .catch(() => {});
    await sleep(800);

    // Hide all interactive UI overlays — they must not appear in the PDF
    await page.addStyleTag({
      content:
        ".slide-nav, .gh-badge, .slide-download-link, #lang-switcher, #rc-btn, #rc-overlay { display: none !important; }",
    });

    // Collect step IDs in presentation order
    const stepIds = await page.evaluate(() =>
      [...document.querySelectorAll(".step")].map((s) => s.id),
    );

    const screenshots = [];

    for (const [i, id] of stepIds.entries()) {
      await page.evaluate((id) => window.impress().goto(id), id);
      await sleep(700);
      const buf = await page.screenshot({ type: "png" });
      screenshots.push(buf.toString("base64"));
      console.log(`  Captured slide ${i + 1}/${stepIds.length}: ${id}`);
    }

    await context.close();

    // ── Build print HTML ──────────────────────────────────────────────────────

    const totalPages = screenshots.length;

    const pagesHtml = screenshots
      .map(
        (img, i) => `
  <div class="pdf-page">
    <img class="pdf-slide-img" src="data:image/png;base64,${img}" alt="Slide ${i + 1}">
    <div class="pdf-footer">
      <span class="pdf-repo-url">github.com/vanduc2514</span>
      <span class="pdf-page-num">${i + 1} / ${totalPages}</span>
    </div>
  </div>`,
      )
      .join("\n");

    const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 landscape; margin: 0; }
body { background: white; font-family: "Space Grotesk", "Inter", "Segoe UI", sans-serif; }
.pdf-page {
  width: 297mm;
  height: 210mm;
  position: relative;
  break-after: page;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
}
.pdf-page:last-child { break-after: auto; }
.pdf-slide-img {
  display: block;
  width: 100%;
  flex: 1;
  object-fit: contain;
  object-position: center;
  min-height: 0;
}
.pdf-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 22px;
  flex-shrink: 0;
  background: #f1f5f9;
  border-top: 1px solid #e4e4e7;
  font-size: 8pt;
  color: #52525b;
}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;

    // ── Generate PDF ──────────────────────────────────────────────────────────

    const printPage = await browser.newPage();
    await printPage.setContent(printHtml, { waitUntil: "networkidle" });
    await sleep(500);

    await printPage.pdf({
      path: PDF_OUT,
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    console.log(`PDF generated: ${PDF_OUT}`);
    await printPage.close();
  } finally {
    await browser.close();
    serverProcess.close();
  }
})().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
