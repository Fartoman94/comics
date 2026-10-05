/** Con la imagen girada 90° o 270°, su ancho y alto visibles se intercambian. */
const quarterTurn = (rotation = 0) => Math.abs(Math.round(rotation / 90)) % 2 === 1

/** Encaje "cover": la imagen llena la viñeta sin deformarse (teniendo en cuenta el giro). */
export function coverFit(panel: { width: number; height: number }, asset: { width: number; height: number }, rotation = 0) {
  const [aw, ah] = quarterTurn(rotation) ? [asset.height, asset.width] : [asset.width, asset.height]
  const scale = Math.max(panel.width / aw, panel.height / ah)
  // x/y son la esquina de la imagen sin girar: así el centro queda en el centro de la viñeta.
  return { x: (panel.width - asset.width * scale) / 2, y: (panel.height - asset.height * scale) / 2, scale }
}

/** Encaje "contain": la imagen entera dentro de la viñeta. */
export function containFit(panel: { width: number; height: number }, asset: { width: number; height: number }, rotation = 0) {
  const [aw, ah] = quarterTurn(rotation) ? [asset.height, asset.width] : [asset.width, asset.height]
  const scale = Math.min(panel.width / aw, panel.height / ah)
  return { x: (panel.width - asset.width * scale) / 2, y: (panel.height - asset.height * scale) / 2, scale }
}
