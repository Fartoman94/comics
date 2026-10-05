/** Tema de la interfaz (noche = oscuro, día = claro). Se guarda por usuario en este navegador. */
export type Theme = 'dark' | 'light'

const KEY = 'vineta:tema'

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* sin almacenamiento */
  }
  return 'dark'
}

/** Aplica el tema al documento (atributo data-theme, color-scheme y la barra del navegador). */
export function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#f4f4f7' : '#0e0e11')
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* sin almacenamiento: vale para esta sesión */
  }
}
