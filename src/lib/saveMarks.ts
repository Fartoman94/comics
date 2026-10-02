// Marcas de "guardado fallido": sobreviven a cerrar la pestaña para avisar en el centro de recuperación.
const PREFIX = 'vineta:guardado-fallido:'

export function markSaveFailed(projectId: string) {
  try {
    localStorage.setItem(PREFIX + projectId, String(Date.now()))
  } catch {
    /* sin almacenamiento */
  }
}

export function clearSaveFailed(projectId: string) {
  try {
    localStorage.removeItem(PREFIX + projectId)
  } catch {
    /* sin almacenamiento */
  }
}

export function failedSaves(): { id: string; at: number }[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => ({ id: k.slice(PREFIX.length), at: Number(localStorage.getItem(k)) || 0 }))
  } catch {
    return []
  }
}
