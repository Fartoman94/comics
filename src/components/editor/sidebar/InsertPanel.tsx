import { Brush, Layers } from 'lucide-react'
import type { BubbleShape, EffectKind, TextElement } from '../../../types'
import { currentPage, placementFor, useEditor } from '../../../store/editor'
import { createBubble, createDrawing, createEffect, createShape, createText, TEXT_PRESETS } from '../../../lib/factories'
import { SHAPE_DEFS, shapeSvgPath } from '../../../lib/shapes'
import type { ShapeKind } from '../../../types'
import { detectScript, ensureGlyphs, requireFonts } from '../../../lib/fonts'
import { useEffect } from 'react'
import { Section } from '../../ui/controls'

const BUBBLES: { shape: BubbleShape; label: string; path: string; dash?: boolean }[] = [
  { shape: 'speech', label: 'Diálogo', path: 'M24 6c11 0 20 6 20 14s-9 14-20 14c-2 0-4 0-6-1l-9 6 3-8c-5-3-8-7-8-11C4 12 13 6 24 6z' },
  { shape: 'thought', label: 'Pensamiento', path: 'M14 10a8 8 0 0114-3 8 8 0 0112 4 7 7 0 012 13 8 8 0 01-11 6 9 9 0 01-13 0 7 7 0 01-9-9 7 7 0 015-11zM9 36a3 3 0 110 .1M4 42a2 2 0 110 .1' },
  { shape: 'shout', label: 'Grito', path: 'M24 2l4 8 8-5-1 9 10-1-6 7 8 5-9 3 5 8-9-2 0 9-6-6-5 8-3-9-8 4 3-8-9-2 7-5-7-6 9-1-3-8 8 4z' },
  { shape: 'whisper', label: 'Susurro', dash: true, path: 'M24 6c11 0 20 6 20 14s-9 14-20 14c-2 0-4 0-6-1l-9 6 3-8c-5-3-8-7-8-11C4 12 13 6 24 6z' },
  { shape: 'box', label: 'Narración', path: 'M5 10h38v24H5z' },
  { shape: 'cloud-box', label: 'Recuadro nube', path: 'M12 12a7 7 0 0112-3 7 7 0 0111 2 7 7 0 016 11 7 7 0 01-7 9 8 8 0 01-12 1 7 7 0 01-11-3 7 7 0 01-3-12 6 6 0 014-5z' },
]

const EFFECTS: { kind: EffectKind; label: string; desc: string }[] = [
  { kind: 'focuslines', label: 'Líneas de impacto', desc: 'Concentran la mirada (shūchūsen)' },
  { kind: 'speedlines', label: 'Líneas de velocidad', desc: 'Movimiento y velocidad' },
  { kind: 'screentone', label: 'Trama de puntos', desc: 'Sombra plana estilo manga' },
  { kind: 'gradient-tone', label: 'Trama degradada', desc: 'Sombra que se desvanece' },
]

// Onomatopeyas listas para usar, por idioma.
const SFX: { lang: string; font: string; items: [string, string][] }[] = [
  {
    lang: '日本語 · Japonés',
    font: 'Dela Gothic One',
    items: [
      ['ドドド', 'presencia amenazante'],
      ['ゴゴゴ', 'tensión'],
      ['ドン', 'impacto / aparición'],
      ['バン', 'golpe / disparo'],
      ['ザワザワ', 'murmullo'],
      ['シーン', 'silencio'],
      ['キラキラ', 'brillo'],
      ['ドキドキ', 'corazón latiendo'],
      ['ガシャン', 'algo que se rompe'],
      ['ビュン', 'movimiento rápido'],
      ['ゴロゴロ', 'trueno'],
      ['ニヤリ', 'sonrisa pícara'],
    ],
  },
  {
    lang: '한국어 · Coreano',
    font: 'Black Han Sans',
    items: [
      ['쾅', 'golpe fuerte'],
      ['두근두근', 'corazón latiendo'],
      ['휘익', 'movimiento rápido'],
      ['쨍그랑', 'vidrio roto'],
      ['펑', 'explosión'],
      ['스윽', 'deslizar'],
      ['부르르', 'temblor'],
      ['하하하', 'risa'],
    ],
  },
  {
    lang: '中文 · Chino',
    font: 'ZCOOL KuaiLe',
    items: [
      ['轰', 'estruendo'],
      ['砰', 'golpe'],
      ['咚', 'golpe sordo'],
      ['嗖', 'zumbido rápido'],
      ['哗啦', 'agua / derrumbe'],
      ['咔嚓', 'crujido'],
      ['哈哈', 'risa'],
      ['嘭', 'explosión'],
    ],
  },
  {
    lang: 'Español',
    font: 'Bangers',
    items: [
      ['¡BOOM!', 'explosión'],
      ['¡PAF!', 'golpe'],
      ['¡CRASH!', 'choque'],
      ['ZZZ', 'dormir'],
      ['¡ZAS!', 'golpe rápido'],
      ['GLUP', 'tragar saliva'],
      ['¡BRRR!', 'frío'],
      ['¡ÑAM!', 'comer'],
    ],
  },
]


export type InsertSection = 'bubbles' | 'texts' | 'sfx' | 'shapes' | 'effects' | 'drawing'

/**
 * `sections` permite armar los grupos del modo simple (Texto / Diseñar) con el mismo panel.
 * `editOnInsert`: el globo o texto insertado entra directo en edición (modo simple).
 */
export function InsertPanel({ sections, editOnInsert = false }: { sections?: InsertSection[]; editOnInsert?: boolean } = {}) {
  const has = (k: InsertSection) => !sections || sections.includes(k)
  const format = useEditor((s) => s.project!.format)
  const scale = format.width / 900
  const add = useEditor((s) => s.addElements)
  // Las fuentes de las onomatopeyas se piden recién cuando se abre este panel.
  useEffect(() => requireFonts([...SFX.map((g) => g.font), ...TEXT_PRESETS.map((p) => p.patch.fontFamily ?? '')]), [])
  // Cada inserción busca un lugar libre y visible (en la viñeta seleccionada, si hay una).
  const center = (w: number, h: number) => placementFor(w, h)

  const addBubble = (shape: BubbleShape) => {
    const b = createBubble(shape, 0, 0, scale)
    Object.assign(b, center(b.width, b.height))
    add([b])
    if (editOnInsert) setTimeout(() => useEditor.getState().setEditingText(b.id), 120)
  }
  const addText = (patch: Partial<TextElement>, name?: string) => {
    const t = createText(0, 0, { id: 'x', label: name ?? 'Texto', patch: { ...patch, fontSize: Math.round((patch.fontSize ?? 60) * scale) } })
    const script = detectScript(t.text)
    // Los SFX en CJK suelen ir en vertical en manga.
    if (script !== 'latin' && [...t.text].length >= 3 && script === 'ja') {
      t.vertical = true
      t.width = Math.round(t.fontSize * 1.6)
      t.height = Math.round([...t.text].length * t.fontSize * 1.05 + 20)
    } else if (script !== 'latin') {
      t.width = Math.round([...t.text].length * t.fontSize * 1.1 + 40)
    }
    Object.assign(t, center(t.width, t.height))
    ensureGlyphs(t.fontFamily, t.text)
    add([t])
    if (editOnInsert && script === 'latin' && !patch.text) setTimeout(() => useEditor.getState().setEditingText(t.id), 120)
  }
  const addShape = (kind: ShapeKind) => {
    const el = createShape(kind, 0, 0, Math.round(160 * scale))
    Object.assign(el, center(el.width, el.height))
    add([el])
  }
  const addEffect = (kind: EffectKind) => {
    const sel = useEditor.getState().selection
    const panel = currentPage()?.elements.find((e) => e.type === 'panel' && sel.includes(e.id))
    // Si hay una viñeta seleccionada, el efecto la cubre exacta.
    const box = panel ?? { x: format.width * 0.15, y: format.height * 0.15, width: format.width * 0.7, height: format.height * 0.4, rotation: 0 }
    const e = createEffect(kind, box.x, box.y, box.width, box.height)
    e.rotation = box.rotation
    if (kind === 'screentone' || kind === 'gradient-tone') {
      e.density = Math.max(6, Math.round(10 * scale))
      e.dotSize = kind === 'screentone' ? 2.4 * scale : 7 * scale
      e.blend = 'multiply'
    }
    const els = currentPage()?.elements ?? []
    const idx = panel ? els.findIndex((x) => x.id === panel.id) + 1 : undefined
    add([e], { index: idx })
  }

  return (
    <div>
      {has('bubbles') && (
        <Section title="Globos">
          <div className="grid grid-cols-3 gap-2">
            {BUBBLES.map((b) => (
              <button key={b.shape} onClick={() => addBubble(b.shape)} className="flex flex-col items-center gap-1 rounded-lg bg-ink-900 p-2 ring-1 ring-ink-700 transition-colors hover:ring-accent">
                <svg viewBox="0 0 48 44" className="h-9 w-10">
                  <path d={b.path} fill="#fff" stroke="#111" strokeWidth={2} strokeLinejoin="round" strokeDasharray={b.dash ? '3 2' : undefined} />
                </svg>
                <span className="text-[10px] text-ink-300">{b.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {has('texts') && (
        <Section title="Textos">
          <div className="grid grid-cols-2 gap-2">
            {TEXT_PRESETS.map((p) => (
              <button key={p.id} onClick={() => addText(p.patch, p.label)} className="flex h-14 items-center justify-center overflow-hidden rounded-lg bg-ink-900 px-2 ring-1 ring-ink-700 transition-colors hover:ring-accent">
                <span
                  style={{
                    fontFamily: p.patch.fontFamily,
                    color: p.patch.textColor === '#111111' ? '#fff' : p.patch.textColor,
                    fontWeight: p.patch.fontStyle?.includes('bold') ? 700 : 400,
                    WebkitTextStroke: p.patch.strokeWidth ? `1px ${p.patch.stroke === '#ffffff' ? '#111' : p.patch.stroke}` : undefined,
                    transform: p.patch.skewX ? `skewX(${p.patch.skewX * -40}deg)` : undefined,
                  }}
                  className="truncate text-lg"
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {has('sfx') && (
        <Section title="Onomatopeyas (SFX)">
          {SFX.map((g) => (
            <div key={g.lang}>
              <div className="mb-1.5 text-[11px] text-ink-400">{g.lang}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map(([t, desc]) => (
                  <button
                    key={t}
                    title={desc}
                    onClick={() => addText({ text: t, fontFamily: g.font, fontSize: 90, textColor: '#111111', stroke: '#ffffff', strokeWidth: 6, skewX: 0, shadow: false, uppercase: false, letterSpacing: 0 }, t)}
                    className="rounded-md bg-ink-900 px-2 py-1 text-sm text-white ring-1 ring-ink-700 transition-colors hover:ring-accent"
                    style={{ fontFamily: g.font }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-ink-500">Podés escribir en cualquier idioma con el teclado de tu sistema (IME). En Propiedades activá "Vertical" para rotular en tategaki.</p>
        </Section>
      )}

      {has('shapes') && (
        <Section title="Formas y símbolos">
          {(['Formas', 'Símbolos'] as const).map((group) => (
            <div key={group}>
              <div className="mb-1.5 text-[11px] text-ink-400">{group}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPE_DEFS.filter((d) => d.group === group).map((d) => (
                  <button key={d.id} onClick={() => addShape(d.id)} title={d.label} aria-label={`Insertar ${d.label}`} className="flex aspect-square items-center justify-center rounded-lg bg-ink-900 ring-1 ring-ink-700 transition-colors hover:ring-accent">
                    <svg viewBox="-2 -2 28 28" className="size-7" aria-hidden>
                      <path
                        d={shapeSvgPath(d.cmds)}
                        fill={d.mode === 'fill' ? (d.fill === '#111111' ? '#e5e5e5' : d.fill) : 'none'}
                        stroke={d.mode === 'fill' ? '#111' : d.stroke === '#111111' ? '#e5e5e5' : d.stroke}
                        strokeWidth={d.mode === 'fill' ? 1.2 : 2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}

      {has('effects') && (
        <Section title="Efectos manga">
          <div className="space-y-1.5">
            {EFFECTS.map((e) => (
              <button key={e.kind} onClick={() => addEffect(e.kind)} className="flex w-full items-center gap-3 rounded-lg bg-ink-900 p-2 text-left ring-1 ring-ink-700 transition-colors hover:ring-accent">
                <EffectIcon kind={e.kind} />
                <span>
                  <span className="block text-xs font-medium text-white">{e.label}</span>
                  <span className="block text-[10px] text-ink-400">{e.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-500">Con una viñeta seleccionada, el efecto se ajusta a ella.</p>
        </Section>
      )}

      {has('drawing') && (
        <Section title="Dibujo">
          <button
            onClick={() => {
              const d = createDrawing(format.width, format.height)
              add([d])
              useEditor.getState().setTool('brush')
            }}
            className="flex w-full items-center gap-3 rounded-lg bg-ink-900 p-2 text-left ring-1 ring-ink-700 transition-colors hover:ring-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-ink-700 text-accent-bright">
              <Layers size={16} />
            </span>
            <span>
              <span className="block text-xs font-medium text-white">Nueva capa de dibujo</span>
              <span className="block text-[10px] text-ink-400">Bocetos, entintado y color por separado</span>
            </span>
          </button>
          <button onClick={() => useEditor.getState().setTool('brush')} className="flex w-full items-center gap-3 rounded-lg bg-ink-900 p-2 text-left ring-1 ring-ink-700 transition-colors hover:ring-accent">
            <span className="flex size-8 items-center justify-center rounded-md bg-ink-700 text-accent-bright">
              <Brush size={16} />
            </span>
            <span>
              <span className="block text-xs font-medium text-white">Pincel (B)</span>
              <span className="block text-[10px] text-ink-400">Sensible a la presión en tabletas y lápices</span>
            </span>
          </button>
        </Section>
      )}
    </div>
  )
}

function EffectIcon({ kind }: { kind: EffectKind }) {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0 rounded-md bg-white">
      {kind === 'focuslines' &&
        Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          return <line key={i} x1={16 + Math.cos(a) * 7} y1={16 + Math.sin(a) * 7} x2={16 + Math.cos(a) * 22} y2={16 + Math.sin(a) * 22} stroke="#111" strokeWidth={1.2} />
        })}
      {kind === 'speedlines' && [5, 9, 13, 17, 21, 25].map((y, i) => <line key={y} x1={i % 2 ? 6 : 2} y1={y} x2={30} y2={y} stroke="#111" strokeWidth={1.1} />)}
      {kind === 'screentone' && Array.from({ length: 36 }, (_, i) => <circle key={i} cx={3 + (i % 6) * 5.2} cy={3 + Math.floor(i / 6) * 5.2} r={1.1} fill="#111" />)}
      {kind === 'gradient-tone' && Array.from({ length: 36 }, (_, i) => <circle key={i} cx={3 + (i % 6) * 5.2} cy={3 + Math.floor(i / 6) * 5.2} r={0.3 + Math.floor(i / 6) * 0.4} fill="#111" />)}
    </svg>
  )
}
