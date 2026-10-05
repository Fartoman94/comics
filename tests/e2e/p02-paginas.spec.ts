import { expect, test, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 02 · Sistema de páginas: tira de miniaturas, operaciones, salto directo y persistencia.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

const pages = (page: Page) => inApp<{ id: string; name: string; n: number }[]>(page, `return s.project.pages.map((p) => ({ id: p.id, name: p.name, n: p.elements.length }))`)
const currentIndex = (page: Page) => inApp<number>(page, `return s.project.pages.findIndex((p) => p.id === s.pageId)`)

test('10 páginas: crear, reordenar arrastrando, duplicar, renombrar, eliminar y todo persiste al recargar', async ({ page }) => {
  const id = await createProjectInDb(page, 'Diez páginas', 'comic', 1)
  await openProject(page, id)
  const strip = page.getByTestId('tira-paginas')
  await expect(strip).toBeVisible()

  // Crear hasta 10 desde el "+" de la tira.
  for (let i = 0; i < 9; i++) await strip.getByRole('button', { name: 'Agregar página al final' }).click()
  await expect(strip.getByRole('list', { name: 'Páginas' }).getByRole('button', { name: /^Página \d+:/ })).toHaveCount(10)
  // Cada página nueva arranca con la tarjeta "Empezá tu primera página": se elige un layout.
  await page.getByTestId('pagina-vacia').getByRole('button', { name: '2 horizontales' }).click()
  const before = await pages(page)
  expect(new Set(before.map((p) => p.id)).size).toBe(10)

  // Reordenar: arrastrar la página 10 sobre la 2.
  const thumb = (n: number) => strip.getByRole('button', { name: new RegExp(`^Página ${n}:`) })
  const from = (await thumb(10).boundingBox())!
  const to = (await thumb(2).boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x - 40, from.y + from.height / 2, { steps: 4 })
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => (await pages(page))[1].id).toBe(before[9].id)

  // Salto directo.
  const jump = strip.getByRole('textbox', { name: 'Ir a la página' })
  await jump.fill('7')
  await jump.press('Enter')
  await expect.poll(() => currentIndex(page)).toBe(6)
  await strip.getByRole('button', { name: /^Siguiente/ }).click()
  await expect.poll(() => currentIndex(page)).toBe(7)
  await strip.getByRole('button', { name: /^Anterior/ }).click()
  await expect.poll(() => currentIndex(page)).toBe(6)

  // Renombrar y duplicar la actual desde el menú de la tira.
  await strip.getByRole('button', { name: 'Acciones de la página actual' }).click()
  await page.getByRole('button', { name: 'Renombrar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Renombrar página' })
  await dialog.getByRole('textbox').fill('Clímax')
  await dialog.getByRole('button', { name: 'Guardar' }).click()
  await strip.getByRole('button', { name: 'Acciones de la página actual' }).click()
  await page.getByRole('button', { name: 'Duplicar', exact: true }).click()
  await expect.poll(async () => (await pages(page)).length).toBe(11)
  expect((await pages(page))[7].name).toBe('Clímax (copia)')

  // Eliminar la página 3 con confirmación.
  await jump.fill('3')
  await jump.press('Enter')
  const removedId = (await pages(page))[2].id
  await strip.getByRole('button', { name: 'Acciones de la página actual' }).click()
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await page.getByRole('dialog', { name: 'Eliminar página' }).getByRole('button', { name: 'Eliminar' }).click()
  await expect.poll(async () => (await pages(page)).length).toBe(10)

  const final = await pages(page)
  expect(final.map((p) => p.id)).not.toContain(removedId)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`)).toBe('saved')

  // Recargar: mismo orden, mismos ids, mismos nombres y contenido.
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await pages(page)).toEqual(final)
})

test('copiar contenido de una página a otras desde la lista de Páginas', async ({ page }) => {
  const id = await createProjectInDb(page, 'Copiar contenido', 'comic', 3)
  await openProject(page, id)
  const before = await pages(page)
  const src = page.getByRole('complementary', { name: 'Paneles del proyecto' }).locator('li').filter({ hasText: before[1].name }).first()
  await src.hover()
  await src.getByRole('button', { name: 'Copiar contenido a otras páginas' }).click()
  const dialog = page.getByRole('dialog', { name: 'Copiar contenido a…' })
  await dialog.getByRole('checkbox', { name: new RegExp(`^Página 3:`) }).check()
  await dialog.getByRole('button', { name: /Copiar a 1 página/ }).click()
  await expect.poll(async () => (await pages(page))[2].n).toBe(before[2].n + before[1].n)
  const ids = await inApp<{ a: string[]; b: string[] }>(page, `return { a: s.project.pages[1].elements.map((e) => e.id), b: s.project.pages[2].elements.map((e) => e.id) }`)
  expect(ids.b.filter((x) => ids.a.includes(x))).toEqual([])
})

test('renombrar con doble clic en la miniatura y plegar la tira (se recuerda)', async ({ page }) => {
  const id = await createProjectInDb(page, 'Plegar tira', 'comic', 2)
  await openProject(page, id)
  const strip = page.getByTestId('tira-paginas')
  await strip.getByRole('button', { name: /^Página 2:/ }).dblclick()
  await page.getByRole('dialog', { name: 'Renombrar página' }).getByRole('textbox').fill('Intro')
  await page.keyboard.press('Enter')
  await expect(strip.getByRole('button', { name: 'Página 2: Intro' })).toBeVisible()
  await strip.getByRole('button', { name: 'Plegar tira de páginas' }).click()
  await expect(strip.getByRole('list', { name: 'Páginas' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('tira-paginas').getByRole('button', { name: 'Mostrar tira de páginas' })).toBeVisible()
})
