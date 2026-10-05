# P08 · Zoom, navegación y modo lectura

Rama: `feat/vs-p08-zoom-lectura` (apilada sobre P07). Sin merge.

## Qué cambió

### Zoom en el editor
- Botones − y + (ya existían). El porcentaje ahora abre un **menú** (`ZoomMenu.tsx`):
  - **Ajustar página** (Ctrl+0);
  - **Ajustar ancho** (Ctrl+2, nuevo): la página ocupa el ancho disponible y se ve desde
    arriba, cómodo para rotular;
  - **Tamaño real 100 %** (Ctrl+1, nuevo);
  - niveles 25, 50, 75, 100, 150, 200 y 400 %.
- Antes, el porcentaje sólo encajaba la página.
- Ctrl/Cmd + rueda acerca al puntero, y pellizcar en pantallas táctiles (ya existían; verificados).
- El zoom es sólo de la vista: no cambia el documento ni entra al historial (verificado).

### Desplazamiento (pan)
- Mantener **Espacio** y arrastrar, la herramienta **Mano** (H), la rueda o el trackpad
  (Shift = horizontal). Ya existían; se documentaron en el menú de zoom y en los atajos.

### Modo lectura
- La Previsualización ya cumplía lo pedido:
  - sin sidebars, manijas, guías ni panel contextual;
  - vistas página, pliego, scroll y teléfono;
  - zoom ajustar, 100 % y ancho;
  - anterior/siguiente con botones y flechas del teclado, respetando el sentido de lectura
    (en manga la flecha izquierda avanza);
  - **pantalla completa** si el navegador la permite.
  El Lector (libro con efecto de página) también tiene pantalla completa.
- Se verificó que al salir se conserva el estado del editor: página, selección y zoom.
- Con P02 el editor de fondo queda `inert` mientras la vista está abierta.

### Webtoon / scroll vertical
- La arquitectura ya lo soporta sin decisiones rígidas:
  - la Previsualización tiene lectura vertical continua (scroll) y vista teléfono, y arranca
    en teléfono si el proyecto es webtoon o de lectura vertical;
  - el editor tiene el marco de pantalla del teléfono;
  - la exportación arma la tira vertical.
  Un modo de edición en scroll continuo puede sumarse como otra vista sin tocar el formato.

## Tests
- E2E `tests/e2e/p08-zoom-lectura.spec.ts` (4):
  - menú de zoom: ajustar ancho (la página llena el ancho y se ve desde arriba), ajustar
    página (entra entera), 100 %, 50 % y los atajos Ctrl+0/1/2;
  - el documento y el historial no cambian;
  - Ctrl+rueda acerca y Espacio+arrastrar mueve el lienzo sin mover elementos;
  - modo lectura de un manga: editor inerte detrás, flechas en sentido manga, botón de
    pantalla completa y, al salir, misma página, selección y zoom;
  - webtoon: arranca en teléfono con todas las páginas en vertical y ofrece scroll.

## Notas
- `p1-lector-vistas › @movil swipes … (rtl)` en tablet falló una vez con la suite completa
  bajo carga y pasa 4 de 4 aislado. Es inestable desde antes de esta serie (también falló una vez
  en P04). Se revisa en P12.

## Resultados
- lint: 0 errores · unit: 102/102 · E2E: 132/133 (el inestable de arriba) · build OK.
