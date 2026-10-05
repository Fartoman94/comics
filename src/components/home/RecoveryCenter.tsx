import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, HardDrive, History, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { deleteDamagedProject, downloadBlob, exportProjectFile, exportRawProjectFile, importProjectFile, listAllProjects, listSnapshots, restoreSnapshot, safeFilename, storageUsage, type DamagedProject, type ProjectSummary, type Snapshot } from '../../lib/storage'
import { formatBytes } from '../../lib/exportPlan'
import { failedSaves } from '../../lib/saveMarks'
import { ProjectFileError } from '../../lib/projectSchema'
import { navigateToProject } from '../../lib/nav'
import { useEditor } from '../../store/editor'
import { Button, Modal } from '../ui/controls'
import { confirmDialog } from '../ui/Confirm'

type Usage = { usage: number; quota: number; persisted: boolean }

/** Cuánto ocupa lo guardado en este navegador (con aviso si queda poco). */
export function StorageMeter({ usage }: { usage: Usage }) {
  if (!usage.quota) return null
  const pct = Math.min(100, (usage.usage / usage.quota) * 100)
  const low = pct > 80
  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-400" title="Espacio que el navegador le da a Viñeta Studio" data-testid="uso-almacenamiento">
      <HardDrive size={13} aria-hidden="true" />
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-700" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Uso de almacenamiento">
        <div className={low ? 'h-full bg-red-500' : 'h-full bg-emerald-500'} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className={low ? 'text-red-300' : ''}>
        {formatBytes(usage.usage)} de {formatBytes(usage.quota)}
      </span>
    </div>
  )
}

export function RenameDialog({ project, onClose, onSave }: { project: ProjectSummary | null; onClose: () => void; onSave: (title: string) => void }) {
  const [title, setTitle] = useState('')
  useEffect(() => setTitle(project?.title ?? ''), [project])
  return (
    <Modal open={!!project} onClose={onClose} title="Renombrar proyecto" width="max-w-sm">
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(title)
        }}
      >
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nuevo nombre" className="h-10 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-fg outline-none focus:border-accent" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Centro de recuperación: estado del almacenamiento, proyectos sanos y dañados, guardados fallidos,
 * instantáneas, copia de seguridad completa y restauración validada.
 */
export function RecoveryCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [healthy, setHealthy] = useState<{ id: string; title: string }[]>([])
  const [damaged, setDamaged] = useState<DamagedProject[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [failed, setFailed] = useState<{ id: string; at: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useEditor((s) => s.toast)

  const load = async () => {
    const [{ projects, damaged }, sn, u] = await Promise.all([listAllProjects(), listSnapshots(), storageUsage().catch(() => null)])
    setHealthy(projects.map((p) => ({ id: p.id, title: p.title })))
    setDamaged(damaged)
    setSnapshots(sn)
    setUsage(u)
    setFailed(failedSaves())
  }
  useEffect(() => {
    if (open) void load()
  }, [open])

  const persist = async () => {
    const ok = (await navigator.storage?.persist?.()) ?? false
    toast(ok ? 'Listo: el navegador no va a borrar tus proyectos para liberar espacio.' : 'El navegador no aceptó el pedido. Igual podés descargar copias de seguridad.', ok ? 'success' : 'info')
    void load()
  }

  /** Copia de seguridad: un ZIP con un .vineta por proyecto (los dañados, tal como están). */
  const backup = async () => {
    setBusy(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const { projects, damaged } = await listAllProjects()
      for (const p of projects) zip.file(`${safeFilename(p.title)}-${p.id}.vineta`, await exportProjectFile(p))
      for (const d of damaged) zip.file(`dañado-${d.key}.vineta`, await exportRawProjectFile(d.key))
      downloadBlob(await zip.generateAsync({ type: 'blob' }), `vineta-copia-de-seguridad-${new Date().toISOString().slice(0, 10)}.zip`)
      setReport(`Copia de seguridad con ${projects.length + damaged.length} proyectos.`)
    } catch (e) {
      console.error(e)
      toast('No se pudo armar la copia de seguridad.', 'error')
    } finally {
      setBusy(false)
    }
  }

  /** Restaurar: .vineta o ZIP de copia; cada proyecto se valida y se importa como nuevo. */
  const restore = async (f?: File) => {
    if (!f) return
    setBusy(true)
    let ok = 0
    const errors: string[] = []
    try {
      const files: File[] = []
      if (/\.zip$/i.test(f.name)) {
        const { default: JSZip } = await import('jszip')
        const zip = await JSZip.loadAsync(f)
        for (const [name, entry] of Object.entries(zip.files)) if (!entry.dir && /\.vineta$/i.test(name)) files.push(new File([await entry.async('blob')], name))
      } else files.push(f)
      for (const file of files) {
        try {
          await importProjectFile(file)
          ok++
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof ProjectFileError ? e.message : 'no se pudo leer'}`)
        }
      }
      setReport(`Restaurados: ${ok}.${errors.length ? ` Con problemas: ${errors.join(' · ')}` : ''}`)
    } catch (e) {
      console.error(e)
      setReport('El archivo de copia está dañado.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
      void load()
    }
  }

  const removeDamaged = async (d: DamagedProject) => {
    if (!(await confirmDialog('Eliminar proyecto dañado', `"${d.title}" no se puede abrir y se borrará. No se puede deshacer.`, { confirmLabel: 'Eliminar', danger: true }))) return
    await deleteDamagedProject(d.key)
    void load()
  }

  const fromSnapshot = async (sn: Snapshot) => {
    try {
      const p = await restoreSnapshot(sn.key)
      toast(`Se creó "${p.title}"`, 'success')
      void load()
    } catch (e) {
      toast(e instanceof ProjectFileError ? e.message : 'No se pudo restaurar la instantánea.', 'error')
    }
  }

  const titleOf = (id: string) => healthy.find((h) => h.id === id)?.title ?? snapshots.find((s) => s.projectId === id)?.project.title ?? id
  const section = 'rounded-xl bg-ink-900 p-4 ring-1 ring-ink-700'
  return (
    <Modal open={open} onClose={onClose} title="Centro de recuperación" width="max-w-2xl">
      <div className="space-y-3 p-4 text-sm" data-testid="centro-recuperacion">
        <section className={section} aria-label="Almacenamiento">
          <h3 className="flex items-center gap-2 font-semibold text-fg">
            <HardDrive size={16} /> Almacenamiento
          </h3>
          {usage ? <StorageMeter usage={usage} /> : <p className="text-xs text-ink-400">Este navegador no informa cuánto espacio usa.</p>}
          <p className="mt-2 text-xs text-ink-300">
            {usage?.persisted ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <ShieldCheck size={14} /> Almacenamiento persistente activado: el navegador no borra tus proyectos para liberar espacio.
              </span>
            ) : (
              'Si el navegador se queda sin espacio, puede borrar datos de sitios por su cuenta. Pedí almacenamiento persistente para que no toque tus proyectos.'
            )}
          </p>
          {!usage?.persisted && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => void persist()}>
              <ShieldCheck size={14} /> Pedir almacenamiento persistente
            </Button>
          )}
        </section>

        <section className={section} aria-label="Proyectos">
          <h3 className="font-semibold text-fg">Proyectos</h3>
          <p className="text-xs text-ink-300" data-testid="recuperacion-resumen">
            {healthy.length} sanos · {damaged.length} dañados
          </p>
          {damaged.map((d) => (
            <div key={d.key} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-950/30 px-3 py-2 text-xs">
              <AlertTriangle size={14} className="text-amber-300" />
              <span className="min-w-0 flex-1 truncate">{d.title}</span>
              <Button size="sm" variant="ghost" onClick={async () => downloadBlob(await exportRawProjectFile(d.key), `proyecto-dañado-${d.key}.vineta`)}>
                <Download size={13} /> Copia
              </Button>
              <Button size="sm" variant="danger" onClick={() => void removeDamaged(d)}>
                <Trash2 size={13} /> Eliminar
              </Button>
            </div>
          ))}
          {failed.length > 0 && (
            <div className="mt-2 rounded-lg bg-red-950/30 p-2 text-xs" role="status">
              Guardados que fallaron:
              {failed.map((f) => (
                <button key={f.id} onClick={() => (onClose(), navigateToProject(f.id))} className="ml-2 underline">
                  {titleOf(f.id)} ({new Date(f.at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={section} aria-label="Instantáneas">
          <h3 className="flex items-center gap-2 font-semibold text-fg">
            <History size={16} /> Instantáneas
          </h3>
          <p className="text-xs text-ink-400">Mientras editás se guardan hasta 3 versiones anteriores por proyecto (cada 5 minutos como mínimo), durante 7 días. Restaurar crea una copia: el original no se toca.</p>
          {snapshots.length === 0 ? (
            <p className="mt-2 text-xs text-ink-500">Todavía no hay instantáneas.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {snapshots.map((sn) => (
                <li key={sn.key} className="flex items-center gap-2 rounded bg-ink-850 px-2 py-1 text-xs">
                  <span className="min-w-0 flex-1 truncate">
                    {sn.project.title} · {new Date(sn.at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => void fromSnapshot(sn)}>
                    Restaurar como copia
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={section} aria-label="Copia de seguridad">
          <h3 className="font-semibold text-fg">Copia de seguridad</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => void backup()}>
              <Download size={14} /> Descargar todo (.zip)
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Restaurar copia
            </Button>
            <input ref={fileRef} type="file" accept=".zip,.vineta,application/zip,application/json" hidden aria-label="Archivo de copia de seguridad" onChange={(e) => void restore(e.target.files?.[0])} />
          </div>
          {report && (
            <p className="mt-2 text-xs text-ink-200" role="status">
              {report}
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}
