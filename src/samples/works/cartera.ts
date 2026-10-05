import type { Layout, WorkDef } from '../types'

/*
 * MUESTRA 5 — WEBTOON VERTICAL
 * Cada "página" es un tramo alto (800×2400) pensado para scroll en el celular:
 * pocas viñetas por tramo, aire entre ellas, pausas intencionales y un gancho cada 5–6 tramos.
 */

// Distribuciones de tramo (cajas normalizadas [x, y, w, h] sobre el tramo alto).
/** Una sola imagen alta: pausa, revelación o paisaje. */
const TALL: Layout = { boxes: [[0, 0.05, 1, 0.9]] }
/** Imagen alta + remate chico abajo, separado por aire. */
const TALL_TAG: Layout = { boxes: [[0, 0.02, 1, 0.6], [0.14, 0.74, 0.72, 0.2]] }
/** Respiro arriba (detalle chico) y la escena grande abajo. */
const BREATH_TOP: Layout = { boxes: [[0.16, 0.06, 0.68, 0.22], [0, 0.42, 1, 0.54]] }
/** Dos viñetas anchas con un hueco largo en el medio (silencio de scroll). */
const TWO_GAP: Layout = { boxes: [[0, 0.03, 1, 0.38], [0.06, 0.58, 0.88, 0.38]] }
/** Tres ritmos: ancho, inset, ancho. */
const THREE: Layout = { boxes: [[0, 0.02, 1, 0.3], [0.08, 0.42, 0.84, 0.24], [0, 0.77, 1, 0.21]] }
/** Tres ritmos invertido: inset, ancho grande, remate. */
const THREE_B: Layout = { boxes: [[0.06, 0.03, 0.88, 0.22], [0, 0.33, 1, 0.38], [0.12, 0.79, 0.76, 0.17]] }
/** Descenso: tres viñetas que bajan corriéndose a los lados, como una caída o una corrida. */
const STAIRS: Layout = { boxes: [[0, 0.03, 0.78, 0.26], [0.22, 0.37, 0.78, 0.26], [0, 0.71, 1, 0.26]] }

export const work: WorkDef = {
  id: 'cartera',
  title: 'LA CARTERA DE LA LUNA',
  subtitle: 'Correo nocturno para lo que no se olvida',
  genre: 'Fantasía cotidiana con misterio (slice of life fantástico)',
  style: 'webtoon',
  kind: 'webtoon',
  formatId: 'webtoon',
  readingDirection: 'vertical',
  tone: 'Cálido, melancólico y luminoso. Humor suave entre la tristeza; misterio que avanza de carta en carta.',
  audience: 'Lectores de 13 años en adelante que leen en el celular; fans de historias tiernas con un secreto de fondo.',
  logline:
    'Nina, cartera nocturna de diecinueve años, reparte cartas entre la ciudad de los vivos y el Barrio Lunar, donde los recuerdos viven como personas, hasta que una noche le llega una carta firmada por su padre desaparecido.',
  synopsis:
    'Nina Arce trabaja de noche en el Correo de la Luna, una oficina que nadie ve de día. Su ruta cruza el Puente de Nácar hacia el Barrio Lunar, un vecindario silencioso donde los recuerdos de la gente viven como vecinos: mientras alguien los recuerde, tienen cara, nombre y voz; cuando los olvidan, se apagan hasta volverse una lucecita en una ventana. Con Pato, una grulla de papel que alumbra como farol y opina de todo, Nina entrega cartas que los vivos no se animan a decir en voz alta.\n\nCada noche es una entrega: un viudo que escribe todos los días a su esposa, una perra que nadie llamaba hace años, una nena que no se despidió de su abuela. Pero una carta cae directo de la luna a las manos de Nina: «Para Nina Arce. De: papá». Tomás Arce, cartero como ella, desapareció hace tres años. Y el Jefe de Correo, Ezequiel, guarda en un cajón con llave decenas de cartas más, todas selladas RETENIDA.\n\nEn el camino aparece Lu, una chica del Barrio que no recuerda su nombre y que lleva una foto de un cartero con una nena en brazos. Las cartas del padre son cada vez más cortas. La Regla Trece, la que Ezequiel nunca enseñó, explica por qué: Tomás se quedó en el Barrio pasado el alba y se está volviendo recuerdo. Nina cruza hasta la Estación Lunar, donde esperan los recuerdos que ya nadie nombra, para encontrarlo antes de que salga el sol.\n\nLa revelación final es que Lu es el recuerdo que Tomás guardaba de su hija de chiquita: «Lunita». Al verla, él vuelve a recordar. No puede regresar, pero Nina descubre que lo que se recuerda no se apaga: será su cartera para siempre. Y en el último tramo llega una carta nueva, con un matasellos que nadie conocía.',
  visualProposal:
    'Webtoon a todo color pensado para el pulgar: noches azul tinta y violeta con acentos dorados (la luz de Pato, los sellos, las lámparas del Barrio). La ciudad de los vivos usa azules fríos y luces de neón suaves; el Barrio Lunar es nácar, lavanda y blanco lechoso, con estrellas y brillos flotando. Cada tramo lleva entre una y tres viñetas, anchas o apenas metidas hacia adentro, con mucho aire entre ellas para marcar silencios. Las revelaciones van en una sola imagen alta; los ganchos caen al final del tramo, justo antes del corte. Globos cortos, letra grande, nada de texto amontonado. Los recuerdos que se apagan se dibujan como luces en ventanas; los recuerdos vivos, como personas con un leve brillo en el borde.',
  world: {
    setting:
      'Una ciudad portuaria sin nombre y, del otro lado del Puente de Nácar, el Barrio Lunar: un vecindario que solo existe entre la salida de la luna y el alba, habitado por los recuerdos que la gente guarda de quienes quiere.',
    rules: [
      'El Correo de la Luna abre cuando sale la luna y cierra con el primer rayo de sol. Ninguna carta viaja de día.',
      'En el Barrio Lunar los recuerdos viven como personas. Mientras alguien los recuerde tienen cara, nombre y voz.',
      'Cuando un recuerdo es olvidado se va apagando: primero pierde el nombre, después la cara, al final queda como una luz en una ventana.',
      'Las cartas se entregan en mano. Un cartero jamás abre una carta que no esté dirigida a él.',
      'Una carta escrita con verdad llega siempre, aunque el destinatario esté perdido; puede caer del cielo si no encuentra buzón.',
      'Un vivo no puede quedarse en el Barrio después del alba: el que se queda empieza a volverse recuerdo de sí mismo.',
      'Regla Trece (oculta en el reglamento): las cartas de alguien que se está volviendo recuerdo se retienen, porque quien las lee quiere cruzar a buscarlo y nunca vuelve.',
      'Lo que se nombra en voz alta se fortalece: recordar a alguien en voz alta le devuelve brillo en el Barrio.',
    ],
    era: 'Presente atemporal: celulares que nadie usa de noche, tranvías, faroles a gas en el Barrio y sellos de lacre en el Correo.',
    aesthetic:
      'Ciudad nocturna azul y violeta; Barrio Lunar de casas bajas color nácar, escaleras que suben a la nada, ropa tendida que brilla, gatos de luz. Oficina de correo de madera con casilleros infinitos y una gran lámpara de luna.',
    places: [
      { name: 'Correo de la Luna', description: 'Oficina de madera escondida detrás de una persiana que solo se abre de noche. Casilleros hasta el techo, olor a papel y lacre, y un cajón con llave en el escritorio de Ezequiel.' },
      { name: 'Puente de Nácar', description: 'Puente que aparece sobre el río cuando sale la luna. Es el único paso entre la ciudad y el Barrio Lunar; de día es solo neblina.' },
      { name: 'Barrio Lunar', description: 'Vecindario tranquilo de calles empedradas y ventanas encendidas. Cada casa es un recuerdo; las que se apagan quedan con una sola luz.' },
      { name: 'Plaza del Reloj Quieto', description: 'Plaza del Barrio donde un reloj marca siempre la hora en que alguien fue feliz. Ahí se juntan los recuerdos sin dueño.' },
      { name: 'Estación Lunar', description: 'Última parada del Barrio. Los recuerdos que ya nadie nombra esperan un tren que sale al alba y no vuelve.' },
      { name: 'Departamento de Nina', description: 'Un monoambiente en un sexto piso de la ciudad, con la gorra de cartero de su padre colgada en la puerta.' },
    ],
    conflicts: [
      'Nina contra el secreto de Ezequiel: ¿protección o traición?',
      'Nina contra su propio olvido: dejó de pensar en su padre para que no doliera, y eso también lo apaga.',
      'La carrera contra el alba en cada cruce al Barrio.',
      'Lu contra la desaparición: si nadie recuerda quién es, se va a apagar.',
    ],
    culture: [
      'Los carteros saludan tocándose la gorra y diciendo «Llega siempre».',
      'En el Barrio se paga con anécdotas: un café cuesta un recuerdo lindo contado en voz alta.',
      'Las cartas sin buzón se doblan en grulla y se sueltan al aire; así nació Pato.',
      'Los vivos que escriben al Barrio dejan la carta debajo de la almohada; el Correo la retira a medianoche.',
    ],
  },
  structure: {
    inicio:
      'Tramos 1–6. Una carta firmada por el padre desaparecido cae del cielo en manos de Nina. Conocemos el Correo, a Ezequiel, a Pato y la primera entrega al Barrio (el viudo Aurelio). Gancho: el cajón de Ezequiel lleno de cartas RETENIDAS para Nina.',
    desarrollo:
      'Tramos 7–18. Nina lee a escondidas la primera carta, conoce a Lu siguiendo a una perra olvidada, resuelve la entrega de Clara (la nena que no se despidió) y entiende que olvidar para no sufrir también apaga. Las cartas del padre se acortan. Gancho: «Preguntale a Ezequiel por la Regla Trece».',
    climax:
      'Tramos 19–31. Ezequiel confiesa: Tomás se quedó pasado el alba y se está volviendo recuerdo. Nina cruza hacia la Estación Lunar con Lu y Pato. Su padre no la reconoce, hasta que ve a Lu: es su recuerdo de Nina de chiquita, «Lunita». Tomás recuerda; el alba amenaza con atrapar a Nina.',
    cierre:
      'Tramos 32–34. Nina vuelve con el primer rayo, Ezequiel la espera. Ahora escribe cada noche a su padre para que no se apague; Lu recupera su nombre y se queda. Gancho final: una carta «Para Lunita. De: mamá», con matasellos de un barrio que no existía.',
    giros: [
      'Tramo 6: Ezequiel retiene decenas de cartas dirigidas a Nina.',
      'Tramo 12: la foto de Lu muestra a Tomás con una nena en brazos.',
      'Tramo 18: el padre señala a Ezequiel y a la Regla Trece.',
      'Tramo 20: Tomás no está muerto: se quedó en el Barrio y se está volviendo recuerdo.',
      'Tramo 29: Lu es el recuerdo de Nina niña que guardaba su padre.',
      'Tramo 34: existe un Barrio del Sol y su madre escribe desde ahí.',
    ],
    cliffhangers: [
      'Segmento 1 (tramo 6): «RETENIDA — Para Nina Arce», decenas de veces.',
      'Segmento 2 (tramo 12): el cartero de la foto es papá.',
      'Segmento 3 (tramo 18): «Preguntale a Ezequiel por la Regla Trece».',
      'Segmento 4 (tramo 24): la luna empieza a bajar y suena el silbato del último tren.',
      'Segmento 5 (tramo 30): las manos de Nina empiezan a brillar como las de un recuerdo.',
      'Final (tramo 34): «Para Lunita. De: mamá. Matasellos: Barrio del Sol».',
    ],
    escenasClave: [
      'La carta que cae de la luna (tramo 1).',
      'La luz de Elena que se apaga tranquila después de leer (tramo 5).',
      'Aurelio recordando a Canela en voz alta y la perra que vuelve a tener color (tramo 11).',
      'Clara contando un recuerdo de su abuela por la ventana (tramo 16).',
      'La confesión de Ezequiel con el reglamento abierto en la Regla Trece (tramo 20).',
      '«¿Lunita?» en el andén de la Estación Lunar (tramo 29).',
      'La corrida por el Puente de Nácar con el primer rayo de sol (tramo 32).',
    ],
    ritmo:
      'Tramos 1–6: presentación con gancho fuerte y una pausa de paisaje en el cruce del puente (tramo 4). Tramos 7–12: entrega emotiva con humor de Pato; pausa contemplativa en la plaza (tramo 9). Tramos 13–18: entrega de Clara, más lenta y tierna; pausa en el tramo 15 (casa apagada). Tramos 19–24: tensión de diálogo, pausa de silencio en el tramo 21. Tramos 25–31: aceleración, viñetas altas, corridas y revelación en imagen única (tramo 29). Tramos 32–34: descompresión, luz de amanecer, cierre cálido y gancho.',
  },
  characters: [
    {
      id: 'nina',
      name: 'Nina Arce',
      age: '19 años',
      role: 'protagonista',
      personality: 'Puntual, terca y amable con todos menos consigo misma. Hace chistes cuando algo le duele. Escucha más de lo que habla.',
      goal: 'Entregar cada carta a tiempo y, en secreto, entender qué le pasó a su padre.',
      fear: 'Que recordar a su padre duela tanto que no pueda seguir trabajando.',
      flaw: 'Para no sufrir, eligió no pensar en él; ese olvido voluntario lo está apagando.',
      arc: 'De cartera que entrega emociones ajenas sin tocar las propias a alguien que se anima a recordar en voz alta y se convierte en el puente entre su padre y el mundo.',
      relations: 'Hija de Tomás. Aprendiz de Ezequiel, a quien quiere como a un tío. Compañera de ruta de Pato. Hermana mayor improvisada de Lu.',
      physical: 'Delgada, ágil, piernas de caminar toda la noche. Pelo carré índigo, pecas, ojos ámbar.',
      visualTraits: 'Ojos ámbar que brillan con la luz de Pato. Una curita en la nariz casi siempre. Sostiene la cartera contra el pecho cuando tiene miedo.',
      outfit: 'Uniforme de cartera nocturna azul marino con vivos dorados, cartera de cuero cruzada con el sello de la luna, botas gastadas.',
      expressions: 'Sonrisa de costado; ceño fruncido de concentración; ojos abiertos y quietos cuando algo la sorprende de verdad.',
      speech: 'Rioplatense, frases cortas, ironía suave. Dice «Llega siempre» como un rezo.',
      rig: {
        gender: 'f', age: 'young', build: 'slim', skin: '#e8b894',
        hair: { style: 'bob', color: '#3a2f6b' }, eyes: { color: '#f2b84b' },
        outfit: { kind: 'uniform', main: '#24346e', accent: '#f2c14e' },
        accessory: 'satchel', mark: 'freckles',
      },
    },
    {
      id: 'pato',
      name: 'Pato',
      age: 'Dobló su primera ala hace siete años',
      role: 'aliado',
      personality: 'Charlatán, dramático y valiente cuando importa. Opina de la ortografía de todas las cartas aunque no las lea.',
      goal: 'Que ninguna carta quede sin entregar (él mismo fue una).',
      fear: 'La lluvia, el fuego y que alguien lo «desdoble».',
      flaw: 'Exagera todo y se enoja si le dicen «grulla» en lugar de «Pato».',
      arc: 'De mascota cómica a guardián que alumbra a Nina en la noche más oscura y la lleva en vuelo hasta el amanecer.',
      relations: 'Fue doblado de una carta sin buzón que Tomás escribió para Nina; no lo sabe hasta el final. Fiel a Nina, desconfía de Ezequiel.',
      physical: 'Grulla de papel del tamaño de un gato, con el cuerpo traslúcido que brilla como un farol desde adentro.',
      visualTraits: 'Pliegues dorados en las puntas de las alas, mini gorra de correo, bufanda de estampilla.',
      outfit: 'Una bufanda hecha con una estampilla vieja y una gorra de cartero en miniatura.',
      expressions: 'Brillo intenso cuando se enoja, luz tenue cuando está triste, parpadeo cuando miente.',
      speech: 'Habla rápido, con exclamaciones y palabras de oficina: «¡Urgente!», «¡Certificada!».',
      rig: {
        gender: 'x', age: 'young', build: 'small', skin: '#fbf3dc',
        hair: { style: 'spiky', color: '#f7d774' }, eyes: { color: '#3b2a6b' },
        outfit: { kind: 'robe', main: '#fff6dc', accent: '#ff9f43' },
        accessory: 'cap',
      },
    },
    {
      id: 'lu',
      name: 'Lu',
      age: 'Parece de 11 años',
      role: 'aliado',
      personality: 'Curiosa, mansa, ríe por cosas mínimas. Se distrae mirando la luna. Se asusta en silencio.',
      goal: 'Recordar su nombre completo y a quién pertenece.',
      fear: 'Apagarse como las ventanas vacías del Barrio.',
      flaw: 'No pide ayuda; prefiere desaparecer antes que molestar.',
      arc: 'De recuerdo sin nombre a la llave que despierta la memoria de Tomás; recupera su nombre, «Lunita», y se queda con Nina.',
      relations: 'Es el recuerdo que Tomás guardaba de Nina a los cinco años. Se encariña con Pato y con la perra Canela.',
      physical: 'Chica pequeña de piel nacarada y pelo largo ondulado lila plateado que flota un poco, como bajo el agua.',
      visualTraits: 'Bordes del cuerpo con un leve brillo; cuando se apaga, se vuelve traslúcida. Lleva una foto gastada siempre.',
      outfit: 'Vestido lavanda con cinta amarillo pálido, descalza.',
      expressions: 'Sonrisa enorme y abierta; mirada perdida; ojos llenos de lágrimas que no caen.',
      speech: 'Preguntas cortas. Repite palabras que le gustan: «¿Alba? Alba.»',
      rig: {
        gender: 'f', age: 'young', build: 'small', skin: '#e3e8f7',
        hair: { style: 'long-wavy', color: '#cdc6ff' }, eyes: { color: '#8fd3ff' },
        outfit: { kind: 'dress', main: '#b9b4ee', accent: '#ffe9a8' },
        accessory: 'ribbon',
      },
    },
    {
      id: 'ezequiel',
      name: 'Ezequiel Barral',
      age: '67 años',
      role: 'mentor',
      personality: 'Seco, ceremonioso, perfeccionista con los sellos. Cariñoso solo con hechos: deja termos de mate preparados.',
      goal: 'Cumplir la promesa que le hizo a Tomás: que Nina nunca cruce a buscarlo.',
      fear: 'Perder a Nina como perdió a Tomás.',
      flaw: 'Confunde proteger con ocultar.',
      arc: 'De guardián de secretos a cómplice: le da a Nina su vieja llave del andén y aprende que retener una carta también es una forma de olvido.',
      relations: 'Jefe del Correo, compañero de ruta de Tomás durante veinte años, padrino de Nina.',
      physical: 'Alto, encorvado, bigote canoso prolijo, manos con manchas de tinta.',
      visualTraits: 'Anteojos redondos que se empañan cuando miente. Llavero enorme en el chaleco.',
      outfit: 'Sobretodo bordó con botones dorados, sombrero de copa baja, chaleco con relojes.',
      expressions: 'Ceja levantada; boca apretada; mirada baja de culpa.',
      speech: 'Formal y pausado; trata de «usted» cuando reta. Cita el reglamento de memoria.',
      rig: {
        gender: 'm', age: 'old', build: 'average', skin: '#c9966b',
        hair: { style: 'slick', color: '#dcdcdc' }, eyes: { color: '#5b6b8c' },
        outfit: { kind: 'coat', main: '#5a2438', accent: '#c9a227' },
        accessory: 'hat', mark: 'glasses',
      },
    },
    {
      id: 'tomas',
      name: 'Tomás Arce',
      age: '48 años',
      role: 'secundario',
      personality: 'Dulce, distraído, silbador. Valiente hasta la imprudencia cuando alguien necesita una carta.',
      goal: 'Que su hija sepa que no la abandonó, aunque ya no recuerde por qué escribe.',
      fear: 'Olvidar la cara de Nina.',
      flaw: 'Rompió la regla del alba para entregar una carta urgente y no volvió.',
      arc: 'De recuerdo que se apaga en un andén a padre que vuelve a nombrar a su hija y acepta quedarse, siempre que ella le escriba.',
      relations: 'Padre de Nina, compañero de Ezequiel, creador involuntario de Pato y de Lu.',
      physical: 'Hombros anchos, barba de días, pelo índigo revuelto igual al de Nina, ojos ámbar.',
      visualTraits: 'Su uniforme está desteñido; partes de su cuerpo se ven como papel cuando se apaga.',
      outfit: 'Uniforme viejo de cartero, gorra con la visera rota.',
      expressions: 'Mirada vacía y amable; sonrisa que se le quiebra; llanto con risa.',
      speech: 'Frases inconclusas mientras olvida; cuando recuerda, habla con apodos: «Lunita», «flaca».',
      rig: {
        gender: 'm', age: 'adult', build: 'average', skin: '#e0ae86',
        hair: { style: 'messy', color: '#3a2f6b' }, eyes: { color: '#f2b84b' },
        outfit: { kind: 'uniform', main: '#5f6ea6', accent: '#e8c97a' },
        accessory: 'cap', mark: 'stubble',
      },
    },
    {
      id: 'aurelio',
      name: 'Don Aurelio Salinas',
      age: '81 años',
      role: 'secundario',
      personality: 'Ceremonioso, coqueto, triste con elegancia. Escribe con pluma y perfuma las cartas.',
      goal: 'Despedirse bien de Elena, su esposa, y poder dormir.',
      fear: 'Que Elena sufra si él deja de escribirle.',
      flaw: 'Se olvidó de todo lo que no era Elena, incluso de Canela, la perra de los dos.',
      arc: 'Aprende a soltar una carta y a recordar en voz alta lo que había dejado de lado.',
      relations: 'Viudo de Elena; dueño de Canela, la perra que ahora vaga por el Barrio.',
      physical: 'Flaco, calvo, barba blanca larga, manos temblorosas.',
      visualTraits: 'Pañuelo bordado con una E, pantuflas a cuadros.',
      outfit: 'Pulóver verde oliva tejido por Elena y bufanda crema.',
      expressions: 'Sonrisa mansa; ojos húmedos; carcajada sorprendida.',
      speech: 'Antiguo y gentil: «señorita», «tenga a bien».',
      rig: {
        gender: 'm', age: 'old', build: 'slim', skin: '#d8a77f',
        hair: { style: 'bald', color: '#bdbdbd' }, eyes: { color: '#6b4f3a' },
        outfit: { kind: 'sweater', main: '#6f8a4f', accent: '#efe0b5' },
        accessory: 'scarf', mark: 'beard',
      },
    },
    {
      id: 'clara',
      name: 'Clara Medina',
      age: '10 años',
      role: 'secundario',
      personality: 'Seria, inteligente, orgullosa. Finge que no le importa nada.',
      goal: 'Pedirle perdón a su abuela Pocha por no haberse despedido.',
      fear: 'Llorar delante de alguien.',
      flaw: 'Evita pensar en su abuela para no sentir culpa, y así la está apagando.',
      arc: 'Se anima a contar un recuerdo en voz alta y le devuelve la cara a su abuela en el Barrio. Espejo directo de Nina.',
      relations: 'Nieta de la abuela Pocha. Admira a Nina sin decirlo.',
      physical: 'Petisa, piel morena, trenzas dobles negras, ojos grandes y oscuros.',
      visualTraits: 'Buzo rosa gigante que era de la abuela, mochila llena de llaveros.',
      outfit: 'Buzo con capucha rosa chicle con cordones amarillos, pijama a rayas debajo.',
      expressions: 'Brazos cruzados con trompita; ojos que se llenan de golpe; sonrisa chueca.',
      speech: 'Directa, cortante, con palabras que aprendió de grande: «técnicamente».',
      rig: {
        gender: 'f', age: 'young', build: 'small', skin: '#8d5a3b',
        hair: { style: 'twintails', color: '#1d1414' }, eyes: { color: '#3b2618' },
        outfit: { kind: 'hoodie', main: '#ff8fab', accent: '#ffd166' },
        accessory: 'bag',
      },
    },
  ],
  cover: {
    shot: {
      bg: 'bridge', time: 'night', angle: 'low',
      chars: [
        { id: 'nina', expr: 'determined', pose: 'hold', framing: 'full', x: 0.45 },
        { id: 'pato', expr: 'happy', pose: 'fly', framing: 'full', x: 0.75, scale: 0.6 },
        { id: 'lu', expr: 'happy', pose: 'reach', framing: 'half', x: 0.2, scale: 0.8 },
      ],
      extras: ['stars', 'glow', 'sparkles'],
      prop: 'letter',
    },
    title: 'LA CARTERA DE LA LUNA',
    subtitle: 'Correo nocturno para lo que no se olvida',
    tagline: 'Hay cartas que llegan siempre. Aunque el remitente ya no recuerde haberlas escrito.',
  },
  altCover: {
    shot: {
      bg: 'moon-town', time: 'night', angle: 'high',
      chars: [{ id: 'nina', expr: 'neutral', pose: 'stand', framing: 'back', x: 0.5 }],
      extras: ['stars', 'glow', 'bubbles-soft'],
      prop: 'moon',
    },
    title: 'LA CARTERA DE LA LUNA',
    subtitle: 'Edición Barrio Lunar',
    tagline: 'Del otro lado del puente, los recuerdos te esperan con la luz prendida.',
  },
  pages: [
    // ───────────── SEGMENTO 1 · LA CARTA QUE CAYÓ (1–6) ─────────────
    {
      objective: 'Gancho: presentar a Nina y la imagen imposible de una carta que cae de la luna con su nombre.',
      summary: 'Ciudad de noche, Nina camina su ruta. Una luz baja desde la luna como una hoja. La atrapa: «Para Nina Arce. De: papá».',
      tone: 'Asombro silencioso que se vuelve escalofrío.',
      composition: 'Arriba, cielo enorme con la luna (el pulgar baja por las estrellas). Hueco. Al medio, Nina chiquita en la calle mirando hacia arriba. Abajo, primer plano de la carta: el scroll termina en el remitente.',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'sky-night', time: 'night', extras: ['stars', 'glow'], prop: 'moon' },
          lines: [{ kind: 'narration', text: 'Hay cartas que tardan años en llegar.' }],
        },
        {
          shot: { bg: 'street', time: 'night', angle: 'high', chars: [{ id: 'nina', expr: 'surprised', pose: 'reach', framing: 'full', x: 0.5 }], extras: ['sparkles'] },
          lines: [{ who: 'nina', kind: 'thought', text: '¿Una carta... cayendo del cielo?' }],
          sfx: [{ text: 'fsss', size: 'small', color: '#f7d774' }],
        },
        {
          shot: { bg: 'street', time: 'night', extras: ['glow'], prop: 'letter' },
          lines: [
            { kind: 'caption', text: '«Para Nina Arce. De: papá.»' },
            { who: 'nina', kind: 'whisper', text: 'No. Papá no está hace tres años.' },
          ],
        },
      ],
      notes: 'El sobre brilla dorado; es la primera mancha de color cálido del capítulo.',
    },
    {
      objective: 'Presentar el Correo de la Luna, a Ezequiel y la regla de no abrir cartas.',
      summary: 'Nina entra corriendo a la oficina. Ezequiel le saca la carta de las manos antes de que la abra y la guarda: «Esta carta no existe».',
      tone: 'Tensión contenida, autoridad.',
      composition: 'Detalle chico arriba (persiana que se abre, sello de la luna). Escena grande abajo: oficina de casilleros con Ezequiel quitándole la carta. El hueco simula el portazo.',
      layout: BREATH_TOP,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', extras: ['glow'], prop: 'lamp' },
          lines: [{ kind: 'caption', text: 'Correo de la Luna. Abre con la luna. Cierra con el sol.' }],
          sfx: [{ text: 'clanc', size: 'small' }],
        },
        {
          shot: {
            bg: 'post-office', time: 'night',
            chars: [
              { id: 'nina', expr: 'shocked', pose: 'reach', framing: 'half', x: 0.3 },
              { id: 'ezequiel', expr: 'serious', pose: 'hold', framing: 'half', x: 0.72, flip: true },
            ],
          },
          lines: [
            { who: 'nina', kind: 'dialogue', text: '¡Ezequiel! Es de papá, mirá la letra...' },
            { who: 'ezequiel', kind: 'dialogue', text: 'Regla cuatro: nadie abre lo que no sabe de dónde viene.' },
            { who: 'ezequiel', kind: 'dialogue', text: 'Esta carta no existe, Nina.' },
          ],
        },
      ],
    },
    {
      objective: 'Presentar a Pato y bajar la tensión con humor sin perder el misterio.',
      summary: 'Pato se despliega del casillero, brilla y regaña a Ezequiel. Nina se traga la rabia y acepta la ruta de la noche.',
      tone: 'Cómico y tierno, con una espina debajo.',
      composition: 'Inset con Pato desplegándose (sorpresa). Ancho grande con los tres. Remate chico: Nina sola, apretando la cartera.',
      layout: THREE_B,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'pato', expr: 'angry', pose: 'fly', framing: 'full', x: 0.5, scale: 0.8 }], extras: ['glow', 'sparkles'] },
          lines: [{ who: 'pato', kind: 'shout', text: '¡Eso es retención indebida de correspondencia!' }],
          sfx: [{ text: 'flap flap', size: 'medium', color: '#ff9f43' }],
        },
        {
          shot: {
            bg: 'post-office', time: 'night',
            chars: [
              { id: 'ezequiel', expr: 'tired', pose: 'arms-crossed', framing: 'half', x: 0.25 },
              { id: 'pato', expr: 'furious', pose: 'fly', framing: 'bust', x: 0.55, scale: 0.6 },
              { id: 'nina', expr: 'sad', pose: 'stand', framing: 'half', x: 0.8, flip: true },
            ],
          },
          lines: [
            { who: 'ezequiel', kind: 'dialogue', text: 'Pato, a tu casillero.' },
            { who: 'ezequiel', kind: 'dialogue', text: 'Nina: tenés una entrega al Barrio. Don Aurelio.' },
          ],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'nina', expr: 'determined', pose: 'hold', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'nina', kind: 'thought', text: 'Después la busco.' }],
        },
      ],
    },
    {
      objective: 'Pausa intencional: el cruce del Puente de Nácar hacia el Barrio Lunar. Mostrar el mundo.',
      summary: 'Nina y Pato cruzan el puente que aparece sobre la niebla. Del otro lado, casas nacaradas con ventanas encendidas.',
      tone: 'Contemplativo, maravilla.',
      composition: 'PAUSA: una sola imagen alta. El scroll recorre el puente de abajo hacia el Barrio arriba; texto mínimo para dejar respirar.',
      layout: TALL,
      panels: [
        {
          shot: {
            bg: 'bridge', time: 'night', angle: 'low',
            chars: [
              { id: 'nina', expr: 'neutral', pose: 'stand', framing: 'back', x: 0.45, scale: 0.7 },
              { id: 'pato', expr: 'happy', pose: 'fly', framing: 'full', x: 0.6, scale: 0.4 },
            ],
            extras: ['stars', 'glow', 'bubbles-soft'],
          },
          lines: [
            { kind: 'narration', text: 'Del otro lado del puente viven los recuerdos.' },
            { kind: 'narration', text: 'Mientras alguien los recuerde, tienen cara. Y nombre.' },
          ],
        },
      ],
      notes: 'Pausa de lectura deliberada: es el primer contacto del lector con el Barrio.',
    },
    {
      objective: 'Primera entrega emocional: la carta de un viudo a la memoria de su esposa.',
      summary: 'Nina deja la carta de Aurelio en la ventana de Elena, que ya es solo una luz. La luz lee y le pide que le diga: «Ya puede dormir». La ventana se apaga tranquila.',
      tone: 'Melancolía dulce.',
      composition: 'Imagen alta de la ventana con la luz (la casa respira). Remate chico abajo con la cara de Nina conmovida, separada por aire: el silencio después de la despedida.',
      layout: TALL_TAG,
      panels: [
        {
          shot: { bg: 'moon-town', time: 'night', chars: [{ id: 'nina', expr: 'sad', pose: 'hold', framing: 'half', x: 0.3 }], extras: ['glow', 'petals'], prop: 'lamp' },
          lines: [
            { who: 'nina', kind: 'whisper', text: 'Señora Elena... le escribe Aurelio. Como todas las noches.' },
            { kind: 'caption', text: '«Decile que ya puede dormir. Que yo me acuerdo por los dos.»' },
          ],
        },
        {
          shot: { bg: 'moon-town', time: 'night', chars: [{ id: 'nina', expr: 'crying', pose: 'stand', framing: 'face', x: 0.5 }], extras: ['tears', 'glow'] },
          lines: [{ who: 'nina', kind: 'thought', text: 'Ojalá alguien me dijera eso a mí.' }],
        },
      ],
    },
    {
      objective: 'Cliffhanger del segmento 1: el cajón de Ezequiel.',
      summary: 'De vuelta en el Correo vacío, Nina abre el cajón con una horquilla. Adentro: decenas de cartas selladas RETENIDA, todas para ella.',
      tone: 'Suspenso, traición.',
      composition: 'Escalera descendente: mano con horquilla, cajón que se abre, y abajo el plano ancho del cajón repleto. El tramo corta en la palabra RETENIDA.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'nina', expr: 'serious', pose: 'kneel', framing: 'half', x: 0.5 }], extras: ['shadow-face'] },
          lines: [{ who: 'nina', kind: 'whisper', text: 'Perdón, Ezequiel.' }],
          sfx: [{ text: 'clic', size: 'small' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', prop: 'key', extras: ['glow'] },
          sfx: [{ text: 'criiic', size: 'small' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', angle: 'high', prop: 'letter', extras: ['glow'] },
          lines: [
            { kind: 'caption', text: 'RETENIDA — Para Nina Arce. RETENIDA. RETENIDA. RETENIDA.' },
            { who: 'nina', kind: 'thought', text: '...Son decenas.' },
          ],
          fx: 'gradient-tone',
        },
      ],
    },

    // ───────────── SEGMENTO 2 · LA PERRA QUE NADIE LLAMABA (7–12) ─────────────
    {
      objective: 'Nina rompe la regla por primera vez y lee una carta. Plantar el misterio del padre.',
      summary: 'En su departamento, Nina abre una sola carta. Letra de su padre: «Lunita, si leés esto, no me busques todavía. Te quiero de acá a la luna, ida y vuelta».',
      tone: 'Íntimo, quebrado.',
      composition: 'Dos viñetas con un hueco largo: Nina en la cama con la carta, y abajo la carta en primer plano. El hueco es el tiempo que tarda en animarse a leer.',
      layout: TWO_GAP,
      panels: [
        {
          shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'nina', expr: 'scared', pose: 'sit', framing: 'half', x: 0.5 }], extras: ['glow'] },
          lines: [
            { kind: 'narration', text: 'Me llevé una sola. Una.' },
            { who: 'nina', kind: 'thought', text: 'Regla cuatro. Ya sé.' },
          ],
          sfx: [{ text: 'rrrip', size: 'small' }],
        },
        {
          shot: { bg: 'bedroom', time: 'night', prop: 'letter', extras: ['glow', 'stars'] },
          lines: [
            { kind: 'caption', text: '«Lunita: si leés esto, no me busques todavía.»' },
            { kind: 'caption', text: '«Te quiero de acá a la luna. Ida y vuelta.»' },
          ],
        },
      ],
    },
    {
      objective: 'Abrir la segunda entrega: una perra olvidada que vaga por el Barrio.',
      summary: 'Noche siguiente. Pato encuentra un sobre sin destinatario con una huella de pata. Una perra de luz, casi transparente, los mira desde una esquina y sale corriendo.',
      tone: 'Ligero, curioso.',
      composition: 'Inset del sobre con la huella; ancho grande con la perra apenas dibujada en la esquina; remate: Pato saliendo disparado.',
      layout: THREE_B,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', prop: 'letter', extras: ['sparkles'] },
          lines: [{ who: 'pato', kind: 'dialogue', text: 'Remitente: una pata. Destino: «el que me llamaba Canela».' }],
        },
        {
          shot: {
            bg: 'moon-town', time: 'night',
            chars: [
              { id: 'nina', expr: 'surprised', pose: 'stand', framing: 'full', x: 0.25 },
              { id: 'pato', expr: 'surprised', pose: 'fly', framing: 'full', x: 0.4, scale: 0.4 },
            ],
            extras: ['glow', 'bubbles-soft'],
          },
          lines: [{ who: 'nina', kind: 'dialogue', text: 'Ahí... ¿eso es una perra?' }],
          sfx: [{ text: 'guau...', size: 'small', color: '#cdd6ff' }],
        },
        {
          shot: { bg: 'moon-town', time: 'night', chars: [{ id: 'pato', expr: 'determined', pose: 'fly', framing: 'full', x: 0.6, scale: 0.7 }], extras: ['glow'] },
          lines: [{ who: 'pato', kind: 'shout', text: '¡Certificada! ¡Que no se escape!' }],
          fx: 'speedlines',
        },
      ],
    },
    {
      objective: 'Pausa intencional + presentación de Lu.',
      summary: 'En la Plaza del Reloj Quieto, la perra se echa a los pies de una chica de pelo lila que la acaricia. Lu no sabe su nombre. Solo sabe que el reloj marca «una hora feliz».',
      tone: 'Mágico, quieto.',
      composition: 'PAUSA contemplativa: imagen alta de la plaza con el reloj, Lu y la perra de luz. Remate chico: Lu mirando a Nina, sonrisa enorme.',
      layout: TALL_TAG,
      panels: [
        {
          shot: { bg: 'park', time: 'night', angle: 'high', chars: [{ id: 'lu', expr: 'happy', pose: 'kneel', framing: 'full', x: 0.5 }], extras: ['stars', 'sparkles', 'glow'], prop: 'clock' },
          lines: [{ kind: 'narration', text: 'En la Plaza del Reloj Quieto siempre es la hora en que alguien fue feliz.' }],
        },
        {
          shot: { bg: 'park', time: 'night', chars: [{ id: 'lu', expr: 'happy', pose: 'wave', framing: 'bust', x: 0.5 }], extras: ['sparkles'] },
          lines: [{ who: 'lu', kind: 'dialogue', text: '¿Viniste a buscarla? Yo no sé ni cómo me llamo.' }],
        },
      ],
      notes: 'Pausa de ritmo: primera vez que el lector ve a Lu. Mucho aire, sin urgencia.',
    },
    {
      objective: 'Resolver la entrega: llevar a la perra y su carta hasta Aurelio, en la ciudad de los vivos.',
      summary: 'Nina deduce que Canela era la perra de Aurelio y Elena. Cruzan los cuatro hasta la casa del viudo. Aurelio abre la puerta en pantuflas.',
      tone: 'Esperanza, ternura.',
      composition: 'Tres ritmos: Nina atando cabos, corrida por el puente (ancho con movimiento), Aurelio en la puerta (remate).',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'park', time: 'night', chars: [{ id: 'nina', expr: 'thinking', pose: 'hold', framing: 'bust', x: 0.35 }, { id: 'lu', expr: 'neutral', pose: 'stand', framing: 'bust', x: 0.75, flip: true }], prop: 'letter' },
          lines: [{ who: 'nina', kind: 'dialogue', text: 'El pulóver de Aurelio tiene pelos dorados. Como ella.' }],
        },
        {
          shot: {
            bg: 'bridge', time: 'night',
            chars: [
              { id: 'nina', expr: 'determined', pose: 'run', framing: 'full', x: 0.3 },
              { id: 'lu', expr: 'laugh', pose: 'run', framing: 'full', x: 0.55 },
              { id: 'pato', expr: 'happy', pose: 'fly', framing: 'full', x: 0.78, scale: 0.4 },
            ],
            extras: ['stars', 'wind'],
          },
          sfx: [{ text: 'tap tap tap', size: 'small' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'apartment', time: 'night', chars: [{ id: 'aurelio', expr: 'surprised', pose: 'stand', framing: 'half', x: 0.5 }] },
          lines: [{ who: 'aurelio', kind: 'dialogue', text: '¿Señorita? Es muy tarde para el correo.' }],
        },
      ],
    },
    {
      objective: 'Escena clave: recordar en voz alta devuelve color. Plantar la regla que resolverá el final.',
      summary: 'Aurelio no ve a la perra. Nina le lee la huella: «el que me llamaba Canela». Él se ríe, recuerda en voz alta cómo le robaba las medialunas, y la perra se llena de color y le salta encima.',
      tone: 'Alegría que hace llorar.',
      composition: 'Dos viñetas con hueco largo: Aurelio recordando (el silencio del hueco es la memoria que vuelve), abajo la explosión de color.',
      layout: TWO_GAP,
      panels: [
        {
          shot: { bg: 'apartment', time: 'night', chars: [{ id: 'aurelio', expr: 'crying', pose: 'hold', framing: 'bust', x: 0.4 }, { id: 'nina', expr: 'shy', pose: 'stand', framing: 'bust', x: 0.8, flip: true }], extras: ['tears'] },
          lines: [
            { who: 'aurelio', kind: 'dialogue', text: 'Canela... nos robaba las medialunas del plato.' },
            { who: 'aurelio', kind: 'dialogue', text: 'Elena se reía tanto. ¿Cómo me olvidé de vos?' },
          ],
        },
        {
          shot: { bg: 'apartment', time: 'night', chars: [{ id: 'aurelio', expr: 'laugh', pose: 'kneel', framing: 'full', x: 0.45 }, { id: 'lu', expr: 'laugh', pose: 'stand', framing: 'full', x: 0.8 }], extras: ['sparkles', 'glow', 'petals'] },
          lines: [{ who: 'lu', kind: 'shout', text: '¡Se puso dorada!' }],
          sfx: [{ text: '¡GUAU!', size: 'medium', color: '#f2c14e', rotate: -8 }],
        },
      ],
    },
    {
      objective: 'Cliffhanger del segmento 2: Lu empieza a apagarse y su foto muestra al padre de Nina.',
      summary: 'De regreso, Lu se vuelve traslúcida en los bordes. Se le cae una foto gastada: un cartero con una nena en brazos. Nina reconoce la gorra rota. Es Tomás.',
      tone: 'Escalofrío, giro.',
      composition: 'Escalera: Lu translúcida, la foto cayendo, y abajo la foto en grande con la cara de Nina en el borde. Corte seco.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'street', time: 'night', chars: [{ id: 'lu', expr: 'scared', pose: 'stand', framing: 'half', x: 0.5 }], extras: ['bubbles-soft'] },
          lines: [{ who: 'lu', kind: 'whisper', text: 'Nina... no me siento los dedos.' }],
        },
        {
          shot: { bg: 'street', time: 'night', prop: 'photo', extras: ['wind'] },
          sfx: [{ text: 'fwip', size: 'small' }],
        },
        {
          shot: { bg: 'street', time: 'night', chars: [{ id: 'nina', expr: 'shocked', pose: 'hold', framing: 'face', x: 0.75, flip: true }], prop: 'photo', extras: ['glow'] },
          lines: [{ who: 'nina', kind: 'thought', text: 'Esa gorra con la visera rota...' }, { who: 'nina', kind: 'whisper', text: '...Papá.' }],
          fx: 'focuslines',
        },
      ],
    },

    // ───────────── SEGMENTO 3 · LA NENA QUE NO SE DESPIDIÓ (13–18) ─────────────
    {
      objective: 'Nina tantea a Ezequiel con la foto; él esquiva y la manda a una nueva entrega.',
      summary: 'Nina deja la foto sobre el mostrador. Ezequiel la mira demasiado tiempo, se empañan los anteojos y le entrega un sobre infantil: «Clara Medina. Retiro a domicilio».',
      tone: 'Tensión tibia, silencios.',
      composition: 'Detalle chico arriba (la foto sobre el mostrador). Grande abajo: el duelo de miradas con el mostrador en el medio.',
      layout: BREATH_TOP,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', prop: 'photo', extras: ['glow'] },
        },
        {
          shot: {
            bg: 'post-office', time: 'night',
            chars: [
              { id: 'nina', expr: 'serious', pose: 'hands-hips', framing: 'half', x: 0.28 },
              { id: 'ezequiel', expr: 'sad', pose: 'hold', framing: 'half', x: 0.72, flip: true },
            ],
          },
          lines: [
            { who: 'nina', kind: 'dialogue', text: '¿La reconocés? Yo sí.' },
            { who: 'ezequiel', kind: 'dialogue', text: 'Tiene un retiro a domicilio. Clara Medina. Diez años.' },
            { who: 'nina', kind: 'dialogue', text: 'Esto no terminó.' },
          ],
        },
      ],
    },
    {
      objective: 'Presentar a Clara y su herida: no se despidió de su abuela.',
      summary: 'Nina flota con Pato hasta la ventana de un sexto piso. Clara, con un buzo rosa gigante, le da la carta con la cara dura: «Técnicamente no estoy triste».',
      tone: 'Ternura con humor.',
      composition: 'Ancho de la ciudad con la ventana iluminada; inset de Clara en la ventana; remate con la carta pasando de mano en mano.',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'city-night', time: 'night', angle: 'low', chars: [{ id: 'pato', expr: 'happy', pose: 'fly', framing: 'full', x: 0.6, scale: 0.4 }], extras: ['stars'] },
          lines: [{ who: 'pato', kind: 'dialogue', text: 'Sexto piso, ventana con stickers. ¡Retiro!' }],
        },
        {
          shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'clara', expr: 'serious', pose: 'arms-crossed', framing: 'half', x: 0.4 }, { id: 'nina', expr: 'happy', pose: 'wave', framing: 'bust', x: 0.85, flip: true }] },
          lines: [
            { who: 'clara', kind: 'dialogue', text: 'Es para mi abuela Pocha. Técnicamente no estoy triste.' },
            { who: 'nina', kind: 'dialogue', text: 'Técnicamente, anotado.' },
          ],
        },
        {
          shot: { bg: 'bedroom', time: 'night', prop: 'hand', extras: ['glow'] },
          lines: [{ who: 'clara', kind: 'whisper', text: 'No me despedí. Estaba enojada por una pavada.' }],
        },
      ],
    },
    {
      objective: 'Pausa intencional: la casa de la abuela está casi apagada. Plantear el problema.',
      summary: 'En el Barrio, la casa de la abuela Pocha es la más oscura de la cuadra: una sola luz débil. Lu, todavía traslúcida, explica que así se ve un recuerdo que alguien evita.',
      tone: 'Triste, quieto.',
      composition: 'PAUSA: imagen alta de una calle donde todas las ventanas brillan menos una. Texto mínimo abajo de la imagen.',
      layout: TALL,
      panels: [
        {
          shot: {
            bg: 'moon-town', time: 'night', angle: 'high',
            chars: [
              { id: 'nina', expr: 'sad', pose: 'stand', framing: 'back', x: 0.35, scale: 0.6 },
              { id: 'lu', expr: 'sad', pose: 'stand', framing: 'back', x: 0.55, scale: 0.5 },
            ],
            extras: ['stars', 'snow'],
            prop: 'lamp',
          },
          lines: [
            { who: 'lu', kind: 'dialogue', text: 'No es que la olvidó. Es que no quiere pensarla.' },
            { who: 'lu', kind: 'dialogue', text: 'Duele igual, ¿no?' },
          ],
        },
      ],
      notes: 'La nieve suave es la única vez que nieva en el Barrio: marca el frío del recuerdo evitado.',
    },
    {
      objective: 'Escena clave: Clara cuenta un recuerdo en voz alta y la abuela recupera la cara.',
      summary: 'Nina vuelve volando a la ventana. Le pide a Clara que no escriba: que cuente. Clara, entre lágrimas, cuenta cómo la abuela le trenzaba el pelo cantando mal. Lejos, en el Barrio, la ventana se enciende.',
      tone: 'Catarsis tierna.',
      composition: 'Dos ritmos con hueco largo: Clara contando con la voz quebrada; abajo, la casa del Barrio encendiéndose. El hueco une los dos mundos.',
      layout: TWO_GAP,
      panels: [
        {
          shot: { bg: 'bedroom', time: 'night', chars: [{ id: 'clara', expr: 'crying', pose: 'sit', framing: 'bust', x: 0.4 }, { id: 'nina', expr: 'sad', pose: 'kneel', framing: 'bust', x: 0.8, flip: true }], extras: ['tears'] },
          lines: [
            { who: 'nina', kind: 'dialogue', text: 'No la escribas. Contámela.' },
            { who: 'clara', kind: 'dialogue', text: 'Me hacía las trenzas cantando re mal. Y yo me reía.' },
          ],
        },
        {
          shot: { bg: 'moon-town', time: 'night', extras: ['glow', 'sparkles', 'petals'], prop: 'lamp' },
          lines: [{ kind: 'narration', text: 'En el Barrio Lunar, una ventana volvió a tener cara.' }],
          sfx: [{ text: 'tlin', size: 'small', color: '#f2c14e' }],
        },
      ],
    },
    {
      objective: 'Cierre de la entrega y espejo para Nina: ella también evitó recordar.',
      summary: 'Nina entrega la carta de Clara a la abuela, que ahora sonríe en la puerta (como una silueta cálida). Pato le pregunta a Nina cuándo fue la última vez que contó algo de su papá. Nina no contesta.',
      tone: 'Agridulce.',
      composition: 'Inset: la puerta con la silueta de la abuela recibiendo la carta. Ancho grande: Nina y Pato en el escalón. Remate: la cara de Nina en silencio.',
      layout: THREE_B,
      panels: [
        {
          shot: { bg: 'moon-town', time: 'night', prop: 'letter', extras: ['glow'] },
          lines: [{ kind: 'caption', text: '«Gracias, mi amor. Las trenzas te salían torcidas igual.»' }],
        },
        {
          shot: { bg: 'moon-town', time: 'night', chars: [{ id: 'nina', expr: 'tired', pose: 'sit', framing: 'full', x: 0.35 }, { id: 'pato', expr: 'thinking', pose: 'stand', framing: 'full', x: 0.62, scale: 0.4 }], extras: ['stars'] },
          lines: [{ who: 'pato', kind: 'dialogue', text: '¿Cuándo contaste algo de tu papá en voz alta por última vez?' }],
        },
        {
          shot: { bg: 'moon-town', time: 'night', chars: [{ id: 'nina', expr: 'sad', pose: 'sit', framing: 'face', x: 0.5 }] },
        },
      ],
      notes: 'El remate sin texto es intencional: la respuesta es el silencio.',
    },
    {
      objective: 'Cliffhanger del segmento 3: una segunda carta del padre señala a Ezequiel.',
      summary: 'Una carta cae del cielo sobre el escalón, más corta que la primera, con la letra temblorosa: «Ezequiel sabe dónde estoy. Preguntale por la Regla Trece».',
      tone: 'Urgencia, misterio.',
      composition: 'Imagen alta de la carta cayendo entre estrellas (el scroll la acompaña en la caída). Remate abajo: la frase final en primer plano.',
      layout: TALL_TAG,
      panels: [
        {
          shot: { bg: 'sky-night', time: 'night', angle: 'low', chars: [{ id: 'nina', expr: 'surprised', pose: 'reach', framing: 'half', x: 0.5 }], extras: ['stars', 'glow'], prop: 'letter' },
          sfx: [{ text: 'fsss', size: 'small', color: '#f7d774' }],
        },
        {
          shot: { bg: 'white', time: 'night', prop: 'letter', extras: ['glow'] },
          lines: [{ kind: 'caption', text: '«Ezequiel sabe dónde estoy. Preguntale por la Regla Trece.»' }],
          fx: 'focuslines',
        },
      ],
    },

    // ───────────── SEGMENTO 4 · LA REGLA TRECE (19–24) ─────────────
    {
      objective: 'Confrontación: Nina encara a Ezequiel con el cajón abierto.',
      summary: 'Nina vuelca las cartas retenidas sobre el escritorio. Ezequiel no grita: se sienta y saca el reglamento.',
      tone: 'Enojo y miedo.',
      composition: 'Escalera: las cartas cayendo sobre el escritorio; Nina gritando; Ezequiel sentándose, vencido.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', prop: 'letter', extras: ['wind'] },
          sfx: [{ text: 'fshhh', size: 'medium' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'nina', expr: 'furious', pose: 'point', framing: 'half', x: 0.5 }], extras: ['shadow-face'] },
          lines: [
            { who: 'nina', kind: 'shout', text: '¡Tres años! ¡Tres años haciéndome creer que estaba muerto!' },
            { who: 'nina', kind: 'shout', text: '¿Qué es la Regla Trece?' },
          ],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'ezequiel', expr: 'tired', pose: 'sit', framing: 'half', x: 0.5 }], prop: 'note' },
          lines: [{ who: 'ezequiel', kind: 'dialogue', text: 'Sentate, Nina. Por favor.' }],
        },
      ],
    },
    {
      objective: 'La gran explicación: Tomás no murió, se quedó en el Barrio pasado el alba.',
      summary: 'Ezequiel cuenta: hace tres años Tomás se quedó para entregar una carta urgente y lo agarró el alba. Desde entonces se está volviendo recuerdo. La Regla Trece obliga a retener sus cartas: quien las lee quiere cruzar y no vuelve.',
      tone: 'Confesión grave, pena.',
      composition: 'Flashback en ancho (Tomás en el puente con el sol saliendo), inset del reglamento abierto, remate con Ezequiel diciendo la promesa.',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'bridge', time: 'sunset', chars: [{ id: 'tomas', expr: 'determined', pose: 'run', framing: 'full', x: 0.5 }], extras: ['glow', 'dust'] },
          lines: [{ who: 'ezequiel', kind: 'caption', text: 'Se quedó a entregar una carta que no podía esperar. Lo agarró el alba.' }],
          fx: 'screentone',
        },
        {
          shot: { bg: 'post-office', time: 'night', prop: 'note', extras: ['glow'] },
          lines: [{ kind: 'caption', text: 'Regla 13: Las cartas de quien se vuelve recuerdo se retienen.' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'ezequiel', expr: 'crying', pose: 'sit', framing: 'bust', x: 0.5 }], extras: ['tears'] },
          lines: [
            { who: 'ezequiel', kind: 'dialogue', text: 'Quien las lee cruza a buscarlo. Y no vuelve.' },
            { who: 'ezequiel', kind: 'dialogue', text: 'Se lo prometí a él: que vos no.' },
          ],
        },
      ],
      notes: 'El flashback va en tono sepia (screentone) para separarlo del presente.',
    },
    {
      objective: 'Pausa intencional: el silencio de Nina después de la verdad.',
      summary: 'Nina sale a la vereda. La ciudad duerme. Pato se le posa en el hombro y apaga su luz para no molestar.',
      tone: 'Silencio, duelo nuevo.',
      composition: 'PAUSA: una sola imagen alta, Nina pequeña en la vereda bajo un cielo enorme. Sin diálogos: solo una línea de narración.',
      layout: TALL,
      panels: [
        {
          shot: {
            bg: 'city-night', time: 'night', angle: 'high',
            chars: [
              { id: 'nina', expr: 'sad', pose: 'stand', framing: 'full', x: 0.5, scale: 0.5 },
              { id: 'pato', expr: 'sad', pose: 'stand', framing: 'full', x: 0.56, scale: 0.25 },
            ],
            extras: ['stars'],
          },
          lines: [{ kind: 'narration', text: 'Durante tres años lo extrañé como a un muerto. Estaba vivo. Y olvidándose.' }],
        },
      ],
      notes: 'Pausa de ritmo deliberada después del bloque más denso de información.',
    },
    {
      objective: 'Elevar la urgencia: las cartas se acortan; la última está en blanco.',
      summary: 'Nina ordena las cartas por fecha. Cada una es más corta. La última dice solo «Lu...» y el resto en blanco. Nina entiende que su padre está a punto de olvidarla.',
      tone: 'Angustia creciente.',
      composition: 'Tres ritmos: abanico de cartas (de largas a cortas), inset de la última carta casi vacía, remate de la cara de Nina decidida.',
      layout: THREE_B,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', prop: 'letter', extras: ['glow'] },
          lines: [{ kind: 'narration', text: 'Primero páginas. Después párrafos. Después renglones.' }],
        },
        {
          shot: { bg: 'white', time: 'night', prop: 'letter' },
          lines: [{ kind: 'caption', text: '«Lu...»' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'nina', expr: 'determined', pose: 'fist', framing: 'face', x: 0.5 }] },
          lines: [{ who: 'nina', kind: 'dialogue', text: 'Se está olvidando de mí. Voy a buscarlo.' }],
        },
      ],
    },
    {
      objective: 'Lu se une al viaje; se plantea la conexión Lu/«Lunita» sin revelarla.',
      summary: 'Lu aparece en la puerta del Correo, más traslúcida. Al oír «Lu...», se toca el pecho: «Eso suena a mí». Insiste en ir. Nina acepta.',
      tone: 'Calidez, presagio.',
      composition: 'Detalle chico arriba (los pies descalzos de Lu en el umbral). Grande abajo: Lu y Nina frente a frente, Pato entre las dos.',
      layout: BREATH_TOP,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'lu', expr: 'shy', pose: 'stand', framing: 'full', x: 0.5, scale: 0.7 }], extras: ['bubbles-soft'] },
        },
        {
          shot: {
            bg: 'post-office', time: 'night',
            chars: [
              { id: 'lu', expr: 'determined', pose: 'reach', framing: 'half', x: 0.28 },
              { id: 'pato', expr: 'surprised', pose: 'fly', framing: 'bust', x: 0.5, scale: 0.5 },
              { id: 'nina', expr: 'surprised', pose: 'stand', framing: 'half', x: 0.75, flip: true },
            ],
            extras: ['glow'],
          },
          lines: [
            { who: 'lu', kind: 'dialogue', text: '«Lu...». Eso suena a mí. No sé por qué.' },
            { who: 'lu', kind: 'dialogue', text: 'Voy con vos. Antes de apagarme del todo.' },
          ],
        },
      ],
    },
    {
      objective: 'Cliffhanger del segmento 4: Ezequiel entrega la llave y empieza la cuenta regresiva.',
      summary: 'Ezequiel le da su vieja llave del andén: «Volvé antes del alba. Él no pudo». Afuera la luna ya empieza a bajar y desde el Barrio suena el silbato del último tren.',
      tone: 'Tensión, despedida.',
      composition: 'Escalera: la llave en la mano de Ezequiel, la mano de Nina tomándola, y abajo la luna bajando con el silbato atravesando la viñeta.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'ezequiel', expr: 'serious', pose: 'reach', framing: 'bust', x: 0.5 }], prop: 'key' },
          lines: [{ who: 'ezequiel', kind: 'dialogue', text: 'La llave del andén. Volvé antes del alba. Él no pudo.' }],
        },
        {
          shot: { bg: 'post-office', time: 'night', chars: [{ id: 'nina', expr: 'determined', pose: 'hold', framing: 'bust', x: 0.5 }], prop: 'key', extras: ['glow'] },
          lines: [{ who: 'nina', kind: 'dialogue', text: 'Llega siempre.' }],
        },
        {
          shot: { bg: 'sky-night', time: 'night', extras: ['stars', 'smoke'], prop: 'moon' },
          lines: [{ kind: 'narration', text: 'La luna empezó a bajar.' }],
          sfx: [{ text: 'FIIIIUUU', size: 'big', color: '#cdd6ff', rotate: -6 }],
        },
      ],
    },

    // ───────────── SEGMENTO 5 · ESTACIÓN LUNAR (25–30) ─────────────
    {
      objective: 'Arranca la carrera: cruce del Barrio hacia la Estación Lunar.',
      summary: 'Nina, Lu y Pato corren por las calles del Barrio. Los recuerdos vecinos les abren paso; Elena (una luz) y la abuela Pocha (una silueta) los saludan desde las ventanas.',
      tone: 'Épico y tierno.',
      composition: 'Imagen alta en diagonal: los tres corriendo hacia arriba por una escalera del Barrio. Remate: ventanas encendidas que saludan.',
      layout: TALL_TAG,
      panels: [
        {
          shot: {
            bg: 'moon-town', time: 'night', angle: 'low',
            chars: [
              { id: 'nina', expr: 'determined', pose: 'run', framing: 'full', x: 0.35 },
              { id: 'lu', expr: 'determined', pose: 'run', framing: 'full', x: 0.6, scale: 0.8 },
              { id: 'pato', expr: 'determined', pose: 'fly', framing: 'full', x: 0.8, scale: 0.4 },
            ],
            extras: ['stars', 'wind'],
          },
          lines: [{ who: 'pato', kind: 'shout', text: '¡Urgente! ¡Paso, paso, que llevamos una urgente!' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'moon-town', time: 'night', extras: ['glow', 'sparkles'], prop: 'lamp' },
          lines: [{ kind: 'caption', text: '«¡Llega siempre, cartera!»' }],
        },
      ],
    },
    {
      objective: 'Mostrar la Estación Lunar y el costo del olvido; Lu se apaga más.',
      summary: 'El andén está lleno de recuerdos sin cara, sentados, esperando. Lu se vuelve casi transparente. Nina la toma de la mano para que no se pierda.',
      tone: 'Inquietante, triste.',
      composition: 'Ancho grande del andén con siluetas grises (el scroll lo recorre), hueco, abajo las manos de Nina y Lu entrelazadas.',
      layout: TWO_GAP,
      panels: [
        {
          shot: { bg: 'station', time: 'night', angle: 'high', chars: [{ id: 'nina', expr: 'scared', pose: 'stand', framing: 'back', x: 0.5, scale: 0.6 }], extras: ['smoke', 'stars'] },
          lines: [{ kind: 'narration', text: 'Estación Lunar. Acá esperan los que ya nadie nombra.' }],
        },
        {
          shot: { bg: 'station', time: 'night', prop: 'hand', extras: ['glow', 'bubbles-soft'] },
          lines: [
            { who: 'lu', kind: 'whisper', text: 'No me sueltes. Me estoy yendo.' },
            { who: 'nina', kind: 'dialogue', text: 'No te suelto.' },
          ],
        },
      ],
    },
    {
      objective: 'El reencuentro que duele: Tomás no reconoce a Nina.',
      summary: 'Al final del andén, un cartero de uniforme desteñido escribe sobre su rodilla una carta en blanco. Levanta la vista hacia Nina con amabilidad vacía: «¿Tiene algo para mí, señorita?».',
      tone: 'Desgarro contenido.',
      composition: 'Detalle chico arriba: la gorra con la visera rota. Grande abajo: Tomás sentado mirando a Nina sin reconocerla, ella de pie.',
      layout: BREATH_TOP,
      panels: [
        {
          shot: { bg: 'station', time: 'night', prop: 'note', extras: ['glow'] },
          lines: [{ who: 'nina', kind: 'thought', text: 'La visera rota.' }],
        },
        {
          shot: {
            bg: 'station', time: 'night',
            chars: [
              { id: 'tomas', expr: 'neutral', pose: 'sit', framing: 'half', x: 0.3 },
              { id: 'nina', expr: 'crying', pose: 'stand', framing: 'half', x: 0.74, flip: true },
            ],
            extras: ['smoke'],
          },
          lines: [
            { who: 'nina', kind: 'dialogue', text: 'Papá. Soy yo.' },
            { who: 'tomas', kind: 'dialogue', text: '¿Tiene algo para mí, señorita? Estoy esperando una carta.' },
          ],
        },
      ],
    },
    {
      objective: 'Intento fallido: las propias cartas no alcanzan.',
      summary: 'Nina le lee sus cartas, una tras otra. Tomás sonríe cortés, como quien escucha a una extraña. El reloj de la estación marca las 5:40.',
      tone: 'Desesperación.',
      composition: 'Tres ritmos: Nina leyendo; Tomás sonriendo vacío; remate con el reloj (presión del tiempo).',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'station', time: 'night', chars: [{ id: 'nina', expr: 'crying', pose: 'hold', framing: 'bust', x: 0.5 }], prop: 'letter', extras: ['tears'] },
          lines: [{ who: 'nina', kind: 'dialogue', text: '«Te quiero de acá a la luna, ida y vuelta». ¡Lo escribiste vos!' }],
        },
        {
          shot: { bg: 'station', time: 'night', chars: [{ id: 'tomas', expr: 'happy', pose: 'sit', framing: 'bust', x: 0.5 }] },
          lines: [{ who: 'tomas', kind: 'dialogue', text: 'Qué lindo. Alguien la quería mucho a esa chica.' }],
        },
        {
          shot: { bg: 'station', time: 'night', prop: 'clock', extras: ['smoke'] },
          lines: [{ kind: 'caption', text: '5:40' }],
          sfx: [{ text: 'tic tac', size: 'small' }],
        },
      ],
    },
    {
      objective: 'GRAN REVELACIÓN: Lu es el recuerdo que Tomás guardaba de Nina de chiquita.',
      summary: 'Lu, casi invisible, se adelanta y le muestra la foto. Tomás la mira, la mira a ella, y por primera vez sus ojos se encienden: «¿Lunita?». Lu brilla de golpe con todo su color.',
      tone: 'Revelación luminosa, llanto.',
      composition: 'Una sola imagen alta: Lu frente a Tomás, la foto entre ellos, Nina atrás comprendiendo. El scroll llega al «¿Lunita?» en el centro exacto del tramo.',
      layout: TALL,
      panels: [
        {
          shot: {
            bg: 'station', time: 'night',
            chars: [
              { id: 'tomas', expr: 'surprised', pose: 'reach', framing: 'half', x: 0.25 },
              { id: 'lu', expr: 'crying', pose: 'hold', framing: 'full', x: 0.55 },
              { id: 'nina', expr: 'shocked', pose: 'stand', framing: 'half', x: 0.85, flip: true },
            ],
            extras: ['glow', 'sparkles', 'stars'],
            prop: 'photo',
          },
          lines: [
            { who: 'tomas', kind: 'dialogue', text: '¿...Lunita?' },
            { who: 'nina', kind: 'thought', text: 'Así me decía a mí. Cuando tenía cinco años.' },
            { who: 'lu', kind: 'shout', text: '¡Ese es mi nombre!' },
          ],
          fx: 'focuslines',
        },
      ],
      notes: 'Clímax emocional. Lu pasa de traslúcida a color pleno en esta única imagen.',
    },
    {
      objective: 'Cliffhanger del segmento 5: el alba alcanza a Nina.',
      summary: 'Tomás abraza a Lu y mira a Nina: la reconoce. Pero un hilo de luz rosa entra por el andén y las manos de Nina empiezan a brillar como las de un recuerdo.',
      tone: 'Alegría que se corta en pánico.',
      composition: 'Escalera: Tomás reconociendo a Nina; la primera luz del alba en el andén; abajo, primer plano de las manos de Nina volviéndose luz. Corte.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'station', time: 'night', chars: [{ id: 'tomas', expr: 'crying', pose: 'reach', framing: 'bust', x: 0.5 }], extras: ['tears', 'glow'] },
          lines: [{ who: 'tomas', kind: 'dialogue', text: 'Flaca... estás enorme. ¿Qué hacés acá?' }],
        },
        {
          shot: { bg: 'station', time: 'sunset', extras: ['glow', 'dust'] },
          lines: [{ kind: 'narration', text: 'Entonces entró la primera luz.' }],
        },
        {
          shot: { bg: 'station', time: 'sunset', prop: 'hand', extras: ['sparkles', 'glow'] },
          lines: [{ who: 'nina', kind: 'thought', text: 'Mis manos... brillan como las de ellos.' }],
          fx: 'gradient-tone',
        },
      ],
    },

    // ───────────── SEGMENTO 6 · LLEGA SIEMPRE (31–34) ─────────────
    {
      objective: 'La decisión del padre: la empuja a volver y le pide un trato.',
      summary: 'Tomás entiende. No puede volver, pero ahora recuerda. Le pide a Nina que se vaya ya y que le escriba todas las noches: «Si vos me nombrás, yo no me apago». Lu decide quedarse con él hasta que Nina vuelva.',
      tone: 'Despedida valiente.',
      composition: 'Ancho: abrazo de los tres. Inset: la gorra rota pasando de la cabeza de Tomás a la de Nina. Remate: Lu soltando la mano de Nina.',
      layout: THREE,
      panels: [
        {
          shot: { bg: 'station', time: 'sunset', chars: [{ id: 'tomas', expr: 'happy', pose: 'hold', framing: 'half', x: 0.35 }, { id: 'nina', expr: 'crying', pose: 'hold', framing: 'half', x: 0.65, flip: true }], extras: ['glow', 'tears'] },
          lines: [
            { who: 'tomas', kind: 'dialogue', text: 'Escribime todas las noches. Si vos me nombrás, yo no me apago.' },
            { who: 'nina', kind: 'dialogue', text: 'Todas. Te lo juro.' },
          ],
        },
        {
          shot: { bg: 'station', time: 'sunset', prop: 'helmet', extras: ['sparkles'] },
          lines: [{ who: 'tomas', kind: 'dialogue', text: 'Llevate la gorra. Para que no te pierdas.' }],
        },
        {
          shot: { bg: 'station', time: 'sunset', chars: [{ id: 'lu', expr: 'happy', pose: 'wave', framing: 'half', x: 0.5 }], extras: ['glow'] },
          lines: [{ who: 'lu', kind: 'dialogue', text: 'Yo lo cuido. ¡Corré, Nina!' }],
        },
      ],
      notes: 'Se usa la prop "helmet" como la gorra de cartero en primer plano.',
    },
    {
      objective: 'Corrida final contra el alba por el Puente de Nácar.',
      summary: 'Nina corre por el puente que se deshace en neblina. Pato crece, brilla al máximo y la levanta en vuelo el último tramo. Del otro lado, Ezequiel la espera con los brazos abiertos.',
      tone: 'Adrenalina y alivio.',
      composition: 'Escalera descendente que acelera el scroll: corrida, vuelo con Pato enorme, aterrizaje en brazos de Ezequiel.',
      layout: STAIRS,
      panels: [
        {
          shot: { bg: 'bridge', time: 'sunset', chars: [{ id: 'nina', expr: 'determined', pose: 'run', framing: 'full', x: 0.5 }], extras: ['wind', 'glow'] },
          lines: [{ who: 'nina', kind: 'thought', text: 'Ida y vuelta. Ida y vuelta.' }],
          fx: 'speedlines',
        },
        {
          shot: { bg: 'sunset', time: 'sunset', chars: [{ id: 'pato', expr: 'determined', pose: 'fly', framing: 'full', x: 0.55, scale: 1.6 }, { id: 'nina', expr: 'surprised', pose: 'fly', framing: 'full', x: 0.45, scale: 0.8 }], extras: ['glow', 'sparkles', 'wind'] },
          lines: [{ who: 'pato', kind: 'shout', text: '¡ENTREGA EXPRESS!' }],
          sfx: [{ text: 'FWOOSH', size: 'big', color: '#ff9f43', rotate: -10 }],
        },
        {
          shot: { bg: 'street', time: 'sunset', chars: [{ id: 'ezequiel', expr: 'crying', pose: 'hold', framing: 'half', x: 0.4 }, { id: 'nina', expr: 'crying', pose: 'hold', framing: 'half', x: 0.6, flip: true }], extras: ['glow', 'tears'] },
          lines: [{ who: 'ezequiel', kind: 'dialogue', text: 'Volviste. Volviste...' }],
        },
      ],
    },
    {
      objective: 'Epílogo cálido: la nueva rutina y los ecos de cada entrega.',
      summary: 'Semanas después. Nina escribe cada noche antes de su turno. Ezequiel le sella las cartas sin preguntar. Aurelio pasea con Canela en sueños, Clara se hizo trenzas sola.',
      tone: 'Paz, ternura.',
      composition: 'Detalle chico arriba (la gorra rota colgada en la puerta del departamento). Grande abajo: el Correo al anochecer, Nina y Ezequiel sellando juntos, Pato durmiendo en un casillero.',
      layout: BREATH_TOP,
      panels: [
        {
          shot: { bg: 'apartment', time: 'sunset', prop: 'helmet', extras: ['glow'] },
          lines: [{ kind: 'narration', text: 'Ahora le escribo todas las noches. Le cuento todo. En voz alta, también.' }],
        },
        {
          shot: {
            bg: 'post-office', time: 'night',
            chars: [
              { id: 'nina', expr: 'happy', pose: 'hold', framing: 'half', x: 0.3 },
              { id: 'ezequiel', expr: 'happy', pose: 'hold', framing: 'half', x: 0.7, flip: true },
              { id: 'pato', expr: 'tired', pose: 'sit', framing: 'full', x: 0.52, scale: 0.35 },
            ],
            extras: ['glow', 'petals'],
          },
          lines: [
            { who: 'ezequiel', kind: 'dialogue', text: 'Destino: Estación Lunar. Sello: Llega siempre.' },
            { who: 'nina', kind: 'dialogue', text: 'Y la respuesta llega igual. Cada mañana, más larga.' },
          ],
        },
      ],
    },
    {
      objective: 'Cierre emocional + gancho final: una carta desde un barrio que no existía.',
      summary: 'Nina abre la respuesta de su padre: un dibujo de Lu y él en el andén, saludando. Sonríe. Pero Pato trae otra carta, cálida al tacto: «Para Lunita. De: mamá». Matasellos: Barrio del Sol.',
      tone: 'Plenitud que se abre a un nuevo misterio.',
      composition: 'Ancho: Nina en la terraza al amanecer con la carta del padre (cierre emocional). Hueco largo de calma. Abajo: la nueva carta con el matasellos dorado; el scroll termina en la pregunta.',
      layout: TWO_GAP,
      panels: [
        {
          shot: { bg: 'sunset', time: 'sunset', chars: [{ id: 'nina', expr: 'happy', pose: 'hold', framing: 'half', x: 0.5 }], extras: ['glow', 'petals'], prop: 'letter' },
          lines: [
            { kind: 'caption', text: '«Lunita y yo te esperamos en el andén. Traé medialunas. — Papá»' },
            { kind: 'narration', text: 'Lo que se recuerda no se apaga.' },
          ],
        },
        {
          shot: { bg: 'sunset', time: 'sunset', chars: [{ id: 'pato', expr: 'surprised', pose: 'hold', framing: 'full', x: 0.5, scale: 0.7 }], extras: ['glow', 'sparkles'], prop: 'letter' },
          lines: [
            { kind: 'caption', text: '«Para Lunita. De: mamá.» — Matasellos: BARRIO DEL SOL' },
            { who: 'nina', kind: 'thought', text: '¿...Hay otro barrio?' },
          ],
          sfx: [{ text: 'tlin', size: 'small', color: '#ffb347' }],
        },
      ],
      notes: 'El matasellos dorado y cálido contrasta con todo el azul lunar de la obra: promesa visual de una segunda temporada.',
    },
  ],
}
