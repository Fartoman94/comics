import { useState } from 'react'
import { useEditor } from '../../../store/editor'
import { TEMPLATES, type PanelTemplate } from '../../../lib/templates'
import { Segmented, Slider } from '../../ui/controls'
import { confirmDialog } from '../../ui/Confirm'

export function LayoutsPanel() {
  const format = useEditor((s) => s.project!.format)
  const [margin, setMargin] = useState(format.margin)
  const [gutter, setGutter] = useState(Math.round(format.width * 0.018))
  const [mode, setMode] = useState<'replace' | 'add'>('replace')
  const groups = [...new Set(TEMPLATES.map((t) => t.group))]

  const apply = async (tpl: PanelTemplate) => {
    const page = useEditor.getState().project?.pages.find((p) => p.id === useEditor.getState().pageId)
    const panels = page?.elements.filter((e) => e.type === 'panel').length ?? 0
    if (mode === 'replace' && panels > 0) {
      const ok = await confirmDialog('Reemplazar viñetas', `Las ${panels} viñetas actuales se reemplazan por "${tpl.name}". Las imágenes encuadradas se pasan a las nuevas viñetas en orden. Globos, textos y dibujos no se tocan.`, { confirmLabel: 'Aplicar' })
      if (!ok) return
    }
    useEditor.getState().applyTemplate(tpl.id, margin, gutter, mode)
  }

  return (
    <div className="space-y-4 p-3">
      <div className="no-autoclose space-y-3 rounded-lg bg-ink-900 p-3 ring-1 ring-ink-700">
        <Slider label="Margen de página" value={margin} min={0} max={Math.round(format.width * 0.15)} onChange={setMargin} format={(v) => `${v}px`} />
        <Slider label="Medianil (espacio entre viñetas)" value={gutter} min={0} max={Math.round(format.width * 0.08)} onChange={setGutter} format={(v) => `${v}px`} />
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'replace', label: 'Reemplazar' },
            { value: 'add', label: 'Agregar encima' },
          ]}
        />
      </div>
      {groups.map((g) => (
        <div key={g}>
          <h4 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{g}</h4>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.filter((t) => t.group === g).map((t) => (
              <button key={t.id} onClick={() => void apply(t)} title={t.name} className="group flex flex-col items-center gap-1">
                <TemplatePreview tpl={t} ratio={format.width / format.height} />
                <span className="w-full truncate text-center text-[10px] text-ink-400 group-hover:text-ink-100">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-ink-500">Tip: con la herramienta Viñeta (P) podés dibujar viñetas a mano. Los cortes diagonales se ajustan con el tamaño de la viñeta.</p>
    </div>
  )
}

function TemplatePreview({ tpl, ratio }: { tpl: PanelTemplate; ratio: number }) {
  const w = 60
  const h = Math.min(90, w / ratio)
  const vw = ratio >= 1 ? 100 : 100 * ratio
  const vh = ratio >= 1 ? 100 / ratio : 100
  const pad = 5
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={ratio >= 1 ? w : h * ratio} height={ratio >= 1 ? w / ratio : h} className="rounded-sm bg-white ring-1 ring-ink-600 transition-shadow group-hover:ring-2 group-hover:ring-accent">
      {tpl.polys.map((poly, i) => (
        <polygon
          key={i}
          points={poly.map((p) => `${pad + p.x * (vw - pad * 2)},${pad + p.y * (vh - pad * 2)}`).join(' ')}
          fill="#e7e5e4"
          stroke="#111"
          strokeWidth={1.6}
          transform={`translate(0 0)`}
          style={{ transformOrigin: 'center', transformBox: 'fill-box', scale: '0.93' }}
        />
      ))}
    </svg>
  )
}
