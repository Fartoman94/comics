import { useState } from 'react'
import { BookOpen, FileArchive, FileImage, FileText, Package, ScrollText } from 'lucide-react'
import { useEditor, currentPage } from '../../store/editor'
import { exportPagePNG, exportPDF, exportProject, exportWebtoonStrip, exportZIP } from '../../lib/export'
import { cx, Modal } from '../ui/controls'
import { exportWebBook } from '../../lib/webbook'

type Job = 'webbook' | 'pdf-print' | 'pdf-web' | 'png' | 'zip' | 'strip' | 'project'

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useEditor((s) => s.project)!
  const toast = useEditor((s) => s.toast)
  const [running, setRunning] = useState<Job | null>(null)
  const [progress, setProgress] = useState<[number, number]>([0, 0])

  const run = async (job: Job) => {
    if (running) return
    setRunning(job)
    setProgress([0, project.pages.length])
    const onP = (d: number, t: number) => setProgress([d, t])
    const p = useEditor.getState().project!
    try {
      if (job === 'webbook') await exportWebBook(p, onP)
      if (job === 'pdf-print') await exportPDF(p, onP, 'print')
      if (job === 'pdf-web') await exportPDF(p, onP, 'web')
      if (job === 'png') await exportPagePNG(p, currentPage()!, 2)
      if (job === 'zip') await exportZIP(p, onP)
      if (job === 'strip') await exportWebtoonStrip(p, onP)
      if (job === 'project') await exportProject(p)
      toast('Exportación lista', 'success')
      onClose()
    } catch (e) {
      console.error(e)
      toast(e instanceof Error ? e.message : 'Falló la exportación', 'error')
    } finally {
      setRunning(null)
    }
  }

  const options: { id: Job; icon: React.ReactNode; title: string; desc: string; hidden?: boolean }[] = [
    { id: 'webbook', icon: <BookOpen size={20} />, title: 'Libro web (.html)', desc: 'Un solo archivo con el visor de páginas que se dan vuelta. Funciona en el celular; subilo a cualquier web o compartilo.' },
    { id: 'pdf-print', icon: <FileText size={20} />, title: 'PDF para imprimir', desc: `Todas las páginas a doble resolución (${project.format.width * 2}×${project.format.height * 2}).` },
    { id: 'pdf-web', icon: <FileText size={20} />, title: 'PDF liviano', desc: 'Ideal para compartir por mensaje o subir a la web.' },
    { id: 'png', icon: <FileImage size={20} />, title: 'PNG de esta página', desc: 'La página actual en alta calidad, sin guías.' },
    { id: 'zip', icon: <FileArchive size={20} />, title: 'ZIP con todas las páginas', desc: 'Un PNG por página, numerados: listo para plataformas de manga/cómic.' },
    { id: 'strip', icon: <ScrollText size={20} />, title: 'Tira vertical (webtoon)', desc: 'Todas las páginas unidas en una sola imagen larga.', hidden: project.kind !== 'webtoon' && project.readingDirection !== 'vertical' },
    { id: 'project', icon: <Package size={20} />, title: 'Proyecto editable (.vineta)', desc: 'Copia de seguridad con imágenes incluidas. Se abre desde "Importar".' },
  ]

  return (
    <Modal open={open} onClose={() => !running && onClose()} title="Exportar" width="max-w-lg">
      <div className="space-y-2 p-4">
        {options
          .filter((o) => !o.hidden)
          .map((o) => (
            <button
              key={o.id}
              disabled={!!running}
              onClick={() => void run(o.id)}
              className={cx('flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition-colors', running === o.id ? 'border-accent bg-accent-soft' : 'border-ink-700 hover:border-ink-500 hover:bg-ink-800', running && running !== o.id && 'opacity-40')}
            >
              <span className="text-accent">{o.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-white">{o.title}</span>
                <span className="block text-xs text-ink-400">{o.desc}</span>
              </span>
              {running === o.id && progress[1] > 0 && o.id !== 'png' && o.id !== 'project' && (
                <span className="text-xs text-ink-200 tabular-nums">
                  {progress[0]}/{progress[1]}
                </span>
              )}
            </button>
          ))}
      </div>
    </Modal>
  )
}
