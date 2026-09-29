export type FontScript = 'latin' | 'ja' | 'ko' | 'zh'

export const FONTS: { family: string; label: string; use: string; script: FontScript }[] = [
  { family: 'Comic Neue', label: 'Comic Neue', use: 'Diálogo', script: 'latin' },
  { family: 'Bangers', label: 'Bangers', use: 'Títulos / SFX', script: 'latin' },
  { family: 'Luckiest Guy', label: 'Luckiest Guy', use: 'SFX', script: 'latin' },
  { family: 'Permanent Marker', label: 'Permanent Marker', use: 'Rotulado a mano', script: 'latin' },
  { family: 'Kalam', label: 'Kalam', use: 'Manuscrita', script: 'latin' },
  { family: 'Bubblegum Sans', label: 'Bubblegum Sans', use: 'Infantil', script: 'latin' },
  { family: 'Special Elite', label: 'Special Elite', use: 'Máquina de escribir', script: 'latin' },
  { family: 'Inter', label: 'Inter', use: 'Neutra', script: 'latin' },
  { family: 'Noto Sans JP', label: 'Noto Sans JP', use: '日本語 · diálogo manga', script: 'ja' },
  { family: 'Noto Serif JP', label: 'Noto Serif JP', use: '日本語 · narración', script: 'ja' },
  { family: 'Dela Gothic One', label: 'Dela Gothic One', use: '日本語 · SFX fuerte', script: 'ja' },
  { family: 'Yusei Magic', label: 'Yusei Magic', use: '日本語 · a mano', script: 'ja' },
  { family: 'Noto Sans KR', label: 'Noto Sans KR', use: '한국어 · diálogo', script: 'ko' },
  { family: 'Black Han Sans', label: 'Black Han Sans', use: '한국어 · SFX', script: 'ko' },
  { family: 'Noto Sans SC', label: 'Noto Sans SC', use: '简体中文', script: 'zh' },
  { family: 'Noto Sans TC', label: 'Noto Sans TC', use: '繁體中文', script: 'zh' },
  { family: 'ZCOOL KuaiLe', label: 'ZCOOL KuaiLe', use: '中文 · SFX', script: 'zh' },
]

// Las fuentes CJK de Google se parten por rangos unicode: hay que pedir glifos de muestra.
const SAMPLE: Record<FontScript, string> = {
  latin: 'AaÑñ¡!',
  ja: 'あア漢ドン！',
  ko: '한국어쾅',
  zh: '中文轰砰',
}

let ready: Promise<void> | null = null

/** Konva dibuja en canvas: hay que esperar a que las fuentes estén cargadas. */
export function loadFonts(): Promise<void> {
  if (!ready) {
    ready = Promise.all(
      FONTS.flatMap((f) => [
        document.fonts.load(`400 32px "${f.family}"`, SAMPLE[f.script]),
        document.fonts.load(`700 32px "${f.family}"`, SAMPLE[f.script]),
      ]),
    )
      .then(() => undefined)
      .catch(() => undefined)
  }
  return ready
}

/** Carga los glifos exactos de un texto (útil para kanji poco comunes). */
export function loadGlyphs(family: string, text: string, bold = false) {
  return document.fonts.load(`${bold ? 700 : 400} 32px "${family}"`, text).catch(() => [])
}

export function detectScript(text: string): FontScript {
  if (/[぀-ヿ]/.test(text)) return 'ja'
  if (/[가-힯ᄀ-ᇿ]/.test(text)) return 'ko'
  if (/[一-鿿]/.test(text)) return 'zh'
  return 'latin'
}

/** Carga los glifos de un texto y avisa al lienzo para que redibuje. */
export function ensureGlyphs(family: string, text: string) {
  if (!text) return
  void Promise.all([loadGlyphs(family, text, false), loadGlyphs(family, text, true)]).then(() => window.dispatchEvent(new Event('vineta:fonts')))
}
