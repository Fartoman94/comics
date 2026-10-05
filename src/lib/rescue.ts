import type { Project } from '../types'

/**
 * Copia de rescate en localStorage para el instante de cerrar la pestaña: IndexedDB es asíncrono
 * y el navegador puede cortar la escritura, pero localStorage se escribe en el acto. Al volver a
 * abrir el proyecto, si la copia es más nueva que lo guardado, se recupera. Se borra en cuanto un
 * guardado normal termina bien.
 */
const PREFIX = 'vineta:rescate:'

interface Rescue {
  savedAt: number
  project: Project
}

/** Escribe la copia. Devuelve false si no hay espacio o almacenamiento (entonces hay que avisar). */
export function writeRescue(project: Project): boolean {
  try {
    // La miniatura (data URL) no hace falta: se regenera.
    const data: Rescue = { savedAt: Date.now(), project: { ...project, thumbnail: null } }
    localStorage.setItem(PREFIX + project.id, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearRescue(projectId: string) {
  try {
    localStorage.removeItem(PREFIX + projectId)
  } catch {
    /* sin almacenamiento */
  }
}

/** La copia de rescate si es más nueva que el proyecto guardado (sin validar: la valida quien la usa). */
export function readRescue(projectId: string, storedUpdatedAt: number): unknown | null {
  try {
    const raw = localStorage.getItem(PREFIX + projectId)
    if (!raw) return null
    const r = JSON.parse(raw) as Rescue
    if (!r?.project || r.project.id !== projectId || !(r.project.updatedAt > storedUpdatedAt)) {
      clearRescue(projectId)
      return null
    }
    return r.project
  } catch {
    clearRescue(projectId)
    return null
  }
}
