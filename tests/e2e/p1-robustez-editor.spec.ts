import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { canvasPoint, createProjectInDb, FIXTURES, gotoHome, inApp, openProject, skipTour, exportPreset } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
})

const els = (page: Page) => inApp<{ id: string; type: string; x: number; y: number; locked: boolean; assetId?: string; text?: string }[]>(page, 'return s.project.pages.find(p => p.id === s.pageId).elements.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, locked: e.locked, assetId: e.assetId, text: e.text }))')

async function newProject(page: Page, title: string, kind = 'libre') {
  await gotoHome(page)
  const id = await createProjectInDb(page, title, kind, 1)
  await openProject(page, id)
  return id
}

async function uploadAndInsert(page: Page, file: string) {
  await page.getByRole('tab', { name: 'Biblioteca' }).click()
  const n = await inApp<number>(page, 'return s.project.assets.length')
  await page.locator('input[type=file][accept*="image/png"]').setInputFiles(FIXTURES + file)
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(n + 1)
  await inApp(page, 's.select([])')
  await page.locator('aside button[draggable=true]').first().click()
  return inApp<{ id: string; assetId: string }>(page, 'const el = s.project.pages.find(p => p.id === s.pageId).elements.at(-1); return { id: el.id, assetId: el.assetId }')
}

async function exportVineta(page: Page) {
  const dl = await exportPreset(page, /Archivo editable/)
  return JSON.parse(readFileSync((await dl.path())!, 'utf8'))
}

test('A7 · borrar imagen y recurso, deshacer, recargar y exportar: nada roto', async ({ page }) => {
  const pid = await newProject(page, 'A7 completo')
  const img = await uploadAndInsert(page, 'foto-a.png')
  await page.keyboard.press('Delete')
  const tile = page.locator('aside .group').filter({ has: page.locator('button[draggable=true]') }).first()
  await tile.hover()
  await tile.getByRole('button', { name: 'Eliminar imagen' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  expect(await inApp<number>(page, 'return s.project.assets.length')).toBe(0)
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await page.keyboard.press('Control+z')
  await expect.poll(async () => (await els(page)).some((e) => e.id === img.id)).toBe(true)
  expect(await inApp<string[]>(page, 'return s.project.assets.map(a => a.id)')).toEqual([img.assetId])
  await expect.poll(() => inApp<string>(page, 'return s.saveStatus')).toBe('saved')
  await page.reload()
  await openProject(page, pid)
  expect(await inApp<number>(page, `return (await m.assets.loadAssetImage(arg))?.naturalWidth ?? 0`, img.assetId)).toBeGreaterThan(0)
  const file = await exportVineta(page)
  expect(Object.keys(file.blobs)).toEqual([img.assetId])
})

test('A8 · copiar una imagen en A, pegar en B y exportar/importar B: autocontenido', async ({ page }) => {
  await newProject(page, 'Origen A8')
  const img = await uploadAndInsert(page, 'foto-b.png')
  await inApp(page, 's.select([arg])', img.id)
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await inApp(page, 's.select([arg])', img.id)
  await page.keyboard.press('Control+c')
  await page.getByTitle('Volver a mis proyectos').click()
  const b = await createProjectInDb(page, 'Destino A8', 'libre', 1)
  await openProject(page, b)
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await page.keyboard.press('Control+v')
  await expect.poll(async () => (await els(page)).filter((e) => e.type === 'image').length).toBe(1)
  const pasted = (await els(page)).find((e) => e.type === 'image')!
  expect(pasted.assetId).not.toBe(img.assetId)
  expect(await inApp<string[]>(page, 'return s.project.assets.map(a => a.id)')).toEqual([pasted.assetId])
  const file = await exportVineta(page)
  expect(Object.keys(file.blobs)).toEqual([pasted.assetId])
  // y ese .vineta se vuelve a importar sin problemas
  const ok = await inApp<boolean>(page, `const f = new File([JSON.stringify(arg)], 'b.vineta'); const p = await m.storage.importProjectFile(f); return p.assets.length === 1`, file)
  expect(ok).toBe(true)
})

test('A10 · arrastrar una selección mixta mueve sólo los desbloqueados y avisa', async ({ page }) => {
  await newProject(page, 'A10')
  const ids = await inApp<string[]>(page, `const a = m.factories.createPanel(100, 100, 200, 200), b = m.factories.createPanel(400, 100, 200, 200); b.locked = true; s.addElements([a, b]); return [a.id, b.id]`)
  const before = (await els(page)).find((e) => e.id === ids[1])!
  const c = await canvasPoint(page, ids[0])
  await page.mouse.move(c.x, c.y)
  await page.mouse.down()
  await page.mouse.move(c.x + 80, c.y + 40, { steps: 10 })
  await page.mouse.up()
  const after = await els(page)
  expect(after.find((e) => e.id === ids[1])!.x).toBe(before.x)
  expect(after.find((e) => e.id === ids[0])!.x).not.toBe(100)
  await expect(page.getByRole('status').filter({ hasText: 'Se omitió 1 elemento bloqueado' })).toBeVisible()
})

test('A11 · deshacer y luego "Traer al frente" sobre el de arriba conserva Rehacer', async ({ page }) => {
  await newProject(page, 'A11')
  await inApp(page, `const el = s.project.pages[0].elements.at(-1); s.updateElement(el.id, { x: el.x + 10 }); s.select([el.id])`)
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await page.keyboard.press('Control+z')
  const redo = page.getByRole('button', { name: 'Rehacer (Ctrl+Shift+Z)' })
  await expect(redo).toBeEnabled()
  await inApp(page, `s.select([s.project.pages[0].elements.at(-1).id])`)
  await page.keyboard.press('Control+Shift+]')
  await expect(redo).toBeEnabled()
})

test('A16 · doble clic y Enter repetido crean un solo proyecto aunque IndexedDB sea lento', async ({ page }) => {
  await gotoHome(page)
  const cdp = await page.context().newCDPSession(page)
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('textbox', { name: 'Título' }).fill('Una sola vez')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 })
  const create = page.getByRole('button', { name: 'Crear proyecto' })
  await create.dblclick()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await expect(page.locator('[data-tour=read]')).toBeVisible()
  const n = await inApp<number>(page, `return (await m.storage.listProjects()).filter(p => p.title === 'Una sola vez').length`)
  expect(n).toBe(1)
  // "Crear rápido" con doble clic también crea uno solo.
  await page.getByTitle('Volver a mis proyectos').first().click()
  const before = await inApp<number>(page, 'return (await m.storage.listProjects()).length')
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Crear rápido' }).dblclick()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await inApp<number>(page, 'return (await m.storage.listProjects()).length')).toBe(before + 1)
})

test.describe('B3 · texto e IME', () => {
  for (const [lang, text] of [
    ['japonés', 'にほんご'],
    ['coreano', '한국어'],
    ['chino', '中文字'],
  ] as const) {
    test(`Esc durante la composición en ${lang} no cierra la edición`, async ({ page }) => {
      await newProject(page, `IME ${lang}`)
      await page.keyboard.press('t')
      const p = await canvasPoint(page, { x: 300, y: 500 })
      await page.mouse.click(p.x, p.y)
      await expect.poll(() => inApp<string | null>(page, 'return s.editingTextId')).not.toBeNull()
      await page.keyboard.press('Control+a')
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length })
      await page.keyboard.press('Escape')
      expect(await inApp<string | null>(page, 'return s.editingTextId')).not.toBeNull()
      await cdp.send('Input.insertText', { text })
      await page.keyboard.press('Escape')
      await expect.poll(() => inApp<string | null>(page, 'return s.editingTextId')).toBeNull()
      expect((await els(page)).some((e) => e.text === text)).toBe(true)
    })
  }

  test('con entrada normal Esc confirma y cierra', async ({ page }) => {
    await newProject(page, 'IME normal')
    await page.keyboard.press('t')
    const p = await canvasPoint(page, { x: 300, y: 500 })
    await page.mouse.click(p.x, p.y)
    await page.keyboard.press('Control+a')
    await page.keyboard.type('Hola')
    await page.keyboard.press('Escape')
    await expect.poll(() => inApp<string | null>(page, 'return s.editingTextId')).toBeNull()
    expect((await els(page)).some((e) => e.text === 'Hola')).toBe(true)
  })

  test('el globo creado con G entra en edición y la primera letra no dispara atajos', async ({ page }) => {
    await newProject(page, 'Globo G')
    await page.keyboard.press('g')
    const p = await canvasPoint(page, { x: 400, y: 600 })
    await page.mouse.click(p.x, p.y)
    await expect.poll(() => inApp<string | null>(page, 'return s.editingTextId')).not.toBeNull()
    await page.keyboard.press('Control+a')
    await page.keyboard.type('hola, buen día')
    await page.keyboard.press('Escape')
    expect(await inApp<string>(page, 'return s.tool')).toBe('select')
    expect((await els(page)).some((e) => e.type === 'bubble' && e.text === 'hola, buen día')).toBe(true)
  })
})

test.describe('lienzo táctil y dibujo', () => {
  test('pointercancel descarta el trazo en curso', async ({ page }) => {
    await newProject(page, 'Cancel')
    await page.keyboard.press('b')
    const cdp = await page.context().newCDPSession(page)
    const a = await canvasPoint(page, { x: 200, y: 200 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] })
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + i * 15, y: a.y + i * 10 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    // Antes, el trazo cancelado seguía vivo: sumaba puntos y se aplicaba con el próximo pointerup
    // en cualquier lugar (por ejemplo al tocar un botón fuera del lienzo).
    await page.mouse.move(a.x + 200, a.y + 200)
    await page.mouse.move(a.x + 220, a.y + 220)
    await page.mouse.move(5, 450)
    await page.mouse.down()
    await page.mouse.up()
    expect((await els(page)).filter((e) => e.type === 'drawing')).toHaveLength(0)
  })

  test('pellizcar con un dedo apoyado sobre un elemento no lo mueve', async ({ page }) => {
    await newProject(page, 'Pellizco')
    const id = await inApp<string>(page, `const a = m.factories.createPanel(300, 300, 300, 300); s.addElements([a]); s.select([a.id]); return a.id`)
    const before = (await els(page)).find((e) => e.id === id)!
    const c = await canvasPoint(page, id)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y, id: 1 }] })
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x + i * 6, y: c.y + i * 4, id: 1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x + 30, y: c.y + 20, id: 1 }, { x: c.x + 120, y: c.y + 20, id: 2 }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x + 30 - i * 8, y: c.y + 20, id: 1 }, { x: c.x + 120 + i * 8, y: c.y + 20, id: 2 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(300)
    const after = (await els(page)).find((e) => e.id === id)!
    expect({ x: after.x, y: after.y }).toEqual({ x: before.x, y: before.y })
  })

  test('dibujar sobre una capa girada deja el trazo donde se dibujó', async ({ page }) => {
    await newProject(page, 'Capa girada')
    const layer = await inApp<string>(page, `const d = m.factories.createDrawing(s.project.format.width, s.project.format.height); d.x = 100; d.y = 50; d.rotation = 30; s.addElements([d]); return d.id`)
    await page.keyboard.press('b')
    const pts = [{ x: 300, y: 300 }, { x: 420, y: 360 }, { x: 520, y: 480 }]
    const scr = await Promise.all(pts.map((p) => canvasPoint(page, p)))
    await page.mouse.move(scr[0].x, scr[0].y)
    await page.mouse.down()
    for (const p of scr.slice(1)) await page.mouse.move(p.x, p.y, { steps: 4 })
    await page.mouse.up()
    // Se reconstruye la posición en la página aplicando la transformación de la capa a los puntos guardados.
    const back = await inApp<{ x: number; y: number }[]>(
      page,
      `const L = s.project.pages[0].elements.find(e => e.id === arg); const st = L.strokes.at(-1)
       const k = L.width / L.baseWidth, r = L.rotation * Math.PI / 180
       return st.points.map(([x, y]) => ({ x: L.x + (x * k) * Math.cos(r) - (y * k) * Math.sin(r), y: L.y + (x * k) * Math.sin(r) + (y * k) * Math.cos(r) }))`,
      layer,
    )
    expect(back[0].x).toBeCloseTo(pts[0].x, 0)
    expect(back[0].y).toBeCloseTo(pts[0].y, 0)
    expect(back.at(-1)!.x).toBeCloseTo(pts[2].x, 0)
    expect(back.at(-1)!.y).toBeCloseTo(pts[2].y, 0)
  })

  test('120 trazos: los canvases de dibujo retenidos no crecen con el historial', async ({ page }) => {
    await newProject(page, 'Memoria')
    const size = await inApp<number[]>(
      page,
      `const strokes = await import('/src/components/editor/nodes/strokes.ts')
       const d = m.factories.createDrawing(s.project.format.width, s.project.format.height); s.addElements([d])
       const sizes = []
       for (let i = 0; i < 120; i++) {
         m.store.useEditor.getState().updateElement(d.id, (el) => { el.strokes = [...el.strokes, { points: [[i, i, 0.5], [i + 40, i + 30, 0.5]], color: '#111', size: 4, opacity: 1, brush: 'ink', erase: false }] })
         await new Promise(r => requestAnimationFrame(r))
         if (i % 40 === 39) sizes.push(strokes.strokeCacheSize())
       }
       return sizes`,
    )
    expect(await inApp<number>(page, 'return s.past.length')).toBeGreaterThanOrEqual(100)
    for (const n of size) expect(n).toBeLessThanOrEqual(2)
  })
})
