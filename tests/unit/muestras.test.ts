import { describe, expect, it } from 'vitest'
import type { WorkDef } from '../../src/samples/types'
import { validateWork } from '../../src/samples/validate'

// Valida los guiones de las muestras premium (30+ páginas, viñetas que coinciden con el layout,
// personajes, escenarios y textos dentro de los límites).
const mods = import.meta.glob<{ work: WorkDef }>('../../src/samples/works/*.ts', { eager: true })

describe('muestras premium', () => {
  for (const [path, mod] of Object.entries(mods)) {
    it(`${path.split('/').pop()} es válida`, () => {
      expect(mod.work, 'el archivo debe exportar `work`').toBeTruthy()
      expect(validateWork(mod.work)).toEqual([])
    })
  }
})
