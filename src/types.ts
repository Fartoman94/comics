export type ReadingDirection = 'ltr' | 'rtl' | 'vertical'

export interface PageFormat {
  id: string
  name: string
  description: string
  width: number
  height: number
  /** Margen interior sugerido (zona segura) en px. */
  margin: number
  /** Sangrado para imprenta en px. */
  bleed: number
}

export interface Asset {
  id: string
  name: string
  width: number
  height: number
  mime: string
  createdAt: number
  /** SHA-256 del archivo original (para no duplicar la misma imagen). */
  hash?: string
}

export interface ImageFilters {
  grayscale: boolean
  sepia: boolean
  invert: boolean
  /** -1..1 */
  brightness: number
  /** -100..100 */
  contrast: number
  /** 0 = apagado, 0..1 umbral para efecto "tinta" */
  threshold: number
  /** 0 = apagado */
  blur: number
}

export const DEFAULT_FILTERS: ImageFilters = {
  grayscale: false,
  sepia: false,
  invert: false,
  brightness: 0,
  contrast: 0,
  threshold: 0,
  blur: 0,
}

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'luminosity'

interface BaseElement {
  /** Modo de fusión con lo que hay debajo (para superponer imágenes, tramas, etc.). */
  blend?: BlendMode
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  hidden: boolean
}

export interface PanelImage {
  assetId: string
  /** Posición de la imagen relativa a la esquina del panel. */
  x: number
  y: number
  /** Escala relativa al tamaño natural de la imagen. */
  scale: number
  filters: ImageFilters
  /** Giro en grados alrededor del centro de la imagen (opcional, .vineta viejos sin giro). */
  rotation?: number
  flipX?: boolean
  flipY?: boolean
}

export interface PanelElement extends BaseElement {
  type: 'panel'
  /** Polígono normalizado (0..1) dentro del bounding box. Null = rectángulo. */
  points: number[] | null
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
  image: PanelImage | null
  /** Margen interior entre el borde y la imagen (px). Opcional: los .vineta viejos no lo tienen. */
  padding?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  assetId: string
  /** Recorte en píxeles de la imagen original. Null = imagen completa. */
  crop: { x: number; y: number; width: number; height: number } | null
  flipX: boolean
  flipY: boolean
  filters: ImageFilters
}

export type BubbleShape = 'speech' | 'thought' | 'shout' | 'whisper' | 'box' | 'cloud-box'

export interface TextStyle {
  text: string
  fontFamily: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic'
  align: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  textColor: string
  uppercase: boolean
  /** Escritura vertical (tategaki), de arriba hacia abajo y columnas de derecha a izquierda. */
  vertical?: boolean
}

export interface BubbleElement extends BaseElement, TextStyle {
  type: 'bubble'
  shape: BubbleShape
  fill: string
  stroke: string
  strokeWidth: number
  padding: number
  tail: boolean
  /** Punta de la cola, relativa a la esquina del globo. */
  tailX: number
  tailY: number
}

export interface TextElement extends BaseElement, TextStyle {
  type: 'text'
  stroke: string
  strokeWidth: number
  shadow: boolean
  shadowColor: string
  skewX: number
}

export type EffectKind = 'speedlines' | 'focuslines' | 'screentone' | 'gradient-tone'

export interface EffectElement extends BaseElement {
  type: 'effect'
  kind: EffectKind
  color: string
  /** Cantidad de líneas o separación de puntos. */
  density: number
  lineWidth: number
  /** Focus lines: radio interior libre (0..1). */
  innerRadius: number
  /** Speed lines: ángulo en grados. */
  angle: number
  /** Screentone: tamaño del punto. */
  dotSize: number
  seed: number
}

export interface Stroke {
  /** [x, y, pressure] relativos a la capa de dibujo en su tamaño base. */
  points: [number, number, number][]
  color: string
  size: number
  opacity: number
  brush: BrushKind
  erase: boolean
}

export type BrushKind = 'pen' | 'ink' | 'pencil' | 'marker'

export interface DrawingElement extends BaseElement {
  type: 'drawing'
  baseWidth: number
  baseHeight: number
  strokes: Stroke[]
}

/** Formas simples y símbolos de manga (vena de enojo, gota de sudor, nota musical…). */
export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'arrow' | 'line' | 'heart' | 'anger' | 'sweat' | 'exclaim' | 'question' | 'music' | 'sparkle'

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: ShapeKind
  fill: string
  stroke: string
  strokeWidth: number
}

export type ComicElement =
  | PanelElement
  | ShapeElement
  | ImageElement
  | BubbleElement
  | TextElement
  | EffectElement
  | DrawingElement

export type ElementType = ComicElement['type']

export interface Page {
  id: string
  name: string
  background: string
  elements: ComicElement[]
}

/** Guion liviano (opcional): por página y por viñeta, asociado por id (no por posición). */
export type ScriptKind = 'description' | 'dialogue' | 'thought' | 'caption' | 'sfx'

export interface ScriptBlock {
  id: string
  kind: ScriptKind
  text: string
  /** Quién habla (diálogo / pensamiento). */
  character?: string
  /** Elemento de la página creado con "Colocar". Su texto puede divergir del guion. */
  placedElementId?: string | null
}

export interface ScriptPanel {
  id: string
  /** Viñeta de la página a la que pertenece; null = bloques de la página sin viñeta asignada. */
  panelId: string | null
  blocks: ScriptBlock[]
}

export interface Script {
  /** Clave: id de la página. */
  pages: Record<string, { panels: ScriptPanel[] }>
}

export interface Project {
  id: string
  version: 1
  title: string
  author: string
  synopsis: string
  kind: 'comic' | 'manga' | 'webtoon' | 'libre'
  format: PageFormat
  readingDirection: ReadingDirection
  pages: Page[]
  assets: Asset[]
  thumbnail: string | null
  /** Guion opcional (agregado sin cambiar la versión del archivo: los .vineta viejos no lo tienen). */
  script?: Script
  createdAt: number
  updatedAt: number
}

export type Tool = 'select' | 'hand' | 'panel' | 'bubble' | 'text' | 'brush' | 'eraser'

export interface BrushSettings {
  kind: BrushKind
  color: string
  size: number
  opacity: number
  eraserSize: number
}
