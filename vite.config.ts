import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'LLMers — Dutch',
        short_name: 'LLMers',
        description: 'Learn Dutch from zero to A2+.',
        theme_color: '#F4EFE6',
        background_color: '#F4EFE6',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'course/nl/index.json'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/course/nl/lessons/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'lessons', expiration: { maxEntries: 200 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/course/nl/audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'audio', expiration: { maxEntries: 8000 } },
          },
        ],
      },
    }),
  ],
});
