import type { Project, Script, ScriptBlock, ScriptKind } from '../types'
import { uid } from './id'

export const KIND_LABELS: Record<ScriptKind, string> = {
  description: 'Descripción',
  dialogue: 'Diálogo',
  thought: 'Pensamiento',
  caption: 'Cartucho',
  sfx: 'SFX',
}

/** Formato propio de guion (independiente del .vineta). */
interface ScriptFile {
  app: 'vineta-studio-guion'
  version: 1
  title: string
  pages: { name: string; panels: { panel: number | null; blocks: { kind: ScriptKind; text: string; character?: string }[] }[] }[]
}

/** Orden de lectura de las viñetas de una página (arriba→abajo; izq→der o der→izq según el sentido). */
export function panelOrder(project: Project, pageId: string): string[] {
  const page = project.pages.find((p) => p.id === pageId)
  const rtl = project.readingDirection === 'rtl'
  return (page?.elements.filter((e) => e.type === 'panel') ?? [])
    .slice()
    .sort((a, b) => (Math.abs(a.y - b.y) > Math.min(a.height, b.height) * 0.5 ? a.y - b.y : rtl ? b.x - a.x : a.x - b.x))
    .map((e) => e.id)
}

export function exportScriptJSON(project: Project): string {
  const file: ScriptFile = {
    app: 'vineta-studio-guion',
    version: 1,
    title: project.title,
    pages: project.pages.map((pg) => {
      const order = panelOrder(project, pg.id)
      return {
        name: pg.name,
        panels: (project.script?.pages[pg.id]?.panels ?? []).map((row) => ({
          panel: row.panelId ? order.indexOf(row.panelId) + 1 || null : null,
          blocks: row.blocks.map((b) => ({ kind: b.kind, text: b.text, ...(b.character ? { character: b.character } : {}) })),
        })),
      }
    }),
  }
  return JSON.stringify(file, null, 2)
}

/** Guion legible en texto plano (para leer, imprimir o pasar a otra persona). */
export function exportScriptText(project: Project): string {
  const out = [project.title.toUpperCase(), '']
  project.pages.forEach((pg, i) => {
    const rows = project.script?.pages[pg.id]?.panels ?? []
    if (!rows.some((r) => r.blocks.length)) return
    out.push(`PÁGINA ${i + 1} — ${pg.name}`)
    const order = panelOrder(project, pg.id)
    for (const row of rows) {
      if (!row.blocks.length) continue
      const n = row.panelId ? order.indexOf(row.panelId) + 1 : 0
      out.push(n ? `  Viñeta ${n}` : '  (Página)')
      for (const b of row.blocks) out.push(`    ${KIND_LABELS[b.kind].toUpperCase()}${b.character ? ` (${b.character})` : ''}: ${b.text}`)
    }
    out.push('')
  })
  return out.join('\n')
}

/**
 * Importa un guion propio a las páginas del proyecto, por orden de página y de viñeta. Devuelve un
 * guion nuevo (no toca las páginas). Tira un error con mensaje para el usuario si el archivo no sirve.
 */
export function importScriptJSON(project: Project, text: string): Script {
  let data: ScriptFile
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo de guion está dañado.')
  }
  if (data?.app !== 'vineta-studio-guion' || !Array.isArray(data.pages)) throw new Error('El archivo no es un guion de Viñeta Studio.')
  const kinds = Object.keys(KIND_LABELS)
  const script: Script = { pages: { ...(project.script?.pages ?? {}) } }
  data.pages.slice(0, project.pages.length).forEach((src, i) => {
    const page = project.pages[i]
    const order = panelOrder(project, page.id)
    const panels = (Array.isArray(src?.panels) ? src.panels : []).map((row) => ({
      id: uid('sp_'),
      panelId: typeof row?.panel === 'number' ? (order[row.panel - 1] ?? null) : null,
      blocks: (Array.isArray(row?.blocks) ? row.blocks : [])
        .filter((b) => b && kinds.includes(b.kind) && typeof b.text === 'string')
        .slice(0, 300)
        .map((b): ScriptBlock => ({ id: uid('sb_'), kind: b.kind, text: b.text.slice(0, 20000), ...(typeof b.character === 'string' ? { character: b.character.slice(0, 300) } : {}) })),
    }))
    script.pages[page.id] = { panels }
  })
  return script
}
