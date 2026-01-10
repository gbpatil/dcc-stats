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
  server: {
    proxy: {
      '/ss': {
        target: 'https://www2.cricketstatz.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
