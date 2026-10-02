import { beforeEach, describe, expect, it, vi } from 'vitest'

// Medir texto necesita un canvas real; en estos tests no hace falta.
vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { useEditor } = await import('../../src/store/editor')
const storage = await import('../../src/lib/storage')
const { settleSaves } = await import('../../src/lib/persistence')
const { createProject, createImage, createPanel } = await import('../../src/lib/factories')
import type { Project } from '../../src/types'

const S = () => useEditor.getState()
const page = () => S().project!.pages.find((p) => p.id === S().pageId)!
const png = (n: number) => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, n])], { type: 'image/png' })

async function openWithImage(title: string): Promise<{ p: Project; assetId: string }> {
  const p = createProject({ title, author: '', kind: 'libre', pages: 1 })
  const assetId = `as_${title.replace(/\W/g, '')}`
  await storage.putAssetBlob(assetId, png(1))
  p.assets.push({ id: assetId, name: 'foto', width: 10, height: 10, mime: 'image/png', createdAt: 0 })
  await storage.saveProject(p)
  S().openProject(p)
  return { p, assetId }
}

beforeEach(() => {
  S().closeProject()
  useEditor.setState({ clipboard: null, toasts: [] })
})

describe('A11 · una acción sin efecto no toca el historial', () => {
  it('traer al frente lo que ya está al frente conserva "Rehacer" y no marca cambios', async () => {
    await openWithImage('noop')
    const els = page().elements
    S().select([els[els.length - 1].id])
    S().updateElement(els[0].id, { x: els[0].x + 5 })
    S().undo()
    expect(S().future).toHaveLength(1)
    const before = { past: S().past.length, rev: S().revision, updatedAt: S().project!.updatedAt }
    S().arrange('front')
    S().arrange('forward')
    expect(S().future).toHaveLength(1)
    expect(S().past.length).toBe(before.past)
    expect(S().revision).toBe(before.rev)
    expect(S().project!.updatedAt).toBe(before.updatedAt)
  })

  it('enviar al fondo lo que ya está al fondo, propiedades iguales y comandos repetidos tampoco', async () => {
    await openWithImage('noop2')
    const first = page().elements[0]
    S().select([first.id])
    const rev = S().revision
    S().arrange('back')
    S().arrange('backward')
    S().updateElement(first.id, { x: first.x, opacity: first.opacity, locked: first.locked, hidden: first.hidden })
    S().movePage(0, 0)
    S().reorderElement(first.id, 0)
    expect(S().revision).toBe(rev)
    expect(S().saveStatus).toBe('saved')
    // Un cambio real sí cuenta, una vez.
    S().updateElement(first.id, { hidden: true })
    S().updateElement(first.id, { hidden: true })
    expect(S().revision).toBe(rev + 1)
    expect(S().past).toHaveLength(1)
  })
})

describe('A10 · bloqueados', () => {
  it('Supr, ordenar y alinear omiten los bloqueados y avisan', async () => {
    await openWithImage('lock')
    const [a, b] = [createPanel(0, 0, 10, 10), createPanel(20, 0, 10, 10)]
    b.locked = true
    S().addElements([a, b])
    S().select([a.id, b.id])
    S().deleteSelection()
    expect(page().elements.some((e) => e.id === b.id)).toBe(true)
    expect(page().elements.some((e) => e.id === a.id)).toBe(false)
    expect(S().toasts.at(-1)?.message).toBe('Se omitió 1 elemento bloqueado')
    // un bloqueado solo: no hay mutación
    const rev = S().revision
    S().select([b.id])
    S().deleteSelection()
    S().arrange('back')
    expect(S().revision).toBe(rev)
  })
})

describe('A7 · quitar un recurso y deshacer', () => {
  it('deshacer vuelve a poner el recurso; la imagen no se borra mientras deshacer la pueda necesitar', async () => {
    const { p, assetId } = await openWithImage('a7')
    const img = createImage(assetId, 0, 0, 10, 10)
    S().addElements([img])
    S().select([img.id])
    S().deleteSelection()
    S().removeAsset(assetId)
    expect(S().project!.assets).toHaveLength(0)
    expect(await storage.getAssetBlob(assetId)).toBeInstanceOf(Blob)
    S().undo()
    expect(page().elements.some((e) => e.id === img.id)).toBe(true)
    expect(S().project!.assets.map((a) => a.id)).toEqual([assetId])
    // Al salir el documento la usa: no se recolecta.
    S().closeProject()
    await settleSaves()
    expect(await storage.getAssetBlob(assetId)).toBeInstanceOf(Blob)
    expect((await storage.loadProject(p.id))!.assets.map((a) => a.id)).toEqual([assetId])
  })

  it('al salir del proyecto se recolecta la imagen retirada que ya nadie usa', async () => {
    const { assetId } = await openWithImage('a7gc')
    S().removeAsset(assetId)
    S().closeProject()
    await settleSaves()
    expect(await storage.getAssetBlob(assetId)).toBeUndefined()
  })

  it('no recolecta una imagen que otro proyecto guardado todavía lista', async () => {
    const { p, assetId } = await openWithImage('a7shared')
    await storage.saveProject({ ...structuredClone(p), id: 'pr_otro_a7', title: 'Otro' })
    S().removeAsset(assetId)
    S().closeProject()
    await settleSaves()
    expect(await storage.getAssetBlob(assetId)).toBeInstanceOf(Blob)
  })
})

describe('A8 · copiar y pegar entre proyectos', () => {
  it('pegar en otro proyecto copia la imagen con id propio y deja el proyecto autocontenido', async () => {
    const { assetId } = await openWithImage('origenA8')
    const img = createImage(assetId, 0, 0, 10, 10)
    S().addElements([img])
    S().select([img.id])
    S().copySelection()
    const dest = createProject({ title: 'destino', author: '', kind: 'libre', pages: 1 })
    await storage.saveProject(dest)
    S().openProject(dest)
    await S().paste()
    const pasted = page().elements.find((e) => e.type === 'image')
    expect(pasted?.type).toBe('image')
    const newId = pasted!.type === 'image' ? pasted!.assetId : ''
    expect(newId).not.toBe(assetId)
    expect(S().project!.assets.map((a) => a.id)).toEqual([newId])
    expect(await storage.getAssetBlob(newId)).toBeInstanceOf(Blob)
    // pegar dos veces no duplica la imagen si ya está en el proyecto... pero tampoco rompe nada
    await S().paste()
    for (const el of page().elements) if (el.type === 'image') expect(S().project!.assets.some((a) => a.id === el.assetId)).toBe(true)
  })

  it('si la imagen original ya no existe, no pega una referencia rota', async () => {
    const { p, assetId } = await openWithImage('origenBorrado')
    const img = createImage(assetId, 0, 0, 10, 10)
    const panel = createPanel(0, 0, 50, 50)
    panel.image = { assetId, x: 0, y: 0, scale: 1, filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } }
    S().addElements([img, panel])
    S().select([img.id, panel.id])
    S().copySelection()
    S().closeProject()
    await settleSaves()
    await storage.deleteProject((await storage.loadProject(p.id))!)
    const dest = createProject({ title: 'destino2', author: '', kind: 'libre', pages: 1 })
    S().openProject(dest)
    await S().paste()
    expect(page().elements.some((e) => e.type === 'image')).toBe(false)
    const pastedPanel = page().elements.find((e) => e.type === 'panel' && e.width === 50)
    expect(pastedPanel?.type === 'panel' && pastedPanel.image).toBe(null)
    expect(S().toasts.some((t) => /ya no existen/.test(t.message))).toBe(true)
  })
})
