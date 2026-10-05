/**
 * Muestras premium: cada obra se describe con estos datos. La misma fuente genera la
 * preproducción (biblia, mundo, estructura y guion por páginas en Markdown) y el proyecto real
 * de Viñeta Studio (páginas, viñetas, imágenes, globos, onomatopeyas y efectos).
 */

/** Estilo visual de la obra: decide paleta, línea, color o B/N y tramas. */
export type StyleId = 'western' | 'shonen' | 'seinen' | 'shojo' | 'webtoon' | 'anime'

/** Escenarios disponibles (cada estilo los dibuja a su manera). */
export const SCENES = [
  // Ciudad / urbano
  'city-night', 'city-day', 'street', 'alley', 'rooftop', 'harbor', 'bridge', 'rain-street', 'subway', 'station', 'market', 'police',
  // Interiores
  'apartment', 'room-dark', 'bedroom', 'office', 'lab', 'corridor', 'stairwell', 'bar', 'hardware-store', 'post-office', 'hospital',
  // Escuela / arte
  'school-hall', 'classroom', 'music-room', 'concert-hall', 'art-wall',
  // Naturaleza / fantasía
  'park', 'garden', 'forest', 'cliff', 'beach', 'island-sky', 'village', 'academy', 'arena', 'dojo', 'ruins', 'storm-sky', 'moon-town',
  // Industria / sci-fi
  'power-plant', 'space', 'orbital-ring', 'hangar', 'cockpit', 'control-room',
  // Cielos y fondos abstractos
  'sky-day', 'sky-night', 'sunset', 'white', 'black', 'speed', 'focus', 'flowers', 'sparkles', 'tone',
] as const
export type SceneId = (typeof SCENES)[number]

export const EXPRESSIONS = ['neutral', 'happy', 'grin', 'laugh', 'angry', 'furious', 'sad', 'crying', 'surprised', 'shocked', 'determined', 'smirk', 'shy', 'scared', 'tired', 'thinking', 'serious', 'pain'] as const
export type Expr = (typeof EXPRESSIONS)[number]

export const POSES = ['stand', 'arms-crossed', 'point', 'fist', 'punch', 'run', 'fly', 'sit', 'hands-hips', 'reach', 'guard', 'wave', 'cover-face', 'hold', 'fall', 'kneel'] as const
export type Pose = (typeof POSES)[number]

/** Encuadre del personaje en la viñeta. */
export const FRAMINGS = ['eyes', 'face', 'bust', 'half', 'full', 'back', 'silhouette'] as const
export type Framing = (typeof FRAMINGS)[number]

export type TimeOfDay = 'day' | 'sunset' | 'night'
export type Angle = 'normal' | 'low' | 'high' | 'dutch'
/** Efectos dibujados dentro de la ilustración (los efectos del editor van aparte, en `fx`). */
export type ArtExtra = 'rain' | 'snow' | 'petals' | 'sparkles' | 'lightning' | 'explosion' | 'wind' | 'glow' | 'smoke' | 'stars' | 'blood-free-impact' | 'tears' | 'sweat' | 'blush' | 'shadow-face' | 'flowers' | 'bubbles-soft' | 'electric' | 'energy' | 'dust'

export interface CastInShot {
  /** id de un personaje de la obra. */
  id: string
  expr?: Expr
  pose?: Pose
  framing?: Framing
  /** Posición horizontal del personaje en la viñeta: 0 = izquierda, 1 = derecha (0.5 por defecto). */
  x?: number
  /** Mira hacia la izquierda (espejado). */
  flip?: boolean
  /** Escala extra (1 = normal). */
  scale?: number
}

export interface Shot {
  bg: SceneId
  time?: TimeOfDay
  angle?: Angle
  chars?: CastInShot[]
  extras?: ArtExtra[]
  /** Objeto o detalle en primer plano cuando no hay personajes (p. ej. "reloj", "carta", "mano"). */
  prop?: Prop
}

export type Prop = 'letter' | 'phone' | 'clock' | 'hand' | 'fist' | 'eye' | 'door' | 'key' | 'sword' | 'glider' | 'piano' | 'brush' | 'note' | 'photo' | 'lamp' | 'cable' | 'badge' | 'helmet' | 'moon' | 'ring' | 'mask' | 'feather' | 'cup' | 'umbrella' | 'blueprint'

export type LineKind = 'dialogue' | 'thought' | 'shout' | 'whisper' | 'caption' | 'narration' | 'impact'

export interface Line {
  /** id del personaje que habla (para la cola del globo). Vacío en narraciones. */
  who?: string
  kind: LineKind
  text: string
}

export interface Sfx {
  text: string
  /** 'big' ocupa media viñeta, 'small' es un sonido de fondo. */
  size?: 'big' | 'medium' | 'small'
  color?: string
  /** Giro en grados. */
  rotate?: number
}

/** Efecto del editor sobre la viñeta (líneas de velocidad, impacto, tramas). */
export type PanelFx = 'speedlines' | 'focuslines' | 'screentone' | 'gradient-tone'

export interface PanelDef {
  shot: Shot
  lines?: Line[]
  sfx?: Sfx[]
  fx?: PanelFx
}

/** Distribución de viñetas: una plantilla del editor o cajas propias normalizadas [x, y, w, h] (0..1). */
export type Layout = { template: string } | { boxes: [number, number, number, number][] }

export interface PageDef {
  /** Objetivo narrativo de la página. */
  objective: string
  /** Qué sucede. */
  summary: string
  /** Tono emocional. */
  tone: string
  /** Tipo de composición (por qué esta distribución). */
  composition: string
  layout: Layout
  panels: PanelDef[]
  notes?: string
}

export interface CharacterDef {
  id: string
  name: string
  age: string
  role: 'protagonista' | 'antagonista' | 'rival' | 'mentor' | 'secundario' | 'aliado'
  personality: string
  goal: string
  fear: string
  flaw: string
  arc: string
  relations: string
  physical: string
  visualTraits: string
  outfit: string
  expressions: string
  speech: string
  rig: RigSpec
}

/** Cómo se dibuja un personaje (consistente en toda la obra). */
export interface RigSpec {
  gender: 'f' | 'm' | 'x'
  /** 'young' (niño/adolescente), 'adult', 'old'. */
  age: 'young' | 'adult' | 'old'
  build?: 'slim' | 'average' | 'strong' | 'small'
  skin: string
  hair: { style: HairStyle; color: string }
  eyes: { color: string }
  outfit: { kind: OutfitKind; main: string; accent: string }
  accessory?: Accessory
  /** Rasgo distintivo (cicatriz, lunar, gafas…). */
  mark?: 'scar' | 'mole' | 'glasses' | 'eyepatch' | 'freckles' | 'bandage' | 'beard' | 'stubble' | 'mech-arm' | 'headphones' | 'earring'
}

export type HairStyle = 'short' | 'spiky' | 'messy' | 'buzz' | 'slick' | 'long' | 'long-wavy' | 'bob' | 'ponytail' | 'twintails' | 'braid' | 'bun' | 'bald' | 'mohawk' | 'side-swept'
export type OutfitKind = 'hoodie' | 'jacket' | 'tshirt' | 'suit' | 'coat' | 'school-f' | 'school-m' | 'uniform' | 'armor' | 'flight-suit' | 'dress' | 'robe' | 'apron' | 'workwear' | 'cape-hero' | 'kimono' | 'sweater' | 'lab-coat'
export type Accessory = 'scarf' | 'goggles' | 'headband' | 'cap' | 'hat' | 'bag' | 'cape' | 'necklace' | 'ribbon' | 'visor' | 'satchel'

export interface WorldDef {
  setting: string
  rules: string[]
  era: string
  aesthetic: string
  places: { name: string; description: string }[]
  conflicts: string[]
  culture: string[]
}

export interface StructureDef {
  inicio: string
  desarrollo: string
  climax: string
  cierre: string
  giros: string[]
  cliffhangers: string[]
  escenasClave: string[]
  ritmo: string
}

export interface CoverDef {
  shot: Shot
  title: string
  subtitle?: string
  tagline: string
}

export interface WorkDef {
  id: string
  title: string
  subtitle?: string
  genre: string
  style: StyleId
  /** Tipo de proyecto del editor y formato de página. */
  kind: 'comic' | 'manga' | 'webtoon' | 'libre'
  formatId: string
  readingDirection: 'ltr' | 'rtl' | 'vertical'
  tone: string
  audience: string
  logline: string
  synopsis: string
  visualProposal: string
  world: WorldDef
  structure: StructureDef
  characters: CharacterDef[]
  cover: CoverDef
  altCover?: CoverDef
  pages: PageDef[]
}
