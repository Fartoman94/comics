# Muestras premium · Fase 1 — Auditoría del editor para obras largas

Rama: `feat/muestras-premium` (sobre `feat/tema-claro-oscuro`, a su vez sobre `main` @ 6050503).

## ¿Soporta Viñeta Studio series largas?
Medido en Chrome con un proyecto de **40 páginas** (manga, 5 viñetas por página con imagen
filtrada y 3 globos por página, 12 imágenes de 1000×1400):

| Medida | Resultado | Veredicto |
|---|---|---|
| Guardar el proyecto completo en IndexedDB | 1 ms (JSON de 150 KB; las imágenes van aparte) | ✅ |
| Cargar y validar | 3 ms | ✅ |
| Abrir hasta ver el lienzo | 0,8 s | ✅ |
| Miniaturas de las 40 páginas | 8,8 s en segundo plano (los filtros B/N cuestan) | ✅ sin bloquear |
| PDF completo (40 páginas) | 6,4 s, 3,4 MB | ✅ |
| Proyecto pesado de P12 (20 × 10 con imágenes) | sin fugas, ~5 ms por edición | ✅ |

| Área | Estado |
|---|---|
| Múltiples páginas | tira de páginas, salto directo, reordenar, copiar contenido (P02) |
| Plantillas distintas | 21 plantillas + iniciales + propias; división diagonal (P01/P11) |
| Assets | biblioteca compartida con deduplicado por huella, galería, fondos (P04) |
| Textos y globos | 9 globos, SFX en 4 idiomas, tategaki, ajuste de cola (P05) |
| Exportación | PDF por rango, ZIP `pagina-001`, PNG/JPG ×3, webtoon segmentado (P10) |

## Fricciones encontradas al producir (y qué se hizo)
| # | Fricción | Antes | Ahora |
|---|---|---|---|
| 1 | Cargar los diálogos de una página larga: cada bloque del guion se colocaba con su propio botón | un clic por bloque y después acomodar el tamaño de cada globo | **"Colocar todo (N)"** en el Guion: todos los bloques pendientes van a sus viñetas, en lugares libres, con los globos ajustados al texto |
| 2 | El globo por defecto no se adapta al texto: los textos largos quedaban apretados y los cortos en globos enormes | redimensionar a mano | **"Ajustar globo al texto"** en Propiedades (mide con la tipografía real; la cola mantiene su dirección) |
| 3 | No había plantilla de portada | armarla desde cero | **Plantilla inicial "Portada"**: imagen a página completa, título, bajada y autor/a, en la página actual o en una nueva |
| 4 | Una sola obra de ejemplo y sin vitrina | — | Galería de **Muestras** en el inicio (Fase 3) |
| 5 | Con la emulación táctil de Chrome no se puede probar en un iPhone real | — | queda como pendiente (P1 de la auditoría final) |

## Tests
- `tests/e2e/muestras-fase1.spec.ts` (3):
  - "Colocar todo" ubica cada bloque dentro de su viñeta y agranda el globo del texto largo;
  - ajustar al texto achica el globo corto y agranda el largo;
  - portada en página nueva con sus 4 capas.
