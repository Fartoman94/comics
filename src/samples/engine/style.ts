import type { StyleId, TimeOfDay } from '../types'

/** Cómo dibuja cada estilo: color o blanco y negro con tramas, grosor de línea, ojos y sombras. */
export interface ArtStyle {
  id: StyleId
  color: boolean
  ink: string
  /** Grosor base de línea (en unidades del lienzo de 1000 px de ancho). */
  line: number
  eyes: 'western' | 'anime' | 'shojo' | 'seinen'
  /** Sombra de celda (anime/webtoon/western) o trama (manga). */
  shade: 'cel' | 'halftone' | 'tone' | 'hatch' | 'soft'
  /** Proporción cuerpo/cabeza. */
  heads: number
  /** Saturación extra (1 = sin cambio). */
  saturation: number
}

export const STYLES: Record<StyleId, ArtStyle> = {
  western: { id: 'western', color: true, ink: '#0d0d12', line: 5, eyes: 'western', shade: 'halftone', heads: 7.2, saturation: 1.15 },
  shonen: { id: 'shonen', color: false, ink: '#0d0d0d', line: 4.5, eyes: 'anime', shade: 'tone', heads: 6.4, saturation: 1 },
  seinen: { id: 'seinen', color: false, ink: '#0a0a0a', line: 3.6, eyes: 'seinen', shade: 'hatch', heads: 7.4, saturation: 1 },
  shojo: { id: 'shojo', color: false, ink: '#1a1a1a', line: 2.6, eyes: 'shojo', shade: 'tone', heads: 6.8, saturation: 1 },
  webtoon: { id: 'webtoon', color: true, ink: '#2a2238', line: 2.8, eyes: 'anime', shade: 'soft', heads: 6.6, saturation: 0.95 },
  anime: { id: 'anime', color: true, ink: '#1b1530', line: 3.2, eyes: 'anime', shade: 'cel', heads: 6.8, saturation: 1.1 },
}

// ---------- Color ----------

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Mezcla dos colores (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export const darken = (hex: string, t: number) => mix(hex, '#000000', t)
export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t)

function saturate(hex: string, k: number) {
  if (k === 1) return hex
  const [r, g, b] = hexToRgb(hex)
  const l = 0.299 * r + 0.587 * g + 0.114 * b
  return rgbToHex(l + (r - l) * k, l + (g - l) * k, l + (b - l) * k)
}

/** Ajuste de luz por hora del día (sólo estilos a color). */
function timeTint(hex: string, time: TimeOfDay) {
  if (time === 'night') return mix(hex, '#141a3a', 0.45)
  if (time === 'sunset') return mix(hex, '#ff8a4c', 0.22)
  return hex
}

/**
 * Pintor del estilo: convierte un color "de diseño" al relleno final.
 * En blanco y negro: claros → blanco, medios → trama, oscuros → negro (convención del manga).
 */
export class Painter {
  readonly s: ArtStyle
  readonly time: TimeOfDay
  constructor(s: ArtStyle, time: TimeOfDay = 'day') {
    this.s = s
    this.time = time
  }

  fill(hex: string, opts: { keepLight?: boolean } = {}) {
    if (this.s.color) return saturate(timeTint(hex, this.time), this.s.saturation)
    let l = luminance(hex)
    if (this.time === 'night') l *= 0.55
    if (l > 0.78 || (opts.keepLight && l > 0.55)) return '#ffffff'
    if (l > 0.6) return 'url(#tone-light)'
    if (l > 0.4) return 'url(#tone)'
    if (l > 0.24) return 'url(#tone-dense)'
    return this.s.ink
  }

  /** Sombra sobre un color (celda, trama o achurado según el estilo). */
  shadow(hex: string) {
    if (this.s.color) return this.fill(darken(hex, this.s.shade === 'soft' ? 0.18 : 0.3))
    return this.s.shade === 'hatch' ? 'url(#hatch)' : 'url(#tone)'
  }

  /** Brillo (sólo a color). */
  light(hex: string) {
    return this.s.color ? this.fill(lighten(hex, 0.35)) : '#ffffff'
  }

  get ink() {
    return this.s.ink
  }

  lw(k = 1) {
    return +(this.s.line * k).toFixed(2)
  }
}

/** Patrones de trama y degradados compartidos por todas las ilustraciones. */
export function defs(s: ArtStyle) {
  const ink = s.ink
  return `<defs>
<pattern id="tone" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#fff"/><circle cx="4.5" cy="4.5" r="2" fill="${ink}"/></pattern>
<pattern id="tone-light" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#fff"/><circle cx="4.5" cy="4.5" r="1.2" fill="${ink}"/></pattern>
<pattern id="tone-dense" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><circle cx="4" cy="4" r="2.9" fill="${ink}"/></pattern>
<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#fff"/><line x1="0" y1="0" x2="0" y2="10" stroke="${ink}" stroke-width="2.2"/></pattern>
<pattern id="hatch-x" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#fff"/><line x1="0" y1="0" x2="0" y2="10" stroke="${ink}" stroke-width="2"/><line x1="0" y1="5" x2="10" y2="5" stroke="${ink}" stroke-width="1.4"/></pattern>
<pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="7" cy="7" r="2.6" fill="#000" fill-opacity="0.28"/></pattern>
<linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="fade-up" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
</defs>`
}
