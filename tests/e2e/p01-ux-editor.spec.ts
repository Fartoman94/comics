import { expect, test } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 01 · Reestructuración UX: estado vacío, contexto de edición, panel contextual y sidebar.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

async function openEmptyPage(page: import('@playwright/test').Page) {
  const id = await createProjectInDb(page, 'UX vacía', 'libre', 1)
  await openProject(page, id)
  await inApp(page, `s.addPage()`)
  await expect(page.getByTestId('pagina-vacia')).toBeVisible()
}

test('página vacía: "Empezá tu primera página" crea viñetas editables y se deshace en un paso', async ({ page }) => {
  await openEmptyPage(page)
  await expect(page.getByRole('heading', { name: 'Empezá tu primera página' })).toBeVisible()
  for (const label of ['1 viñeta', '2 verticales', '2 horizontales', '3 viñetas', '4 clásico', '6 clásico', 'Página libre']) {
    await expect(page.getByTestId('pagina-vacia').getByRole('button', { name: label })).toBeVisible()
  }
  await page.getByTestId('pagina-vacia').getByRole('button', { name: '4 clásico' }).click()
  await expect(page.getByTestId('pagina-vacia')).toHaveCount(0)
  expect(await inApp<string[]>(page, `return m.store.currentPage().elements.map((e) => e.type)`)).toEqual(['panel', 'panel', 'panel', 'panel'])
  await page.keyboard.press('Control+z')
  await expect(page.getByTestId('pagina-vacia')).toBeVisible()
})

test('página libre: activa la herramienta Viñeta y no vuelve a ofrecer el estado vacío', async ({ page }) => {
  await openEmptyPage(page)
  await page.getByTestId('pagina-vacia').getByRole('button', { name: 'Página libre' }).click()
  expect(await inApp<string>(page, `return m.store.useEditor.getState().tool`)).toBe('panel')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('pagina-vacia')).toHaveCount(0)
})

test('contexto: Página › Viñeta › Globo y el panel contextual cambia según la selección', async ({ page }) => {
  const id = await createProjectInDb(page, 'UX contexto', 'comic', 2)
  await openProject(page, id)
  const ids = await inApp<{ panel: string; bubble: string }>(
    page,
    `const pg = s.project.pages[1]; s.setPage(pg.id);
     const panel = pg.elements.find((e) => e.type === 'panel');
     const b = m.factories.createBubble('speech', panel.x + 20, panel.y + 20, 0.5);
     m.store.useEditor.getState().addElements([b]);
     return { panel: panel.id, bubble: b.id }`,
  )
  const ctx = page.getByTestId('contexto-edicion')
  await expect(ctx.getByRole('navigation')).toHaveText(/Página 2.*Globo/)
  await expect(ctx.getByRole('button', { name: 'Viñeta 1' })).toBeVisible()
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await expect(inspector.getByRole('heading', { name: 'Globo' })).toBeVisible()

  await ctx.getByRole('button', { name: 'Viñeta 1' }).click()
  expect(await inApp<string[]>(page, `return m.store.useEditor.getState().selection`)).toEqual([ids.panel])
  for (const title of ['Imagen', 'Fondo y borde', 'Forma', 'Dividir']) await expect(inspector.getByRole('heading', { name: title, exact: true })).toBeVisible()

  await ctx.getByRole('button', { name: 'Página 2' }).click()
  await expect(inspector.getByRole('heading', { name: 'Página', exact: true })).toBeVisible()
})

test('viñeta: forma, dividir (horizontal, vertical, diagonal) y eliminar con contenido pide confirmación', async ({ page }) => {
  const id = await createProjectInDb(page, 'UX dividir', 'comic', 2)
  await openProject(page, id)
  const panelId = await inApp<string>(page, `const pg = s.project.pages[1]; s.setPage(pg.id); const p = pg.elements.find((e) => e.type === 'panel'); m.store.useEditor.getState().select([p.id]); return p.id`)
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  const count = () => inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'panel').length`)
  const before = await count()

  await inspector.getByRole('radio', { name: 'Redondeada' }).click()
  expect(await inApp<number>(page, `return m.store.findEl(arg).cornerRadius`, panelId)).toBeGreaterThan(0)
  await expect(inspector.getByRole('radio', { name: 'Redondeada' })).toHaveAttribute('aria-checked', 'true')
  await inspector.getByRole('radio', { name: 'Recta' }).click()

  await inspector.getByRole('button', { name: /Horiz/ }).click()
  expect(await count()).toBe(before + 1)
  await inspector.getByRole('button', { name: /Vert/ }).click()
  expect(await count()).toBe(before + 2)
  await inspector.getByRole('button', { name: /Diag/ }).click()
  expect(await count()).toBe(before + 3)
  expect(await inApp<boolean>(page, `return Array.isArray(m.store.findEl(arg).points)`, panelId)).toBe(true)

  // Un globo encima de la viñeta: eliminarla pregunta antes (y cancelar no borra nada).
  await inApp(page, `const p = m.store.findEl(arg); const b = m.factories.createBubble('speech', p.x + 4, p.y + 4, 0.2); m.store.useEditor.getState().addElements([b], { select: false }); m.store.useEditor.getState().select([p.id])`, panelId)
  await page.keyboard.press('Delete')
  const dialog = page.getByRole('dialog', { name: 'Eliminar viñeta' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  expect(await inApp<boolean>(page, `return !!m.store.findEl(arg)`, panelId)).toBe(true)
  await page.keyboard.press('Delete')
  await page.getByRole('dialog', { name: 'Eliminar viñeta' }).getByRole('button', { name: 'Eliminar' }).click()
  expect(await inApp<boolean>(page, `return !!m.store.findEl(arg)`, panelId)).toBe(false)
  // El globo queda en la página.
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').length`)).toBe(1)
})

test('sidebar: Páginas, Plantillas, Elementos, Biblioteca, Capas y Guion abren su contenido sin errores', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const id = await createProjectInDb(page, 'UX pestañas', 'comic', 2)
  await openProject(page, id)
  const tabs = page.getByRole('tablist')
  for (const name of ['Plantillas', 'Elementos', 'Biblioteca', 'Capas', 'Guion', 'Páginas']) {
    await tabs.getByRole('tab', { name }).click()
    await expect(tabs.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.getByRole('tab', { name })).toHaveAttribute('title', /.+/)
  }
  // Ningún botón del lienzo/sidebars visible sin nombre accesible.
  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent?.trim() || b.title)).length,
  )
  expect(unnamed).toBe(0)
  expect(errors).toEqual([])
})

test('imagen libre: girar 90°, rellenar y quitar recorte desde el panel contextual', async ({ page }) => {
  const id = await createProjectInDb(page, 'UX imagen', 'libre', 1)
  await openProject(page, id)
  const elId = await inApp<string>(
    page,
    `const a = { id: 'as_ux', name: 'foto', width: 400, height: 200, mime: 'image/png', createdAt: 0 };
     s.addAsset(a);
     const img = m.factories.createImage('as_ux', 50, 50, 300, 300);
     m.store.useEditor.getState().addElements([img]);
     return img.id`,
  )
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  await inspector.getByRole('button', { name: 'Girar 90° a la derecha' }).click()
  expect(await inApp<number>(page, `return m.store.findEl(arg).rotation`, elId)).toBe(90)
  await inspector.getByRole('button', { name: 'Girar 90° a la izquierda' }).click()
  await inspector.getByRole('button', { name: 'Girar 90° a la izquierda' }).click()
  expect(await inApp<number>(page, `return m.store.findEl(arg).rotation`, elId)).toBe(-90)
  await inspector.getByRole('button', { name: 'Rellenar' }).click()
  expect(await inApp<unknown>(page, `return m.store.findEl(arg).crop`, elId)).toEqual({ x: 100, y: 0, width: 200, height: 200 })
  await inspector.getByRole('button', { name: 'Quitar recorte' }).click()
  expect(await inApp<unknown>(page, `return m.store.findEl(arg).crop`, elId)).toBeNull()
})
