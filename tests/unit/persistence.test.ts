import { describe, expect, it, vi } from 'vitest'

const writes: { id: string; title: string }[] = []
vi.mock('../../src/lib/storage', () => ({
  saveProject: async (p: { id: string; title: string }) => {
    // la primera escritura tarda más: si no se serializara, la vieja pisaría a la nueva
    await new Promise((r) => setTimeout(r, writes.length === 0 ? 30 : 1))
    writes.push({ id: p.id, title: p.title })
  },
}))
const { enqueueSave, settleSaves } = await import('../../src/lib/persistence')

describe('enqueueSave', () => {
  it('escribe en orden y nunca deja que un guardado viejo pise uno nuevo', async () => {
    const p = (title: string) => ({ id: 'pr_1', title }) as never
    void enqueueSave(p('rev 1'), 1)
    void enqueueSave(p('rev 3'), 3)
    void enqueueSave(p('rev 2 (tardío)'), 2)
    void enqueueSave(p('rev 3'), 3)
    await settleSaves()
    expect(writes.map((w) => w.title)).toEqual(['rev 1', 'rev 3'])
  })
})
