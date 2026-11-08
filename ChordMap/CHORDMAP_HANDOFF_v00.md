# ChordMap v00 — referencia de entrada en Codex

## Punto de partida

Aplicación para construir diagramas de acordes de guitarra, identificar su nombre y exportarlos para utilizarlos en el trabajo musical. La prioridad es una edición sencilla y cómoda desde el móvil.

El 8 de noviembre de 2026 se establece **v00.4.9.3** como referencia del paso del desarrollo con ChatGPT a Codex.

- `v00` identifica la etapa inicial en Codex.
- `4.9.3` identifica el código heredado del que partimos.
- Este cambio de nomenclatura no implica mejoras funcionales ni una versión ya validada.
- Las versiones anteriores realizadas con ChatGPT quedan fuera del seguimiento activo. Los archivos recibidos se conservan íntegros en `Originales/`.

## Archivos actuales

- `Chordmap_v00.4.9.3.tsx`: copia de trabajo del componente heredado; solo cambia la cabecera de identificación.
- `CHORDMAP_HANDOFF_v00.md`: documentación activa de la etapa v00.
- `Originales/`: material recibido, sin renombrar ni modificar. Incluye el código de origen, el handoff original y el acceso directo a StackBlitz.

La base funcional de referencia es `Chordmap_v00.4.9.3.tsx`. No es necesario reconstruir el historial anterior para continuar.

## Estado real

El código es un componente React con TypeScript que dibuja el diagrama mediante SVG. Usa clases de Tailwind y un layout inline con una columna fija de 420 px.

No se han recibido `index.html`, `style.css`, un punto de montaje de React ni configuración de dependencias. Por tanto, los archivos locales todavía no forman una aplicación ejecutable completa. El handoff original describe una ejecución en StackBlitz; esa ejecución no se ha verificado durante esta revisión.

La inspección del código confirma estas funciones, pendientes de prueba en navegador:

- Seis cuerdas en afinación estándar, marcadores de punto o dedos 1–4 y un marcador por cuerda.
- Entre 3 y 8 trastes visibles y selección del traste inicial.
- Cuerdas al aire indicadas con un círculo naranja detrás de su letra; sin X visible.
- Nombre automático y nombre manual alternativo.
- Borrado de marcadores, cuerdas abiertas y estado completo.
- Persistencia en `localStorage`, importación/exportación JSON y generación/previsualización PNG.
- Trece comprobaciones internas del motor de nombres, que escriben el resultado en consola.

## Datos y compatibilidad

El estado contiene `frets`, `startFret`, `chordName`, `markers` y `tops`. Cada marcador contiene `stringIndex`, `fret` y `label`; cada entrada de `tops` contiene `mute` y `open`.

- La clave de almacenamiento sigue siendo `chord-editor-state-v4`.
- Los trastes de los marcadores son relativos al traste inicial.
- El nombre manual tiene prioridad sobre el automático.
- `mute` sigue afectando al reconocimiento aunque no se muestre una X.
- La nueva numeración de la aplicación no cambia el formato JSON ni la clave de almacenamiento.
- Los datos de `localStorage` de StackBlitz no se trasladan automáticamente a una aplicación servida desde otro origen; el JSON es la vía de intercambio existente.

## Pendientes detectados

1. **Ejecución local y estilos:** preparar una aplicación ejecutable y comprobar el diseño móvil.
2. **PNG:** sigue usando `canvas.toDataURL()` y un enlace de descarga. Falta verificar nombre de archivo, descarga en móvil y gestión de errores. La alternativa mediante Blob aún no está implementada.
3. **Copiar nombre:** no existe el botón ni su lógica.
4. **Validación de datos:** la importación mezcla el JSON con el estado inicial sin validar su estructura. La recuperación desde `localStorage` tampoco valida el contenido.
5. **Marcadores ocultos:** reducir los trastes visibles no elimina los marcadores que quedan fuera del diagrama; siguen interviniendo en el nombre automático.
6. **Reconocimiento:** toma como raíz la primera cuerda activa en orden de sexta a primera; no calcula la altura real de todas las notas ni busca la fundamental armónica. Los tests internos no cubren toda la aplicación.
7. **Geometría:** el fallback de `fretY(fret + 1)` mediante `||` es redundante en estados válidos.

## Organización siguiente, pendiente de acordar

Se ha propuesto seguir el esquema de SongMap: HTML, CSS y JavaScript separados, con documentación junto a la aplicación y originales conservados aparte.

En ChordMap esto requiere adaptar React a JavaScript nativo; no es una simple extracción de bloques. Esa conversión todavía no se ha realizado. La referencia actual permanece en **v00.4.9.3**; no se establece una v01 en este ajuste.

## Reglas para continuar

1. Mantener `Originales/` intacto.
2. Partir de la copia de trabajo identificada como v00.4.9.3.
3. Preservar las funciones existentes y la compatibilidad de los JSON.
4. Separar los cambios de organización de las correcciones funcionales para poder revisarlos.
5. Verificar editor, nombres, persistencia, intercambio JSON, PNG y uso móvil antes de declarar una versión estable.
6. Comentar la propuesta de organización antes de implementarla y hacer el commit acordado.
