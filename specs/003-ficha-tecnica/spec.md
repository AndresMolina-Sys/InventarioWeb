# Ficha técnica y acta de resguardo

**Estado: aprobada**

## Contexto y objetivo

InventarioWeb Portfolio permite consultar artículos de equipo tecnológico para control interno. Esta función produce una ficha formal, imprimible en una hoja Carta vertical, para respaldar la entrega, recepción o auditoría física de un bien. El documento identifica el artículo, presenta sus especificaciones y reserva espacios para firmas manuscritas.

## Usuarios

- Personal que entrega o recibe equipo tecnológico.
- Personal que documenta o consulta una auditoría física de artículos.

## Historias de usuario

- Como responsable de inventario, quiero imprimir una ficha del artículo para documentar su entrega y recepción física.
- Como persona que recibe o audita el equipo, quiero revisar los datos y el código identificador antes de imprimir el documento.
- Como usuario de la aplicación, quiero generar, imprimir o cancelar una ficha sin alterar el inventario.

## Definiciones

- **Ficha:** documento individual de 215,9 × 279,4 mm, tamaño Carta y orientación vertical.
- **Código compatible:** Código formado solo por caracteres ASCII imprimibles del 32 al 126, cuyo símbolo completo cabe en un máximo de 180 mm, incluidas sus zonas libres, con módulo de exactamente 0,25 mm y barras de al menos 10 mm de alto.
- **Ancho natural del código:** para un Código compatible de N caracteres, el ancho total del símbolo, incluidas las zonas libres, es `(11N + 55) × 0,25 mm`.
- **Campo de texto opcional vacío:** Marca, Modelo, Número de serie, Ubicación u otro dato opcional de texto ausente, vacío o compuesto solo por espacios (`trim() === ''`); se representa como «Sin especificar». Notas bajo esas mismas condiciones se representan como «Sin observaciones». Costo nulo, indefinido o como cadena vacía se representa como «Sin especificar»; el valor cero es un costo capturado.

## Requisitos funcionales

### RF-1. Acceso a la ficha

La acción para generar la ficha estará disponible en el detalle del artículo, para vincular el documento con el bien consultado.

**Criterios de aceptación (EARS):**

- CUANDO el usuario abra el detalle de un artículo, ENTONCES el sistema mostrará la acción «Imprimir ficha técnica».
- CUANDO el usuario consulte las tablas generales de artículos, ENTONCES no encontrará allí una acción para imprimir esta ficha.

### RF-2. Vista previa y acciones

El usuario deberá poder revisar la hoja completa antes de solicitar la impresión.

**Criterios de aceptación (EARS):**

- CUANDO el usuario active «Imprimir ficha técnica», ENTONCES el sistema abrirá primero una vista previa con la hoja, los datos, el código de barras o el aviso correspondiente y las áreas de firma.
- CUANDO la vista previa esté abierta, ENTONCES mostrará las acciones «Imprimir» y «Cerrar».
- CUANDO el usuario active «Imprimir», ENTONCES el sistema solicitará la impresión al navegador.
- CUANDO el usuario active «Cerrar», ENTONCES el sistema cerrará la vista previa y volverá al detalle del mismo artículo.
- CUANDO la vista previa se muestre en un ancho de 360–375 px, ENTONCES el usuario podrá revisar la hoja completa mediante ajuste visual o desplazamiento, sin que se recorte información.

### RF-3. Encabezado e identificación

La ficha identificará su propósito y el artículo asociado.

**Criterios de aceptación (EARS):**

- CUANDO el sistema muestre una ficha, ENTONCES incluirá «Control interno · InventarioWeb» y «Ficha técnica y acta de resguardo».
- CUANDO el Código esté disponible y sea compatible, ENTONCES la ficha mostrará el valor legible completo y un código de barras 1D Code 128-B que represente exactamente ese valor.
- CUANDO el Código legible necesite más de una línea, ENTONCES el sistema lo mostrará completo, sin truncar ni omitir caracteres.

### RF-4. Especificaciones del bien

La ficha presentará las especificaciones necesarias para identificar y revisar el bien.

**Criterios de aceptación (EARS):**

- CUANDO el sistema muestre una ficha, ENTONCES incluirá Código, Nombre, Categoría, Marca, Modelo, Número de serie, Ubicación, Costo registrado, Fecha de ingreso y Observaciones/Notas; no incluirá SKU.
- CUANDO Marca, Modelo, Número de serie, Ubicación u otro campo de texto opcional estén vacíos o contengan solo espacios (`trim() === ''`), ENTONCES el sistema los considerará vacíos y mostrará «Sin especificar».
- CUANDO Notas estén vacías o contengan solo espacios (`trim() === ''`), ENTONCES el sistema las considerará vacías y mostrará «Sin observaciones».
- CUANDO Costo tenga valor numérico cero, ENTONCES el sistema lo tratará como capturado y lo mostrará como «$0.00» con el formato USD actual.
- CUANDO Costo sea nulo, no esté definido o sea una cadena vacía, ENTONCES el sistema mostrará «Sin especificar».
- CUANDO se muestre la Fecha de ingreso, ENTONCES se usará el formato local actual de la aplicación.
- CUANDO un campo de texto distinto de Código y Notas sea extenso, ENTONCES el valor podrá ocupar hasta tres líneas; si excede ese espacio, se truncará al final con «...».

### RF-5. Datos obligatorios ausentes

La ficha señalará los datos obligatorios faltantes y bloqueará la impresión de un documento incompleto.

**Criterios de aceptación (EARS):**

- CUANDO Código, Nombre o Categoría falten, estén vacíos o contengan únicamente espacios al inicio y al final, ENTONCES el sistema los considerará vacíos y mostrará «[No disponible]» en el campo correspondiente.
- CUANDO falte Código, ENTONCES el área de identificación mostrará «Código no disponible» en lugar del código de barras.
- CUANDO falte cualquiera de Código, Nombre o Categoría, ENTONCES la vista previa se abrirá, mostrará un aviso visible y accesible, y deshabilitará «Imprimir».

### RF-6. Compatibilidad y dimensiones del código de barras

Solo se permitirá imprimir el código de barras completo cuando cumpla las reglas de compatibilidad y dimensión convenidas.

**Criterios de aceptación (EARS):**

- CUANDO el Código incluya caracteres fuera del rango ASCII imprimible 32–126, ENTONCES la vista previa se abrirá, mostrará un aviso accesible y deshabilitará «Imprimir».
- CUANDO el Código contenga N caracteres ASCII imprimibles, ENTONCES su ancho natural total será `(11N + 55) × 0,25 mm`, incluidas las zonas libres de 10 módulos por lado.
- CUANDO el ancho natural sea de hasta 120 mm, ENTONCES el símbolo aparecerá centrado y a su ancho natural, sin estirarse artificialmente.
- CUANDO el ancho natural supere 120 mm y no exceda 180 mm, ENTONCES el símbolo podrá usar ese espacio adicional sin cambiar el módulo de 0,25 mm.
- CUANDO el ancho natural supere 180 mm, ENTONCES la vista previa mostrará un aviso accesible y deshabilitará «Imprimir».
- CUANDO se muestre un símbolo imprimible, ENTONCES tendrá barras de al menos 10 mm de alto y zonas libres de 10 módulos a cada lado.
- CUANDO el sistema bloquee la impresión por incompatibilidad, ausencia de Código o exceso de ancho, ENTONCES no truncará, reemplazará ni codificará parcialmente su valor.

### RF-7. Papel y configuración cubierta

La impresión tendrá una configuración física de referencia definida para que el documento pueda evaluarse de forma consistente.

**Criterios de aceptación (EARS):**

- CUANDO se imprima con la configuración cubierta por esta especificación, ENTONCES la hoja será Carta vertical de 215,9 × 279,4 mm, a escala 100 %, con márgenes de 15 mm por cada lado.
- CUANDO se evalúe el ancho del código de barras, ENTONCES el máximo aceptado será 180 mm, aunque el área entre los márgenes sea mayor.
- CUANDO el usuario cambie manualmente papel, orientación, escala o márgenes en el diálogo del navegador, ENTONCES la salida quedará fuera de la garantía física de esta especificación.

### RF-8. Una página, texto y firmas

La ficha priorizará una sola página, respetará el piso tipográfico del proyecto y conservará ambas áreas de firma.

**Criterios de aceptación (EARS):**

- CUANDO se imprima la ficha con la configuración de RF-7, ENTONCES ocupará una sola página y no dividirá su contenido entre páginas.
- CUANDO Notas contengan texto, ENTONCES su recuadro se ajustará al contenido hasta un máximo de 35 mm de alto.
- CUANDO Notas excedan 35 mm de contenido, ENTONCES el sistema conservará el inicio y truncará el final con «...», sin desbordar el recuadro ni reducir el texto por debajo de 12 px.
- CUANDO Notas contengan líneas extensas o sin espacios, ENTONCES el texto se ajustará al ancho del recuadro antes de aplicar el límite de altura.
- CUANDO Notas estén vacías o sean breves, ENTONCES el recuadro no reservará 35 mm en blanco.
- CUANDO se distribuya la ficha, ENTONCES las áreas de firma quedarán hacia el pie de la página y cada una conservará al menos 30 mm de alto.
- CUANDO se imprima la ficha, ENTONCES ambos recuadros de firma permanecerán completos y juntos en la misma página.
- CUANDO el espacio sea insuficiente para mantener una página, texto de al menos 12 px y firmas de al menos 30 mm, ENTONCES las Notas cederán espacio primero; el sistema no reducirá el texto por debajo del piso ni separará las firmas entre páginas.

### RF-9. Áreas de firma manuscrita

La ficha tendrá recuadros claramente identificados para completar a mano el acta de entrega y recepción.

**Criterios de aceptación (EARS):**

- CUANDO se genere la ficha, ENTONCES incluirá «Entregado por» con línea de firma y campos para nombre, cargo y fecha.
- CUANDO se genere la ficha, ENTONCES incluirá «Recibido por / Asignado a» con línea de firma y campos para nombre, documento de identidad y fecha.
- CUANDO se imprima la ficha, ENTONCES los campos de firma, nombre, cargo/documento y fecha estarán vacíos y tendrán contraste suficiente para completarse a mano.

### RF-10. Salida monocromática

La salida impresa presentará solo el documento y será legible en escala de grises.

**Criterios de aceptación (EARS):**

- CUANDO el navegador imprima la ficha, ENTONCES la salida contendrá únicamente el documento y ocultará la aplicación, vistas previas de fondo y controles.
- CUANDO el documento se imprima, ENTONCES usará negro, blanco y tonos de gris con contraste suficiente y no dependerá del color para comunicar información.

### RF-11. Cancelación y errores de impresión

Cancelar o no poder iniciar la impresión no cerrará la vista previa ni impedirá reintentar.

**Criterios de aceptación (EARS):**

- CUANDO el usuario cancele o cierre el diálogo de impresión del navegador, ENTONCES la vista previa permanecerá abierta y el foco volverá a «Imprimir» dentro de esa vista.
- CUANDO no se pueda abrir el diálogo de impresión o la solicitud falle, ENTONCES el sistema mantendrá abierta la vista previa, mostrará un mensaje contextual accesible y permitirá reintentar con «Imprimir» o salir con «Cerrar», sin dejar el error sin gestionar.

### RF-12. Instantánea del artículo

La vista previa representará los datos y el nombre de categoría existentes al abrirla, incluso si hay cambios desde otra pestaña.

**Criterios de aceptación (EARS):**

- CUANDO el usuario active «Imprimir ficha técnica», ENTONCES la ficha conservará una instantánea de los datos del artículo y del nombre de Categoría existentes en ese momento.
- CUANDO el artículo o la Categoría cambien desde otra pestaña mientras la vista previa siga abierta, ENTONCES el contenido abierto no cambiará reactivamente.
- CUANDO el usuario cierre y vuelva a abrir la vista previa, ENTONCES el sistema mostrará los datos y el nombre de Categoría actuales.

### RF-13. Solo lectura y privacidad

La generación e impresión de la ficha no alterará los registros ni expondrá información fuera del perfil local.

**Criterios de aceptación (EARS):**

- CUANDO se genere, previsualice, imprima o cancele una ficha, ENTONCES el sistema no añadirá ni modificará artículos, categorías, movimientos o fechas.
- CUANDO se genere o imprima una ficha, ENTONCES no se enviarán los datos a servicios remotos ni se requerirá conexión a Internet.

## Requisitos no funcionales

- **Accesibilidad del diálogo:** La vista previa tendrá `role="dialog"`, `aria-modal="true"` y `aria-labelledby` asociado a un título visible. El foco inicial se ubicará en «Cerrar». Si «Imprimir» está habilitado, Tab y Mayús+Tab mantendrán el foco entre ambos botones. Si «Imprimir» está deshabilitado, Tab y Mayús+Tab mantendrán el foco en el único control activo, «Cerrar». Escape cerrará completamente la vista previa.
- **Restauración del foco:** Al cerrar por «Cerrar» o Escape, el foco volverá al botón «Imprimir ficha técnica» del detalle. Al cancelar el diálogo nativo de impresión, la vista previa permanecerá abierta y el foco volverá a su botón «Imprimir».
- **Legibilidad:** Ningún texto visible en la vista previa, avisos o documento será menor de 12 px. Los mensajes de bloqueo y error serán perceptibles para tecnologías de asistencia.
- **Rendimiento:** Desde el clic en «Imprimir ficha técnica» hasta que la vista previa esté completamente montada y visible, con datos y el símbolo de barras completo o su aviso de bloqueo, transcurrirán menos de 100 ms.
- **Adaptabilidad:** La vista previa se podrá revisar en escritorio y a 360–375 px, sin desbordamiento horizontal de la aplicación.
- **Recursos y privacidad:** La función no incorporará dependencias npm, servicios, conexiones ni recursos remotos; conservará la aplicación local.
- **Límite de lectura:** Cumplir las dimensiones del símbolo no garantiza que cualquier impresora o lector pueda reproducirlo o leerlo.

## Casos límite

- Código con caracteres Unicode, de control o fuera de ASCII imprimible: el preview se abre, explica el bloqueo y no permite imprimir.
- Código cuyo ancho natural excede 180 mm: el preview se abre y bloquea impresión sin truncar ni codificar parcialmente el valor.
- Código ausente o compuesto solo por espacios: muestra «[No disponible]» en el campo, «Código no disponible» en el área de identificación y bloquea impresión.
- Nombre o Categoría ausentes o compuestos solo por espacios: muestra «[No disponible]» y bloquea impresión.
- Costo cero se presenta como `$0.00`; nulo, indefinido o cadena vacía se presenta como «Sin especificar».
- Los campos de texto opcionales Marca, Modelo, Número de serie y Ubicación se consideran vacíos si faltan, están vacíos o contienen solo espacios (`trim() === ''`), y se presentan como «Sin especificar»; Notas bajo las mismas condiciones se presentan como «Sin observaciones».
- Las Notas se ajustan al ancho, crecen hasta 35 mm y, si exceden esa altura, conservan el inicio y finalizan en «...» sin reducir texto por debajo de 12 px.
- Los campos de texto distintos del Código y las Notas se limitan a tres líneas y usan «...» al excederlas; el Código legible se conserva completo.
- Un cambio del artículo o del nombre de Categoría desde otra pestaña no altera una vista previa abierta; al abrirla de nuevo aparecen los datos actuales.
- Cancelar la impresión mantiene el preview abierto y el foco en «Imprimir»; cerrar el preview devuelve el foco al disparador del detalle.
- Si el navegador no puede abrir o completar la impresión, la vista previa permanece con un aviso y permite reintentar o cerrar.
- Cambiar papel, orientación, escala o márgenes manualmente queda fuera de la garantía física definida.

## Fuera de alcance

- Firma digital, captura de firma en pantalla o canvas.
- Impresión masiva o de varios artículos en un documento.
- Modificación de datos del artículo desde la ficha.
- Guardado, exportación o transmisión remota de la ficha o de firmas.
- Truncar, reemplazar o codificar parcialmente el Código en el código de barras.
- Garantizar lectura universal en impresoras o lectores específicos.
- Garantizar la salida cuando se cambie manualmente la configuración de impresión cubierta por RF-7.

## Criterios de finalización

- Desde el detalle se abre primero la vista previa y solo «Imprimir» solicita la impresión; «Cerrar» y Escape cierran la vista previa con restauración de foco al disparador.
- Los códigos incompatibles o que excedan 180 mm, así como los datos obligatorios ausentes/vacíos, dejan la vista previa disponible, muestran avisos accesibles y bloquean la impresión.
- El código de barras respeta el ancho natural calculado, el módulo exacto de 0,25 mm, las zonas libres y la altura mínima; el texto legible no se trunca.
- La configuración cubierta produce una página Carta vertical a escala 100 %, márgenes de 15 mm, texto visible de al menos 12 px y ambas áreas de firma completas, juntas y de al menos 30 mm de alto.
- Los campos opcionales de texto vacíos o compuestos solo por espacios muestran su marcador acordado; Notas usa «Sin observaciones» y los demás «Sin especificar». Notas cortas y extensas respetan sus límites; los otros campos largos se limitan a tres líneas, sin cortar el Código legible.
- Cancelar la impresión conserva el preview y el foco en «Imprimir»; cerrar completamente el preview devuelve foco al disparador.
- Abrir, imprimir o cancelar no cambia artículos, categorías, movimientos o fechas y no envía solicitudes remotas.
- La implementación futura actualiza la documentación visual del proyecto, supera `npm run build` y se verifica con Chrome DevTools en escritorio y a 360 y 375 px; la consola queda sin errores ni advertencias.

## Dudas abiertas

Ninguna. Las decisiones de contenido, formatos, compatibilidad del código, dimensiones, límites de texto, accesibilidad, foco, cancelación y manejo de errores quedaron acordadas.
