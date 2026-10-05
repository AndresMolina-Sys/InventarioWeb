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

- **RF-1 — Inspección del evento:** Cuando la persona active el control «Ver detalle» de un movimiento, el sistema DEBE abrir un modal de solo lectura correspondiente a ese evento. Al cerrarlo, DEBE conservar el filtro, la página y la posición de consulta del historial.
- **RF-2 — Cabecera del detalle:** Cuando se abra el modal, el sistema DEBE mostrar el badge de acción («Alta», «Edición» o «Baja»), el nombre del artículo, su código y la fecha y hora legibles del movimiento. Si alguno de esos datos no se conservó, DEBE mostrar «Dato no registrado» para ese dato.
- **RF-3 — Ficha de altas y bajas:** Cuando el evento sea un alta, el sistema DEBE mostrar el estado nuevo del artículo; cuando sea una baja, DEBE mostrar el estado previo al borrado. La ficha DEBE incluir Código, Nombre, Categoría, N.º de serie, Ubicación, Costo, Marca, Modelo y Notas.
- **RF-4 — Ediciones:** Cuando el evento sea una edición, el sistema DEBE presentar una comparación «Antes / Después» únicamente para los campos auditados cuyo valor neto cambió.
- **RF-5 — Campos auditados:** El sistema DEBE auditar Código, Nombre y Categoría como campos obligatorios, y N.º de serie, Ubicación, Costo, Marca, Modelo y Notas como opcionales. SKU queda fuera de esta versión. El nombre de categoría DEBE corresponder al que tenía al producirse el evento. El sistema NO DEBE presentar como cambios el identificador del artículo, la fecha de ingreso, la fecha de modificación ni los metadatos propios del movimiento.
- **RF-6 — Normalización del diff:** Cuando compare texto, el sistema DEBE ignorar espacios residuales al principio o al final mediante recorte (`trim`); las diferencias internas de texto DEBEN conservarse como diferencias. Cuando compare Costo, DEBE comparar valores numéricos: vacío, nulo y cero se consideran equivalentes para decidir si hubo cambio; un costo cero sigue siendo un valor válido.
- **RF-7 — Campos vacíos y no registrados:** Cuando un campo opcional esté vacío o nulo en el snapshot del evento, el sistema DEBE mostrar «Sin especificar». Cuando un campo no exista en un movimiento histórico incompleto, DEBE mostrar «Dato no registrado»; ambos estados DEBEN ser visualmente distinguibles.
- **RF-8 — Edición sin cambios netos:** Cuando una edición no presente diferencias netas en los campos auditados, el sistema NO DEBE persistir cambios del artículo, actualizar su fecha de modificación ni crear un movimiento.
- **RF-9 — Compatibilidad histórica:** Cuando una edición antigua no conserve los estados anterior y posterior, o un movimiento huérfano carezca del snapshot requerido por su acción, el sistema DEBE indicar que no hay detalle histórico completo, mostrar solo los datos conservados y NO inferir ni completar valores con el estado actual del artículo. En altas y bajas, la ausencia se limita al estado requerido por esa acción: nuevo para alta y previo para baja.
- **RF-10 — Preservación temporal:** Cuando el artículo sea editado o eliminado después de un evento, o la categoría cambie de nombre, el detalle DEBE conservar los valores del evento original.
- **RF-11 — Solo lectura:** Mientras el modal esté abierto, el sistema NO DEBE ofrecer acciones para editar o borrar el movimiento, alterar el artículo ni restaurar información desde el evento.
- **RF-12 — Cierre accesible:** Cuando se abra el modal, DEBE exponer `role="dialog"` y `aria-labelledby`, y situar el foco inicial en el botón con `aria-label="Cerrar detalle de movimiento"`. Cuando se active ese botón o se presione Escape, el modal DEBE cerrarse y devolver el foco al control que lo abrió.

## Requisitos no funcionales

- **Accesibilidad:** El modal DEBE tener nombre accesible, contener la navegación por teclado y permitir operar sus controles sin puntero.
- **Consistencia visual:** El modal DEBE reutilizar la jerarquía, colores, bordes, estados de foco y espaciado visuales existentes.
- **Legibilidad y adaptación:** Ningún texto visible DEBE ser menor de 12 px. El modal DEBE limitar su altura proporcionalmente al viewport y permitir desplazamiento vertical interno. Los valores extensos, especialmente las notas, DEBEN envolverse sin recortes ni desbordamiento horizontal en móvil.
- **Rendimiento local:** El detalle del movimiento DEBE renderizarse en menos de 100 ms desde la activación, sin requerir conexión externa.
- **Preservación de datos:** La evolución de los registros DEBE preservar todos los artículos, categorías y movimientos existentes; cualquier migración DEBE ser no destructiva y no inventar historial anterior.
- **Documentación y verificación:** Antes de dar por terminada la funcionalidad, DEBE actualizarse `docs/figma-brief.md` con el diseño del modal y comprobarse el flujo con Chrome DevTools en escritorio y a 360–375 px, sin errores ni advertencias en consola.
- **Privacidad y alcance de confianza:** La interfaz DEBE dejar claro que la información pertenece al registro local del navegador; no DEBE prometer sincronización ni protección contra alteraciones externas a la aplicación.

## Casos límite

- Los movimientos antiguos pueden conservar solo parte de los datos; el campo ausente se muestra como «Dato no registrado», no como vacío.
- Los opcionales vacíos o nulos se muestran como «Sin especificar»; el costo cero se presenta con el formato monetario actual del producto.
- Cambios de espacios al inicio o final de texto no producen diff; cambios de mayúsculas, texto interno o contenido sí se consideran cambios.
- Pasar de costo vacío/nulo a cero no produce diff; cambiar a otro valor numérico sí.
- Las ediciones antiguas sin datos anterior/posterior muestran su limitación sin reconstruir valores.
- Las altas requieren el snapshot del estado nuevo; las bajas, el del estado previo. Si falta el snapshot requerido, se indica la información no registrada.
- Un artículo puede haber sido editado o eliminado después del evento; el detalle histórico no debe cambiar.
- Una categoría puede cambiar de nombre después del evento; el nombre mostrado sigue siendo el vigente al ocurrir el movimiento.
- Las notas largas y los viewports móviles de poca altura usan scroll interno sin ocultar el cierre.
- Si el historial está vacío, el modal no tiene un evento que mostrar y la vista existente conserva su estado vacío.

## Fuera de alcance

- Auditar SKU o cambios de categorías como movimientos de artículos.
- Editar o borrar movimientos desde el historial.
- Exportar auditorías, restaurar artículos o comparar versiones elegidas manualmente.
- Reconstruir diferencias históricas que no se conservaron.
- Sincronizar movimientos entre equipos, enviar datos a servicios remotos o garantizar que un registro local sea inviolable.

## Criterios de finalización

- Altas muestran la ficha completa del estado nuevo y bajas la ficha completa del estado previo; las ediciones muestran solo campos auditados con diferencias netas correctas.
- Código, Nombre y Categoría se tratan como obligatorios; los seis campos opcionales se distinguen correctamente entre «Sin especificar» y «Dato no registrado». SKU no se audita.
- El recorte de texto y la comparación numérica del costo siguen las reglas especificadas; una edición sin diferencias no modifica el artículo, su fecha ni el historial.
- Ediciones históricas incompletas y movimientos huérfanos muestran solo datos conservados; nunca se completan con el estado actual.
- El encabezado muestra acción, nombre, código y fecha/hora; el modal cumple el comportamiento de foco, teclado y cierre indicado.
- Artículos eliminados, categorías renombradas, costo cero, opcionales vacíos, datos faltantes, notas largas y viewports móviles se presentan sin pérdida ni desbordamiento.
- La migración conserva todos los registros actuales y la documentación de diseño queda sincronizada.
- La funcionalidad se verifica con build y Chrome DevTools en escritorio y a 360–375 px; la consola queda sin errores ni advertencias y la apertura tarda menos de 100 ms.

## Dudas abiertas

Ninguna. Las decisiones de alcance y compatibilidad se resolvieron durante el refinamiento.
