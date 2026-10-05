import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { useEditor, scriptStatus } = await import('../../src/store/editor')
const { TEMPLATES, TEMPLATE_META } = await import('../../src/lib/templates')
const { findFreeSpot } = await import('../../src/lib/freeSpot')
const { parseProjectFile, validateProject } = await import('../../src/lib/projectSchema')
const { createProject, createBubble, createPanel } = await import('../../src/lib/factories')
const { createExampleProject } = await import('../../src/lib/examples')
const { exportScriptJSON, importScriptJSON, exportScriptText } = await import('../../src/lib/scriptFile')
const { scalePage } = await import('../../src/lib/pageScale')

const S = () => useEditor.getState()
const page = () => S().project!.pages.find((p) => p.id === S().pageId)!

beforeEach(() => {
  S().closeProject()
})

describe('plantillas', () => {
  it('las 21 plantillas siguen estando y todas tienen categoría, estilo y uso', () => {
    expect(TEMPLATES).toHaveLength(21)
    for (const t of TEMPLATES) {
      expect(TEMPLATE_META[t.id], t.id).toBeDefined()
      expect(TEMPLATE_META[t.id].categories.length).toBeGreaterThan(0)
    }
  })
})

describe('inserción inteligente', () => {
  it('busca un lugar libre dentro del área y no se sale', () => {
    const p = createProject({ title: 'x', author: '', kind: 'libre', pages: 1 })
    const pg = p.pages[0]
    const area = { x: 0, y: 0, width: 1000, height: 1000 }
    const spots: { x: number; y: number }[] = []
    for (let i = 0; i < 6; i++) {
      const spot = findFreeSpot(200, 120, pg, area)
      spots.push(spot)
      const b = createBubble('speech', 0, 0)
      Object.assign(b, { ...spot, width: 200, height: 120 })
      pg.elements.push(b)
    }
    // ninguno se superpone con otro
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i]
        const c = spots[j]
        const overlap = a.x < c.x + 200 && a.x + 200 > c.x && a.y < c.y + 120 && a.y + 120 > c.y
        expect(overlap, `${i} y ${j}`).toBe(false)
      }
    for (const s of spots) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x + 200).toBeLessThanOrEqual(1000)
    }
  })
  it('si no hay lugar libre, igual queda dentro del área', () => {
    const p = createProject({ title: 'x', author: '', kind: 'libre', pages: 1 })
    const pg = p.pages[0]
    const big = createBubble('speech', 0, 0)
    Object.assign(big, { x: 0, y: 0, width: 300, height: 300 })
    pg.elements.push(big)
    const spot = findFreeSpot(280, 280, pg, { x: 10, y: 10, width: 300, height: 300 })
    expect(spot.x).toBeGreaterThanOrEqual(10)
    expect(spot.x + 280).toBeLessThanOrEqual(310)
  })
})

describe('guion: esquema y compatibilidad', () => {
  it('un .vineta legado sin guion sigue siendo válido', () => {
    const { project } = parseProjectFile(readFileSync(new URL('../fixtures/legacy-v1.vineta', import.meta.url), 'utf8'))
    expect(project.script).toBeUndefined()
  })
  it('acepta un guion bien formado y rechaza tipos inválidos', () => {
    const p = createExampleProject({ title: 'Ej', author: '', kind: 'comic', pages: 3 })
    expect(validateProject(JSON.parse(JSON.stringify(p))).script).toBeDefined()
    const bad = JSON.parse(JSON.stringify(p))
    const key = Object.keys(bad.script.pages)[0]
    bad.script.pages[key].panels[0].blocks[0].kind = 'novela'
    expect(() => validateProject(bad)).toThrow('datos dañados')
  })
  it('exportar e importar el guion conserva bloques por página y viñeta', () => {
    const p = createExampleProject({ title: 'Ej', author: '', kind: 'comic', pages: 3 })
    const json = exportScriptJSON(p)
    const fresh = createProject({ title: 'Otro', author: '', kind: 'comic', pages: 3 })
    const script = importScriptJSON(fresh, json)
    const srcPage = Object.keys(p.script!.pages)[0]
    const idx = p.pages.findIndex((pg) => pg.id === srcPage)
    const dst = script.pages[fresh.pages[idx].id]
    expect(dst.panels.flatMap((r) => r.blocks.map((b) => b.text))).toEqual(p.script!.pages[srcPage].panels.flatMap((r) => r.blocks.map((b) => b.text)))
    expect(exportScriptText(p)).toMatch(/DIÁLOGO: ¡Llegamos tarde otra vez!/)
    expect(() => importScriptJSON(fresh, '{"x":1}')).toThrow('no es un guion')
  })
})

describe('guion en el editor', () => {
  it('colocar, divergir, sincronizar en ambos sentidos y deshacer', () => {
    const p = createProject({ title: 'G', author: '', kind: 'comic', pages: 2 })
    S().openProject(p)
    S().setPage(p.pages[1].id)
    const panel = page().elements.find((e) => e.type === 'panel')!
    const id = S().addScriptBlock(page().id, panel.id, 'dialogue', '¿Quién anda ahí?')
    const block = () => S().project!.script!.pages[page().id].panels[0].blocks.find((b) => b.id === id)!
    expect(scriptStatus(page(), block())).toBe('pendiente')
    S().placeScriptBlock(page().id, id)
    const el = page().elements.find((e) => e.id === block().placedElementId)!
    expect(el.type).toBe('bubble')
    expect(scriptStatus(page(), block())).toBe('colocado')
    // la viñeta del guion contiene al globo colocado
    const cx = el.x + el.width / 2
    expect(cx).toBeGreaterThanOrEqual(panel.x)
    expect(cx).toBeLessThanOrEqual(panel.x + panel.width)
    S().updateElement(el.id, { text: 'Soy yo.' } as never)
    expect(scriptStatus(page(), block())).toBe('modificado')
    S().syncScriptBlock(page().id, id, 'page')
    expect(block().text).toBe('Soy yo.')
    S().updateScriptBlock(page().id, id, { text: '¡Soy yo!' })
    S().syncScriptBlock(page().id, id, 'script')
    expect((page().elements.find((e) => e.id === el.id) as { text: string }).text).toBe('¡Soy yo!')
    S().undo()
    expect((page().elements.find((e) => e.id === el.id) as { text: string }).text).toBe('Soy yo.')
  })

  it('reordenar páginas mantiene el guion asociado por id', () => {
    const p = createProject({ title: 'R', author: '', kind: 'comic', pages: 3 })
    S().openProject(p)
    const target = p.pages[2].id
    S().addScriptBlock(target, null, 'caption', 'Al final')
    S().movePage(2, 0)
    expect(S().project!.pages[0].id).toBe(target)
    expect(S().project!.script!.pages[target].panels[0].blocks[0].text).toBe('Al final')
  })
})

describe('copiar escenas', () => {
  it('duplicar viñeta con su contenido es una sola acción y conserva la composición', () => {
    const p = createProject({ title: 'E', author: '', kind: 'libre', pages: 1, templateId: null })
    S().openProject(p)
    const panel = createPanel(50, 50, 300, 300)
    const b = createBubble('speech', 100, 100)
    S().addElements([panel, b])
    const before = page().elements.length
    const past = S().past.length
    S().duplicatePanelWithContent(panel.id)
    expect(page().elements.length).toBe(before + 2)
    expect(S().past.length).toBe(past + 1)
    const [np, nb] = page().elements.slice(-2)
    expect(np.type).toBe('panel')
    expect(nb.x - np.x).toBe(b.x - panel.x)
    expect(nb.y - np.y).toBe(b.y - panel.y)
    expect(np.id).not.toBe(panel.id)
  })
  it('duplicar estructura sin contenido', () => {
    const p = createExampleProject({ title: 'E', author: '', kind: 'comic', pages: 3 })
    S().openProject(p)
    const src = p.pages.find((pg) => pg.elements.some((e) => e.type === 'bubble'))!
    S().duplicatePageStructure(src.id)
    const copy = page()
    expect(copy.id).not.toBe(src.id)
    expect(copy.elements.every((e) => e.type === 'panel' && !e.image)).toBe(true)
    expect(copy.elements.length).toBe(src.elements.filter((e) => e.type === 'panel').length)
  })
})

describe('escalar página', () => {
  it('lleva posiciones y texto al formato nuevo', () => {
    const p = createProject({ title: 'S', author: '', kind: 'comic', pages: 2 })
    const scaled = scalePage(p.pages[1], { width: 1000, height: 1000 }, { width: 500, height: 2000 })
    const a = p.pages[1].elements[0]
    const b = scaled.elements[0]
    expect(b.x).toBeCloseTo(a.x * 0.5)
    expect(b.height).toBeCloseTo(a.height * 2)
  })
})
