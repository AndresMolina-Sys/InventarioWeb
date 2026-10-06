# Plan técnico — Impresión de etiquetas

## 1. Archivos y responsabilidades

- **`src/lib/code128.ts` (nuevo):** implementar funciones puras para aceptar el repertorio aprobado, codificar Code 128-B y calcular si el símbolo completo cumple el tamaño permitido. No leerá ni escribirá IndexedDB, no normalizará ni modificará el Código y no importará librerías.
- **`src/App.tsx`:** integrar la acción solo en `ItemDetailModal`, que ya recibe el artículo y su nombre de categoría. Mantener un único `ModalFrame` y alternar su contenido entre detalle y previsualización; esto evita apilar dos diálogos modales. Usar `dateLabel(item.createdAt)` para la fecha. La impresión solo se inicia desde un botón explícito con `window.print()`.
- **`src/styles.css`:** maquetar la etiqueta de 70 × 35 mm, el estado bloqueado, los controles y la adaptación móvil. Añadir reglas `@media print` y `@page` para imprimir solo la etiqueta seleccionada a escala 100 %, sin overlays, cabeceras ni contenido de la aplicación.
- **`docs/figma-brief.md`:** documentar ubicación del botón, vista previa, campos, bloqueo, medidas, salida impresa y comportamiento adaptable.
- **`AGENTS.md` y `MEMORY.md`:** registrar las reglas de impresión Code 128-B y que la restricción de impresión nunca modifica la validación ni el guardado de Códigos. La memoria conservará también la decisión de no persistir etiquetas.

No se modifican `src/types.ts`, `src/lib/inventoryRepository.ts`, `src/data/demo.ts`, el esquema de IndexedDB ni los movimientos. La etiqueta usa únicamente el artículo y la categoría ya cargados en memoria. No hace falta cambiar `index.html`: la aplicación ya enlaza un favicon SVG.

## 2. Modelo de datos y evolución en IndexedDB

No hay modelo persistido nuevo. El insumo de la vista es el `InventoryItem` existente, el nombre de categoría que ya resuelve `App` y su `createdAt`. El estado de previsualización, resultado de codificación y aviso de incompatibilidad será efímero de React; al cerrar la vista previa se vuelve al mismo detalle.

El módulo nuevo expondrá un resultado discriminado con estado imprimible o bloqueado. El resultado imprimible incluirá los segmentos de barras en coordenadas de módulos, el ancho calculado en milímetros y la altura del símbolo; el bloqueado identificará si falla el repertorio o el ancho. Estos datos no se guardan. Ninguna acción de esta funcionalidad llama al repositorio: imprimir o cancelar no altera artículo, categoría, fechas ni historial.

## 3. Lógica pura y algoritmos

`encodeCode128B(code)` conservará el texto recibido exactamente. Recorrerá sus puntos de código y bloqueará la generación si alguno queda fuera de ASCII imprimible 32–126. Para cada carácter permitido, usará el valor Code Set B `código ASCII − 32`; formará los codewords con Start B (104), los valores de datos, el checksum ponderado `(104 + Σ(valor × posición desde 1)) mod 103` y Stop (106). Los patrones de los símbolos Code 128 quedarán embebidos como datos constantes en inglés en el módulo, sin recursos remotos.

El generador convertirá las secuencias de anchos alternos barra/espacio a segmentos SVG. Reservará 10 módulos vacíos al inicio y al final; el ancho total será la suma de patrones más esas 20 zonas libres. Se fija cada módulo en **0,25 mm** y la altura de barras en **10 mm**, los mínimos aprobados. La condición de impresión es `anchoTotalEnMódulos × 0,25 mm ≤ 70 mm`; no se trunca el código ni se expande la etiqueta. El patrón Code 128 tiene 11 módulos por codeword salvo Stop, que tiene 13: 20 caracteres ocupan 68,75 mm con zonas libres incluidas; 21 ocupan 71,5 mm y quedan bloqueados. No se impone otro límite de longitud.

Los errores se presentan en español desde la interfaz como aviso accesible; el módulo retorna una razón estable en inglés para que el componente elija el mensaje. Un resultado bloqueado mantiene abierta la previsualización y deja deshabilitada la acción «Imprimir».

## 4. Interfaz, interacción y accesibilidad

- En `ItemDetailModal`, «Imprimir etiqueta» aparecerá solo junto a los controles del detalle. Al activarlo, el mismo diálogo mostrará la etiqueta y las acciones «Imprimir» y «Volver al detalle». El título y la etiqueta accesible de cierre reflejarán la vista actual. Escape o el botón de cierre, mientras se previsualiza, regresarán al detalle; desde el detalle, cerrarán el modal.
- La etiqueta mostrará Código, Nombre, Categoría y Fecha de ingreso con etiquetas breves en español. Nombre, Categoría y Código legible admiten hasta dos líneas; lo sobrante se sustituye por puntos suspensivos. La codificación usa siempre el Código original completo.
- La etiqueta física usa `box-sizing: border-box`, mide 70 × 35 mm y reserva 0,5 mm de padding interno por lado. Dentro de los 34 mm útiles de alto, reserva 10 mm para las barras, un espacio de 0,5 mm y 23,5 mm para cuatro filas de datos. Cada fila presenta rótulo y valor en línea; los valores largos de Código, Nombre y Categoría ocupan hasta dos líneas. El texto usa 12 px con `line-height: 12px`; las filas separadas por 0,25 mm caben incluso con el máximo de siete líneas. La fecha ocupa una línea en el formato `dateLabel` existente. El símbolo usa SVG nativo y sus zonas libres están incluidas en el ancho. El contorno visual del preview no reduce las dimensiones útiles de impresión.
- La previsualización en pantalla conserva relación 2:1 y cabe dentro del diálogo a 360–375 px. En viewports bajos, el cuerpo del diálogo desplaza verticalmente sus contenidos y mantiene sus acciones accesibles. La tipografía visible nunca baja de 12 px y los controles usan al menos 13 px, siguiendo los tokens `--ink`, `--line`, `--accent`, `--type-meta-size` y `--type-supporting-size`.
- Reutilizar `ModalFrame` con `manageFocus`: foco inicial en cerrar, ciclo Tab/Mayús+Tab, cierre con Escape y restauración del foco al cerrar. Al cambiar entre detalle y previsualización, mover el foco al control principal de la nueva vista y, al regresar, al botón «Imprimir etiqueta». El aviso usa `role="alert"`; el SVG expone una descripción accesible del Código y del propósito del símbolo.
- La regla de impresión fijará `@page` en 70 × 35 mm sin márgenes, eliminará sombras/fondos de interfaz y ocultará todo salvo el nodo de la etiqueta. El diálogo se invoca solo al pulsar «Imprimir». No se cerrará ni cambiará el estado de React al volver de `window.print()`; por ello cancelar o cerrar el diálogo conserva la previsualización. Un error síncrono al invocar la API se informa sin cerrar la vista.

## 5. Decisiones técnicas y alternativas descartadas

- **Code 128-B SVG local con patrones embebidos:** admite todo el repertorio aprobado, permite medir cada módulo y conserva nitidez al imprimir. Se descartan paquetes npm, imágenes remotas y servicios externos por la restricción de funcionamiento local y el stack simple.
- **Módulo fijo de 0,25 mm y barras de 10 mm:** aplica directamente los mínimos aprobados y maximiza el largo que cabe. Se descarta reducir módulos para acomodar códigos largos o agrandar la etiqueta; ambos incumplirían la spec.
- **Un solo `ModalFrame` con dos vistas internas:** usa el patrón real de `ItemDetailModal` y evita dos elementos simultáneos con `aria-modal="true"`. Se descarta apilar un diálogo de impresión encima del diálogo de detalle.
- **Estilos de impresión aislados con `@page`:** controlan contorno, orientación y salida de una sola etiqueta usando unidades físicas. Se descarta abrir una página o ventana externa, ya que agregaría flujo y posible pérdida de contexto no definidos.
- **Estado temporal sin cambios de datos:** el historial de impresión no es parte de la spec. Se descarta almacenar etiquetas, crear movimientos, modificar timestamps o añadir tipos a `src/types.ts`.

## 6. Verificación y control de calidad

1. Ejecutar `npm run build`; no instalar dependencias ni añadir runner de pruebas.
2. En Chrome DevTools, comprobar que el botón exista solo en el detalle, abra primero la previsualización en menos de 100 ms y que el artículo/categoría/fecha correspondan al registro seleccionado.
3. Verificar el módulo puro con muestras conocidas: `A` genera codewords `[104, 33, 34, 106]`; `AB`, `[104, 33, 34, 102, 106]`. Confirmar que 20 caracteres ASCII producen ancho 68,75 mm y son elegibles, 21 producen 71,5 mm y se bloquean, y un salto de línea se bloquea por repertorio. Estos checks se harán desde DevTools/import local; no se agrega infraestructura de pruebas.
4. En escritorio, inspeccionar impresión del navegador: página 70 × 35 mm, escala 100 %, sólo una etiqueta y ningún elemento del modal/fondo. Cancelar y cerrar el diálogo y confirmar que la previsualización siga abierta; cerrar la previsualización y confirmar regreso al mismo detalle.
5. Repetir flujo y responsive a 375 y 360 px: sin overflow horizontal, relación 2:1, scroll vertical con poca altura, foco visible, secuencia Tab/Mayús+Tab y cierre Escape. Revisar también Código largo abreviado en pantalla y completo en el SVG, mensaje y bloqueo para caracteres inválidos, consola sin errores/advertencias y solicitudes de red sin recursos de barcode externos.
6. Comparar los registros del perfil antes y después de abrir, imprimir/cancelar y cerrar; artículos, categorías y movimientos deben permanecer iguales. Actualizar `docs/figma-brief.md` y verificar su consistencia con el flujo implementado.

El criterio de aceptación es geométrico y no afirma compatibilidad universal con impresoras o lectores físicos.

## 7. Matriz de trazabilidad

| Trabajo | Requisitos de la spec | Principios de constitución |
| --- | --- | --- |
| Codificador y medición Code 128-B local | RF-3, RF-6, RF-7 | 1, 5, 6 |
| Acción en detalle y vista previa accesible | RF-1, RF-2, RF-3, RF-5, RF-8, RF-10, RF-11 | 2, 6 |
| Dimensiones y aislamiento de impresión | RF-4, RF-5, RF-8, RF-9, RF-10 | 1, 2, 4 |
| Estado local efímero y lectura sin escritura | RF-12 | 3, 5 |
| Estilo adaptable, legibilidad y teclado | Requisitos no funcionales de accesibilidad, legibilidad y adaptación | 2, 4, 6 |
| Brief, guía y memoria | Criterios de finalización de documentación | 2, 6 |
| Build, DevTools y revisión de datos/consola | Criterios de finalización de verificación | 4, 5 |
