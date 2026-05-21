'use strict';

const fs = require('fs');
const path = require('path');
const markpress = require('markpress');

const INPUT = path.resolve(__dirname, 'slides/presentation.md');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const OUTPUT = path.resolve(OUTPUT_DIR, 'index.html');

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// Replace with any Google Fonts link. Update font-family in customCss below.
// ─────────────────────────────────────────────────────────────────────────────
const googleFonts = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,200..700;1,14..32,200..700&display=swap" rel="stylesheet">
`;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CSS
// Injected into <head> after markpress output. Overrides the default theme.
// Organized into sections — customize only the parts you need.
// ─────────────────────────────────────────────────────────────────────────────
const customCss = `
  <style>
    /* ── COLOR PALETTE ─────────────────────────────────────────────────────
       Change these variables to retheme the entire presentation.          */
    :root {
      --ink: #18181b;       /* body text */
      --ink-dim: #52525b;   /* subtitles, secondary text */
      --muted: #a1a1aa;     /* captions, tertiary */
      --line: #e4e4e7;      /* borders */
      --accent: #4f46e5;    /* primary highlight */
      --accent2: #059669;   /* secondary highlight */
      --radius: 28px;       /* slide corner radius */
    }

    /* ── BACKGROUND ────────────────────────────────────────────────────────
       Keep it a single simple gradient — see markpress-styling SKILL.md
       for performance rules before adding multiple layers.                */
    html, body {
      background: radial-gradient(#f0ede8, #d8d2c8);
      color: var(--ink);
      font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    }

    /* ── SLIDE CARD (base .step) ────────────────────────────────────────────
       RULES:
       - background MUST be a fully opaque hex — never rgba()
       - box-shadow belongs on .step.active only — not here
       - no pseudo-elements (::before / ::after) on .step              */
    .step {
      width: min(1160px, 84vw);
      min-height: min(680px, 75vh);
      padding: 3.6rem 4.2rem;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #faf9f7;     /* ← change slide background here */
      opacity: 0;
      transition: opacity 200ms ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .step.active {
      opacity: 1;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .step > *:first-child {
      margin-top: 0;
    }

    /* ── TYPOGRAPHY ─────────────────────────────────────────────────────────
       Font sizes use clamp() so they scale with the viewport.             */
    .step h1,
    .step h2,
    .step h3 {
      font-family: "Inter", system-ui, sans-serif;
      letter-spacing: -0.03em;
      line-height: 1.0;
      color: var(--ink);
      margin-bottom: 0.65rem;
      border-bottom: 0;
    }

    .step h1 {
      font-size: clamp(2.6rem, 5.2vmin, 5.2rem);
      font-weight: 300;
      max-width: 820px;
    }

    .step h2 {
      font-size: clamp(1.1rem, 2.1vmin, 1.85rem);
      color: var(--ink-dim);
      font-weight: 400;
      letter-spacing: -0.01em;
      line-height: 1.3;
      max-width: 34ch;
    }

    .step h3 {
      font-size: clamp(0.85rem, 1.6vmin, 1.2rem);
      color: var(--accent);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .step p,
    .step li,
    .step td,
    .step th,
    .step blockquote {
      font-size: clamp(1.05rem, 2.0vmin, 1.6rem);
      line-height: 1.55;
      color: var(--ink);
      font-weight: 400;
    }

    .step ul,
    .step ol {
      margin-top: 1.2rem;
      padding-left: 1.1em;
    }

    .step li {
      margin: 0.65rem 0;
      padding-left: 0.3rem;
    }

    .step li::marker {
      color: var(--accent);
      content: "\u25b8  ";
    }

    .step strong {
      color: var(--accent);
      font-weight: 600;
    }

    /* ── CODE ───────────────────────────────────────────────────────────────*/
    .step code {
      display: inline-block;
      padding: 0.1em 0.52em;
      border-radius: 6px;
      background: #edeafc;
      border: 1px solid #c7c3f0;
      color: var(--accent);
      font-size: 0.88em;
      font-family: "SF Mono", "Fira Code", monospace;
    }

    .step pre {
      padding: 1.2rem 1.4rem;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: #1e1e2e;
    }

    .step pre code {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
      color: #cdd6f4;
      border-radius: 0;
    }

    /* ── BLOCKQUOTE ─────────────────────────────────────────────────────────*/
    .step blockquote {
      margin: 1.4rem 0 0;
      padding: 1rem 0 1rem 1.4rem;
      border-left: 3px solid var(--accent);
      color: var(--ink-dim);
      background: #f0effe;
      border-radius: 0 12px 12px 0;
    }

    /* ── TABLE ──────────────────────────────────────────────────────────────*/
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
      background: #f0effe;
      color: var(--accent);
      font-size: clamp(0.8rem, 1.45vmin, 1.05rem);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .step th,
    .step td {
      padding: 0.9rem 1.1rem;
      border: 0;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .step tr:last-child td {
      border-bottom: 0;
    }

    /* ── IMAGES ─────────────────────────────────────────────────────────────*/
    .step img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid var(--line);
      cursor: pointer;
    }

    /* ── RESPONSIVE ─────────────────────────────────────────────────────────*/
    @media (max-width: 900px) {
      .step {
        width: 88vw;
        min-height: 72vh;
        padding: 2rem 1.8rem;
        border-radius: 20px;
        justify-content: flex-start;
      }
    }

    /* ── PER-SLIDE OVERRIDES ────────────────────────────────────────────────
       Use #step-N to override styles for a specific slide (1-indexed).
       Example: make slide 1 a styled title card.                         */
    #step-1 {
      background: #f8f7ff;
      border-color: #d4d0f5;
    }

    #step-1 h1 {
      font-size: clamp(3.2rem, 6.4vmin, 6.4rem);
      font-weight: 200;
      letter-spacing: -0.04em;
      line-height: 1.08;
      background: linear-gradient(135deg, #18181b 25%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    #step-1 h2 {
      margin-top: 0.7rem;
      font-weight: 400;
      color: var(--ink-dim);
      -webkit-text-fill-color: var(--ink-dim);
    }
  </style>`;

// ─────────────────────────────────────────────────────────────────────────────
// BUILD
// Runs markpress, strips its default theme, injects custom CSS + fonts.
// Add post-processing transforms below the "Transform" comment.
// ─────────────────────────────────────────────────────────────────────────────
markpress(INPUT, { theme: false }).then(({ html }) => {
  // Strip markpress default theme styles
  let output = html
    .replace(/<link[^>]+markpress[^>]*>/gi, '')
    .replace(/<link[^>]+theme[^>]*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
      if (/font-family|line-height|blockquote|pre\s*\{/.test(match)) return '';
      return match;
    });

  // Smooth camera transition
  output = output.replace(
    /(<div[^>]*id=["']impress["'][^>]*)(>)/,
    '$1 data-transition-duration="200"$2'
  );

  // ── Transform: add here ──────────────────────────────────────────────────
  // Use the helper functions from the original template or add your own:
  //   output = wrapStepList(output, 'step-2', 'card-grid', 'card-item');
  //   output = wrapStepTwoCol(output, 'step-3');
  // ─────────────────────────────────────────────────────────────────────────

  const finalHtml = output
    .replace('<head>', `<head>\n${googleFonts}`)
    .replace('</head>', `${customCss}\n</head>`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, finalHtml, 'utf8');
  console.log(`Built: ${OUTPUT}`);
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
