# Tareas — Ficha técnica y acta de resguardo

- [x] **T01. `src/lib/code128.ts`: calcular geometría determinista para Carta** RF-3, RF-6, (Principios 1, 3, 5, 6)
  Extender el uso local de Code 128-B para calcular el ancho natural `(11N + 55) × 0,25 mm`, validar ASCII imprimible 32–126, zonas libres y altura mínima. Preservar el resultado y el límite de la etiqueta 70 × 35 mm.
  **Hecho cuando:** el cálculo confirma anchos conocidos (38 caracteres = 118,25 mm; 39 = 121 mm; 60 = 178,75 mm; 61 = 181,5 mm), rechaza caracteres no compatibles y no altera la salida de etiqueta existente.

- [x] **T02. `src/App.tsx`: preparar snapshot y estado de validación del preview** RF-3, RF-4, RF-5, RF-6, RF-12, (Principios 2, 3, 5, 6)
  Al solicitar la ficha, capturar los campos actuales del artículo y el nombre de categoría; preparar sus valores visibles y estados de disponibilidad sin leer cambios posteriores mientras el preview siga abierto. Tratar espacios en campos obligatorios/opcionales según la spec, distinguir costo cero de ausente y calcular si el barcode permite imprimir.
  **Hecho cuando:** una captura conserva artículo y categoría del instante de apertura; al reabrir usa el nombre actualizado; Código/Nombre/Categoría vacíos o solo espacios, códigos no ASCII o ancho >180 mm producen estado bloqueado, y costo cero se presenta como `$0.00`.

- [x] **T03. `src/App.tsx`: acción, diálogo accesible y estados de impresión** RF-1, RF-2, RF-5, RF-6, RF-11, (Principios 2, 4, 6)
  Añadir el disparador solo al detalle y un diálogo con acciones «Imprimir»/«Cerrar», avisos, bloqueo, reintento y los estados de error. Gestionar foco inicial, ciclo de teclado, Escape, retorno de foco al cancelar y restauración al cerrar.
  **Hecho cuando:** solo «Imprimir» solicita la impresión; preview se abre aunque falte información o el barcode sea incompatible; «Imprimir» queda deshabilitado en esos casos; Tab/Mayús+Tab, Escape, cancelación nativa, cierre y error siguen exactamente la política de foco y reintento de la spec.

- [ ] **T04. `src/App.tsx`: contenido de ficha y áreas de firma** RF-3, RF-4, RF-5, RF-8, RF-9, RF-12, (Principios 2, 3, 5, 6)
  Presentar encabezado, Código legible y código de barras cuando proceda, especificaciones y los dos recuadros vacíos de firmas con sus campos rotulados. Mostrar marcadores y formatos convenidos; limitar texto largo según sus reglas.
  **Hecho cuando:** aparecen todos los campos acordados excepto SKU; datos opcionales vacíos muestran sus marcadores correctos, costo cero conserva `$0.00`, campos largos respetan tres líneas, Código legible permanece completo y ambos recuadros incluyen todos los campos de firma.

- [ ] **T05. `src/styles.css`: preview, legibilidad y adaptación a móvil** RF-2, RF-5, RF-8, RF-9, RF-11, RNF de accesibilidad y adaptación, (Principios 2, 4, 6)
  Dar estilo al diálogo y su hoja para revisión en pantalla, con foco visible, mensajes claros, texto mínimo de 12 px, contención de contenido y adaptación a móvil. Aplicar los límites visuales de tres líneas para campos, 35 mm para Notas y al menos 30 mm para cada firma en la hoja.
  **Hecho cuando:** en 360 y 375 px se puede revisar la hoja completa sin desbordamiento horizontal; todos los textos visibles miden al menos 12 px; Notas no exceden 35 mm y cada firma conserva 30 mm o más.

- [ ] **T06. `src/styles.css`: salida física Carta en una página** RF-7, RF-8, RF-9, RF-10, (Principios 1, 2, 4, 6)
  Aislar el documento al imprimir, ocultar aplicación y controles, y presentar una hoja Carta vertical a escala 100 %, con márgenes de 15 mm, grises legibles y reglas para mantener contenido y firmas juntos en una página.
  **Hecho cuando:** Chrome imprime una sola página de 215,9 × 279,4 mm en escala de grises, con márgenes de 15 mm, sin controles ni contenido de fondo, y las dos áreas de firma permanecen completas y juntas.

- [ ] **T07. `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md`: documentar la ficha** RF-1–RF-13, criterios de finalización, (Principios 2, 5, 6)
  Registrar el disparador, la vista previa, campos, firmas, formatos y límites de impresión; incluir las reglas de datos locales, solo lectura, barcode, foco, textos y salida Carta. Mantener la memoria en el límite de longitud del proyecto.
  **Hecho cuando:** los tres documentos reflejan los mismos límites y comportamientos aprobados; `MEMORY.md` tiene como máximo 50 líneas y las reglas dejan claro que la ficha no cambia ni transmite datos.

- [ ] **T08. QA del flujo y la interfaz en Chrome DevTools** RF-1–RF-6, RF-11–RF-12, criterios de rendimiento y accesibilidad, (Principios 1, 2, 4, 6)
  Ejecutar el build y revisar el disparador, el contenido del preview, los estados bloqueados, el foco, el cierre y la presentación responsive en escritorio y móvil.
  **Hecho cuando:** `npm run build` pasa; Chrome DevTools confirma que el preview queda completamente visible en menos de 100 ms, los campos y avisos coinciden con sus estados, la navegación por teclado cumple la spec, la consola queda sin errores ni advertencias y a 360/375 px no hay desbordamiento horizontal.

- [ ] **T09. QA de impresión física, cancelación y datos locales** RF-6–RF-13, criterios de finalización, (Principios 1, 2, 3, 4, 5, 6)
  Verificar en Chrome la salida Carta, el cálculo y apariencia del código de barras, las firmas, los flujos de cancelar/reintentar y la inmutabilidad local.
  **Hecho cuando:** con Carta vertical, escala 100 % y márgenes de 15 mm se obtiene una página en escala de grises, con símbolo conforme a la fórmula/límites y ambas firmas juntas de al menos 30 mm; cancelar conserva preview y foco en «Imprimir», los errores permiten reintentar o cerrar, IndexedDB conserva artículos/categorías/movimientos/fechas y no se transmiten datos ni se hacen solicitudes remotas.
