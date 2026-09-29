import { create } from 'zustand'
import { Button, Modal } from './controls'

interface ConfirmState {
  request: { title: string; message: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void } | null
}

const useConfirmStore = create<ConfirmState>(() => ({ request: null }))

/** Reemplazo de window.confirm con el estilo de la app. */
export function confirmDialog(title: string, message: string, opts: { confirmLabel?: string; danger?: boolean } = {}) {
  return new Promise<boolean>((resolve) => {
    useConfirmStore.setState({ request: { title, message, confirmLabel: opts.confirmLabel ?? 'Aceptar', danger: opts.danger ?? false, resolve } })
  })
}

export function ConfirmHost() {
  const req = useConfirmStore((s) => s.request)
  const close = (ok: boolean) => {
    req?.resolve(ok)
    useConfirmStore.setState({ request: null })
  }
  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title ?? ''} width="max-w-sm">
      <div className="p-5">
        <p className="text-sm leading-relaxed text-ink-300">{req?.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
            {req?.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
