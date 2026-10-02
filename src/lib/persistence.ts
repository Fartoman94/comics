import type { Project } from '../types'
import { saveProject } from './storage'

// Las escrituras a IndexedDB se encolan: nunca hay dos a la vez y salen en el orden en que se pidieron,
// así un guardado viejo no puede pisar uno más nuevo. `revision` es monotónica (la sube cada cambio).
let queue: Promise<unknown> = Promise.resolve()
const written = new Map<string, number>()

export function enqueueSave(project: Project, revision: number): Promise<void> {
  const job = queue.then(async () => {
    if ((written.get(project.id) ?? -1) >= revision) return
    await saveProject(project)
    written.set(project.id, revision)
  })
  queue = job.catch(() => undefined)
  return job
}

/** Espera a que terminen todas las escrituras pendientes (tests y salida de la app). */
export function settleSaves(): Promise<void> {
  return queue.then(() => undefined)
}
