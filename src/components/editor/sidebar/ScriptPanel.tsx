import { useRef } from 'react'
import { ArrowDown, ArrowUp, Download, FileUp, MapPin, Trash2 } from 'lucide-react'
import type { ScriptKind } from '../../../types'
import { scriptStatus, useCurrentPage, useEditor, type ScriptStatus } from '../../../store/editor'
import { exportScriptJSON, exportScriptText, importScriptJSON, KIND_LABELS, panelOrder } from '../../../lib/scriptFile'
import { downloadBlob, safeFilename } from '../../../lib/storage'
import { cx, IconButton, Menu, MenuItem } from '../../ui/controls'

const STATUS: Record<ScriptStatus, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-ink-700 text-ink-200' },
  colocado: { label: 'Colocado', cls: 'bg-emerald-900/60 text-emerald-200' },
  modificado: { label: 'Modificado', cls: 'bg-amber-900/60 text-amber-200' },
}
const ADD: ScriptKind[] = ['dialogue', 'thought', 'caption', 'sfx', 'description']

/**
 * Guion liviano de la página: bloques por viñeta (descripción, diálogo, pensamiento, cartucho y SFX).
 * "Colocar" crea el globo o texto con lo escrito; si después se editan por separado, se avisa y se
 * puede sincronizar en cualquiera de los dos sentidos.
 */
export function ScriptPanel() {
  const project = useEditor((s) => s.project)!
  const page = useCurrentPage()
  const fileRef = useRef<HTMLInputElement>(null)
  const s = useEditor.getState()
  if (!page) return null
  const rows = project.script?.pages[page.id]?.panels ?? []
  const order = panelOrder(project, page.id)
  // Una sección para la página y una por viñeta, en orden de lectura (asociadas por id).
  const sections: { panelId: string | null; label: string }[] = [{ panelId: null, label: 'Página (sin viñeta)' }, ...order.map((id, i) => ({ panelId: id, label: `Viñeta ${i + 1}` }))]

  const pendingCount = rows.flatMap((r) => r.blocks).filter((b) => b.kind !== 'description' && b.text.trim() && scriptStatus(page, b) === 'pendiente').length

  const importFile = async (f?: File) => {
    if (!f) return
    try {
      const script = importScriptJSON(useEditor.getState().project!, await f.text())
      s.mutate((d) => void (d.script = script))
      s.toast('Guion importado', 'success')
    } catch (e) {
      s.toast(e instanceof Error ? e.message : 'No se pudo importar el guion.', 'error')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="no-autoclose space-y-3 p-3" data-testid="guion">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] leading-snug text-ink-400">Guion de «{page.name}». Escribí y tocá «Colocar» para ponerlo en la viñeta.</p>
        {pendingCount > 0 && (
          <button
            onClick={() => {
              const n = s.placePageScript(page.id)
              s.toast(n === 1 ? '1 bloque colocado' : `${n} bloques colocados`, 'success')
            }}
            className="flex shrink-0 items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white pointer-coarse:min-h-10"
            title="Pone todos los diálogos, narraciones y onomatopeyas pendientes en sus viñetas, con globos ajustados al texto"
          >
            <MapPin size={12} /> Colocar todo ({pendingCount})
          </button>
        )}
        <Menu
          align="right"
          trigger={(_, toggle) => (
            <IconButton label="Exportar o importar guion" onClick={toggle} className="pointer-coarse:size-11">
              <Download size={15} />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuItem label="Exportar guion (.json)" icon={<Download size={14} />} onClick={() => (close(), downloadBlob(new Blob([exportScriptJSON(project)], { type: 'application/json' }), `${safeFilename(project.title)}-guion.json`))} />
              <MenuItem label="Exportar como texto (.txt)" icon={<Download size={14} />} onClick={() => (close(), downloadBlob(new Blob([exportScriptText(project)], { type: 'text/plain' }), `${safeFilename(project.title)}-guion.txt`))} />
              <MenuItem label="Importar guion (.json)" icon={<FileUp size={14} />} onClick={() => (close(), fileRef.current?.click())} />
            </>
          )}
        </Menu>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden aria-label="Archivo de guion" onChange={(e) => void importFile(e.target.files?.[0])} />
      </div>

      {sections.map((sec) => {
        const blocks = rows.find((r) => r.panelId === sec.panelId)?.blocks ?? []
        return (
          <section key={sec.panelId ?? 'pagina'} className="rounded-lg bg-ink-900 ring-1 ring-ink-700" aria-label={sec.label}>
            <header className="flex items-center justify-between px-2.5 py-1.5">
              <button className="text-xs font-semibold text-fg hover:text-accent-bright" onClick={() => sec.panelId && s.select([sec.panelId])} disabled={!sec.panelId}>
                {sec.label}
              </button>
              <Menu
                align="right"
                trigger={(_, toggle) => (
                  <button onClick={toggle} className="rounded-md px-2 py-1 text-[11px] text-accent-bright hover:bg-accent-soft pointer-coarse:min-h-10">
                    + Agregar
                  </button>
                )}
              >
                {(close) => (
                  <>
                    {ADD.map((k) => (
                      <MenuItem key={k} label={KIND_LABELS[k]} onClick={() => (close(), s.addScriptBlock(page.id, sec.panelId, k))} />
                    ))}
                  </>
                )}
              </Menu>
            </header>
            {blocks.length > 0 && (
              <ul className="space-y-2 border-t border-ink-700 p-2">
                {blocks.map((b, i) => {
                  const st = scriptStatus(page, b)
                  return (
                    <li key={b.id} className="rounded-md bg-ink-850 p-2" data-block={b.id}>
                      <div className="flex items-center gap-1.5">
                        <select value={b.kind} onChange={(e) => s.updateScriptBlock(page.id, b.id, { kind: e.target.value as ScriptKind })} aria-label="Tipo" className="h-7 rounded border border-ink-600 bg-ink-900 px-1 text-[11px] text-fg">
                          {Object.entries(KIND_LABELS).map(([k, l]) => (
                            <option key={k} value={k}>
                              {l}
                            </option>
                          ))}
                        </select>
                        {(b.kind === 'dialogue' || b.kind === 'thought') && <input value={b.character ?? ''} onChange={(e) => s.updateScriptBlock(page.id, b.id, { character: e.target.value })} placeholder="Personaje" aria-label="Personaje" className="h-7 min-w-0 flex-1 rounded border border-ink-600 bg-ink-900 px-1.5 text-[11px] text-fg" />}
                        {b.kind !== 'description' && <span className={cx('ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px]', STATUS[st].cls)}>{STATUS[st].label}</span>}
                      </div>
                      <textarea value={b.text} onChange={(e) => s.updateScriptBlock(page.id, b.id, { text: e.target.value })} rows={2} aria-label={`Texto: ${KIND_LABELS[b.kind]}`} className="mt-1.5 w-full resize-y rounded border border-ink-600 bg-ink-900 p-1.5 text-xs text-fg outline-none focus:border-accent" />
                      {st === 'modificado' && (
                        <div className="mt-1 rounded bg-amber-950/40 p-1.5 text-[11px] text-amber-100" role="status">
                          El texto de la página cambió.
                          <div className="mt-1 flex flex-wrap gap-1">
                            <button onClick={() => s.syncScriptBlock(page.id, b.id, 'page')} className="rounded bg-ink-700 px-2 py-1 hover:bg-ink-600 pointer-coarse:min-h-10">
                              Usar el de la página
                            </button>
                            <button onClick={() => s.syncScriptBlock(page.id, b.id, 'script')} className="rounded bg-ink-700 px-2 py-1 hover:bg-ink-600 pointer-coarse:min-h-10">
                              Aplicar el guion
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-0.5">
                        {b.kind !== 'description' && st === 'pendiente' && (
                          <button onClick={() => s.placeScriptBlock(page.id, b.id)} disabled={!b.text.trim()} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white disabled:opacity-40 pointer-coarse:min-h-10">
                            <MapPin size={12} /> Colocar
                          </button>
                        )}
                        <span className="flex-1" />
                        <IconButton label="Subir" className="size-7 pointer-coarse:size-10" disabled={i === 0} onClick={() => s.moveScriptBlock(page.id, b.id, -1)}>
                          <ArrowUp size={13} />
                        </IconButton>
                        <IconButton label="Bajar" className="size-7 pointer-coarse:size-10" disabled={i === blocks.length - 1} onClick={() => s.moveScriptBlock(page.id, b.id, 1)}>
                          <ArrowDown size={13} />
                        </IconButton>
                        <IconButton label="Quitar del guion" className="size-7 text-red-300 pointer-coarse:size-10" onClick={() => s.removeScriptBlock(page.id, b.id)}>
                          <Trash2 size={13} />
                        </IconButton>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
