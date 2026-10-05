import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import '../../lib/textFitKonva'
import { Circle, Group, Label, Layer, Line, Rect, Shape, Stage, Tag, Text, Transformer } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { BubbleElement, ComicElement, DrawingElement, Stroke, TextElement } from '../../types'
import { currentPage, findEl, notifyLocked, useCurrentPage, useEditor } from '../../store/editor'
import { createBubble, createDrawing, createPanel, createText, TEXT_PRESETS } from '../../lib/factories'
import { importFiles, placeAsset } from '../../lib/placement'
import { listLibrary } from '../../lib/storage'
import { insertLibraryItem } from '../../lib/library'
import { ensureGlyphs, LATIN_FONTS, loadFonts } from '../../lib/fonts'
import { PageContent } from './nodes/PageContent'
import type { NodeProps } from './nodes/ElementNode'
import { paintStroke } from './nodes/strokes'
import { bubbleTextBox } from './nodes/bubblePath'
import { PHONES, useUi } from '../../store/ui'
import { TYPE_LABEL, withPanelContent } from '../../lib/hierarchy'
import { openImagePicker } from './images/ImagePicker'
import { ImagePlus } from 'lucide-react'

Konva.dragDistance = 3

const SNAP_PX = 6
const PAD = 60

interface Guide {
  orientation: 'v' | 'h'
  pos: number
}

export function CanvasStage() {
  const project = useEditor((s) => s.project)!
  const page = useCurrentPage()
  const tool = useEditor((s) => s.tool)
  const selection = useEditor((s) => s.selection)
  const zoom = useEditor((s) => s.zoom)
  const view = useEditor((s) => s.view)
  const brush = useEditor((s) => s.brush)
  const cropping = useEditor((s) => s.croppingPanelId)
  const editingText = useEditor((s) => s.editingTextId)
  const fitRequest = useEditor((s) => s.fitRequest)

  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const liveRef = useRef<Konva.Shape>(null)
  const cursorRef = useRef<Konva.Circle>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [guides, setGuides] = useState<Guide[]>([])
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [draftPanel, setDraftPanel] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fontsReady, setFontsReady] = useState(0)

  const { width: PW, height: PH, margin, bleed } = project.format
  const interaction = useRef<
    | { kind: 'pan'; sx: number; sy: number; px: number; py: number }
    | { kind: 'marquee'; x: number; y: number; additive: boolean }
    | { kind: 'panel'; x: number; y: number }
    | { kind: 'stroke'; stroke: Stroke }
    | null
  >(null)
  const dragStart = useRef<Map<string, { x: number; y: number }>>(new Map())
  const zoomRef = useRef(zoom)

  useEffect(() => {
    // Fuentes de rotulado latinas y las que ya usa el proyecto (CJK incluidas), bajo demanda.
    const used = useEditor.getState().project?.pages.flatMap((p) => p.elements.flatMap((e) => (e.type === 'text' || e.type === 'bubble' ? [e.fontFamily] : []))) ?? []
    void loadFonts([...LATIN_FONTS, ...used]).then(() => setFontsReady((n) => n + 1))
    const onFonts = () => setFontsReady((n) => n + 1)
    window.addEventListener('vineta:fonts', onFonts)
    return () => window.removeEventListener('vineta:fonts', onFonts)
  }, [])

  // ---------- Tamaño y encuadre ----------
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.w || !size.h) return
    const pad = size.w < 640 ? 14 : PAD
    const z = Math.min((size.w - pad * 2) / PW, (size.h - pad * 2) / PH, 2)
    zoomRef.current = z
    useEditor.getState().setZoom(z)
    setPan({ x: (size.w - PW * z) / 2, y: Math.max(pad / 2, (size.h - PH * z) / 2) })
  }, [size.w, size.h, PW, PH])

  const fittedFor = useRef(-1)
  // Girar el teléfono o cambiar el tamaño de la ventana no cambia la escala ni la selección:
  // se mantiene centrado lo que se estaba viendo.
  const prevSize = useRef(size)
  useLayoutEffect(() => {
    const p = prevSize.current
    prevSize.current = size
    if (!p.w || !size.w || (p.w === size.w && p.h === size.h) || fittedFor.current < 0) return
    setPan((pan) => ({ x: pan.x + (size.w - p.w) / 2, y: pan.y + (size.h - p.h) / 2 }))
  }, [size])

  useEffect(() => {
    if (size.w && fittedFor.current !== fitRequest) {
      fittedFor.current = fitRequest
      fit()
    }
  }, [fitRequest, size.w, fit])

  // Zoom pedido desde afuera (barra superior): mantener el centro de la vista.
  useEffect(() => {
    const prev = zoomRef.current
    if (prev === zoom) return
    const cx = size.w / 2
    const cy = size.h / 2
    setPan((p) => ({ x: cx - ((cx - p.x) / prev) * zoom, y: cy - ((cy - p.y) / prev) * zoom }))
    zoomRef.current = zoom
  }, [zoom, size.w, size.h])

  // ---------- Barra espaciadora = mano temporal ----------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e) && !useEditor.getState().readerOpen) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // La parte visible de la página: sirve para insertar cosas donde se ven.
  useEffect(() => {
    if (!size.w || !zoom) return
    useEditor.setState({ visibleRect: { x: -pan.x / zoom, y: -pan.y / zoom, width: size.w / zoom, height: size.h / zoom } })
  }, [pan.x, pan.y, zoom, size.w, size.h])

  // ---------- Dedos apoyados (para no confundir un pellizco con un toque) ----------
  const touches = useRef(new Set<number>())
  const pinched = useRef(false)
  useEffect(() => {
    const down = (e: PointerEvent) => e.pointerType === 'touch' && touches.current.add(e.pointerId)
    const up = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      touches.current.delete(e.pointerId)
      // Hasta levantar todos los dedos, lo que queda del pellizco no selecciona ni mueve nada.
      if (touches.current.size === 0) pinched.current = false
    }
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', up, true)
    return () => {
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointerup', up, true)
      window.removeEventListener('pointercancel', up, true)
    }
  }, [])

  // ---------- Pellizco con dos dedos (móvil / tablet) ----------
  const viewRef = useRef({ pan, zoom })
  viewRef.current = { pan, zoom }
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let last: { d: number; cx: number; cy: number } | null = null
    const read = (t: TouchList) => {
      const r = el.getBoundingClientRect()
      const [a, b] = [t[0], t[1]]
      return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), cx: (a.clientX + b.clientX) / 2 - r.left, cy: (a.clientY + b.clientY) / 2 - r.top }
    }
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // El segundo dedo cancela cualquier trazo o arrastre en curso.
        pinched.current = true
        interaction.current = null
        liveRef.current?.getLayer()?.batchDraw()
        const stage = stageRef.current
        if (stage) {
          // Si el primer dedo empezó a arrastrar un elemento, vuelve a su lugar y el arrastre se descarta.
          const started = dragStart.current
          dragStart.current = new Map()
          for (const [id, pos] of started) stage.findOne('#' + id)?.position(pos)
          stage.find('.element').forEach((n) => n.isDragging() && n.stopDrag())
          stage.stopDrag()
          setGuides([])
        }
        last = read(e.touches)
      }
    }
    const move = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !last) return
      e.preventDefault()
      const cur = read(e.touches)
      const { pan: p, zoom: z } = viewRef.current
      const nz = Math.max(0.05, Math.min(8, z * (cur.d / last.d)))
      const px = (last.cx - p.x) / z
      const py = (last.cy - p.y) / z
      zoomRef.current = nz
      useEditor.getState().setZoom(nz)
      setPan({ x: cur.cx - px * nz, y: cur.cy - py * nz })
      last = cur
    }
    const end = (e: TouchEvent) => {
      if (e.touches.length < 2) last = null
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
    }
  }, [])

  // ---------- Transformer ----------
  const transformable = useMemo(() => {
    if (!page || cropping || editingText || tool !== 'select') return []
    return page.elements.filter((e) => selection.includes(e.id) && !e.locked && !e.hidden)
  }, [page, selection, cropping, editingText, tool])

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const nodes = transformable.map((e) => stage.findOne('#' + e.id)).filter(Boolean) as Konva.Node[]
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [transformable, page])

  // Viñeta vacía seleccionada (sola, sin girar): se ofrece agregarle una imagen.
  const emptyPanel = useMemo(() => {
    if (tool !== 'select' || cropping || editingText || selection.length !== 1 || !page) return undefined
    const el = page.elements.find((e) => e.id === selection[0])
    return el?.type === 'panel' && !el.image && !el.locked && !el.hidden && !el.rotation ? el : undefined
  }, [tool, cropping, editingText, selection, page])

  const keepRatio = transformable.length > 0 && transformable.every((e) => e.type === 'image' || e.type === 'drawing')

  // ---------- Coordenadas ----------
  const pagePointer = () => {
    const stage = stageRef.current
    const p = stage?.getPointerPosition()
    if (!stage || !p) return null
    return { x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom }
  }

  const elementIdFrom = (target: Konva.Node): string | null => {
    const g = target.hasName('element') ? target : target.findAncestor('.element')
    return g ? g.id() : null
  }

  // ---------- Pointer ----------
  const onPointerDown = (e: KonvaEventObject<PointerEvent>) => {
    const s = useEditor.getState()
    const evt = e.evt
    if (evt.pointerType === 'touch' && (pinched.current || touches.current.size > 1)) return
    const stage = stageRef.current!
    const pos = stage.getPointerPosition()!
    if (evt.button === 1 || tool === 'hand' || spaceDown) {
      evt.preventDefault()
      interaction.current = { kind: 'pan', sx: pos.x, sy: pos.y, px: pan.x, py: pan.y }
      return
    }
    if (evt.button !== 0) return
    const p = pagePointer()!
    if (e.target.hasName('tail-handle') || e.target.hasName('crop-ghost') || e.target.hasName('crop-rect') || e.target.getParent()?.className === 'Transformer') return

    if (tool === 'brush' || tool === 'eraser') {
      ;(evt.target as Element)?.setPointerCapture?.(evt.pointerId)
      interaction.current = {
        kind: 'stroke',
        stroke: {
          points: [[p.x, p.y, evt.pointerType === 'pen' ? evt.pressure : 0.5]],
          color: brush.color,
          size: tool === 'eraser' ? brush.eraserSize : brush.size,
          opacity: brush.opacity,
          brush: brush.kind,
          erase: tool === 'eraser',
        },
      }
      liveRef.current?.getLayer()?.batchDraw()
      return
    }
    if (tool === 'panel') {
      interaction.current = { kind: 'panel', x: p.x, y: p.y }
      setDraftPanel({ x: p.x, y: p.y, w: 0, h: 0 })
      return
    }
    if (tool === 'bubble') {
      const b = createBubble('speech', 0, 0, PW / 900)
      b.x = Math.round(p.x - b.width / 2)
      b.y = Math.round(p.y - b.height / 2)
      b.tailY = b.height + b.height * 0.4
      s.addElements([b])
      s.setTool('select')
      // Igual que la herramienta Texto: se escribe enseguida, sin que la primera letra dispare un atajo.
      setTimeout(() => useEditor.getState().setEditingText(b.id), 30)
      return
    }
    if (tool === 'text') {
      const t = createText(0, 0, TEXT_PRESETS[4])
      t.fontSize = Math.round(PW / 28)
      t.height = Math.round(t.fontSize * 1.4)
      t.width = Math.round(PW / 3)
      t.x = Math.round(p.x - t.width / 2)
      t.y = Math.round(p.y - t.height / 2)
      s.addElements([t])
      s.setTool('select')
      setTimeout(() => useEditor.getState().setEditingText(t.id), 30)
      return
    }

    // Herramienta selección
    const id = elementIdFrom(e.target)
    if (s.croppingPanelId && id !== s.croppingPanelId) s.setCropping(null)
    if (s.editingTextId) s.setEditingText(null)
    if (id) {
      if (evt.shiftKey || evt.metaKey || evt.ctrlKey) s.toggleSelect(id)
      else if (!s.selection.includes(id)) s.select([id])
      return
    }
    if (!evt.shiftKey) s.select([])
    if (evt.pointerType === 'touch') {
      // En pantallas táctiles, arrastrar sobre el vacío desplaza la vista.
      interaction.current = { kind: 'pan', sx: pos.x, sy: pos.y, px: pan.x, py: pan.y }
      return
    }
    interaction.current = { kind: 'marquee', x: p.x, y: p.y, additive: evt.shiftKey }
  }

  const onPointerMove = (e: KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current!
    const p = pagePointer()
    const cur = cursorRef.current
    if (cur && p && (tool === 'brush' || tool === 'eraser')) {
      cur.position(p)
      cur.radius(((tool === 'eraser' ? brush.eraserSize : brush.size) / 2) * (tool === 'eraser' ? 1 : 1.2))
      cur.visible(true)
      cur.getLayer()?.batchDraw()
    }
    const it = interaction.current
    if (!it || !p) return
    if (it.kind === 'pan') {
      const pos = stage.getPointerPosition()!
      setPan({ x: it.px + pos.x - it.sx, y: it.py + pos.y - it.sy })
    } else if (it.kind === 'stroke') {
      // Eventos "coalesced": más puntos por frame con lápiz óptico = trazo más suave.
      const events = e.evt.getCoalescedEvents?.() ?? [e.evt]
      const rect = stage.container().getBoundingClientRect()
      for (const ev of events.length ? events : [e.evt]) {
        const x = (ev.clientX - rect.left - pan.x) / zoom
        const y = (ev.clientY - rect.top - pan.y) / zoom
        it.stroke.points.push([x, y, ev.pointerType === 'pen' ? ev.pressure : 0.5])
      }
      liveRef.current?.getLayer()?.batchDraw()
    } else if (it.kind === 'marquee') {
      setMarquee({ x: Math.min(it.x, p.x), y: Math.min(it.y, p.y), w: Math.abs(p.x - it.x), h: Math.abs(p.y - it.y) })
    } else if (it.kind === 'panel') {
      setDraftPanel({ x: Math.min(it.x, p.x), y: Math.min(it.y, p.y), w: Math.abs(p.x - it.x), h: Math.abs(p.y - it.y) })
    }
  }

  const endInteraction = () => {
    const it = interaction.current
    interaction.current = null
    if (!it) return
    const s = useEditor.getState()
    if (it.kind === 'stroke') {
      commitStroke(it.stroke)
      liveRef.current?.getLayer()?.batchDraw()
    } else if (it.kind === 'marquee') {
      const m = marquee
      setMarquee(null)
      if (m && m.w > 3 && m.h > 3 && page) {
        const hit = page.elements
          .filter((el) => !el.locked && !el.hidden && el.type !== 'drawing')
          .filter((el) => el.x < m.x + m.w && el.x + el.width > m.x && el.y < m.y + m.h && el.y + el.height > m.y)
          .map((el) => el.id)
        s.select(it.additive ? [...new Set([...s.selection, ...hit])] : hit)
      }
    } else if (it.kind === 'panel') {
      const d = draftPanel
      setDraftPanel(null)
      if (d && d.w > 20 && d.h > 20) {
        const panel = createPanel(Math.round(d.x), Math.round(d.y), Math.round(d.w), Math.round(d.h))
        panel.strokeWidth = Math.max(3, Math.round(PW / 200))
        // Las viñetas nuevas van debajo de globos y textos.
        const els = currentPage()?.elements ?? []
        const firstOverlay = els.findIndex((el) => el.type === 'bubble' || el.type === 'text')
        s.addElements([panel], { index: firstOverlay >= 0 ? firstOverlay : undefined })
      }
    }
  }

  // El sistema puede cancelar un gesto (borde de pantalla, palma, notificación): se descarta sin aplicar.
  const cancelInteraction = () => {
    interaction.current = null
    setMarquee(null)
    setDraftPanel(null)
    liveRef.current?.getLayer()?.batchDraw()
  }

  useEffect(() => {
    const up = () => endInteraction()
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancelInteraction)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancelInteraction)
    }
  })

  const commitStroke = (stroke: Stroke) => {
    const s = useEditor.getState()
    const pg = currentPage()
    if (!pg || stroke.points.length < 1) return
    const selected = s.selection.length === 1 ? pg.elements.find((e) => e.id === s.selection[0] && e.type === 'drawing' && !e.locked) : undefined
    let layer = (selected ?? [...pg.elements].reverse().find((e) => e.type === 'drawing' && !e.locked && !e.hidden)) as DrawingElement | undefined
    if (!layer) {
      if (stroke.erase) {
        s.toast('No hay capa de dibujo para borrar', 'info')
        return
      }
      layer = createDrawing(PW, PH)
      layer.strokes = [stroke]
      s.addElements([layer])
      return
    }
    const L = layer
    const kx = L.baseWidth / L.width
    const ky = L.baseHeight / L.height
    // De la página a la capa: se deshace la posición y el giro de la capa (Konva gira alrededor de x,y).
    const rad = (-L.rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const local: Stroke = {
      ...stroke,
      size: stroke.size * kx,
      points: stroke.points.map(([x, y, pr]) => {
        const dx = x - L.x
        const dy = y - L.y
        return [(dx * cos - dy * sin) * kx, (dx * sin + dy * cos) * ky, pr]
      }),
    }
    s.updateElement(L.id, (el) => {
      if (el.type === 'drawing') el.strokes = [...el.strokes, local] as typeof el.strokes
    })
  }

  // ---------- Rueda: zoom y desplazamiento ----------
  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current!
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = Math.exp(-e.evt.deltaY * 0.0022)
      const z = Math.max(0.05, Math.min(8, zoom * factor))
      const px = (pointer.x - pan.x) / zoom
      const py = (pointer.y - pan.y) / zoom
      zoomRef.current = z
      useEditor.getState().setZoom(z)
      setPan({ x: pointer.x - px * z, y: pointer.y - py * z })
    } else {
      const dx = e.evt.shiftKey ? e.evt.deltaY : e.evt.deltaX
      const dy = e.evt.shiftKey ? 0 : e.evt.deltaY
      setPan((p) => ({ x: p.x - dx, y: p.y - dy }))
    }
  }

  // ---------- Arrastre con imanes ----------
  const onDragStart = (e: KonvaEventObject<DragEvent>) => {
    const id = elementIdFrom(e.target)
    if (!id || !e.target.hasName('element')) return
    const s = useEditor.getState()
    const pg = currentPage()
    const wanted = s.selection.includes(id) ? s.selection : [id]
    // Los bloqueados u ocultos no se mueven aunque estén en la selección.
    const ids = wanted.filter((i) => {
      const el = pg?.elements.find((x) => x.id === i)
      return !!el && !el.locked && !el.hidden
    })
    const skipped = wanted.filter((i) => pg?.elements.find((x) => x.id === i)?.locked).length
    if (skipped) notifyLocked(skipped)
    const stage = stageRef.current!
    // Una viñeta es un contenedor: se lleva lo que tiene encima. Con Ctrl/Cmd se mueve sólo el marco.
    const all = pg && !(e.evt.ctrlKey || e.evt.metaKey) ? withPanelContent(pg, ids) : ids
    dragStart.current = new Map(all.map((i) => [i, stage.findOne('#' + i)?.position() ?? { x: 0, y: 0 }]))
    setDragging(true)
  }

  const onDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (!node.hasName('element')) return
    const id = node.id()
    const start = dragStart.current.get(id)
    if (!start) return
    if (view.snap && !e.evt.altKey) {
      const lines = snapNode(node, id)
      setGuides(lines)
    } else if (guides.length) setGuides([])
    const dx = node.x() - start.x
    const dy = node.y() - start.y
    const stage = stageRef.current!
    for (const [other, pos] of dragStart.current) {
      if (other === id) continue
      stage.findOne('#' + other)?.position({ x: pos.x + dx, y: pos.y + dy })
    }
  }

  const onDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (!e.target.hasName('element')) return
    setGuides([])
    setDragging(false)
    const stage = stageRef.current!
    const moved = [...dragStart.current.keys()]
    dragStart.current = new Map()
    useEditor.getState().mutate((d) => {
      const pg = d.pages.find((p) => p.id === useEditor.getState().pageId)
      if (!pg) return
      for (const id of moved) {
        const n = stage.findOne('#' + id)
        const el = pg.elements.find((x) => x.id === id)
        if (n && el) {
          el.x = Math.round(n.x() * 10) / 10
          el.y = Math.round(n.y() * 10) / 10
        }
      }
    })
  }

  const snapNode = (node: Konva.Node, id: string): Guide[] => {
    const layer = node.getLayer()!
    const box = node.getClientRect({ relativeTo: layer as unknown as Konva.Container, skipShadow: true, skipStroke: true })
    // getClientRect relativo a la capa ya descuenta el zoom del stage.
    const th = SNAP_PX / zoom
    const vTargets = [0, PW / 2, PW, margin, PW - margin]
    const hTargets = [0, PH / 2, PH, margin, PH - margin]
    for (const el of page?.elements ?? []) {
      if (el.id === id || dragStart.current.has(el.id) || el.hidden || el.type === 'drawing') continue
      vTargets.push(el.x, el.x + el.width / 2, el.x + el.width)
      hTargets.push(el.y, el.y + el.height / 2, el.y + el.height)
    }
    const best = (edges: number[], targets: number[]) => {
      let res: { delta: number; pos: number } | null = null
      for (const edge of edges)
        for (const t of targets) {
          const d = t - edge
          if (Math.abs(d) < th && (!res || Math.abs(d) < Math.abs(res.delta))) res = { delta: d, pos: t }
        }
      return res
    }
    const v = best([box.x, box.x + box.width / 2, box.x + box.width], vTargets)
    const h = best([box.y, box.y + box.height / 2, box.y + box.height], hTargets)
    const out: Guide[] = []
    if (v) {
      node.x(node.x() + v.delta)
      out.push({ orientation: 'v', pos: v.pos })
    }
    if (h) {
      node.y(node.y() + h.delta)
      out.push({ orientation: 'h', pos: h.pos })
    }
    return out
  }

  // ---------- Transformación ----------
  const onTransformEnd = () => {
    const stage = stageRef.current!
    const ids = transformable.map((e) => e.id)
    useEditor.getState().mutate((d) => {
      const pg = d.pages.find((p) => p.id === useEditor.getState().pageId)
      if (!pg) return
      for (const id of ids) {
        const n = stage.findOne('#' + id)
        const el = pg.elements.find((x) => x.id === id)
        if (!n || !el) continue
        const sx = n.scaleX()
        const sy = n.scaleY()
        n.scale({ x: 1, y: 1 })
        el.x = n.x()
        el.y = n.y()
        el.rotation = Math.round(n.rotation() * 100) / 100
        el.width = Math.max(8, el.width * sx)
        el.height = Math.max(8, el.height * sy)
        if (el.type === 'bubble') {
          el.tailX *= sx
          el.tailY *= sy
        } else if (el.type === 'text') {
          // Escalar un texto cambia su cuerpo de letra, como en cualquier editor.
          if (Math.abs(sy - 1) > 0.01 && Math.abs(sx - sy) < 0.2) el.fontSize = Math.max(6, Math.round(el.fontSize * sy))
        } else if (el.type === 'panel' && el.image) {
          el.image.x *= sx
          el.image.y *= sy
          el.image.scale *= Math.max(sx, sy)
        }
      }
    })
  }

  // ---------- Doble clic ----------
  const onDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (tool !== 'select' || pinched.current) return
    const id = elementIdFrom(e.target)
    const el = id ? findEl(id) : undefined
    const s = useEditor.getState()
    if (!el || el.locked) return
    if (el.type === 'text' || el.type === 'bubble') s.setEditingText(el.id)
    else if (el.type === 'image') s.setCropping(el.id)
    else if (el.type === 'panel') {
      if (el.image) s.setCropping(el.id)
      else pickImageFor(el.id)
    }
  }

  // ---------- Soltar recursos / archivos ----------
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    stage.setPointersPositions(e.nativeEvent)
    const p = pagePointer()
    if (!p) return
    const libraryId = e.dataTransfer.getData('application/x-vineta-library')
    if (libraryId) {
      const item = (await listLibrary()).find((i) => i.id === libraryId)
      if (item) insertLibraryItem(item, p)
      return
    }
    const assetId = e.dataTransfer.getData('application/x-vineta-asset')
    const s = useEditor.getState()
    if (assetId) {
      const asset = s.project?.assets.find((a) => a.id === assetId)
      if (asset) placeAsset(asset, p)
      return
    }
    if (e.dataTransfer.files.length) {
      const assets = await importFiles(e.dataTransfer.files)
      assets.forEach((a, i) => placeAsset(a, { x: p.x + i * 30, y: p.y + i * 30 }, { intoPanel: i === 0 }))
    }
  }

  // ---------- Callbacks de nodos ----------
  const onTailChange = useCallback((id: string, x: number, y: number) => {
    useEditor.getState().updateElement(id, { tailX: x, tailY: y } as Partial<BubbleElement>)
  }, [])
  const onCropChange = useCallback((id: string, x: number, y: number, scale: number) => {
    useEditor.getState().updateElement(
      id,
      (el) => {
        if (el.type === 'panel' && el.image) Object.assign(el.image, { x, y, scale })
      },
      'crop',
    )
  }, [])

  const onImageCrop = useCallback((id: string, patch: Partial<ComicElement>) => {
    useEditor.getState().updateElement(id, patch)
  }, [])

  const canDrag = tool === 'select' && !spaceDown
  const nodeProps = useCallback(
    (id: string): Partial<NodeProps> => {
      const el = page?.elements.find((x) => x.id === id)
      return {
        draggable: canDrag && !!el && !el.locked && cropping !== id && editingText !== id,
        selected: selection.includes(id),
        cropping: cropping === id,
        textHidden: editingText === id,
        onTailChange,
        onCropChange,
        onImageCrop,
      }
    },
    [page, canDrag, cropping, editingText, selection, onTailChange, onCropChange, onImageCrop],
  )

  const cursor =
    spaceDown || tool === 'hand' ? (interaction.current?.kind === 'pan' ? 'grabbing' : 'grab') : tool === 'brush' || tool === 'eraser' ? 'none' : tool === 'panel' ? 'crosshair' : tool === 'text' ? 'text' : tool === 'bubble' ? 'copy' : 'default'

  if (!page) return null

  return (
    <div
      ref={wrapRef}
      data-tour="canvas"
      className="canvas-bg relative h-full w-full touch-none overflow-hidden select-none"
      style={{ cursor }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={onDrop}
      onPointerLeave={() => {
        cursorRef.current?.visible(false)
        cursorRef.current?.getLayer()?.batchDraw()
      }}
    >
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          x={pan.x}
          y={pan.y}
          scaleX={zoom}
          scaleY={zoom}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onWheel={onWheel}
          onDblClick={onDblClick}
          onDblTap={onDblClick as never}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer name="content">
            <Rect x={0} y={0} width={PW} height={PH} fill="#000" shadowColor="#000" shadowBlur={40 / zoom} shadowOpacity={0.55} listening={false} />
            {/* Konva mide el texto al crearlo: al llegar fuentes nuevas se vuelve a montar. */}
            <PageContent key={fontsReady} page={page} format={project.format} interactive nodeProps={nodeProps} />
          </Layer>
          <Layer name="overlay">
            {view.grid && <GridLines w={PW} h={PH} zoom={zoom} />}
            <PhoneFrameOverlay pw={PW} ph={PH} zoom={zoom} />
            {view.guides && (
              <Group listening={false}>
                {bleed > 0 && <Rect x={-bleed} y={-bleed} width={PW + bleed * 2} height={PH + bleed * 2} stroke="#ef4444" strokeWidth={1 / zoom} dash={[6 / zoom, 4 / zoom]} />}
                <Rect x={margin} y={margin} width={PW - margin * 2} height={PH - margin * 2} stroke="#38bdf8" strokeWidth={1 / zoom} dash={[6 / zoom, 4 / zoom]} opacity={0.8} />
              </Group>
            )}
            {guides.map((g, i) =>
              g.orientation === 'v' ? (
                <Line key={i} points={[g.pos, -2000, g.pos, PH + 2000]} stroke="#ff2d95" strokeWidth={1 / zoom} listening={false} />
              ) : (
                <Line key={i} points={[-2000, g.pos, PW + 2000, g.pos]} stroke="#ff2d95" strokeWidth={1 / zoom} listening={false} />
              ),
            )}
            {marquee && <Rect {...{ x: marquee.x, y: marquee.y, width: marquee.w, height: marquee.h }} fill="rgba(255,90,54,0.08)" stroke="#ff5a36" strokeWidth={1 / zoom} listening={false} />}
            {draftPanel && <Rect x={draftPanel.x} y={draftPanel.y} width={draftPanel.w} height={draftPanel.h} stroke="#111" strokeWidth={Math.max(3, PW / 200)} fill="rgba(255,255,255,0.6)" listening={false} />}
            <Shape
              ref={liveRef}
              listening={false}
              sceneFunc={(ctx) => {
                const it = interaction.current
                if (it?.kind !== 'stroke') return
                const s = it.stroke.erase ? { ...it.stroke, erase: false, color: 'rgba(255,90,54,0.35)', opacity: 1 } : it.stroke
                paintStroke(ctx._context, s)
              }}
            />
            <Circle ref={cursorRef} visible={false} stroke="#ff5a36" strokeWidth={1.5 / zoom} listening={false} dash={tool === 'eraser' ? [4 / zoom, 3 / zoom] : undefined} />
            {!dragging && !editingText && !cropping && <SelectionTag els={page?.elements.filter((e) => selection.includes(e.id)) ?? []} zoom={zoom} />}
            <Transformer
              ref={trRef}
              keepRatio={keepRatio}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={4}
              anchorSize={9}
              anchorCornerRadius={2}
              anchorStroke="#ff5a36"
              anchorFill="#ffffff"
              borderStroke="#ff5a36"
              borderStrokeWidth={1.5}
              rotateAnchorOffset={28}
              ignoreStroke
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12 ? oldBox : newBox)}
              onTransformEnd={onTransformEnd}
            />
          </Layer>
        </Stage>
      )}
      {editingText && stageRef.current && <TextEditOverlay id={editingText} stage={stageRef.current} zoom={zoom} pan={pan} />}
      {emptyPanel && !dragging && <EmptyPanelAction panel={emptyPanel} zoom={zoom} pan={pan} />}
    </div>
  )
}

/** Etiqueta con el tipo y el nombre del elemento seleccionado, arriba de su caja. */
function SelectionTag({ els, zoom }: { els: ComicElement[]; zoom: number }) {
  if (els.length !== 1) return null
  const el = els[0]
  const type = TYPE_LABEL[el.type]
  // "Viñeta 4" ya dice qué es: no repetir "Viñeta · Viñeta 4".
  const label = `${el.locked ? '🔒 ' : ''}${!el.name || el.name.startsWith(type) ? el.name || type : `${type} · ${el.name}`}`
  const text = label.length > 36 ? label.slice(0, 35) + '…' : label
  const k = 1 / zoom
  return (
    <Label x={el.x} y={el.y - 30 * k} listening={false} name="selection-tag">
      <Tag fill="#ff5a36" cornerRadius={4 * k} />
      <Text text={text} fontFamily="Inter" fontSize={11 * k} padding={4 * k} fill="#ffffff" />
    </Label>
  )
}

function GridLines({ w, h, zoom }: { w: number; h: number; zoom: number }) {
  const step = w / 12
  const pts: number[][] = []
  for (let x = step; x < w; x += step) pts.push([x, 0, x, h])
  for (let y = step; y < h; y += step) pts.push([0, y, w, y])
  return (
    <Group listening={false}>
      {pts.map((p, i) => (
        <Line key={i} points={p} stroke="#38bdf8" strokeWidth={1 / zoom} opacity={0.25} />
      ))}
    </Group>
  )
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
}

/** Reemplazar la imagen de una imagen libre: abre el selector (subir o galería). */
export function replaceImageFor(elId: string) {
  openImagePicker({ kind: 'image', id: elId })
}

/** Imagen para una viñeta: abre el selector (subir o galería). */
export function pickImageFor(panelId: string) {
  useEditor.getState().select([panelId])
  openImagePicker({ kind: 'panel', id: panelId })
}

/** Botón "Agregar imagen" sobre la viñeta vacía seleccionada. */
function EmptyPanelAction({ panel, zoom, pan }: { panel: ComicElement; zoom: number; pan: { x: number; y: number } }) {
  const cx = pan.x + (panel.x + panel.width / 2) * zoom
  const cy = pan.y + (panel.y + panel.height / 2) * zoom
  if (panel.width * zoom < 90 || panel.height * zoom < 60) return null
  return (
    <button
      onClick={() => pickImageFor(panel.id)}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-white pointer-coarse:py-2.5"
      style={{ left: cx, top: cy }}
      data-testid="agregar-imagen-vineta"
    >
      <ImagePlus size={14} /> Agregar imagen
    </button>
  )
}

/** Textarea HTML encima del texto de Konva para editar en el lugar. */
function TextEditOverlay({ id, stage, zoom, pan }: { id: string; stage: Konva.Stage; zoom: number; pan: { x: number; y: number } }) {
  const el = findEl(id) as TextElement | BubbleElement | undefined
  const ref = useRef<HTMLTextAreaElement>(null)
  const cancelled = useRef(false)
  const [value, setValue] = useState(el?.text ?? '')
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  if (!el) return null
  const box = el.type === 'bubble' ? bubbleTextBox(el) : { x: 0, y: 0, width: el.width, height: el.height }
  const commit = () => {
    const s = useEditor.getState()
    if (s.editingTextId !== id) return
    if (!cancelled.current && value !== el.text) s.updateElement(id, { text: value })
    ensureGlyphs(el.fontFamily, value)
    s.setEditingText(null)
  }
  void stage
  const rad = (el.rotation * Math.PI) / 180
  const ox = box.x * Math.cos(rad) - box.y * Math.sin(rad)
  const oy = box.x * Math.sin(rad) + box.y * Math.cos(rad)
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        // Durante la composición IME (japonés, coreano, chino) Esc y Enter son del IME, no del editor.
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        // Enter confirma, Shift+Enter agrega una línea, Esc cancela (vuelve al texto anterior).
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          commit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancelled.current = true
          commit()
        }
      }}
      spellCheck={false}
      className="absolute resize-none overflow-hidden border-0 bg-white/5 p-0 outline-2 outline-offset-2 outline-[#ff5a36]"
      style={{
        left: pan.x + (el.x + ox) * zoom,
        top: pan.y + (el.y + oy) * zoom,
        width: box.width * zoom,
        height: box.height * zoom,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: '0 0',
        fontFamily: el.fontFamily,
        fontSize: el.fontSize * zoom,
        fontWeight: el.fontStyle.includes('bold') ? 700 : 400,
        fontStyle: el.fontStyle.includes('italic') ? 'italic' : 'normal',
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing * zoom,
        textAlign: el.align,
        color: el.textColor,
        textTransform: el.uppercase ? 'uppercase' : 'none',
        paddingTop: el.vertical ? 0 : Math.max(0, (box.height * zoom - value.split('\n').length * el.fontSize * zoom * el.lineHeight) / 2),
        caretColor: '#ff5a36',
        writingMode: el.vertical ? 'vertical-rl' : undefined,
      }}
    />
  )
}

export type { ComicElement }

/**
 * Webtoon: marco de "lo que se ve en un teléfono" sobre la página. Atenúa lo de afuera y se arrastra
 * desde su manija. Es sólo guía: la exportación dibuja la página sin esta capa.
 */
function PhoneFrameOverlay({ pw, ph, zoom }: { pw: number; ph: number; zoom: number }) {
  const frame = useUi((s) => s.phoneFrame)
  const vertical = useEditor((s) => s.project?.kind === 'webtoon' || s.project?.readingDirection === 'vertical')
  if (!frame.on || !vertical) return null
  const dev = PHONES.find((d) => d.id === frame.device) ?? PHONES[1]
  const fh = Math.min(ph, (pw * dev.h) / dev.w)
  const y = Math.max(0, Math.min(ph - fh, frame.y))
  const dim = 'rgba(8,8,10,0.55)'
  return (
    <Group name="phone-frame">
      <Rect x={0} y={0} width={pw} height={y} fill={dim} listening={false} />
      <Rect x={0} y={y + fh} width={pw} height={Math.max(0, ph - y - fh)} fill={dim} listening={false} />
      <Rect x={0} y={y} width={pw} height={fh} stroke="#ff5a36" strokeWidth={3 / zoom} dash={[10 / zoom, 6 / zoom]} listening={false} />
      <Rect
        name="phone-frame-handle"
        x={pw / 2 - 60 / zoom}
        y={y - 14 / zoom}
        width={120 / zoom}
        height={28 / zoom}
        cornerRadius={14 / zoom}
        fill="#ff5a36"
        draggable
        dragBoundFunc={function (this: Konva.Node, pos) {
          return { x: this.absolutePosition().x, y: pos.y }
        }}
        onDragMove={(e) => useUi.getState().setPhoneFrame({ y: Math.max(0, Math.min(ph - fh, e.target.y() + 14 / zoom)) })}
        onDragEnd={(e) => e.target.y(Math.max(0, Math.min(ph - fh, e.target.y() + 14 / zoom)) - 14 / zoom)}
      />
    </Group>
  )
}
