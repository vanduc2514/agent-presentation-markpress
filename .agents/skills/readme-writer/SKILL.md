---
name: readme-writer
description: Generate bilingual README.md and README.vi-VN.md from markpress slide content. Use when the user asks to create or update README files for a presentation project.
---

# README Writer for Markpress Presentations

Generate bilingual project README files that describe the presentation, its background, and outline extracted from the slide content.

## Output

Two files are created or updated together:

| File | Language | Badge |
|---|---|---|
| `README.md` | English | Points to `README.vi-VN.md` |
| `README.vi-VN.md` | Vietnamese | Points to `README.md` |

## Structure

Both files follow the same template below, strictly follow the format

```markdown
# {Title from slide}

[{other language badge}]({other README file})

{One-paragraph description of the presentation}

## {Background or Bối cảnh}

{2-3 paragraphs of context}

## {Presentation Outline or Nội dung trình bày}

| # | {Topic or Chủ đề} | {Description or Mô tả} |
|---|--------|-------|
| 1 | {Slide 2 heading} | {Brief description} |
| 2 | {Slide 3 heading} | {Brief description} |
| ... | ... | ... |

## {Render}

```sh
npm install
npm run build      # {render description for both languages}
npm run preview    # {preview command description}
```
```

## Rules

1. **Only one badge per file**: English README shows only the `vi` badge. Vietnamese README shows only the `en` badge.
5. **Vietnamese diacritics**: All Vietnamese text must have full diacritic marks.
6. **Both files in sync**: Same number of outline rows, same order. Only the content language differs.
7. **README.md badge format**: `[![vi](https://img.shields.io/badge/lang-vi-yellow.svg)](README.vi-VN.md)`
8. **README.vi-VN.md badge format**: `[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)`

## Workflow

1. Read both `slides/presentation.en.md` and `slides/presentation.vi.md`
2. Extract title, slide headings, and context
3. Write `README.md` and `README.vi-VN.md`
4. Verify both files are structurally identical (same sections, same table rows)
5. Await user approval before committing
