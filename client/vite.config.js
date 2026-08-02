import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_COMMIT_SHA || '';

const ONE_YEAR = 60 * 60 * 24 * 365;
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const FIVE_MINUTES = 60 * 5;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      includeAssets: [],
      workbox: {
        globPatterns: ['**/*.{js,css,html}', 'favicon.svg'],
        globIgnores: [
          '**/Admin*.js',
          'screenshots/**',
          'og-image.png',
          'logo.png',
          'offline.html'
        ],
        additionalManifestEntries: [
          { url: '/offline.html', revision: commitSha || String(Date.now()) }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/screenshots\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'frioo-font-css',
              expiration: { maxEntries: 10, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'frioo-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: ONE_YEAR, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' &&
              request.destination === 'image' &&
              !url.pathname.startsWith('/api/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'frioo-images',
              expiration: { maxEntries: 160, maxAgeSeconds: THIRTY_DAYS, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname === '/api/products',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'frioo-api-products',
              expiration: { maxEntries: 4, maxAgeSeconds: FIVE_MINUTES, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname === '/api/settings',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'frioo-api-settings',
              expiration: { maxEntries: 2, maxAgeSeconds: FIVE_MINUTES, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commitSha)
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@sentry')) return 'sentry'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react'
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: ['nonperversive-nondeafly-dorla.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
