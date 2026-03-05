# Project Overview

This repository manages Stylus user CSS written in SCSS. The source code is located in `src/font-overrides`.

## Build & Commands

Use `pnpm` as the primary package manager.

- **Install**: `pnpm install`
- **Development**: `pnpm run dev` (runs `gulp watch`)
- **Build**: `pnpm run build` (runs `gulp build`)
- **Format**: `pnpm run format` (runs Prettier)
- **Lint**: `pnpm run lint` or `pnpm run lint:fix` (runs Stylelint)

## Code Style

- **Formatter**: Prettier (config: `prettier.config.mjs`)
- **Indentation**: 2 spaces
- **Print Width**: 80 characters
- **Linting**: Stylelint (config: `stylelint.config.mjs`)

---

# Development Guidelines

## 1. Scope of Changes

- **Make surgical edits**: Change only the minimum number of lines necessary to fix an issue or implement a feature.
- **Source Control**: Only modify files in `src/`. Never modify generated files in `dist/` directly.
- **Preserve Comments**: Keep existing developer comments. Place long comments above properties and short notes inline.

## 2. Protected Files

**Do not modify** the following files unless explicitly instructed by a human maintainer. If a change is required, mention it in the PR description for approval:

- `package.json`
- `LICENSE`
- Any files under `.github/` (workflows, configurations)

## 3. SCSS Specifics

- Keep changes scoped to the relevant partial file (e.g., `_filename.scss`) unless a broader refactor is requested.
- Ensure all changes pass Stylelint checks before finalizing.

## 4. Configuration Safety

- Do not change runtime configuration values (URLs, license texts, version numbers) unless specifically asked.

---

# Workflow Protocol

1. **Analyze & Propose**: Before writing code, briefly explain the problem and the proposed solution.
2. **Confirm Scope**: If a change affects multiple files, list the files and ask for confirmation.
3. **Implement**: Apply the change adhering to the style guide.
4. **Verify**: Run formatting and linting commands to ensure cleanliness.

## Pre-Commit Checklist

Before finalizing any suggestions, ensure the following commands pass without errors:

```bash
pnpm run format
pnpm run lint:fix
pnpm run build
```
