import { useState } from 'react'
import { create } from 'zustand'
import { useEditor } from '../../../store/editor'
import { Button, Modal } from '../../ui/controls'
import { confirmDialog } from '../../ui/Confirm'
import { getThumb } from '../../../lib/thumbs'

type Req = { kind: 'rename' | 'copy'; pageId: string } | null
const usePageDialog = create<{ req: Req }>(() => ({ req: null }))

export const openRenamePage = (pageId: string) => usePageDialog.setState({ req: { kind: 'rename', pageId } })
export const openCopyContent = (pageId: string) => usePageDialog.setState({ req: { kind: 'copy', pageId } })

/** Eliminar una página pidiendo confirmación (misma acción para la tira, la lista y la vista general). */
export async function deletePageWithConfirm(id: string) {
  const s = useEditor.getState()
  const pg = s.project?.pages.find((p) => p.id === id)
  if (!pg) return
  if (s.project!.pages.length <= 1) return s.deletePage(id)
  const n = pg.elements.length
  const ok = await confirmDialog('Eliminar página', `Se eliminará "${pg.name}"${n ? ` con ${n} elemento(s)` : ''}. Podés deshacerlo con Ctrl+Z.`, { confirmLabel: 'Eliminar', danger: true })
  if (ok) useEditor.getState().deletePage(id)
}

/** Diálogos de página compartidos: renombrar y copiar contenido a otras páginas. */
export function PageDialogsHost() {
  const req = usePageDialog((s) => s.req)
  const close = () => usePageDialog.setState({ req: null })
  return (
    <>
      <RenameDialog pageId={req?.kind === 'rename' ? req.pageId : null} onClose={close} />
      <CopyContentDialog pageId={req?.kind === 'copy' ? req.pageId : null} onClose={close} />
    </>
  )
}

function RenameDialog({ pageId, onClose }: { pageId: string | null; onClose: () => void }) {
  const page = useEditor((s) => s.project?.pages.find((p) => p.id === pageId))
  return (
    <Modal open={!!page} onClose={onClose} title="Renombrar página" width="max-w-sm">
      {page && <RenameForm key={page.id} pageId={page.id} initial={page.name} onClose={onClose} />}
    </Modal>
  )
}

function RenameForm({ pageId, initial, onClose }: { pageId: string; initial: string; onClose: () => void }) {
  const [name, setName] = useState(initial)
  const save = () => {
    if (name.trim()) useEditor.getState().renamePage(pageId, name)
    onClose()
  }
  return (
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <label className="block text-xs text-ink-300">
          Nombre
          <input
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="mt-1 h-9 w-full rounded-md border border-ink-600 bg-ink-900 px-2 text-sm text-ink-100 outline-none focus:border-accent"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            Guardar
          </Button>
        </div>
      </form>
  )
}

function CopyContentDialog({ pageId, onClose }: { pageId: string | null; onClose: () => void }) {
  const open = useEditor((s) => !!s.project?.pages.some((p) => p.id === pageId))
  return (
    <Modal open={open} onClose={onClose} title="Copiar contenido a…" width="max-w-md">
      {open && pageId && <CopyContentForm key={pageId} pageId={pageId} onClose={onClose} />}
    </Modal>
  )
}

function CopyContentForm({ pageId, onClose }: { pageId: string; onClose: () => void }) {
  const project = useEditor((s) => s.project)!
  const src = project.pages.find((p) => p.id === pageId)
  const [picked, setPicked] = useState<string[]>([])
  const others = project.pages.map((p, i) => ({ p, i })).filter(({ p }) => p.id !== pageId)
  return (
      <div className="space-y-4 p-5">
        <p className="text-xs text-ink-400">
          Se copian los {src?.elements.length ?? 0} elementos de "{src?.name}" (viñetas, imágenes, globos y textos) encima de lo que ya tengan las páginas elegidas.
        </p>
        <ul className="scroll-thin grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4" aria-label="Páginas de destino">
          {others.map(({ p, i }) => {
            const on = picked.includes(p.id)
            const thumb = getThumb(p.id)
            return (
              <li key={p.id}>
                <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg p-1.5 text-[11px] ring-1 ${on ? 'bg-accent-soft text-white ring-accent' : 'text-ink-300 ring-ink-700 hover:bg-ink-800'}`}>
                  <span className="block h-16 w-full overflow-hidden rounded-sm bg-white">{thumb && <img src={thumb} alt="" className="h-full w-full object-contain" />}</span>
                  <span className="flex w-full items-center gap-1">
                    <input type="checkbox" checked={on} onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))} aria-label={`Página ${i + 1}: ${p.name}`} />
                    <span className="truncate">
                      {i + 1}. {p.name}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        {others.length === 0 && <p className="text-xs text-ink-500">No hay otras páginas. Agregá una primero.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!picked.length || !src?.elements.length}
            onClick={() => {
              useEditor.getState().copyPageContentTo(pageId, picked)
              onClose()
            }}
          >
            Copiar a {picked.length || ''} {picked.length === 1 ? 'página' : 'páginas'}
          </Button>
        </div>
      </div>
  )
}
