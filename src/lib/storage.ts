import { createStore, del, entries, get, set } from 'idb-keyval'
import type { Asset, Project } from '../types'
import { uid } from './id'

// Dos bases separadas: los proyectos son JSON livianos, las imágenes son blobs pesados.
const projectStore = createStore('vineta-projects', 'projects')
const blobStore = createStore('vineta-assets', 'blobs')

export async function listProjects(): Promise<Project[]> {
  const all = await entries<string, Project>(projectStore)
  return all.map(([, p]) => p).sort((a, b) => b.updatedAt - a.updatedAt)
}

export const loadProject = (id: string) => get<Project>(id, projectStore)
export const saveProject = (p: Project) => set(p.id, p, projectStore)

export async function deleteProject(p: Project) {
  await Promise.all(p.assets.map((a) => del(a.id, blobStore)))
  await del(p.id, projectStore)
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

interface ProjectFile {
  app: 'vineta-studio'
  version: 1
  project: Project
  blobs: Record<string, string>
}

const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(b)
  })

export async function exportProjectFile(p: Project): Promise<Blob> {
  const blobs: Record<string, string> = {}
  for (const a of p.assets) {
    const b = await getAssetBlob(a.id)
    if (b) blobs[a.id] = await blobToDataURL(b)
  }
  const data: ProjectFile = { app: 'vineta-studio', version: 1, project: p, blobs }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

export async function importProjectFile(file: File): Promise<Project> {
  const data = JSON.parse(await file.text()) as ProjectFile
  if (data.app !== 'vineta-studio' || !data.project) throw new Error('El archivo no es un proyecto de Viñeta Studio.')
  const project = data.project
  // Ids nuevos para poder importar el mismo archivo dos veces sin pisar nada.
  const idMap = new Map<string, string>()
  for (const a of project.assets) {
    const newId = uid('as_')
    idMap.set(a.id, newId)
    const src = data.blobs[a.id]
    if (src) await putAssetBlob(newId, await (await fetch(src)).blob())
    a.id = newId
  }
  const remap = (id: string) => idMap.get(id) ?? id
  for (const page of project.pages)
    for (const el of page.elements) {
      if (el.type === 'image') el.assetId = remap(el.assetId)
      if (el.type === 'panel' && el.image) el.image.assetId = remap(el.image.assetId)
    }
  project.id = uid('pr_')
  project.updatedAt = Date.now()
  await saveProject(project)
  return project
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
