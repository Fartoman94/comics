# P04 · Imágenes, upload y galería

Rama: `feat/vs-p04-imagenes-galeria` (apilada sobre P03). Sin merge.

## Qué cambió

### Selector de imágenes (`images/ImagePicker.tsx`)
Un mismo selector con dos pestañas: **Subir imagen** y **Elegir de galería**. Se abre desde:
- el botón flotante **"Agregar imagen"** sobre la viñeta vacía seleccionada (nuevo);
- doble clic en una viñeta vacía;
- Propiedades → "Subir imagen o foto" / "Reemplazar" (viñeta e imagen libre);
- "Poner foto" del modo simple.
Arranca en Galería si el proyecto ya tiene imágenes y en Subir si no tiene.

**Subir**
- Zona para soltar o elegir archivos. Hay barra de progreso ("Subiendo "x" (2 de 5)") y botón
  **Cancelar**: corta entre archivos y lo ya importado queda.
- Lista de errores por archivo.
- Con una sola imagen se aplica directamente. Con varias (al insertar) se muestran para elegir.

**Galería**
- Imágenes del proyecto.
- Recientes de otros proyectos (de la biblioteca compartida).
- 7 **fondos incluidos**: cielo, atardecer, noche, papel, trama de puntos, rayos de impacto y
  líneas de velocidad. Se dibujan en el navegador con la proporción de la página y son
  deterministas, así que elegir dos veces el mismo no lo duplica.

### Validación real (`lib/imageValidation.ts`)
- El tipo se decide por los **bytes del archivo** (PNG, JPG, WebP, GIF), no por la extensión ni
  por lo que diga el navegador: un `.png` que en realidad es JPG se importa como JPG, y un
  `.png` que es texto se rechaza.
- **SVG rechazado** con un mensaje explícito: la app no tiene una sanitización segura de SVG.
  Antes se dejaba pasar por `image/*` y fallaba con "No se pudo leer".
- Tamaño máximo de 25 MB por archivo. Los vacíos se rechazan.
- Todos los `<input type=file>` de imágenes usan la lista de tipos aceptados.

### Imagen dentro de la viñeta
- Siempre queda contenida en el marco: recorte al polígono y, opcionalmente, al margen interior
  agregado en P03.
- Rellenar (cover) / Ajustar (contain). Encuadrar (mover y zoom con la rueda o el control
  deslizante).
- Nuevo: **girar 90°**, **espejo horizontal y vertical** y **Restablecer** (sin giro ni espejos,
  llenando el marco). El giro y el espejo se aplican alrededor del centro de la imagen.
  Rellenar y Ajustar tienen en cuenta el giro (una imagen vertical girada pasa a ser horizontal).
- **Reemplazar conserva filtros, giro y espejos.** El encuadre se recalcula para la imagen nueva.
- Arrastrar una imagen (desde la biblioteca o el escritorio) sobre una viñeta la asocia (ya existía).

### Persistencia
- La imagen de viñeta guarda posición, escala, filtros, giro y espejos (campos opcionales,
  validados en el `.vineta`; los archivos viejos siguen igual). La imagen libre guarda recorte,
  giro y espejos (ya existía).

## Bugs encontrados y corregidos
- Los SVG y los archivos disfrazados (texto con extensión `.png`) entraban al flujo de
  importación y fallaban con un error genérico.
- **Accesibilidad**: los controles segmentados (pestañas de Biblioteca, sentido de lectura,
  pincel, etc.) no anunciaban la opción elegida. Ahora usan `aria-pressed`.
- La etiqueta de selección repetía el tipo ("Viñeta · Viñeta 4"). Ahora dice "Viñeta 4".
- Los avisos (toasts) tapaban la tira de páginas en escritorio. Ahora se ubican por encima.

## Tests
- Unit `tests/unit/imagenes.test.ts` (6):
  - reconocimiento por bytes de los 4 formatos y de SVG;
  - rechazo de falsos, SVG, vacíos y archivos de más de 25 MB; un JPG con extensión `.png` se acepta;
  - cover/contain con giro;
  - reencajar conserva giro, espejo y filtros;
  - `fillPanel` reemplaza sin perder propiedades;
  - el `.vineta` guarda giro y espejo (y los archivos viejos siguen sin esos campos).
- E2E `tests/e2e/p04-imagenes.spec.ts` (5), con PNG reales generados en el navegador:
  - "Agregar imagen" → subir → cover contenido;
  - imágenes **chica (40×30), enorme (5000×2000 → 4096 px), vertical y horizontal**;
  - archivo falso y SVG rechazados sin crear recursos;
  - reemplazo desde la galería (fondo incluido y luego imagen del proyecto) conservando giro,
    espejo y filtros, Restablecer, y persistencia al recargar;
  - imagen libre: Reemplazar conserva posición, ancho y giro.
- Tests existentes ajustados: "Poner foto" (modo simple) ahora pasa por el selector, y el
  selector de `<input>` usa los tipos aceptados.

## Resultados
- lint: 0 errores · unit: 92/92 · E2E: 116/116 · build OK.
