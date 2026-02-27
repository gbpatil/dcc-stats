# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCC-Stats is a React 19 + TypeScript single-page application that displays Dundalk Cricket Club statistics. It fetches cricket report data from CricketStatz.com and renders it in dynamic, sortable tables with two-level category chip navigation and light/dark theme support.

**Key dependencies:** React 19.2, Vite 7.2, TypeScript 5.9, ESLint 9.39 (flat config)

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint (flat config, ESLint 9+)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

**Feature-based structure** under `src/features/stats/` — components, hooks, services, and types are co-located per feature. Shared UI lives in `src/components/` (layout + ui subdirectories). Every directory uses barrel exports (`index.ts`).

**Key data flow:** `App.tsx` holds top-level state (`activeReport`, `season` defaulting to 2025) → `useReportData` hook fetches report JSON → `StatsTable` dynamically renders columns based on API response shape. `useAvailableSeasons` generates the season list (2020–current year).

**Navigation:** `TabNavigation` uses a two-level design — Level 1 is category chips (8 categories: Batting, Bowling, Fielding, Partnerships, Player Stats, Team Stats, Milestones, Other) and Level 2 shows filtered report tabs (desktop: scrollable tab bar with drag-to-scroll; mobile: grouped dropdown via `useIsMobile(768)` hook). Categories are derived from report titles via keyword matching in `reportService.ts`. Active category is derived from `activeReport.category` — no separate state needed.

**Column ordering:** `StatsTable` auto-detects columns from the API response and reorders them in 3 tiers: (1) priority columns (`no`, `name`, `player`, `bat1`, `bat2`), (2) highlighted stats sorted by `HIGHLIGHT_ORDER` (`runs`, `score`, `total`, `avg`, `hs`, `sr`, `wkts`, `bb`, `econ`, `catches`, `points`), (3) remaining columns. Highlighted columns render in gold (`var(--color-accent-secondary)`) with bold text. Top 3 ranks display medal emoji badges. 56 predefined column label mappings exist in `COLUMN_LABELS`.

**CORS strategy:** Dev uses Vite proxy (`/ss` → `www2.cricketstatz.com`). Production uses `corsproxy.io` as a CORS bridge. This logic lives in `reportService.ts` and switches on `import.meta.env.DEV`. Season parameter replacement is handled during URL construction.

**Report data:** `src/api/report_links.json` contains 209 report URLs. First 13 are "primary" reports (shown as tabs), remaining 196 are "secondary" (shown in dropdown). Reports are categorized via keyword matching with icon/emoji mappings. See `src/api/HowTo.md` for update instructions.

**Shared components:** `Header` (logo, season selector, theme toggle), `Footer` (data attribution), `Spinner` (3-ring animated loader with size variants), `ThemeToggle` (light/dark switch).

## Path Aliases

Configured in both `tsconfig.app.json` and `vite.config.ts`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@styles/*` → `src/styles/*`
- `@utils/*` → `src/utils/*` (reserved, directory does not yet exist)
- `@constants/*` → `src/constants/*` (reserved, directory does not yet exist)

## Styling

- **CSS Modules** for component-scoped styles (`.module.css`) — 7 module files total
- **Design tokens** in `src/styles/variables.css` — colors, typography (Saira + Share Tech Mono from Google Fonts), spacing scale (4–48px), border radius, shadows, z-index scale (100–400), transitions (150–300ms)
- **Global styles** in `src/styles/global.css` — CSS reset, base font size (18px desktop, 16px tablet, 15px mobile), custom scrollbar, selection color, focus ring, animations (`fadeIn`, `spin`, `pulse`, `shimmer`), touch-friendly 44px tap targets
- **Theming:** Light/dark mode via `data-theme` attribute on `<html>`. Dark is default; light theme overrides are under `[data-theme="light"]` in `variables.css`. Theme flash is prevented by an inline script in `index.html`. `ThemeToggle` component (`src/components/ui/ThemeToggle/`) manages state with `localStorage` (`dcc-stats-theme` key) and falls back to system preference via `prefers-color-scheme`
- **Accent colors:** DCC green (`#1E8449`) and gold (`#F1C40F`) — consistent across both themes, with glow/subtle alpha variants
- **Breakpoints:** Primary at 768px (mobile/tablet); secondary at 1200px, 480px, and 360px. Touch device detection via `@media (hover: none) and (pointer: coarse)`

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` (Node.js 20, ubuntu-latest). Pushes to `main` trigger automatic deployment. Production base URL is `/dcc-stats/`.
