import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_COMMIT_SHA || '';

export default defineConfig({
  plugins: [react()],
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
