import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  base: './',
  publicDir: 'public',
  server: {
    fs: { allow: [repoRoot] }
  },
  build: {
    outDir: fileURLToPath(new URL('../../output/compare/all-signs', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 1000000,
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        codeSplitting: false,
        entryFileNames: 'assets/viewer.js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
})
