import { expect, test, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp } from './helpers'

const touch = { isMobile: true, hasTouch: true }
const VIEWPORTS = [
  { name: '320×568', viewport: { width: 320, height: 568 }, simple: true },
  { name: '360×800', viewport: { width: 360, height: 800 }, simple: true },
  { name: '390×844', viewport: { width: 390, height: 844 }, simple: true },
  { name: '430×932', viewport: { width: 430, height: 932 }, simple: true },
  { name: '844×390 horizontal', viewport: { width: 844, height: 390 }, simple: false },
  { name: '768×1024', viewport: { width: 768, height: 1024 }, simple: false },
  { name: '820×1180', viewport: { width: 820, height: 1180 }, simple: false },
]

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const seenTour = (page: Page) => page.addInitScript(() => localStorage.setItem('vineta:tour-done', '1'))
const noTips = (page: Page) => page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
async function openNew(page: Page, title = 'Móvil', pages = 3) {
  await gotoHome(page)
  const id = await createProjectInDb(page, title, 'comic', pages)
  await page.goto(`/#/p/${id}`)
  await expect(page.getByRole('button', { name: /Volver a mis proyectos/ }).first()).toBeVisible()
  return id
}

for (const v of VIEWPORTS) {
  test.describe(`viewport ${v.name}`, () => {
    test.use({ viewport: v.viewport, ...touch })
    test('sin scroll horizontal, acciones críticas visibles sin hover y modo por defecto', async ({ page }) => {
      await seenTour(page)
      await noTips(page)
      expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false)
      await gotoHome(page)
      await createProjectInDb(page, 'Tarjeta', 'comic', 2)
      await page.reload()
      expect(await overflow(page)).toBeLessThanOrEqual(0)
      // Menú "⋯" del proyecto visible en touch (A13).
      const opts = page.locator('main article').first().getByRole('button', { name: 'Opciones' })
      await opts.scrollIntoViewIfNeeded()
      expect(await opts.evaluate((b) => getComputedStyle(b.parentElement!.parentElement!).opacity)).toBe('1')
      await page.locator('main article').first().locator('button').first().click()
      await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', v.simple ? 'simple' : 'studio')
      expect(await overflow(page)).toBeLessThanOrEqual(0)
      // Panel de páginas: mover, duplicar y eliminar visibles sin hover.
      if (v.simple) await page.getByTestId('selector-pagina').getByRole('button', { name: /^Páginas:/ }).click()
      else if (v.viewport.width < 1024) await page.getByRole('navigation', { name: 'Paneles' }).getByRole('button', { name: 'Páginas' }).click()
      const del = page.getByRole('button', { name: 'Eliminar página' }).first()
      await expect(del).toBeVisible()
      expect(await del.evaluate((b) => getComputedStyle(b.parentElement!).opacity)).toBe('1')
      expect(await overflow(page)).toBeLessThanOrEqual(0)
    })
  })
}

test.describe('modo simple en 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 }, ...touch })

  test('objetivos táctiles de al menos 44×44 en barras y acciones', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page)
    await inApp(page, 's.select([s.project.pages[0].elements[0].id])')
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('header button, nav[aria-label="Herramientas"] button, [role=toolbar] button')]
        .map((b) => ({ name: b.getAttribute('aria-label') || (b as HTMLElement).innerText, r: b.getBoundingClientRect() }))
        .filter((x) => x.r.width > 0 && (x.r.width < 44 || x.r.height < 44))
        .map((x) => `${x.name} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`),
    )
    expect(small).toEqual([])
  })

  test('el modo elegido se recuerda en el dispositivo', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page)
    await page.getByRole('button', { name: 'Más opciones del proyecto' }).click()
    await page.getByRole('button', { name: /Modo estudio/ }).click()
    await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', 'studio')
    await page.reload()
    await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', 'studio')
    await page.getByRole('button', { name: 'Exportar' }).click()
    await page.getByRole('button', { name: /Modo simple/ }).click()
    await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', 'simple')
  })

  test('título completo legible y editable', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page, 'Las aventuras del gato que viajaba en colectivo')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveText('Las aventuras del gato que viajaba en colectivo')
    expect(await h1.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 || getComputedStyle(el).webkitLineClamp === '2')).toBe(true)
    await page.getByRole('button', { name: /Título: Las aventuras/ }).click()
    await page.getByRole('textbox', { name: 'Título del proyecto' }).fill('Gato viajero')
    await page.keyboard.press('Enter')
    await expect(h1).toHaveText('Gato viajero')
  })

  test('microayudas: aparecen una vez, se cierran, se apagan y se reinician desde Ayuda; sin tour rígido', async ({ page }) => {
    await openNew(page)
    await page.waitForTimeout(1200)
    await expect(page.locator('[role=dialog][aria-modal=true]')).toHaveCount(0) // el tour de 11 pasos no aparece en modo simple
    const bar = page.getByRole('navigation', { name: 'Herramientas' })
    await bar.getByRole('button', { name: 'Viñeta' }).click()
    const tip = page.locator('[data-tip="grupo-design"]')
    await expect(tip).toBeVisible()
    await tip.getByRole('button', { name: 'Entendido' }).click()
    await expect(tip).toHaveCount(0)
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await bar.getByRole('button', { name: 'Viñeta' }).click()
    await expect(tip).toHaveCount(0)
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await bar.getByRole('button', { name: 'Más herramientas' }).click()
    await page.getByRole('dialog', { name: 'Más herramientas' }).getByRole('button', { name: /^Capas/ }).click()
    await page.locator('[data-tip="grupo-layers"]').getByRole('button', { name: 'No volver a mostrar ayudas' }).click()
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await bar.getByRole('button', { name: 'Más herramientas' }).click()
    await page.getByRole('dialog', { name: 'Más herramientas' }).getByRole('button', { name: /^Páginas/ }).click()
    await expect(page.locator('[data-tip]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await page.getByRole('button', { name: 'Más opciones del proyecto' }).click()
    await page.getByRole('button', { name: 'Ayuda' }).click()
    await page.getByRole('button', { name: 'Volver a mostrar las ayudas' }).click()
    await bar.getByRole('button', { name: 'Viñeta' }).click()
    await expect(tip).toBeVisible()
  })

  test('los avisos quedan sobre la barra inferior y se pueden cerrar', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page)
    await inApp(page, `s.toast('Prueba de aviso', 'error')`)
    const toast = page.getByRole('alert').filter({ hasText: 'Prueba de aviso' })
    await expect(toast).toBeVisible()
    const t = (await toast.boundingBox())!
    const nav = (await page.getByRole('navigation', { name: 'Herramientas' }).boundingBox())!
    expect(t.y + t.height).toBeLessThan(nav.y)
    await toast.getByRole('button', { name: 'Cerrar aviso' }).click()
    await expect(toast).toHaveCount(0)
  })

  test('girar el teléfono conserva selección y escala', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page)
    const id = await inApp<string>(page, 'const id = s.project.pages[0].elements[0].id; s.select([id]); return id')
    const zoom = await inApp<number>(page, 'return s.zoom')
    await page.setViewportSize({ width: 844, height: 390 })
    await page.waitForTimeout(500)
    expect(await inApp<string[]>(page, 'return s.selection')).toEqual([id])
    expect(await inApp<number>(page, 'return s.zoom')).toBeCloseTo(zoom, 5)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(500)
    expect(await inApp<string[]>(page, 'return s.selection')).toEqual([id])
  })

  test('el segundo dedo de un pellizco no selecciona lo que toca', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await openNew(page)
    await inApp(page, 's.select([])')
    const target = await inApp<string>(page, 'return s.project.pages[0].elements[0].id')
    const pt = await page.evaluate(async (id) => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
      const K = (await import(/* @vite-ignore */ url)).default
      const st = [...K.stages].reverse().find((x: { container(): Element }) => document.querySelector('[data-tour=canvas]')?.contains(x.container())) ?? K.stages[K.stages.length - 1]
      const r = st.findOne('#' + id).getClientRect()
      const b = st.container().getBoundingClientRect()
      return { x: b.left + r.x + r.width / 2, y: b.top + r.y + r.height / 2, empty: { x: b.left + 8, y: b.top + 8 } }
    }, target)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...pt.empty, id: 1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...pt.empty, id: 1 }, { x: pt.x, y: pt.y, id: 2 }] })
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pt.empty.x, y: pt.empty.y, id: 1 }, { x: pt.x + i * 10, y: pt.y + i * 10, id: 2 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(300)
    expect(await inApp<string[]>(page, 'return s.selection')).toEqual([])
  })
})

