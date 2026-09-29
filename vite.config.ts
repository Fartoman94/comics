import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/konva') || id.includes('react-konva')) return 'konva'
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jszip')) return 'export'
        },
      },
    },
  },
})
