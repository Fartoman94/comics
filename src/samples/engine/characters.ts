import type { Expr, Framing, Pose, RigSpec } from '../types'
import { darken, lighten, type Painter } from './style'

/**
 * Personajes vectoriales parametrizables. Se dibujan en "unidades de cabeza" (la cabeza mide ~1)
 * con el origen en el centro de la cara; quien llama ubica y escala el grupo. Las líneas se
 * compensan por la escala para que el grosor sea parejo en todas las viñetas.
 */

interface Ctx {
  p: Painter
  rig: RigSpec
  /** Grosor de línea en unidades de cabeza. */
  w: number
  expr: Expr
  /** Mirada: -1 izquierda, 1 derecha. */
  look: number
  id: string
}

const f2 = (n: number) => +n.toFixed(3)
const pts = (a: number[][]) => a.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ')

let seq = 0

// ---------- Proporciones ----------

function proportions(rig: RigSpec, heads: number) {
  const young = rig.age === 'young'
  const k = Math.max(0.75, (heads - 1) / 5.4) * (young ? 0.93 : 1)
  const build = rig.build ?? 'average'
  const sw = (rig.gender === 'f' ? 0.72 : 0.9) * (build === 'strong' ? 1.25 : build === 'slim' ? 0.9 : build === 'small' ? 0.8 : 1)
  return {
    k,
    shoulderY: 0.82,
    sw,
    chestY: 0.82 + 0.75 * k,
    waistY: 0.82 + 1.55 * k,
    hipY: 0.82 + 2.05 * k,
    kneeY: 0.82 + 3.45 * k,
    footY: 0.82 + 4.85 * k,
    hipW: rig.gender === 'f' ? sw * 0.92 : sw * 0.78,
    waistW: rig.gender === 'f' ? sw * 0.62 : sw * 0.74,
    limb: (build === 'strong' ? 0.3 : build === 'slim' || build === 'small' ? 0.2 : 0.24) * (rig.gender === 'f' ? 0.9 : 1),
  }
}

/** Alto total del personaje (de la coronilla a los pies) en unidades de cabeza. */
export function figureHeight(rig: RigSpec, heads: number) {
  return proportions(rig, heads).footY + 0.6
}

// ---------- Primitivas ----------

/** Extremidad con contorno: trazo de tinta más ancho y el color encima. */
function limb(c: Ctx, path: number[][], thick: number, color: string, shadow = true) {
  const d = 'M' + path.map(([x, y]) => `${f2(x)} ${f2(y)}`).join(' L')
  const fill = c.p.fill(color)
  return `<path d="${d}" fill="none" stroke="${c.p.ink}" stroke-width="${f2(thick + c.w * 2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${f2(thick)}" stroke-linecap="round" stroke-linejoin="round"/>${shadow && c.p.s.color ? `<path d="${d}" fill="none" stroke="${c.p.shadow(color)}" stroke-width="${f2(thick * 0.32)}" stroke-linecap="round" transform="translate(${f2(thick * 0.28)} 0)" opacity="0.8"/>` : ''}`
}

function shape(c: Ctx, d: string, color: string, extra = '') {
  return `<path d="${d}" fill="${c.p.fill(color)}" stroke="${c.p.ink}" stroke-width="${f2(c.w)}" stroke-linejoin="round" ${extra}/>`
}

function hand(c: Ctx, x: number, y: number, r = 0.11, fist = false) {
  return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(fist ? r * 1.25 : r)}" fill="${c.p.fill(c.rig.skin, { keepLight: true })}" stroke="${c.p.ink}" stroke-width="${f2(c.w)}"/>${fist ? `<path d="M${f2(x - r * 0.7)} ${f2(y - r * 0.2)} h${f2(r * 1.4)} M${f2(x - r * 0.7)} ${f2(y + r * 0.3)} h${f2(r * 1.4)}" stroke="${c.p.ink}" stroke-width="${f2(c.w * 0.7)}"/>` : ''}`
}

// ---------- Ojos ----------

function eyesSvg(c: Ctx) {
  const { p, expr, look } = c
  const kind = p.s.eyes
  const iris = c.rig.eyes.color
  const lx = look * 0.03
  const out: string[] = []
  const closed = expr === 'happy' || expr === 'laugh'
  const pain = expr === 'pain'
  const big = kind === 'anime' || kind === 'shojo'
  const ex = kind === 'shojo' ? 0.19 : kind === 'anime' ? 0.18 : 0.17
  for (const side of [-1, 1]) {
    const x = side * ex
    const y = kind === 'western' || kind === 'seinen' ? 0.02 : 0.05
    if (closed) {
      out.push(`<path d="M${f2(x - 0.08)} ${f2(y + 0.02)} Q${f2(x)} ${f2(y - 0.07)} ${f2(x + 0.08)} ${f2(y + 0.02)}" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 1.6)}" stroke-linecap="round"/>`)
      continue
    }
    if (pain) {
      out.push(`<path d="M${f2(x - 0.07 * side)} ${f2(y - 0.05)} L${f2(x + 0.06 * side)} ${f2(y)} L${f2(x - 0.07 * side)} ${f2(y + 0.05)}" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 1.6)}" stroke-linecap="round" stroke-linejoin="round"/>`)
      continue
    }
    const narrow = expr === 'angry' || expr === 'determined' || expr === 'serious' || expr === 'smirk' ? 0.72 : expr === 'tired' ? 0.5 : expr === 'surprised' || expr === 'shocked' || expr === 'scared' ? 1.18 : 1
    const rx = big ? (kind === 'shojo' ? 0.085 : 0.075) : kind === 'western' ? 0.068 : 0.064
    const ry = (big ? (kind === 'shojo' ? 0.115 : 0.095) : kind === 'western' ? 0.04 : 0.03) * narrow
    const id = `eye${c.id}${seq++}`
    // Blanco del ojo
    if (big) out.push(`<clipPath id="${id}"><ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}"/></clipPath><ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#fff"/>`)
    else out.push(`<clipPath id="${id}"><path d="M${f2(x - rx)} ${f2(y)} Q${f2(x)} ${f2(y - ry * 2)} ${f2(x + rx)} ${f2(y)} Q${f2(x)} ${f2(y + ry * 1.6)} ${f2(x - rx)} ${f2(y)}Z"/></clipPath><path d="M${f2(x - rx)} ${f2(y)} Q${f2(x)} ${f2(y - ry * 2)} ${f2(x + rx)} ${f2(y)} Q${f2(x)} ${f2(y + ry * 1.6)} ${f2(x - rx)} ${f2(y)}Z" fill="#fff"/>`)
    // Iris y pupila (más chicos si está sorprendido o asustado)
    const tiny = expr === 'shocked' || expr === 'scared' || expr === 'furious'
    const ir = big ? rx * (tiny ? 0.45 : 0.82) : rx * (tiny ? 0.3 : 0.5)
    const irY = y + (big ? ry * 0.08 : 0)
    const irisFill = p.s.color ? p.fill(iris) : 'url(#tone-dense)'
    out.push(`<g clip-path="url(#${id})"><ellipse cx="${f2(x + lx)}" cy="${f2(irY)}" rx="${f2(ir)}" ry="${f2(big ? ir * 1.18 : ir)}" fill="${irisFill}" stroke="${p.ink}" stroke-width="${f2(c.w * 0.5)}"/><ellipse cx="${f2(x + lx)}" cy="${f2(irY + (big ? ir * 0.15 : 0))}" rx="${f2(ir * 0.48)}" ry="${f2(ir * (big ? 0.62 : 0.48))}" fill="${p.ink}"/>${big ? `<ellipse cx="${f2(x + lx - ir * 0.35)}" cy="${f2(irY - ir * 0.4)}" rx="${f2(ir * 0.28)}" ry="${f2(ir * 0.36)}" fill="#fff"/><circle cx="${f2(x + lx + ir * 0.35)}" cy="${f2(irY + ir * 0.45)}" r="${f2(ir * 0.13)}" fill="#fff"/>` : `<circle cx="${f2(x + lx - ir * 0.3)}" cy="${f2(irY - ir * 0.3)}" r="${f2(ir * 0.25)}" fill="#fff"/>`}${p.s.color && big ? `<ellipse cx="${f2(x + lx)}" cy="${f2(irY + ir * 0.55)}" rx="${f2(ir * 0.7)}" ry="${f2(ir * 0.3)}" fill="${lighten(iris, 0.45)}" opacity="0.55"/>` : ''}</g>`)
    // Párpado / pestañas
    const lashW = big ? c.w * (kind === 'shojo' ? 2.4 : 2.1) : c.w * 1.5
    if (big) {
      out.push(`<path d="M${f2(x - rx * 1.12)} ${f2(y - ry * 0.35)} Q${f2(x)} ${f2(y - ry * 1.35)} ${f2(x + rx * 1.12)} ${f2(y - ry * 0.4)}" fill="none" stroke="${p.ink}" stroke-width="${f2(lashW)}" stroke-linecap="round"/>`)
      if (kind === 'shojo' || c.rig.gender === 'f') out.push(`<path d="M${f2(x + side * rx * 1.05)} ${f2(y - ry * 0.45)} l${f2(side * 0.04)} ${f2(-0.035)}" stroke="${p.ink}" stroke-width="${f2(c.w * 1.4)}" stroke-linecap="round"/>`)
      out.push(`<path d="M${f2(x - rx * 0.6)} ${f2(y + ry * 1.02)} Q${f2(x)} ${f2(y + ry * 1.15)} ${f2(x + rx * 0.6)} ${f2(y + ry * 1.02)}" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 0.8)}" stroke-linecap="round"/>`)
    } else {
      out.push(`<path d="M${f2(x - rx * 1.05)} ${f2(y)} Q${f2(x)} ${f2(y - ry * 2.1)} ${f2(x + rx * 1.05)} ${f2(y)}" fill="none" stroke="${p.ink}" stroke-width="${f2(lashW)}" stroke-linecap="round"/>`)
      out.push(`<path d="M${f2(x - rx * 0.8)} ${f2(y - ry * 2.6)} Q${f2(x)} ${f2(y - ry * 3.3)} ${f2(x + rx * 0.8)} ${f2(y - ry * 2.6)}" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 0.6)}" opacity="0.6"/>`)
      if (kind === 'seinen') out.push(`<path d="M${f2(x - rx * 0.7)} ${f2(y + ry * 2.4)} Q${f2(x)} ${f2(y + ry * 3)} ${f2(x + rx * 0.7)} ${f2(y + ry * 2.4)}" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 0.5)}" opacity="0.7"/>`)
    }
    if (expr === 'tired') out.push(`<path d="M${f2(x - rx)} ${f2(y - ry * 0.2)} L${f2(x + rx)} ${f2(y - ry * 0.2)}" stroke="${p.ink}" stroke-width="${f2(c.w * 1.4)}"/>`)
  }
  return out.join('')
}

function browsSvg(c: Ctx) {
  const { expr, p } = c
  const big = p.s.eyes === 'anime' || p.s.eyes === 'shojo'
  const y = big ? -0.11 : -0.07
  const ex = p.s.eyes === 'shojo' ? 0.19 : 0.18
  const thick = p.s.eyes === 'western' ? c.w * 2.6 : p.s.eyes === 'seinen' ? c.w * 1.8 : c.w * 1.5
  const tilt =
    expr === 'angry' || expr === 'furious' || expr === 'determined' ? 0.05 : expr === 'sad' || expr === 'crying' || expr === 'scared' || expr === 'shy' ? -0.045 : expr === 'surprised' || expr === 'shocked' ? -0.02 : 0
  const lift = expr === 'surprised' || expr === 'shocked' ? -0.04 : 0
  let out = ''
  for (const side of [-1, 1]) {
    const x0 = side * (ex - 0.07)
    const x1 = side * (ex + 0.08)
    const raise = expr === 'smirk' && side === 1 ? -0.03 : 0
    out += `<path d="M${f2(x0)} ${f2(y + tilt + lift + raise)} Q${f2(side * ex)} ${f2(y - 0.03 + lift + raise)} ${f2(x1)} ${f2(y - tilt * 0.3 + lift + raise)}" fill="none" stroke="${p.ink}" stroke-width="${f2(thick)}" stroke-linecap="round"/>`
  }
  return out
}

function mouthSvg(c: Ctx) {
  const { expr, p } = c
  const y = p.s.eyes === 'western' || p.s.eyes === 'seinen' ? 0.3 : 0.31
  const ink = p.ink
  const w = c.w * 1.3
  const fillMouth = p.s.color ? '#5a1f2a' : ink
  switch (expr) {
    case 'happy':
    case 'grin':
      return `<path d="M-0.09 ${f2(y - 0.01)} Q0 ${f2(y + 0.08)} 0.09 ${f2(y - 0.01)} Z" fill="${fillMouth}" stroke="${ink}" stroke-width="${f2(w * 0.8)}" stroke-linejoin="round"/>${expr === 'grin' ? `<path d="M-0.08 ${f2(y)} L0.08 ${f2(y)}" stroke="#fff" stroke-width="${f2(c.w * 1.2)}"/>` : ''}`
    case 'laugh':
      return `<path d="M-0.11 ${f2(y - 0.02)} Q0 ${f2(y + 0.13)} 0.11 ${f2(y - 0.02)} Z" fill="${fillMouth}" stroke="${ink}" stroke-width="${f2(w * 0.8)}"/><path d="M-0.05 ${f2(y + 0.05)} Q0 ${f2(y + 0.02)} 0.05 ${f2(y + 0.05)}" fill="${p.s.color ? '#e66a7a' : '#fff'}"/>`
    case 'surprised':
      return `<ellipse cx="0" cy="${f2(y + 0.01)}" rx="0.035" ry="0.05" fill="${fillMouth}" stroke="${ink}" stroke-width="${f2(w * 0.7)}"/>`
    case 'shocked':
    case 'scared':
      return `<path d="M-0.08 ${f2(y + 0.03)} Q-0.06 ${f2(y - 0.04)} 0 ${f2(y - 0.03)} Q0.06 ${f2(y - 0.04)} 0.08 ${f2(y + 0.03)} Q0 ${f2(y + 0.09)} -0.08 ${f2(y + 0.03)}Z" fill="${fillMouth}" stroke="${ink}" stroke-width="${f2(w * 0.7)}"/>`
    case 'angry':
    case 'furious':
      return `<path d="M-0.08 ${f2(y + 0.02)} L-0.05 ${f2(y - 0.02)} L0.05 ${f2(y - 0.02)} L0.08 ${f2(y + 0.02)} L0.05 ${f2(y + 0.05)} L-0.05 ${f2(y + 0.05)}Z" fill="#fff" stroke="${ink}" stroke-width="${f2(w * 0.8)}"/><path d="M-0.06 ${f2(y + 0.015)} L0.06 ${f2(y + 0.015)}" stroke="${ink}" stroke-width="${f2(c.w * 0.6)}"/>`
    case 'sad':
    case 'crying':
      return `<path d="M-0.06 ${f2(y + 0.025)} Q0 ${f2(y - 0.025)} 0.06 ${f2(y + 0.025)}" fill="none" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
    case 'smirk':
      return `<path d="M-0.05 ${f2(y + 0.01)} Q0.03 ${f2(y + 0.03)} 0.07 ${f2(y - 0.025)}" fill="none" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
    case 'determined':
    case 'serious':
      return `<path d="M-0.055 ${f2(y)} L0.055 ${f2(y)}" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
    case 'pain':
      return `<path d="M-0.07 ${f2(y)} L0.07 ${f2(y)} M-0.07 ${f2(y)} Q0 ${f2(y + 0.05)} 0.07 ${f2(y)}" fill="#fff" stroke="${ink}" stroke-width="${f2(w * 0.8)}"/>`
    case 'shy':
      return `<path d="M-0.035 ${f2(y)} Q0 ${f2(y + 0.02)} 0.035 ${f2(y)}" fill="none" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
    case 'tired':
    case 'thinking':
      return `<path d="M-0.03 ${f2(y + 0.005)} L0.04 ${f2(y - 0.005)}" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
    default:
      return `<path d="M-0.045 ${f2(y)} Q0 ${f2(y + 0.025)} 0.045 ${f2(y)}" fill="none" stroke="${ink}" stroke-width="${f2(w)}" stroke-linecap="round"/>`
  }
}

function faceMarks(c: Ctx) {
  const { rig, p, expr } = c
  const out: string[] = []
  const ink = p.ink
  if (rig.mark === 'scar') out.push(`<path d="M0.2 -0.05 L0.32 0.2 M0.24 0.05 l0.05 -0.02 M0.27 0.12 l0.05 -0.02" stroke="${ink}" stroke-width="${f2(c.w)}" stroke-linecap="round"/>`)
  if (rig.mark === 'mole') out.push(`<circle cx="0.16" cy="0.27" r="0.012" fill="${ink}"/>`)
  if (rig.mark === 'freckles') for (const [x, y] of [[-0.24, 0.16], [-0.2, 0.19], [-0.27, 0.2], [0.24, 0.16], [0.2, 0.19], [0.27, 0.2]]) out.push(`<circle cx="${x}" cy="${y}" r="0.008" fill="${p.s.color ? darken(rig.skin, 0.35) : ink}"/>`)
  if (rig.mark === 'glasses') out.push(`<g fill="${p.s.color ? 'rgba(220,235,255,0.25)' : 'none'}" stroke="${ink}" stroke-width="${f2(c.w * 1.1)}"><rect x="-0.3" y="-0.04" width="0.22" height="0.15" rx="0.04"/><rect x="0.08" y="-0.04" width="0.22" height="0.15" rx="0.04"/><path d="M-0.08 0.01 Q0 -0.02 0.08 0.01" fill="none"/></g>`)
  if (rig.mark === 'eyepatch') out.push(`<path d="M-0.42 -0.22 L0.42 0.1" stroke="${ink}" stroke-width="${f2(c.w * 1.2)}"/><ellipse cx="-0.18" cy="0.04" rx="0.11" ry="0.09" fill="${ink}"/>`)
  if (rig.mark === 'bandage') out.push(`<rect x="0.12" y="0.1" width="0.16" height="0.06" rx="0.02" fill="#fff" stroke="${ink}" stroke-width="${f2(c.w * 0.8)}" transform="rotate(-15 0.2 0.13)"/>`)
  if (rig.mark === 'beard') out.push(`<path d="M-0.34 0.12 Q-0.3 0.45 0 0.56 Q0.3 0.45 0.34 0.12 Q0.2 0.36 0 0.4 Q-0.2 0.36 -0.34 0.12Z" fill="${p.fill(rig.hair.color)}" stroke="${ink}" stroke-width="${f2(c.w)}"/>`)
  if (rig.mark === 'stubble') out.push(`<path d="M-0.3 0.18 Q0 0.55 0.3 0.18" fill="none" stroke="${p.s.color ? darken(rig.skin, 0.25) : ink}" stroke-width="${f2(c.w * 3)}" stroke-dasharray="0.004 0.02" opacity="0.6"/>`)
  if (rig.mark === 'earring') out.push(`<circle cx="0.44" cy="0.16" r="0.025" fill="${p.fill('#e8c35a')}" stroke="${ink}" stroke-width="${f2(c.w * 0.6)}"/>`)
  // Mejillas y emociones
  if (expr === 'shy' || expr === 'happy' || expr === 'laugh') {
    const blush = p.s.color ? '#ff7a8a' : ink
    for (const s of [-1, 1]) out.push(p.s.color ? `<ellipse cx="${0.24 * s}" cy="0.16" rx="0.07" ry="0.03" fill="${blush}" opacity="0.45"/>` : `<path d="M${0.18 * s} 0.15 l0.025 -0.035 M${0.22 * s} 0.15 l0.025 -0.035 M${0.26 * s} 0.15 l0.025 -0.035" stroke="${ink}" stroke-width="${f2(c.w * 0.7)}"/>`)
  }
  if (expr === 'crying') for (const s of [-1, 1]) out.push(`<path d="M${0.19 * s} 0.13 q${0.02 * s} 0.14 0 0.24 q${-0.03 * s} -0.08 0 -0.24Z" fill="${p.s.color ? '#9fd8ff' : '#fff'}" stroke="${ink}" stroke-width="${f2(c.w * 0.6)}"/>`)
  if (expr === 'scared' || expr === 'shocked') out.push(`<path d="M-0.3 -0.32 v0.16 M-0.2 -0.36 v0.14 M-0.1 -0.38 v0.12" stroke="${ink}" stroke-width="${f2(c.w * 0.8)}" opacity="0.8"/>`)
  if (expr === 'furious') out.push(`<path d="M0.24 -0.34 q0.05 0.02 0.04 0.07 M0.33 -0.33 q-0.05 0.02 -0.04 0.07 M0.24 -0.22 q0.05 -0.02 0.04 -0.07 M0.33 -0.23 q-0.05 -0.02 -0.04 -0.07" stroke="${p.s.color ? '#e11d48' : ink}" stroke-width="${f2(c.w * 1.3)}" fill="none"/>`)
  return out.join('')
}

// ---------- Cabeza ----------

function headPath(rig: RigSpec) {
  const jaw = rig.gender === 'm' && rig.age !== 'young' ? 0.27 : rig.gender === 'm' ? 0.2 : 0.16
  const chin = rig.age === 'old' ? 0.47 : 0.5
  return `M-0.42 -0.08 C-0.46 -0.62 0.46 -0.62 0.42 -0.08 C0.41 0.18 ${f2(jaw + 0.06)} 0.42 ${f2(jaw * 0.35)} ${chin} L${f2(-jaw * 0.35)} ${chin} C${f2(-jaw - 0.06)} 0.42 -0.41 0.18 -0.42 -0.08Z`
}

function hairBack(c: Ctx) {
  const { rig, p } = c
  const col = rig.hair.color
  const fill = p.fill(col)
  const ink = p.ink
  const lw = f2(c.w)
  switch (rig.hair.style) {
    case 'long':
      return `<path d="M-0.5 -0.2 C-0.62 0.4 -0.6 1.2 -0.5 1.7 L0.5 1.7 C0.6 1.2 0.62 0.4 0.5 -0.2Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'long-wavy':
      return `<path d="M-0.5 -0.2 C-0.7 0.3 -0.45 0.6 -0.62 1 C-0.75 1.35 -0.5 1.6 -0.45 1.8 L0.45 1.8 C0.5 1.6 0.75 1.35 0.62 1 C0.45 0.6 0.7 0.3 0.5 -0.2Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'bob':
      return `<path d="M-0.52 -0.2 C-0.6 0.2 -0.58 0.45 -0.48 0.55 L0.48 0.55 C0.58 0.45 0.6 0.2 0.52 -0.2Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'ponytail':
      return `<path d="M0.3 -0.4 C0.8 -0.5 0.9 0.2 0.75 0.9 C0.7 0.5 0.55 0.1 0.35 -0.1Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'twintails':
      return `<path d="M-0.42 -0.3 C-0.9 -0.2 -0.95 0.6 -0.75 1.1 C-0.7 0.6 -0.6 0.2 -0.42 0Z M0.42 -0.3 C0.9 -0.2 0.95 0.6 0.75 1.1 C0.7 0.6 0.6 0.2 0.42 0Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'braid':
      return `<path d="M0.25 0.2 q0.2 0.2 0.1 0.35 q0.15 0.15 0.05 0.32 q0.15 0.15 0.02 0.32 l-0.12 0 q-0.08 -0.17 0.03 -0.3 q-0.12 -0.17 0 -0.33 q-0.12 -0.15 0.02 -0.34Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    case 'bun':
      return `<circle cx="0" cy="-0.62" r="0.2" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
    default:
      return ''
  }
}

function hairFront(c: Ctx) {
  const { rig, p } = c
  const fill = p.fill(rig.hair.color)
  const ink = p.ink
  const lw = f2(c.w)
  const shine = p.s.color ? `<path d="M-0.22 -0.42 Q0 -0.5 0.22 -0.42" fill="none" stroke="${lighten(rig.hair.color, 0.45)}" stroke-width="${f2(c.w * 2.2)}" stroke-linecap="round" opacity="0.7"/>` : rig.hair.color && p.fill(rig.hair.color) === ink ? `<path d="M-0.2 -0.43 Q0 -0.5 0.2 -0.43" fill="none" stroke="#fff" stroke-width="${f2(c.w * 1.6)}" stroke-linecap="round"/>` : ''
  const cap = `<path d="M-0.46 -0.05 C-0.55 -0.7 0.55 -0.7 0.46 -0.05 C0.4 -0.3 0.2 -0.36 0 -0.34 C-0.2 -0.36 -0.4 -0.3 -0.46 -0.05Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>`
  switch (rig.hair.style) {
    case 'bald':
      return `<path d="M-0.3 -0.45 Q0 -0.56 0.3 -0.45" fill="none" stroke="${p.s.color ? lighten(rig.skin, 0.4) : '#fff'}" stroke-width="${f2(c.w * 2)}" opacity="0.6"/>`
    case 'buzz':
      return `<path d="M-0.44 -0.12 C-0.5 -0.66 0.5 -0.66 0.44 -0.12 C0.36 -0.36 -0.36 -0.36 -0.44 -0.12Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}" opacity="0.85"/>`
    case 'spiky': {
      const sp = [[-0.5, -0.05], [-0.62, -0.45], [-0.38, -0.42], [-0.45, -0.78], [-0.15, -0.55], [-0.05, -0.92], [0.12, -0.58], [0.38, -0.82], [0.35, -0.48], [0.65, -0.5], [0.48, -0.25], [0.52, -0.02], [0.3, -0.22], [0.18, -0.08], [0.02, -0.25], [-0.12, -0.08], [-0.24, -0.24]]
      return `<polygon points="${pts(sp)}" fill="${fill}" stroke="${ink}" stroke-width="${lw}" stroke-linejoin="round"/>${shine}`
    }
    case 'messy': {
      const sp = [[-0.5, 0], [-0.58, -0.35], [-0.44, -0.6], [-0.2, -0.66], [-0.1, -0.74], [0.12, -0.66], [0.36, -0.66], [0.52, -0.46], [0.56, -0.12], [0.44, 0.02], [0.36, -0.18], [0.24, -0.1], [0.12, -0.24], [0, -0.12], [-0.14, -0.22], [-0.26, -0.08], [-0.36, -0.2]]
      return `<polygon points="${pts(sp)}" fill="${fill}" stroke="${ink}" stroke-width="${lw}" stroke-linejoin="round"/>${shine}`
    }
    case 'mohawk':
      return `<path d="M-0.12 -0.45 L-0.08 -0.95 L0 -0.6 L0.06 -1 L0.1 -0.62 L0.18 -0.9 L0.14 -0.45Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.44 -0.1 C-0.5 -0.6 0.5 -0.6 0.44 -0.1" fill="none" stroke="${ink}" stroke-width="${f2(c.w * 0.6)}" opacity="0.5"/>`
    case 'slick':
      return `<path d="M-0.47 -0.08 C-0.56 -0.72 0.56 -0.72 0.47 -0.08 C0.45 -0.35 0.1 -0.46 -0.18 -0.4 C-0.35 -0.36 -0.44 -0.22 -0.47 -0.08Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.18 -0.4 Q0.1 -0.55 0.4 -0.3" fill="none" stroke="${p.s.color ? lighten(rig.hair.color, 0.3) : '#fff'}" stroke-width="${f2(c.w)}"/>`
    case 'side-swept':
      return `<path d="M-0.47 0 C-0.56 -0.72 0.56 -0.72 0.47 -0.05 C0.4 -0.2 0.3 -0.22 0.2 -0.2 C0.05 -0.1 -0.15 0.12 -0.35 0.18 C-0.25 0 -0.3 -0.2 -0.47 0Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}"/>${shine}`
    case 'bob':
    case 'long':
    case 'long-wavy':
    case 'twintails':
    case 'ponytail':
    case 'braid':
    case 'bun':
      // Flequillo en mechones.
      return `<path d="M-0.47 0.02 C-0.56 -0.72 0.56 -0.72 0.47 0.02 L0.4 -0.12 L0.33 0.02 L0.26 -0.18 L0.15 -0.02 L0.06 -0.2 L-0.05 -0.02 L-0.14 -0.2 L-0.25 -0.02 L-0.33 -0.17 L-0.4 -0.02Z" fill="${fill}" stroke="${ink}" stroke-width="${lw}" stroke-linejoin="round"/>${shine}`
    default:
      return cap + shine
  }
}

function accessoryHead(c: Ctx) {
  const { rig, p } = c
  const a = rig.accessory
  const col = rig.outfit.accent
  const ink = p.ink
  const lw = f2(c.w)
  if (a === 'headband') return `<path d="M-0.47 -0.24 Q0 -0.38 0.47 -0.24 L0.46 -0.15 Q0 -0.28 -0.46 -0.15Z" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><path d="M0.46 -0.2 l0.25 0.12 l-0.05 0.08 Z M0.46 -0.18 l0.2 0.2 l-0.08 0.05Z" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/>`
  if (a === 'goggles') return `<path d="M-0.47 -0.26 Q0 -0.36 0.47 -0.26" fill="none" stroke="${ink}" stroke-width="${f2(c.w * 3)}"/><g fill="${p.s.color ? '#7fd3ff' : '#fff'}" stroke="${ink}" stroke-width="${lw}"><ellipse cx="-0.17" cy="-0.34" rx="0.13" ry="0.09"/><ellipse cx="0.17" cy="-0.34" rx="0.13" ry="0.09"/></g>`
  if (a === 'cap') return `<path d="M-0.48 -0.18 C-0.5 -0.75 0.5 -0.75 0.48 -0.18Z" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.1 -0.2 Q0.4 -0.3 0.75 -0.14 Q0.4 -0.08 -0.1 -0.12Z" fill="${p.fill(darken(col, 0.2))}" stroke="${ink}" stroke-width="${lw}"/>`
  if (a === 'hat') return `<ellipse cx="0" cy="-0.36" rx="0.72" ry="0.12" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.4 -0.38 C-0.42 -0.85 0.42 -0.85 0.4 -0.38Z" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.4 -0.5 L0.4 -0.5" stroke="${p.fill(darken(col, 0.4))}" stroke-width="${f2(c.w * 3)}"/>`
  if (a === 'ribbon') return `<path d="M0.25 -0.48 l0.2 -0.12 l0 0.2Z M0.25 -0.48 l-0.12 -0.18 l-0.06 0.2Z" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><circle cx="0.25" cy="-0.48" r="0.04" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/>`
  if (a === 'visor') return `<path d="M-0.46 -0.1 Q0 -0.22 0.46 -0.1 L0.42 0.06 Q0 -0.04 -0.42 0.06Z" fill="${p.s.color ? 'rgba(80,220,255,0.55)' : 'url(#tone-light)'}" stroke="${ink}" stroke-width="${lw}"/>`
  if (rig.mark === 'headphones') return `<path d="M-0.47 -0.05 C-0.5 -0.75 0.5 -0.75 0.47 -0.05" fill="none" stroke="${ink}" stroke-width="${f2(c.w * 3.4)}"/><rect x="-0.56" y="-0.12" width="0.14" height="0.24" rx="0.05" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/><rect x="0.42" y="-0.12" width="0.14" height="0.24" rx="0.05" fill="${p.fill(col)}" stroke="${ink}" stroke-width="${lw}"/>`
  return ''
}

/** Cabeza completa (de frente). */
export function headSvg(c: Ctx) {
  const { rig, p } = c
  const skin = p.fill(rig.skin, { keepLight: true })
  const nose = p.s.eyes === 'western' || p.s.eyes === 'seinen' ? `<path d="M0.01 0.08 L-0.04 0.2 L0.03 0.21" fill="none" stroke="${p.ink}" stroke-width="${f2(c.w * 0.9)}" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="M0.015 0.17 l-0.025 0.025" stroke="${p.ink}" stroke-width="${f2(c.w * 0.9)}" stroke-linecap="round"/>`
  const shade = p.s.color ? `<path d="M0.42 -0.08 C0.41 0.18 0.33 0.42 0.09 0.5 C0.25 0.3 0.3 0.1 0.32 -0.1Z" fill="${p.shadow(rig.skin)}" opacity="0.5"/>` : p.s.shade === 'hatch' ? `<path d="M0.42 -0.05 C0.41 0.18 0.33 0.42 0.12 0.5 C0.26 0.3 0.31 0.12 0.33 -0.05Z" fill="url(#hatch)" opacity="0.7"/>` : ''
  return [
    hairBack(c),
    // Orejas
    `<ellipse cx="-0.43" cy="0.05" rx="0.06" ry="0.1" fill="${skin}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/><ellipse cx="0.43" cy="0.05" rx="0.06" ry="0.1" fill="${skin}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>`,
    `<path d="${headPath(rig)}" fill="${skin}" stroke="${p.ink}" stroke-width="${f2(c.w * 1.1)}" stroke-linejoin="round"/>`,
    shade,
    eyesSvg(c),
    browsSvg(c),
    nose,
    mouthSvg(c),
    faceMarks(c),
    hairFront(c),
    accessoryHead(c),
  ].join('')
}

// ---------- Cuerpo ----------

function outfitColors(rig: RigSpec) {
  const o = rig.outfit
  const pants = o.kind === 'school-f' || o.kind === 'dress' ? o.main : o.kind === 'suit' || o.kind === 'uniform' || o.kind === 'flight-suit' || o.kind === 'armor' ? o.main : darken(o.accent, 0.25)
  const sleeve = o.kind === 'tshirt' || o.kind === 'apron' ? rig.skin : o.main
  return { main: o.main, accent: o.accent, pants, sleeve }
}

interface Arms {
  l: number[][]
  r: number[][]
  lFist?: boolean
  rFist?: boolean
  lFront?: boolean
  rFront?: boolean
}

function armsFor(pose: Pose, P: ReturnType<typeof proportions>): Arms {
  const sx = P.sw
  const sy = P.shoulderY + 0.08
  const L = 1.15 * P.k
  const S = (x: number) => [x, sy]
  switch (pose) {
    case 'arms-crossed':
      return { l: [S(-sx), [-sx * 0.75, sy + L * 0.8], [sx * 0.35, sy + L * 0.62]], r: [S(sx), [sx * 0.75, sy + L * 0.82], [-sx * 0.3, sy + L * 0.66]], lFront: true, rFront: true }
    case 'point':
      return { l: [S(-sx), [-sx - 0.05, sy + L * 0.95], [-sx * 0.9, sy + L * 1.85]], r: [S(sx), [sx + L * 0.9, sy + 0.05], [sx + L * 1.85, sy - 0.05]] }
    case 'fist':
      return { l: [S(-sx), [-sx - 0.05, sy + L * 0.95], [-sx * 0.9, sy + L * 1.85]], r: [S(sx), [sx + 0.35, sy + L * 0.75], [sx * 0.3, sy + L * 0.45]], rFist: true, rFront: true }
    case 'punch':
      return { l: [S(-sx), [-sx - 0.25, sy + L * 0.7], [-sx * 0.4, sy + L * 0.5]], r: [S(sx), [sx + L * 0.7, sy + 0.1], [sx + L * 1.7, sy + 0.05]], rFist: true, lFist: true }
    case 'run':
      return { l: [S(-sx), [-sx - 0.35, sy + L * 0.7], [-sx - 0.1, sy + L * 1.3]], r: [S(sx), [sx + 0.3, sy + L * 0.8], [sx + 0.7, sy + L * 0.45]], rFist: true, lFist: true }
    case 'fly':
      return { l: [S(-sx), [-sx - L * 0.8, sy + L * 0.5], [-sx - L * 1.5, sy + L * 0.9]], r: [S(sx), [sx + L * 0.8, sy + L * 0.5], [sx + L * 1.5, sy + L * 0.9]] }
    case 'hands-hips':
      return { l: [S(-sx), [-sx - 0.35, sy + L * 0.6], [-P.waistW - 0.02, sy + L * 1.12]], r: [S(sx), [sx + 0.35, sy + L * 0.6], [P.waistW + 0.02, sy + L * 1.12]], lFist: true, rFist: true }
    case 'reach':
    case 'wave':
      return { l: [S(-sx), [-sx - 0.05, sy + L * 0.95], [-sx * 0.9, sy + L * 1.85]], r: [S(sx), [sx + L * 0.55, sy - L * 0.6], [sx + L * 0.75, sy - L * 1.5]] }
    case 'guard':
      return { l: [S(-sx), [-sx * 0.5, sy + L * 0.8], [-0.15, sy - 0.1]], r: [S(sx), [sx * 0.5, sy + L * 0.8], [0.15, sy - 0.2]], lFist: true, rFist: true, lFront: true, rFront: true }
    case 'cover-face':
      return { l: [S(-sx), [-sx * 0.6, sy + L * 0.75], [-0.12, -0.05]], r: [S(sx), [sx * 0.6, sy + L * 0.75], [0.12, -0.05]], lFront: true, rFront: true }
    case 'hold':
      return { l: [S(-sx), [-sx * 0.8, sy + L * 0.85], [-0.12, sy + L * 0.9]], r: [S(sx), [sx * 0.8, sy + L * 0.85], [0.12, sy + L * 0.9]], lFront: true, rFront: true }
    case 'fall':
      return { l: [S(-sx), [-sx - L * 0.7, sy - L * 0.3], [-sx - L * 1.2, sy - L * 1]], r: [S(sx), [sx + L * 0.8, sy - L * 0.2], [sx + L * 1.4, sy - L * 0.8]] }
    default:
      return { l: [S(-sx), [-sx - 0.06, sy + L * 0.95], [-sx * 0.95, sy + L * 1.85]], r: [S(sx), [sx + 0.06, sy + L * 0.95], [sx * 0.95, sy + L * 1.85]] }
  }
}

function legsFor(pose: Pose, P: ReturnType<typeof proportions>) {
  const hy = P.hipY
  const hx = P.hipW * 0.5
  const k = P.kneeY
  const f = P.footY
  switch (pose) {
    case 'run':
      return { l: [[-hx, hy], [-hx - 0.55, k - 0.2], [-hx - 0.35, f - 0.4]], r: [[hx, hy], [hx + 0.5, k - 0.4], [hx + 1.05, k + 0.2]] }
    case 'fly':
      return { l: [[-hx, hy], [-hx - 0.1, k], [-hx - 0.35, f - 0.1]], r: [[hx, hy], [hx + 0.25, k - 0.2], [hx + 0.2, f - 0.5]] }
    case 'sit':
      return { l: [[-hx, hy], [-hx - 0.1, hy + 0.15], [-hx - 0.15, k + 0.4]], r: [[hx, hy], [hx + 0.1, hy + 0.15], [hx + 0.15, k + 0.4]] }
    case 'kneel':
      return { l: [[-hx, hy], [-hx - 0.2, k], [-hx + 0.4, k + 0.05]], r: [[hx, hy], [hx + 0.3, k - 0.5], [hx + 0.35, k + 0.3]] }
    case 'punch':
    case 'guard':
      return { l: [[-hx, hy], [-hx - 0.45, k], [-hx - 0.7, f]], r: [[hx, hy], [hx + 0.4, k], [hx + 0.6, f]] }
    case 'fall':
      return { l: [[-hx, hy], [-hx - 0.4, k - 0.3], [-hx - 0.9, k - 0.6]], r: [[hx, hy], [hx + 0.3, k - 0.1], [hx + 0.9, k - 0.2]] }
    default:
      return { l: [[-hx, hy], [-hx - 0.05, k], [-hx - 0.08, f]], r: [[hx, hy], [hx + 0.05, k], [hx + 0.08, f]] }
  }
}

function torsoSvg(c: Ctx, P: ReturnType<typeof proportions>) {
  const { rig, p } = c
  const o = rig.outfit
  const col = outfitColors(rig)
  const ink = p.ink
  const lw = f2(c.w)
  const sy = P.shoulderY
  const long = o.kind === 'coat' || o.kind === 'lab-coat' || o.kind === 'robe' || o.kind === 'kimono' || o.kind === 'dress'
  const bottom = long ? P.kneeY - 0.15 : o.kind === 'school-f' ? P.hipY + 0.55 : P.hipY + 0.12
  const hemW = long ? P.hipW * 1.25 : o.kind === 'school-f' ? P.hipW * 1.35 : P.hipW
  const body = `M${f2(-P.sw)} ${f2(sy + 0.05)} Q${f2(-P.sw * 0.6)} ${f2(sy - 0.08)} -0.15 ${f2(sy - 0.06)} L0.15 ${f2(sy - 0.06)} Q${f2(P.sw * 0.6)} ${f2(sy - 0.08)} ${f2(P.sw)} ${f2(sy + 0.05)} L${f2(P.waistW)} ${f2(P.waistY)} L${f2(hemW)} ${f2(bottom)} L${f2(-hemW)} ${f2(bottom)} L${f2(-P.waistW)} ${f2(P.waistY)}Z`
  const out = [shape(c, body, col.main)]
  // Sombra lateral
  out.push(`<path d="M${f2(P.sw * 0.55)} ${f2(sy + 0.05)} L${f2(P.sw)} ${f2(sy + 0.05)} L${f2(P.waistW)} ${f2(P.waistY)} L${f2(hemW)} ${f2(bottom)} L${f2(hemW * 0.6)} ${f2(bottom)}Z" fill="${p.shadow(col.main)}" opacity="${p.s.color ? 0.55 : 0.45}"/>`)
  const acc = p.fill(col.accent)
  switch (o.kind) {
    case 'hoodie':
      out.push(`<path d="M-0.42 ${f2(sy - 0.02)} Q0 ${f2(sy + 0.35)} 0.42 ${f2(sy - 0.02)} Q0 ${f2(sy + 0.12)} -0.42 ${f2(sy - 0.02)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.08 ${f2(sy + 0.15)} l-0.03 0.35 M0.08 ${f2(sy + 0.15)} l0.03 0.35" stroke="${ink}" stroke-width="${f2(c.w * 0.9)}"/><path d="M${f2(-P.waistW * 0.75)} ${f2(P.waistY - 0.1)} L${f2(P.waistW * 0.75)} ${f2(P.waistY - 0.1)} L${f2(P.waistW * 0.9)} ${f2(P.waistY + 0.25)} L${f2(-P.waistW * 0.9)} ${f2(P.waistY + 0.25)}Z" fill="none" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    case 'jacket':
    case 'coat':
    case 'lab-coat':
      out.push(`<path d="M-0.15 ${f2(sy - 0.06)} L-0.04 ${f2(P.waistY)} L-0.12 ${f2(bottom)} M0.15 ${f2(sy - 0.06)} L0.04 ${f2(P.waistY)} L0.12 ${f2(bottom)}" fill="none" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.15 ${f2(sy - 0.06)} L-0.3 ${f2(sy + 0.35)} L-0.12 ${f2(sy + 0.45)}Z M0.15 ${f2(sy - 0.06)} L0.3 ${f2(sy + 0.35)} L0.12 ${f2(sy + 0.45)}Z" fill="${p.fill(darken(col.main, 0.15))}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.1 ${f2(sy - 0.04)} L0 ${f2(P.waistY - 0.1)} L0.1 ${f2(sy - 0.04)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    case 'suit':
      out.push(`<path d="M-0.12 ${f2(sy - 0.05)} L0 ${f2(P.waistY - 0.2)} L0.12 ${f2(sy - 0.05)}Z" fill="#fff" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.04 ${f2(sy)} L0.04 ${f2(sy)} L0.05 ${f2(P.waistY - 0.3)} L0 ${f2(P.waistY - 0.2)} L-0.05 ${f2(P.waistY - 0.3)}Z" fill="${acc}" stroke="${ink}" stroke-width="${f2(c.w * 0.8)}"/><path d="M-0.12 ${f2(sy - 0.05)} L-0.28 ${f2(sy + 0.4)} L-0.06 ${f2(P.waistY - 0.1)} M0.12 ${f2(sy - 0.05)} L0.28 ${f2(sy + 0.4)} L0.06 ${f2(P.waistY - 0.1)}" fill="none" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    case 'school-f':
      out.push(`<path d="M-0.42 ${f2(sy - 0.02)} L0 ${f2(sy + 0.42)} L0.42 ${f2(sy - 0.02)} L0.3 ${f2(sy + 0.3)} L0 ${f2(sy + 0.55)} L-0.3 ${f2(sy + 0.3)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M-0.42 ${f2(sy + 0.12)} L0 ${f2(sy + 0.5)} L0.42 ${f2(sy + 0.12)}" fill="none" stroke="#fff" stroke-width="${f2(c.w * 1.2)}"/><path d="M0 ${f2(sy + 0.5)} l-0.14 0.14 l0.14 -0.04 l0.14 0.04Z" fill="${p.fill('#c0262d')}" stroke="${ink}" stroke-width="${lw}"/><path d="M${f2(-P.hipW)} ${f2(P.hipY - 0.05)} L${f2(P.hipW)} ${f2(P.hipY - 0.05)}" stroke="${ink}" stroke-width="${lw}"/>${[-0.6, -0.2, 0.2, 0.6].map((t) => `<path d="M${f2(t * P.hipW)} ${f2(P.hipY)} L${f2(t * hemW * 1.05)} ${f2(bottom)}" stroke="${ink}" stroke-width="${f2(c.w * 0.6)}"/>`).join('')}`)
      break
    case 'school-m':
    case 'uniform':
      out.push(`<path d="M-0.12 ${f2(sy - 0.06)} L-0.12 ${f2(sy + 0.08)} L0.12 ${f2(sy + 0.08)} L0.12 ${f2(sy - 0.06)}" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M0 ${f2(sy + 0.08)} L0 ${f2(bottom)}" stroke="${ink}" stroke-width="${lw}"/>${[0.3, 0.6, 0.9, 1.2].map((t) => `<circle cx="0.05" cy="${f2(sy + t * P.k)}" r="0.025" fill="${p.fill('#e8c35a')}" stroke="${ink}" stroke-width="${f2(c.w * 0.5)}"/>`).join('')}${o.kind === 'uniform' ? `<rect x="${f2(-P.sw * 0.7)}" y="${f2(sy + 0.25)}" width="0.18" height="0.12" rx="0.02" fill="${acc}" stroke="${ink}" stroke-width="${f2(c.w * 0.7)}"/><path d="M${f2(-P.waistW)} ${f2(P.waistY)} L${f2(P.waistW)} ${f2(P.waistY)}" stroke="${p.fill(darken(col.main, 0.5))}" stroke-width="${f2(c.w * 3)}"/>` : ''}`)
      break
    case 'flight-suit':
      out.push(`<path d="M0 ${f2(sy - 0.04)} L0 ${f2(bottom)}" stroke="${ink}" stroke-width="${f2(c.w * 1.4)}"/><path d="M${f2(-P.sw * 0.8)} ${f2(sy + 0.05)} L${f2(P.waistW * 0.4)} ${f2(P.waistY)} M${f2(P.sw * 0.8)} ${f2(sy + 0.05)} L${f2(-P.waistW * 0.4)} ${f2(P.waistY)}" stroke="${acc}" stroke-width="${f2(c.w * 3)}"/><rect x="${f2(P.sw * 0.25)}" y="${f2(sy + 0.25)}" width="0.2" height="0.14" rx="0.03" fill="${acc}" stroke="${ink}" stroke-width="${f2(c.w * 0.7)}"/>`)
      break
    case 'armor':
      out.push(`<path d="M${f2(-P.sw - 0.12)} ${f2(sy + 0.12)} Q${f2(-P.sw)} ${f2(sy - 0.15)} ${f2(-P.sw * 0.45)} ${f2(sy)} L${f2(-P.sw * 0.55)} ${f2(sy + 0.3)}Z M${f2(P.sw + 0.12)} ${f2(sy + 0.12)} Q${f2(P.sw)} ${f2(sy - 0.15)} ${f2(P.sw * 0.45)} ${f2(sy)} L${f2(P.sw * 0.55)} ${f2(sy + 0.3)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M${f2(-P.waistW * 0.8)} ${f2(sy + 0.4)} L0 ${f2(sy + 0.6)} L${f2(P.waistW * 0.8)} ${f2(sy + 0.4)}" fill="none" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    case 'robe':
    case 'kimono':
      out.push(`<path d="M-0.15 ${f2(sy - 0.06)} L0.25 ${f2(P.waistY)} M0.15 ${f2(sy - 0.06)} L-0.05 ${f2(sy + 0.4)}" fill="none" stroke="${ink}" stroke-width="${lw}"/><path d="M${f2(-P.waistW)} ${f2(P.waistY - 0.1)} L${f2(P.waistW)} ${f2(P.waistY - 0.1)} L${f2(P.waistW)} ${f2(P.waistY + 0.12)} L${f2(-P.waistW)} ${f2(P.waistY + 0.12)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    case 'apron':
    case 'workwear':
      out.push(`<path d="M${f2(-P.waistW * 0.7)} ${f2(sy + 0.25)} L${f2(P.waistW * 0.7)} ${f2(sy + 0.25)} L${f2(P.hipW * 0.85)} ${f2(bottom)} L${f2(-P.hipW * 0.85)} ${f2(bottom)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M${f2(-P.waistW * 0.6)} ${f2(sy + 0.25)} L-0.35 ${f2(sy)} M${f2(P.waistW * 0.6)} ${f2(sy + 0.25)} L0.35 ${f2(sy)}" stroke="${ink}" stroke-width="${f2(c.w * 1.4)}"/><rect x="-0.14" y="${f2(sy + 0.45)}" width="0.28" height="0.18" fill="none" stroke="${ink}" stroke-width="${f2(c.w * 0.8)}"/>`)
      break
    case 'cape-hero':
      out.push(`<path d="M-0.18 ${f2(sy + 0.25)} L0 ${f2(sy + 0.12)} L0.18 ${f2(sy + 0.25)} L0.06 ${f2(sy + 0.38)} L0.14 ${f2(sy + 0.38)} L-0.06 ${f2(sy + 0.62)} L0 ${f2(sy + 0.45)} L-0.12 ${f2(sy + 0.45)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M${f2(-P.waistW)} ${f2(P.waistY)} L${f2(P.waistW)} ${f2(P.waistY)}" stroke="${acc}" stroke-width="${f2(c.w * 3.5)}"/>`)
      break
    case 'sweater':
      out.push(`<path d="M-0.16 ${f2(sy - 0.04)} Q0 ${f2(sy + 0.12)} 0.16 ${f2(sy - 0.04)}" fill="none" stroke="${ink}" stroke-width="${f2(c.w * 1.4)}"/>${[0.35, 0.7, 1.05].map((t) => `<path d="M${f2(-P.waistW * 0.9)} ${f2(sy + t * P.k)} L${f2(P.waistW * 0.9)} ${f2(sy + t * P.k)}" stroke="${acc}" stroke-width="${f2(c.w * 2)}" opacity="0.8"/>`).join('')}`)
      break
    case 'dress':
      out.push(`<path d="M${f2(-P.waistW)} ${f2(P.waistY)} L${f2(P.waistW)} ${f2(P.waistY)}" stroke="${acc}" stroke-width="${f2(c.w * 3)}"/><path d="M-0.18 ${f2(sy - 0.04)} Q0 ${f2(sy + 0.22)} 0.18 ${f2(sy - 0.04)}" fill="none" stroke="${ink}" stroke-width="${lw}"/>`)
      break
    default:
      out.push(`<path d="M-0.15 ${f2(sy - 0.05)} Q0 ${f2(sy + 0.12)} 0.15 ${f2(sy - 0.05)}" fill="none" stroke="${ink}" stroke-width="${lw}"/>`)
  }
  if (rig.accessory === 'scarf') out.push(`<path d="M-0.38 ${f2(sy - 0.08)} Q0 ${f2(sy + 0.12)} 0.38 ${f2(sy - 0.08)} L0.36 ${f2(sy + 0.08)} Q0 ${f2(sy + 0.26)} -0.36 ${f2(sy + 0.08)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/><path d="M0.2 ${f2(sy + 0.12)} L0.34 ${f2(sy + 0.75)} L0.12 ${f2(sy + 0.72)}Z" fill="${acc}" stroke="${ink}" stroke-width="${lw}"/>`)
  if (rig.accessory === 'necklace') out.push(`<path d="M-0.15 ${f2(sy - 0.04)} Q0 ${f2(sy + 0.22)} 0.15 ${f2(sy - 0.04)}" fill="none" stroke="${p.fill('#e8c35a')}" stroke-width="${f2(c.w * 1.2)}"/><circle cx="0" cy="${f2(sy + 0.15)}" r="0.04" fill="${acc}" stroke="${ink}" stroke-width="${f2(c.w * 0.7)}"/>`)
  if (rig.accessory === 'bag' || rig.accessory === 'satchel') out.push(`<path d="M${f2(-P.sw * 0.7)} ${f2(sy)} L${f2(P.waistW + 0.1)} ${f2(P.hipY)}" stroke="${p.fill(darken(col.accent, 0.3))}" stroke-width="${f2(c.w * 3)}"/><rect x="${f2(P.waistW - 0.05)}" y="${f2(P.hipY - 0.15)}" width="0.42" height="0.34" rx="0.05" fill="${p.fill(col.accent)}" stroke="${ink}" stroke-width="${lw}"/>`)
  return out.join('')
}

/**
 * Personaje completo según el encuadre. Devuelve el SVG en unidades de cabeza y su caja
 * (para que quien compone lo escale y ubique).
 */
export function figureSvg(
  p: Painter,
  rig: RigSpec,
  opts: { expr?: Expr; pose?: Pose; framing?: Framing; look?: number; id?: string; scaleForLine: number },
): { svg: string; top: number; bottom: number; halfWidth: number } {
  const c: Ctx = { p, rig, w: p.lw() / opts.scaleForLine, expr: opts.expr ?? 'neutral', look: opts.look ?? 0, id: opts.id ?? 'c' }
  const P = proportions(rig, p.s.heads)
  const pose = opts.pose ?? 'stand'
  const framing = opts.framing ?? 'bust'
  const col = outfitColors(rig)
  const parts: string[] = []
  const behind: string[] = []
  const front: string[] = []

  if (rig.accessory === 'cape' || rig.outfit.kind === 'cape-hero') behind.push(`<path d="M${f2(-P.sw)} ${f2(P.shoulderY)} Q${f2(-P.sw * 1.6)} ${f2(P.kneeY)} ${f2(-P.sw * 1.4)} ${f2(P.footY - 0.3)} L${f2(P.sw * 1.4)} ${f2(P.footY - 0.3)} Q${f2(P.sw * 1.6)} ${f2(P.kneeY)} ${f2(P.sw)} ${f2(P.shoulderY)}Z" fill="${p.fill(col.accent)}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>`)

  if (framing !== 'face' && framing !== 'eyes') {
    const arms = armsFor(pose, P)
    const legs = legsFor(pose, P)
    const armT = P.limb
    const armSvg = (a: number[][], fist: boolean | undefined, metal: boolean) =>
      limb(c, a, armT, metal ? '#9aa4b2' : col.sleeve) +
      (metal ? `<circle cx="${f2(a[1][0])}" cy="${f2(a[1][1])}" r="${f2(armT * 0.45)}" fill="${p.fill('#5f6b7a')}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>` : '') +
      hand(c, a[2][0], a[2][1], armT * 0.48, fist)
    // Piernas (sólo en planos medios y enteros)
    if (framing === 'full' || framing === 'half' || framing === 'back' || framing === 'silhouette') {
      parts.push(limb(c, legs.l, P.limb * 1.25, col.pants), limb(c, legs.r, P.limb * 1.25, col.pants))
      for (const leg of [legs.l, legs.r]) {
        const [x, y] = leg[2]
        parts.push(`<ellipse cx="${f2(x + 0.06)}" cy="${f2(y + 0.05)}" rx="${f2(P.limb * 1.1)}" ry="${f2(P.limb * 0.55)}" fill="${p.fill('#2a2a33')}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>`)
      }
    }
    // Brazos de atrás, torso, brazos de adelante.
    const lArm = armSvg(arms.l, arms.lFist, false)
    const rArm = armSvg(arms.r, arms.rFist, rig.mark === 'mech-arm')
    ;(arms.lFront ? front : behind).push(lArm)
    ;(arms.rFront ? front : behind).push(rArm)
    parts.push(torsoSvg(c, P))
  }
  // Cuello y cabeza
  const neck = `<path d="M-0.13 0.38 L-0.13 ${f2(P.shoulderY)} L0.13 ${f2(P.shoulderY)} L0.13 0.38Z" fill="${p.fill(rig.skin, { keepLight: true })}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/><path d="M-0.13 0.5 L0.13 0.6 L0.13 0.42Z" fill="${p.shadow(rig.skin)}" opacity="0.5"/>`
  const shoulders =
    framing === 'face' || framing === 'eyes'
      ? `<path d="M${f2(-P.sw)} ${f2(P.shoulderY + 0.35)} Q${f2(-P.sw)} ${f2(P.shoulderY - 0.05)} -0.13 ${f2(P.shoulderY - 0.04)} L0.13 ${f2(P.shoulderY - 0.04)} Q${f2(P.sw)} ${f2(P.shoulderY - 0.05)} ${f2(P.sw)} ${f2(P.shoulderY + 0.35)}Z" fill="${p.fill(col.main)}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>`
      : ''
  const head = framing === 'back' ? backHead(c) : headSvg(c)
  let svg = [...behind, ...parts, shoulders, neck, head, ...front].join('')
  // Silueta: todo en tinta (conserva la forma, borra los detalles).
  if (framing === 'silhouette') svg = svg.replace(/fill="(?!none)[^"]*"/g, `fill="${p.ink}"`).replace(/stroke="(?!none)[^"]*"/g, `stroke="${p.ink}"`)
  const top = rig.hair.style === 'spiky' || rig.hair.style === 'mohawk' ? -1 : rig.hair.style === 'bun' ? -0.85 : -0.7
  const bottom = framing === 'face' ? 0.9 : framing === 'eyes' ? 0.2 : framing === 'bust' ? P.chestY + 0.3 : framing === 'half' ? P.hipY + 0.3 : P.footY + 0.15
  return { svg, top, bottom, halfWidth: P.sw * 1.5 }
}

/** De espaldas: sólo el pelo y la nuca. */
function backHead(c: Ctx) {
  const { rig, p } = c
  const fill = p.fill(rig.hair.color)
  return `${hairBack(c)}<ellipse cx="-0.43" cy="0.05" rx="0.06" ry="0.1" fill="${p.fill(rig.skin, { keepLight: true })}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/><ellipse cx="0.43" cy="0.05" rx="0.06" ry="0.1" fill="${p.fill(rig.skin, { keepLight: true })}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/><path d="M-0.46 0.2 C-0.6 -0.72 0.6 -0.72 0.46 0.2 C0.3 0.35 -0.3 0.35 -0.46 0.2Z" fill="${fill}" stroke="${p.ink}" stroke-width="${f2(c.w)}"/>${accessoryHead(c)}`
}
