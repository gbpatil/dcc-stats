# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCC-Stats is a React 19 + TypeScript single-page application that displays Dundalk Cricket Club statistics. It fetches cricket report data from CricketStatz.com and renders it in dynamic, sortable tables with two-level category chip navigation and light/dark theme support.

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint (flat config, ESLint 9+)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

**Feature-based structure** under `src/features/stats/` — components, hooks, services, and types are co-located per feature. Shared UI lives in `src/components/` (layout + ui subdirectories). Every directory uses barrel exports (`index.ts`).

**Key data flow:** `App.tsx` holds top-level state (`activeReport`, `season`) → `useReportData` hook fetches report JSON → `StatsTable` dynamically renders columns based on API response shape.

**Navigation:** `TabNavigation` uses a two-level design — Level 1 is category chips (Batting, Bowling, Fielding, etc.) and Level 2 shows filtered report tabs (desktop: scrollable tab bar with drag-to-scroll; mobile: grouped dropdown). Categories are derived from report titles via keyword matching in `reportService.ts`. Active category is derived from `activeReport.category` — no separate state needed.

**Column ordering:** `StatsTable` auto-detects columns from the API response and reorders them by priority: rank/player name first, then highlighted stats (Runs, Wickets, Average, etc. via `HIGHLIGHT_ORDER`), then remaining columns. Highlighted columns render in gold (`var(--color-accent-secondary)`) with bold text. Top 3 ranks display medal emoji badges.

**CORS strategy:** Dev uses Vite proxy (`/ss` → `www2.cricketstatz.com`). Production uses `corsproxy.io` as a CORS bridge. This logic lives in `reportService.ts` and switches on `import.meta.env.DEV`.

**Report data:** `src/api/report_links.json` contains ~209 report URLs organized by category. See `src/api/HowTo.md` for update instructions.

## Path Aliases

Configured in both `tsconfig.app.json` and `vite.config.ts`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@styles/*` → `src/styles/*`
- `@utils/*` → `src/utils/*`
- `@constants/*` → `src/constants/*`

## Styling

- **CSS Modules** for component-scoped styles (`.module.css`)
- **Design tokens** in `src/styles/variables.css` — colors, typography (Saira + Share Tech Mono fonts), spacing scale, z-index scale, transitions
- **Theming:** Light/dark mode via `data-theme` attribute on `<html>`. Dark is default; light theme overrides are under `[data-theme="light"]` in `variables.css`. `ThemeToggle` component (`src/components/ui/ThemeToggle/`) manages state with `localStorage` (`dcc-stats-theme` key) and falls back to system preference via `prefers-color-scheme`
- **Accent colors:** DCC green (`#1E8449`) and gold (`#F1C40F`) — consistent across both themes
- **Breakpoints:** Primary responsive breakpoint at 768px; secondary at 1200px and 480px

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`. Pushes to `main` trigger automatic deployment. Production base URL is `/dcc-stats/`.
