import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import securityHeaders from './security-headers.json' with { type: 'json' }

// Los mismos headers que en producción (vercel.json), para probar la CSP con `vite preview`.
const headers = Object.fromEntries(securityHeaders.map((h) => [h.key, h.value]))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Rutas por hash: no hace falta devolver index.html para cualquier URL (y así un asset que no existe da 404).
  appType: 'mpa',
  preview: { headers },
  // Identifica cada build: el service worker usa una caché por versión.
  define: { __BUILD_ID__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || String(Date.now())) },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
