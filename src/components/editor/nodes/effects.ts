import type { EffectElement } from '../../../types'
import { mulberry32 } from '../../../lib/geometry'

type Ctx = CanvasRenderingContext2D

export function drawEffect(ctx: Ctx, e: EffectElement) {
  const { width: w, height: h } = e
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()
  ctx.fillStyle = e.color
  ctx.strokeStyle = e.color
  const rnd = mulberry32(e.seed)

  if (e.kind === 'focuslines') {
    // Líneas de concentración (shūchūsen): triángulos finos hacia el centro.
    const cx = w / 2
    const cy = h / 2
    const outer = Math.hypot(w, h) / 2 + 10
    const n = Math.max(10, Math.round(e.density))
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * ((Math.PI * 2) / n)
      const inner = e.innerRadius * (0.75 + rnd() * 0.5)
      const ix = cx + Math.cos(a) * (w / 2) * inner
      const iy = cy + Math.sin(a) * (h / 2) * inner
      const spread = (e.lineWidth * (0.6 + rnd() * 1.6)) / outer
      ctx.beginPath()
      ctx.moveTo(ix, iy)
      ctx.lineTo(cx + Math.cos(a - spread) * outer, cy + Math.sin(a - spread) * outer)
      ctx.lineTo(cx + Math.cos(a + spread) * outer, cy + Math.sin(a + spread) * outer)
      ctx.closePath()
      ctx.fill()
    }
  } else if (e.kind === 'speedlines') {
    ctx.translate(w / 2, h / 2)
    ctx.rotate((e.angle * Math.PI) / 180)
    const len = Math.hypot(w, h)
    const n = Math.max(4, Math.round(e.density))
    for (let i = 0; i < n; i++) {
      const y = -len / 2 + rnd() * len
      const x0 = -len / 2 + rnd() * len * 0.5
      const l = len * (0.3 + rnd() * 0.6)
      const thick = e.lineWidth * (0.4 + rnd() * 1.4)
      ctx.beginPath()
      ctx.moveTo(x0, y - thick / 2)
      ctx.lineTo(x0 + l, y)
      ctx.lineTo(x0, y + thick / 2)
      ctx.closePath()
      ctx.fill()
    }
  } else {
    // Trama (screentone): cuadrícula de puntos rotada 45°, clásica de manga.
    const gap = Math.max(3, e.density)
    ctx.translate(w / 2, h / 2)
    ctx.rotate(Math.PI / 4)
    const r = Math.hypot(w, h) / 2 + gap
    for (let y = -r; y <= r; y += gap) {
      for (let x = -r; x <= r; x += gap) {
        let size = e.dotSize
        if (e.kind === 'gradient-tone') {
          // Degradado vertical en coordenadas sin rotar.
          const uy = (x * Math.sin(-Math.PI / 4) + y * Math.cos(-Math.PI / 4) + h / 2) / h
          size = e.dotSize * Math.max(0, Math.min(1, uy))
          if (size < 0.3) continue
        }
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()
}
