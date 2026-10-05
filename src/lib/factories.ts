import type {
  BubbleElement,
  BubbleShape,
  DrawingElement,
  EffectElement,
  EffectKind,
  ImageElement,
  Page,
  PageFormat,
  PanelElement,
  ShapeElement,
  ShapeKind,
  Project,
  TextElement,
} from '../types'
import { DEFAULT_FILTERS } from '../types'
import { uid } from './id'
import { getFormat, PROJECT_KINDS } from './formats'
import { buildTemplatePanels, TEMPLATES } from './templates'
import { shapeDef } from './shapes'

const base = (name: string, x: number, y: number, width: number, height: number) => ({
  id: uid('el_'),
  name,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
  blend: 'source-over' as const,
})

export function createPanel(x: number, y: number, width: number, height: number, points: number[] | null = null): PanelElement {
  return {
    ...base('Viñeta', x, y, width, height),
    type: 'panel',
    points,
    fill: '#ffffff',
    stroke: '#111111',
    strokeWidth: 5,
    cornerRadius: 0,
    image: null,
  }
}

export function createImage(assetId: string, x: number, y: number, width: number, height: number, name = 'Imagen'): ImageElement {
  return {
    ...base(name, x, y, width, height),
    type: 'image',
    assetId,
    crop: null,
    flipX: false,
    flipY: false,
    filters: { ...DEFAULT_FILTERS },
  }
}

const BUBBLE_NAMES: Record<BubbleShape, string> = {
  speech: 'Diálogo',
  thought: 'Pensamiento',
  shout: 'Grito',
  whisper: 'Susurro',
  box: 'Narración',
  'cloud-box': 'Recuadro nube',
}

export function createBubble(shape: BubbleShape, x: number, y: number, scale = 1): BubbleElement {
  const isBox = shape === 'box'
  const width = Math.round((isBox ? 320 : 280) * scale)
  const height = Math.round((isBox ? 110 : 170) * scale)
  return {
    ...base(BUBBLE_NAMES[shape], x, y, width, height),
    type: 'bubble',
    shape,
    text: isBox ? 'Mientras tanto, en la ciudad...' : shape === 'shout' ? '¡¿QUÉ?!' : shape === 'thought' ? 'Hmm...' : '¡Hola! Escribí acá.',
    fontFamily: isBox ? 'Special Elite' : shape === 'shout' ? 'Bangers' : 'Comic Neue',
    fontSize: Math.round((shape === 'shout' ? 36 : 26) * scale),
    fontStyle: shape === 'speech' || shape === 'whisper' ? 'bold' : 'normal',
    align: isBox ? 'left' : 'center',
    lineHeight: 1.15,
    letterSpacing: 0,
    textColor: '#111111',
    uppercase: shape !== 'box',
    fill: isBox ? '#fff6c9' : '#ffffff',
    stroke: '#111111',
    strokeWidth: 3,
    padding: Math.round(18 * scale),
    tail: !isBox && shape !== 'cloud-box',
    tailX: width * 0.3,
    tailY: height + 70 * scale,
  }
}

export interface TextPreset {
  id: string
  label: string
  patch: Partial<TextElement>
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'sfx-impact',
    label: 'SFX impacto',
    patch: { text: '¡BOOM!', fontFamily: 'Bangers', fontSize: 120, textColor: '#ffd23f', stroke: '#111111', strokeWidth: 8, skewX: -0.15, shadow: true, letterSpacing: 4 },
  },
  {
    id: 'sfx-manga',
    label: 'SFX manga',
    patch: { text: 'ドドド', fontFamily: 'Noto Sans JP', fontStyle: 'bold', fontSize: 110, textColor: '#111111', stroke: '#ffffff', strokeWidth: 6, skewX: 0, shadow: false },
  },
  {
    id: 'sfx-soft',
    label: 'SFX suave',
    patch: { text: 'fiuuu...', fontFamily: 'Permanent Marker', fontSize: 70, textColor: '#3aa7ff', stroke: '#ffffff', strokeWidth: 4, skewX: -0.1, shadow: false },
  },
  {
    id: 'title',
    label: 'Título',
    patch: { text: 'CAPÍTULO 1', fontFamily: 'Luckiest Guy', fontSize: 90, textColor: '#ffffff', stroke: '#111111', strokeWidth: 10, skewX: 0, shadow: true, letterSpacing: 2 },
  },
  {
    id: 'caption',
    label: 'Texto libre',
    patch: { text: 'Texto', fontFamily: 'Comic Neue', fontStyle: 'bold', fontSize: 32, textColor: '#111111', stroke: '#ffffff', strokeWidth: 0, skewX: 0, shadow: false, uppercase: false },
  },
]

export function createText(x: number, y: number, preset: TextPreset = TEXT_PRESETS[0]): TextElement {
  const el: TextElement = {
    ...base(preset.label, x, y, 420, 150),
    type: 'text',
    text: 'Texto',
    fontFamily: 'Bangers',
    fontSize: 90,
    fontStyle: 'normal',
    align: 'center',
    lineHeight: 1,
    letterSpacing: 0,
    textColor: '#111111',
    uppercase: false,
    stroke: '#ffffff',
    strokeWidth: 0,
    shadow: false,
    shadowColor: '#111111',
    skewX: 0,
    ...preset.patch,
  }
  el.height = Math.round(el.fontSize * 1.4)
  el.width = Math.max(200, Math.round(el.text.length * el.fontSize * 0.62 + 40))
  return el
}

const EFFECT_NAMES: Record<EffectKind, string> = {
  speedlines: 'Líneas de velocidad',
  focuslines: 'Líneas de impacto',
  screentone: 'Trama de puntos',
  'gradient-tone': 'Trama degradada',
}

export function createEffect(kind: EffectKind, x: number, y: number, width: number, height: number): EffectElement {
  return {
    ...base(EFFECT_NAMES[kind], x, y, width, height),
    type: 'effect',
    kind,
    color: '#111111',
    density: kind === 'focuslines' ? 140 : kind === 'speedlines' ? 70 : 12,
    lineWidth: kind === 'focuslines' ? 3 : 2,
    innerRadius: 0.45,
    angle: 0,
    dotSize: kind === 'screentone' ? 2.4 : 5,
    seed: Math.floor(Math.random() * 1e9),
    opacity: kind === 'screentone' || kind === 'gradient-tone' ? 0.8 : 1,
  }
}

export function createDrawing(width: number, height: number): DrawingElement {
  return {
    ...base('Capa de dibujo', 0, 0, width, height),
    type: 'drawing',
    baseWidth: width,
    baseHeight: height,
    strokes: [],
  }
}

export function createPage(name: string, format: PageFormat, templateId?: string): Page {
  const tpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined
  return {
    id: uid('pg_'),
    name,
    background: '#ffffff',
    elements: tpl ? buildTemplatePanels(tpl, format, format.margin, Math.round(format.width * 0.018)) : [],
  }
}

/**
 * `templateId`: plantilla para las páginas de contenido. `null` = páginas en blanco;
 * sin indicar = la recomendada para el tipo de obra.
 */
export function createProject(opts: { title: string; author: string; kind: Project['kind']; formatId?: string; pages?: number; templateId?: string | null; readingDirection?: Project['readingDirection'] }): Project {
  const kindDef = PROJECT_KINDS.find((k) => k.id === opts.kind) ?? PROJECT_KINDS[0]
  const format = getFormat(opts.formatId ?? kindDef.format)
  const now = Date.now()
  const count = Math.max(1, opts.pages ?? (opts.kind === 'webtoon' ? 3 : 4))
  const recommended = opts.kind === 'manga' ? 'manga-dynamic' : opts.kind === 'webtoon' ? 'webtoon-stack' : opts.kind === 'libre' ? 'grid-2x2' : 'classic-6'
  const defaultTpl = opts.templateId === null ? undefined : (opts.templateId ?? recommended)
  const pages: Page[] = []
  for (let i = 0; i < count; i++) {
    if (i === 0 && opts.kind !== 'webtoon') {
      const cover = createPage('Portada', format)
      cover.background = '#111111'
      const title = createText(0, 0, TEXT_PRESETS[3])
      title.text = opts.title.toUpperCase()
      title.fontSize = Math.round(format.width * 0.09)
      title.width = format.width - format.margin * 2
      title.lineHeight = 1.05
      title.height = Math.round(title.fontSize * (title.text.length * title.fontSize * 0.55 > title.width ? 2.4 : 1.3))
      title.x = format.margin
      title.y = Math.round(format.height * 0.1)
      title.name = 'Título'
      const author = createText(0, 0, TEXT_PRESETS[4])
      author.text = opts.author || 'Autor'
      author.fontSize = Math.round(format.width * 0.035)
      author.textColor = '#ffffff'
      author.width = format.width - format.margin * 2
      author.height = Math.round(author.fontSize * 1.5)
      author.x = format.margin
      author.y = Math.round(format.height * 0.1 + title.height + 10)
      author.name = 'Autor'
      const art = createPanel(format.margin, Math.round(format.height * 0.3), format.width - format.margin * 2, Math.round(format.height * 0.62))
      art.name = 'Ilustración de portada'
      art.stroke = '#ffffff'
      art.fill = '#262626'
      cover.elements = [art, title, author]
      pages.push(cover)
    } else {
      pages.push(createPage(`Página ${i + (opts.kind === 'webtoon' ? 1 : 0)}`, format, defaultTpl))
    }
  }
  return {
    id: uid('pr_'),
    version: 1,
    title: opts.title,
    author: opts.author,
    synopsis: '',
    kind: opts.kind,
    format,
    readingDirection: opts.readingDirection ?? kindDef.direction,
    pages,
    assets: [],
    thumbnail: null,
    createdAt: now,
    updatedAt: now,
  }
}

/** Copia profunda con ids nuevos (duplicar / pegar). */
export function cloneElement<T extends { id: string; name: string }>(el: T, offset = 24): T {
  const copy = structuredClone(el) as T & { x: number; y: number; type: string }
  copy.id = uid('el_')
  if (copy.type !== 'drawing') {
    copy.x += offset
    copy.y += offset
  }
  return copy
}

export function clonePage(page: Page): Page {
  return {
    ...structuredClone(page),
    id: uid('pg_'),
    name: `${page.name} (copia)`,
    elements: page.elements.map((e) => cloneElement(e, 0)),
  }
}

export function createShape(kind: ShapeKind, x: number, y: number, size: number): ShapeElement {
  const def = shapeDef(kind)
  const w = Math.round(def.aspect >= 1 ? size / def.aspect : size)
  const h = Math.round(def.aspect >= 1 ? size : size * def.aspect)
  return {
    ...base(def.label, x, y, w, h),
    type: 'shape',
    shape: kind,
    fill: def.fill,
    stroke: def.stroke,
    strokeWidth: def.mode === 'stroke' ? Math.max(4, Math.round(size / 18)) : Math.max(2, Math.round(size / 60)),
  }
}
