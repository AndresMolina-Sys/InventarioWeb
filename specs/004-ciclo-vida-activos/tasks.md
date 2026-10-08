# Tareas — Ciclo de vida de los activos

Las tareas están ordenadas por dependencias; cada una corresponde a una unidad acotada de implementación. La comprobación de interfaz se hace sobre un perfil/dataset de QA aislado.

## T01 — Contratos de estado y auditoría (`src/types.ts`) — 20–25 min

- [x] **Cubre:** RF-1, RF-2, RF-9, RF-10, RF-14; principios P1, P2, P3, P5, P6.
- Definir el conjunto canónico interno en inglés, el estado legacy opcional/no canónico, el borrador de creación con estado, snapshots de movimiento versión 2, diff de Estado y motivo contextual separado. Mantener tipos para movimientos versión 1 e históricos.
- **Hecho cuando:** TypeScript puede representar los cuatro estados canónicos, un estado raw desconocido y eventos v1/v2 sin convertir eventos antiguos en v2; los eventos v2 tipan `status` en snapshots completos y como campo de diff.

## T02 — Reglas puras de estado y motivo (`src/lib/inventoryRepository.ts`) — 25–30 min

- [x] **Cubre:** RF-1, RF-5, RF-7, RF-8, RF-12; principios P2, P3, P5, P6.
- Añadir resolución de estados ausentes/vacíos y desconocidos, tabla pura de transiciones, validación del motivo recortado (1–200 para De baja; opcional en otros destinos) y comparación de Estado sin alterar la comparación actual de otros campos.
- **Hecho cuando:** las reglas producen el default Disponible para ausente/null/vacío, conservan el raw desconocido, coinciden con todas las transiciones aprobadas y no aceptan motivo de baja vacío/solo espacios o mayor a 200 tras `trim()`.

## T03 — Lectura compatible, alta y ejemplos (`src/lib/inventoryRepository.ts`, `src/data/demo.ts`) — 25–30 min

- [x] **Cubre:** RF-1, RF-2, RF-9, RF-10, RF-14; principios P1, P2, P3, P5.
- Añadir `available` a nuevos artículos y a los ejemplos sembrados. Hacer que la carga de lectura no escriba defaults sobre registros legacy; conservar sin cambios los artículos importados de `localStorage`. Generar snapshots de alta v2 con estado inicial.
- La solicitud original ya autorizó este cambio aditivo de `status` y movimientos v2; no volver a pedir aprobación para esos datos. Consultar al usuario únicamente si se descubre que hace falta una migración destructiva o una modificación persistida fuera del alcance aprobado.
- **Hecho cuando:** cargar una base legacy no modifica su registro; crear un artículo en cada uno de los tres estados disponibles persiste la elección y el movimiento de alta incluye el mismo estado.

## T04 — Edición atómica y auditoría de Estado (`src/lib/inventoryRepository.ts`) — 25–30 min

- [x] **Cubre:** RF-5, RF-6, RF-8, RF-9, RF-10, RF-11, RF-14; principios P2, P3, P5.
- Guardar en una transacción el artículo, `updatedAt` y un movimiento v2 cuando haya cambios netos. Incluir el Estado Antes/Después y el valor raw desconocido previo. Toda transición debe incluir `reason` fuera del diff; si el motivo opcional está vacío, persistir `reason: ""`. Una edición sin cambio de Estado no incluye motivo y el motivo por sí solo no produce evento. Mantener `unchanged` sin escritura ni evento.
- **Hecho cuando:** un cambio de estado con o sin otros cambios escribe exactamente un movimiento y el artículo en una sola transacción; motivo-only o edición sin cambios no escribe; rechazo de la transacción no deja artículo ni movimiento parcialmente actualizados.

## T05 — Protección de artículos dados de baja (`src/lib/inventoryRepository.ts`) — 20–25 min

- [x] **Cubre:** RF-5, RF-13, RF-14; principios P2, P3, P5.
- Rechazar desde la operación de repositorio cualquier edición o borrado de estado De baja. Para otros estados, los snapshots de baja versión 2 incluyen el estado previo y se conservan las validaciones de borrado actuales.
- **Hecho cuando:** las llamadas directas de edición y borrado para un artículo De baja fallan sin cambiar artículo ni movimientos; el borrado permitido conserva el estado previo en su snapshot.

## T06 — Estado en creación, tabla y detalle (`src/App.tsx`) — 25–30 min

- [ ] **Cubre:** RF-2, RF-3, RF-4, RF-12, RF-13; principios P2, P3, P5, P6.
- Añadir selector de creación (sin De baja), insignias en tabla/detalle y filtro combinado con búsqueda/categoría. Hacer que los estados desconocidos aparezcan solo en Todos. Agregar o conectar Editar desde detalle; deshabilitar Editar y Borrar para De baja, también en el detalle de categoría, con explicación accesible.
- **Hecho cuando:** la creación solo ofrece los tres estados iniciales permitidos; cada estado tiene etiqueta visible y accesible; filtros combinados producen los registros correctos; De baja permanece visible y no permite editar ni borrar desde ninguna tabla o detalle.

## T07 — Transiciones ordinarias y motivos opcionales (`src/App.tsx`) — 25–30 min

- [ ] **Cubre:** RF-1, RF-4, RF-5, RF-7, RF-8, RF-9, RF-10; principios P2, P3, P5, P6.
- Integrar el selector de destinos válidos en Editar artículo; ofrecer el estado canónico de corrección a registros desconocidos. Capturar motivo opcional solo si cambia el estado, descartar todos los borradores al cancelar el formulario y preservar el raw desconocido si se cancela el intento de baja. Presentar en movimientos el diff Estado y el motivo como contexto separado.
- **Hecho cuando:** las transiciones válidas/inválidas coinciden con la matriz; el motivo opcional se recorta, queda vacío si solo contenía espacios y no crea movimientos por sí solo; movimientos nuevos muestran Antes/Después de Estado y el motivo fuera del diff.

## T08 — Confirmación irreversible y recuperación de foco (`src/App.tsx`) — 25–30 min

- [ ] **Cubre:** RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-13, RF-14; principios P2, P3, P5, P6.
- Implementar el diálogo de baja: confirmación explícita, motivo obligatorio, guardado inmediato de todos los cambios, cancelación/Escape que revierte solo el estado/motivo, y error `role="alert"` con reintento conservando los borradores. Restaurar foco a Ver de la fila o Cerrar del detalle tras éxito.
- **Hecho cuando:** confirmar con motivo válido cierra los diálogos y guarda una única edición; cancelar/Escape no persiste nada y devuelve foco al selector; si IndexedDB falla, ambos diálogos y todos los valores siguen disponibles, el mensaje accesible aparece y reintentar funciona sin escrituras parciales.

## T09 — Estilos, accesibilidad y responsive (`src/styles.css`) — 25–30 min

- [ ] **Cubre:** RF-3, RF-4, RF-6, RF-7, RF-8, RF-12, RF-13; principios P2, P4, P6.
- Estilizar insignias por estado, filtros, avisos, controles bloqueados, formulario y diálogo irreversible con tokens existentes; conservar foco visible, contraste, tipografía mínima 12 px y estructura adaptable.
- **Hecho cuando:** Chrome DevTools a 360 px y 375 px muestra filtros, tabla, formulario y diálogo sin desbordamiento horizontal; estados se distinguen además del color y ningún texto visible mide menos de 12 px.

## T10 — Verificación final y documentación (`docs/figma-brief.md`, `AGENTS.md`, `MEMORY.md`) — 25–30 min

- [ ] **Cubre:** RF-1–RF-14; principios P1–P6.
- Actualizar las reglas y el brief con estados, auditoría, terminalidad y protección local; ejecutar `npm run build` y verificar en Chrome DevTools escritorio y móvil con datos de QA aislados. Revisar teclado, foco, filtros, fallos/reintento, consola y preservación de datos legacy.
- **Hecho cuando:** `npm run build` termina correctamente; DevTools confirma flujos de alta/transición/baja, historial y vista móvil a 360/375 px sin errores/advertencias de consola; el diff documental refleja Estado como auditado y De baja como inmutable, sin reescribir ni borrar datos del perfil del usuario.

## Comprobaciones compartidas

- Después de cada tarea de código, ejecutar `npm run build`; tras tareas de interfaz, revisar en Chrome DevTools el flujo afectado, consola y viewport móvil conforme a AGENTS.md.
- Para los controles Editar/Borrar de un artículo De baja, usar `disabled` nativo y `aria-disabled="true"`, con explicación accesible. Aplicar la protección también en el detalle de categoría y a cualquier acceso directo al formulario.
- Al cancelar la confirmación de baja, restaurar el valor raw original si era desconocido. En movimientos, presentar ese valor como «Desconocido — [valor original]» y usar «Dato no registrado» si un evento histórico no guardó estado.
