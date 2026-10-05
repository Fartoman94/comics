import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

// localStorage en memoria (el entorno de tests es Node).
const mem = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
} as Storage

const { useEditor } = await import('../../src/store/editor')
const { createProject, createBubble, createPanel } = await import('../../src/lib/factories')
const { describeChange } = await import('../../src/lib/history')
const { writeRescue, readRescue, clearRescue } = await import('../../src/lib/rescue')
const { settleSaves } = await import('../../src/lib/persistence')
const storage = await import('../../src/lib/storage')

const S = () => useEditor.getState()
const snap = () => {
  const { assets: _a, thumbnail: _t, ...rest } = S().project!
  return rest
}

beforeEach(() => {
  S().closeProject()
  mem.clear()
})

function open() {
  const p = createProject({ title: 'hist', author: '', kind: 'libre', pages: 2, templateId: null })
  const panel = createPanel(0, 0, 400, 400)
  panel.name = 'Viñeta 1'
  const b = createBubble('speech', 50, 50)
  b.name = 'Globo 1'
  p.pages[0].elements = [panel, b]
  S().openProject(p)
  return { p, panel, b }
}

describe('P07 · frases del historial', () => {
  it('describe mover, texto, ocultar, agregar, eliminar, orden y páginas', () => {
    const { b, panel } = open()
    const cases: [() => void, string][] = [
      [() => S().updateElement(b.id, { x: 99 }), 'Moviste Globo 1'],
      [() => S().updateElement(b.id, { text: 'Hola' }), 'Editaste el texto de Globo 1'],
      [() => S().updateElement(b.id, { hidden: true }), 'Ocultaste Globo 1'],
      [() => S().updateElement(panel.id, { width: 500, height: 450 }), 'Cambiaste el tamaño de Viñeta 1'],
      [() => S().updateElement(b.id, { fill: '#ff0000' }), 'Cambiaste el color de Globo 1'],
      [() => (S().select([b.id]), S().duplicateSelection()), 'Agregaste Globo 1'],
      [() => (S().select([panel.id]), S().arrange('front')), 'Cambiaste el orden de las capas'],
      [() => S().splitPanel(panel.id, 'vertical'), 'Dividiste Viñeta 1'],
      [() => (S().select([panel.id]), S().deleteSelection()), 'Eliminaste Viñeta 1'],
      [() => S().addPage(), 'Agregaste la página 3'],
      [() => S().movePage(0, 2), 'Reordenaste las páginas'],
    ]
    for (const [run, text] of cases) {
      const before = snap()
      run()
      expect(describeChange(before, snap())).toBe(text)
    }
  })
})

describe('P07 · deshacer/rehacer', () => {
  it('20 cambios: se deshacen y rehacen todos, y saltar en el historial equivale a varios pasos', () => {
    const { b } = open()
    for (let i = 1; i <= 20; i++) S().updateElement(b.id, { x: i * 10 })
    expect(S().past).toHaveLength(20)
    S().jumpHistory(-20)
    expect(S().project!.pages[0].elements[1].x).toBe(50)
    S().jumpHistory(+7)
    expect(S().project!.pages[0].elements[1].x).toBe(70)
    S().jumpHistory(+100)
    expect(S().project!.pages[0].elements[1].x).toBe(200)
    expect(S().future).toHaveLength(0)
  })

  it('una edición en ráfaga (mismo control) es un solo paso; operaciones críticas piden guardado inmediato', () => {
    const { b } = open()
    for (let i = 0; i < 10; i++) S().updateElement(b.id, { opacity: 1 - i * 0.05 }, 'opacity')
    expect(S().past).toHaveLength(1)
    const u = S().urgentSave
    S().updateElement(b.id, { x: 1 })
    expect(S().urgentSave).toBe(u)
    S().addPage()
    expect(S().urgentSave).toBe(u + 1)
    S().setPage(S().project!.pages[0].id)
    S().select([b.id])
    S().deleteSelection()
    expect(S().urgentSave).toBe(u + 2)
  })
})

describe('P07 · copia de rescate', () => {
  it('sólo se recupera si es más nueva que lo guardado; un guardado exitoso la borra', async () => {
    const { p } = open()
    S().updateElement(p.pages[0].elements[1].id, { text: 'sin guardar' })
    expect(writeRescue(S().project!)).toBe(true)
    expect(readRescue(p.id, p.updatedAt - 1)).toMatchObject({ id: p.id })
    expect(readRescue(p.id, Date.now() + 1000)).toBeNull()
    expect(mem.size).toBe(0)
    writeRescue(S().project!)
    await S().saveNow()
    await settleSaves()
    expect(mem.size).toBe(0)
    expect((await storage.loadProject(p.id))!.pages[0].elements[1]).toMatchObject({ text: 'sin guardar' })
    clearRescue(p.id)
  })

  it('sin espacio en localStorage, writeRescue avisa con false', () => {
    const { p } = open()
    const orig = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(writeRescue(S().project!)).toBe(false)
    localStorage.setItem = orig
    expect(readRescue(p.id, 0)).toBeNull()
  })
})
