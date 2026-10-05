# P03 · Viñetas y componentes hijos

Rama: `feat/vs-p03-vinetas-hijos` (apilada sobre P02). Sin merge.

## Qué cambió

### La viñeta como contenedor real
- **Arrastrar una viñeta se lleva su contenido** (globos, textos, imágenes, formas y efectos
  cuyo centro está dentro del polígono de la viñeta y por encima de ella). Un solo paso de
  historial para todo el grupo.
- **Ctrl/Cmd al arrastrar** = mover sólo el marco (para reacomodar sin tocar el contenido).
- Las **flechas** también mueven la viñeta con su contenido.
- Lo bloqueado u oculto no se arrastra con la viñeta.
- El documento sigue guardando los elementos planos por página: la relación padre/hijo se
  deduce (`lib/hierarchy.ts → withPanelContent`), así no cambia el formato `.vineta`.
- **Margen interior (padding)** de la viñeta: separa la imagen del borde (respeta esquinas
  redondeadas y polígonos). Campo opcional: los archivos viejos siguen igual.

### Componentes hijos
- Nuevo tipo **Forma** (`shape`) con 13 variantes:
  - Formas: rectángulo, elipse, triángulo, estrella, flecha y línea.
  - Símbolos de manga: corazón, vena de enojo, gota de sudor, exclamación, pregunta, nota
    musical y brillo.
  Se insertan desde Elementos → "Formas y símbolos" (también en el modo simple). Propiedades:
  tipo, relleno, contorno/color y grosor. Se exportan, se validan en el `.vineta` y se pueden
  copiar, duplicar, ordenar, ocultar y bloquear como cualquier elemento.
- Cada hijo: seleccionar, mover, redimensionar, duplicar, eliminar, **ocultar y bloquear desde
  Propiedades** (nuevo botón de ojo en la cabecera, con aviso "Oculto: no se ve ni se exporta")
  y cambiar de orden.
- Links: el proyecto no los soporta (no hay salida interactiva), no se agregaron.

### Selección
- **Etiqueta en el lienzo** con el tipo y el nombre del elemento seleccionado ("Forma · Corazón",
  🔒 si está bloqueado), arriba de su caja. Se oculta mientras se arrastra, recorta o escribe.
- Migas de pan Página › Viñeta › Elemento (P01).
- Doble clic: editar texto en globos/textos, encuadrar en viñetas con imagen, recortar imágenes.
- Eliminar una viñeta con contenido pide confirmación (P01).

## Bugs encontrados y corregidos
- **El marco de selección de los efectos manga y las capas de dibujo medía 0×0**: las manijas
  de tamaño y giro quedaban amontonadas en una esquina y no se podían usar. Verificado en
  `main` (efecto de líneas de impacto: ancho del transformador = 0). Causa: un `Konva.Shape`
  con `sceneFunc` propio sin `width/height` mide 0. Corregido dándoles su tamaño. Las formas
  nuevas también lo tienen.

## Tests
- Unit `tests/unit/vinetasHijos.test.ts` (4): las 13 formas se crean con caja y estilo,
  `traceShape` separa trazos y puntos, el `.vineta` acepta formas y padding y rechaza formas
  desconocidas (y un archivo viejo sin padding sigue sin padding), `withPanelContent` no suma
  lo bloqueado, lo oculto ni el contenido de otras viñetas.
- E2E `tests/e2e/p03-vinetas-hijos.spec.ts` (3): arrastrar una viñeta mueve su contenido y no
  otras viñetas, en un solo deshacer; Ctrl mueve sólo el marco; las flechas también llevan el
  contenido. Formas: insertar, cambiar tipo, caja de selección del tamaño real (forma y efecto)
  y etiqueta con el nombre. Hijo: duplicar, eliminar, ordenar, bloquear, ocultar (deja de
  dibujarse y sigue en Capas) y persistencia de oculto + padding + forma al recargar.

## Resultados
- lint: 0 errores · unit: 86/86 · E2E: 111/111 · build OK.
