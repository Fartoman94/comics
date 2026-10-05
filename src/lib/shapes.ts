import type { ShapeKind } from '../types'

/**
 * Formas en coordenadas normalizadas (0..1 dentro de la caja del elemento). Cada forma se dibuja
 * escalando a su ancho y alto reales, así el grosor del borde no se deforma al estirarla.
 * E = elipse (cx, cy, rx, ry).
 */
export type Cmd = ['M', number, number] | ['L', number, number] | ['Q', number, number, number, number] | ['C', number, number, number, number, number, number] | ['Z'] | ['E', number, number, number, number]

export interface ShapeDef {
  id: ShapeKind
  label: string
  group: 'Formas' | 'Símbolos'
  /** fill: relleno + contorno. stroke: sólo trazo (las elipses se rellenan con el color del trazo). */
  mode: 'fill' | 'stroke'
  cmds: Cmd[]
  /** Proporción alto/ancho sugerida al insertarla. */
  aspect: number
  fill: string
  stroke: string
}

function star(points: number, inner: number): Cmd[] {
  const out: Cmd[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : 0.5
    const a = (Math.PI * i) / points - Math.PI / 2
    out.push([i ? 'L' : 'M', 0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)])
  }
  out.push(['Z'])
  return out
}

export const SHAPE_DEFS: ShapeDef[] = [
  { id: 'rect', label: 'Rectángulo', group: 'Formas', mode: 'fill', aspect: 0.7, fill: '#ffffff', stroke: '#111111', cmds: [['M', 0, 0], ['L', 1, 0], ['L', 1, 1], ['L', 0, 1], ['Z']] },
  { id: 'ellipse', label: 'Elipse', group: 'Formas', mode: 'fill', aspect: 1, fill: '#ffffff', stroke: '#111111', cmds: [['E', 0.5, 0.5, 0.5, 0.5]] },
  { id: 'triangle', label: 'Triángulo', group: 'Formas', mode: 'fill', aspect: 0.9, fill: '#ffffff', stroke: '#111111', cmds: [['M', 0.5, 0], ['L', 1, 1], ['L', 0, 1], ['Z']] },
  { id: 'star', label: 'Estrella', group: 'Formas', mode: 'fill', aspect: 1, fill: '#ffd23f', stroke: '#111111', cmds: star(5, 0.21) },
  { id: 'arrow', label: 'Flecha', group: 'Formas', mode: 'fill', aspect: 0.5, fill: '#111111', stroke: '#111111', cmds: [['M', 0, 0.35], ['L', 0.6, 0.35], ['L', 0.6, 0.05], ['L', 1, 0.5], ['L', 0.6, 0.95], ['L', 0.6, 0.65], ['L', 0, 0.65], ['Z']] },
  { id: 'line', label: 'Línea', group: 'Formas', mode: 'stroke', aspect: 0.1, fill: '#111111', stroke: '#111111', cmds: [['M', 0, 0.5], ['L', 1, 0.5]] },
  { id: 'heart', label: 'Corazón', group: 'Símbolos', mode: 'fill', aspect: 0.9, fill: '#ef4444', stroke: '#111111', cmds: [['M', 0.5, 0.95], ['C', 0.1, 0.65, 0, 0.38, 0.13, 0.18], ['C', 0.28, -0.02, 0.5, 0.08, 0.5, 0.27], ['C', 0.5, 0.08, 0.72, -0.02, 0.87, 0.18], ['C', 1, 0.38, 0.9, 0.65, 0.5, 0.95], ['Z']] },
  {
    id: 'anger',
    label: 'Vena de enojo',
    group: 'Símbolos',
    mode: 'stroke',
    aspect: 1,
    fill: '#e11d48',
    stroke: '#e11d48',
    cmds: [['M', 0.4, 0.05], ['Q', 0.4, 0.4, 0.05, 0.4], ['M', 0.6, 0.05], ['Q', 0.6, 0.4, 0.95, 0.4], ['M', 0.05, 0.6], ['Q', 0.4, 0.6, 0.4, 0.95], ['M', 0.95, 0.6], ['Q', 0.6, 0.6, 0.6, 0.95]],
  },
  { id: 'sweat', label: 'Gota de sudor', group: 'Símbolos', mode: 'fill', aspect: 1.4, fill: '#7dd3fc', stroke: '#111111', cmds: [['M', 0.5, 0], ['C', 0.62, 0.25, 0.92, 0.5, 0.92, 0.7], ['C', 0.92, 0.9, 0.72, 1, 0.5, 1], ['C', 0.28, 1, 0.08, 0.9, 0.08, 0.7], ['C', 0.08, 0.5, 0.38, 0.25, 0.5, 0], ['Z']] },
  { id: 'exclaim', label: 'Exclamación', group: 'Símbolos', mode: 'fill', aspect: 2.4, fill: '#111111', stroke: '#111111', cmds: [['M', 0.3, 0], ['L', 0.7, 0], ['L', 0.6, 0.7], ['L', 0.4, 0.7], ['Z'], ['E', 0.5, 0.88, 0.14, 0.09]] },
  { id: 'question', label: 'Pregunta', group: 'Símbolos', mode: 'stroke', aspect: 1.6, fill: '#111111', stroke: '#111111', cmds: [['M', 0.18, 0.28], ['C', 0.18, 0.02, 0.82, 0.02, 0.82, 0.3], ['C', 0.82, 0.5, 0.5, 0.5, 0.5, 0.7], ['E', 0.5, 0.9, 0.09, 0.06]] },
  { id: 'music', label: 'Nota musical', group: 'Símbolos', mode: 'fill', aspect: 1.2, fill: '#111111', stroke: '#111111', cmds: [['E', 0.3, 0.84, 0.22, 0.14], ['M', 0.46, 0.82], ['L', 0.46, 0.04], ['L', 0.92, 0.16], ['L', 0.92, 0.32], ['L', 0.54, 0.22], ['L', 0.54, 0.82], ['Z']] },
  { id: 'sparkle', label: 'Brillo', group: 'Símbolos', mode: 'fill', aspect: 1, fill: '#fde047', stroke: '#111111', cmds: [['M', 0.5, 0], ['Q', 0.56, 0.44, 1, 0.5], ['Q', 0.56, 0.56, 0.5, 1], ['Q', 0.44, 0.56, 0, 0.5], ['Q', 0.44, 0.44, 0.5, 0], ['Z']] },
]

export const shapeDef = (k: ShapeKind) => SHAPE_DEFS.find((d) => d.id === k) ?? SHAPE_DEFS[0]

/** Contexto mínimo (Canvas 2D o Konva.Context) para trazar una forma. */
interface PathCtx {
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(a: number, b: number, x: number, y: number): void
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void
  closePath(): void
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number): void
}

/** Traza la forma (sólo los subtrazos de línea/curva, o sólo las elipses) en una caja w×h. */
export function traceShape(ctx: PathCtx, cmds: Cmd[], w: number, h: number, part: 'path' | 'dots' | 'all' = 'all') {
  ctx.beginPath()
  for (const c of cmds) {
    if (c[0] === 'E') {
      if (part === 'path') continue
      ctx.moveTo((c[1] + c[3]) * w, c[2] * h)
      ctx.ellipse(c[1] * w, c[2] * h, Math.abs(c[3] * w), Math.abs(c[4] * h), 0, 0, Math.PI * 2)
      continue
    }
    if (part === 'dots') continue
    if (c[0] === 'M') ctx.moveTo(c[1] * w, c[2] * h)
    else if (c[0] === 'L') ctx.lineTo(c[1] * w, c[2] * h)
    else if (c[0] === 'Q') ctx.quadraticCurveTo(c[1] * w, c[2] * h, c[3] * w, c[4] * h)
    else if (c[0] === 'C') ctx.bezierCurveTo(c[1] * w, c[2] * h, c[3] * w, c[4] * h, c[5] * w, c[6] * h)
    else ctx.closePath()
  }
}

/** Ícono SVG (para botones) a partir de la misma definición. */
export function shapeSvgPath(cmds: Cmd[], size = 24): string {
  const f = (n: number) => +(n * size).toFixed(2)
  return cmds
    .map((c) => {
      switch (c[0]) {
        case 'M':
        case 'L':
          return `${c[0]}${f(c[1])} ${f(c[2])}`
        case 'Q':
          return `Q${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(c[4])}`
        case 'C':
          return `C${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(c[4])} ${f(c[5])} ${f(c[6])}`
        case 'Z':
          return 'Z'
        case 'E':
          return `M${f(c[1] - c[3])} ${f(c[2])}a${f(c[3])} ${f(c[4])} 0 1 0 ${f(c[3] * 2)} 0a${f(c[3])} ${f(c[4])} 0 1 0 ${-f(c[3] * 2)} 0`
      }
    })
    .join('')
}
