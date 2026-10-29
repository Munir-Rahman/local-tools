import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'LocalTools — Private File Utilities',
        short_name: 'LocalTools',
        description: 'Private offline PDF and image tools. Files never leave your browser.',
        theme_color: '#10223d',
        background_color: '#f6f8fc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,wasm}'],
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: { target: 'es2022' }
});