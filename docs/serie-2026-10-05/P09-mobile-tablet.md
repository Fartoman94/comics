# P09 · Mobile y tablet

Rama: `feat/vs-p09-mobile-tablet` (apilada sobre P08). Sin merge.

## Celular (modo simple, por defecto < 768 px)
- **Barra inferior nueva, orientada a acciones**: **+ Agregar · Texto · Globo · Imagen · Viñeta · Más**.
  Antes eran cinco grupos (Páginas, Diseñar, Imágenes, Texto, Capas) más un botón "+" flotante.
  - + Agregar: menú rápido (globo, texto, foto, viñeta, dibujo, página).
  - Texto: hoja con textos y onomatopeyas; se inserta y se escribe.
  - Globo: hoja con los 9 tipos de globo; se inserta y se escribe.
  - Imagen: con una viñeta seleccionada la llena; si no, la agrega a la página. Siempre por el
    selector de P04 (subir o galería).
  - Viñeta: hoja con "Dibujar viñeta a mano" y las plantillas.
  - Más: Páginas, Imágenes y biblioteca, Formas y efectos, Capas, Guion y "Todas las opciones"
    (si hay selección).
- Al seleccionar algo aparece la barra de acciones más usadas y "Más" abre las propiedades en
  una **hoja inferior** (ya existía).
- **Páginas**: selector flotante sobre el lienzo, `‹ Pág. 2 / 10 ›`. Las flechas cambian de
  página y el número abre la hoja de Páginas.
- **Gestos**: pellizcar para zoom, arrastrar, tocar para seleccionar y doble toque para editar
  o encuadrar (ya existían; cubiertos por los tests táctiles de la serie anterior).
- **Teclado en pantalla**: al editar un texto, si el teclado (visualViewport) tapa el elemento,
  el lienzo se desplaza para que quede a la vista. También se corrige si queda por arriba.

## Tablet (modo estudio, 768–1023 px)
- **Híbrido**:
  - la sidebar de paneles es **plegable** desde un botón en la barra de herramientas
    ("Mostrar/Ocultar paneles"); en tablet arranca plegada para dejar el lienzo grande y en
    escritorio arranca abierta; la elección se recuerda en el dispositivo;
  - el panel contextual es temporal (hoja "Ajustes"), con acciones rápidas para lo seleccionado.
- Con la sidebar abierta en tablet, la barra inferior no repite sus pestañas.

## Resultados por breakpoint (E2E `p09-mobile-tablet.spec.ts`)
| Ancho | Modo | Resultado |
|---|---|---|
| 320 px | simple | sin scroll horizontal; 6 botones ≥ 44 px de alto; ningún control cortado; globo insertado y escrito; hoja de propiedades |
| 375 px | simple | ídem |
| 390 px | simple | ídem + selector de páginas, plantilla, Imagen (viñeta y página), Más → Formas y efectos, teclado en pantalla |
| 768 px | estudio | sidebar plegada, lienzo > 650 px, abrir/cerrar paneles sin scroll horizontal, propiedades temporales, nada cortado |
| 1024 px | estudio | sidebar abierta por defecto, sin scroll horizontal ni controles cortados |
Además siguen pasando las pruebas por viewport de la serie anterior (320, 360, 390, 430, 844
horizontal, 768 y 820).

## Bugs encontrados y corregidos
- **A 1024 px el botón "Exportar" quedaba cortado** fuera de la barra superior. Los textos de
  Ayuda y Previsualizar ahora se muestran desde 1280 px y el de Leer desde 1024 px; los íconos
  tienen tooltip y nombre accesible.

## Tests existentes ajustados
- Los que abrían grupos de la barra vieja ahora usan Viñeta, el selector de páginas o
  Más → (Páginas / Capas / Imágenes).

## Resultados
- lint: 0 errores · unit: 102/102 · E2E: 140/140 · build OK.
