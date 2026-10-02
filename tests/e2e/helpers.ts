import { expect, type Page } from '@playwright/test'

export const FIXTURES = new URL('../fixtures/', import.meta.url).pathname

/** No mostrar el tour de bienvenida (se prueba aparte). */
export async function skipTour(page: Page) {
  await page.addInitScript(() => localStorage.setItem('vineta:tour-done', '1'))
}

export async function gotoHome(page: Page) {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
}

/** Evalúa código con acceso al store del editor (`s`) y a los módulos de la app (`m`). */
export function inApp<T>(page: Page, body: string, arg?: unknown): Promise<T> {
  return page.evaluate(
    async ([body, arg]) => {
      // Mismas URLs que usa la app en dev: se obtiene la misma instancia de cada módulo.
      const load = (path: string) => import(/* @vite-ignore */ path)
      const m = {
        store: await load('/src/store/editor.ts'),
        storage: await load('/src/lib/storage.ts'),
        factories: await load('/src/lib/factories.ts'),
        placement: await load('/src/lib/placement.ts'),
        assets: await load('/src/lib/assetCache.ts'),
      }
      const s = m.store.useEditor.getState()
      return new Function('s', 'm', 'arg', `return (async () => { ${body} })()`)(s, m, arg)
    },
    [body, arg] as const,
  )
}

/** Crea un proyecto directamente en IndexedDB y devuelve su id. */
export function createProjectInDb(page: Page, title: string, kind = 'comic', pages = 2) {
  return inApp<string>(page, `const p = m.factories.createProject({ title: arg.title, author: '', kind: arg.kind, pages: arg.pages }); await m.storage.saveProject(p); return p.id`, { title, kind, pages })
}

export async function openProject(page: Page, id: string) {
  await page.goto(`/#/p/${id}`)
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
}

/** Abre una vista del editor en cualquiera de los dos modos (simple: menú "⋯"; estudio: barra superior). */
export async function openView(page: Page, view: 'Leer' | 'Previsualizar' | 'Vista general') {
  const simple = (await page.locator('[data-ui-mode]').getAttribute('data-ui-mode')) === 'simple'
  if (simple) {
    await page.getByRole('button', { name: 'Más opciones del proyecto' }).click()
    await page.getByRole('button', { name: view, exact: true }).click()
    return
  }
  const direct = view === 'Leer' ? page.locator('[data-tour=read]') : page.getByRole('button', { name: view, exact: true }).first()
  if (await direct.isVisible()) return direct.click()
  await page.getByRole('button', { name: 'Exportar' }).click()
  await page.getByRole('button', { name: view === 'Leer' ? 'Ver lectura' : view, exact: true }).last().click()
}

export function projectCard(page: Page, title: string) {
  return page.locator('main article').filter({ has: page.locator('div.truncate', { hasText: new RegExp(`^${title.replace(/[()]/g, '\\$&')}$`) }) })
}

export async function cardMenu(page: Page, title: string, item: string) {
  const card = projectCard(page, title)
  await card.hover()
  await card.getByRole('button', { name: 'Opciones' }).click()
  await page.getByRole('button', { name: item, exact: true }).click()
}

/** Acceso crudo a IndexedDB (las mismas bases que usa idb-keyval), sin pasar por la app. */
export function idbRaw<T>(page: Page, op: { db: 'vineta-projects' | 'vineta-assets'; action: 'put' | 'count'; key?: string; value?: unknown }) {
  return page.evaluate(
    (op) =>
      new Promise<T>((resolve, reject) => {
        const store = op.db === 'vineta-projects' ? 'projects' : 'blobs'
        const req = indexedDB.open(op.db)
        req.onupgradeneeded = () => req.result.createObjectStore(store)
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const tx = req.result.transaction(store, op.action === 'put' ? 'readwrite' : 'readonly')
          const os = tx.objectStore(store)
          const r = op.action === 'put' ? os.put(op.value, op.key) : os.count()
          r.onsuccess = () => resolve(r.result as T)
          r.onerror = () => reject(r.error)
        }
      }),
    op,
  )
}

/** Centro en pantalla de un elemento del lienzo (o de un punto de la página si se pasan coordenadas). */
export function canvasPoint(page: Page, target: string | { x: number; y: number }) {
  return page.evaluate(async (target) => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const stage = Konva.stages[Konva.stages.length - 1]
    const box = stage.container().getBoundingClientRect()
    if (typeof target === 'string') {
      const r = stage.findOne('#' + target).getClientRect()
      return { x: box.left + r.x + r.width / 2, y: box.top + r.y + r.height / 2 }
    }
    const p = stage.getAbsoluteTransform().point(target)
    return { x: box.left + p.x, y: box.top + p.y }
  }, target)
}
