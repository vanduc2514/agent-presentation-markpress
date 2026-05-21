---
name: markpress-styling
description: Guide for customizing layout, slide positioning, animations, and visual styles in markpress HTML presentations. Use when adjusting how slides move, transition, or look in the generated impress.js output.
---

# Markpress Styling & Layout Skill

This skill covers layout generation, manual slide positioning (3D/rotation/scale), built-in themes, and custom CSS for markpress impress.js presentations.

## Key Principles

- **All base options are set inline** via `<!--markpress-opt-->` in the markdown file — not as CLI flags or `build.cjs` arguments.
- **Custom CSS injection and HTML post-processing** are done in `build.cjs` after markpress generates the HTML.
- The `build.cjs` calls markpress with `{ theme: false }`; the embedded options in the markdown file take precedence.
- **No GPU-specific CSS** — do not use `will-change`, `contain`, or any GPU hint. Slides must work smoothly on non-GPU browsers.

## Decision Tree

```
Do you want automatic positioning?
  YES → Set "layout" in <!--markpress-opt-->. Remove all <!--slide-attr--> comments.
  NO  → Add <!--slide-attr x=... y=... --> before each slide.

Do you want a different color scheme?
  Built-in is enough → Set "theme" in <!--markpress-opt-->
  Need custom colors  → Edit :root variables or inject CSS in build.cjs

Do you need animations beyond impress.js defaults?
  YES → Add CSS transitions/animations in customCss targeting .step classes
        or .impress-on-step-N body class for per-slide triggers.
```

## Performance Pitfalls

The camera transition works in impress.js by applying a single CSS `transform` to a `#canvas` element that contains **all slides simultaneously**. Every `.step` child is composited on every animation frame during that transform. The default markpress theme is butter-smooth because its `.step` has zero paint cost — just `position`, `box-sizing`, and `opacity`. Any expensive CSS on `.step` (not `.step.active`) multiplies by the total slide count.

### The Mental Model: multiply by N slides

Before adding any CSS rule to `.step`, ask: **"is this applied to all N slides at once?"**

| Applies to | Paint cost multiplier |
|---|---|
| `.step` (base rule) | × N (all slides) |
| `.step.active` | × 1 (only current slide) |
| `body`, `html` | × 1 (single element) |

Put cheap, static properties on `.step`. Move anything visually rich to `.step.active`.

---

### Rule 1 — Never use `rgba()` backgrounds on `.step`

Semi-transparent backgrounds on `.step` are the single most common cause of sluggish transitions. During the canvas transform, each slide sweeps across the body gradient. Semi-transparent slides must be **alpha-composited against the changing background** on every frame.

**Bad:**
```css
.step { background: rgba(255, 255, 255, 0.78); }
```

**Good:**
```css
.step { background: #faf9f7; /* fully opaque hex */ }
```

---

### Rule 2 — Never use `backdrop-filter` on `.step`

`backdrop-filter: blur()` on `.step` forces a separate composite layer for every slide.

---

### Rule 3 — Never use `overflow: hidden` on `.step`

`overflow: hidden` combined with `border-radius` on a 3D-transformed element forces a stacking context and a clipping layer per slide.

---

### Rule 4 — Never use pseudo-elements (`::before`, `::after`) on `.step`

Each pseudo-element is an extra paint surface — 2 pseudo-elements on `.step` = 2 × N extra composite layers.

```css
/* Bad: */
.step::before { background: radial-gradient(...); }

/* Good: */
.step.active::before { background: radial-gradient(...); } /* only active slide */
```

---

### Rule 5 — Never use multi-layer `radial-gradient` on `body`

```css
/* Bad: */
body {
  background:
    radial-gradient(ellipse at 18% 14%, rgba(79,70,229,0.09) 0%, transparent 42%),
    radial-gradient(ellipse at 82% 78%, rgba(5,150,105,0.07) 0%, transparent 40%),
    #f0ede8;
}

/* Good: */
body {
  background: radial-gradient(#f0ede8, #d8d2c8); /* single gradient, cheap */
}
```

---

### Rule 6 — No `box-shadow` on `.step` base rule

```css
/* Bad: */
.step { box-shadow: 0 20px 60px rgba(0,0,0,0.08); }

/* Good: */
.step.active { box-shadow: 0 20px 60px rgba(0,0,0,0.12); } /* only active slide */
```

---

### Rule 7 — No content entrance animations on `.step > *`

If you want entrance effects, use `opacity` only on `.step.active > *`, no `transform`.

---

### Rule 8 — Remove tiled `radial-gradient` background patterns on `body::before`

Tiled gradients create massive raster surfaces that repaint every frame.

---

### Rule 9 — Avoid `rotate-y` and `z` on slide positions

Prefer 2D-only positioning:
```
<!--slide-attr x=1700 y=-300 rotate=-2 -->
```

Reserve `rotate-y`/`rotate-x`/`z` for specific intentional 3D moments.

---

### Rule 10 — Set `opacity: 0` (not `0.15`) on inactive `.step`

Inactive slides at `opacity: 0` are skipped by the compositor entirely. Anything above zero adds compositing cost.

```css
.step {
  opacity: 0;
  transition: opacity 200ms ease;
}
.step.active { opacity: 1; }
```

---

### Keep `data-transition-duration` at 200ms

Set it via post-processing in `build.cjs`:

```js
output = output.replace(
  /(<div[^>]*id=["']impress["'][^>]*)(>)/,
  '$1 data-transition-duration="200"$2'
);
```

---

### The Safe CSS Checklist for `.step`

Before shipping, verify the base `.step` rule contains **only**:

- `position`, `width`, `min-height`, `padding`, `box-sizing`
- `border` (with fully opaque color — no `rgba`)
- `border-radius`
- `background` (fully opaque hex — no `rgba`, no gradients)
- `opacity: 0`
- `transition: opacity Xms ease`

Everything else belongs on `.step.active` or a per-slide `#step-N` rule.


## 1. Automatic Layout Generation

Set the `layout` option **inline** in the `<!--markpress-opt-->` block. **Remove all `<!--slide-attr ...-->` comments first** — any positioning comment disables auto-layout.

### Available layouts

| Layout | Description |
|---|---|
| `horizontal` (default) | Slides along the X axis |
| `vertical` | Slides along the Y axis |
| `grid` | X and Y grid arrangement |
| `random` | Random 5D space (x,y,z,rotate,scale) |

### Inline options

```markdown
<!--markpress-opt
{
  "layout": "grid",
  "autoSplit": false,
  "sanitize": false,
  "title": "My Presentation"
}
markpress-opt-->
```

## 2. Manual Slide Positioning with `<!--slide-attr-->`

Place an HTML comment **immediately before a slide's content** (after the `------` separator).

### Syntax

```
<!--slide-attr x=<int> y=<int> z=<int> rotate=<deg> rotate-x=<deg> rotate-y=<deg> scale=<float> -->
```

### Attribute reference

| Attribute | Effect |
|---|---|
| `x` | Horizontal position (px) |
| `y` | Vertical position (px) |
| `z` | Depth position (px) |
| `rotate` | 2D rotation (degrees) |
| `rotate-x` | 3D tilt around X axis |
| `rotate-y` | 3D tilt around Y axis |
| `scale` | Zoom scale (1 = normal) |

### Example

```markdown
<!--slide-attr x=0 y=0 -->

# First slide

------
<!--slide-attr x=2600 y=0 -->

# Second slide — to the right

------
<!--slide-attr x=0 y=2600 rotate=90 -->

# Third slide — below, rotated
```

## 3. Themes

> Theme customization requires injecting custom HTML/CSS/JS in `build.cjs` and setting `theme: false`.

Built-in themes (for reference only):

| Theme | Description |
|---|---|
| `light` (default) | White background, sans-serif |
| `dark` | Dark background, sans-serif |
| `light-serif` | White background, serif |
| `dark-serif` | Dark background, serif |

## 4. Custom CSS in `build.cjs`

```js
markpress(INPUT, { theme: false }).then(({ html }) => {
  const customCss = `<style>
    .step { font-family: 'Inter', sans-serif; }
    /* ... more overrides ... */
  </style>`;
  const finalHtml = html.replace('</head>', `${customCss}\n</head>`);
  fs.writeFileSync(OUTPUT, finalHtml, 'utf8');
});
```

### impress.js selectors to target

| Selector | Targets |
|---|---|
| `.step` | Every slide |
| `#step-1`, `#step-2`, … | Individual slides by order |
| `.impress-on-step-3` | Applied to `<body>` when slide 3 is active |
| `#impress-toolbar` | Built-in progress toolbar |

## 5. Responsive & Adaptive Sizing

Markpress uses `vmin`/`vmax` units throughout so the presentation scales automatically to the viewport. Avoid fixed `px` font sizes in custom CSS — prefer `vmin` to maintain responsiveness.
