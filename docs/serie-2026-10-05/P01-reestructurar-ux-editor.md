# P01 · Reestructuración UX general del editor

Rama: `feat/vs-p01-ux-editor` (base `main` @ 13ad459). Sin merge.

## Qué cambió

### Cuatro conceptos: Páginas, Viñetas, Elementos y Capas
- **Sidebar izquierdo** reorganizado: Páginas · Plantillas · Elementos · Biblioteca · Capas (+ Guion).
  Antes: Páginas · Viñetas · Imágenes · Insertar · Capas · Guion. Cada pestaña tiene tooltip.
  La sidebar pasa de 288 a 320 px para que las etiquetas no se peguen.
- **Barra de contexto** (`context/ContextBar.tsx`) arriba a la izquierda del lienzo:
  `Página 2 › Viñeta 3 › Globo · Diálogo`. Las migas son clicables (Página = deseleccionar,
  Viñeta = seleccionar la viñeta padre). Al lado, una pista de qué se puede hacer ahora
  (según la herramienta o el tipo de elemento seleccionado).
- **Jerarquía deducida** (`lib/hierarchy.ts`): el documento sigue guardando elementos planos
  por página (compatibilidad con todos los `.vineta`). La viñeta "padre" de un elemento es la
  de más arriba en la pila que está por debajo y contiene su centro (polígono real, no bbox).

### Panel contextual derecho
- **Viñeta**: Imagen (Encuadrar, Reemplazar, **Rellenar**, **Ajustar**, Quitar, filtros) ·
  Fondo y borde (fondo, grosor, color, radio) · **Forma** (Recta, Redondeada, Diagonal ↗,
  Diagonal ↖, Trapecio) · **Dividir** (horizontal, vertical, diagonal) · Duplicar con contenido.
- **Imagen libre**: **Reemplazar** (conserva posición, ancho, giro, espejos y filtros),
  Recortar, Ajustar, **Rellenar** (recorte "cover" sin deformar), **Girar 90° ⟲/⟳**, Espejo H/V,
  Quitar recorte, filtros, opacidad y orden.
- **Texto**: sin cambios funcionales (ya tenía contenido, fuente, tamaño, peso, alineación,
  color, interlineado, duplicar y eliminar).

### Estado vacío
- Página sin elementos → tarjeta **"Empezá tu primera página"** con 1 viñeta, 2 verticales,
  2 horizontales, 3 viñetas, 4 clásico, 6 clásico y Página libre (miniaturas reales).
- Cada opción crea viñetas editables (no una imagen) en una sola acción de historial.
- "Página libre" activa la herramienta Viñeta y no vuelve a ofrecer la tarjeta en esa página.
- Plantillas nuevas: `two-cols` (2 columnas) y `three-mixed` (1 + 2).

### Dividir viñetas (`lib/panelOps.ts`)
- Recorte de polígono convexo por semiplano (Sutherland–Hodgman) con medianil = 1,8 % del ancho.
- Funciona con viñetas rectas y con polígonos (las de manga); el resultado sigue siendo convexo,
  así que se puede volver a dividir. La primera mitad conserva id, estilo e imagen (sin moverla
  en la página); la segunda es una copia sin imagen.
- No divide viñetas bloqueadas ni si alguna mitad quedaría < 24 px (avisa con un toast).

## Bugs encontrados y corregidos
- "1 páginas" en la lista de páginas, la Vista general y el estimador de exportación → `lib/plural.ts`.
- Eliminar una viñeta con contenido (imagen o elementos encima) no pedía confirmación: ahora
  pregunta desde Supr, el inspector, la barra móvil y el modo simple (`components/editor/actions.ts`).
  El contenido de encima no se borra.
- El texto "Arrastrá una imagen acá" de dos viñetas cortadas en diagonal se superponía:
  ahora ocupa la zona central de la viñeta.

## Tests
- Unit: `tests/unit/panelOps.test.ts` (13): división H/V/diagonal, imagen que no se mueve,
  mínimos, bloqueo, formas, cover/contain, jerarquía, accesos rápidos, undo en un paso.
- E2E: `tests/e2e/p01-ux-editor.spec.ts` (6): estado vacío + undo, página libre, migas y panel
  contextual, forma/dividir/eliminar con confirmación, pestañas sin errores ni botones sin
  nombre, imagen libre (girar, rellenar, quitar recorte).
- Tests existentes actualizados a los nombres nuevos de pestañas.

## Resultados
- `npm run lint`: 0 errores (3 advertencias previas de refs en CanvasStage).
- `npm test`: 76/76.
- `npx playwright test`: 105/105 (escritorio + celular + tablet).
- `npm run build`: OK.

## Pendiente para prompts siguientes
- Modo simple (celular) sigue con sus etiquetas propias ("Imágenes"): se rediseña en P09.
- Esc en la edición de texto hoy confirma; P05 lo cambia a cancelar.
