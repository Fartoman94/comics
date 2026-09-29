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
