import { Check, Maximize, Minimize, ZoomIn } from 'lucide-react'
import { useEditor, useCurrentPage } from '../../store/editor'
import { coverFit, containFit } from '../../lib/placement'
import { Button } from '../ui/controls'

/** Barra flotante del modo "encuadrar imagen dentro de la viñeta". */
export function CropBar() {
  const id = useEditor((s) => s.croppingPanelId)
  const page = useCurrentPage()
  const assets = useEditor((s) => s.project?.assets)
  const panel = page?.elements.find((e) => e.id === id)
  if (panel?.type === 'image') return <ImageCropBar id={panel.id} hasCrop={!!panel.crop} />
  if (!panel || panel.type !== 'panel' || !panel.image) return null
  const asset = assets?.find((a) => a.id === panel.image!.assetId)
  const s = useEditor.getState()
  const set = (patch: { x: number; y: number; scale: number }, coalesce?: string) =>
    s.updateElement(panel.id, (el) => void (el.type === 'panel' && el.image && Object.assign(el.image, patch)), coalesce)
  const zoomTo = (scale: number) => {
    const img = panel.image!
    const k = scale / img.scale
    const cx = panel.width / 2
    const cy = panel.height / 2
    set({ scale, x: cx - (cx - img.x) * k, y: cy - (cy - img.y) * k }, 'crop-zoom')
  }
  return (
    <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-ink-600 bg-ink-800/95 px-3 py-2 shadow-2xl backdrop-blur">
      <span className="text-xs font-medium text-fg">Encuadrar imagen</span>
      <span className="hidden text-[11px] text-ink-400 md:inline">Arrastrá para mover · rueda para zoom</span>
      <ZoomIn size={14} className="text-ink-400" />
      <input type="range" min={0.02} max={4} step={0.01} value={panel.image.scale} onChange={(e) => zoomTo(Number(e.target.value))} className="w-28" aria-label="Zoom de la imagen" />
      {asset && (
        <>
          <Button size="sm" variant="ghost" onClick={() => set(coverFit(panel, asset, panel.image!.rotation))} title="Rellenar la viñeta">
            <Maximize size={13} /> Rellenar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => set(containFit(panel, asset, panel.image!.rotation))} title="Mostrar la imagen completa">
            <Minimize size={13} /> Encajar
          </Button>
        </>
      )}
      <Button size="sm" variant="primary" onClick={() => s.setCropping(null)}>
        <Check size={13} /> Listo
      </Button>
    </div>
  )
}

function ImageCropBar({ id, hasCrop }: { id: string; hasCrop: boolean }) {
  const s = useEditor.getState()
  const reset = () => {
    const el = s.project?.pages.flatMap((p) => p.elements).find((e) => e.id === id)
    const asset = el?.type === 'image' ? s.project?.assets.find((a) => a.id === el.assetId) : undefined
    if (!el || el.type !== 'image' || !asset || !el.crop) return
    // Volver a la imagen completa manteniendo la escala actual.
    const k = el.width / el.crop.width
    s.updateElement(id, { crop: null, x: el.x - el.crop.x * k, y: el.y - el.crop.y * k, width: asset.width * k, height: asset.height * k })
  }
  return (
    <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-ink-600 bg-ink-800/95 px-3 py-2 shadow-2xl backdrop-blur">
      <span className="text-xs font-medium text-fg">Recortar imagen</span>
      <span className="hidden text-[11px] text-ink-400 md:inline">Mové o estirá el marco naranja</span>
      <Button size="sm" variant="ghost" disabled={!hasCrop} onClick={reset}>
        Restablecer
      </Button>
      <Button size="sm" variant="primary" onClick={() => s.setCropping(null)}>
        <Check size={13} /> Listo
      </Button>
    </div>
  )
}
