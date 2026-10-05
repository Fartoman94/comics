# P05 · Globos, textos y onomatopeyas

Rama: `feat/vs-p05-globos-texto` (apilada sobre P04). Sin merge.

## Qué cambió

### Tipos de globo (9)
- Diálogo, Pensamiento, Grito y Susurro (ya existían).
- **Impacto** (nuevo): estallido de puntas largas y desparejas, amarillo y en Bangers.
- **Sin borde** (nuevo): no dibuja el contorno aunque tenga grosor.
- **Narrador**: el recuadro de narración de siempre. Se renombró la etiqueta, que antes decía
  "Narración".
- **Caja de narración** (nueva): caja con esquinas redondeadas.
- Recuadro nube (ya existía).
En Propiedades la forma se elige con una grilla visual (antes era un desplegable). Cambiar de
forma conserva texto y estilo: "Sin borde" apaga el contorno, al salir de él vuelve, y las cajas
quitan la cola.

### Edición
- Texto, fuente, tamaño, peso (negrita), color, alineación, fondo, borde, grosor, opacidad y
  margen interior ya existían.
- **Radio de las esquinas** (nuevo, para las cajas).
- Dimensiones y giro, en la sección de posición y tamaño.

### Cola
- Visible, editable y **arrastrable**: se lleva el punto naranja hacia el personaje y la cola
  se orienta sola.
- Nuevo: **ancho de la cola** (40 %–250 %).
- Los cuatro campos nuevos (`tailWidth`, `cornerRadius` y las dos formas) son opcionales y se
  validan en el `.vineta`. Los archivos viejos no cambian.

### Edición rápida
- Doble clic sobre un globo o texto edita en el lugar (ya existía).
- **Enter confirma, Shift+Enter agrega una línea y Esc cancela** (vuelve al texto anterior).
  Antes Esc confirmaba y había que usar Ctrl+Enter.
- Durante la composición IME (japonés, coreano, chino) Enter y Esc siguen siendo del IME.
- Ctrl+D duplica y Supr elimina. Atajos, ayuda y pista de contexto actualizados.

### Onomatopeyas
- Grupo nuevo **"Clásicas"**: BOOM, BANG, POW, CRASH, WHOOSH, ZAP, PUM, PAM, TAC y BRRR. Van en
  amarillo con contorno negro, sombra roja, inclinación y mayúsculas.
- Se puede editar texto, color, contorno, sombra, giro y escala (el marco cambia el cuerpo de
  letra).
- Siguen los grupos en japonés, coreano, chino y español.

## Bugs encontrados y corregidos
- **El marco de selección de los globos no coincidía con el globo.** En `main`, un globo de
  280×170 tenía un marco de 191×220: tomaba la caja del texto (más chica) estirada hasta la
  punta de la cola. Ahora el marco es exactamente el cuerpo del globo y la manija de la cola no
  cuenta para la caja.
- Esc durante la edición confirmaba en lugar de cancelar (no había forma de descartar lo escrito).

## Tests
- Unit `tests/unit/globos.test.ts` (3):
  - los 9 tipos con estilo coherente;
  - qué formas admiten cola y cuáles son caja;
  - caja de texto del estallido;
  - `.vineta` con las formas nuevas, el ancho de cola y el radio (los viejos siguen igual y se
    rechazan formas desconocidas).
- E2E `tests/e2e/p05-globos.spec.ts` (4):
  - insertar los 9 tipos y cambiar de forma desde Propiedades;
  - edición en el lugar (Enter, Shift+Enter, Esc) con deshacer y rehacer;
  - marco del tamaño real, arrastrar la cola y deshacer, ancho de cola, resize desde la esquina,
    Ctrl+D y Supr;
  - las 10 onomatopeyas clásicas: estilo, giro y persistencia al recargar.
- Tests existentes de IME y del globo con G actualizados a Enter = confirmar.

## Resultados
- lint: 0 errores · unit: 95/95 · E2E: 120/120 · build OK.
