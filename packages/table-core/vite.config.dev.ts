import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  root: fileURLToPath(new URL('./', import.meta.url)),
  server: {
    open: '/story/index.html',
  },
})
