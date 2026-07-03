import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Base URL for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/dcc-stats/' : '/',
  plugins: [react()],
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
