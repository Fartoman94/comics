# Muestras premium de Viñeta Studio — Informe final

Rama: `feat/muestras-premium`, sobre `feat/tema-claro-oscuro` (PR #27) y `main` @ 6050503. **Sin merge.**
Fases: 1 auditoría (d79b5d3) · 2 preproducción (b7d7165) · 3 producción (14a11a6) · 4 revisión y 5 demo (este commit).

## 1. Las seis obras
| # | Obra | Género | Estilo / formato | Páginas | Viñetas | Globos | SFX | Ilustraciones |
|---|---|---|---|---|---|---|---|---|
| 1 | **VOLTAJE** — La noche de Puerto Faro | Superhéroes urbanos, acción, superación | Cómic occidental a color · us-comic · izq→der | 32 + portada | 126 | 163 | 38 | 126 |
| 2 | **KAZEKIRI** — El filo del aliento | Shonen: torneo, entrenamiento, rivalidad | Manga B/N con tramas · tankōbon · der→izq | 32 + portada | 114 | 128 | 48 | 114 |
| 3 | **EL INQUILINO DEL 7B** — La letra de la noche | Seinen: thriller psicológico | Manga B/N, negros y achurado · B5 · der→izq | 32 + portada | 152 | 178 | 18 | 145 |
| 4 | **PÉTALOS EN DIFERIDO** — Lo que se escucha con las manos | Shojo: romance dramático, música | Manga B/N, línea fina, flores · tankōbon · der→izq | 32 + portada | 114 | 135 | 30 | 114 |
| 5 | **LA CARTERA DE LA LUNA** — Correo nocturno para lo que no se olvida | Webtoon: fantasía cotidiana con misterio | Color suave · tira 800×2400 · vertical | 34 + portada | 81 | 99 | 17 | 81 |
| 6 | **ÓRBITA ESCARLATA** — El Custodio del Eje | Ciencia ficción dramática estilo anime | Color cel shading · A4 · izq→der | 34 + portada | 115 | 145 | 45 | 115 |

En total son **196 páginas, 702 viñetas, 848 globos, 196 onomatopeyas y 695 ilustraciones originales**.

### Resúmenes
- **VOLTAJE.** Tommy Ruiz es un electricista quebrado y bocón que absorbe un apagón saboteado
  y queda convertido en una batería humana. Lastima a los que quiere, aprende con Doña Rosa que
  la corriente "no se domina, se respeta" y se enfrenta a Marea Negra, una ingeniera con un
  motivo justo y métodos peligrosos. En la tormenta descubre que el intendente vendió las
  válvulas de seguridad.
- **KAZEKIRI.** Sora nació sin el sello que permite cortar el Viento. Se mete en el torneo de la
  Academia por una regla olvidada y su rival noble lo humilla. Entrena con un maestro ciego y
  manco, descubre que no le falta el sello sino la "cerradura" y gana el respeto de Rei. Una
  Tormenta Hueca devora la isla y un enmascarado le muestra el sello que le falta.
- **EL INQUILINO DEL 7B.** Un traductor insomne recibe notas con su propia letra que anuncian
  desgracias para el día siguiente. Cada intento de evitarlas lo aísla más. La verdad no es
  sobrenatural, y la última nota reabre todo.
- **PÉTALOS EN DIFERIDO.** Valeria, una pianista que se congeló en un concurso, conoce a Ian,
  un muralista hipoacúsico que escucha la música con las manos. Hay jacarandás, señas,
  malentendidos y una amiga que elige la verdad. En el Regional, la mano de Ian sobre el piano
  la descongela.
- **LA CARTERA DE LA LUNA.** Nina reparte cartas entre la ciudad y el Barrio Lunar, donde los
  recuerdos viven como personas. Hay seis entregas con su propia emoción, una carta de su padre
  desaparecido y una Regla Trece oculta.
- **ÓRBITA ESCARLATA.** En un anillo orbital dividido por la gravedad, una piloto con brazo
  mecánico despierta a un androide que guarda por qué el mundo pierde el eje. El clímax es un
  vuelo entre escombros y un sacrificio, y la última página muestra un segundo anillo que
  responde.

## 2. Qué demuestra cada obra y qué luce mejor del editor
| Obra | Demuestra | Mejor del editor |
|---|---|---|
| VOLTAJE | Cómic de acción a color | Splash y hero, onomatopeyas grandes con contorno y sombra, líneas de velocidad e impacto, narración en cajas, portada |
| KAZEKIRI | Manga shonen der→izq | Plantillas manga (diagonales, verticales), efectos de viento y energía, ritmo de pelea, yonkoma cómico |
| EL INQUILINO DEL 7B | Narrativa sobria y silencios | Grillas de 9 y franjas propias, primeros planos de ojos, narración interior, viñetas sin texto, objetos (nota, puerta, mirilla) |
| PÉTALOS EN DIFERIDO | Emoción y simbolismo | Composición aireada, fondos de flores y brillos, pensamiento interior, splash de confesión |
| LA CARTERA DE LA LUNA | Lectura vertical para el celular | Formato webtoon, pausas visuales, exportación por segmentos, color |
| ÓRBITA ESCARLATA | Marketing visual y mundo | Paneles anchos tipo cine, color con brillos, ciencia ficción, 5 splash |

**Para marketing, en este orden:** VOLTAJE (lo más llamativo a color), ÓRBITA ESCARLATA
(estética anime y ciencia ficción) y KAZEKIRI (manga reconocible).

## 3. Cómo se hicieron (100 % con el editor)
- **Preproducción:** cada obra es un archivo de datos (`src/samples/works/*.ts`) con ficha,
  biblia de personajes, mundo, estructura y guion por páginas, validado por
  `tests/unit/muestras.test.ts`. Los documentos `docs/muestras/<obra>/BIBLIA.md` y `GUION.md`
  se generan desde esa misma fuente (`node scripts/muestras-docs.mjs`).
- **Arte:** ilustraciones vectoriales originales de un motor propio (`src/samples/engine`),
  con un estilo por obra:
  - personajes consistentes (pelo, ojos, vestuario, accesorio y rasgos fijos por personaje),
    18 expresiones, 16 poses y 7 encuadres;
  - 60 escenarios con perspectiva y hora del día;
  - efectos y objetos.
  En blanco y negro se usan tramas reales; a color, sombra de celda.
- **Armado:** `buildWorkProject` usa las mismas piezas que una persona en el editor:
  - páginas con las plantillas del editor o viñetas propias;
  - cada ilustración como recurso del proyecto, encuadrada en su viñeta;
  - globos de 9 tipos, ajustados al texto con la tipografía real y orientados hacia quien habla;
  - narraciones, onomatopeyas, efectos (líneas, tramas) y la plantilla de portada.
  El resultado es un proyecto normal: se edita, se guarda, se lee y se exporta.
- **Vitrina:** "Muestras hechas con Viñeta Studio" en el inicio. Abrir una crea una copia
  editable en "Tus proyectos"; tarda entre 8 y 30 s y muestra el progreso.

## 4. Limitaciones del editor detectadas y qué se hizo
| Limitación | Estado |
|---|---|
| Colocar diálogos de a uno en páginas largas | **Resuelta:** "Colocar todo (N)" en el Guion |
| Globos que no se adaptan al texto | **Resuelta:** "Ajustar globo al texto" (y el constructor mide con Konva) |
| Sin plantilla de portada | **Resuelta:** plantilla inicial "Portada" |
| Una sola obra de ejemplo | **Resuelta:** galería de 6 muestras |
| El editor no dibuja ilustraciones (no hay generador de arte) | Pendiente por diseño: se resolvió con arte vectorial propio. Sería un plus una biblioteca de personajes reutilizables |
| Las miniaturas de 30+ páginas con filtros B/N tardan unos 9 s en segundo plano | Aceptable. Mejora futura: miniaturas progresivas por la página visible |
| La viñeta padre de un globo se deduce por geometría | Documentado en la auditoría final (P1: `parentId` opcional) |

## 5. Revisión (Fase 4)
Revisión automática de legibilidad sobre las 6 obras construidas (`buildWorkProject` + medición
con Konva):

| | Antes de corregir | Después |
|---|---|---|
| Globos con texto cortado | 0 | **0** |
| Globos fuera de su viñeta | 14 | **0** |
| Pares de globos encimados | 25 | **8** (de 848, entre viñetas diagonales vecinas) |

Correcciones aplicadas:
- búsqueda de lugar libre por viñeta en orden de lectura, achicando la letra si hace falta;
- letra según el ancho de la viñeta y ancho de carácter por tipografía;
- onomatopeyas debajo de los globos;
- noches en B/N menos cerradas y oscuros en trama densa en lugar de negro sólido;
- portadas con personajes en plano medio y subtítulos que entran;
- veladuras más suaves.

## 6. Testing
- `tests/unit/muestras.test.ts`: las 6 obras son válidas (30+ páginas, viñetas que coinciden con
  el layout, personajes, escenarios y textos dentro de los límites).
- `tests/e2e/muestras.spec.ts`: la galería muestra 6 portadas. Abrir una crea un proyecto de 30+
  páginas con todas las viñetas ilustradas y más de 40 globos, que se edita, se guarda y
  persiste al recargar.
- `tests/e2e/muestras-fase1.spec.ts`: "Colocar todo", "Ajustar globo al texto" y "Portada".
- Exportación real de las 6 obras (5 PDF + 1 webtoon en segmentos) y capturas.
- Suite completa: lint 0 errores · unit 112 · E2E 160 · build OK.

## 7. Entregables
- `~/Descargas/Vineta_Studio_Muestras_Premium_2026-10-05/`:
  - 5 PDF y 1 ZIP de webtoon;
  - `capturas/` con portada, página 1, página del medio y última página de cada obra;
  - `resumen.json`;
  - `docs/` con biblias, guiones, este informe y la auditoría de la Fase 1.
- En el repo: `docs/muestras/`.

## 8. Calidad honesta
El arte es vectorial y estilizado, coherente y legible, pero no es de ilustrador profesional:
las poses son limitadas, los personajes se ven siempre de frente y las manos son simples. La
narrativa, la diagramación, el rotulado y el uso del editor sí están al nivel de una obra real.
Para un lanzamiento comercial conviene reemplazar las ilustraciones por arte profesional,
manteniendo guiones, diagramación y rotulado tal como están.
