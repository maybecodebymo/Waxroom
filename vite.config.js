import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icons/*.png', 'favicon.svg', 'logo only.svg'],
      manifest: {
        name: 'Waxroom — 3D Music Space',
        short_name: 'Waxroom',
        description: 'Build, explore, and share your music collection in an interactive 3D vinyl globe.',
        theme_color: '#f5f5f3',
        background_color: '#f5f5f3',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icons/icon-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      apple: {
        icon: 'pwa-icons/icon-180x180.png',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,woff2,woff,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  base: './',
});
