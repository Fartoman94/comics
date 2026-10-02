import { expect, test, type Page } from '@playwright/test'
import { canvasPoint, createProjectInDb, FIXTURES, gotoHome, idbRaw, inApp, openProject, projectCard, skipTour } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
})

async function upload(page: Page, files: string[]) {
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.getByRole('button', { name: 'Este proyecto' }).click()
  await page.locator('input[type=file][accept="image/*"]').setInputFiles(files.map((f) => FIXTURES + f))
}
const imagesOnPage = (page: Page) => inApp<string[]>(page, 'return s.project.pages.find(p => p.id === s.pageId).elements.filter(e => e.type === "image").map(e => e.assetId)')

test('biblioteca: no duplica, busca, filtra, renombra/etiqueta, inserta con clic y arrastrando', async ({ page }) => {
  await gotoHome(page)
  const a = await createProjectInDb(page, 'Proyecto A', 'comic', 1)
  await openProject(page, a)
  await upload(page, ['foto-a.png', 'foto-b.png'])
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(2)
  await upload(page, ['foto-a.png'])
  await expect(page.getByRole('status').filter({ hasText: 'ya estaba' })).toBeVisible()
  expect(await inApp<number>(page, 'return s.project.assets.length')).toBe(2)
  // En otro proyecto, la misma foto se reutiliza desde la biblioteca (mismo blob).
  await page.getByTitle('Volver a mis proyectos').first().click()
  const b = await createProjectInDb(page, 'Proyecto B', 'comic', 1)
  await openProject(page, b)
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.getByRole('button', { name: 'Biblioteca', exact: true }).click()
  const lib = page.getByTestId('biblioteca')
  await expect(lib.locator('[data-library-item]')).toHaveCount(2)
  // Renombrar y etiquetar una.
  await lib.getByRole('button', { name: 'Renombrar o etiquetar' }).first().click()
  await lib.getByRole('textbox', { name: 'Nombre' }).fill('Heroína')
  await lib.getByRole('combobox', { name: 'Categoría' }).selectOption('personajes')
  await lib.getByRole('textbox', { name: 'Etiquetas' }).fill('protagonista, roja')
  await lib.getByRole('button', { name: 'Guardar' }).click()
  await lib.getByRole('textbox', { name: 'Buscar en la biblioteca' }).fill('protag')
  await expect(lib.locator('[data-library-item]')).toHaveCount(1)
  await lib.getByRole('textbox', { name: 'Buscar en la biblioteca' }).fill('')
  await lib.getByRole('button', { name: 'Personajes' }).click()
  await expect(lib.locator('[data-library-item]')).toHaveCount(1)
  await lib.getByRole('button', { name: 'Todo' }).click()
  await lib.getByRole('combobox', { name: 'Orientación' }).selectOption('vertical') // foto-b es vertical (48×64)
  await expect(lib.locator('[data-library-item]')).toHaveCount(1)
  await lib.getByRole('combobox', { name: 'Orientación' }).selectOption('all')
  // Insertar con clic.
  await inApp(page, 's.select([])')
  await lib.getByRole('button', { name: 'Insertar Heroína' }).click()
  await expect.poll(async () => (await imagesOnPage(page)).length).toBe(1)
  // Arrastrar y soltar sobre el lienzo.
  const target = await canvasPoint(page, { x: 200, y: 200 })
  const item = lib.locator('[data-library-item]').nth(1).getByRole('button').first()
  await item.dragTo(page.locator('[data-tour=canvas]'), { targetPosition: { x: target.x - (await page.locator('[data-tour=canvas]').boundingBox())!.x, y: target.y - (await page.locator('[data-tour=canvas]').boundingBox())!.y } })
  await expect.poll(async () => (await imagesOnPage(page)).length + (await inApp<number>(page, 'return s.project.pages.find(p => p.id === s.pageId).elements.filter(e => e.type === "panel" && e.image).length'))).toBeGreaterThanOrEqual(2)
  // El proyecto B usa los mismos blobs (por referencia, sin copiar).
  const blobs = await idbRaw<number>(page, { db: 'vineta-assets', action: 'count' })
  expect(blobs).toBe(2)
})

test.describe('biblioteca en el celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('insertar desde la biblioteca con un toque', async ({ page }) => {
    await gotoHome(page)
    const a = await createProjectInDb(page, 'Móvil A', 'comic', 1)
    await openProject(page, a)
    await page.getByRole('navigation', { name: 'Herramientas' }).getByRole('button', { name: 'Imágenes' }).tap()
    await page.locator('input[type=file][accept="image/*"]').setInputFiles(FIXTURES + 'foto-a.png')
    await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
    await page.getByRole('button', { name: 'Biblioteca', exact: true }).tap()
    await inApp(page, 's.select([])')
    await page.getByTestId('biblioteca').getByRole('button', { name: /^Insertar / }).first().tap()
    await expect.poll(async () => (await imagesOnPage(page)).length).toBe(1)
  })
})

test('elemento reutilizable: guardar selección, borrar el proyecto de origen y usarlo en otro', async ({ page }) => {
  await gotoHome(page)
  const a = await createProjectInDb(page, 'Origen composición', 'comic', 1)
  await openProject(page, a)
  await upload(page, ['foto-b.png'])
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
  const ids = await inApp<string[]>(
    page,
    `const img = m.factories.createImage(s.project.assets[0].id, 300, 300, 120, 160); const b = m.factories.createBubble('speech', 380, 250); b.text = 'Soy yo'
     m.store.useEditor.getState().addElements([img, b]); return [img.id, b.id]`,
  )
  await inApp(page, 's.select(arg)', ids)
  await page.getByRole('button', { name: 'Biblioteca', exact: true }).click()
  await page.getByRole('button', { name: 'Guardar lo seleccionado como elemento reutilizable' }).click()
  await page.getByRole('textbox', { name: 'Nombre del elemento reutilizable' }).fill('Personaje con globo')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByTestId('biblioteca').getByRole('button', { name: 'Insertar Personaje con globo' })).toBeVisible()
  await page.getByTitle('Volver a mis proyectos').first().click()
  await inApp(page, `const p = await m.storage.loadProject(arg); await m.storage.deleteProject(p)`, a)
  const b = await createProjectInDb(page, 'Destino composición', 'manga', 1)
  await openProject(page, b)
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.getByRole('button', { name: 'Biblioteca', exact: true }).click()
  await inApp(page, 's.select([])')
  await page.getByTestId('biblioteca').getByRole('button', { name: 'Insertar Personaje con globo' }).click()
  const r = await inApp<{ dx: number; dy: number; text: string; ok: boolean; newIds: boolean }>(
    page,
    `const els = s.project.pages[0].elements; const img = els.find(e => e.type === 'image'); const b = els.find(e => e.type === 'bubble')
     const pic = await m.assets.loadAssetImage(img.assetId)
     return { dx: b.x - img.x, dy: b.y - img.y, text: b.text, ok: !!pic && pic.naturalWidth > 0 && s.project.assets.some(a => a.id === img.assetId), newIds: !arg.includes(img.id) && !arg.includes(b.id) }`,
    ids,
  )
  expect(r).toEqual({ dx: 80, dy: -50, text: 'Soy yo', ok: true, newIds: true })
})

test('papelera: deshacer enseguida, restaurar después y borrar para siempre', async ({ page }) => {
  await gotoHome(page)
  await createProjectInDb(page, 'Para borrar', 'comic', 1)
  await page.reload()
  const menu = async (item: string) => {
    const card = projectCard(page, 'Para borrar')
    await card.hover()
    await card.getByRole('button', { name: 'Opciones' }).click()
    await page.getByRole('button', { name: item, exact: true }).click()
  }
  await menu('Eliminar')
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(projectCard(page, 'Para borrar')).toHaveCount(0)
  await page.getByRole('status').filter({ hasText: 'papelera' }).getByRole('button', { name: 'Deshacer' }).click()
  await expect(projectCard(page, 'Para borrar')).toBeVisible()
  await menu('Eliminar')
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  const trash = page.getByTestId('papelera')
  await trash.locator('summary').click()
  await trash.getByRole('button', { name: 'Restaurar' }).click()
  await expect(projectCard(page, 'Para borrar')).toBeVisible()
  await menu('Eliminar')
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await trash.locator('summary').click()
  await trash.getByRole('button', { name: 'Borrar para siempre' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar', exact: true }).click()
  await expect(page.getByTestId('papelera')).toHaveCount(0)
})

test('renombrar, buscar, filtrar y ordenar proyectos', async ({ page }) => {
  await gotoHome(page)
  await createProjectInDb(page, 'Zeta manga', 'manga', 1)
  await createProjectInDb(page, 'Alfa cómic', 'comic', 1)
  await page.reload()
  await page.getByRole('textbox', { name: 'Buscar proyecto' }).fill('zeta')
  await expect(page.locator('main article')).toHaveCount(1)
  await page.getByRole('textbox', { name: 'Buscar proyecto' }).fill('')
  await page.getByRole('combobox', { name: 'Tipo de obra' }).selectOption('comic')
  await expect(page.locator('main article')).toHaveCount(1)
  await page.getByRole('combobox', { name: 'Tipo de obra' }).selectOption('all')
  await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('name')
  await expect(page.locator('main article').first()).toContainText('Alfa cómic')
  const card = projectCard(page, 'Alfa cómic')
  await card.hover()
  await card.getByRole('button', { name: 'Opciones' }).click()
  await page.getByRole('button', { name: 'Renombrar', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nuevo nombre' }).fill('Beta cómic')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(projectCard(page, 'Beta cómic')).toBeVisible()
})

test('cuota casi llena: medidor y aviso; un guardado fallido aparece en el centro de recuperación', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'storage', { value: { ...navigator.storage, estimate: async () => ({ usage: 900_000_000, quota: 1_000_000_000 }), persisted: async () => false, persist: async () => true } })
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if ((window as unknown as { __lleno?: boolean }).__lleno && this.name === 'projects') throw new DOMException('cuota', 'QuotaExceededError')
      return put.apply(this, args)
    }
  })
  await gotoHome(page)
  await expect(page.getByTestId('uso-almacenamiento').first()).toContainText('858 MB de 954 MB')
  await expect(page.getByRole('alert').filter({ hasText: 'poco espacio' })).toBeVisible()
  const id = await createProjectInDb(page, 'Disco lleno', 'comic', 1)
  await openProject(page, id)
  await page.waitForTimeout(1500)
  await page.evaluate(() => ((window as unknown as { __lleno: boolean }).__lleno = true))
  await inApp(page, `s.updateElement(s.project.pages[0].elements[0].id, { x: 5 })`)
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toBeVisible()
  // Sigue sin espacio al salir: el guardado pendiente vuelve a fallar y queda registrado.
  await page.evaluate(() => (location.hash = '/'))
  await page.getByRole('button', { name: 'Centro de recuperación' }).click()
  const rc = page.getByTestId('centro-recuperacion')
  await expect(rc.getByText('Guardados que fallaron')).toBeVisible()
  await expect(rc).toContainText('Disco lleno')
  await rc.getByRole('button', { name: 'Pedir almacenamiento persistente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'no va a borrar tus proyectos' })).toBeVisible()
})

test('dos pestañas con el mismo proyecto: la segunda abre en solo lectura y puede tomar el control', async ({ page, context }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Compartido', 'comic', 1)
  await openProject(page, id)
  await page.waitForTimeout(500)
  const second = await context.newPage()
  await second.goto(`/#/p/${id}`)
  await expect(second.getByTestId('solo-lectura')).toContainText('ya está abierto en otra pestaña')
  // En solo lectura no se modifica nada.
  const x0 = await inApp<number>(second, 'return s.project.pages[0].elements[0].x')
  await inApp(second, `s.updateElement(s.project.pages[0].elements[0].id, { x: 999 })`)
  expect(await inApp<number>(second, 'return s.project.pages[0].elements[0].x')).toBe(x0)
  // La primera edita y guarda; la segunda toma el control y ve ese cambio.
  await inApp(page, `s.updateElement(s.project.pages[0].elements[0].id, { x: 123 })`)
  await expect.poll(() => inApp<string>(page, 'return s.saveStatus')).toBe('saved')
  await second.getByRole('button', { name: 'Editar en esta pestaña' }).click()
  await expect(second.getByTestId('solo-lectura')).toHaveCount(0)
  await expect.poll(() => inApp<number>(second, 'return s.project.pages[0].elements[0].x')).toBe(123)
  await expect(page.getByTestId('solo-lectura')).toContainText('Seguiste editando este proyecto en otra pestaña')
  // La primera ya no puede pisar los cambios.
  await inApp(page, `s.updateElement(s.project.pages[0].elements[0].id, { x: 1 })`)
  await inApp(second, `s.updateElement(s.project.pages[0].elements[0].id, { x: 456 })`)
  await expect.poll(() => inApp<string>(second, 'return s.saveStatus')).toBe('saved')
  await page.waitForTimeout(1200)
  expect(await inApp<number>(second, `return (await m.storage.loadProject(arg)).pages[0].elements[0].x`, id)).toBe(456)
})

test('migración: 100 proyectos guardados por la versión anterior (sin índice) cargan sin bloquear el inicio', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoHome(page)
  await inApp(
    page,
    `const req = indexedDB.open('vineta-projects'); await new Promise(r => (req.onsuccess = r))
     const db = req.result; const tx = db.transaction('projects', 'readwrite'); const os = tx.objectStore('projects')
     for (let i = 0; i < 100; i++) { const p = m.factories.createProject({ title: 'Viejo ' + String(i).padStart(3, '0'), author: '', kind: i % 2 ? 'comic' : 'manga', pages: 4 }); os.put(p, p.id) }
     await new Promise(r => (tx.oncomplete = r))`,
  )
  const t0 = Date.now()
  await page.reload()
  await expect(page.locator('main article')).toHaveCount(100, { timeout: 30_000 })
  const first = Date.now() - t0
  const t1 = Date.now()
  await page.reload()
  await expect(page.locator('main article')).toHaveCount(100)
  const second = Date.now() - t1
  test.info().annotations.push({ type: 'tiempos', description: `primera carga (migra el índice): ${first} ms · siguiente: ${second} ms` })
  expect(second).toBeLessThan(5000)
  expect(await idbRaw<number>(page, { db: 'vineta-projects', action: 'count' })).toBe(100)
})

test('centro de recuperación: copia de seguridad completa y restauración validada', async ({ page }) => {
  await gotoHome(page)
  await createProjectInDb(page, 'Respaldo 1', 'comic', 1)
  await createProjectInDb(page, 'Respaldo 2', 'manga', 1)
  await page.reload()
  await page.getByRole('button', { name: 'Centro de recuperación' }).click()
  const rc = page.getByTestId('centro-recuperacion')
  await expect(page.getByTestId('recuperacion-resumen')).toContainText('2 sanos · 0 dañados')
  const [dl] = await Promise.all([page.waitForEvent('download'), rc.getByRole('button', { name: 'Descargar todo (.zip)' }).click()])
  const path = test.info().outputPath('copia.zip')
  await dl.saveAs(path)
  await rc.locator('input[type=file]').setInputFiles(path)
  await expect(rc.getByRole('status').filter({ hasText: 'Restaurados: 2' })).toBeVisible()
  await expect(page.getByTestId('recuperacion-resumen')).toContainText('4 sanos')
})

test('se puede elegir el mismo archivo dos veces seguidas (y se reutiliza sin duplicar)', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Mismo archivo', 'comic', 1)
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  const input = page.locator('input[type=file][accept="image/*"]')
  await input.setInputFiles(FIXTURES + 'foto-a.png')
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
  // El input quedó vacío: el navegador vuelve a avisar aunque sea el mismo archivo.
  expect(await input.evaluate((el) => (el as HTMLInputElement).value)).toBe('')
  await input.setInputFiles(FIXTURES + 'foto-a.png')
  await expect(page.getByRole('status').filter({ hasText: 'ya estaba' })).toBeVisible()
})
