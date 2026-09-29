export function uid(prefix = ''): string {
  const rnd = crypto.getRandomValues(new Uint32Array(2))
  return prefix + rnd[0].toString(36) + rnd[1].toString(36).slice(0, 4)
}
