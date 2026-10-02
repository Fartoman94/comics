import { cx } from './controls'

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cx('shrink-0', className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1c1c22" />
      <rect x="9" y="11" width="21" height="24" rx="2" fill="none" stroke="#f5f5f4" strokeWidth="3.5" />
      <rect x="34" y="11" width="21" height="14" rx="2" fill="#ff5a36" />
      <rect x="34" y="29" width="21" height="24" rx="2" fill="none" stroke="#f5f5f4" strokeWidth="3.5" />
      <rect x="9" y="39" width="21" height="14" rx="2" fill="none" stroke="#f5f5f4" strokeWidth="3.5" />
    </svg>
  )
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <AppLogo className={compact ? 'size-7' : 'size-9'} />
      <div className="leading-none">
        <div className={cx('font-comic tracking-wide text-white', compact ? 'text-lg' : 'text-2xl')}>
          VIÑETA <span className="text-accent-bright">STUDIO</span>
        </div>
        {!compact && <div className="mt-1 text-[11px] text-ink-400">Cómic · Manga · Webtoon</div>}
      </div>
    </div>
  )
}

export const MATELABS_URL = 'https://matelabs.site/'

/** Crédito del creador: MateLabs, con su logo oficial. */
export function MadeByMateLabs({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <a
      href={MATELABS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cx('group inline-flex items-center gap-1.5 text-ink-400 transition-colors hover:text-ink-200', size === 'sm' ? 'text-[11px]' : 'text-xs', className)}
    >
      <span>Creado por</span>
      <img src="/brand/matelabs-logo.png" alt="" className={cx('object-contain transition-transform group-hover:-translate-y-px', size === 'sm' ? 'size-4' : 'size-5')} />
      <span className="font-semibold text-mate group-hover:text-emerald-300">MateLabs</span>
    </a>
  )
}
