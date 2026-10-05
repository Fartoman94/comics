import { expect, test, type Page } from '@playwright/test'
import { canvasPoint, createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 05 · Globos, textos y onomatopeyas.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

async function open(page: Page) {
  const id = await createProjectInDb(page, 'Globos', 'libre', 1)
  await openProject(page, id)
  await inApp(page, `s.mutate((d) => void (d.pages[0].elements = []))`)
  await page.getByRole('tab', { name: 'Elementos' }).click()
}

const sel = (page: Page) => inApp<Record<string, unknown>>(page, `return m.store.findEl(s.selection[0])`)

/** Stage del lienzo visible (para leer el transformador o la manija de la cola). */
function konva<T>(page: Page, body: string, arg?: unknown) {
  return page.evaluate(
    async ([body, arg]) => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
      const Konva = (await import(/* @vite-ignore */ url)).default
      const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
      return new Function('st', 'arg', body)(st, arg)
    },
    [body, arg] as const,
  ) as Promise<T>
}

test('los 9 tipos de globo se insertan desde Elementos y se cambian desde Propiedades', async ({ page }) => {
  await open(page)
  const labels = ['Diálogo', 'Pensamiento', 'Grito', 'Susurro', 'Impacto', 'Sin borde', 'Narrador', 'Caja de narración', 'Recuadro nube']
  const shapes = ['speech', 'thought', 'shout', 'whisper', 'impact', 'borderless', 'box', 'rounded-box', 'cloud-box']
  const panel = page.getByRole('complementary', { name: 'Paneles del proyecto' })
  for (const [i, label] of labels.entries()) {
    await panel.getByRole('button', { name: label, exact: true }).click()
    expect((await sel(page)).shape).toBe(shapes[i])
  }
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await inspector.getByRole('radio', { name: 'Sin borde' }).click()
  expect(await sel(page)).toMatchObject({ shape: 'borderless', strokeWidth: 0 })
  await inspector.getByRole('radio', { name: 'Caja de narración' }).click()
  expect(await sel(page)).toMatchObject({ shape: 'rounded-box', tail: false, cornerRadius: 18 })
  await expect(inspector.getByRole('slider', { name: 'Radio de las esquinas' })).toBeVisible()
})

test('edición en el lugar: doble clic, Enter confirma, Shift+Enter agrega línea, Esc cancela; deshacer/rehacer', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Diálogo', exact: true }).click()
  const id = (await sel(page)).id as string
  const c = await canvasPoint(page, id)
  await page.mouse.dblclick(c.x, c.y)
  await expect(page.locator('textarea.absolute')).toBeFocused()
  await page.keyboard.press('Control+a')
  await page.keyboard.type('Hola')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('che')
  await page.keyboard.press('Enter')
  await expect(page.locator('textarea.absolute')).toHaveCount(0)
  expect((await sel(page)).text).toBe('Hola\nche')

  await page.mouse.dblclick(c.x, c.y)
  await page.keyboard.press('Control+a')
  await page.keyboard.type('Esto no queda')
  await page.keyboard.press('Escape')
  expect((await sel(page)).text).toBe('Hola\nche')

  await page.keyboard.press('Control+z')
  expect(await inApp<string>(page, `return m.store.findEl(arg).text`, id)).not.toBe('Hola\nche')
  await page.keyboard.press('Control+Shift+z')
  expect(await inApp<string>(page, `return m.store.findEl(arg).text`, id)).toBe('Hola\nche')
})

test('cola arrastrable hacia el personaje, ancho de cola, resize con el marco correcto, Ctrl+D y Supr', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Diálogo', exact: true }).click()
  const b = await sel(page)
  // El marco de selección abarca el globo entero (antes tomaba sólo la caja del texto).
  const tr = await konva<{ w: number; h: number; k: number }>(page, `const t = st.findOne('Transformer'); return { w: t.width(), h: t.height(), k: st.scaleX() }`)
  expect(tr.w / tr.k).toBeCloseTo(b.width as number, 0)
  expect(tr.h / tr.k).toBeCloseTo(b.height as number, 0)

  // Arrastrar la punta de la cola.
  const tip = { x: (b.x as number) + (b.tailX as number), y: (b.y as number) + (b.tailY as number) }
  const from = await canvasPoint(page, tip)
  const to = await canvasPoint(page, { x: tip.x + 150, y: tip.y + 60 })
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.mouse.up()
  const moved = await sel(page)
  expect(moved.tailX as number).toBeGreaterThan((b.tailX as number) + 100)
  expect(moved.x).toBe(b.x)
  await page.keyboard.press('Control+z')
  expect((await sel(page)).tailX).toBe(b.tailX)

  await page.getByRole('complementary', { name: 'Propiedades' }).getByRole('slider', { name: 'Ancho de la cola' }).fill('2')
  expect((await sel(page)).tailWidth).toBe(2)

  // Resize desde la esquina inferior derecha del transformador.
  const corner = await konva<{ x: number; y: number }>(page, `const a = st.findOne('.bottom-right'); const r = st.container().getBoundingClientRect(); const p = a.getAbsolutePosition(); return { x: r.left + p.x, y: r.top + p.y }`)
  await page.mouse.move(corner.x, corner.y)
  await page.mouse.down()
  await page.mouse.move(corner.x + 60, corner.y + 30, { steps: 6 })
  await page.mouse.up()
  expect((await sel(page)).width as number).toBeGreaterThan((b.width as number) + 50)

  await page.keyboard.press('Control+d')
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').length`)).toBe(2)
  await page.keyboard.press('Delete')
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').length`)).toBe(1)
})

test('onomatopeyas clásicas: las 10, con contorno y sombra; se giran y persisten', async ({ page }) => {
  await open(page)
  const panel = page.getByRole('complementary', { name: 'Paneles del proyecto' })
  for (const w of ['BOOM', 'BANG', 'POW', 'CRASH', 'WHOOSH', 'ZAP', 'PUM', 'PAM', 'TAC', 'BRRR']) await expect(panel.getByRole('button', { name: w, exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'POW', exact: true }).click()
  expect(await sel(page)).toMatchObject({ type: 'text', text: 'POW', shadow: true, uppercase: true })
  expect((await sel(page)).strokeWidth as number).toBeGreaterThan(0)
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  const giro = inspector.locator('label', { hasText: 'Giro' }).locator('input')
  await giro.fill('-12')
  await giro.press('Enter')
  expect((await sel(page)).rotation).toBe(-12)
  await inspector.getByRole('button', { name: 'Diálogo' }).count() // (el panel de texto no ofrece formas de globo)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`)).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await inApp<unknown>(page, `const t = s.project.pages[0].elements.find((e) => e.type === 'text'); return { text: t.text, rotation: t.rotation }`)).toEqual({ text: 'POW', rotation: -12 })
})
