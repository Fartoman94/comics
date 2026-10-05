import type { Layout, Line, WorkDef } from '../types'

/*
 * MUESTRA 3 — MANGA SEINEN / THRILLER PSICOLÓGICO
 * "El inquilino del 7B" — lectura de derecha a izquierda (las cajas propias se ordenan de derecha a izquierda).
 */

// --- Atajos de texto -------------------------------------------------------------------------
const cap = (text: string): Line => ({ kind: 'caption', text })
const nota = (text: string): Line => ({ kind: 'narration', text })
const say = (who: string, text: string): Line => ({ who, kind: 'dialogue', text })
const low = (who: string, text: string): Line => ({ who, kind: 'whisper', text })

// --- Distribuciones propias (normalizadas 0..1, margen ~0.02) --------------------------------
/** Cuatro franjas horizontales: silencio, respiración lenta. */
const STRIPS4: Layout = { boxes: [[0.02, 0.02, 0.96, 0.22], [0.02, 0.26, 0.96, 0.22], [0.02, 0.5, 0.96, 0.22], [0.02, 0.74, 0.96, 0.24]] }
/** Cinco franjas finas: el tiempo que no pasa. */
const STRIPS5: Layout = { boxes: [[0.02, 0.02, 0.96, 0.176], [0.02, 0.216, 0.96, 0.176], [0.02, 0.412, 0.96, 0.176], [0.02, 0.608, 0.96, 0.176], [0.02, 0.804, 0.96, 0.176]] }
/** Plano ancho arriba y tres rendijas verticales abajo (miradas), de derecha a izquierda. */
const SLIVERS: Layout = { boxes: [[0.02, 0.02, 0.96, 0.4], [0.68, 0.44, 0.3, 0.54], [0.35, 0.44, 0.31, 0.54], [0.02, 0.44, 0.31, 0.54]] }
/** Columna alta a la derecha (primera lectura) y tres viñetas apiladas a la izquierda. */
const TALL_RIGHT: Layout = { boxes: [[0.56, 0.02, 0.42, 0.96], [0.02, 0.02, 0.52, 0.31], [0.02, 0.35, 0.52, 0.31], [0.02, 0.68, 0.52, 0.3]] }
/** Franja fina, gran plano central y franja fina: la revelación encerrada entre silencios. */
const SANDWICH: Layout = { boxes: [[0.02, 0.02, 0.96, 0.14], [0.02, 0.18, 0.96, 0.64], [0.02, 0.84, 0.96, 0.14]] }
/** Dos rendijas arriba (mirada y objeto) y plano grande abajo. */
const GLANCE_TOP: Layout = { boxes: [[0.51, 0.02, 0.47, 0.3], [0.02, 0.02, 0.47, 0.3], [0.02, 0.34, 0.96, 0.64]] }

export const work: WorkDef = {
  id: 'inquilino',
  title: 'EL INQUILINO DEL 7B',
  subtitle: 'Volumen 1 — La letra de la noche',
  genre: 'Seinen · thriller psicológico · misterio urbano',
  style: 'seinen',
  kind: 'manga',
  formatId: 'manga-b5',
  readingDirection: 'rtl',
  tone: 'Opresivo, silencioso y reflexivo. Lluvia constante, pasillos estrechos, insomnio. El miedo no viene de los golpes sino de lo que se sabe y no se dice. La culpa como clima.',
  audience: 'Lectores adultos (16+) de thriller psicológico y novela negra; quienes disfrutan del suspenso lento, los dilemas morales y los finales que dejan una grieta abierta.',
  logline: 'Un traductor insomne que vive en el departamento de su hermana muerta empieza a recibir notas escritas con su propia letra que anuncian, con un día de anticipación, las desgracias del edificio. Cada vez que intenta evitarlas, algo se cobra el precio.',
  synopsis:
    'Ciudad de Varela, noviembre. Llueve hace semanas. Julián Ferro, 38 años, traductor freelance de contratos, se mudó hace seis meses al 7B del edificio Arcadia, el departamento donde vivía su hermana Clara hasta que cayó desde la terraza. La policía dijo suicidio. Él no duerme desde entonces. Una madrugada, una nota se desliza bajo su puerta: está fechada al día siguiente, anuncia que la vecina del 5C va a caer por la escalera a las 7:40, y está escrita con su letra.\n\n' +
    'La predicción se cumple. Llega otra, y otra: el ascensor, el chico del 3C, una pérdida de gas en el 6A. Julián interviene, salva vidas, pero cada intervención lo vuelve más sospechoso ante los vecinos y la policía, y más cercano a la amabilidad envolvente de Óscar Medina, el administrador que siempre llega primero. Con Inés Barros, una periodista cansada que investiga edificios viejos que se vacían a fuerza de accidentes, Julián descubre que el Arcadia pertenece a un fideicomiso extranjero: Halden. El mismo nombre que aparece en los contratos que él traduce de madrugada.\n\n' +
    'La verdad no es sobrenatural, y por eso es peor: Julián camina dormido. En las noches de insomnio tradujo un anexo con un cronograma de "desocupación" del edificio, unidad por unidad, fecha por fecha. Su conciencia no lo registró; su inconsciente sí, y lo reconoció junto con una imagen enterrada: la noche en que murió Clara, Julián se cruzó en la escalera con Óscar subiendo hacia la terraza. La última fecha del cronograma es la del 7B.\n\n' +
    'Julián se ofrece como cebo, Óscar cae y el volumen parece cerrarse. Hasta que, la primera noche que Julián duerme de verdad —con una cámara que prueba que no se levantó de la cama—, otra nota aparece bajo la puerta. Su letra. La fecha de mañana. Y una frase: "Esta no la escribiste vos."',
  visualProposal:
    'Blanco y negro seinen de línea fina y nerviosa, con tramas densas (screentone) para la noche y degradados (gradient-tone) para la memoria y el sueño. La lluvia es un personaje: casi todas las escenas exteriores la llevan. Encuadres de mirilla, de rendija de puerta, de rellano visto desde arriba (picado) para transmitir encierro. Los rostros se cortan a la altura de los ojos; las sombras tapan medio rostro cuando alguien miente. Páginas de franjas horizontales finas para el insomnio y el tiempo que no pasa, grillas de nueve para la espera, splash solo para las tres revelaciones. Casi sin onomatopeyas: tic, drip, toc, el roce del papel. Mucho texto de narración interior en cajas rectangulares, frases cortas y cortantes.',
  world: {
    setting: 'Varela, una gran ciudad portuaria del sur, ficticia, con barrios de edificios de los años cuarenta y cincuenta que se caen a pedazos mientras fondos de inversión los compran en silencio. El centro del relato es el edificio Arcadia, en el pasaje Ulloa 1450: ocho pisos, un ascensor de reja, una escalera caracol iluminada a medias y una terraza con ropa tendida que nadie levanta.',
    rules: [
      'No hay nada sobrenatural: todo lo extraño tiene una explicación humana, aunque la explicación sea más perturbadora que un fantasma.',
      'Julián no recuerda lo que hace dormido; solo lo descubre por rastros: tinta en los dedos, pies sucios, archivos abiertos, testigos.',
      'Cada intervención tiene un costo visible: sospecha, aislamiento, una relación rota o una mentira que hay que sostener.',
      'El administrador tiene llave de todas las puertas; el edificio es suyo de hecho aunque no de papel.',
      'La lluvia no para en todo el volumen salvo en una única viñeta, después del clímax.',
    ],
    era: 'Presente, un noviembre lluvioso. Celulares, mails y cámaras baratas, pero edificios, ascensores y cañerías de hace setenta años.',
    aesthetic: 'Realismo urbano oscuro: azulejos partidos, cables a la vista, ventanas con persianas a medio bajar, faroles amarillos difuminados por la lluvia, humo de cigarrillo en bares de barrio, papeles por todas partes.',
    places: [
      { name: 'Departamento 7B', description: 'El de Clara. Julián no cambió nada: sus plantas secas, sus libros, su foto en la terraza. Escritorio con laptop, pilas de contratos, un reloj de pared que suena demasiado fuerte. La puerta tiene una rendija de dos dedos por donde pasan las notas.' },
      { name: 'Escalera del Arcadia', description: 'Caracol, de mármol gastado, con una lamparita que se apaga a los treinta segundos. El escalón del quinto piso está flojo desde hace años. Desde arriba, los rellanos parecen un ojo.' },
      { name: 'Departamento 4A', description: 'De doña Amalia. Huele a naftalina y a té. Una silla está pegada a la puerta, frente a la mirilla, gastada por años de vigilancia.' },
      { name: 'La terraza', description: 'Tanques de agua, sogas de ropa, una baranda baja. Desde allí cayó Clara. Se ve toda la ciudad mojada.' },
      { name: 'Bar El Faro', description: 'Bar de esquina con fórmica verde, televisor sin volumen y ventanales empañados. Donde Inés escribe y Julián miente un poco menos.' },
      { name: 'Redacción de La Hoja de Varela', description: 'Una redacción que se achicó a la mitad: escritorios vacíos, cajas de archivo, monitores viejos. Inés trabaja de noche porque de día no hay silencio.' },
    ],
    conflicts: [
      'Julián contra sí mismo: no sabe si es el profeta, el autor o el culpable.',
      'Intervenir o no intervenir: cada salvamento lo expone y cada omisión lo convierte en cómplice.',
      'Un fideicomiso anónimo que necesita el edificio vacío y un administrador que hace el trabajo sucio con una sonrisa.',
      'La culpa por la muerte de Clara, que Julián convirtió en silencio para no recordar lo que vio.',
    ],
    culture: [
      'Vecinos que se conocen de toda la vida y no se hablan; todo se sabe por la mirilla.',
      'Desconfianza hacia la policía y resignación ante los "accidentes" de los edificios viejos.',
      'El mate, el café de bar y el cigarrillo como rituales de espera.',
      'Una ciudad que vende sus edificios de a uno, sin hacer ruido.',
    ],
  },
  structure: {
    inicio: 'Páginas 1–7. Primera nota, primera caída. Julián decide intervenir en la segunda (el ascensor) y salva al chico del 3C a costa de volverse sospechoso. Óscar aparece siempre primero, siempre amable.',
    desarrollo: 'Páginas 8–20. Alianza tensa con Inés. Pistas: el vocabulario de traductor en las notas, doña Amalia que lo ve bajar descalzo, la pérdida de gas, el nombre Halden. Julián encuentra el Anexo C y entiende que las notas son una agenda que él mismo tradujo. La cámara lo muestra caminando dormido; el dibujo de Tomi muestra que Óscar lo vio.',
    climax: 'Páginas 21–27. Recuerdo reprimido de la noche de Clara. Julián se ofrece como cebo en la fecha del 7B. Óscar entra con su llave, confiesa a medias, intenta repetir la "caída". Amalia abre su puerta, Inés llega con la grabación.',
    cierre: 'Páginas 28–32. Óscar detenido, la lluvia para una sola viñeta, Julián escucha por fin el último mensaje de Clara y duerme. A la mañana, otra nota con su letra. La cámara prueba que él no se levantó. "Esta no la escribiste vos."',
    giros: [
      'Las notas no predicen el futuro: son el cronograma de un plan, traducido por Julián dormido (p. 15).',
      'El fideicomiso dueño del edificio, Halden, es el cliente de los contratos que traduce (p. 14).',
      'Óscar sabe que Julián camina dormido: el dibujo de Tomi lo muestra mirándolo en la escalera (p. 18–19).',
      'Julián estuvo en la escalera la noche que murió Clara y vio a Óscar subir; lo enterró por culpa (p. 21).',
      'La nota final llega una noche en que la cámara demuestra que Julián no se movió de la cama (p. 31–32).',
    ],
    cliffhangers: [
      'p. 1: la nota con su propia letra.',
      'p. 5: segunda nota — "No lo dejes subir."',
      'p. 14: "Halden." El nombre de su cliente.',
      'p. 16: la última línea del cronograma: U-7B, 19-11.',
      'p. 23: una llave gira en la cerradura.',
      'p. 32: "Esta no la escribiste vos."',
    ],
    escenasClave: [
      'La espera frente al reloj hasta las 7:40 y el golpe en la escalera.',
      'Julián deteniendo al chico frente al ascensor y la mirada de la madre.',
      'Doña Amalia: "Usted baja de noche. Descalzo."',
      'La comparación entre el Anexo C y las tres notas, sobre el escritorio, bajo la lámpara.',
      'El video: Julián dormido escribiendo con los ojos abiertos.',
      'El recuerdo en degradé: Clara en la puerta, Óscar en la escalera con la llave.',
      'La noche del 19: la llave en la cerradura y la voz amable en la oscuridad.',
      'La única viñeta sin lluvia.',
      'La nota final y la cámara que no miente.',
    ],
    ritmo: 'Lento y creciente. Páginas de franjas y grillas de nueve para estirar el tiempo (insomnio, espera), alternadas con páginas de tres filas para el diálogo y splash reservados a las revelaciones. Cada página termina con una imagen o frase que empuja a dar vuelta la hoja. Casi sin acción física hasta el clímax, donde la violencia es breve, torpe y silenciosa.',
  },
  characters: [
    {
      id: 'julian',
      name: 'Julián Ferro',
      age: '38 años',
      role: 'protagonista',
      personality: 'Metódico, irónico en voz baja, observador hasta la obsesión. Piensa en dos idiomas y desconfía de las palabras porque sabe cuánto se pierde al traducirlas. Educado, distante, incapaz de pedir ayuda.',
      goal: 'Entender quién escribe las notas y evitar que se cumplan; en el fondo, dejar de sentirse culpable por Clara.',
      fear: 'Descubrir que la muerte de su hermana fue culpa suya, o peor: que él es capaz de cosas que no recuerda.',
      flaw: 'Se encierra. Prefiere sostener una mentira prolija antes que mostrar una verdad desordenada. No duerme para no soñar.',
      arc: 'De espectador insomne que traduce la vida de otros a alguien que se pone en el centro, recuerda lo que vio y acepta que la verdad duele más que la culpa. Termina el volumen durmiendo por primera vez… y despertando a una duda nueva.',
      relations: 'Hermano menor de Clara (muerta). Desconfía y depende de Inés. Óscar lo trata como a un sobrino; doña Amalia lo vigila; Tomi es el único que le habla sin miedo.',
      physical: 'Alto, delgado, hombros caídos, ojeras profundas, barba de tres días. Manos largas con manchas de tinta en las yemas.',
      visualTraits: 'Pelo oscuro despeinado que nunca termina de secarse, bufanda gris de Clara siempre puesta, mirada de costado. En casi todas las viñetas nocturnas, medio rostro en sombra.',
      outfit: 'Sobretodo gris carbón gastado, camisa sin planchar, bufanda gris. Adentro, buzo viejo y medias.',
      expressions: 'Cansado, serio, pensativo. La sorpresa se le ve solo en los ojos. Casi nunca sonríe; cuando lo hace, parece una disculpa.',
      speech: 'Frases cortas, precisas, con alguna palabra técnica o en inglés que se le escapa. Narración interior en presente, seca, con ironía amarga.',
      rig: { gender: 'm', age: 'adult', build: 'slim', skin: '#d8b896', hair: { style: 'messy', color: '#2a2521' }, eyes: { color: '#4a3b30' }, outfit: { kind: 'coat', main: '#3a3d42', accent: '#8b9096' }, accessory: 'scarf', mark: 'stubble' },
    },
    {
      id: 'ines',
      name: 'Inés Barros',
      age: '44 años',
      role: 'aliado',
      personality: 'Lúcida, áspera, cansada pero tenaz. Fuma de más, duerme de menos. Cree en los documentos, no en las corazonadas. Tiene un humor seco que usa como escudo.',
      goal: 'Probar que los "accidentes" en los edificios viejos de Varela son un negocio, y publicarlo antes de que cierren el diario.',
      fear: 'Volver a equivocarse: una nota suya mal chequeada arruinó a un inocente hace años.',
      flaw: 'Usa a la gente como fuente; a veces olvida que son personas.',
      arc: 'De escéptica que ve en Julián un caso clínico a aliada que arriesga su nombre por él. Aprende a creer en algo que no está en un papel.',
      relations: 'Escribió sobre la muerte de Clara una nota breve que nunca la convenció. Con Julián, una complicidad tensa, sin romance. Detesta a Óscar desde el primer saludo.',
      physical: 'Estatura media, hombros tensos, arrugas finas en los ojos, pelo corto con canas que no tiñe.',
      visualTraits: 'Anteojos de marco grueso que se acomoda cuando piensa, morral cruzado lleno de carpetas, un cigarrillo siempre a medio terminar.',
      outfit: 'Campera de cuero marrón gastada sobre camisa clara, jeans, borcegos.',
      expressions: 'Seria, irónica, cansada. Cuando algo la impresiona se queda completamente quieta.',
      speech: 'Directa, rioplatense, con preguntas cortas de entrevistadora: "¿Y?", "¿Quién firma?", "Mostrame."',
      rig: { gender: 'f', age: 'adult', build: 'average', skin: '#c79e7c', hair: { style: 'bob', color: '#4a423d' }, eyes: { color: '#2f2924' }, outfit: { kind: 'jacket', main: '#5a4636', accent: '#cdbfa6' }, accessory: 'satchel', mark: 'glasses' },
    },
    {
      id: 'oscar',
      name: 'Óscar Medina',
      age: '61 años',
      role: 'antagonista',
      personality: 'Cordial, servicial, paternal. Recuerda los cumpleaños de todos y trae sopa a los enfermos. Su amabilidad es una herramienta: entra en todas las casas porque nadie le cierra la puerta. Frío como un contador cuando nadie lo ve.',
      goal: 'Vaciar el Arcadia para el fideicomiso Halden y cobrar su parte antes de jubilarse. Que todo parezca mala suerte de edificio viejo.',
      fear: 'Perder el control y la imagen del vecino bueno; ser visto.',
      flaw: 'Subestima a los que considera débiles: viejas, chicos, insomnes.',
      arc: 'De presencia protectora a amenaza revelada. Cae, pero su última frase siembra la duda: él no estaba solo.',
      relations: 'Administra el Arcadia hace veinte años. Trata a Julián con un cariño que incomoda. Clara le hizo dos denuncias que nunca prosperaron.',
      physical: 'Corpulento, espalda ancha, manos grandes y limpias, panza contenida por un chaleco tejido.',
      visualTraits: 'Pelo gris peinado hacia atrás con gel, barba blanca recortada, llavero enorme colgado del cinturón que suena al caminar. Sonrisa que no llega a los ojos.',
      outfit: 'Pulóver o chaleco tejido marrón sobre camisa blanca abotonada hasta arriba, pantalón de vestir, zapatos lustrados aunque llueva.',
      expressions: 'Sonrisa amable casi siempre; en primer plano de ojos, una calma vacía. Nunca grita.',
      speech: 'Tono bajo, usted respetuoso, diminutivos ("un cafecito", "la escalerita"), frases de sentido común que suenan razonables hasta que no.',
      rig: { gender: 'm', age: 'adult', build: 'strong', skin: '#dfc0a2', hair: { style: 'slick', color: '#9b9791' }, eyes: { color: '#6a6d70' }, outfit: { kind: 'sweater', main: '#6c5845', accent: '#ece6da' }, mark: 'beard' },
    },
    {
      id: 'amalia',
      name: 'Amalia Rus',
      age: '83 años',
      role: 'mentor',
      personality: 'Viuda, ex costurera, lúcida y desconfiada. Pasa las noches en una silla frente a la mirilla. Dice verdades incómodas como quien comenta el clima.',
      goal: 'Morir en su casa, no en un geriátrico; que nadie la saque del Arcadia.',
      fear: 'Que nadie le crea porque es vieja.',
      flaw: 'Habla en acertijos y guarda lo que sabe como quien guarda botones.',
      arc: 'De testigo silenciosa a testigo que abre la puerta en el momento justo.',
      relations: 'Conoció a Clara; le tejía bufandas (la de Julián es suya). Sabe que Óscar sube a la terraza de noche. Ve a Julián bajar dormido.',
      physical: 'Pequeña, encorvada, manos nudosas, piel muy fina.',
      visualTraits: 'Rodete blanco, bata verde oscuro, collar de perlas falsas, ojo agrandado por la mirilla en las viñetas de vigilancia.',
      outfit: 'Bata de casa verde con ribete ocre sobre camisón, pantuflas, collar de perlas.',
      expressions: 'Neutral, pícara, a veces triste. Nunca asustada frente a Julián; sí frente a Óscar.',
      speech: 'Lenta, frases de otra época, "usted", refranes torcidos y silencios largos.',
      rig: { gender: 'f', age: 'old', build: 'small', skin: '#e9cfb8', hair: { style: 'bun', color: '#dcd8d2' }, eyes: { color: '#7a8a8e' }, outfit: { kind: 'robe', main: '#465749', accent: '#b8996f' }, accessory: 'necklace' },
    },
    {
      id: 'tomi',
      name: 'Tomás "Tomi" Lugones',
      age: '9 años',
      role: 'secundario',
      personality: 'Callado, curioso, dibuja todo lo que ve. Ve el edificio como un mapa de secretos. No tiene miedo de Julián porque "los que no duermen son como los búhos".',
      goal: 'Que alguien mire sus dibujos de verdad.',
      fear: 'El ascensor (con razón) y que su mamá se mude otra vez.',
      flaw: 'Se escapa de noche a la escalera a dibujar.',
      arc: 'De testigo invisible a pieza clave: su cuaderno guarda la prueba de que Óscar sabía.',
      relations: 'Vive en el 3C con su madre, enfermera de noche. Julián le salva la vida sin que él lo sepa del todo. Le tiene miedo a Óscar sin poder explicar por qué.',
      physical: 'Flaquito, chico para su edad, rodillas raspadas.',
      visualTraits: 'Buzo rojo con capucha (la única mancha "clara" en la paleta oscura), pecas, cuaderno de tapas duras bajo el brazo.',
      outfit: 'Buzo rojo gastado, jogging, zapatillas con los cordones desatados.',
      expressions: 'Serio, curioso, asustado. Cuando sonríe, todo el panel se aliviana.',
      speech: 'Frases simples, preguntas directas que desarman a los adultos.',
      rig: { gender: 'm', age: 'young', build: 'small', skin: '#c99e7a', hair: { style: 'short', color: '#3a2a20' }, eyes: { color: '#3a2a20' }, outfit: { kind: 'hoodie', main: '#a33d33', accent: '#eadbb8' }, mark: 'freckles' },
    },
    {
      id: 'clara',
      name: 'Clara Ferro',
      age: '41 años (murió hace seis meses)',
      role: 'secundario',
      personality: 'Luminosa y terca. Bibliotecaria, militante de las causas chicas: el portero eléctrico, la humedad, el derecho de los viejos a quedarse. Reía fuerte, discutía más fuerte.',
      goal: 'Que no vaciaran el Arcadia. Denunció a Óscar dos veces.',
      fear: 'Que su hermano se quedara solo.',
      flaw: 'No sabía cuándo retirarse de una pelea.',
      arc: 'Presente solo en fotos, recuerdos en degradé y un mensaje de voz sin escuchar. Su verdad organiza el volumen: no se tiró.',
      relations: 'Hermana mayor de Julián. La noche que murió, discutieron en la puerta del 7B. Era amiga de doña Amalia; Tomi la dibujaba.',
      physical: 'Delgada, más baja que Julián, pelo largo ondulado.',
      visualTraits: 'Siempre en tramas suaves (gradient-tone) para marcar memoria. Sweater claro, sonrisa ancha en la foto de la terraza.',
      outfit: 'Sweater de lana color avena, pollera larga, borcegos.',
      expressions: 'Feliz en la foto; enojada y triste en el recuerdo de la discusión.',
      speech: 'Rápida, apasionada, le decía "Juli" a su hermano.',
      rig: { gender: 'f', age: 'adult', build: 'slim', skin: '#ddb894', hair: { style: 'long-wavy', color: '#4a3528' }, eyes: { color: '#4a3b30' }, outfit: { kind: 'sweater', main: '#cbb79a', accent: '#6e5a48' }, mark: 'mole' },
    },
  ],
  cover: {
    shot: { bg: 'stairwell', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'tired', pose: 'hold', framing: 'half', x: 0.5 }], extras: ['rain', 'shadow-face'], prop: 'note' },
    title: 'EL INQUILINO DEL 7B',
    subtitle: 'Vol. 1 — La letra de la noche',
    tagline: 'Las notas llegan de madrugada. La letra es suya.',
  },
  altCover: {
    shot: { bg: 'corridor', time: 'night', angle: 'dutch', chars: [{ id: 'oscar', expr: 'smirk', pose: 'stand', framing: 'silhouette', x: 0.7 }, { id: 'julian', expr: 'scared', pose: 'stand', framing: 'eyes', x: 0.25, flip: true }], extras: ['smoke'], prop: 'key' },
    title: 'EL INQUILINO DEL 7B',
    subtitle: 'Edición especial',
    tagline: 'Todos tienen llave. Nadie duerme.',
  },
  pages: [
    // ── 1 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Enganchar con la imagen central de la obra: una nota bajo la puerta, escrita con la letra del protagonista.',
      summary: 'Madrugada, lluvia. Julián, despierto, escucha el roce de un papel. Una nota entra por la rendija. Anuncia para mañana a las 7:40 la caída de la vecina del 5C. La letra es la suya.',
      tone: 'Inquietud helada, silencio absoluto.',
      composition: 'Cinco franjas finas: el tiempo se estira como en el insomnio. Del negro al objeto, del objeto a la mano, de la mano al texto, del texto a los ojos.',
      layout: STRIPS5,
      panels: [
        { shot: { bg: 'city-night', time: 'night', angle: 'high', extras: ['rain'] }, lines: [cap('Varela. 4:12 de la mañana.'), cap('Hace seis meses que no duermo.')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'door' }, sfx: [{ text: 'shff', size: 'small' }] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'note' }, lines: [cap('Alguien acaba de pasar un papel por debajo de mi puerta.')] },
        { shot: { bg: 'tone', time: 'night', prop: 'note' }, lines: [nota('"14-11 · 07:40. La mujer del 5C cae en la escalera. Vas a escuchar el golpe desde la cama."')], fx: 'screentone' },
        { shot: { bg: 'black', time: 'night', chars: [{ id: 'julian', expr: 'shocked', framing: 'eyes', x: 0.5 }], extras: ['shadow-face'] }, lines: [cap('La fecha es de mañana.'), cap('Y la letra es mía.')] },
      ],
      notes: 'Sin onomatopeyas fuertes: solo el roce del papel. La viñeta final es la imagen de marca de la obra.',
    },
    // ── 2 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Presentar a Julián, el departamento de Clara y la herida de la obra.',
      summary: 'Julián abre la puerta: pasillo vacío. Vuelve a la mesa, escribe la misma frase a mano y compara: idéntica. La cámara recorre el 7B: plantas secas, la foto de Clara en la terraza. Narración sobre su muerte y su insomnio.',
      tone: 'Melancolía seca, extrañeza.',
      composition: 'Clásica de seis: ritmo de inventario, como quien recorre una casa que no es suya.',
      layout: { template: 'classic-6' },
      panels: [
        { shot: { bg: 'corridor', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'tired', pose: 'stand', framing: 'back', x: 0.5 }] }, lines: [cap('Nadie en el pasillo. La luz automática ni siquiera se encendió.')] },
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'julian', expr: 'thinking', pose: 'sit', framing: 'half', x: 0.6 }], prop: 'lamp' }, lines: [cap('Escribo la misma frase. Despacio. Como una prueba de caligrafía.')] },
        { shot: { bg: 'tone', time: 'night', prop: 'note' }, lines: [cap('La "M" partida. La "a" abierta. El punto que se me corre a la derecha.'), cap('Idénticas.')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'night', prop: 'photo' }, lines: [cap('Este departamento era de Clara. Mi hermana.')], fx: 'gradient-tone' },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [{ id: 'clara', expr: 'happy', pose: 'wave', framing: 'bust', x: 0.5 }] }, lines: [cap('Cayó desde la terraza en mayo. La policía dijo que se tiró.'), cap('Yo dije que sí, que podía ser.')], fx: 'gradient-tone' },
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'julian', expr: 'tired', pose: 'sit', framing: 'silhouette', x: 0.5 }], extras: ['rain'] }, lines: [cap('Me quedé con su contrato, sus plantas y su insomnio.')] },
      ],
    },
    // ── 3 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Cumplir la primera predicción en tiempo real y plantar la primera pista (la tinta en los dedos).',
      summary: 'Mañana. Julián no fue a trabajar: espera sentado frente al reloj. Ve tinta seca en las yemas de sus dedos y no se acuerda de haber escrito. 7:39. 7:40. Un golpe sordo en la escalera.',
      tone: 'Espera insoportable, fatalidad.',
      composition: 'Grilla de nueve: cada viñeta es un segundo. El golpe llega en la última casilla, sin sonido grande, solo un "toc" seco.',
      layout: { template: 'grid-9' },
      panels: [
        { shot: { bg: 'apartment', time: 'day', prop: 'clock' }, lines: [cap('07:31.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'serious', pose: 'sit', framing: 'face', x: 0.5 }] }, lines: [cap('Podría ser una broma.')] },
        { shot: { bg: 'apartment', time: 'day', prop: 'hand' }, lines: [cap('Tengo tinta en los dedos.')] },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'thinking', framing: 'eyes', x: 0.5 }] }, lines: [cap('Anoche no escribí nada a mano. Estoy casi seguro.')] },
        { shot: { bg: 'apartment', time: 'day', prop: 'clock' }, lines: [cap('07:38.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'apartment', time: 'day', prop: 'door' }, lines: [cap('Podría salir. Podría bajar al quinto y tocarle el timbre.')] },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'scared', pose: 'sit', framing: 'bust', x: 0.5 }] }, lines: [cap('Y decirle qué. ¿Que mi letra la vio caerse?')] },
        { shot: { bg: 'apartment', time: 'day', prop: 'clock' }, lines: [cap('07:40.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'stairwell', time: 'day', angle: 'high' }, sfx: [{ text: 'toc', size: 'medium' }], fx: 'screentone' },
      ],
    },
    // ── 4 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Presentar a Óscar como el vecino perfecto y plantar la pista del Anexo C en la laptop.',
      summary: 'La señora Ledesma del 5C, en el piso de la escalera, con la pierna rota. Óscar ya está ahí, sosteniéndola, llamando a la ambulancia. Comenta lo del escalón flojo. Tomi mira desde arriba. De vuelta en el 7B, Julián ve en la laptop un archivo abierto a las 4:03: "Halden — Anexo C". No recuerda haberlo traducido.',
      tone: 'Amabilidad que incomoda; desconcierto.',
      composition: 'Héroe al medio: arriba el rellano, al centro el plano grande de Óscar socorriendo, abajo el detalle de la laptop como golpe final.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'stairwell', time: 'day', angle: 'high', chars: [{ id: 'julian', expr: 'shocked', pose: 'stand', framing: 'full', x: 0.5 }] }, lines: [cap('Bajé dos pisos sin sentir los escalones.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'tomi', expr: 'scared', pose: 'hold', framing: 'face', x: 0.5 }] } },
        { shot: { bg: 'stairwell', time: 'day', angle: 'low', chars: [{ id: 'oscar', expr: 'serious', pose: 'kneel', framing: 'half', x: 0.55 }, { id: 'julian', expr: 'tired', pose: 'stand', framing: 'back', x: 0.15 }] }, lines: [say('oscar', 'Tranquila, Normita, ya viene la ambulancia. No se mueva.'), say('oscar', 'Ese escalón… Hace meses que pido que lo arreglen.'), cap('Óscar Medina. El administrador. Siempre llega primero.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'oscar', expr: 'happy', pose: 'stand', framing: 'bust', x: 0.5 }] }, lines: [say('oscar', 'Qué suerte que usted estaba despierto, Julián. Usted siempre está despierto.')] },
        { shot: { bg: 'apartment', time: 'day', prop: 'lamp' }, lines: [cap('Arriba, la laptop sigue encendida. "Halden — Anexo C". Guardado a las 4:03.'), cap('No me acuerdo de haber llegado tan lejos.')], fx: 'screentone' },
      ],
    },
    // ── 5 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Instalar el insomnio como ritual de vigilancia y entregar la segunda nota.',
      summary: 'Esa noche Julián se sienta frente a la puerta para ver quién deja las notas. Café, lluvia, el reloj. Se le cierran los ojos "un minuto". Despierta a las 5:02: hay una nota nueva. "15-11. El ascensor. El chico del 3C. No lo dejes subir."',
      tone: 'Tensión lenta, agotamiento, golpe final.',
      composition: 'Grilla de nueve para la vigilia: la repetición de reloj, taza y puerta crea hipnosis; la ruptura es la nota en la última casilla.',
      layout: { template: 'grid-9' },
      panels: [
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'determined', pose: 'sit', framing: 'half', x: 0.5 }] }, lines: [cap('Esta noche voy a ver quién es.')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'cup' }, sfx: [{ text: 'drip', size: 'small' }] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'clock' }, lines: [cap('02:40.')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'door' } },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'tired', framing: 'eyes', x: 0.5 }] }, lines: [cap('El sueño no viene. Nunca viene cuando lo llamo.')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'clock' }, lines: [cap('03:51.')] },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'tired', pose: 'sit', framing: 'silhouette', x: 0.5 }] }, lines: [cap('Cierro los ojos. Un minuto.')], fx: 'gradient-tone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'clock' }, lines: [cap('05:02.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'tone', time: 'night', prop: 'note' }, lines: [nota('"15-11. El ascensor. El chico del 3C. No lo dejes subir."')], fx: 'screentone' },
      ],
    },
    // ── 6 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Primer dilema y primera intervención, con su costo.',
      summary: 'Mañana. Julián espera en el palier del tercero. Tomi sale con la mochila y va al ascensor. Julián le agarra el brazo, torpe. La madre lo ve y se lo arranca. Bajan por la escalera, ofendidos. El ascensor arranca vacío y cae dos pisos con un estruendo seco.',
      tone: 'Urgencia contenida, vergüenza, alivio amargo.',
      composition: 'Columna alta a la derecha con Julián esperando en la sombra; a la izquierda, tres tiempos: el gesto, la mirada de la madre, el ascensor que cae.',
      layout: TALL_RIGHT,
      panels: [
        { shot: { bg: 'stairwell', time: 'day', angle: 'low', chars: [{ id: 'julian', expr: 'serious', pose: 'stand', framing: 'full', x: 0.5 }], extras: ['shadow-face'] }, lines: [cap('Si no hago nada y pasa, soy cómplice.'), cap('Si hago algo y no pasa, soy un loco.')] },
        { shot: { bg: 'corridor', time: 'day', chars: [{ id: 'julian', expr: 'scared', pose: 'reach', framing: 'half', x: 0.65, flip: true }, { id: 'tomi', expr: 'surprised', pose: 'stand', framing: 'half', x: 0.3 }] }, lines: [say('julian', '¡Pará! Por la escalera. Hoy no.')] },
        { shot: { bg: 'corridor', time: 'day', chars: [{ id: 'tomi', expr: 'scared', pose: 'stand', framing: 'face', x: 0.5 }] }, lines: [cap('—¡Soltalo! ¿Qué le hacés a mi hijo?'), cap('La madre de Tomi me mira como se mira a un hombre que espera chicos en los pasillos.')] },
        { shot: { bg: 'stairwell', time: 'day', angle: 'high', prop: 'cable' }, lines: [cap('Bajaron por la escalera. Treinta segundos después, el ascensor cayó solo.')], sfx: [{ text: 'krr…', size: 'small' }], fx: 'screentone' },
      ],
    },
    // ── 7 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Mostrar que salvar tiene precio y sembrar la mirada de Óscar y de doña Amalia.',
      summary: 'Los vecinos en el palier. Óscar revisa la cabina caída: "Fatiga del cable, el técnico vino hace un mes". Mira a Julián un segundo de más. La madre de Tomi no le agradece. Desde el cuarto piso, un ojo en una mirilla.',
      tone: 'Sospecha, aislamiento.',
      composition: 'Plano ancho del palier y tres rendijas de miradas: Óscar, la madre (implícita) y la mirilla. El lector siente que todos miran a Julián.',
      layout: SLIVERS,
      panels: [
        { shot: { bg: 'stairwell', time: 'day', angle: 'high', chars: [{ id: 'oscar', expr: 'serious', pose: 'kneel', framing: 'full', x: 0.6 }, { id: 'julian', expr: 'tired', pose: 'stand', framing: 'full', x: 0.25 }] }, lines: [say('oscar', 'Fatiga del cable. El técnico vino hace un mes, ¿eh? Tengo la factura.'), cap('Nadie me agradece. Es justo: nadie sabe que hubo algo que agradecer.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'oscar', expr: 'neutral', framing: 'eyes', x: 0.5 }] }, lines: [say('oscar', 'Usted bajó temprano hoy, ¿no?')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'julian', expr: 'serious', framing: 'eyes', x: 0.5, flip: true }], extras: ['shadow-face'] }, lines: [say('julian', 'No dormía.')] },
        { shot: { bg: 'corridor', time: 'day', prop: 'eye' }, lines: [cap('En el cuarto piso, la mirilla del 4A se oscurece.')], fx: 'screentone' },
      ],
    },
    // ── 8 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Presentar a Inés Barros y abrir la línea investigativa.',
      summary: 'Bar El Faro, lluvia en los ventanales. Julián busca a Inés porque escribió una serie sobre "edificios que se vacían solos" y una nota breve sobre Clara. Ella llega tarde, fuma, desconfía. Él pone las dos notas sobre la mesa.',
      tone: 'Gris, cansado, humo y desconfianza.',
      composition: 'Tres filas: exterior, encuentro, objetos sobre la mesa. Composición sobria de diálogo.',
      layout: { template: 'three-rows' },
      panels: [
        { shot: { bg: 'rain-street', time: 'day', extras: ['rain'], prop: 'umbrella' }, lines: [cap('Inés Barros escribió once notas sobre edificios viejos que se vacían a fuerza de accidentes.'), cap('Y una, de doce líneas, sobre mi hermana.')] },
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'ines', expr: 'tired', pose: 'sit', framing: 'half', x: 0.65, flip: true }, { id: 'julian', expr: 'serious', pose: 'sit', framing: 'half', x: 0.3 }], extras: ['smoke'] }, lines: [say('ines', 'Tenés diez minutos. Si es otra teoría sobre el agua del puerto, me voy.'), say('julian', 'Es sobre mi edificio. El Arcadia.')] },
        { shot: { bg: 'bar', time: 'day', prop: 'note' }, lines: [say('julian', 'Llegaron por debajo de mi puerta. Las dos se cumplieron.')] },
      ],
    },
    // ── 9 ─────────────────────────────────────────────────────────────────────────
    {
      objective: 'Plantar la pista lingüística que apunta a Julián como autor.',
      summary: 'Inés lee. Nota la letra, la fecha en formato inverso, la palabra técnica. "Nadie escribe así. Vos sí: sos traductor." Julián lo admite: es su letra. Ella, contra su voluntad, acepta averiguar quién es el dueño del edificio.',
      tone: 'Interrogatorio tranquilo, incomodidad.',
      composition: 'Clásica de seis en plano–contraplano; la tensión está en los ojos y en los objetos.',
      layout: { template: 'classic-6' },
      panels: [
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'ines', expr: 'thinking', pose: 'hold', framing: 'bust', x: 0.5 }], extras: ['smoke'] }, lines: [say('ines', '"14-11". Año, mes, día al revés. Como en un contrato inglés.')] },
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'ines', expr: 'serious', framing: 'eyes', x: 0.5 }] }, lines: [say('ines', 'Nadie escribe las fechas así en Varela. Vos sí. Sos traductor.')] },
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'julian', expr: 'tired', framing: 'face', x: 0.5, flip: true }] }, lines: [say('julian', 'Es mi letra. Ya lo sé. No me acuerdo de haberlas escrito.')] },
        { shot: { bg: 'bar', time: 'day', prop: 'cup' }, lines: [cap('Silencio. El televisor sin volumen pasa el pronóstico: lluvia.')] },
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'ines', expr: 'tired', pose: 'arms-crossed', framing: 'half', x: 0.5 }], extras: ['smoke'] }, lines: [say('ines', 'No te creo nada. Pero en mis once edificios el administrador siempre llegaba primero.'), say('ines', 'Voy a ver quién firma la escritura del tuyo.')] },
        { shot: { bg: 'rain-street', time: 'day', chars: [{ id: 'julian', expr: 'thinking', pose: 'stand', framing: 'back', x: 0.5 }], extras: ['rain'] }, lines: [cap('"No te creo nada." Por primera vez en meses, alguien me dice la verdad.')] },
      ],
    },
    // ── 10 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Presentar a doña Amalia y plantar la pista central: Julián camina dormido.',
      summary: 'Julián toca el 4A. Doña Amalia lo hace pasar: silla frente a la mirilla, té frío. Le dice, como quien comenta el clima, que él baja de noche, descalzo, con los ojos abiertos. Él cree que lo confunde. Ella agrega que Óscar sube a la terraza los martes.',
      tone: 'Extrañeza doméstica, revelación susurrada.',
      composition: 'Dos filas: arriba el interior asfixiante con la silla frente a la mirilla; abajo el primer plano de la vieja diciendo lo indecible.',
      layout: { template: 'two-rows' },
      panels: [
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'amalia', expr: 'neutral', pose: 'sit', framing: 'full', x: 0.6 }, { id: 'julian', expr: 'serious', pose: 'stand', framing: 'half', x: 0.25 }], prop: 'cup' }, lines: [say('amalia', 'Pase, Ferro. La bufanda que lleva se la tejí a su hermana.'), cap('Una silla pegada a la puerta. Gastada justo a la altura de la mirilla.')] },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'amalia', expr: 'serious', framing: 'face', x: 0.5 }], extras: ['shadow-face'] }, lines: [say('amalia', 'Usted baja de noche. Descalzo. Con los ojos abiertos, pero no mira.'), say('julian', 'Se confunde, señora. Yo no duermo.'), say('amalia', 'Ah, ¿no? Y el señor Medina no sube a la terraza los martes.')] },
      ],
    },
    // ── 11 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Profundizar la culpa de Julián: la última llamada de Clara.',
      summary: 'De noche, Julián mira la foto de Clara en la terraza. En el celular, la llamada perdida de ella a las 2:14 de la madrugada en que murió, y un mensaje de voz que nunca escuchó. Narración: aquella noche discutieron; él se fue; ella llamó; él no atendió.',
      tone: 'Duelo, culpa, recuerdo velado.',
      composition: 'Cuatro franjas de silencio con degradé: objeto, recuerdo, objeto, rostro. Sin diálogos, solo narración.',
      layout: STRIPS4,
      panels: [
        { shot: { bg: 'apartment', time: 'night', prop: 'photo' }, lines: [cap('En la foto, detrás de Clara, hay una figura borrosa junto a los tanques. Nunca la miré bien.')], fx: 'gradient-tone' },
        { shot: { bg: 'corridor', time: 'night', chars: [{ id: 'clara', expr: 'angry', pose: 'point', framing: 'half', x: 0.5 }] }, lines: [cap('Esa noche discutimos en esta misma puerta. Por plata. Por nada.')], fx: 'gradient-tone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'phone' }, lines: [cap('"Clara — llamada perdida — 02:14." "1 mensaje de voz."'), cap('Seis meses sin escucharlo.')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'sad', pose: 'cover-face', framing: 'bust', x: 0.5 }], extras: ['rain', 'shadow-face'] }, lines: [cap('Me fui por la escalera. No me acuerdo de nada más.'), cap('Eso me digo.')] },
      ],
    },
    // ── 12 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Tercera nota y segundo dilema, más grave: entrar en casa ajena.',
      summary: 'Julián se despierta en el suelo del pasillo con los pies sucios de polvo de yeso. Tiene la nota en la mano: "16-11. Gas. 6A. Antes de las 5." Son las 4:31. Sube. Huele a gas. Golpea. Nadie abre.',
      tone: 'Pánico silencioso, carrera contra el reloj.',
      composition: 'Vertical manga: cuatro bandas que suben como la escalera, cada una más apretada.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'corridor', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'scared', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('Me despierto en el piso del pasillo. Afuera de mi casa.'), cap('Tengo los pies blancos de polvo de yeso.')], fx: 'screentone' },
        { shot: { bg: 'tone', time: 'night', prop: 'note' }, lines: [nota('"16-11. Gas. 6A. Antes de las 5."'), cap('04:31.')] },
        { shot: { bg: 'stairwell', time: 'night', angle: 'low', chars: [{ id: 'julian', expr: 'determined', pose: 'run', framing: 'full', x: 0.5 }] }, lines: [cap('El señor Ibarra. Setenta y nueve años. Vive solo.')] },
        { shot: { bg: 'corridor', time: 'night', chars: [{ id: 'julian', expr: 'scared', pose: 'fist', framing: 'half', x: 0.5 }], prop: 'door', extras: ['smoke'] }, lines: [say('julian', '¡Señor Ibarra! ¡Abra!'), cap('Olor dulce, espeso. Nadie contesta.')], sfx: [{ text: 'toc toc', size: 'small' }] },
      ],
    },
    // ── 13 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Resolver el gas con costo: policía, preguntas, y la oferta envenenada de Óscar.',
      summary: 'Bomberos, ventanas abiertas. Ibarra se salva. Un policía pregunta cómo supo; Julián miente: lo olió. La llave del calefón estaba abierta a mano. Óscar, amable, le comenta que duerme poco y le ofrece venderle el 7B a "los dueños nuevos, que pagan muy bien".',
      tone: 'Alivio contaminado, amenaza velada.',
      composition: 'Clásica de seis: el ruido del rescate en las primeras, el susurro de Óscar en las últimas.',
      layout: { template: 'classic-6' },
      panels: [
        { shot: { bg: 'corridor', time: 'night', angle: 'high', extras: ['smoke'] }, lines: [cap('Bomberos. Ventanas abiertas a la lluvia. Ibarra respira.')] },
        { shot: { bg: 'corridor', time: 'night', chars: [{ id: 'julian', expr: 'tired', pose: 'stand', framing: 'bust', x: 0.5 }] }, lines: [cap('—¿Cómo supo, señor Ferro? ¿A las cuatro y media?'), say('julian', 'Lo olí. No duermo.')] },
        { shot: { bg: 'corridor', time: 'night', prop: 'hand' }, lines: [cap('—La llave del calefón estaba abierta a mano. Los viejos se olvidan.')] },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'oscar', expr: 'happy', pose: 'stand', framing: 'half', x: 0.6 }, { id: 'julian', expr: 'serious', pose: 'stand', framing: 'back', x: 0.2 }] }, lines: [say('oscar', 'Usted duerme poco, ¿no? Se le nota en la cara, querido.')] },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'oscar', expr: 'smirk', framing: 'face', x: 0.5 }], extras: ['shadow-face'] }, lines: [say('oscar', 'Los dueños nuevos pagan muy bien por el 7B. Piénselo. Ese departamento no le hace bien.')] },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'julian', expr: 'serious', framing: 'eyes', x: 0.5, flip: true }] }, lines: [cap('Tres desgracias en tres días. Y él ya sabe el precio de mi casa.')] },
      ],
    },
    // ── 14 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Primera gran revelación: Halden.',
      summary: 'Llamada de Inés desde la redacción. El Arcadia lo compró en 2024 un fideicomiso extranjero: Halden. Julián se queda helado. Halden es el cliente del estudio para el que traduce de madrugada.',
      tone: 'Vértigo frío.',
      composition: 'Franja–gran plano–franja: el teléfono, Julián en medio del departamento oscuro con la pantalla encendida, y la palabra sola.',
      layout: SANDWICH,
      panels: [
        { shot: { bg: 'office', time: 'night', chars: [{ id: 'ines', expr: 'serious', pose: 'hold', framing: 'face', x: 0.5 }], prop: 'phone' }, lines: [say('ines', 'El Arcadia no es de nadie de acá. Lo compró en 2024 un fideicomiso: Halden.')] },
        { shot: { bg: 'apartment', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'shocked', pose: 'hold', framing: 'full', x: 0.4 }], prop: 'lamp', extras: ['rain'] }, lines: [say('ines', '¿Julián? ¿Seguís ahí?'), cap('En mi pantalla, el mismo nombre. Mi cliente. Mis noches.')], fx: 'screentone' },
        { shot: { bg: 'black', time: 'night', prop: 'note' }, lines: [cap('Halden.')] },
      ],
    },
    // ── 15 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Segunda revelación: las notas son una agenda que él mismo tradujo.',
      summary: 'Julián abre el Anexo C: "Cronograma de desocupación — Inmueble Ulloa 1450". Una tabla: U-5C 14-11, ASC 15-11, U-6A 16-11, U-7B 19-11. Lo tradujo hace tres semanas, entre las 3 y las 5. Su firma de traductor al pie.',
      tone: 'Revelación seca, horror administrativo.',
      composition: 'Dos rendijas arriba (los ojos y la mano con las notas) y un plano grande del escritorio con documentos y notas alineados.',
      layout: GLANCE_TOP,
      panels: [
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'shocked', framing: 'eyes', x: 0.5 }] }, lines: [cap('"Anexo C. Cronograma de desocupación. Inmueble Ulloa 1450."')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'note' }, lines: [cap('Tres notas. Tres renglones.')] },
        { shot: { bg: 'room-dark', time: 'night', angle: 'high', prop: 'blueprint' }, lines: [nota('"U-5C — 14-11 · ASC — 15-11 · U-6A — 16-11 · U-7B — 19-11."'), cap('Traducido por Julián Ferro. Hace tres semanas, entre las 3 y las 5 de la mañana.'), cap('No era una profecía. Era una agenda.')], fx: 'screentone' },
      ],
    },
    // ── 16 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Página de silencio para que el lector procese y el protagonista se quiebre.',
      summary: 'Julián en el piso, en la oscuridad, con la espalda contra la puerta. Lluvia. Lee la última línea: U-7B, 19-11. Su casa. Dentro de tres días.',
      tone: 'Desolación, miedo puro.',
      composition: 'Splash casi mudo: figura pequeña en un departamento enorme y negro.',
      layout: { template: 'splash' },
      panels: [
        { shot: { bg: 'room-dark', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'scared', pose: 'sit', framing: 'full', x: 0.5, scale: 0.7 }], extras: ['rain', 'shadow-face'], prop: 'note' }, lines: [cap('La última línea no la escribí todavía.'), cap('U-7B. 19-11. Soy yo.')], sfx: [{ text: 'drip', size: 'small' }], fx: 'gradient-tone' },
      ],
    },
    // ── 17 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Confirmar el sonambulismo con una prueba objetiva (el video).',
      summary: 'Julián apoya el celular en la biblioteca y graba la noche. A la mañana mira el video: 3:27, él se levanta, se sienta al escritorio con los ojos abiertos, escribe, desliza la nota hacia afuera, abre la puerta y sale descalzo.',
      tone: 'Ver lo que uno no es; extrañamiento.',
      composition: 'Grilla de nueve como cuadros de un video de vigilancia: el mismo encuadre fijo, el tiempo marcado en cada viñeta.',
      layout: { template: 'grid-9' },
      panels: [
        { shot: { bg: 'apartment', time: 'night', prop: 'phone' }, lines: [cap('Esta noche, testigo.')] },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'tired', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('REC 01:10')], fx: 'screentone' },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'sit', framing: 'full', x: 0.5 }] }, lines: [cap('REC 03:27')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'sit', framing: 'half', x: 0.5 }], prop: 'lamp' }, lines: [cap('REC 03:29')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'julian', expr: 'neutral', framing: 'eyes', x: 0.5 }] }, lines: [cap('Los ojos abiertos. Nadie adentro.')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'night', prop: 'hand' }, lines: [cap('REC 03:41. Escribo sin mirar el papel.')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'door' }, lines: [cap('REC 03:44. La nota sale por la rendija. Hacia afuera.')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'stand', framing: 'back', x: 0.5 }] }, lines: [cap('REC 03:46. Abro la puerta. Salgo.')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'shocked', pose: 'cover-face', framing: 'bust', x: 0.5 }] }, lines: [cap('Me dejo cartas a mí mismo. Como quien avisa a un desconocido.')] },
      ],
    },
    // ── 18 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Usar a Tomi para revelar que Óscar ha visto a Julián sonámbulo.',
      summary: 'En la escalera, Tomi dibuja. Ya no le tiene miedo a Julián: "Vos me salvaste del ascensor, ¿no?" Le muestra el cuaderno: "el señor que camina dormido". En el dibujo, Julián descalzo en la escalera… y arriba, en el rellano, un hombre grande con un llavero, mirándolo.',
      tone: 'Ternura extraña que se vuelve escalofrío.',
      composition: 'Tres filas: el encuentro, el cuaderno, el detalle del dibujo que congela.',
      layout: { template: 'three-rows' },
      panels: [
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'tomi', expr: 'neutral', pose: 'sit', framing: 'half', x: 0.65, flip: true }, { id: 'julian', expr: 'tired', pose: 'sit', framing: 'half', x: 0.3 }] }, lines: [say('tomi', 'Vos me salvaste del ascensor, ¿no? Mamá dice que no, que fue suerte.'), say('julian', 'Tu mamá tiene razón. Fue suerte.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'tomi', expr: 'happy', pose: 'hold', framing: 'bust', x: 0.5 }], prop: 'photo' }, lines: [say('tomi', 'Te dibujé. "El señor que camina dormido". Sos como un búho.')] },
        { shot: { bg: 'tone', time: 'day', prop: 'key' }, lines: [cap('Yo, descalzo, en el tercer piso. Y arriba, en el rellano, un hombre grande con un llavero.'), cap('Mirándome.')], fx: 'screentone' },
      ],
    },
    // ── 19 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Elevar la amenaza: Óscar sabe, y Julián habló dormido.',
      summary: 'Tomi cuenta que el señor Óscar le habló a Julián en la escalera, y que Julián le contestó "en inglés, raro". Óscar aparece abajo con una bolsa de facturas, sonriente, y llama a Tomi. El chico obedece. Óscar mira hacia arriba.',
      tone: 'Amenaza doméstica, inocencia en peligro.',
      composition: 'Plano ancho del hueco de la escalera visto desde arriba y tres rendijas: Tomi, Óscar sonriendo abajo, los ojos de Julián.',
      layout: SLIVERS,
      panels: [
        { shot: { bg: 'stairwell', time: 'day', angle: 'high', chars: [{ id: 'oscar', expr: 'happy', pose: 'wave', framing: 'full', x: 0.5, scale: 0.6 }] }, lines: [say('oscar', '¡Tomasito! Traje facturas. Bajá, que tu mamá está de guardia.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'tomi', expr: 'scared', framing: 'face', x: 0.5 }] }, lines: [low('tomi', 'El señor Óscar te habló esa noche. Y vos le contestaste en inglés. Raro.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'oscar', expr: 'smirk', framing: 'eyes', x: 0.5 }], extras: ['shadow-face'] } },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'julian', expr: 'scared', framing: 'eyes', x: 0.5, flip: true }] }, lines: [cap('¿Qué le dije? ¿Qué palabras de su propio contrato le recité dormido?')] },
      ],
    },
    // ── 20 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Conectar el patrón con Clara y sembrar la duda final (alguien arriba de Óscar).',
      summary: 'Redacción de noche. Inés despliega papeles: seguros de vida sobre inquilinos con Halden como beneficiario, dos denuncias de Clara contra Óscar archivadas. Clara se negó a vender. "Tu hermana estaba en la lista." Inés agrega: Óscar no tiene espalda para esto; el beneficiario final de Halden está tachado.',
      tone: 'Investigación metódica, ira contenida.',
      composition: 'Clásica de seis: papeles, rostros, papeles. La información avanza como un expediente.',
      layout: { template: 'classic-6' },
      panels: [
        { shot: { bg: 'office', time: 'night', angle: 'high', chars: [{ id: 'ines', expr: 'serious', pose: 'hold', framing: 'half', x: 0.6 }, { id: 'julian', expr: 'tired', pose: 'stand', framing: 'half', x: 0.25 }], extras: ['smoke'] }, lines: [say('ines', 'Seguros de vida sobre inquilinos mayores. Beneficiario: Halden. Todos firmados por Medina como "garante".')] },
        { shot: { bg: 'office', time: 'night', prop: 'letter' }, lines: [say('ines', 'Y esto. Dos denuncias contra Medina. Firma: Clara Ferro. Archivadas.')] },
        { shot: { bg: 'office', time: 'night', chars: [{ id: 'julian', expr: 'shocked', framing: 'face', x: 0.5 }] }, lines: [cap('Clara me habló de esto. Yo le dije que estaba exagerando.')] },
        { shot: { bg: 'office', time: 'night', chars: [{ id: 'ines', expr: 'sad', framing: 'face', x: 0.5 }] }, lines: [say('ines', 'Tu hermana estaba en la lista, Julián. Se negó a vender.')] },
        { shot: { bg: 'office', time: 'night', chars: [{ id: 'julian', expr: 'angry', pose: 'fist', framing: 'bust', x: 0.5 }], extras: ['shadow-face'] }, lines: [say('julian', 'Clara no se tiró.')] },
        { shot: { bg: 'office', time: 'night', prop: 'blueprint' }, lines: [say('ines', 'Una cosa más. Medina no tiene espalda para esto. El beneficiario final de Halden está tachado.')], fx: 'screentone' },
      ],
    },
    // ── 21 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Revelar el recuerdo reprimido: Julián vio a Óscar subir la noche que murió Clara.',
      summary: 'Volviendo a pie bajo la lluvia, Julián sube la escalera del Arcadia y la lamparita se apaga. En la oscuridad, el recuerdo vuelve en degradé: la discusión con Clara, él bajando furioso, y en el quinto piso, cruzándose con Óscar que subía con el llavero en la mano. "Buenas noches, Julián." Lo enterró porque si se lo decía a alguien tendría que contar que la dejó sola.',
      tone: 'Memoria que quema, culpa desnuda.',
      composition: 'Héroe al medio: la escalera en tiempo presente arriba, el recuerdo grande al centro, y la cara de Julián entendiendo abajo.',
      layout: { template: 'hero-mid' },
      panels: [
        { shot: { bg: 'stairwell', time: 'night', angle: 'low', chars: [{ id: 'julian', expr: 'tired', pose: 'stand', framing: 'full', x: 0.5 }] }, lines: [cap('La lamparita se apaga a los treinta segundos. Siempre en el quinto.')] },
        { shot: { bg: 'black', time: 'night', prop: 'lamp' }, sfx: [{ text: 'clic', size: 'small' }] },
        { shot: { bg: 'stairwell', time: 'night', angle: 'dutch', chars: [{ id: 'oscar', expr: 'neutral', pose: 'stand', framing: 'half', x: 0.65 }, { id: 'julian', expr: 'angry', pose: 'stand', framing: 'back', x: 0.25 }], prop: 'key' }, lines: [cap('Mayo. 2:05 de la mañana. Yo bajaba furioso.'), say('oscar', 'Buenas noches, Julián.'), cap('Él subía. Con el llavero en la mano. Hacia la terraza.')], fx: 'gradient-tone' },
        { shot: { bg: 'corridor', time: 'night', chars: [{ id: 'clara', expr: 'crying', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['tears'] }, lines: [cap('Nueve minutos después, ella me llamó.')], fx: 'gradient-tone' },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'julian', expr: 'crying', framing: 'eyes', x: 0.5 }], extras: ['shadow-face', 'tears'] }, lines: [cap('Lo enterré. Para no tener que decir que la dejé sola.'), cap('Mi cabeza no. Mi cabeza lo traducía todas las noches.')] },
      ],
    },
    // ── 22 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Tomar la decisión moral central: ofrecerse como cebo.',
      summary: 'En el 7B, con Inés. Ella quiere publicar ya; Julián sabe que sin prueba Óscar se escapa. La policía no va a creer en "una agenda que escribí dormido". La fecha del 7B es mañana. Él se va a quedar, va a fingir dormir. Inés grabará desde el celular y avisará a un comisario que le debe un favor.',
      tone: 'Determinación temerosa, complicidad.',
      composition: 'Dos filas: la discusión en plano medio y el acuerdo en primer plano de manos y teléfono.',
      layout: { template: 'two-rows' },
      panels: [
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'ines', expr: 'angry', pose: 'point', framing: 'half', x: 0.65, flip: true }, { id: 'julian', expr: 'determined', pose: 'arms-crossed', framing: 'half', x: 0.3 }], extras: ['rain'] }, lines: [say('ines', 'Publico mañana y que lo agarren. ¡No te vas a quedar acá a esperarlo!'), say('julian', 'Sin prueba, Medina se va a su casa. Y vuelve.'), say('julian', '¿Qué le llevamos a un fiscal? ¿Una agenda que escribí dormido?')] },
        { shot: { bg: 'apartment', time: 'night', chars: [{ id: 'julian', expr: 'serious', framing: 'face', x: 0.6 }], prop: 'phone' }, lines: [say('julian', 'Mañana es 19. Yo duermo. Él viene. Vos grabás.'), say('ines', 'Sos un idiota, Ferro. Le aviso a Pereyra, de la comisaría 9. Me debe una.')] },
      ],
    },
    // ── 23 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'La espera más larga del volumen y la llegada del antagonista.',
      summary: 'Noche del 18 al 19. Julián en la cama, ojos cerrados, el celular grabando en la biblioteca. Inés en el pasillo del sexto, escondida. El reloj avanza. 3:40. Una llave gira en la cerradura.',
      tone: 'Suspenso máximo, silencio.',
      composition: 'Grilla de nueve: la vigilia fingida, casilla a casilla, hasta el detalle de la llave.',
      layout: { template: 'grid-9' },
      panels: [
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'tired', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('Fingir que se duerme es fácil. Lo hice toda mi vida.')], fx: 'screentone' },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'ines', expr: 'serious', pose: 'sit', framing: 'half', x: 0.5 }], prop: 'phone' } },
        { shot: { bg: 'bedroom', time: 'night', prop: 'clock' }, lines: [cap('01:15.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'scared', framing: 'eyes', x: 0.5 }] } },
        { shot: { bg: 'room-dark', time: 'night', extras: ['rain'] }, sfx: [{ text: 'drip', size: 'small' }] },
        { shot: { bg: 'bedroom', time: 'night', prop: 'clock' }, lines: [cap('03:40.')], sfx: [{ text: 'tic', size: 'small' }] },
        { shot: { bg: 'corridor', time: 'night', chars: [{ id: 'oscar', framing: 'silhouette', pose: 'stand', x: 0.5 }] } },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'scared', framing: 'eyes', x: 0.5 }], extras: ['shadow-face'] }, lines: [cap('No respires.')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'key' }, sfx: [{ text: 'clac', size: 'small' }], fx: 'screentone' },
      ],
    },
    // ── 24 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Revelar a Óscar en su verdadera forma, sin máscara.',
      summary: 'La puerta se abre. Óscar entra en medias, con los zapatos en la mano. Se sienta en la silla del escritorio, frente a la cama, y habla en voz baja como a un enfermo. Sabe que Julián está despierto.',
      tone: 'Terror tranquilo.',
      composition: 'Splash: la silueta de Óscar en el marco de la puerta, la luz del pasillo cortando el dormitorio en dos.',
      layout: { template: 'splash' },
      panels: [
        { shot: { bg: 'room-dark', time: 'night', angle: 'low', chars: [{ id: 'oscar', expr: 'smirk', pose: 'stand', framing: 'full', x: 0.5 }], extras: ['shadow-face'], prop: 'key' }, lines: [say('oscar', 'Despierto, Julián. Mejor. Los que caminan dormidos se caen solos, pero hacen ruido.'), cap('En medias. Los zapatos lustrados en una mano. El llavero en la otra, sin un solo sonido.')], fx: 'gradient-tone' },
      ],
    },
    // ── 25 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Confesión a medias: la banalidad del mal y la verdad de Clara.',
      summary: 'Óscar habla con lógica de administrador: los edificios se caen igual, él "apura lo inevitable", nadie sufre mucho. Julián le pregunta por Clara. Óscar no niega: "Ella tampoco quería firmar." Le explica que lo vio sonámbulo, que lo oyó recitar el anexo en inglés, y que el 7B estaba en la lista mucho antes de que él supiera leerla.',
      tone: 'Frialdad, náusea moral.',
      composition: 'Tres filas en plano–contraplano casi estático: lo terrible se dice sentado.',
      layout: { template: 'three-rows' },
      panels: [
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'oscar', expr: 'neutral', pose: 'sit', framing: 'half', x: 0.6 }, { id: 'julian', expr: 'scared', pose: 'sit', framing: 'half', x: 0.2, flip: true }] }, lines: [say('oscar', 'Estos edificios se caen igual, Julián. Yo apuro lo inevitable. Con cuidado. Nadie sufre mucho.')] },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'julian', expr: 'angry', framing: 'face', x: 0.5 }], extras: ['shadow-face'] }, lines: [say('julian', '¿Y Clara?'), say('oscar', 'Clara tampoco quería firmar. Era tan parecida a usted… Discutía con todo el mundo.')] },
        { shot: { bg: 'room-dark', time: 'night', chars: [{ id: 'oscar', expr: 'smirk', framing: 'eyes', x: 0.5 }] }, lines: [say('oscar', 'Una noche lo encontré en la escalera recitando mi anexo en inglés. Ahí supe que usted lo sabía.'), say('oscar', 'Aunque usted no lo supiera.')] },
      ],
    },
    // ── 26 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'El clímax físico: breve, torpe, silencioso.',
      summary: 'Óscar se levanta: "Vamos a la terraza, como su hermana." Lo agarra del brazo con fuerza de hombre grande. Forcejeo en el pasillo, hacia la escalera. Julián cae contra la baranda. Se abre una puerta abajo: doña Amalia, en bata, mirándolos. Óscar duda un segundo. Llega Inés con el celular en alto. Sirenas.',
      tone: 'Violencia sorda, alivio que llega de abajo.',
      composition: 'Vertical manga que desciende con la escalera; cada banda es un piso.',
      layout: { template: 'manga-vertical' },
      panels: [
        { shot: { bg: 'corridor', time: 'night', angle: 'dutch', chars: [{ id: 'oscar', expr: 'serious', pose: 'reach', framing: 'half', x: 0.6 }, { id: 'julian', expr: 'pain', pose: 'guard', framing: 'half', x: 0.3 }] }, lines: [say('oscar', 'Vamos a la terraza. Como su hermana. Va a ser muy rápido.')] },
        { shot: { bg: 'stairwell', time: 'night', angle: 'high', chars: [{ id: 'julian', expr: 'pain', pose: 'fall', framing: 'full', x: 0.5 }], prop: 'hand' }, lines: [cap('La baranda. El hueco. Siete pisos de oscuridad.')], sfx: [{ text: 'tunk', size: 'small' }], fx: 'screentone' },
        { shot: { bg: 'stairwell', time: 'night', chars: [{ id: 'amalia', expr: 'serious', pose: 'stand', framing: 'half', x: 0.5 }], prop: 'door' }, lines: [say('amalia', 'Buenas noches, señor Medina. A esta hora no sube nadie a la terraza. ¿No?')] },
        { shot: { bg: 'stairwell', time: 'night', angle: 'low', chars: [{ id: 'ines', expr: 'determined', pose: 'hold', framing: 'half', x: 0.6 }, { id: 'oscar', expr: 'shocked', pose: 'stand', framing: 'back', x: 0.25 }], prop: 'phone' }, lines: [say('ines', 'Sonreí, Medina. Está todo grabado. Pereyra ya sube.')], sfx: [{ text: 'uuu…', size: 'small' }] },
      ],
    },
    // ── 27 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Cerrar la línea del antagonista con una frase que siembra la duda.',
      summary: 'En la vereda, bajo la lluvia, Óscar esposado. Los vecinos en ventanas y balcones. Antes de subir al patrullero, Óscar mira a Julián con su calma de siempre: "Usted no sabe todo lo que escribe de noche, Ferro."',
      tone: 'Justicia sin alivio.',
      composition: 'Columna alta a la derecha con el patrullero y la lluvia; a la izquierda, vecinos, rostro de Óscar, rostro de Julián.',
      layout: TALL_RIGHT,
      panels: [
        { shot: { bg: 'rain-street', time: 'night', angle: 'high', chars: [{ id: 'oscar', expr: 'neutral', pose: 'stand', framing: 'full', x: 0.5 }], extras: ['rain'] }, lines: [cap('A las 4:20 de la mañana, el hombre que traía sopa a los enfermos sube esposado a un patrullero.')], fx: 'screentone' },
        { shot: { bg: 'city-night', time: 'night', extras: ['rain'], prop: 'lamp' }, lines: [cap('Todas las ventanas del Arcadia encendidas. Por primera vez, nadie mira por la mirilla.')] },
        { shot: { bg: 'rain-street', time: 'night', chars: [{ id: 'oscar', expr: 'smirk', framing: 'eyes', x: 0.5 }], extras: ['rain', 'shadow-face'] }, lines: [say('oscar', 'Usted no sabe todo lo que escribe de noche, Ferro.')] },
        { shot: { bg: 'rain-street', time: 'night', chars: [{ id: 'julian', expr: 'tired', framing: 'face', x: 0.5, flip: true }], extras: ['rain'] }, lines: [cap('No contesto. Por una vez, el que no sabe es él.')] },
      ],
    },
    // ── 28 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Cierre emocional: reparación con los vecinos y la única viñeta sin lluvia.',
      summary: 'Días después. La nota de Inés en tapa. La señora Ledesma vuelve con yeso; la madre de Tomi le dice "gracias" a Julián en el palier, seca. Tomi le regala el dibujo del búho. En la terraza, por primera vez en el volumen, no llueve.',
      tone: 'Alivio frágil, ternura austera.',
      composition: 'Clásica de seis como respiración normal del mundo, con la última viñeta abierta al cielo.',
      layout: { template: 'classic-6' },
      panels: [
        { shot: { bg: 'office', time: 'day', prop: 'letter' }, lines: [cap('"El administrador del fideicomiso: seis accidentes, una muerte." Firma: Inés Barros.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'julian', expr: 'neutral', pose: 'stand', framing: 'half', x: 0.5 }] }, lines: [cap('La madre de Tomi me dice "gracias" en el palier. Una sola palabra. Alcanza.')] },
        { shot: { bg: 'stairwell', time: 'day', chars: [{ id: 'tomi', expr: 'happy', pose: 'hold', framing: 'bust', x: 0.5 }] }, lines: [say('tomi', 'Para vos. Es un búho que ya duerme.')] },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'amalia', expr: 'happy', pose: 'sit', framing: 'bust', x: 0.5 }] }, lines: [say('amalia', 'Ahora sí puedo dormir yo, Ferro. Alguien más mira.')] },
        { shot: { bg: 'bar', time: 'day', chars: [{ id: 'ines', expr: 'smirk', pose: 'sit', framing: 'half', x: 0.5 }], extras: ['smoke'] }, lines: [say('ines', 'El beneficiario final sigue tachado. Halden tiene abogados en tres países.'), say('ines', 'Pero esta semana, ganamos. Dormí, Ferro.')] },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [{ id: 'julian', expr: 'sad', pose: 'stand', framing: 'back', x: 0.5 }] }, lines: [cap('En la terraza no llueve. Por primera vez en un mes.')], fx: 'gradient-tone' },
      ],
    },
    // ── 29 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Cerrar la herida de Clara: Julián escucha por fin el mensaje de voz.',
      summary: 'Julián, en la terraza, aprieta "reproducir". La voz de Clara, agitada, a las 2:14: no está enojada; le pide perdón, le dice que Medina subió, que tiene miedo, que lo quiere. Él llora en silencio. La ciudad se enciende abajo.',
      tone: 'Duelo liberado, catarsis contenida.',
      composition: 'Cuatro franjas: teléfono, recuerdo de Clara, rostro, ciudad. La voz como única banda sonora.',
      layout: STRIPS4,
      panels: [
        { shot: { bg: 'rooftop', time: 'sunset', prop: 'phone' }, lines: [cap('"1 mensaje de voz. 02:14."')] },
        { shot: { bg: 'rooftop', time: 'night', chars: [{ id: 'clara', expr: 'scared', pose: 'hold', framing: 'face', x: 0.5 }] }, lines: [nota('"Juli, perdoname lo de recién. Medina subió a la terraza y dice que quiere hablar. Tengo un poco de miedo."'), nota('"Te quiero, tonto. Llamame."')], fx: 'gradient-tone' },
        { shot: { bg: 'rooftop', time: 'sunset', chars: [{ id: 'julian', expr: 'crying', framing: 'eyes', x: 0.5 }], extras: ['tears'] }, lines: [cap('No estaba enojada. Nunca lo estuvo.')] },
        { shot: { bg: 'city-night', time: 'sunset', angle: 'high' }, lines: [cap('Esa noche, por primera vez en seis meses, me acuesto con sueño.')] },
      ],
    },
    // ── 30 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Calma engañosa antes del golpe final: Julián duerme y deja la cámara como garantía.',
      summary: 'Julián apoya el celular grabando, por costumbre, por miedo. Se acuesta. Duerme profundo. Pasan las horas en silencio. A la mañana, al pasar frente a la puerta, ve un papel doblado en el piso.',
      tone: 'Paz frágil que se resquebraja.',
      composition: 'Cinco franjas finas de sueño (degradé) que terminan en la nota en el piso: el mismo lenguaje de la página 1, cerrando el círculo.',
      layout: STRIPS5,
      panels: [
        { shot: { bg: 'apartment', time: 'night', prop: 'phone' }, lines: [cap('La cámara, por las dudas. Nunca más voy a dormir sin testigo.')] },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'fall', framing: 'full', x: 0.5 }] }, fx: 'gradient-tone' },
        { shot: { bg: 'city-night', time: 'night', extras: ['rain'] }, fx: 'gradient-tone' },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'neutral', pose: 'stand', framing: 'back', x: 0.5 }], prop: 'cup' }, lines: [cap('Me despierto a las nueve. Dormí once horas. Ya no me acuerdo de cómo era.')] },
        { shot: { bg: 'room-dark', time: 'day', prop: 'note' }, lines: [cap('Junto a la puerta, un papel doblado.')], fx: 'screentone' },
      ],
    },
    // ── 31 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Destruir la explicación cerrada: la cámara prueba que Julián no se levantó.',
      summary: 'Julián corre al celular. Pasa el video rápido: 23:40 a 9:00, él quieto en la cama, ni un movimiento. A las 4:12, en el borde inferior del encuadre, la sombra de unos pies se detiene al otro lado de la rendija de la puerta. Un papel entra.',
      tone: 'Pavor helado.',
      composition: 'Grilla de nueve como cuadros de vigilancia, idéntica a la página 17, para que el lector compare y sienta la diferencia.',
      layout: { template: 'grid-9' },
      panels: [
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'scared', pose: 'hold', framing: 'bust', x: 0.5 }], prop: 'phone' }, lines: [cap('El video. Rápido.')] },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('REC 01:10')], fx: 'screentone' },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('REC 03:27')], fx: 'screentone' },
        { shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'julian', expr: 'neutral', pose: 'fall', framing: 'full', x: 0.5 }] }, lines: [cap('REC 03:46')], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'shocked', framing: 'eyes', x: 0.5 }] }, lines: [cap('No me muevo. En toda la noche no me muevo.')] },
        { shot: { bg: 'room-dark', time: 'night', prop: 'door' }, lines: [cap('REC 04:12')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', angle: 'low', prop: 'door', extras: ['shadow-face'] }, lines: [cap('Bajo la rendija, la sombra de dos pies. Del otro lado.')], fx: 'screentone' },
        { shot: { bg: 'room-dark', time: 'night', prop: 'note' }, sfx: [{ text: 'shff', size: 'small' }], fx: 'screentone' },
        { shot: { bg: 'apartment', time: 'day', chars: [{ id: 'julian', expr: 'scared', pose: 'cover-face', framing: 'face', x: 0.5 }], extras: ['shadow-face'] }, lines: [cap('Medina está preso. Yo estaba dormido.'), cap('Entonces, ¿quién?')] },
      ],
    },
    // ── 32 ────────────────────────────────────────────────────────────────────────
    {
      objective: 'Cliffhanger final del volumen: la nota imposible.',
      summary: 'Julián despliega la nota. Su letra, la "M" partida, el punto corrido. Fecha de mañana. "20-11. 7B. Esta no la escribiste vos." Al pie, en otra letra, una sola palabra que ya leyó en un anexo: Halden. Entre la mirada y la nota, el pasillo vacío del séptimo: todas las puertas cerradas y una mirilla encendida.',
      tone: 'Escalofrío, puerta abierta al volumen 2.',
      composition: 'Dos rendijas arriba (ojos y manos que despliegan) y un gran plano final de la nota sobre el negro; cierre en silencio.',
      layout: GLANCE_TOP,
      panels: [
        { shot: { bg: 'room-dark', time: 'day', chars: [{ id: 'julian', expr: 'shocked', framing: 'eyes', x: 0.5 }], extras: ['shadow-face'] }, lines: [cap('La "M" partida. La "a" abierta. El punto corrido a la derecha.')] },
        { shot: { bg: 'corridor', time: 'day', angle: 'high', prop: 'eye' }, lines: [cap('En el pasillo, todas las puertas cerradas. Una mirilla encendida.')], fx: 'screentone' },
        { shot: { bg: 'black', time: 'night', prop: 'note' }, lines: [nota('"20-11. 7B. Esta no la escribiste vos."'), cap('Al pie, en otra letra, una palabra que ya traduje una vez: Halden.'), cap('EL INQUILINO DEL 7B — Fin del volumen 1')], fx: 'gradient-tone' },
      ],
      notes: 'La mirilla encendida no se atribuye a nadie: puede ser doña Amalia, puede no serlo. La duda es el gancho del volumen 2.',
    },
  ],
}
