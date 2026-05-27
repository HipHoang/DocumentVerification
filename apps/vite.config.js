import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // SPA fallback for Vercel/static deployments
  // This ensures /certificate/:token routes work correctly
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})