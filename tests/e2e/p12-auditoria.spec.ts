import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { clippedControls, createProjectInDb, gotoHome, inApp, openProject } from './helpers'

// Prompt 12 · Auditoría final: accesibilidad (axe) en todas las superficies nuevas de la serie,
// modales que cierran con Esc y devuelven el foco, y proyecto pesado (20 páginas × 10 viñetas).

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
async function axe(page: Page) {
  await page.evaluate(AXE)
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (c: Document) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe.run(document)
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vineta:tour-done', '1')
    localStorage.setItem('vineta:ayudas-apagadas', '1')
  })
})

async function open(page: Page) {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Auditoría', 'comic', 3)
  await openProject(page, id)
  await inApp(page, `s.setPage(s.project.pages[1].id); const b = m.factories.createBubble('speech', 120, 120); m.store.useEditor.getState().addElements([b], { select: false })`)
}

test('axe sin problemas serios en las superficies nuevas (escritorio)', async ({ page }) => {
  await open(page)
  const check = async (what: string) => expect(await axe(page), what).toEqual([])
  await check('editor con barra de contexto, tira de páginas y estado vacío')
  await page.getByRole('button', { name: 'Historial de cambios' }).click()
  await check('menú de historial')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^Zoom \d+ %$/ }).click()
  await check('menú de zoom')
  await page.keyboard.press('Escape')
  for (const tab of ['Plantillas', 'Elementos', 'Biblioteca', 'Capas']) {
    await page.getByRole('tab', { name: tab }).click()
    await check(`pestaña ${tab}`)
  }
  await inApp(page, `s.select([m.store.currentPage().elements.find((e) => e.type === 'panel').id])`)
  await check('propiedades de viñeta (forma, dividir) y botón Agregar imagen')
  await page.getByTestId('agregar-imagen-vineta').click()
  await check('selector de imágenes')
  await page.keyboard.press('Escape')
  await inApp(page, `s.select([m.store.currentPage().elements.find((e) => e.type === 'bubble').id])`)
  await check('propiedades de globo (grilla de tipos, cola)')
  await inApp(page, `s.select([])`)
  await check('propiedades de página con Diseño')
  await page.getByTestId('tira-paginas').getByRole('button', { name: 'Acciones de la página actual' }).click()
  await page.getByRole('button', { name: 'Copiar contenido a…' }).click()
  await check('diálogo copiar contenido')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  await page.getByRole('radio', { name: /Páginas en imágenes/ }).click()
  await check('exportar con opciones')
})

test('axe y controles al alcance en el celular: barra, Más, Globos y selector de páginas', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await open(page)
  expect(await axe(page), 'editor simple').toEqual([])
  const bar = page.getByRole('navigation', { name: 'Herramientas' })
  await bar.getByRole('button', { name: 'Más herramientas' }).click()
  expect(await axe(page), 'hoja Más').toEqual([])
  await page.getByRole('dialog', { name: 'Más herramientas' }).getByRole('button', { name: 'Cerrar' }).click()
  await bar.getByRole('button', { name: 'Globo', exact: true }).click()
  expect(await axe(page), 'hoja Globos').toEqual([])
  expect(await clippedControls(page)).toEqual([])
})

test('los modales nuevos cierran con Esc y devuelven el foco a quien los abrió', async ({ page }) => {
  await open(page)
  const opener = page.getByTestId('tira-paginas').getByRole('button', { name: 'Acciones de la página actual' })
  await opener.click()
  await page.getByRole('button', { name: 'Renombrar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Renombrar página' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await inApp(page, `s.select([m.store.currentPage().elements.find((e) => e.type === 'panel').id])`)
  const add = page.getByTestId('agregar-imagen-vineta')
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Imagen para la viñeta' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(add).toBeFocused()
})

test('proyecto pesado (20 páginas × 10 viñetas con imágenes): abre, edita y navega fluido; sin fugas al reabrir', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoHome(page)
  const id = await page.evaluate(async () => {
    const load = (p: string) => import(/* @vite-ignore */ p)
    const f = await load('/src/lib/factories.ts')
    const st = await load('/src/lib/storage.ts')
    const t = await load('/src/lib/templates.ts')
    const p = f.createProject({ title: 'Pesado', author: '', kind: 'comic', pages: 20, templateId: null })
    const assets: { id: string; name: string; width: number; height: number; mime: string; createdAt: number }[] = []
    for (let i = 0; i < 6; i++) {
      const c = new OffscreenCanvas(1200, 900)
      const g = c.getContext('2d')!
      g.fillStyle = `hsl(${i * 60},70%,50%)`
      g.fillRect(0, 0, 1200, 900)
      const aid = 'as_heavy' + i
      await st.putAssetBlob(aid, await c.convertToBlob({ type: 'image/png' }))
      assets.push({ id: aid, name: 'img' + i, width: 1200, height: 900, mime: 'image/png', createdAt: 0 })
    }
    p.assets = assets
    for (const pg of p.pages) {
      const panels = t.buildTemplatePanels(t.TEMPLATES.find((x: { id: string }) => x.id === 'grid-9'), p.format, 40, 16)
      panels.push(f.createPanel(60, 60, 200, 200))
      panels.forEach((pa: { image: unknown }, i: number) => (pa.image = { assetId: assets[i % 6].id, x: 0, y: 0, scale: 0.4, filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } }))
      pg.elements = panels
    }
    await st.saveProject(p)
    return p.id
  })
  const t0 = Date.now()
  await openProject(page, id)
  await page.locator('[data-tour=canvas] canvas').first().waitFor()
  expect(Date.now() - t0).toBeLessThan(8000)
  const perf = await inApp<{ edit: number; nav: number }>(
    page,
    `const raf = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
     const el = m.store.currentPage().elements[3];
     let t = performance.now();
     for (let i = 0; i < 30; i++) { m.store.useEditor.getState().updateElement(el.id, { x: el.x + i }); await raf() }
     const edit = (performance.now() - t) / 30;
     t = performance.now();
     for (let i = 0; i < 20; i++) { m.store.useEditor.getState().goToPage(i); await raf() }
     return { edit, nav: (performance.now() - t) / 20 }`,
  )
  // Holgado para CI: en local da ~5 ms por edición y ~10 ms por cambio de página (más el cuadro).
  expect(perf.edit).toBeLessThan(150)
  expect(perf.nav).toBeLessThan(250)
  await expect(page.getByTestId('tira-paginas').locator('img')).toHaveCount(20, { timeout: 60_000 })

  const cdp = await page.context().newCDPSession(page)
  const listeners = async () => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' })
    return (await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! })).listeners.length
  }
  const before = await listeners()
  for (let i = 0; i < 3; i++) {
    await page.goto('/#/')
    await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
    await openProject(page, id)
  }
  await page.waitForTimeout(500)
  expect(await listeners()).toBeLessThanOrEqual(before)
})
