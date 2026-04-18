import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Keep SVG URL imports as emitted files so `<image href>` always resolves in production.
    assetsInlineLimit: 0,
  },
})
