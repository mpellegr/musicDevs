# Songmap v01 — referencia para continuar en Codex

## Descripción breve

**Songmap** es una aplicación web ligera para representar y editar visualmente la estructura de una canción durante los ensayos, sin necesidad de leer notación musical. Muestra partes (intro, verso, estribillo, puente, outro…), sus duraciones en compases y los cambios de **nota tónica general**, identificados prioritariamente mediante colores. Su propósito es que todos los músicos compartan una referencia inequívoca de cuándo empieza y termina cada parte o cambio.

## Estado del prototipo

- **Versión de referencia:** `Songmap_v01.html`.
- **Tecnología actual:** HTML, CSS y JavaScript nativos, separados en HTML, CSS y JavaScript; funciona localmente en el navegador, sin backend ni dependencias.
- **Idioma de la interfaz:** español.
- **Diseño:** interfaz oscura, con línea de tiempo horizontal, lista vertical de partes a ancho completo y editor de parte en un modal.
- **Datos iniciales:** canción de ejemplo editable; no es una transcripción fiel de las capturas de Ableton que inspiraron la interfaz.

## Objetivo de producto

Reducir discusiones y ambigüedades en el ensayo sobre la estructura de las canciones: cuántos compases dura un verso, si un puente es más corto, cuándo cambia la tónica o qué diferencia existe entre dos variaciones de una misma parte. Priorizar una lectura visual rápida por encima de funciones avanzadas de producción musical.

## Funciones implementadas

- Editar título, artista, BPM y métrica (numerador y denominador).
- Crear, seleccionar, renombrar, mover, duplicar y eliminar partes de la canción.
- Editar la duración total de una parte; el programa ajusta los bloques de notas al nuevo total.
- Añadir, eliminar y editar cambios de tónica dentro de cada parte.
- Especificar duraciones en compases y tiempos adicionales, para cambios dentro de un compás.
- Visualizar las partes y tónicas sobre una línea de tiempo con divisiones por compás, zoom y ajuste al ancho.
- Mostrar una **lista vertical «Orden de las partes»** con número de parte, asa de arrastre, nombre, duración y bloques de notas coloreados.
- Deshacer/rehacer cambios, persistencia local mediante `localStorage`, exportación/importación JSON, impresión/PDF y PNG para descargar o compartir.
- Interfaz adaptable a pantallas pequeñas.

## Decisión visual fundamental — última corrección (v00_02)

El usuario pidió que **los rectángulos de notas dentro de la lista vertical «Orden de las partes» tengan anchura proporcional a su duración en compases, usando la misma escala para todas las filas**.

Ejemplos:

- Una nota de 8 compases debe medir el doble que una de 4.
- Un verso de 16 compases debe ocupar el doble de ancho total que un puente de 8, aunque estén en filas distintas.
- Una variante `A 6 compases → C# 2 compases` debe distinguirse visualmente de `A 4 → C# 4`.

**No se quería añadir otro minitimeline independiente.** La representación proporcional debe estar en los propios rectángulos de notas de la lista vertical. En v00_02 se usa una escala fija de **16 px por compás** para estos bloques, calculada en `renderList()` mediante `flex: 0 0 ${no.beats/state.numerator*16}px`. El contenedor de notas puede desplazarse horizontalmente si no cabe. La línea de tiempo principal tiene su propio zoom.

Conviene revisar con el usuario la ergonomía de esa lista en pantallas estrechas; no sustituir la escala común por un reparto porcentual independiente en cada fila, pues se perdería la comparación de duraciones.

## Paleta fija de notas

| Nota | Color hexadecimal |
|---|---|
| C | `#E98788` |
| D | `#E9A66F` |
| E | `#E7D079` |
| F | `#83CFA3` |
| G | `#73C7C5` |
| A | `#85A8EB` |
| B | `#B39AE3` |

Son **7 notas, 7 colores**. Las notas con `#` mantienen el color de su nota natural (p. ej., `C#` usa el color de `C`). El nombre de la nota aparece dentro del rectángulo, pero el color tiene prioridad visual. Por ahora se representa **solo la tónica general**, no acordes completos ni armonías por instrumento. La nomenclatura actual es `A B C D E F G`.

## Modelo de datos actual

El estado principal contiene `version`, `title`, `artist`, `bpm`, `numerator`, `denominator` y `sections`. El campo opcional `artist` se normaliza a una cadena vacía al importar JSON anteriores. Cada sección contiene `id`, `name`, `detail` y `notes`. Cada nota contiene `id`, `pitch` (p. ej. `A`, `C#`) y `beats` (duración en tiempos de la métrica actual).

```json
{
  "version": 1,
  "title": "Mi canción",
  "artist": "Mi banda",
  "bpm": 125,
  "numerator": 4,
  "denominator": 4,
  "sections": [
    {
      "id": "p1",
      "name": "VERSO 1",
      "detail": "",
      "notes": [
        { "id": "n1", "pitch": "A", "beats": 24 },
        { "id": "n2", "pitch": "C#", "beats": 8 }
      ]
    }
  ]
}
```

En 4/4, este ejemplo suma 8 compases: A durante 6 y C# durante 2. Los identificadores son ilustrativos; la aplicación genera los suyos. La duración de cada parte **se deriva de la suma de las duraciones de sus notas**. No existe un campo independiente de duración de parte. El cálculo actual de compases es `beats / numerator`.

**Precaución técnica:** al modificar el numerador de la métrica, el programa mantiene el número de tiempos de las notas, lo que puede modificar su duración expresada en compases. Revisar esta semántica antes de evolucionar el modelo.

## Referencias técnicas en Songmap_v01.js

- `NOTE_COLORS` y `ROOTS`: paleta y notas.
- `sample()` / `fresh()`: estado inicial de ejemplo y canción nueva.
- `validState()`: validación al importar JSON.
- `sectionBeats()` / `songBeats()`: duraciones.
- `shortDuration()`: compases con al menos dos dígitos y tiempos adicionales en formato compacto.
- `readableDuration()`: duración textual para ayudas, accesibilidad y resumen copiado.
- `durationMarkup()`: caja común de duración, con clase `bar-duration`.
- `renderTimeline()`: línea de tiempo principal.
- `renderList()`: lista vertical; **aquí está la lógica proporcional de v00_02**.
- `renderEditor()`: controles de edición de partes y tónicas.
- `resizePart()`: ajuste de duración de parte.
- `save()` / `load()`: persistencia en `localStorage` (clave `songmap_v1_2026`).
- `exportComposition()`: composición vectorial compartida para las exportaciones claras y oscuras.
- `printMarkup()`: PDF claro con timeline y lista de partes.
- `pngMarkup()` / `createPng()`: PNG oscuro 9:16.
- `openPng()` / `sharePng()` / `closePng()`: vista previa, compartir y liberación de recursos.

## Alcance y siguientes posibilidades (no implementadas)

- Pistas independientes para batería, bajo, dos guitarras y voz, con acordes o indicaciones propias por instrumento.
- Integración o sincronización con Ableton Live.
- Mejoras de interacción y visualización que se decidan tras probar el prototipo en ensayos.

Estas posibilidades **no son requisitos cerrados de la versión actual**. No introducirlas sin decidir antes la experiencia de uso.

## Indicaciones para Codex

1. Usar `Songmap_v01.html` como fuente de partida y preservar el funcionamiento actual.
2. Mantener como invariante la **escala de duración común entre todas las filas** de «Orden de las partes».
3. No añadir una miniatura extra de la línea de tiempo a esa lista.
4. Mantener los siete colores estables y el mismo color para natural y sostenido.
5. Priorizar edición rápida, legibilidad y facilidad de uso en el ensayo; evitar introducir complejidad de DAW o notación tradicional.
6. Si se refactoriza a varios archivos o a un framework, preservar compatibilidad con los JSON exportados por el prototipo.

## Archivos para el traspaso

- `Songmap_v01.html` — estructura y punto de entrada de la aplicación.
- `Songmap_v01.css` — estilos, formateados con sangría, una propiedad por línea y comentarios de sección.
- `Songmap_v01.js` — lógica y renderizado de la aplicación.
- `SONGMAP_HANDOFF_v01.md` — este documento de contexto y decisiones.

## Reorganización v01

- `Songmap_v01.html`: estructura y punto de entrada; abrir directamente en el navegador.
- `Songmap_v01.css`: estilos extraídos del bloque `<style>`.
- `Songmap_v01.js`: lógica extraída del bloque `<script>`.

El script clásico se carga al final del documento. No requiere servidor, compilación ni dependencias. Los estilos inline y los calculados por JavaScript se conservan. La separación no modifica la lógica ni el diseño; la etiqueta visible de versión pasa a v01.

La versión de la aplicación es independiente del formato JSON: `version: 1` y la clave `songmap_v1_2026` permanecen iguales. La distribución y la semántica de los cambios de métrica quedan pendientes de discusión.

### Equivalencias históricas

| Nombre anterior | Archivo en `_VersionesAnteriores` |
|---|---|
| `mapa_cancion.html` | `Songmap_v00_00.html` |
| `Songmap_v1_1.html` | `Songmap_v00_01.html` |
| `Songmap_v1_2.html` | `Songmap_v00_02.html` |
| `SONGMAP_HANDOFF.md` | `SONGMAP_HANDOFF_v00_02.md` |

Los HTML históricos se conservan íntegros, incluyendo sus etiquetas de versión originales. La documentación histórica adapta las referencias a la nueva convención.

### Código heredado del mapa horizontal

El contenedor `order-map` está oculto mediante `hidden` en el HTML. El código heredado sigue generando sus bloques y conserva sus estilos; no debe mostrarse como una minilínea de tiempo adicional. La escala común de 16 px por compás en los rectángulos de la lista se conserva.
## Ajustes visuales de v01 — 8 de noviembre de 2026

### Duraciones de compases

- Los compases se muestran con al menos dos dígitos: `04`, `08`, `16`, `100`. El cero inicial es solo presentación; no cambia los datos ni los campos numéricos de edición.
- Las duraciones visuales usan una caja sin corchetes, generada por `durationMarkup()`. Los tiempos adicionales se conservan: por ejemplo, `08+2/4` en una métrica de 4/4.
- El estilo compartido está en `.bar-duration, .part-duration`: fondo oscuro `#0d1119`, texto claro `#ebf2fb`, tamaño de 10 px, peso 400, relleno de 5 px y esquinas de 5 px. Estos valores incorporan los ajustes manuales del usuario.
- En **PARTES de la timeline**, el nombre va arriba y la caja de duración debajo, al 100 % del ancho interior disponible del bloque, respetando su relleno lateral.
- En **TÓNICA de la timeline**, solo se muestra la nota cuando hay espacio; no se muestra una caja ni texto de duración. La duración sigue disponible en la ayuda al pasar el cursor y en la etiqueta accesible.
- En **STAT**, el total de compases se presenta como número destacado sin caja, junto a la etiqueta «compases».
- La lista «Orden de las partes» y el resumen del editor mantienen las cajas de duración. La impresión usa una composición vectorial específica, descrita en la sección de impresión de esta revisión.
- Las ayudas usan texto como `08 comp. + 2 t.`. La opción de copiar resumen se ha retirado en favor de PDF y PNG.

### Legibilidad del CSS

`Songmap_v01.css` está organizado con sangría de dos espacios, una declaración por línea, reglas separadas y comentarios de sección. Se mantiene el orden de las reglas para preservar la cascada. Los ajustes visuales posteriores se aplican sobre esta versión legible.

### Validación de esta revisión

Se ha revisado el diff y ejecutado `git diff --check`. La escala proporcional de la lista, la paleta, el formato JSON y la clave de almacenamiento no cambian. No se ha ejecutado una prueba de interfaz en navegador ni una comprobación de sintaxis con Node, que no está disponible en el entorno utilizado.

## Impresión del orden de partes — 8 de noviembre de 2026

- `printMarkup()` genera un SVG con título, BPM, métrica, duración total, timeline y lista de partes. Sustituye la tabla de impresión anterior.
- Cada fila muestra número de orden, compás de entrada, nombre, indicaciones opcionales, duración total y bloques de tónica. Dentro de cada bloque aparecen la nota y su duración en una caja sin corchetes, con al menos dos dígitos.
- Las notas comparten una escala de 16 unidades por compás en todas las filas; no se normaliza cada fila por separado. El área vectorial crece según la parte más larga, sin cortar bloques.
- El PDF usa filas blancas y gris claro, texto oscuro y la paleta fija de tónicas. No incluye fondos oscuros.
- CSS configura A4 vertical con márgenes de 10 mm. El SVG ocupa un área de 190 × 276 mm y escala toda la composición uniformemente dentro de ella, sin fragmentarla en varias páginas.
- La impresión se actualiza con el botón y con el evento `beforeprint`, por lo que también funciona con el comando de impresión del navegador.
- Para exportar el PDF se utiliza «PDF / Imprimir → Guardar como PDF». El PNG tiene un flujo independiente.
- Ajustar todo a una hoja implica reducir el tamaño de lectura cuando hay muchas partes o duraciones excepcionalmente largas. Las opciones de papel, escala y márgenes que fuerce el usuario en el diálogo del navegador pueden alterar la salida.

Validación: Chrome en modo headless ha generado un PDF de una página con la canción de ejemplo y otro de una página con 250 partes. Se ha validado el XML del SVG generado y revisado una captura de la composición de impresión. `git diff --check` sin errores.

## Exportaciones y limpieza de interfaz — 8 de noviembre de 2026

### PNG para móvil y para compartir

- Botón «PNG / Compartir»: genera una imagen opaca de 1080 × 1920 px (9:16), fondo oscuro, título y datos de la canción seguidos del orden de las partes. No incluye timeline.
- La escala de los bloques de notas es común entre filas; se mantienen las duraciones en sus cajas. Toda la composición se adapta dentro de la imagen sin recortarse. Con canciones muy extensas, el texto se reduce.
- Una vista previa permite descargar o compartir el archivo. La imagen se prepara antes del clic en «Compartir…» para conservar la activación de usuario requerida por Web Share.
- Se comprueba `navigator.canShare({files})` antes de habilitar compartir. El usuario elige WhatsApp entre las aplicaciones que ofrezca el dispositivo. No hay envío automático ni una selección forzada de WhatsApp.
- En navegadores sin soporte para compartir archivos, se ofrece descargar el PNG para adjuntarlo manualmente desde WhatsApp o WhatsApp Web. El soporte nativo depende del navegador, contexto seguro y aplicaciones instaladas.
- La generación usa SVG y canvas sin bibliotecas externas. Al cerrar se liberan los object URLs; Escape y el clic fuera cierran la vista previa, y el foco se mantiene entre sus controles.

### PDF claro

- A4 vertical de una sola página, con timeline antes de «Orden de las partes».
- Fondo blanco, filas blancas/gris claro, texto oscuro y cajas de duración claras. Se conservan los colores de las notas.
- La timeline incluye la numeración de compases, partes con su duración y tónicas. El orden de partes mantiene los nombres completos divididos en líneas y las indicaciones opcionales.
- Continúa el ajuste vectorial a una hoja; no depende del zoom ni del desplazamiento de la timeline del editor.

### Interfaz

- Se retiran las leyendas de siete colores y del sostenido tanto de la interfaz como de las exportaciones. La paleta y la edición de sostenidos se conservan.
- Se retiran el botón de copiar resumen y su código.
- El texto «Inicio en compás 1…» se sustituye por un CONSEJO con el estilo del antiguo pie. El contenido queda en `#context-tip`; por ahora es estático y los consejos según la sección activa se decidirán más adelante.

### Validación

Chrome ha generado un PNG válido con dimensiones 1080 × 1920 y un PDF de una página. Se han revisado capturas de ambas composiciones. Se han comprobado en el navegador la descarga disponible sin Web Share, el envío de un archivo PNG mediante una implementación simulada de Web Share, la cancelación y la liberación de recursos al cerrar. El selector real de aplicaciones y el envío a WhatsApp requieren probarse en un dispositivo con esa integración; no se ha enviado ningún archivo a terceros.

## Reordenar notas en el editor

Cada fila de tónica incluye botones ↑ y ↓ para moverla dentro de la parte. El primero deshabilita subir y el último deshabilita bajar; si solo hay una nota, ambos están deshabilitados. Los cuatro botones (subir, bajar, añadir y eliminar) se organizan en una sola línea, con campos y controles más compactos en móvil.

`moveNote()` cambia el orden conservando identificador, nota y duración, selecciona la nota movida y mantiene el foco en sus controles. Usa `mutate()` para actualizar timeline, lista, exportaciones, almacenamiento y deshacer/rehacer. Los intentos fuera de los límites no generan cambios ni historial.

### Arrastre de notas con ratón

El índice de cada nota es un asa con indicador ⠿. `attachNoteDragging()` permite arrastrarla antes o después de otra fila; una línea marca el punto de inserción. Se usa el arrastre nativo del navegador, con las flechas como alternativa para dispositivos táctiles. Solo se arrastra desde el asa para conservar la edición normal de los campos.

Soltar en la misma posición o cancelar no crea historial. El cambio se aplica mediante `moveNote()`, conservando duración, persistencia y deshacer/rehacer. Tras soltar se devuelve el foco al asa de la nota movida.

## Editor modal y acciones en la lista de partes

- «Orden de las partes» ocupa todo el ancho del área de trabajo. Se retiran los límites de altura de la lista para que crezca con su contenido.
- Un clic en una parte o tónica selecciona; el doble clic abre el editor dentro de «Orden de las partes». Si ya está abierto, el clic cambia su contenido. Editar parte y Añadir parte permiten abrirlo directamente, también en móvil.
- El editor tiene cabecera con navegación y botón × destacado. Se usa un `<dialog>` no bloqueante contenido en la tarjeta de partes; puede crecer hacia abajo y la timeline sigue siendo interactiva. Se cierra con × o Escape.
- Al cerrar se confirma el campo activo y se devuelve el foco al control de origen o a la parte seleccionada. La edición sigue guardándose automáticamente mediante el flujo habitual, sin botón Guardar.
- Mover anterior/siguiente, Duplicar y Eliminar pasan al pie de «Orden de las partes», junto a la indicación de parte seleccionada y un botón Editar parte. Actúan sobre la selección y no abren el modal; Eliminar conserva la confirmación.
- Se mantienen las protecciones para la primera/última parte y para no eliminar la única parte. Reordenar notas con asa o flechas y deshacer/rehacer siguen disponibles dentro del modal.

Validación en Chrome: apertura desde lista y tónica, cierre y confirmación del campo activo, selección visible, mover/duplicar/eliminar desde el pie, Escape, añadir parte, reordenar notas y deshacer. Se ha revisado una captura del modal y comprobado que el editor no presenta desbordamiento horizontal en las ventanas de prueba.

### Ancho y navegación del modal

El editor ocupa el ancho interior de «Orden de las partes», con márgenes para distinguirlo de la tarjeta contenedora. Su tamaño responde al ancho de la tarjeta sin mediciones ni posicionamiento fijo.

Antes de Cerrar se muestran ← y → para navegar a la parte anterior/siguiente sin cerrar el modal. `navigateEditor()` confirma los campos pendientes, cambia la selección y restablece el desplazamiento del cuerpo; no reordena las partes ni genera historial por navegar. Las flechas se deshabilitan en los extremos y ambas si solo hay una parte.

Los campos Nota / Compases / + Tiempos reservan espacio para los cuatro botones de cada nota en una sola línea. La disposición se compacta en pantallas pequeñas. Verificado en Chrome el ancho, la navegación, los campos pendientes, los límites y la alineación sin desbordamiento horizontal, tanto en escritorio como en un viewport de 320 px.

## Cabecera, artista, timeline compacta y posición del modal

- La marca muestra `SONGMAP v01.00`. Se retiran el texto comercial de portada y «Mapa de estructura · v01». Los archivos de esta revisión siguen siendo `Songmap_v01.*`; la versión JSON continúa siendo `1`.
- El campo opcional Artista se limita a 100 caracteres. Se incluye en estado, almacenamiento, deshacer/rehacer, importación y exportación JSON, y en las cabeceras de PNG y PDF. Los JSON antiguos siguen cargando con `artist: ""`.
- `exportFilename()` comparte la convención `Título_mapa.json`, `Título_mapa.png` y `Título_mapa.pdf`, utilizando el mismo saneado de título que el JSON. El PDF sugiere el nombre mediante `document.title` antes de imprimir; `afterprint` restaura el título de la pestaña. La aplicación propone el nombre y el navegador gestiona el diálogo final de guardado.
- Resumen y CONSEJO están en un `<footer>` al final del área principal.
- La fila COMPÁS se reduce de 39 a 20 px y sus números se centran en la división correspondiente. PARTES conserva 62 px con el texto centrado. TÓNICA se reduce de 84 a 42 px, con bloques de 35 px y nombres de nota de tamaño uniforme de 12 px; se omiten las etiquetas cuando el bloque no tiene ancho para mostrarlas.
- La timeline inicia ajustada al ancho, también en una canción nueva. Auto calcula el ancho sin un mínimo de píxeles por compás. El control de zoom permanece habilitado: al moverlo se pasa a zoom manual; Ajustar al ancho permite volver a Auto. El renderizado calcula la timeline después de montar la lista para tener en cuenta la barra de desplazamiento de la página.
- El editor se contiene dentro de «Orden de las partes», sin desplazar la vista al abrirse ni bloquear la timeline. Esta interacción sustituye al anterior modal fijo que desplazaba la página.
- El editor crece hacia abajo dentro de la tarjeta, sin limitarse a la altura de la ventana ni añadir un scroll interior. La página conserva su desplazamiento normal.

Validación: 20 comprobaciones en cada viewport de escritorio, 320 × 740 y 740 × 360. Incluyen Auto/zoom manual, compatibilidad de JSON sin artista, persistencia e importación de artista, texto de artista en exportaciones, nombre real del archivo PNG, nombre propuesto de PDF y restauración de título, footer, alturas y tipografía de timeline, posición del modal, timeline visible y ausencia de desbordamiento horizontal.

## Interacción vigente: editor contenido y doble clic

- Clic simple en lista, parte de timeline o tónica: solo selecciona. Doble clic: selecciona y abre el editor. Se conservan los nodos de las partes al seleccionar para que el navegador pueda detectar el doble clic real.
- Si el editor ya está abierto, cualquier selección en la timeline actualiza su contenido y conserva la apertura. No hay toggle ni cierre por pulsar el fondo.
- El diálogo está dentro de `.part-editor-layer`, en la tarjeta de Orden, con margen, borde y sombra. Se abre mediante su propiedad `open`, sin `showModal()`, scroll programático, bloqueo del fondo ni ajuste de posición fija.
- Mientras está abierto se ocultan la lista de filas y las acciones Editar / Mover / Duplicar / Eliminar. El alto previo de la tarjeta se conserva como mínimo para evitar saltos; el editor puede ampliarla hacia abajo.
- La cabecera, los datos de canción y la timeline conservan sus posiciones. El botón × de cierre tiene tamaño y contraste destacados; Escape también cierra el editor.
- Se mantienen navegación entre partes, edición de notas, arrastre, flechas y guardado automático. Los cambios pendientes se confirman antes de cambiar la selección o cerrar.

Validación en Chrome: 16 comprobaciones tanto en escritorio como en un viewport de 320 px, incluyendo clic simple/doble, conservación del nodo clicado, apertura sin cambiar el scroll, editor dentro de la tarjeta con márgenes, acciones ocultas/restauradas, selección desde timeline sin cerrar ni hacer toggle, navegación, Escape y ausencia de desbordamiento horizontal. Revisada una captura con cabecera y timeline visibles encima del editor.

## Ajuste de filas y arrastre de partes

- Se restaura el botón Cerrar con el estilo normal de botón pequeño; sustituye al × destacado.
- En la lista «Orden de las partes» se retira el compás de entrada debajo del número de parte. El número y el indicador ⠿ forman el asa de arrastre.
- `attachPartDragging()` permite mover una parte antes o después de otra mediante arrastre nativo con ratón. Las líneas de inserción, cancelación y comportamiento son equivalentes al arrastre de notas. Los botones Mover se mantienen como alternativa para móvil y teclado.
- `reorderPart()` conserva el objeto completo de la parte, sus notas, duraciones e identificadores; selecciona la parte movida y utiliza `mutate()` para actualizar el guardado, timeline, exportaciones y deshacer/rehacer. Soltar en la misma posición no genera historial.
- Las filas miden 46 px. Duración total y bloques de notas ocupan su altura interior completa y comparten texto de 12 px. Las notas mantienen la escala de 16 px por compás entre todas las filas.
- El contenedor de notas conserva el desplazamiento horizontal, con la barra visual oculta para igualar las alturas incluso en móvil. El compás de entrada también se retira de las filas de Orden exportadas; el PDF conserva la numeración de su timeline.

Validación en Chrome: 13 comprobaciones en escritorio y viewport de 320 px, incluyendo arrastre arriba/abajo, persistencia, deshacer/rehacer, posición sin cambios, limpieza de indicadores, número y asa, altura común de fila/duración/notas, tamaño de texto, escala proporcional y botón Cerrar.

### Filas de Orden en PNG y PDF

Las exportaciones replican los últimos ajustes de la lista: número de parte sin compás de entrada debajo y encabezado «#». La caja de duración total y los bloques de notas tienen la altura completa de la fila, conservando los márgenes entre filas. El total aumenta a 12 px, igual que las etiquetas de tónica cuando hay ancho suficiente; las duraciones dentro de cada nota se conservan.

Se mantiene la escala común de 16 unidades por compás, los colores, el PNG oscuro 9:16 y el PDF claro con timeline y ajuste a una hoja. Las exportaciones no incluyen asas de arrastre ni controles de edición.

Validación: 11 comprobaciones en Chrome de SVG válido, alturas y alineación de cajas, ausencia del compás de inicio y escala proporcional en ambos temas; generación de PNG de 1080 × 1920 y PDF de una página.

### Editor cubriendo toda la cabecera de Orden

Mientras el editor está abierto se oculta también `.listhead`, incluido «Añadir parte». El editor comienza en la parte superior de la tarjeta, con un padding exterior uniforme de 12 px en los cuatro lados (6 px en móvil), por lo que gana ancho respecto a la disposición anterior. Al cerrar se recuperan cabecera, lista y acciones. La timeline permanece fuera de esta tarjeta y sigue visible e interactiva.
