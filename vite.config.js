import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/UNBCDoor/' : '/',
  resolve: {
    alias: {
      // The UNBC brand kit lives in its own repo (ahzs645/unbc-logo) and is vendored here as a
      // git submodule, consumed from source. Run `git submodule update --init` after cloning.
      '@unbc/logo': fileURLToPath(new URL('./vendor/unbc-logo/src/index.js', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        editor: fileURLToPath(new URL('./index.html', import.meta.url)),
        savedSigns: fileURLToPath(new URL('./saved-signs/index.html', import.meta.url)),
        measuringSheets: fileURLToPath(new URL('./measuring-sheets/index.html', import.meta.url))
      }
    }
  }
})
