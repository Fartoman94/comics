import { expect, test, type Page } from '@playwright/test'
import { FIXTURES, gotoHome, inApp } from './helpers'

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const seenTour = (page: Page) => page.addInitScript(() => localStorage.setItem('vineta:tour-done', '1'))
const noTips = (page: Page) => page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))

// Evidencia del flujo móvil: video y trace de Playwright quedan en test-results/.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, video: 'on', trace: 'on' })

test.describe('flujo completo sólo con el dedo (390×844)', () => {
  test('crear, imagen en viñeta, globo, deshacer, reordenar y exportar', async ({ page }) => {
    await seenTour(page)
    await noTips(page)
    await gotoHome(page)
    await page.getByRole('button', { name: /Empezar un proyecto|Nuevo proyecto/ }).first().tap()
    await page.getByRole('button', { name: 'Siguiente' }).tap()
    await page.getByRole('button', { name: 'Siguiente' }).tap()
    await page.getByRole('textbox', { name: 'Título' }).fill('Hecho en el celular')
    await page.getByRole('button', { name: 'Crear proyecto' }).tap()
    await expect(page.locator('[data-ui-mode=simple]')).toBeVisible()
    // Imagen dentro de una viñeta: seleccionar la viñeta con un toque y elegir la foto.
    await inApp(page, `s.setPage(s.project.pages[1].id)`)
    await page.waitForTimeout(500)
    const panel = await inApp<string>(page, 'return s.project.pages[1].elements.find(e => e.type === "panel").id')
    const p = await page.evaluate(async (id) => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
      const K = (await import(/* @vite-ignore */ url)).default
      const st = [...K.stages].reverse().find((x: { container(): Element }) => document.querySelector('[data-tour=canvas]')?.contains(x.container())) ?? K.stages[K.stages.length - 1]
      const r = st.findOne('#' + id).getClientRect()
      const b = st.container().getBoundingClientRect()
      return { x: b.left + r.x + r.width / 2, y: b.top + r.y + r.height / 2 }
    }, panel)
    await page.touchscreen.tap(p.x, p.y)
    await expect(page.getByRole('toolbar', { name: 'Acciones de lo seleccionado' })).toBeVisible()
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Poner foto' }).tap()])
    await chooser.setFiles(FIXTURES + 'foto-a.png')
    await expect.poll(() => inApp<string | null>(page, `return s.project.pages[1].elements.find(e => e.id === '${panel}').image?.assetId ?? null`)).not.toBeNull()
    // Globo con el botón "+".
    await page.touchscreen.tap(5, 300)
    await inApp(page, 's.select([])')
    await page.getByRole('button', { name: 'Agregar contenido' }).tap()
    await page.getByRole('button', { name: /^Globo/ }).tap()
    await expect(page.locator('textarea')).toBeFocused()
    await page.keyboard.press('Control+a')
    await page.keyboard.type('¡Lo hice con el dedo!')
    await page.locator('textarea').evaluate((t) => (t as HTMLTextAreaElement).blur())
    await expect.poll(() => inApp<string[]>(page, 'return s.project.pages[1].elements.filter(e => e.type === "bubble").map(e => e.text)')).toEqual(['¡Lo hice con el dedo!'])
    // Deshacer y rehacer desde la barra superior.
    await page.getByRole('button', { name: 'Deshacer' }).tap()
    await page.getByRole('button', { name: 'Rehacer' }).tap()
    // Reordenar: la página actual pasa a ser la primera con el botón visible.
    await page.getByRole('navigation', { name: 'Herramientas' }).getByRole('button', { name: 'Páginas' }).tap()
    const pageId = await inApp<string>(page, 'return s.pageId')
    await page.getByRole('button', { name: 'Mover antes' }).nth(1).tap()
    expect(await inApp<string>(page, 'return s.project.pages[0].id')).toBe(pageId)
    await page.getByRole('button', { name: 'Cerrar' }).tap()
    // Exportar PDF desde el menú.
    await page.getByRole('button', { name: 'Más opciones del proyecto' }).tap()
    await page.getByRole('button', { name: /Exportar/ }).tap()
    await page.getByRole('radio', { name: /Pantalla \(PDF liviano\)/ }).tap()
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60_000 }), page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).tap()])
    expect(dl.suggestedFilename()).toMatch(/hecho-en-el-celular-liviano\.pdf$/)
    expect(await overflow(page)).toBeLessThanOrEqual(0)
  })
})
