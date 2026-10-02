# Viñeta Studio

Estudio para crear **cómics, manga y webtoons** en el navegador. Viñetas, fotos, globos, onomatopeyas, tramas y dibujo con presión, con un visor de lectura tipo libro y exportación lista para imprimir o publicar.

Creado por [MateLabs](https://matelabs.site/).

## Qué incluye

**Proyectos**
- Tipos de obra: cómic (izq → der), manga (der → izq), webtoon (vertical) y libre.
- Formatos reales: manga tankōbon B6, revista B5, cómic americano, BD europea A4, webtoon, cuadrado social, tira de periódico.
- Guardado automático en el navegador (IndexedDB). Nada se sube a ningún servidor.
- Exportar / importar el proyecto completo como archivo `.vineta` (incluye las imágenes).

**Editor**
- Plantillas de viñetas: clásicas, cortes diagonales de manga, yonkoma, fragmentos, zigzag, tiras y webtoon, con margen y medianil ajustables.
- Herramienta para dibujar viñetas a mano.
- Imágenes y fotos: subir varias a la vez, arrastrar desde el escritorio, pegar con Ctrl+V. Soltar una imagen sobre una viñeta la rellena; doble clic para encuadrarla (mover y hacer zoom).
- Imágenes libres con **recorte**, espejo, filtros (B/N, sepia, tinta, contraste, brillo, desenfoque) y **modos de fusión** (multiplicar, trama, superponer…) para superponer imágenes.
- Globos: diálogo, pensamiento, grito, susurro, narración y recuadro nube, con cola arrastrable.
- Textos y SFX con contorno, inclinación y sombra. Fuentes de cómic y **fuentes japonesas, coreanas y chinas**, con **escritura vertical (tategaki)** y un catálogo de onomatopeyas listas en japonés, coreano, chino y español.
- Efectos manga: líneas de impacto, líneas de velocidad, trama de puntos y trama degradada.
- Dibujo con pincel sensible a la presión (tinta, pluma, lápiz, marcador) y borrador, en capas de dibujo independientes.
- Capas: reordenar, ocultar, bloquear, renombrar. Alinear, duplicar, copiar/pegar, deshacer/rehacer ilimitado.
- Imanes y guías de margen, sangrado y cuadrícula. Zoom con rueda o pellizco.
- Diseño adaptado a celular: paneles como hojas inferiores, barra de acciones rápidas y zoom con dos dedos.

**Ayuda y ejemplo**
- Tour guiado la primera vez que se abre el editor (se adapta al celular) y botón **Ayuda** con una guía paso a paso de cada función.
- Sección "Cómo funciona" en el inicio.
- **Manga de ejemplo** "桜の風 · Viento de sakura" (`#/demo`): portada, 4 páginas y contratapa armadas con el propio editor, con ilustraciones vectoriales originales, onomatopeyas en japonés y lectura de derecha a izquierda. Se puede abrir en el editor para ver cómo está hecho.

**Lectura y exportación**
- Visor tipo libro: las páginas se dan vuelta arrastrando la esquina o deslizando con el dedo, con tapas duras y sombra en el lomo. Respeta el sentido de lectura manga. Modo scroll para webtoon.
- Libro web `.html`: un solo archivo con ese visor, para compartir o subir a cualquier hosting.
- PDF para imprenta (doble resolución) o liviano, PNG por página, ZIP con todas las páginas y tira vertical larga para webtoon.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/
```

Stack: React 19, TypeScript, Vite, Konva (lienzo), Zustand + Immer (estado e historial), IndexedDB (idb-keyval), perfect-freehand (trazos), page-flip (visor), jsPDF y JSZip (exportación), Tailwind CSS 4.

## Formato de proyecto (.vineta) y compatibilidad

- Un `.vineta` es JSON: `{ app: "vineta-studio", version: 1, project, blobs }`. Las imágenes van como `data:image/...;base64` (PNG, JPEG, WebP o GIF) y se verifican al importar. Nunca se pide nada a la red.
- Todo lo que entra (archivos importados y proyectos guardados) pasa por `src/lib/projectSchema.ts`: tipos, ids únicos, referencias a imágenes, límites y versión. Un proyecto dañado no deja la app en blanco: se lista como "no se puede abrir", con opción de descargarlo o borrarlo.
- **Guion (desde la etapa 05):** `project.script` es **opcional** y aditivo, por eso la versión del archivo sigue en 1. Los `.vineta` anteriores no lo tienen y se abren igual. Estructura: `script.pages[idDePágina].panels[] = { id, panelId | null, blocks[] }`, con bloques `{ id, kind: description | dialogue | thought | caption | sfx, text, character?, placedElementId? }`. La asociación es por id: reordenar páginas o viñetas no la rompe.
- **Plantillas propias** se guardan aparte (IndexedDB `vineta-plantillas`) con copia propia de sus imágenes. El borrado de imágenes tiene en cuenta proyectos y plantillas.

## Almacenamiento local: bases, migración y limpieza

Todo vive en IndexedDB del navegador (nada se sube a un servidor):

| Base | Qué guarda |
|---|---|
| `vineta-projects` | Proyectos completos (JSON validado). |
| `vineta-assets` | Imágenes (blobs), compartidas por referencia. |
| `vineta-indice` | Resumen liviano de cada proyecto para el inicio: título, tipo, páginas, miniatura y fecha. |
| `vineta-papelera` | Proyectos borrados. |
| `vineta-biblioteca` | Imágenes y elementos reutilizables del usuario. |
| `vineta-plantillas` | Páginas guardadas como plantilla. |
| `vineta-instantaneas` | Versiones anteriores de cada proyecto. |

- **Migración del índice:** los proyectos guardados antes de que existiera el índice se leen una sola vez, se validan y se indexan. Los dañados quedan marcados y no se abren. Las entradas del índice sin proyecto se borran.
- **Imágenes:** una imagen nunca se borra mientras la use un proyecto (también uno dañado), la papelera, una plantilla, la biblioteca o una instantánea. Al importar se calcula una huella SHA-256 (`asset.hash`, opcional) para reutilizar la misma imagen en vez de duplicarla.
- **Papelera:** eliminar manda el proyecto a la papelera; se puede "Deshacer" enseguida o "Restaurar" después. Se vacía sola a los 30 días.
- **Instantáneas:** como mucho una cada 5 minutos por proyecto (al abrirlo y al guardar), se guardan las 3 últimas y se borran a los 7 días o cuando el proyecto ya no existe. Restaurar crea una copia validada.
- **Dos pestañas:** si un proyecto ya está abierto en otra pestaña (BroadcastChannel), la nueva abre en solo lectura y ofrece "Editar en esta pestaña"; la otra pasa a solo lectura. Nunca gana en silencio el último guardado.
- **Centro de recuperación** (inicio o Ayuda): uso de almacenamiento, almacenamiento persistente, proyectos sanos y dañados, guardados fallidos, instantáneas, copia de seguridad completa (.zip) y restauración validada.

## Tests

```bash
npm test            # unitarios (Vitest + fake-indexeddb)
npm run test:e2e    # Playwright: escritorio, celular 390×844 y tablet 820×1180 táctiles
# con Chrome del sistema: PW_CHROME=/usr/bin/google-chrome npm run test:e2e
```

## Manga de ejemplo

Las ilustraciones están dibujadas en código (`src/demo/art.ts`) y se sirven pre-renderizadas como WebP en `public/demo/` para que la demo cargue rápido en el celular. Si cambiás algún dibujo:

1. Subí `ART_VERSION` en `src/demo/demoProject.ts`.
2. Con `npm run dev` corriendo, regenerá las imágenes (necesita `playwright-core` y Google Chrome):

```bash
npm i --no-save playwright-core
DEMO_URL=http://localhost:5173 node scripts/build-demo-art.mjs
```

Si faltan los WebP, la demo los genera igual en el navegador a partir de los SVG (más lento).

## Deploy en Vercel

El repo ya incluye `vercel.json` (framework Vite, salida `dist`, reescritura SPA y caché de assets).

1. En Vercel: **Add New → Project** e importar este repositorio.
2. Vercel detecta Vite; no hace falta cambiar nada (build `npm run build`, salida `dist`).
3. **Deploy.**

Por CLI: `npx vercel` (vista previa) y `npx vercel --prod` (producción).

Es un sitio 100% estático: no necesita variables de entorno ni base de datos.

## Estructura

```
src/
  lib/          formatos, plantillas, guardado, render y exportación
  store/        estado del editor e historial de deshacer
  components/
    home/       pantalla de proyectos
    editor/     lienzo, barras, visor de lectura
      nodes/    cómo se dibuja cada elemento (viñeta, globo, efecto, trazo)
      sidebar/  páginas, viñetas, imágenes, insertar, capas
      inspector/propiedades del elemento seleccionado
legacy/         versión original de un solo HTML (referencia)
```
