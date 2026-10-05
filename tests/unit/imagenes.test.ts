import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { sniffImageType, validateImageFile, MAX_IMAGE_BYTES } = await import('../../src/lib/imageValidation')
const { coverFit, containFit } = await import('../../src/lib/imageFit')
const { fitPanelImage } = await import('../../src/lib/panelOps')
const { validateProject } = await import('../../src/lib/projectSchema')
const { createProject, createPanel } = await import('../../src/lib/factories')
const { useEditor } = await import('../../src/store/editor')
const { fillPanel } = await import('../../src/lib/placement')
import { DEFAULT_FILTERS } from '../../src/types'

const bytes = (...b: number[]) => new Blob([new Uint8Array([...b, ...new Array(16).fill(0)])])
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

beforeEach(() => useEditor.getState().closeProject())

describe('P04 · validación de archivos por contenido real', () => {
  it('reconoce PNG, JPG, WebP, GIF y SVG por sus bytes', async () => {
    expect(await sniffImageType(bytes(...PNG))).toBe('image/png')
    expect(await sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(await sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe('image/webp')
    expect(await sniffImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe('image/gif')
    expect(await sniffImageType(new Blob(['<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>']))).toBe('image/svg+xml')
    expect(await sniffImageType(new Blob(['hola, no soy una imagen']))).toBeNull()
  })

  it('rechaza SVG, archivos que no son imagen (aunque digan .png), vacíos y demasiado grandes', async () => {
    const fake = Object.assign(new Blob(['texto'], { type: 'image/png' }), { name: 'falsa.png' })
    expect(await validateImageFile(fake)).toMatchObject({ ok: false, reason: expect.stringContaining('no es una imagen') })
    const svg = Object.assign(new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }), { name: 'x.svg' })
    expect(await validateImageFile(svg)).toMatchObject({ ok: false, reason: expect.stringContaining('SVG') })
    expect(await validateImageFile(Object.assign(new Blob([]), { name: 'v.png' }))).toMatchObject({ ok: false })
    const big = { size: MAX_IMAGE_BYTES + 1, name: 'enorme.jpg', slice: () => bytes(0xff, 0xd8, 0xff) } as unknown as Blob
    expect(await validateImageFile(big)).toMatchObject({ ok: false, reason: expect.stringContaining('MB') })
    // Un JPG con extensión .png se acepta como JPG.
    const jpgAsPng = Object.assign(bytes(0xff, 0xd8, 0xff, 0xe0), { name: 'foto.png' })
    expect(await validateImageFile(jpgAsPng)).toEqual({ ok: true, mime: 'image/jpeg' })
  })
})

describe('P04 · imagen dentro de la viñeta', () => {
  it('cover llena y contain muestra entera, también con la imagen girada 90°', () => {
    const panel = { width: 300, height: 200 }
    const tall = { width: 100, height: 400 }
    expect(coverFit(panel, tall).scale).toBe(3)
    expect(containFit(panel, tall).scale).toBe(0.5)
    // Girada, la imagen alta pasa a ser ancha (400×100).
    expect(coverFit(panel, tall, 90).scale).toBe(2)
    expect(containFit(panel, tall, 90).scale).toBe(0.75)
    // El centro de la imagen queda en el centro de la viñeta.
    const c = coverFit(panel, tall, 90)
    expect(c.x + (tall.width * c.scale) / 2).toBe(150)
    expect(c.y + (tall.height * c.scale) / 2).toBe(100)
  })

  it('reencajar conserva giro, espejos y filtros', () => {
    const prev = { assetId: 'as_1', x: 0, y: 0, scale: 1, filters: { ...DEFAULT_FILTERS, grayscale: true }, rotation: 90, flipX: true }
    const out = fitPanelImage({ width: 200, height: 200 }, { width: 100, height: 50 }, 'contain', prev)
    expect(out).toMatchObject({ assetId: 'as_1', rotation: 90, flipX: true, filters: { grayscale: true } })
    expect(out.scale).toBe(2)
  })

  it('reemplazar la imagen de una viñeta conserva filtros, giro y espejos', () => {
    const p = createProject({ title: 'img', author: '', kind: 'libre', pages: 1, templateId: null })
    const panel = createPanel(0, 0, 400, 300)
    panel.image = { assetId: 'as_a', x: 0, y: 0, scale: 1, filters: { ...DEFAULT_FILTERS, sepia: true }, rotation: 180, flipY: true }
    p.pages[0].elements = [panel]
    p.assets = [
      { id: 'as_a', name: 'a', width: 400, height: 300, mime: 'image/png', createdAt: 0 },
      { id: 'as_b', name: 'b', width: 100, height: 100, mime: 'image/png', createdAt: 0 },
    ]
    useEditor.getState().openProject(p)
    fillPanel(panel.id, p.assets[1])
    const img = (useEditor.getState().project!.pages[0].elements[0] as typeof panel).image!
    expect(img).toMatchObject({ assetId: 'as_b', rotation: 180, flipY: true, filters: { sepia: true }, scale: 4 })
  })

  it('el .vineta guarda giro y espejos de la imagen de viñeta (y los viejos siguen sin ellos)', () => {
    const p = createProject({ title: 'v', author: '', kind: 'libre', pages: 1, templateId: null })
    const panel = createPanel(0, 0, 100, 100)
    panel.image = { assetId: 'as_a', x: 1, y: 2, scale: 1, filters: { ...DEFAULT_FILTERS }, rotation: 90, flipX: true, flipY: false }
    p.pages[0].elements = [panel]
    p.assets = [{ id: 'as_a', name: 'a', width: 10, height: 10, mime: 'image/png', createdAt: 0 }]
    const out = validateProject(JSON.parse(JSON.stringify(p))).pages[0].elements[0] as typeof panel
    expect(out.image).toMatchObject({ rotation: 90, flipX: true, flipY: false })
    delete (panel.image as Partial<typeof panel.image>).rotation
    delete (panel.image as Partial<typeof panel.image>).flipX
    delete (panel.image as Partial<typeof panel.image>).flipY
    const old = validateProject(JSON.parse(JSON.stringify(p))).pages[0].elements[0] as typeof panel
    expect('rotation' in old.image!).toBe(false)
  })
})
