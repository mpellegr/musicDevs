# Songmap — referencia para continuar en Codex

## Descripción breve

**Songmap** es una aplicación web ligera para representar y editar visualmente la estructura de una canción durante los ensayos, sin necesidad de leer notación musical. Muestra partes (intro, verso, estribillo, puente, outro…), sus duraciones en compases y los cambios de **nota tónica general**, identificados prioritariamente mediante colores. Su propósito es que todos los músicos compartan una referencia inequívoca de cuándo empieza y termina cada parte o cambio.

## Estado del prototipo

- **Versión de referencia:** `Songmap_v00_02.html`.
- **Tecnología actual:** HTML, CSS y JavaScript nativos, todo en un único archivo; funciona localmente en el navegador, sin backend ni dependencias.
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
- Deshacer/rehacer cambios, persistencia local mediante `localStorage`, exportación/importación JSON, impresión y copia de resumen textual.
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

## Referencias técnicas en el HTML

- `NOTE_COLORS` y `ROOTS`: paleta y notas.
- `sample()` / `fresh()`: estado inicial de ejemplo y canción nueva.
- `validState()`: validación al importar JSON.
- `sectionBeats()` / `songBeats()`: duraciones.
- `renderTimeline()`: línea de tiempo principal.
- `renderList()`: lista vertical; **aquí está la lógica proporcional de v00_02**.
- `renderEditor()`: controles de edición de partes y tónicas.
- `resizePart()`: ajuste de duración de parte.
- `save()` / `load()`: persistencia en `localStorage` (clave `songmap_v1_2026`).
- `printMarkup()` / `plainSummary()`: salida para imprimir o compartir.

## Alcance y siguientes posibilidades (no implementadas)

- Pistas independientes para batería, bajo, dos guitarras y voz, con acordes o indicaciones propias por instrumento.
- Integración o sincronización con Ableton Live.
- Mejoras de interacción y visualización que se decidan tras probar el prototipo en ensayos.

Estas posibilidades **no son requisitos cerrados de la versión actual**. No introducirlas sin decidir antes la experiencia de uso.

## Indicaciones para Codex

1. Usar `Songmap_v00_02.html` como fuente de partida y preservar el funcionamiento actual.
2. Mantener como invariante la **escala de duración común entre todas las filas** de «Orden de las partes».
3. No añadir una miniatura extra de la línea de tiempo a esa lista.
4. Mantener los siete colores estables y el mismo color para natural y sostenido.
5. Priorizar edición rápida, legibilidad y facilidad de uso en el ensayo; evitar introducir complejidad de DAW o notación tradicional.
6. Si se refactoriza a varios archivos o a un framework, preservar compatibilidad con los JSON exportados por el prototipo.

## Archivos para el traspaso

- `Songmap_v00_02.html` — aplicación ejecutable y código fuente actual.
- `SONGMAP_HANDOFF_v00_02.md` — este documento de contexto y decisiones.
