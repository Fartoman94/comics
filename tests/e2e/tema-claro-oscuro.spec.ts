import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createProjectInDb, gotoHome, openProject, skipTour } from './helpers'

// Modo día (claro) / noche (oscuro): se cambia desde inicio, editor y menú del celular, y queda
// guardado por usuario en el navegador para la próxima visita.

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const theme = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.theme ?? 'dark')

test.beforeEach(async ({ page }) => skipTour(page))

test('por defecto noche; el cambio a día se guarda y sobrevive a recargar y a abrir un proyecto', async ({ page }) => {
  await gotoHome(page)
  expect(await theme(page)).toBe('dark')
  await page.getByRole('button', { name: 'Modo día (claro)' }).click()
  expect(await theme(page)).toBe('light')
  expect(await page.evaluate(() => localStorage.getItem('vineta:tema'))).toBe('light')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(244, 244, 247)')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  expect(await theme(page)).toBe('light')

  const id = await createProjectInDb(page, 'Tema', 'comic', 2)
  await openProject(page, id)
  expect(await theme(page)).toBe('light')
  // Desde el editor se vuelve a noche y también queda guardado.
  await page.getByRole('button', { name: 'Modo noche (oscuro)' }).click()
  expect(await theme(page)).toBe('dark')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await theme(page)).toBe('dark')
})

test('celular: el menú del proyecto cambia el tema', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Tema móvil', 'comic', 2)
  await openProject(page, id)
  await page.getByRole('button', { name: 'Más opciones del proyecto' }).click()
  await page.getByRole('button', { name: /Modo día/ }).click()
  expect(await theme(page)).toBe('light')
})

test('modo día sin problemas serios de accesibilidad (contraste incluido) en inicio y editor', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vineta:tema', 'light')
    localStorage.setItem('vineta:ayudas-apagadas', '1')
  })
  const axe = async () => {
    await page.evaluate(AXE)
    return page.evaluate(async () => {
      const r = await (window as unknown as { axe: { run: (c: Document) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe.run(document)
      return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
    })
  }
  await gotoHome(page)
  await createProjectInDb(page, 'Accesible claro', 'comic', 2)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  expect(await axe(), 'inicio').toEqual([])
  const id = await createProjectInDb(page, 'Accesible claro 2', 'comic', 2)
  await openProject(page, id)
  expect(await axe(), 'editor').toEqual([])
  for (const tab of ['Plantillas', 'Elementos', 'Biblioteca', 'Capas']) {
    await page.getByRole('tab', { name: tab }).click()
    expect(await axe(), tab).toEqual([])
  }
})
