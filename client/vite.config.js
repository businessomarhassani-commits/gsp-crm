import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // IMPORTANT: './' is required for Electron (file:// protocol).
  // Absolute '/' paths fail when loaded via file:///path/to/dist/index.html.
  // This is safe for web too — index.html is always served from the root,
  // so './assets/' resolves identically to '/assets/' in a browser.
  base: './',

  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },

  build: {
    // Slightly larger warning threshold — 1.5MB is fine for an Electron app
    chunkSizeWarningLimit: 1600,
  }
})
