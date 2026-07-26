---
name: git-usage
description: Guide for making well-scoped, logical commits. Use when staging, committing, or deciding how to group changes into commits.
---

# Git Usage Skill

Make scoped commits. Each commit should contain changes from exactly one logical concern.

## Scoping Rules

Before committing, analyze all modified files and group them by **scope**. A scope is a single logical concern.

**Choose the scope based on the file's purpose, not its location.** For example, editing `AGENTS.md` to document agent features is an `agent` change, not a `project` change. Editing `README.md` for project overview is `project`.

### Scope definitions (from `.github/hooks/scopes.json`)

| Scope | When to use | Example files |
|---|---|---|
| `slide` | Slide content changes | `slides/presentation.en.md`, `slides/presentation.vi.md` |
| `visual` | Theme, styling, CSS, visual polish | `build.cjs` (theme section), `public/presentation.css` |
| `build` | Build config, scripts, deps | `build.cjs`, `generate-pdf.cjs`, `package.json`, workflow `.yml` |
| `agent` | Agent config, skills, prompts, AGENTS.md docs | `.agents/`, `AGENTS.md` (agent features) |
| `project` | Scaffolding, README, gitignore, cleanup, misc config | `README.md`, `.gitignore`, `mise.toml`, binary cleanup |

## Workflow

1. **Review the full diff** — look at every changed file
2. **Categorize each file** into the scope it belongs to (refer to table above)
3. **If all files share one scope** → single commit
4. **If files span multiple scopes** → one commit per scope
5. **Within a file, if changes mix scopes** → split into separate commits using `git add --patch` or note the mixed concern and ask the user

## Commit Messages

This project uses the convention defined in `.github/hooks/scopes.json`:

```
<scope>: <short description>
```

Valid scopes: `slide`, `visual`, `build`, `agent`, `project`

Examples:
- `slide: add architecture diagram to overview`
- `visual: adjust slide card shadow and border radius`
- `build: update dependencies`
- `agent: refine deployment instructions in AGENTS.md`
- `project: add .gitignore for IDE files`
