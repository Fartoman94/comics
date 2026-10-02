import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// idb-keyval real sobre fake-indexeddb, con la posibilidad de hacer fallar escrituras puntuales.
const failOn = { set: null as null | ((key: IDBValidKey, value: unknown) => boolean) }
vi.mock('idb-keyval', async (orig) => {
  const real = await orig<typeof import('idb-keyval')>()
  return {
    ...real,
    set: (key: IDBValidKey, value: unknown, store?: Parameters<typeof real.set>[2]) => {
      if (failOn.set?.(key, value)) return Promise.reject(new DOMException('cuota excedida', 'QuotaExceededError'))
      return real.set(key, value, store)
    },
  }
})

const storage = await import('../../src/lib/storage')
const { createProject } = await import('../../src/lib/factories')
const { createImage } = await import('../../src/lib/factories')
import type { Project } from '../../src/types'

const png = (n: number) => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, n])], { type: 'image/png' })

async function projectWithImages(title: string, n = 2): Promise<Project> {
  const p = createProject({ title, author: '', kind: 'comic', pages: 2 })
  for (let i = 0; i < n; i++) {
    const id = `as_${title.replace(/\W/g, '')}${i}`
    await storage.putAssetBlob(id, png(i))
    p.assets.push({ id, name: `foto${i}`, width: 10, height: 10, mime: 'image/png', createdAt: 0 })
    p.pages[1].elements.push(createImage(id, 0, 0, 10, 10))
  }
  const panel = p.pages[1].elements.find((e) => e.type === 'panel')
  if (panel?.type === 'panel') panel.image = { assetId: p.assets[0].id, x: 0, y: 0, scale: 1, filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } }
  await storage.saveProject(p)
  return p
}
const refsOf = (p: Project) => p.pages.flatMap((pg) => pg.elements).flatMap((e) => (e.type === 'image' ? [e.assetId] : e.type === 'panel' && e.image ? [e.image.assetId] : []))

beforeEach(() => {
  failOn.set = null
})

describe('duplicateProject (A1)', () => {
  it('la copia tiene sus propias imágenes: borrar el original no la rompe', async () => {
    const original = await projectWithImages('Original A1')
    const copy = await storage.duplicateProject(original, { title: 'Copia A1' })
    expect(copy.id).not.toBe(original.id)
    const origIds = new Set(original.assets.map((a) => a.id))
    for (const a of copy.assets) expect(origIds.has(a.id)).toBe(false)
    for (const r of refsOf(copy)) expect(copy.assets.some((a) => a.id === r)).toBe(true)

    await storage.deleteProject(original)
    for (const a of original.assets) expect(await storage.getAssetBlob(a.id)).toBeUndefined()
    const reloaded = (await storage.loadProject(copy.id))!
    for (const a of reloaded.assets) expect(await storage.getAssetBlob(a.id)).toBeInstanceOf(Blob)
  })

  it('si falla a mitad no deja blobs copiados ni un proyecto a medias', async () => {
    const original = await projectWithImages('Rollback A1')
    const { entries, createStore } = await import('idb-keyval')
    const blobStore = createStore('vineta-assets', 'blobs')
    const projectsBefore = (await storage.listProjects()).length
    const blobsBefore = (await entries(blobStore)).length
    let writes = 0
    // deja pasar la primera imagen copiada y falla en la segunda
    failOn.set = (key) => typeof key === 'string' && key.startsWith('as_') && ++writes === 2
    await expect(storage.duplicateProject(original)).rejects.toThrow()
    failOn.set = null
    expect((await storage.listProjects()).length).toBe(projectsBefore)
    expect((await entries(blobStore)).length).toBe(blobsBefore)
  })
})

describe('deleteProject', () => {
  it('no borra imágenes que otro proyecto todavía usa (datos viejos con ids compartidos)', async () => {
    const a = await projectWithImages('Compartido')
    // Duplicado "a la antigua": mismo asset.id en los dos proyectos.
    const legacyCopy: Project = { ...structuredClone(a), id: 'pr_legacycopy', title: 'Copia vieja' }
    await storage.saveProject(legacyCopy)
    await storage.deleteProject(a)
    for (const as of legacyCopy.assets) expect(await storage.getAssetBlob(as.id)).toBeInstanceOf(Blob)
    await storage.deleteProject(legacyCopy)
    for (const as of legacyCopy.assets) expect(await storage.getAssetBlob(as.id)).toBeUndefined()
  })
})

describe('importProjectFile (A5)', () => {
  const file = (text: string, name = 'p.vineta') => new File([text], name, { type: 'application/json' })
  const legacyText = readFileSync(new URL('../fixtures/legacy-v1.vineta', import.meta.url), 'utf8')

  it('importa un .vineta de legado con ids nuevos e imágenes', async () => {
    const p = await storage.importProjectFile(file(legacyText))
    const stored = (await storage.loadProject(p.id))!
    expect(stored.title).toBe('Legado v1')
    for (const a of stored.assets) expect(await storage.getAssetBlob(a.id)).toBeInstanceOf(Blob)
    for (const r of refsOf(stored)) expect(stored.assets.some((a) => a.id === r)).toBe(true)
  })

  it('un archivo inválido no escribe nada', async () => {
    const before = (await storage.listAllProjects()).projects.length
    const bad = JSON.parse(legacyText)
    bad.project.title = { malicioso: true }
    await expect(storage.importProjectFile(file(JSON.stringify(bad)))).rejects.toThrow('El proyecto tiene datos dañados')
    await expect(storage.importProjectFile(file('basura total'))).rejects.toThrow('El archivo está dañado')
    const after = await storage.listAllProjects()
    expect(after.projects.length).toBe(before)
    expect(after.damaged.length).toBe(0)
  })

  it('si IndexedDB falla al guardar, revierte las imágenes y da un mensaje claro', async () => {
    const { entries, createStore } = await import('idb-keyval')
    const blobStore = createStore('vineta-assets', 'blobs')
    const blobsBefore = (await entries(blobStore)).length
    failOn.set = (key) => typeof key === 'string' && key.startsWith('pr_')
    await expect(storage.importProjectFile(file(legacyText))).rejects.toThrow('No se pudo guardar el proyecto importado')
    failOn.set = null
    expect((await entries(blobStore)).length).toBe(blobsBefore)
  })
})

describe('listAllProjects', () => {
  it('separa los proyectos dañados guardados por versiones anteriores', async () => {
    const { set, createStore } = await import('idb-keyval')
    await set('pr_roto', { id: 'pr_roto', title: { malicioso: true }, pages: [] }, createStore('vineta-projects', 'projects'))
    const { projects, damaged } = await storage.listAllProjects()
    expect(projects.some((p) => p.id === 'pr_roto')).toBe(false)
    expect(damaged.find((d) => d.key === 'pr_roto')).toMatchObject({ title: 'Proyecto sin nombre' })
    await expect(storage.loadProject('pr_roto')).rejects.toThrow('datos dañados')
    await storage.deleteDamagedProject('pr_roto')
    expect((await storage.listAllProjects()).damaged.some((d) => d.key === 'pr_roto')).toBe(false)
  })
})
