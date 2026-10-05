# Tareas — Diff de movimientos

Las tareas están ordenadas por dependencia y estimadas para completarse en un máximo de 25 minutos cada una. No añaden infraestructura ni dependencias de pruebas.

## Tipos

- [x] **T01 — Tipos de auditoría (`src/types.ts`)** — 20 min
  - RF: RF-2–RF-7, RF-9–RF-10. Constitución: P1 (stack simple), P3 (lógica separada), P5 (preservación de datos), P6 (idioma).
  - Cambio: Conservar `InventoryMovement` y definir el marcador `auditVersion: 1`, snapshots completos, cambios tipados antes/después y compatibilidad con snapshots históricos parciales sin marcador.
  - Hecho cuando: Los tipos representan altas y bajas con ficha completa, ediciones con resumen y mapa de cambios, y movimientos históricos incompletos; SKU, ID y fechas técnicas no aparecen como campos auditados.

## Lógica pura y persistencia

- [x] **T02 — Normalización y comparación (`src/lib/inventoryRepository.ts`)** — 25 min
  - RF: RF-4–RF-7, RF-10. Constitución: P3 (lógica en el repositorio), P5 (datos), P6 (identificadores en inglés).
  - Cambio: Implementar normalización determinista para textos, valores opcionales, costo y nombre de categoría del evento; comparar los nueve campos auditables sin incluir SKU ni metadatos técnicos.
  - Hecho cuando: Espacios exteriores en texto y costo vacío/nulo/0 no producen diff; mayúsculas, espacios internos, contenido distinto y cambio de costo a un valor distinto de cero sí producen el diff esperado.

- [x] **T03 — Snapshots de altas y bajas (`src/lib/inventoryRepository.ts`)** — 20 min
  - RF: RF-3, RF-5, RF-7, RF-9–RF-10. Constitución: P3 (persistencia centralizada), P5 (sin pérdida de datos).
  - Cambio: Guardar en la transacción el snapshot versionado completo del estado nuevo al crear y del estado previo al borrar, usando el nombre de categoría vigente durante el evento.
  - Hecho cuando: Una alta conserva todos los campos auditables nuevos y una baja conserva esos campos antes de eliminar el artículo; ambos eventos incluyen `auditVersion: 1` y la operación y su movimiento se confirman juntos.

- [ ] **T04 — Diff de edición y resultado sin cambios (`src/lib/inventoryRepository.ts`)** — 25 min
  - RF: RF-4–RF-8, RF-10. Constitución: P3 (lógica y persistencia), P5 (integridad local).
  - Cambio: Persistir el resumen posterior y solo las diferencias netas de una edición en la misma transacción; devolver `unchanged` cuando no haya cambios auditables.
  - Hecho cuando: Una edición real guarda un movimiento con al menos un par Antes/Después; una edición sin diferencias no guarda artículo ni movimiento y deja `updatedAt` intacto.

## Interfaz y modal

- [ ] **T05 — Integración del resultado de edición (`src/App.tsx`)** — 20 min
  - RF: RF-5–RF-8. Constitución: P2 (interfaz según spec), P3 (repositorio separado), P6 (textos en español).
  - Cambio: Aceptar Ubicación vacía como opcional, gestionar el resultado `unchanged` y cerrar el editor con el aviso «No hubo cambios para guardar.» sin alterar el registro.
  - Hecho cuando: Guardar un artículo sin cambios auditables muestra el aviso, conserva sus valores y fecha de modificación, y no aumenta el historial; una Ubicación vacía se presenta como «Sin especificar».

- [ ] **T06 — Acceso al detalle desde Movimientos (`src/App.tsx`)** — 20 min
  - RF: RF-1, RF-2, RF-11. Constitución: P2 (spec sincronizada), P4 (flujo verificable), P6 (interfaz en español).
  - Cambio: Añadir el botón explícito «Ver detalle» en cada movimiento y abrir el evento seleccionado; no hacer interactiva la fila completa ni ofrecer acciones de modificación.
  - Hecho cuando: El botón abre el movimiento correcto; cerrar el modal conserva filtro, página y posición del historial; el estado vacío del historial no ofrece un detalle inexistente.

- [ ] **T07 — Contenido de altas, bajas y ediciones (`src/App.tsx`)** — 25 min
  - RF: RF-2–RF-7, RF-10–RF-11. Constitución: P2 (diseño documentado), P5 (fidelidad del evento), P6 (textos en español).
  - Cambio: Mostrar acción, nombre, código y fecha/hora en la cabecera; presentar la ficha completa en altas/bajas y solo campos modificados en ediciones. Incluir los campos auditables acordados y el formato monetario existente.
  - Hecho cuando: Altas muestran el estado nuevo, bajas el estado previo y ediciones únicamente sus diferencias; opcionales vacíos muestran «Sin especificar», y ningún detalle ofrece editar, borrar o restaurar.

- [ ] **T08 — Compatibilidad histórica y datos temporales (`src/App.tsx`, `src/lib/inventoryRepository.ts`)** — 25 min
  - RF: RF-2, RF-7, RF-9–RF-10. Constitución: P3 (lectura normalizada), P5 (preservación no destructiva), P6 (mensajes en español).
  - Cambio: Tratar eventos sin versión o diff como históricos incompletos; distinguir campos ausentes de valores opcionales vacíos y usar exclusivamente valores guardados en el evento.
  - Hecho cuando: Un movimiento antiguo parcial y uno huérfano muestran «Dato no registrado» donde faltan datos, conservan los datos disponibles y nunca completan valores con el artículo actual; editar/borrar después el artículo o renombrar la categoría no cambia el detalle anterior.

- [ ] **T09 — Teclado y foco del diálogo (`src/App.tsx`)** — 25 min
  - RF: RF-1, RF-11–RF-12. Constitución: P2 (interfaz coherente), P4 (verificación con teclado), P6 (etiquetas en español).
  - Cambio: Dar al modal nombre accesible, semántica de diálogo modal, foco inicial en el botón de cierre, ciclo de foco con Tab y Mayús+Tab, cierre con Escape y devolución del foco al botón de origen.
  - Hecho cuando: El diálogo expone `role="dialog"`, `aria-modal` y `aria-labelledby`; el control de cierre tiene exactamente `aria-label="Cerrar detalle de movimiento"`; todas las transiciones de foco y Escape funcionan sin ratón.

## Estilos y adaptación

- [ ] **T10 — Estilo de escritorio del detalle (`src/styles.css`)** — 20 min
  - RF: RF-2–RF-7, RF-11 y requisitos no funcionales de consistencia/legibilidad. Constitución: P2 (tokens visuales), P4 (verificación visual), P6 (contenido en español).
  - Cambio: Aplicar tokens visuales existentes a acción, badges, cabecera, ficha y columnas Campo/Antes/Después; diferenciar «Sin especificar» de «Dato no registrado» y mantener el piso tipográfico de 12 px.
  - Hecho cuando: En escritorio, la ficha y el diff se leen con jerarquía consistente, los dos estados faltantes son distinguibles y ningún texto visible mide menos de 12 px.

- [ ] **T11 — Scroll y diseño móvil del modal (`src/styles.css`)** — 25 min
  - RF: RF-1, RF-7, RF-9, RF-12 y requisitos no funcionales de adaptación. Constitución: P2 (diseño adaptable), P4 (revisión móvil), P6 (legibilidad).
  - Cambio: Limitar la altura del diálogo al viewport, conservar visible la cabecera/cierre mientras desplaza el cuerpo y apilar campos y comparaciones para anchos de 360–375 px.
  - Hecho cuando: A 360 y 375 px, notas y nombres largos se envuelven, el cuerpo desplaza internamente, el botón de cierre permanece accesible y la página no presenta desbordamiento horizontal.

- [ ] **T12 — Favicon servido por la aplicación (`index.html`, `public/favicon.svg`)** — 15 min
  - RF: Criterio de consola limpia de la spec. Constitución: P1 (stack sin dependencias), P4 (verificación del navegador).
  - Cambio: Enlazar desde el documento HTML el SVG de marca previsto en el plan para que el navegador no solicite un favicon inexistente.
  - Hecho cuando: La aplicación enlaza `/favicon.svg`, el recurso responde correctamente y la consola/red no registra un 404 de `/favicon.ico`.

## QA y documentación

- [ ] **T13 — Build y revisión de datos locales (`npm run build`)** — 20 min
  - RF: RF-3–RF-10 y criterios de preservación. Constitución: P1 (dependencias fijadas), P4 (build), P5 (datos locales).
  - Cambio: Ejecutar el build y comprobar en IndexedDB que la evolución aditiva no cambia stores/versión ni descarta registros existentes; no instalar infraestructura de pruebas.
  - Hecho cuando: `npm run build` termina con código 0, y antes/después de abrir la aplicación coinciden los IDs y cantidades de artículos, categorías y movimientos preexistentes.

- [ ] **T14 — Flujos de creación, edición y baja (Chrome DevTools)** — 25 min
  - RF: RF-3–RF-8, RF-10. Constitución: P4 (Chrome DevTools), P5 (integridad local).
  - Cambio: Probar alta y baja, edición de uno y varios campos, texto con espacios, cambio de categoría, costos vacío/0/positivo y edición sin cambios.
  - Hecho cuando: Altas/bajas muestran el estado correcto; cada edición muestra únicamente los cambios esperados; texto normalizado y costo siguen RF-6; el no-op no altera artículo, `updatedAt` ni historial.

- [ ] **T15 — Historial parcial y estado de navegación (Chrome DevTools)** — 20 min
  - RF: RF-1–RF-2, RF-7, RF-9–RF-10. Constitución: P4 (Chrome DevTools), P5 (datos locales).
  - Cambio: Abrir eventos antiguos parciales y movimientos huérfanos; cambiar o borrar después el artículo y renombrar su categoría; revisar el filtro, la página y la posición al cerrar el detalle.
  - Hecho cuando: El modal usa solo datos del evento, distingue los datos no registrados de los opcionales vacíos, y al cerrarse mantiene intactos filtro, página y posición.

- [ ] **T16 — Accesibilidad, móvil, rendimiento y consola (Chrome DevTools)** — 25 min
  - RF: RF-1–RF-2, RF-7, RF-9, RF-11–RF-12 y requisitos no funcionales. Constitución: P2 (consistencia), P4 (QA de escritorio/móvil), P5 (datos locales).
  - Cambio: Revisar escritorio y viewports de 375 y 360 px: teclado, foco, scroll, textos largos, aviso de datos locales, tiempo de apertura y solicitudes del favicon.
  - Hecho cuando: Tab/Mayús+Tab, Escape y restauración de foco funcionan; no hay overflow horizontal; las tres aperturas medidas tardan menos de 100 ms cada una; la interfaz identifica los datos como locales sin prometer sincronización ni inviolabilidad; no hay errores ni advertencias y `/favicon.svg` responde sin 404 de `/favicon.ico`.

- [ ] **T17 — Documentación de diseño y reglas (`docs/figma-brief.md`, `AGENTS.md`, `MEMORY.md`)** — 20 min
  - RF: RF-1–RF-12 y requisitos de documentación/privacidad. Constitución: P2 (spec/código sincronizados), P4 (verificación documentada), P5 (reglas de datos), P6 (idioma).
  - Cambio: Documentar en Figma brief el acceso, estados del modal, diff, textos históricos y móvil; actualizar las reglas locales de persistencia/cambios netos/compatibilidad y resumir las decisiones en memoria sin superar 50 líneas.
  - Hecho cuando: Los tres documentos describen los mismos campos, estados «Sin especificar»/«Dato no registrado», comportamiento accesible, límite de 12 px y compatibilidad antigua; `MEMORY.md` tiene como máximo 50 líneas.

- [ ] **T18 — Commit de entrega** — 10 min
  - RF: Criterios de finalización RF-1–RF-12. Constitución: P1–P6 (alcance, sincronización, separación, verificación, datos e idioma).
  - Cambio: Revisar el diff final y registrar únicamente el alcance completado con el formato de commit requerido por `AGENTS.md`.
  - Hecho cuando: Existe un commit local en inglés con formato `<type>(<scope>): <subject>` (menos de 50 caracteres) y cuerpo imperativo en presente (menos de 100 caracteres), sin dependencias nuevas ni cambios ajenos a la funcionalidad.
