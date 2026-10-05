import { readFileSync } from 'node:fs'
import JSZip from 'jszip'
import { expect, test, type Download, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 10 · Exportación: formatos, opciones (páginas, resolución, calidad, transparencia),
// nombres deterministas y validación por píxeles (lo oculto no se exporta, giros y bordes en su lugar).

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

/** Proyecto de 3 páginas; la 2 tiene un cuadrado rojo oculto, un cuadrado azul girado 45° y un globo. */
async function setup(page: Page) {
  const id = await createProjectInDb(page, 'Export P10', 'libre', 3)
  await openProject(page, id)
  await inApp(
    page,
    `const f = m.factories;
     const W = s.project.format.width, H = s.project.format.height;
     const hidden = f.createShape('rect', 100, 100, 200); hidden.fill = '#ff0000'; hidden.strokeWidth = 0; hidden.hidden = true; hidden.width = 200; hidden.height = 200;
     const rot = f.createShape('rect', 500, 500, 200); rot.fill = '#0000ff'; rot.strokeWidth = 0; rot.width = 200; rot.height = 200; rot.rotation = 45;
     const b = f.createBubble('speech', 100, H - 400, 1);
     s.mutate((d) => { d.pages[1].background = '#ffffff'; d.pages[1].elements = [hidden, rot, b] });
     s.setPage(s.project.pages[1].id)`,
  )
  await expect.poll(() => inApp<string>(page, `return s.saveStatus`), { timeout: 8000 }).toBe('saved')
}

async function openExport(page: Page, preset: RegExp) {
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  await page.getByRole('radio', { name: preset }).click()
}
async function runExport(page: Page): Promise<Download> {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90_000 }), page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()])
  await expect(page.getByTestId('exportacion-lista')).toBeVisible()
  return dl
}

/** Lee píxeles del archivo exportado en el navegador. Coordenadas en px de página (se escalan). */
async function pixels(page: Page, bytes: Buffer, mime: string, pts: { x: number; y: number }[], scale = 1) {
  return page.evaluate(
    async ([b64, mime, pts, scale]) => {
      const blob = await (await fetch(`data:${mime};base64,${b64}`)).blob()
      const bmp = await createImageBitmap(blob)
      const c = document.createElement('canvas')
      c.width = bmp.width
      c.height = bmp.height
      const g = c.getContext('2d')!
      g.drawImage(bmp, 0, 0)
      return { w: bmp.width, h: bmp.height, px: (pts as { x: number; y: number }[]).map((p) => [...g.getImageData(Math.round(p.x * (scale as number)), Math.round(p.y * (scale as number)), 1, 1).data]) }
    },
    [bytes.toString('base64'), mime, pts, scale] as const,
  )
}

test('PNG de la página actual ×1: tamaño exacto, lo oculto no sale, el giro queda en su lugar y fondo transparente opcional', async ({ page }) => {
  await setup(page)
  const fmt = await inApp<{ width: number; height: number }>(page, `return s.project.format`)
  await openExport(page, /Esta página en PNG/)
  await page.getByTestId('opciones-exportacion').getByRole('button', { name: /^×1/ }).click()
  const dl = await runExport(page)
  expect(dl.suggestedFilename()).toBe('export-p10-002.png')
  const bytes = readFileSync((await dl.path())!)
  // Konva gira alrededor de la esquina (x, y), igual que el lienzo del editor: el centro del cuadrado
  // de 200 px girado 45° en (500,500) queda en (500, 641).
  // - (200,200): centro del cuadrado OCULTO → blanco.
  // - (500,641) y (560,640): dentro del rombo → azul.
  // - (690,520): dentro del cuadrado si NO estuviera girado, fuera del rombo → blanco.
  const r = await pixels(page, bytes, 'image/png', [{ x: 200, y: 200 }, { x: 500, y: 641 }, { x: 560, y: 640 }, { x: 690, y: 520 }])
  expect([r.w, r.h]).toEqual([fmt.width, fmt.height])
  expect(r.px[0].slice(0, 3)).toEqual([255, 255, 255])
  expect(r.px[1].slice(0, 3)).toEqual([0, 0, 255])
  expect(r.px[2].slice(0, 3)).toEqual([0, 0, 255])
  expect(r.px[3].slice(0, 3)).toEqual([255, 255, 255])

  await page.getByRole('button', { name: 'Listo' }).click()
  await openExport(page, /Esta página en PNG/)
  await page.getByTestId('opciones-exportacion').getByRole('button', { name: /^×1/ }).click()
  await page.getByTestId('opciones-exportacion').getByRole('switch', { name: /Fondo transparente/ }).or(page.getByTestId('opciones-exportacion').getByRole('checkbox', { name: /Fondo transparente/ })).first().click()
  const t = await pixels(page, readFileSync((await (await runExport(page)).path())!), 'image/png', [{ x: 50, y: 50 }, { x: 500, y: 641 }])
  expect(t.px[0][3]).toBe(0)
  expect(t.px[1].slice(0, 4)).toEqual([0, 0, 255, 255])
})

test('JPG de la página actual con resolución ×3 y calidad', async ({ page }) => {
  await setup(page)
  const fmt = await inApp<{ width: number; height: number }>(page, `return s.project.format`)
  await openExport(page, /Esta página en JPG/)
  const opts = page.getByTestId('opciones-exportacion')
  await opts.getByRole('button', { name: /^×3/ }).click()
  await opts.getByRole('slider', { name: 'Calidad JPG' }).fill('0.7')
  await expect(page.getByTestId('resumen-exportacion')).toContainText(`${fmt.width * 3}×${fmt.height * 3}`)
  const dl = await runExport(page)
  expect(dl.suggestedFilename()).toBe('export-p10-002.jpg')
  const bytes = readFileSync((await dl.path())!)
  expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff])
  const r = await pixels(page, bytes, 'image/jpeg', [{ x: 500, y: 641 }, { x: 200, y: 200 }], 3)
  expect([r.w, r.h]).toEqual([fmt.width * 3, fmt.height * 3])
  expect(r.px[0][2]).toBeGreaterThan(200) // azul
  expect(r.px[1][0]).toBeGreaterThan(240) // oculto: blanco
})

test('ZIP por rango en JPG con nombres pagina-002 / pagina-003, y PDF sólo de la página actual', async ({ page }) => {
  await setup(page)
  await openExport(page, /Páginas en imágenes/)
  const opts = page.getByTestId('opciones-exportacion')
  await opts.getByRole('button', { name: 'Rango' }).click()
  await opts.getByLabel('Desde la página').fill('2')
  await opts.getByLabel('Hasta la página').fill('3')
  await opts.getByRole('button', { name: 'JPG', exact: true }).click()
  await opts.getByRole('button', { name: /^×1/ }).click()
  await expect(page.getByTestId('resumen-exportacion')).toContainText('2 archivos')
  const zip = await JSZip.loadAsync(readFileSync((await (await runExport(page)).path())!))
  expect(Object.keys(zip.files).sort()).toEqual(['pagina-002.jpg', 'pagina-003.jpg'])

  await page.getByRole('button', { name: 'Listo' }).click()
  await openExport(page, /Pantalla \(PDF liviano\)/)
  await page.getByTestId('opciones-exportacion').getByRole('button', { name: /^Actual/ }).click()
  const pdf = readFileSync((await (await runExport(page)).path())!).toString('latin1')
  expect((pdf.match(/\/Type \/Page\b/g) ?? []).length).toBe(1)
})

test('rango vacío: error claro, nada se descarga; exportar no modifica el proyecto ni el historial', async ({ page }) => {
  await setup(page)
  const before = await inApp<string>(page, 'return JSON.stringify({ p: s.project.pages, past: s.past.length })')
  await openExport(page, /Imprenta \(PDF\)/)
  const opts = page.getByTestId('opciones-exportacion')
  await opts.getByRole('button', { name: 'Rango' }).click()
  await opts.getByLabel('Desde la página').fill('3')
  await opts.getByLabel('Hasta la página').fill('1')
  await page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Exportar' }).getByRole('alert')).toContainText('rango de páginas está vacío')
  await opts.getByRole('button', { name: /^Todas/ }).click()
  const pdf = readFileSync((await (await runExport(page)).path())!).toString('latin1')
  expect((pdf.match(/\/Type \/Page\b/g) ?? []).length).toBe(3)
  expect(await inApp<string>(page, 'return JSON.stringify({ p: s.project.pages, past: s.past.length })')).toBe(before)
})

test('lo exportado coincide con el lienzo del editor (desplazamientos, fuentes, bordes y recortes)', async ({ page }) => {
  await setup(page)
  // Una imagen recortada y una viñeta con imagen, además del globo y el rombo.
  await inApp(
    page,
    `const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d');
     g.fillStyle = '#16a34a'; g.fillRect(0, 0, 300, 200); g.fillStyle = '#facc15'; g.fillRect(0, 0, 150, 100);
     const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
     const [a] = await m.placement.importFiles([new File([blob], 'cuadros.png', { type: 'image/png' })]);
     const img = m.factories.createImage(a.id, 520, 900, 240, 160); img.crop = { x: 75, y: 50, width: 150, height: 100 };
     const panel = m.factories.createPanel(80, 1000, 380, 300); panel.image = { assetId: a.id, x: -40, y: -20, scale: 1.6, filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } };
     m.store.useEditor.getState().addElements([panel, img], { select: false }); m.store.useEditor.getState().select([])`,
  )
  await page.waitForTimeout(800)
  const editor = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    const layer = st.findOne('.content')
    const z = st.scaleX()
    const path = '/src/store/editor.ts'
    const m = await import(/* @vite-ignore */ path)
    const { width: W, height: H } = m.useEditor.getState().project.format
    const c = layer.toCanvas({ x: st.x(), y: st.y(), width: W * z, height: H * z, pixelRatio: 1 / z })
    return c.toDataURL('image/png').split(',')[1]
  })
  await openExport(page, /Esta página en PNG/)
  await page.getByTestId('opciones-exportacion').getByRole('button', { name: /^×1/ }).click()
  const exported = readFileSync((await (await runExport(page)).path())!)
  const diff = await page.evaluate(
    async ([a, b]) => {
      const load = async (b64: string) => {
        const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob())
        const c = document.createElement('canvas')
        c.width = bmp.width
        c.height = bmp.height
        c.getContext('2d')!.drawImage(bmp, 0, 0)
        return c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
      }
      const [x, y] = await Promise.all([load(a), load(b)])
      if (x.width !== y.width || x.height !== y.height) return { sizeMismatch: [x.width, x.height, y.width, y.height], bad: 1 }
      let bad = 0
      let total = 0
      for (let i = 0; i < x.data.length; i += 4 * 37) {
        total++
        const d = Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2])
        if (d > 60) bad++
      }
      return { bad: bad / total }
    },
    [editor, exported.toString('base64')] as const,
  )
  // Bordes antialiasados pueden diferir un píxel; el contenido tiene que ser el mismo.
  expect(diff.sizeMismatch).toBeUndefined()
  expect(diff.bad).toBeLessThan(0.01)
})
