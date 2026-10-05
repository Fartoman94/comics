import { mulberry32 } from '../../lib/geometry'
import type { ArtExtra, CharacterDef, Prop, Shot, StyleId } from '../types'
import { figureSvg } from './characters'
import { flower, makeS, sceneSvg, sparkle } from './scenes'
import { defs, Painter, STYLES } from './style'

/**
 * Compone la ilustración de una viñeta: escenario + personajes encuadrados + efectos u objeto en
 * primer plano. Devuelve un SVG completo de W×H (el alto sigue la proporción de la viñeta).
 */

const n = (v: number) => +v.toFixed(1)

export function shotSvg(style: StyleId, cast: CharacterDef[], shot: Shot, W: number, H: number, seed: number): string {
  const p = new Painter(STYLES[style], shot.time ?? 'day')
  const r = mulberry32(seed)
  let body = sceneSvg(shot.bg, p, W, H, { angle: shot.angle, seed })
  const chars = shot.chars ?? []
  const count = chars.length
  chars.forEach((c, i) => {
    const def = cast.find((x) => x.id === c.id)
    if (!def) return
    const framing = c.framing ?? (count >= 3 ? 'half' : 'bust')
    const dry = figureSvg(p, def.rig, { framing, pose: c.pose, expr: c.expr, scaleForLine: 1 })
    let units = dry.bottom - dry.top
    let fill = 0.95
    if (framing === 'face') fill = 1.05
    if (framing === 'eyes') units = 0.55
    if (framing === 'full' || framing === 'back' || framing === 'silhouette') fill = 0.88
    let u = (H * fill) / units
    // Que entren todos a lo ancho.
    const maxU = (W / Math.max(1, count)) / (dry.halfWidth * 2 * (framing === 'face' || framing === 'eyes' ? 0.75 : 1))
    if (framing !== 'eyes') u = Math.min(u, maxU * 1.15)
    u *= c.scale ?? 1
    // De cuerpo entero nunca se corta la cabeza.
    if (framing === 'full' || framing === 'back' || framing === 'silhouette') u = Math.min(u, (H * 0.92) / units)
    const fig = figureSvg(p, def.rig, { framing, pose: c.pose, expr: c.expr, scaleForLine: u, look: c.flip ? -1 : 0.6, id: `${seed}_${i}` })
    const x = (c.x ?? (count === 1 ? 0.5 : 0.18 + (0.64 * i) / Math.max(1, count - 1))) * W
    let y: number
    if (framing === 'eyes') y = H * 0.5 - 0.02 * u
    else if (framing === 'full' || framing === 'back' || framing === 'silhouette') y = H * 0.96 - fig.bottom * u
    else y = H * 0.06 - fig.top * u
    body += `<g transform="translate(${n(x)} ${n(y)}) scale(${c.flip ? -u : u} ${u})">${fig.svg}</g>`
  })
  if (!count && shot.prop) body += propSvg(p, shot.prop, W, H)
  for (const e of shot.extras ?? []) body += extraSvg(p, e, W, H, r)
  if (shot.angle === 'dutch') body = `<g transform="rotate(-7 ${W / 2} ${H / 2}) scale(1.18) translate(${n(-W * 0.077)} ${n(-H * 0.077)})">${body}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(STYLES[style])}<rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`
}

// ---------- Efectos dibujados ----------

function extraSvg(p: Painter, e: ArtExtra, W: number, H: number, r: () => number): string {
  const ink = p.ink
  const s = makeS(p, W, H, { seed: Math.floor(r() * 1e6) })
  const col = (c: string, bw = '#fff') => (p.s.color ? c : bw)
  let o = ''
  switch (e) {
    case 'rain':
      for (let i = 0; i < 90; i++) {
        const x = r() * W * 1.2
        const y = r() * H
        o += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x - 18)}" y2="${n(y + 46)}" stroke="${col('#cfe3ff', ink)}" stroke-width="${n(1 + r() * 1.5)}" opacity="0.7"/>`
      }
      return o
    case 'snow':
    case 'dust':
      for (let i = 0; i < 70; i++) o += `<circle cx="${n(r() * W)}" cy="${n(e === 'dust' ? H * (0.6 + r() * 0.4) : r() * H)}" r="${n(1.5 + r() * 4)}" fill="${e === 'dust' ? col('#c9b38a', ink) : '#fff'}" stroke="${e === 'snow' ? ink : 'none'}" stroke-width="0.6" opacity="0.85"/>`
      return o
    case 'petals':
      for (let i = 0; i < 30; i++) {
        const x = r() * W
        const y = r() * H
        o += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(7 + r() * 6)}" ry="${n(4 + r() * 3)}" transform="rotate(${n(r() * 180)} ${n(x)} ${n(y)})" fill="${col('#c9a0f0')}" stroke="${ink}" stroke-width="1"/>`
      }
      return o
    case 'sparkles':
    case 'stars':
      for (let i = 0; i < (e === 'stars' ? 40 : 18); i++) o += sparkle(s, r() * W, r() * H, e === 'stars' ? 4 + r() * 6 : 10 + r() * 18)
      return o
    case 'flowers':
      for (let i = 0; i < 10; i++) {
        const corner = i % 2 ? 0 : 1
        o += flower(s, corner * W + (corner ? -1 : 1) * r() * W * 0.25, r() * H, 24 + r() * 30)
      }
      return o
    case 'bubbles-soft':
      for (let i = 0; i < 14; i++) o += `<circle cx="${n(r() * W)}" cy="${n(r() * H)}" r="${n(6 + r() * 16)}" fill="${col('#ffffff')}" fill-opacity="0.22" stroke="${ink}" stroke-width="1" stroke-opacity="0.35"/>`
      return o
    case 'lightning': {
      let x = W * (0.2 + r() * 0.6)
      let y = 0
      let d = `M${n(x)} 0`
      while (y < H * 0.75) {
        x += (r() - 0.5) * 120
        y += 40 + r() * 70
        d += ` L${n(x)} ${n(y)}`
      }
      return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="16" stroke-linejoin="bevel"/><path d="${d}" fill="none" stroke="${col('#fff7a8')}" stroke-width="8" stroke-linejoin="bevel"/>`
    }
    case 'electric':
      for (let k = 0; k < 6; k++) {
        let x = W * (0.2 + r() * 0.6)
        let y = H * (0.2 + r() * 0.6)
        let d = `M${n(x)} ${n(y)}`
        for (let j = 0; j < 6; j++) {
          x += (r() - 0.5) * 90
          y += (r() - 0.5) * 90
          d += ` L${n(x)} ${n(y)}`
        }
        o += `<path d="${d}" fill="none" stroke="${col('#7fe9ff', ink)}" stroke-width="5"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2"/>`
      }
      return o
    case 'explosion':
    case 'blood-free-impact': {
      const cx = W / 2
      const cy = H / 2
      const R = Math.min(W, H) * 0.42
      const pts: string[] = []
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2
        const k = i % 2 ? 0.45 + r() * 0.15 : 0.85 + r() * 0.25
        pts.push(`${n(cx + Math.cos(a) * R * k)},${n(cy + Math.sin(a) * R * k)}`)
      }
      return `<polygon points="${pts.join(' ')}" fill="${e === 'explosion' ? col('#ffb03a') : '#fff'}" stroke="${ink}" stroke-width="6" opacity="0.92"/>${e === 'explosion' ? `<circle cx="${cx}" cy="${cy}" r="${n(R * 0.35)}" fill="${col('#fff3b0')}"/>` : ''}`
    }
    case 'wind':
      for (let i = 0; i < 12; i++) {
        const y = r() * H
        o += `<path d="M${n(-20)} ${n(y)} Q${n(W * 0.4)} ${n(y - 40 - r() * 40)} ${n(W * (0.6 + r() * 0.5))} ${n(y + 10)}" fill="none" stroke="${ink}" stroke-width="${n(2 + r() * 3)}" opacity="0.65"/>`
      }
      return o
    case 'glow':
      return `<rect width="${W}" height="${H}" fill="url(#glow)" opacity="${p.s.color ? 0.55 : 0.18}"/>`
    case 'smoke':
      for (let i = 0; i < 14; i++) o += `<circle cx="${n(r() * W)}" cy="${n(H * (0.4 + r() * 0.6))}" r="${n(40 + r() * 70)}" fill="${col('#b5b9c2', '#fff')}" opacity="0.45" stroke="${ink}" stroke-opacity="0.3"/>`
      return o
    case 'energy': {
      const cx = W / 2
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI * 2
        const R1 = Math.min(W, H) * (0.25 + r() * 0.1)
        const R2 = R1 + 60 + r() * 120
        o += `<line x1="${n(cx + Math.cos(a) * R1)}" y1="${n(H / 2 + Math.sin(a) * R1)}" x2="${n(cx + Math.cos(a) * R2)}" y2="${n(H / 2 + Math.sin(a) * R2)}" stroke="${col('#9ff7ff', ink)}" stroke-width="${n(2 + r() * 3)}" opacity="0.8"/>`
      }
      return o
    }
    case 'shadow-face':
      return `<rect width="${W}" height="${n(H * 0.55)}" fill="url(#fade-down)"/>`
    case 'sweat':
      return `<path d="M${n(W * 0.72)} ${n(H * 0.12)} q22 36 0 52 q-22 -16 0 -52Z" fill="${col('#9fd8ff')}" stroke="${ink}" stroke-width="3"/>`
    case 'tears':
    case 'blush':
      return ''
  }
}

// ---------- Objetos en primer plano ----------

function propSvg(p: Painter, prop: Prop, W: number, H: number): string {
  const ink = p.ink
  const lw = p.lw(1.1)
  const cx = W / 2
  const cy = H / 2
  const k = Math.min(W, H) / 1000
  const f = (c: string) => p.fill(c)
  const g = (body: string) => `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k)})" stroke="${ink}" stroke-width="${n(lw / k)}" stroke-linejoin="round" stroke-linecap="round">${body}</g>`
  switch (prop) {
    case 'letter':
      return g(`<rect x="-300" y="-190" width="600" height="380" rx="14" fill="${f('#f4ead2')}"/><path d="M-300 -190 L0 40 L300 -190" fill="none"/><circle cx="0" cy="40" r="46" fill="${f('#c0392b')}"/>`)
    case 'note':
      return g(`<rect x="-240" y="-320" width="480" height="640" fill="#fff" transform="rotate(-4)"/>${[-220, -140, -60, 20, 100].map((y) => `<path d="M-180 ${y} q180 ${-10} 360 0" fill="none"/>`).join('')}`)
    case 'phone':
      return g(`<rect x="-170" y="-330" width="340" height="660" rx="44" fill="${f('#222')}"/><rect x="-140" y="-280" width="280" height="540" rx="14" fill="${f('#8fd3ff')}"/>`)
    case 'clock':
      return g(`<circle r="320" fill="#fff"/><circle r="290" fill="none"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-250" x2="0" y2="-280" transform="rotate(${i * 30})"/>`).join('')}<line x1="0" y1="0" x2="0" y2="-200" stroke-width="18"/><line x1="0" y1="0" x2="150" y2="40" stroke-width="12"/>`)
    case 'hand':
    case 'fist':
      return g(prop === 'fist' ? `<rect x="-220" y="-180" width="440" height="360" rx="120" fill="${f('#f0c7a0')}"/>${[-110, 0, 110].map((x) => `<path d="M${x} -180 v120" fill="none"/>`).join('')}<path d="M-220 40 h200" fill="none"/>` : `<path d="M-180 320 L-200 -40 Q-200 -90 -160 -90 L-150 -260 Q-140 -300 -100 -290 L-90 -60 L-70 -330 Q-50 -370 -10 -350 L0 -60 L30 -320 Q50 -350 90 -330 L90 -50 L130 -250 Q160 -280 190 -250 L170 40 Q150 250 60 320Z" fill="${f('#f0c7a0')}"/>`)
    case 'eye':
      return `<rect width="${W}" height="${H}" fill="${f('#f0c7a0')}"/>` + g(`<path d="M-460 0 Q0 -320 460 0 Q0 320 -460 0Z" fill="#fff"/><circle r="170" fill="${p.s.color ? '#5b3a29' : 'url(#tone-dense)'}"/><circle r="85" fill="${ink}"/><circle cx="-60" cy="-60" r="40" fill="#fff"/><path d="M-470 -20 Q0 -360 470 -20" fill="none" stroke-width="30"/>`)
    case 'door':
      return g(`<rect x="-250" y="-420" width="500" height="840" fill="${f('#7a5c45')}"/><rect x="-200" y="-370" width="400" height="320" fill="none"/><rect x="-200" y="20" width="400" height="340" fill="none"/><circle cx="180" cy="10" r="22" fill="${f('#e8c35a')}"/><circle cx="0" cy="-200" r="16" fill="#111"/>`)
    case 'key':
      return g(`<circle cx="-200" r="120" fill="${f('#e8c35a')}"/><circle cx="-200" r="50" fill="#fff"/><rect x="-90" y="-30" width="380" height="60" fill="${f('#e8c35a')}"/><rect x="200" y="30" width="40" height="70" fill="${f('#e8c35a')}"/><rect x="120" y="30" width="40" height="50" fill="${f('#e8c35a')}"/>`)
    case 'sword':
      return g(`<polygon points="-30,-460 30,-460 40,180 0,240 -40,180" fill="${f('#dfe6ee')}" transform="rotate(30)"/><rect x="-140" y="160" width="280" height="40" rx="12" fill="${f('#7a5c45')}" transform="rotate(30)"/><rect x="-26" y="200" width="52" height="220" fill="${f('#3a2a20')}" transform="rotate(30)"/>`)
    case 'glider':
      return g(`<path d="M-460 40 Q0 -200 460 40 Q0 -60 -460 40Z" fill="${f('#e7b45a')}"/><line x1="0" y1="-80" x2="0" y2="220"/><line x1="-120" y1="160" x2="120" y2="160" stroke-width="16"/>`)
    case 'piano':
      return g(`<rect x="-480" y="-120" width="960" height="300" fill="#fff"/>${Array.from({ length: 13 }, (_, i) => `<line x1="${-480 + i * 80}" y1="-120" x2="${-480 + i * 80}" y2="180"/>`).join('')}${[0, 1, 3, 4, 5, 7, 8, 10, 11].map((i) => `<rect x="${-430 + i * 80}" y="-120" width="40" height="180" fill="${ink}"/>`).join('')}`)
    case 'brush':
      return g(`<rect x="-40" y="-60" width="80" height="460" rx="20" fill="${f('#a0522d')}" transform="rotate(35)"/><path d="M-50 -60 L50 -60 L30 -260 Q0 -330 -30 -260Z" fill="${f('#9b6fd0')}" transform="rotate(35)"/>`)
    case 'photo':
      return g(`<rect x="-280" y="-300" width="560" height="600" fill="#fff" transform="rotate(5)"/><rect x="-240" y="-260" width="480" height="430" fill="${f('#a7c4d8')}" transform="rotate(5)"/><circle cx="-60" cy="-60" r="70" fill="${f('#f0c7a0')}" transform="rotate(5)"/><circle cx="90" cy="-50" r="60" fill="${f('#f0c7a0')}" transform="rotate(5)"/>`)
    case 'lamp':
      return g(`<path d="M-200 -100 L200 -100 L130 -320 L-130 -320Z" fill="${f('#f3e2b0')}"/><line x1="0" y1="-100" x2="0" y2="300" stroke-width="20"/><rect x="-150" y="300" width="300" height="40" fill="${f('#555')}"/>${p.s.color ? '<circle cx="0" cy="-60" r="420" fill="url(#glow)" opacity="0.5" stroke="none"/>' : ''}`)
    case 'cable':
      return g(`<path d="M-500 -200 C-200 -200 -200 200 100 120 S400 -300 500 -100" fill="none" stroke-width="40"/><path d="M-500 -200 C-200 -200 -200 200 100 120 S400 -300 500 -100" fill="none" stroke="${f('#c0392b')}" stroke-width="24"/><rect x="60" y="80" width="120" height="80" fill="${f('#e8c35a')}"/>`)
    case 'badge':
      return g(`<polygon points="0,-300 85,-120 280,-100 135,30 180,230 0,130 -180,230 -135,30 -280,-100 -85,-120" fill="${f('#e8c35a')}"/><circle r="80" fill="${f('#c9a33a')}"/>`)
    case 'helmet':
      return g(`<path d="M-300 120 Q-320 -300 0 -310 Q320 -300 300 120Z" fill="${f('#d9dde6')}"/><path d="M-240 -60 Q0 -140 240 -60 L220 80 Q0 20 -220 80Z" fill="${p.s.color ? 'rgba(80,200,255,0.75)' : 'url(#tone)'}"/>`)
    case 'moon':
      return g(`<circle r="330" fill="${f('#fff4c9')}"/><circle cx="-90" cy="-60" r="50" fill="none" opacity="0.4"/><circle cx="110" cy="80" r="70" fill="none" opacity="0.4"/>`)
    case 'ring':
      return g(`<ellipse rx="300" ry="110" fill="none" stroke-width="70"/><ellipse rx="300" ry="110" fill="none" stroke="${f('#e8c35a')}" stroke-width="50"/><polygon points="0,-180 60,-120 0,-70 -60,-120" fill="${f('#ff4b6b')}"/>`)
    case 'mask':
      return g(`<path d="M-280 -150 Q0 -260 280 -150 Q300 180 0 300 Q-300 180 -280 -150Z" fill="#fff"/><ellipse cx="-110" cy="-20" rx="70" ry="40" fill="${ink}"/><ellipse cx="110" cy="-20" rx="70" ry="40" fill="${ink}"/><path d="M-120 160 q120 -40 240 0" fill="none"/>`)
    case 'feather':
      return g(`<path d="M0 380 Q-40 0 120 -380 Q240 -100 0 380Z" fill="#fff" transform="rotate(-20)"/><path d="M0 380 Q40 0 120 -380" fill="none" transform="rotate(-20)"/>`)
    case 'cup':
      return g(`<path d="M-200 -160 L200 -160 L160 240 L-160 240Z" fill="${f('#ffffff')}"/><path d="M200 -80 Q330 -60 300 80 Q280 160 175 150" fill="none" stroke-width="26"/><ellipse cx="0" cy="-160" rx="200" ry="40" fill="${f('#6b3e26')}"/>${[-60, 30].map((x) => `<path d="M${x} -230 q30 -50 0 -100" fill="none" opacity="0.6"/>`).join('')}`)
    case 'umbrella':
      return g(`<path d="M-420 0 Q-400 -360 0 -380 Q400 -360 420 0 Q350 -60 280 0 Q210 -60 140 0 Q70 -60 0 0 Q-70 -60 -140 0 Q-210 -60 -280 0 Q-350 -60 -420 0Z" fill="${f('#2c3e50')}"/><path d="M0 -380 L0 330 Q0 400 -70 380" fill="none" stroke-width="22"/>`)
    case 'blueprint':
      return `<rect width="${W}" height="${H}" fill="${p.s.color ? '#1f4f8a' : 'url(#tone-dense)'}"/>` + g(`${Array.from({ length: 11 }, (_, i) => `<line x1="${-500 + i * 100}" y1="-500" x2="${-500 + i * 100}" y2="500" stroke="#fff" stroke-opacity="0.25"/>`).join('')}<ellipse rx="360" ry="120" fill="none" stroke="#fff" stroke-width="8"/><ellipse rx="220" ry="70" fill="none" stroke="#fff" stroke-width="4"/><line x1="-400" y1="200" x2="400" y2="200" stroke="#fff"/>`)
  }
}
