/** Formatos de imagen aceptados (SVG no: no hay sanitización segura de SVG en la app). */
export const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
export type AcceptedMime = (typeof ACCEPTED_MIME)[number]
/** Tamaño máximo de archivo por imagen. Las de más de 4096 px por lado se reducen al importar. */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024
export const ACCEPT_ATTR = ACCEPTED_MIME.join(',')

/** Tipo real según los primeros bytes (no la extensión ni lo que diga el navegador). */
export async function sniffImageType(blob: Blob): Promise<AcceptedMime | 'image/svg+xml' | null> {
  const head = new Uint8Array(await blob.slice(0, 512).arrayBuffer())
  const at = (i: number, ...bytes: number[]) => bytes.every((b, k) => head[i + k] === b)
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp'
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return 'image/gif'
  const text = new TextDecoder().decode(head).trimStart().toLowerCase()
  if (text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'))) return 'image/svg+xml'
  return null
}

export type ImageCheck = { ok: true; mime: AcceptedMime } | { ok: false; reason: string }

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`

/** Valida un archivo antes de importarlo: tipo real y tamaño. */
export async function validateImageFile(file: Blob & { name?: string }): Promise<ImageCheck> {
  const name = file.name ? `"${file.name}"` : 'La imagen'
  if (file.size === 0) return { ok: false, reason: `${name} está vacía.` }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: `${name} pesa ${mb(file.size)}; el máximo es ${mb(MAX_IMAGE_BYTES)}.` }
  const real = await sniffImageType(file)
  if (real === 'image/svg+xml') return { ok: false, reason: `${name} es SVG: por seguridad sólo se aceptan PNG, JPG, WebP o GIF.` }
  if (!real) return { ok: false, reason: `${name} no es una imagen PNG, JPG, WebP o GIF (o está dañada).` }
  return { ok: true, mime: real }
}
