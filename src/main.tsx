import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { registerServiceWorker } from './lib/pwa'
import { applyTheme, readTheme } from './lib/theme'

// El tema guardado se aplica antes del primer render (sin parpadeo de un tema a otro).
applyTheme(readTheme())

// Si falla la precarga de un chunk (deploy nuevo mientras la app estaba abierta), se recarga una vez.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  void import('./lib/lazyWithReload').then((m) => m.reloadForNewVersion())
})


registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
