import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2, ScrollText, X } from 'lucide-react'
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js'
import type { Project } from '../../types'
import { useEditor } from '../../store/editor'
import { renderPage } from '../../lib/render'
import { cx } from '../ui/controls'
import { MadeByMateLabs } from '../ui/Brand'

type Mode = 'book' | 'scroll'

/**
 * Visor de lectura con efecto de libro real: las páginas se doblan al arrastrarlas
 * (mouse o dedo), con tapas duras, sombra en el lomo y sentido de lectura manga.
 */
export function Reader({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project)!
  const [images, setImages] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>(project.readingDirection === 'vertical' ? 'scroll' : 'book')
  const [chrome, setChrome] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef(0)
  const total = project.pages.length
  const ready = images.length === total

  useEffect(() => {
    let alive = true
    // Resolución pensada para pantallas retina sin reventar la memoria del teléfono.
    const target = Math.min(2200, Math.max(window.innerHeight, window.innerWidth) * Math.min(2, window.devicePixelRatio || 1))
    const ratio = Math.max(0.4, Math.min(2, target / project.format.height))
    ;(async () => {
      const out: string[] = []
      for (const p of project.pages) {
        out.push(await renderPage(project, p, { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.9 }))
        if (!alive) return
        setImages([...out])
      }
    })()
    return () => {
      alive = false
    }
  }, [project])

  // La interfaz se esconde sola para leer sin distracciones; un toque la vuelve a mostrar.
  const poke = useCallback(() => {
    setChrome(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setChrome(false), 3200)
  }, [])
  useEffect(() => {
    poke()
    return () => clearTimeout(hideTimer.current)
  }, [poke])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.fullscreenElement && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div ref={rootRef} className="reader-room fixed inset-0 z-50 flex flex-col overflow-hidden text-white" onPointerMove={poke} onPointerDown={poke}>
      <div className={cx('absolute inset-x-0 top-0 z-20 flex h-14 items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-3 transition-opacity duration-300 sm:px-5', chrome ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <BookOpen size={18} className="shrink-0 text-accent" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{project.title}</div>
          {project.author && <div className="truncate text-[11px] text-white/60">{project.author}</div>}
        </div>
        {project.readingDirection === 'rtl' && mode === 'book' && <span className="hidden shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide uppercase sm:inline">Manga · der → izq</span>}
        <div className="flex-1" />
        <div className="flex rounded-lg bg-white/10 p-0.5">
          <button onClick={() => setMode('book')} title="Libro" className={cx('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs', mode === 'book' ? 'bg-white/20' : 'text-white/60')}>
            <BookOpen size={14} /> <span className="hidden sm:inline">Libro</span>
          </button>
          <button onClick={() => setMode('scroll')} title="Scroll vertical" className={cx('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs', mode === 'scroll' ? 'bg-white/20' : 'text-white/60')}>
            <ScrollText size={14} /> <span className="hidden sm:inline">Scroll</span>
          </button>
        </div>
        <button onClick={toggleFs} title="Pantalla completa" className="hidden size-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
          {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
        <button onClick={onClose} title="Cerrar (Esc)" className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
          <X size={19} />
        </button>
      </div>

      {!ready ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="font-comic text-3xl tracking-wide">Imprimiendo páginas…</div>
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accent transition-all" style={{ width: `${(images.length / total) * 100}%` }} />
          </div>
          <div className="text-xs text-white/50 tabular-nums">
            {images.length} / {total}
          </div>
        </div>
      ) : mode === 'book' ? (
        <FlipBook project={project} images={images} chrome={chrome} />
      ) : (
        <div className="scroll-thin flex-1 overflow-y-auto pt-14">
          <div className="mx-auto flex max-w-[820px] flex-col gap-0 shadow-2xl">
            {images.map((src, i) => (
              <img key={i} src={src} alt={project.pages[i]?.name} className="block w-full" loading={i > 2 ? 'lazy' : 'eager'} />
            ))}
          </div>
          <EndCard project={project} />
        </div>
      )}
    </div>
  )
}

function EndCard({ project }: { project: Project }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="font-comic text-4xl tracking-wide text-white">FIN</div>
      <div className="text-sm text-white/60">
        {project.title}
        {project.author && ` · ${project.author}`}
      </div>
      <MadeByMateLabs />
    </div>
  )
}

function FlipBook({ project, images, chrome }: { project: Project; images: string[]; chrome: boolean }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<PageFlip | null>(null)
  const rtl = project.readingDirection === 'rtl'
  const total = images.length
  // En manga el libro se arma al revés y arranca por la última hoja (que es la portada).
  const order = rtl ? [...images.keys()].reverse() : [...images.keys()]
  const [flipIndex, setFlipIndex] = useState(rtl ? total - 1 : 0)
  const [box, setBox] = useState<{ w: number; h: number; portrait: boolean } | null>(null)
  const ratio = project.format.width / project.format.height

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      const W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const portrait = W < 700 || W / H < ratio * 1.25
      const pageW = portrait ? Math.min(W, H * ratio) : Math.min(W / 2, H * ratio)
      setBox({ w: Math.floor(pageW), h: Math.floor(pageW / ratio), portrait })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ratio])

  useEffect(() => {
    const host = bookRef.current
    if (!host || !box) return
    const start = flipRef.current?.getCurrentPageIndex() ?? flipIndex
    host.innerHTML = ''
    const book = document.createElement('div')
    host.appendChild(book)
    const pages = order.map((srcIndex, i) => {
      const page = document.createElement('div')
      const isCover = i === 0 || i === order.length - 1
      page.className = 'flip-page'
      page.dataset.density = isCover ? 'hard' : 'soft'
      const img = document.createElement('img')
      img.src = images[srcIndex]
      img.alt = project.pages[srcIndex]?.name ?? ''
      img.draggable = false
      page.appendChild(img)
      // Sombra del pliegue interior, del lado del lomo.
      const gutter = document.createElement('div')
      gutter.className = 'flip-gutter'
      page.appendChild(gutter)
      return page
    })
    pages.forEach((p) => book.appendChild(p))
    const pf = new PageFlip(book, {
      width: box.w,
      height: box.h,
      size: 'fixed',
      showCover: true,
      usePortrait: box.portrait,
      mobileScrollSupport: false,
      maxShadowOpacity: 0.55,
      flippingTime: 750,
      drawShadow: true,
      showPageCorners: true,
      startPage: Math.min(start, pages.length - 1),
      autoSize: false,
      swipeDistance: 25,
    })
    pf.loadFromHTML(pages)
    pf.on('flip', (e) => setFlipIndex(e.data as number))
    flipRef.current = pf
    return () => {
      flipRef.current = null
      try {
        pf.destroy()
      } catch {
        host.innerHTML = ''
      }
    }
  }, [box, images])

  // Número de página "humano" según el sentido de lectura.
  const human = rtl ? total - flipIndex : flipIndex + 1
  const toHuman = (i: number) => (rtl ? total - i : i + 1)
  // En doble página se ven dos hojas a la vez (salvo tapas).
  const spread = !box?.portrait && flipIndex > 0 && flipIndex < total - 1
  const label = spread ? [toHuman(flipIndex), toHuman(flipIndex + 1)].sort((a, b) => a - b).join('–') : String(human)
  const next = () => (rtl ? flipRef.current?.flipPrev() : flipRef.current?.flipNext())
  const prev = () => (rtl ? flipRef.current?.flipNext() : flipRef.current?.flipPrev())
  const goHuman = (n: number) => flipRef.current?.turnToPage(rtl ? total - n : n - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') (rtl ? prev : next)()
      if (e.key === 'ArrowLeft') (rtl ? next : prev)()
      if (e.key === ' ') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div ref={areaRef} className="flex min-h-0 flex-1 items-center justify-center px-3 pt-14 pb-20">
        <div ref={bookRef} className="flip-book-host" style={box ? { width: box.portrait ? box.w : box.w * 2, height: box.h } : undefined} />
      </div>
      <div className={cx('absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-4 pt-8 pb-4 transition-opacity duration-300 sm:px-8', chrome ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={rtl ? next : prev} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página siguiente' : 'Página anterior'}>
            <ChevronLeft size={20} />
          </button>
          <input
            type="range"
            min={1}
            max={total}
            value={human}
            onChange={(e) => goHuman(Number(e.target.value))}
            className="flex-1"
            style={{ direction: rtl ? 'rtl' : 'ltr' }}
            aria-label="Ir a página"
          />
          <span className="w-16 text-center text-xs text-white/80 tabular-nums">
            {label} / {total}
          </span>
          <button onClick={rtl ? prev : next} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página anterior' : 'Página siguiente'}>
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/40">Arrastrá la esquina de la página o deslizá con el dedo para pasarla</p>
      </div>
    </>
  )
}
