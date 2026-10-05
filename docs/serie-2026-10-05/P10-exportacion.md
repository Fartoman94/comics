# P10 · Exportación

Rama: `feat/vs-p10-exportacion` (apilada sobre P09). Sin merge.

## Formatos
| Formato | Antes | Ahora |
|---|---|---|
| PNG página actual | sí (×2 fijo) | sí, con **resolución ×1/×2/×3** y **fondo transparente** opcional |
| JPG página actual | no | **nuevo**, con resolución y **calidad** |
| PDF completo | sí (pantalla / imprenta) | sí + **todas / actual / rango** |
| ZIP de páginas | PNG ×2, `titulo-001.png` | PNG o **JPG**, resolución, transparencia, todas/actual/rango y **nombres deterministas `pagina-001.png`, `pagina-002.png`…** |
| Webtoon, libro web, .vineta | sí | sin cambios |
| SVG | no | no se agregó: el render es en Konva/canvas y no hay una salida vectorial estable |

## Opciones (`opciones-exportacion`)
- **Páginas**: Todas, Actual o Rango (de/a). Un rango vacío da un error claro y no descarga nada.
- **Resolución**: ×1, ×2 o ×3, con el tamaño en píxeles a la vista.
- **Calidad JPG**: 50–100 %.
- **Fondo transparente** (PNG): no se pinta el color de la página. En JPG siempre va el fondo,
  porque el formato no admite transparencia.
- El resumen previo (archivos, dimensiones, peso aproximado) usa las opciones elegidas.

## PDF
- Mantiene la proporción (una página del PDF por página del proyecto, del tamaño del formato).
- Usa las mismas fuentes e imágenes que el lienzo, respeta el orden y declara lectura de derecha
  a izquierda en manga (ya estaba). Ahora también acepta un subconjunto de páginas.

## ZIP
- Los nombres van por posición en el proyecto, con al menos 3 dígitos: `pagina-001.png` …
  `pagina-120.png`. Exportar las páginas 2 y 3 da `pagina-002` y `pagina-003`, así se ordenan
  igual en cualquier sistema.

## UX
- Preparando → barra de progreso con N/M y Cancelar → lista final con tamaños, vista previa y
  "Descargar de nuevo"; o un error explicado. La interfaz no se congela: se dibuja una página
  por vez y se libera cada canvas.

## Validación contra el lienzo
- E2E: la página exportada en PNG ×1 se compara **píxel a píxel** (muestra de 1 de cada 37) con
  la capa de contenido del lienzo del editor. La página tiene globo con texto, forma girada,
  imagen recortada, viñeta con imagen encuadrada y un elemento oculto. Menos del 1 % de
  diferencia (sólo bordes con antialiasing): sin desplazamientos, fuentes, recortes ni bordes
  distintos.
- E2E por coordenadas:
  - lo **oculto no se exporta**;
  - el cuadrado girado 45° está donde lo dibuja el editor (Konva gira alrededor de la esquina);
  - el fondo transparente da alfa 0.

## Tests
- E2E `tests/e2e/p10-exportacion.spec.ts` (5):
  - PNG ×1: tamaño exacto, oculto, giro y transparencia;
  - JPG ×3 con calidad 70 % (firma JPEG, tamaño ×3, colores);
  - ZIP por rango en JPG con `pagina-002.jpg` y `pagina-003.jpg`, y PDF sólo de la actual;
  - rango vacío con error, luego PDF completo, sin tocar el proyecto ni el historial;
  - comparación exportado ⇄ lienzo.
- Tests existentes actualizados: preset "Páginas en imágenes" y nombres `pagina-00N.png`.

## Resultados
- lint: 0 errores · unit: 102/102 · E2E: 145/145 · build OK.
