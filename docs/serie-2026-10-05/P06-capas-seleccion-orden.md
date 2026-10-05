# P06 · Capas, orden visual y selección

Rama: `feat/vs-p06-capas-seleccion` (apilada sobre P05). Sin merge.

## Qué cambió

### Jerarquía Página > Viñeta > elementos
- El panel de Capas pasó de una lista plana a un **árbol** (`role="tree"`):
  - arriba, la página; debajo, cada viñeta con su contenido anidado y un contador;
  - los elementos libres y las capas de dibujo, en la raíz.
  Todo se ordena de adelante (arriba) hacia atrás (abajo).
- Las viñetas se pliegan y se despliegan. Seleccionar en el lienzo un elemento de una viñeta
  plegada la despliega y lleva la fila a la vista.
- La jerarquía se deduce por geometría, como en P01 y P03. El formato `.vineta` no cambia.

### Acciones
- En cada fila: mostrar/ocultar, bloquear/desbloquear, seleccionar, renombrar (doble clic o
  **F2**) y arrastrar para reordenar.
- Con teclado: **Alt+↑/↓** mueve la capa, y Enter o Espacio la selecciona.
- **Barra de capas** (nueva): Traer al frente, Traer adelante, Enviar atrás, Enviar al fondo,
  Duplicar y Eliminar la selección (con confirmación si son viñetas con contenido). También
  muestra el contador de lo seleccionado.

### Sincronización
- Seleccionar en el lienzo resalta la fila (`aria-selected`) y viceversa.

### Bloqueo
- Lo bloqueado no se mueve ni se redimensiona: arrastrarlo no hace nada.
- Se puede seleccionar desde Capas para desbloquearlo.

### Multi-selección
- Shift/Ctrl+clic en Capas o en el lienzo, o marco de selección.
- El grupo se mueve junto (arrastre y flechas), se duplica y se borra en una sola acción.

### Rendimiento
- Medido: cambiar una capa no vuelve a dibujar todo el documento. `ElementNode` es `memo` y
  recibe propiedades primitivas y callbacks estables; con Immer sólo cambia el objeto del
  elemento tocado, así que sólo ese nodo de Konva se vuelve a renderizar.
- El árbol se recalcula con `useMemo` sólo cuando cambia la página.

## Tests
- Unit `tests/unit/capas.test.ts` (2): anidado y orden de adelante hacia atrás; 36 elementos,
  cada uno exactamente una vez.
- E2E `tests/e2e/p06-capas.spec.ts` (4), sobre **36 elementos** (6 viñetas × 5 estrellas + 6):
  - árbol, plegar/desplegar y selección cruzada lienzo ⇄ capas;
  - ocultar/mostrar, bloquear (arrastrar no lo mueve, Capas lo selecciona), desbloquear y
    renombrar con F2;
  - orden con los botones de la barra, Alt+flechas y arrastre de fila;
  - multi-selección con Shift: mover con flechas, duplicar y eliminar el grupo.

## Resultados
- lint: 0 errores · unit: 97/97 · E2E: 124/124 · build OK.
