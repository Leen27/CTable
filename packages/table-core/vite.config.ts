import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const isProduction = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'sim-table-core',
      fileName: 'sim-table-core',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },
  },
  esbuild: {
    // @ts-ignore
    drop: isProduction ? ['console', 'debugger'] : [],
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
})
