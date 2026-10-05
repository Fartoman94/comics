import { mulberry32 } from '../../lib/geometry'
import type { Angle, SceneId } from '../types'
import { darken, lighten, type Painter } from './style'

/**
 * Escenarios vectoriales. Cada función dibuja en un lienzo de W×H con la horizonte según el
 * ángulo de cámara. Los colores pasan por el pintor del estilo (color, o B/N con tramas).
 */

interface S {
  p: Painter
  W: number
  H: number
  /** Línea del horizonte. */
  hz: number
  /** Punto de fuga horizontal. */
  vx: number
  r: () => number
  lw: number
}

const n = (v: number) => +v.toFixed(1)
const rect = (s: S, x: number, y: number, w: number, h: number, col: string, stroke = true, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${s.p.fill(col)}"${stroke ? ` stroke="${s.p.ink}" stroke-width="${s.lw}"` : ''} ${extra}/>`
const poly = (s: S, points: number[][], col: string, stroke = true, extra = '') =>
  `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${s.p.fill(col)}"${stroke ? ` stroke="${s.p.ink}" stroke-width="${s.lw}" stroke-linejoin="round"` : ''} ${extra}/>`
const line = (s: S, x1: number, y1: number, x2: number, y2: number, k = 1, col?: string) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${col ?? s.p.ink}" stroke-width="${n(s.lw * k)}" stroke-linecap="round"/>`

// ---------- Cielos ----------

function sky(s: S, kind: 'day' | 'night' | 'sunset' | 'storm' = s.p.time === 'night' ? 'night' : s.p.time === 'sunset' ? 'sunset' : 'day', h = s.hz) {
  const { W, p } = s
  if (p.s.color) {
    const stops = kind === 'night' ? ['#070b24', '#1c2a5c', '#3a3f7a'] : kind === 'sunset' ? ['#3b2a6b', '#ff7a59', '#ffd29a'] : kind === 'storm' ? ['#1c2230', '#3a4256', '#59617a'] : ['#4aa3f0', '#9fd4ff', '#e6f5ff']
    const id = `sky${Math.round(s.r() * 1e6)}`
    // El cielo no pasa por el tinte de hora (ya es el de esa hora).
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${stops[0]}"/><stop offset="0.6" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></linearGradient><rect width="${W}" height="${n(h + 2)}" fill="url(#${id})"/>${kind === 'night' ? stars(s, h, 70) : ''}${kind === 'day' ? clouds(s, h) : ''}`
  }
  if (kind === 'night' || kind === 'storm') return `<rect width="${W}" height="${n(h + 2)}" fill="${p.ink}"/>${stars(s, h, kind === 'night' ? 60 : 0, '#fff')}`
  if (kind === 'sunset') return `<rect width="${W}" height="${n(h + 2)}" fill="url(#tone-light)"/>`
  return `<rect width="${W}" height="${n(h + 2)}" fill="#fff"/>${clouds(s, h)}`
}

function stars(s: S, h: number, count: number, col = '#fff') {
  let o = ''
  for (let i = 0; i < count; i++) o += `<circle cx="${n(s.r() * s.W)}" cy="${n(s.r() * h * 0.9)}" r="${n(0.8 + s.r() * 2.2)}" fill="${col}" opacity="${n(0.4 + s.r() * 0.6)}"/>`
  return o
}

function clouds(s: S, h: number) {
  let o = ''
  for (let i = 0; i < 4; i++) {
    const cx = s.r() * s.W
    const cy = h * (0.15 + s.r() * 0.5)
    const k = 40 + s.r() * 70
    o += `<g fill="#fff" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.7)}" opacity="0.95"><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(k * 1.6)}" ry="${n(k * 0.55)}"/><ellipse cx="${n(cx - k * 0.6)}" cy="${n(cy - k * 0.25)}" rx="${n(k * 0.7)}" ry="${n(k * 0.55)}"/><ellipse cx="${n(cx + k * 0.4)}" cy="${n(cy - k * 0.4)}" rx="${n(k * 0.8)}" ry="${n(k * 0.65)}"/></g>`
  }
  return o
}

// ---------- Ciudad ----------

function building(s: S, x: number, w: number, top: number, base: number, col: string, lit: boolean) {
  let o = rect(s, x, top, w, base - top, col)
  const cols = Math.max(2, Math.floor(w / 26))
  const rows = Math.max(2, Math.floor((base - top) / 34))
  const gw = w / cols
  const gh = (base - top) / rows
  const night = s.p.time === 'night'
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      if (s.r() < 0.18) continue
      const on = night ? s.r() < (lit ? 0.55 : 0.3) : false
      const wc = on ? '#ffd76a' : night ? darken(col, 0.4) : lighten(col, 0.25)
      o += `<rect x="${n(x + i * gw + gw * 0.25)}" y="${n(top + j * gh + gh * 0.25)}" width="${n(gw * 0.5)}" height="${n(gh * 0.45)}" fill="${s.p.s.color ? (on ? wc : s.p.fill(wc)) : on ? '#fff' : s.p.fill(wc)}"/>`
    }
  return o
}

function skyline(s: S, base: number, colors: string[], layers = 2, lit = true) {
  let o = ''
  for (let l = 0; l < layers; l++) {
    let x = -20
    while (x < s.W) {
      const w = 60 + s.r() * 120
      const hgt = (base * (0.35 + s.r() * 0.55)) * (l === 0 ? 0.75 : 1)
      const col = l === 0 ? darken(colors[0], 0.15) : colors[Math.floor(s.r() * colors.length)]
      o += building(s, x, w, base - hgt, base, col, lit)
      if (s.r() < 0.2) o += line(s, x + w / 2, base - hgt, x + w / 2, base - hgt - 40, 0.8)
      x += w + (l === 0 ? -10 : 4)
    }
  }
  return o
}

function ground(s: S, col: string, lines = true) {
  let o = rect(s, 0, s.hz, s.W, s.H - s.hz, col, false)
  if (lines) for (let i = -6; i <= 6; i++) o += line(s, s.vx, s.hz, s.vx + i * s.W * 0.35, s.H + 10, 0.6, s.p.s.color ? darken(col, 0.25) : undefined)
  return o
}

function street(s: S, wet = false) {
  const { W, H, hz, vx } = s
  const night = s.p.time === 'night'
  let o = sky(s)
  // Edificios en perspectiva a ambos lados
  const side = (dir: -1 | 1) => {
    let r = ''
    for (let i = 0; i < 5; i++) {
      const t0 = i / 5
      const t1 = (i + 1) / 5
      const x0 = dir < 0 ? vx - (vx + 40) * (1 - t0) : vx + (W - vx + 40) * (1 - t0)
      const x1 = dir < 0 ? vx - (vx + 40) * (1 - t1) : vx + (W - vx + 40) * (1 - t1)
      const top0 = hz - (hz + 60) * (1 - t0) * 0.95
      const top1 = hz - (hz + 60) * (1 - t1) * 0.95
      const bot0 = hz + (H - hz) * (1 - t0) * 0.7
      const bot1 = hz + (H - hz) * (1 - t1) * 0.7
      const col = ['#b45f4d', '#6f7d8c', '#c9a46b', '#56607a', '#8c6b5a'][(i + (dir > 0 ? 2 : 0)) % 5]
      r += poly(s, [[x0, top0], [x1, top1], [x1, bot1], [x0, bot0]], col)
      // Ventanas
      for (let k = 1; k < 4; k++) {
        const yA = top0 + (bot0 - top0) * (k / 4.2)
        const yB = top1 + (bot1 - top1) * (k / 4.2)
        const on = night && s.r() < 0.5
        r += poly(s, [[x0 + (x1 - x0) * 0.25, yA], [x0 + (x1 - x0) * 0.6, yA + (yB - yA) * 0.6], [x0 + (x1 - x0) * 0.6, yA + (yB - yA) * 0.6 + 26 * (1 - t0)], [x0 + (x1 - x0) * 0.25, yA + 26 * (1 - t0)]], on ? '#ffd76a' : darken(col, 0.35), false)
      }
    }
    return r
  }
  o += rect(s, 0, hz, W, H - hz, wet ? '#3c4252' : '#7c7f86', false)
  o += side(-1) + side(1)
  // Vereda y calle
  o += poly(s, [[vx - 6, hz], [vx + 6, hz], [W * 0.78, H], [W * 0.22, H]], wet ? '#2d3240' : '#5d6068')
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.5) / 6
    const y = hz + (H - hz) * t * t
    o += line(s, vx, y, vx, y + 18 * t, 2.5 * t + 0.4, s.p.s.color ? '#f2e3a0' : '#fff')
  }
  // Faroles
  for (const dir of [-1, 1]) {
    const x = vx + dir * W * 0.28
    o += line(s, x, hz + 40, x, hz - 140, 1.6) + `<circle cx="${n(x)}" cy="${n(hz - 145)}" r="10" fill="${night ? '#ffe9a0' : s.p.fill('#d8d8d8')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
    if (night && s.p.s.color) o += `<circle cx="${n(x)}" cy="${n(hz - 140)}" r="70" fill="url(#glow)" opacity="0.5"/>`
  }
  if (wet) o += `<rect x="0" y="${n(hz)}" width="${W}" height="${n(H - hz)}" fill="#9fb4d8" opacity="${s.p.s.color ? 0.18 : 0}"/>`
  return o
}

function alley(s: S) {
  const { W, H, hz, vx } = s
  let o = sky(s, undefined, hz * 0.35)
  o += poly(s, [[0, 0], [vx - 60, hz * 0.4], [vx - 60, hz + 60], [0, H]], '#6b5b54')
  o += poly(s, [[W, 0], [vx + 60, hz * 0.4], [vx + 60, hz + 60], [W, H]], '#5b5f6b')
  o += poly(s, [[vx - 60, hz + 60], [vx + 60, hz + 60], [W, H], [0, H]], '#3e3f45')
  // Ladrillos, caños y un contenedor
  for (let i = 0; i < 9; i++) o += line(s, 0, H * (i / 9), vx - 60, hz * 0.4 + (hz + 60 - hz * 0.4) * (i / 9), 0.5)
  o += line(s, W * 0.18, 0, W * 0.25, H, 2.2) + line(s, W * 0.85, 0, W * 0.8, H, 1.8)
  o += poly(s, [[W * 0.62, H * 0.72], [W * 0.92, H * 0.78], [W * 0.92, H * 0.95], [W * 0.62, H * 0.92]], '#2e6b4f')
  o += `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`
  return o
}

function harbor(s: S) {
  const { W, H, hz } = s
  let o = sky(s)
  o += skyline(s, hz, ['#5a6a82', '#7a6e8a', '#4b5568'], 1)
  o += rect(s, 0, hz, W, H - hz, '#2c4f74', false)
  for (let i = 0; i < 14; i++) o += line(s, s.r() * W, hz + s.r() * (H - hz), s.r() * W, hz + s.r() * (H - hz), 0.5, s.p.s.color ? '#7fb1e0' : '#fff')
  // Grúas y faro
  o += line(s, W * 0.15, hz, W * 0.15, hz - 220, 2.5) + line(s, W * 0.15, hz - 220, W * 0.4, hz - 200, 2.5) + line(s, W * 0.36, hz - 200, W * 0.36, hz - 120, 1)
  o += poly(s, [[W * 0.8, hz], [W * 0.84, hz - 240], [W * 0.88, hz - 240], [W * 0.92, hz]], '#eeeeee') + rect(s, W * 0.835, hz - 270, W * 0.05, 30, '#ffd76a')
  o += poly(s, [[0, H * 0.82], [W * 0.55, H * 0.86], [W * 0.55, H], [0, H]], '#6a5340')
  return o
}

function bridge(s: S) {
  const { W, H, hz } = s
  let o = sky(s)
  o += rect(s, 0, hz, W, H - hz, '#36506b', false)
  o += `<path d="M-20 ${n(hz - 20)} Q${n(W / 2)} ${n(hz - 260)} ${n(W + 20)} ${n(hz - 20)}" fill="none" stroke="${s.p.ink}" stroke-width="${n(s.lw * 3)}"/>`
  for (let i = 0; i <= 12; i++) {
    const x = (W / 12) * i
    const t = Math.abs(i - 6) / 6
    o += line(s, x, hz - 20 - 240 * (1 - t * t) * 0.95, x, hz - 10, 0.7)
  }
  o += rect(s, -10, hz - 22, W + 20, 26, '#8a8f99') + rect(s, W * 0.1, hz - 360, 26, 360, '#8a8f99') + rect(s, W * 0.86, hz - 360, 26, 360, '#8a8f99')
  return o
}

// ---------- Interiores ----------

interface RoomOpts {
  wall: string
  floor: string
  props: ((s: S, back: { x0: number; y0: number; x1: number; y1: number }) => string)[]
  dark?: boolean
}

function room(s: S, o: RoomOpts) {
  const { W, H, hz, vx } = s
  // Pared del fondo (rectángulo) y paredes laterales en perspectiva.
  const bw = W * 0.56
  const bh = (H - (H - hz) * 0.35) * 0.62
  const x0 = vx - bw / 2
  const x1 = vx + bw / 2
  const y0 = hz - bh * 0.75
  const y1 = hz + bh * 0.25
  let out = rect(s, 0, 0, W, H, darken(o.wall, 0.15), false)
  out += poly(s, [[0, 0], [x0, y0], [x0, y1], [0, H]], darken(o.wall, 0.08))
  out += poly(s, [[W, 0], [x1, y0], [x1, y1], [W, H]], darken(o.wall, 0.2))
  out += poly(s, [[0, 0], [W, 0], [x1, y0], [x0, y0]], lighten(o.wall, 0.12))
  out += rect(s, x0, y0, bw, y1 - y0, o.wall)
  out += poly(s, [[x0, y1], [x1, y1], [W, H], [0, H]], o.floor)
  for (let i = 1; i < 7; i++) out += line(s, x0 + (bw / 7) * i, y1, (W / 7) * i, H, 0.5)
  for (const f of o.props) out += f(s, { x0, y0, x1, y1 })
  if (o.dark) out += `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`
  return out
}

const windowProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const w = (b.x1 - b.x0) * 0.32
  const h = (b.y1 - b.y0) * 0.45
  const x = b.x0 + (b.x1 - b.x0) * 0.08
  const y = b.y0 + (b.y1 - b.y0) * 0.15
  const night = s.p.time === 'night'
  return `${rect(s, x, y, w, h, night ? '#1a2350' : '#a8dcff')}${line(s, x + w / 2, y, x + w / 2, y + h, 0.8)}${line(s, x, y + h / 2, x + w, y + h / 2, 0.8)}${night ? `<circle cx="${n(x + w * 0.7)}" cy="${n(y + h * 0.3)}" r="${n(w * 0.1)}" fill="#fff6d0"/>` : ''}`
}
const lampProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const x = b.x1 - (b.x1 - b.x0) * 0.15
  return `${line(s, x, b.y1, x, b.y1 - (b.y1 - b.y0) * 0.55, 1.2)}${poly(s, [[x - 30, b.y1 - (b.y1 - b.y0) * 0.55], [x + 30, b.y1 - (b.y1 - b.y0) * 0.55], [x + 18, b.y1 - (b.y1 - b.y0) * 0.75], [x - 18, b.y1 - (b.y1 - b.y0) * 0.75]], '#f3e2b0')}${s.p.s.color && s.p.time === 'night' ? `<circle cx="${n(x)}" cy="${n(b.y1 - (b.y1 - b.y0) * 0.62)}" r="120" fill="url(#glow)" opacity="0.55"/>` : ''}`
}
const sofaProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const w = (b.x1 - b.x0) * 0.5
  const x = b.x0 + (b.x1 - b.x0) * 0.42
  const y = b.y1 - 70
  return rect(s, x, y, w, 70, '#7a4f63', true, 'rx="14"') + rect(s, x, y - 50, w, 56, '#8e5f74', true, 'rx="14"')
}
const bedProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const x = b.x0 + (b.x1 - b.x0) * 0.45
  const w = (b.x1 - b.x0) * 0.55
  return rect(s, x, b.y1 - 60, w, 60, '#e9e1d4') + rect(s, x, b.y1 - 110, 40, 110, '#8b6a4e') + rect(s, x + 50, b.y1 - 80, 90, 30, '#ffffff', true, 'rx="10"')
}
const deskProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  let o = ''
  for (let i = 0; i < 2; i++) {
    const x = b.x0 + (b.x1 - b.x0) * (0.12 + i * 0.48)
    o += rect(s, x, b.y1 - 55, (b.x1 - b.x0) * 0.36, 14, '#a07b5a') + line(s, x + 8, b.y1 - 41, x + 8, b.y1, 1) + line(s, x + (b.x1 - b.x0) * 0.34, b.y1 - 41, x + (b.x1 - b.x0) * 0.34, b.y1, 1)
    o += rect(s, x + 20, b.y1 - 110, 70, 50, '#2b3240') + rect(s, x + 26, b.y1 - 104, 58, 38, s.p.time === 'night' ? '#6fd3ff' : '#9fb7cc', false)
  }
  return o
}
const shelvesProp = (col: string) => (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  let o = rect(s, b.x0 + 10, b.y0 + 10, b.x1 - b.x0 - 20, b.y1 - b.y0 - 20, darken(col, 0.3))
  for (let i = 1; i < 5; i++) {
    const y = b.y0 + 10 + ((b.y1 - b.y0 - 20) / 5) * i
    o += line(s, b.x0 + 10, y, b.x1 - 10, y, 1.4)
    for (let k = 0; k < 9; k++) o += rect(s, b.x0 + 18 + k * ((b.x1 - b.x0 - 40) / 9), y - 26 - s.r() * 10, (b.x1 - b.x0 - 40) / 12, 24 + s.r() * 8, ['#c0392b', '#e0b84c', '#4a7fb5', '#6b8f4e', '#d9d2c3'][Math.floor(s.r() * 5)])
  }
  return o
}
const counterProp = (col: string) => (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => rect(s, b.x0 - 40, b.y1 - 20, b.x1 - b.x0 + 80, 90, col) + rect(s, b.x0 - 50, b.y1 - 30, b.x1 - b.x0 + 100, 16, darken(col, 0.3))
const doorsProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  let o = rect(s, (b.x0 + b.x1) / 2 - 40, b.y1 - (b.y1 - b.y0) * 0.75, 80, (b.y1 - b.y0) * 0.75, '#7a5c45')
  o += `<circle cx="${n((b.x0 + b.x1) / 2 + 26)}" cy="${n(b.y1 - (b.y1 - b.y0) * 0.38)}" r="5" fill="${s.p.fill('#e8c35a')}"/>`
  // Puertas laterales en perspectiva
  o += poly(s, [[b.x0 * 0.35, s.H * 0.28], [b.x0 * 0.75, b.y0 + (b.y1 - b.y0) * 0.25], [b.x0 * 0.75, b.y1], [b.x0 * 0.35, s.H * 0.86]], '#6b4f3a')
  o += poly(s, [[s.W - b.x0 * 0.35, s.H * 0.28], [s.W - b.x0 * 0.75, b.y0 + (b.y1 - b.y0) * 0.25], [s.W - b.x0 * 0.75, b.y1], [s.W - b.x0 * 0.35, s.H * 0.86]], '#6b4f3a')
  return o
}
const boardProp = (col: string) => (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => rect(s, b.x0 + 30, b.y0 + 30, b.x1 - b.x0 - 60, (b.y1 - b.y0) * 0.5, col) + line(s, b.x0 + 60, b.y0 + 70, b.x0 + 220, b.y0 + 70, 0.8, '#fff') + line(s, b.x0 + 60, b.y0 + 100, b.x0 + 180, b.y0 + 100, 0.8, '#fff')
const pianoProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const x = b.x0 + (b.x1 - b.x0) * 0.35
  const w = (b.x1 - b.x0) * 0.55
  let o = poly(s, [[x, b.y1 - 120], [x + w, b.y1 - 160], [x + w + 40, b.y1 - 40], [x - 20, b.y1 - 20]], '#1b1b1f') + rect(s, x - 10, b.y1 - 40, w + 40, 18, '#f5f5f5')
  for (let i = 0; i < 14; i++) o += rect(s, x - 6 + i * ((w + 30) / 14), b.y1 - 40, (w + 30) / 24, 10, '#111', false)
  return o
}
const screensProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  let o = ''
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) o += rect(s, b.x0 + 20 + i * ((b.x1 - b.x0 - 40) / 3), b.y0 + 20 + j * 90, (b.x1 - b.x0 - 60) / 3, 76, '#0e2236') + rect(s, b.x0 + 28 + i * ((b.x1 - b.x0 - 40) / 3), b.y0 + 28 + j * 90, (b.x1 - b.x0 - 76) / 3, 60, s.p.s.color ? ['#29d0ff', '#ff4b6b', '#5cf2a2'][(i + j) % 3] : 'url(#tone-light)', false, 'opacity="0.75"')
  return o + counterProp('#39424f')(s, b)
}
const stairsProp = (s: S) => {
  let o = ''
  for (let i = 0; i < 9; i++) o += poly(s, [[s.W * (0.1 + i * 0.07), s.H * (0.9 - i * 0.08)], [s.W * (0.55 + i * 0.05), s.H * (0.9 - i * 0.08)], [s.W * (0.55 + i * 0.05), s.H * (0.94 - i * 0.08)], [s.W * (0.1 + i * 0.07), s.H * (0.94 - i * 0.08)]], i % 2 ? '#8d8a84' : '#a5a29b')
  return o + line(s, s.W * 0.1, s.H * 0.7, s.W * 0.7, 0, 1.6)
}
const lockersProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => {
  let o = ''
  for (let i = 0; i < 6; i++) o += rect(s, b.x0 + i * ((b.x1 - b.x0) / 6), b.y0 + (b.y1 - b.y0) * 0.2, (b.x1 - b.x0) / 6, (b.y1 - b.y0) * 0.8, '#5c8bb5') + line(s, b.x0 + i * ((b.x1 - b.x0) / 6) + 12, b.y0 + (b.y1 - b.y0) * 0.3, b.x0 + i * ((b.x1 - b.x0) / 6) + 30, b.y0 + (b.y1 - b.y0) * 0.3, 0.6)
  return o
}
const seatsProp = (s: S) => {
  let o = ''
  for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) o += rect(s, i * (s.W / 12) + (r % 2) * 20, s.H * (0.68 + r * 0.08), s.W / 14, s.H * 0.07, '#8e1f2f', true, 'rx="6"')
  return o
}
const stageProp = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) =>
  `${rect(s, b.x0 - 80, b.y0 - 40, b.x1 - b.x0 + 160, b.y1 - b.y0 + 40, '#5a1626')}${rect(s, b.x0 - 60, b.y1 - 20, b.x1 - b.x0 + 120, 40, '#7a5a3a')}${s.p.s.color ? `<polygon points="${n(b.x0 + 80)},0 ${n(b.x0 + 160)},0 ${n((b.x0 + b.x1) / 2 + 60)},${n(b.y1)} ${n((b.x0 + b.x1) / 2 - 120)},${n(b.y1)}" fill="#fff6c8" opacity="0.25"/>` : `<polygon points="${n(b.x0 + 80)},0 ${n(b.x0 + 160)},0 ${n((b.x0 + b.x1) / 2 + 60)},${n(b.y1)} ${n((b.x0 + b.x1) / 2 - 120)},${n(b.y1)}" fill="#fff" opacity="0.5"/>`}${pianoProp(s, b)}`
const bedHospital = (s: S, b: { x0: number; y0: number; x1: number; y1: number }) => bedProp(s, b) + rect(s, b.x0 + 20, b.y0 + 20, 16, b.y1 - b.y0 - 20, '#c9d6df') + `<path d="M${n(b.x0 + 40)} ${n(b.y0 + 30)} q40 60 0 120 q-40 60 0 120" fill="none" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`

// ---------- Exteriores naturales y fantásticos ----------

function tree(s: S, x: number, base: number, h: number, col = '#3f7f4c') {
  return `${line(s, x, base, x, base - h * 0.45, 3, s.p.fill('#6b4a33'))}<g fill="${s.p.fill(col)}" stroke="${s.p.ink}" stroke-width="${s.lw}"><circle cx="${n(x)}" cy="${n(base - h * 0.7)}" r="${n(h * 0.28)}"/><circle cx="${n(x - h * 0.2)}" cy="${n(base - h * 0.55)}" r="${n(h * 0.22)}"/><circle cx="${n(x + h * 0.22)}" cy="${n(base - h * 0.58)}" r="${n(h * 0.2)}"/></g>`
}

function park(s: S, flowers = false, jacaranda = false) {
  const { W, H, hz } = s
  let o = sky(s) + ground(s, '#6fae5b', false)
  o += `<path d="M${n(W * 0.45)} ${n(hz)} L${n(W * 0.55)} ${n(hz)} L${n(W * 0.8)} ${H} L${n(W * 0.2)} ${H}Z" fill="${s.p.fill('#d8c49a')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  for (let i = 0; i < 7; i++) o += tree(s, (W / 6) * i + s.r() * 40 - 20, hz + 10 + s.r() * 20, 160 + s.r() * 120, jacaranda ? '#9b6fd0' : '#3f7f4c')
  o += rect(s, W * 0.62, H * 0.72, W * 0.22, 18, '#8b5a3a') + rect(s, W * 0.62, H * 0.66, W * 0.22, 12, '#8b5a3a')
  if (flowers) for (let i = 0; i < 40; i++) o += `<circle cx="${n(s.r() * W)}" cy="${n(hz + s.r() * (H - hz))}" r="${n(4 + s.r() * 5)}" fill="${s.p.fill(['#ff7aa8', '#ffd35a', '#ffffff', '#a98bff'][i % 4])}" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.5)}"/>`
  return o
}

function forest(s: S) {
  const { W, hz } = s
  let o = sky(s) + ground(s, '#4f7a46', false)
  for (let l = 0; l < 3; l++)
    for (let i = 0; i < 8; i++) {
      const x = s.r() * W
      const w = 30 + l * 18
      o += rect(s, x, 0, w, hz + 40 + l * 60, darken('#5b4636', 0.2 - l * 0.08)) + `<circle cx="${n(x + w / 2)}" cy="${n(40 + s.r() * 80)}" r="${n(90 + l * 30)}" fill="${s.p.fill(darken('#3b6b3e', 0.25 - l * 0.08))}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
    }
  return o
}

function islands(s: S) {
  const { W, H, hz } = s
  let o = sky(s, undefined, H)
  for (let i = 0; i < 5; i++) {
    const cx = s.r() * W
    const cy = hz * (0.3 + s.r() * 1.1)
    const w = 120 + s.r() * 220
    o += `<path d="M${n(cx - w / 2)} ${n(cy)} Q${n(cx)} ${n(cy - 30)} ${n(cx + w / 2)} ${n(cy)} L${n(cx + w * 0.2)} ${n(cy + w * 0.45)} L${n(cx)} ${n(cy + w * 0.7)} L${n(cx - w * 0.25)} ${n(cy + w * 0.4)}Z" fill="${s.p.fill('#8c6b4a')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/><path d="M${n(cx - w / 2)} ${n(cy)} Q${n(cx)} ${n(cy - 30)} ${n(cx + w / 2)} ${n(cy)} Q${n(cx)} ${n(cy + 14)} ${n(cx - w / 2)} ${n(cy)}Z" fill="${s.p.fill('#6fb35c')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
    if (s.r() < 0.6) o += tree(s, cx + w * 0.15, cy - 8, 70)
    if (s.r() < 0.5) o += poly(s, [[cx - w * 0.2, cy - 6], [cx - w * 0.2, cy - 50], [cx - w * 0.1, cy - 72], [cx, cy - 50], [cx, cy - 6]], '#e7d7b9')
  }
  o += clouds(s, H)
  return o
}

function village(s: S) {
  const { W, hz } = s
  let o = sky(s) + ground(s, '#9bbf6a', false)
  for (let i = 0; i < 6; i++) {
    const x = i * (W / 5.2) - 40 + s.r() * 30
    const w = 120 + s.r() * 50
    const h = 90 + s.r() * 40
    o += rect(s, x, hz - h + 30, w, h, '#e6d3b0') + poly(s, [[x - 14, hz - h + 32], [x + w / 2, hz - h - 50], [x + w + 14, hz - h + 32]], '#b0503c') + rect(s, x + w * 0.4, hz - 30, 26, 60, '#6b4a33')
  }
  return o
}

function academy(s: S) {
  const { W, hz } = s
  let o = islands(s)
  const x = W * 0.3
  o += rect(s, x, hz - 260, W * 0.4, 260, '#e9e1d0') + poly(s, [[x - 20, hz - 258], [x + W * 0.2, hz - 360], [x + W * 0.4 + 20, hz - 258]], '#3f5a8a')
  for (const t of [x - 30, x + W * 0.4 - 30]) o += rect(s, t, hz - 330, 60, 330, '#ded4c0') + poly(s, [[t - 10, hz - 328], [t + 30, hz - 410], [t + 70, hz - 328]], '#3f5a8a')
  for (let i = 0; i < 5; i++) o += rect(s, x + 30 + i * (W * 0.07), hz - 200, 30, 60, '#5b7fb0')
  return o
}

function arena(s: S) {
  const { W, H, hz } = s
  let o = sky(s, undefined, hz * 0.4)
  for (let r = 0; r < 5; r++) o += `<path d="M0 ${n(hz * 0.4 + r * 40)} Q${n(W / 2)} ${n(hz * 0.4 + r * 40 + 60)} ${W} ${n(hz * 0.4 + r * 40)} L${W} ${n(hz * 0.4 + r * 40 + 40)} Q${n(W / 2)} ${n(hz * 0.4 + r * 40 + 100)} 0 ${n(hz * 0.4 + r * 40 + 40)}Z" fill="${s.p.fill(r % 2 ? '#a68d6b' : '#8c7558')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  for (let i = 0; i < 70; i++) o += `<circle cx="${n(s.r() * W)}" cy="${n(hz * 0.42 + s.r() * 200)}" r="7" fill="${s.p.fill(['#e9c9a5', '#8a5a3c', '#2a2a2a'][i % 3])}"/>`
  o += `<ellipse cx="${n(W / 2)}" cy="${n(H * 0.85)}" rx="${n(W * 0.7)}" ry="${n(H * 0.3)}" fill="${s.p.fill('#d9c08f')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  return o
}

function dojo(s: S) {
  return room(s, {
    wall: '#e8d9b8',
    floor: '#b98a55',
    props: [
      (s2, b) => rect(s2, b.x0 + 20, b.y0 + 20, 70, 170, '#fff8e8') + line(s2, b.x0 + 55, b.y0 + 40, b.x0 + 55, b.y0 + 170, 2.2),
      (s2, b) => rect(s2, b.x1 - 140, b.y0 + 30, 110, 60, '#3b2a1f') + line(s2, b.x1 - 140, b.y0 + 140, b.x1 - 30, b.y0 + 130, 2.4) + line(s2, b.x1 - 140, b.y0 + 160, b.x1 - 30, b.y0 + 150, 2.4),
    ],
  })
}

function cliff(s: S) {
  const { W, H, hz } = s
  let o = sky(s) + rect(s, 0, hz, W, H - hz, '#7aa7c7', false)
  o += poly(s, [[0, hz - 30], [W * 0.55, hz - 10], [W * 0.62, H], [0, H]], '#8a7558')
  o += poly(s, [[0, hz - 30], [W * 0.55, hz - 10], [W * 0.5, hz + 10], [0, hz - 10]], '#6fa35a')
  return o
}

function beach(s: S) {
  const { W, H, hz } = s
  let o = sky(s) + rect(s, 0, hz, W, (H - hz) * 0.5, '#3e8fc4', false)
  o += `<path d="M0 ${n(hz + (H - hz) * 0.45)} Q${n(W * 0.3)} ${n(hz + (H - hz) * 0.38)} ${n(W * 0.6)} ${n(hz + (H - hz) * 0.5)} T${W} ${n(hz + (H - hz) * 0.45)} L${W} ${H} L0 ${H}Z" fill="${s.p.fill('#ead7a5')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  return o
}

function ruins(s: S) {
  const { W, H, hz } = s
  let o = sky(s) + ground(s, '#a39780', false)
  for (let i = 0; i < 5; i++) {
    const x = i * (W / 4.5) + s.r() * 30
    const h = 120 + s.r() * 220
    o += rect(s, x, hz - h + 40, 50, h, '#cfc6b0') + poly(s, [[x - 5, hz - h + 40], [x + 20, hz - h + 15], [x + 55, hz - h + 40]], '#bfb59c')
  }
  return o + poly(s, [[W * 0.1, H * 0.8], [W * 0.4, H * 0.78], [W * 0.45, H * 0.9], [W * 0.08, H * 0.92]], '#b8ad95')
}

function stormSky(s: S) {
  const { W, H } = s
  let o = sky(s, 'storm', H)
  for (let i = 0; i < 6; i++) o += `<ellipse cx="${n(s.r() * W)}" cy="${n(s.r() * H * 0.7)}" rx="${n(160 + s.r() * 200)}" ry="${n(60 + s.r() * 60)}" fill="${s.p.fill('#3b4256')}" stroke="${s.p.ink}" stroke-width="${s.lw}" opacity="0.9"/>`
  return o
}

function moonTown(s: S) {
  const { W, H, hz } = s
  let o = sky(s, 'night', H)
  o += `<circle cx="${n(W * 0.68)}" cy="${n(hz * 0.45)}" r="${n(Math.min(W, H) * 0.24)}" fill="${s.p.s.color ? '#fff4c9' : '#fff'}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  if (s.p.s.color) o += `<circle cx="${n(W * 0.68)}" cy="${n(hz * 0.45)}" r="${n(Math.min(W, H) * 0.45)}" fill="url(#glow)" opacity="0.45"/>`
  for (let i = 0; i < 7; i++) {
    const x = i * (W / 6) - 30
    const h = 110 + s.r() * 120
    o += rect(s, x, hz - h + 60, W / 6.5, h + H, '#3a3f78') + poly(s, [[x - 8, hz - h + 62], [x + W / 13, hz - h + 10], [x + W / 6.5 + 8, hz - h + 62]], '#2a2d5c')
    o += `<rect x="${n(x + 24)}" y="${n(hz - h + 90)}" width="22" height="28" fill="${s.p.s.color ? '#ffd27a' : '#fff'}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  }
  for (let i = 0; i < 9; i++) {
    const x = (W / 9) * i + 40
    o += line(s, x, hz + 40, x + W / 9, hz + 30, 0.6) + `<circle cx="${n(x + W / 18)}" cy="${n(hz + 46)}" r="9" fill="${s.p.s.color ? '#ffb86b' : '#fff'}" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.7)}"/>`
  }
  return o + rect(s, 0, hz + 60, W, H, '#262a52', false)
}

function powerPlant(s: S) {
  const { W, hz } = s
  let o = sky(s) + ground(s, '#55575e', false)
  for (const [x, w] of [[0.1, 0.16], [0.32, 0.16]]) o += `<path d="M${n(W * x)} ${n(hz)} Q${n(W * (x + w / 2))} ${n(hz - 160)} ${n(W * x + 10)} ${n(hz - 320)} L${n(W * (x + w) - 10)} ${n(hz - 320)} Q${n(W * (x + w / 2))} ${n(hz - 160)} ${n(W * (x + w))} ${n(hz)}Z" fill="${s.p.fill('#c9c6bd')}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  o += rect(s, W * 0.55, hz - 180, W * 0.35, 180, '#8c8f96')
  for (let i = 0; i < 4; i++) {
    const x = W * (0.58 + i * 0.09)
    o += poly(s, [[x - 18, hz - 180], [x, hz - 360], [x + 18, hz - 180]], '#6f727a', true, 'fill-opacity="0.3"') + line(s, x - 60, hz - 320, x + 60, hz - 320, 1)
  }
  for (let i = 0; i < 3; i++) o += `<path d="M0 ${n(hz - 300 + i * 30)} Q${n(W / 2)} ${n(hz - 230 + i * 30)} ${W} ${n(hz - 310 + i * 30)}" fill="none" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.8)}"/>`
  return o
}

function space(s: S, ring = false) {
  const { W, H } = s
  let o = `<rect width="${W}" height="${H}" fill="${s.p.s.color ? '#05060f' : s.p.ink}"/>${stars(s, H, 160)}`
  if (s.p.s.color) o += `<circle cx="${n(W * 0.2)}" cy="${n(H * 0.25)}" r="${n(W * 0.5)}" fill="#6a2c8c" opacity="0.18"/><circle cx="${n(W * 0.85)}" cy="${n(H * 0.6)}" r="${n(W * 0.4)}" fill="#1f6fae" opacity="0.15"/>`
  o += `<circle cx="${n(W * 0.75)}" cy="${n(H * 1.15)}" r="${n(W * 0.75)}" fill="${s.p.s.color ? '#2e6fb5' : 'url(#tone)'}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>`
  if (s.p.s.color) o += `<circle cx="${n(W * 0.75)}" cy="${n(H * 1.15)}" r="${n(W * 0.78)}" fill="none" stroke="#9fe0ff" stroke-width="10" opacity="0.4"/>`
  if (ring) {
    o += `<ellipse cx="${n(W * 0.45)}" cy="${n(H * 0.5)}" rx="${n(W * 0.62)}" ry="${n(H * 0.16)}" fill="none" stroke="${s.p.ink}" stroke-width="${n(s.lw * 9)}"/><ellipse cx="${n(W * 0.45)}" cy="${n(H * 0.5)}" rx="${n(W * 0.62)}" ry="${n(H * 0.16)}" fill="none" stroke="${s.p.fill('#d9dde6')}" stroke-width="${n(s.lw * 6.5)}"/>`
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const x = W * 0.45 + Math.cos(a) * W * 0.62
      const y = H * 0.5 + Math.sin(a) * H * 0.16
      o += `<rect x="${n(x - 8)}" y="${n(y - 8)}" width="16" height="16" fill="${s.p.s.color ? '#ffcf6b' : '#fff'}" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.6)}"/>`
    }
  }
  return o
}

function hangar(s: S) {
  return room(s, {
    wall: '#5d6675',
    floor: '#3c434f',
    dark: true,
    props: [
      (s2, b) => {
        let o = ''
        for (let i = 0; i < 6; i++) o += line(s2, b.x0 + (i * (b.x1 - b.x0)) / 5, b.y0, b.x0 + (i * (b.x1 - b.x0)) / 5, b.y1, 1.2)
        o += `<path d="M${n(b.x0 + 40)} ${n(b.y1 - 20)} Q${n((b.x0 + b.x1) / 2)} ${n(b.y1 - 160)} ${n(b.x1 - 40)} ${n(b.y1 - 20)}Z" fill="${s2.p.fill('#c2c7d0')}" stroke="${s2.p.ink}" stroke-width="${s2.lw}"/>`
        o += `<ellipse cx="${n((b.x0 + b.x1) / 2)}" cy="${n(b.y1 - 80)}" rx="60" ry="26" fill="${s2.p.fill('#62d6ff')}" stroke="${s2.p.ink}" stroke-width="${s2.lw}"/>`
        return o
      },
    ],
  })
}

function cockpit(s: S) {
  const { W, H } = s
  let o = space(s)
  o += poly(s, [[0, 0], [W, 0], [W, H * 0.12], [W * 0.82, H * 0.22], [W * 0.18, H * 0.22], [0, H * 0.12]], '#2b3240')
  o += poly(s, [[0, H * 0.12], [W * 0.18, H * 0.22], [W * 0.1, H * 0.7], [0, H * 0.75]], '#2b3240') + poly(s, [[W, H * 0.12], [W * 0.82, H * 0.22], [W * 0.9, H * 0.7], [W, H * 0.75]], '#2b3240')
  o += poly(s, [[0, H * 0.7], [W, H * 0.7], [W, H], [0, H]], '#353d4c')
  for (let i = 0; i < 8; i++) o += rect(s, W * (0.1 + i * 0.1), H * 0.76, W * 0.07, H * 0.05, s.p.s.color ? ['#29d0ff', '#ffcf6b', '#ff4b6b', '#5cf2a2'][i % 4] : 'url(#tone-light)')
  return o
}

// ---------- Fondos abstractos ----------

function abstract(s: S, kind: 'white' | 'black' | 'speed' | 'focus' | 'flowers' | 'sparkles' | 'tone') {
  const { W, H, p } = s
  const ink = p.ink
  if (kind === 'white') return `<rect width="${W}" height="${H}" fill="#fff"/>`
  if (kind === 'black') return `<rect width="${W}" height="${H}" fill="${ink}"/>`
  if (kind === 'tone') return `<rect width="${W}" height="${H}" fill="${p.s.color ? p.fill('#cfd6e6') : 'url(#tone-light)'}"/>`
  if (kind === 'speed') {
    let o = `<rect width="${W}" height="${H}" fill="${p.s.color ? '#f3f0ea' : '#fff'}"/>`
    for (let i = 0; i < 70; i++) {
      const y = s.r() * H
      o += `<line x1="${n(s.r() * W * 0.5)}" y1="${n(y)}" x2="${W}" y2="${n(y)}" stroke="${ink}" stroke-width="${n(0.8 + s.r() * 3.5)}"/>`
    }
    return o
  }
  if (kind === 'focus') {
    let o = `<rect width="${W}" height="${H}" fill="#fff"/>`
    const cx = W / 2
    const cy = H / 2
    const R = Math.hypot(W, H)
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2 + s.r() * 0.03
      const inner = Math.min(W, H) * (0.22 + s.r() * 0.12)
      const sp = 0.004 + s.r() * 0.008
      o += `<polygon points="${n(cx + Math.cos(a) * inner)},${n(cy + Math.sin(a) * inner)} ${n(cx + Math.cos(a - sp) * R)},${n(cy + Math.sin(a - sp) * R)} ${n(cx + Math.cos(a + sp) * R)},${n(cy + Math.sin(a + sp) * R)}" fill="${ink}"/>`
    }
    return o
  }
  if (kind === 'flowers') {
    let o = `<rect width="${W}" height="${H}" fill="${p.s.color ? '#ffeef3' : '#fff'}"/>`
    for (let i = 0; i < 26; i++) o += flower(s, s.r() * W, s.r() * H, 26 + s.r() * 40)
    return o
  }
  let o = `<rect width="${W}" height="${H}" fill="${p.s.color ? '#fff7fb' : 'url(#tone-light)'}"/>`
  for (let i = 0; i < 40; i++) o += sparkle(s, s.r() * W, s.r() * H, 8 + s.r() * 22)
  return o
}

export function flower(s: S, x: number, y: number, r: number) {
  let o = ''
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    o += `<ellipse cx="${n(x + Math.cos(a) * r * 0.55)}" cy="${n(y + Math.sin(a) * r * 0.55)}" rx="${n(r * 0.42)}" ry="${n(r * 0.3)}" transform="rotate(${n((a * 180) / Math.PI)} ${n(x + Math.cos(a) * r * 0.55)} ${n(y + Math.sin(a) * r * 0.55)})" fill="${s.p.s.color ? '#ffc2d6' : '#fff'}" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.6)}"/>`
  }
  return o + `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.18)}" fill="${s.p.s.color ? '#ffd35a' : s.p.ink}"/>`
}

export function sparkle(s: S, x: number, y: number, r: number) {
  return `<path d="M${n(x)} ${n(y - r)} Q${n(x + r * 0.12)} ${n(y - r * 0.12)} ${n(x + r)} ${n(y)} Q${n(x + r * 0.12)} ${n(y + r * 0.12)} ${n(x)} ${n(y + r)} Q${n(x - r * 0.12)} ${n(y + r * 0.12)} ${n(x - r)} ${n(y)} Q${n(x - r * 0.12)} ${n(y - r * 0.12)} ${n(x)} ${n(y - r)}Z" fill="${s.p.s.color ? '#fff3a8' : '#fff'}" stroke="${s.p.ink}" stroke-width="${n(s.lw * 0.6)}"/>`
}

// ---------- Mapa de escenarios ----------

export interface SceneOpts {
  angle?: Angle
  seed?: number
}

export function makeS(p: Painter, W: number, H: number, opts: SceneOpts = {}): S {
  const hz = opts.angle === 'low' ? H * 0.78 : opts.angle === 'high' ? H * 0.28 : H * 0.55
  return { p, W, H, hz, vx: W * 0.5, r: mulberry32(opts.seed ?? 1), lw: p.lw(0.75) }
}

export function sceneSvg(id: SceneId, p: Painter, W: number, H: number, opts: SceneOpts = {}): string {
  const s = makeS(p, W, H, opts)
  switch (id) {
    case 'city-night':
    case 'city-day':
      return sky(s, id === 'city-night' ? 'night' : undefined) + skyline(s, s.hz + 40, ['#5f6b84', '#7d6f8f', '#4d5b70', '#8a7c6c'], 2) + ground(s, '#4a4d55')
    case 'street':
      return street(s)
    case 'rain-street':
      return street(s, true)
    case 'alley':
      return alley(s)
    case 'rooftop':
      return sky(s, undefined, s.hz + 60) + skyline(s, s.hz + 60, ['#5f6b84', '#7d6f8f', '#4d5b70'], 2) + poly(s, [[0, s.hz + 40], [s.W, s.hz + 60], [s.W, s.H], [0, s.H]], '#8a8d94') + rect(s, 0, s.hz + 20, s.W, 26, '#6f727a') + line(s, s.W * 0.75, s.hz + 30, s.W * 0.75, s.hz - 90, 1.4) + rect(s, s.W * 0.7, s.hz - 150, s.W * 0.12, 60, '#b0b3ba')
    case 'harbor':
      return harbor(s)
    case 'bridge':
      return bridge(s)
    case 'subway':
    case 'station':
      return room(s, { wall: '#c9c4b5', floor: '#6a6d73', dark: id === 'subway', props: [(s2, b) => rect(s2, b.x0 - 40, b.y1 - 120, b.x1 - b.x0 + 80, 100, '#d0d6dc') + rect(s2, b.x0 - 20, b.y1 - 100, b.x1 - b.x0 + 40, 40, '#2b3240') + line(s2, b.x0 - 40, b.y1 - 70, b.x1 + 40, b.y1 - 70, 2, s2.p.fill('#e2b33c'))] })
    case 'market':
      return street(s) + rect(s, 0, s.H * 0.6, s.W * 0.4, s.H * 0.14, '#d24b3c') + rect(s, s.W * 0.6, s.H * 0.6, s.W * 0.4, s.H * 0.14, '#3c8bd2')
    case 'police':
      return room(s, { wall: '#9aa8b5', floor: '#5c626b', props: [boardProp('#c9b48a'), deskProp] })
    case 'apartment':
      return room(s, { wall: '#d8c9b0', floor: '#8a6b52', props: [windowProp, sofaProp, lampProp] })
    case 'room-dark':
      return room(s, { wall: '#4a4a55', floor: '#2e2e36', dark: true, props: [windowProp, lampProp] })
    case 'bedroom':
      return room(s, { wall: '#efd9e0', floor: '#a88a6d', props: [windowProp, bedProp] })
    case 'office':
      return room(s, { wall: '#d9dde3', floor: '#7b8089', props: [windowProp, deskProp] })
    case 'lab':
      return room(s, { wall: '#d6e4ea', floor: '#8a99a3', props: [screensProp] })
    case 'corridor':
      return room(s, { wall: '#c3bba8', floor: '#6f6a60', props: [doorsProp], dark: s.p.time === 'night' })
    case 'stairwell':
      return rect(s, 0, 0, s.W, s.H, '#b6b0a2', false) + stairsProp(s) + `<rect width="${s.W}" height="${s.H}" fill="url(#vignette)"/>`
    case 'bar':
      return room(s, { wall: '#5a3b2e', floor: '#3a2a22', dark: true, props: [shelvesProp('#5a3b2e'), counterProp('#7a4b33'), lampProp] })
    case 'hardware-store':
      return room(s, { wall: '#c9b896', floor: '#7a6a55', props: [shelvesProp('#a08a65'), counterProp('#8b5a3a')] })
    case 'post-office':
      return room(s, { wall: '#c7d5e8', floor: '#6d7a90', props: [shelvesProp('#7c8ea8'), counterProp('#5a6a85'), lampProp] })
    case 'hospital':
      return room(s, { wall: '#e3ece9', floor: '#9fb0ab', props: [windowProp, bedHospital] })
    case 'school-hall':
      return room(s, { wall: '#e7e2d3', floor: '#a99a7c', props: [lockersProp, windowProp] })
    case 'classroom':
      return room(s, { wall: '#ece4cf', floor: '#9b8364', props: [boardProp('#2f5040'), deskProp, windowProp] })
    case 'music-room':
      return room(s, { wall: '#efe6d6', floor: '#8b6a4b', props: [windowProp, pianoProp] })
    case 'concert-hall':
      return room(s, { wall: '#3a1a22', floor: '#5a2a30', dark: true, props: [stageProp] }) + seatsProp(s)
    case 'art-wall':
      return sky(s) + rect(s, 0, s.H * 0.12, s.W, s.H * 0.7, '#d9cfc0') + mural(s) + ground(s, '#9a9182', false)
    case 'park':
      return park(s)
    case 'garden':
      return park(s, true)
    case 'forest':
      return forest(s)
    case 'cliff':
      return cliff(s)
    case 'beach':
      return beach(s)
    case 'island-sky':
      return islands(s)
    case 'village':
      return village(s)
    case 'academy':
      return academy(s)
    case 'arena':
      return arena(s)
    case 'dojo':
      return dojo(s)
    case 'ruins':
      return ruins(s)
    case 'storm-sky':
      return stormSky(s)
    case 'moon-town':
      return moonTown(s)
    case 'power-plant':
      return powerPlant(s)
    case 'space':
      return space(s)
    case 'orbital-ring':
      return space(s, true)
    case 'hangar':
      return hangar(s)
    case 'cockpit':
      return cockpit(s)
    case 'control-room':
      return room(s, { wall: '#2d3644', floor: '#20262f', dark: true, props: [screensProp] })
    case 'sky-day':
      return sky(s, 'day', s.H)
    case 'sky-night':
      return sky(s, 'night', s.H)
    case 'sunset':
      return sky(s, 'sunset', s.H) + `<circle cx="${n(s.W * 0.5)}" cy="${n(s.H * 0.72)}" r="${n(s.W * 0.18)}" fill="${s.p.s.color ? '#ffe2a0' : '#fff'}" stroke="${s.p.ink}" stroke-width="${s.lw}"/>` + rect(s, 0, s.H * 0.72, s.W, s.H * 0.28, '#4b3a5a', false)
    case 'white':
    case 'black':
    case 'speed':
    case 'focus':
    case 'flowers':
    case 'sparkles':
    case 'tone':
      return abstract(s, id)
  }
}

function mural(s: S) {
  let o = ''
  const cols = ['#9b6fd0', '#ffb3c7', '#6fb3d0', '#ffd35a']
  for (let i = 0; i < 9; i++) o += `<path d="M${n(s.W * (0.05 + i * 0.1))} ${n(s.H * 0.75)} q${n(s.W * 0.04)} ${n(-s.H * 0.3)} ${n(s.W * 0.1)} ${n(-s.H * (0.2 + s.r() * 0.3))}" fill="none" stroke="${s.p.fill(cols[i % 4])}" stroke-width="${n(s.lw * 6)}" stroke-linecap="round"/>`
  for (let i = 0; i < 18; i++) o += flower(s, s.W * (0.08 + s.r() * 0.84), s.H * (0.2 + s.r() * 0.4), 16 + s.r() * 16)
  return o
}
