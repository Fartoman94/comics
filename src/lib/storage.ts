import { createStore, del, entries, get, set } from 'idb-keyval'
import type { Asset, Page, PageFormat, Project } from '../types'
import { uid } from './id'
import { LIMITS, parseProjectFile, ProjectFileError, remapAssetIds, validateProject } from './projectSchema'

// Dos bases separadas: los proyectos son JSON livianos, las imágenes son blobs pesados.
const projectStore = createStore('vineta-projects', 'projects')
const blobStore = createStore('vineta-assets', 'blobs')
// Plantillas propias: páginas guardadas por la persona, con copia propia de sus imágenes.
const templateStore = createStore('vineta-plantillas', 'plantillas')

export interface LocalTemplate {
  id: string
  name: string
  createdAt: number
  /** Tamaño de la página original, para escalar al aplicar en otro formato. */
  format: Pick<PageFormat, 'width' | 'height'>
  page: Page
  assets: Asset[]
}

/** Proyecto guardado que no pasa la validación: se ofrece exportarlo o borrarlo, nunca se dibuja. */
export interface DamagedProject {
  key: string
  title: string
  reason: string
}

export async function listProjects(): Promise<Project[]> {
  return (await listAllProjects()).projects
}

/** Lista separando los proyectos sanos de los dañados (que no deben llegar al editor). */
export async function listAllProjects(): Promise<{ projects: Project[]; damaged: DamagedProject[] }> {
  const all = await entries<IDBValidKey, unknown>(projectStore)
  const projects: Project[] = []
  const damaged: DamagedProject[] = []
  for (const [key, raw] of all) {
    try {
      projects.push(validateProject(raw))
    } catch (e) {
      const t = (raw as { title?: unknown } | null)?.title
      damaged.push({ key: String(key), title: typeof t === 'string' ? t.slice(0, 120) : 'Proyecto sin nombre', reason: e instanceof ProjectFileError ? e.message : String(e) })
    }
  }
  projects.sort((a, b) => b.updatedAt - a.updatedAt)
  return { projects, damaged }
}

/**
 * Carga un proyecto validado. `null` si no existe; tira ProjectFileError si está dañado.
 */
export async function loadProject(id: string): Promise<Project | null> {
  const raw = await get<unknown>(id, projectStore)
  if (raw === undefined) return null
  return validateProject(raw)
}
export const saveProject = (p: Project) => set(p.id, p, projectStore)

/** Ids de recursos que usa cada proyecto guardado y cada plantilla propia (los dañados cuentan por lo que se pueda leer). */
async function assetUsage(exceptKey?: string): Promise<Set<string>> {
  const used = new Set<string>()
  const all = [...(await entries<IDBValidKey, unknown>(projectStore)), ...(await entries<IDBValidKey, unknown>(templateStore))]
  for (const [key, raw] of all) {
    if (String(key) === exceptKey) continue
    const assets = (raw as { assets?: unknown } | null)?.assets
    if (Array.isArray(assets)) for (const a of assets) if (typeof (a as Asset)?.id === 'string') used.add((a as Asset).id)
  }
  return used
}

/** Borra un proyecto. Las imágenes que otro proyecto todavía usa no se tocan. */
export async function deleteProject(p: Pick<Project, 'id'> & { assets?: Asset[] }) {
  const usedElsewhere = await assetUsage(p.id)
  await Promise.all((p.assets ?? []).filter((a) => !usedElsewhere.has(a.id)).map((a) => del(a.id, blobStore)))
  await del(p.id, projectStore)
}

/**
 * Borra los blobs indicados salvo los que algún proyecto guardado todavía lista entre sus recursos.
 * Devuelve los ids efectivamente borrados.
 */
export async function deleteBlobsIfUnused(ids: string[]): Promise<string[]> {
  if (!ids.length) return []
  const used = await assetUsage()
  const gone = ids.filter((i) => !used.has(i))
  await Promise.all(gone.map((i) => del(i, blobStore)))
  return gone
}

export async function listLocalTemplates(): Promise<LocalTemplate[]> {
  const all = await entries<string, LocalTemplate>(templateStore)
  return all.map(([, t]) => t).sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Guarda una página como plantilla propia: ids nuevos, sin vínculos de guion, y una copia propia de
 * cada imagen (borrar el proyecto original no la afecta). Todo o nada.
 */
export async function saveLocalTemplate(project: Project, page: Page, name: string): Promise<LocalTemplate> {
  const clean: Page = { ...structuredClone(page), id: uid('pg_'), name }
  clean.elements = clean.elements.map((e) => ({ ...e, id: uid('el_') }))
  const used = new Set<string>()
  for (const e of clean.elements) {
    if (e.type === 'image') used.add(e.assetId)
    if (e.type === 'panel' && e.image) used.add(e.image.assetId)
  }
  const map = new Map<string, string>()
  const assets: Asset[] = []
  const written: string[] = []
  try {
    for (const a of project.assets.filter((x) => used.has(x.id))) {
      const blob = await getAssetBlob(a.id)
      if (!blob) continue
      const nid = uid('as_')
      await putAssetBlob(nid, blob)
      written.push(nid)
      map.set(a.id, nid)
      assets.push({ ...a, id: nid })
    }
    // Imágenes que no se pudieron copiar: se sacan de la plantilla (nunca referencias rotas).
    clean.elements = clean.elements
      .filter((e) => !(e.type === 'image' && !map.has(e.assetId)))
      .map((e) => (e.type === 'image' ? { ...e, assetId: map.get(e.assetId)! } : e.type === 'panel' && e.image ? { ...e, image: map.has(e.image.assetId) ? { ...e.image, assetId: map.get(e.image.assetId)! } : null } : e))
    const tpl: LocalTemplate = { id: uid('tp_'), name, createdAt: Date.now(), format: { width: project.format.width, height: project.format.height }, page: clean, assets }
    await set(tpl.id, tpl, templateStore)
    return tpl
  } catch (e) {
    await Promise.allSettled(written.map((w) => del(w, blobStore)))
    throw e
  }
}

export async function deleteLocalTemplate(t: LocalTemplate) {
  await del(t.id, templateStore)
  await deleteBlobsIfUnused(t.assets.map((a) => a.id))
}

/** Borra un registro dañado sin necesidad de entenderlo. */
export async function deleteDamagedProject(key: string) {
  const raw = await get<unknown>(key, projectStore)
  const assets = (raw as { assets?: unknown } | null)?.assets
  const list = Array.isArray(assets) ? (assets.filter((a) => typeof (a as Asset)?.id === 'string') as Asset[]) : []
  await deleteProject({ id: key, assets: list })
}

/** Exporta tal cual un registro (aunque esté dañado), con las imágenes que se encuentren. */
export async function exportRawProjectFile(key: string): Promise<Blob> {
  const raw = await get<unknown>(key, projectStore)
  const blobs: Record<string, string> = {}
  const assets = (raw as { assets?: unknown } | null)?.assets
  if (Array.isArray(assets))
    for (const a of assets) {
      const aid = (a as Asset)?.id
      if (typeof aid !== 'string') continue
      const b = await getAssetBlob(aid)
      if (b) blobs[aid] = await blobToDataURL(b)
    }
  return new Blob([JSON.stringify({ app: 'vineta-studio', version: 1, project: raw, blobs })], { type: 'application/json' })
}

/**
 * Duplica un proyecto con copias propias de cada imagen: borrar el original nunca afecta a la copia.
 * Todo o nada: si algo falla se borran los blobs ya copiados y no queda un proyecto a medias.
 */
export async function duplicateProject(src: Project, patch: Partial<Pick<Project, 'title'>> = {}): Promise<Project> {
  const copy: Project = structuredClone(src)
  const map = new Map<string, string>()
  const written: string[] = []
  try {
    for (const a of src.assets) {
      const newId = uid('as_')
      map.set(a.id, newId)
      const blob = await getAssetBlob(a.id)
      if (blob) {
        await putAssetBlob(newId, blob)
        written.push(newId)
      }
    }
    remapAssetIds(copy, map)
    const now = Date.now()
    Object.assign(copy, { id: uid('pr_'), createdAt: now, updatedAt: now }, patch)
    await saveProject(copy)
    return copy
  } catch (e) {
    await Promise.allSettled(written.map((wid) => del(wid, blobStore)))
    throw e
  }
}

export const getAssetBlob = (id: string) => get<Blob>(id, blobStore)
export const putAssetBlob = (id: string, blob: Blob) => set(id, blob, blobStore)
export const deleteAssetBlob = (id: string) => del(id, blobStore)

const MAX_SIDE = 4096

/** Lee un archivo de imagen, lo reduce si es gigante y lo guarda en IndexedDB. */
export async function importImageFile(file: Blob, name: string): Promise<Asset> {
  const bitmap = await createImageBitmap(file)
  let blob: Blob = file
  let { width, height } = bitmap
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  if (scale < 1 || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    const canvas = new OffscreenCanvas(width, height)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
    blob = await canvas.convertToBlob({ type: file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', quality: 0.92 })
  }
  bitmap.close()
  const asset: Asset = { id: uid('as_'), name: name.replace(/\.[^.]+$/, '') || 'imagen', width, height, mime: blob.type, createdAt: Date.now() }
  await putAssetBlob(asset.id, blob)
  return asset
}

// ---------- Exportar / importar proyecto completo (.vineta) ----------


const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(b)
  })

/**
 * Arma el .vineta por partes: el JSON del proyecto y cada imagen por separado dentro de un Blob,
 * sin construir un único string gigante con todas las imágenes.
 */
export async function exportProjectFile(p: Project): Promise<Blob> {
  const parts: BlobPart[] = [`{"app":"vineta-studio","version":1,"project":${JSON.stringify(p)},"blobs":{`]
  let first = true
  for (const a of p.assets) {
    const b = await getAssetBlob(a.id)
    if (!b) continue
    parts.push(`${first ? '' : ','}${JSON.stringify(a.id)}:"`, await blobToDataURL(b), '"')
    first = false
  }
  parts.push('}}')
  return new Blob(parts, { type: 'application/json' })
}

/**
 * Importa un .vineta: se parsea y valida todo en memoria antes de escribir.
 * Todo o nada: si falla a mitad se borra lo escrito. Los ids nuevos permiten importar dos veces.
 */
export async function importProjectFile(file: File): Promise<Project> {
  if (file.size > LIMITS.fileBytes) throw new ProjectFileError('El archivo es demasiado grande para abrirlo en el navegador.')
  const { project, blobs } = parseProjectFile(await file.text())
  const map = new Map<string, string>()
  for (const a of project.assets) map.set(a.id, uid('as_'))
  const written: string[] = []
  try {
    for (const a of project.assets) {
      const b = blobs.get(a.id)
      if (!b) continue
      const newId = map.get(a.id)!
      await putAssetBlob(newId, new Blob([b.bytes as BlobPart], { type: b.mime }))
      written.push(newId)
    }
    remapAssetIds(project, map)
    project.id = uid('pr_')
    project.updatedAt = Date.now()
    await saveProject(project)
    return project
  } catch (e) {
    await Promise.allSettled(written.map((wid) => del(wid, blobStore)))
    if (e instanceof ProjectFileError) throw e
    throw new ProjectFileError('No se pudo guardar el proyecto importado. ¿El navegador se quedó sin espacio?', String(e))
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function safeFilename(s: string) {
  return (s || 'comic').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'comic'
}
