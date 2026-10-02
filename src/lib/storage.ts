import { createStore, del, entries, get, keys, set } from 'idb-keyval'
import type { Asset, ComicElement, Page, PageFormat, Project } from '../types'
import { uid } from './id'
import { LIMITS, parseProjectFile, ProjectFileError, remapAssetIds, validateProject } from './projectSchema'

// Dos bases separadas: los proyectos son JSON livianos, las imágenes son blobs pesados.
const projectStore = createStore('vineta-projects', 'projects')
const blobStore = createStore('vineta-assets', 'blobs')
// Plantillas propias: páginas guardadas por la persona, con copia propia de sus imágenes.
const templateStore = createStore('vineta-plantillas', 'plantillas')
// Índice liviano para el inicio (título, tipo, páginas, miniatura): no hace falta cargar proyectos enteros.
const indexStore = createStore('vineta-indice', 'proyectos')
// Papelera: proyectos borrados que se pueden restaurar (se vacía sola a los 30 días).
const trashStore = createStore('vineta-papelera', 'proyectos')
// Biblioteca del usuario: imágenes y elementos reutilizables, compartida entre proyectos.
const libraryStore = createStore('vineta-biblioteca', 'items')
// Instantáneas locales acotadas para recuperarse de un guardado fallido o un proyecto dañado.
const snapshotStore = createStore('vineta-instantaneas', 'instantaneas')

export const TRASH_DAYS = 30
export const SNAPSHOTS_PER_PROJECT = 3
export const SNAPSHOT_EVERY_MS = 5 * 60_000
export const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 3600_000

/** Lo que el inicio necesita de cada proyecto. */
export interface ProjectSummary {
  id: string
  title: string
  kind: Project['kind']
  pages: number
  formatName: string
  updatedAt: number
  createdAt: number
  thumbnail: string | null
  /** Si el proyecto guardado no pasa la validación, el motivo. */
  damaged?: string
}

export interface TrashEntry {
  id: string
  deletedAt: number
  project: Project
}

export type LibraryCategory = 'personajes' | 'fondos' | 'objetos' | 'texturas' | 'otros'
interface LibraryBase {
  id: string
  name: string
  tags: string[]
  category: LibraryCategory
  favorite: boolean
  createdAt: number
  lastUsedAt: number
  sourceProjectId?: string
  sourceTitle?: string
}
export type LibraryItem =
  | (LibraryBase & { type: 'image'; asset: Asset })
  | (LibraryBase & { type: 'composition'; elements: ComicElement[]; assets: Asset[]; width: number; height: number })

export interface Snapshot {
  key: string
  projectId: string
  at: number
  project: Project
}

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

const summaryOf = (p: Project, damaged?: string): ProjectSummary => ({
  id: p.id,
  title: typeof p.title === 'string' ? p.title : 'Proyecto sin nombre',
  kind: p.kind,
  pages: Array.isArray(p.pages) ? p.pages.length : 0,
  formatName: p.format?.name ?? '',
  updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
  createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
  thumbnail: typeof p.thumbnail === 'string' ? p.thumbnail : null,
  ...(damaged ? { damaged } : {}),
})

/**
 * Proyectos para el inicio, desde el índice liviano. Migración: los proyectos guardados antes de que
 * existiera el índice (o cuyo resumen falte) se leen una sola vez, se validan y se indexan.
 */
export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const [ids, indexed] = await Promise.all([keys<IDBValidKey>(projectStore), entries<IDBValidKey, ProjectSummary>(indexStore)])
  const have = new Map(indexed.map(([k, v]) => [String(k), v]))
  const out: ProjectSummary[] = []
  for (const key of ids.map(String)) {
    let sum = have.get(key)
    if (!sum) {
      const raw = await get<unknown>(key, projectStore)
      try {
        sum = summaryOf(validateProject(raw))
      } catch (e) {
        sum = summaryOf((raw ?? {}) as Project, e instanceof ProjectFileError ? e.message : String(e))
        sum.id = key
      }
      await set(key, sum, indexStore)
    }
    out.push(sum)
  }
  // Entradas del índice sin proyecto (por ejemplo, de un borrado interrumpido).
  const live = new Set(ids.map(String))
  await Promise.all([...have.keys()].filter((k) => !live.has(k)).map((k) => del(k, indexStore)))
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
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
export async function saveProject(p: Project) {
  await set(p.id, p, projectStore)
  await set(p.id, summaryOf(p), indexStore)
}

/**
 * Ids de imágenes que algo todavía usa: proyectos (también los dañados, por lo que se pueda leer),
 * plantillas propias, papelera, biblioteca e instantáneas. Ninguna imagen usada se borra.
 */
async function assetUsage(exceptKey?: string): Promise<Set<string>> {
  const used = new Set<string>()
  const add = (assets: unknown) => {
    if (Array.isArray(assets)) for (const a of assets) if (typeof (a as Asset)?.id === 'string') used.add((a as Asset).id)
  }
  for (const [key, raw] of [...(await entries<IDBValidKey, unknown>(projectStore)), ...(await entries<IDBValidKey, unknown>(templateStore))]) if (String(key) !== exceptKey) add((raw as { assets?: unknown } | null)?.assets)
  for (const [key, t] of await entries<IDBValidKey, TrashEntry>(trashStore)) if (String(key) !== exceptKey) add(t?.project?.assets)
  for (const [, it] of await entries<IDBValidKey, LibraryItem>(libraryStore)) add(it?.type === 'image' ? [it.asset] : it?.assets)
  for (const [, sn] of await entries<IDBValidKey, Snapshot>(snapshotStore)) if (sn?.projectId !== exceptKey) add(sn?.project?.assets)
  return used
}

/** Borra un proyecto para siempre (y sus instantáneas). Las imágenes que otra cosa todavía usa no se tocan. */
export async function deleteProject(p: Pick<Project, 'id'> & { assets?: Asset[] }) {
  await deleteSnapshots(p.id)
  const usedElsewhere = await assetUsage(p.id)
  await Promise.all((p.assets ?? []).filter((a) => !usedElsewhere.has(a.id)).map((a) => del(a.id, blobStore)))
  await del(p.id, projectStore)
  await del(p.id, indexStore)
  await del(p.id, trashStore)
}

// ---------- Papelera ----------

/** Mueve un proyecto a la papelera (se puede restaurar durante 30 días). */
export async function trashProject(id: string) {
  const raw = await get<Project>(id, projectStore)
  if (!raw) return
  await set(id, { id, deletedAt: Date.now(), project: raw } satisfies TrashEntry, trashStore)
  await del(id, projectStore)
  await del(id, indexStore)
}

export async function restoreProject(id: string) {
  const t = await get<TrashEntry>(id, trashStore)
  if (!t) return
  await set(id, t.project, projectStore)
  let sum: ProjectSummary
  try {
    sum = summaryOf(validateProject(t.project))
  } catch (e) {
    sum = { ...summaryOf(t.project, e instanceof ProjectFileError ? e.message : String(e)), id }
  }
  await set(id, sum, indexStore)
  await del(id, trashStore)
}

export async function listTrash(): Promise<TrashEntry[]> {
  return (await entries<IDBValidKey, TrashEntry>(trashStore)).map(([, t]) => t).sort((a, b) => b.deletedAt - a.deletedAt)
}

/** Borra definitivamente lo que está en la papelera hace más de `days` días (por defecto 30). */
export async function purgeTrash(days = TRASH_DAYS, now = Date.now()) {
  for (const t of await listTrash()) if (now - t.deletedAt > days * 24 * 3600_000) await deleteForever(t.id)
}

export async function deleteForever(id: string) {
  const t = await get<TrashEntry>(id, trashStore)
  await deleteProject({ id, assets: t?.project?.assets ?? [] })
}

// ---------- Biblioteca ----------

export async function listLibrary(): Promise<LibraryItem[]> {
  return (await entries<IDBValidKey, LibraryItem>(libraryStore)).map(([, v]) => v).sort((a, b) => b.lastUsedAt - a.lastUsedAt)
}

export async function findLibraryImageByHash(hash: string): Promise<(LibraryItem & { type: 'image' }) | undefined> {
  for (const it of await listLibrary()) if (it.type === 'image' && it.asset.hash === hash) return it
  return undefined
}

/** Suma una imagen a la biblioteca (comparte el mismo blob por referencia: nada se copia). */
export async function addLibraryImage(asset: Asset, source?: { id: string; title: string }) {
  if (asset.hash && (await findLibraryImageByHash(asset.hash))) return
  const now = Date.now()
  const item: LibraryItem = { id: uid('lb_'), type: 'image', name: asset.name, tags: [], category: 'otros', favorite: false, createdAt: now, lastUsedAt: now, asset, sourceProjectId: source?.id, sourceTitle: source?.title }
  await set(item.id, item, libraryStore)
}

/** Guarda una selección como elemento reutilizable (composición relativa, textos, estilos y recortes). */
export async function saveComposition(name: string, elements: ComicElement[], assets: Asset[], source?: { id: string; title: string }) {
  const minX = Math.min(...elements.map((e) => e.x))
  const minY = Math.min(...elements.map((e) => e.y))
  const width = Math.max(...elements.map((e) => e.x + e.width)) - minX
  const height = Math.max(...elements.map((e) => e.y + e.height)) - minY
  const now = Date.now()
  const item: LibraryItem = {
    id: uid('lb_'),
    type: 'composition',
    name,
    tags: [],
    category: 'personajes',
    favorite: false,
    createdAt: now,
    lastUsedAt: now,
    elements: elements.map((e) => ({ ...structuredClone(e), x: e.x - minX, y: e.y - minY })),
    assets,
    width,
    height,
    sourceProjectId: source?.id,
    sourceTitle: source?.title,
  }
  await set(item.id, item, libraryStore)
  return item
}

export async function updateLibraryItem(id: string, patch: Partial<Pick<LibraryBase, 'name' | 'tags' | 'category' | 'favorite' | 'lastUsedAt'>>) {
  const it = await get<LibraryItem>(id, libraryStore)
  if (it) await set(id, { ...it, ...patch }, libraryStore)
}

export async function deleteLibraryItem(id: string) {
  const it = await get<LibraryItem>(id, libraryStore)
  if (!it) return
  await del(id, libraryStore)
  await deleteBlobsIfUnused(it.type === 'image' ? [it.asset.id] : it.assets.map((a) => a.id))
}

// ---------- Instantáneas ----------

/**
 * Guarda una instantánea del proyecto si la última tiene más de 5 minutos (o si se fuerza).
 * Retención: las 3 más recientes por proyecto y nunca más de 7 días.
 */
export async function takeSnapshot(project: Project, force = false, now = Date.now()) {
  const mine = (await entries<IDBValidKey, Snapshot>(snapshotStore)).map(([, v]) => v).filter((v) => v.projectId === project.id).sort((a, b) => b.at - a.at)
  if (!force && mine[0] && now - mine[0].at < SNAPSHOT_EVERY_MS) return false
  const key = `${project.id}:${now}`
  await set(key, { key, projectId: project.id, at: now, project: structuredClone(project) } satisfies Snapshot, snapshotStore)
  for (const old of mine.slice(SNAPSHOTS_PER_PROJECT - 1)) await del(old.key, snapshotStore)
  return true
}

export async function listSnapshots(projectId?: string): Promise<Snapshot[]> {
  const all = (await entries<IDBValidKey, Snapshot>(snapshotStore)).map(([, v]) => v)
  return all.filter((s) => !projectId || s.projectId === projectId).sort((a, b) => b.at - a.at)
}

/** Limpieza: instantáneas de más de 7 días o de proyectos que ya no existen. */
export async function pruneSnapshots(now = Date.now()) {
  const live = new Set((await keys<IDBValidKey>(projectStore)).map(String))
  for (const sn of await listSnapshots()) if (now - sn.at > SNAPSHOT_MAX_AGE_MS || !live.has(sn.projectId)) await del(sn.key, snapshotStore)
}

async function deleteSnapshots(projectId: string) {
  for (const sn of await listSnapshots(projectId)) await del(sn.key, snapshotStore)
}

/** Restaura una instantánea como proyecto nuevo (validado), sin tocar el original. */
export async function restoreSnapshot(key: string): Promise<Project> {
  const sn = await get<Snapshot>(key, snapshotStore)
  if (!sn) throw new ProjectFileError('La instantánea ya no existe.')
  const p = validateProject(sn.project)
  const copy: Project = { ...p, id: uid('pr_'), title: `${p.title} (recuperado ${new Date(sn.at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})`, updatedAt: Date.now() }
  await saveProject(copy)
  return copy
}

// ---------- Utilidades ----------

/** Huella de contenido (SHA-256) para detectar imágenes repetidas. */
export async function hashBlob(b: Blob): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', await b.arrayBuffer())
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Uso de almacenamiento del sitio (aproximado, lo que informa el navegador). */
export async function storageUsage(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  const persisted = (await navigator.storage.persisted?.()) ?? false
  return { usage, quota, persisted }
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
export async function importImageFile(file: Blob, name: string, hash?: string): Promise<Asset> {
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
  const asset: Asset = { id: uid('as_'), name: name.replace(/\.[^.]+$/, '') || 'imagen', width, height, mime: blob.type, createdAt: Date.now(), ...(hash ? { hash } : {}) }
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
