import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Base URL for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/dcc-stats/' : '/',
  plugins: [
    react(),
    // Progressive Web App: makes the site installable to the home screen on
    // Android (Chrome install prompt) and iOS (Safari → Add to Home Screen),
    // launching full-screen with the club logo. Icons live in public/ and are
    // (re)generated with `npm run generate-pwa-assets`.
    VitePWA({
      registerType: 'autoUpdate', // pull the newest deploy silently on reopen
      injectRegister: 'auto', // no manual SW registration code needed in main.tsx
      manifest: {
        name: 'DCC Stats — Dundalk Cricket Club',
        short_name: 'DCC Stats',
        description:
          'Batting, bowling, and fielding statistics for Dundalk Cricket Club.',
        // Dark to match the app's default theme so the launch splash never flashes.
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        // Icon paths are relative to the manifest URL, so they resolve correctly
        // under the /dcc-stats/ GitHub Pages base without a leading slash.
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cricket report JSON (prod fetches through the corsproxy.io bridge).
            // Network-first so an installed app shows the last-seen stats offline.
            urlPattern: /^https:\/\/corsproxy\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'report-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Never cache Supabase auth/session or profile queries.
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      // The service worker is generated only for production builds; test it with
      // `npm run build && npm run preview`, not the dev server.
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into cacheable chunks (and keep
        // each chunk under the size-warning threshold).
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/ss': {
        target: 'https://www2.cricketstatz.com',
        changeOrigin: true,
        secure: false,
      },
      // Cricket Leinster club page — source of the monthly Player Starrings
      // (team designations) used by the Fair Rotation feature.
      '/cl': {
        target: 'https://www.cricketleinster.ie',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cl/, ''),
      },
    },
  },
})
