// Ilustraciones vectoriales originales para el manga de demostración.
// Estilo manga en blanco y negro: tinta negra, tramas de puntos y brillos blancos.

import { mulberry32 } from '../lib/geometry'

const INK = '#111'

const DEFS = `
<defs>
  <pattern id="tone" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.5" fill="${INK}"/></pattern>
  <pattern id="toneLight" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="0.9" fill="${INK}"/></pattern>
  <pattern id="toneDense" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="2.1" fill="${INK}"/></pattern>
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="8" stroke="${INK}" stroke-width="1.6"/></pattern>
  <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
  <linearGradient id="fadeUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="mDown"><rect width="100%" height="100%" fill="url(#fadeDown)"/></mask>
  <mask id="mUp"><rect width="100%" height="100%" fill="url(#fadeUp)"/></mask>
</defs>`

function svg(w: number, h: number, body: string, bg = '#fff') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${DEFS}<rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`
}

// ---------- Pétalos de sakura ----------

const PETAL = 'M 0 17 C -9 12, -13 0, -9 -9 C -7 -14, -4 -16, -2 -16 L 0 -11 L 2 -16 C 4 -16, 7 -14, 9 -9 C 13 0, 9 12, 0 17 Z'

function petals(w: number, h: number, n: number, seed: number, scale = 1, dark = false) {
  const r = mulberry32(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = r() * w
    const y = r() * h
    const s = (0.6 + r() * 1.1) * scale
    const a = r() * 360
    out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)}) scale(${s.toFixed(2)})"><path d="${PETAL}" fill="${dark ? INK : '#fff'}" stroke="${INK}" stroke-width="${(1.6 / s).toFixed(2)}"/>${dark ? '' : `<path d="M 0 12 L 0 -4" stroke="${INK}" stroke-width="${(0.9 / s).toFixed(2)}" opacity="0.6"/>`}</g>`
  }
  return out
}

// ---------- Caras estilo anime ----------

type Expr = 'smile' | 'open' | 'surprised' | 'shy' | 'calm' | 'joy'

interface FaceOpts {
  x: number
  y: number
  s: number
  gender: 'f' | 'm'
  expr: Expr
  blush?: boolean
  sweat?: boolean
  look?: number
  tilt?: number
}

let clipSeq = 0

function eye(o: FaceOpts, mirror: boolean) {
  const id = `ec${clipSeq++}`
  const m = o.gender === 'm'
  const look = (o.look ?? 0) * (mirror ? -1 : 1)
  const tall = m ? 0.78 : 1
  const shape = m ? 'M 14 20 Q 50 2 90 20 Q 88 40 72 50 Q 45 56 24 46 Z' : 'M 12 12 Q 50 -16 92 16 Q 92 46 74 62 Q 46 72 20 52 Z'
  if (o.expr === 'joy') {
    return `<g ${mirror ? 'transform="scale(-1 1)"' : ''}><path d="M 16 34 Q 50 0 86 30" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/></g>`
  }
  const surprised = o.expr === 'surprised' || o.expr === 'open'
  const irisR = surprised ? 16 : 22
  return `<g ${mirror ? 'transform="scale(-1 1)"' : ''}>
    <clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="#fff"/>
    <g clip-path="url(#${id})">
      <ellipse cx="${50 + look}" cy="${m ? 30 : 28}" rx="${irisR}" ry="${irisR * 1.38 * tall}" fill="${INK}"/>
      <ellipse cx="${50 + look}" cy="${(m ? 30 : 28) + 12 * tall}" rx="${irisR * 0.7}" ry="${irisR * 0.62 * tall}" fill="url(#toneLight)" opacity="0.9"/>
      <ellipse cx="${50 + look}" cy="${(m ? 30 : 28) + 12 * tall}" rx="${irisR * 0.7}" ry="${irisR * 0.62 * tall}" fill="#fff" opacity="0.35"/>
      <ellipse cx="${50 + look}" cy="${m ? 30 : 28}" rx="${irisR * 0.42}" ry="${irisR * 0.6 * tall}" fill="#000"/>
      <circle cx="${41 + look}" cy="${m ? 18 : 12}" r="${surprised ? 5 : 8}" fill="#fff"/>
      <circle cx="${60 + look}" cy="${m ? 40 : 44}" r="3.5" fill="#fff"/>
      <path d="M 0 ${m ? 18 : 8} Q 50 ${m ? 4 : -10} 100 ${m ? 22 : 16} L 100 -20 L 0 -20 Z" fill="${INK}" opacity="0.18"/>
    </g>
    <path d="${m ? 'M 14 22 Q 50 -2 94 18 L 94 26 Q 52 8 20 26 Z' : 'M 14 14 Q 52 -22 96 14 L 98 24 Q 56 -8 22 18 Z'}" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
    ${m ? '' : '<path d="M 92 16 L 106 24 M 90 22 L 102 32" stroke="#111" stroke-width="4" stroke-linecap="round"/>'}
    <path d="${m ? 'M 32 48 Q 52 54 72 46' : 'M 30 60 Q 50 67 72 57'}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  </g>`
}

/** Cejas: se dibujan encima del flequillo (con halo blanco), como en el manga. */
function brows(o: FaceOpts) {
  const m = o.gender === 'm'
  if (o.expr === 'joy' && !m) return ''
  const surprised = o.expr === 'surprised' || o.expr === 'open'
  const d =
    o.expr === 'shy'
      ? 'M 30 -38 Q 54 -46 80 -34'
      : surprised
        ? 'M 30 -60 Q 54 -72 80 -58'
        : m
          ? 'M 20 -30 Q 50 -40 86 -34'
          : 'M 30 -44 Q 54 -54 80 -42'
  const one = (mirror: boolean) =>
    `<g transform="translate(${mirror ? -2 : 2} 0) ${mirror ? 'scale(-1 1)' : ''}"><path d="${d}" fill="none" stroke="#fff" stroke-width="${m ? 9 : 6.5}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${m ? 5.5 : 3.8}" stroke-linecap="round"/></g>`
  return one(true) + one(false)
}

function mouth(expr: Expr, m: boolean) {
  switch (expr) {
    case 'open':
      return `<path d="M -24 86 Q 0 80 24 86 Q 18 122 0 124 Q -18 122 -24 86 Z" fill="${INK}"/><path d="M -12 114 Q 0 104 12 114 Q 6 121 0 121 Q -6 121 -12 114 Z" fill="#fff" opacity="0.7"/>`
    case 'surprised':
      return `<ellipse cx="0" cy="100" rx="9" ry="12" fill="${INK}"/>`
    case 'shy':
      return `<path d="M -13 98 Q -6 92 0 98 Q 6 104 13 98" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    case 'calm':
      return `<path d="M -10 98 L ${m ? 12 : 10} 96" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    case 'joy':
      return `<path d="M -22 88 Q 0 92 22 88 Q 16 116 0 118 Q -16 116 -22 88 Z" fill="${INK}"/>`
    default:
      return `<path d="M -17 92 Q 0 106 17 92" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`
  }
}

function hairBackF() {
  return `<path d="M -122 -60 C -134 -196, 134 -196, 122 -60 C 138 60, 146 210, 160 330 L 84 330 C 98 210, 98 110, 92 40 L -92 40 C -98 110, -98 210, -84 330 L -160 330 C -146 210, -138 60, -122 -60 Z" fill="${INK}"/>`
}

function hairFrontF() {
  return `
  <path d="M -106 -20 C -126 50, -118 130, -100 200 L -84 176 C -96 120, -96 50, -86 -12 Z" fill="${INK}"/>
  <path d="M 106 -20 C 126 50, 118 130, 100 200 L 84 176 C 96 120, 96 50, 86 -12 Z" fill="${INK}"/>
  <path d="M -110 4 C -116 -112, -62 -186, 0 -184 C 62 -186, 116 -112, 110 4 C 104 -4, 100 -18, 96 -30 C 92 -12, 90 -6, 86 -2 C 82 -30, 76 -44, 66 -58 C 64 -40, 60 -30, 52 -22 C 46 -48, 38 -62, 24 -74 C 24 -52, 18 -38, 8 -26 C 2 -50, -8 -64, -20 -72 C -20 -50, -26 -38, -34 -28 C -40 -50, -50 -62, -62 -68 C -60 -46, -64 -32, -72 -20 C -78 -40, -86 -50, -96 -54 C -94 -30, -100 -12, -110 4 Z" fill="${INK}"/>
  <path d="M -80 -118 Q -30 -150 30 -146 Q 64 -140 86 -112" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="34 7 12 7"/>
  <path d="M -60 -100 Q -50 -70 -44 -46 M 40 -110 Q 44 -80 40 -52" stroke="#fff" stroke-width="2" fill="none" opacity="0.8"/>
  <g transform="translate(70 -96) rotate(-35)"><rect x="-4" y="-18" width="8" height="36" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="8" y="-18" width="8" height="36" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/></g>`
}

function hairM() {
  // Pelo desordenado de protagonista: una sola masa con puntas, gris de trama.
  return `
  <path d="M -112 30 C -130 -40, -128 -120, -96 -160 L -118 -168 L -78 -180 L -84 -206 L -40 -192 L -26 -222 L 6 -198 L 30 -220 L 44 -194 L 84 -202 L 78 -172 L 116 -160 L 104 -130 C 128 -90, 128 -20, 112 30 L 100 -6 L 96 -52 L 78 -10 L 70 -74 L 46 -22 L 34 -86 L 12 -20 L -6 -82 L -26 -18 L -44 -76 L -64 -14 L -78 -66 L -98 -8 Z" fill="#fff" stroke="none" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M -112 30 C -130 -40, -128 -120, -96 -160 L -118 -168 L -78 -180 L -84 -206 L -40 -192 L -26 -222 L 6 -198 L 30 -220 L 44 -194 L 84 -202 L 78 -172 L 116 -160 L 104 -130 C 128 -90, 128 -20, 112 30 L 100 -6 L 96 -52 L 78 -10 L 70 -74 L 46 -22 L 34 -86 L 12 -20 L -6 -82 L -26 -18 L -44 -76 L -64 -14 L -78 -66 L -98 -8 Z" fill="url(#toneDense)" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M -64 -128 Q -10 -160 50 -146" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="30 10"/>
  <path d="M -50 -150 L -40 -110 M 20 -170 L 16 -120 M 64 -140 L 50 -100" stroke="${INK}" stroke-width="2.5" fill="none"/>`
}

function uniform(m: boolean) {
  if (m) {
    return `<path d="M -36 196 C -96 204, -176 232, -210 340 L 210 340 C 176 232, 96 204, 36 196 Z" fill="${INK}"/>
    <path d="M -40 196 L -40 232 L 40 232 L 40 196" fill="none" stroke="#fff" stroke-width="3"/>
    <path d="M -110 230 Q -80 290 -70 340 M 110 230 Q 80 290 70 340" stroke="#fff" stroke-width="2" opacity="0.5" fill="none"/>
    <circle cx="0" cy="262" r="7" fill="#fff"/><circle cx="0" cy="310" r="7" fill="#fff"/>`
  }
  return `<path d="M -36 196 C -96 204, -176 232, -210 340 L 210 340 C 176 232, 96 204, 36 196 Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M -38 198 L -150 236 L -124 300 L 0 292 L 124 300 L 150 236 L 38 198 L 0 286 Z" fill="${INK}"/>
  <path d="M -140 244 L -118 292 L -6 284 M 140 244 L 118 292 L 6 284" fill="none" stroke="#fff" stroke-width="3"/>
  <path d="M 0 288 L -34 330 L -10 336 L 0 306 L 10 336 L 34 330 Z" fill="${INK}" stroke="#fff" stroke-width="2"/>
  <path d="M -150 300 Q -170 320 -180 340 M 150 300 Q 170 320 180 340" fill="none" stroke="${INK}" stroke-width="3"/>`
}

export function face(o: FaceOpts) {
  const m = o.gender === 'm'
  const head = 'M -98 -30 C -100 20, -92 60, -70 90 C -45 120, -18 138, 0 142 C 18 138, 45 120, 70 90 C 92 60, 100 20, 98 -30 C 96 -120, 50 -165, 0 -165 C -50 -165, -96 -120, -98 -30 Z'
  return `<g transform="translate(${o.x} ${o.y}) rotate(${o.tilt ?? 0}) scale(${o.s})">
    ${m ? '' : hairBackF()}
    ${uniform(m)}
    <path d="M -30 118 L -34 204 L 34 204 L 30 118 Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <path d="M -32 128 Q 0 162 32 128 L 32 146 Q 0 170 -32 146 Z" fill="url(#tone)"/>
    <path d="M -100 0 Q -122 10 -110 44 Q -104 58 -92 56 M 100 0 Q 122 10 110 44 Q 104 58 92 56" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <path d="${head}" fill="#fff" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <g transform="translate(-2 0)">${eye(o, true)}</g>
    <g transform="translate(2 0)">${eye(o, false)}</g>
    <path d="M 6 58 L 1 70" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    ${mouth(o.expr, m)}
    ${
      o.blush
        ? `<ellipse cx="-62" cy="74" rx="24" ry="11" fill="url(#tone)" opacity="0.8"/><ellipse cx="62" cy="74" rx="24" ry="11" fill="url(#tone)" opacity="0.8"/>
    <path d="M -78 80 L -70 66 M -66 82 L -58 68 M -54 82 L -46 68 M 46 82 L 54 68 M 58 82 L 66 68 M 70 80 L 78 66" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
        : ''
    }
    ${m ? hairM() : hairFrontF()}
    ${brows(o)}
    ${o.sweat ? `<path d="M 122 -60 Q 140 -30 122 -18 Q 104 -30 122 -60 Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M 118 -34 Q 116 -28 120 -24" stroke="${INK}" stroke-width="2" fill="none"/>` : ''}
  </g>`
}

function sparkles(w: number, h: number, n: number, seed: number) {
  const r = mulberry32(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = r() * w
    const y = r() * h
    const s = 6 + r() * 12
    out += `<path d="M ${x} ${y - s} L ${x + s * 0.25} ${y - s * 0.25} L ${x + s} ${y} L ${x + s * 0.25} ${y + s * 0.25} L ${x} ${y + s} L ${x - s * 0.25} ${y + s * 0.25} L ${x - s} ${y} L ${x - s * 0.25} ${y - s * 0.25} Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`
  }
  return out
}

function radialLines(cx: number, cy: number, n: number, rIn: number, rOut: number, seed: number, width = 3) {
  const r = mulberry32(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.05
    const ri = rIn * (0.85 + r() * 0.4)
    const sp = (width * (0.5 + r())) / rOut
    out += `<path d="M ${cx + Math.cos(a) * ri} ${cy + Math.sin(a) * ri} L ${cx + Math.cos(a - sp) * rOut} ${cy + Math.sin(a - sp) * rOut} L ${cx + Math.cos(a + sp) * rOut} ${cy + Math.sin(a + sp) * rOut} Z" fill="${INK}"/>`
  }
  return out
}

function speedLines(w: number, h: number, n: number, seed: number) {
  const r = mulberry32(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const y = r() * h
    const x = r() * w * 0.6
    const l = w * (0.25 + r() * 0.6)
    const t = 1 + r() * 3
    out += `<path d="M ${x} ${y - t} L ${x + l} ${y} L ${x} ${y + t} Z" fill="${INK}"/>`
  }
  return out
}

// ---------- Escenarios ----------

function sakuraTree(x: number, y: number, s: number, seed: number) {
  const r = mulberry32(seed)
  let blobs = ''
  for (let i = 0; i < 16; i++) {
    const bx = (r() - 0.5) * 300
    const by = -r() * 190 - 60
    const br = 50 + r() * 45
    blobs += `<circle cx="${bx}" cy="${by}" r="${br}"/>`
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -18 0 C -14 -60, -30 -110, -70 -150 L -58 -160 C -24 -128, -4 -100, 0 -80 C 8 -120, 30 -150, 70 -170 L 78 -158 C 40 -130, 22 -90, 18 -40 L 20 0 Z" fill="${INK}"/>
    <g fill="#fff" stroke="${INK}" stroke-width="${3 / s}">${blobs}</g>
    <g fill="url(#toneLight)">${blobs}</g>
    <g fill="#fff" opacity="0.55">${blobs.replace(/r="(\d+(\.\d+)?)"/g, (_, v) => `r="${(Number(v) * 0.72).toFixed(1)}"`)}</g>
  </g>`
}

export function artSchool() {
  const w = 1200
  const h = 600
  let windows = ''
  for (let row = 0; row < 3; row++) for (let c = 0; c < 9; c++) windows += `<rect x="${330 + c * 62}" y="${250 + row * 70}" width="44" height="46" fill="#fff" stroke="${INK}" stroke-width="3"/><line x1="${352 + c * 62}" y1="${250 + row * 70}" x2="${352 + c * 62}" y2="${296 + row * 70}" stroke="${INK}" stroke-width="2"/>`
  return svg(
    w,
    h,
    `
    <rect width="${w}" height="${h}" fill="url(#toneLight)" mask="url(#mDown)"/>
    <path d="M 0 150 Q 200 120 360 150 T 760 140 T 1200 150" fill="none" stroke="${INK}" stroke-width="2" opacity="0.4"/>
    <g fill="#fff" stroke="${INK}" stroke-width="3"><path d="M 90 110 q 20 -40 60 -20 q 30 -40 70 0 q 40 0 30 30 z"/><path d="M 900 80 q 20 -40 60 -20 q 30 -40 70 0 q 40 0 30 30 z"/></g>
    <rect x="300" y="200" width="600" height="300" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <rect x="520" y="120" width="160" height="90" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <circle cx="600" cy="165" r="32" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M 600 165 L 600 142 M 600 165 L 616 172" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    ${windows}
    <rect x="555" y="430" width="90" height="70" fill="${INK}"/>
    <path d="M 0 500 L 1200 500 L 1200 600 L 0 600 Z" fill="url(#tone)"/>
    <path d="M 0 500 L 1200 500" stroke="${INK}" stroke-width="5"/>
    <path d="M 420 600 L 540 500 M 780 600 L 660 500" stroke="${INK}" stroke-width="4"/>
    ${sakuraTree(70, 540, 0.95, 7)}
    ${sakuraTree(1140, 540, 1.0, 11)}
    ${petals(w, h, 60, 3, 1.1)}`,
  )
}

export function artFeet() {
  const w = 800
  const h = 800
  const leg = (tx: number, ty: number, rot: number) => `<g transform="translate(${tx} ${ty}) rotate(${rot}) scale(1.2)">
    <path d="M -46 -330 C -52 -250, -40 -170, -30 -120 L 30 -120 C 44 -180, 50 -250, 44 -330 Z" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <path d="M -34 -300 C -38 -240, -30 -190, -22 -150" stroke="${INK}" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M -32 -130 L 32 -130 L 30 -34 L -30 -34 Z" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <path d="M -32 -130 L 32 -130 M -31 -118 L 31 -118" stroke="${INK}" stroke-width="3"/>
    <path d="M -36 -40 C -46 16, -30 50, 20 54 L 150 60 C 186 62, 192 22, 160 8 L 50 -24 L 34 -40 Z" fill="${INK}"/>
    <path d="M -8 36 C 50 40, 110 44, 160 36" stroke="#fff" stroke-width="3.5" fill="none"/>
    <path d="M -20 -14 Q 14 -34 48 -22" stroke="#fff" stroke-width="3.5" fill="none"/>
    <ellipse cx="110" cy="14" rx="26" ry="8" fill="#fff" opacity="0.35"/>
  </g>`
  return svg(
    w,
    h,
    `
    ${speedLines(w, h, 90, 21)}
    <rect x="0" y="600" width="${w}" height="200" fill="url(#tone)"/>
    <line x1="0" y1="600" x2="${w}" y2="600" stroke="${INK}" stroke-width="4"/>
    ${leg(300, 560, -28)}
    ${leg(520, 600, 18)}
    <g fill="#fff" stroke="${INK}" stroke-width="4">
      <path d="M 140 640 q -40 -10 -30 -40 q 10 -30 50 -20 q 20 -30 50 -10 q 40 0 30 40 q 10 30 -30 34 z"/>
      <path d="M 60 700 q -30 -8 -22 -30 q 8 -22 38 -14 q 16 -22 38 -8 q 30 0 22 30 q 8 22 -22 26 z"/>
    </g>
    ${petals(w, 500, 14, 5, 1.3)}`,
  )
}

export function artClock() {
  const w = 700
  const h = 700
  let ticks = ''
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ticks += `<line x1="${350 + Math.cos(a) * 230}" y1="${350 + Math.sin(a) * 230}" x2="${350 + Math.cos(a) * (i % 3 ? 250 : 270)}" y2="${350 + Math.sin(a) * (i % 3 ? 250 : 270)}" stroke="${INK}" stroke-width="${i % 3 ? 5 : 10}"/>`
  }
  return svg(
    w,
    h,
    `
    ${radialLines(350, 350, 120, 310, 520, 9, 2)}
    <circle cx="350" cy="350" r="300" fill="#fff" stroke="${INK}" stroke-width="14"/>
    <circle cx="350" cy="350" r="284" fill="none" stroke="${INK}" stroke-width="3"/>
    ${ticks}
    <path d="M 350 350 L 312 196" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M 350 350 L 350 110" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="350" cy="350" r="16" fill="${INK}"/>
    <path d="M 380 116 q 30 -8 44 14 M 396 96 q 34 -4 44 22" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  )
}

export function artHana(expr: Expr, opts: { blush?: boolean; sweat?: boolean; look?: number; tilt?: number; bg?: 'petals' | 'lines' | 'sparkle' | 'tone' } = {}) {
  const w = 800
  const h = 800
  const bg =
    opts.bg === 'lines'
      ? radialLines(400, 380, 140, 320, 700, 13, 3)
      : opts.bg === 'sparkle'
        ? `<rect width="${w}" height="${h}" fill="url(#toneLight)"/><circle cx="400" cy="380" r="330" fill="#fff" opacity="0.85"/>${sparkles(w, h, 18, 4)}`
        : opts.bg === 'tone'
          ? `<rect width="${w}" height="${h}" fill="url(#tone)"/>`
          : petals(w, h, 26, 17, 1.6)
  return svg(w, h, `${bg}${face({ x: 400, y: 330, s: 1.55, gender: 'f', expr, ...opts })}`)
}

export function artRen(expr: Expr, opts: { blush?: boolean; look?: number; tilt?: number; bg?: 'petals' | 'tone' | 'lines' } = {}) {
  const w = 800
  const h = 800
  const bg = opts.bg === 'tone' ? `<rect width="${w}" height="${h}" fill="url(#toneLight)"/>` : opts.bg === 'lines' ? radialLines(400, 380, 120, 330, 700, 29, 3) : petals(w, h, 18, 23, 1.5)
  return svg(w, h, `${bg}${face({ x: 400, y: 340, s: 1.5, gender: 'm', expr, ...opts })}`)
}

export function artEyes() {
  const w = 1200
  const h = 360
  let shock = ''
  for (let i = 0; i < 26; i++) {
    const x = 40 + i * 44
    shock += `<line x1="${x}" y1="${i % 2 ? 20 : 30}" x2="${x}" y2="${i % 2 ? 60 : 80}" stroke="${INK}" stroke-width="3"/>`
  }
  const f = face({ x: 600, y: 120, s: 3.2, gender: 'f', expr: 'surprised' })
  return svg(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="url(#toneLight)"/>
    <g>${f}</g>
    ${shock}
    <path d="M 40 330 Q 600 300 1160 330" stroke="${INK}" stroke-width="3" fill="none"/>`,
  )
}

export function artCollision() {
  const w = 1000
  const h = 900
  const star = (() => {
    const r = mulberry32(31)
    let d = ''
    const n = 22
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2
      const rad = i % 2 ? 150 + r() * 40 : 330 + r() * 90
      d += `${i ? 'L' : 'M'} ${500 + Math.cos(a) * rad} ${450 + Math.sin(a) * rad * 0.85} `
    }
    return d + 'Z'
  })()
  return svg(
    w,
    h,
    `
    ${radialLines(500, 450, 180, 360, 900, 41, 4)}
    <path d="${star}" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <g transform="translate(610 330) rotate(24)">
      <path d="M -110 -80 Q -120 -140 -60 -140 Q -30 -170 0 -140 Q 30 -170 60 -140 Q 120 -140 110 -80 L 100 120 L -100 120 Z" fill="#fff" stroke="${INK}" stroke-width="7"/>
      <path d="M -86 -80 Q -90 -118 -50 -118 Q -24 -140 0 -118 Q 24 -140 50 -118 Q 90 -118 86 -80 L 78 100 L -78 100 Z" fill="url(#toneLight)"/>
      <path d="M 60 120 q 20 -30 50 -10 q -10 -40 -10 -60" fill="#fff" stroke="${INK}" stroke-width="6"/>
    </g>
    <g transform="translate(330 560) rotate(-30)"><rect x="-120" y="-70" width="240" height="140" rx="6" fill="${INK}"/><rect x="-112" y="-60" width="224" height="30" fill="#fff"/><path d="M -100 -48 L 100 -48" stroke="${INK}" stroke-width="2"/><text x="-40" y="30" font-family="sans-serif" font-weight="700" font-size="42" fill="#fff">数学</text></g>
    <g transform="translate(720 640) rotate(40)"><rect x="-90" y="-56" width="180" height="112" rx="6" fill="#fff" stroke="${INK}" stroke-width="7"/><path d="M -70 -20 L 70 -20 M -70 4 L 70 4 M -70 28 L 40 28" stroke="${INK}" stroke-width="4"/></g>
    ${sparkles(w, h, 10, 8)}
    ${petals(w, h, 24, 51, 1.6)}`,
  )
}

export function artRooftop() {
  const w = 1200
  const h = 700
  let bars = ''
  for (let i = 0; i < 26; i++) bars += `<line x1="${i * 48}" y1="330" x2="${i * 48}" y2="520" stroke="${INK}" stroke-width="5"/>`
  return svg(
    w,
    h,
    `
    <rect width="${w}" height="330" fill="url(#toneLight)" mask="url(#mDown)"/>
    <g fill="#fff" stroke="${INK}" stroke-width="4">
      <path d="M 80 200 q 10 -60 80 -50 q 30 -70 110 -40 q 70 -30 100 30 q 60 0 50 60 z"/>
      <path d="M 760 150 q 10 -50 70 -40 q 30 -60 100 -30 q 60 -20 90 30 q 50 0 40 50 z"/>
    </g>
    <path d="M 0 360 L 1200 360" stroke="${INK}" stroke-width="3" opacity="0.6"/>
    <g fill="${INK}"><rect x="40" y="250" width="80" height="110"/><rect x="130" y="210" width="60" height="150"/><rect x="200" y="270" width="90" height="90"/><rect x="930" y="230" width="70" height="130"/><rect x="1010" y="190" width="90" height="170"/><rect x="1110" y="260" width="90" height="100"/></g>
    ${bars}
    <line x1="0" y1="330" x2="${w}" y2="330" stroke="${INK}" stroke-width="8"/>
    <line x1="0" y1="430" x2="${w}" y2="430" stroke="${INK}" stroke-width="5"/>
    <rect x="0" y="520" width="${w}" height="180" fill="url(#tone)"/>
    <line x1="0" y1="520" x2="${w}" y2="520" stroke="${INK}" stroke-width="6"/>
    <g transform="translate(600 560) scale(1.45)">
      <path d="M -150 140 C -140 40, -90 -10, -40 -20 L 40 -20 C 90 -10, 140 40, 150 140 Z" fill="${INK}"/>
      <path d="M -40 -20 L -34 -70 L 34 -70 L 40 -20" fill="#fff" stroke="${INK}" stroke-width="5"/>
      <path d="M -96 -140 C -118 -200, -86 -246, -40 -256 L -24 -278 L -4 -258 L 22 -282 L 34 -254 C 90 -246, 120 -196, 98 -140 L 112 -122 L 86 -118 L 94 -94 L 66 -100 L 62 -74 L 36 -86 L 20 -66 L 0 -84 L -20 -66 L -36 -86 L -62 -74 L -66 -100 L -94 -94 L -86 -118 L -112 -122 Z" fill="#fff" stroke="none" stroke-width="5" stroke-linejoin="round"/>
  <path d="M -96 -140 C -118 -200, -86 -246, -40 -256 L -24 -278 L -4 -258 L 22 -282 L 34 -254 C 90 -246, 120 -196, 98 -140 L 112 -122 L 86 -118 L 94 -94 L 66 -100 L 62 -74 L 36 -86 L 20 -66 L 0 -84 L -20 -66 L -36 -86 L -62 -74 L -66 -100 L -94 -94 L -86 -118 L -112 -122 Z" fill="url(#toneDense)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M -60 -200 Q 0 -236 60 -206" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="30 10"/>
      <path d="M -60 -100 L -80 -40 M 60 -100 L 80 -40" stroke="${INK}" stroke-width="4"/>
    </g>
    ${speedLines(w, 330, 18, 71).replace(/fill="#111"/g, 'fill="#111" opacity="0.35"')}
    ${petals(w, h, 46, 61, 1.3)}`,
  )
}

export function artPetalsClose() {
  const w = 800
  const h = 800
  return svg(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="url(#tone)" mask="url(#mUp)"/>
    ${speedLines(w, h, 40, 77).replace(/fill="#111"/g, 'fill="#111" opacity="0.5"')}
    ${petals(w, h, 22, 81, 5)}
    ${petals(w, h, 30, 83, 2)}`,
  )
}

export function artSunset() {
  const w = 1200
  const h = 700
  let bands = ''
  for (let i = 0; i < 9; i++) bands += `<rect x="0" y="${300 + i * 14 + i * i * 1.4}" width="${w}" height="${2 + i * 0.9}" fill="#fff"/>`
  return svg(
    w,
    h,
    `
    <rect width="${w}" height="${h}" fill="url(#tone)"/>
    <rect width="${w}" height="${h}" fill="url(#toneDense)" mask="url(#mUp)"/>
    <circle cx="820" cy="400" r="190" fill="#fff"/>
    ${bands}
    <path d="M 0 520 C 200 440, 420 430, 600 470 C 800 510, 1000 480, 1200 440 L 1200 700 L 0 700 Z" fill="${INK}"/>
    <g transform="translate(380 480) scale(1.6)">
      <path d="M -14 0 C -10 -50, -26 -90, -60 -120 L -50 -128 C -20 -100, -4 -80, 0 -64 C 8 -96, 26 -120, 60 -136 L 66 -126 C 34 -104, 18 -72, 14 -32 L 16 0 Z" fill="${INK}"/>
      <g fill="${INK}"><circle cx="-60" cy="-150" r="48"/><circle cx="0" cy="-180" r="60"/><circle cx="64" cy="-156" r="50"/><circle cx="-100" cy="-120" r="34"/><circle cx="104" cy="-124" r="36"/><circle cx="20" cy="-130" r="44"/></g>
    </g>
    <g fill="${INK}">
      <g transform="translate(560 470)"><circle cx="0" cy="-86" r="16"/><path d="M -16 -70 L 16 -70 L 22 -10 L 10 -10 L 8 30 L -8 30 L -10 -10 L -22 -10 Z"/><path d="M -18 -96 Q 0 -120 18 -96 L 26 -60 L -26 -60 Z"/></g>
      <g transform="translate(610 468)"><circle cx="0" cy="-94" r="17"/><path d="M -18 -76 L 18 -76 L 18 34 L -18 34 Z"/><path d="M -18 -100 L -26 -120 L -6 -108 L 4 -126 L 12 -108 L 28 -116 L 18 -96 Z"/></g>
    </g>
    ${petals(w, 520, 34, 91, 1.3)}`,
  )
}

export function artCover() {
  const w = 900
  const h = 1300
  return svg(
    w,
    h,
    `
    <rect width="${w}" height="${h}" fill="url(#toneLight)"/>
    <circle cx="450" cy="560" r="420" fill="#fff"/>
    ${radialLines(450, 560, 90, 430, 1100, 3, 2).replace(/fill="#111"/g, 'fill="#111" opacity="0.5"')}
    ${sakuraTree(120, 1300, 2.2, 101)}
    ${sakuraTree(820, 1250, 1.8, 103)}
    ${face({ x: 450, y: 520, s: 2.1, gender: 'f', expr: 'smile', look: -4, tilt: -6 })}
    ${petals(w, 260, 16, 107, 2)}${petals(w, 380, 10, 109, 2.4).replace(/translate\(([\d.]+) ([\d.]+)\)/g, (_, x, y) => `translate(${x} ${Number(y) + 920})`)}`,
  )
}

export function artEndCard() {
  const w = 800
  const h = 800
  return svg(w, h, `${petals(w, h, 40, 111, 2.2, false)}${sakuraTree(400, 820, 2.2, 113)}`, '#fff')
}
