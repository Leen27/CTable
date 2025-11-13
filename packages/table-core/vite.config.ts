import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import dts from 'vite-plugin-dts'

const isProduction = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: 'tsconfig.json',
      exclude: ['src/**/*.spec.ts']
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'sim-table',
      fileName: 'sim-table',
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
