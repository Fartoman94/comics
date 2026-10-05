// Validación del formato de proyecto (.vineta y lo guardado en IndexedDB).
// Nada de lo que viene de afuera se guarda ni se dibuja sin pasar por acá: un archivo dañado
// o malicioso no debe poder dejar la app en blanco.
import type {
  Asset,
  Script,
  ScriptKind,
  BlendMode,
  BrushKind,
  BubbleShape,
  ComicElement,
  EffectKind,
  ImageFilters,
  Page,
  PageFormat,
  Project,
  Stroke,
  TextStyle,
  ShapeKind,
} from '../types'

export const SUPPORTED_FILE_VERSION = 1

export const LIMITS = {
  fileBytes: 400 * 1024 * 1024,
  blobBytes: 40 * 1024 * 1024,
  pages: 500,
  elementsPerPage: 2000,
  strokesPerDrawing: 20000,
  pointsPerStroke: 50000,
  totalPoints: 3_000_000,
  assets: 2000,
  formatSide: 10000,
  assetSide: 20000,
  coord: 200000,
  text: 20000,
  shortText: 300,
}

const PROJECT_KINDS = ['comic', 'manga', 'webtoon', 'libre'] as const
const DIRECTIONS = ['ltr', 'rtl', 'vertical'] as const
const BLENDS: BlendMode[] = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'luminosity']
const SHAPES: BubbleShape[] = ['speech', 'thought', 'shout', 'whisper', 'impact', 'borderless', 'box', 'rounded-box', 'cloud-box']
const EFFECTS: EffectKind[] = ['speedlines', 'focuslines', 'screentone', 'gradient-tone']
const SHAPE_KINDS: ShapeKind[] = ['rect', 'ellipse', 'triangle', 'star', 'arrow', 'line', 'heart', 'anger', 'sweat', 'exclaim', 'question', 'music', 'sparkle']
const BRUSHES: BrushKind[] = ['pen', 'ink', 'pencil', 'marker']
const FONT_STYLES: TextStyle['fontStyle'][] = ['normal', 'bold', 'italic', 'bold italic']
const ALIGNS: TextStyle['align'][] = ['left', 'center', 'right']
export const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** Error con un mensaje apto para mostrarle al usuario. `detail` es técnico (consola). */
export class ProjectFileError extends Error {
  readonly detail: string
  constructor(message: string, detail = '') {
    super(message)
    this.name = 'ProjectFileError'
    this.detail = detail
  }
}

const MSG = {
  notJson: 'El archivo está dañado o no es un proyecto de Viñeta Studio.',
  notOurs: 'El archivo no es un proyecto de Viñeta Studio.',
  invalid: 'El proyecto tiene datos dañados y no se puede abrir.',
  tooBig: 'El archivo es demasiado grande para abrirlo en el navegador.',
  limits: 'El proyecto supera los límites de Viñeta Studio (páginas, elementos o tamaño).',
  brokenRefs: 'El proyecto tiene imágenes que faltan en el archivo (referencias rotas).',
  badImage: 'Una de las imágenes del archivo está dañada o no es un formato admitido.',
  newer: (v: unknown) => `Este archivo es de una versión más nueva de Viñeta Studio (v${String(v)}). Actualizá la página e intentá de nuevo.`,
}

// ---------- Primitivas ----------

class Bad extends Error {
  readonly kind: 'invalid' | 'limits'
  constructor(path: string, what: string, kind: 'invalid' | 'limits' = 'invalid') {
    super(`${path}: ${what}`)
    this.kind = kind
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function obj(v: unknown, p: string) {
  if (!isObj(v)) throw new Bad(p, 'se esperaba un objeto')
  return v
}
function arr(v: unknown, p: string, max: number) {
  if (!Array.isArray(v)) throw new Bad(p, 'se esperaba una lista')
  if (v.length > max) throw new Bad(p, `más de ${max} ítems`, 'limits')
  return v
}
function str(v: unknown, p: string, max = LIMITS.shortText, fallback?: string): string {
  if (v === undefined && fallback !== undefined) return fallback
  if (typeof v !== 'string') throw new Bad(p, 'se esperaba texto')
  if (v.length > max) throw new Bad(p, `texto de más de ${max} caracteres`, 'limits')
  return v
}
function num(v: unknown, p: string, min: number, max: number, fallback?: number): number {
  if (v === undefined && fallback !== undefined) return fallback
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Bad(p, 'se esperaba un número')
  if (v < min || v > max) throw new Bad(p, `fuera de rango (${min}..${max})`, 'limits')
  return v
}
function bool(v: unknown, p: string, fallback?: boolean): boolean {
  if (v === undefined && fallback !== undefined) return fallback
  if (typeof v !== 'boolean') throw new Bad(p, 'se esperaba verdadero/falso')
  return v
}
function oneOf<T extends string>(v: unknown, p: string, list: readonly T[], fallback?: T): T {
  if (v === undefined && fallback !== undefined) return fallback
  if (typeof v !== 'string' || !(list as readonly string[]).includes(v)) throw new Bad(p, `valor no admitido (${String(v).slice(0, 40)})`)
  return v as T
}
const id = (v: unknown, p: string) => {
  const s = str(v, p, 80)
  if (!/^[\w-]{1,80}$/.test(s)) throw new Bad(p, 'id inválido')
  return s
}
const color = (v: unknown, p: string, fallback?: string) => str(v, p, 64, fallback)
const C = LIMITS.coord

// ---------- Partes del documento ----------

function format(v: unknown, p: string): PageFormat {
  const o = obj(v, p)
  const width = num(o.width, `${p}.width`, 50, LIMITS.formatSide)
  const height = num(o.height, `${p}.height`, 50, LIMITS.formatSide)
  return {
    id: str(o.id, `${p}.id`, 80),
    name: str(o.name, `${p}.name`, LIMITS.shortText, ''),
    description: str(o.description, `${p}.description`, LIMITS.shortText, ''),
    width,
    height,
    margin: num(o.margin, `${p}.margin`, 0, Math.max(width, height) / 2, 0),
    bleed: num(o.bleed, `${p}.bleed`, 0, Math.max(width, height) / 2, 0),
  }
}

function filters(v: unknown, p: string): ImageFilters {
  const o = obj(v, p)
  return {
    grayscale: bool(o.grayscale, `${p}.grayscale`, false),
    sepia: bool(o.sepia, `${p}.sepia`, false),
    invert: bool(o.invert, `${p}.invert`, false),
    brightness: num(o.brightness, `${p}.brightness`, -1, 1, 0),
    contrast: num(o.contrast, `${p}.contrast`, -100, 100, 0),
    threshold: num(o.threshold, `${p}.threshold`, 0, 1, 0),
    blur: num(o.blur, `${p}.blur`, 0, 100, 0),
  }
}

function baseEl(o: Record<string, unknown>, p: string) {
  const out = {
    id: id(o.id, `${p}.id`),
    name: str(o.name, `${p}.name`, LIMITS.shortText, ''),
    x: num(o.x, `${p}.x`, -C, C),
    y: num(o.y, `${p}.y`, -C, C),
    width: num(o.width, `${p}.width`, 0, C),
    height: num(o.height, `${p}.height`, 0, C),
    rotation: num(o.rotation, `${p}.rotation`, -1e6, 1e6, 0),
    opacity: num(o.opacity, `${p}.opacity`, 0, 1, 1),
    locked: bool(o.locked, `${p}.locked`, false),
    hidden: bool(o.hidden, `${p}.hidden`, false),
  }
  return o.blend === undefined ? out : { ...out, blend: oneOf(o.blend, `${p}.blend`, BLENDS) }
}

function textStyle(o: Record<string, unknown>, p: string): TextStyle {
  const t: TextStyle = {
    text: str(o.text, `${p}.text`, LIMITS.text),
    fontFamily: str(o.fontFamily, `${p}.fontFamily`, 120),
    fontSize: num(o.fontSize, `${p}.fontSize`, 1, 5000),
    fontStyle: oneOf(o.fontStyle, `${p}.fontStyle`, FONT_STYLES, 'normal'),
    align: oneOf(o.align, `${p}.align`, ALIGNS, 'center'),
    lineHeight: num(o.lineHeight, `${p}.lineHeight`, 0.1, 10, 1.2),
    letterSpacing: num(o.letterSpacing, `${p}.letterSpacing`, -500, 500, 0),
    textColor: color(o.textColor, `${p}.textColor`, '#111111'),
    uppercase: bool(o.uppercase, `${p}.uppercase`, false),
  }
  if (o.vertical !== undefined) t.vertical = bool(o.vertical, `${p}.vertical`)
  return t
}

function stroke(v: unknown, p: string, budget: { points: number }): Stroke {
  const o = obj(v, p)
  const pts = arr(o.points, `${p}.points`, LIMITS.pointsPerStroke)
  budget.points += pts.length
  if (budget.points > LIMITS.totalPoints) throw new Bad(p, 'demasiados puntos de dibujo', 'limits')
  const points = pts.map((pt, i) => {
    const a = arr(pt, `${p}.points[${i}]`, 3)
    if (a.length !== 3) throw new Bad(`${p}.points[${i}]`, 'punto inválido')
    return [num(a[0], `${p}.points[${i}][0]`, -C, C), num(a[1], `${p}.points[${i}][1]`, -C, C), num(a[2], `${p}.points[${i}][2]`, 0, 1)] as [number, number, number]
  })
  return {
    points,
    color: color(o.color, `${p}.color`),
    size: num(o.size, `${p}.size`, 0, 2000),
    opacity: num(o.opacity, `${p}.opacity`, 0, 1, 1),
    brush: oneOf(o.brush, `${p}.brush`, BRUSHES, 'ink'),
    erase: bool(o.erase, `${p}.erase`, false),
  }
}

function element(v: unknown, p: string, budget: { points: number }): ComicElement {
  const o = obj(v, p)
  const b = baseEl(o, p)
  switch (o.type) {
    case 'panel': {
      let points: number[] | null = null
      if (o.points !== null && o.points !== undefined) {
        const pts = arr(o.points, `${p}.points`, 400)
        if (pts.length % 2) throw new Bad(`${p}.points`, 'cantidad impar de coordenadas')
        points = pts.map((n, i) => num(n, `${p}.points[${i}]`, -10, 10))
      }
      let image: Extract<ComicElement, { type: 'panel' }>['image'] = null
      if (o.image !== null && o.image !== undefined) {
        const im = obj(o.image, `${p}.image`)
        image = {
          assetId: id(im.assetId, `${p}.image.assetId`),
          x: num(im.x, `${p}.image.x`, -C, C),
          y: num(im.y, `${p}.image.y`, -C, C),
          scale: num(im.scale, `${p}.image.scale`, 0.0001, 1000),
          filters: im.filters === undefined ? filters({}, `${p}.image.filters`) : filters(im.filters, `${p}.image.filters`),
          ...(im.rotation === undefined ? {} : { rotation: num(im.rotation, `${p}.image.rotation`, -3600, 3600, 0) }),
          ...(im.flipX === undefined ? {} : { flipX: bool(im.flipX, `${p}.image.flipX`, false) }),
          ...(im.flipY === undefined ? {} : { flipY: bool(im.flipY, `${p}.image.flipY`, false) }),
        }
      }
      return {
        ...b,
        type: 'panel',
        points,
        fill: color(o.fill, `${p}.fill`, '#ffffff'),
        stroke: color(o.stroke, `${p}.stroke`, '#111111'),
        strokeWidth: num(o.strokeWidth, `${p}.strokeWidth`, 0, 1000, 0),
        cornerRadius: num(o.cornerRadius, `${p}.cornerRadius`, 0, 10000, 0),
        image,
        ...(o.padding === undefined ? {} : { padding: num(o.padding, `${p}.padding`, 0, 5000, 0) }),
      }
    }
    case 'shape':
      return {
        ...b,
        type: 'shape',
        shape: oneOf(o.shape, `${p}.shape`, SHAPE_KINDS),
        fill: color(o.fill, `${p}.fill`, '#ffffff'),
        stroke: color(o.stroke, `${p}.stroke`, '#111111'),
        strokeWidth: num(o.strokeWidth, `${p}.strokeWidth`, 0, 1000, 0),
      }
    case 'image': {
      let crop = null
      if (o.crop !== null && o.crop !== undefined) {
        const c = obj(o.crop, `${p}.crop`)
        crop = { x: num(c.x, `${p}.crop.x`, -C, C), y: num(c.y, `${p}.crop.y`, -C, C), width: num(c.width, `${p}.crop.width`, 0, C), height: num(c.height, `${p}.crop.height`, 0, C) }
      }
      return {
        ...b,
        type: 'image',
        assetId: id(o.assetId, `${p}.assetId`),
        crop,
        flipX: bool(o.flipX, `${p}.flipX`, false),
        flipY: bool(o.flipY, `${p}.flipY`, false),
        filters: o.filters === undefined ? filters({}, `${p}.filters`) : filters(o.filters, `${p}.filters`),
      }
    }
    case 'bubble':
      return {
        ...b,
        ...textStyle(o, p),
        type: 'bubble',
        shape: oneOf(o.shape, `${p}.shape`, SHAPES),
        fill: color(o.fill, `${p}.fill`, '#ffffff'),
        stroke: color(o.stroke, `${p}.stroke`, '#111111'),
        strokeWidth: num(o.strokeWidth, `${p}.strokeWidth`, 0, 1000, 0),
        padding: num(o.padding, `${p}.padding`, 0, 5000, 0),
        tail: bool(o.tail, `${p}.tail`, false),
        tailX: num(o.tailX, `${p}.tailX`, -C, C, 0),
        tailY: num(o.tailY, `${p}.tailY`, -C, C, 0),
        ...(o.tailWidth === undefined ? {} : { tailWidth: num(o.tailWidth, `${p}.tailWidth`, 0.05, 10, 1) }),
        ...(o.cornerRadius === undefined ? {} : { cornerRadius: num(o.cornerRadius, `${p}.cornerRadius`, 0, 10000, 0) }),
      }
    case 'text':
      return {
        ...b,
        ...textStyle(o, p),
        type: 'text',
        stroke: color(o.stroke, `${p}.stroke`, '#ffffff'),
        strokeWidth: num(o.strokeWidth, `${p}.strokeWidth`, 0, 1000, 0),
        shadow: bool(o.shadow, `${p}.shadow`, false),
        shadowColor: color(o.shadowColor, `${p}.shadowColor`, '#000000'),
        skewX: num(o.skewX, `${p}.skewX`, -5, 5, 0),
      }
    case 'effect':
      return {
        ...b,
        type: 'effect',
        kind: oneOf(o.kind, `${p}.kind`, EFFECTS),
        color: color(o.color, `${p}.color`, '#111111'),
        density: num(o.density, `${p}.density`, 0.1, 5000),
        lineWidth: num(o.lineWidth, `${p}.lineWidth`, 0, 1000, 1),
        innerRadius: num(o.innerRadius, `${p}.innerRadius`, 0, 1, 0.3),
        angle: num(o.angle, `${p}.angle`, -100000, 100000, 0),
        dotSize: num(o.dotSize, `${p}.dotSize`, 0, 1000, 2),
        seed: num(o.seed, `${p}.seed`, -1e12, 1e12, 1),
      }
    case 'drawing':
      return {
        ...b,
        type: 'drawing',
        baseWidth: num(o.baseWidth, `${p}.baseWidth`, 1, LIMITS.formatSide * 2),
        baseHeight: num(o.baseHeight, `${p}.baseHeight`, 1, LIMITS.formatSide * 2),
        strokes: arr(o.strokes, `${p}.strokes`, LIMITS.strokesPerDrawing).map((s, i) => stroke(s, `${p}.strokes[${i}]`, budget)),
      }
    default:
      throw new Bad(`${p}.type`, `tipo de elemento desconocido (${String(o.type).slice(0, 40)})`)
  }
}

function page(v: unknown, p: string, budget: { points: number }): Page {
  const o = obj(v, p)
  return {
    id: id(o.id, `${p}.id`),
    name: str(o.name, `${p}.name`, LIMITS.shortText, ''),
    background: color(o.background, `${p}.background`, '#ffffff'),
    elements: arr(o.elements, `${p}.elements`, LIMITS.elementsPerPage).map((e, i) => element(e, `${p}.elements[${i}]`, budget)),
  }
}

function asset(v: unknown, p: string): Asset {
  const o = obj(v, p)
  return {
    id: id(o.id, `${p}.id`),
    name: str(o.name, `${p}.name`, LIMITS.shortText, 'imagen'),
    width: num(o.width, `${p}.width`, 1, LIMITS.assetSide),
    height: num(o.height, `${p}.height`, 1, LIMITS.assetSide),
    mime: str(o.mime, `${p}.mime`, 80, 'image/png'),
    createdAt: num(o.createdAt, `${p}.createdAt`, 0, 1e15, 0),
    ...(typeof o.hash === 'string' && /^[0-9a-f]{64}$/.test(o.hash) ? { hash: o.hash } : {}),
  }
}

const SCRIPT_KINDS: ScriptKind[] = ['description', 'dialogue', 'thought', 'caption', 'sfx']

function script(v: unknown, p: string): Script {
  const o = obj(v, p)
  const pages = obj(o.pages ?? {}, `${p}.pages`)
  const keys = Object.keys(pages)
  if (keys.length > LIMITS.pages * 2) throw new Bad(`${p}.pages`, 'demasiadas páginas en el guion', 'limits')
  const out: Script = { pages: {} }
  for (const key of keys) {
    id(key, `${p}.pages[${key}]`)
    const pg = obj(pages[key], `${p}.pages.${key}`)
    out.pages[key] = {
      panels: arr(pg.panels, `${p}.pages.${key}.panels`, 200).map((pv, i) => {
        const pp = `${p}.pages.${key}.panels[${i}]`
        const pan = obj(pv, pp)
        return {
          id: id(pan.id, `${pp}.id`),
          panelId: pan.panelId === null || pan.panelId === undefined ? null : id(pan.panelId, `${pp}.panelId`),
          blocks: arr(pan.blocks, `${pp}.blocks`, 300).map((bv, j) => {
            const bp = `${pp}.blocks[${j}]`
            const b = obj(bv, bp)
            const block: Script['pages'][string]['panels'][number]['blocks'][number] = {
              id: id(b.id, `${bp}.id`),
              kind: oneOf(b.kind, `${bp}.kind`, SCRIPT_KINDS),
              text: str(b.text, `${bp}.text`, LIMITS.text, ''),
            }
            if (b.character !== undefined) block.character = str(b.character, `${bp}.character`, LIMITS.shortText)
            if (b.placedElementId !== undefined && b.placedElementId !== null) block.placedElementId = id(b.placedElementId, `${bp}.placedElementId`)
            return block
          }),
        }
      }),
    }
  }
  return out
}

/** Ids de recursos referenciados por las páginas. */
export function referencedAssetIds(pages: Page[]): Set<string> {
  const out = new Set<string>()
  for (const pg of pages)
    for (const el of pg.elements) {
      if (el.type === 'image') out.add(el.assetId)
      if (el.type === 'panel' && el.image) out.add(el.image.assetId)
    }
  return out
}

/**
 * Valida y normaliza un proyecto. Devuelve un objeto nuevo sólo con los campos conocidos.
 * Tira ProjectFileError con un mensaje para el usuario si algo no cierra.
 */
export function validateProject(raw: unknown): Project {
  try {
    const o = obj(raw, 'project')
    const version = o.version === undefined ? 1 : o.version
    if (typeof version !== 'number' || version > SUPPORTED_FILE_VERSION) throw new ProjectFileError(MSG.newer(version))
    const budget = { points: 0 }
    const pages = arr(o.pages, 'project.pages', LIMITS.pages).map((pg, i) => page(pg, `project.pages[${i}]`, budget))
    if (!pages.length) throw new Bad('project.pages', 'el proyecto no tiene páginas')
    const assets = arr(o.assets ?? [], 'project.assets', LIMITS.assets).map((a, i) => asset(a, `project.assets[${i}]`))
    // Ids únicos: dos elementos con el mismo id rompen la selección y el historial.
    const seen = new Set<string>()
    const unique = (v: string, p: string) => {
      if (seen.has(v)) throw new Bad(p, `id repetido (${v})`)
      seen.add(v)
    }
    pages.forEach((pg, i) => {
      unique(pg.id, `project.pages[${i}].id`)
      pg.elements.forEach((el, j) => unique(el.id, `project.pages[${i}].elements[${j}].id`))
    })
    assets.forEach((a, i) => unique(a.id, `project.assets[${i}].id`))
    const known = new Set(assets.map((a) => a.id))
    for (const ref of referencedAssetIds(pages)) if (!known.has(ref)) throw new ProjectFileError(MSG.brokenRefs, `recurso ${ref} no está en project.assets`)
    const thumb = typeof o.thumbnail === 'string' && o.thumbnail.length < 3_000_000 && /^data:image\/(png|jpeg|webp);base64,/.test(o.thumbnail) ? o.thumbnail : null
    return {
      id: id(o.id, 'project.id'),
      version: 1,
      title: str(o.title, 'project.title', LIMITS.shortText),
      author: str(o.author, 'project.author', LIMITS.shortText, ''),
      synopsis: str(o.synopsis, 'project.synopsis', LIMITS.text, ''),
      kind: oneOf(o.kind, 'project.kind', PROJECT_KINDS, 'comic'),
      format: format(o.format, 'project.format'),
      readingDirection: oneOf(o.readingDirection, 'project.readingDirection', DIRECTIONS, 'ltr'),
      pages,
      assets,
      thumbnail: thumb,
      ...(o.script === undefined || o.script === null ? {} : { script: script(o.script, 'project.script') }),
      createdAt: num(o.createdAt, 'project.createdAt', 0, 1e15, 0),
      updatedAt: num(o.updatedAt, 'project.updatedAt', 0, 1e15, 0),
    }
  } catch (e) {
    if (e instanceof ProjectFileError) throw e
    if (e instanceof Bad) throw new ProjectFileError(e.kind === 'limits' ? MSG.limits : MSG.invalid, e.message)
    throw new ProjectFileError(MSG.invalid, String(e))
  }
}

// ---------- Imágenes embebidas ----------

const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/gif': (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  'image/webp': (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
}

/**
 * Decodifica un data URL de imagen sin hacer fetch (nunca se pide nada a la red).
 * Sólo PNG, JPEG, WebP y GIF, y el contenido tiene que coincidir con el tipo declarado.
 */
export function decodeImageDataUrl(src: unknown): { mime: string; bytes: Uint8Array } {
  if (typeof src !== 'string') throw new ProjectFileError(MSG.badImage, 'blob no es texto')
  const head = src.slice(0, 40)
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,/.exec(head)
  if (!m) throw new ProjectFileError(MSG.badImage, `blob no es un data URL de imagen admitido (${head.slice(0, 30)})`)
  const b64 = src.slice(m[0].length)
  if (b64.length * 0.75 > LIMITS.blobBytes) throw new ProjectFileError(MSG.tooBig, 'imagen embebida demasiado grande')
  let bin: string
  try {
    bin = atob(b64)
  } catch {
    throw new ProjectFileError(MSG.badImage, 'base64 inválido')
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  if (!MAGIC[m[1]](bytes)) throw new ProjectFileError(MSG.badImage, `el contenido no es ${m[1]}`)
  return { mime: m[1], bytes }
}

export interface ParsedProjectFile {
  project: Project
  blobs: Map<string, { mime: string; bytes: Uint8Array }>
}

/** Parsea y valida un .vineta completo en memoria, antes de escribir nada. */
export function parseProjectFile(text: string): ParsedProjectFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new ProjectFileError(MSG.notJson, String(e))
  }
  if (!isObj(data) || data.app !== 'vineta-studio' || !isObj(data.project)) throw new ProjectFileError(MSG.notOurs)
  if (data.version !== undefined && (typeof data.version !== 'number' || data.version > SUPPORTED_FILE_VERSION)) throw new ProjectFileError(MSG.newer(data.version))
  const project = validateProject(data.project)
  const rawBlobs = data.blobs === undefined ? {} : data.blobs
  if (!isObj(rawBlobs)) throw new ProjectFileError(MSG.invalid, 'blobs no es un objeto')
  const blobs = new Map<string, { mime: string; bytes: Uint8Array }>()
  for (const a of project.assets) {
    if (rawBlobs[a.id] === undefined) continue // el original tampoco tenía la imagen: queda vacía, igual que antes
    blobs.set(a.id, decodeImageDataUrl(rawBlobs[a.id]))
  }
  return { project, blobs }
}

/** Reemplaza ids de recursos en todas las referencias del documento (in place). */
export function remapAssetIds(project: Project, map: Map<string, string>) {
  const r = (v: string) => map.get(v) ?? v
  for (const a of project.assets) a.id = r(a.id)
  for (const pg of project.pages)
    for (const el of pg.elements) {
      if (el.type === 'image') el.assetId = r(el.assetId)
      if (el.type === 'panel' && el.image) el.image.assetId = r(el.image.assetId)
    }
}
