import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  root: fileURLToPath(new URL('./story', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./story', import.meta.url)),
    },
  },
  server: {
    open: '/index.html',
  },
})
