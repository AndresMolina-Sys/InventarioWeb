# Tareas — Impresión de etiquetas

Implementar en orden. Cada tarea se estima en 20–30 minutos; no añadir dependencias ni pruebas externas.

- [x] **T01. `src/lib/code128.ts` — Patrones y codificación Code 128-B** (25 min). RF-6 (Principios 1, 5, 6).
  - Crear la función pura y los patrones Code 128 requeridos para ASCII 32–126. Construir Start B, codewords de datos, checksum ponderado y Stop; derivar los segmentos de barras y dejar los identificadores internos en inglés.
  - **Hecho cuando:** la función conserva los caracteres de entrada y para `A` y `AB` devuelve codewords `[104, 33, 34, 106]` y `[104, 33, 34, 102, 106]`, respectivamente; `npm run build` termina correctamente.

- [x] **T02. `src/lib/code128.ts` — Compatibilidad y medidas geométricas** (25 min). RF-6, RF-7 (Principios 1, 5, 6).
  - Rechazar caracteres fuera de ASCII imprimible sin alterar el artículo. Calcular anchura con módulo de 0,25 mm y zonas libres de 10 módulos por lado; usar barras de 10 mm; devolver un resultado imprimible o una razón de bloqueo sin truncar el código.
  - **Hecho cuando:** 20 caracteres imprimibles dan 68,75 mm y resultan elegibles; 21 dan 71,5 mm y se bloquean; un salto de línea se bloquea; el ancho incluye ambas zonas libres y `npm run build` pasa.

- [x] **T03. `src/App.tsx` — Acción y previsualización en el detalle** (25 min). RF-1, RF-2, RF-3, RF-5, RF-8, RF-11, RF-12 (Principios 2, 5, 6).
  - Integrar «Imprimir etiqueta» exclusivamente en `ItemDetailModal`. Alternar dentro del mismo `ModalFrame` al preview con Código visible, Nombre, Categoría, fecha `dateLabel(item.createdAt)`, SVG o aviso bloqueado; usar el Código original completo para codificar. Añadir acciones «Imprimir» y «Volver al detalle»; el botón «Imprimir» invoca `window.print()`.
  - **Hecho cuando:** desde el detalle de un artículo la acción abre primero el preview de ese mismo registro, las fechas y categoría coinciden, el botón no aparece en tablas, «Imprimir» invoca la impresión y volver/cerrar el preview retorna al detalle; `npm run build` pasa.

- [x] **T04. `src/App.tsx` — Teclado, foco y estados de impresión** (25 min). RF-2, RF-7, RF-8, RF-10, RF-11 (Principios 2, 4, 6).
  - Reutilizar `ModalFrame` con gestión de foco: foco inicial en cerrar, ciclo Tab/Mayús+Tab, Escape y restauración al cambiar vistas o cerrar. Anunciar incompatibilidad con `role="alert"`, asociar el aviso con el control deshabilitado y exponer el SVG con nombre accesible. Mantener el preview abierto ante excepciones síncronas al invocar `window.print()`; no intentar detectar fallos físicos de impresora.
  - **Hecho cuando:** con teclado se puede recorrer el diálogo sin perder el foco; Escape en preview regresa al mismo detalle; el estado incompatible se anuncia y no permite imprimir; una excepción de `window.print()` conserva el preview y muestra un aviso; `npm run build` pasa.

- [x] **T05. `src/styles.css` — Etiqueta y preview adaptable** (25 min). RF-3, RF-4, RF-5, RF-7 y NFR de consistencia, legibilidad y adaptación (Principios 1, 2, 4, 6).
  - Estilizar la etiqueta a proporción 2:1, 70 × 35 mm y padding interno de 0,5 mm por lado. Reservar 25 mm para la zona superior de datos incluyendo su padding vertical y el espacio entre bloques; dentro de esta quedan 23,5 mm para filas y rótulos. Reservar los 10 mm restantes para barras con quiet zones incluidas. Aplicar filas y límites de dos líneas del plan; conservar 12 px mínimo, 13 px en controles y tokens del proyecto.
  - **Hecho cuando:** la etiqueta mide 70 × 35 mm en CSS, los valores extensos se limitan a dos líneas con puntos suspensivos y el preview no causa overflow horizontal a 360 ni 375 px; `npm run build` pasa.

- [x] **T06. `src/styles.css` — Salida de impresión aislada** (25 min). RF-4, RF-8, RF-9, RF-10, RF-12 (Principios 1, 2, 4, 5).
  - Añadir `@page` de 70 × 35 mm sin márgenes y `@media print` que deje visible solo la etiqueta actual, sin modal de fondo, controles, overlays ni sombras. Conservar el llamado explícito a `window.print()` y el estado del preview al retornar.
  - **Hecho cuando:** Chrome Print Preview muestra solo una etiqueta horizontal de 70 × 35 mm al 100 %; cancelar/cerrar mantiene la vista previa; la llamada no guarda datos ni movimientos; `npm run build` pasa.

- [x] **T07. Codificador — Verificación funcional y build** (25 min). RF-3, RF-6, RF-7 (Principios 1, 4, 5, 6).
  - En Chrome DevTools, importar localmente el módulo y verificar muestras conocidas, checksum, límites de anchura, quiet zones, altura y caracteres inválidos. No añadir runner ni dependencias de prueba.
  - **Hecho cuando:** las salidas de `A` y `AB` coinciden con T01; los casos 20/21 caracteres y salto de línea coinciden con T02; cada barra mide 10 mm y los márgenes vacíos equivalen a 10 módulos por lado; `npm run build` pasa.

- [x] **T08. Chrome DevTools — QA integral escritorio y móvil** (30 min). RF-1–RF-12 y NFR de accesibilidad, legibilidad, rendimiento, adaptación y privacidad (Principios 2, 4, 5, 6).
  - Probar detalle, preview, valores largos, aviso/bloqueo, impresión, cancelación, Escape, Tab/Mayús+Tab y retorno de foco en escritorio, 375 px y 360 px, incluida ventana de poca altura. Medir disponibilidad local del preview bajo 100 ms y revisar consola y red. Usar un perfil QA descartable para confirmar que un Código no ASCII puede seguir guardándose pero bloquea solo la impresión, y comparar IndexedDB antes/después de los flujos de impresión.
  - **Hecho cuando:** no hay overflow horizontal ni errores/advertencias de consola o solicitudes remotas del barcode; el flujo de impresión contiene solo la etiqueta, la cancelación conserva preview, el foco cumple T04 y las colecciones de artículos/categorías/movimientos no cambian durante los flujos de preview/impresión/cancelación.

- [ ] **T09. `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` — Cierre documental** (25 min). Todos los RF y criterios de finalización documentales (Principios 2, 5, 6).
  - Documentar el botón, la previsualización, las reglas visibles y la salida física en el brief; añadir a AGENTS la restricción de impresión sin cambiar el guardado de Códigos; resumir decisiones y ausencia de persistencia en MEMORY.
  - **Hecho cuando:** los tres documentos describen 70 × 35 mm, Code 128-B local, caracteres 32–126, bloqueo geométrico, texto visible truncable/código completo y ausencia de escrituras; el brief refleja el flujo probado y `npm run build` pasa.
