import type { PageFormat, Project } from '../types'

// Dimensiones en px a ~150 ppp: suficiente para pantalla y una impresión digna.
export const PAGE_FORMATS: PageFormat[] = [
  { id: 'manga-tankobon', name: 'Manga tankōbon', description: 'B6 · 128 × 182 mm', width: 756, height: 1075, margin: 45, bleed: 18 },
  { id: 'manga-b5', name: 'Manga revista', description: 'B5 · 182 × 257 mm', width: 1075, height: 1518, margin: 60, bleed: 18 },
  { id: 'us-comic', name: 'Cómic americano', description: '6.625 × 10.25 in', width: 994, height: 1538, margin: 56, bleed: 19 },
  { id: 'bd-europea', name: 'BD europea', description: 'A4 · 210 × 297 mm', width: 1240, height: 1754, margin: 70, bleed: 18 },
  { id: 'webtoon', name: 'Webtoon', description: 'Tira vertical 800 × 2400', width: 800, height: 2400, margin: 40, bleed: 0 },
  { id: 'square', name: 'Tira social', description: 'Cuadrado 1080 × 1080', width: 1080, height: 1080, margin: 40, bleed: 0 },
  { id: 'strip', name: 'Tira de periódico', description: 'Horizontal 1800 × 600', width: 1800, height: 600, margin: 30, bleed: 0 },
]

export const PROJECT_KINDS: { id: Project['kind']; name: string; description: string; format: string; direction: Project['readingDirection'] }[] = [
  { id: 'comic', name: 'Cómic', description: 'Lectura de izquierda a derecha, color', format: 'us-comic', direction: 'ltr' },
  { id: 'manga', name: 'Manga', description: 'Lectura de derecha a izquierda, tramas', format: 'manga-tankobon', direction: 'rtl' },
  { id: 'webtoon', name: 'Webtoon', description: 'Scroll vertical para móvil', format: 'webtoon', direction: 'vertical' },
  { id: 'libre', name: 'Libre', description: 'Tiras, ilustraciones, storyboards', format: 'square', direction: 'ltr' },
]

export function getFormat(id: string): PageFormat {
  return PAGE_FORMATS.find((f) => f.id === id) ?? PAGE_FORMATS[0]
}
