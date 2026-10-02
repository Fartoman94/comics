import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decodeImageDataUrl, LIMITS, parseProjectFile, ProjectFileError, remapAssetIds, validateProject } from '../../src/lib/projectSchema'

const legacyText = readFileSync(new URL('../fixtures/legacy-v1.vineta', import.meta.url), 'utf8')
const legacy = () => JSON.parse(legacyText)
const parseObj = (o: unknown) => parseProjectFile(JSON.stringify(o))
const errOf = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return e as ProjectFileError
  }
  throw new Error('no tiró error')
}

describe('parseProjectFile', () => {
  it('acepta un .vineta real de la versión auditada (legado v1)', () => {
    const { project, blobs } = parseProjectFile(legacyText)
    expect(project.title).toBe('Legado v1')
    expect(project.pages).toHaveLength(2)
    expect(project.pages[0].elements.map((e) => e.type)).toEqual(['panel', 'text', 'text', 'image', 'bubble', 'text', 'effect', 'drawing'])
    expect(blobs.size).toBe(2)
    for (const b of blobs.values()) expect(b.mime).toBe('image/png')
  })

  it('JSON inválido → mensaje amigable, no el error crudo del navegador', () => {
    const e = errOf(() => parseProjectFile('\u0000ÿ basura'))
    expect(e).toBeInstanceOf(ProjectFileError)
    expect(e.message).toBe('El archivo está dañado o no es un proyecto de Viñeta Studio.')
    expect(e.message).not.toMatch(/Unexpected|JSON|token/)
  })

  it('archivo de otra app', () => {
    expect(errOf(() => parseObj({ hola: 1 })).message).toBe('El archivo no es un proyecto de Viñeta Studio.')
  })

  it('versión más nueva → pide actualizar', () => {
    const d = legacy()
    d.version = 2
    expect(errOf(() => parseObj(d)).message).toMatch(/versión más nueva .*v2/)
  })

  it('A5: title con un objeto se rechaza antes de guardar', () => {
    const d = legacy()
    d.project.title = { malicioso: true }
    const e = errOf(() => parseObj(d))
    expect(e.message).toBe('El proyecto tiene datos dañados y no se puede abrir.')
    expect(e.detail).toMatch(/project\.title/)
  })

  it('tipos de elemento desconocidos y enums inválidos se rechazan', () => {
    const d = legacy()
    d.project.pages[0].elements[0].type = 'virus'
    expect(errOf(() => parseObj(d)).detail).toMatch(/tipo de elemento desconocido/)
    const d2 = legacy()
    d2.project.kind = 'novela'
    expect(errOf(() => parseObj(d2)).detail).toMatch(/project\.kind/)
  })

  it('ids repetidos se rechazan', () => {
    const d = legacy()
    d.project.pages[1].id = d.project.pages[0].id
    expect(errOf(() => parseObj(d)).detail).toMatch(/id repetido/)
  })

  it('referencias a imágenes que no existen → referencias rotas', () => {
    const d = legacy()
    d.project.assets = d.project.assets.slice(1)
    expect(errOf(() => parseObj(d)).message).toMatch(/referencias rotas/)
  })

  it('límites: demasiadas páginas o una página gigante', () => {
    const d = legacy()
    d.project.pages = Array.from({ length: LIMITS.pages + 1 }, (_, i) => ({ ...d.project.pages[1], id: `pg_${i}`, elements: [] }))
    expect(errOf(() => parseObj(d)).message).toMatch(/límites/)
    const d2 = legacy()
    d2.project.format.width = 100000
    expect(errOf(() => parseObj(d2)).message).toMatch(/límites/)
  })

  it('las imágenes sólo pueden ser data URL de imagen: nunca una URL a la que haya que pedirle algo', () => {
    const d = legacy()
    const id = d.project.assets[0].id
    d.blobs[id] = 'https://example.com/seguimiento.png'
    expect(errOf(() => parseObj(d)).message).toMatch(/imágenes del archivo está dañada/)
  })

  it('el contenido tiene que coincidir con el tipo declarado', () => {
    // "PNG" que en realidad son bytes cualquiera
    expect(() => decodeImageDataUrl('data:image/png;base64,' + btoa('no soy un png'))).toThrow(ProjectFileError)
    expect(() => decodeImageDataUrl('data:image/svg+xml;base64,' + btoa('<svg/>'))).toThrow(ProjectFileError)
  })

  it('descarta campos desconocidos (no se guarda basura extra)', () => {
    const d = legacy()
    d.project.__proto_hack = { x: 1 }
    d.project.pages[0].elements[0].extra = 'x'
    const { project } = parseObj(d)
    expect('__proto_hack' in project).toBe(false)
    expect('extra' in project.pages[0].elements[0]).toBe(false)
  })
})

describe('validateProject', () => {
  it('normaliza un proyecto válido sin cambiar su contenido', () => {
    const d = legacy()
    const p = validateProject(d.project)
    expect(p.pages[0].elements[1]).toMatchObject({ type: 'text' })
    expect(JSON.parse(JSON.stringify(p.pages))).toEqual(JSON.parse(JSON.stringify(d.project.pages)))
  })
})

describe('remapAssetIds', () => {
  it('cambia el id en los recursos, en imágenes libres y en viñetas', () => {
    const { project } = parseProjectFile(legacyText)
    const map = new Map(project.assets.map((a, i) => [a.id, `as_nuevo${i}`]))
    remapAssetIds(project, map)
    expect(project.assets.map((a) => a.id)).toEqual(['as_nuevo0', 'as_nuevo1'])
    const refs = project.pages.flatMap((p) => p.elements).flatMap((e) => (e.type === 'image' ? [e.assetId] : e.type === 'panel' && e.image ? [e.image.assetId] : []))
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) expect(r).toMatch(/^as_nuevo/)
  })
})
