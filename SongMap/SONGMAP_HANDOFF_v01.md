# Songmap v01 — referencia para continuar en Codex

## Descripción breve

**Songmap** es una aplicación web ligera para representar y editar visualmente la estructura de una canción durante los ensayos, sin necesidad de leer notación musical. Muestra partes (intro, verso, estribillo, puente, outro…), sus duraciones en compases y los cambios de **nota tónica general**, identificados prioritariamente mediante colores. Su propósito es que todos los músicos compartan una referencia inequívoca de cuándo empieza y termina cada parte o cambio.

## Estado del prototipo

- **Versión de referencia:** `Songmap_v01.html`.
- **Tecnología actual:** HTML, CSS y JavaScript nativos, separados en HTML, CSS y JavaScript; funciona localmente en el navegador, sin backend ni dependencias.
- **Idioma de la interfaz:** español.
- **Diseño:** interfaz oscura, con línea de tiempo horizontal, lista vertical de partes y panel de edición.
- **Datos iniciales:** canción de ejemplo editable; no es una transcripción fiel de las capturas de Ableton que inspiraron la interfaz.

## Objetivo de producto

Reducir discusiones y ambigüedades en el ensayo sobre la estructura de las canciones: cuántos compases dura un verso, si un puente es más corto, cuándo cambia la tónica o qué diferencia existe entre dos variaciones de una misma parte. Priorizar una lectura visual rápida por encima de funciones avanzadas de producción musical.

## Funciones implementadas

- Editar título, BPM y métrica (numerador y denominador).
- Crear, seleccionar, renombrar, mover, duplicar y eliminar partes de la canción.
- Editar la duración total de una parte; el programa ajusta los bloques de notas al nuevo total.
- Añadir, eliminar y editar cambios de tónica dentro de cada parte.
- Especificar duraciones en compases y tiempos adicionales, para cambios dentro de un compás.
- Visualizar las partes y tónicas sobre una línea de tiempo con divisiones por compás, zoom y ajuste al ancho.
- Mostrar una **lista vertical «Orden de las partes»** con compás de inicio, nombre, duración y bloques de notas coloreados.
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

El estado principal contiene `version`, `title`, `bpm`, `numerator`, `denominator` y `sections`. Cada sección contiene `id`, `name`, `detail` y `notes`. Cada nota contiene `id`, `pitch` (p. ej. `A`, `C#`) y `beats` (duración en tiempos de la métrica actual).

```json
{
  "version": 1,
  "title": "Mi canción",
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
