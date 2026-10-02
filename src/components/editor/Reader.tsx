import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Hand, Maximize2, Minimize2, ScrollText, X } from 'lucide-react'
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js'
import type { Project } from '../../types'
import { useEditor } from '../../store/editor'
import { renderPage } from '../../lib/render'
import { isTap, keyStep, pageLabel, swipeStep, tapStep, toBookIndex, visiblePages, type Step } from '../../lib/readerNav'
import { useFocusTrap } from '../ui/useFocusTrap'
import { cx } from '../ui/controls'
import { MadeByMateLabs } from '../ui/Brand'

type Mode = 'book' | 'scroll'

const BLANK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="14"><rect width="10" height="14" fill="#fff"/></svg>')
const TAP_KEY = 'vineta:lector-toques'

const readTapPref = () => {
  try {
    return localStorage.getItem(TAP_KEY) !== '0'
  } catch {
    return true
  }
}

/** Renderiza las páginas con el mismo motor del editor (sin guías ni selección), de a una. */
export function usePageImages(project: Project, targetPx?: number) {
  const [images, setImages] = useState<string[]>([])
  useEffect(() => {
    let alive = true
    // Resolución pensada para pantallas retina sin reventar la memoria del teléfono.
    const target = targetPx ?? Math.min(2200, Math.max(window.innerHeight, window.innerWidth) * Math.min(2, window.devicePixelRatio || 1))
    const ratio = Math.max(0.4, Math.min(2, target / project.format.height))
    ;(async () => {
      const out: string[] = []
      for (const p of project.pages) {
        // Una página que falla no debe dejar el visor colgado: se muestra en blanco.
        out.push(await renderPage(project, p, { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.9 }).catch((e) => (console.error(e), BLANK)))
        if (!alive) return
        setImages([...out])
      }
    })()
    return () => {
      alive = false
    }
  }, [project, targetPx])
  return images
}

/** Mientras una vista de lectura está abierta el editor no recibe atajos; al cerrar el foco vuelve a quien la abrió. */
export function useReadingOverlay() {
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    useEditor.getState().setReaderOpen(true)
    return () => {
      useEditor.getState().setReaderOpen(false)
      if (opener?.isConnected) opener.focus()
    }
  }, [])
}

/**
 * Visor de lectura con efecto de libro real: las páginas se dan vuelta con flechas, botones, slider,
 * deslizando o tocando los costados, siempre con la misma dirección lógica en cómic y manga.
 */
export function Reader({ onClose, actions, startPage = 0 }: { onClose: () => void; actions?: React.ReactNode; startPage?: number }) {
  // Foto fija del proyecto: lo que pase en el editor (miniaturas, guardado) no reinicia la lectura.
  const [project] = useState(() => useEditor.getState().project!)
  const images = usePageImages(project)
  const [mode, setMode] = useState<Mode>(project.readingDirection === 'vertical' ? 'scroll' : 'book')
  const [current, setCurrent] = useState(Math.min(Math.max(0, startPage), project.pages.length - 1))
  const [chrome, setChrome] = useState(true)
  const [tapNav, setTapNav] = useState(readTapPref)
  const [fullscreen, setFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef(0)
  const total = project.pages.length
  const ready = images.length === total
  useReadingOverlay()
  useFocusTrap(rootRef)

  // La interfaz se esconde sola para leer sin distracciones; tocar o enfocar con teclado la muestra.
  // Los controles siguen respondiendo aunque estén ocultos: el primer toque ejecuta la acción.
  const poke = useCallback(() => {
    setChrome(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setChrome(false), 3200)
  }, [])
  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setChrome(false), 3200)
    return () => clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined)
  }
  const toggleTap = () => {
    const v = !tapNav
    setTapNav(v)
    try {
      localStorage.setItem(TAP_KEY, v ? '1' : '0')
    } catch {
      /* sin almacenamiento: vale para esta sesión */
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.fullscreenElement && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div ref={rootRef} className="reader-room fixed inset-0 z-50 flex flex-col overflow-hidden text-white" onPointerMove={poke} onPointerDown={poke} onFocus={poke} role="dialog" aria-modal="true" aria-label={`Lectura: ${project.title}`}>
      <div className={cx('absolute inset-x-0 top-0 z-20 flex h-14 items-center gap-2 bg-gradient-to-b from-black/80 to-transparent px-3 transition-opacity duration-300 focus-within:opacity-100 sm:gap-3 sm:px-5', chrome ? 'opacity-100' : 'opacity-0')}>
        <BookOpen size={18} className="hidden shrink-0 text-accent-bright sm:block" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{project.title}</div>
          {project.author && <div className="truncate text-[11px] text-white/60">{project.author}</div>}
        </div>
        {project.readingDirection === 'rtl' && mode === 'book' && <span className="hidden shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide uppercase sm:inline">Manga · der → izq</span>}
        <div className="flex-1" />
        {actions}
        <div className="flex rounded-lg bg-white/10 p-0.5">
          <button onClick={() => setMode('book')} title="Libro" aria-label="Modo libro" aria-pressed={mode === 'book'} className={cx('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs', mode === 'book' ? 'bg-white/20' : 'text-white/60')}>
            <BookOpen size={14} /> <span className="hidden sm:inline">Libro</span>
          </button>
          <button onClick={() => setMode('scroll')} title="Scroll vertical" aria-label="Modo scroll vertical" aria-pressed={mode === 'scroll'} className={cx('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs', mode === 'scroll' ? 'bg-white/20' : 'text-white/60')}>
            <ScrollText size={14} /> <span className="hidden sm:inline">Scroll</span>
          </button>
        </div>
        {mode === 'book' && (
          <button onClick={toggleTap} title={tapNav ? 'Tocar los costados pasa la página (activado)' : 'Tocar los costados pasa la página (desactivado)'} aria-label="Tocar los costados para pasar la página" aria-pressed={tapNav} className={cx('flex size-9 items-center justify-center rounded-lg hover:bg-white/10', !tapNav && 'text-white/40')}>
            <Hand size={17} />
          </button>
        )}
        <button onClick={toggleFs} title="Pantalla completa" aria-label="Pantalla completa" className="hidden size-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
          {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
        <button onClick={onClose} title="Cerrar (Esc)" aria-label="Cerrar lectura" className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
          <X size={19} />
        </button>
      </div>

      {!ready ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4" role="status">
          <div className="font-comic text-3xl tracking-wide">Imprimiendo páginas…</div>
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accent transition-all" style={{ width: `${(images.length / total) * 100}%` }} />
          </div>
          <div className="text-xs text-white/50 tabular-nums">
            {images.length} / {total}
          </div>
        </div>
      ) : mode === 'book' ? (
        <FlipBook project={project} images={images} chrome={chrome} start={current} onCurrent={setCurrent} tapNav={tapNav} />
      ) : (
        <ScrollView project={project} images={images} start={current} onCurrent={setCurrent} />
      )}
    </div>
  )
}

function ScrollView({ project, images, start, onCurrent }: { project: Project; images: string[]; start: number; onCurrent: (i: number) => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [first] = useState(start)
  // Arranca en la página que se estaba leyendo y va informando cuál está a la vista.
  useLayoutEffect(() => {
    const box = boxRef.current
    const img = box?.querySelectorAll('img')[first]
    if (box && img && first > 0) box.scrollTop = (img as HTMLElement).offsetTop - 56
  }, [first])
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.i))
        if (seen.length) onCurrent(Math.min(...seen))
      },
      { root: box, rootMargin: '-45% 0px -45% 0px' },
    )
    box.querySelectorAll('img').forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [onCurrent])
  return (
    <div ref={boxRef} className="scroll-thin flex-1 overflow-y-auto pt-14" data-testid="lectura-scroll">
      <div className="mx-auto flex max-w-[820px] flex-col gap-0 shadow-2xl">
        {images.map((src, i) => (
          <img key={i} data-i={i} src={src} alt={project.pages[i]?.name || `Página ${i + 1}`} className="block w-full" loading={Math.abs(i - first) > 2 ? 'lazy' : 'eager'} />
        ))}
      </div>
      <EndCard project={project} />
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

function FlipBook({ project, images, chrome, start, onCurrent, tapNav }: { project: Project; images: string[]; chrome: boolean; start: number; onCurrent: (i: number) => void; tapNav: boolean }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<PageFlip | null>(null)
  const rtl = project.readingDirection === 'rtl'
  const total = images.length
  const [bookIndex, setBookIndex] = useState(() => toBookIndex(start, total, rtl))
  const [box, setBox] = useState<{ w: number; h: number; portrait: boolean } | null>(null)
  const [barH, setBarH] = useState(96)
  const ratio = project.format.width / project.format.height

  // El libro reserva el alto real de la barra inferior: la barra nunca tapa las esquinas.
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const ro = new ResizeObserver(() => setBarH(Math.ceil(bar.getBoundingClientRect().height) + 8))
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      const W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      if (W <= 0 || H <= 0) return
      const portrait = W < 700 || W / H < ratio * 1.25
      const pageW = portrait ? Math.min(W, H * ratio) : Math.min(W / 2, H * ratio)
      setBox({ w: Math.floor(pageW), h: Math.floor(pageW / ratio), portrait })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ratio, barH])

  const indexRef = useRef(bookIndex)
  useEffect(() => {
    indexRef.current = bookIndex
  }, [bookIndex])

  useEffect(() => {
    const host = bookRef.current
    if (!host || !box) return
    // En manga el libro se arma al revés y arranca por la última hoja (que es la portada).
    const order = rtl ? [...images.keys()].reverse() : [...images.keys()]
    const startAt = Math.min(flipRef.current?.getCurrentPageIndex() ?? indexRef.current, order.length - 1)
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
      img.alt = project.pages[srcIndex]?.name || `Página ${srcIndex + 1}`
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
      flippingTime: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 650,
      drawShadow: true,
      // Los gestos los maneja el lector (dirección lógica uniforme en cómic y manga).
      useMouseEvents: false,
      startPage: startAt,
      autoSize: false,
    })
    pf.loadFromHTML(pages)
    // page-flip no siempre respeta startPage (p. ej. con tapas duras): se fuerza la hoja inicial.
    if (pf.getCurrentPageIndex() !== startAt) pf.turnToPage(startAt)
    pf.on('flip', (e) => setBookIndex(e.data as number))
    flipRef.current = pf
    return () => {
      flipRef.current = null
      try {
        pf.destroy()
      } catch {
        host.innerHTML = ''
      }
    }
  }, [box, images, rtl, project.pages])

  const spread = !!box && !box.portrait
  const shown = visiblePages(bookIndex, total, rtl, spread)
  const firstShown = shown[0]
  const label = pageLabel(shown, total)
  const role = shown.includes(0) && total > 1 ? ' · Portada' : shown.includes(total - 1) && total > 1 ? ' · Contratapa' : ''

  useEffect(() => {
    onCurrent(firstShown)
  }, [firstShown, onCurrent])

  const step = useCallback(
    (s: Step) => {
      const pf = flipRef.current
      if (!pf || !s) return
      // En el libro armado al revés (manga), avanzar en la historia es retroceder hojas.
      if ((s === 1) !== rtl) pf.flipNext('bottom')
      else pf.flipPrev('bottom')
    },
    [rtl],
  )
  const goTo = useCallback((logical: number) => flipRef.current?.turnToPage(toBookIndex(Math.max(0, Math.min(total - 1, logical)), total, rtl)), [rtl, total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // El slider y los botones manejan sus propias teclas.
      if (t?.tagName === 'INPUT' || (t?.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter'))) return
      const k = keyStep(e.key, rtl)
      if (k === 0) return
      e.preventDefault()
      if (k === 'first') goTo(0)
      else if (k === 'last') goTo(total - 1)
      else step(k)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rtl, step, goTo, total])

  // ---------- Gestos propios (mouse, dedo, lápiz) ----------
  const pointers = useRef(new Map<number, { x: number; y: number; t: number }>())
  const multi = useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() })
    // Dos dedos = pellizco: ese gesto no pasa páginas.
    if (pointers.current.size > 1) multi.current = true
  }
  const release = (e: React.PointerEvent, cancelled: boolean) => {
    const s = pointers.current.get(e.pointerId)
    pointers.current.delete(e.pointerId)
    const wasMulti = multi.current
    if (pointers.current.size === 0) multi.current = false
    if (!s || cancelled || wasMulti) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const g = { dx: e.clientX - s.x, dy: e.clientY - s.y, dt: performance.now() - s.t }
    const rect = (bookRef.current ?? areaRef.current)!.getBoundingClientRect()
    if (isTap(g)) {
      if (tapNav) step(tapStep((e.clientX - rect.left) / Math.max(1, rect.width), rtl))
      return
    }
    step(swipeStep({ ...g, width: rect.width }, rtl))
  }

  return (
    <>
      <div
        ref={areaRef}
        data-testid="lectura-libro"
        className="flex min-h-0 flex-1 items-center justify-center px-3 pt-14 select-none"
        style={{ paddingBottom: barH, touchAction: 'pinch-zoom' }}
        onPointerDown={onPointerDown}
        onPointerUp={(e) => release(e, false)}
        onPointerCancel={(e) => release(e, true)}
      >
        <div ref={bookRef} className="flip-book-host" style={box ? { width: box.portrait ? box.w : box.w * 2, height: box.h } : undefined} />
      </div>
      <div ref={barRef} className={cx('pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 focus-within:opacity-100 sm:px-8', chrome ? 'opacity-100' : 'opacity-0')}>
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => step(rtl ? 1 : -1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página siguiente' : 'Página anterior'}>
            <ChevronLeft size={20} />
          </button>
          <input
            type="range"
            min={1}
            max={total}
            value={firstShown + 1}
            onChange={(e) => goTo(Number(e.target.value) - 1)}
            className="min-w-0 flex-1"
            style={{ direction: rtl ? 'rtl' : 'ltr' }}
            aria-label="Ir a página"
            aria-valuetext={label}
          />
          <span className="shrink-0 text-center text-xs text-white/80 tabular-nums" data-testid="lectura-estado">
            {label}
            <span className="hidden sm:inline">{role}</span>
          </span>
          <button onClick={() => step(rtl ? -1 : 1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página anterior' : 'Página siguiente'}>
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/40">{tapNav ? 'Deslizá, arrastrá la hoja o tocá los costados para pasar la página' : 'Deslizá o arrastrá la hoja para pasar la página'}</p>
        <div className="sr-only" aria-live="polite">
          {label}
          {role}
        </div>
      </div>
    </>
  )
}
