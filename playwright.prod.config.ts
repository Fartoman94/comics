import { defineConfig, devices } from '@playwright/test'

// Pruebas contra el build de producción (vite preview con los mismos headers que Vercel):
// CSP, assets inexistentes, actualización entre builds y uso sin conexión.
const PORT = Number(process.env.E2E_PROD_PORT ?? 4791)

export default defineConfig({
  testDir: 'tests/e2e-prod',
  timeout: 90_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'es-AR',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PW_CHROME || undefined },
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
