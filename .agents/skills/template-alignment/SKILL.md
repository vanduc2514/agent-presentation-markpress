---
name: template-alignment
description: Generic two-way alignment between two related projects. Compare file structures, diff shared files, and migrate missing changes in either direction. Use when asked to "align with", "sync with", "port from", "migrate changes between", or "compare two projects".
---

# Template Alignment Skill

Generic two-way alignment between two related projects. Determine source and target, compare structures and content, then migrate changes.

## Workflow

### 1. Establish context

Before making changes, resolve these:

| Question | How to determine |
|----------|-----------------|
| **Source** | Which project has the "correct" state? Ask if ambiguous. "Align with X" means source = X. |
| **Target** | The project receiving updates. Default to active editor's project. |
| **Direction** | Source -> Target. Ask if unclear. |
| **Root paths** | Resolve absolute paths for both projects. |

### 2. Compare project structure

Run `find` on both roots (excluding `node_modules`, `.git`, `output`, `package-lock.json`) and categorize:

- **Missing in target** (exists in source only) — candidates to create
- **Extra in target** (exists in target only) — project-specific; ask before deleting
- **Shared** (exists in both) — needs content diff

### 3. Diff shared files

Run `diff` on each shared file. Focus analysis on these high-level topics:

| Topic | What to check |
|-------|---------------|
| **Architecture** | Code style patterns (`const` vs `var`, arrow vs function), module system (guards, exports), inline vs external assets |
| **Configuration** | `.gitignore` entries, `package.json` scripts and deps, CI workflow steps and env vars |
| **Build pipeline** | Build script structure, variable naming conventions, utility functions, post-build hooks |
| **Tooling** | Hook scripts (validation approach), linting, formatting |
| **Documentation** | Project docs (`AGENTS.md`), section structure, references |
| **Public assets** | HTML/CSS/JS files — architecture approach, code style, feature completeness |

For each diff, determine if source's version is the "better" one to port, or if both sides have independent changes that should merge.

### 4. Resolve conflicts

When source and target differ on the same feature or styling, use this hierarchy:

1. **Try to merge** — if both sides have meaningful independent changes, combine them. Example: source has a new CSS variable block, target has a different color palette — keep both by scoping or integrating.
2. **Source wins** — if merging produces broken code, ambiguous intent, or conflicting approaches to the same feature, discard the target version and adopt source's version entirely. This is the default fallback.
3. **Ask only when unclear** — if it's genuinely impossible to determine which approach is correct (e.g., environment-specific paths, credentials, platform-specific config), ask the user. Do not ask for every trivial difference.

**Conflict resolution examples:**

| Situation | Action |
|-----------|--------|
| Same CSS class, different properties | Merge: combine unique properties; source wins on overlap |
| Same function, different implementation | Source wins (replace entire function) |
| Same config key, different value | Source wins |
| Target has something source lacks entirely | Keep it unless it conflicts with source's approach |
| Both add different new features to same area | Merge both if compatible; source wins on collision |

### 5. Apply migration

Apply the identified changes to the target project.

### 6. Verify

Run appropriate checks based on target's stack (syntax checks, build, output listing).

## Content Protection

Ask before modifying content files (slides, images), or READMEs. Always add missing structural files; never remove existing ones without confirmation.
