import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

// Generates the PWA icon set from the single 1000x1000 club logo.
// Run `npm run generate-pwa-assets` to (re)create the icons in public/:
//   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
//   maskable-icon-512x512.png, apple-touch-icon-180x180.png
export default defineConfig({
  preset,
  images: ['public/dcc-logo.png'],
});
