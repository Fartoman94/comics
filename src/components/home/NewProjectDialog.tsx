import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../types'
import { PAGE_FORMATS, PROJECT_KINDS } from '../../lib/formats'
import { createProject } from '../../lib/factories'
import { saveProject } from '../../lib/storage'
import { navigateToProject } from '../../lib/nav'
import { useEditor } from '../../store/editor'
import { Button, cx, Modal, NumberInput } from '../ui/controls'

export function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('Mi primera historia')
  const [author, setAuthor] = useState('')
  const [kind, setKind] = useState<Project['kind']>('comic')
  const [formatId, setFormatId] = useState('us-comic')
  const [pages, setPages] = useState(4)

  useEffect(() => {
    const k = PROJECT_KINDS.find((x) => x.id === kind)!
    setFormatId(k.format)
    setPages(kind === 'webtoon' ? 3 : 4)
  }, [kind])

  // Un solo proyecto por pedido, aunque haya doble clic, Enter repetido o IndexedDB lento.
  const [creating, setCreating] = useState(false)
  const busy = useRef(false)
  const create = async () => {
    if (busy.current) return
    busy.current = true
    setCreating(true)
    try {
      const p = createProject({ title: title.trim() || 'Sin título', author: author.trim(), kind, formatId, pages })
      await saveProject(p)
      onClose()
      navigateToProject(p.id)
    } catch (e) {
      console.error(e)
      useEditor.getState().toast('No se pudo crear el proyecto. ¿El navegador se quedó sin espacio?', 'error', { label: 'Reintentar', run: () => void create() })
    } finally {
      busy.current = false
      setCreating(false)
    }
  }

  const format = PAGE_FORMATS.find((f) => f.id === formatId)!

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto" width="max-w-2xl">
      <div className="grid gap-6 p-5 sm:grid-cols-[1fr_200px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink-300">
              Título
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-white outline-none focus:border-accent" />
            </label>
            <label className="text-xs text-ink-300">
              Autor/a
              <input value={author} placeholder="Tu nombre" onChange={(e) => setAuthor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-white outline-none focus:border-accent" />
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs text-ink-300">Tipo de obra</div>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  className={cx('rounded-xl border p-3 text-left transition-colors', kind === k.id ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')}
                >
                  <div className="font-comic text-xl tracking-wide text-white">{k.name}</div>
                  <div className="text-[11px] leading-snug text-ink-400">{k.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-ink-300">Formato de página</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAGE_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatId(f.id)}
                  className={cx('rounded-lg border px-3 py-2 text-left transition-colors', formatId === f.id ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')}
                >
                  <div className="text-xs font-medium text-white">{f.name}</div>
                  <div className="text-[10px] text-ink-400">{f.description}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-xs text-ink-300">
            Páginas iniciales
            <NumberInput value={pages} onChange={setPages} min={1} max={60} className="w-20" />
          </label>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl bg-ink-900 p-4">
          <div
            className="flex items-center justify-center bg-white text-[10px] font-semibold text-ink-500 shadow-lg"
            style={{
              width: format.width > format.height ? 150 : (150 * format.width) / format.height,
              height: format.width > format.height ? (150 * format.height) / format.width : 150,
            }}
          >
            {format.width}×{format.height}
          </div>
          <div className="mt-3 text-center text-xs text-ink-300">{format.name}</div>
          <div className="text-[10px] text-ink-500">
            {kind === 'manga' ? 'Lectura derecha → izquierda' : kind === 'webtoon' ? 'Lectura vertical' : 'Lectura izquierda → derecha'}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-700 px-5 py-3.5">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={() => void create()} disabled={creating} aria-busy={creating}>
          {creating ? 'Creando…' : 'Crear proyecto'}
        </Button>
      </div>
    </Modal>
  )
}
