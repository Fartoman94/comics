import { expect, test } from '@playwright/test'
import { gotoHome, inApp, skipTour } from './helpers'

// Muestras premium: la galería del inicio crea una copia editable completa (30+ páginas).

test.beforeEach(async ({ page }) => skipTour(page))

test('galería de muestras: 6 obras con portada; abrir una crea un proyecto editable de 30+ páginas que persiste', async ({ page }) => {
  test.setTimeout(180_000)
  await gotoHome(page)
  const gallery = page.getByTestId('muestras')
  await expect(gallery.getByRole('button', { name: /^Abrir la muestra/ })).toHaveCount(6)
  await expect(gallery.locator('img')).toHaveCount(6, { timeout: 20_000 })
  await gallery.getByRole('button', { name: /Abrir la muestra LA CARTERA DE LA LUNA/ }).click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible({ timeout: 150_000 })
  const info = await inApp<{ pages: number; panels: number; withImage: number; bubbles: number; assets: number; kind: string }>(
    page,
    `const els = s.project.pages.flatMap((p) => p.elements); return { pages: s.project.pages.length, panels: els.filter((e) => e.type === 'panel').length, withImage: els.filter((e) => e.type === 'panel' && e.image).length, bubbles: els.filter((e) => e.type === 'bubble').length, assets: s.project.assets.length, kind: s.project.kind }`,
  )
  expect(info.pages).toBeGreaterThanOrEqual(31)
  expect(info.withImage).toBe(info.panels)
  expect(info.bubbles).toBeGreaterThan(40)
  expect(info.kind).toBe('webtoon')
  // Es un proyecto normal: se edita, se guarda y vuelve igual.
  await inApp(page, `s.setPage(s.project.pages[2].id); const b = m.store.currentPage().elements.find((e) => e.type === 'bubble'); s.updateElement(b.id, { text: 'Editado' })`)
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { timeout: 10_000 }).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await inApp<boolean>(page, `return s.project.pages[2].elements.some((e) => e.type === 'bubble' && e.text === 'Editado')`)).toBe(true)
})
