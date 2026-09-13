# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCC-Stats is a React 19 + TypeScript single-page application that displays Dundalk Cricket Club statistics. It fetches cricket report data from CricketStatz.com and renders it in dynamic, sortable tables with two-level category chip navigation and light/dark theme support. It also ships an approval-gated **admin panel** (email-verified auth via Supabase, admin/user notifications via Brevo) and is an installable **Progressive Web App** on Android + iOS.

**Key dependencies:** React 19.2, React Router 7.18 (`HashRouter`), Vite 7.2, TypeScript 5.9, ESLint 9.39 (flat config), `@supabase/supabase-js` 2 (auth + Postgres), `vite-plugin-pwa` 1.3 (installable PWA)

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint (flat config, ESLint 9+)
- `npm run preview` — Preview production build locally (**required to test the PWA/service worker** — it is disabled in `dev`)
- `npm run generate-pwa-assets` — Regenerate PWA icons in `public/` from `public/dcc-logo.png` (run only after changing the logo)

No test framework is configured.

## Architecture

**Feature-based structure** under `src/features/` — each feature co-locates its components, hooks, services, and types. Five features exist: `stats/` (the public statistics tables), `starrings/` (the public Player Starrings view), `auth/` (login/signup + route guards + `AuthProvider`), `admin/` (the gated admin panel), and `rotation/` (the admin-only "Fair Rotation" selection aid). Shared UI lives in `src/components/` (layout + ui subdirectories); the Supabase client lives in `src/lib/`; backend SQL + Edge Functions live in `supabase/`. Every directory uses barrel exports (`index.ts`).

**App entry & routing:** `src/main.tsx` renders `HashRouter` → `AuthProvider` → `AppRouter`. `HashRouter` keeps deep links (email-confirmation redirects, `/admin/review/:id`) working on GitHub Pages with no server routing config. `AppRouter` (`src/AppRouter.tsx`) defines the public routes (`/`, `/login`, `/signup`, `/confirm`) and the gated `/admin/*` subtree, mounts the app-wide `<InstallPrompt />`, and forwards Supabase auth redirects (a `?code=` in the query string) to `/confirm`. `App.tsx` is the `/` route.

**Key data flow:** `App.tsx` holds top-level state (`activeReport`, `season` defaulting to 2025) → `useReportData` hook fetches report JSON → `StatsTable` dynamically renders columns based on API response shape. `useAvailableSeasons` generates the season list (2020–current year).

**Navigation:** `TabNavigation` uses a two-level design — Level 1 is category chips (8 categories: Batting, Bowling, Fielding, Partnerships, Player Stats, Team Stats, Milestones, Other) and Level 2 shows filtered report tabs (desktop: scrollable tab bar with drag-to-scroll; mobile: grouped dropdown via `useIsMobile(768)` hook). Categories are derived from report titles via keyword matching in `reportService.ts`. Active category is derived from `activeReport.category` — no separate state needed.

**Starrings view (public):** The `Header`'s view toggle switches the public app between two top-level views, both held in `App.tsx`'s `view` state: `stats` and `starrings`. `src/features/starrings/` owns fetching, parsing, and displaying the Cricket Leinster "Player Starrings" — each player's monthly team designation, published as a `team.tier` code (e.g. `1.2`). Note `.tier` is a *tier shared by many players*, not a unique rank. `starringsService` scrapes the club page, `starringsView` reshapes it into our display format (grouped by team then tier, names title-cased — the source is inconsistently cased), and `useStarrings` serves a cached result first. Because this is a public page depending on a third-party CORS bridge that fails intermittently, `starringsCache` keeps the last good result and the hook **falls back to stale data rather than erroring** (surfacing a notice); only a failure with an empty cache is a hard error.

**Rotation view (admin-only):** "Fair Rotation" (`src/features/rotation/`) ranks players by how underplayed they are, to aid selection. It is **not** part of the public app — it is mounted at `/admin/rotation` behind `ProtectedRoute` via the `TeamRotationPage` wrapper (`src/features/admin/pages/`), which supplies its own season selector since the admin shell has no global one. Rotation consumes starrings to annotate players, so the dependency runs `rotation/` → `starrings/`, never the reverse; `rotation/types` re-exports `StarringEntry`/`StarringsResult` from the starrings feature. The old `?feat=rotation` URL flag no longer does anything.

**Column ordering:** `StatsTable` auto-detects columns from the API response and reorders them in 3 tiers: (1) priority columns (`no`, `name`, `player`, `bat1`, `bat2`), (2) highlighted stats sorted by `HIGHLIGHT_ORDER` (`runs`, `score`, `total`, `avg`, `hs`, `sr`, `wkts`, `bb`, `econ`, `catches`, `points`), (3) remaining columns. Highlighted columns render in gold (`var(--color-accent-secondary)`) with bold text. Top 3 ranks display medal emoji badges. 56 predefined column label mappings exist in `COLUMN_LABELS`.

**CORS strategy:** Dev uses Vite proxy (`/ss` → `www2.cricketstatz.com`, plus `/cl` → `www.cricketleinster.ie` for the rotation feature's Player Starrings). Production **fetches CricketStatz directly** — it serves `Access-Control-Allow-Origin: *`, so no bridge is needed. Cricket Leinster sends no CORS headers, so the rotation feature still needs one. Both go through `corsFetch` (`src/lib/corsFetch.ts`), which tries the direct request first, then any `preferredProxies` (the `cl-starrings` Edge Function, for starrings), then the public CORS bridges (allorigins, codetabs); pass `{ skipDirect: true }` for origins known to lack CORS headers. Each attempt has an 8s abort timeout, because a failing bridge can otherwise hang ~20s and stack up across the chain. Each service switches on `import.meta.env.DEV`. Season parameter replacement is handled during URL construction in `reportService.ts`.

> **Note:** production previously routed everything through `corsproxy.io`. In 2026 that service dropped anonymous access (keyless requests return `403 keyless_legacy_url`), which broke the live stats — hence the direct-first strategy. The public bridges turned out to be unusable for the Cricket Leinster page in practice, which is why the `cl-starrings` Edge Function now fronts it; they remain only as a fallback.

**Report data:** `src/api/report_links.json` contains 209 report URLs. First 13 are "primary" reports (shown as tabs), remaining 196 are "secondary" (shown in dropdown). Reports are categorized via keyword matching with icon/emoji mappings. See `src/api/HowTo.md` for update instructions.

**Shared components:** `Header` (logo, season selector, theme toggle, the Stats/Rotation view toggle when unlocked, and the auth menu), `Footer` (data attribution), `Spinner` (3-ring animated loader with size variants), `ThemeToggle` (light/dark switch), `InstallPrompt` (home-screen install banner — Android button / iOS Share-sheet hint). The header's auth entry point is `AuthMenu` (`src/features/auth/components/`): a "Sign in" link for anonymous visitors, an admin link for approved users.

## Authentication & Admin Panel

Approval-gated admin area: anyone can sign up, but reaching `/admin` requires email verification **and** a superadmin's approval. **The one-time infrastructure setup (Supabase + Brevo dashboards/CLI) is documented in [`ADMIN_SETUP.md`](ADMIN_SETUP.md)** — all application code, SQL, and Edge Functions already live in the repo.

**Frontend (`src/features/auth` + `src/features/admin`):**
- `AuthProvider` (`src/features/auth/context/`) holds `session`/`profile` and exposes `useAuth()`: `isAuthenticated`, `isApproved` (`profile.status === 'approved'`), `isSuperAdmin` (`profile.role === 'superadmin'`), plus `signUp`/`signIn`/`signOut`/`refreshProfile`.
- `src/lib/supabaseClient.ts` creates the client with the **PKCE** flow (the auth `code` arrives in the query string, clear of `HashRouter`'s `#`). `isSupabaseConfigured` is `false` when env vars are missing — the client falls back to harmless placeholders so imports never throw and the public site degrades gracefully. It also exports `isAuthRedirect`/`authRedirectError`, computed synchronously at module load before `detectSessionInUrl` strips the URL params.
- **Route guards** (UI-only; RLS is the real enforcement): `ProtectedRoute` requires an approved user (anonymous → `/login`; signed-in-but-unapproved → `PendingNotice`); `SuperAdminRoute` requires `superadmin` (else → `/admin`).
- **Admin pages** (`/admin/*`, under `AdminLayout`): `AdminHome` (Dashboard) and `ReviewSignupsPage` (`/admin/review`, superadmin-only) are implemented; `TeamRotationPage` (`/admin/rotation`) hosts the Fair Rotation view; `AnalyticsPage`, `PlayerManagementPage`, `SelectionPage`, and `DataManagementPage` are `PagePlaceholder` scaffolds awaiting features. `useSignupReview` loads the pending queue and applies decisions via the `review_signup` RPC.

**Backend — Supabase Postgres (`supabase/migrations/0001_admin_auth.sql`, idempotent):**
- `public.profiles` (1:1 with `auth.users`, cascade delete): `email`, `full_name`, `phone`, `signup_reason`, `status` (`pending_email` → `pending_approval` → `approved`/`rejected`), `role` (`member`/`admin`/`superadmin`), and review metadata.
- **RLS: clients have NO write access.** Users read only their own row; superadmins read all. Inserts come from an `auth.users` trigger (`handle_new_user`); a second trigger (`handle_email_confirmed`) advances `pending_email` → `pending_approval` on verification; the *only* status/role mutation path is the `review_signup(target_id, decision)` `SECURITY DEFINER` RPC, which checks `is_superadmin()` and is idempotent (a tampered client cannot self-approve).

**Backend — Brevo email via Supabase Edge Functions (`supabase/functions/`, Deno):**
- `cl-starrings` is called **from the browser** by the public Starrings view: it fetches the Cricket Leinster club page server-side and returns it with CORS headers, because that site sends none and the public CORS bridges proved unreliable for it. It takes no secrets and no webhook, and runs with `verify_jwt = false` — safe because its target URL is hardcoded, so no request input reaches the fetch and it cannot act as an open proxy. `starringsService` prefers it and falls back to the public bridges when `VITE_SUPABASE_URL` is absent.
- Two functions fired by **Database Webhooks** on `public.profiles`: `notify-admin` (Insert + Update → emails `ADMIN_EMAIL` a review link when a profile enters `pending_approval`) and `notify-user` (Update → emails the user the approve/reject outcome). Both guard on the exact status transition so firing on multiple events never double-sends, and both authenticate the webhook via an `x-webhook-secret` header (`WEBHOOK_SECRET`).
- `_shared/brevo.ts` POSTs to Brevo's transactional API (`https://api.brevo.com/v3/smtp/email`). Separately, Supabase Auth's own confirmation emails are routed through Brevo via **custom SMTP** (`smtp-relay.brevo.com:587`) to bypass the built-in ~2-emails/hour cap.
- **Secrets** (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `ADMIN_EMAIL`, `SITE_URL`, `WEBHOOK_SECRET`) live only as Edge Function secrets — never in the browser bundle. The service-role key is never used client-side.

**End-to-end flow:** sign up → verify email (Supabase → Brevo SMTP) → trigger sets `pending_approval` → webhook → `notify-admin` emails the review link → superadmin approves/rejects at `/admin/review` (`review_signup` RPC) → webhook → `notify-user` emails the outcome → approved user signs in to the gated `/admin`. The first superadmin is bootstrapped manually via SQL (see `ADMIN_SETUP.md` §9).

**Environment:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are **public, client-safe** (the anon/publishable key is designed to ship in the bundle; RLS enforces access). Local: `.env.local` (copy from `.env.example`). Production: GitHub Actions repository secrets.

## Progressive Web App (PWA)

The app is installable to the home screen on Android (Chrome install prompt) and iOS (Safari → Add to Home Screen), launching full-screen with the club logo. Configured via `vite-plugin-pwa` in [`vite.config.ts`](vite.config.ts):
- `registerType: 'autoUpdate'` + `injectRegister: 'auto'` — the service worker self-registers (no code in `main.tsx`) and silently pulls the newest deploy on reopen.
- **Manifest:** `display: standalone`, dark `theme_color`/`background_color` (`#0a0a0a`) matching the default theme so the launch splash doesn't flash; icon `src` paths are **relative** (no leading slash) so they resolve under the `/dcc-stats/` base.
- **Workbox runtime caching:** report JSON (`www2.cricketstatz.com` + the CORS bridge hosts) = `NetworkFirst` (`report-data` cache, 5s timeout, 1-day expiry) so an installed app shows last-seen stats offline; Google Fonts = `StaleWhileRevalidate` (stylesheets) / `CacheFirst` (webfonts); **`*.supabase.co` = `NetworkOnly`** (auth/profile queries are never cached).
- `devOptions.enabled: false` — the SW is built only for production; test with `npm run build && npm run preview`, never `npm run dev`.

**Icons** are generated into `public/` by `@vite-pwa/assets-generator` (`pwa-assets.config.ts`, `minimal2023Preset` from `public/dcc-logo.png`) via `npm run generate-pwa-assets`: `pwa-64x64/192x192/512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. iOS standalone `<meta>` tags + the `apple-touch-icon` link live in [`index.html`](index.html); `src/vite-env.d.ts` references `vite-plugin-pwa/client`.

**Install prompt:** `src/components/ui/InstallPrompt/` is mounted app-wide in `AppRouter`. On Android it captures `beforeinstallprompt` and shows an install button; on iOS (no such event) it shows a "Share → Add to Home Screen" hint. Dismissal is remembered in `localStorage` (`dcc-stats-install-dismissed`).

## Path Aliases

Configured in both `tsconfig.app.json` and `vite.config.ts`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@styles/*` → `src/styles/*`
- `@utils/*` → `src/utils/*` (reserved, directory does not yet exist)
- `@constants/*` → `src/constants/*` (reserved, directory does not yet exist)

## Styling

- **CSS Modules** for component-scoped styles (`.module.css`), co-located per component (13 module files across shared UI + features)
- **Design tokens** in `src/styles/variables.css` — colors, typography (Saira + Share Tech Mono from Google Fonts), spacing scale (4–48px), border radius, shadows, z-index scale (100–400), transitions (150–300ms)
- **Global styles** in `src/styles/global.css` — CSS reset, base font size (18px desktop, 16px tablet, 15px mobile), custom scrollbar, selection color, focus ring, animations (`fadeIn`, `spin`, `pulse`, `shimmer`), touch-friendly 44px tap targets
- **Theming:** Light/dark mode via `data-theme` attribute on `<html>`. Dark is default; light theme overrides are under `[data-theme="light"]` in `variables.css`. Theme flash is prevented by an inline script in `index.html`. `ThemeToggle` component (`src/components/ui/ThemeToggle/`) manages state with `localStorage` (`dcc-stats-theme` key) and falls back to system preference via `prefers-color-scheme`
- **Accent colors:** DCC green (`#1E8449`) and gold (`#F1C40F`) — consistent across both themes, with glow/subtle alpha variants
- **Breakpoints:** Primary at 768px (mobile/tablet); secondary at 1200px, 480px, and 360px. Touch device detection via `@media (hover: none) and (pointer: coarse)`

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` (Node.js 20, ubuntu-latest). Pushes to `main` trigger automatic deployment. Production base URL is `/dcc-stats/`. The build injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from repository secrets (Settings → Secrets and variables → Actions); if absent, the site still builds and the public stats work while auth/admin degrades gracefully. The production build also emits the PWA manifest + service worker into `dist/` (no CI change needed).

A separate scheduled workflow, `.github/workflows/keepalive.yml` (cron every 3 days + `workflow_dispatch`), pings the Supabase REST API so the free-tier project doesn't auto-pause after ~7 days idle. It queries a real RLS-protected table (`/rest/v1/profiles?select=id&limit=1`) rather than the bare `/rest/v1/` root, which returns 401 for the newer `sb_publishable_` key format. Note: `on: schedule` only runs from the **default branch**, so a fix to this file takes effect only once merged to `main`.
