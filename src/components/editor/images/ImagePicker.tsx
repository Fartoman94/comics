import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { AlertCircle, ImagePlus, Loader2, Upload, X } from 'lucide-react'
import type { Asset } from '../../../types'
import { findEl, useEditor } from '../../../store/editor'
import { fillPanel, importFiles, placeAsset, type ImportProgress } from '../../../lib/placement'
import { ACCEPT_ATTR, MAX_IMAGE_BYTES } from '../../../lib/imageValidation'
import { BACKGROUNDS, backgroundFile, backgroundPreview } from '../../../lib/backgrounds'
import { listLibrary, updateLibraryItem, type LibraryItem } from '../../../lib/storage'
import { ensureAssets } from '../../../lib/library'
import { getAssetUrl, useAssetImage } from '../../../lib/assetCache'
import { Button, cx, Modal, Segmented } from '../../ui/controls'

/** A qué va la imagen elegida: llenar una viñeta, reemplazar una imagen libre o insertarla. */
export type PickTarget = { kind: 'panel'; id: string } | { kind: 'image'; id: string } | { kind: 'insert' }

const usePicker = create<{ target: PickTarget | null }>(() => ({ target: null }))
export const openImagePicker = (target: PickTarget) => usePicker.setState({ target })

/** Aplica la imagen elegida al destino. Reemplazar conserva las propiedades del elemento. */
export function applyPickedAsset(asset: Asset, target: PickTarget) {
  const s = useEditor.getState()
  if (target.kind === 'panel') return fillPanel(target.id, asset)
  if (target.kind === 'image') {
    const el = findEl(target.id)
    if (el?.type !== 'image') return
    // Mismo lugar, ancho, giro, espejos, filtros y opacidad; el alto sigue la proporción nueva.
    s.updateElement(target.id, { assetId: asset.id, crop: null, height: Math.round((el.width * asset.height) / asset.width) })
    s.select([target.id])
    return
  }
  placeAsset(asset)
}

const TITLES: Record<PickTarget['kind'], string> = { panel: 'Imagen para la viñeta', image: 'Reemplazar imagen', insert: 'Agregar imagen' }

export function ImagePickerHost() {
  const target = usePicker((s) => s.target)
  const close = () => usePicker.setState({ target: null })
  return (
    <Modal open={!!target} onClose={close} title={target ? TITLES[target.kind] : ''} width="max-w-2xl">
      {target && <PickerBody target={target} onDone={close} />}
    </Modal>
  )
}

function PickerBody({ target, onDone }: { target: PickTarget; onDone: () => void }) {
  const hasAssets = useEditor((s) => (s.project?.assets.length ?? 0) > 0)
  const [tab, setTab] = useState<'upload' | 'gallery'>(hasAssets ? 'gallery' : 'upload')
  const choose = (a: Asset) => {
    applyPickedAsset(a, target)
    onDone()
  }
  return (
    <div className="space-y-4 p-5">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upload', label: 'Subir imagen' },
          { value: 'gallery', label: 'Elegir de galería' },
        ]}
      />
      {tab === 'upload' ? <UploadTab multiple={target.kind === 'insert'} onChoose={choose} /> : <GalleryTab onChoose={choose} />}
    </div>
  )
}

function UploadTab({ multiple, onChoose }: { multiple: boolean; onChoose: (a: Asset) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [over, setOver] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState<Asset[]>([])
  useEffect(() => () => abortRef.current?.abort(), [])

  const run = async (files: File[]) => {
    if (!files.length) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setErrors([])
    setDone([])
    const assets = await importFiles(multiple ? files : files.slice(0, 1), {
      signal: ctrl.signal,
      onProgress: setProgress,
      onError: (r) => setErrors((e) => [...e, r]),
      quiet: true,
    })
    abortRef.current = null
    setProgress(null)
    if (ctrl.signal.aborted) return
    // Una sola imagen: se aplica directamente. Varias: se muestran para elegir.
    if (assets.length === 1 && (!multiple || files.length === 1)) return onChoose(assets[0])
    setDone(assets)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={!!progress}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void run([...e.dataTransfer.files])
        }}
        className={cx('flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors disabled:opacity-60', over ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')}
      >
        <Upload size={24} className="text-accent-bright" />
        <span className="text-sm font-medium text-fg">{multiple ? 'Elegí o soltá imágenes' : 'Elegí o soltá una imagen'}</span>
        <span className="text-[11px] text-ink-400">PNG, JPG, WebP o GIF · hasta {Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB · las de más de 4096 px por lado se reducen</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={multiple}
        hidden
        data-testid="selector-archivo"
        onChange={(e) => {
          const files = e.target.files ? [...e.target.files] : []
          e.target.value = ''
          void run(files)
        }}
      />
      {progress && (
        <div className="rounded-lg bg-ink-900 p-3 ring-1 ring-ink-700" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-xs text-ink-200">
            <Loader2 size={14} className="animate-spin text-accent-bright" />
            <span className="min-w-0 flex-1 truncate">
              Subiendo {progress.current ? `"${progress.current}"` : ''} ({Math.min(progress.done + 1, progress.total)} de {progress.total})
            </span>
            <Button size="sm" variant="ghost" onClick={() => abortRef.current?.abort()}>
              <X size={13} /> Cancelar
            </Button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(8, (progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-950/40 p-3 text-xs text-red-200 ring-1 ring-red-500/30" role="alert">
          {errors.map((r, i) => (
            <li key={i} className="flex gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {r}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-ink-300">Listo. Elegí cuál usar (las demás quedan en Biblioteca):</p>
          <AssetGrid assets={done} onChoose={onChoose} />
        </div>
      )}
    </div>
  )
}

function GalleryTab({ onChoose }: { onChoose: (a: Asset) => void }) {
  const assets = useEditor((s) => s.project!.assets)
  const format = useEditor((s) => s.project!.format)
  const ratio = format.width / format.height
  const [recent, setRecent] = useState<(LibraryItem & { type: 'image' })[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void listLibrary()
      .then((items) => alive && setRecent(items.filter((i): i is LibraryItem & { type: 'image' } => i.type === 'image').slice(0, 12)))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  const previews = useMemo(() => BACKGROUNDS.map((b) => ({ b, src: backgroundPreview(b, ratio) })), [ratio])
  const projectIds = new Set(assets.map((a) => a.id))
  const recentOutside = recent.filter((r) => !projectIds.has(r.asset.id))

  const pickBackground = async (id: string) => {
    const bg = BACKGROUNDS.find((b) => b.id === id)
    if (!bg) return
    setBusy(id)
    try {
      const [asset] = await importFiles([await backgroundFile(bg, ratio)], { quiet: true })
      if (asset) onChoose(asset)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <GallerySection title="Imágenes del proyecto" empty="Todavía no hay imágenes en este proyecto.">
        {assets.length > 0 && <AssetGrid assets={[...assets].reverse()} onChoose={onChoose} />}
      </GallerySection>
      <GallerySection title="Recientes (de otros proyectos)" empty="Las imágenes que uses en otros proyectos aparecen acá.">
        {recentOutside.length > 0 && (
          <AssetGrid
            assets={recentOutside.map((r) => r.asset)}
            onChoose={(a) => {
              const item = recentOutside.find((r) => r.asset.id === a.id)
              ensureAssets([a])
              if (item) void updateLibraryItem(item.id, { lastUsedAt: Date.now() })
              onChoose(a)
            }}
          />
        )}
      </GallerySection>
      <GallerySection title="Fondos incluidos">
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {previews.map(({ b, src }) => (
            <li key={b.id}>
              <button onClick={() => void pickBackground(b.id)} disabled={!!busy} aria-label={`Fondo ${b.label}`} title={b.label} className="group flex w-full flex-col items-center gap-1 text-[10px] text-ink-300 disabled:opacity-50">
                <span className="relative block w-full overflow-hidden rounded-md ring-1 ring-ink-700 group-hover:ring-accent" style={{ aspectRatio: `${ratio}` }}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {busy === b.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 size={16} className="animate-spin text-fg" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center">{b.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </GallerySection>
    </div>
  )
}

function GallerySection({ title, empty, children }: { title: string; empty?: string; children?: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{title}</h3>
      {children || (empty && <p className="flex items-center gap-2 text-xs text-ink-500"><ImagePlus size={14} /> {empty}</p>)}
    </section>
  )
}

function AssetGrid({ assets, onChoose }: { assets: Asset[]; onChoose: (a: Asset) => void }) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {assets.map((a) => (
        <li key={a.id}>
          <AssetChoice asset={a} onChoose={onChoose} />
        </li>
      ))}
    </ul>
  )
}

function AssetChoice({ asset, onChoose }: { asset: Asset; onChoose: (a: Asset) => void }) {
  useAssetImage(asset.id)
  const url = getAssetUrl(asset.id)
  return (
    <button
      onClick={() => onChoose(asset)}
      aria-label={`Usar ${asset.name}`}
      title={`${asset.name} · ${asset.width}×${asset.height}`}
      className="block aspect-square w-full overflow-hidden rounded-md bg-ink-900 ring-1 ring-ink-700 transition-shadow hover:ring-2 hover:ring-accent"
    >
      {url && <img src={url} alt="" className="h-full w-full object-contain" draggable={false} />}
    </button>
  )
}
