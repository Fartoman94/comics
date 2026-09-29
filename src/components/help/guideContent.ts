export interface GuideTopic {
  id: string
  title: string
  summary: string
  steps: { title: string; body: string }[]
  tips?: string[]
}

export const GUIDE: GuideTopic[] = [
  {
    id: 'start',
    title: 'Primeros pasos',
    summary: 'Tu primera página en cinco minutos.',
    steps: [
      { title: 'Creá un proyecto', body: 'En la pantalla de inicio tocá "Nuevo proyecto". Elegí el tipo de obra (cómic, manga, webtoon o libre) y el formato de página. Ya arranca con portada y páginas con viñetas.' },
      { title: 'Elegí la distribución de viñetas', body: 'Abrí la pestaña Viñetas y tocá una plantilla. Podés ajustar el margen y el espacio entre viñetas antes de aplicarla.' },
      { title: 'Cargá tus imágenes', body: 'En Imágenes subí tus fotos o dibujos. Después arrastralos sobre cada viñeta: la imagen la rellena sola.' },
      { title: 'Agregá diálogos', body: 'Desde Insertar sumá globos y onomatopeyas. Doble clic sobre un globo para escribir.' },
      { title: 'Leé y exportá', body: 'Tocá Leer para verlo como un libro y Exportar para bajarlo en PDF, imágenes o libro web.' },
    ],
    tips: ['Todo se guarda solo en este navegador. Para tener una copia de seguridad usá Exportar → Proyecto editable (.vineta).'],
  },
  {
    id: 'pages',
    title: 'Páginas',
    summary: 'Agregar, ordenar y duplicar páginas.',
    steps: [
      { title: 'Agregar', body: 'En la pestaña Páginas tocá "+ Página" o el recuadro "Nueva página".' },
      { title: 'Reordenar', body: 'Arrastrá una miniatura a otra posición, o usá las flechas que aparecen al pasar el mouse.' },
      { title: 'Duplicar y eliminar', body: 'Con los botones de cada miniatura. Si te equivocás, Ctrl+Z lo deshace.' },
      { title: 'Fondo de página', body: 'Sin nada seleccionado, el panel de Propiedades muestra el color de fondo y el nombre de la página.' },
    ],
    tips: ['Re Pág / Av Pág cambian de página rápido.'],
  },
  {
    id: 'panels',
    title: 'Viñetas',
    summary: 'Plantillas, viñetas a mano y bordes.',
    steps: [
      { title: 'Plantillas', body: 'Viñetas → elegí una. "Reemplazar" cambia las viñetas actuales y conserva las imágenes; "Agregar encima" suma sin borrar.' },
      { title: 'Dibujar una viñeta', body: 'Herramienta Viñeta (P) y arrastrá un rectángulo sobre la página.' },
      { title: 'Mover y cambiar tamaño', body: 'Con Seleccionar (V) arrastrá la viñeta o sus esquinas. El imán la alinea con bordes y otras viñetas; mantené Alt para soltarlo.' },
      { title: 'Borde y fondo', body: 'En Propiedades cambiá el grosor y color del borde, el fondo y las esquinas redondeadas.' },
    ],
  },
  {
    id: 'images',
    title: 'Imágenes y fotos',
    summary: 'Subir, encuadrar, recortar y superponer.',
    steps: [
      { title: 'Subir', body: 'Imágenes → "Subir imágenes o fotos". También podés arrastrarlas desde tu computadora al lienzo o pegarlas con Ctrl+V.' },
      { title: 'Poner una imagen en una viñeta', body: 'Arrastrala desde Imágenes y soltala sobre la viñeta. Si tenés una viñeta seleccionada, un clic en la imagen la coloca ahí.' },
      { title: 'Encuadrar', body: 'Doble clic en la viñeta: arrastrá para mover la imagen y usá la rueda (o el control deslizante) para acercar. "Listo" para terminar.' },
      { title: 'Imagen libre y recorte', body: 'Si la soltás fuera de una viñeta queda como imagen libre (personajes, objetos). Doble clic para recortarla moviendo el marco naranja.' },
      { title: 'Superponer', body: 'Ordená con los botones de Orden (al frente / al fondo) y probá los modos de Fusión: Multiplicar para tinta sobre color, Trama para luces.' },
      { title: 'Filtros', body: 'Blanco y negro, Tinta, Sepia, Noir, contraste y brillo en Propiedades.' },
    ],
  },
  {
    id: 'text',
    title: 'Globos y textos',
    summary: 'Diálogos, narración y onomatopeyas.',
    steps: [
      { title: 'Agregar un globo', body: 'Insertar → Globos, o la herramienta Globo (G) y un clic en la página.' },
      { title: 'Escribir', body: 'Doble clic sobre el globo o texto. Ctrl+Enter o Esc para terminar.' },
      { title: 'Apuntar la cola', body: 'Seleccioná el globo y arrastrá el punto naranja hacia quien habla.' },
      { title: 'Cambiar la forma', body: 'En Propiedades: diálogo, pensamiento, grito, susurro, narración o recuadro nube.' },
      { title: 'Onomatopeyas', body: 'Insertar → Onomatopeyas trae SFX listos. Ajustá contorno, inclinación y sombra en Propiedades.' },
    ],
  },
  {
    id: 'languages',
    title: 'Japonés, coreano y chino',
    summary: 'Fuentes asiáticas y escritura vertical.',
    steps: [
      { title: 'Escribir', body: 'Usá el teclado de tu sistema (IME) para escribir en japonés, coreano o chino dentro de cualquier globo o texto.' },
      { title: 'Elegir la fuente', body: 'En Propiedades → Fuente están agrupadas por idioma: Noto Sans JP / KR / SC / TC y fuentes de SFX como Dela Gothic One o Black Han Sans.' },
      { title: 'Vertical (縦書き)', body: 'Activá "Vertical" para rotular en columnas de arriba hacia abajo, como en el manga japonés.' },
    ],
    tips: ['Para manga poné el sentido de lectura en "Der → Izq" (Propiedades con nada seleccionado).'],
  },
  {
    id: 'drawing',
    title: 'Dibujo y efectos',
    summary: 'Pincel, borrador, tramas y líneas manga.',
    steps: [
      { title: 'Dibujar', body: 'Pincel (B): elegí Tinta, Pluma, Lápiz o Marcador, el color y el tamaño. Con lápiz óptico se usa la presión.' },
      { title: 'Borrar', body: 'Borrador (E). Sólo borra la capa de dibujo, no las imágenes ni las viñetas.' },
      { title: 'Capas de dibujo', body: 'Insertar → "Nueva capa de dibujo" para separar boceto, entintado y color.' },
      { title: 'Efectos manga', body: 'Seleccioná una viñeta y en Insertar → Efectos elegí líneas de impacto, de velocidad o tramas: se ajustan a la viñeta.' },
    ],
    tips: ['[ y ] cambian el tamaño del pincel.'],
  },
  {
    id: 'read',
    title: 'Leer y exportar',
    summary: 'Ver como libro y compartir tu obra.',
    steps: [
      { title: 'Leer', body: 'Botón Leer: las páginas se dan vuelta arrastrando la esquina o deslizando con el dedo. Modo Scroll para webtoon.' },
      { title: 'Libro web', body: 'Exportar → Libro web (.html): un solo archivo con el mismo visor, para compartir o subir a cualquier web.' },
      { title: 'Imprimir', body: 'Exportar → PDF para imprimir, a doble resolución.' },
      { title: 'Publicar en plataformas', body: 'ZIP con todas las páginas en PNG numeradas, o tira vertical larga para webtoon.' },
      { title: 'Copia de seguridad', body: 'Proyecto editable (.vineta) guarda todo con las imágenes; se vuelve a abrir desde "Importar" en el inicio.' },
    ],
  },
  {
    id: 'mobile',
    title: 'En el celular',
    summary: 'Cómo moverte con los dedos.',
    steps: [
      { title: 'Paneles', body: 'La barra de abajo abre Páginas, Viñetas, Imágenes, Insertar, Capas y Ajustes como hojas deslizables.' },
      { title: 'Moverte por la página', body: 'Arrastrá un dedo sobre un espacio vacío para desplazarte y pellizcá con dos dedos para hacer zoom.' },
      { title: 'Acciones rápidas', body: 'Al seleccionar algo aparece una barra con Propiedades, Duplicar, Al frente, Al fondo y Eliminar.' },
    ],
  },
]
