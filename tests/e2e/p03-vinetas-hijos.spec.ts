import { expect, test, type Page } from '@playwright/test'
import { canvasPoint, createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 03 · Viñetas como contenedor: contenido que se mueve con la viñeta, formas y símbolos,
// ocultar/bloquear desde Propiedades, etiqueta de selección y persistencia.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

type Pos = Record<string, { x: number; y: number }>
const positions = (page: Page) => inApp<Pos>(page, `return Object.fromEntries(m.store.currentPage().elements.map((e) => [e.id, { x: e.x, y: e.y }]))`)

async function setup(page: Page) {
  const id = await createProjectInDb(page, 'Contenedor', 'comic', 2)
  await openProject(page, id)
  return inApp<{ panel: string; other: string; bubble: string; shape: string }>(
    page,
    `const pg = s.project.pages[1]; s.setPage(pg.id);
     const [panel, other] = pg.elements.filter((e) => e.type === 'panel');
     const b = m.factories.createBubble('speech', panel.x + 20, panel.y + 20, 0.4);
     const sh = m.factories.createShape('anger', panel.x + panel.width - 120, panel.y + panel.height - 120, 90);
     m.store.useEditor.getState().addElements([b, sh], { select: false });
     return { panel: panel.id, other: other.id, bubble: b.id, shape: sh.id }`,
  )
}

async function dragPagePoint(page: Page, from: { x: number; y: number }, dx: number, dy: number, mods: ('Control' | 'Meta')[] = []) {
  const a = await canvasPoint(page, from)
  const b = await canvasPoint(page, { x: from.x + dx, y: from.y + dy })
  for (const k of mods) await page.keyboard.down(k)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 })
  await page.mouse.move(b.x, b.y, { steps: 6 })
  await page.mouse.up()
  for (const k of mods) await page.keyboard.up(k)
}

test('arrastrar una viñeta se lleva su contenido; con Ctrl sólo el marco; las flechas también', async ({ page }) => {
  const ids = await setup(page)
  // Sin imanes para medir desplazamientos exactos.
  await inApp(page, `s.setView({ snap: false })`)
  const p0 = await positions(page)
  const grab = await inApp<{ x: number; y: number }>(page, `const p = m.store.findEl(arg); return { x: p.x + p.width / 2, y: p.y + p.height * 0.75 }`, ids.panel)
  await dragPagePoint(page, grab, 60, 40)
  await expect.poll(async () => (await positions(page))[ids.panel].x).not.toBe(p0[ids.panel].x)
  const p1 = await positions(page)
  const d = { x: p1[ids.panel].x - p0[ids.panel].x, y: p1[ids.panel].y - p0[ids.panel].y }
  expect(Math.abs(d.x)).toBeGreaterThan(20)
  for (const child of [ids.bubble, ids.shape]) {
    expect(p1[child].x - p0[child].x).toBeCloseTo(d.x, 0)
    expect(p1[child].y - p0[child].y).toBeCloseTo(d.y, 0)
  }
  expect(p1[ids.other]).toEqual(p0[ids.other])
  // Un solo paso de historial para todo el grupo.
  await page.keyboard.press('Control+z')
  expect(await positions(page)).toEqual(p0)

  // Ctrl: sólo el marco.
  await dragPagePoint(page, grab, 50, 0, ['Control'])
  await expect.poll(async () => (await positions(page))[ids.panel].x).not.toBe(p0[ids.panel].x)
  const p2 = await positions(page)
  expect(p2[ids.bubble]).toEqual(p0[ids.bubble])
  await page.keyboard.press('Control+z')

  // Flechas: la viñeta seleccionada se mueve con su contenido.
  await inApp(page, `s.select([arg])`, ids.panel)
  await page.keyboard.press('Shift+ArrowRight')
  const p3 = await positions(page)
  expect(p3[ids.panel].x - p0[ids.panel].x).toBe(10)
  expect(p3[ids.bubble].x - p0[ids.bubble].x).toBe(10)
})

test('formas y símbolos: insertar desde Elementos, cambiar tipo y colores, caja de selección correcta', async ({ page }) => {
  const id = await createProjectInDb(page, 'Formas', 'libre', 1)
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Elementos' }).click()
  await page.getByRole('button', { name: 'Insertar Corazón' }).click()
  const el = await inApp<{ id: string; type: string; shape: string; w: number; h: number }>(page, `const e = m.store.findEl(s.selection[0]); return { id: e.id, type: e.type, shape: e.shape, w: e.width, h: e.height }`)
  expect(el).toMatchObject({ type: 'shape', shape: 'heart' })
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await inspector.getByRole('radio', { name: 'Gota de sudor' }).click()
  expect(await inApp<string>(page, `return m.store.findEl(arg).shape`, el.id)).toBe('sweat')
  // El transformador abarca la forma completa (antes quedaba en 0×0 para formas, efectos y dibujos).
  const box = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    const tr = st.findOne('Transformer')
    return { w: tr.width(), h: tr.height(), scale: st.scaleX() }
  })
  expect(box.w / box.scale).toBeCloseTo(el.w, 0)
  expect(box.h / box.scale).toBeCloseTo(el.h, 0)
  // Etiqueta de selección con el nombre.
  expect(await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    return st.findOne('.selection-tag')?.findOne('Text')?.text()
  })).toBe('Forma · Corazón')

  // Un efecto también tiene caja de selección real.
  await page.getByRole('button', { name: /Líneas de impacto/ }).click()
  const effBox = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    return st.findOne('Transformer').width()
  })
  expect(effBox).toBeGreaterThan(50)
})

test('ocultar, bloquear, duplicar, ordenar y eliminar un hijo; todo persiste al recargar', async ({ page }) => {
  const ids = await setup(page)
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await inApp(page, `s.select([arg])`, ids.shape)

  // Duplicar (Ctrl+D) y eliminar la copia (Supr).
  await page.keyboard.press('Control+d')
  const copy = await inApp<string>(page, `return m.store.useEditor.getState().selection[0]`)
  expect(copy).not.toBe(ids.shape)
  await page.keyboard.press('Delete')
  expect(await inApp<boolean>(page, `return !!m.store.findEl(arg)`, copy)).toBe(false)

  // Orden: traer al fondo y al frente.
  await inApp(page, `s.select([arg])`, ids.shape)
  await page.keyboard.press('Control+Shift+[')
  expect(await inApp<number>(page, `return m.store.currentPage().elements.findIndex((e) => e.id === arg)`, ids.shape)).toBe(0)
  await page.keyboard.press('Control+Shift+]')
  expect(await inApp<number>(page, `const els = m.store.currentPage().elements; return els.length - 1 - els.findIndex((e) => e.id === arg)`, ids.shape)).toBe(0)

  // Bloquear: no se mueve con flechas.
  await inspector.getByRole('button', { name: 'Bloquear' }).click()
  const x0 = await inApp<number>(page, `return m.store.findEl(arg).x`, ids.shape)
  await page.keyboard.press('ArrowRight')
  expect(await inApp<number>(page, `return m.store.findEl(arg).x`, ids.shape)).toBe(x0)
  await inspector.getByRole('button', { name: 'Desbloquear' }).click()

  // Ocultar desde Propiedades: deja de dibujarse pero sigue en Capas.
  await inspector.getByRole('button', { name: 'Ocultar' }).click()
  await expect(inspector.getByText(/Oculto: no se ve en la página/)).toBeVisible()
  expect(await page.evaluate(async (id) => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    return !!st.findOne('#' + id)
  }, ids.shape)).toBe(false)
  await page.getByRole('tab', { name: 'Capas' }).click()
  await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' }).getByText('Vena de enojo')).toBeVisible()

  // Margen interior de la viñeta.
  await inApp(page, `s.updateElement(arg, { padding: 14 })`, ids.panel)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`)).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  const after = await inApp<{ hidden: boolean; padding: number; shape: string }>(
    page,
    `const pg = s.project.pages[1]; const sh = pg.elements.find((e) => e.id === arg.shape); const p = pg.elements.find((e) => e.id === arg.panel); return { hidden: sh.hidden, padding: p.padding, shape: sh.shape }`,
    ids,
  )
  expect(after).toEqual({ hidden: true, padding: 14, shape: 'anger' })
})
