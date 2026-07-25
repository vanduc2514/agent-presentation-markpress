---
name: git-usage
description: Guide for making well-scoped, logical commits. Use when staging, committing, or deciding how to group changes into commits.
---

# Git Usage Skill

Make scoped commits. Each commit should contain changes from exactly one logical concern.

## Scoping Rules

Before committing, analyze all modified files and group them by **scope**. A scope is a single logical concern

## Workflow

1. **Review the full diff** -- look at every changed file
2. **Categorize each file** into the scope it belongs to
3. **If all files share one scope** -> single commit
4. **If files span multiple scopes** -> one commit per scope
5. **Within a file, if changes mix scopes** -> split into separate commits using `git add --patch` or note the mixed concern and ask the user

## Commit Messages

If the project has a commit message convention, follow it. If not, inform the user that you don't have any convention to follow and will use the general convention

__General convention (Only use when project does not have any convention)__

```
<scope>: <short description>

<optional body: why this change was made>
```

Examples of general convention:
- `feat(auth): add OAuth2 login flow`
- `fix(api): handle null pointer in user serializer`
- `refactor(db): extract query builder into separate module`
- `chore(deps): upgrade express to v5`
