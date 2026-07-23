import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/UNBCDoor/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        editor: fileURLToPath(new URL('./index.html', import.meta.url)),
        savedSigns: fileURLToPath(new URL('./saved-signs/index.html', import.meta.url))
      }
    }
  }
})
