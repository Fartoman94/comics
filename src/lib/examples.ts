import type { Project, ScriptBlock } from '../types'
import { createBubble, createProject, createText, TEXT_PRESETS } from './factories'
import { uid } from './id'

/**
 * Proyecto de ejemplo editable: viñetas armadas, globos y una onomatopeya ya escritos, y el guion
 * de la primera página cargado y colocado, para ver cómo se conecta todo.
 */
export function createExampleProject(opts: { title: string; author: string; kind: Project['kind']; formatId?: string; pages?: number; templateId?: string | null; readingDirection?: Project['readingDirection'] }): Project {
  const p = createProject({ ...opts, templateId: opts.templateId ?? undefined })
  const page = p.pages.find((pg) => pg.elements.filter((e) => e.type === 'panel').length >= 2) ?? p.pages[0]
  const panels = page.elements.filter((e) => e.type === 'panel')
  const scale = p.format.width / 900
  const lines: { kind: ScriptBlock['kind']; text: string }[] = [
    { kind: 'caption', text: 'Una mañana cualquiera…' },
    { kind: 'dialogue', text: '¡Llegamos tarde otra vez!' },
    { kind: 'thought', text: 'Hoy algo va a cambiar.' },
    { kind: 'sfx', text: '¡BAM!' },
  ]
  const blocks: ScriptBlock[] = []
  const rows: NonNullable<Project['script']>['pages'][string]['panels'] = []
  lines.forEach((line, i) => {
    const panel = panels[i % Math.max(1, panels.length)]
    const el =
      line.kind === 'sfx'
        ? Object.assign(createText(0, 0, TEXT_PRESETS[0]), { text: line.text })
        : Object.assign(createBubble(line.kind === 'thought' ? 'thought' : line.kind === 'caption' ? 'box' : 'speech', 0, 0, scale), { text: line.text })
    if (el.type === 'text') el.fontSize = Math.round(el.fontSize * scale)
    if (panel) {
      el.x = Math.round(panel.x + Math.max(8, (panel.width - el.width) / 2))
      el.y = Math.round(panel.y + Math.max(8, (panel.height - el.height) * 0.2))
    }
    page.elements.push(el)
    const block: ScriptBlock = { id: uid('sb_'), kind: line.kind, text: line.text, placedElementId: el.id }
    blocks.push(block)
    const row = rows.find((r) => r.panelId === (panel?.id ?? null))
    if (row) row.blocks.push(block)
    else rows.push({ id: uid('sp_'), panelId: panel?.id ?? null, blocks: [block] })
  })
  rows.unshift({ id: uid('sp_'), panelId: null, blocks: [{ id: uid('sb_'), kind: 'description', text: 'Página de presentación: dos amigos corren a la escuela.' }] })
  p.script = { pages: { [page.id]: { panels: rows } } }
  return p
}
