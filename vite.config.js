import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/UNBCDoor/' : '/',
  resolve: {
    // The door-sign package (vendor/door-sign, with the UNBC logo kit inside it) is consumed from
    // source; one React, whichever folder a component is imported from.
    dedupe: ['react', 'react-dom'],
    alias: {
      // Share links use json-url (vendor/json-url) with stream + lz-string codecs only; stub the
      // Node-only codec packages its engine references but never runs for that codec set.
      lzma: fileURLToPath(new URL('./src/sign/emptyCodecStub.js', import.meta.url)),
      'node-lzw': fileURLToPath(new URL('./src/sign/emptyCodecStub.js', import.meta.url)),
      msgpack5: fileURLToPath(new URL('./src/sign/emptyCodecStub.js', import.meta.url))
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
