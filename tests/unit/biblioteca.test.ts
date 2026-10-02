import { describe, expect, it } from 'vitest'
import { createStore, set } from 'idb-keyval'

const storage = await import('../../src/lib/storage')
const { createProject, createImage, createBubble } = await import('../../src/lib/factories')
import type { Project } from '../../src/types'

const png = (n: number) => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, n, n + 1])], { type: 'image/png' })
async function withImage(title: string, n = 1): Promise<Project> {
  const p = createProject({ title, author: '', kind: 'comic', pages: 1 })
  const id = `as_${title.replace(/\W/g, '')}`
  const blob = png(n)
  await storage.putAssetBlob(id, blob)
  p.assets.push({ id, name: 'foto', width: 10, height: 10, mime: 'image/png', createdAt: 0, hash: await storage.hashBlob(blob) })
  p.pages[0].elements.push(createImage(id, 0, 0, 10, 10))
  await storage.saveProject(p)
  return p
}

describe('índice liviano y migración', () => {
  it('saveProject mantiene el resumen; los proyectos viejos sin índice se indexan y los dañados se marcan', async () => {
    const p = await withImage('Indexado')
    const legacy = createProject({ title: 'Viejo sin índice', author: '', kind: 'manga', pages: 3 })
    await set(legacy.id, legacy, createStore('vineta-projects', 'projects')) // como lo guardaba la versión anterior
    await set('pr_roto_idx', { id: 'pr_roto_idx', title: 'Roto', pages: 'x' }, createStore('vineta-projects', 'projects'))
    const list = await storage.listProjectSummaries()
    expect(list.find((s) => s.id === p.id)).toMatchObject({ title: 'Indexado', pages: 1, kind: 'comic' })
    expect(list.find((s) => s.id === legacy.id)).toMatchObject({ title: 'Viejo sin índice', pages: 3 })
    expect(list.find((s) => s.id === 'pr_roto_idx')?.damaged).toBeTruthy()
    await storage.deleteDamagedProject('pr_roto_idx')
    expect((await storage.listProjectSummaries()).some((s) => s.id === 'pr_roto_idx')).toBe(false)
  })
})

describe('papelera', () => {
  it('borrar manda a la papelera, se restaura y la imagen sobrevive mientras tanto', async () => {
    const p = await withImage('Papelera', 7)
    await storage.trashProject(p.id)
    expect((await storage.listProjectSummaries()).some((s) => s.id === p.id)).toBe(false)
    expect((await storage.listTrash()).map((t) => t.id)).toContain(p.id)
    await storage.deleteBlobsIfUnused([p.assets[0].id])
    expect(await storage.getAssetBlob(p.assets[0].id)).toBeInstanceOf(Blob)
    await storage.restoreProject(p.id)
    expect((await storage.loadProject(p.id))!.title).toBe('Papelera')
  })
  it('se vacía sola después de 30 días y libera las imágenes que nadie usa', async () => {
    const p = await withImage('Vencido', 9)
    await storage.trashProject(p.id)
    await storage.purgeTrash(30, Date.now() + 31 * 24 * 3600_000)
    expect((await storage.listTrash()).some((t) => t.id === p.id)).toBe(false)
    expect(await storage.getAssetBlob(p.assets[0].id)).toBeUndefined()
  })
})

describe('biblioteca', () => {
  it('no duplica la misma imagen y la conserva aunque se borre el proyecto de origen', async () => {
    const p = await withImage('Origen bib', 11)
    await storage.addLibraryImage(p.assets[0], { id: p.id, title: p.title })
    await storage.addLibraryImage(p.assets[0], { id: p.id, title: p.title })
    const same = (await storage.listLibrary()).filter((i) => i.type === 'image' && i.asset.hash === p.assets[0].hash)
    expect(same).toHaveLength(1)
    await storage.deleteProject(p)
    expect(await storage.getAssetBlob(p.assets[0].id)).toBeInstanceOf(Blob)
    await storage.deleteLibraryItem(same[0].id)
    expect(await storage.getAssetBlob(p.assets[0].id)).toBeUndefined()
  })
  it('renombrar y etiquetar no cambia la imagen', async () => {
    const p = await withImage('Etiquetas', 13)
    await storage.addLibraryImage(p.assets[0])
    const it = (await storage.listLibrary()).find((i) => i.type === 'image' && i.asset.id === p.assets[0].id)!
    await storage.updateLibraryItem(it.id, { name: 'Protagonista', tags: ['héroe'], category: 'personajes', favorite: true })
    const after = (await storage.listLibrary()).find((i) => i.id === it.id)!
    expect(after).toMatchObject({ name: 'Protagonista', tags: ['héroe'], category: 'personajes', favorite: true })
    expect(after.type === 'image' && after.asset.id).toBe(p.assets[0].id)
  })
  it('una composición guarda la posición relativa de sus partes', async () => {
    const a = createBubble('speech', 100, 200)
    const b = createBubble('thought', 160, 260)
    const item = await storage.saveComposition('Charla', [a, b], [])
    expect(item.type).toBe('composition')
    if (item.type !== 'composition') return
    expect(item.elements.map((e) => [e.x, e.y])).toEqual([
      [0, 0],
      [60, 60],
    ])
  })
})

describe('instantáneas', () => {
  it('como mucho una cada 5 minutos, se guardan 3 y se restauran como copia validada', async () => {
    const p = await withImage('Snap', 15)
    const t0 = Date.now()
    expect(await storage.takeSnapshot(p, false, t0)).toBe(true)
    expect(await storage.takeSnapshot(p, false, t0 + 60_000)).toBe(false)
    for (let i = 1; i <= 4; i++) await storage.takeSnapshot({ ...p, title: `v${i}` }, false, t0 + i * 6 * 60_000)
    const list = await storage.listSnapshots(p.id)
    expect(list).toHaveLength(3)
    expect(list[0].project.title).toBe('v4')
    const copy = await storage.restoreSnapshot(list[1].key)
    expect(copy.id).not.toBe(p.id)
    expect(copy.title).toMatch(/^v3 \(recuperado/)
    await storage.pruneSnapshots(t0 + 30 * 24 * 3600_000)
    expect(await storage.listSnapshots(p.id)).toHaveLength(0)
  })
})
