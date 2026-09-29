import type { BubbleElement } from '../../../types'
import { mulberry32 } from '../../../lib/geometry'

type Ctx = CanvasRenderingContext2D

/**
 * Dibuja el globo completo (cuerpo + cola) en un contexto 2D nativo.
 * Técnica: se pinta el trazo de la cola, luego el cuerpo, y por último el relleno de la cola
 * sin trazo, que "abre" el contorno del cuerpo donde nace la cola.
 */
export function drawBubble(ctx: Ctx, b: BubbleElement, mode: 'full' | 'hit' = 'full') {
  const w = b.width
  const h = b.height
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = b.strokeWidth
  ctx.strokeStyle = b.stroke
  ctx.fillStyle = b.fill

  const hasTail = b.tail && b.shape !== 'box' && b.shape !== 'cloud-box'
  const dashed = b.shape === 'whisper'

  if (mode === 'hit') {
    bodyPath(ctx, b)
    ctx.fill()
    if (hasTail && b.shape !== 'thought') {
      tailPath(ctx, b)
      ctx.fill()
    }
    return
  }

  if (hasTail && b.shape === 'thought') {
    // Burbujitas que se achican hacia la punta.
    const steps = 3
    for (let i = 1; i <= steps; i++) {
      const t = i / (steps + 0.6)
      const edge = edgePoint(b, b.tailX, b.tailY)
      const px = edge.x + (b.tailX - edge.x) * t
      const py = edge.y + (b.tailY - edge.y) * t
      const r = Math.max(4, Math.min(w, h) * 0.09 * (1 - t * 0.75))
      ctx.beginPath()
      ctx.ellipse(px, py, r * 1.25, r, 0, 0, Math.PI * 2)
      ctx.fill()
      if (b.strokeWidth > 0) ctx.stroke()
    }
  } else if (hasTail) {
    tailPath(ctx, b)
    if (b.strokeWidth > 0) {
      ctx.setLineDash(dashed ? [8, 6] : [])
      ctx.stroke()
    }
  }

  bodyPath(ctx, b)
  ctx.fill()
  if (b.strokeWidth > 0) {
    ctx.setLineDash(dashed ? [8, 6] : [])
    ctx.stroke()
  }
  ctx.setLineDash([])

  if (hasTail && b.shape !== 'thought') {
    tailPath(ctx, b, 0.82)
    ctx.fill()
  }
}

function bodyPath(ctx: Ctx, b: BubbleElement) {
  const w = b.width
  const h = b.height
  ctx.beginPath()
  switch (b.shape) {
    case 'box': {
      ctx.rect(0, 0, w, h)
      break
    }
    case 'shout': {
      const rnd = mulberry32(Math.round(w * 7 + h * 13))
      const spikes = Math.max(12, Math.round((w + h) / 26))
      for (let i = 0; i <= spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2
        const outer = i % 2 === 0
        const k = outer ? 1 : 0.78 - rnd() * 0.08
        const x = w / 2 + Math.cos(a) * (w / 2) * k
        const y = h / 2 + Math.sin(a) * (h / 2) * k
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      break
    }
    case 'thought':
    case 'cloud-box': {
      const lobes = Math.max(8, Math.round((w + h) / 45))
      const rx = w / 2
      const ry = h / 2
      const pts: [number, number][] = []
      for (let i = 0; i < lobes; i++) {
        const a = (i / lobes) * Math.PI * 2
        pts.push([rx + Math.cos(a) * rx * 0.86, ry + Math.sin(a) * ry * 0.84])
      }
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 0; i < lobes; i++) {
        const [x1, y1] = pts[i]
        const [x2, y2] = pts[(i + 1) % lobes]
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2
        // Punto de control empujado hacia afuera: forma de lóbulo.
        const dx = mx - rx
        const dy = my - ry
        const len = Math.hypot(dx / rx, dy / ry) || 1
        ctx.quadraticCurveTo(rx + (dx / len) * 1.12, ry + (dy / len) * 1.12, x2, y2)
      }
      ctx.closePath()
      break
    }
    default:
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  }
}

function edgePoint(b: BubbleElement, tx: number, ty: number) {
  const cx = b.width / 2
  const cy = b.height / 2
  const a = Math.atan2((ty - cy) / (b.height / 2), (tx - cx) / (b.width / 2))
  return { x: cx + Math.cos(a) * (b.width / 2) * 0.9, y: cy + Math.sin(a) * (b.height / 2) * 0.9 }
}

function tailPath(ctx: Ctx, b: BubbleElement, baseScale = 1) {
  const cx = b.width / 2
  const cy = b.height / 2
  const angle = Math.atan2(b.tailY - cy, b.tailX - cx)
  const baseW = Math.min(b.width, b.height) * 0.17 * baseScale
  // Base de la cola: dos puntos dentro del cuerpo, perpendiculares a la dirección.
  const inner = 0.55
  const bx = cx + Math.cos(angle) * (b.width / 2) * inner
  const by = cy + Math.sin(angle) * (b.height / 2) * inner
  const px = -Math.sin(angle) * baseW
  const py = Math.cos(angle) * baseW
  // Leve curva para que se vea dibujada a mano.
  const midX = (bx + b.tailX) / 2 + px * 0.35
  const midY = (by + b.tailY) / 2 + py * 0.35
  ctx.beginPath()
  ctx.moveTo(bx + px, by + py)
  ctx.quadraticCurveTo(midX + px * 0.2, midY + py * 0.2, b.tailX, b.tailY)
  ctx.quadraticCurveTo(midX - px * 0.6, midY - py * 0.6, bx - px, by - py)
  ctx.closePath()
}

/** Rectángulo interior donde va el texto. */
export function bubbleTextBox(b: BubbleElement) {
  const isEllipse = b.shape !== 'box'
  // En una elipse, el rectángulo inscrito ocupa ~70% del ancho/alto.
  const k = isEllipse ? 0.72 : 1
  const w = b.width * k - b.padding * (isEllipse ? 0.6 : 2)
  const h = b.height * k - b.padding * (isEllipse ? 0.6 : 2)
  return { x: (b.width - w) / 2, y: (b.height - h) / 2, width: Math.max(10, w), height: Math.max(10, h) }
}
