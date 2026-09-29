import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { getAssetUrl, forgetAsset, useAssetImage } from '../../../lib/assetCache'
import { importFiles, placeAsset } from '../../../lib/placement'
import { deleteAssetBlob } from '../../../lib/storage'
import type { Asset } from '../../../types'
import { cx, IconButton } from '../../ui/controls'
import { confirmDialog } from '../../ui/Confirm'

export function AssetsPanel() {
  const assets = useEditor((s) => s.project!.assets)
  const pages = useEditor((s) => s.project!.pages)
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const upload = async (files: FileList | File[]) => {
    setBusy(true)
    try {
      await importFiles(files)
    } finally {
      setBusy(false)
    }
  }

  const usedIn = (id: string) =>
    pages.reduce((n, p) => n + p.elements.filter((e) => (e.type === 'image' && e.assetId === id) || (e.type === 'panel' && e.image?.assetId === id)).length, 0)

  const remove = async (a: Asset) => {
    const n = usedIn(a.id)
    if (n > 0) {
      useEditor.getState().toast(`"${a.name}" se usa en ${n} lugar(es). Quitala de las páginas primero.`, 'error')
      return
    }
    if (!(await confirmDialog('Eliminar imagen', `"${a.name}" se eliminará del proyecto.`, { confirmLabel: 'Eliminar', danger: true }))) return
    useEditor.getState().removeAsset(a.id)
    await deleteAssetBlob(a.id)
    forgetAsset(a.id)
  }

  return (
    <div className="p-3">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files)
        }}
        className={cx('no-autoclose flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-3 py-5 text-center transition-colors', over ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')}
      >
        <Upload size={20} className="text-accent" />
        <span className="text-xs font-medium text-white">{busy ? 'Subiendo…' : 'Subir imágenes o fotos'}</span>
        <span className="text-[11px] text-ink-400">PNG, JPG, WebP, GIF · o arrastralas acá / al lienzo · Ctrl+V pega</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && void upload(e.target.files)} />

      {assets.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-ink-500">
          <ImagePlus size={28} />
          Todavía no subiste imágenes. Fondos, personajes, fotos y bocetos quedan acá para reutilizarlos.
        </div>
      ) : (
        <>
          <p className="mt-4 mb-2 text-[11px] leading-relaxed text-ink-400">Arrastrá sobre una viñeta para rellenarla, o sobre la página para agregarla como imagen libre. Clic = insertar.</p>
          <div className="grid grid-cols-3 gap-2">
            {[...assets].reverse().map((a) => (
              <AssetTile key={a.id} asset={a} used={usedIn(a.id)} onRemove={() => void remove(a)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AssetTile({ asset, used, onRemove }: { asset: Asset; used: number; onRemove: () => void }) {
  useAssetImage(asset.id)
  const url = getAssetUrl(asset.id)
  return (
    <div className="group relative">
      <button
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-vineta-asset', asset.id)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        onClick={() => placeAsset(asset)}
        title={`${asset.name} · ${asset.width}×${asset.height}`}
        className="block aspect-square w-full overflow-hidden rounded-md bg-ink-900 ring-1 ring-ink-700 transition-shadow hover:ring-accent"
        style={{ backgroundImage: 'conic-gradient(#26262e 25%, #1c1c22 0 50%, #26262e 0 75%, #1c1c22 0)', backgroundSize: '12px 12px' }}
      >
        {url && <img src={url} alt={asset.name} className="h-full w-full object-contain" draggable={false} />}
      </button>
      {used > 0 && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] text-white">×{used}</span>}
      <IconButton label="Eliminar imagen" onClick={onRemove} className="no-autoclose absolute top-0.5 right-0.5 size-6 bg-black/70 text-red-300 opacity-0 group-hover:opacity-100">
        <Trash2 size={12} />
      </IconButton>
    </div>
  )
}
