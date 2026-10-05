import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createProjectInDb, gotoHome, inApp, openProject, openView, skipTour } from './helpers'

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
async function axe(page: Page) {
  await page.evaluate(AXE)
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (c: Document) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe.run(document)
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
  })
}

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
})

test('axe: 0 problemas serios o críticos en las rutas principales', async ({ page }) => {
  await gotoHome(page)
  expect(await axe(page), 'inicio').toEqual([])
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  expect(await axe(page), 'nuevo proyecto · paso 1').toEqual([])
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  expect(await axe(page), 'nuevo proyecto · paso 3').toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Centro de recuperación' }).click()
  expect(await axe(page), 'centro de recuperación').toEqual([])
  await page.keyboard.press('Escape')
  const id = await createProjectInDb(page, 'Accesible', 'comic', 3)
  await openProject(page, id)
  await inApp(page, 's.select([s.project.pages[0].elements[0].id])')
  expect(await axe(page), 'editor (estudio)').toEqual([])
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  expect(await axe(page), 'exportar').toEqual([])
  await page.keyboard.press('Escape')
  await openView(page, 'Leer')
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible()
  expect(await axe(page), 'lector').toEqual([])
  await page.keyboard.press('Escape')
  await openView(page, 'Previsualizar')
  expect(await axe(page), 'previsualizar').toEqual([])
  await page.keyboard.press('Escape')
  await openView(page, 'Vista general')
  expect(await axe(page), 'vista general').toEqual([])
})

test.describe('axe en el celular (modo simple)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('editor simple y hojas', async ({ page }) => {
    await gotoHome(page)
    const id = await createProjectInDb(page, 'Accesible móvil', 'comic', 2)
    await openProject(page, id)
    expect(await axe(page), 'editor simple').toEqual([])
    await page.getByRole('navigation', { name: 'Herramientas' }).getByRole('button', { name: 'Texto' }).click()
    expect(await axe(page), 'hoja Texto').toEqual([])
  })
})

test('teclado: todo el recorrido sin mouse, con foco atrapado en diálogos y devuelto al cerrar', async ({ page }) => {
  await gotoHome(page)
  // Nuevo proyecto con Tab + Enter.
  const nuevo = page.getByRole('button', { name: 'Nuevo proyecto' }).first()
  await nuevo.focus()
  await page.keyboard.press('Enter')
  const dlg = page.getByRole('dialog', { name: 'Nuevo proyecto' })
  await expect(dlg).toBeVisible()
  // El foco no se escapa del diálogo.
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(nuevo).toBeFocused()
  await nuevo.focus()
  await page.keyboard.press('Enter')
  await dlg.getByRole('button', { name: 'Crear rápido' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-tour=canvas]')).toBeVisible()
  // Insertar un globo con el teclado y moverlo con flechas.
  await page.getByRole('tab', { name: 'Elementos' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Diálogo', exact: true }).focus()
  await page.keyboard.press('Enter')
  const before = await inApp<number>(page, 'return s.project.pages.find(p => p.id === s.pageId).elements.find(e => e.type === "bubble").x')
  await inApp(page, 'document.activeElement?.blur()')
  for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
  expect(await inApp<number>(page, 'return s.project.pages.find(p => p.id === s.pageId).elements.find(e => e.type === "bubble").x')).toBe(before + 30)
  // Abrir el lector con Enter, pasar página con flechas y salir con Esc: el foco vuelve a "Leer".
  const leer = page.locator('[data-tour=read]')
  await leer.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(leer).toBeFocused()
  // Reordenar páginas con el teclado desde la vista general.
  await openView(page, 'Vista general')
  const names = () => inApp<string[]>(page, 'return s.project.pages.map(p => p.name)')
  const start = await names()
  await page.getByRole('button', { name: /^Mover página 2/ }).focus()
  await page.keyboard.press('ArrowRight')
  expect((await names())[2]).toBe(start[1])
})
