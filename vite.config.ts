import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import netlify from '@netlify/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    netlify({
      edgeFunctions: { enabled: false },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'rancho-1808-logo.jpg',
        'pwa-192.png',
        'pwa-512.png',
        'assets/ranch-map-yellow-logo-enhanced.png',
      ],
      manifest: {
        name: 'Ranch Hunt Tracker',
        short_name: 'Ranch Hunt',
        description:
          'Interactive ranch map with blinds, feeders, occupancy, and harvest log.',
        theme_color: '#1a1f16',
        background_color: '#1a1f16',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
