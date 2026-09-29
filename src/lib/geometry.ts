export interface Pt { x: number; y: number }

/** Contrae un polígono convexo moviendo cada arista `d` hacia adentro. */
export function insetConvexPolygon(pts: Pt[], d: number): Pt[] {
  const n = pts.length
  if (n < 3 || d === 0) return pts
  // Orientación: área con signo
  let area = 0
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n]
    area += a.x * b.y - b.x * a.y
  }
  const sign = area > 0 ? 1 : -1
  const lines = pts.map((a, i) => {
    const b = pts[(i + 1) % n]
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    // normal hacia adentro
    const nx = (-dy / len) * sign, ny = (dx / len) * sign
    return { p: { x: a.x + nx * d, y: a.y + ny * d }, v: { x: dx, y: dy } }
  })
  return lines.map((l1, i) => {
    const l0 = lines[(i - 1 + n) % n]
    return intersect(l0.p, l0.v, l1.p, l1.v) ?? l1.p
  })
}

function intersect(p: Pt, r: Pt, q: Pt, s: Pt): Pt | null {
  const rxs = r.x * s.y - r.y * s.x
  if (Math.abs(rxs) < 1e-9) return null
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / rxs
  return { x: p.x + t * r.x, y: p.y + t * r.y }
}

export function bbox(pts: Pt[]) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  const minX = Math.min(...xs), minY = Math.min(...ys)
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
}

export function pointInPolygon(pt: Pt, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

export function rotatePoint(p: Pt, origin: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r), s = Math.sin(r)
  const dx = p.x - origin.x, dy = p.y - origin.y
  return { x: origin.x + dx * c - dy * s, y: origin.y + dx * s + dy * c }
}

/** PRNG determinista para que los efectos no "bailen" entre renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
