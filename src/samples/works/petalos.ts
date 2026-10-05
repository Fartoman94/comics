import type { CastInShot, Expr, Framing, Line, Pose, WorkDef } from '../types'

// ───────────────────────── Ayudantes de guion ─────────────────────────
// Convención de lectura: lo que se dice en Lengua de Señas Argentina (LSA) va como diálogo con
// el prefijo «(en señas)». Lo que Ian dice en voz alta va como diálogo normal.

type Opt = { pose?: Pose; x?: number; flip?: boolean; scale?: number }
const cast = (id: string) => (expr: Expr, framing: Framing = 'bust', o: Opt = {}): CastInShot => ({ id, expr, framing, ...o })
const val = cast('valeria')
const ian = cast('ian')
const cam = cast('camila')
const mama = cast('monica')
const tito = cast('tito')
const mar = cast('martina')

const d = (who: string, text: string): Line => ({ who, kind: 'dialogue', text })
const sg = (who: string, text: string): Line => ({ who, kind: 'dialogue', text: `«(en señas)» ${text}` })
const th = (who: string, text: string): Line => ({ who, kind: 'thought', text })
const wh = (who: string, text: string): Line => ({ who, kind: 'whisper', text })
const sh = (who: string, text: string): Line => ({ who, kind: 'shout', text })
const cap = (text: string): Line => ({ kind: 'caption', text })
const nar = (text: string): Line => ({ kind: 'narration', text })

// Cajas propias (lectura de derecha a izquierda: la primera viñeta va a la derecha).
const TALL_R: [number, number, number, number][] = [[0.52, 0.02, 0.46, 0.96], [0.02, 0.02, 0.48, 0.47], [0.02, 0.51, 0.48, 0.47]]
const CASCADE: [number, number, number, number][] = [[0.4, 0.02, 0.58, 0.4], [0.02, 0.02, 0.36, 0.6], [0.4, 0.44, 0.58, 0.18], [0.02, 0.64, 0.96, 0.34]]
const FLOAT: [number, number, number, number][] = [[0.02, 0.02, 0.96, 0.55], [0.6, 0.59, 0.38, 0.39], [0.02, 0.59, 0.56, 0.39]]
const STRIPS: [number, number, number, number][] = [[0.02, 0.02, 0.96, 0.22], [0.52, 0.26, 0.46, 0.72], [0.02, 0.26, 0.48, 0.35], [0.02, 0.63, 0.48, 0.35]]
const VEIL: [number, number, number, number][] = [[0.62, 0.02, 0.36, 0.66], [0.32, 0.02, 0.28, 0.66], [0.02, 0.02, 0.28, 0.66], [0.02, 0.7, 0.96, 0.28]]

export const work: WorkDef = {
  id: 'petalos',
  title: 'PÉTALOS EN DIFERIDO',
  subtitle: 'Volumen 1 · Lo que se escucha con las manos',
  genre: 'Shojo · romance dramático · drama escolar musical',
  style: 'shojo',
  kind: 'manga',
  formatId: 'manga-tankobon',
  readingDirection: 'rtl',
  tone: 'Delicado, luminoso y vulnerable, con humor filoso de diálogo rioplatense. La tristeza nunca es pesada: siempre hay una ventana abierta, un pétalo que cae, una broma a tiempo. El romance avanza por gestos (manos, miradas, una nota tocada) más que por declaraciones.',
  audience: 'Lectores juveniles y adultos jóvenes (13+) que aman el shojo emotivo, la música y las historias de crecimiento; también lectores interesados en la cultura sorda y la LSA.',
  logline: 'Una pianista prodigio que se congeló en pleno concurso y un muralista hipoacúsico que escucha la música con las manos se encuentran frente a una pared gris: mientras él pinta un jacarandá, ella tiene que decidir si vuelve a tocar para alguien más que para el silencio.',
  synopsis: [
    'Hace un año, Valeria Ortiz —dieciséis años, oído absoluto, lengua de navaja— se quedó con las manos congeladas sobre el teclado en la final del Certamen Nacional. Desde entonces no tocó más en público, tapó el piano de su casa con un mantel y aprendió a esconder el miedo detrás del sarcasmo. Su madre, Mónica, ex pianista que abandonó su propia carrera, no deja de dejarle sobre la mesa el afiche del Certamen Regional de noviembre.',
    'Entonces llega Ian Ferraro: hipoacúsico, usuario de audífono y de Lengua de Señas Argentina, con las manos siempre manchadas de pintura y una franqueza que desarma. Ian consigue permiso para pintar un mural en la pared más fea del colegio: un jacarandá gigante. Y descubre algo que nadie sabía: que Valeria vuelve a tocar cuando cree que nadie la escucha. Ian, acostado en el piso de la sala de música, siente su piano en el pecho y en las palmas. Para él, el silencio no es un abismo: es casa.',
    'Pero el vínculo se resquebraja cuando Ian le lee los labios a Valeria diciendo que "con él es fácil tocar porque no oye los errores". Él, cansado de que lo traten como frágil, se aleja; el mural queda a medio pintar. Camila, la mejor amiga y violinista estrella del colegio, que también se enamoró de Ian y aprendió señas en secreto, tiene en sus manos la verdad que puede unirlos o separarlos para siempre.',
    'En el Certamen Regional, frente al mismo silencio que la paralizó, Valeria encuentra la mano de Ian apoyada sobre la tapa del piano. Toca para que él la sienta, y por primera vez para ella misma. Bajo los jacarandás que sueltan pétalos sobre la vereda, los dos se dicen lo que sienten en dos idiomas a la vez. El mural queda casi terminado: con un hueco en blanco para lo que todavía no saben.',
  ].join('\n\n'),
  visualProposal: 'Shojo clásico revisitado: línea fina y variable, ojos grandes con brillos múltiples, tramas suaves (screentone, gradient-tone) en lugar de negros pesados. El color de la obra es el lila de los jacarandás: aparece en flores, pétalos, cintas y pintura, y se intensifica en los momentos de conexión. Viñetas aireadas, márgenes amplios, cajas altas que se superponen como pétalos cayendo; las escenas íntimas usan fondos abstractos (flores, brillos, trama) para salir del espacio físico y entrar en el emocional. Símbolos recurrentes: las manos (congeladas, manchadas de pintura, apoyadas sobre madera), el piano tapado, el mural sin terminar y el contraste silencio/sonido, representado con viñetas sin globos y onomatopeyas mínimas. Las señas se rotulan con «(en señas)» y se dibujan con líneas de movimiento suaves alrededor de las manos.',
  world: {
    setting: 'Buenos Aires, barrio de Palermo y alrededores, en octubre y noviembre: la estación en que las veredas se tiñen de violeta por los jacarandás. La mayor parte transcurre en la Escuela de Música y Artes "Rosa Galván", un colegio secundario público con orientación artística.',
    rules: [
      'Ian es hipoacúsico severo: usa audífono en el oído izquierdo, lee labios parcialmente y se comunica en LSA, con cuaderno y también hablando en voz alta. No hay "cura" ni la busca: su sordera es parte de su identidad.',
      'Ian percibe la música por vibración: graves en el pecho y el piso, agudos en la punta de los dedos sobre la madera. Le llega "en diferido", una fracción después.',
      'Las señas se rotulan con «(en señas)»; cuando alguien habla sin mirarlo, Ian puede perderse la frase, y eso se muestra.',
      'El Certamen Regional permite ajustes de accesibilidad para el público si se solicitan con anticipación.',
      'Valeria tiene oído absoluto: oye cada tos, cada respiración del público. Ese don es la raíz de su pánico escénico.',
    ],
    era: 'Actualidad (celulares, videollamadas, apuntes en cuaderno), sin tecnología fantástica.',
    aesthetic: 'Jacarandás en flor, patios de baldosa, aulas con ventanales altos, pianos de cola viejos, pintura acrílica, atardeceres naranjas sobre azoteas, uniformes azul marino con detalles bordó.',
    places: [
      { name: 'La pared gris del patio', description: 'Un paredón de seis metros que da al patio trasero del colegio, despintado y lleno de grafitis viejos. Ian lo convierte en el mural del jacarandá.' },
      { name: 'Sala de música 3', description: 'Sala con piso de madera y un piano de cola Steinway de los años 60. El profe Tito deja la puerta abierta al mediodía. Ian se acuesta en el piso para sentir la música.' },
      { name: 'La azotea', description: 'Terraza prohibida (pero siempre abierta) donde Valeria y Camila almuerzan desde primer año. Desde ahí se ven las copas violetas de toda la avenida.' },
      { name: 'El living de los Ortiz', description: 'Departamento ordenado y silencioso; el piano vertical de la familia está tapado con un mantel bordado desde hace un año.' },
      { name: 'Auditorio del Centro Cultural', description: 'Sede del Certamen Regional: butacas rojas, escenario de madera, un piano de cola negro y un público que tose en el peor momento.' },
      { name: 'Avenida de los jacarandás', description: 'La vereda frente al auditorio, techada de flores lilas. Escenario de la confesión.' },
    ],
    conflicts: [
      'Valeria contra su pánico escénico y la ambición heredada de su madre.',
      'Ian contra el mundo que lo trata como frágil y habla con su hermana en lugar de hablar con él.',
      'Valeria y Camila: amistad sincera atravesada por la rivalidad musical y por enamorarse del mismo chico.',
      'Silencio contra sonido: lo que para ella es abismo, para él es hogar.',
    ],
    culture: [
      'Mate en los recreos, facturas en la sala de profesores, "che" y voseo en cada frase.',
      'La comunidad sorda argentina y la LSA como lengua propia, con su humor y sus reglas (mirar a la cara, no gritar, tocar el hombro para llamar).',
      'La presión de los concursos de música clásica y la cultura del "niño prodigio".',
      'Aplauso sordo: manos en alto agitadas, que en el clímax adopta todo el auditorio.',
    ],
  },
  structure: {
    inicio: 'Páginas 1–8: el congelamiento del Nacional como herida, la rutina de sarcasmo de Valeria, la presión de su madre y la llegada de Ian, que ve sus manos escondidas y empieza el mural del jacarandá. Ella ya no toca; él le dice que "tocaba" no es un tiempo verbal sino una excusa.',
    desarrollo: 'Páginas 9–25: el piano compartido en la sala 3, Ian sintiendo la música en el piso, la primera frase que Valeria toca en un año, el mural que crece con manos lilas, la herida de Ian (su hermana sobreprotectora, el mural que le quitaron "por seguridad"), la pelea con la madre, el malentendido leído en los labios, la confesión de Camila y la reconciliación. Valeria decide volver a competir.',
    climax: 'Páginas 26–30: ensayos, el día del Certamen Regional, el nuevo congelamiento frente al silencio y la mano de Ian apoyada sobre el piano. Valeria toca. El auditorio aplaude en señas.',
    cierre: 'Páginas 31–32: confesión bajo los jacarandás en dos idiomas; a la mañana siguiente pintan juntos la última rama, dejando un hueco en blanco. Gancho suave: la invitación al Certamen Nacional, el mismo escenario donde todo empezó.',
    giros: [
      'Ian no la escucha tocar: la siente, y le dice qué nota "está triste" antes de que ella lo admita.',
      'Valeria toca con Ian porque cree que él no puede oír sus errores: su refugio es, en el fondo, una forma de no mirarlo.',
      'Ian lee los labios de Valeria a través del pasillo y descubre esa frase.',
      'Camila aprendió LSA en secreto por Ian, se le declara en señas y, aun rechazada, es quien le revela la verdad a Valeria.',
      'La madre revela que ella también se congeló una vez, y nunca volvió a subir al escenario.',
      'Todo el auditorio aplaude en señas, imitando a Camila.',
    ],
    cliffhangers: [
      'p7: "Tocaba no es un tiempo verbal. Es una excusa."',
      'p12: "Otra vez. Pero esta vez, mirame."',
      'p20: Ian lee la frase en los labios de Valeria.',
      'p23: "Me gustás, Ian." — en señas, de Camila.',
      'p28: El silencio vuelve y las manos de Valeria se congelan.',
      'p32: La invitación al Nacional.',
    ],
    escenasClave: [
      'El congelamiento en el Nacional (p1).',
      'El primer encuentro frente a la pared gris (p6–7).',
      'Ian acostado en el piso sintiendo el piano (p9–11).',
      'Las manos lilas pintando pétalos (p14).',
      'La noche en el mural: "Para mí el silencio es casa" (p19).',
      'El malentendido leído en los labios (p20).',
      'La azotea entre Valeria y Camila (p24).',
      'La mano sobre el piano (p28–29).',
      'La confesión bajo los jacarandás (p31).',
    ],
    ritmo: 'Respiración lenta y lírica con picos emocionales cada 3–4 páginas. Las páginas de diálogo ágil (escuela, humor) alternan con páginas silenciosas de una o dos viñetas grandes. Splash solo en tres momentos: el gancho, la interpretación y la confesión.',
  },
  characters: [
    {
      id: 'valeria',
      name: 'Valeria Ortiz',
      age: '16 años',
      role: 'protagonista',
      personality: 'Brillante, irónica, rápida para la respuesta filosa y lenta para pedir ayuda. Tiene oído absoluto y un sentido del humor seco que usa como escudo. Debajo hay una chica tierna que extraña tocar más de lo que admite.',
      goal: 'Que nadie vuelva a verla fallar. Más adelante: volver a tocar por amor a la música y no por miedo ni por su madre.',
      fear: 'El silencio del público antes de la primera nota; volver a congelarse y confirmar que su talento se rompió.',
      flaw: 'Se protege con sarcasmo y usa a los demás como refugio sin mirarlos de verdad (incluso la sordera de Ian).',
      arc: 'De esconder las manos debajo del pupitre a tocar en el Certamen Regional con las manos de otro apoyadas en su piano; aprende a escuchar el silencio como pausa y no como abismo.',
      relations: 'Mejor amiga de Camila desde primer año. Hija única de Mónica. Alumna favorita (y exasperante) del profe Tito. Se enamora de Ian sin quererlo.',
      physical: 'Delgada, estatura media, manos largas de pianista que siempre esconde en las mangas. Pelo castaño oscuro, largo y ondulado.',
      visualTraits: 'Lunar debajo del ojo izquierdo, cinta lila en el pelo (regalo de su madre cuando tenía ocho años), ojos marrones con brillos que se apagan cuando tiene miedo.',
      outfit: 'Uniforme azul marino con moño bordó y mangas siempre estiradas sobre las manos. En el concierto: vestido azul noche.',
      expressions: 'Sonrisa ladeada sarcástica, ceño fruncido de concentración, rubor que intenta disimular, llanto silencioso con la mandíbula apretada.',
      speech: 'Voseo filoso, frases cortas, ironía ("Qué original, che"). Cuando está nerviosa se le escapan términos musicales ("fuera de tempo").',
      rig: { gender: 'f', age: 'young', build: 'slim', skin: '#f3dac6', hair: { style: 'long-wavy', color: '#3b2a24' }, eyes: { color: '#6b4632' }, outfit: { kind: 'school-f', main: '#26345e', accent: '#8e2a3a' }, accessory: 'ribbon', mark: 'mole' },
    },
    {
      id: 'ian',
      name: 'Ian Ferraro',
      age: '17 años',
      role: 'protagonista',
      personality: 'Franco, luminoso, testarudo y muy observador. Tiene un humor físico y travieso, y una paciencia infinita para explicar... hasta que lo tratan como frágil. Nota lo que los demás esconden porque mira caras y manos todo el tiempo.',
      goal: 'Terminar el mural del jacarandá en el colegio nuevo y que lo miren como artista, no como "el chico sordo".',
      fear: 'Que lo vuelvan a apartar "por su bien", como en su colegio anterior; ser una carga para su hermana.',
      flaw: 'Orgullo herido: cuando siente lástima o condescendencia, se cierra sin dar explicaciones y deja las cosas a medio terminar.',
      arc: 'De esconderse detrás del muro (literal) cuando lo hieren a decir con palabras y señas lo que siente; aprende que dejarse cuidar no es ser frágil.',
      relations: 'Hermano menor de Martina, que lo crió desde que sus padres se separaron. Compañero de banco de Valeria. Camila se enamora de él.',
      physical: 'Alto, hombros anchos de trepar escaleras, pelo rubio arena despeinado, ojos verdes. Manos siempre manchadas de acrílico lila.',
      visualTraits: 'Audífono color piel en la oreja izquierda (visible cuando se acomoda el pelo), pecas sobre la nariz, lápiz detrás de la oreja derecha, cuaderno de tapa dura que lleva a todos lados.',
      outfit: 'Uniforme con la camisa afuera y las mangas arremangadas; buzo gris atado a la cintura, manchado de pintura.',
      expressions: 'Sonrisa enorme que le achina los ojos, mirada fija e intensa cuando lee labios, ceño cerrado y mandíbula tensa cuando se ofende, ojos cerrados de concentración cuando siente vibraciones.',
      speech: 'Habla en voz alta con una dicción levemente particular, firma frases cortas en LSA, escribe en el cuaderno con letra grande y dibujitos. Directo: "Mirame cuando hablás".',
      rig: { gender: 'm', age: 'young', build: 'average', skin: '#f0d2b4', hair: { style: 'messy', color: '#c9a46a' }, eyes: { color: '#4f8a72' }, outfit: { kind: 'school-m', main: '#26345e', accent: '#9b7bd1' }, accessory: 'satchel', mark: 'freckles' },
    },
    {
      id: 'camila',
      name: 'Camila Rossi',
      age: '16 años',
      role: 'rival',
      personality: 'Extrovertida, encantadora, competitiva hasta los huesos y leal hasta las lágrimas. Violinista estrella del colegio desde que Valeria dejó de tocar. Esconde la inseguridad de haber sido siempre "la segunda".',
      goal: 'Brillar con luz propia y no a la sombra de Valeria; que Ian la vea.',
      fear: 'Que la quieran solo mientras Valeria no está en el escenario.',
      flaw: 'Una parte de ella se alegró de que Valeria dejara de tocar, y la culpa la vuelve controladora.',
      arc: 'De proteger a Valeria (y protegerse de ella) a elegir la verdad aunque le cueste el amor; termina iniciando el aplauso en señas de todo el auditorio.',
      relations: 'Mejor amiga de Valeria desde primer año, compañera de dúo en primaria. Se enamora de Ian y aprende LSA en secreto por él.',
      physical: 'Baja, enérgica, pelo cobrizo atado en cola alta, anteojos redondos de marco dorado que se acomoda cuando miente.',
      visualTraits: 'Vincha bordó, curitas en las yemas de los dedos por el violín, estuche de violín con stickers.',
      outfit: 'Uniforme impecable, medias largas, vincha bordó.',
      expressions: 'Sonrisa radiante, puchero exagerado, mirada que se quiebra detrás de los anteojos.',
      speech: 'Rápida, chispeante, apodos cariñosos ("Vale", "boluda" con cariño). Cuando habla en serio, baja la voz y deja de bromear.',
      rig: { gender: 'f', age: 'young', build: 'small', skin: '#f6e0cf', hair: { style: 'ponytail', color: '#a5482e' }, eyes: { color: '#4a3020' }, outfit: { kind: 'school-f', main: '#26345e', accent: '#8e2a3a' }, accessory: 'headband', mark: 'glasses' },
    },
    {
      id: 'monica',
      name: 'Mónica Bernal de Ortiz',
      age: '45 años',
      role: 'secundario',
      personality: 'Elegante, exigente, precisa como un metrónomo. Ama a su hija con una intensidad que no sabe expresar sin agenda ni objetivos.',
      goal: 'Que Valeria tenga la carrera que ella abandonó.',
      fear: 'Que su hija repita su historia: talento enterrado por miedo.',
      flaw: 'Confunde apoyo con presión y nunca habló de su propio fracaso.',
      arc: 'De dejar afiches del certamen en la mesa a confesar que ella también se congeló una vez, y devolverle a Valeria la elección.',
      relations: 'Madre de Valeria. Fue alumna del profe Tito hace veinticinco años.',
      physical: 'Alta, espalda recta, pelo negro recogido en rodete perfecto, manos idénticas a las de Valeria.',
      visualTraits: 'Prendedor de jacarandá de plata en la solapa, reloj fino que mira demasiado.',
      outfit: 'Trajes sastre gris perla, camisas blancas.',
      expressions: 'Severidad serena, sonrisa contenida, el llanto que no se permite hasta el clímax.',
      speech: 'Formal, completa las frases como si fueran partituras: "Cuatro semanas. Es suficiente si empezás hoy."',
      rig: { gender: 'f', age: 'adult', build: 'slim', skin: '#ecd0b8', hair: { style: 'bun', color: '#211915' }, eyes: { color: '#5a3c2b' }, outfit: { kind: 'suit', main: '#7a7a8c', accent: '#f2f2f2' }, accessory: 'necklace', mark: 'mole' },
    },
    {
      id: 'tito',
      name: 'Ernesto "Tito" Sandoval',
      age: '61 años',
      role: 'mentor',
      personality: 'Profesor de música bonachón, despistado y sabio. Toma mate con el piano abierto y cree que la música es "aire que alguien decidió no desperdiciar".',
      goal: 'Que Valeria vuelva a tocar antes de que él se jubile; que la sala 3 sea un lugar seguro para todos.',
      fear: 'Haber empujado demasiado a Mónica cuando era su alumna.',
      flaw: 'Se mete donde no lo llaman y no sabe guardar secretos.',
      arc: 'Del maestro que espera en silencio al que gestiona el ajuste de accesibilidad para que Ian pueda sentir el concierto.',
      relations: 'Fue profesor de Mónica. Adopta a Ian como "oyente oficial" de la sala 3.',
      physical: 'Robusto, barba blanca prolija, anteojos en la punta de la nariz, panza de facturas.',
      visualTraits: 'Pulóver tejido verde musgo con coderas, termo bajo el brazo, partituras con manchas de café.',
      outfit: 'Pulóver verde musgo, camisa a cuadros, corbata siempre torcida.',
      expressions: 'Sonrisa bajo la barba, cejas alzadas de picardía, ojos húmedos en los conciertos.',
      speech: 'Lento, refranero, termina las frases con "¿eh?". Llama a todos "maestro" o "maestra".',
      rig: { gender: 'm', age: 'old', build: 'strong', skin: '#e4c3a4', hair: { style: 'short', color: '#e6e2dc' }, eyes: { color: '#5b4a3a' }, outfit: { kind: 'sweater', main: '#5d7350', accent: '#c9b28a' }, mark: 'glasses' },
    },
    {
      id: 'martina',
      name: 'Martina Ferraro',
      age: '24 años',
      role: 'aliado',
      personality: 'Tatuadora y estudiante de interpretación de LSA, ruidosa, cálida y sobreprotectora. Crió a Ian desde que él tenía diez años y todavía no sabe soltarlo.',
      goal: 'Que su hermano esté a salvo y feliz.',
      fear: 'Que el mundo lastime a Ian como lo lastimó en el colegio anterior.',
      flaw: 'Habla por Ian, decide por él y responde preguntas que le hacen a él.',
      arc: 'De subir corriendo a bajarlo de la escalera a llevarlo ella misma al concierto y quedarse en la última fila, dejándolo ir.',
      relations: 'Hermana mayor de Ian. Simpatiza enseguida con Valeria.',
      physical: 'Alta, delgada, pelo corto teñido de violeta, brazos tatuados con flores.',
      visualTraits: 'Aro en la oreja, tatuaje de una mano haciendo la seña de "hermano" en el antebrazo, campera de jean con parches.',
      outfit: 'Campera de jean, remera negra, borcegos.',
      expressions: 'Carcajada amplia, ceño preocupado, culpa cuando entiende que se pasó.',
      speech: 'Mezcla habla y señas sin pensarlo, dice "nene" todo el tiempo, muy expresiva con las manos.',
      rig: { gender: 'f', age: 'adult', build: 'slim', skin: '#f0d2b4', hair: { style: 'short', color: '#7a4fb0' }, eyes: { color: '#4f8a72' }, outfit: { kind: 'jacket', main: '#4a6a9a', accent: '#1d1d1d' }, accessory: 'necklace', mark: 'earring' },
    },
  ],
  cover: {
    shot: { bg: 'flowers', time: 'sunset', angle: 'low', chars: [val('shy', 'half', { x: 0.62, pose: 'hold' }), ian('happy', 'half', { x: 0.36, flip: true, pose: 'reach' })], extras: ['petals', 'sparkles', 'glow'], prop: 'piano' },
    title: 'PÉTALOS EN DIFERIDO',
    subtitle: 'Volumen 1 · Lo que se escucha con las manos',
    tagline: 'Ella le tenía miedo al silencio. Para él, el silencio era casa.',
  },
  altCover: {
    shot: { bg: 'art-wall', time: 'day', angle: 'normal', chars: [ian('thinking', 'back', { x: 0.4, pose: 'reach' }), val('happy', 'face', { x: 0.75, flip: true })], extras: ['petals', 'flowers'], prop: 'brush' },
    title: 'PÉTALOS EN DIFERIDO',
    subtitle: 'Un mural, un piano y dos idiomas',
    tagline: 'Algunas canciones no se escuchan. Se sienten en las manos.',
  },
  pages: [
    // ───────────── 1 ─────────────
    {
      objective: 'Gancho emocional: mostrar la herida que define a la protagonista antes de conocerla.',
      summary: 'Hace un año, en la final del Certamen Nacional, Valeria se congela sobre el teclado. Una tos en el público, el silencio que se estira, sus manos inmóviles. Afuera, los jacarandás sueltan pétalos.',
      tone: 'Suspendido, bello y devastador.',
      composition: 'Caja alta a la derecha con el escenario entero (soledad); a la izquierda, dos primeros planos que bajan del rostro a las manos congeladas: el lector "cae" con ella.',
      layout: { boxes: TALL_R },
      panels: [
        { shot: { bg: 'concert-hall', time: 'night', angle: 'high', chars: [val('scared', 'full', { pose: 'sit', scale: 0.7 })], extras: ['glow'], prop: 'piano' }, lines: [cap('Hace un año. Final del Certamen Nacional de Jóvenes Pianistas.'), th('valeria', 'Alguien tosió en la fila doce. Un Fa sostenido, desafinado.')], fx: 'gradient-tone' },
        { shot: { bg: 'tone', angle: 'normal', chars: [val('shocked', 'eyes')], extras: ['shadow-face'] }, lines: [th('valeria', 'Y después… nada.')], sfx: [{ text: '…', size: 'big' }], fx: 'screentone' },
        { shot: { bg: 'black', prop: 'hand', extras: ['petals'] }, lines: [nar('Ese día, el sonido me abandonó en mitad de un compás.')], fx: 'gradient-tone' },
      ],
      notes: 'Sin globos de diálogo: solo pensamiento y narración. El pétalo lila en la última viñeta es el único color/acento de la página.',
    },
    // ───────────── 2 ─────────────
    {
      objective: 'Presentar el presente de Valeria: la casa, la madre, el piano tapado y su sarcasmo defensivo.',
      summary: 'Un año después. Valeria desayuna mientras su madre deja sobre la mesa el afiche del Certamen Regional. El piano del living sigue cubierto con un mantel.',
      tone: 'Doméstico, frío, con humor seco.',
      composition: 'Hero arriba con el living y el piano tapado como "cadáver" bajo la tela; tres viñetas chicas de esgrima verbal madre-hija y un cierre en la cinta lila.',
      layout: { template: 'hero-top' },
      panels: [
        { shot: { bg: 'apartment', time: 'day', angle: 'high', chars: [val('tired', 'half', { x: 0.3, pose: 'sit' }), mama('serious', 'half', { x: 0.72, flip: true, pose: 'stand' })], prop: 'piano' }, lines: [cap('Hoy. Octubre. Buenos Aires.'), d('monica', 'El Regional es el 22 de noviembre. Cuatro semanas. Es suficiente si empezás hoy.')] },
        { shot: { bg: 'apartment', time: 'day', chars: [val('smirk', 'bust', { flip: true })] }, lines: [d('valeria', 'Qué original, má. ¿Lo pegaste también en la heladera o eso es mañana?')] },
        { shot: { bg: 'apartment', time: 'day', chars: [mama('sad', 'face')] }, lines: [d('monica', 'Valeria. Tus manos no se olvidaron. Vos te estás olvidando de ellas.')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'day', chars: [val('serious', 'back', { pose: 'stand' })], extras: ['petals'] }, lines: [th('valeria', 'Mis manos se acuerdan perfecto. Ese es el problema.')], sfx: [{ text: 'clac', size: 'small' }] },
      ],
    },
    // ───────────── 3 ─────────────
    {
      objective: 'Presentar el colegio, a Camila y el vínculo cómplice/rival entre las amigas.',
      summary: 'En el pasillo, Camila salta sobre Valeria con su violín a cuestas. Pasan por la sala 3 sin mirar el piano. Rumor: llega un alumno nuevo "que pinta paredes".',
      tone: 'Luminoso, ágil, juvenil.',
      composition: 'Tres viñetas mixtas: una ancha de pasillo lleno de vida y dos íntimas; la mirada de Valeria evitando la puerta de la sala 3 marca la herida dentro del humor.',
      layout: { template: 'three-mixed' },
      panels: [
        { shot: { bg: 'school-hall', time: 'day', chars: [cam('laugh', 'half', { x: 0.65, pose: 'wave', flip: true }), val('tired', 'half', { x: 0.3 })], extras: ['sparkles'] }, lines: [sh('camila', '¡Vaaale! ¿Te enteraste? ¡Viene uno nuevo! Dicen que pinta paredes enteras.'), d('valeria', 'Ah, mirá. Un albañil con aspiraciones.')], sfx: [{ text: '¡tum tum!', size: 'small' }] },
        { shot: { bg: 'school-hall', time: 'day', chars: [val('sad', 'face', { flip: true })], prop: 'door' }, lines: [th('valeria', 'Sala de música 3. No mires. No mires.')], fx: 'screentone' },
        { shot: { bg: 'school-hall', time: 'day', chars: [cam('thinking', 'bust')] }, lines: [th('camila', 'Otra vez pasó sin mirar la puerta.'), d('camila', '¡Igual el violín estrella del colegio sigue siendo yo, eh!')] },
      ],
    },
    // ───────────── 4 ─────────────
    {
      objective: 'Entrada del coprotagonista con personalidad fuerte, humor y una presentación respetuosa de su sordera.',
      summary: 'En el aula, Ian se presenta hablando y en señas. Su hermana Martina se asoma a la puerta para "ayudar" y él la echa con un gesto. Pide que lo miren a la cara y que no le griten.',
      tone: 'Divertido, cálido, con carácter.',
      composition: 'Hero central con Ian frente al pizarrón: la página entera gira a su alrededor. Viñetas laterales con reacciones del aula y la hermana expulsada.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'classroom', time: 'day', chars: [tito('happy', 'bust', { x: 0.6 })] }, lines: [d('tito', 'Maestros, maestras: les presento a su nuevo compañero, ¿eh?')] },
        { shot: { bg: 'classroom', time: 'day', chars: [mar('happy', 'bust', { x: 0.4, pose: 'wave' })], prop: 'door' }, lines: [d('martina', '¡Hola! Soy la hermana. Él es sordo, así que si necesitan algo, me…')] },
        { shot: { bg: 'classroom', time: 'day', angle: 'low', chars: [ian('grin', 'half', { pose: 'point' })], extras: ['sparkles'] }, lines: [d('ian', 'Me llamo Ian. Escucho poco. Uso audífono, leo labios y hablo en señas.'), sg('ian', 'Y también sé echar hermanas.')], fx: 'focuslines' },
        { shot: { bg: 'classroom', time: 'day', chars: [mar('surprised', 'face', { flip: true })], extras: ['sweat'] }, lines: [d('martina', '¡Bueno, bueno! Me voy, nene.')], sfx: [{ text: 'shhh', size: 'small' }] },
        { shot: { bg: 'classroom', time: 'day', chars: [ian('smirk', 'bust', { flip: true })] }, lines: [d('ian', 'Dos reglas: mírenme a la cara cuando hablen. Y no griten. Soy sordo, no estoy lejos.')] },
      ],
    },
    // ───────────── 5 ─────────────
    {
      objective: 'Primer contacto íntimo: Ian ve lo que Valeria esconde.',
      summary: 'Ian se sienta junto a Valeria. Ella murmura una ironía de costado, sin mirarlo; él no la capta. Entonces él le pasa su cuaderno: "¿Por qué escondés las manos?"',
      tone: 'Tenso, curioso, el primer "doki".',
      composition: 'Manga-vertical: lectura descendente y lenta, de la mirada lateral al cuaderno, del cuaderno a las manos escondidas bajo el pupitre.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'classroom', time: 'day', chars: [ian('happy', 'half', { x: 0.65, pose: 'sit', flip: true }), val('smirk', 'half', { x: 0.3, pose: 'sit' })] }, lines: [wh('valeria', 'Genial. Justo el banco del lado de la ventana. Era mi lugar para dormir.')] },
        { shot: { bg: 'classroom', time: 'day', chars: [ian('thinking', 'face')] }, lines: [th('valeria', 'No me miró. Claro… le hablé de costado.')] },
        { shot: { bg: 'classroom', time: 'day', prop: 'note', extras: ['sparkles'] }, lines: [cap('"¿Por qué escondés las manos? (Si fue algo feo lo que dijiste, mirame y repetilo.)"')], fx: 'screentone' },
        { shot: { bg: 'tone', chars: [val('shy', 'eyes')], extras: ['blush'] }, lines: [th('valeria', '¿Cómo… se dio cuenta?')], sfx: [{ text: 'pum pum', size: 'medium', color: '#9b7bd1' }], fx: 'gradient-tone' },
      ],
    },
    // ───────────── 6 ─────────────
    {
      objective: 'Escena del mural: presentar el símbolo central (jacarandá) y el talento de Ian.',
      summary: 'A la salida, Valeria atraviesa el patio trasero y ve a Ian sobre una escalera pintando la primera rama de un jacarandá gigante en la pared gris. Él la nota por su sombra.',
      tone: 'Maravilla silenciosa.',
      composition: 'Cascada de cajas: la pared enorme arriba a la derecha, la figura diminuta de Valeria, el pincel cargado de lila y un plano ancho final de los dos frente al muro.',
      layout: { boxes: CASCADE },
      panels: [
        { shot: { bg: 'art-wall', time: 'sunset', angle: 'low', chars: [ian('thinking', 'full', { pose: 'reach', scale: 0.6 })], extras: ['petals'], prop: 'brush' }, lines: [cap('La pared gris del patio. Seis metros de nada.')] },
        { shot: { bg: 'school-hall', time: 'sunset', chars: [val('surprised', 'full', { pose: 'stand', scale: 0.8 })] }, lines: [th('valeria', 'Una rama. Una sola rama, y la pared ya respira.')] },
        { shot: { bg: 'art-wall', time: 'sunset', prop: 'brush', extras: ['sparkles'] }, sfx: [{ text: 'fsss', size: 'small' }] },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('happy', 'half', { x: 0.7, flip: true }), val('shy', 'half', { x: 0.28 })], extras: ['petals'] }, lines: [d('ian', 'Tu sombra tapó mi luz. Hola, la de las manos escondidas.'), d('valeria', 'Tengo nombre, ¿sabés?')] },
      ],
    },
    // ───────────── 7 ─────────────
    {
      objective: 'Diálogo que define la química: humor, verdad incómoda y primer cliffhanger emocional.',
      summary: 'Ian le cuenta que es un jacarandá porque "es el único árbol que florece sin hojas". Le pregunta si toca el piano. Ella dice "tocaba". Él le responde que eso es una excusa.',
      tone: 'Juguetón que se vuelve punzante.',
      composition: 'Dos columnas: Ian a la derecha (lee primero), Valeria a la izquierda; el ida y vuelta se lee como una conversación cara a cara.',
      layout: { template: 'two-cols' },
      panels: [
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('grin', 'half', { pose: 'hold' })], extras: ['petals'], prop: 'note' }, lines: [d('ian', 'Valeria. La pianista. Me lo contó el profe Tito con mucho detalle.'), d('ian', 'El jacarandá florece sin hojas. Me gusta eso: florecer igual.')] },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [val('serious', 'half', { flip: true }), ian('smirk', 'face', { x: 0.2, scale: 0.8 })] }, lines: [d('valeria', 'Tocaba. Pasado. Ya no.'), d('ian', '"Tocaba" no es un tiempo verbal. Es una excusa.')], fx: 'screentone' },
      ],
      notes: 'Ian lee los labios de Valeria mirándola de frente: dibujar su mirada fija en la boca de ella en la viñeta 2.',
    },
    // ───────────── 8 ─────────────
    {
      objective: 'Interioridad de Valeria: la noche, el piano tapado, la tentación de tocar.',
      summary: 'De noche, Valeria levanta apenas el mantel del piano. Recuerda la frase de Ian. Apoya un dedo sobre una tecla pero no la hunde. Su madre la observa desde el pasillo sin decir nada.',
      tone: 'Melancólico, íntimo.',
      composition: 'Cajas altas que caen como pétalos: el mantel, la tecla, la mano suspendida; abajo, la madre en sombra: dos soledades en la misma casa.',
      layout: { boxes: VEIL },
      panels: [
        { shot: { bg: 'apartment', time: 'night', chars: [val('sad', 'half', { pose: 'reach' })], prop: 'piano' }, lines: [th('valeria', '"Es una excusa." ¿Quién se cree?')], fx: 'gradient-tone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'hand', extras: ['glow'] }, lines: [th('valeria', 'Un La. Solo un La.')] },
        { shot: { bg: 'tone', chars: [val('scared', 'eyes')], extras: ['shadow-face'] }, sfx: [{ text: '…', size: 'small' }], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'night', chars: [mama('sad', 'silhouette', { x: 0.75, flip: true }), val('tired', 'back', { x: 0.25, pose: 'sit' })] }, lines: [nar('No la hundí. En la casa de una pianista, el silencio también tiene dueña.')] },
      ],
    },
    // ───────────── 9 ─────────────
    {
      objective: 'Revelar cómo Ian vive la música y abrir la sala 3 como espacio compartido.',
      summary: 'Al mediodía, Valeria escucha graves desde la sala 3. Se asoma: el profe Tito toca y Ian está acostado en el piso de madera, palmas abajo, ojos cerrados, sonriendo.',
      tone: 'Asombro tierno.',
      composition: 'Hero arriba con la imagen poética de Ian en el piso (la escena que se vuelve ícono de la obra); abajo, reacciones y explicación breve.',
      layout: { template: 'hero-top' },
      panels: [
        { shot: { bg: 'music-room', time: 'day', angle: 'high', chars: [ian('happy', 'full', { pose: 'fall', x: 0.4 }), tito('happy', 'half', { pose: 'sit', x: 0.8, flip: true })], extras: ['sparkles', 'glow'], prop: 'piano' }, sfx: [{ text: 'BOM… bom…', size: 'medium', rotate: -6 }], fx: 'gradient-tone' },
        { shot: { bg: 'school-hall', time: 'day', chars: [val('surprised', 'bust', { flip: true })], prop: 'door' }, lines: [th('valeria', '¿Está… acostado en el piso?')] },
        { shot: { bg: 'music-room', time: 'day', chars: [tito('smirk', 'bust')] }, lines: [d('tito', 'Pasá, maestra. Mi oyente oficial siente los graves en el piso, ¿eh? Es el mejor público que tuve.')] },
        { shot: { bg: 'music-room', time: 'day', chars: [ian('thinking', 'face', { flip: true })], extras: ['bubbles-soft'] }, lines: [d('ian', 'Los graves acá, en el pecho. Los agudos, en la punta de los dedos. Me llegan un poquito tarde.')] },
      ],
    },
    // ───────────── 10 ─────────────
    {
      objective: 'Explicar el título y forzar el primer contacto de Valeria con el piano.',
      summary: 'Ian explica que la música le llega "en diferido", como los pétalos que caen después del viento. Tito se va "a buscar agua para el mate" dejándolos solos. Ian le pide una sola nota.',
      tone: 'Tierno, cómplice, nervioso.',
      composition: 'Tres filas: explicación, la excusa del profe (humor), y la petición de Ian con el piano esperando: crescendo de tensión.',
      layout: { template: 'three-rows' },
      panels: [
        { shot: { bg: 'flowers', chars: [ian('happy', 'bust', { x: 0.6 })], extras: ['petals', 'wind'] }, lines: [d('ian', 'Es como los pétalos: el viento pasa y ellos caen después. Yo escucho en diferido.')] },
        { shot: { bg: 'music-room', time: 'day', chars: [tito('grin', 'half', { pose: 'wave', x: 0.3 })], prop: 'cup' }, lines: [d('tito', '¡Uh, se me terminó el agua del mate! Vuelvo en… un rato largo, ¿eh?')], sfx: [{ text: 'clic', size: 'small' }] },
        { shot: { bg: 'music-room', time: 'day', chars: [ian('serious', 'half', { x: 0.7, pose: 'kneel', flip: true }), val('scared', 'half', { x: 0.25 })], prop: 'piano' }, lines: [sg('ian', 'Una nota. Una sola. Para mí.'), d('valeria', 'No. No puedo. No… tengo ganas.')] },
      ],
    },
    // ───────────── 11 ─────────────
    {
      objective: 'Primer sonido en un año: el quiebre interno de Valeria (y la semilla del malentendido).',
      summary: 'Valeria se va, pero vuelve desde la puerta. Hunde una nota grave. Ian, con la palma en el piso, dice "Esa nota está triste". Ella piensa que con él es seguro porque "no puede oír sus errores".',
      tone: 'Frágil, luminoso, con un filo oculto.',
      composition: 'Columnas altas: la nota cae a la derecha (caja vertical, la vibración baja hasta el piso); a la izquierda, la palma de Ian y el pensamiento de Valeria que planta el conflicto.',
      layout: { boxes: TALL_R },
      panels: [
        { shot: { bg: 'music-room', time: 'day', angle: 'low', chars: [val('determined', 'half', { pose: 'sit' })], extras: ['glow'], prop: 'piano' }, sfx: [{ text: 'DOOOM', size: 'big', color: '#7b5bb1', rotate: -4 }], fx: 'focuslines' },
        { shot: { bg: 'music-room', time: 'day', prop: 'hand', extras: ['sparkles'] }, lines: [d('ian', 'Esa nota está triste. Tiembla al final.')], sfx: [{ text: 'fuuu', size: 'small' }] },
        { shot: { bg: 'tone', chars: [val('shy', 'face', { flip: true })], extras: ['blush', 'tears'] }, lines: [th('valeria', 'Con él es distinto. Él no puede oír si me equivoco.'), th('valeria', 'Entonces… es seguro.')], fx: 'gradient-tone' },
      ],
      notes: 'El pensamiento de la viñeta 3 debe sentirse dulce en primera lectura; la obra lo resignifica en la página 20.',
    },
    // ───────────── 12 ─────────────
    {
      objective: 'Primera frase musical y primer momento romántico fuerte.',
      summary: 'Valeria toca una frase corta de Debussy. Ian se incorpora, se acerca y apoya la mano en la madera del piano. "Otra vez. Pero esta vez, mirame." Ella lo mira y toca.',
      tone: 'Romántico, burbujeante, delicado.',
      composition: 'Flotante: viñeta ancha con la música hecha pétalos; abajo, las manos sobre la madera y la mirada sostenida: la página se abre como una flor.',
      layout: { boxes: FLOAT },
      panels: [
        { shot: { bg: 'sparkles', chars: [val('happy', 'half', { x: 0.65, pose: 'sit' }), ian('surprised', 'half', { x: 0.25, flip: false, pose: 'reach' })], extras: ['petals', 'sparkles', 'flowers'], prop: 'piano' }, lines: [cap('Debussy. "Clair de lune". Ocho compases.')], sfx: [{ text: 'tiriri… tin', size: 'medium' }], fx: 'gradient-tone' },
        { shot: { bg: 'tone', chars: [ian('serious', 'face', { flip: true })], extras: ['glow'] }, lines: [d('ian', 'Otra vez. Pero esta vez, mirame.')] },
        { shot: { bg: 'flowers', chars: [val('shy', 'eyes')], extras: ['blush', 'sparkles'] }, lines: [th('valeria', 'Ay, no. No, no, no.')], sfx: [{ text: 'pum pum pum', size: 'medium', color: '#c0577a' }], fx: 'screentone' },
      ],
    },
    // ───────────── 13 ─────────────
    {
      objective: 'Introducir el conflicto de Camila sin volverla villana.',
      summary: 'Camila, que iba a buscar a Valeria, los ve a través del vidrio de la puerta: su amiga tocando de nuevo, para Ian. En su celular, un video abierto: "Curso de LSA – Clase 7".',
      tone: 'Agridulce, contenido.',
      composition: 'Manga-vertical: el vidrio como marco dentro del marco; la mirada de Camila baja del dúo a su propio celular, revelando su secreto.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'school-hall', time: 'day', chars: [cam('happy', 'half', { pose: 'stand' })], prop: 'door' }, lines: [th('camila', 'Vale, te traje alfajor, no me digas que…')] },
        { shot: { bg: 'music-room', time: 'day', chars: [val('happy', 'half', { x: 0.65, pose: 'sit' }), ian('happy', 'half', { x: 0.3, flip: false })], extras: ['sparkles'], prop: 'piano' }, sfx: [{ text: 'tin… tin…', size: 'small' }], fx: 'screentone' },
        { shot: { bg: 'tone', chars: [cam('sad', 'eyes')], extras: ['shadow-face'] }, lines: [th('camila', 'Está tocando. Hacía un año que no tocaba. Y no me lo contó.')], fx: 'gradient-tone' },
        { shot: { bg: 'school-hall', time: 'day', prop: 'phone' }, lines: [cap('"Curso de Lengua de Señas Argentina – Clase 7: Sentimientos."'), th('camila', 'Y yo que pensaba darle una sorpresa a él.')] },
      ],
    },
    // ───────────── 14 ─────────────
    {
      objective: 'Crecimiento del vínculo a través del arte compartido: manos y color.',
      summary: 'Días después, Valeria ayuda con el mural. Pintan pétalos con los dedos. Ian dice que el violeta "suena grave". Sus manos lilas se rozan al mismo tiempo sobre la pared.',
      tone: 'Dulce, juguetón, romántico.',
      composition: 'Franjas: plano general del mural creciendo arriba; columna alta derecha con los dos riendo; a la izquierda, el roce de manos en dos tiempos (antes/después).',
      layout: { boxes: STRIPS },
      panels: [
        { shot: { bg: 'art-wall', time: 'day', angle: 'normal', chars: [ian('happy', 'full', { x: 0.65, pose: 'reach', scale: 0.7 }), val('laugh', 'full', { x: 0.35, pose: 'reach', scale: 0.7, flip: true })], extras: ['petals'] }, lines: [cap('Semana dos. El jacarandá ya tiene tronco, tres ramas y doscientos pétalos.')] },
        { shot: { bg: 'flowers', chars: [ian('grin', 'half', { x: 0.55 }), val('laugh', 'face', { x: 0.25, flip: true, scale: 0.9 })], extras: ['petals', 'sparkles'], prop: 'brush' }, lines: [d('ian', 'El violeta suena grave. El amarillo es un platillo. Este lila es un Re, seguro.'), d('valeria', '¡Es un Re bemol, ignorante!')], sfx: [{ text: 'jaja', size: 'small' }] },
        { shot: { bg: 'art-wall', time: 'day', prop: 'hand', extras: ['petals'] }, sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'tone', chars: [val('shy', 'face'), ian('shy', 'face', { x: 0.25, flip: true, scale: 0.8 })], extras: ['blush', 'bubbles-soft'] }, lines: [th('valeria', 'Tiene la mano tibia. Huele a pintura y a sol.')], fx: 'gradient-tone' },
      ],
    },
    // ───────────── 15 ─────────────
    {
      objective: 'Mostrar la herida de Ian: la sobreprotección que lo vuelve "frágil" ante los demás.',
      summary: 'Martina llega al patio y ve a Ian arriba de la escalera. Le grita que baje, que no va a oír si alguien le avisa de un peligro, y le habla a Valeria en lugar de a él. Ian estalla en señas rápidas.',
      tone: 'Incómodo, tenso, doloroso.',
      composition: 'Manga-dynamic: diagonales y cortes bruscos rompen la calma de la página anterior; la escalera como eje vertical del conflicto.',
      layout: { template: 'manga-dynamic' },
      panels: [
        { shot: { bg: 'art-wall', time: 'day', angle: 'low', chars: [mar('scared', 'half', { pose: 'point', x: 0.3 }), ian('neutral', 'full', { x: 0.75, pose: 'reach', scale: 0.6 })] }, lines: [sh('martina', '¡Ian! ¡Bajate de ahí! ¡Si alguien te avisa algo no lo vas a escuchar!')] },
        { shot: { bg: 'art-wall', time: 'day', chars: [mar('serious', 'bust', { flip: true }), val('surprised', 'bust', { x: 0.2 })] }, lines: [d('martina', 'Vos sos la compañera, ¿no? ¿Lo podés vigilar? Se distrae mucho, se cansa…')] },
        { shot: { bg: 'tone', chars: [ian('furious', 'face')], extras: ['shadow-face'] }, lines: [sg('ian', '¡Estoy ACÁ! ¡Preguntame a mí!')], fx: 'speedlines' },
        { shot: { bg: 'art-wall', time: 'day', prop: 'brush' }, sfx: [{ text: '¡plaf!', size: 'medium', rotate: 12 }] },
        { shot: { bg: 'art-wall', time: 'day', chars: [val('sad', 'half', { x: 0.6 }), mar('sad', 'half', { x: 0.25, flip: true })] }, lines: [th('valeria', 'Hablaba de él como si no estuviera parado ahí.')] },
      ],
      notes: 'Martina no es villana: su miedo es amor mal dirigido. Su culpa debe asomar en la última viñeta.',
    },
    // ───────────── 16 ─────────────
    {
      objective: 'Confesión de la herida de Ian: profundizar al coprotagonista.',
      summary: 'Al atardecer, en la azotea, Ian cuenta que en su colegio anterior le sacaron el mural "por seguridad" y que todos le hablaban a su hermana en lugar de a él. "No quiero que me cuiden. Quiero que me miren."',
      tone: 'Vulnerable, honesto, crepuscular.',
      composition: 'Dos filas: un plano general de la ciudad violeta con las dos siluetas pequeñas, y un primer plano dividido entre sus caras: la intimidad después de la distancia.',
      layout: { template: 'two-rows' },
      panels: [
        { shot: { bg: 'rooftop', time: 'sunset', angle: 'high', chars: [ian('sad', 'silhouette', { x: 0.62, pose: 'sit', scale: 0.6 }), val('sad', 'silhouette', { x: 0.38, pose: 'sit', scale: 0.6 })], extras: ['petals'] }, lines: [d('ian', 'En mi otro colegio pinté medio mural. Después me lo sacaron. "Por seguridad", dijeron.'), d('ian', 'Nadie me preguntó. Le preguntaron a Martina.')], fx: 'gradient-tone' },
        { shot: { bg: 'sunset', chars: [ian('serious', 'face', { x: 0.65 }), val('sad', 'face', { x: 0.3, flip: true })], extras: ['glow'] }, lines: [d('ian', 'No quiero que me cuiden, Valeria.'), sg('ian', 'Quiero que me miren.')] },
      ],
    },
    // ───────────── 17 ─────────────
    {
      objective: 'Reciprocidad: Valeria abre su herida; nace el contraste temático silencio/sonido.',
      summary: 'Valeria cuenta lo del Nacional: la tos desafinada, el silencio que se la tragó. Ian le dice que para él el silencio es casa. Ella se ríe llorando. Él le enseña la seña de "otra vez".',
      tone: 'Catártico, tierno.',
      composition: 'Cascada: el recuerdo del escenario negro arriba, la cara de Valeria al costado, la frase de Ian como respiro corto y abajo, ancha, la seña compartida.',
      layout: { boxes: CASCADE },
      panels: [
        { shot: { bg: 'concert-hall', time: 'night', angle: 'high', chars: [val('scared', 'full', { pose: 'sit', scale: 0.5 })], extras: ['shadow-face'], prop: 'piano' }, lines: [d('valeria', 'Tengo oído absoluto. Escucho todo: cada tos, cada respiración. Ese día el silencio me tragó.')], fx: 'screentone' },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [val('crying', 'face', { flip: true })], extras: ['tears'] }, lines: [th('valeria', 'Nunca se lo había contado a nadie. Ni a Cami.')] },
        { shot: { bg: 'sunset', chars: [ian('happy', 'bust')], extras: ['glow'] }, lines: [d('ian', 'Para mí el silencio es casa. Podés venir cuando quieras.')] },
        { shot: { bg: 'flowers', time: 'sunset', chars: [ian('happy', 'half', { x: 0.65, pose: 'reach', flip: true }), val('laugh', 'half', { x: 0.3, pose: 'reach' })], extras: ['petals', 'sparkles', 'tears'], prop: 'hand' }, lines: [sg('ian', 'Así se dice "otra vez". Repetí.'), d('valeria', '¿Así? ¿Otra vez?')] },
      ],
    },
    // ───────────── 18 ─────────────
    {
      objective: 'Escalar el conflicto familiar: la propuesta del Regional y la pelea con la madre.',
      summary: 'Tito inscribe a Valeria "por las dudas" y llama a Mónica. Esa noche, madre e hija discuten: "Yo dejé todo por el piano." "¡Vos dejaste todo, no yo!" Valeria se va dando un portazo.',
      tone: 'Doloroso, explosivo.',
      composition: 'Grilla 2x2: cuatro cuadros como cuatro tiempos de una discusión que se acelera hasta el portazo.',
      layout: { template: 'grid-2x2' },
      panels: [
        { shot: { bg: 'music-room', time: 'day', chars: [tito('smirk', 'bust', { x: 0.6 })], prop: 'phone' }, lines: [d('tito', 'Mónica, querida. La anoté al Regional, por las dudas, ¿eh? Algo se está descongelando.')] },
        { shot: { bg: 'apartment', time: 'night', chars: [mama('serious', 'half', { pose: 'arms-crossed' })] }, lines: [d('monica', 'Tocás para un chico en la escuela y no para tu madre. Yo dejé todo por el piano, Valeria.')] },
        { shot: { bg: 'apartment', time: 'night', chars: [val('furious', 'face', { flip: true })], extras: ['tears'] }, lines: [sh('valeria', '¡Vos dejaste todo, no yo! ¡No soy tu segunda oportunidad!')], fx: 'speedlines' },
        { shot: { bg: 'apartment', time: 'night', prop: 'door' }, sfx: [{ text: '¡PAM!', size: 'big', rotate: -10 }] },
      ],
    },
    // ───────────── 19 ─────────────
    {
      objective: 'Escena nocturna de consuelo: el vínculo se vuelve refugio mutuo.',
      summary: 'Valeria corre hasta el colegio; Ian está pintando de noche bajo una lámpara. Ella llora contra la pared. Él no dice nada: le toma la mano, la apoya sobre su pecho y respira lento para que ella sienta el ritmo.',
      tone: 'Íntimo, protector, silencioso.',
      composition: 'Hero-mid: viñetas chicas de huida alrededor de una central enorme con las manos sobre el pecho: el silencio como abrazo.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'street', time: 'night', chars: [val('crying', 'full', { pose: 'run' })], extras: ['petals', 'tears'] }, sfx: [{ text: 'tap tap tap', size: 'small' }] },
        { shot: { bg: 'art-wall', time: 'night', chars: [ian('surprised', 'half', { flip: true })], prop: 'lamp' }, lines: [d('ian', '¿Valeria? ¿Qué pasó?')] },
        { shot: { bg: 'sparkles', time: 'night', chars: [ian('serious', 'half', { x: 0.62, flip: true }), val('crying', 'half', { x: 0.35 })], extras: ['glow', 'petals', 'tears'], prop: 'hand' }, lines: [sg('ian', 'Respirá conmigo. Sentí.'), th('valeria', 'Su corazón. Lento. Como un metrónomo que no apura.')], fx: 'gradient-tone' },
        { shot: { bg: 'tone', prop: 'hand', extras: ['bubbles-soft'] }, sfx: [{ text: 'tum… tum…', size: 'medium', color: '#9b7bd1' }] },
        { shot: { bg: 'art-wall', time: 'night', chars: [val('sad', 'face'), ian('happy', 'face', { x: 0.25, flip: true, scale: 0.85 })], extras: ['blush'] }, lines: [d('valeria', 'Sos un pésimo consejero. No dijiste nada.'), d('ian', 'Exacto.')] },
      ],
    },
    // ───────────── 20 ─────────────
    {
      objective: 'El malentendido: la frase de la página 11 se vuelve herida.',
      summary: 'En el pasillo, Camila pregunta por qué Valeria puede tocar con Ian. Valeria, a la defensiva, responde: "Con él es fácil: no oye si me equivoco." Al fondo del pasillo, Ian le lee los labios.',
      tone: 'Helado, trágico.',
      composition: 'Manga-vertical: lectura de arriba hacia abajo hasta descubrir a Ian lejos; la última viñeta, sus ojos, cae como un golpe sordo.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'school-hall', time: 'day', chars: [cam('serious', 'half', { x: 0.65, flip: true }), val('smirk', 'half', { x: 0.3 })] }, lines: [d('camila', 'Conmigo nunca quisiste volver a tocar. ¿Por qué con él sí?')] },
        { shot: { bg: 'school-hall', time: 'day', chars: [val('smirk', 'face', { flip: true })] }, lines: [d('valeria', 'Ay, Cami. Con él es fácil. No oye si me equivoco.')] },
        { shot: { bg: 'school-hall', time: 'day', angle: 'high', chars: [ian('neutral', 'full', { x: 0.2, scale: 0.5 })] }, lines: [cap('Al fondo del pasillo. A doce metros. De frente.')] },
        { shot: { bg: 'black', chars: [ian('shocked', 'eyes')], extras: ['shadow-face'] }, sfx: [{ text: '…', size: 'big' }], fx: 'screentone' },
      ],
      notes: 'Clave: Ian lee labios de frente. La frase debe quedar dibujada en la boca de Valeria vista desde su punto de vista.',
    },
    // ───────────── 21 ─────────────
    {
      objective: 'Consecuencia: distancia, el mural interrumpido y la confusión de Valeria.',
      summary: 'Ian deja de ir a la sala 3. El mural queda cubierto con un nylon. En clase él evita mirarla, y cuando ella le habla de costado, él ya no intenta leerla. Valeria no entiende qué hizo.',
      tone: 'Gris, desolado.',
      composition: 'Tres viñetas mixtas: el mural tapado como cuerpo velado; dos viñetas de aula con el espacio vacío entre los bancos.',
      layout: { template: 'three-mixed' },
      panels: [
        { shot: { bg: 'art-wall', time: 'day', angle: 'low', extras: ['wind', 'petals'], prop: 'brush' }, lines: [cap('Semana tres. El jacarandá, tapado con un nylon. Sin terminar.')], sfx: [{ text: 'fuuu', size: 'medium' }], fx: 'gradient-tone' },
        { shot: { bg: 'classroom', time: 'day', chars: [ian('serious', 'half', { x: 0.7, pose: 'sit', flip: false }), val('sad', 'half', { x: 0.3, pose: 'sit' })] }, lines: [d('valeria', 'Ian… ¿Ian?'), th('valeria', 'No se da vuelta. ¿No me oye o no me quiere oír?')] },
        { shot: { bg: 'tone', chars: [val('sad', 'eyes')], extras: ['tears'] }, lines: [th('valeria', 'Volvió el silencio. Y esta vez no es casa de nadie.')], fx: 'screentone' },
      ],
    },
    // ───────────── 22 ─────────────
    {
      objective: 'Camila con Ian: su honestidad y su esfuerzo en LSA.',
      summary: 'Camila encuentra a Ian sentado detrás del nylon. Le habla en señas, torpe pero clara. Ian se sorprende: nadie del colegio había aprendido por él. Le cuenta, dolido, lo que leyó en los labios de Valeria.',
      tone: 'Cálido, sorpresivo, con un nudo.',
      composition: 'Columnas altas: Camila entra en la caja vertical derecha; a la izquierda, la sorpresa de Ian y la revelación del malentendido.',
      layout: { boxes: TALL_R },
      panels: [
        { shot: { bg: 'art-wall', time: 'sunset', chars: [cam('shy', 'full', { pose: 'wave' })], extras: ['petals'] }, lines: [sg('camila', 'Hola. Me llamo C-A-M-I. Aprendo despacio. Perdón.')] },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('surprised', 'bust', { flip: true })], extras: ['sparkles'] }, lines: [d('ian', '¿Aprendiste señas? ¿Por mí?'), th('camila', 'Me miró. Por primera vez, me miró a mí.')] },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('sad', 'face')], extras: ['shadow-face'] }, lines: [d('ian', 'Le leí los labios a Valeria. "Con él es fácil, no oye si me equivoco."'), d('ian', 'Para ella soy un lugar donde no la escuchan.')], fx: 'screentone' },
      ],
    },
    // ───────────── 23 ─────────────
    {
      objective: 'La confesión de Camila: la rival se vuelve personaje trágico y digno.',
      summary: 'Camila, temblando, le dice en señas que le gusta. Ian le agradece de verdad, pero su mirada se va al mural. Camila entiende. Sonríe llorando: "Ya sé. Te gusta ella. Se te ve en las manos."',
      tone: 'Agridulce, valiente.',
      composition: 'Splash vertical con dos figuras bajo el nylon que deja pasar la luz lila: la confesión rechazada merece una página entera, sin humillación.',
      layout: { boxes: [[0.02, 0.02, 0.96, 0.7], [0.5, 0.74, 0.48, 0.24], [0.02, 0.74, 0.46, 0.24]] },
      panels: [
        { shot: { bg: 'flowers', time: 'sunset', chars: [cam('crying', 'half', { x: 0.62, pose: 'reach', flip: true }), ian('surprised', 'half', { x: 0.3 })], extras: ['petals', 'tears', 'glow'] }, lines: [sg('camila', 'Me gustás, Ian.'), wh('camila', 'Lo practiqué cuarenta veces frente al espejo.')], sfx: [{ text: 'pum pum', size: 'medium', color: '#c0577a' }], fx: 'gradient-tone' },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('sad', 'face', { flip: true })] }, lines: [sg('ian', 'Gracias. De verdad. Pero…')] },
        { shot: { bg: 'tone', chars: [cam('crying', 'face')], extras: ['tears', 'sparkles'] }, lines: [d('camila', 'Ya sé. Te gusta ella. Se te ve en las manos, tonto.')] },
      ],
    },
    // ───────────── 24 ─────────────
    {
      objective: 'Clímax de la amistad: Camila elige la verdad y le revela el malentendido a Valeria.',
      summary: 'En la azotea, Camila confiesa que en parte se alegró cuando Valeria dejó de tocar porque por fin brillaba ella, que le gusta Ian, y que él le leyó los labios. Se abrazan llorando.',
      tone: 'Desgarrador y reparador.',
      composition: 'Hero-mid: el abrazo en el centro sostiene la página; alrededor, la confesión en fragmentos, como algo que cuesta decir de una vez.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'rooftop', time: 'sunset', chars: [cam('sad', 'bust')] }, lines: [d('camila', 'Cuando dejaste de tocar… una parte mía se alegró. Por fin era yo la que brillaba.')] },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [val('shocked', 'bust', { flip: true })] }, lines: [d('valeria', 'Cami…')] },
        { shot: { bg: 'flowers', time: 'sunset', chars: [cam('crying', 'half', { x: 0.6, pose: 'hold', flip: true }), val('crying', 'half', { x: 0.38, pose: 'hold' })], extras: ['petals', 'tears', 'glow'] }, lines: [d('camila', 'Y me gusta Ian. Y él te leyó los labios en el pasillo, boluda. Lo que dijiste.'), d('camila', 'Andá. Antes de que me arrepienta.')], fx: 'gradient-tone' },
        { shot: { bg: 'tone', chars: [val('shocked', 'eyes')], extras: ['shadow-face'] }, lines: [th('valeria', '"No oye si me equivoco." Dios mío. Lo traté igual que todos.')] },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [cam('happy', 'face')], extras: ['tears', 'sparkles'] }, lines: [d('camila', 'Igual el violín estrella sigo siendo yo, ¿eh?')] },
      ],
    },
    // ───────────── 25 ─────────────
    {
      objective: 'Reconciliación y decisión: el giro moral de Valeria.',
      summary: 'Valeria arranca el nylon del mural. Ian aparece. Ella le pide perdón en señas torpes y en voz alta: "Mentí. Con vos es fácil porque escuchás lo que no suena." Él le pide que toque para que todos oigan.',
      tone: 'Emotivo, esperanzador.',
      composition: 'Franjas: el nylon volando arriba (liberación); la columna alta con los dos frente a frente; a la izquierda, las señas y la respuesta.',
      layout: { boxes: STRIPS },
      panels: [
        { shot: { bg: 'art-wall', time: 'day', angle: 'low', chars: [val('determined', 'full', { pose: 'reach', scale: 0.7 })], extras: ['wind', 'petals'] }, sfx: [{ text: '¡fuuush!', size: 'big', rotate: -8 }], fx: 'speedlines' },
        { shot: { bg: 'flowers', chars: [ian('serious', 'half', { x: 0.65, flip: true }), val('crying', 'half', { x: 0.3, pose: 'reach' })], extras: ['petals', 'tears'] }, lines: [sg('valeria', 'Perdón. Yo… mentí.'), d('valeria', 'Con vos no es fácil porque no oís. Es fácil porque escuchás lo que no suena.')], fx: 'gradient-tone' },
        { shot: { bg: 'art-wall', time: 'day', chars: [ian('sad', 'face')] }, lines: [d('ian', 'Me dolió. Pensé que era tu lugar seguro porque yo "no contaba".')] },
        { shot: { bg: 'sparkles', chars: [ian('happy', 'bust', { x: 0.6 }), val('shy', 'face', { x: 0.25, flip: true, scale: 0.85 })], extras: ['blush', 'sparkles'] }, lines: [d('ian', 'Entonces tocá para que todos oigan. Yo voy a estar sintiendo.'), d('valeria', 'Voy a tocar en el Regional.')] },
      ],
    },
    // ───────────── 26 ─────────────
    {
      objective: 'Reconciliación madre-hija y revelación del pasado de Mónica.',
      summary: 'Valeria le dice a su madre: "Voy a tocar. Pero no por vos." Mónica, por primera vez, cuenta que ella también se congeló una vez y nunca volvió. Le saca a la hija el mantel del piano y le da su prendedor de jacarandá.',
      tone: 'Sanador, contenido, conmovedor.',
      composition: 'Dos columnas: madre a la derecha, hija a la izquierda, separadas por el canal; la última línea las une en el prendedor.',
      layout: { template: 'two-cols' },
      panels: [
        { shot: { bg: 'apartment', time: 'night', chars: [mama('sad', 'half', { pose: 'hold' })], extras: ['glow'], prop: 'piano' }, lines: [d('monica', 'A los diecinueve me congelé en el Colón. Nunca volví. Le dije a todo el mundo que fue por vos.'), d('monica', 'Fue por miedo. Perdoname por ponerte a tocar mi miedo.')], fx: 'screentone' },
        { shot: { bg: 'flowers', time: 'night', chars: [val('crying', 'half', { flip: true }), mama('crying', 'face', { x: 0.2, scale: 0.8 })], extras: ['tears', 'petals', 'sparkles'], prop: 'ring' }, lines: [d('valeria', 'Voy a tocar, má. Pero por mí.'), d('monica', 'Por eso. Llevá esto. Era de la abuela.')] },
      ],
      notes: 'El prop "ring" representa el prendedor de jacarandá de plata en la mano de la madre.',
    },
    // ───────────── 27 ─────────────
    {
      objective: 'Montaje de preparación: el elenco entero empuja hacia el clímax.',
      summary: 'Cuatro semanas en cuatro cuadros: Valeria practicando con Ian en el piso; Ian terminando ramas del mural; Camila enseñando a Valeria señas en la azotea; Tito llenando un formulario de "ajuste de accesibilidad".',
      tone: 'Energético, esperanzado.',
      composition: 'Grilla 4-koma de lectura rítmica, como compases de un ensayo: cada cuadro un personaje empujando la misma meta.',
      layout: { template: 'manga-4koma' },
      panels: [
        { shot: { bg: 'music-room', time: 'day', chars: [val('determined', 'half', { x: 0.65, pose: 'sit' }), ian('happy', 'half', { x: 0.25, pose: 'fall' })], prop: 'piano' }, lines: [cap('Semana uno.'), d('ian', 'Ese compás tembló. Otra vez.')] },
        { shot: { bg: 'art-wall', time: 'sunset', chars: [ian('determined', 'full', { pose: 'reach', scale: 0.7 })], extras: ['petals'], prop: 'brush' }, lines: [cap('Semana dos.')] },
        { shot: { bg: 'rooftop', time: 'day', chars: [cam('grin', 'half', { x: 0.65, flip: true, pose: 'point' }), val('laugh', 'half', { x: 0.3 })] }, lines: [cap('Semana tres.'), d('camila', '¡Así no, eso es "zapallo"! Mirá: "gracias" es así.')] },
        { shot: { bg: 'office', time: 'day', chars: [tito('smirk', 'bust')], prop: 'letter' }, lines: [cap('Semana cuatro.'), d('tito', 'Ajuste de accesibilidad: "un oyente que escucha con las manos". Aprobado, ¿eh?')] },
      ],
    },
    // ───────────── 28 ─────────────
    {
      objective: 'Clímax, parte 1: el miedo regresa en el escenario.',
      summary: 'Día del Certamen. Valeria sale al escenario con el vestido azul noche. Una tos en el público. Sus manos se congelan sobre el teclado como hace un año. El silencio se estira. Entonces ve a Ian, sentado junto al piano, apoyando su mano abierta sobre la tapa.',
      tone: 'Angustiante que se abre a la esperanza.',
      composition: 'Manga-vertical: eco formal de la página 1 (escenario, ojos, manos) que se rompe en la última viñeta con la mano de Ian.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'concert-hall', time: 'night', angle: 'high', chars: [val('serious', 'full', { pose: 'sit', scale: 0.7 })], extras: ['glow'], prop: 'piano' }, lines: [cap('22 de noviembre. Certamen Regional. Participante número 9.')], sfx: [{ text: 'cof, cof', size: 'small' }] },
        { shot: { bg: 'tone', chars: [val('scared', 'eyes')], extras: ['shadow-face', 'sweat'] }, lines: [th('valeria', 'No. Otra vez no. El silencio…')], fx: 'screentone' },
        { shot: { bg: 'black', prop: 'hand' }, sfx: [{ text: '…', size: 'big' }], fx: 'gradient-tone' },
        { shot: { bg: 'concert-hall', time: 'night', chars: [ian('happy', 'half', { x: 0.3, pose: 'reach', flip: false })], extras: ['glow', 'sparkles'], prop: 'piano' }, lines: [th('valeria', 'Su mano. Abierta sobre la tapa. Esperándome.'), th('valeria', '"Para mí el silencio es casa."')] },
      ],
    },
    // ───────────── 29 ─────────────
    {
      objective: 'Clímax, parte 2: la interpretación como explosión emocional y visual.',
      summary: 'Valeria respira, hace la seña de "otra vez" para sí misma y toca. La música estalla en pétalos que llenan el auditorio. Ian, con los ojos cerrados y la mano sobre el piano, llora sonriendo.',
      tone: 'Sublime, liberador.',
      composition: 'Splash: una sola imagen a página completa; el sonido hecho flor. La cumbre visual de la obra.',
      layout: { template: 'splash' },
      panels: [
        { shot: { bg: 'flowers', time: 'night', angle: 'low', chars: [val('happy', 'half', { x: 0.62, pose: 'sit' }), ian('crying', 'bust', { x: 0.25, pose: 'reach' })], extras: ['petals', 'sparkles', 'flowers', 'glow', 'tears'], prop: 'piano' }, lines: [th('valeria', 'Escuchá, Ian. No: sentí.'), th('ian', 'Llega en diferido. Y llega entero.')], sfx: [{ text: 'TIRIRIIIN…', size: 'big', color: '#9b7bd1', rotate: -8 }], fx: 'gradient-tone' },
      ],
      notes: 'Pétalos lilas desde el piano hacia el público; Martina en la última fila, de pie, con las manos en la boca.',
    },
    // ───────────── 30 ─────────────
    {
      objective: 'Resolución colectiva: el aplauso en señas y la madre.',
      summary: 'Silencio después del último acorde. Camila se pone de pie y aplaude en señas, con las manos en alto. Todo el auditorio la imita. Mónica llora sin esconderse. Valeria, por primera vez, no escucha las toses: ve las manos.',
      tone: 'Euforia emotiva.',
      composition: 'Hero arriba con el auditorio lleno de manos agitadas; tres viñetas íntimas de Camila, la madre y Valeria.',
      layout: { template: 'hero-top' },
      panels: [
        { shot: { bg: 'concert-hall', time: 'night', angle: 'high', chars: [cam('crying', 'half', { x: 0.7, pose: 'wave' })], extras: ['sparkles', 'petals'] }, lines: [cap('Aplauso en señas: manos en alto, agitándose como hojas.')], sfx: [{ text: 'fuuuu…', size: 'medium' }] },
        { shot: { bg: 'concert-hall', time: 'night', chars: [cam('happy', 'face', { flip: true })], extras: ['tears'] }, lines: [sh('camila', '¡Bravo, Vale!')] },
        { shot: { bg: 'concert-hall', time: 'night', chars: [mama('crying', 'face')], extras: ['tears', 'glow'] }, lines: [wh('monica', 'Mi nena.')], fx: 'screentone' },
        { shot: { bg: 'sparkles', chars: [val('crying', 'face', { flip: true })], extras: ['tears', 'sparkles'] }, lines: [th('valeria', 'No escucho toses. Veo manos. Cientos de manos.')] },
      ],
    },
    // ───────────── 31 ─────────────
    {
      objective: 'Confesión romántica bajo los jacarandás: la escena insignia del volumen.',
      summary: 'Afuera, bajo los jacarandás de la avenida, los pétalos caen. Ian le dice "Me gustás" en voz alta y en señas a la vez. Valeria responde en señas, despacio: "Yo también. Otra vez." Sus frentes se tocan.',
      tone: 'Romántico pleno, delicado.',
      composition: 'Splash con pétalos cayendo sobre dos figuras de cuerpo entero; la confesión en dos idiomas como un acorde de dos notas.',
      layout: { template: 'splash' },
      panels: [
        { shot: { bg: 'flowers', time: 'night', angle: 'normal', chars: [ian('shy', 'half', { x: 0.62, pose: 'reach', flip: true }), val('shy', 'half', { x: 0.38, pose: 'reach' })], extras: ['petals', 'sparkles', 'blush', 'glow', 'flowers'] }, lines: [d('ian', 'Me gustás, Valeria.'), sg('ian', 'Me gustás.'), sg('valeria', 'Yo también. Otra vez. Para siempre otra vez.')], sfx: [{ text: 'pum pum', size: 'small', color: '#c0577a' }], fx: 'gradient-tone' },
      ],
      notes: 'Las manos de ambos dibujadas en primer plano, enmarcando las caras. Los pétalos caen "en diferido": algunos todavía en el aire, otros sobre sus hombros.',
    },
    // ───────────── 32 ─────────────
    {
      objective: 'Cierre de primer volumen: resolución visual del mural y gancho suave.',
      summary: 'A la mañana siguiente pintan juntos la última rama del jacarandá, dejando un hueco blanco "para lo que todavía no sabemos". Tito llega con un sobre: invitación al Certamen Nacional, el mismo escenario donde todo empezó.',
      tone: 'Sereno, feliz, con un latido de expectativa.',
      composition: 'Hero-mid: el mural casi terminado como gran viñeta central, rodeado de pequeños momentos; la carta final cierra con un susurro, no un grito.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'art-wall', time: 'day', prop: 'hand', extras: ['petals'] }, lines: [cap('A la mañana siguiente.')], sfx: [{ text: 'fsss', size: 'small' }] },
        { shot: { bg: 'art-wall', time: 'day', chars: [ian('happy', 'bust', { flip: true })] }, lines: [d('ian', 'Ese hueco queda en blanco. Para lo que todavía no sabemos.')] },
        { shot: { bg: 'art-wall', time: 'day', angle: 'low', chars: [ian('happy', 'full', { x: 0.62, pose: 'stand', scale: 0.6 }), val('happy', 'full', { x: 0.4, pose: 'stand', scale: 0.6 }), cam('grin', 'full', { x: 0.15, pose: 'wave', scale: 0.55 })], extras: ['petals', 'sparkles', 'flowers'] }, lines: [nar('El jacarandá florece sin hojas. Nosotros, sin saber cómo.')], fx: 'gradient-tone' },
        { shot: { bg: 'art-wall', time: 'day', chars: [tito('smirk', 'bust')], prop: 'letter' }, lines: [d('tito', 'Llegó esto, maestra. Certamen Nacional. Marzo. El mismo escenario, ¿eh?')] },
        { shot: { bg: 'sparkles', chars: [val('determined', 'face'), ian('happy', 'face', { x: 0.25, flip: true, scale: 0.85 })], extras: ['petals', 'blush'] }, lines: [d('valeria', '¿Venís a escucharme?'), sg('ian', 'Voy a sentirte.'), cap('Fin del volumen 1.')] },
      ],
    },
  ],
}
