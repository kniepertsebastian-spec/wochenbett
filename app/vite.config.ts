import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Kontrolliertes Update: neuer Service Worker wartet, bis die App ihn aktiviert.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Rückbildung',
        short_name: 'Rückbildung',
        description: 'Sanft zurück zu Bewegung und Belastbarkeit nach der Geburt.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#be123c',
        background_color: '#fafaf9',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // App Shell + gebündelter Inhalt (Übungen, Texte) sind vorab gecacht (Precache, Stale-While-Revalidate via Revisionen).
        // Für später ausgelagerte Medien/Inhalte:
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'), // Übungsbilder/GIFs/SVGs, Audio
            handler: 'CacheFirst',
            options: { cacheName: 'media', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] }, rangeRequests: true },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/content/'), // JSON-Inhalte (Rezepte, ProTips)
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'content' },
          },
        ],
      },
    }),
  ],
})
