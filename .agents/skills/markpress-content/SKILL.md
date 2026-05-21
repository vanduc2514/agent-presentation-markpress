---
name: markpress-content
description: Guide for writing and editing markdown content in markpress format. Use when creating or editing .md presentation files that will be compiled by markpress into impress.js HTML slideshows.
---

# Markpress Content Editing Skill

This skill helps you write and edit markdown files in the markpress format for creating impress.js presentations.

## Core Concepts

Markpress converts a single `.md` file into a self-contained `impress.js` HTML presentation. Every structural decision lives inside the markdown file itself.

## Common Pitfalls

- `------` must be on its own line with no leading/trailing whitespace.
- With `autoSplit`, a `<style>` block at the very top creates an empty first slide — place it after the first slide separator.
- Slide-positioning comments (`<!--slide-attr ...-->`) disable auto-layout entirely; remove all of them if you want `--layout` to work.
- Do not put `<!--markpress-opt-->` inside a slide; it must precede all content.

## Slide Separators

### Manual separator (recommended)
Use `------` (six or more dashes on its own line) to explicitly end a slide and begin a new one:

```markdown
# Slide One

Some content here.

------

# Slide Two

More content.
```

### Auto-split by heading
Use the `-a` / `--auto-split` CLI flag (or `autoSplit: true` in options) to automatically start a new slide at every `h1` (`#`) heading. **Do not mix `<!--slide-attr ...-->` comments with auto-split** — if any positioning comment is found, auto-layout is disabled.

## Embedded File-Level Options

Place a `<!--markpress-opt ... markpress-opt-->` block at the very top of the file to embed options that travel with the file:

```markdown
<!--markpress-opt
{
  "theme": "light",
  "autoSplit": false,
  "sanitize": false,
  "noEmbed": false,
  "edit": false,
  "title": "My Presentation"
}
markpress-opt-->
```

These options override CLI flags when the file is processed.

## Markdown Features Supported

Markpress uses **GitHub Flavored Markdown** via `marky-markdown`. Supported elements:

| Element | Syntax |
|---|---|
| Headings | `# H1` through `###### H6` |
| Bold / Italic | `**bold**`, `*italic*` |
| Inline code | `` `code` `` |
| Fenced code blocks | ` ```language ` … ` ``` ` |
| Tables | GFM pipe syntax |
| Blockquotes | `> quote` |
| Ordered / unordered lists | `1.` or `-` / `*` |
| Horizontal rule | `---` or `***` (NOT used as slide separator) |
| Links | `[text](url)` |
| Images | `![alt](path-or-url)` — embedded into HTML by default |
| Emojis | `:smile:` `:thumbsup:` etc. |
| Raw HTML | Allowed unless `--sanitize` flag is set |

### Code Blocks

Fenced code blocks support syntax highlighting for most common languages:

```markdown
```javascript
const greeting = 'hello';
console.log(greeting);
```
```

---

## Embedding HTML

You can drop raw HTML directly inside slides. This is useful for iframes, videos, or custom elements:

```markdown
<video src="demo.mp4" autoplay loop></video>
```

> **Important**: `--sanitize` / `sanitize: true` strips dangerous HTML. Disable sanitize if you need `<style>` tags, videos, or iframes.

---

## HTML-Free Authoring (Strongly Preferred)

**Never write custom `<div>` wrappers or styled containers inside the markdown file.** The markdown source is for content structure only — styling and DOM transformation belong in the build script (`build.cjs`).

### Pattern

Write plain markdown lists and let the build script convert them to styled components:

**In `slides/presentation.md` — pure markdown:**
```markdown
# Slide Title

- First item with **emphasis**
- Second item
- Third item
```

**In `build.cjs` — post-processing transform:**
```js
// Wrap the <ul> inside a specific step into a styled card grid
stripped = wrapStepList(stripped, 'step-2', 'card-grid', 'card-item');
```

The helper reads the rendered `<ul><li>` output and replaces it with `<div class="card-grid"><div class="card-item">…</div></div>` — keeping all markdown formatting (`**bold**`, inline code, etc.) intact.

### Two-Column Layouts

For two-column layouts, write a blockquote (left column) followed by a list (right column). The build script splits them:

**In markdown:**
```markdown
> Left column content here.
> Can span multiple lines.

- Right item one
- Right item two
- Right item three
```

**In `build.cjs`:**
```js
stripped = wrapStepTwoCol(stripped, 'step-8');
```

### When Raw HTML Is Acceptable

Only use raw HTML for elements that have no markdown equivalent:

| Acceptable | Reason |
|---|---|
| `<video src="…">` | No markdown video syntax |
| `<iframe src="…">` | No markdown iframe syntax |
| `<image src="…">` | Image with custom styling |
| `<!--slide-attr …-->` | Required markpress positioning comments |
| `<!--markpress-opt … markpress-opt-->` | Required markpress config block |

Everything else — cards, grids, columns, callouts, timelines — belongs in the build script.

## Images

Standard markdown image syntax works. By default markpress **embeds** images as base64 inside the HTML (self-contained output). To skip embedding and keep external references, use `--no-embed` / `noEmbed: true`.

```markdown
![Diagram](./images/diagram.png)
```

---

## Workflow for Editing Content

1. **Open the `.md` source file** — never edit the generated `.html` directly.
2. **Add/modify slides** using `------` separators.
3. **Use `markpress-opt`** at the top when you want settings saved with the file.
4. **Preview changes** with live-edit mode:
   ```bash
   markpress input.md --edit
   ```
   This starts a local web server with live refresh on file save.
5. **Build final output**:
   ```bash
   npm run build
   ```
