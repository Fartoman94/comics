import { create } from 'zustand'

/** Densidad de la interfaz: misma lógica y mismas acciones, dos layouts. */
export type UiMode = 'simple' | 'studio'

const MODE_KEY = 'vineta:modo-ui'
const TIPS_KEY = 'vineta:ayudas-vistas'
const TIPS_OFF_KEY = 'vineta:ayudas-apagadas'
const FILMSTRIP_KEY = 'vineta:tira-paginas'
const SIDEBAR_KEY = 'vineta:paneles'

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

export const PHONES = [
  { id: '360x800', w: 360, h: 800, label: '360×800 (Android chico)' },
  { id: '390x844', w: 390, h: 844, label: '390×844 (iPhone)' },
  { id: '430x932', w: 430, h: 932, label: '430×932 (pantalla grande)' },
] as const
export type PhoneId = (typeof PHONES)[number]['id']

interface UiState {
  /** Sidebar de paneles (estudio): visible o plegada. En tablet arranca plegada para dar lugar al lienzo. */
  sidebar: boolean
  setSidebar(open: boolean): void
  /** Tira de páginas bajo el lienzo (estudio): abierta o plegada, se recuerda en este dispositivo. */
  filmstrip: boolean
  setFilmstrip(open: boolean): void
  /** Marco de "pantalla del teléfono" sobre el lienzo (webtoon): sólo guía visual, no se exporta. */
  phoneFrame: { on: boolean; device: PhoneId; y: number }
  setPhoneFrame(p: Partial<UiState['phoneFrame']>): void
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
  sidebar: (() => {
    const saved = read(SIDEBAR_KEY)
    if (saved === '1' || saved === '0') return saved === '1'
    return typeof matchMedia !== 'function' || matchMedia('(min-width: 1024px)').matches
  })(),
  setSidebar: (open) => {
    write(SIDEBAR_KEY, open ? '1' : '0')
    set({ sidebar: open })
  },
  filmstrip: read(FILMSTRIP_KEY) !== '0',
  setFilmstrip: (open) => {
    write(FILMSTRIP_KEY, open ? '1' : '0')
    set({ filmstrip: open })
  },
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
  phoneFrame: { on: false, device: '390x844', y: 0 },
  setPhoneFrame: (p) => set({ phoneFrame: { ...get().phoneFrame, ...p } }),
  sheetRequest: null,
  requestSheet: (id) => set({ sheetRequest: { id, n: (get().sheetRequest?.n ?? 0) + 1 } }),
  resetTips: () => {
    write(TIPS_KEY, null)
    write(TIPS_OFF_KEY, null)
    set({ tipsSeen: [], tipsOff: false })
  },
}))
