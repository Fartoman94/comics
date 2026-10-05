# P02 · Sistema de páginas y layouts de viñetas

Rama: `feat/vs-p02-paginas-layouts` (apilada sobre P01). Sin merge.

## Qué cambió

### Tira de páginas (filmstrip) bajo el lienzo — `pages/PageFilmstrip.tsx`
- Miniaturas reales de cada página (las mismas instantáneas JPEG que ya generaba el editor,
  no páginas montadas en vivo) y botón **+** al final.
- Anterior / siguiente, campo **"Ir a la página"** (salto directo con Enter) y nombre de la actual.
- **Reordenar arrastrando** una miniatura (mouse, lápiz o dedo con Pointer Events); con teclado,
  Alt + ←/→. Clic = ir a la página; doble clic = renombrar.
- Menú de la página actual: Renombrar, Duplicar, Copiar contenido a…, Eliminar (con confirmación).
- Se pliega y el estado se recuerda en el dispositivo (`ui.filmstrip`). La página actual siempre
  queda a la vista en la tira. Visible en modo estudio desde 768 px (el modo simple tiene su hoja).

### Operaciones de página (store)
- `renamePage(id, name)`: recorta, ignora vacío, máximo 80 caracteres, agrupa el tipeo en un paso.
- `copyPageContentTo(src, destinos[])`: copia todos los elementos con ids nuevos encima de lo que
  ya tengan las páginas elegidas; un solo deshacer.
- `goToPage(n)` acotado al rango.
- `nextPageName`: las páginas nuevas se llaman "Página N" con el primer N libre (antes podía
  repetirse el nombre después de borrar).
- Diálogos compartidos (`pages/PageDialogs.tsx`) usados por la tira, la lista de Páginas y la
  Vista general: renombrar, copiar contenido a… y eliminar con confirmación (dice cuántos
  elementos tiene la página).
- Lista de Páginas: + Renombrar y + Copiar contenido a otras páginas; doble clic renombra.

### Layouts
- 1 viñeta (splash), 2 verticales (nuevo, P01), 2 horizontales, 3 viñetas (nuevo, P01),
  4 clásico, 6 clásico, splash page, manga (dinámico, vertical, acción, yonkoma) y libre.
  Todos crean viñetas editables. División horizontal, vertical y **diagonal** estable (P01).

### Persistencia
- Las páginas y elementos usan ids estables (`pg_…`, `el_…`); el guion y las miniaturas se
  asocian por id. Verificado: orden, ids, nombres y contenido sobreviven a recargar.

### Rendimiento
- La tira y la lista usan instantáneas ya generadas (se regeneran sólo para la página que cambió,
  1,2 s después del último cambio). El lienzo sigue montando sólo la página actual.

## Bugs encontrados y corregidos
- **Accesibilidad**: con el Lector, la Previsualización o la Vista general abiertas, los
  controles del editor de fondo seguían alcanzables con Tab y por lectores de pantalla. Ahora el
  editor queda `inert` mientras hay una vista encima.
- Al volver de esas vistas el foco se perdía (el editor inerte suelta el foco antes de que la
  vista lo registre). Ahora el editor recuerda quién abrió la vista y le devuelve el foco.
- Nombres de página repetidos después de borrar ("Página 3" dos veces).

## Tests
- Unit `tests/unit/paginas.test.ts` (6): 10 páginas con ids estables tras reordenar/duplicar/
  eliminar, nombres sin repetir, renombrar (recorte, vacío, un paso de historial), copiar
  contenido (ids nuevos, suma, un deshacer), goToPage acotado, layouts crean viñetas.
- E2E `tests/e2e/p02-paginas.spec.ts` (3): crear 10 páginas desde la tira, reordenar arrastrando,
  salto directo, anterior/siguiente, renombrar, duplicar, eliminar con confirmación y **recargar
  verificando persistencia**; copiar contenido desde la lista; doble clic para renombrar y tira
  plegada que se recuerda.

## Resultados
- lint: 0 errores · unit: 82/82 · E2E: 108/108 (escritorio + celular + tablet) · build OK.
