import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useFocusTrap } from './useFocusTrap'
import { X } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export { cx }

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover',
        variant === 'secondary' && 'bg-ink-700 text-ink-100 hover:bg-ink-600',
        variant === 'ghost' && 'text-ink-200 hover:bg-ink-700',
        variant === 'danger' && 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({ active, className, label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-35',
        active ? 'bg-accent text-white' : 'text-ink-300 hover:bg-ink-700 hover:text-ink-100',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-b border-ink-700 px-4 py-3.5 last:border-b-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{title}</h3>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export function Field({ label, children, inline = true }: { label: string; children: ReactNode; inline?: boolean }) {
  return (
    <label className={cx('flex gap-2 text-xs text-ink-300', inline ? 'items-center justify-between' : 'flex-col')}>
      <span className="shrink-0">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'h-8 w-full rounded-md border border-ink-600 bg-ink-900 px-2 text-xs text-ink-100 outline-none focus:border-accent'

export function TextInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <input className={cx(inputCls, className)} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      className="w-full resize-y rounded-md border border-ink-600 bg-ink-900 p-2 text-xs leading-relaxed text-ink-100 outline-none focus:border-accent"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/** Input numérico que confirma al perder foco o con Enter (no pelea con el tipeo). */
export function NumberInput({ value, onChange, min, max, step = 1, suffix, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(Math.round(value * 100) / 100)
  const commit = () => {
    if (draft === null) return
    let n = Number(draft.replace(',', '.'))
    if (!Number.isFinite(n)) n = value
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    setDraft(null)
    if (n !== value) onChange(n)
  }
  return (
    <div className={cx('relative', className)}>
      <input
        className={cx(inputCls, suffix && 'pr-6', 'tabular-nums')}
        value={shown}
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1)
            let n = value + d
            if (min !== undefined) n = Math.max(min, n)
            if (max !== undefined) n = Math.min(max, n)
            setDraft(null)
            onChange(n)
          }
        }}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-ink-400">{suffix}</span>}
    </div>
  )
}

export function Slider({ label, value, onChange, min, max, step = 1, format }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  return (
    <div className="text-xs text-ink-300">
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="text-ink-200 tabular-nums">{format ? format(value) : Math.round(value * 100) / 100}</span>
      </div>
      <input type="range" aria-label={label} aria-valuetext={format ? format(value) : undefined} className="h-1.5 w-full cursor-pointer" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export const SWATCHES = ['#111111', '#ffffff', '#6b7280', '#ef4444', '#ff5a36', '#f59e0b', '#ffd23f', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#fde7c9', '#7c4a2d']

export function ColorInput({ value, onChange, swatches = false, label = 'Color' }: { value: string; onChange: (v: string) => void; swatches?: boolean; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label}: elegir`} value={toHex(value)} onChange={(e) => onChange(e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-md ring-1 ring-ink-600" />
        <input aria-label={`${label}: código`} className={cx(inputCls, 'font-mono uppercase')} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {swatches && (
        <div className="flex flex-wrap gap-1">
          {SWATCHES.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => onChange(c)}
              className={cx('size-5 rounded ring-1 ring-ink-600 transition-transform hover:scale-110', c.toLowerCase() === value.toLowerCase() && 'ring-2 ring-accent')}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function toHex(v: string) {
  return /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000'
}

export function Select<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <select className={cx(inputCls, 'cursor-pointer', className)} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-ink-300">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-ink-600')}
      >
        <span className={cx('absolute top-0.5 size-4 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </label>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[] }) {
  return (
    <div className="flex rounded-md bg-ink-900 p-0.5 ring-1 ring-ink-600">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx('flex h-7 flex-1 items-center justify-center rounded text-xs transition-colors', value === o.value ? 'bg-ink-600 text-white' : 'text-ink-300 hover:text-ink-100')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  const box = useRef<HTMLDivElement>(null)
  useFocusTrap(box, open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} tabIndex={-1} className={cx('max-h-[90vh] w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 shadow-2xl outline-none', width)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
          <h2 className="text-sm font-semibold" id={`dlg-${title.replace(/\W+/g, '-')}`}>
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="scroll-thin max-h-[calc(90vh-56px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Menu({ trigger, children, align = 'left' }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className={cx('absolute top-full z-40 mt-1.5 min-w-56 rounded-xl border border-ink-600 bg-ink-800 p-1 shadow-2xl', align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, label, hint, onClick, disabled, danger, className }: { icon?: ReactNode; label: string; hint?: string; onClick: () => void; disabled?: boolean; danger?: boolean; className?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-ink-700 disabled:opacity-40 pointer-coarse:min-h-11', danger ? 'text-red-300' : 'text-ink-100', className)}
    >
      {icon && <span className="text-ink-300">{icon}</span>}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] text-ink-400">{hint}</span>}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-ink-600 bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-ink-200">{children}</kbd>
}
