import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createProjectInDb, FIXTURES, gotoHome, inApp, openProject, openView, skipTour, exportPreset } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
})

const projectInfo = (page: Page) => inApp<{ kind: string; format: string; dir: string; pages: number; panels: number }>(page, `return { kind: s.project.kind, format: s.project.format.id, dir: s.project.readingDirection, pages: s.project.pages.length, panels: s.project.pages.flatMap(p => p.elements).filter(e => e.type === 'panel').length }`)

const KINDS = [
  { name: 'Cómic', kind: 'comic', format: 'us-comic', dir: 'ltr' },
  { name: 'Manga', kind: 'manga', format: 'manga-tankobon', dir: 'rtl' },
  { name: 'Tira', kind: 'libre', format: 'strip', dir: 'ltr' },
  { name: 'Webtoon', kind: 'webtoon', format: 'webtoon', dir: 'vertical' },
]

for (const k of KINDS) {
  test(`proyecto guiado y rápido: ${k.name}`, async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
    await page.getByRole('radio', { name: new RegExp(`^${k.name}`) }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByRole('radio', { name: /Con plantilla/ }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByRole('textbox', { name: 'Título' }).fill(`Guiado ${k.name}`)
    await page.getByRole('button', { name: 'Crear proyecto' }).click()
    await expect(page.locator('[data-ui-mode]')).toBeVisible()
    expect(await projectInfo(page)).toMatchObject({ kind: k.kind, format: k.format, dir: k.dir })
    expect((await projectInfo(page)).panels).toBeGreaterThan(0)
    // Crear rápido: un clic desde el paso 1, con los valores recomendados (y la última opción recordada).
    await page.getByTitle('Volver a mis proyectos').first().click()
    await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
    await expect(page.getByRole('radio', { name: new RegExp(`^${k.name}`) })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: 'Crear rápido' }).click()
    await expect(page.locator('[data-ui-mode]')).toBeVisible()
    expect(await projectInfo(page)).toMatchObject({ kind: k.kind, format: k.format, dir: k.dir })
  })
}

test('empezar en blanco y con ejemplo editable', async ({ page }) => {
  await gotoHome(page)
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('radio', { name: /En blanco/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Crear proyecto' }).click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await inApp<number>(page, `return s.project.pages.slice(1).flatMap(p => p.elements).length`)).toBe(0)
  await page.getByTitle('Volver a mis proyectos').first().click()
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('radio', { name: /^Cómic/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('radio', { name: /Ejemplo editable/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Crear proyecto' }).click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  const ex = await inApp<{ bubbles: number; script: number }>(page, `return { bubbles: s.project.pages.flatMap(p => p.elements).filter(e => e.type === 'bubble').length, script: Object.values(s.project.script?.pages ?? {}).flatMap(p => p.panels).flatMap(r => r.blocks).length }`)
  expect(ex.bubbles).toBeGreaterThan(0)
  expect(ex.script).toBeGreaterThan(3)
})

test('plantillas: aplicar con y sin contenido, página nueva y filtros', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Plantillas', 'comic', 2)
  await openProject(page, id)
  await inApp(page, 's.setPage(s.project.pages[1].id)')
  await page.getByRole('tab', { name: 'Viñetas' }).click()
  await page.getByRole('textbox', { name: 'Buscar plantilla' }).fill('tira')
  await expect(page.locator('[data-template^="strip"]')).toHaveCount(0) // las tiras horizontales no son para una página vertical…
  await expect(page.locator('[data-template="manga-4koma"]')).toHaveCount(1) // (la yonkoma sí: es una tira vertical)
  await page.getByRole('button', { name: 'Para este formato' }).click()
  await expect(page.locator('[data-template^="strip"]')).toHaveCount(2) // …pero aparecen sin ese filtro
  await page.getByRole('textbox', { name: 'Buscar plantilla' }).fill('')
  await page.getByRole('button', { name: 'Para este formato' }).click()
  // Con contenido: pide confirmar.
  await page.locator('[data-template="grid-2x2"]').click()
  await expect(page.getByRole('dialog', { name: 'Reemplazar viñetas' })).toBeVisible()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  expect(await inApp<number>(page, `return s.project.pages[1].elements.filter(e => e.type === 'panel').length`)).toBe(4)
  // Sin contenido: aplica directo.
  await inApp(page, `s.mutate(d => void (d.pages[1].elements = []))`)
  await page.locator('[data-template="splash"]').click()
  await expect(page.getByRole('dialog', { name: 'Reemplazar viñetas' })).toHaveCount(0)
  expect(await inApp<number>(page, `return s.project.pages[1].elements.length`)).toBe(1)
  // Como página nueva.
  await page.getByRole('radio', { name: 'Página nueva' }).or(page.getByRole('button', { name: 'Página nueva' })).first().click()
  await page.locator('[data-template="hero-top"]').click()
  expect(await inApp<number>(page, `return s.project.pages.length`)).toBe(3)
  expect(await inApp<number>(page, `return s.project.pages.findIndex(p => p.id === s.pageId)`)).toBe(2)
})

test('plantilla propia: guardar, borrar el proyecto original y reutilizarla con su imagen', async ({ page }) => {
  await gotoHome(page)
  const a = await createProjectInDb(page, 'Origen plantilla', 'comic', 2)
  await openProject(page, a)
  await inApp(page, 's.setPage(s.project.pages[1].id)')
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.locator('input[type=file][accept="image/*"]').setInputFiles(FIXTURES + 'foto-a.png')
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
  await inApp(page, `const pan = s.project.pages[1].elements.find(e => e.type === 'panel'); m.placement.fillPanel(pan.id, s.project.assets[0])`)
  await page.getByRole('tab', { name: 'Viñetas' }).click()
  await page.getByRole('button', { name: 'Guardar esta página como plantilla' }).click()
  await page.getByRole('textbox', { name: 'Nombre de la plantilla' }).fill('Mi escena')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Usar mi plantilla Mi escena' })).toBeVisible()
  await page.getByTitle('Volver a mis proyectos').first().click()
  await inApp(page, `const p = await m.storage.loadProject(arg); await m.storage.deleteProject(p)`, a)
  const b = await createProjectInDb(page, 'Destino plantilla', 'manga', 1)
  await openProject(page, b)
  await page.getByRole('tab', { name: 'Viñetas' }).click()
  await page.getByRole('button', { name: 'Página nueva' }).click()
  await page.getByRole('button', { name: 'Usar mi plantilla Mi escena' }).click()
  // Aplicar copia las imágenes de la plantilla: es asincrónico.
  await expect.poll(() => inApp<number>(page, 'return s.project.pages.length')).toBe(2)
  const r = await inApp<{ pages: number; ok: boolean }>(
    page,
    `const pg = s.project.pages.find(p => p.id === s.pageId); const pan = pg.elements.find(e => e.type === 'panel' && e.image)
     const img = pan ? await m.assets.loadAssetImage(pan.image.assetId) : null
     return { pages: s.project.pages.length, ok: !!img && img.naturalWidth > 0 && s.project.assets.some(a => a.id === pan.image.assetId) }`,
  )
  expect(r).toEqual({ pages: 2, ok: true })
})

test('duplicar página con imágenes y exportar/importar el proyecto', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Duplicar', 'comic', 2)
  await openProject(page, id)
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.locator('input[type=file][accept="image/*"]').setInputFiles(FIXTURES + 'foto-b.png')
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
  await inApp(page, `s.setPage(s.project.pages[1].id); const pan = s.project.pages[1].elements.find(e => e.type === 'panel'); m.placement.fillPanel(pan.id, s.project.assets[0]); m.store.useEditor.getState().duplicatePage(s.project.pages[1].id)`)
  const dl = await exportPreset(page, /Archivo editable/)
  const file = JSON.parse(readFileSync((await dl.path())!, 'utf8'))
  expect(file.project.pages).toHaveLength(3)
  const ok = await inApp<boolean>(page, `const p = await m.storage.importProjectFile(new File([JSON.stringify(arg)], 'd.vineta')); const refs = p.pages.flatMap(pg => pg.elements).filter(e => e.type === 'panel' && e.image).map(e => e.image.assetId); return refs.length === 2 && refs.every(r => p.assets.some(a => a.id === r))`, file)
  expect(ok).toBe(true)
})

test('guion: colocar diálogo y SFX, divergencia, reordenar páginas, deshacer y recargar', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Guion', 'comic', 3)
  await openProject(page, id)
  await inApp(page, 's.setPage(s.project.pages[1].id)')
  await page.getByRole('tab', { name: 'Guion' }).click()
  const guion = page.getByTestId('guion')
  const vin1 = guion.getByRole('region', { name: 'Viñeta 1' })
  await vin1.getByRole('button', { name: '+ Agregar' }).click()
  await page.getByRole('button', { name: 'Diálogo', exact: true }).click()
  await vin1.getByRole('textbox', { name: 'Texto: Diálogo' }).fill('¡Hola, mundo!')
  await vin1.getByRole('button', { name: '+ Agregar' }).click()
  await page.getByRole('button', { name: 'SFX', exact: true }).click()
  await vin1.getByRole('textbox', { name: 'Texto: SFX' }).fill('¡PUM!')
  await vin1.getByRole('button', { name: 'Colocar' }).first().click()
  await vin1.getByRole('button', { name: 'Colocar' }).first().click()
  await expect(vin1.getByText('Colocado')).toHaveCount(2)
  const texts = () => inApp<string[]>(page, `return s.project.pages.flatMap(p => p.elements).filter(e => e.type === 'bubble' || e.type === 'text').map(e => e.text).filter(t => t === '¡Hola, mundo!' || t === '¡PUM!').sort()`)
  expect(await texts()).toEqual(['¡Hola, mundo!', '¡PUM!'])
  // Divergencia: se edita el globo en la página.
  await inApp(page, `const b = s.project.pages[1].elements.find(e => e.text === '¡Hola, mundo!'); s.updateElement(b.id, { text: '¡Hola, gente!' })`)
  await expect(vin1.getByText('Modificado')).toBeVisible()
  await vin1.getByRole('button', { name: 'Usar el de la página' }).click()
  await expect(vin1.getByRole('textbox', { name: 'Texto: Diálogo' })).toHaveValue('¡Hola, gente!')
  // Reordenar páginas: el guion sigue a su página.
  const pageId = await inApp<string>(page, 'return s.pageId')
  await inApp(page, 's.movePage(1, 0)')
  expect(await inApp<string>(page, 'return s.project.pages[0].id')).toBe(pageId)
  await expect(vin1.getByRole('textbox', { name: 'Texto: Diálogo' })).toHaveValue('¡Hola, gente!')
  // Deshacer el reordenado y recargar.
  await page.locator('body').click({ position: { x: 5, y: 450 } })
  await page.keyboard.press('Control+z')
  await expect.poll(() => inApp<string>(page, 'return s.saveStatus')).toBe('saved')
  await page.reload()
  await openProject(page, id)
  const persisted = await inApp<string[]>(page, `return (s.project.script?.pages[arg]?.panels ?? []).flatMap(r => r.blocks.map(b => b.text))`, pageId)
  expect(persisted.sort()).toEqual(['¡Hola, gente!', '¡PUM!'])
  expect(await inApp<string>(page, 'return s.project.pages[1].id')).toBe(pageId)
})

test.describe('celular sin modo estudio', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('primera página completa desde cero en modo simple', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: /Empezar un proyecto|Nuevo proyecto/ }).first().tap()
    await page.getByRole('button', { name: 'Siguiente' }).tap()
    await page.getByRole('radio', { name: /En blanco/ }).tap()
    await page.getByRole('button', { name: 'Siguiente' }).tap()
    await page.getByRole('button', { name: 'Crear proyecto' }).tap()
    await expect(page.locator('[data-ui-mode=simple]')).toBeVisible()
    await inApp(page, 's.setPage(s.project.pages[1].id)')
    // Diseñar: plantilla.
    await page.getByRole('navigation', { name: 'Herramientas' }).getByRole('button', { name: 'Diseñar' }).tap()
    await page.locator('[data-template="grid-2x2"]').tap()
    await expect.poll(() => inApp<number>(page, 'return s.project.pages[1].elements.filter(e => e.type === "panel").length')).toBe(4)
    // Foto en la primera viñeta.
    await inApp(page, 's.select([s.project.pages[1].elements.find(e => e.type === "panel").id])')
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Poner foto' }).tap()])
    await chooser.setFiles(FIXTURES + 'foto-a.png')
    await expect.poll(() => inApp<boolean>(page, 'return !!s.project.pages[1].elements.find(e => e.type === "panel").image')).toBe(true)
    // Globo escrito con el botón +.
    await inApp(page, 's.select([])')
    await page.getByRole('button', { name: 'Agregar contenido' }).tap()
    await page.getByRole('button', { name: /^Globo/ }).tap()
    await expect(page.locator('textarea')).toBeFocused()
    await page.keyboard.press('Control+a')
    await page.keyboard.type('Mi primera página')
    await page.locator('textarea').evaluate((t) => (t as HTMLTextAreaElement).blur())
    await expect.poll(() => inApp<string[]>(page, 'return s.project.pages[1].elements.filter(e => e.type === "bubble").map(e => e.text)')).toEqual(['Mi primera página'])
    expect(await page.locator('[data-ui-mode]').getAttribute('data-ui-mode')).toBe('simple')
    await openView(page, 'Previsualizar')
    await expect(page.getByTestId('previsualizacion')).toBeVisible()
  })
})
