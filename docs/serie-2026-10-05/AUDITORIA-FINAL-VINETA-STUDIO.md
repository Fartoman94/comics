# Auditoría final — Viñeta Studio (serie de prompts 2026-10-05)

Rama final: `feat/vs-p12-auditoria-final`. Ramas apiladas `feat/vs-p01` … `feat/vs-p12` sobre
`main` @ 13ad459. **Ninguna mergeada.** 12 commits, 98+ archivos y unas 6.300 líneas.

## 1. Resumen de cambios por prompt
| # | Rama | Lo principal |
|---|---|---|
| P01 | vs-p01-ux-editor | Sidebar Páginas/Plantillas/Elementos/Biblioteca/Capas; barra de contexto Página › Viñeta › Elemento; panel de viñeta con Forma y Dividir (H/V/diagonal); imagen libre con Reemplazar/Girar/Rellenar; estado vacío "Empezá tu primera página" |
| P02 | vs-p02-paginas-layouts | Tira de páginas con miniaturas, salto directo, reordenar arrastrando; renombrar, copiar contenido a otras páginas; nombres sin repetir |
| P03 | vs-p03-vinetas-hijos | Viñeta como contenedor (arrastrar o flechas mueven su contenido; Ctrl = sólo el marco); elemento nuevo **Forma** (6 formas + 7 símbolos manga); margen interior; ocultar desde Propiedades; etiqueta con nombre sobre la selección |
| P04 | vs-p04-imagenes-galeria | Selector Subir/Galería (proyecto, recientes, 7 fondos incluidos); validación por bytes, SVG rechazado, 25 MB; giro/espejo/restablecer de la imagen de viñeta; reemplazar conserva propiedades |
| P05 | vs-p05-globos-texto | 9 tipos de globo (+Impacto, Sin borde, Caja de narración); ancho de cola; radio; Enter confirma / Esc cancela; 10 onomatopeyas clásicas |
| P06 | vs-p06-capas-seleccion | Capas como árbol Página > Viñeta > elementos; barra de orden; F2, Alt+flechas; selección cruzada |
| P07 | vs-p07-historial-autoguardado | Historial visible con frases y salto; autoguardado 2 s + inmediato en operaciones críticas; copia de rescate al cerrar |
| P08 | vs-p08-zoom-lectura | Menú de zoom (ajustar página, ajustar ancho, 100 %, niveles), Ctrl+1/Ctrl+2; pruebas de modo lectura y webtoon |
| P09 | vs-p09-mobile-tablet | Celular: + Agregar · Texto · Globo · Imagen · Viñeta · Más; selector de páginas; tablet con sidebar plegable; teclado en pantalla |
| P10 | vs-p10-exportacion | PNG/JPG de página con ×1–×3, calidad y transparencia; PDF/ZIP por todas/actual/rango; ZIP `pagina-001.png` |
| P11 | vs-p11-plantillas-tipos | "¿Qué querés crear?" con Storyboard; exportación recomendada; plantillas iniciales; "En página nueva"; Diseño separado de Plantillas |
| P12 | vs-p12-auditoria-final | Esta auditoría, axe en todas las superficies nuevas, proyecto pesado, correcciones de abajo |

El detalle de cada prompt está en `docs/serie-2026-10-05/P01…P11-*.md`.

## 2. Bugs encontrados y corregidos (toda la serie)
| # | Bug | Dónde se vio | Prompt |
|---|---|---|---|
| 1 | **Marco de selección 0×0** en efectos manga y capas de dibujo: las manijas quedaban amontonadas e inservibles | verificado en `main` (ancho del transformador = 0) | P03 |
| 2 | **Marco de los globos que no coincidía con el globo**: un globo de 280×170 tenía un marco de 191×220 (caja del texto estirada hasta la cola) | verificado en `main` | P05 |
| 3 | Con Lector, Previsualización o Vista general abiertos, el editor de fondo seguía alcanzable con Tab y por lectores de pantalla | E2E | P02 |
| 4 | Al volver de esas vistas el foco se perdía | E2E | P02 |
| 5 | Eliminar una viñeta con imagen o contenido no pedía confirmación | revisión | P01 |
| 6 | Esc en la edición de texto confirmaba: no había forma de descartar | revisión | P05 |
| 7 | Cerrar un diálogo con Esc también **deseleccionaba** el elemento del lienzo (los atajos del editor seguían activos) | E2E P12 | P12 |
| 8 | SVG y archivos disfrazados (texto con `.png`) entraban a la importación y fallaban con un error genérico | revisión | P04 |
| 9 | Controles segmentados sin estado accesible (no anunciaban la opción elegida) | E2E | P04 |
| 10 | Campos de texto de globo/texto y sinopsis sin etiqueta accesible (axe "label") | axe P12 | P12 |
| 11 | A 1024 px el botón Exportar quedaba cortado fuera de la barra superior | E2E | P09 |
| 12 | "1 páginas" (plural) en tres lugares | captura | P01 |
| 13 | Nombres de página repetidos ("Página 3" dos veces) después de borrar | revisión | P02 |
| 14 | Textos guía superpuestos en viñetas cortadas en diagonal | captura | P01 |
| 15 | Avisos (toasts) tapando la tira de páginas | captura | P04 |
| 16 | Antes de salir se advertía siempre que había algo pendiente; ahora sólo si la copia de rescate no se pudo escribir | revisión | P07 |
| 17 | Contraste insuficiente en la línea de exportación recomendada | axe | P11 |
| 18 | Test inestable `swipes (rtl)` en tablet: espera fija de 800 ms frente a una animación más lenta bajo carga. Ahora espera el cambio de página (18/18 bajo estrés) | suite | P12 |

## 3. Funcionalidad verificada
- Crear proyecto/página, duplicar, eliminar, layouts, viñetas (dividir, forma, padding),
  textos, globos, imágenes, capas, deshacer, rehacer, autoguardado, navegación, zoom, modo
  lectura, mobile y exportar: todo cubierto por E2E (ver §8).
- Persistencia: recargar, cerrar y reabrir, disco lento (escrituras bloqueadas 250 ms), error
  de disco (Reintentar) y recarga con la escritura fallando (copia de rescate). Los guardados
  consecutivos salen en orden y gana el último (cola + revisión).

## 4. UX revisada
| Punto | Estado |
|---|---|
| Botones sin acción | ninguno visible sin nombre accesible (E2E P01); cada botón nuevo está cubierto por algún test |
| Estados vacíos | página vacía con 7 opciones; capas, biblioteca y galería con mensajes propios |
| Textos ambiguos | pestañas renombradas por concepto; pistas de contexto; frases de historial en lenguaje natural |
| Tooltips | pestañas, íconos de barra, tira de páginas, zoom, capas e inspector |
| Destructivo sin confirmación | eliminar página o viñeta con contenido, reemplazar plantilla, página libre y quitar recurso piden confirmación. Eliminar un elemento suelto, "Vaciar capa" y el diseño a todo el proyecto se deshacen con Ctrl+Z |
| Modales que no cierran | todos cierran con Esc y botón; el foco vuelve a quien abrió (E2E P12) |
| Foco | trampa de foco en diálogos; editor inerte bajo vistas superpuestas |
| Scroll raro / controles duplicados | sin scroll horizontal en 320–1440; la barra inferior no repite pestañas cuando la sidebar está abierta |

## 5. Rendimiento — proyecto pesado
20 páginas × 10 viñetas, cada una con imagen (6 imágenes de 1200×900), Chrome local:

| Medida | Resultado |
|---|---|
| Abrir el proyecto hasta ver el lienzo | 0,86 s |
| Edición de un elemento | ~5 ms de trabajo (38 ms medidos con 2 cuadros de espera) |
| Cambio de página | ~10 ms de trabajo (43 ms con 2 cuadros) |
| Generar las 20 miniaturas | 1,5 s (después de 1,2 s de espera; sólo se regenera la página que cambia) |
| Listeners de `window` tras reabrir el proyecto 5 veces | 38 → 38 (sin duplicados) |
| Memoria JS tras 5 reaperturas | 47 MB → 44 MB (sin fuga) |

- Re-renders: `ElementNode` es `memo` con propiedades primitivas y callbacks estables, y con
  Immer sólo cambia el elemento tocado. El árbol de capas se memoiza por página.
- Las miniaturas son instantáneas JPEG, no páginas montadas en vivo.
- El autoguardado nunca corre por cuadro.
- Hay un E2E de regresión con márgenes holgados para CI (`p12-auditoria`).

## 6. Responsive y accesibilidad
- axe sin violaciones serias ni críticas en: editor, barra de contexto, tira, estado vacío,
  historial, zoom, las 4 pestañas, propiedades de viñeta/globo/página (Diseño), selector de
  imágenes, copiar contenido, exportar con opciones y, en celular, la barra, la hoja Más y la
  hoja Globos.
- Se suman a las pruebas axe existentes de la serie anterior.
- Breakpoints probados: 320, 360, 375, 390, 430, 768, 820, 844 (horizontal), 1024 y 1440.
- Objetivos táctiles de ≥ 44 px en la barra del celular.

## 7. Seguridad
| Tema | Estado |
|---|---|
| Uploads | tipo real por bytes (PNG/JPG/WebP/GIF), máximo 25 MB, vacíos rechazados, más de 4096 px se reduce |
| SVG | rechazado explícitamente (no hay sanitización segura) |
| Sanitización / XSS | todo el texto del usuario se dibuja en canvas (Konva) o pasa por React, que escapa. El libro web `.html` escapa título, autor y sinopsis (`esc`), protege el `<script>` inline y asigna los nombres de página como propiedades del DOM, no como HTML |
| `.vineta` | validación estricta (`projectSchema`) con límites; todos los campos nuevos son opcionales y validados; la copia de rescate se valida igual antes de usarse |
| URLs externas | ninguna proviene del contenido. CSP de producción `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'` |
| Límites | imágenes, puntos de dibujo, elementos por página (ya existían) |

## 8. Testing final
| Suite | Resultado |
|---|---|
| `npm run lint` (oxlint) | **0 errores** · 39 advertencias (33 previas + 6 `only-export-components` en módulos nuevos de diálogos/hosts) |
| `npx tsc -b` (typecheck, incluye tests) | OK |
| `npm test` (Vitest, unit/integración) | **106/106** (16 archivos; eran 63 en `main`) |
| `npx playwright test` (E2E escritorio + celular + tablet) | **153/153** (eran 105 en `main`) |
| `npm run build` | OK |

Tests nuevos de la serie:
- 9 archivos unit: panelOps, paginas, vinetasHijos, imagenes, globos, capas, historial,
  plantillasTipos, y una actualización de flujoCreativo.
- 12 archivos E2E: p01 a p12.

## 9. Deuda técnica
- La jerarquía Página > Viñeta > elementos se **deduce por geometría** (centro del elemento
  dentro del polígono y encima en la pila). Así no cambia el formato `.vineta`, pero un globo
  que cruza dos viñetas pertenece a una sola. Un campo `parentId` opcional permitiría fijarlo.
- Las acciones críticas se marcan a mano con `{ urgent: true }`; una acción nueva puede
  olvidarlo (sólo pierde el guardado inmediato y queda el de 2 s).
- 3 advertencias previas de refs en `CanvasStage` y 6 `only-export-components` nuevas
  (funciones de apertura junto a los hosts de diálogos).
- Sin modo de edición en scroll continuo para webtoon (la arquitectura lo admite: §P08).
- Sin exportación SVG (el render es raster).

## 10. Riesgos
- **Cambios de hábito**:
  - Esc en la edición de texto ahora cancela;
  - la barra del celular cambió (los grupos viejos están en "Más");
  - la sidebar arranca plegada en tablet;
  - el ZIP usa `pagina-001.png`.
  Todo está documentado en ayuda, atajos y pistas.
- Las ramas están **apiladas**: mergear en orden P01 → P12, o directamente P12, que las incluye
  a todas.
- No se probó en un iPhone/iPad real ni en Safari (sí en Chrome con emulación táctil). El
  teclado en pantalla se simuló achicando el viewport.

## 11. Recomendaciones
**P0** (antes de publicar)
- Ninguna bloqueante. Hacer un smoke test en el despliegue de vista previa al mergear: CSP,
  service worker y offline, como en la serie anterior.

**P1**
- Probar en Safari iOS real: teclado en pantalla, pellizco y hojas inferiores.
- Campo `parentId` opcional para fijar la viñeta padre cuando la geometría es ambigua.
- Tomar `urgent` de un mapa de nombres de acción en lugar de marcar cada `mutate`.

**P2**
- Modo de edición webtoon en scroll continuo.
- Mover las funciones `open*` de los hosts de diálogos a módulos sin componentes (limpia las
  advertencias de fast-refresh).
- Exportación vectorial (SVG/PDF vectorial) si se agrega un renderizador alternativo.
