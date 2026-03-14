# AI Trading Frontend V4 Copilot Instructions

This repository is a Vue 3 + TypeScript + Vite trading console for monitoring system state, risk, execution policy, and operational workflows.

## Scope and priorities

- Preserve existing visual language, routing structure, and component patterns unless the task explicitly asks for a redesign.
- Keep changes minimal and local. Prefer extending current components, stores, services, and views over adding parallel abstractions.
- Treat the documents under `docs/` and the existing tests in `src/__tests__` as the main source of intended behavior.

## Frontend conventions

- Use Vue 3 and TypeScript patterns consistent with the current codebase.
- Follow the established module layout under `src/api`, `src/components`, `src/views`, `src/stores`, and `src/router`.
- Prefer existing API service wrappers before introducing new fetch logic.
- Keep responsive behavior intact. This project targets mobile-first layouts and multiple breakpoints, so desktop-only fixes are incomplete fixes.
- Preserve i18n compatibility when editing user-facing strings. Check the existing locale and translation structure before hardcoding new copy.

## Validation

- Standard validation commands for this repo:
  - `npm run test:unit`
  - `npm run build`
- If the task changes view logic, routing, or API integration, run at least the relevant unit tests and a production build.

## UX and data integrity

- This UI represents trading, risk, and governance workflows. Prefer clarity, stable data presentation, and safe defaults over flashy behavior.
- Do not silently change authentication flow, token persistence behavior, or API base URL semantics unless explicitly requested.
- When adding or editing UI states, handle loading, empty, error, and degraded backend cases explicitly.

## Response style for this repo

- Summaries should emphasize user-visible changes, responsive impact, and validation results.
- If a task risks diverging from backend contracts, call out the contract dependency instead of guessing field names or payload shapes.