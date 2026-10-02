import { describe, expect, it } from 'vitest'
import { CANVAS_LIMITS, formatBytes, isSafeCanvas, numbered, planStrip } from '../../src/lib/exportPlan'

const base = { title: 'mi-webtoon', pageWidth: 800, pageHeight: 2400, targetWidth: 800, format: 'png' as const, quality: 0.9, sliceMaxHeight: 8000 }
const range = (n: number) => [...Array(n).keys()]

describe('planStrip', () => {
  it('tira continua cuando entra en un canvas seguro', () => {
    const p = planStrip({ ...base, pages: range(3), mode: 'continuous' })
    expect(p.files).toHaveLength(1)
    expect(p.files[0]).toMatchObject({ name: 'mi-webtoon-webtoon.png', width: 800, height: 7200 })
    expect(p.segmentedForSafety).toBe(false)
  })

  it('un webtoon que supera 16,7 Mpx se segmenta solo y ningún archivo pasa los límites', () => {
    const p = planStrip({ ...base, pages: range(10), mode: 'continuous' }) // 800 × 24000 = 19,2 Mpx
    expect(800 * 24000).toBeGreaterThan(CANVAS_LIMITS.area)
    expect(p.segmentedForSafety).toBe(true)
    expect(p.files.length).toBeGreaterThan(1)
    for (const f of p.files) expect(isSafeCanvas(f.width, f.height), `${f.name} ${f.width}×${f.height}`).toBe(true)
    expect(p.files.reduce((n, f) => n + f.height, 0)).toBe(24000)
    expect(p.files.map((f) => f.name)).toEqual(p.files.map((_, i) => numbered('mi-webtoon', i, p.files.length, 'png')))
  })

  it('división numerada respeta el alto máximo pedido y cubre cada página sin huecos', () => {
    const p = planStrip({ ...base, pages: [1, 2, 3], mode: 'slices', sliceMaxHeight: 1000 })
    expect(p.files.every((f) => f.height <= 1000)).toBe(true)
    const covered = new Map<number, number>()
    for (const f of p.files)
      for (const part of f.parts) {
        expect(part.srcY).toBe(covered.get(part.page) ?? 0)
        covered.set(part.page, part.srcY + part.height)
      }
    expect([...covered.entries()]).toEqual([
      [1, 2400],
      [2, 2400],
      [3, 2400],
    ])
  })

  it('páginas separadas: un archivo por página (ancho final escalado)', () => {
    const p = planStrip({ ...base, pages: range(4), mode: 'pages', targetWidth: 400, format: 'jpg' })
    expect(p.files.map((f) => [f.name, f.width, f.height])).toEqual([
      ['mi-webtoon-001.jpg', 400, 1200],
      ['mi-webtoon-002.jpg', 400, 1200],
      ['mi-webtoon-003.jpg', 400, 1200],
      ['mi-webtoon-004.jpg', 400, 1200],
    ])
  })

  it('canvas muy ancho: el alto seguro baja para no pasar el área', () => {
    const p = planStrip({ ...base, pageWidth: 4000, pageHeight: 4000, targetWidth: 4000, pages: range(2), mode: 'continuous' })
    for (const f of p.files) expect(isSafeCanvas(f.width, f.height)).toBe(true)
  })

  it('estima el peso y lo muestra legible', () => {
    const jpg = planStrip({ ...base, pages: range(3), mode: 'continuous', format: 'jpg', quality: 0.8 })
    const png = planStrip({ ...base, pages: range(3), mode: 'continuous' })
    expect(png.estimatedBytes).toBeGreaterThan(jpg.estimatedBytes)
    expect(formatBytes(1536)).toBe('2 KB')
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB')
  })
})
