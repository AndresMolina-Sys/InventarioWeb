# Plan técnico — Ficha técnica y acta de resguardo

## 1. Archivos y responsabilidades

- `src/App.tsx`: incorporar «Imprimir ficha técnica» solo en el detalle del artículo; abrir el preview desde una instantánea de los datos y de `categoryName`; gestionar bloqueos, avisos, reintento, cierre y foco del diálogo.
- `src/lib/code128.ts`: ampliar el uso del generador Code 128-B local para calcular el ancho natural de la ficha Carta. Mantener sin cambios el resultado y el límite físico de la etiqueta adhesiva existente.
- `src/styles.css`: presentar el diálogo responsive y la hoja Carta en pantalla; definir la salida de impresión monocromática en una página con márgenes de 15 mm, escala 100 % y controles ocultos.
- `docs/figma-brief.md`: documentar el disparador, el preview, los campos, las firmas, la compatibilidad del código y la impresión Carta.
- `AGENTS.md` y `MEMORY.md`: registrar el flujo de solo lectura, la geometría del código, los límites de página/texto y el comportamiento accesible al finalizar la implementación. No se modifican en esta fase de planificación.

No se requieren cambios en `src/types.ts`, `src/lib/inventoryRepository.ts`, `src/data/demo.ts` ni en los datos persistidos: el preview consume los datos existentes sin guardar un documento o evento.

## 2. Modelo de datos y flujo local

- Al activar «Imprimir ficha técnica», la vista previa conserva una instantánea en memoria del artículo y del nombre de categoría actuales. Cambios desde otra pestaña no actualizan el preview abierto; cerrar y volver a abrir toma el estado actualizado.
- La instantánea comprende Código, Nombre, Categoría, Marca, Modelo, Número de serie, Ubicación, Costo, Fecha de ingreso y Notas; excluye SKU.
- No se crea un modelo persistido, object store, índice, movimiento ni migración. La función no escribe en IndexedDB y no realiza solicitudes remotas.
- Los campos obligatorios ausentes o compuestos solo por espacios tras `trim()` se muestran como «[No disponible]». Si falta Código, su zona indica «Código no disponible». La ausencia de Código, Nombre o Categoría mantiene el preview abierto, informa el problema y deshabilita «Imprimir».
- Para opcionales de texto, vacío incluye ausente, cadena vacía o texto con `trim() === ''`: Marca, Modelo, Número de serie, Ubicación y otros opcionales generales muestran «Sin especificar»; Notas muestran «Sin observaciones». Costo numérico cero es un valor y conserva el formato USD «$0.00»; `null`, `undefined` o cadena vacía muestran «Sin especificar».

## 3. Reglas puras para contenido y código de barras

- Mantener funciones de cálculo independientes del renderizado para determinar campos vacíos, compatibilidad y ancho del símbolo; la interfaz solo presenta el resultado de cada regla.
- Para un Código de N caracteres ASCII imprimibles 32–126, calcular el ancho total natural, incluyendo las zonas libres, como `(11N + 55) × 0,25 mm`. El módulo será exactamente 0,25 mm, las zonas libres 10 módulos a cada lado y la altura de barras al menos 10 mm.
- Un ancho natural de hasta 120 mm se presenta centrado a tamaño natural, sin estiramiento artificial. Si supera 120 mm y es de hasta 180 mm, conserva el ancho natural mayor. Si excede 180 mm o contiene caracteres fuera del rango permitido, el preview muestra un aviso accesible y no permite imprimir.
- El símbolo siempre codifica el Código completo; el valor legible nunca se trunca. La geometría no garantiza compatibilidad universal con cualquier impresora o lector.
- El costo se trata como capturado cuando su valor es numérico, incluso cero; solo los casos ausentes acordados se presentan sin costo especificado. Las fechas usan el formato local existente.
- Código legible se conserva completo. Otros campos de texto largos, salvo Notas, se limitan a tres líneas con «...» al final. Notas se ajustan al ancho y crecen hasta 35 mm; si exceden el límite, se conserva el inicio y se añade «...». Notas breves no reservan el alto máximo.

## 4. Interfaz, impresión y accesibilidad

- La acción se agrega únicamente al detalle. Su activación abre primero el preview de una hoja completa; solo la acción explícita «Imprimir» solicita la impresión del navegador. «Cerrar» descarta el preview y vuelve al mismo detalle.
- La hoja muestra el encabezado acordado, campos del artículo, Código legible/código de barras y los recuadros «Entregado por» y «Recibido por / Asignado a», cada uno con firma y sus campos vacíos correspondientes.
- El diálogo identifica un título visible, usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby`; inicia foco en «Cerrar». Si imprimir está habilitado, Tab y Mayús+Tab alternan entre «Cerrar» e «Imprimir»; si está deshabilitado, ambos sentidos mantienen foco en «Cerrar». Escape cierra el preview y el cierre completo devuelve foco al disparador del detalle.
- Al cancelar el diálogo de impresión, el preview permanece abierto y el foco vuelve a «Imprimir» dentro del preview. Si no se puede iniciar la impresión o falla, el preview continúa abierto con un aviso contextual accesible y acciones disponibles para reintentar o cerrar.
- La salida física cubierta es Carta vertical, 215,9 × 279,4 mm, 100 %, márgenes de 15 mm por lado y una sola página. Cambios manuales de papel, orientación, escala o márgenes quedan fuera de garantía.
- Una página es la prioridad principal; ningún texto baja de 12 px; cada firma conserva al menos 30 mm de alto y ambas permanecen juntas hacia el pie. Notas ceden espacio primero, con límite de 35 mm; los demás campos de texto pueden usar hasta tres líneas. El Código legible permanece completo.
- En pantalla, el preview permite revisar la hoja completa en escritorio y a 360–375 px sin desbordamiento horizontal. La impresión usa escala de grises, oculta la aplicación y los controles, y conserva las líneas vacías para escritura manual.

## 5. Decisiones técnicas y alternativas

- Reutilizar el generador Code 128-B local y su geometría; ampliar su uso para la hoja Carta sin cambiar el contrato visual de la etiqueta de 70 × 35 mm. Se descartan otra librería, servicios remotos o un segundo estándar de barcode.
- Calcular el ancho natural a partir del número de módulos y usar el valor exacto definido en la spec; se descarta escalar códigos cortos para llenar espacio o truncar códigos largos.
- Mantener el documento en memoria y de solo lectura; se descartan almacenar fichas, alterar el inventario o registrar un movimiento de auditoría por imprimir.
- Priorizar una página y firmas completas; las Notas son el único contenido permitido para truncarse por altura, mientras el resto de campos aplica su límite de tres líneas y el Código conserva el valor completo.
- Mantener la vista previa al cancelar o ante error de impresión para permitir revisar y reintentar; el foco permanece dentro de ese diálogo hasta cerrarlo completamente.
- No añadir archivos de implementación ni dependencias, cambiar el formato IndexedDB o modificar la etiqueta existente.

## 6. Verificación y control de calidad

- Ejecutar `npm run build`; no incorporar dependencias de pruebas ni nuevos scripts.
- En Chrome DevTools revisar el disparador y preview en escritorio, 360 px y 375 px; comprobar consola sin errores/advertencias y ausencia de desbordamiento horizontal.
- Medir desde el clic en «Imprimir ficha técnica» hasta que el preview esté visible con todos los campos y código de barras o aviso completos: debe ser menor de 100 ms.
- Revisar códigos compatibles y no compatibles, Código ausente, límites de ancho, código corto centrado, geometría y texto legible completo; comprobar que el botón se deshabilite solo bajo las condiciones especificadas.
- Revisar costo cero y costo ausente, opcionales vacíos y con espacios, Notas vacías/cortas/largas, campos de hasta tres líneas y datos obligatorios ausentes o solo con espacios.
- Probar navegación inicial, Tab/Mayús+Tab en ambos estados del botón, Escape, restauración del foco, cancelar impresión con preview y foco conservados, y error de solicitud con posibilidad de reintento.
- Confirmar visualmente impresión Carta vertical a 100 % y márgenes de 15 mm, una sola página, escala de grises, código con ancho natural, y firmas completas de al menos 30 mm sin división entre páginas. Los cambios manuales de la configuración de impresión se excluyen de esta garantía.
- Comparar los registros locales antes y después: artículos, categorías, movimientos y fechas deben conservarse sin cambios; comprobar que no haya solicitudes de red con datos del inventario.
- Actualizar `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` durante la implementación y realizar la validación SDD final cuando se complete la especificación.

## 7. Matriz de trazabilidad

| Parte del plan | Requisitos de la spec | Principios de constitución |
|---|---|---|
| Acción, preview y navegación del diálogo | RF-1, RF-2, RF-11, RNF de accesibilidad | 2, 4, 6 |
| Instantánea y presentación de datos | RF-3, RF-4, RF-5, RF-12 | 2, 3, 5, 6 |
| Compatibilidad y medidas Code 128-B | RF-3, RF-6 | 1, 3, 5, 6 |
| Página Carta, contenido, firmas y tonos de gris | RF-7, RF-8, RF-9, RF-10 | 1, 2, 4, 6 |
| Cancelación, error y foco | RF-2, RF-11; RNF de accesibilidad | 2, 4, 6 |
| Solo lectura y privacidad local | RF-12, RF-13 | 3, 5 |
| Build, Chrome y consola | Criterios de finalización y todos los RF visuales | 4 |
| Actualización de guía visual y memoria | Criterios de finalización | 2, 6 |
