# Chord Diagram Editor — Development Handoff

## 1. Objetivo

Desarrollar una aplicación web ligera e interactiva para crear diagramas de acordes de guitarra, sin necesidad de conocimientos de notación musical.

El usuario debe poder construir acordes visualmente, identificar su nombre automáticamente y exportar los diagramas para utilizarlos en su trabajo musical.

**Objetivo de producto:** una herramienta sencilla, rápida y cómoda de utilizar desde el móvil, evitando configuraciones técnicas o pasos innecesarios.

## 2. Estado actual

- **Versión estable de referencia:** v4.8.
- **Última versión de código disponible:** v4.9.3.
- **Entorno de ejecución actual:** StackBlitz, proyecto React + TypeScript.
- **Archivo principal:** `Chord-editor-v4.9.3.tsx`, utilizado como componente principal de React.
- **Estilos:** `style.css`.
- **HTML:** `index.html`, con `<div id="root"></div>`.
- **Persistencia:** localStorage del navegador.

La aplicación se ha ejecutado en StackBlitz y se ha mostrado correctamente el diagrama y el panel de controles.

**Importante:** el código v4.9.3 está disponible, pero no se ha confirmado que todas sus funciones estén probadas y funcionando correctamente.

## 3. Funcionalidades implementadas en el código

### Editor de diagramas

- Diagrama de guitarra de seis cuerdas en afinación estándar (E A D G B e).
- Representación mediante SVG.
- Interacción por clic sobre las posiciones del diapasón.
- Un marcador por cuerda.
- Marcadores naranjas con punto o números de dedo (1–4).
- Número configurable de trastes visibles (3–8).
- Traste inicial configurable.
- Numeración absoluta de trastes a la izquierda.
- Representación de cuerdas al aire mediante un círculo naranja detrás de la letra correspondiente.
- Posibilidad de borrar marcadores, cuerdas abiertas o reiniciar el diagrama.

La versión actual elimina la representación visual de cuerdas silenciadas mediante X.

### Identificación automática

Motor de reconocimiento de acordes basado en las notas activas.

Incluye reglas para:

- Mayor, menor y power chords.
- sus2 y sus4.
- add9 y add11.
- Sextas y séptimas.
- maj7, m7 y m(maj7).
- Disminuidos y aumentados.
- Alteraciones b5 y #5.

El algoritmo utiliza como raíz la nota más grave que suena, no necesariamente la fundamental armónica del acorde.

Permite introducir manualmente un nombre alternativo.

Incluye pruebas internas del motor ejecutadas en consola.

### Persistencia e intercambio

- Guardado automático del estado en localStorage.
- Importación de diagramas mediante JSON.
- Exportación JSON.
- Exportación PNG.
- Previsualización del PNG generado.

## 4. Estado de la interfaz

La versión React utiliza clases de Tailwind CSS, pero el proyecto StackBlitz no tenía Tailwind configurado.

Esto provocó que los controles aparecieran prácticamente sin estilos, mientras que el SVG conservaba su presentación.

Se proporcionó una hoja `style.css` con CSS convencional para:

- Diseño vertical de una sola columna.
- Ancho máximo de 520 px.
- Tipografía sans serif.
- Tarjetas con fondo blanco y esquinas redondeadas.
- Controles de mayor tamaño.
- Espaciado entre botones y grupos.
- Diseño responsive orientado a móvil.

**Pendiente de verificar:** que este CSS se haya incorporado efectivamente al proyecto y que el resultado visual sea satisfactorio.

La captura disponible muestra la aplicación antes de aplicar esos estilos.

## 5. Problemas y mejoras pendientes

### Prioridad alta — Exportación PNG

Se informó de problemas para descargar el PNG y de descargas con el nombre genérico `download`.

La versión v4.9.3 utiliza `canvas.toDataURL()` para generar la imagen y un enlace HTML para descargarla.

Se propuso sustituir el procedimiento por una exportación basada en Blob y `URL.createObjectURL()`, pero no hay confirmación de que se haya aplicado.

Requisitos:

- Descargar correctamente el PNG.
- Utilizar el nombre `acorde_<nombre>.png`.
- Mantener la previsualización.
- Comprobar funcionamiento en navegadores de escritorio y móviles.
- Gestionar correctamente errores de conversión y descarga.

### Prioridad alta — Copiar nombre del acorde

Se solicitó un botón junto al nombre del acorde para copiarlo al portapapeles.

Requisitos:

- Copiar el nombre efectivo, manual o automático.
- Mostrar confirmación visual.
- Contemplar navegadores donde Clipboard API no esté disponible.

La funcionalidad fue propuesta, pero no está implementada en el código v4.9.3 compartido.

### Prioridad alta — UX móvil

Verificar y ajustar el diseño responsive.

Objetivos:

- Diagrama visible sin scroll horizontal.
- Controles accesibles con el dedo.
- Jerarquía visual clara.
- Espaciado consistente.
- Reducir el espacio ocupado por opciones secundarias.
- Priorizar el diagrama y las acciones habituales.

### Prioridad media — Validación funcional

Revisar el comportamiento del editor, especialmente:

- Posicionamiento y eliminación de marcadores.
- Selección de cuerdas al aire.
- Reconocimiento de acordes.
- Importación/exportación JSON.
- Persistencia entre sesiones.
- Exportación PNG.
- Funcionamiento táctil.

No asumir que los autotests existentes cubren toda la aplicación.

## 6. Consideraciones técnicas

### Problema detectado en el código actual

La función `fretY()` calcula posiciones mediante:

`padding.top + ((f - 1) * gridH) / state.frets`

Sin embargo, el cálculo de `yBot` utiliza:

`fretY(fret + 1) || padding.top + gridH`

El fallback no aporta protección real porque `fretY()` devuelve un número válido.

No es necesariamente un error funcional, pero merece revisión.

### Otras consideraciones

- La estructura original del componente es monolítica.
- No es necesario refactorizarla para resolver los problemas actuales.
- El estado del editor se guarda bajo la clave `chord-editor-state-v4`.
- La exportación utiliza el nombre manual o el calculado automáticamente.
- El SVG tiene dimensiones internas de 420 × 520.
- El layout original contiene `gridTemplateColumns: "420px 1fr"` como estilo inline; el CSS responsive propuesto lo sobrescribe mediante `!important`.

Este último punto debería corregirse estructuralmente cuando se revise el layout, sin alterar el comportamiento funcional.

## 7. Reglas de desarrollo

**La prioridad absoluta es preservar la funcionalidad existente.**

En iteraciones anteriores, modificaciones visuales provocaron accidentalmente la eliminación del grid, la interacción o las exportaciones.

Por tanto:

1. No reescribir el componente completo para realizar cambios pequeños.
2. Trabajar sobre el código real disponible.
3. Modificar exclusivamente los bloques necesarios.
4. Verificar que ninguna función existente desaparezca.
5. Mantener v4.8 como referencia estable histórica.
6. Antes de un salto de versión importante, solicitar autorización para crear un nuevo backup.
7. No dar por implementadas funcionalidades que solo se hayan propuesto.
8. Evitar añadir dependencias innecesarias.
9. Priorizar soluciones sencillas, mantenibles y fáciles de desplegar.

## 8. Próximo trabajo recomendado

**Primera iteración: estabilización de la versión actual.**

1. Inspeccionar el proyecto real de StackBlitz o los archivos locales.
2. Confirmar que la hoja CSS está aplicada.
3. Corregir exportación PNG y nombres de archivo.
4. Implementar el botón de copiar nombre.
5. Validar la interacción del diagrama y los controles.
6. Comprobar la presentación en móvil.

No introducir nuevas funcionalidades musicales ni refactorizaciones extensas durante esta iteración.

## 9. Criterios de aceptación

La iteración estará completada cuando:

- El editor siga permitiendo construir acordes.
- El nombre automático y el manual funcionen.
- El botón de copiar nombre funcione.
- Los archivos PNG se generen y descarguen correctamente.
- El nombre del archivo corresponda al acorde.
- La importación/exportación JSON siga funcionando.
- El diseño sea utilizable desde un móvil.
- No se hayan perdido funcionalidades existentes.

## 10. Instrucción para Codex

Comienza inspeccionando los archivos existentes y verificando el estado real del proyecto.

No presupongas que las modificaciones descritas como propuestas ya están incorporadas.

Presenta primero un diagnóstico breve y después realiza los cambios mínimos necesarios para completar la primera iteración.

El usuario quiere utilizar la aplicación para hacer música, no dedicar tiempo a mantener un entorno de desarrollo. Minimiza las decisiones técnicas que requieran su intervención.