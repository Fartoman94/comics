// Pre-renderiza las ilustraciones del manga de ejemplo a public/demo/*.webp.
// Uso: con `npm run dev` corriendo en DEMO_URL, ejecutar con playwright-core disponible:
//   DEMO_URL=http://localhost:5173 node scripts/build-demo-art.mjs
// art-export.html (en la raíz, sólo para desarrollo) rasteriza cada dibujo con el mismo código de la app.
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = (process.env.DEMO_URL ?? 'http://localhost:5173') + '/art-export.html'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true })
const page = await browser.newPage()
await page.goto(url)
await page.waitForFunction(() => window.__out, null, { timeout: 180000 })
const out = await page.evaluate(() => window.__out)
await browser.close()
mkdirSync('public/demo', { recursive: true })
const manifest = {}
for (const [k, v] of Object.entries(out)) {
  writeFileSync(`public/demo/${k}.webp`, Buffer.from(v.b64, 'base64'))
  manifest[k] = { w: v.w, h: v.h }
}
writeFileSync('public/demo/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`${Object.keys(out).length} ilustraciones escritas en public/demo`)
