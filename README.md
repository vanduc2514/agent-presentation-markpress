# Presentation Template

A template for building **impress.js presentations** from Markdown — write slides in `.md`, get a self-contained HTML slideshow, and deploy to GitHub Pages automatically.

Powered by [markpress](https://github.com/davidecaminati/markpress).

## Use This Template

1. Click **Use this template** → **Create a new repository**
2. Clone your new repository
3. Install dependencies
4. Start writing slides

```sh
npm install
npm run build      # → output/index.html
npm run preview    # open in browser
```

Requires Node.js 20. If you use [mise](https://mise.jdx.dev/), run `mise install` first.

## Project Structure

```
slides/
  presentation.md     # your slides source — edit this
  images/             # images referenced in slides
build.cjs             # build script — customize theming here
package.json
mise.toml             # Node.js version pin
.github/
  workflows/
    deploy-pages.yml  # auto-deploy to GitHub Pages on push to main
.agents/
  skills/             # AI agent skills for writing and styling slides
```

## Customizing

### Change the presentation title

Edit the `<!--markpress-opt-->` block at the top of `slides/presentation.md`:

```markdown
<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "Your Presentation Title"
}
markpress-opt-->
```

### Change the color theme

Edit the CSS variables at the top of the `customCss` block in `build.cjs`:

```js
:root {
  --accent: #4f46e5;   /* primary accent color */
  --accent2: #059669;  /* secondary accent color */
  --ink: #18181b;      /* main text color */
}
```

### Change the font

Replace the Google Fonts `<link>` and `font-family` values in `build.cjs`.

### Slide layout

Each slide position is set with `<!--slide-attr-->` comments. See `.agents/skills/markpress-styling/SKILL.md` for the full reference.

## GitHub Pages

The included workflow (`deploy-pages.yml`) builds and deploys on every push to `main`.

Enable GitHub Pages in your repository:
- **Settings** → **Pages** → **Source**: `GitHub Actions`

## Writing Slides

See `.agents/skills/markpress-content/SKILL.md` for the full guide.

Key rules:
- Slides are separated by `------` (six dashes)
- Keep slide content short and punchy
- Speaker notes go in HTML comments `<!-- ... -->`
- Content-heavy layout belongs in `build.cjs`, not inline HTML in the markdown
