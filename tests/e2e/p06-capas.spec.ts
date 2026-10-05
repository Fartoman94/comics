import { expect, test, type Page } from '@playwright/test'
import { canvasPoint, createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 06 · Capas: jerarquía, selección cruzada, ocultar/bloquear, orden y multi-selección (36 elementos).

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

async function setup(page: Page) {
  const id = await createProjectInDb(page, 'Capas', 'libre', 1)
  await openProject(page, id)
  const ids = await inApp<{ panels: string[]; kids: string[] }>(
    page,
    `const f = m.factories;
     const panels = Array.from({ length: 6 }, (_, i) => { const p = f.createPanel(40 + (i % 2) * 460, 40 + Math.floor(i / 2) * 460, 440, 440); p.name = 'Viñeta ' + (i + 1); return p });
     const kids = panels.flatMap((p, pi) => Array.from({ length: 5 }, (_, k) => { const sh = f.createShape('star', p.x + 20 + k * 80, p.y + 60, 60); sh.name = 'Estrella ' + (pi + 1) + '.' + (k + 1); return sh }));
     s.mutate((d) => void (d.pages[0].elements = [...panels, ...kids]));
     return { panels: panels.map((p) => p.id), kids: kids.map((k) => k.id) }`,
  )
  await page.getByRole('tab', { name: 'Capas' }).click()
  return ids
}

const tree = (page: Page) => page.getByRole('tree', { name: 'Capas de la página' })
const row = (page: Page, name: string) => tree(page).locator('[data-layer-id]').filter({ has: page.getByText(name, { exact: true }) })
const selection = (page: Page) => inApp<string[]>(page, `return m.store.useEditor.getState().selection`)
const zOf = (page: Page, id: string) => inApp<number>(page, `return m.store.currentPage().elements.findIndex((e) => e.id === arg)`, id)

test('36 elementos en árbol Página > Viñeta > elementos, plegar y selección cruzada lienzo ⇄ capas', async ({ page }) => {
  const ids = await setup(page)
  await expect(tree(page).locator('[data-layer-id]')).toHaveCount(36)
  await expect(tree(page).getByRole('treeitem', { name: /Página 1/ }).first()).toBeVisible()
  // Cada viñeta muestra cuántos elementos tiene encima.
  await expect(row(page, 'Viñeta 1')).toContainText('5')
  await row(page, 'Viñeta 1').getByRole('button', { name: 'Plegar Viñeta 1' }).click()
  await expect(tree(page).locator('[data-layer-id]')).toHaveCount(31)

  // Seleccionar en el lienzo despliega y resalta la fila.
  const p = await canvasPoint(page, ids.kids[2])
  await page.mouse.click(p.x, p.y)
  expect(await selection(page)).toEqual([ids.kids[2]])
  await expect(tree(page).locator(`[data-layer-id="${ids.kids[2]}"]`)).toBeVisible()
  await expect(tree(page).getByRole('treeitem', { selected: true }).filter({ hasText: 'Estrella 1.3' })).toHaveCount(1)

  // Y al revés: clic en Capas selecciona en el lienzo (transformador sobre el elemento).
  await row(page, 'Estrella 4.5').click()
  expect(await selection(page)).toEqual([ids.kids[19]])
})

test('ocultar, bloquear (no se mueve pero se selecciona desde Capas) y renombrar con F2', async ({ page }) => {
  const ids = await setup(page)
  const r = row(page, 'Estrella 2.1')
  await r.hover()
  await r.getByRole('button', { name: 'Ocultar' }).click()
  expect(await inApp<boolean>(page, `return m.store.findEl(arg).hidden`, ids.kids[5])).toBe(true)
  await r.getByRole('button', { name: 'Mostrar' }).click()
  expect(await inApp<boolean>(page, `return m.store.findEl(arg).hidden`, ids.kids[5])).toBe(false)

  await r.hover()
  await r.getByRole('button', { name: 'Bloquear' }).click()
  const before = await inApp<number>(page, `return m.store.findEl(arg).x`, ids.kids[5])
  const c = await canvasPoint(page, ids.kids[5])
  await page.mouse.move(c.x, c.y)
  await page.mouse.down()
  await page.mouse.move(c.x + 80, c.y + 40, { steps: 6 })
  await page.mouse.up()
  expect(await inApp<number>(page, `return m.store.findEl(arg).x`, ids.kids[5])).toBe(before)
  await r.click()
  expect(await selection(page)).toEqual([ids.kids[5]])
  await r.getByRole('button', { name: 'Desbloquear' }).click()
  expect(await inApp<boolean>(page, `return m.store.findEl(arg).locked`, ids.kids[5])).toBe(false)

  await r.focus()
  await page.keyboard.press('F2')
  await tree(page).getByRole('textbox', { name: 'Nombre de la capa' }).fill('Estrella fugaz')
  await page.keyboard.press('Enter')
  expect(await inApp<string>(page, `return m.store.findEl(arg).name`, ids.kids[5])).toBe('Estrella fugaz')
})

test('orden: botones de la barra, Alt+flechas y arrastrar una fila sobre otra', async ({ page }) => {
  const ids = await setup(page)
  await row(page, 'Viñeta 6').click()
  await page.getByRole('toolbar', { name: 'Acciones de capas' }).getByRole('button', { name: 'Enviar al fondo' }).click()
  expect(await zOf(page, ids.panels[5])).toBe(0)
  await page.getByRole('toolbar', { name: 'Acciones de capas' }).getByRole('button', { name: 'Traer al frente' }).click()
  expect(await zOf(page, ids.panels[5])).toBe(35)

  await row(page, 'Estrella 3.3').click()
  const z0 = await zOf(page, ids.kids[12])
  await row(page, 'Estrella 3.3').press('Alt+ArrowUp')
  expect(await zOf(page, ids.kids[12])).toBe(z0 + 1)
  await row(page, 'Estrella 3.3').press('Alt+ArrowDown')
  expect(await zOf(page, ids.kids[12])).toBe(z0)

  // Arrastrar "Estrella 1.1" sobre "Estrella 1.5": queda a la altura de la 1.5.
  const target = await zOf(page, ids.kids[4])
  await row(page, 'Estrella 1.1').dragTo(row(page, 'Estrella 1.5'))
  expect(await zOf(page, ids.kids[0])).toBe(target)
})

test('multi-selección con Shift: duplicar y borrar el grupo, mover el grupo con flechas', async ({ page }) => {
  const ids = await setup(page)
  await row(page, 'Estrella 5.1').click()
  await row(page, 'Estrella 5.2').click({ modifiers: ['Shift'] })
  await row(page, 'Estrella 6.4').click({ modifiers: ['Shift'] })
  expect((await selection(page)).sort()).toEqual([ids.kids[20], ids.kids[21], ids.kids[28]].sort())
  await expect(page.getByRole('toolbar', { name: 'Acciones de capas' })).toContainText('3 seleccionado(s)')

  const xs = () => inApp<number[]>(page, `return arg.map((id) => m.store.findEl(id).x)`, [ids.kids[20], ids.kids[21], ids.kids[28]])
  const x0 = await xs()
  await page.getByRole('tab', { name: 'Capas' }).focus()
  await page.keyboard.press('Shift+ArrowRight')
  expect(await xs()).toEqual(x0.map((x) => x + 10))

  await page.getByRole('toolbar', { name: 'Acciones de capas' }).getByRole('button', { name: 'Duplicar selección' }).click()
  await expect(tree(page).locator('[data-layer-id]')).toHaveCount(39)
  await page.getByRole('toolbar', { name: 'Acciones de capas' }).getByRole('button', { name: 'Eliminar selección' }).click()
  await expect(tree(page).locator('[data-layer-id]')).toHaveCount(36)
})
