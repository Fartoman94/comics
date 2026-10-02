// Planificación de exportaciones grandes, sin tocar el DOM (testeable).

/**
 * Límites conservadores de canvas que funcionan en todos los navegadores, incluido Safari en
 * iPhone/iPad: 16.777.216 px de área y 16.384 px por lado.
 */
export const CANVAS_LIMITS = { area: 16_777_216, side: 16_384 }

export type ImageFormat = 'jpg' | 'png'
export type StripMode = 'continuous' | 'pages' | 'slices'

export interface StripOptions {
  title: string
  pageWidth: number
  pageHeight: number
  /** Índices de página incluidos (0..n-1), en orden. */
  pages: number[]
  targetWidth: number
  format: ImageFormat
  /** 0..1 (sólo JPG). */
  quality: number
  mode: StripMode
  /** Alto máximo por archivo en el modo por segmentos (px finales). */
  sliceMaxHeight: number
}

export interface StripPart {
  /** Índice de página del proyecto. */
  page: number
  /** Franja de la página en px finales (ya escalados). */
  srcY: number
  height: number
  /** Dónde va dentro del archivo de salida. */
  dstY: number
}

export interface StripFile {
  name: string
  width: number
  height: number
  parts: StripPart[]
}

export interface StripPlan {
  files: StripFile[]
  scale: number
  totalHeight: number
  /** Se pidió una tira continua pero no entra en un canvas seguro: se segmentó. */
  segmentedForSafety: boolean
  estimatedBytes: number
}

/** Alto máximo seguro para un canvas de este ancho. */
export function maxSafeHeight(width: number) {
  return Math.max(1, Math.min(CANVAS_LIMITS.side, Math.floor(CANVAS_LIMITS.area / Math.max(1, width))))
}

export const isSafeCanvas = (w: number, h: number) => w > 0 && h > 0 && w <= CANVAS_LIMITS.side && h <= CANVAS_LIMITS.side && w * h <= CANVAS_LIMITS.area

/** Nombres que se ordenan bien en cualquier explorador: titulo-001.png */
export const numbered = (base: string, i: number, total: number, ext: string) => `${base}-${String(i + 1).padStart(Math.max(3, String(total).length), '0')}.${ext}`

/** Peso aproximado por píxel (cómic: mucho blanco y línea negra). */
export function bytesPerPixel(format: ImageFormat, quality: number) {
  return format === 'png' ? 0.9 : 0.08 + quality * quality * 0.5
}

/**
 * Arma el plan de archivos: tira continua si es segura; si no, segmentos que nunca pasan los
 * límites de canvas; o una imagen por página (también segmentada si una sola página es enorme).
 */
export function planStrip(o: StripOptions): StripPlan {
  const scale = o.targetWidth / o.pageWidth
  const w = Math.round(o.targetWidth)
  const ph = Math.round(o.pageHeight * scale)
  const totalHeight = ph * o.pages.length
  const safeMax = maxSafeHeight(w)
  const ext = o.format === 'png' ? 'png' : 'jpg'
  let mode = o.mode
  let segmentedForSafety = false
  if (mode === 'continuous' && !isSafeCanvas(w, totalHeight)) {
    mode = 'slices'
    segmentedForSafety = true
  }
  const sliceMax = Math.max(64, Math.min(safeMax, mode === 'slices' && !segmentedForSafety ? o.sliceMaxHeight : safeMax))

  // Bandas: lista continua de (página, desde, alto) en px finales.
  const cut = (maxH: number, groups: number[][]): StripFile[] => {
    const files: StripFile[] = []
    for (const group of groups) {
      let cur: StripFile | null = null
      for (const page of group) {
        let srcY = 0
        while (srcY < ph) {
          if (!cur || cur.height >= maxH) {
            cur = { name: '', width: w, height: 0, parts: [] }
            files.push(cur)
          }
          const take = Math.min(ph - srcY, maxH - cur.height)
          cur.parts.push({ page, srcY, height: take, dstY: cur.height })
          cur.height += take
          srcY += take
        }
      }
      cur = null
    }
    return files
  }

  const files =
    mode === 'continuous' ? cut(Number.MAX_SAFE_INTEGER, [o.pages]) : mode === 'pages' ? cut(Math.min(safeMax, Number.MAX_SAFE_INTEGER), o.pages.map((p) => [p])) : cut(sliceMax, [o.pages])
  files.forEach((f, i) => (f.name = files.length === 1 ? `${o.title}-webtoon.${ext}` : numbered(o.title, i, files.length, ext)))
  const estimatedBytes = Math.round(files.reduce((n, f) => n + f.width * f.height, 0) * bytesPerPixel(o.format, o.quality))
  return { files, scale, totalHeight, segmentedForSafety, estimatedBytes }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`
}
