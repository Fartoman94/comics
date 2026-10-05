import type { WorkDef } from './types'

/** Catálogo liviano de las muestras (el inicio no carga los guiones hasta que se abre una). */
export const SAMPLES = [
  { id: 'voltaje', title: 'VOLTAJE', subtitle: 'La noche de Puerto Faro', genre: 'Cómic occidental · acción y superación', accent: '#ffd23f' },
  { id: 'kazekiri', title: 'KAZEKIRI', subtitle: 'El filo del aliento', genre: 'Manga shonen · aventura y combate', accent: '#ffffff' },
  { id: 'inquilino', title: 'EL INQUILINO DEL 7B', subtitle: 'La letra de la noche', genre: 'Manga seinen · thriller psicológico', accent: '#cfcfcf' },
  { id: 'petalos', title: 'PÉTALOS EN DIFERIDO', subtitle: 'Lo que se escucha con las manos', genre: 'Shojo · romance dramático', accent: '#ffc2d6' },
  { id: 'cartera', title: 'LA CARTERA DE LA LUNA', subtitle: 'Correo nocturno para lo que no se olvida', genre: 'Webtoon vertical · fantasía cotidiana', accent: '#fff4c9' },
  { id: 'orbita', title: 'ÓRBITA ESCARLATA', subtitle: 'El Custodio del Eje', genre: 'Novela gráfica estilo anime · ciencia ficción', accent: '#ff4b6b' },
] as const

export type SampleId = (typeof SAMPLES)[number]['id']

const loaders = import.meta.glob<{ work: WorkDef }>('./works/*.ts')

export async function loadWork(id: SampleId): Promise<WorkDef> {
  return (await loaders[`./works/${id}.ts`]()).work
}

/** Portada como imagen SVG (para la galería del inicio, sin rasterizar). */
export async function coverSvg(id: SampleId): Promise<string> {
  const [work, { shotSvg }] = await Promise.all([loadWork(id), import('./engine/compose')])
  return shotSvg(work.style, work.characters, work.cover.shot, 600, 900, 7)
}

/** Crea una copia editable de la muestra en "Tus proyectos" y devuelve su id. */
export async function createSampleProject(id: SampleId, onProgress?: (done: number, total: number) => void): Promise<string> {
  const [work, { buildWorkProject }, { saveProject }] = await Promise.all([loadWork(id), import('./build'), import('../lib/storage')])
  const project = await buildWorkProject(work, (p) => onProgress?.(p.done, p.total))
  await saveProject(project)
  return project.id
}
