# Especificación: detalle y diff de movimientos

## Contexto y objetivo

La vista «Movimientos» permite consultar altas, ediciones y bajas de artículos, pero los registros existentes no contienen el detalle necesario para comparar los valores anteriores y posteriores a una edición. Esta funcionalidad hará inspeccionable cada evento y mostrará con claridad los datos disponibles, sin presentar como histórico información que no se guardó en su momento.

## Usuarios

- Personas que usan InventarioWeb Portfolio para mantener y revisar el registro local de artículos.
- Reclutadores y visitantes que prueban el producto y necesitan entender cómo se conserva la trazabilidad.

## Historias de usuario

- Como responsable del registro, quiero consultar la ficha de un artículo en una alta o baja para saber qué se agregó o eliminó.
- Como responsable del registro, quiero comparar los valores antes y después de una edición para identificar exactamente qué cambió.
- Como visitante, quiero que los movimientos antiguos indiquen sus limitaciones para no confundir datos actuales con datos históricos.

## Requisitos funcionales

- **RF-1 — Inspección del evento:** Cuando la persona active el control «Ver detalle» de un movimiento, el sistema DEBE abrir un modal de solo lectura correspondiente a ese evento. Al cerrar el modal, DEBE conservar el filtro, la página y la posición de consulta del historial.
- **RF-2 — Altas y bajas:** Cuando el evento sea un alta o una baja, el sistema DEBE mostrar la ficha del artículo tal como existía al producirse el evento: código, nombre, SKU, número de serie, marca, modelo, ubicación, notas, categoría y costo.
- **RF-3 — Ediciones:** Cuando el evento sea una edición, el sistema DEBE presentar una comparación «Antes / Después» únicamente para los campos auditados cuyo valor cambió.
- **RF-4 — Campos auditados:** Para las ediciones, el sistema DEBE comparar código, nombre, SKU, número de serie, marca, modelo, ubicación, notas, categoría y costo. El nombre de categoría mostrado DEBE corresponder al momento del evento. El sistema NO DEBE presentar como cambios el identificador del artículo, la fecha de ingreso, la fecha de modificación ni los metadatos propios del movimiento.
- **RF-5 — Valores opcionales:** Cuando un campo opcional no tenga valor, el sistema DEBE mostrar «Sin especificar». Cuando el costo sea cero, DEBE mostrarlo como un valor válido con el formato monetario actual del producto.
- **RF-6 — Edición sin cambios:** Cuando se intente guardar una edición sin diferencias en los campos auditados, el sistema NO DEBE registrar un movimiento de edición.
- **RF-7 — Compatibilidad histórica:** Cuando un movimiento existente no conserve valores anteriores y posteriores, el sistema DEBE informar que no hay diff histórico disponible y mostrar, si existen, el código, nombre y categoría que conserva el evento. El sistema NO DEBE inferir ni completar valores históricos a partir del estado actual del artículo.
- **RF-8 — Sin snapshot asociado:** Cuando un movimiento antiguo no tenga datos asociados al artículo, el modal DEBE conservar visibles la acción y la fecha del evento e indicar que no se guardaron más datos.
- **RF-9 — Solo lectura:** Mientras el modal esté abierto, el sistema NO DEBE ofrecer acciones para editar o borrar el movimiento, alterar el artículo ni restaurar información desde el evento.
- **RF-10 — Cierre:** Cuando se active el botón de cierre o se presione Escape, el sistema DEBE cerrar el modal y devolver el foco al control que lo abrió.

## Requisitos no funcionales

- **Accesibilidad:** El modal DEBE tener nombre accesible, exponer correctamente su condición modal, recibir el foco al abrirse, mantener la navegación por teclado dentro de sí y devolver el foco al cerrarse. El control de inspección y el cierre DEBEN ser operables con teclado.
- **Consistencia visual:** El modal DEBE reutilizar la jerarquía, colores, bordes, estados de foco y espaciado visuales establecidos por la interfaz y la constitución del proyecto.
- **Legibilidad y adaptación:** Ningún texto visible DEBE ser menor de 12 px. Los valores extensos, especialmente las notas, DEBEN poder envolverse sin quedar cortados ni causar desbordamiento horizontal en móvil.
- **Rendimiento local:** Al inspeccionar un evento, su detalle DEBE estar disponible con una respuesta perceptiblemente inmediata y no debe requerir conexión externa.
- **Privacidad y alcance de confianza:** La interfaz DEBE dejar claro que la información pertenece al registro local del navegador; no DEBE prometer sincronización ni protección contra alteraciones externas a la aplicación.

## Casos límite

- Los movimientos ya guardados pueden conservar únicamente código, nombre y categoría; los valores anterior y posterior no se pueden reconstruir.
- Un artículo puede haber sido editado o eliminado después de un movimiento; el detalle histórico no debe cambiar por ello.
- Una categoría puede cambiar de nombre después del evento; el detalle debe conservar el nombre que tenía en ese momento.
- Los campos opcionales pueden estar vacíos, contener texto largo o, en el caso del costo, tener valor cero.
- Una edición sin cambios auditables no debe generar un registro que parezca una modificación real.
- Si el historial está vacío, el modal no tiene un evento que mostrar y la vista existente conserva su estado vacío.

## Fuera de alcance

- Editar o borrar movimientos desde el historial.
- Exportar auditorías, restaurar artículos o comparar versiones elegidas manualmente.
- Reconstruir diferencias históricas que no se conservaron.
- Sincronizar movimientos entre equipos, enviar datos a servicios remotos o garantizar que un registro local sea inviolable.
- Registrar cambios de categorías como movimientos de artículos.

## Criterios de finalización

- Las altas y bajas nuevas muestran todos los campos de la ficha en su estado al momento del evento.
- Las ediciones nuevas muestran únicamente los campos modificados, con valores anterior y posterior correctos.
- Una edición sin cambios auditables no aparece como movimiento.
- Los eventos antiguos muestran su limitación y solo los datos históricos realmente disponibles; no se usan valores actuales para completar el pasado.
- El modal se puede abrir, recorrer y cerrar con teclado, y devuelve el foco al control de origen.
- El detalle funciona para artículos eliminados, categorías renombradas, campos opcionales vacíos y notas largas, en escritorio y móvil.
- La apertura y el cierre no cambian filtro, página ni posición del historial.

## Dudas abiertas

Ninguna. Las decisiones de alcance y compatibilidad se resolvieron durante el refinamiento.
