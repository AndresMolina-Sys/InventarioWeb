# Especificación: impresión de etiquetas para artículos

**Estado: aprobada**

## Contexto y objetivo

InventarioWeb Portfolio permite consultar los datos de artículos físicos en un registro local. Esta funcionalidad permitirá preparar e imprimir una etiqueta adhesiva de identificación por artículo, con una vista previa y un código de barras 1D que represente su Código. La etiqueta debe poder generarse sin conexión y sin enviar información del inventario a servicios externos.

## Usuarios

- Personas que mantienen el registro local y necesitan identificar físicamente sus artículos.
- Reclutadores y visitantes que prueban la versión Portfolio y necesitan comprobar el flujo de preparación e impresión.

## Historias de usuario

- Como responsable del inventario, quiero imprimir una etiqueta desde el detalle de un artículo para identificarlo físicamente.
- Como responsable del inventario, quiero revisar la etiqueta antes de imprimirla para confirmar que sus datos son correctos.
- Como responsable del inventario, quiero que el código de barras represente el Código completo y que la impresión se bloquee si el Código o el símbolo no cumplen los criterios de compatibilidad y tamaño definidos.

## Definiciones

- **Etiqueta:** pieza adhesiva horizontal de 70 mm de ancho por 35 mm de alto.
- **Código de barras 1D:** representación Code 128-B del Código completo del artículo. Para generar el símbolo se admiten únicamente caracteres ASCII imprimibles, del 32 al 126.

## Requisitos funcionales

- **RF-1 — Acceso desde el detalle:** Cuando se consulte el detalle de un artículo, el sistema DEBE ofrecer el control «Imprimir etiqueta» dentro de esa vista. El control NO DEBE aparecer en las acciones de las tablas generales ni en otras vistas.
- **RF-2 — Vista previa:** Cuando se active «Imprimir etiqueta», el sistema DEBE abrir una vista previa de la etiqueta de ese artículo antes de iniciar la impresión del navegador. La vista previa DEBE identificar claramente el artículo al que corresponde.
- **RF-3 — Contenido de la etiqueta:** Cuando el Código sea imprimible según RF-7, la etiqueta DEBE incluir Código, Nombre, Categoría, Fecha de ingreso y un código de barras 1D cuyo valor corresponda al Código completo del artículo. Cuando el Código no sea imprimible, la vista previa DEBE comunicar el bloqueo definido en RF-7 en lugar de presentar un código de barras como válido. La Fecha de ingreso DEBE mostrarse en el formato local en español que ya usa la aplicación: día/mes/año y hora/minutos según la hora del navegador.
- **RF-4 — Dimensiones:** Al presentar la vista previa y preparar la impresión, el sistema DEBE conservar el formato horizontal de 70 × 35 mm. La aceptación física se medirá sobre el contorno completo de la etiqueta cuando la impresión se realice a escala 100 %; el ajuste automático de escala NO DEBE alterar esas dimensiones.
- **RF-5 — Texto extenso:** Cuando el Nombre o la Categoría no quepan en una línea, el sistema DEBE permitir hasta dos líneas y truncar el texto restante con puntos suspensivos, preservando espacio para el código de barras.
- **RF-6 — Código de barras local y completo:** Cuando genere el código de barras, el sistema DEBE usar Code 128-B y codificar el Código completo del artículo, que DEBE contener únicamente caracteres ASCII imprimibles del 32 al 126. La generación DEBE ser local, sin conexión a internet ni dependencia de librerías externas de npm. El texto legible del Código puede truncarse según RF-7, pero el valor codificado en el código de barras NUNCA DEBE truncarse. Esta regla solo determina si se puede imprimir la etiqueta y NO DEBE cambiar la validación ni la posibilidad de guardar Códigos en el inventario.
- **RF-7 — Elegibilidad y legibilidad del Código:** Cuando el Código contenga caracteres fuera del rango ASCII imprimible 32–126, o cuando el código de barras completo no quepa dentro del contorno de 70 × 35 mm cumpliendo un módulo mínimo de 0,25 mm, zonas libres de al menos 10 módulos a cada lado y barras de al menos 10 mm de alto, el sistema DEBE avisar a la persona y bloquear la impresión. El sistema NO DEBE truncar el valor codificado ni ampliar las dimensiones de la etiqueta. Cuando el texto legible del Código exceda el espacio disponible, el sistema DEBE mostrarlo en hasta dos líneas y añadir puntos suspensivos al texto restante; esta presentación NO DEBE cambiar el valor completo codificado.
- **RF-8 — Inicio explícito de impresión:** Mientras la vista previa esté abierta y la etiqueta sea imprimible, el sistema DEBE permitir iniciar la impresión mediante una acción explícita de la persona que invoque el diálogo de impresión del navegador. La vista previa DEBE aparecer antes de esa acción.
- **RF-9 — Aislamiento de impresión:** Cuando se imprima la etiqueta, el resultado impreso DEBE contener únicamente la etiqueta seleccionada. El sistema DEBE ocultar el resto de la aplicación y cualquier diálogo que quede detrás de la vista previa.
- **RF-10 — Cancelación o fallo de la solicitud de impresión:** Cuando la persona cierre o cancele el diálogo de impresión del navegador, o cuando la solicitud de impresión del navegador no pueda iniciarse, la vista previa DEBE permanecer abierta y disponible. El sistema NO DEBE afirmar que puede detectar si una impresora física falló después de aceptar el trabajo.
- **RF-11 — Cierre de la vista previa:** Cuando la persona cierre la vista previa sin imprimir, el sistema DEBE volver al detalle del mismo artículo.
- **RF-12 — Solo lectura:** Mientras se prepare o imprima una etiqueta, el sistema NO DEBE cambiar ni guardar datos del artículo, alterar categorías ni crear movimientos de inventario.

## Requisitos no funcionales

- **Accesibilidad:** La vista previa DEBE tener nombre accesible, operar con teclado, mostrar un foco visible y permitir cerrar la vista previa sin usar un puntero. El estado de impresión bloqueada DEBE comunicarse también a tecnologías de asistencia.
- **Legibilidad:** Ningún texto que se muestre en la interfaz, la vista previa o la etiqueta DEBE ser inferior a 12 px. Esta regla aplica al texto visible efectivamente renderizado; NO obliga a imprimir completo un valor variable que exceda el espacio disponible. Nombre y Categoría DEBEN ajustarse a RF-5 sin reducir su tamaño ni recortar el código de barras.
- **Consistencia visual:** La vista previa DEBE respetar los colores, tipografía, bordes, espaciado y estados de foco establecidos por la interfaz del proyecto.
- **Adaptación:** La vista previa DEBE poder consultarse en viewports de 360–375 px sin desbordamiento horizontal, conservando la proporción de la etiqueta. En viewports de poca altura, su contenido DEBE permitir desplazamiento vertical y los controles para imprimir o cerrar DEBEN permanecer accesibles. Las dimensiones físicas 70 × 35 mm se aplican al resultado impreso a escala 100 %.
- **Rendimiento local:** La vista previa y el código de barras DEBEN estar disponibles sin demora perceptible y en menos de 100 ms desde la activación, sin requerir servicios remotos.
- **Privacidad y funcionamiento sin conexión:** La generación de la etiqueta y del código de barras DEBE funcionar localmente y NO DEBE enviar el Código ni otros datos del artículo fuera del navegador.
- **Criterio geométrico del código de barras:** La elegibilidad definida en RF-7 DEBE comprobar que el símbolo completo cabe en la etiqueta, incluidas sus zonas libres, con módulos de al menos 0,25 mm y barras de al menos 10 mm de alto. Este criterio DEBE describir dimensiones del símbolo y NO DEBE presentarse como garantía de lectura con cualquier impresora o lector físico.

## Casos límite

- Si Nombre o Categoría exceden una línea, se muestran hasta dos líneas; el texto que exceda esas dos líneas termina con puntos suspensivos. El texto renderizado conserva el mínimo de 12 px y deja disponible el espacio requerido para el código de barras.
- Si el Código contiene caracteres fuera de ASCII imprimible (32–126), se informa que no es compatible con la etiqueta y no se permite imprimir. Esta restricción no impide guardar el artículo ni modifica las reglas de validación del inventario.
- Si el símbolo Code 128-B completo, incluidas zonas libres de 10 módulos en ambos lados, no cabe en 70 × 35 mm con módulo mínimo de 0,25 mm y barras de al menos 10 mm de alto, se informa del problema y no se permite imprimir. El valor codificado nunca se trunca ni se amplía la etiqueta. El cumplimiento geométrico no garantiza que cualquier impresora o lector físico pueda leerlo.
- Si el Código legible excede el espacio disponible, se presenta en hasta dos líneas y el resto se indica con puntos suspensivos; el texto visible puede abreviarse, pero el código de barras conserva el valor completo. No se reduce el texto por debajo del mínimo de 12 px.
- El Código es un dato requerido del artículo; la vista previa debe representar el Código del artículo que se está consultando y no el de otro registro.
- Si la persona cierra o cancela el diálogo nativo, la vista previa sigue abierta. Cerrar la propia vista previa regresa al detalle del artículo.
- La impresión no cambia Fecha de ingreso, Última modificación, los datos locales ni el historial de movimientos.
- La vista previa debe conservar su proporción en pantallas estrechas y permitir desplazamiento vertical en pantallas de poca altura sin ocultar controles accesibles.
- El diálogo puede cancelarse, cerrarse o no iniciarse por un fallo reportado por el navegador; en esos casos la vista previa permanece abierta. No se presupone que la aplicación pueda observar fallos físicos posteriores de la impresora.

## Fuera de alcance

- Imprimir etiquetas en lote o seleccionar artículos desde las tablas generales.
- Cambiar, editar o guardar datos del artículo desde la vista previa.
- Enviar datos a un servicio remoto para generar o validar el código de barras.
- Añadir persistencia de etiquetas, registrar la impresión como movimiento o modificar IndexedDB.
- Cambiar el tamaño físico de la etiqueta o imprimirla en un formato distinto de 70 × 35 mm.

## Criterios de finalización

- «Imprimir etiqueta» aparece solo en el detalle del artículo y abre una vista previa para el artículo correcto antes de iniciar la impresión.
- Cuando el Código sea imprimible según RF-7, la vista previa incluye Código, Nombre, Categoría, Fecha de ingreso y el código de barras Code 128-B completo, con geometría que cumple los mínimos acordados. Si el Código no es imprimible, la vista previa comunica el bloqueo en lugar de presentar un código de barras como válido. La geometría no garantiza lectura con cualquier impresora o lector físico.
- La etiqueta conserva orientación horizontal y mide 70 × 35 mm en el contorno completo cuando se imprime a escala 100 %; Nombre y Categoría siguen el límite de dos líneas y los puntos suspensivos sin bajar de 12 px.
- La Fecha de ingreso usa el formato local en español ya usado por la aplicación: día/mes/año y hora/minutos según la hora del navegador.
- Code 128-B acepta solo Códigos formados por ASCII imprimible (32–126). Si no se cumple, o si el símbolo completo con sus zonas libres no cabe en la etiqueta con módulos de al menos 0,25 mm, zonas libres de 10 módulos por lado y barras de al menos 10 mm de alto, se muestra un aviso y la impresión no está disponible. El valor codificado no se trunca ni se amplía la etiqueta; estas restricciones no modifican la validación ni el guardado de Códigos en inventario. El texto visible del Código ocupa hasta dos líneas y usa puntos suspensivos si excede el espacio, sin cambiar el valor codificado. El criterio geométrico no garantiza la lectura con cualquier impresora o lector.
- El diálogo de impresión imprime solo la etiqueta; cerrar, cancelar o no poder iniciar la impresión deja la vista previa abierta. No se afirma la detección de fallos físicos de impresión.
- La vista previa se puede usar con teclado y tecnologías de asistencia; respeta el mínimo tipográfico de 12 px, permite scroll vertical con poca altura y se adapta a 360–375 px sin desbordamiento horizontal.
- La funcionalidad funciona sin conexión, no usa dependencias externas para el código de barras y no altera artículos, categorías ni movimientos.
- La implementación se valida con `npm run build` y Chrome DevTools en escritorio y a 360–375 px; la consola queda sin errores ni advertencias. `docs/figma-brief.md` se actualiza con el diseño y el flujo de impresión.

