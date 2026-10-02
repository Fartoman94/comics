import { uid } from './id'

// Coordinación entre pestañas del mismo navegador: un proyecto se edita en una sola a la vez.
type Msg = { t: 'hola' | 'ocupado' | 'tomar' | 'chau'; id: string; tab: string }

const TAB = uid('tab_')
const channel: BroadcastChannel | null = typeof BroadcastChannel === 'function' ? new BroadcastChannel('vineta-edicion') : null

/**
 * Anuncia que esta pestaña abre `projectId`. Devuelve si otra pestaña ya lo está editando, y
 * avisa (`onTakenOver`) si otra pestaña después toma el control.
 */
export function joinProject(projectId: string, isEditing: () => boolean, onTakenOver: () => void) {
  let busyElsewhere = false
  const onMsg = (e: MessageEvent<Msg>) => {
    const m = e.data
    if (!m || m.id !== projectId || m.tab === TAB) return
    if (m.t === 'hola' && isEditing()) channel?.postMessage({ t: 'ocupado', id: projectId, tab: TAB } satisfies Msg)
    if (m.t === 'ocupado') busyElsewhere = true
    if (m.t === 'tomar') onTakenOver()
  }
  channel?.addEventListener('message', onMsg)
  channel?.postMessage({ t: 'hola', id: projectId, tab: TAB } satisfies Msg)
  return {
    /** Espera un instante las respuestas de otras pestañas. */
    check: () => new Promise<boolean>((res) => setTimeout(() => res(busyElsewhere), channel ? 350 : 0)),
    takeOver: () => channel?.postMessage({ t: 'tomar', id: projectId, tab: TAB } satisfies Msg),
    leave: () => {
      channel?.postMessage({ t: 'chau', id: projectId, tab: TAB } satisfies Msg)
      channel?.removeEventListener('message', onMsg)
    },
  }
}
