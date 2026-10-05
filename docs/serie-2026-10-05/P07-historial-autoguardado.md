# P07 · Historial de cambios, Ctrl+Z y autoguardado — reporte técnico

Rama: `feat/vs-p07-historial-autoguardado` (apilada sobre P06). Sin merge.

## Deshacer / rehacer
- Botones Deshacer y Rehacer en la barra superior. Atajos Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y y sus
  equivalentes con Cmd en Mac (ya existían; verificados).
- Entra todo cambio del documento: mover, cambiar tamaño, eliminar, duplicar, texto, imagen,
  color, plantilla, páginas (agregar, borrar, reordenar), capas, ocultar/mostrar, bloquear,
  dividir, etc. Todas las acciones pasan por `mutate()`.
- Lo que no cambia nada no entra al historial (ya estaba así).
- **Agrupación**:
  - un arrastre o un resize completo es **una** operación (se escribe en `dragend` /
    `transformend`, no por cuadro);
  - las ráfagas del mismo control (sliders, tipeo, flechas) se agrupan por clave en 700 ms;
  - mover una viñeta con su contenido es un solo paso.
- Límite: 120 pasos.

## Historial visible (nuevo) — `HistoryMenu.tsx` + `lib/history.ts`
- Botón de reloj junto a Deshacer/Rehacer. Lista las operaciones recientes, la más nueva
  arriba; las deshechas aparecen tachadas y la actual tiene una marca.
- Un clic en una operación **vuelve a ese punto** (`jumpHistory(n)` deshace o rehace n pasos).
  También se puede volver al "Estado al abrir el proyecto".
- Las frases salen de comparar estados, sin etiquetar cada acción a mano: "Moviste Globo 1",
  "Editaste el texto de…", "Cambiaste el tamaño de…", "Ocultaste…", "Bloqueaste…",
  "Dividiste Viñeta 1", "Agregaste la página 3", "Eliminaste…", "Reordenaste las páginas",
  "Cambiaste el orden de las capas", "Cambiaste la plantilla de la página 2"…
  Se calculan sólo con el menú abierto y quedan en caché por par de estados (WeakMap).

## Estado de guardado
- Guardado / Guardando… / Cambios sin guardar / Error al guardar. Ahora es `role="status"`
  (los lectores de pantalla lo anuncian) y el texto se ve desde 1024 px; antes sólo desde 1280 px.

## Autoguardado
- **Debounce de 2 s** (antes 800 ms). Nunca se guarda por cuadro.
- **Guardado inmediato** en operaciones críticas, marcadas con `mutate(…, { urgent: true })`:
  - eliminar selección;
  - agregar, duplicar, eliminar y reordenar páginas;
  - aplicar plantilla y página desde plantilla;
  - pegar páginas;
  - copiar contenido a otras páginas;
  - duplicar la estructura;
  - borrar un bloque de guion.

## Conflictos y orden de escrituras
- Ya era seguro: `persistence.enqueueSave` encola todas las escrituras (nunca hay dos a la vez,
  salen en orden) y descarta las que tengan una `revision` menor o igual a la última escrita.
  Una respuesta lenta no puede pisar un estado más nuevo.
- Verificado con disco lento (250 ms por escritura, bloqueante) y 12 ediciones seguidas: queda
  la última.

## Antes de salir (nuevo) — `lib/rescue.ts`
- Al ocultar o cerrar la pestaña, si hay cambios pendientes, se intenta guardar y además se
  escribe una **copia de rescate síncrona en localStorage**. IndexedDB es asíncrono y el
  navegador puede cortar la escritura al cerrar.
- **Sólo se advierte** (diálogo de "¿salir?") **si esa copia no se pudo escribir**, por ejemplo
  sin espacio. Antes se advertía siempre que había algo pendiente.
- Al abrir el proyecto, si la copia es más nueva que lo guardado, se recupera (validada con el
  mismo esquema que un `.vineta`), queda marcada para guardar y aparece el aviso "Se
  recuperaron cambios…".
- La copia se borra en cuanto un guardado normal termina bien.

## Tests
- Unit `tests/unit/historial.test.ts` (5):
  - frases para mover, texto, ocultar, tamaño, color, duplicar, orden, dividir, eliminar,
    agregar y reordenar páginas;
  - 20 cambios con deshacer/rehacer y saltos;
  - ráfagas agrupadas y operaciones críticas que piden guardado inmediato;
  - copia de rescate (sólo si es más nueva, se borra al guardar);
  - sin espacio, `writeRescue` devuelve false.
- E2E `tests/e2e/p07-historial.spec.ts` (5):
  - 20 cambios con Ctrl+Z / Ctrl+Shift+Z, botones y salto desde el historial;
  - estados de guardado y debounce (a 1 s sigue pendiente; luego Guardado);
  - eliminar página guardada en menos de 1,5 s;
  - **disco lento**: lo último gana y persiste al recargar;
  - **error de disco**: estado de error + Reintentar;
  - **recargar** con la escritura fallando: se recupera de la copia de rescate sin diálogo.

## Resultados
- lint: 0 errores · unit: 102/102 · E2E: 129/129 · build OK.
