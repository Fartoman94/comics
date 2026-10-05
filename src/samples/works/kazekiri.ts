import type { WorkDef } from '../types'

/**
 * MUESTRA 2 — MANGA SHONEN. "KAZEKIRI: El filo del aliento".
 * Un chico nacido sin sello de viento en un mundo de islas flotantes descubre que su poder
 * no está afuera, sino en su propio pecho. Lectura de derecha a izquierda (primera viñeta arriba a la derecha).
 */
export const work: WorkDef = {
  id: 'kazekiri',
  title: 'KAZEKIRI',
  subtitle: 'El filo del aliento',
  genre: 'Shonen de aventura y acción fantástica (torneo, entrenamiento, rivalidad)',
  style: 'shonen',
  kind: 'manga',
  formatId: 'manga-tankobon',
  readingDirection: 'rtl',
  tone: 'Enérgico, luminoso y obstinado; humor rápido entre golpes, y momentos de silencio que pegan más fuerte que cualquier explosión.',
  audience: 'Lectores de 12 a 25 años que aman el shonen clásico: rivales que se respetan, maestros excéntricos, entrenamientos imposibles y peleas que se ganan con el corazón.',
  logline: 'En un archipiélago de islas que flotan sostenidas por el Viento, un chico nacido sin el sello que permite cortarlo se mete a la fuerza en el torneo de la Academia de Cortavientos, y descubre que el único viento que nadie puede quitarle es el que lleva adentro.',
  synopsis: [
    'En el Archipiélago de Aozora el Viento está vivo: sostiene las islas sobre el Mar de Nubes y sólo quienes nacen con un sello en la palma pueden agarrarlo y cortarlo con sus hojas. Sora Kanata, quince años, hijo de una aldea pobre de molinos, nació con la palma lisa. Aun así salta al vacío en un planeador casero construido por su amiga Mio para llegar a la prueba de ingreso de la Academia de Cortavientos.',
    'Gracias a una regla olvidada —"quien llegue volando por sus medios, podrá combatir"— la examinadora Yura Senkai lo deja entrar. En la primera ronda le toca Rei Hayato, el prodigio de una casa noble, que lo destroza con un solo corte frente a toda la arena. Humillado, Sora recibe una última oportunidad: la repesca, en treinta días.',
    'Esa noche lo encuentra Gendo, un viejo maestro ciego y manco que alguna vez fue leyenda. Su método no enseña a cortar, sino a callar: cruzar una cuerda sobre el abismo hasta una campana que suena con el menor soplo. Allí Sora entiende la verdad: no nació sin sello, nació sin cerradura. Su viento nunca salió de su pecho. Y un solo aliento, soltado como filo, puede partir el cielo.',
    'En la revancha, Sora parte el Muro Celeste de Rei y se gana su respeto. Pero el silencio que sigue no es paz: una Tormenta Hueca, bestia de viento muerto, emerge del Mar de Nubes y empieza a devorar las corrientes que sostienen la isla. Sobre su cabeza, un enmascarado alza la palma y muestra un sello que brilla con el color exacto del aliento de Sora.',
  ].join('\n\n'),
  visualProposal: 'Blanco y negro de alto contraste con tramas densas en cielos y sombras, y blanco puro reservado para el viento cortado: el filo se dibuja como ausencia de tinta. Viñetas verticales y diagonales para la velocidad, splashes a página completa en cada giro, líneas de velocidad en los desplazamientos y líneas de foco en los rostros decisivos. Las islas flotantes se componen siempre con vacío debajo: el abismo es un personaje más. Onomatopeyas grandes, japonesas y en castellano, integradas al dibujo (ZAN, DOOON, GOGOGO, BAKKO, ¡FSSSH!).',
  world: {
    setting: 'El Archipiélago de Aozora: cientos de islas de roca y raíces que flotan sobre un Mar de Nubes sin fondo. Las ricas están arriba, cerca del sol; las pobres, abajo, donde el viento es frío y desordenado. Entre ellas se viaja en planeadores, puentes de cuerda y barcazas de vela.',
    rules: [
      'El Viento es una energía viva que fluye en corrientes. Sostiene las islas: si las corrientes de una isla se rompen, la isla cae al Mar de Nubes.',
      'El sello de viento aparece en la palma al nacer. Permite percibir las corrientes y "agarrarlas". Sin sello, el Viento resbala: nunca nadie sin sello logró cortar.',
      'Un cortaviento corta corrientes con su hoja y les da forma: filo (corte recto), espiral (taladro), muro (escudo). Cada casa noble custodia sus formas como herencia.',
      'Cortar cuesta aliento. Cada corte consume el aire de los pulmones; abusar provoca el "ahogo": desmayo, y en casos extremos, la muerte.',
      'Las Tormentas Huecas son bestias de viento muerto: vacíos con forma que devoran corrientes. Sólo pueden herirse desde su "ojo", el punto donde el vacío todavía respira.',
      'Viento interior (secreto de Gendo): quien nace sin sello no puede agarrar el viento de afuera, pero tampoco pierde nunca el propio. Ese aliento acumulado puede soltarse como una sola hoja imposible de desviar. Hoy, Sora sólo aguanta un corte por combate.',
    ],
    era: 'Era del Viento Quieto, año 812 desde la Gran Caída. Tecnología de velas, engranajes, madera laminada y faroles de aceite.',
    aesthetic: 'Fantasía aérea de inspiración artesanal: molinos, cometas, campanas, cuerdas tensas y túnicas que siempre flamean. La Academia es una torre en espiral con balcones abiertos al vacío; las aldeas bajas, techos remendados y ropa tendida que el viento roba.',
    places: [
      { name: 'Isla Kiriha', description: 'Aldea pobre de molinos en el borde inferior del archipiélago. Tierra de Sora y Mio; sus acantilados son la pista de despegue de los locos.' },
      { name: 'Takamine, la Ciudad Alta', description: 'Isla noble donde se alza la Academia. Calles limpias, estandartes de casas y gente que muestra la palma como quien muestra un apellido.' },
      { name: 'Academia de Cortavientos (Torre Sorakiri)', description: 'Torre en espiral de veinte pisos, cada balcón una sala de práctica abierta al cielo. Sólo entran treinta aspirantes por año.' },
      { name: 'Arena del Remolino', description: 'Disco de piedra flotante unido a Takamine por cadenas. Un remolino perpetuo gira en su borde: quien cae del disco, pierde.' },
      { name: 'Roca de la Campana', description: 'Islote diminuto donde vive Gendo. Una campana de bronce cuelga sobre el abismo, atada a una sola cuerda: suena con cualquier soplo.' },
      { name: 'Ochijima, la Isla Caída', description: 'Ruinas de una isla que se hundió cuando una Tormenta Hueca devoró sus corrientes hace treinta años. Gendo perdió allí el brazo y la vista.' },
      { name: 'El Mar de Nubes', description: 'Lo que hay debajo de todo. Nadie que cayó volvió para contar si tiene fondo.' },
    ],
    conflicts: [
      'Sora contra un mundo que decide el valor de cada persona por una marca de nacimiento.',
      'Rei contra la exigencia de su padre y de la Casa Hayato: un prodigio que no tiene permitido perder ni empatar.',
      'Las islas contra las Tormentas Huecas, que vuelven después de treinta años de calma.',
      'El misterio del sello ausente de Sora y del enmascarado que parece tenerlo.',
    ],
    culture: [
      'Saludarse mostrando la palma: el sello es un documento, un apellido y una clase social.',
      'Las campanas de viento en cada casa: si suenan de noche sin brisa, dicen, una tormenta está despertando.',
      'En las islas bajas, los sin sello trabajan de cargadores, cuerderos o planeadoristas; en las altas, casi no existen.',
      'Antes de un combate oficial, los cortavientos soplan sobre su hoja: "te presto mi aliento".',
    ],
  },
  structure: {
    inicio: 'Páginas 1–6: Sora salta desde Kiriha en el planeador de Mio, cae, llega a Takamine y se inscribe en la prueba gracias a una regla olvidada. Conoce a Rei, que le promete sacarlo de la arena.',
    desarrollo: 'Páginas 7–22: derrota humillante en la primera ronda; Gendo lo toma como alumno; entrenamiento en la Roca de la Campana; historias de Mio y Rei; Sora descubre su viento interior y el costo de usarlo.',
    climax: 'Páginas 23–28: la repesca contra Rei. Sora aguanta todo para un solo corte: KAZEKIRI, Primer Aliento, parte el Muro Celeste. Rei lo reconoce como rival.',
    cierre: 'Páginas 29–32: una Tormenta Hueca ataca la Arena; Sora y Rei pelean juntos hasta el ojo de la bestia; un enmascarado revela que tiene el sello que a Sora le falta.',
    giros: [
      'La regla olvidada de la Academia permite que un sin sello compita (p5).',
      'Rei no desprecia a Sora por soberbia: tiene miedo de lo que significa perder ante él (p11, p18).',
      'Sora no nació sin sello: nació "sin cerradura"; su viento siempre estuvo adentro (p20).',
      'La campana suena sin que nada la toque: el viento interior existe (p21).',
      'El silencio después de la pelea es el hambre de una Tormenta Hueca (p29).',
      'El enmascarado tiene en la palma el sello de Sora (p32).',
    ],
    cliffhangers: [
      'p6: el cuadro del torneo empareja a Sora con Rei en la primera ronda.',
      'p11: tras la derrota, un viejo manco se ríe en las gradas.',
      'p13: "Primero vas a aprender a no moverte."',
      'p22: un solo corte por combate, y la repesca es mañana.',
      'p29: el Mar de Nubes se abre y algo enorme y vacío sube.',
      'p32: "Ese sello que te falta... lo tengo yo." Continuará en el Volumen 2.',
    ],
    escenasClave: [
      'El salto desde el acantilado de Kiriha (p1).',
      'Rei parte la espada de madera de Sora con un corte invisible (p8).',
      'Sora expulsado de la arena por el Muro Celeste (p10).',
      'Gendo comiendo un onigiri en la oscuridad: "Hacías mucho ruido. Ruido bueno." (p12).',
      'La campana suena sin viento: nace el viento interior (p21).',
      'KAZEKIRI: Primer Aliento parte el Muro Celeste en dos (p27).',
      'La palma del enmascarado (p32).',
    ],
    ritmo: 'p1–6 arranque veloz y luminoso · p7–11 golpe y caída (dos splashes) · p12–20 respiración lenta, humor y emoción · p21–22 explosión de poder · p23–28 combate en escalada con splash central · p29–32 catástrofe y cliffhanger, viñetas cada vez más grandes.',
  },
  characters: [
    {
      id: 'sora',
      name: 'Sora Kanata',
      age: '15 años',
      role: 'protagonista',
      personality: 'Terco, ruidoso, alegre hasta lo irritante. Se ríe cuando tiene miedo y se levanta antes de pensar si conviene. Generoso sin medida: comparte lo poco que tiene.',
      goal: 'Entrar en la Academia de Cortavientos y demostrar que nadie vale por la marca con la que nace.',
      fear: 'Que su madre y su aldea tengan razón en compadecerlo: ser para siempre "el pobrecito sin sello".',
      flaw: 'Confunde insistir con avanzar; hace mucho ruido, por dentro y por fuera, y no sabe quedarse quieto.',
      arc: 'De gritarle al viento a escuchar el propio: aprende que su carencia era una puerta, y que la fuerza real es saber esperar el momento de un solo corte.',
      relations: 'Mejor amigo de Mio, con quien comparte techo, hambre y sueños. Rival declarado de Rei, a quien termina entendiendo. Alumno insoportable y querido de Gendo.',
      physical: 'Bajo para su edad, flaco y fibroso, con raspones permanentes. Pelo negro en puntas rebeldes que el viento nunca logra peinar. Ojos ámbar enormes.',
      visualTraits: 'Bufanda roja larguísima (de su madre) que siempre flamea y marca la dirección del viento en cada viñeta. Vendaje en la palma derecha para tapar que no tiene sello.',
      outfit: 'Chaqueta corta remendada, rojo ladrillo con ribetes amarillos; pantalón de cargador y sandalias de cuerda. Espada de madera atada a la espalda.',
      expressions: 'Sonrisa de dientes apretados, furia con lágrimas, sorpresa de ojos redondos, y una cara nueva y seria cuando aprende a respirar.',
      speech: 'Rioplatense, rápido, exclamativo. Se presenta gritando su nombre completo. Usa "¡todavía!" como grito de guerra.',
      rig: { gender: 'm', age: 'young', build: 'slim', skin: '#e8b98f', hair: { style: 'spiky', color: '#1e1b1a' }, eyes: { color: '#d98c1f' }, outfit: { kind: 'jacket', main: '#b8432f', accent: '#f2c94c' }, accessory: 'scarf', mark: 'bandage' },
    },
    {
      id: 'rei',
      name: 'Rei Hayato',
      age: '15 años',
      role: 'rival',
      personality: 'Frío, preciso, cortante. Habla poco y nunca dice lo que siente. Debajo, una disciplina que ya se volvió miedo.',
      goal: 'Ser el primero del año y cumplir el destino de la Casa Hayato sin un solo error.',
      fear: 'Defraudar a su padre, que le enseñó que un Hayato que pierde deja de ser un Hayato.',
      flaw: 'Orgullo usado como armadura; desprecia en Sora lo que no se permite tener: libertad para fallar.',
      arc: 'Del desprecio a la curiosidad y al respeto: en Sora ve por primera vez a alguien que pelea por elección y no por obligación.',
      relations: 'Hijo único del Lord Hayato. Compañero de prueba de Sora y luego su rival jurado. Yura lo vigila porque reconoce en él la misma presión que ella sufrió.',
      physical: 'Alto, delgado, postura perfecta. Pelo plateado peinado de costado, un mechón sobre el ojo izquierdo. Ojos azul hielo.',
      visualTraits: 'Sello de viento brillante como una estrella de seis puntas en la palma. Arete con el emblema de la casa. Mano siempre sobre la empuñadura.',
      outfit: 'Abrigo largo de noble azul noche con bordados dorados, cuello alto y botas. Espada fina de acero celeste.',
      expressions: 'Desdén de ojos entrecerrados, seriedad de piedra, y —muy pocas veces— una sorpresa que lo desarma.',
      speech: 'Frases cortas, formales, sin muletillas. Llama a Sora "sin sello" hasta que, al final, dice su nombre.',
      rig: { gender: 'm', age: 'young', build: 'slim', skin: '#f1d3bd', hair: { style: 'side-swept', color: '#cfd6e0' }, eyes: { color: '#6fa8dc' }, outfit: { kind: 'coat', main: '#1f2a44', accent: '#c9a227' }, accessory: 'cape', mark: 'earring' },
    },
    {
      id: 'gendo',
      name: 'Maestro Gendo',
      age: 'Alrededor de 70 años',
      role: 'mentor',
      personality: 'Gruñón, glotón, burlón y sabio a su pesar. Hace chistes pésimos en el peor momento y enseña lecciones enormes como si fueran comentarios al pasar.',
      goal: 'Encontrar a alguien capaz de cortar una Tormenta Hueca antes de que vuelvan, y saldar una deuda con Ochijima.',
      fear: 'Ver caer otra isla mientras él, viejo e inútil, sólo escucha.',
      flaw: 'Se esconde en la burla para no hablar de su pasado; enseña con métodos que rozan la crueldad.',
      arc: 'De ermitaño amargado a maestro que vuelve a apostar por alguien. En este tomo revela parte de su pasado; el resto, un secreto ligado al enmascarado.',
      relations: 'Fue "El Manco del Remolino", leyenda de la Academia. Conoce a Yura desde niña. Toma a Sora como alumno y adopta a Mio como "la única con cerebro".',
      physical: 'Calvo, cejas blancas espesas, cuerpo aún macizo. Le falta el brazo izquierdo y tiene los ojos cerrados por una cicatriz que cruza su rostro.',
      visualTraits: 'Parche de tela sobre el ojo derecho, manga izquierda anudada, rosario de cuentas de madera. Siempre con un onigiri o un bastón.',
      outfit: 'Túnica marrón gastada con faja roja y sandalias de madera.',
      expressions: 'Sonrisa desdentada, ceño de tormenta, y una quietud absoluta cuando "escucha" el viento.',
      speech: 'Voz grave, frases secas, refranes inventados. Llama a Sora "Ruido".',
      rig: { gender: 'm', age: 'old', build: 'strong', skin: '#c99468', hair: { style: 'bald', color: '#e8e4dc' }, eyes: { color: '#8a8a8a' }, outfit: { kind: 'robe', main: '#5b4a3a', accent: '#a33a2a' }, accessory: 'necklace', mark: 'eyepatch' },
    },
    {
      id: 'mio',
      name: 'Mio Tsugane',
      age: '15 años',
      role: 'aliado',
      personality: 'Ingeniosa, mandona, de corazón enorme. Habla rápido cuando piensa y llora sin vergüenza cuando algo la emociona.',
      goal: 'Construir un planeador que haga volar a cualquiera, con o sin sello.',
      fear: 'Que uno de sus inventos falle con alguien querido arriba, como pasó con su padre.',
      flaw: 'Perfeccionista y culposa; carga sola con riesgos que no le corresponden.',
      arc: 'De temer que sus alas maten a Sora a confiar en que sus alas lo llevan donde nadie más puede.',
      relations: 'Vecina y hermana elegida de Sora. Aprendiz informal de Gendo en mecánica de vuelo. Le cae mal Rei... al principio.',
      physical: 'Mediana, manos llenas de cortes y grasa. Pelo castaño rojizo atado en coleta alta. Pecas por todos lados.',
      visualTraits: 'Antiparras de vuelo en la frente, cinturón de herramientas, planos enrollados bajo el brazo.',
      outfit: 'Mameluco de trabajo verde con detalles mostaza, mangas arremangadas y botas.',
      expressions: 'Concentración con la lengua afuera, enojo de puños en jarra, risa explosiva y llanto a mares.',
      speech: 'Técnica y atropellada; mezcla términos de vuelo con insultos cariñosos ("cabeza de molino").',
      rig: { gender: 'f', age: 'young', build: 'average', skin: '#f0c7a1', hair: { style: 'ponytail', color: '#b5562d' }, eyes: { color: '#4f7f5f' }, outfit: { kind: 'workwear', main: '#3f6e5a', accent: '#e0a83a' }, accessory: 'goggles', mark: 'freckles' },
    },
    {
      id: 'yura',
      name: 'Examinadora Yura Senkai',
      age: '29 años',
      role: 'secundario',
      personality: 'Estricta, irónica, justa hasta la incomodidad. Disfruta en secreto cuando alguien rompe las reglas con argumentos.',
      goal: 'Que la Academia recupere su propósito: formar cortavientos para proteger islas, no apellidos.',
      fear: 'Que la próxima Tormenta Hueca encuentre a la Academia ocupada en ceremonias.',
      flaw: 'Usa el reglamento como escudo y a veces llega tarde a la compasión.',
      arc: 'De árbitro distante a aliada discreta de Sora y vigía de Rei.',
      relations: 'Ex alumna de Gendo. Examinadora jefa de la prueba de ingreso. Conoce la presión de la Casa Hayato desde adentro.',
      physical: 'Alta, de espalda recta, pelo negro largo y lacio. Mirada afilada.',
      visualTraits: 'Anteojos finos que se acomoda antes de cada veredicto. Silbato de bronce colgado del cuello.',
      outfit: 'Uniforme de oficial de la Academia, gris pizarra con ribetes blancos y capa corta.',
      expressions: 'Media sonrisa irónica, severidad total, y un asombro contenido que nunca deja escapar del todo.',
      speech: 'Precisa, de cifras y artículos del reglamento. "Artículo catorce" es su frase favorita.',
      rig: { gender: 'f', age: 'adult', build: 'slim', skin: '#e3b591', hair: { style: 'long', color: '#141414' }, eyes: { color: '#5a3e2b' }, outfit: { kind: 'uniform', main: '#4a5560', accent: '#f2f2f2' }, mark: 'glasses' },
    },
    {
      id: 'hueco',
      name: 'El Heraldo Hueco',
      age: 'Desconocida',
      role: 'antagonista',
      personality: 'Calmo, cortés, casi tierno. Habla de la destrucción como quien habla del clima. No odia: cosecha.',
      goal: 'Despertar a las Tormentas Huecas y "liberar" el archipiélago del Viento. Por ahora, encontrar a Sora.',
      fear: 'Desconocido. Su máscara se agrieta cuando escucha una campana.',
      flaw: 'Subestima lo que no puede medir: el viento que no sale.',
      arc: 'Aparece al final del tomo como amenaza mayor. Su vínculo con el sello de Sora y con el pasado de Gendo es el gran misterio de la serie.',
      relations: 'Monta y guía a la Tormenta Hueca. Gendo reconoce su máscara de Ochijima. Lleva en la palma un sello que no es suyo.',
      physical: 'Figura delgada y alta, capa negra que no flamea aunque haya viento. Pelo blanco largo que asoma de la capucha.',
      visualTraits: 'Máscara blanca lisa con una sola grieta vertical, como un corte. Su palma emite el mismo brillo ámbar que los ojos de Sora.',
      outfit: 'Abrigo negro largo, capa con capucha, guantes que se quita sólo para mostrar el sello.',
      expressions: 'Siempre cubierto: se lee por la inclinación de la cabeza y el gesto de las manos.',
      speech: 'Lento, en voz baja, con pausas. Llama a Sora "recipiente".',
      rig: { gender: 'x', age: 'adult', build: 'slim', skin: '#d9d4cc', hair: { style: 'long', color: '#f0f0f0' }, eyes: { color: '#d98c1f' }, outfit: { kind: 'coat', main: '#111111', accent: '#6b6b6b' }, accessory: 'cape', mark: 'scar' },
    },
  ],
  cover: {
    title: 'KAZEKIRI',
    subtitle: 'El filo del aliento',
    tagline: 'Nació sin sello. Su viento nunca se fue.',
    shot: {
      bg: 'island-sky',
      time: 'day',
      angle: 'low',
      chars: [
        { id: 'sora', expr: 'determined', pose: 'fist', framing: 'half', x: 0.5, scale: 1.15 },
        { id: 'rei', expr: 'serious', pose: 'guard', framing: 'bust', x: 0.18, flip: false, scale: 0.85 },
        { id: 'gendo', expr: 'smirk', pose: 'arms-crossed', framing: 'bust', x: 0.84, flip: true, scale: 0.8 },
      ],
      extras: ['wind', 'energy', 'dust'],
    },
  },
  altCover: {
    title: 'KAZEKIRI',
    subtitle: 'Volumen 1 — Sin sello',
    tagline: 'Un solo aliento. Un solo corte. Todo el cielo.',
    shot: {
      bg: 'storm-sky',
      time: 'night',
      angle: 'dutch',
      chars: [
        { id: 'sora', expr: 'furious', pose: 'punch', framing: 'full', x: 0.62, scale: 1.1 },
        { id: 'hueco', pose: 'stand', framing: 'silhouette', x: 0.2, scale: 1.3 },
      ],
      extras: ['lightning', 'wind', 'energy'],
    },
  },
  pages: [
    // ───────────────────────── INICIO ─────────────────────────
    {
      objective: 'Enganchar desde la primera imagen: un chico saltando al vacío con alas caseras en un mundo de islas flotantes.',
      summary: 'Al amanecer, Sora salta desde el acantilado de Kiriha en el planeador de Mio, rumbo a la torre de la Academia que se ve a lo lejos.',
      tone: 'Euforia temeraria, asombro y libertad.',
      composition: 'Splash a página completa en contrapicado: el abismo ocupa la mitad inferior y la torre lejana cierra la diagonal de lectura derecha→izquierda.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'island-sky', time: 'day', angle: 'low', chars: [{ id: 'sora', expr: 'grin', pose: 'fly', framing: 'full', x: 0.45, flip: true, scale: 1.2 }], extras: ['wind', 'dust'], prop: 'glider' },
          lines: [
            { kind: 'narration', text: 'Archipiélago de Aozora. Islas que flotan sobre un mar de nubes, sostenidas por el Viento.' },
            { kind: 'narration', text: 'Sólo quienes nacen con un sello en la palma pueden cortarlo.' },
            { who: 'sora', kind: 'shout', text: '¡Academia de Cortavientos... AHÍ VOOOY!' },
          ],
          sfx: [{ text: 'BASHUUU', size: 'big', rotate: -12 }],
          fx: 'speedlines',
        },
      ],
      notes: 'La bufanda roja marca la dirección del viento. Dejar la torre pequeña pero nítida a la izquierda (destino).',
    },
    {
      objective: 'Presentar a Mio, la ausencia del sello y la terquedad de Sora.',
      summary: 'Mio grita desde el borde que el planeador no está probado. Flashback: la partera muestra la palma lisa del bebé Sora; los aldeanos murmuran. De vuelta al cielo, Sora sonríe y se desata el vendaje.',
      tone: 'Cómico y conmovedor a la vez.',
      composition: 'Manga-dynamic: viñeta grande de Mio arriba a la derecha, inserto de flashback en trama, y cierre en primer plano de la palma vendada.',
      layout: { template: 'manga-dynamic' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'mio', expr: 'furious', pose: 'point', framing: 'half', x: 0.55 }], extras: ['wind'] },
          lines: [
            { who: 'mio', kind: 'shout', text: '¡SORA, CABEZA DE MOLINO! ¡Ese planeador nunca voló con peso!' },
            { who: 'mio', kind: 'shout', text: '¡Las costillas son de bambú de tercera!' },
          ],
        },
        {
          shot: { bg: 'sky-day', time: 'day', chars: [{ id: 'sora', expr: 'laugh', pose: 'fly', framing: 'bust', x: 0.5, flip: true }], extras: ['wind'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡Entonces lo estamos probando ahora!' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'village', time: 'day', prop: 'hand' },
          lines: [
            { kind: 'caption', text: 'Hace quince años.' },
            { kind: 'caption', text: '"Pobrecito... nació sin sello."' },
          ],
          fx: 'screentone',
        },
        {
          shot: { bg: 'village', time: 'sunset', angle: 'high', chars: [{ id: 'sora', expr: 'sad', pose: 'sit', framing: 'full', x: 0.5 }] },
          lines: [{ kind: 'narration', text: 'Desde entonces, en Kiriha lo llamaron así: "el pobrecito".' }],
          fx: 'gradient-tone',
        },
        {
          shot: { bg: 'sky-day', time: 'day', chars: [{ id: 'sora', expr: 'determined', pose: 'fist', framing: 'face', x: 0.5 }], extras: ['wind'] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Pobrecito las pelotas. ¡Hoy no soy nadie... y mañana, cortaviento!' }],
          fx: 'focuslines',
        },
      ],
      notes: 'La voz del flashback es de una aldeana fuera de cuadro: cartela entre comillas sobre trama.',
    },
    {
      objective: 'Primera crisis: el sueño se rompe en el aire, y la amistad lo salva.',
      summary: 'Una corriente cruzada parte el ala. Sora cae en picada. Mio se lanza en su propio planeador, lo atrapa de la bufanda y ambos se estrellan en un tejado de Takamine.',
      tone: 'Tensión, vértigo y alivio cómico.',
      composition: 'Manga-vertical: cuatro tiras altas que acompañan la caída, cada una más inclinada que la anterior.',
      layout: { template: 'manga-vertical' },
      panels: [
        {
          shot: { bg: 'sky-day', time: 'day', angle: 'dutch', prop: 'glider', extras: ['wind'] },
          sfx: [{ text: 'BAKI!!', size: 'big', rotate: 15 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'speed', angle: 'high', chars: [{ id: 'sora', expr: 'shocked', pose: 'fall', framing: 'full', x: 0.5 }], extras: ['wind', 'sweat'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡¡AAAAAHHH—!!' }],
          sfx: [{ text: 'FYUUUUN', size: 'medium', rotate: 80 }],
        },
        {
          shot: { bg: 'sky-day', time: 'day', angle: 'dutch', chars: [{ id: 'mio', expr: 'determined', pose: 'reach', framing: 'half', x: 0.6, flip: true }, { id: 'sora', expr: 'scared', pose: 'fall', framing: 'half', x: 0.25 }], extras: ['wind'] },
          lines: [{ who: 'mio', kind: 'shout', text: '¡TE TENGOOO!' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'rooftop', time: 'day', angle: 'high', chars: [{ id: 'sora', expr: 'tired', pose: 'fall', framing: 'full', x: 0.4 }, { id: 'mio', expr: 'angry', pose: 'sit', framing: 'full', x: 0.7 }], extras: ['dust'] },
          lines: [
            { who: 'mio', kind: 'dialogue', text: 'Me debés un ala, dos costillas y diez años de vida.' },
            { who: 'sora', kind: 'dialogue', text: 'Pero llegamos, ¿no? ¡Takamine!' },
          ],
          sfx: [{ text: 'DOGASHA', size: 'medium', rotate: -8 }],
        },
      ],
    },
    {
      objective: 'Mostrar el mundo de la Academia y la desigualdad que define a Sora.',
      summary: 'La torre Sorakiri domina la Ciudad Alta. En la explanada, cientos de aspirantes alzan las palmas: los sellos brillan. Sora esconde la suya vendada; Mio le baja la mano del bolsillo.',
      tone: 'Asombro y vergüenza, luego valentía.',
      composition: 'Hero-top: panorámica de la torre arriba y tres viñetas bajas que bajan del espectáculo a la mano de Sora.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'academy', time: 'day', angle: 'low', extras: ['wind'] },
          lines: [{ kind: 'caption', text: 'Takamine, la Ciudad Alta. Academia de Cortavientos — Torre Sorakiri.' }],
        },
        {
          shot: { bg: 'academy', time: 'day', angle: 'high', prop: 'hand', extras: ['glow'] },
          lines: [{ kind: 'narration', text: 'Seiscientos aspirantes. Treinta plazas. Y cada uno muestra su sello como un apellido.' }],
          sfx: [{ text: 'zawa zawa', size: 'small' }],
        },
        {
          shot: { bg: 'academy', time: 'day', chars: [{ id: 'sora', expr: 'shy', pose: 'stand', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Brillan todos... como estrellas.' }],
        },
        {
          shot: { bg: 'academy', time: 'day', chars: [{ id: 'mio', expr: 'determined', pose: 'reach', framing: 'bust', x: 0.6, flip: true }, { id: 'sora', expr: 'surprised', pose: 'stand', framing: 'bust', x: 0.3 }] },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'Mano afuera del bolsillo. Venimos a entrar, no a pedir permiso.' }],
        },
      ],
    },
    {
      objective: 'Resolver cómo entra un sin sello al torneo y presentar a Yura.',
      summary: 'Yura rechaza a Sora. Él recita el Artículo 14: "quien llegue volando por sus medios, podrá combatir". Yura duda, se acomoda los anteojos y acepta con ironía. Una voz fría desde atrás: "Una burla".',
      tone: 'Duelo verbal, humor y desafío.',
      composition: 'Zigzag: las viñetas alternan Sora y Yura como un intercambio de golpes; la última corta con la aparición de Rei.',
      layout: { template: 'zigzag' },
      panels: [
        {
          shot: { bg: 'office', time: 'day', chars: [{ id: 'yura', expr: 'serious', pose: 'sit', framing: 'bust', x: 0.5, flip: true }] },
          lines: [{ who: 'yura', kind: 'dialogue', text: 'Palma lisa. Sin sello no hay inscripción. Siguiente.' }],
        },
        {
          shot: { bg: 'office', time: 'day', chars: [{ id: 'sora', expr: 'determined', pose: 'point', framing: 'half', x: 0.5 }] },
          lines: [
            { who: 'sora', kind: 'shout', text: '¡Reglamento de fundación, Artículo 14!' },
            { who: 'sora', kind: 'shout', text: '"Quien llegue a Takamine volando por sus propios medios, podrá combatir." ¡Llegué volando!' },
          ],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'office', time: 'day', chars: [{ id: 'yura', expr: 'smirk', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['glow'] },
          lines: [
            { who: 'yura', kind: 'dialogue', text: 'Volaste. Y te caíste en el tejado del archivo.' },
            { who: 'yura', kind: 'dialogue', text: '...Pero el artículo no dice nada de aterrizar. Inscripto.' },
          ],
        },
        {
          shot: { bg: 'office', time: 'day', chars: [{ id: 'rei', expr: 'smirk', pose: 'arms-crossed', framing: 'silhouette', x: 0.5 }], extras: ['shadow-face'] },
          lines: [{ who: 'rei', kind: 'dialogue', text: 'Qué burla.' }],
          sfx: [{ text: 'ZAWA', size: 'small' }],
        },
      ],
    },
    {
      objective: 'Presentar al rival con todo su peso y cerrar con el primer cliffhanger.',
      summary: 'La multitud abre paso: es Rei Hayato, el prodigio. Muestra su sello de seis puntas. Advierte a Sora que lo sacará de la arena "por su bien". Sora acepta el reto. El cuadro del torneo: primera ronda, Kanata vs. Hayato.',
      tone: 'Tensión de rivalidad, chispas.',
      composition: 'Hero-mid: viñeta central ancha con el cara a cara, enmarcada por reacciones arriba y el cuadro del torneo abajo.',
      layout: { template: 'hero-mid' },
      panels: [
        {
          shot: { bg: 'academy', time: 'day', chars: [{ id: 'rei', expr: 'neutral', pose: 'stand', framing: 'full', x: 0.5 }], extras: ['sparkles'] },
          lines: [{ kind: 'caption', text: '"¡Es Rei Hayato! ¡El heredero de la Casa Hayato!"' }],
          sfx: [{ text: 'KYAAA', size: 'small' }],
        },
        {
          shot: { bg: 'tone', prop: 'hand', extras: ['glow'] },
          lines: [{ kind: 'narration', text: 'Sello estelar de seis puntas. Uno cada cien años.' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'academy', time: 'day', chars: [{ id: 'rei', expr: 'serious', pose: 'stand', framing: 'bust', x: 0.72, flip: true }, { id: 'sora', expr: 'angry', pose: 'fist', framing: 'bust', x: 0.28 }], extras: ['electric'] },
          lines: [
            { who: 'rei', kind: 'dialogue', text: 'Si pisás esa arena, te voy a sacar de ella. Por tu bien, sin sello.' },
            { who: 'sora', kind: 'shout', text: '¡Me llamo Sora Kanata! ¡Y nos vemos adentro!' },
          ],
          sfx: [{ text: 'BACHI BACHI', size: 'medium' }],
        },
        {
          shot: { bg: 'academy', time: 'day', chars: [{ id: 'mio', expr: 'scared', pose: 'cover-face', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'mio', kind: 'whisper', text: 'Sora... mirá el cuadro.' }],
        },
        {
          shot: { bg: 'academy', time: 'day', prop: 'note' },
          lines: [{ kind: 'impact', text: 'PRIMERA RONDA: SORA KANATA vs. REI HAYATO' }],
          sfx: [{ text: 'DON!', size: 'big' }],
          fx: 'focuslines',
        },
      ],
    },
    // ───────────────────────── DESARROLLO I: LA DERROTA ─────────────────────────
    {
      objective: 'Página de impacto: la Arena del Remolino y la portadilla del capítulo.',
      summary: 'Vista monumental del disco de piedra flotante, el remolino perpetuo en el borde y las gradas llenas. Yura anuncia el combate. Título: Capítulo 1 — Sin sello.',
      tone: 'Épico, expectante.',
      composition: 'Splash panorámico en picado: el disco en el centro, el vacío alrededor, los dos combatientes diminutos frente a frente.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'high', chars: [{ id: 'sora', pose: 'guard', framing: 'full', x: 0.35, scale: 0.6 }, { id: 'rei', pose: 'stand', framing: 'full', x: 0.65, flip: true, scale: 0.6 }], extras: ['wind', 'dust'] },
          lines: [
            { kind: 'caption', text: 'KAZEKIRI — Capítulo 1: Sin sello' },
            { who: 'yura', kind: 'shout', text: '¡Quien caiga del disco, pierde! ¡Primera ronda... COMIENCEN!' },
          ],
          sfx: [{ text: 'GOGOGOGO', size: 'big', rotate: -6 }],
          fx: 'screentone',
        },
      ],
    },
    {
      objective: 'Mostrar la diferencia abismal de poder en un solo intercambio.',
      summary: 'Sora carga gritando con su espada de madera. Rei ni desenvaina del todo: un tajo invisible. La espada de Sora se parte en dos en el aire.',
      tone: 'Shock seco.',
      composition: 'Manga-action: diagonales cruzadas; la carga ocupa la viñeta larga y el corte llega en una viñeta casi vacía, blanca.',
      layout: { template: 'manga-action' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', chars: [{ id: 'sora', expr: 'furious', pose: 'run', framing: 'full', x: 0.5, flip: true }], extras: ['dust', 'wind'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡TODAVÍAAAA!' }],
          sfx: [{ text: 'DADADA', size: 'medium' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'rei', expr: 'neutral', pose: 'guard', framing: 'eyes', x: 0.5 }] },
          lines: [{ who: 'rei', kind: 'whisper', text: 'Filo Hayato.' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'white', prop: 'sword', extras: ['wind'] },
          sfx: [{ text: 'ZAN', size: 'big', rotate: -20 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'shocked', pose: 'stand', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'sora', kind: 'thought', text: '¿Qué...? No lo vi... ¡ni siquiera lo vi moverse!' }],
          sfx: [{ text: 'karan...', size: 'small' }],
        },
      ],
    },
    {
      objective: 'Escalar la paliza y plantar el corazón de Sora: levantarse siempre.',
      summary: 'Ráfaga tras ráfaga, Rei lo derriba. Sora se levanta una y otra vez, cubierto de polvo. Rei, irritado, pregunta por qué. Sora: "Porque todavía puedo".',
      tone: 'Doloroso y obstinado.',
      composition: 'Shards: viñetas rotas como vidrio para cada golpe; la última, la más grande, para la respuesta de Sora.',
      layout: { template: 'shards' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'dutch', chars: [{ id: 'sora', expr: 'pain', pose: 'fall', framing: 'full', x: 0.5 }], extras: ['blood-free-impact', 'dust'] },
          sfx: [{ text: 'BAKKO!', size: 'big', rotate: 10 }],
        },
        {
          shot: { bg: 'arena', time: 'day', angle: 'high', chars: [{ id: 'sora', expr: 'pain', pose: 'kneel', framing: 'full', x: 0.5 }], extras: ['dust', 'sweat'] },
          sfx: [{ text: 'DOSA', size: 'medium' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'rei', expr: 'angry', pose: 'guard', framing: 'bust', x: 0.5, flip: true }] },
          lines: [{ who: 'rei', kind: 'dialogue', text: '¿Por qué te levantás? No tenés sello. No tenés nada.' }],
        },
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', chars: [{ id: 'sora', expr: 'grin', pose: 'stand', framing: 'half', x: 0.5 }], extras: ['dust', 'wind'] },
          lines: [{ who: 'sora', kind: 'shout', text: 'Porque todavía puedo. ¡Y mientras pueda, no me vas a sacar!' }],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Golpe de gracia: la derrota debe sentirse total y pública.',
      summary: 'Rei suelta su forma heredada, el Muro Celeste: una pared de viento que arrastra a Sora por el disco y lo arroja fuera, hacia el remolino del borde.',
      tone: 'Aplastante.',
      composition: 'Cajas propias: dos viñetas pequeñas arriba (preparación de Rei de derecha a izquierda) y una enorme abajo con el muro barriendo a Sora.',
      layout: { boxes: [[0.51, 0, 0.49, 0.36], [0, 0, 0.49, 0.36], [0, 0.38, 1, 0.62]] },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'rei', expr: 'serious', pose: 'guard', framing: 'half', x: 0.5, flip: true }], extras: ['wind', 'glow'] },
          lines: [{ who: 'rei', kind: 'dialogue', text: 'Te lo advertí. Esto es por tu bien.' }],
        },
        {
          shot: { bg: 'focus', chars: [{ id: 'rei', expr: 'determined', pose: 'guard', framing: 'eyes', x: 0.5 }] },
          lines: [{ who: 'rei', kind: 'shout', text: 'Forma Hayato: ¡MURO CELESTE!' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'arena', time: 'day', angle: 'dutch', chars: [{ id: 'sora', expr: 'shocked', pose: 'fall', framing: 'full', x: 0.25, scale: 0.9 }], extras: ['wind', 'dust', 'explosion'] },
          sfx: [{ text: 'DOOOOON', size: 'big', rotate: -10 }, { text: 'GOOOO', size: 'medium', rotate: 8 }],
          fx: 'speedlines',
        },
      ],
      notes: 'El muro se dibuja como blanco puro con bordes de trama: es aire, no materia.',
    },
    {
      objective: 'El costo emocional de la derrota y la grieta en el rival. Cliffhanger: aparece el mentor.',
      summary: 'Sora, fuera del disco, colgando de una cadena, escucha las risas. Llora apretando el puño. Rei se retira; en su pensamiento, el miedo a su padre. Yura anuncia la repesca en treinta días. En las gradas vacías, un viejo manco se ríe.',
      tone: 'Amargo, con una chispa de esperanza.',
      composition: 'Tres filas: Sora (dolor), Rei (secreto), y la sombra del viejo como gancho.',
      layout: { template: 'three-rows' },
      panels: [
        {
          shot: { bg: 'arena', time: 'sunset', chars: [{ id: 'sora', expr: 'crying', pose: 'kneel', framing: 'half', x: 0.5 }], extras: ['tears'] },
          lines: [
            { kind: 'caption', text: '"¡Ja! ¡Un sin sello creyó que podía!"' },
            { who: 'sora', kind: 'thought', text: 'No pude... ni tocarlo.' },
          ],
          fx: 'gradient-tone',
        },
        {
          shot: { bg: 'corridor', time: 'sunset', chars: [{ id: 'rei', expr: 'sad', pose: 'stand', framing: 'back', x: 0.5 }], extras: ['shadow-face'] },
          lines: [
            { who: 'rei', kind: 'thought', text: 'Si hubiera dudado un segundo... si un sin sello me hubiera tocado...' },
            { who: 'rei', kind: 'thought', text: '...padre no me lo perdonaría.' },
          ],
          fx: 'screentone',
        },
        {
          shot: { bg: 'arena', time: 'sunset', angle: 'high', chars: [{ id: 'yura', expr: 'serious', pose: 'stand', framing: 'bust', x: 0.75, flip: true }, { id: 'gendo', expr: 'laugh', pose: 'sit', framing: 'silhouette', x: 0.2 }] },
          lines: [
            { who: 'yura', kind: 'dialogue', text: 'Kanata. Repesca en treinta días. Ganale a un sellado y entrás.' },
            { who: 'gendo', kind: 'dialogue', text: 'Je je je... qué ruido más lindo.' },
          ],
        },
      ],
    },
    // ───────────────────────── DESARROLLO II: EL MAESTRO ─────────────────────────
    {
      objective: 'Presentar a Gendo con humor y misterio.',
      summary: 'De noche, Sora está solo en un acantilado de Takamine. Un viejo ciego y manco se sienta a su lado comiendo un onigiri. Le dice que escuchó toda la pelea. Que hacía mucho ruido. Ruido bueno.',
      tone: 'Melancólico que gira a cómico y cálido.',
      composition: 'Manga-dynamic con ritmo lento: viñetas de silencio y una grande para el primer cara a cara.',
      layout: { template: 'manga-dynamic' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'night', angle: 'high', chars: [{ id: 'sora', expr: 'sad', pose: 'sit', framing: 'back', x: 0.55 }], extras: ['stars', 'wind'] },
          lines: [{ kind: 'narration', text: 'Esa noche, el viento de Takamine sonaba como risas.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'happy', pose: 'sit', framing: 'half', x: 0.5, flip: true }] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: '¿Querés la mitad? Es de ciruela. Las de ciruela son para perdedores.' }],
          sfx: [{ text: 'mogu mogu', size: 'small' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'angry', pose: 'point', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¿Viniste a burlarte, viejo? ¡¿De dónde saliste?!' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'smirk', pose: 'sit', framing: 'face', x: 0.5 }] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Soy ciego, Ruido. Te escuché pelear. Hacías muchísimo ruido.' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'serious', pose: 'sit', framing: 'bust', x: 0.7, flip: true }, { id: 'sora', expr: 'surprised', pose: 'sit', framing: 'bust', x: 0.3 }], extras: ['wind'] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Ruido bueno. Del que no se calla aunque le peguen.' }],
        },
      ],
    },
    {
      objective: 'Revelar quién es Gendo y sellar el pacto maestro-alumno. Cliffhanger de método.',
      summary: 'Sora descubre el emblema viejo de la Academia en la túnica: Gendo fue "El Manco del Remolino". El viejo ofrece entrenarlo con una condición: obedecer aunque parezca estúpido. Sora acepta de rodillas. Gendo: "Primero vas a aprender a no moverte".',
      tone: 'Revelación y promesa.',
      composition: 'Dos columnas: a la derecha la leyenda (pasado), a la izquierda el pacto (futuro).',
      layout: { template: 'two-cols' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'night', angle: 'low', chars: [{ id: 'gendo', expr: 'serious', pose: 'stand', framing: 'full', x: 0.5 }], extras: ['wind', 'stars'] },
          lines: [
            { who: 'sora', kind: 'dialogue', text: 'Esa manga vacía... ese emblema... ¡¿Vos sos El Manco del Remolino?!' },
            { who: 'gendo', kind: 'dialogue', text: 'Era. Ahora soy un viejo que come de más.' },
          ],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'determined', pose: 'kneel', framing: 'half', x: 0.6, flip: true }, { id: 'gendo', expr: 'smirk', pose: 'arms-crossed', framing: 'half', x: 0.25 }] },
          lines: [
            { who: 'gendo', kind: 'dialogue', text: 'Te entreno. Pero vas a hacer lo que diga, aunque parezca estúpido.' },
            { who: 'sora', kind: 'shout', text: '¡Lo que sea! ¡Enseñame a cortar!' },
            { who: 'gendo', kind: 'dialogue', text: 'Cortar no. Primero... vas a aprender a no moverte.' },
          ],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Presentar el escenario del entrenamiento, único y peligroso.',
      summary: 'La Roca de la Campana: un islote diminuto con una choza y una campana de bronce colgada sobre el abismo por una sola cuerda. Mio llega con sus herramientas: no piensa dejar solo a Sora.',
      tone: 'Asombro y camaradería.',
      composition: 'Hero-top: la roca y la campana en una gran viñeta superior; abajo, llegada de Mio y reacción.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'island-sky', time: 'day', angle: 'low', extras: ['wind'] },
          lines: [{ kind: 'caption', text: 'Roca de la Campana. Dos horas de planeador al este de Takamine.' }],
          sfx: [{ text: 'rin...', size: 'small' }],
        },
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'gendo', expr: 'neutral', pose: 'point', framing: 'half', x: 0.5, flip: true }] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Esa campana suena con cualquier soplo. Tu trabajo: llegar hasta ella sin que suene.' }],
        },
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'sora', expr: 'shocked', pose: 'stand', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡¿Caminando por ESA cuerda?! ¡Abajo no hay nada!' }],
        },
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'mio', expr: 'grin', pose: 'hands-hips', framing: 'half', x: 0.5 }], prop: 'glider' },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'Abajo voy a estar yo, con una red y un planeador nuevo. Andá, cabeza de molino.' }],
        },
      ],
    },
    {
      objective: 'Alivio cómico: el método absurdo de Gendo y la terquedad de Sora.',
      summary: 'Día 1: Gendo lo hace barrer hojas contra el viento. Día 3: cargar agua en un balde agujereado. Día 5: Sora se duerme parado; Gendo lo despierta con el bastón sin fallar nunca. Día 7: Sora por fin cuestiona el método y recibe otro bastonazo.',
      tone: 'Comedia física, ritmo de remate.',
      composition: 'Formato 4-koma vertical: cuatro tiempos de chiste que comprimen una semana.',
      layout: { template: 'manga-4koma' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'sora', expr: 'angry', pose: 'hold', framing: 'full', x: 0.5 }], extras: ['wind'] },
          lines: [{ kind: 'caption', text: 'Día 1.' }, { who: 'sora', kind: 'shout', text: '¡Las hojas vuelven! ¡El viento me las devuelve!' }],
        },
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'sora', expr: 'tired', pose: 'hold', framing: 'full', x: 0.5 }], extras: ['sweat'] },
          lines: [{ kind: 'caption', text: 'Día 3.' }, { who: 'sora', kind: 'dialogue', text: 'El balde tiene un agujero, maestro.' }, { who: 'gendo', kind: 'dialogue', text: 'Entonces caminá más rápido.' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'smirk', pose: 'hold', framing: 'half', x: 0.7, flip: true }, { id: 'sora', expr: 'tired', pose: 'stand', framing: 'half', x: 0.3 }] },
          lines: [{ kind: 'caption', text: 'Día 5.' }],
          sfx: [{ text: '¡POC!', size: 'medium' }, { text: 'zzz', size: 'small' }],
        },
        {
          shot: { bg: 'cliff', time: 'day', chars: [{ id: 'sora', expr: 'furious', pose: 'point', framing: 'half', x: 0.4 }, { id: 'mio', expr: 'laugh', pose: 'sit', framing: 'half', x: 0.75, flip: true }] },
          lines: [{ kind: 'caption', text: 'Día 7.' }, { who: 'sora', kind: 'shout', text: '¡¿ESTO ES ENTRENAR?!' }],
          sfx: [{ text: '¡POC!', size: 'big' }],
        },
      ],
      notes: 'Página de respiro: dibujo más redondeado y deformado (SD) sin perder la continuidad.',
    },
    {
      objective: 'El verdadero entrenamiento: fallar ante la campana y recibir la primera pista.',
      summary: 'Sora cruza la cuerda; cada paso, cada jadeo, hace sonar la campana. Cae a la red de Mio una y otra vez. Gendo le explica que la campana no escucha el viento de afuera: escucha el de adentro, y el de Sora grita.',
      tone: 'Frustración que se vuelve curiosidad.',
      composition: 'Classic-6: repetición de fracasos en viñetas iguales; la sexta rompe el patrón con la frase clave.',
      layout: { template: 'classic-6' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'day', angle: 'high', chars: [{ id: 'sora', expr: 'scared', pose: 'reach', framing: 'full', x: 0.5 }], extras: ['wind'] },
          sfx: [{ text: 'RIIIN', size: 'medium' }],
        },
        {
          shot: { bg: 'sky-day', time: 'day', angle: 'high', chars: [{ id: 'sora', expr: 'shocked', pose: 'fall', framing: 'full', x: 0.5 }] },
          sfx: [{ text: 'BOING', size: 'medium' }],
        },
        {
          shot: { bg: 'cliff', time: 'sunset', chars: [{ id: 'sora', expr: 'determined', pose: 'reach', framing: 'full', x: 0.5 }], extras: ['sweat'] },
          lines: [{ kind: 'caption', text: 'Intento 41.' }],
          sfx: [{ text: 'RIIIN', size: 'medium' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'mio', expr: 'tired', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'Intento 112. Sora, la red ya tiene tu forma.' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'furious', pose: 'fist', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡Pero si no hay viento! ¡¿Por qué suena?!' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'serious', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['wind'] },
          lines: [
            { who: 'gendo', kind: 'dialogue', text: 'La campana no escucha el viento de afuera, Ruido. Escucha el de adentro.' },
            { who: 'gendo', kind: 'dialogue', text: 'Y el tuyo grita.' },
          ],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Profundizar a Mio: por qué construye alas, y qué arriesga.',
      summary: 'De noche, junto al fuego, Mio repara la red. Cuenta que su padre era planeadorista sin sello y cayó al Mar de Nubes por un ala mal hecha. Sora le promete que sus alas lo van a llevar a la Academia. Mio llora y le pega un cabezazo.',
      tone: 'Íntimo, emotivo, con remate de humor.',
      composition: 'Zigzag suave: la conversación va y vuelve entre los dos como el fuego.',
      layout: { template: 'zigzag' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'mio', expr: 'sad', pose: 'sit', framing: 'half', x: 0.5, flip: true }], extras: ['glow'], prop: 'blueprint' },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'Papá tampoco tenía sello. Volaba mejor que cualquier cortaviento.' }],
        },
        {
          shot: { bg: 'sky-night', time: 'night', prop: 'glider', extras: ['wind'] },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'Un día se rompió un ala. Una costilla que yo había lijado.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'serious', pose: 'sit', framing: 'bust', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'sora', kind: 'dialogue', text: 'Tus alas me trajeron hasta acá, Mio. Y me van a llevar adentro. Te lo juro.' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'mio', expr: 'crying', pose: 'reach', framing: 'bust', x: 0.6, flip: true }, { id: 'sora', expr: 'pain', pose: 'sit', framing: 'bust', x: 0.3 }], extras: ['tears'] },
          lines: [{ who: 'mio', kind: 'dialogue', text: 'No jures, tarado... ¡ganá!' }],
          sfx: [{ text: 'GON!', size: 'medium' }],
        },
      ],
    },
    {
      objective: 'Humanizar al rival: Rei también está entrenando solo, por miedo.',
      summary: 'En la Torre, de madrugada, Rei corta muñecos de práctica hasta que le tiemblan las manos. Sobre la mesa, una carta de su padre: "Un Hayato no empata. Elegí tu rival de repesca y aplastalo". Yura lo observa desde la puerta.',
      tone: 'Sombrío, opresivo.',
      composition: 'Three-mixed: una viñeta ancha para el esfuerzo y dos menores para la carta y la mirada de Yura.',
      layout: { template: 'three-mixed' },
      panels: [
        {
          shot: { bg: 'dojo', time: 'night', angle: 'dutch', chars: [{ id: 'rei', expr: 'furious', pose: 'guard', framing: 'full', x: 0.5 }], extras: ['wind', 'sweat'] },
          sfx: [{ text: 'ZAN ZAN ZAN', size: 'medium', rotate: -15 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'room-dark', time: 'night', prop: 'letter' },
          lines: [{ kind: 'caption', text: '"Un Hayato no empata. Elegí a tu rival de repesca y aplastalo. — Tu padre."' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'corridor', time: 'night', chars: [{ id: 'yura', expr: 'sad', pose: 'arms-crossed', framing: 'half', x: 0.5 }], extras: ['shadow-face'] },
          lines: [{ who: 'yura', kind: 'thought', text: 'El prodigio también tiene miedo. Lo conozco bien... yo tuve el mismo.' }],
        },
      ],
    },
    {
      objective: 'Primer gran avance de Sora y el siguiente desafío imposible.',
      summary: 'Día 20. Sora camina por la cuerda en silencio total, respirando lento. Toca la campana sin que suene. Gendo sonríe y sube la apuesta: ahora hacela sonar, sin tocarla y sin viento.',
      tone: 'Calma tensa, logro y desconcierto.',
      composition: 'Manga-vertical: tiras altas que acentúan la cuerda sobre el vacío y el silencio.',
      layout: { template: 'manga-vertical' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'sunset', angle: 'high', chars: [{ id: 'sora', expr: 'serious', pose: 'reach', framing: 'full', x: 0.5, scale: 0.8 }] },
          lines: [{ kind: 'caption', text: 'Día 20.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'cliff', time: 'sunset', chars: [{ id: 'sora', expr: 'serious', pose: 'stand', framing: 'eyes', x: 0.5 }] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Adentro... despacio... no empujes.' }],
        },
        {
          shot: { bg: 'sunset', time: 'sunset', prop: 'hand' },
          lines: [{ kind: 'narration', text: 'Silencio.' }],
          sfx: [{ text: '...', size: 'small' }],
        },
        {
          shot: { bg: 'cliff', time: 'sunset', chars: [{ id: 'gendo', expr: 'grin', pose: 'arms-crossed', framing: 'half', x: 0.6, flip: true }, { id: 'sora', expr: 'surprised', pose: 'stand', framing: 'half', x: 0.25 }] },
          lines: [
            { who: 'gendo', kind: 'dialogue', text: 'Bien. Ahora hacela sonar. Sin tocarla. Sin viento.' },
            { who: 'sora', kind: 'shout', text: '¡¿EEEH?! ¡Eso es imposible!' },
          ],
        },
      ],
    },
    {
      objective: 'La revelación central del tomo: el viento interior, y el pasado de Gendo.',
      summary: 'Gendo le muestra el muñón y le cuenta Ochijima: una Tormenta Hueca devoró la isla y su brazo. Luego la verdad: Sora no nació sin sello, nació sin cerradura. Los sellados agarran el viento de afuera; el suyo nunca salió. Todo el aliento de quince años está adentro.',
      tone: 'Grave, revelador, conmovedor.',
      composition: 'Hero-mid: la viñeta central, ancha, para la frase clave; arriba el pasado en trama, abajo la reacción.',
      layout: { template: 'hero-mid' },
      panels: [
        {
          shot: { bg: 'ruins', time: 'night', extras: ['smoke', 'wind'] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Ochijima. Hace treinta años una Tormenta Hueca se comió sus corrientes.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'sad', pose: 'stand', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'La isla cayó. Mi brazo y mis ojos se quedaron con ella.' }],
        },
        {
          shot: { bg: 'focus', chars: [{ id: 'gendo', expr: 'serious', pose: 'point', framing: 'half', x: 0.7, flip: true }, { id: 'sora', expr: 'shocked', pose: 'stand', framing: 'half', x: 0.28 }], extras: ['wind'] },
          lines: [
            { who: 'gendo', kind: 'dialogue', text: 'Vos no naciste sin sello, Ruido. Naciste sin cerradura.' },
            { who: 'gendo', kind: 'dialogue', text: 'El sello abre una puerta para agarrar el viento de afuera. Tu viento nunca salió.' },
          ],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'tone', prop: 'hand', extras: ['glow'] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Quince años de aliento guardado. Soltalo.' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'determined', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['wind'] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Adentro... siempre estuvo adentro.' }],
        },
      ],
    },
    {
      objective: 'Página de impacto: nace el poder de Sora.',
      summary: 'Sora inhala hasta el fondo y exhala. Un filo de viento blanco sale de su pecho, cruza el abismo y la campana suena tan fuerte que se escucha en las islas vecinas. Gendo sonríe. Mio deja caer la llave inglesa.',
      tone: 'Explosión de asombro y alegría.',
      composition: 'Splash vertical en contrapicado: Sora en primer plano, el filo blanco cruzando de derecha a izquierda hasta la campana.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'night', angle: 'low', chars: [{ id: 'sora', expr: 'determined', pose: 'punch', framing: 'full', x: 0.6, flip: true, scale: 1.2 }, { id: 'gendo', expr: 'grin', pose: 'arms-crossed', framing: 'bust', x: 0.12, scale: 0.6 }], extras: ['energy', 'wind', 'dust', 'glow'] },
          lines: [
            { kind: 'narration', text: 'Esa noche, en la Roca de la Campana, el Viento escuchó por primera vez la voz de Sora Kanata.' },
            { who: 'gendo', kind: 'whisper', text: 'Ahí está... tu viento interior.' },
          ],
          sfx: [{ text: 'GOOOOOOON', size: 'big', rotate: -8 }, { text: '¡FSSHAAA!', size: 'medium', rotate: 12 }],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Establecer el costo del poder y la presión del tiempo. Cliffhanger hacia la repesca.',
      summary: 'Sora celebra y colapsa, sin aire: el ahogo. Gendo le explica la regla: su pecho sólo aguanta un corte por combate. Si falla, queda indefenso. Sora le pone nombre: Kazekiri, "corte de viento". La repesca es mañana.',
      tone: 'Euforia, miedo y determinación.',
      composition: 'Shards: la euforia se quiebra en fragmentos como el aliento de Sora.',
      layout: { template: 'shards' },
      panels: [
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'sora', expr: 'laugh', pose: 'fist', framing: 'half', x: 0.5 }], extras: ['sparkles'] },
          lines: [{ who: 'sora', kind: 'shout', text: '¡SONÓ! ¡MIO, SONÓ! ¡LO HICE—!' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', angle: 'dutch', chars: [{ id: 'sora', expr: 'pain', pose: 'fall', framing: 'full', x: 0.5 }], extras: ['sweat'] },
          sfx: [{ text: 'GAH... HAA...', size: 'medium' }],
        },
        {
          shot: { bg: 'cliff', time: 'night', chars: [{ id: 'gendo', expr: 'serious', pose: 'kneel', framing: 'bust', x: 0.6, flip: true }, { id: 'mio', expr: 'scared', pose: 'kneel', framing: 'bust', x: 0.25 }] },
          lines: [
            { who: 'gendo', kind: 'dialogue', text: 'Ahogo. Tu pecho aguanta un solo corte por pelea. Uno. Si fallás, quedás vacío.' },
            { who: 'mio', kind: 'dialogue', text: 'Y la repesca... es mañana.' },
          ],
        },
        {
          shot: { bg: 'focus', chars: [{ id: 'sora', expr: 'determined', pose: 'fist', framing: 'face', x: 0.5 }], extras: ['energy'] },
          lines: [{ who: 'sora', kind: 'dialogue', text: 'Entonces le pongo nombre a ese único corte: KAZEKIRI.' }],
          fx: 'focuslines',
        },
      ],
    },
    // ───────────────────────── CLÍMAX: LA REVANCHA ─────────────────────────
    {
      objective: 'Plantear la revancha como choque de dos motivos opuestos.',
      summary: 'Arena del Remolino, repesca. Rei pidió ser el rival de Sora "para terminar esta farsa". Las gradas abuchean. Gendo y Mio en primera fila. Cara a cara: "Vine a terminar esto." "Yo vine a empezarlo."',
      tone: 'Expectativa eléctrica.',
      composition: 'Hero-top: el disco y las gradas arriba; abajo, tres primeros planos que encienden la mecha.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'high', chars: [{ id: 'sora', pose: 'stand', framing: 'full', x: 0.35, scale: 0.7 }, { id: 'rei', pose: 'stand', framing: 'full', x: 0.65, flip: true, scale: 0.7 }], extras: ['wind'] },
          lines: [
            { kind: 'caption', text: 'Treinta días después. Repesca.' },
            { who: 'yura', kind: 'dialogue', text: 'Por pedido expreso del aspirante Hayato: Kanata contra Hayato.' },
          ],
          sfx: [{ text: 'BUUUUU', size: 'medium' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'mio', expr: 'determined', pose: 'fist', framing: 'bust', x: 0.65, flip: true }, { id: 'gendo', expr: 'smirk', pose: 'sit', framing: 'bust', x: 0.3 }] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Tranquila. Hoy el Ruido aprendió a callarse.' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'rei', expr: 'serious', pose: 'guard', framing: 'face', x: 0.5, flip: true }] },
          lines: [{ who: 'rei', kind: 'dialogue', text: 'Vine a terminar esto.' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'grin', pose: 'guard', framing: 'face', x: 0.5 }], extras: ['wind'] },
          lines: [{ who: 'sora', kind: 'dialogue', text: 'Qué casualidad. Yo vine a empezarlo.' }],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Mostrar el crecimiento de Sora en acción: ya no carga, escucha.',
      summary: 'Rei ataca con todo desde el primer segundo: Espiral Hayato. Sora cierra los ojos, como Gendo, y esquiva moviéndose con las corrientes, sin tocar a Rei. El público enmudece.',
      tone: 'Velocidad y asombro.',
      composition: 'Manga-action: diagonales de velocidad; Sora siempre en el borde de la viñeta, deslizándose fuera del golpe.',
      layout: { template: 'manga-action' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', chars: [{ id: 'rei', expr: 'furious', pose: 'punch', framing: 'full', x: 0.5, flip: true }], extras: ['wind', 'energy'] },
          lines: [{ who: 'rei', kind: 'shout', text: 'Forma Hayato: ¡ESPIRAL!' }],
          sfx: [{ text: 'GYURURURU', size: 'big', rotate: 20 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'speed', chars: [{ id: 'sora', expr: 'serious', pose: 'guard', framing: 'bust', x: 0.3 }], extras: ['wind'] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Ojos cerrados. Escuchá. El viento de Rei... suena como una campana.' }],
        },
        {
          shot: { bg: 'arena', time: 'day', angle: 'dutch', chars: [{ id: 'sora', expr: 'serious', pose: 'run', framing: 'full', x: 0.2 }, { id: 'rei', expr: 'shocked', pose: 'punch', framing: 'full', x: 0.7, flip: true }], extras: ['dust', 'wind'] },
          sfx: [{ text: 'SHUN', size: 'medium' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'yura', expr: 'surprised', pose: 'stand', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'yura', kind: 'thought', text: 'No esquiva con los ojos... se mueve con las corrientes. Como el viejo.' }],
        },
      ],
    },
    {
      objective: 'Mostrar la desesperación de Rei y la paciencia dolorosa de Sora.',
      summary: 'Rei, frenético, recuerda la carta de su padre y ataca sin control. Los cortes empiezan a alcanzar a Sora, que sangra y retrocede pero no suelta su aliento: espera el único momento.',
      tone: 'Asfixiante, dramático.',
      composition: 'Cajas propias: una columna alta a la derecha con Rei fuera de sí, y tres tiras a la izquierda con los golpes que recibe Sora.',
      layout: { boxes: [[0.56, 0, 0.44, 1], [0, 0, 0.54, 0.32], [0, 0.34, 0.54, 0.32], [0, 0.68, 0.54, 0.32]] },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', chars: [{ id: 'rei', expr: 'furious', pose: 'guard', framing: 'full', x: 0.5, flip: true }], extras: ['wind', 'shadow-face'] },
          lines: [
            { who: 'rei', kind: 'thought', text: '"Un Hayato no empata."' },
            { who: 'rei', kind: 'shout', text: '¡¿Por qué no caés de una vez?!' },
          ],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'pain', pose: 'guard', framing: 'half', x: 0.5 }], extras: ['blood-free-impact'] },
          sfx: [{ text: 'ZASH', size: 'medium', rotate: -25 }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'pain', pose: 'kneel', framing: 'half', x: 0.5 }], extras: ['dust', 'sweat'] },
          sfx: [{ text: 'BAKKO', size: 'medium', rotate: 15 }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'serious', pose: 'stand', framing: 'eyes', x: 0.5 }] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Todavía no. Un solo corte. Esperá el momento.' }],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'La cuenta regresiva del golpe decisivo.',
      summary: 'Rei levanta el Muro Celeste otra vez, más grande que nunca. Las gradas gritan. Gendo susurra "ahora". Sora inhala hasta el fondo, el polvo se arremolina hacia su pecho.',
      tone: 'Tensión máxima, silencio antes del trueno.',
      composition: 'Manga-dynamic: viñetas que se achican hacia el ojo de Sora para comprimir el tiempo.',
      layout: { template: 'manga-dynamic' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', chars: [{ id: 'rei', expr: 'determined', pose: 'guard', framing: 'full', x: 0.5, flip: true }], extras: ['wind', 'glow', 'dust'] },
          lines: [{ who: 'rei', kind: 'shout', text: '¡MURO CELESTE... A TODA POTENCIA!' }],
          sfx: [{ text: 'GOGOGOGOGO', size: 'big', rotate: -5 }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'gendo', expr: 'serious', pose: 'sit', framing: 'face', x: 0.5 }] },
          lines: [{ who: 'gendo', kind: 'whisper', text: 'Ahora, Ruido.' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'mio', expr: 'crying', pose: 'fist', framing: 'bust', x: 0.5 }], extras: ['tears'] },
          lines: [{ who: 'mio', kind: 'shout', text: '¡VOLÁ, SORA!' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'determined', pose: 'guard', framing: 'half', x: 0.5 }], extras: ['wind', 'dust'] },
          sfx: [{ text: 'SUUUUU...', size: 'medium' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'focus', chars: [{ id: 'sora', expr: 'serious', pose: 'stand', framing: 'eyes', x: 0.5 }], extras: ['energy'] },
          lines: [{ who: 'sora', kind: 'thought', text: 'Quince años de aliento. Todo en un filo.' }],
          fx: 'focuslines',
        },
      ],
    },
    {
      objective: 'Página clímax del tomo: el primer Kazekiri en combate.',
      summary: 'Sora exhala. El filo blanco atraviesa el Muro Celeste y lo parte en dos de arriba abajo. El viento del muro se abre a los costados; Rei queda expuesto, con los ojos abiertos de par en par.',
      tone: 'Catarsis absoluta.',
      composition: 'Splash con diagonal brutal: el corte en blanco puro cruza la página de arriba a la derecha a abajo a la izquierda, siguiendo la lectura japonesa.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'dutch', chars: [{ id: 'sora', expr: 'furious', pose: 'punch', framing: 'full', x: 0.7, flip: true, scale: 1.2 }, { id: 'rei', expr: 'shocked', pose: 'guard', framing: 'half', x: 0.15, scale: 0.8 }], extras: ['energy', 'wind', 'explosion', 'dust'] },
          lines: [{ who: 'sora', kind: 'shout', text: 'KAZEKIRI — ¡¡PRIMER ALIENTO!!' }],
          sfx: [{ text: 'ZAAAAAN', size: 'big', rotate: -30 }, { text: 'BAKKOOON', size: 'medium', rotate: 10 }],
          fx: 'speedlines',
        },
      ],
      notes: 'El filo es ausencia de tinta: blanco puro sobre el muro tramado. Máximo contraste del tomo.',
    },
    {
      objective: 'Cerrar la rivalidad con respeto y sembrar el futuro.',
      summary: 'Silencio. El talón de Rei pisa fuera del disco: pierde. Sora cae de rodillas, vacío. Rei le tiende la mano y, por primera vez, dice su nombre. Bromean. Yura declara a Sora admitido.',
      tone: 'Emoción contenida, respeto, alegría.',
      composition: 'Tres filas: el veredicto, el gesto, la broma; ritmo pausado tras la explosión.',
      layout: { template: 'three-rows' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'yura', expr: 'smirk', pose: 'point', framing: 'half', x: 0.5, flip: true }] },
          lines: [{ who: 'yura', kind: 'shout', text: 'Hayato fuera del disco. ¡Ganador: Sora Kanata! Admitido en la Academia.' }],
          sfx: [{ text: 'WAAAAAH', size: 'medium' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'rei', expr: 'neutral', pose: 'reach', framing: 'half', x: 0.7, flip: true }, { id: 'sora', expr: 'tired', pose: 'kneel', framing: 'half', x: 0.28 }], extras: ['wind'] },
          lines: [{ who: 'rei', kind: 'dialogue', text: 'Sora Kanata. La próxima vez no me voy a contener.' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'sora', expr: 'grin', pose: 'stand', framing: 'bust', x: 0.3 }, { id: 'rei', expr: 'smirk', pose: 'stand', framing: 'bust', x: 0.7, flip: true }], extras: ['sparkles'] },
          lines: [
            { who: 'sora', kind: 'dialogue', text: '¡Mentira! ¡Hoy tampoco te contuviste!' },
            { who: 'rei', kind: 'thought', text: 'Es la primera vez que perder... no se siente como morir.' },
          ],
        },
      ],
    },
    // ───────────────────────── CIERRE: LA TORMENTA HUECA ─────────────────────────
    {
      objective: 'Romper la celebración con una amenaza nueva y mayor.',
      summary: 'De golpe, el viento muere. Las banderas caen. Las campanas de Takamine suenan solas. Gendo se pone de pie, pálido: "Esto no es silencio. Es hambre." El Mar de Nubes se abre bajo la arena.',
      tone: 'Inquietud que se vuelve terror.',
      composition: 'Manga-vertical: tiras altas que bajan la mirada desde las banderas hasta el abismo.',
      layout: { template: 'manga-vertical' },
      panels: [
        {
          shot: { bg: 'arena', time: 'day', angle: 'low', prop: 'feather' },
          lines: [{ kind: 'narration', text: 'Y entonces, el Viento se calló.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'academy', time: 'day', prop: 'clock', extras: ['shadow-face'] },
          sfx: [{ text: 'rin... rin... rin...', size: 'small' }],
        },
        {
          shot: { bg: 'arena', time: 'day', chars: [{ id: 'gendo', expr: 'shocked', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'gendo', kind: 'dialogue', text: 'Esto no es silencio... es hambre.' }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'storm-sky', time: 'day', angle: 'high', extras: ['lightning', 'smoke'] },
          lines: [{ who: 'gendo', kind: 'shout', text: '¡TODOS FUERA DEL DISCO! ¡ES UNA TORMENTA HUECA!' }],
          sfx: [{ text: 'ZUZUZUZU', size: 'big' }],
        },
      ],
    },
    {
      objective: 'Mostrar la escala monstruosa de la amenaza y el caos.',
      summary: 'La Tormenta Hueca emerge: una bestia de nubes negras con forma de lobo-ballena y un vacío por cuerpo. Traga corrientes; el disco se inclina y las cadenas crujen. Yura organiza la evacuación; Rei desenvaina a pesar del cansancio.',
      tone: 'Catástrofe, urgencia.',
      composition: 'Cajas propias: una viñeta gigante arriba para la bestia y dos abajo, derecha e izquierda, para las reacciones.',
      layout: { boxes: [[0, 0, 1, 0.62], [0.51, 0.64, 0.49, 0.36], [0, 0.64, 0.49, 0.36]] },
      panels: [
        {
          shot: { bg: 'storm-sky', time: 'night', angle: 'low', chars: [{ id: 'sora', expr: 'shocked', pose: 'stand', framing: 'back', x: 0.5, scale: 0.6 }], extras: ['lightning', 'wind', 'smoke'] },
          lines: [{ kind: 'narration', text: 'Una Tormenta Hueca. La primera en treinta años.' }],
          sfx: [{ text: 'GROOOOOOOOAAAA', size: 'big', rotate: -4 }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'arena', time: 'night', angle: 'dutch', chars: [{ id: 'yura', expr: 'determined', pose: 'point', framing: 'half', x: 0.5, flip: true }], extras: ['wind', 'dust'] },
          lines: [{ who: 'yura', kind: 'shout', text: '¡Aspirantes a las cadenas! ¡La isla está perdiendo corrientes!' }],
          sfx: [{ text: 'GIGIGI', size: 'medium' }],
        },
        {
          shot: { bg: 'arena', time: 'night', chars: [{ id: 'rei', expr: 'determined', pose: 'guard', framing: 'half', x: 0.5 }], extras: ['wind'] },
          lines: [{ who: 'rei', kind: 'dialogue', text: 'Sin sello... ¿te queda aliento?' }],
        },
      ],
    },
    {
      objective: 'Unir a los rivales contra el monstruo y presentar al enemigo final del tomo.',
      summary: 'Rei abre un camino con su última Espiral; Mio pasa en planeador y levanta a Sora. Vacío, Sora junta lo poco que queda y lanza un corte débil al ojo de la bestia, que se retuerce. Sobre la cabeza del monstruo, una figura enmascarada se pone de pie. Gendo palidece: reconoce esa máscara.',
      tone: 'Heroico y siniestro.',
      composition: 'Manga-action: cooperación en diagonales ascendentes, rematada por la quietud inquietante del enmascarado.',
      layout: { template: 'manga-action' },
      panels: [
        {
          shot: { bg: 'storm-sky', time: 'night', angle: 'low', chars: [{ id: 'rei', expr: 'furious', pose: 'punch', framing: 'full', x: 0.5, flip: true }], extras: ['wind', 'energy'] },
          lines: [{ who: 'rei', kind: 'shout', text: '¡Te abro el camino! ¡No me hagas quedar mal, Kanata!' }],
          sfx: [{ text: 'GYURURU', size: 'medium' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'speed', chars: [{ id: 'mio', expr: 'determined', pose: 'fly', framing: 'half', x: 0.65, flip: true }, { id: 'sora', expr: 'determined', pose: 'reach', framing: 'half', x: 0.3 }], prop: 'glider', extras: ['wind'] },
          lines: [{ who: 'mio', kind: 'shout', text: '¡Mis alas te llevan! ¡Vos cortá!' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'storm-sky', time: 'night', angle: 'dutch', chars: [{ id: 'sora', expr: 'pain', pose: 'punch', framing: 'full', x: 0.5, flip: true }], extras: ['energy', 'explosion'] },
          lines: [{ who: 'sora', kind: 'shout', text: 'Lo que queda... ¡KAZEKIRI!' }],
          sfx: [{ text: 'ZAN!', size: 'big', rotate: -18 }],
        },
        {
          shot: { bg: 'storm-sky', time: 'night', chars: [{ id: 'gendo', expr: 'shocked', pose: 'stand', framing: 'face', x: 0.75, flip: true }, { id: 'hueco', pose: 'stand', framing: 'silhouette', x: 0.25 }], prop: 'mask', extras: ['lightning'] },
          lines: [{ who: 'gendo', kind: 'whisper', text: 'Esa máscara... la de Ochijima. Imposible.' }],
        },
      ],
    },
    {
      objective: 'Cliffhanger final del volumen: el misterio del sello de Sora.',
      summary: 'El Heraldo Hueco, de pie sobre la bestia, se quita el guante y muestra la palma: un sello brilla con el mismo ámbar que los ojos de Sora. "Ese sello que te falta, Sora Kanata... lo tengo yo." Sora, colgado del planeador de Mio, lo mira sin aliento.',
      tone: 'Escalofrío, misterio, ganas de más.',
      composition: 'Splash en contrapicado extremo: el enmascarado domina la página desde arriba a la derecha; Sora diminuto abajo a la izquierda, con la bufanda caída por falta de viento.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'storm-sky', time: 'night', angle: 'low', chars: [{ id: 'hueco', pose: 'reach', framing: 'full', x: 0.62, flip: true, scale: 1.3 }, { id: 'sora', expr: 'shocked', pose: 'hold', framing: 'half', x: 0.15, scale: 0.6 }], extras: ['glow', 'lightning', 'smoke'] },
          lines: [
            { who: 'hueco', kind: 'dialogue', text: 'Por fin te encuentro, recipiente.' },
            { who: 'hueco', kind: 'dialogue', text: 'Ese sello que te falta, Sora Kanata... lo tengo yo.' },
            { kind: 'caption', text: 'KAZEKIRI — Continuará en el Volumen 2: "El ojo de la tormenta".' },
          ],
          sfx: [{ text: 'DOKUN', size: 'big', rotate: 6 }],
          fx: 'focuslines',
        },
      ],
      notes: 'La bufanda de Sora cuelga quieta por primera vez en todo el tomo: no hay viento. Que el lector lo note.',
    },
  ],
}
