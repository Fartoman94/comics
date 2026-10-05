// Genera la preproducción en Markdown (biblia + guion por páginas) de las muestras premium.
// Uso: node scripts/muestras-docs.mjs
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const docs = await server.ssrLoadModule('/src/samples/docs.ts')
  for (const id of ['voltaje', 'kazekiri', 'inquilino', 'petalos', 'cartera', 'orbita']) {
    const { work } = await server.ssrLoadModule(`/src/samples/works/${id}.ts`)
    mkdirSync(`docs/muestras/${id}`, { recursive: true })
    writeFileSync(`docs/muestras/${id}/BIBLIA.md`, docs.bibleMarkdown(work) + '\n')
    writeFileSync(`docs/muestras/${id}/GUION.md`, docs.scriptMarkdown(work) + '\n')
    console.log(`${id}: ${work.pages.length} páginas`)
  }
} finally {
  await server.close()
}
