import { EXPRESSIONS, FRAMINGS, POSES, SCENES, type WorkDef } from './types'

/** Cantidad de viñetas de cada plantilla del editor (para validar los guiones). */
export const TEMPLATE_PANELS: Record<string, number> = {
  splash: 1, 'two-rows': 2, 'two-cols': 2, 'three-mixed': 3, 'three-rows': 3, 'grid-2x2': 4, 'classic-6': 6, 'grid-9': 9,
  'hero-top': 4, 'hero-mid': 5, 'mixed-5': 5, 'manga-dynamic': 5, 'manga-vertical': 4, 'manga-action': 4, 'manga-4koma': 4,
  shards: 4, zigzag: 4, 'webtoon-stack': 3, 'strip-3': 3, 'strip-4': 4, 'storyboard-6': 6,
}

/** Problemas de una obra (vacío = lista para producir). */
export function validateWork(w: WorkDef): string[] {
  const out: string[] = []
  const ids = new Set(w.characters.map((c) => c.id))
  if (w.pages.length < 30) out.push(`${w.id}: tiene ${w.pages.length} páginas (mínimo 30)`)
  if (w.characters.length < 4) out.push(`${w.id}: pocos personajes (${w.characters.length})`)
  const checkShot = (where: string, shot: WorkDef['pages'][number]['panels'][number]['shot']) => {
    if (!SCENES.includes(shot.bg)) out.push(`${where}: escenario desconocido "${shot.bg}"`)
    for (const c of shot.chars ?? []) {
      if (!ids.has(c.id)) out.push(`${where}: personaje desconocido "${c.id}"`)
      if (c.expr && !EXPRESSIONS.includes(c.expr)) out.push(`${where}: expresión desconocida "${c.expr}"`)
      if (c.pose && !POSES.includes(c.pose)) out.push(`${where}: pose desconocida "${c.pose}"`)
      if (c.framing && !FRAMINGS.includes(c.framing)) out.push(`${where}: encuadre desconocido "${c.framing}"`)
    }
    if ((shot.chars?.length ?? 0) > 3) out.push(`${where}: más de 3 personajes en una viñeta`)
  }
  checkShot(`${w.id} portada`, w.cover.shot)
  w.pages.forEach((p, i) => {
    const where = `${w.id} p${i + 1}`
    const expected = 'template' in p.layout ? TEMPLATE_PANELS[p.layout.template] : p.layout.boxes.length
    if (expected === undefined) out.push(`${where}: plantilla desconocida "${(p.layout as { template: string }).template}"`)
    else if (expected !== p.panels.length) out.push(`${where}: el layout tiene ${expected} viñetas y el guion ${p.panels.length}`)
    if ('boxes' in p.layout) for (const b of p.layout.boxes) if (b.some((v) => v < 0 || v > 1) || b[0] + b[2] > 1.001 || b[1] + b[3] > 1.001) out.push(`${where}: caja fuera de la página ${JSON.stringify(b)}`)
    for (const k of ['objective', 'summary', 'tone', 'composition'] as const) if (!p[k] || p[k].length < 8) out.push(`${where}: falta "${k}"`)
    p.panels.forEach((pn, j) => {
      checkShot(`${where} v${j + 1}`, pn.shot)
      if ((pn.lines?.length ?? 0) > 4) out.push(`${where} v${j + 1}: más de 4 globos`)
      for (const l of pn.lines ?? []) {
        if (l.text.length > 140) out.push(`${where} v${j + 1}: texto demasiado largo (${l.text.length})`)
        if (l.who && !ids.has(l.who)) out.push(`${where} v${j + 1}: habla un personaje desconocido "${l.who}"`)
        if ((l.kind === 'dialogue' || l.kind === 'thought' || l.kind === 'shout' || l.kind === 'whisper') && !l.who) out.push(`${where} v${j + 1}: diálogo sin personaje`)
      }
    })
  })
  return out
}
