import { create } from 'zustand'

/** Densidad de la interfaz: misma lógica y mismas acciones, dos layouts. */
export type UiMode = 'simple' | 'studio'

const MODE_KEY = 'vineta:modo-ui'
const TIPS_KEY = 'vineta:ayudas-vistas'
const TIPS_OFF_KEY = 'vineta:ayudas-apagadas'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento: vale para esta sesión */
  }
}

/** Pantallas chicas arrancan en modo simple; lo que elija la persona se recuerda en este dispositivo. */
export function defaultMode(): UiMode {
  const saved = read(MODE_KEY)
  if (saved === 'simple' || saved === 'studio') return saved
  return typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches ? 'simple' : 'studio'
}

interface UiState {
  mode: UiMode
  setMode(m: UiMode): void
  /** Microayudas contextuales ya vistas (por id). */
  tipsSeen: string[]
  tipsOff: boolean
  dismissTip(id: string): void
  disableTips(): void
  resetTips(): void
  /** Pedido de abrir una hoja del modo simple desde otro lado (p. ej. el menú "⋯"). */
  sheetRequest: { id: string; n: number } | null
  requestSheet(id: string): void
}

export const useUi = create<UiState>()((set, get) => ({
  mode: defaultMode(),
  setMode: (mode) => {
    write(MODE_KEY, mode)
    set({ mode })
  },
  tipsSeen: (() => {
    try {
      return JSON.parse(read(TIPS_KEY) ?? '[]') as string[]
    } catch {
      return []
    }
  })(),
  tipsOff: read(TIPS_OFF_KEY) === '1',
  dismissTip: (id) => {
    const tipsSeen = [...new Set([...get().tipsSeen, id])]
    write(TIPS_KEY, JSON.stringify(tipsSeen))
    set({ tipsSeen })
  },
  disableTips: () => {
    write(TIPS_OFF_KEY, '1')
    set({ tipsOff: true })
  },
  sheetRequest: null,
  requestSheet: (id) => set({ sheetRequest: { id, n: (get().sheetRequest?.n ?? 0) + 1 } }),
  resetTips: () => {
    write(TIPS_KEY, null)
    write(TIPS_OFF_KEY, null)
    set({ tipsSeen: [], tipsOff: false })
  },
}))
