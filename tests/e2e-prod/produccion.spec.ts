import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('vineta:tour-done', '1')
    localStorage.setItem('vineta:ayudas-apagadas', '1')
    ;(window as unknown as { __csp: string[] }).__csp = []
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`))
  })
}
const cspViolations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)

test('el HTML inicial no precarga el editor, Konva ni el exportador', async () => {
  const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8')
  const preloads = [...html.matchAll(/modulepreload[^>]*href="([^"]+)"/g)].map((m) => m[1])
  for (const p of preloads) expect(p).not.toMatch(/konva|jspdf|jszip|export|Editor|render/)
  expect(html).toContain('/manifest.webmanifest')
  expect(html).not.toMatch(/Noto\+Sans|Dela\+Gothic|Black\+Han/) // fuentes CJK sólo bajo demanda
})

test('CSP: el recorrido principal no produce violaciones y la consola queda limpia', async ({ page }) => {
  await prepare(page)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  // El exportador PDF (jsPDF) no se descarga hasta usarlo.
  const loaded: string[] = []
  page.on('request', (r) => loaded.push(r.url()))
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Crear rápido' }).click()
  await expect(page.locator('[data-tour=canvas]')).toBeVisible()
  await page.getByRole('tab', { name: 'Insertar' }).click()
  await page.getByRole('button', { name: 'Diálogo', exact: true }).click()
  expect(loaded.some((u) => /jspdf/.test(u))).toBe(false)
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  await page.getByRole('radio', { name: /Pantalla/ }).click()
  const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()])
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/)
  expect(loaded.some((u) => /jspdf/.test(u))).toBe(true)
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.locator('[data-tour=read]').click()
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/#/demo')
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible({ timeout: 60_000 })
  expect(await cspViolations(page)).toEqual([])
  expect(errors.filter((e) => !/ERR_FAILED|Failed to load resource/.test(e))).toEqual([])
})

test('un asset inexistente devuelve 404 (no el HTML de la app)', async ({ request }) => {
  const r = await request.get('/assets/no-existe-123.js')
  expect(r.status()).toBe(404)
  expect(r.headers()['content-type'] ?? '').not.toContain('text/html')
  const h = await request.get('/')
  expect(h.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h.headers()['x-content-type-options']).toBe('nosniff')
})

test.describe('actualización entre builds', () => {
  // Sin service worker: el pedido del chunk tiene que llegar a la red (donde se simula el 404).
  test.use({ serviceWorkers: 'block' })
  test('si un chunk viejo ya no existe, recarga una vez y no queda en blanco', async ({ page }) => {
  await prepare(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  // Simula un deploy nuevo: el chunk del editor de la versión cargada ya no está en el servidor.
  let blocked = 0
  await page.route(/\/assets\/Editor-[^/]+\.js$/, (route) => (blocked++ === 0 ? route.fulfill({ status: 404, body: 'Not found' }) : route.continue()))
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Crear rápido' }).click()
  await expect(page.locator('[data-tour=canvas]')).toBeVisible({ timeout: 30_000 })
  expect(blocked).toBeGreaterThanOrEqual(2) // falló una vez, recargó y la segunda cargó
  })
})

test('sin conexión: abre la app, lista los proyectos locales y el editor', async ({ page, context }) => {
  await prepare(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Crear rápido' }).click()
  await expect(page.locator('[data-tour=canvas]')).toBeVisible()
  await page.evaluate(() => (location.hash = '/'))
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  // Esperar a que el service worker controle la página y haya guardado lo necesario.
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready) && !!navigator.serviceWorker.controller, null, { timeout: 30_000 })
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await page.waitForTimeout(3000) // precarga del editor en segundo plano
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  await expect(page.locator('main article')).toHaveCount(1)
  await page.locator('main article').first().locator('button').first().click()
  await expect(page.locator('[data-tour=canvas]')).toBeVisible({ timeout: 20_000 })
  await context.setOffline(false)
})
