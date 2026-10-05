import { memo, useEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Circle, Group, Image as KImage, Line, Rect, Shape, Text, Transformer } from 'react-konva'
import type {
  BubbleElement,
  ComicElement,
  DrawingElement,
  EffectElement,
  ImageElement,
  ImageFilters,
  PanelElement,
  ShapeElement,
  TextElement,
} from '../../../types'
import { insetConvexPolygon } from '../../../lib/geometry'
import { shapeDef, traceShape } from '../../../lib/shapes'
import { useAssetImage } from '../../../lib/assetCache'
import { bubbleTextBox, drawBubble } from './bubblePath'
import { drawEffect } from './effects'
import { rasterizeDrawing, strokeOutline, traceOutline } from './strokes'
import { drawVerticalText } from './verticalText'
import type { Filter, KonvaEventObject } from 'konva/lib/Node'

export interface NodeProps {
  el: ComicElement
  interactive: boolean
  draggable?: boolean
  selected?: boolean
  cropping?: boolean
  /** Oculta el texto mientras se edita con el textarea superpuesto. */
  textHidden?: boolean
  onTailChange?: (id: string, x: number, y: number) => void
  onCropChange?: (id: string, x: number, y: number, scale: number) => void
  onImageCrop?: (id: string, patch: Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'crop'>) => void
}

export const ElementNode = memo(function ElementNode(props: NodeProps) {
  const { el, interactive, draggable } = props
  if (el.hidden) return null
  return (
    <Group
      id={el.id}
      name="element"
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable={draggable}
      listening={interactive}
      globalCompositeOperation={el.blend && el.blend !== 'source-over' ? el.blend : undefined}
    >
      {el.type === 'panel' && <PanelNode {...props} el={el} />}
      {el.type === 'image' && <ImageNode {...props} el={el} />}
      {el.type === 'bubble' && <BubbleNode {...props} el={el} />}
      {el.type === 'text' && <TextNode el={el} hidden={props.textHidden} />}
      {el.type === 'effect' && <EffectNode el={el} />}
      {el.type === 'drawing' && <DrawingNode el={el} />}
      {el.type === 'shape' && <ShapeNode el={el} />}
    </Group>
  )
})

// ---------- Filtros ----------

function filterList(f: ImageFilters) {
  const list: Filter[] = []
  if (f.grayscale) list.push(Konva.Filters.Grayscale)
  if (f.sepia) list.push(Konva.Filters.Sepia)
  if (f.invert) list.push(Konva.Filters.Invert)
  if (f.brightness) list.push(Konva.Filters.Brightness)
  if (f.contrast) list.push(Konva.Filters.Contrast)
  if (f.threshold) list.push(Konva.Filters.Threshold)
  if (f.blur) list.push(Konva.Filters.Blur)
  return list
}

function useFilters(ref: React.RefObject<Konva.Image | null>, image: HTMLImageElement | undefined, f: ImageFilters) {
  // Mientras se mueve un slider (cambios seguidos) se filtra una versión reducida; al soltar,
  // la imagen completa. Así un desenfoque sobre 4096² no bloquea cada tick.
  const last = useRef(0)
  const settle = useRef(0)
  useEffect(() => {
    const node = ref.current
    if (!node || !image) return
    const apply = (preview: boolean) => {
      const list = filterList(f)
      if (list.length) {
        const side = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height, 1)
        const ratio = preview ? Math.min(1, 640 / side) : 1
        node.cache({ pixelRatio: ratio })
        node.filters(list)
        node.brightness(1 + f.brightness)
        node.contrast(f.contrast)
        node.threshold(f.threshold)
        node.blurRadius(f.blur * ratio)
      } else {
        node.filters([])
        node.clearCache()
      }
      node.getLayer()?.batchDraw()
    }
    const now = performance.now()
    const rapid = now - last.current < 250
    last.current = now
    clearTimeout(settle.current)
    apply(rapid)
    if (rapid) settle.current = window.setTimeout(() => apply(false), 300)
    return () => clearTimeout(settle.current)
  }, [ref, image, f])
}

// ---------- Viñeta ----------

function panelPolygon(el: PanelElement): number[] | null {
  if (!el.points) return null
  return el.points.map((v, i) => (i % 2 === 0 ? v * el.width : v * el.height))
}

function tracePanel(ctx: Konva.Context | CanvasRenderingContext2D, el: PanelElement) {
  const poly = panelPolygon(el)
  ctx.beginPath()
  if (poly) {
    ctx.moveTo(poly[0], poly[1])
    for (let i = 2; i < poly.length; i += 2) ctx.lineTo(poly[i], poly[i + 1])
    ctx.closePath()
  } else if (el.cornerRadius > 0) {
    const r = Math.min(el.cornerRadius, el.width / 2, el.height / 2)
    ctx.moveTo(r, 0)
    ctx.arcTo(el.width, 0, el.width, el.height, r)
    ctx.arcTo(el.width, el.height, 0, el.height, r)
    ctx.arcTo(0, el.height, 0, 0, r)
    ctx.arcTo(0, 0, el.width, 0, r)
    ctx.closePath()
  } else {
    ctx.rect(0, 0, el.width, el.height)
  }
}

/** Ventana de la imagen: la viñeta contraída por su margen interior (padding). */
function traceInset(ctx: Konva.Context | CanvasRenderingContext2D, el: PanelElement, pad: number) {
  const poly = panelPolygon(el)
  ctx.beginPath()
  if (poly) {
    const pts = insetConvexPolygon(
      Array.from({ length: poly.length / 2 }, (_, i) => ({ x: poly[i * 2], y: poly[i * 2 + 1] })),
      pad,
    )
    ctx.moveTo(pts[0].x, pts[0].y)
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    return
  }
  const w = Math.max(1, el.width - pad * 2)
  const h = Math.max(1, el.height - pad * 2)
  const r = Math.min(Math.max(0, el.cornerRadius - pad), w / 2, h / 2)
  if (r > 0) {
    ctx.moveTo(pad + r, pad)
    ctx.arcTo(pad + w, pad, pad + w, pad + h, r)
    ctx.arcTo(pad + w, pad + h, pad, pad + h, r)
    ctx.arcTo(pad, pad + h, pad, pad, r)
    ctx.arcTo(pad, pad, pad + w, pad, r)
    ctx.closePath()
  } else ctx.rect(pad, pad, w, h)
}

function PanelNode({ el, cropping, interactive, onCropChange }: NodeProps & { el: PanelElement }) {
  const image = useAssetImage(el.image?.assetId)
  const imgRef = useRef<Konva.Image>(null)
  const ghostRef = useRef<Konva.Image>(null)
  useFilters(imgRef, image, el.image?.filters ?? NO_FILTERS)

  const onGhostMove = (e: KonvaEventObject<DragEvent>) => {
    imgRef.current?.position(e.target.position())
  }
  const onGhostEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true
    if (el.image) onCropChange?.(el.id, e.target.x(), e.target.y(), el.image.scale)
  }
  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    if (!cropping || !el.image || !image) return
    e.evt.preventDefault()
    e.cancelBubble = true
    const group = e.target.getParent()?.findAncestor('.element') as Konva.Group | undefined
    const pointer = group?.getRelativePointerPosition()
    if (!pointer) return
    const factor = e.evt.deltaY > 0 ? 0.94 : 1.06
    const scale = Math.max(0.02, Math.min(20, el.image.scale * factor))
    const k = scale / el.image.scale
    onCropChange?.(el.id, pointer.x - (pointer.x - el.image.x) * k, pointer.y - (pointer.y - el.image.y) * k, scale)
  }

  return (
    <>
      <Group clipFunc={(ctx) => tracePanel(ctx, el)} onWheel={onWheel}>
        <Rect width={el.width} height={el.height} fill={el.fill} />
        {el.image && image && (
          <Group clipFunc={el.padding ? (ctx) => traceInset(ctx, el, el.padding!) : undefined} listening={false}>
            <KImage
              ref={imgRef}
              image={image}
              x={el.image.x}
              y={el.image.y}
              width={image.naturalWidth}
              height={image.naturalHeight}
              scaleX={el.image.scale}
              scaleY={el.image.scale}
              listening={false}
            />
          </Group>
        )}
      </Group>
      {cropping && el.image && image && interactive && (
        <KImage
          ref={ghostRef}
          image={image}
          x={el.image.x}
          y={el.image.y}
          width={image.naturalWidth}
          height={image.naturalHeight}
          scaleX={el.image.scale}
          scaleY={el.image.scale}
          opacity={0.35}
          draggable
          onDragMove={onGhostMove}
          onDragEnd={onGhostEnd}
          onDragStart={(e) => (e.cancelBubble = true)}
          onWheel={onWheel}
          name="crop-ghost"
        />
      )}
      {el.strokeWidth > 0 && (
        <Shape
          sceneFunc={(ctx, shape) => {
            tracePanel(ctx, el)
            ctx.strokeShape(shape)
          }}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          lineJoin="miter"
          listening={false}
        />
      )}
      {/* Área de clic: toda la viñeta, aunque esté vacía. */}
      {!cropping && (
        <Shape
          sceneFunc={() => undefined}
          hitFunc={(ctx, shape) => {
            tracePanel(ctx, el)
            ctx.fillStrokeShape(shape)
          }}
        />
      )}
      {!el.image && interactive && (
        <Text
          text="Arrastrá una imagen acá"
          // Zona central: en viñetas cortadas en diagonal las cajas se superponen en los bordes.
          x={el.width * 0.2}
          width={el.width * 0.6}
          height={el.height}
          align="center"
          verticalAlign="middle"
          fontFamily="Inter"
          fontSize={Math.max(12, Math.min(22, el.width / 14))}
          fill="#a3a3a3"
          listening={false}
          name="ui-only"
        />
      )}
    </>
  )
}

const NO_FILTERS: ImageFilters = { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 }

// ---------- Imagen libre ----------

function ImageNode({ el, cropping, interactive, onImageCrop }: NodeProps & { el: ImageElement }) {
  const image = useAssetImage(el.assetId)
  const ref = useRef<Konva.Image>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)
  useFilters(ref, image, el.filters)
  const active = !!(cropping && interactive && image)
  useEffect(() => {
    if (active && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [active])
  if (!image) return <Rect width={el.width} height={el.height} fill="#e5e5e5" dash={[8, 8]} stroke="#a3a3a3" />
  const nw = image.naturalWidth
  const nh = image.naturalHeight
  const crop = el.crop ?? { x: 0, y: 0, width: nw, height: nh }

  if (active) {
    // Modo recorte: imagen completa tenue + rectángulo de recorte editable.
    const s = el.width / crop.width
    const sy = el.height / crop.height
    const commit = () => {
      const r = rectRef.current!
      const w = r.width() * r.scaleX()
      const h = r.height() * r.scaleY()
      let cx = crop.x + r.x() / s
      let cy = crop.y + r.y() / sy
      let cw = w / s
      let ch = h / sy
      cx = Math.max(0, Math.min(nw - 4, cx))
      cy = Math.max(0, Math.min(nh - 4, cy))
      cw = Math.max(4, Math.min(nw - cx, cw))
      ch = Math.max(4, Math.min(nh - cy, ch))
      const dx = (cx - crop.x) * s
      const dy = (cy - crop.y) * sy
      const rad = (el.rotation * Math.PI) / 180
      r.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
      onImageCrop?.(el.id, {
        x: el.x + dx * Math.cos(rad) - dy * Math.sin(rad),
        y: el.y + dx * Math.sin(rad) + dy * Math.cos(rad),
        width: cw * s,
        height: ch * sy,
        crop: { x: cx, y: cy, width: cw, height: ch },
      })
    }
    return (
      <>
        <KImage image={image} x={-crop.x * s} y={-crop.y * sy} width={nw * s} height={nh * sy} opacity={0.3} listening={false} />
        <KImage ref={ref} image={image} crop={crop} width={el.width} height={el.height} listening={false} />
        <Rect
          ref={rectRef}
          name="crop-rect"
          width={el.width}
          height={el.height}
          stroke="#ff5a36"
          strokeWidth={2}
          strokeScaleEnabled={false}
          dash={[6, 4]}
          fill="rgba(0,0,0,0.001)"
          draggable
          onDragStart={(e) => (e.cancelBubble = true)}
          onDragMove={(e) => (e.cancelBubble = true)}
          onDragEnd={(e) => {
            e.cancelBubble = true
            commit()
          }}
        />
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          flipEnabled={false}
          anchorSize={10}
          anchorStroke="#ff5a36"
          anchorFill="#111"
          borderEnabled={false}
          onTransformEnd={commit}
        />
      </>
    )
  }

  return (
    <KImage
      ref={ref}
      image={image}
      crop={el.crop ?? undefined}
      width={el.width}
      height={el.height}
      scaleX={el.flipX ? -1 : 1}
      scaleY={el.flipY ? -1 : 1}
      offsetX={el.flipX ? el.width : 0}
      offsetY={el.flipY ? el.height : 0}
    />
  )
}

// ---------- Globo ----------

function BubbleNode({ el, selected, interactive, textHidden, onTailChange }: NodeProps & { el: BubbleElement }) {
  const [tail, setTail] = useState<{ x: number; y: number } | null>(null)
  const live = tail ? { ...el, tailX: tail.x, tailY: tail.y } : el
  const box = bubbleTextBox(el)
  const showHandle = interactive && selected && el.tail && el.shape !== 'box' && el.shape !== 'cloud-box' && !el.locked
  return (
    <>
      <Shape
        sceneFunc={(ctx) => drawBubble(ctx._context, live)}
        hitFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2)
          if (el.shape === 'box') {
            ctx.beginPath()
            ctx.rect(0, 0, el.width, el.height)
          }
          ctx.fillStrokeShape(shape)
        }}
      />
      {el.vertical && !textHidden && (
        <Shape listening={false} sceneFunc={(ctx) => drawVerticalText(ctx._context, { ...el, fill: el.textColor }, box)} />
      )}
      <Text
        {...box}
        visible={!textHidden && !el.vertical}
        text={el.uppercase ? el.text.toUpperCase() : el.text}
        fontFamily={el.fontFamily}
        fontSize={el.fontSize}
        fontStyle={el.fontStyle}
        align={el.align}
        verticalAlign="middle"
        lineHeight={el.lineHeight}
        letterSpacing={el.letterSpacing}
        fill={el.textColor}
        wrap="word"
        listening={false}
      />
      {showHandle && (
        <>
          <Line points={[el.width / 2, el.height / 2, live.tailX, live.tailY]} stroke="#ff5a36" strokeWidth={1} dash={[4, 4]} listening={false} name="ui-only" />
          <Circle
            name="tail-handle ui-only"
            x={live.tailX}
            y={live.tailY}
            radius={9}
            fill="#ff5a36"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onDragStart={(e) => (e.cancelBubble = true)}
            onDragMove={(e) => {
              e.cancelBubble = true
              setTail({ x: e.target.x(), y: e.target.y() })
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true
              onTailChange?.(el.id, e.target.x(), e.target.y())
              setTail(null)
            }}
            onMouseEnter={(e) => {
              const c = e.target.getStage()?.container()
              if (c) c.style.cursor = 'grab'
            }}
            onMouseLeave={(e) => {
              const c = e.target.getStage()?.container()
              if (c) c.style.cursor = ''
            }}
          />
        </>
      )}
    </>
  )
}

// ---------- Texto / SFX ----------

function TextNode({ el, hidden }: { el: TextElement; hidden?: boolean }) {
  return (
    <>
      <Rect width={el.width} height={el.height} fill="transparent" />
      {el.vertical && !hidden && (
        <Shape
          listening={false}
          shadowEnabled={el.shadow}
          shadowColor={el.shadowColor}
          shadowOffsetX={el.fontSize * 0.06}
          shadowOffsetY={el.fontSize * 0.06}
          sceneFunc={(ctx) =>
            drawVerticalText(ctx._context, { ...el, fill: el.textColor, stroke: el.stroke, strokeWidth: el.strokeWidth }, { x: 0, y: 0, width: el.width, height: el.height })
          }
        />
      )}
      <Text
        visible={!hidden && !el.vertical}
        width={el.width}
        height={el.height}
        text={el.uppercase ? el.text.toUpperCase() : el.text}
        fontFamily={el.fontFamily}
        fontSize={el.fontSize}
        fontStyle={el.fontStyle}
        align={el.align}
        verticalAlign="middle"
        lineHeight={el.lineHeight}
        letterSpacing={el.letterSpacing}
        fill={el.textColor}
        stroke={el.strokeWidth > 0 ? el.stroke : undefined}
        strokeWidth={el.strokeWidth}
        fillAfterStrokeEnabled
        lineJoin="round"
        skewX={el.skewX}
        offsetX={el.skewX * el.height * -0.5}
        shadowEnabled={el.shadow}
        shadowColor={el.shadowColor}
        shadowOffsetX={el.fontSize * 0.06}
        shadowOffsetY={el.fontSize * 0.06}
        shadowBlur={0}
        wrap="word"
      />
    </>
  )
}

// ---------- Efectos ----------

function EffectNode({ el }: { el: EffectElement }) {
  return (
    <Shape
      width={el.width}
      height={el.height}
      sceneFunc={(ctx) => drawEffect(ctx._context, el)}
      hitFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.rect(0, 0, el.width, el.height)
        ctx.fillStrokeShape(shape)
      }}
    />
  )
}

// ---------- Formas y símbolos ----------

function ShapeNode({ el }: { el: ShapeElement }) {
  const def = shapeDef(el.shape)
  return (
    <Shape
      // Sin tamaño propio Konva mide la forma como 0×0 y el transformador queda colapsado.
      width={el.width}
      height={el.height}
      sceneFunc={(ctx) => {
        const c = ctx._context
        c.lineJoin = 'round'
        c.lineCap = 'round'
        if (def.mode === 'fill') {
          traceShape(c, def.cmds, el.width, el.height)
          c.fillStyle = el.fill
          c.fill()
          if (el.strokeWidth > 0) {
            c.lineWidth = el.strokeWidth
            c.strokeStyle = el.stroke
            c.stroke()
          }
        } else {
          traceShape(c, def.cmds, el.width, el.height, 'path')
          c.lineWidth = Math.max(1, el.strokeWidth)
          c.strokeStyle = el.stroke
          c.stroke()
          traceShape(c, def.cmds, el.width, el.height, 'dots')
          c.fillStyle = el.stroke
          c.fill()
        }
      }}
      hitFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.rect(0, 0, el.width, el.height)
        ctx.fillStrokeShape(shape)
      }}
    />
  )
}

// ---------- Dibujo ----------

const outlineCache = new WeakMap<object, number[][]>()

function DrawingNode({ el }: { el: DrawingElement }) {
  return (
    <Shape
      width={el.width}
      height={el.height}
      sceneFunc={(ctx) => {
        if (!el.strokes.length) return
        ctx._context.drawImage(rasterizeDrawing(el), 0, 0, el.width, el.height)
      }}
      hitFunc={(ctx, shape) => {
        // Sólo los trazos son "clicables": la capa no tapa lo que hay debajo.
        const n = ctx._context
        n.save()
        n.scale(el.width / el.baseWidth, el.height / el.baseHeight)
        for (const s of el.strokes) {
          if (s.erase) continue
          let o = outlineCache.get(s)
          if (!o) {
            o = strokeOutline({ ...s, size: Math.max(s.size, 12) }, false)
            outlineCache.set(s, o)
          }
          traceOutline(n, o)
          ctx.fillStrokeShape(shape)
        }
        n.restore()
      }}
    />
  )
}
