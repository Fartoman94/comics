import { mulberry32 } from './geometry'

/** Fondos incluidos: se dibujan en el navegador (sin descargas) y siempre dan el mismo archivo. */
export interface BuiltinBackground {
  id: string
  label: string
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void
}

const grad = (ctx: CanvasRenderingContext2D, h: number, stops: [number, string][]) => {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  for (const [o, c] of stops) g.addColorStop(o, c)
  return g
}

export const BACKGROUNDS: BuiltinBackground[] = [
  {
    id: 'cielo',
    label: 'Cielo',
    draw(ctx, w, h) {
      ctx.fillStyle = grad(ctx, h, [[0, '#38bdf8'], [1, '#e0f2fe']])
      ctx.fillRect(0, 0, w, h)
      const r = mulberry32(7)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (let i = 0; i < 6; i++) {
        const cx = r() * w
        const cy = r() * h * 0.6
        const s = (0.08 + r() * 0.1) * w
        for (let k = 0; k < 5; k++) {
          ctx.beginPath()
          ctx.ellipse(cx + (k - 2) * s * 0.45, cy + Math.sin(k) * s * 0.15, s * 0.5, s * 0.32, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  },
  {
    id: 'atardecer',
    label: 'Atardecer',
    draw(ctx, w, h) {
      ctx.fillStyle = grad(ctx, h, [[0, '#7c3aed'], [0.45, '#f97316'], [0.8, '#fde68a'], [1, '#fef3c7']])
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,240,200,0.9)'
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.72, w * 0.16, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'noche',
    label: 'Noche',
    draw(ctx, w, h) {
      ctx.fillStyle = grad(ctx, h, [[0, '#020617'], [1, '#1e3a8a']])
      ctx.fillRect(0, 0, w, h)
      const r = mulberry32(42)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 220; i++) {
        ctx.globalAlpha = 0.3 + r() * 0.7
        ctx.beginPath()
        ctx.arc(r() * w, r() * h * 0.85, r() * 1.8 + 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
  },
  {
    id: 'papel',
    label: 'Papel',
    draw(ctx, w, h) {
      ctx.fillStyle = '#f5efe1'
      ctx.fillRect(0, 0, w, h)
      const r = mulberry32(3)
      for (let i = 0; i < 2500; i++) {
        ctx.fillStyle = `rgba(120,100,70,${0.03 + r() * 0.06})`
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
      }
    },
  },
  {
    id: 'trama',
    label: 'Trama de puntos',
    draw(ctx, w, h) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#111111'
      const step = Math.max(8, Math.round(w / 70))
      for (let y = 0; y < h + step; y += step)
        for (let x = (y / step) % 2 ? step / 2 : 0; x < w + step; x += step) {
          ctx.beginPath()
          ctx.arc(x, y, step * 0.22, 0, Math.PI * 2)
          ctx.fill()
        }
    },
  },
  {
    id: 'rayos',
    label: 'Rayos de impacto',
    draw(ctx, w, h) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const r = mulberry32(11)
      const cx = w / 2
      const cy = h / 2
      const R = Math.hypot(w, h)
      ctx.fillStyle = '#111111'
      for (let i = 0; i < 140; i++) {
        const a = (i / 140) * Math.PI * 2 + r() * 0.02
        const spread = 0.004 + r() * 0.01
        const inner = Math.min(w, h) * (0.22 + r() * 0.12)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.lineTo(cx + Math.cos(a - spread) * R, cy + Math.sin(a - spread) * R)
        ctx.lineTo(cx + Math.cos(a + spread) * R, cy + Math.sin(a + spread) * R)
        ctx.closePath()
        ctx.fill()
      }
    },
  },
  {
    id: 'velocidad',
    label: 'Líneas de velocidad',
    draw(ctx, w, h) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const r = mulberry32(5)
      ctx.strokeStyle = '#111111'
      for (let i = 0; i < 120; i++) {
        const y = r() * h
        ctx.lineWidth = 0.5 + r() * 2.5
        ctx.beginPath()
        ctx.moveTo(r() * w * 0.4, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    },
  },
]

function canvasFor(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.round(w)
  c.height = Math.round(h)
  return c
}

/** Miniatura (data URL) para la galería. */
export function backgroundPreview(bg: BuiltinBackground, ratio: number, height = 120): string {
  const c = canvasFor(height * ratio, height)
  bg.draw(c.getContext('2d')!, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.8)
}

/** Archivo PNG del fondo con la proporción de la página (lado largo ~1600 px). */
export async function backgroundFile(bg: BuiltinBackground, ratio: number): Promise<File> {
  const long = 1600
  const [w, h] = ratio >= 1 ? [long, long / ratio] : [long * ratio, long]
  const c = canvasFor(w, h)
  bg.draw(c.getContext('2d')!, c.width, c.height)
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('canvas vacío'))), 'image/png'))
  return new File([blob], `Fondo ${bg.label}.png`, { type: 'image/png' })
}
