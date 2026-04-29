# AGENTS.md — Stylus User CSS

## Build pipeline (must run in order)

- `bun run build` → `gulp build`: cleans `dist/` then compiles SCSS → CSS, processes with PostCSS (dedupe/merge/autoprefix), minifies, renames to `.user.css`
- Never edit files in `dist/` directly — they are generated from `src/`
- Dev loop: `bun run dev` watches `src/**/*.scss` and rebuilds

## Project structure

- Single package (no monorepo). All source: `src/font-overrides/`
- Entrypoint for Font Overrides userstyle: `src/font-overrides/index.scss`
- Build output: `dist/font-overrides/index.user.css`
- Imports cascade: `index.scss` → `variables`, `mixins`, `root`, `multi`, then category partials (`ai/`, `banking/`, etc.)
- Partials are SCSS files named `_name.scss` and referenced by `@import "name"` (no underscore)

## Available commands (package.json)

- `bun run dev` — watch mode (gulp watch)
- `bun run build` — full build (clean + compile)
- `bun run lint` / `bun run lint:fix` — stylelint on `src/`
- `bun run format` / `bun run format:check` — Prettier across project
- `bun run gc` — run git commit from `.tmp/git.md`
- `bun run prepare` — install Husky hooks

## Linting & formatting

- Stylelint: `stylelint-config-standard-scss` + `property-sort-order-smacss` with custom rule relaxations (see `stylelint.config.mjs`). Run against `src/` only.
- Prettier: 2-space indent, 80-char print width (see `prettier.config.mjs`)
- Commit linting: `@commitlint/config-conventional` via `commitlint.config.mjs`
- Pre-commit: Husky is configured

## SCSS conventions

- Use mixins from `_mixins.scss`: `set-root-font-sans`, `set-root-font-mono`, `apply-font-sans`, `apply-font-mono`, `init-root-font-aliases`, `emit-font-family`
- Root font variables are defined in `_root.scss` with Google Fonts imports wrapped in `@document` rules (Stylus `@document` support)
- Prefer `@include` mixins over raw CSS font-family rules to keep behavior consistent
- New site styles: create a category partial (e.g., `_ai.scss`) and import it from `index.scss` under the right section, then add the site/file partial (e.g., `ai/_opencode.ai.scss`)

## Style scope and selectors

- Styles are applied via `@document` domain/path rules (Stylus userstyle semantics)
- `_multi.scss` handles generic/common sites with regex/domain rules and broad font application
- Target selectors precisely within `@document` blocks; use mixins for font-family application

## Environment & tooling

- Node env. Lockfile: `bun.lock` (but `package.json` scripts use bun-style commands — `bun`/`pbun`/`bun` all work; prefer bun or pbun per `.github/copilot-instructions.md`)
- Husky is installed; `bun run prepare` sets up hooks
- `commitlint.config.mjs` delegates to `@vijayhardaha/dev-config`

## Important protected files (from existing docs)

- Do not modify `package.json`, `LICENSE`, or anything under `.github/` unless explicitly requested
- Never modify files in `dist/` directly
- Keep comments: preserve existing developer comments; add long ones above properties and short inline

## Workflow checklist for changes

1. Edit SCSS in `src/font-overrides/` only
2. Run `bun run lint:fix` and `bun run format`
3. Run `bun run build` to verify output
4. Commit with conventional commit message

## Git Workflow

**Before preparing git.md (after each task):**

1. Run `composer lint` — Lint check

**After completing a task:**

1. Check unstaged changes: `git status --porcelain` && `git diff`
2. Stage files: `git add <files>`
3. Create `.tmp/git.md` containing the staged files and commit command
4. Create separate commits for each logical change
5. Do NOT run git commands directly — only write to `.tmp/git.md`
6. Wait for user to verify and commit
7. Do NOT restore `.tmp/git.md` after it's cleared — clearing is intentional

Example `.tmp/git.md`:

```bash
git add includes/zt-functions.php
git commit -m "feat(functions): add caching support with transient

- add zt_get_user_tags_cache_key() helper
- add bypass_cache parameter to all helper functions
- add zt_clear_user_tags_cache() function
- cache results for 1 day using transients"
```

## Commit Conventions

**Format:** `<type>(<scope>): <summary>`

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `build`, `chore`

**Rules:** Subject line ≤72 chars, lowercase. Body: normal case, max 100 chars per line. Blank line after subject.
