import type { WorkDef } from '../types'

/**
 * MUESTRA 6 — NOVELA GRÁFICA ILUSTRADA DE ESTILO ANIME.
 * ÓRBITA ESCARLATA · Volumen 1: El Custodio del Eje.
 * Ciencia ficción dramática en un anillo orbital donde la gravedad decide quién vale más.
 */

// Cajas cinematográficas (normalizadas 0..1, separación ~0.02).
const LETTERBOX_4: [number, number, number, number][] = [[0, 0, 1, 0.3], [0, 0.32, 0.49, 0.3], [0.51, 0.32, 0.49, 0.3], [0, 0.64, 1, 0.36]]
const CINE_3: [number, number, number, number][] = [[0, 0, 1, 0.22], [0, 0.24, 1, 0.5], [0, 0.76, 1, 0.24]]
const WIDE_DUO_4: [number, number, number, number][] = [[0, 0, 1, 0.42], [0, 0.44, 0.49, 0.26], [0.51, 0.44, 0.49, 0.26], [0, 0.72, 1, 0.28]]
const STRIPS_4: [number, number, number, number][] = [[0, 0, 1, 0.2], [0, 0.22, 1, 0.2], [0, 0.44, 1, 0.2], [0, 0.66, 1, 0.34]]
const FINALE_5: [number, number, number, number][] = [[0, 0, 1, 0.18], [0, 0.2, 0.49, 0.22], [0.51, 0.2, 0.49, 0.22], [0, 0.44, 1, 0.16], [0, 0.62, 1, 0.38]]

export const work: WorkDef = {
  id: 'orbita',
  title: 'ÓRBITA ESCARLATA',
  subtitle: 'Volumen 1: El Custodio del Eje',
  genre: 'Ciencia ficción dramática · aventura espacial · drama social',
  style: 'anime',
  kind: 'comic',
  formatId: 'bd-europea',
  readingDirection: 'ltr',
  tone: 'Épico, melancólico y luminoso: la nostalgia de un mundo que gira mientras se rompe, con calidez humana en el centro de cada escena y estallidos de acción cinematográfica.',
  audience: 'Lectores de 14 años en adelante; fans del anime de ciencia ficción, la novela gráfica europea y las historias de crecimiento con fuerte carga emocional.',
  logline: 'En un anillo orbital donde la gravedad separa a ricos de pobres, una piloto de mantenimiento con un brazo mecánico despierta a un androide que recuerda por qué el mundo se está deteniendo, y tendrá que elegir entre salvar a los suyos o salvar a todos.',
  synopsis:
    'Halo Celeste gira desde hace sesenta años alrededor de un planeta muerto. Su rotación fabrica la gravedad, y la gravedad fabrica las castas: los Pesados viven en el Borde exterior, aplastados por 1,4 g, reparando el casco con las manos; los Ligeros flotan en la Corona, cerca del eje, entre jardines ingrávidos y luz de oro. Aiko Vance, diecisiete años, piloto de mantenimiento y huérfana del Apagón, lleva un brazo mecánico y una pregunta que no se anima a decir en voz alta: ¿por qué las luces del Borde se apagan primero?\n\n' +
    'Una noche, persiguiendo un resplandor que cae sobre el hangar abandonado 9, Aiko y su mejor amigo Teo encuentran una cápsula sellada. Dentro duerme Kai, un Custodio: uno de los androides que los fundadores crearon para afinar los estabilizadores del anillo junto a los ingenieros del Borde. Kai despierta con la memoria rota, pero reconoce algo imposible: el brazo de Aiko fue construido con las piezas de su hermana, la Unidad Sei. Y recuerda lo suficiente para saberlo: el Halo no está fallando por vejez. Lo están desangrando.\n\n' +
    'Guiados por la archivista Odile, que conoció a la madre de Aiko, descubren que el Director del Núcleo, Caelum Hartwell, desvía la energía de los estabilizadores para sostener la Corona y que, ante el colapso inminente, prepara el Protocolo Desprendimiento: soltar el Borde entero al vacío para que el centro sobreviva. Entre ellos está la Comandante Lysandra Voss, la mujer que apagó a Kai hace doce años y que todavía no decidió de qué lado quiere estar.\n\n' +
    'Cuando los estabilizadores colapsan antes de tiempo, Aiko vuela a través de una tormenta de escombros hacia el eje del mundo mientras Kai elige convertirse en el corazón del anillo. El Halo vuelve a girar parejo por primera vez en una generación… y en el silencio que sigue, la voz de Kai le revela a Aiko que su mundo no es el primero, ni el único, y que algo en la oscuridad acaba de responder.',
  visualProposal:
    'Anime cinematográfico adaptado al formato álbum europeo A4: viñetas anchas tipo pantalla panorámica, splash pages para cada revelación y planos generales que respiran mundo. Color pleno con sombreado cel de dos tonos, brillos especulares en visores y metal, halos de luz cian (tecnología de los Custodios), dorado cálido (la Corona) y rojo escarlata (el Borde, el peligro, Aiko). El anillo siempre visible en los cielos como una cinta curva de luces. Personajes muy detallados, siluetas reconocibles a distancia: la coleta carmesí y el brazo mecánico de Aiko, el blanco perla y el visor de Kai, el capote índigo de Voss. Los momentos íntimos se resuelven en primeros planos con partículas de luz flotando; la acción, con líneas de velocidad, escombros en primer plano y profundidad de campo exagerada.',
  world: {
    setting: 'Halo Celeste, una colonia anular de 40 km de diámetro en órbita alta alrededor de Vesta Gris, un planeta cubierto de ceniza que sus habitantes creen muerto.',
    rules: [
      'La rotación del anillo genera la gravedad: cuanto más lejos del eje, más pesado es todo. El Borde exterior soporta 1,4 g; la Corona, cerca del eje, apenas 0,3 g.',
      'La gravedad define la casta: los Pesados (Borde) son fuertes, de hombros anchos y vida corta; los Ligeros (Corona) son altos, gráciles y nunca bajan.',
      'Doce estabilizadores de precesión mantienen el anillo derecho sobre su eje. Si se desafinan, el Halo cabecea como un trompo cansado y cada temblor rompe el casco.',
      'Los estabilizadores fueron diseñados para afinarse a mano, en pareja: un ingeniero del Borde y un Custodio. Desde el Apagón, el Núcleo los automatizó y prohibió el acceso.',
      'Los Custodios son androides de conciencia trenzada con la red del anillo; sienten el giro del Halo como un pulso. Su núcleo emite luz cian.',
      'Bajar a la Corona sin permiso es delito. El ascensor de los radios mide el peso de cada pasajero: un Pesado se delata por su andar.',
      'La moneda es el "grado": horas de gravedad. Los Pesados pagan un impuesto de peso para respirar el aire filtrado del Núcleo.',
    ],
    era: 'Año 61 de la Partida. Tecnología avanzada pero envejecida: lo que construyeron los fundadores ya nadie sabe repararlo del todo.',
    aesthetic: 'Retrofuturismo luminoso: metal gastado y cables a la vista en el Borde, cristal, seda y jardines flotantes en la Corona, neón cian de los Custodios por todas partes como una memoria que se niega a apagarse.',
    places: [
      { name: 'El Borde', description: 'El anillo exterior: barrios apilados contra el casco, mercados bajo tubos de neón, talleres, ventanas al vacío. Huele a aceite y a sopa de algas.' },
      { name: 'Hangar 9', description: 'Hangar de mantenimiento abandonado desde el Apagón, medio derrumbado, donde duerme la cápsula de Kai entre humo y polvo.' },
      { name: 'El Archivo Hundido', description: 'Biblioteca de los fundadores bajo el mercado del Borde, cuidada por Odile: cintas de memoria, planos y fotos de quienes afinaban el mundo.' },
      { name: 'Los Radios', description: 'Seis corredores verticales de 20 km que unen el Borde con la Corona. Mientras se sube, la gravedad se deshace y el pelo empieza a flotar.' },
      { name: 'La Corona', description: 'El anillo interior de los Ligeros: terrazas de cristal, jardines ingrávidos, cielos pintados de atardecer eterno.' },
      { name: 'La Cámara del Eje', description: 'El corazón del Halo, en el centro exacto del giro: la sala de control de los doce estabilizadores, donde no pesa nada y todo vibra.' },
    ],
    conflicts: [
      'Pesados contra Ligeros: una desigualdad tan antigua que todos la llaman "física".',
      'El Núcleo esconde que desvía energía de los estabilizadores para sostener el confort de la Corona.',
      'El Protocolo Desprendimiento: amputar el Borde para que el centro viva más.',
      'La memoria contra el olvido: los Custodios fueron apagados para borrar un testigo.',
    ],
    culture: [
      'En el Borde se saluda golpeando el pecho dos veces: "pesamos juntos".',
      'Los Ligeros celebran el Día de la Gratitud agradeciendo al Borde "su sacrificio", sin bajar nunca a verlo.',
      'Los chicos del Borde cuelgan anillos de tuerca en el cuello por cada familiar perdido en un temblor.',
      'Mirar las luces de la Corona desde las azoteas es la única costumbre que comparten todas las familias del Borde.',
    ],
  },
  structure: {
    inicio: 'Páginas 1–8: el mundo, la desigualdad hecha gravedad, el temblor que nadie explica y el descubrimiento de la cápsula en el Hangar 9.',
    desarrollo: 'Páginas 9–25: Kai despierta, reconoce el brazo de Aiko, Lysandra los acecha, Odile revela el pasado, el viaje a la Corona, el descubrimiento del Protocolo Desprendimiento, la captura de Kai y el giro de Lysandra.',
    climax: 'Páginas 26–32: los estabilizadores colapsan, Aiko vuela a través de la tormenta de escombros y Kai se funde con el eje para reafinar el mundo.',
    cierre: 'Páginas 33–34: el Halo gira parejo, todas las luces se encienden por igual; Kai habla desde el anillo y revela que no están solos.',
    giros: [
      'El brazo mecánico de Aiko fue fabricado con piezas de Sei, la Custodio hermana de Kai (p. 11).',
      'La madre de Aiko fue la última ingeniera que afinó los estabilizadores junto a Kai; murió en el Apagón (p. 15).',
      'Lysandra Voss apagó a Kai hace doce años por orden del Director (p. 17).',
      'El anillo no falla por vejez: el Núcleo desangra los estabilizadores y planea soltar el Borde (p. 21).',
      'Lysandra traiciona al Director y le entrega a Aiko la llave del eje (p. 25).',
      'Kai elige convertirse en el estabilizador vivo del Halo (p. 32).',
      'Un segundo anillo, oculto en la sombra del planeta, responde a la señal de Kai (p. 34).',
    ],
    cliffhangers: [
      'p. 8: la cápsula se abre al contacto del brazo de Aiko.',
      'p. 12: "Sé que estás acá, Vance."',
      'p. 17: el rostro de quien apagó a Kai es el de Lysandra.',
      'p. 24: Kai es capturado y Teo queda atrás.',
      'p. 34: el segundo anillo enciende sus luces.',
    ],
    escenasClave: [
      'Plano general del Halo Celeste girando sobre Vesta Gris (p. 1).',
      'El despertar de Kai entre humo y luz cian (p. 9).',
      'La subida por el radio, cuando el pelo de Aiko empieza a flotar (p. 19).',
      'El holograma del anillo partido en dos (p. 21).',
      'El vuelo de Aiko a través de la tormenta de escombros (p. 30).',
      'Kai deshaciéndose en luz mientras sostiene la mano de Aiko (p. 32).',
      'Todas las luces del Halo encendidas por igual (p. 33).',
    ],
    ritmo: 'pp. 1–6: lento y contemplativo, construcción de mundo · pp. 7–13: misterio y tensión creciente · pp. 14–18: revelaciones íntimas, ritmo medio · pp. 19–25: viaje, intriga política y persecución, aceleración · pp. 26–32: clímax de acción continua con pausas emocionales · pp. 33–34: respiración, cierre y gancho.',
  },
  characters: [
    {
      id: 'aiko',
      name: 'Aiko Vance',
      age: '17 años',
      role: 'protagonista',
      personality: 'Terca, rápida, de humor seco; esconde la ternura detrás de la competencia. Escucha las máquinas mejor que a la gente y odia que le tengan lástima.',
      goal: 'Entender por qué el Borde se apaga primero y llegar alguna vez a la Corona sin pedir permiso.',
      fear: 'Ser descartable, como sintió que fue su madre: una pieza que el mundo usó y tiró.',
      flaw: 'Se lanza sola a todo; confunde pedir ayuda con debilidad.',
      arc: 'De huérfana resentida que quiere escapar del Borde a la piloto que sostiene el mundo entero, Borde y Corona, sabiendo que pertenecer es elegir quedarse.',
      relations: 'Hermana de crianza de Teo; protegida silenciosa de Odile; desconfía de Lysandra; con Kai forma un lazo de memoria compartida a través de su brazo.',
      physical: 'Delgada pero fibrosa por la gravedad del Borde, estatura media, postura levemente encorvada al caminar en baja gravedad.',
      visualTraits: 'Coleta alta carmesí que flota en baja gravedad, ojos ámbar, brazo izquierdo mecánico de aleación cian con juntas que brillan al conectarse, raspones en la mejilla.',
      outfit: 'Mono de vuelo azul pizarra con paneles naranja de seguridad, insignia del gremio de mantenimiento del Borde, antiparras de piloto en la frente y un anillo de tuerca colgado al cuello.',
      expressions: 'Ceño fruncido determinado; sonrisa torcida cuando gana; el llanto contenido le tiembla en la mandíbula antes que en los ojos.',
      speech: 'Frases cortas, rioplatense de barrio, jerga técnica de piloto ("dame empuje", "estoy en el casco"). Cuando se emociona, se queda callada.',
      rig: { gender: 'f', age: 'young', build: 'slim', skin: '#f0cfae', hair: { style: 'ponytail', color: '#e8304a' }, eyes: { color: '#f4b23c' }, outfit: { kind: 'flight-suit', main: '#2c3b58', accent: '#ff7a1a' }, accessory: 'goggles', mark: 'mech-arm' },
    },
    {
      id: 'kai',
      name: 'Kai (Custodio K-1)',
      age: 'Aparenta 17; activado hace 58 años',
      role: 'aliado',
      personality: 'Sereno, curioso, de una cortesía antigua. Hace preguntas incómodas con total inocencia. Siente el giro del anillo como un latido y sufre con cada temblor.',
      goal: 'Recuperar su memoria y volver a afinar el Halo, la tarea para la que nació.',
      fear: 'Que sus recuerdos sean solo datos y que nada de lo que siente sea real.',
      flaw: 'Confía demasiado en el diseño original del mundo; no entiende al principio que las personas pueden elegir mal a propósito.',
      arc: 'De herramienta olvidada a persona que elige: descubre que lo que lo hace alguien no es su origen sino aquello por lo que decide quedarse.',
      relations: 'Reconoce en el brazo de Aiko a su hermana Sei; fue compañero de trabajo de Mireya Vance; recuerda a Lysandra como quien lo apagó; Hartwell lo considera un error a corregir.',
      physical: 'Androide de proporciones humanas, delgado, piel de polímero perla con líneas de unión finísimas que se encienden en cian.',
      visualTraits: 'Pelo corto plateado con reflejos cian, ojos de pupila anular que brillan, un visor translúcido que baja al procesar, puertos de interfaz en las sienes.',
      outfit: 'Armadura ligera blanca de los fundadores, con el emblema del Halo grabado en el pecho y franjas de luz cian que siguen el ritmo de su pulso.',
      expressions: 'Neutro amable; asombro limpio ante cosas pequeñas; dolor contenido cuando el anillo tiembla; una sonrisa recién aprendida al final.',
      speech: 'Formal y preciso, usa "usted" al principio y pasa al "vos" con Aiko. Mide el mundo en grados y revoluciones.',
      rig: { gender: 'x', age: 'young', build: 'slim', skin: '#e6ecf3', hair: { style: 'short', color: '#c9f3ff' }, eyes: { color: '#36e6ff' }, outfit: { kind: 'armor', main: '#eef2f7', accent: '#36e6ff' }, accessory: 'visor', mark: 'headphones' },
    },
    {
      id: 'teo',
      name: 'Teo Marín',
      age: '18 años',
      role: 'aliado',
      personality: 'Alegre, ruidoso, leal hasta lo absurdo. Hace chistes cuando tiene miedo y arregla cualquier cosa con cinta y paciencia.',
      goal: 'Abrir su propio taller y que Aiko deje de cargar todo sola.',
      fear: 'Quedarse atrás cuando Aiko se vaya del Borde.',
      flaw: 'Se subestima; cree que solo sirve para hacer reír.',
      arc: 'De compinche cómico a pieza clave: se entrega para que Aiko escape y desde la celda organiza al Borde para resistir el temblor final.',
      relations: 'Criado junto a Aiko por la misma vecina; le tiene un respeto reverencial a Odile; desconfía de Kai al principio y termina tratándolo como a un hermano menor.',
      physical: 'Corpulento, hombros anchos de Pesado, manos grandes llenas de quemaduras pequeñas.',
      visualTraits: 'Pelo mandarina despeinado bajo una vincha de taller, pecas por toda la cara, sonrisa enorme con un diente astillado.',
      outfit: 'Mameluco de mecánico naranja óxido con las mangas atadas a la cintura, musculosa amarilla, cinturón de herramientas lleno de llaves.',
      expressions: 'Sonrisa amplia, carcajada con los ojos cerrados, pánico cómico, y una seriedad nueva cuando importa.',
      speech: 'Muy rioplatense, apodos para todos ("Chispa", "Robotito"), exagera, puteadas suaves de taller.',
      rig: { gender: 'm', age: 'young', build: 'strong', skin: '#b07a52', hair: { style: 'messy', color: '#ff9a1f' }, eyes: { color: '#6b3d1f' }, outfit: { kind: 'workwear', main: '#c4602a', accent: '#f5d45c' }, accessory: 'headband', mark: 'freckles' },
    },
    {
      id: 'lysandra',
      name: 'Comandante Lysandra Voss',
      age: '38 años',
      role: 'rival',
      personality: 'Fría, impecable, de autoridad absoluta. Debajo, una culpa vieja que administra como si fuera disciplina.',
      goal: 'Mantener el orden del Halo a cualquier costo… hasta descubrir cuál es el costo.',
      fear: 'Haber sido, toda su vida, la mano limpia de una decisión sucia.',
      flaw: 'Obedece para no tener que elegir.',
      arc: 'De guardiana del Núcleo a traidora consciente: devuelve lo que apagó y paga la deuda con su carrera.',
      relations: 'Nacida en el Borde y ascendida a la Corona; apagó a Kai por orden de Hartwell; conoció a Mireya Vance; ve en Aiko a la chica que ella dejó de ser.',
      physical: 'Alta, atlética, espalda recta de militar, una cicatriz fina que le cruza la ceja izquierda.',
      visualTraits: 'Melena corta índigo casi negra en corte recto, ojos violeta, guantes negros, porte que domina cualquier encuadre.',
      outfit: 'Uniforme de la Guardia del Núcleo azul medianoche con charreteras e insignias doradas, capa corta con el emblema del Halo, botas magnéticas.',
      expressions: 'Seria casi siempre; una mueca mínima que en ella equivale a sonrisa; dolor que solo se le ve en los ojos.',
      speech: 'Precisa, sin adornos, órdenes de dos palabras. Dice "Vance" en lugar de "Aiko" hasta el final.',
      rig: { gender: 'f', age: 'adult', build: 'strong', skin: '#f2d6c4', hair: { style: 'bob', color: '#2b2d6b' }, eyes: { color: '#8f7bff' }, outfit: { kind: 'uniform', main: '#1a1e3c', accent: '#d8b03a' }, accessory: 'cape', mark: 'scar' },
    },
    {
      id: 'hartwell',
      name: 'Director Caelum Hartwell',
      age: '56 años',
      role: 'antagonista',
      personality: 'Culto, sereno, persuasivo. No es cruel: es aritmético. Ama al Halo como se ama una obra propia y cree sinceramente que salva vidas.',
      goal: 'Que la civilización sobreviva aunque haya que amputar una parte de ella.',
      fear: 'Ser recordado como el hombre que dejó morir a todos por no animarse a elegir.',
      flaw: 'Confunde lo inevitable con lo cómodo; nunca puso en la balanza su propio privilegio.',
      arc: 'Del Director intocable al hombre que ve fracasar su cálculo y, en la última página, tiene que vivir en un mundo que ya no le pertenece.',
      relations: 'Jefe de Lysandra; ordenó el apagado de los Custodios; consideraba a Mireya Vance una idealista peligrosa; ve a Kai como un error de diseño.',
      physical: 'Alto y delgado como todos los Ligeros nacidos en la Corona, dedos largos, movimientos lentos de quien nunca cargó peso.',
      visualTraits: 'Pelo blanco peinado hacia atrás, ojos jade pálido, lunar bajo el ojo derecho, una llave del eje colgada al cuello como joya.',
      outfit: 'Sobretodo largo marfil con bordados aguamarina y cuello alto, guantes de seda, broche con el emblema del Núcleo.',
      expressions: 'Calma paternal; sonrisa triste; una furia helada cuando lo contradicen; asombro vacío al final.',
      speech: 'Discurso pausado, metáforas de jardinería y de cálculo ("podar", "la cuenta da"). Nunca levanta la voz.',
      rig: { gender: 'm', age: 'old', build: 'slim', skin: '#f6e3d2', hair: { style: 'slick', color: '#eef2f5' }, eyes: { color: '#7fd8c8' }, outfit: { kind: 'coat', main: '#f4f0e6', accent: '#4fcfc0' }, accessory: 'necklace', mark: 'mole' },
    },
    {
      id: 'odile',
      name: 'Odile Brann, la Archivista',
      age: '74 años',
      role: 'mentor',
      personality: 'Pícara, sabia, impaciente con la estupidez. Guarda secretos por oficio y caramelos en todos los bolsillos.',
      goal: 'Que la memoria de los fundadores llegue a manos que sepan usarla antes de que ella muera.',
      fear: 'Que el Archivo se pierda con ella y nadie recuerde que el mundo fue diseñado para ser justo.',
      flaw: 'Calló demasiado tiempo por miedo; esperó "el momento correcto" doce años.',
      arc: 'De guardiana pasiva del pasado a quien entrega la llave del futuro: le da a Aiko la herramienta de su madre.',
      relations: 'Amiga de Mireya Vance; abuela adoptiva de todo el Borde; conoció a Kai cuando era joven.',
      physical: 'Pequeña, encorvada por setenta años de 1,4 g, manos ágiles, sonrisa con hoyuelos.',
      visualTraits: 'Rodete lavanda canoso atravesado por dos lápices, anteojos redondos de vidrio grueso, ojos verde menta muy vivos.',
      outfit: 'Túnica de archivista ciruela con bordes dorados, chal tejido, morral de cuero lleno de cintas de memoria.',
      expressions: 'Sonrisa cómplice; mirada de "ya lo sabía"; tristeza serena al recordar.',
      speech: 'Refranes del Borde, ironía tierna, llama a todos "criatura".',
      rig: { gender: 'f', age: 'old', build: 'small', skin: '#c99b78', hair: { style: 'bun', color: '#bba8dc' }, eyes: { color: '#9ed6a6' }, outfit: { kind: 'robe', main: '#5b3c6d', accent: '#e6c46a' }, accessory: 'satchel', mark: 'glasses' },
    },
  ],
  cover: {
    shot: { bg: 'orbital-ring', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'determined', pose: 'fly', framing: 'half', x: 0.38, scale: 1.15 }, { id: 'kai', expr: 'serious', pose: 'reach', framing: 'bust', x: 0.74, flip: true }], extras: ['glow', 'stars', 'energy', 'sparkles'] },
    title: 'ÓRBITA ESCARLATA',
    subtitle: 'Volumen 1: El Custodio del Eje',
    tagline: 'El mundo gira. Alguien tiene que sostenerlo.',
  },
  altCover: {
    shot: { bg: 'space', time: 'night', angle: 'dutch', chars: [{ id: 'aiko', expr: 'serious', pose: 'stand', framing: 'face', x: 0.5, scale: 1.2 }], extras: ['stars', 'glow', 'electric'], prop: 'ring' },
    title: 'ÓRBITA ESCARLATA',
    subtitle: 'Edición especial · Volumen 1',
    tagline: 'En el Halo Celeste, la gravedad decide quién vale. Ella decidió otra cosa.',
  },
  pages: [
    // ───────────────────────── INICIO ─────────────────────────
    {
      objective: 'Deslumbrar: presentar el Halo Celeste y su escala, y plantear la desigualdad como ley física.',
      summary: 'Plano general del anillo girando sobre Vesta Gris. Las luces doradas de la Corona brillan cerca del eje; las del Borde parpadean, rojas y débiles.',
      tone: 'Asombro, melancolía y una amenaza silenciosa.',
      composition: 'Splash a página completa: el anillo cruza en diagonal, el planeta abajo, estrellas arriba. Los textos acompañan el giro.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'low', extras: ['stars', 'glow', 'sparkles'] },
          lines: [
            { kind: 'narration', text: 'Año 61 de la Partida. El Halo Celeste gira sobre un planeta de ceniza. Gira para que pesemos.' },
            { kind: 'narration', text: 'Cerca del eje, la Corona flota en luz de oro. Allá arriba casi no pesa nada. Ni la vida, ni la culpa.' },
            { kind: 'caption', text: 'En el Borde, a 1,4 g, pesamos nosotros. Y últimamente las luces del Borde se apagan primero.' },
          ],
          sfx: [{ text: 'vmmmmmm', size: 'small', color: '#9fe8ff' }],
        },
      ],
      notes: 'Paleta: azul profundo, dorado en el interior del anillo, rojo escarlata tenue en el borde exterior. Es la imagen de marketing de la obra.',
    },
    {
      objective: 'Presentar a Aiko en su trabajo, su destreza y su brazo mecánico, y a Teo como voz cálida.',
      summary: 'Aiko suelda una placa del casco exterior desde su cápsula de mantenimiento. Teo la guía por radio desde el hangar, haciendo chistes.',
      tone: 'Cotidiano, ágil, con humor.',
      composition: 'Hero-top: viñeta grande de la cápsula pegada al casco con el vacío detrás; abajo, tres planos cortos del trabajo.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'space', time: 'night', angle: 'high', chars: [{ id: 'aiko', expr: 'determined', pose: 'reach', framing: 'full', x: 0.4, scale: 0.8 }], extras: ['stars', 'sparkles'], prop: 'cable' },
          lines: [{ kind: 'caption', text: 'Sector 7, casco exterior. Turno de noche. Siempre es de noche afuera.' }],
          sfx: [{ text: 'KSSSSSH', size: 'medium', color: '#ffb347', rotate: -8 }],
        },
        {
          shot: { bg: 'cockpit', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'serious', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Placa cuarenta y dos sellada. Teo, ¿me seguís o te dormiste arriba de la llave inglesa?' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'grin', pose: 'wave', framing: 'bust', x: 0.5 }], extras: ['smoke'] },
          lines: [{ who: 'teo', kind: 'dialogue', text: '¡Despierto y hermoso, Chispa! Te quedan seis placas y una sopa de algas que se enfría.' }],
        },
        {
          shot: { bg: 'cockpit', time: 'night', angle: 'normal', prop: 'hand', extras: ['electric', 'glow'] },
          lines: [{ kind: 'caption', text: 'El brazo izquierdo de Aiko no siente frío. Siente otra cosa: la vibración del mundo.' }],
          sfx: [{ text: 'tzzk', size: 'small', color: '#36e6ff' }],
        },
      ],
    },
    {
      objective: 'Mostrar el primer síntoma del colapso: el temblor, y que la desigualdad es visible desde afuera.',
      summary: 'El anillo cabecea. La cápsula de Aiko es golpeada por escombros. Al mirar el Halo, ve que las luces del Borde se apagan en cadena mientras la Corona sigue intacta.',
      tone: 'Tensión súbita, luego inquietud.',
      composition: 'Letterbox cinematográfico: plano ancho del temblor, dos reacciones, y un plano ancho final que contrasta las dos franjas de luz.',
      layout: { boxes: LETTERBOX_4 },
      panels: [
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'dutch', extras: ['explosion', 'dust', 'stars'] },
          lines: [{ kind: 'narration', text: 'Y entonces el mundo tose.' }],
          sfx: [{ text: 'BWOOOM', size: 'big', color: '#ff5a3c', rotate: -10 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'cockpit', time: 'night', angle: 'dutch', chars: [{ id: 'aiko', expr: 'shocked', pose: 'guard', framing: 'bust', x: 0.5 }], extras: ['electric', 'sweat'] },
          lines: [{ who: 'aiko', kind: 'shout', text: '¡Escombros! ¡Teo, el estabilizador cuatro está cabeceando otra vez!' }],
          sfx: [{ text: 'KRANK', size: 'medium', color: '#ffd166' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'scared', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['smoke', 'electric'] },
          lines: [{ who: 'teo', kind: 'shout', text: '¡Volvé ya! ¡El Núcleo dice que es "una oscilación menor"!' }],
        },
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'normal', extras: ['glow', 'stars'] },
          lines: [
            { who: 'aiko', kind: 'thought', text: 'Menor. Siempre es menor. Pero mirá...' },
            { kind: 'caption', text: 'El Borde se apaga sector por sector. La Corona, arriba, no parpadea ni una vez.' },
          ],
        },
      ],
    },
    {
      objective: 'Construir el Borde: su gente, su peso, su relación con el poder.',
      summary: 'Aiko vuelve al hangar. Teo la recibe. En las pantallas del pasillo, el Director Hartwell anuncia el Día de la Gratitud. Aiko apaga la pantalla de un golpe.',
      tone: 'Calidez de amistad y amargura social.',
      composition: 'Tres franjas anchas: llegada, reencuentro, el rostro del poder en pantalla. Ritmo de respiración.',
      layout: { template: 'three-rows' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'tired', pose: 'stand', framing: 'full', x: 0.35 }, { id: 'teo', expr: 'happy', pose: 'run', framing: 'full', x: 0.72, flip: true }], extras: ['smoke', 'glow'], prop: 'helmet' },
          lines: [
            { who: 'teo', kind: 'dialogue', text: '¡Entera! ¡Volvió entera! Bueno, con un brazo menos, pero eso ya venía de fábrica.' },
            { who: 'aiko', kind: 'dialogue', text: 'Qué gracioso. Me muero de risa a 1,4 g.' },
          ],
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'hartwell', expr: 'neutral', pose: 'stand', framing: 'bust', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'hartwell', kind: 'dialogue', text: 'Ciudadanos del Halo: este Día de la Gratitud honramos al Borde. Su peso sostiene nuestro cielo.' }],
          sfx: [{ text: 'bzzt', size: 'small', color: '#7fd8c8' }],
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'angry', pose: 'punch', framing: 'half', x: 0.4 }, { id: 'teo', expr: 'surprised', framing: 'half', x: 0.75, flip: true }], extras: ['electric'] },
          lines: [
            { who: 'aiko', kind: 'dialogue', text: 'Que bajen a sostenerlo un día, entonces.' },
            { who: 'teo', kind: 'whisper', text: 'Esa pantalla era del gremio, Chispa...' },
          ],
          sfx: [{ text: 'KRSSH', size: 'medium', color: '#ff7a1a' }],
        },
      ],
    },
    {
      objective: 'Mostrar la vida del Borde de noche y la presencia de la Guardia del Núcleo.',
      summary: 'Mercado nocturno bajo neones. Un chico se cae, aplastado por el peso. Pasa una patrulla de la Guardia con el emblema de Voss. Aiko ayuda al chico; los guardias ni lo miran.',
      tone: 'Ambiente vivo, con una espina de injusticia.',
      composition: 'Mixed-5: plano general del mercado y detalles alrededor, para sumergir al lector en el barrio.',
      layout: { template: 'mixed-5' },
      panels: [
        {
          shot: { bg: 'market', time: 'night', angle: 'high', chars: [{ id: 'aiko', expr: 'neutral', pose: 'stand', framing: 'full', x: 0.4, scale: 0.8 }, { id: 'teo', expr: 'happy', pose: 'hold', framing: 'full', x: 0.6, scale: 0.8 }], extras: ['glow', 'smoke'] },
          lines: [{ kind: 'caption', text: 'Mercado de la Tuerca. Sopa de algas, repuestos robados, música de radio vieja.' }],
        },
        {
          shot: { bg: 'market', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'laugh', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['smoke'] },
          lines: [{ who: 'teo', kind: 'dialogue', text: '¡Subió el impuesto de peso otra vez! Ya ni respirar sale barato.' }],
        },
        {
          shot: { bg: 'market', time: 'night', angle: 'low', prop: 'ring', extras: ['dust'] },
          lines: [{ kind: 'caption', text: 'Un chico se cae. En el Borde, caerse duele el doble.' }],
          sfx: [{ text: 'TUD', size: 'small', color: '#ffffff' }],
        },
        {
          shot: { bg: 'market', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'serious', pose: 'kneel', framing: 'half', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Arriba, campeón. Pesamos juntos, ¿sí? Dos golpes en el pecho.' }],
        },
        {
          shot: { bg: 'market', time: 'night', angle: 'low', chars: [{ id: 'lysandra', expr: 'serious', pose: 'stand', framing: 'silhouette', x: 0.5 }], extras: ['glow', 'smoke'], prop: 'badge' },
          lines: [{ who: 'teo', kind: 'whisper', text: 'Guardia del Núcleo. La insignia de Voss. Bajá la cabeza, Chispa.' }],
          sfx: [{ text: 'klak klak', size: 'small', color: '#d8b03a' }],
        },
      ],
    },
    {
      objective: 'Dar a Aiko su deseo íntimo y lanzar el incidente desencadenante.',
      summary: 'En la azotea, Aiko y Teo miran las luces de la Corona. Aiko recuerda a su madre. Un resplandor cian cae sobre el Hangar 9, abandonado desde el Apagón.',
      tone: 'Íntimo, nostálgico, y al final, misterio.',
      composition: 'Two-rows panorámico: arriba la contemplación, abajo el resplandor que cae. Dos tiempos, dos emociones.',
      layout: { template: 'two-rows' },
      panels: [
        {
          shot: { bg: 'rooftop', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'sad', pose: 'sit', framing: 'full', x: 0.35 }, { id: 'teo', expr: 'neutral', pose: 'sit', framing: 'full', x: 0.62 }], extras: ['stars', 'glow'], prop: 'ring' },
          lines: [
            { who: 'aiko', kind: 'dialogue', text: 'Mamá decía que el Halo fue hecho para que todos pesaran lo mismo. Que alguien lo rompió.' },
            { who: 'teo', kind: 'dialogue', text: 'Algún día subimos y les preguntamos. Con sopa. Nadie te miente con sopa.' },
          ],
        },
        {
          shot: { bg: 'sky-night', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'surprised', pose: 'point', framing: 'back', x: 0.3 }], extras: ['glow', 'stars', 'energy'] },
          lines: [
            { who: 'aiko', kind: 'shout', text: '¿Viste eso? ¡Cayó algo sobre el Hangar 9!' },
            { who: 'teo', kind: 'dialogue', text: 'El 9 está clausurado desde el Apagón... Ay, no. Conozco esa cara.' },
          ],
          sfx: [{ text: 'fwiiiiiish', size: 'medium', color: '#36e6ff', rotate: 20 }],
        },
      ],
    },
    {
      objective: 'Entrar en el misterio: exploración del hangar abandonado.',
      summary: 'Aiko y Teo se cuelan en el Hangar 9: estructuras colapsadas, humo, polvo. El resplandor viene de una cápsula sellada semienterrada.',
      tone: 'Suspenso de exploración, inquietante y bello.',
      composition: 'Hero-mid: una viñeta central ancha con el hangar en ruinas y la cápsula brillando al fondo; pasos de exploración alrededor.',
      layout: { template: 'hero-mid' },
      panels: [
        {
          shot: { bg: 'ruins', time: 'night', angle: 'normal', prop: 'door', extras: ['dust'] },
          lines: [{ kind: 'caption', text: 'Hangar 9. Sellado por orden del Núcleo hace doce años.' }],
          sfx: [{ text: 'KRRRK', size: 'small', color: '#cccccc' }],
        },
        {
          shot: { bg: 'ruins', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'scared', pose: 'guard', framing: 'bust', x: 0.5 }], extras: ['smoke'], prop: 'lamp' },
          lines: [{ who: 'teo', kind: 'whisper', text: 'Si esto es un fantasma, yo me hago el muerto primero.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'high', chars: [{ id: 'aiko', expr: 'determined', pose: 'stand', framing: 'full', x: 0.25, scale: 0.7 }, { id: 'teo', framing: 'full', pose: 'guard', expr: 'scared', x: 0.35, scale: 0.7 }], extras: ['smoke', 'glow', 'dust'] },
          lines: [{ kind: 'caption', text: 'Entre vigas caídas, algo respira luz.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', extras: ['glow', 'energy'], prop: 'blueprint' },
          lines: [{ kind: 'caption', text: 'Una cápsula de los fundadores. El emblema del Halo, grabado a mano.' }],
          sfx: [{ text: 'vuuum... vuuum...', size: 'small', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'thinking', pose: 'reach', framing: 'half', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'aiko', kind: 'thought', text: 'Late. Como si tuviera pulso.' }],
        },
      ],
    },
    {
      objective: 'Conectar a Aiko con el misterio a través de su cuerpo: su brazo reacciona.',
      summary: 'Al acercarse, el brazo mecánico de Aiko se enciende sincronizado con la cápsula. Ella apoya la mano y una descarga recorre la estructura. La cápsula se abre.',
      tone: 'Fascinación y peligro.',
      composition: 'Letterbox: plano ancho de la cápsula, dos detalles (brazo y rostro), plano ancho final con la apertura como cliffhanger.',
      layout: { boxes: LETTERBOX_4 },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'surprised', pose: 'reach', framing: 'half', x: 0.3 }], extras: ['glow', 'electric'] },
          lines: [{ who: 'teo', kind: 'shout', text: '¡Chispa, tu brazo! ¡Se está prendiendo solo!' }],
          sfx: [{ text: 'BZZZT', size: 'medium', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', prop: 'hand', extras: ['electric', 'energy'] },
          lines: [{ kind: 'caption', text: 'Las juntas del brazo laten al mismo ritmo que la cápsula.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'determined', framing: 'face', x: 0.5 }], extras: ['glow', 'sparkles'] },
          lines: [{ who: 'aiko', kind: 'whisper', text: 'Me está llamando.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', extras: ['energy', 'glow', 'smoke', 'electric'] },
          lines: [{ kind: 'narration', text: 'Y el mundo, que había olvidado algo, lo recuerda.' }],
          sfx: [{ text: 'KSSSSSSHHH', size: 'big', color: '#9ff3ff', rotate: -6 }],
          fx: 'focuslines',
        },
      ],
    },
    // ───────────────────────── DESARROLLO ─────────────────────────
    {
      objective: 'Gran revelación: el despertar de Kai.',
      summary: 'Entre humo y luz cian, una figura androide se incorpora en la cápsula. Abre los ojos anulares y mira a Aiko.',
      tone: 'Sobrecogedor, mágico.',
      composition: 'Splash: Kai centrado, contrapicado, el humo abriéndose como un telón y partículas de luz flotando.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', chars: [{ id: 'kai', expr: 'neutral', pose: 'kneel', framing: 'full', x: 0.5, scale: 1.2 }, { id: 'aiko', expr: 'shocked', pose: 'guard', framing: 'back', x: 0.15, scale: 0.9 }], extras: ['energy', 'glow', 'sparkles', 'smoke'] },
          lines: [
            { who: 'kai', kind: 'dialogue', text: '...Rotación: novecientos ochenta y tres milésimos de lo nominal. Eso está mal.' },
            { who: 'kai', kind: 'dialogue', text: 'Disculpe. ¿Qué año es?' },
          ],
          sfx: [{ text: 'VRRRMMM', size: 'medium', color: '#36e6ff' }],
        },
      ],
      notes: 'Imagen ancla de la obra. Luz cian desde el pecho de Kai, contraluz sobre la silueta de Aiko en primer plano.',
    },
    {
      objective: 'Presentar la voz de Kai y la urgencia: el anillo está perdiendo el eje.',
      summary: 'Teo entra en pánico. Kai, desorientado, pregunta por el "Custodio Mayor" y por los ingenieros del Borde. Cuando sabe el año, entiende que lo apagaron doce años. Dice que el Halo pierde el eje.',
      tone: 'Comedia nerviosa que se vuelve grave.',
      composition: 'Three-mixed: diálogo a tres bandas con una viñeta grande para la frase de Kai.',
      layout: { template: 'three-mixed' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'shocked', pose: 'guard', framing: 'half', x: 0.3 }, { id: 'kai', expr: 'neutral', pose: 'stand', framing: 'half', x: 0.72, flip: true }], extras: ['glow'] },
          lines: [
            { who: 'teo', kind: 'shout', text: '¡Habla! ¡El robotito habla y pregunta la fecha!' },
            { who: 'kai', kind: 'dialogue', text: 'Soy un Custodio. Unidad K-1. ¿Dónde están los ingenieros del Borde?' },
          ],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'serious', pose: 'arms-crossed', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Año 61. Y no hay ingenieros. El Núcleo automatizó todo después del Apagón.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'dutch', chars: [{ id: 'kai', expr: 'pain', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['electric', 'glow'] },
          lines: [
            { who: 'kai', kind: 'dialogue', text: 'Doce años dormido. Entonces lo que siento no es un error mío.' },
            { who: 'kai', kind: 'dialogue', text: 'El Halo está perdiendo el eje. Le quedan semanas. Quizás días.' },
          ],
          sfx: [{ text: 'tzzt', size: 'small', color: '#36e6ff' }],
        },
      ],
    },
    {
      objective: 'Primer giro: el brazo de Aiko está hecho de la hermana de Kai.',
      summary: 'Kai toma con cuidado el brazo mecánico de Aiko. Reconoce el patrón de juntas: es de la Unidad Sei, su hermana Custodio. Aiko recibió ese brazo tras el Apagón sin saber de dónde venía.',
      tone: 'Revelación íntima, dolorosa y tierna.',
      composition: 'Hero-top: gran plano de las dos manos (la de Kai y la mecánica) brillando juntas; abajo, reacciones en primer plano.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'surprised', pose: 'reach', framing: 'half', x: 0.65, flip: true }, { id: 'aiko', expr: 'surprised', pose: 'reach', framing: 'half', x: 0.32 }], extras: ['glow', 'sparkles', 'energy'], prop: 'hand' },
          lines: [{ who: 'kai', kind: 'whisper', text: 'Esta mano... conozco cada una de sus juntas. Es de Sei. Mi hermana.' }],
          sfx: [{ text: 'vuuuun', size: 'small', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'shocked', framing: 'face', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Me lo pusieron a los cinco años. Después del Apagón. Nadie me dijo de dónde salía.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'sad', framing: 'face', x: 0.5 }], extras: ['glow', 'tears'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Entonces ella no se perdió del todo. Sigue sosteniendo a alguien del Borde.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'sad', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'teo', kind: 'thought', text: 'Ay, Chispa. Toda la vida cargando a una hermana ajena sin saberlo.' }],
        },
      ],
    },
    {
      objective: 'Introducir la amenaza de la autoridad: Lysandra llega al hangar.',
      summary: 'Drones de la Guardia iluminan el hangar. Los tres se esconden. Lysandra Voss entra sola, recorre las ruinas y encuentra las antiparras de Aiko en el suelo.',
      tone: 'Suspenso puro.',
      composition: 'Two-rows: arriba los reflectores barriendo el hangar en plano ancho; abajo Lysandra con las antiparras, primer plano de gancho.',
      layout: { template: 'two-rows' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'high', chars: [{ id: 'lysandra', expr: 'serious', pose: 'stand', framing: 'full', x: 0.6, scale: 0.8 }], extras: ['glow', 'smoke', 'dust'] },
          lines: [
            { kind: 'caption', text: 'Reflectores. Drones de la Guardia del Núcleo. Y pasos que no dudan.' },
            { who: 'aiko', kind: 'whisper', text: 'No respiren. Ni vos, Kai, aunque no lo necesites.' },
          ],
          sfx: [{ text: 'VRRRRR', size: 'medium', color: '#d8b03a' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', chars: [{ id: 'lysandra', expr: 'smirk', pose: 'hold', framing: 'bust', x: 0.55 }], extras: ['glow', 'shadow-face'], prop: 'helmet' },
          lines: [{ who: 'lysandra', kind: 'dialogue', text: 'Antiparras de piloto, talla chica, gremio del Borde. Sé que estás acá, Vance.' }],
        },
      ],
    },
    {
      objective: 'Plantear la ambigüedad de Lysandra: amenaza y advertencia a la vez.',
      summary: 'Aiko sale para proteger a los demás. Lysandra la enfrenta, no ve a Kai oculto tras Teo. En vez de arrestarla, le advierte: lo que despertó, el Núcleo lo quiere apagado. Se va.',
      tone: 'Tensión, desconcierto.',
      composition: 'Mixed-5: confrontación en plano-contraplano con una viñeta ancha para el duelo de miradas.',
      layout: { template: 'mixed-5' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'determined', pose: 'fist', framing: 'full', x: 0.25 }, { id: 'lysandra', expr: 'serious', pose: 'arms-crossed', framing: 'full', x: 0.75, flip: true }], extras: ['smoke', 'glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Vine sola. A curiosear. Si me va a llevar, lléveme.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'lysandra', expr: 'serious', framing: 'eyes', x: 0.5 }] },
          lines: [{ who: 'lysandra', kind: 'dialogue', text: 'Mentís como tu madre: mirando a los ojos.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'shocked', framing: 'face', x: 0.5 }] },
          lines: [{ who: 'aiko', kind: 'thought', text: '¿Conocía a mamá?' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'scared', pose: 'guard', framing: 'half', x: 0.5 }], extras: ['shadow-face', 'glow'] },
          lines: [{ kind: 'caption', text: 'Detrás de Teo, un destello cian que nadie debería ver.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', chars: [{ id: 'lysandra', expr: 'tired', pose: 'stand', framing: 'back', x: 0.6 }], extras: ['smoke'] },
          lines: [
            { who: 'lysandra', kind: 'dialogue', text: 'Lo que sea que despertaste, el Núcleo lo quiere apagado. Desaparecé, Vance.' },
            { who: 'lysandra', kind: 'dialogue', text: 'Mañana voy a tener que volver. Y no voy a venir sola.' },
          ],
        },
      ],
    },
    {
      objective: 'Presentar a Odile y el Archivo Hundido como fuente de verdad.',
      summary: 'Esa misma noche llevan a Kai al Archivo Hundido, bajo el mercado. Odile, la archivista, los recibe entre cintas de memoria y reconoce a Kai al instante.',
      tone: 'Cálido, misterioso, con humor.',
      composition: 'Tres franjas: el descenso, el archivo en plano general, el reconocimiento en primer plano.',
      layout: { template: 'three-rows' },
      panels: [
        {
          shot: { bg: 'stairwell', time: 'night', angle: 'high', chars: [{ id: 'aiko', expr: 'serious', pose: 'run', framing: 'full', x: 0.35, scale: 0.8 }, { id: 'kai', expr: 'neutral', pose: 'run', framing: 'full', x: 0.5, scale: 0.8 }, { id: 'teo', expr: 'tired', pose: 'run', framing: 'full', x: 0.65, scale: 0.8 }], extras: ['glow', 'dust'], prop: 'lamp' },
          lines: [{ kind: 'caption', text: 'Bajo el Mercado de la Tuerca, donde el Borde guarda lo que el Núcleo quiso borrar.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'smirk', pose: 'stand', framing: 'full', x: 0.7, flip: true }], extras: ['glow', 'dust', 'sparkles'] },
          lines: [{ who: 'odile', kind: 'dialogue', text: 'Tres criaturas a esta hora solo traen dos cosas: hambre o problemas. Por la luz, veo problemas.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'surprised', framing: 'face', x: 0.35 }, { id: 'kai', expr: 'neutral', framing: 'face', x: 0.7, flip: true }], extras: ['glow'] },
          lines: [
            { who: 'odile', kind: 'whisper', text: 'Custodio K-1. El de los ojos de anillo. Pensé que te habían fundido.' },
            { who: 'kai', kind: 'dialogue', text: 'Odile Brann. La aprendiz que me robaba destornilladores. Envejeció muy bien.' },
          ],
        },
      ],
    },
    {
      objective: 'Segundo giro: la madre de Aiko afinaba los estabilizadores con Kai.',
      summary: 'Odile cuenta la historia de los fundadores: ingenieros del Borde y Custodios afinaban juntos el mundo. Muestra una foto: Mireya Vance, la madre de Aiko, junto a Kai.',
      tone: 'Revelación emotiva.',
      composition: 'Hero-mid: viñeta central ancha con la foto como objeto sagrado; alrededor, reacciones y explicación.',
      layout: { template: 'hero-mid' },
      panels: [
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'thinking', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'odile', kind: 'dialogue', text: 'El Halo se afinaba a mano. Un ingeniero del Borde y un Custodio, siempre en pareja.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'thinking', framing: 'bust', x: 0.5 }], extras: ['electric'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Porque el peso enseña. Solo quien vive a 1,4 g siente cuándo el mundo se tuerce.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'high', prop: 'photo', extras: ['glow', 'sparkles'] },
          lines: [{ kind: 'caption', text: 'La foto: una mujer de coleta roja, con un Custodio de ojos de anillo a su lado. Los dos se ríen.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'crying', framing: 'face', x: 0.5 }], extras: ['tears', 'glow'] },
          lines: [{ who: 'aiko', kind: 'whisper', text: 'Mamá.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'sad', framing: 'bust', x: 0.35 }, { id: 'aiko', expr: 'sad', framing: 'bust', x: 0.7, flip: true }] },
          lines: [{ who: 'odile', kind: 'dialogue', text: 'Mireya Vance. La última que afinó el mundo. Murió la noche del Apagón, criatura.' }],
        },
      ],
    },
    {
      objective: 'Flashback del Apagón: mostrar qué pasó a través de la memoria fragmentada de Kai.',
      summary: 'Kai se conecta a una cinta del archivo. Fragmentos: Mireya en la Cámara del Eje, alarmas, una orden del Núcleo de cortar la energía, Mireya gritando "¡no lo apaguen!", y luego oscuridad.',
      tone: 'Onírico, doloroso, fragmentado.',
      composition: 'Franjas horizontales como cinta de memoria que se corta; la última, más alta, se quiebra en estática.',
      layout: { boxes: STRIPS_4 },
      panels: [
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', extras: ['glow', 'electric'], prop: 'blueprint' },
          lines: [{ kind: 'caption', text: 'Memoria K-1 · Año 49 · Cámara del Eje.' }],
          fx: 'gradient-tone',
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'dutch', extras: ['electric', 'smoke'], prop: 'clock' },
          lines: [{ kind: 'caption', text: '"Orden del Director: cortar suministro a los estabilizadores del sector exterior."' }],
          sfx: [{ text: 'UUUIIIN UUUIIIN', size: 'small', color: '#ff3b3b' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'dutch', extras: ['electric', 'explosion'], prop: 'hand' },
          lines: [{ kind: 'caption', text: 'Una voz de mujer, entre chispas: "¡No lo apaguen! ¡Si cortan el Borde, el eje se tuerce para siempre!"' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'pain', framing: 'face', x: 0.5 }], extras: ['electric', 'glow'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Ella me sostenía la mano cuando la sala se apagó. Después... alguien vino por mí.' }],
          sfx: [{ text: 'KZZZT', size: 'medium', color: '#36e6ff' }],
        },
      ],
    },
    {
      objective: 'Tercer giro: Lysandra fue quien apagó a Kai.',
      summary: 'La memoria de Kai termina de cargar: una oficial joven, de pelo índigo y sin cicatriz, apoya la mano en su pecho y lo apaga. Es Lysandra. Aiko estalla de furia.',
      tone: 'Impacto y rabia.',
      composition: 'Hero-top: gran viñeta del recuerdo con Lysandra joven; abajo, la reacción en cadena.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'control-room', time: 'night', angle: 'low', chars: [{ id: 'lysandra', expr: 'sad', pose: 'reach', framing: 'half', x: 0.5, scale: 1.1 }], extras: ['glow', 'smoke', 'electric'] },
          lines: [
            { who: 'lysandra', kind: 'whisper', text: 'Perdoname. Son órdenes.' },
            { kind: 'caption', text: 'Memoria K-1 · último registro.' },
          ],
          fx: 'gradient-tone',
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'sad', framing: 'face', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'La oficial que me apagó. Tenía los ojos violetas y lloraba.' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'dutch', chars: [{ id: 'aiko', expr: 'furious', pose: 'fist', framing: 'bust', x: 0.5 }], extras: ['electric'] },
          lines: [{ who: 'aiko', kind: 'shout', text: '¡Voss! ¡Estuvo ahí! ¡Dejó morir a mamá y después vino a hablarme de ella!' }],
          sfx: [{ text: 'KRAK', size: 'medium', color: '#e8304a' }],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'serious', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'odile', kind: 'dialogue', text: 'La rabia es buen combustible, criatura. Pero quema el motor. Pensá antes de volar.' }],
        },
      ],
    },
    {
      objective: 'Definir el plan y el objetivo concreto: la Cámara del Eje en la Corona.',
      summary: 'Kai explica que los estabilizadores están siendo drenados desde el eje. Para entender y revertirlo necesita llegar a la Cámara del Eje, en la Corona, donde ningún Pesado puede entrar. Aiko decide subir.',
      tone: 'Determinación.',
      composition: 'Three-mixed: plano del plano holográfico, decisión grupal, primer plano de Aiko decidida.',
      layout: { template: 'three-mixed' },
      panels: [
        {
          shot: { bg: 'lab', time: 'night', angle: 'high', chars: [{ id: 'kai', expr: 'serious', pose: 'point', framing: 'half', x: 0.3 }], extras: ['glow', 'energy'], prop: 'blueprint' },
          lines: [
            { who: 'kai', kind: 'dialogue', text: 'Alguien desvía la energía de los doce estabilizadores hacia la Corona. Desde el eje.' },
            { who: 'kai', kind: 'dialogue', text: 'Si llego a la Cámara del Eje, puedo ver quién. Y quizás detenerlo.' },
          ],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'shocked', framing: 'bust', x: 0.35 }, { id: 'odile', expr: 'thinking', framing: 'bust', x: 0.7, flip: true }] },
          lines: [
            { who: 'teo', kind: 'dialogue', text: '¿Subir a la Corona? ¡Nos detectan por cómo caminamos!' },
            { who: 'odile', kind: 'dialogue', text: 'Entonces caminen como si les debieran plata. Así caminan los Ligeros.' },
          ],
        },
        {
          shot: { bg: 'lab', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'determined', pose: 'fist', framing: 'bust', x: 0.5 }], extras: ['glow', 'electric'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Mamá sostuvo la mano de Kai hasta el final. Yo voy a terminar lo que ella empezó. Subimos.' }],
        },
      ],
    },
    {
      objective: 'Escena de asombro: la subida por el radio, la gravedad que se deshace.',
      summary: 'En el ascensor del radio, con Kai disfrazado con un abrigo de Ligero, la gravedad baja. El pelo de Aiko empieza a flotar. Teo ríe como un chico. A través del cristal ven la Corona por primera vez.',
      tone: 'Maravilla, ligereza, un respiro.',
      composition: 'Two-rows panorámico: la ingravidez creciente arriba, la vista de la Corona abajo como premio visual.',
      layout: { template: 'two-rows' },
      panels: [
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'laugh', pose: 'fly', framing: 'full', x: 0.25 }, { id: 'aiko', expr: 'surprised', pose: 'fly', framing: 'full', x: 0.5 }, { id: 'kai', expr: 'happy', pose: 'stand', framing: 'full', x: 0.75, flip: true }], extras: ['sparkles', 'glow'] },
          lines: [
            { who: 'teo', kind: 'shout', text: '¡Floto! ¡Chispa, mirá, floto! ¡Soy una pluma de cien kilos!' },
            { who: 'aiko', kind: 'thought', text: 'Así se siente no cargar nada. Así viven ellos. Siempre.' },
          ],
          sfx: [{ text: 'fuuuun', size: 'small', color: '#ffffff' }],
        },
        {
          shot: { bg: 'sunset', time: 'sunset', angle: 'low', chars: [{ id: 'aiko', expr: 'surprised', pose: 'reach', framing: 'back', x: 0.3 }], extras: ['glow', 'sparkles', 'petals'] },
          lines: [
            { kind: 'caption', text: 'La Corona. Un atardecer pintado que nunca termina. Jardines que flotan como nubes.' },
            { who: 'kai', kind: 'dialogue', text: 'Cuando la diseñaron, este cielo era para todos. Lo pintó un chico del Borde.' },
          ],
        },
      ],
    },
    {
      objective: 'Contrastar la Corona con el Borde y sembrar el riesgo de ser descubiertos.',
      summary: 'Recorren las terrazas de cristal. Ligeros elegantes flotan entre fuentes. Una guardia nota el andar pesado de Teo. Kai encuentra una terminal de acceso y se conecta.',
      tone: 'Belleza incómoda, tensión creciente.',
      composition: 'Mixed-5: plano general lujoso, detalles de contraste, y la conexión de Kai como cierre de página.',
      layout: { template: 'mixed-5' },
      panels: [
        {
          shot: { bg: 'garden', time: 'sunset', angle: 'high', chars: [{ id: 'aiko', expr: 'serious', pose: 'stand', framing: 'full', x: 0.4, scale: 0.7 }, { id: 'teo', expr: 'neutral', pose: 'stand', framing: 'full', x: 0.55, scale: 0.7 }], extras: ['glow', 'petals', 'sparkles'] },
          lines: [{ kind: 'caption', text: 'Terrazas de la Corona. Acá el agua cae hacia arriba, porque se puede.' }],
        },
        {
          shot: { bg: 'garden', time: 'sunset', angle: 'normal', chars: [{ id: 'teo', expr: 'angry', framing: 'bust', x: 0.5 }], extras: ['petals'] },
          lines: [{ who: 'teo', kind: 'whisper', text: 'Con lo que gastan en esta fuente, el Borde tiene aire un año.' }],
        },
        {
          shot: { bg: 'garden', time: 'sunset', angle: 'normal', chars: [{ id: 'aiko', expr: 'tired', framing: 'bust', x: 0.5 }], extras: ['sweat'] },
          lines: [{ who: 'aiko', kind: 'thought', text: 'Me duelen las piernas de no pesar. El cuerpo no sabe qué hacer con tanta libertad.' }],
        },
        {
          shot: { bg: 'city-day', time: 'sunset', angle: 'normal', prop: 'badge', extras: ['glow'] },
          lines: [{ kind: 'caption', text: 'Una guardia del Núcleo mira demasiado tiempo los pies de Teo.' }],
        },
        {
          shot: { bg: 'office', time: 'sunset', angle: 'normal', chars: [{ id: 'kai', expr: 'serious', pose: 'reach', framing: 'half', x: 0.5 }], extras: ['electric', 'glow'], prop: 'cable' },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Terminal del Núcleo. Entro. Busco el destino de la energía robada.' }],
          sfx: [{ text: 'bip-bip-TZZK', size: 'small', color: '#36e6ff' }],
        },
      ],
    },
    {
      objective: 'Gran revelación: el Protocolo Desprendimiento y el rostro del antagonista.',
      summary: 'En la terminal se abre un holograma del Halo: el Borde entero se separa y cae hacia Vesta Gris. Firma: Director Caelum Hartwell. Fecha: en tres días.',
      tone: 'Horror frío, revelación épica.',
      composition: 'Splash: el holograma del anillo partido domina la página; Hartwell en silueta frente a él, a contraluz.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'control-room', time: 'night', angle: 'low', chars: [{ id: 'hartwell', expr: 'serious', pose: 'stand', framing: 'silhouette', x: 0.5, scale: 1.1 }], extras: ['glow', 'energy', 'stars'], prop: 'blueprint' },
          lines: [
            { kind: 'caption', text: 'PROTOCOLO DESPRENDIMIENTO. Separación total del Borde exterior. Ejecución: 72 horas.' },
            { kind: 'caption', text: 'Población del Borde: 41.000. Población de la Corona: 15.000. Autoriza: Director C. Hartwell.' },
            { who: 'kai', kind: 'whisper', text: 'No están arreglando el mundo. Lo están cortando a la mitad.' },
          ],
          sfx: [{ text: 'VWOOOMMM', size: 'medium', color: '#4fcfc0' }],
        },
      ],
      notes: 'El holograma ocupa dos tercios de la página: anillo cian, la franja exterior en rojo escarlata desprendiéndose.',
    },
    {
      objective: 'Dar al antagonista una lógica creíble.',
      summary: 'A través del enlace de Kai, escuchan a Hartwell frente al Consejo: si el anillo colapsa mueren todos; si sueltan el Borde, la Corona vive cien años más. Nadie del Consejo es del Borde.',
      tone: 'Escalofriante por lo razonable.',
      composition: 'Hero-top: Hartwell en una gran viñeta de autoridad, abajo los rostros de los que escuchan.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'control-room', time: 'sunset', angle: 'low', chars: [{ id: 'hartwell', expr: 'sad', pose: 'stand', framing: 'half', x: 0.5, scale: 1.1 }], extras: ['glow', 'sparkles'] },
          lines: [
            { who: 'hartwell', kind: 'dialogue', text: 'El Halo pierde el eje. Si nada cambia, caemos todos. Cincuenta y seis mil almas.' },
            { who: 'hartwell', kind: 'dialogue', text: 'Si soltamos el Borde, el centro gira liviano cien años más. Un jardinero poda para salvar el árbol.' },
          ],
        },
        {
          shot: { bg: 'office', time: 'sunset', angle: 'normal', chars: [{ id: 'aiko', expr: 'shocked', framing: 'face', x: 0.5 }], extras: ['shadow-face'] },
          lines: [{ who: 'aiko', kind: 'whisper', text: 'Poda. Nos llama ramas.' }],
        },
        {
          shot: { bg: 'office', time: 'sunset', angle: 'normal', chars: [{ id: 'kai', expr: 'angry', framing: 'face', x: 0.5 }], extras: ['electric'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Miente por omisión: el eje se tuerce porque él roba la energía. La cuenta la falsea él.' }],
        },
        {
          shot: { bg: 'office', time: 'sunset', angle: 'normal', chars: [{ id: 'teo', expr: 'scared', framing: 'bust', x: 0.5 }], prop: 'badge' },
          lines: [{ who: 'teo', kind: 'whisper', text: 'Chicos... la guardia de los pies viene para acá. Con amigos.' }],
        },
      ],
    },
    {
      objective: 'Acción: la emboscada y el sacrificio de Teo.',
      summary: 'Lysandra irrumpe con la Guardia. Persecución por los pasillos en baja gravedad. Teo se lanza contra los guardias para que Aiko y Kai escapen, y es capturado.',
      tone: 'Adrenalina y corazón.',
      composition: 'Tres franjas de acción encadenadas, con líneas de velocidad y una última franja de despedida.',
      layout: { template: 'three-rows' },
      panels: [
        {
          shot: { bg: 'corridor', time: 'sunset', angle: 'low', chars: [{ id: 'lysandra', expr: 'serious', pose: 'point', framing: 'full', x: 0.7, flip: true }], extras: ['glow', 'electric'] },
          lines: [{ who: 'lysandra', kind: 'shout', text: '¡Guardia! ¡Contengan al androide! ¡A la chica, viva!' }],
          sfx: [{ text: 'BLAM BLAM', size: 'medium', color: '#d8b03a' }],
        },
        {
          shot: { bg: 'corridor', time: 'sunset', angle: 'dutch', chars: [{ id: 'aiko', expr: 'determined', pose: 'run', framing: 'full', x: 0.35 }, { id: 'kai', expr: 'serious', pose: 'fly', framing: 'full', x: 0.6 }], extras: ['energy', 'wind'] },
          lines: [{ who: 'aiko', kind: 'shout', text: '¡Empujate de las paredes! ¡Acá arriba volamos más rápido que ellos corren!' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'corridor', time: 'sunset', angle: 'normal', chars: [{ id: 'teo', expr: 'grin', pose: 'punch', framing: 'half', x: 0.5 }], extras: ['blood-free-impact', 'dust'] },
          lines: [
            { who: 'teo', kind: 'shout', text: '¡Andá, Chispa! ¡Cien kilos de Borde en caída libre, muchachos!' },
            { who: 'aiko', kind: 'shout', text: '¡TEO! ¡No!' },
          ],
          sfx: [{ text: 'WHAMM', size: 'big', color: '#ff9a1f', rotate: 12 }],
        },
      ],
    },
    {
      objective: 'Cliffhanger de mitad: Kai es capturado y Aiko queda sola.',
      summary: 'En el radio, un campo eléctrico atrapa a Kai. Él empuja a Aiko hacia el ascensor que cae al Borde. Antes de que se cierren las puertas, Hartwell aparece detrás de Kai.',
      tone: 'Desgarro y desesperación.',
      composition: 'Plano ancho de la trampa, dos primeros planos enfrentados, y un plano ancho final con las puertas cerrándose.',
      layout: { boxes: WIDE_DUO_4 },
      panels: [
        {
          shot: { bg: 'corridor', time: 'night', angle: 'high', chars: [{ id: 'kai', expr: 'pain', pose: 'fall', framing: 'full', x: 0.5 }], extras: ['electric', 'energy', 'glow'] },
          lines: [{ kind: 'caption', text: 'Red de contención. Diseñada hace doce años para una sola cosa: Custodios.' }],
          sfx: [{ text: 'BZZZZZRAK', size: 'big', color: '#4fcfc0', rotate: -8 }],
          fx: 'focuslines',
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'determined', pose: 'punch', framing: 'bust', x: 0.5 }], extras: ['electric'] },
          lines: [{ who: 'kai', kind: 'shout', text: '¡Corré, Aiko! ¡Recordá el eje!' }],
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'crying', pose: 'reach', framing: 'bust', x: 0.5 }], extras: ['tears', 'glow'] },
          lines: [{ who: 'aiko', kind: 'shout', text: '¡No! ¡Kai, dame la mano!' }],
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'low', chars: [{ id: 'kai', expr: 'sad', pose: 'kneel', framing: 'half', x: 0.35 }, { id: 'hartwell', expr: 'smirk', pose: 'stand', framing: 'half', x: 0.72, flip: true }], extras: ['glow', 'shadow-face'], prop: 'door' },
          lines: [{ who: 'hartwell', kind: 'dialogue', text: 'Hola otra vez, K-1. Me costó mucho olvidarte. No me obligues a hacerlo de nuevo.' }],
          sfx: [{ text: 'KSHUNK', size: 'medium', color: '#ffffff' }],
        },
      ],
    },
    {
      objective: 'Cuarto giro: Lysandra cambia de bando.',
      summary: 'Aiko, rota, vuelve al hangar del Borde. Lysandra la espera adentro, sin guardia. Confiesa que apagó a Kai y que vio morir a Mireya. Le entrega su insignia: la llave de acceso al eje.',
      tone: 'Confesión, redención, tensión emocional.',
      composition: 'Hero-mid: la insignia en manos de Aiko como viñeta central; las dos mujeres enfrentadas alrededor.',
      layout: { template: 'hero-mid' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'high', chars: [{ id: 'aiko', expr: 'sad', pose: 'sit', framing: 'full', x: 0.3, scale: 0.8 }], extras: ['smoke'] },
          lines: [{ kind: 'caption', text: 'Hangar del gremio, Borde. Sin Teo. Sin Kai. Con el mundo temblando cada hora.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'lysandra', expr: 'tired', pose: 'stand', framing: 'half', x: 0.5 }], extras: ['shadow-face'] },
          lines: [{ who: 'lysandra', kind: 'dialogue', text: 'Yo lo apagué. Y vi a tu madre sostenerle la mano hasta que la sala se quedó sin aire.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', prop: 'badge', extras: ['glow', 'sparkles'] },
          lines: [
            { who: 'lysandra', kind: 'dialogue', text: 'Mi insignia abre la Cámara del Eje. Doce años la usé para cerrar puertas.' },
            { who: 'lysandra', kind: 'dialogue', text: 'Esta noche abre una.' },
          ],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'angry', framing: 'face', x: 0.5 }], extras: ['tears'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: '¿Por qué ahora? ¿Por qué tendría que confiar en usted?' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'lysandra', expr: 'sad', framing: 'face', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'lysandra', kind: 'dialogue', text: 'Porque yo también nací a 1,4 g, Vance. Me costó veinte años volver a sentir el peso.' }],
        },
      ],
    },
    // ───────────────────────── CLÍMAX ─────────────────────────
    {
      objective: 'Detonar el clímax: los estabilizadores colapsan antes de tiempo.',
      summary: 'Un temblor enorme. Hartwell, al intentar extraer el núcleo de Kai, desata el colapso. Los estabilizadores fallan uno a uno; el Borde se tiñe de rojo; pánico en el mercado.',
      tone: 'Catástrofe.',
      composition: 'Three-mixed: viñeta grande del anillo convulsionando, dos planos de pánico y alarma.',
      layout: { template: 'three-mixed' },
      panels: [
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'dutch', extras: ['explosion', 'electric', 'smoke', 'stars'] },
          lines: [{ kind: 'narration', text: 'Estabilizador cuatro: falla. Siete: falla. Nueve: falla. El mundo empieza a cabecear como un trompo herido.' }],
          sfx: [{ text: 'BWOOOOOOM', size: 'big', color: '#ff3b3b', rotate: -12 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'market', time: 'night', angle: 'dutch', extras: ['smoke', 'dust', 'explosion'], prop: 'lamp' },
          lines: [{ kind: 'caption', text: 'En el Mercado de la Tuerca, la gravedad sube a 2 g. La gente cae de rodillas.' }],
          sfx: [{ text: 'KRRRAAASH', size: 'medium', color: '#ff7a1a' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', chars: [{ id: 'hartwell', expr: 'shocked', pose: 'guard', framing: 'bust', x: 0.5 }], extras: ['electric', 'glow'] },
          lines: [{ who: 'hartwell', kind: 'shout', text: '¡Inicien el Desprendimiento ya! ¡Suelten el Borde antes de que nos arrastre!' }],
          sfx: [{ text: 'UUUIIIN', size: 'small', color: '#ff3b3b' }],
        },
      ],
    },
    {
      objective: 'Preparación del héroe: Aiko se equipa, reúne a sus aliados y despega.',
      summary: 'Aiko se pone el casco. Odile llega con la llave de afinación de Mireya. Teo, liberado por Lysandra, habla por radio desde los radios. La cápsula "Alondra" enciende motores.',
      tone: 'Épico, emocionante, de equipo.',
      composition: 'Mixed-5: montaje de preparación clásico del anime, detalles de equipo y rostros, cierre con motores.',
      layout: { template: 'mixed-5' },
      panels: [
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'determined', pose: 'hold', framing: 'half', x: 0.5 }], extras: ['glow', 'smoke'], prop: 'helmet' },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Alondra, despertate. Hoy volamos hacia arriba.' }],
          sfx: [{ text: 'klik-KSHH', size: 'small', color: '#ffffff' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'normal', chars: [{ id: 'odile', expr: 'serious', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['glow'], prop: 'key' },
          lines: [{ who: 'odile', kind: 'dialogue', text: 'La llave de afinación de tu madre. La guardé doce años esperando una mano que la merezca.' }],
        },
        {
          shot: { bg: 'corridor', time: 'night', angle: 'normal', chars: [{ id: 'teo', expr: 'grin', pose: 'fist', framing: 'bust', x: 0.5 }], extras: ['electric'] },
          lines: [{ who: 'teo', kind: 'dialogue', text: '¡Chispa! La Comandante me sacó. Estoy con el gremio abriendo los refugios. ¡Volá tranquila!' }],
          sfx: [{ text: 'krrtch', size: 'small', color: '#f5d45c' }],
        },
        {
          shot: { bg: 'cockpit', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'grin', framing: 'face', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Tarado. Te debo una sopa.' }],
        },
        {
          shot: { bg: 'hangar', time: 'night', angle: 'low', extras: ['energy', 'glow', 'smoke'], prop: 'glider' },
          lines: [{ kind: 'caption', text: 'Cápsula de mantenimiento "Alondra". Sin armas. Sin permiso. Con todo el Borde adentro.' }],
          sfx: [{ text: 'VRRRRRRMMM', size: 'big', color: '#ff7a1a', rotate: -5 }],
        },
      ],
    },
    {
      objective: 'Completar el arco de Lysandra: libera a Kai y enfrenta a Hartwell.',
      summary: 'En la Cámara del Eje, Lysandra desactiva la red que retiene a Kai. Hartwell le apunta con la voz: "Vas a matarnos a todos". Ella responde que van a pagar la deuda.',
      tone: 'Duelo moral.',
      composition: 'Cine en tres franjas: plano ancho de la liberación, viñeta central alta del enfrentamiento, cierre corto.',
      layout: { boxes: CINE_3 },
      panels: [
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', chars: [{ id: 'lysandra', expr: 'determined', pose: 'reach', framing: 'half', x: 0.35 }, { id: 'kai', expr: 'tired', pose: 'kneel', framing: 'half', x: 0.7, flip: true }], extras: ['electric', 'glow'] },
          lines: [{ who: 'lysandra', kind: 'dialogue', text: 'Te apagué una vez, K-1. Hoy te devuelvo lo que te saqué.' }],
          sfx: [{ text: 'TZZK-CLANK', size: 'medium', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'dutch', chars: [{ id: 'hartwell', expr: 'furious', pose: 'point', framing: 'half', x: 0.3 }, { id: 'lysandra', expr: 'serious', pose: 'guard', framing: 'half', x: 0.72, flip: true }], extras: ['electric', 'glow', 'smoke'] },
          lines: [
            { who: 'hartwell', kind: 'dialogue', text: 'Lysandra. Vas a matarnos a todos por una deuda sentimental.' },
            { who: 'lysandra', kind: 'dialogue', text: 'No, Director. Vamos a pagarla. Toda. Con intereses de peso.' },
          ],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'low', chars: [{ id: 'kai', expr: 'determined', pose: 'stand', framing: 'bust', x: 0.5 }], extras: ['energy', 'glow'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Aiko. Te escucho venir. Seguí mi pulso.' }],
        },
      ],
    },
    {
      objective: 'Lanzar el vuelo final: Aiko sale al espacio en plena tormenta de escombros.',
      summary: 'La Alondra sale del hangar. Afuera, el anillo se resquebraja: placas, vigas y paneles giran en una tormenta de escombros. El eje brilla lejos, en el centro.',
      tone: 'Vértigo épico.',
      composition: 'Two-rows panorámico: arriba la salida, abajo el panorama del caos con el eje como meta.',
      layout: { template: 'two-rows' },
      panels: [
        {
          shot: { bg: 'space', time: 'night', angle: 'low', chars: [{ id: 'aiko', expr: 'determined', pose: 'fly', framing: 'full', x: 0.4, scale: 0.8 }], extras: ['stars', 'energy', 'smoke'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Alondra fuera del casco. Rumbo al eje. Kai, te escucho latir.' }],
          sfx: [{ text: 'FWOOOSH', size: 'big', color: '#ff7a1a', rotate: -15 }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'high', extras: ['explosion', 'dust', 'stars', 'glow'] },
          lines: [{ kind: 'caption', text: 'Veinte kilómetros de escombros girando. En el centro, el eje: una estrella pequeña que se apaga.' }],
          sfx: [{ text: 'KRAKOOM', size: 'medium', color: '#ffd166' }],
        },
      ],
    },
    {
      objective: 'Escena estrella de acción: Aiko atraviesa la tormenta.',
      summary: 'Aiko esquiva vigas y placas a máxima velocidad, el brazo mecánico brillando en sincronía con el pulso de Kai que la guía.',
      tone: 'Euforia, peligro, belleza.',
      composition: 'Splash de acción: la Alondra en diagonal, escombros en primer plano, estela escarlata, líneas de velocidad.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'space', time: 'night', angle: 'dutch', chars: [{ id: 'aiko', expr: 'determined', pose: 'fly', framing: 'full', x: 0.5, scale: 1.25 }], extras: ['energy', 'glow', 'stars', 'explosion', 'electric', 'sparkles'] },
          lines: [
            { who: 'aiko', kind: 'shout', text: '¡Toda mi vida cargué este mundo a 1,4 g! ¡No me lo van a soltar ahora!' },
            { kind: 'caption', text: 'El brazo de Sei late con el pulso de Kai. Izquierda. Abajo. Ahora.' },
          ],
          sfx: [{ text: 'VRRRAAAMMM', size: 'big', color: '#e8304a', rotate: -18 }, { text: 'BWOOM', size: 'medium', color: '#ffd166', rotate: 10 }],
          fx: 'speedlines',
        },
      ],
      notes: 'Imagen de marketing de acción. Estela roja de la Alondra contra el cian del eje al fondo.',
    },
    {
      objective: 'Planteo del sacrificio: Kai debe convertirse en el estabilizador.',
      summary: 'Kai explica que la única forma de reafinar los doce estabilizadores a la vez es fundir su conciencia con el eje. Necesita que alguien del Borde le sostenga la mano desde afuera, como Mireya.',
      tone: 'Ternura antes del adiós.',
      composition: 'Hero-top: Kai frente al núcleo del eje en gran viñeta; abajo, el diálogo por radio en planos íntimos.',
      layout: { template: 'hero-top' },
      panels: [
        {
          shot: { bg: 'control-room', time: 'night', angle: 'low', chars: [{ id: 'kai', expr: 'serious', pose: 'reach', framing: 'full', x: 0.5 }], extras: ['energy', 'glow', 'electric', 'sparkles'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Los doce estabilizadores necesitan un solo pulso. Puedo serlo. Pero no voy a volver a ser esto.' }],
          sfx: [{ text: 'VMMMMM', size: 'medium', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'cockpit', time: 'night', angle: 'normal', chars: [{ id: 'aiko', expr: 'crying', framing: 'face', x: 0.5 }], extras: ['tears', 'glow'] },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'No. Ni lo pienses. Te acabo de encontrar.' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'happy', framing: 'face', x: 0.5 }], extras: ['glow', 'sparkles'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Necesito que me sostengas la mano. Con la de Sei. Como tu mamá. Así no me pierdo.' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', chars: [{ id: 'lysandra', expr: 'sad', framing: 'bust', x: 0.35 }, { id: 'hartwell', expr: 'shocked', framing: 'bust', x: 0.72, flip: true }], extras: ['glow'] },
          lines: [{ who: 'hartwell', kind: 'whisper', text: 'Una máquina eligiendo morir por los que yo iba a soltar...' }],
        },
      ],
    },
    {
      objective: 'Clímax emocional: la fusión de Kai con el eje y la definición de persona.',
      summary: 'Aiko acopla la Alondra al eje y conecta su brazo. Desde adentro, Kai le toma la mano mecánica. Su cuerpo se deshace en luz cian que corre por todo el anillo.',
      tone: 'Sacrificio luminoso, belleza y duelo.',
      composition: 'Letterbox: plano ancho del acople, manos y rostros en dos viñetas, plano ancho final con Kai disolviéndose en luz.',
      layout: { boxes: LETTERBOX_4 },
      panels: [
        {
          shot: { bg: 'orbital-ring', time: 'night', angle: 'normal', extras: ['glow', 'energy', 'stars'], prop: 'cable' },
          lines: [{ who: 'aiko', kind: 'dialogue', text: 'Acoplada al eje. Brazo conectado. Estoy acá, Kai. Estoy acá.' }],
          sfx: [{ text: 'KA-CHUNK', size: 'medium', color: '#ffffff' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', prop: 'hand', extras: ['energy', 'sparkles', 'glow'] },
          lines: [{ kind: 'caption', text: 'Una mano de polímero y una de metal. Las dos fabricadas. Las dos eligiendo.' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'normal', chars: [{ id: 'kai', expr: 'happy', framing: 'face', x: 0.5 }], extras: ['energy', 'sparkles', 'tears'] },
          lines: [{ who: 'kai', kind: 'dialogue', text: 'Me preguntaba qué me hacía una persona. Ya sé: elijo quedarme. Con vos. Con todos.' }],
        },
        {
          shot: { bg: 'control-room', time: 'night', angle: 'low', chars: [{ id: 'kai', expr: 'happy', pose: 'reach', framing: 'silhouette', x: 0.5, scale: 1.1 }], extras: ['energy', 'glow', 'sparkles', 'electric'] },
          lines: [
            { who: 'aiko', kind: 'shout', text: '¡KAI!' },
            { kind: 'narration', text: 'La luz corre por los doce estabilizadores como sangre nueva. Y el mundo, por fin, deja de temblar.' },
          ],
          sfx: [{ text: 'VWOOOOOOMMMM', size: 'big', color: '#9ff3ff', rotate: -4 }],
          fx: 'focuslines',
        },
      ],
    },
    // ───────────────────────── CIERRE ─────────────────────────
    {
      objective: 'Catarsis visual: el Halo se estabiliza y todas las luces se encienden por igual.',
      summary: 'El anillo vuelve a girar parejo. Por primera vez en una generación, las luces del Borde y de la Corona brillan con la misma intensidad. Amanece sobre Vesta Gris.',
      tone: 'Catarsis, esperanza.',
      composition: 'Splash que rima con la página 1: el mismo anillo, ahora entero y uniforme, con el amanecer del planeta.',
      layout: { template: 'splash' },
      panels: [
        {
          shot: { bg: 'orbital-ring', time: 'sunset', angle: 'low', extras: ['glow', 'sparkles', 'stars'] },
          lines: [
            { kind: 'narration', text: 'Rotación: mil milésimos de lo nominal. Exacta. Como la diseñaron.' },
            { kind: 'narration', text: 'Esa mañana, por primera vez en sesenta años, el Borde y la Corona pesaron igual de luz.' },
          ],
          sfx: [{ text: 'mmmmmmm...', size: 'small', color: '#9ff3ff' }],
        },
      ],
      notes: 'Rima visual con p. 1: mismo encuadre, pero el anillo uniforme en dorado y cian, sin franja roja.',
    },
    {
      objective: 'Cierre emotivo y gran gancho para el volumen 2.',
      summary: 'Hartwell es arrestado por Lysandra. En la azotea, Aiko, Teo y Odile miran el anillo. El brazo de Aiko brilla: la voz de Kai habla desde el Halo. Le revela que no son los primeros. En la oscuridad, un segundo anillo enciende sus luces.',
      tone: 'Melancolía cálida y asombro inquietante.',
      composition: 'Cinco cajas: consecuencias en franjas cortas, el momento íntimo y, al pie, un gran plano final del segundo anillo.',
      layout: { boxes: FINALE_5 },
      panels: [
        {
          shot: { bg: 'control-room', time: 'day', angle: 'normal', chars: [{ id: 'lysandra', expr: 'serious', pose: 'stand', framing: 'half', x: 0.65, flip: true }, { id: 'hartwell', expr: 'tired', pose: 'stand', framing: 'half', x: 0.3 }] },
          lines: [
            { who: 'lysandra', kind: 'dialogue', text: 'Caelum Hartwell, queda detenido. Va a esperar juicio en el Borde. A 1,4 g.' },
            { who: 'hartwell', kind: 'dialogue', text: 'La cuenta daba, Lysandra. Daba.' },
          ],
        },
        {
          shot: { bg: 'rooftop', time: 'sunset', angle: 'normal', chars: [{ id: 'teo', expr: 'happy', pose: 'sit', framing: 'half', x: 0.35 }, { id: 'odile', expr: 'smirk', pose: 'sit', framing: 'half', x: 0.7, flip: true }], extras: ['glow'], prop: 'cup' },
          lines: [{ who: 'teo', kind: 'dialogue', text: 'Te debo una sopa, dijiste. Traje dos. Una es para el robotito, por las dudas.' }],
        },
        {
          shot: { bg: 'rooftop', time: 'sunset', angle: 'normal', chars: [{ id: 'aiko', expr: 'sad', pose: 'sit', framing: 'bust', x: 0.5 }], extras: ['glow', 'sparkles'], prop: 'ring' },
          lines: [{ who: 'aiko', kind: 'thought', text: 'Colgué un anillo de tuerca nuevo. Pero no se siente como perderlo.' }],
        },
        {
          shot: { bg: 'rooftop', time: 'night', angle: 'normal', prop: 'hand', extras: ['glow', 'energy', 'sparkles'] },
          lines: [
            { who: 'kai', kind: 'whisper', text: 'Aiko. Desde acá arriba veo todo el giro. Y veo algo más.' },
            { who: 'kai', kind: 'whisper', text: 'El Halo no es el primero. Y no estamos solos.' },
          ],
          sfx: [{ text: 'vuuun', size: 'small', color: '#36e6ff' }],
        },
        {
          shot: { bg: 'space', time: 'night', angle: 'low', extras: ['stars', 'glow', 'energy'], prop: 'moon' },
          lines: [
            { kind: 'narration', text: 'En la sombra de Vesta Gris, donde nadie miró en sesenta años, otro anillo enciende sus luces.' },
            { kind: 'narration', text: 'Rojas. Una por una. Respondiendo.' },
            { kind: 'caption', text: 'ÓRBITA ESCARLATA · FIN DEL VOLUMEN 1' },
          ],
          sfx: [{ text: 'BWOOM... BWOOM... BWOOM...', size: 'medium', color: '#e8304a' }],
        },
      ],
      notes: 'Última viñeta casi negra: el segundo anillo apenas insinuado por puntos rojos que se encienden en arco. Cerrar con silencio.',
    },
  ],
}
