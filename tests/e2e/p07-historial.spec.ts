import { expect, test, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 07 · Historial, Ctrl+Z y autoguardado.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

async function open(page: Page) {
  const id = await createProjectInDb(page, 'Historial', 'libre', 2)
  await openProject(page, id)
  const b = await inApp<string>(page, `const b = m.factories.createBubble('speech', 100, 100); b.name = 'Globo 1'; m.store.useEditor.getState().addElements([b]); return b.id`)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { timeout: 10_000 }).toBe('saved')
  return { id, b }
}

const status = (page: Page) => page.getByTestId('estado-guardado')
const xOf = (page: Page, id: string) => inApp<number>(page, `return m.store.findEl(arg).x`, id)

test('20 cambios: Ctrl+Z / Ctrl+Shift+Z y el historial visible con frases y salto a un punto', async ({ page }) => {
  const { b } = await open(page)
  for (let i = 1; i <= 20; i++) await inApp(page, `s.updateElement(arg.id, { x: arg.x })`, { id: b, x: 100 + i * 10 })
  expect(await xOf(page, b)).toBe(300)
  for (let i = 0; i < 5; i++) await page.keyboard.press('Control+z')
  expect(await xOf(page, b)).toBe(250)
  await page.keyboard.press('Control+Shift+z')
  expect(await xOf(page, b)).toBe(260)
  // Botones visibles.
  await page.getByRole('button', { name: 'Deshacer (Ctrl+Z)' }).click()
  expect(await xOf(page, b)).toBe(250)
  await page.getByRole('button', { name: 'Rehacer (Ctrl+Shift+Z)' }).click()
  expect(await xOf(page, b)).toBe(260)

  await page.getByRole('button', { name: 'Historial de cambios' }).click()
  const list = page.getByRole('group', { name: 'Historial de cambios' })
  await expect(list.getByRole('button', { name: 'Moviste Globo 1' }).first()).toBeVisible()
  await expect(list.getByRole('button', { name: 'Agregaste Globo 1' })).toBeVisible()
  // Volver al punto "Agregaste Globo 1" (antes de todos los movimientos).
  await list.getByRole('button', { name: 'Agregaste Globo 1' }).click()
  expect(await xOf(page, b)).toBe(100)
  expect(await inApp<number>(page, `return s.future.length`)).toBe(20)
  await page.getByRole('button', { name: 'Historial de cambios' }).click()
  await page.getByRole('group', { name: 'Historial de cambios' }).getByRole('button', { name: 'Moviste Globo 1' }).first().click()
  expect(await xOf(page, b)).toBe(300)
})

test('estado de guardado: cambios sin guardar → guardado (2 s); una operación crítica se guarda enseguida', async ({ page }) => {
  const { b } = await open(page)
  await expect(status(page)).toHaveAttribute('title', 'Guardado')
  await inApp(page, `s.updateElement(arg, { x: 333 })`, b)
  await expect(status(page)).toHaveAttribute('title', 'Cambios sin guardar')
  // No se guarda por cada cambio: a los 1000 ms todavía está pendiente.
  await page.waitForTimeout(1000)
  expect(await inApp<string>(page, `return s.saveStatus`)).toBe('dirty')
  await expect(status(page)).toHaveAttribute('title', 'Guardado', { timeout: 5000 })

  // Eliminar una página es crítico: se guarda sin esperar el debounce.
  const t0 = Date.now()
  await inApp(page, `s.deletePage(s.project.pages[1].id)`)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { intervals: [50] }).toBe('saved')
  expect(Date.now() - t0).toBeLessThan(1500)
})

test('red lenta: muchas ediciones mientras guarda; lo último gana y persiste al recargar', async ({ page }) => {
  const { b } = await open(page)
  // Disco lento: cada escritura bloquea 250 ms (dos por guardado: proyecto e índice).
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      const until = Date.now() + 250
      while (Date.now() < until) void 0
      return put.apply(this, args)
    }
  })
  for (let i = 1; i <= 12; i++) {
    await inApp(page, `s.updateElement(arg.id, { text: 'versión ' + arg.i })`, { id: b, i })
    if (i === 6) await inApp(page, `void s.saveNow()`)
    await page.waitForTimeout(80)
  }
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { timeout: 10_000 }).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await inApp<string>(page, `return s.project.pages[0].elements.find((e) => e.id === arg).text`, b)).toBe('versión 12')
})

test('error al guardar: estado de error con Reintentar; al volver la red, se guarda', async ({ page }) => {
  const { b } = await open(page)
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put
    ;(window as unknown as { __put: typeof put }).__put = put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'projects') throw new DOMException('Sin espacio', 'QuotaExceededError')
      return put.apply(this, args)
    }
  })
  await inApp(page, `s.updateElement(arg, { text: 'no entra' })`, b)
  await expect(status(page)).toHaveAttribute('title', 'Error al guardar', { timeout: 6000 })
  const alert = page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })
  await expect(alert).toBeVisible()
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = (window as unknown as { __put: typeof IDBObjectStore.prototype.put }).__put
  })
  await alert.getByRole('button', { name: 'Reintentar' }).click()
  await expect(status(page)).toHaveAttribute('title', 'Guardado', { timeout: 6000 })
})

test('recargar con cambios sin llegar a IndexedDB: se recuperan de la copia de rescate, sin aviso bloqueante', async ({ page }) => {
  const { b } = await open(page)
  // IndexedDB falla: el cambio no llega a guardarse antes de recargar.
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'projects') throw new DOMException('Falla de disco', 'UnknownError')
      return put.apply(this, args)
    }
  })
  await inApp(page, `s.updateElement(arg, { text: 'cambio de último segundo' })`, b)
  let dialog = false
  page.on('dialog', (d) => {
    dialog = true
    void d.accept()
  })
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(dialog).toBe(false)
  expect(await inApp<string>(page, `return s.project.pages[0].elements.find((e) => e.id === arg).text`, b)).toBe('cambio de último segundo')
  await expect(page.getByText('Se recuperaron cambios')).toBeVisible()
  // Se vuelve a guardar normalmente y la copia de rescate desaparece.
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { timeout: 8000 }).toBe('saved')
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('vineta:rescate:')).length)).toBe(0)
})
