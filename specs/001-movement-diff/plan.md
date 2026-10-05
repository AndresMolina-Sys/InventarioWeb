# Plan de implementación — Diff de movimientos

## 1. Archivos y responsabilidades

- `src/types.ts`: conserva `InventoryMovement`; define la versión de auditoría, la ficha completa y los cambios tipados por campo. Permite que los snapshots antiguos sigan siendo parciales.
- `src/lib/inventoryRepository.ts`: prepara valores normalizados, detecta cambios netos y guarda artículo y evento dentro de una única transacción IndexedDB. Una edición sin diferencias devuelve `unchanged` y no escribe.
- `src/App.tsx`: añade «Ver detalle» a la tabla, el modal de solo lectura, estados históricos parciales y el aviso al guardar una edición sin cambios. La ubicación vacía será válida y se mostrará como «Sin especificar».
- `src/styles.css`: da estilo a la acción y al modal; contiene el foco, permite scroll interno y apila los campos antes/después en móvil. Ningún texto baja de 12 px.
- `docs/figma-brief.md`: registra las vistas de alta, edición y baja, las diferencias, la compatibilidad histórica y la interacción adaptable.
- `AGENTS.md` y `MEMORY.md`: documentan las reglas de persistencia, auditoría, compatibilidad y foco del modal. Son archivos locales excluidos de Git.
- `index.html` y `public/favicon.svg`: enlazan el favicon SVG de la marca para evitar la petición fallida a `/favicon.ico`.
- `src/data/demo.ts`: no cambia; la migración de `localStorage` no dispone de movimientos pasados para reconstruir.

## 2. Modelo de datos y evolución en IndexedDB

Se conserva el store `snapshots` y la versión de la base. Los movimientos nuevos llevan `auditVersion: 1` y mantienen `id`, `type` y `occurredAt`.

La ficha de auditoría contiene `code`, `name` y `categoryName` como texto, y `serialNumber`, `location`, `brand`, `model` y `notes` como texto o `null`; `cost` es número o `null`. No contiene SKU, ID del artículo ni fechas técnicas. Altas guardan el estado nuevo y bajas el estado previo. Ediciones guardan el resumen posterior y un mapa no vacío `changes`, con `before` y `after` para cada uno de estos campos: `code`, `name`, `categoryName`, `serialNumber`, `location`, `cost`, `brand`, `model` y `notes`.

Los registros sin `auditVersion` se tratan como históricos. El normalizador conserva sus datos presentes y no exige que contengan todos los campos nuevos. La extensión es aditiva: no cambia stores ni índices, no borra registros y no inventa diffs. La migración desde la demo anterior conserva artículos y categorías y deja el historial vacío.

## 3. Comparación pura y normalización

Antes de comparar, el repositorio recorta espacios exteriores de los textos. Los opcionales vacíos se representan como `null`; cambios de mayúsculas, contenido o espacios internos sí cuentan. La categoría se compara por su selección asociada y el diff almacena el nombre que tenía cada categoría al ocurrir el cambio.

El costo se compara numéricamente; `null`, vacío y cero son equivalentes solo para detectar cambios. Por tanto, cambiar de cero a un costo positivo crea un diff, pero cambiar de vacío a cero no. SKU no forma parte del conjunto auditable.

Tras validar el formulario, si el conjunto de cambios auditables está vacío, la operación devuelve `unchanged` sin actualizar el artículo, `updatedAt` ni los movimientos. Si hay cambios, artículo, fecha y evento se guardan juntos en la misma transacción.

## 4. Interfaz, interacción y accesibilidad

Cada fila tiene un botón explícito «Ver detalle»; la fila completa no es interactiva. El modal identifica la acción con badge y presenta nombre, código y fecha/hora local. Altas y bajas muestran la ficha completa; ediciones muestran solo filas de campos cambiados con columnas «Campo», «Antes» y «Después».

El modal usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby`. El botón de cierre tiene el nombre accesible «Cerrar detalle de movimiento» y recibe el foco inicial. `Tab` y `Mayús+Tab` quedan contenidos en el diálogo; `Escape` lo cierra y el foco vuelve al botón que lo abrió. El diálogo es de solo lectura.

En snapshots completos, opcionales vacíos o nulos se muestran como «Sin especificar». Si la propiedad falta en un evento antiguo, aparece «Dato no registrado»; los dos estados se distinguen visualmente. Los eventos históricos y huérfanos conservan acción, fecha y cualquier dato disponible, sin consultar el artículo actual para completar el pasado.

El encabezado permanece visible mientras el cuerpo desplaza dentro del modal. Las notas y nombres largos pueden envolver. En anchos de 360–375 px, los datos de ficha van en una columna y cada campo del diff agrupa sus valores anterior y posterior sin desbordamiento. El piso tipográfico global es 12 px.

## 5. Decisiones técnicas

- Se versionan eventos nuevos con `auditVersion: 1`; ausencia del marcador identifica el formato histórico. Esto evita inferir compatibilidad por coincidencias accidentales de forma.
- Las ediciones guardan diffs por campo en lugar de dos fichas completas para no duplicar datos y presentar solo los cambios relevantes. Altas y bajas sí necesitan una ficha completa.
- El modal es de consulta y no ofrece restauración, edición ni borrado de eventos; el historial local no se describe como inviolable o sincronizado.
- Se mantiene el store existente y se amplía cada registro de forma aditiva. No se crea una base paralela ni se requiere nueva dependencia.
- El formulario permitirá ubicación vacía; artículos existentes con «General» conservarán ese valor histórico.
- El favicon SVG explícito resuelve la solicitud ausente sin ocultar errores con un icono vacío.

## 6. Verificación y control de calidad

- Ejecutar `npm run build` para validar TypeScript y generar el bundle.
- Revisar altas y bajas con ficha completa; diffs de uno o varios campos; texto con espacios; cambio de categoría; costo vacío, cero y positivo; y una edición sin cambios, confirmando que no altera artículo, fecha ni historial.
- Comprobar errores de validación, antiguos movimientos parciales, eventos sin snapshot, categoría renombrada y artículo borrado; confirmar que se conservan artículos, categorías y movimientos.
- En Chrome DevTools probar escritorio y 360/375 px; activar el botón con teclado, recorrer y cerrar el modal con `Escape`, verificar foco inicial/restauración, estado de filtro/página, contenido largo y ausencia de scroll horizontal en la página.
- Revisar consola sin errores ni advertencias y comprobar que `/favicon.svg` responde correctamente y no se solicita `/favicon.ico`. Verificar que la apertura local sea inferior a 100 ms.

## 7. Matriz de trazabilidad

| Trabajo | Requisitos de la spec | Principios de la constitución |
| --- | --- | --- |
| Tipos versionados y preservación de formatos anteriores | RF-2–RF-7, RF-9–RF-10 | 1, 3, 5, 6 |
| Normalización, diff y transacción/no-op | RF-4–RF-8, RF-10 | 3, 5 |
| Acción explícita, cabecera, ficha/diff y estados históricos | RF-1–RF-7, RF-9–RF-11 | 2, 4, 6 |
| Teclado, foco, scroll, legibilidad y móvil | RF-1, RF-11–RF-12 y requisitos no funcionales | 2, 4, 6 |
| Figma brief y reglas locales | Requisitos de documentación y criterios de finalización | 2, 6 |
| Favicon y revisión de consola | Criterio de consola sin errores ni advertencias | 1, 4 |
