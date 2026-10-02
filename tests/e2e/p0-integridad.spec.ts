import { expect, test, type Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { cardMenu, createProjectInDb, FIXTURES, gotoHome, idbRaw, inApp, openProject, projectCard, skipTour } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
})

/** Lee el registro guardado en IndexedDB (sin pasar por el store). */
const storedProject = (page: Page, id: string) => inApp<{ title: string; pages: { elements: { id: string; x: number }[] }[] } | null>(page, `return await m.storage.loadProject(arg)`, id)

test('A1 · duplicar y borrar el original: la copia conserva sus fotos después de recargar', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Mis fotos')
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.locator('input[type=file][accept="image/*"]').setInputFiles([FIXTURES + 'foto-a.png', FIXTURES + 'foto-b.png'])
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(2)
  await inApp(page, `const pan = s.project.pages[0].elements.filter(e => e.type === 'panel'); m.placement.fillPanel(pan[0].id, s.project.assets[0]); m.placement.placeAsset(s.project.assets[1], { x: 40, y: 40 })`)
  await page.getByTitle('Volver a mis proyectos').click()
  await expect(projectCard(page, 'Mis fotos')).toBeVisible()

  await cardMenu(page, 'Mis fotos', 'Duplicar')
  await expect(projectCard(page, 'Mis fotos (copia)')).toBeVisible()
  await cardMenu(page, 'Mis fotos', 'Eliminar')
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(projectCard(page, 'Mis fotos')).toHaveCount(0)

  await page.reload()
  await projectCard(page, 'Mis fotos (copia)').locator('button').first().click()
  await expect(page.locator('[data-tour=read]')).toBeVisible()
  // Cada recurso de la copia tiene su blob y se decodifica como imagen real.
  const check = await inApp<{ assets: number; ok: number; refsOk: boolean }>(
    page,
    `let ok = 0
     for (const a of s.project.assets) { const img = await m.assets.loadAssetImage(a.id); if (img && img.naturalWidth > 0) ok++ }
     const ids = new Set(s.project.assets.map(a => a.id))
     const refs = s.project.pages.flatMap(p => p.elements).flatMap(e => e.type === 'image' ? [e.assetId] : e.type === 'panel' && e.image ? [e.image.assetId] : [])
     return { assets: s.project.assets.length, ok, refsOk: refs.length === 2 && refs.every(r => ids.has(r)) }`,
  )
  expect(check).toEqual({ assets: 2, ok: 2, refsOk: true })
})

test('A2 · editar y apretar Atrás antes de 800 ms no pierde el cambio', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Atrás rápido')
  await openProject(page, id)
  const elId = await inApp<string>(page, 'const el = s.project.pages[0].elements[0]; s.select([el.id]); return el.id')
  const x0 = await inApp<number>(page, 'return s.project.pages[0].elements[0].x')
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await inApp(page, `s.select([arg])`, elId)
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowRight')
  await page.getByRole('textbox', { name: 'Título del proyecto' }).fill('Título cambiado')
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  // El inicio ya muestra el dato nuevo (no una lista leída antes de terminar el guardado).
  await expect(projectCard(page, 'Título cambiado')).toBeVisible()
  await expect.poll(async () => (await storedProject(page, id))!.pages[0].elements.find((e) => e.id === elId)!.x).toBe(x0 + 50)
  await page.reload()
  await openProject(page, id)
  expect(await inApp<number>(page, 'return s.project.pages[0].elements.find(e => e.id === arg).x', elId)).toBe(x0 + 50)
})

test.describe('A5 · importación segura y recuperación', () => {
  test('archivo basura y .vineta con title objeto: avisos claros y la app sigue andando tras recargar', async ({ page }, info) => {
    await gotoHome(page)
    const input = page.locator('input[type=file][accept=".vineta,application/json"]')
    await input.setInputFiles(FIXTURES + 'basura.vineta')
    await expect(page.getByRole('alert')).toContainText('El archivo está dañado o no es un proyecto de Viñeta Studio.')
    await expect(page.getByRole('alert')).not.toContainText(/Unexpected|JSON/)

    const bad = JSON.parse(readFileSync(FIXTURES + 'legacy-v1.vineta', 'utf8'))
    bad.project.title = { malicioso: true }
    const badPath = info.outputPath('title-objeto.vineta')
    writeFileSync(badPath, JSON.stringify(bad))
    await input.setInputFiles(badPath)
    await expect(page.getByRole('alert').last()).toContainText('El proyecto tiene datos dañados')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
    expect(await inApp<number>(page, 'return (await m.storage.listAllProjects()).damaged.length')).toBe(0)
  })

  test('un proyecto dañado guardado por una versión anterior no deja la app en blanco', async ({ page }) => {
    await gotoHome(page)
    await idbRaw(page, { db: 'vineta-projects', action: 'put', key: 'pr_danado', value: { id: 'pr_danado', title: { malicioso: true }, pages: [] } })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
    await expect(page.getByText('Proyectos que no se pueden abrir')).toBeVisible()
    // Abrir la ruta del proyecto dañado muestra la pantalla de recuperación, no una pantalla vacía.
    await page.goto('/#/p/pr_danado')
    await expect(page.getByRole('heading', { name: 'No se pudo abrir este proyecto' })).toBeVisible()
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar copia' }).click()])
    expect(dl.suggestedFilename()).toMatch(/pr_danado\.vineta$/)
    await page.getByRole('button', { name: 'Eliminar proyecto' }).click()
    await page.getByRole('button', { name: 'Sí, eliminar este proyecto' }).click()
    await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
    await expect(page.getByText('Proyectos que no se pueden abrir')).toHaveCount(0)
  })

  test('un .vineta válido de la versión anterior se importa completo', async ({ page }) => {
    await gotoHome(page)
    await page.locator('input[type=file][accept=".vineta,application/json"]').setInputFiles(FIXTURES + 'legacy-v1.vineta')
    await expect(page.getByRole('status').filter({ hasText: '"Legado v1" importado' })).toBeVisible()
    await projectCard(page, 'Legado v1').locator('button').first().click()
    await expect(page.locator('[data-tour=read]')).toBeVisible()
    const r = await inApp<{ pages: number; types: string[]; images: number }>(
      page,
      `let images = 0
       for (const a of s.project.assets) if ((await m.assets.loadAssetImage(a.id))?.naturalWidth) images++
       return { pages: s.project.pages.length, types: s.project.pages[0].elements.map(e => e.type), images }`,
    )
    expect(r).toEqual({ pages: 2, types: ['panel', 'text', 'text', 'image', 'bubble', 'text', 'effect', 'drawing'], images: 2 })
  })
})

test('A4 · con el lector abierto las teclas no editan el proyecto y el foco vuelve a "Leer"', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Lector aislado', 'comic', 3)
  await openProject(page, id)
  await inApp(page, 's.select([s.project.pages[0].elements[0].id])')
  await page.waitForTimeout(1500) // deja que se generen las miniaturas (mutan el proyecto)
  const before = await inApp<string>(page, 'return JSON.stringify(s.project.pages)')
  await page.locator('[data-tour=read]').click()
  const slider = page.getByRole('slider', { name: 'Ir a página' })
  await expect(slider).toBeVisible()
  for (const k of ['ArrowRight', 'ArrowLeft', 'Delete', 'Backspace', 'Control+z', 'Control+d', 'Control+a', 'v', 'b', 'Space']) await page.keyboard.press(k)
  // Un cambio del editor por detrás (miniatura) no reinicia la lectura.
  await inApp(page, `s.mutate(d => void (d.thumbnail = null), { history: false })`)
  await expect(page.getByText('Imprimiendo páginas…')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(slider).toHaveCount(0)
  expect(await inApp<string>(page, 'return JSON.stringify(s.project.pages)')).toBe(before)
  expect(await inApp<boolean>(page, 'return s.readerOpen')).toBe(false)
  expect(await inApp<string>(page, 'return s.tool')).toBe('select')
  await expect(page.locator('[data-tour=read]')).toBeFocused()
})

test.describe('fallas de IndexedDB', () => {
  /** Hace fallar las escrituras al almacén de proyectos mientras `window.__failProjects` sea true. */
  const breakProjectWrites = (page: Page) =>
    page.addInitScript(() => {
      const put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
        if ((window as unknown as { __failProjects?: boolean }).__failProjects && this.name === 'projects') throw new DOMException('cuota excedida', 'QuotaExceededError')
        return put.apply(this, args)
      }
    })

  test('si el autoguardado falla: estado de error y "Reintentar" funciona', async ({ page }) => {
    await breakProjectWrites(page)
    await gotoHome(page)
    const id = await createProjectInDb(page, 'Disco lleno')
    await openProject(page, id)
    await page.waitForTimeout(1500)
    await page.evaluate(() => ((window as unknown as { __failProjects: boolean }).__failProjects = true))
    await page.getByRole('textbox', { name: 'Título del proyecto' }).fill('Título nuevo')
    const alert = page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })
    await expect(alert).toBeVisible()
    expect(await inApp<string>(page, 'return s.saveStatus')).toBe('error')
    expect((await storedProject(page, id))!.title).toBe('Disco lleno')
    await page.evaluate(() => ((window as unknown as { __failProjects: boolean }).__failProjects = false))
    await alert.getByRole('button', { name: 'Reintentar' }).click()
    await expect.poll(() => inApp<string>(page, 'return s.saveStatus')).toBe('saved')
    expect((await storedProject(page, id))!.title).toBe('Título nuevo')
  })

  test('si la importación falla al guardar: rollback de imágenes y mensaje claro', async ({ page }) => {
    await breakProjectWrites(page)
    await gotoHome(page)
    const countBlobs = () => idbRaw<number>(page, { db: 'vineta-assets', action: 'count' })
    const blobs0 = await countBlobs()
    await page.evaluate(() => ((window as unknown as { __failProjects: boolean }).__failProjects = true))
    await page.locator('input[type=file][accept=".vineta,application/json"]').setInputFiles(FIXTURES + 'legacy-v1.vineta')
    await expect(page.getByRole('alert')).toContainText('No se pudo guardar el proyecto importado')
    expect(await countBlobs()).toBe(blobs0)
    expect(await inApp<number>(page, 'return (await m.storage.listProjects()).length')).toBe(0)
  })
})
