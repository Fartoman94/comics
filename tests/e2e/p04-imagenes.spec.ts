import { expect, test, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 04 · Imágenes: selector (subir / galería), validación real, imágenes de distintos
// tamaños y proporciones, reemplazo sin perder propiedades, giro/espejo y persistencia.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

/** PNG real de w×h generado en el navegador. */
async function pngBuffer(page: Page, w: number, h: number, color = '#3b82f6') {
  const b64 = await page.evaluate(
    ([w, h, color]) => {
      const c = document.createElement('canvas')
      c.width = w as number
      c.height = h as number
      const ctx = c.getContext('2d')!
      ctx.fillStyle = color as string
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width / 3, c.height / 3)
      return c.toDataURL('image/png').split(',')[1]
    },
    [w, h, color] as const,
  )
  return Buffer.from(b64, 'base64')
}

async function openWithEmptyPanel(page: Page) {
  const id = await createProjectInDb(page, 'Imágenes', 'comic', 2)
  await openProject(page, id)
  return inApp<string>(page, `const pg = s.project.pages[1]; s.setPage(pg.id); const p = pg.elements.find((e) => e.type === 'panel'); m.store.useEditor.getState().select([p.id]); return p.id`)
}

const panelImage = (page: Page, id: string) => inApp<{ assetId: string; x: number; y: number; scale: number; rotation?: number; flipX?: boolean; filters: { grayscale: boolean } } | null>(page, `return m.store.findEl(arg).image`, id)

async function uploadInPicker(page: Page, name: string, buffer: Buffer, mimeType = 'image/png') {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Subir imagen', exact: true }).click()
  await dialog.getByTestId('selector-archivo').setInputFiles({ name, mimeType, buffer })
}

test('viñeta vacía: "Agregar imagen" → subir → queda contenida y llenando el marco', async ({ page }) => {
  const panelId = await openWithEmptyPanel(page)
  await page.getByTestId('agregar-imagen-vineta').click()
  await expect(page.getByRole('dialog', { name: 'Imagen para la viñeta' })).toBeVisible()
  await uploadInPicker(page, 'chica.png', await pngBuffer(page, 40, 30))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const img = (await panelImage(page, panelId))!
  const panel = await inApp<{ width: number; height: number }>(page, `const p = m.store.findEl(arg); return { width: p.width, height: p.height }`, panelId)
  // Cover: la imagen (40×30 escalada) cubre toda la viñeta.
  expect(40 * img.scale).toBeGreaterThanOrEqual(panel.width - 0.5)
  expect(30 * img.scale).toBeGreaterThanOrEqual(panel.height - 0.5)
  expect(img.x).toBeLessThanOrEqual(0)
  expect(img.y).toBeLessThanOrEqual(0)
  await expect(page.getByTestId('agregar-imagen-vineta')).toHaveCount(0)
})

test('imágenes grandes, verticales y horizontales: se reducen a 4096 px y encajan en cover', async ({ page }) => {
  const panelId = await openWithEmptyPanel(page)
  for (const [name, w, h, expectW, expectH] of [
    ['enorme.png', 5000, 2000, 4096, 1638],
    ['vertical.png', 300, 900, 300, 900],
    ['horizontal.png', 900, 300, 900, 300],
  ] as const) {
    await inApp(page, `s.select([arg])`, panelId)
    await page.getByRole('complementary', { name: 'Propiedades' }).getByRole('button', { name: /Subir imagen o foto|Reemplazar/ }).first().click()
    await uploadInPicker(page, name, await pngBuffer(page, w, h))
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 20_000 })
    const img = (await panelImage(page, panelId))!
    const asset = await inApp<{ width: number; height: number }>(page, `return s.project.assets.find((a) => a.id === arg)`, img.assetId)
    expect(asset.width).toBe(expectW)
    expect(Math.abs(asset.height - expectH)).toBeLessThanOrEqual(1)
    const p = await inApp<{ width: number; height: number }>(page, `const p = m.store.findEl(arg); return { width: p.width, height: p.height }`, panelId)
    expect(Math.max(p.width / asset.width, p.height / asset.height)).toBeCloseTo(img.scale, 5)
  }
})

test('archivos inválidos: un .png que no es imagen y un SVG se rechazan con un mensaje claro', async ({ page }) => {
  await openWithEmptyPanel(page)
  await page.getByTestId('agregar-imagen-vineta').click()
  await uploadInPicker(page, 'falsa.png', Buffer.from('esto no es una imagen'))
  await expect(page.getByRole('alert')).toContainText('no es una imagen PNG, JPG, WebP o GIF')
  await page.getByTestId('selector-archivo').setInputFiles({ name: 'dibujo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>') })
  await expect(page.getByRole('alert')).toContainText('SVG')
  expect(await inApp<number>(page, `return s.project.assets.length`)).toBe(0)
})

test('reemplazar desde la galería conserva giro, espejo y filtros; fondos incluidos; todo persiste', async ({ page }) => {
  const panelId = await openWithEmptyPanel(page)
  await page.getByTestId('agregar-imagen-vineta').click()
  await uploadInPicker(page, 'a.png', await pngBuffer(page, 600, 400, '#ef4444'))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const first = (await panelImage(page, panelId))!.assetId
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await inspector.getByRole('button', { name: 'Girar la imagen 90° a la derecha' }).click()
  await inspector.getByRole('button', { name: 'Espejo horizontal de la imagen' }).click()
  await inspector.getByRole('button', { name: 'Manga B/N' }).click()

  // Fondo incluido desde la galería.
  await inspector.getByRole('button', { name: 'Reemplazar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Imagen para la viñeta' })
  await expect(dialog.getByRole('button', { name: 'Elegir de galería' })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Fondo Noche' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const img = (await panelImage(page, panelId))!
  expect(img.assetId).not.toBe(first)
  expect(img).toMatchObject({ rotation: 90, flipX: true, filters: { grayscale: true } })
  expect(await inApp<string>(page, `return s.project.assets.find((a) => a.id === arg).name`, img.assetId)).toBe('Fondo Noche')

  // Volver a la primera desde "Imágenes del proyecto".
  await inspector.getByRole('button', { name: 'Reemplazar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Usar a' }).click()
  expect((await panelImage(page, panelId))!.assetId).toBe(first)

  // Restablecer: sin giro ni espejo.
  await inspector.getByRole('button', { name: 'Restablecer' }).click()
  expect(await panelImage(page, panelId)).toMatchObject({ rotation: 0, flipX: false })
  await inspector.getByRole('button', { name: 'Girar la imagen 90° a la izquierda' }).click()

  await expect.poll(() => inApp<string>(page, `return s.saveStatus`)).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  const after = await inApp<{ rotation?: number; assetId: string }>(page, `return s.project.pages[1].elements.find((e) => e.id === arg).image`, panelId)
  expect(after).toMatchObject({ rotation: 270, assetId: first })
})

test('imagen libre: Reemplazar abre el selector y conserva posición, ancho y giro', async ({ page }) => {
  const id = await createProjectInDb(page, 'Libre', 'libre', 1)
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Biblioteca' }).click()
  await page.locator('input[type=file]').first().setInputFiles({ name: 'uno.png', mimeType: 'image/png', buffer: await pngBuffer(page, 200, 100) })
  await expect.poll(() => inApp<number>(page, `return s.project.assets.length`)).toBe(1)
  const elId = await inApp<string>(page, `const a = s.project.assets[0]; const img = m.factories.createImage(a.id, 100, 120, 300, 150); img.rotation = 15; m.store.useEditor.getState().addElements([img]); return img.id`)
  await page.getByRole('complementary', { name: 'Propiedades' }).getByRole('button', { name: 'Reemplazar' }).click()
  await expect(page.getByRole('dialog', { name: 'Reemplazar imagen' })).toBeVisible()
  await uploadInPicker(page, 'dos.png', await pngBuffer(page, 100, 100, '#22c55e'))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const el = await inApp<{ x: number; y: number; width: number; height: number; rotation: number; assetId: string }>(page, `return m.store.findEl(arg)`, elId)
  expect(el).toMatchObject({ x: 100, y: 120, width: 300, height: 300, rotation: 15 })
})
