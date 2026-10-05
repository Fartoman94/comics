import { expect, test } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Muestras · Fase 1: mejoras del editor detectadas al auditar la producción de obras largas.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

test('guion: "Colocar todo" pone cada bloque en su viñeta con el globo ajustado al texto', async ({ page }) => {
  const id = await createProjectInDb(page, 'Guion largo', 'comic', 2)
  await openProject(page, id)
  await inApp(
    page,
    `const pg = s.project.pages[1]; s.setPage(pg.id);
     const [p1, p2] = pg.elements.filter((e) => e.type === 'panel');
     const st = m.store.useEditor.getState();
     st.addScriptBlock(pg.id, p1.id, 'dialogue', '¡No puede ser! La central entera se quedó a oscuras otra vez.');
     st.addScriptBlock(pg.id, p1.id, 'caption', 'Puerto Faro, 23:58.');
     st.addScriptBlock(pg.id, p2.id, 'sfx', 'ZZZAP');
     st.addScriptBlock(pg.id, p2.id, 'description', 'Plano general: la ciudad sin luz.');`,
  )
  await page.getByRole('tab', { name: 'Guion' }).click()
  await page.getByRole('button', { name: 'Colocar todo (3)' }).click()
  const els = await inApp<{ type: string; text?: string; cx: number; cy: number; w: number; h: number }[]>(page, `return m.store.currentPage().elements.filter((e) => e.type !== 'panel').map((e) => ({ type: e.type, text: e.text, cx: e.x + e.width / 2, cy: e.y + e.height / 2, w: e.width, h: e.height }))`)
  expect(els.map((e) => e.type).sort()).toEqual(['bubble', 'bubble', 'text'])
  const panels = await inApp<{ x: number; y: number; width: number; height: number }[]>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'panel').slice(0, 2)`)
  const inside = (e: { cx: number; cy: number }, p: { x: number; y: number; width: number; height: number }) => e.cx >= p.x && e.cx <= p.x + p.width && e.cy >= p.y && e.cy <= p.y + p.height
  const long = els.find((e) => e.text?.startsWith('¡No puede ser!'))!
  expect(inside(long, panels[0])).toBe(true)
  expect(inside(els.find((e) => e.text === 'ZZZAP')!, panels[1])).toBe(true)
  // El globo del texto largo se agrandó para que el texto entre (más ancho que el por defecto).
  expect(long.w).toBeGreaterThan(280)
  await expect(page.getByRole('button', { name: /Colocar todo/ })).toHaveCount(0)
})

test('"Ajustar globo al texto" achica un globo con poco texto y agranda uno con mucho', async ({ page }) => {
  const id = await createProjectInDb(page, 'Ajustar', 'libre', 1)
  await openProject(page, id)
  const b = await inApp<string>(page, `const b = m.factories.createBubble('speech', 100, 100); b.text = '¿Eh?'; m.store.useEditor.getState().addElements([b]); return b.id`)
  const w0 = await inApp<number>(page, `return m.store.findEl(arg).width`, b)
  await page.getByRole('complementary', { name: 'Propiedades' }).getByRole('button', { name: 'Ajustar globo al texto' }).click()
  const small = await inApp<{ width: number; height: number }>(page, `return m.store.findEl(arg)`, b)
  expect(small.width).toBeLessThan(w0)
  await inApp(page, `s.updateElement(arg, { text: 'Esto es un texto bastante más largo, de esos que en un globo por defecto quedarían cortados o apretados.' })`, b)
  await page.getByRole('complementary', { name: 'Propiedades' }).getByRole('button', { name: 'Ajustar globo al texto' }).click()
  const big = await inApp<{ width: number; height: number }>(page, `return m.store.findEl(arg)`, b)
  expect(big.width * big.height).toBeGreaterThan(small.width * small.height * 3)
})

test('plantilla "Portada": imagen a página completa, título, bajada y autor, en página nueva', async ({ page }) => {
  const id = await createProjectInDb(page, 'Voltaje', 'comic', 2)
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Plantillas' }).click()
  await page.locator('[data-starter="portada"]').click()
  await page.getByRole('dialog', { name: 'Portada' }).getByRole('button', { name: 'En página nueva' }).click()
  const els = await inApp<{ type: string; name: string; text?: string }[]>(page, `return m.store.currentPage().elements.map((e) => ({ type: e.type, name: e.name, text: e.text }))`)
  expect(els.map((e) => e.name)).toEqual(['Imagen de portada', 'Título', 'Bajada', 'Autor/a'])
  expect(els[1].text).toBe('VOLTAJE')
  expect(await inApp<number>(page, `return s.project.pages.length`)).toBe(3)
})
