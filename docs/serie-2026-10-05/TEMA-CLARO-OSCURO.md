# Modo día (claro) / noche (oscuro)

Rama: `feat/tema-claro-oscuro` (desde `main` @ 6050503).

- Botón sol/luna en el inicio y en la barra del editor. En pantallas chicas está como
  "Modo día / Modo noche" en el menú Exportar ▾ del estudio y en el menú "⋯" del modo simple.
- **Se guarda por usuario** en el navegador (`localStorage`, clave `vineta:tema`) y se aplica
  antes del primer render, así no hay parpadeo al volver a entrar. Por defecto, noche (el look
  de siempre).
- Implementación: la escala `ink` se invierte bajo `:root[data-theme='light']`, con contraste AA.
  - Nuevo token `--color-fg` (texto principal) reemplaza los `text-white` de la interfaz. Los
    que están sobre fondos de acento o en las salas de lectura siguen blancos.
  - En claro se oscurecen `accent-bright` y el verde de marca para que pasen el contraste.
  - El fondo del lienzo, las tramas y la barra del navegador (`theme-color`) acompañan.
  - El lector y la previsualización quedan oscuros a propósito.
- Tests: `tests/e2e/tema-claro-oscuro.spec.ts` (3):
  - por defecto noche; el cambio se guarda y sobrevive a recargar, a abrir un proyecto y a
    volver a cambiar desde el editor;
  - menú del celular;
  - axe en claro (contraste incluido) en inicio, editor y las 4 pestañas.
- Resultados: lint 0 errores · unit 106/106 · E2E 156/156 · build OK.
