# P11 · Plantillas y tipos de proyecto

Rama: `feat/vs-p11-plantillas-tipos` (apilada sobre P10). Sin merge.

## "¿Qué querés crear?"
- El paso 1 del proyecto nuevo tiene ese título y ofrece **Cómic, Manga, Webtoon, Storyboard
  (nuevo), Tira cómica** y Libre.
- Cada tipo preconfigura:
  - **dimensiones y orientación** (formato);
  - **sentido de lectura**;
  - **plantilla** y **layouts sugeridos**, que en el paso 2 aparecen primero con la marca
    "sugerida";
  - **exportación recomendada**, visible en la tarjeta y preseleccionada al abrir Exportar:

| Tipo | Formato | Lectura | Exportación recomendada |
|---|---|---|---|
| Cómic | Cómic americano (vertical) | izq → der | PDF de imprenta |
| Manga | Tankōbon (vertical) | der → izq | PDF con lectura der → izq |
| Webtoon | Tira 800 × 2400 | vertical | Webtoon en segmentos |
| Storyboard | **A4 apaisado (nuevo)** | izq → der | PDF liviano |
| Tira cómica | 1800 × 600 (horizontal) | izq → der | PNG/JPG por página |

- Plantilla nueva **Storyboard 6**: seis cuadros 16:9 con una franja libre para notas de cámara.

## Plantillas separadas de Diseño
- **Plantillas** = estructura inicial de viñetas. Tienen su pestaña propia desde P01 y en el
  celular, desde P09, viven en la hoja "Viñeta"; ya no se mezclan con efectos ni formas.
- **Diseño** (nuevo, en Propiedades de la página): estilos en bloque, **a esta página o a todo
  el proyecto**:
  - bordes de viñetas (grosor, radio y color);
  - tipografía de los globos.
  Lo bloqueado no se toca y cada aplicación es un solo paso del historial.

## Plantillas iniciales y vista previa
- Sección **"Plantillas iniciales"** arriba de la galería: Cómic clásico, Manga, Webtoon,
  Storyboard, Tira de 3 viñetas, Página splash y Página libre. Cada una muestra **miniatura,
  nombre, explicación y cantidad de viñetas** antes de aplicar.
- En la galería completa, pasar el puntero o enfocar una plantilla muestra abajo
  "Nombre · N viñetas · para qué sirve" (también está en el nombre accesible).

## Seguridad
- Si la página tiene viñetas, aplicar pide confirmación y **ofrece "En página nueva"**: un
  tercer botón del diálogo, con el nuevo `confirmChoice`. Lo mismo para "Página libre", que
  quita sólo las viñetas.
- Cambiar de plantilla **no borra recursos** del proyecto. Las imágenes encuadradas pasan a las
  viñetas nuevas en orden, globos y textos quedan, y el cambio se deshace y rehace en un paso.

## Bugs encontrados y corregidos
- Contraste insuficiente (axe) en la línea nueva de exportación recomendada: se corrigió antes
  del commit.

## Tests
- Unit `tests/unit/plantillasTipos.test.ts` (4):
  - plantillas iniciales;
  - storyboard (formato apaisado, 6 cuadros con proporción de entre 1,6 y 1,95);
  - cambiar plantilla conserva recursos e historial (con deshacer/rehacer);
  - diseño por página o proyecto sin tocar lo bloqueado.
- E2E `tests/e2e/p11-plantillas-tipos.spec.ts` (3):
  - "¿Qué querés crear?" con los 5 tipos, exportación recomendada, Storyboard creado con 6
    cuadros por página y Exportar preseleccionado;
  - plantillas iniciales con datos visibles, detalle al pasar el puntero, "En página nueva" que
    deja intacta la página, reemplazo que conserva globo y recursos, deshacer y página libre;
  - Diseño a esta página o al proyecto y tipografía de globos.
- La tabla de tipos de `p1-flujo-creativo` suma Storyboard.

## Resultados
- lint: 0 errores · unit: 106/106 · E2E: 149/149 · build OK.
