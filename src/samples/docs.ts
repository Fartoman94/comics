import type { PanelDef, WorkDef } from './types'
import { TEMPLATE_PANELS } from './validate'

/** Preproducción en Markdown a partir de los datos de la obra (la misma fuente que el proyecto). */

const STYLE_NAME: Record<WorkDef['style'], string> = {
  western: 'Cómic occidental a color',
  shonen: 'Manga shonen en blanco y negro con tramas',
  seinen: 'Manga seinen en blanco y negro, negros densos y achurado',
  shojo: 'Manga shojo en blanco y negro, línea fina, flores y brillos',
  webtoon: 'Webtoon vertical a color',
  anime: 'Novela gráfica estilo anime a color (cel shading)',
}

export function bibleMarkdown(w: WorkDef): string {
  const out: string[] = []
  out.push(`# ${w.title}${w.subtitle ? ` — ${w.subtitle}` : ''}`, '', '## 1. Ficha general', '')
  out.push(`| Campo | |`, `|---|---|`)
  out.push(`| Título | ${w.title} |`, `| Subtítulo | ${w.subtitle ?? '—'} |`, `| Género | ${w.genre} |`, `| Tono | ${w.tone} |`, `| Público | ${w.audience} |`, `| Estilo | ${STYLE_NAME[w.style]} |`, `| Formato | ${w.formatId} · lectura ${w.readingDirection === 'rtl' ? 'derecha → izquierda' : w.readingDirection === 'vertical' ? 'vertical (scroll)' : 'izquierda → derecha'} |`, `| Páginas | ${w.pages.length} + portada |`)
  out.push('', `**Resumen corto.** ${w.logline}`, '', '**Resumen largo.**', '', w.synopsis, '', `**Propuesta visual.** ${w.visualProposal}`, '')
  out.push(`**Portada.** ${w.cover.title}${w.cover.subtitle ? ` — ${w.cover.subtitle}` : ''} · «${w.cover.tagline}»`)
  if (w.altCover) out.push(`**Portada alternativa.** ${w.altCover.title}${w.altCover.subtitle ? ` — ${w.altCover.subtitle}` : ''} · «${w.altCover.tagline}»`)
  out.push('', '## 2. Biblia de personajes', '')
  for (const c of w.characters) {
    out.push(`### ${c.name} (${c.age}) · ${c.role}`, '')
    const rows: [string, string][] = [
      ['Personalidad', c.personality], ['Objetivo', c.goal], ['Miedo', c.fear], ['Defecto', c.flaw], ['Evolución', c.arc], ['Relaciones', c.relations],
      ['Descripción física', c.physical], ['Rasgos visuales', c.visualTraits], ['Vestuario', c.outfit], ['Expresiones típicas', c.expressions], ['Forma de hablar', c.speech],
    ]
    for (const [k, v] of rows) out.push(`- **${k}:** ${v}`)
    out.push('')
  }
  out.push('## 3. Worldbuilding', '', `**Ambientación.** ${w.world.setting}`, '', `**Época.** ${w.world.era}`, '', `**Estética.** ${w.world.aesthetic}`, '', '**Reglas del mundo**', ...w.world.rules.map((r) => `- ${r}`), '', '**Lugares clave**', ...w.world.places.map((p) => `- **${p.name}:** ${p.description}`), '', '**Conflictos**', ...w.world.conflicts.map((r) => `- ${r}`), '', '**Elementos culturales**', ...w.world.culture.map((r) => `- ${r}`), '')
  const s = w.structure
  out.push('## 4. Estructura narrativa', '', `**Inicio.** ${s.inicio}`, '', `**Desarrollo.** ${s.desarrollo}`, '', `**Clímax.** ${s.climax}`, '', `**Cierre.** ${s.cierre}`, '', '**Giros**', ...s.giros.map((g) => `- ${g}`), '', '**Cliffhangers**', ...s.cliffhangers.map((g) => `- ${g}`), '', '**Escenas clave**', ...s.escenasClave.map((g) => `- ${g}`), '', `**Ritmo.** ${s.ritmo}`, '')
  return out.join('\n')
}

function panelLine(w: WorkDef, pn: PanelDef, i: number) {
  const who = (pn.shot.chars ?? []).map((c) => `${w.characters.find((x) => x.id === c.id)?.name.split(' ')[0] ?? c.id}${c.expr ? ` (${c.expr})` : ''}`).join(', ')
  const shot = `${pn.shot.bg}${pn.shot.time && pn.shot.time !== 'day' ? `, ${pn.shot.time}` : ''}${pn.shot.angle && pn.shot.angle !== 'normal' ? `, ángulo ${pn.shot.angle}` : ''}`
  const lines = (pn.lines ?? []).map((l) => `    - ${l.who ? `**${w.characters.find((c) => c.id === l.who)?.name.split(' ')[0] ?? l.who}** (${l.kind})` : `*${l.kind}*`}: ${l.text}`)
  const fx = [...(pn.sfx ?? []).map((s) => `SFX «${s.text}»`), ...(pn.fx ? [`efecto ${pn.fx}`] : []), ...(pn.shot.extras ?? [])].join(', ')
  return [`  ${i + 1}. ${shot}${who ? ` · ${who}` : pn.shot.prop ? ` · objeto: ${pn.shot.prop}` : ''}${fx ? ` · ${fx}` : ''}`, ...lines].join('\n')
}

export function scriptMarkdown(w: WorkDef): string {
  const out = [`# ${w.title} — Guion por páginas`, '', `${w.pages.length} páginas + portada. Cada página: objetivo, qué sucede, tono, composición, viñetas con diálogos, efectos y notas.`, '']
  w.pages.forEach((p, i) => {
    const n = 'template' in p.layout ? TEMPLATE_PANELS[p.layout.template] : p.layout.boxes.length
    const layout = 'template' in p.layout ? `plantilla «${p.layout.template}»` : `cajas propias`
    const cast = [...new Set(p.panels.flatMap((pn) => (pn.shot.chars ?? []).map((c) => w.characters.find((x) => x.id === c.id)?.name.split(' ')[0] ?? c.id)))]
    out.push(`## Página ${i + 1}`, '', `- **Objetivo:** ${p.objective}`, `- **Qué sucede:** ${p.summary}`, `- **Personajes:** ${cast.join(', ') || '—'}`, `- **Tono:** ${p.tone}`, `- **Viñetas:** ${n} (${layout})`, `- **Composición:** ${p.composition}`, '- **Viñeta por viñeta:**', ...p.panels.map((pn, j) => panelLine(w, pn, j)))
    if (p.notes) out.push(`- **Notas visuales:** ${p.notes}`)
    out.push('')
  })
  return out.join('\n')
}
