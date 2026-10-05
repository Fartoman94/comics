import { Moon, Sun } from 'lucide-react'
import { useUi } from '../../store/ui'
import { IconButton } from './controls'

/** Botón día/noche. La elección queda guardada en el navegador de cada usuario. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUi((s) => s.theme)
  const light = theme === 'light'
  return (
    <IconButton label={light ? 'Modo noche (oscuro)' : 'Modo día (claro)'} aria-pressed={light} className={className} onClick={() => useUi.getState().setTheme(light ? 'dark' : 'light')}>
      {light ? <Moon size={16} /> : <Sun size={16} />}
    </IconButton>
  )
}
