# Especificación: localización bilingüe de InventarioWeb

**Estado: aprobada**

## Contexto y objetivo

Esta funcionalidad depende de que la spec 005 incorpore Ajustes y preferencias locales. Añade Español/English y localización integral; la moneda, sus tasas, tamaño de página, formatos de fecha y hora, visibilidad del resumen y vaciado local se definen allí. Así, cada persona podrá usar la aplicación en su idioma preferido sin traducir ni alterar la información del inventario.

## Usuarios

- Personas que consultan y mantienen el inventario local.
- Reclutadores y visitantes que prueban InventarioWeb Portfolio.

## Historias de usuario

- Como persona usuaria, quiero elegir español o inglés para entender la interfaz y sus mensajes.
- Como persona usuaria, quiero conservar mis datos tal como los registré aunque cambie el idioma.
- Como persona usuaria, quiero que los formatos de fechas y cantidades correspondan al idioma seleccionado.

## Definiciones

- **Español:** interfaz en español y formatos regionales `es-CR`.
- **English:** interfaz en inglés y formatos regionales `en-US`.
- **Texto generado por la aplicación:** rótulos, mensajes, descripciones y nombres accesibles creados por el sistema, separados del contenido registrado por la persona.
- **Datos de usuario:** valores del inventario y del historial, incluidos nombres, notas, códigos, nombres de categorías y valores persistidos de estado.
- **Costo canónico:** valor numérico almacenado en USD para un artículo y para sus movimientos de auditoría. La moneda seleccionada en Ajustes afecta la presentación, no el dato persistido.

## Requisitos funcionales

- **RF-1 — Selector de idioma:** CUANDO la sección Ajustes de la spec 005 esté disponible, ENTONCES el sistema DEBE ofrecer un control accesible para elegir «Español» o «English». En un perfil sin una preferencia de idioma válida, el sistema DEBE iniciar en español.
- **RF-2 — Preferencia local y compatibilidad:** CUANDO se guarde la preferencia de idioma, ENTONCES el sistema DEBE conservarla en el mismo perfil local y con las reglas de persistencia, restablecimiento y fallos ya definidas para las preferencias de la spec 005. SI `language` está ausente o contiene un valor no admitido, ENTONCES el sistema DEBE usar español y conservar las demás preferencias válidas, incluidas moneda y tasas, tamaño de página, formatos de fecha y hora y visibilidad de los tres elementos del Resumen. SI el almacenamiento local de preferencias no está disponible, ENTONCES el idioma elegido DEBE aplicarse durante la sesión y el sistema DEBE presentar el aviso accesible establecido para fallos de persistencia. Las preferencias NO DEBEN escribirse en IndexedDB.
- **RF-3 — Localización de la interfaz:** CUANDO cambie el idioma, ENTONCES el sistema DEBE actualizar de inmediato todo texto generado por la aplicación en navegación, páginas, títulos, grupos de Ajustes, encabezados, controles, filtros, acciones, formularios, instrucciones, validaciones, errores, avisos, tooltips, estados vacíos, indicadores, gráficos y nombres o descripciones accesibles. Esto incluye los nombres de las secciones «Preferencias de Interfaz», «Visualización del Resumen», «Moneda y formato» y «Zona de peligro», y las palabras de confirmación `VACIAR`/`CLEAR`. También incluye textos para datos opcionales sin valor como «Sin especificar» y «Sin observaciones». Los controles de teclado y sus instrucciones DEBEN conservar su función. Los estados canónicos DEBEN mostrarse traducidos; el rótulo genérico «Desconocido» DEBE localizarse, pero el valor original de un estado no canónico DEBE permanecer sin traducir.
- **RF-4 — Formatos regionales, fecha/hora y moneda:** CUANDO el idioma activo sea español, ENTONCES los números generales DEBEN usar las convenciones `es-CR`; CUANDO sea English, DEBEN usar `en-US`. La preferencia `dateFormat` de la spec 005 DEBE determinar las fechas completas como `DD/MM/AAAA` o `AAAA-MM-DD`, y `timeFormat` DEBE determinar el reloj de 12 o 24 horas. El formato 12 horas DEBE usar el indicador de meridiano del idioma activo. Estas preferencias DEBEN aplicarse a pantallas, CSV existente de Artículos y documentos impresos, usando la zona horaria local del navegador. Cambiar formato o idioma NO DEBE cambiar el instante ni el dato de fecha subyacente. CUANDO la moneda de visualización sea USD, ENTONCES los costos DEBEN presentarse con dos decimales y el formato fijo `$1,234.56` en ambos idiomas. CUANDO sea CRC o EUR, ENTONCES el sistema DEBE convertir desde el costo canónico USD usando las tasas locales válidas de Ajustes y presentar dos decimales con el símbolo y formato regional del idioma activo. Para 1,234.56 USD, la presentación USD DEBE ser `$1,234.56` tanto en español como en inglés. Las tasas y conversiones NO DEBEN consultar servicios externos ni modificar costos almacenados. Los formularios de creación y edición DEBEN indicar que el costo se captura en USD.
- **RF-5 — CSV existente de Artículos:** CUANDO se exporten los artículos mediante la opción CSV existente, ENTONCES el sistema DEBE localizar sus encabezados y presentar la fecha y hora de ingreso de acuerdo con `dateFormat`, `timeFormat`, el idioma activo y la zona horaria local. DEBE conservar las tres columnas existentes, su orden, filas y valores de artículo distintos de la representación de fecha/hora. La conversión de moneda NO DEBE modificar ningún valor CSV. Esta funcionalidad NO DEBE agregar exportaciones para Categorías o Movimientos.
- **RF-6 — Documentos impresos:** CUANDO se previsualice o imprima una etiqueta o ficha técnica, ENTONCES el sistema DEBE localizar rótulos, ayudas, instrucciones y avisos generados por la aplicación, incluidos «Sin especificar», «Sin observaciones» y mensajes de impresión. El contenido del código de barras DEBE permanecer idéntico. Los costos DEBEN seguir la moneda y las tasas locales de Ajustes conforme a RF-4, sin modificar datos subyacentes; las fechas y horas visibles DEBEN seguir los formatos de Ajustes y conservar sus instantes. La etiqueta DEBE conservar el tamaño físico de 70 × 35 mm y la ficha técnica DEBE caber en una sola página Carta, respetando límites de impresión y legibilidad. Si los textos localizados de una etiqueta no caben dentro de sus límites, el sistema DEBE comunicarlo y bloquear la impresión. La salida DEBE seguir monocromática.
- **RF-7 — Integridad del inventario:** CUANDO se cambie o restablezca idioma, moneda, tasa o formato de fecha/hora, ENTONCES el sistema NO DEBE traducir, normalizar, sobrescribir ni eliminar datos del inventario o historial, incluidos nombres, notas, códigos, categorías, costos canónicos USD, timestamps y estados conocidos o no canónicos. El vaciado integral confirmado se rige exclusivamente por la spec 005 y NO forma parte de la localización.
- **RF-8 — Restablecimiento:** CUANDO se confirme el restablecimiento de preferencias definido por la spec 005, ENTONCES idioma DEBE volver a español, moneda a USD, tasas a sus valores de referencia iniciales, tamaño de página a 25, formato de fecha a `DD/MM/AAAA` y hora a 12 horas, junto con los demás valores iniciales definidos allí. SI el restablecimiento se cancela, ENTONCES todas las preferencias DEBEN permanecer sin cambios. Restablecer preferencias NO DEBE vaciar el inventario.

- **RF-9 — Presentación monetaria y etiquetas accesibles de fecha:** CUANDO se seleccione una moneda, ENTONCES su control DEBE mostrar exactamente «$ USD», «₡ CRC» y «€ EUR». USD DEBE conservar «$1,234.56» en ambos idiomas. CRC/EUR DEBEN mostrar los símbolos «₡»/«€», separadores, posición y espacio del símbolo determinados por el locale activo (`es-CR` o `en-US`) y dos decimales; cero DEBE mostrarse como «$0.00» en USD y como cero con el símbolo seleccionado en CRC/EUR. «Valor registrado» DEBE sumar los costos USD no nulos sin redondeo intermedio, convertir una sola vez el total con la tasa elegida y redondear a dos decimales solo al presentarlo; los importes individuales se convierten por separado. Las etiquetas compactas del eje X DEBEN conservar su formato visual existente, como «S 26», mientras su nombre accesible DEBE comunicar la fecha completa usando el formato de fecha elegido y la hora usando el formato de hora cuando corresponda.
- **RF-10 — Precedencia de los formatos en impresos:** CUANDO una preferencia de moneda, fecha u hora cambie la representación de una etiqueta o ficha técnica, ENTONCES los formatos seleccionados DEBEN prevalecer sobre las presentaciones predeterminadas documentadas previamente. Esta precedencia afecta solo los textos e importes presentados: DEBE mantener el mismo instante y costo USD subyacentes, el barcode, las dimensiones de 70 × 35 mm, los límites físicos de la etiqueta, la ficha de una página Carta, la salida monocromática y el piso tipográfico de 12 px. Con las preferencias iniciales USD y `DD/MM/AAAA`, DEBEN conservarse las presentaciones previas correspondientes.

## Requisitos no funcionales

- **Accesibilidad:** El selector, sus opciones, el estado seleccionado y cualquier aviso DEBEN tener nombres comprensibles en el idioma activo, operar con teclado y mostrar foco visible.
- **Idioma para tecnologías de asistencia:** El sistema DEBE identificar semánticamente ante tecnologías de asistencia el idioma activo de la interfaz y del contenido generado, de modo que su pronunciación e interpretación correspondan al idioma seleccionado. Cambiar el idioma DEBE actualizar esa identificación sin recargar la aplicación; los datos de usuario DEBEN conservarse intactos.
- **Legibilidad:** Ningún texto visible DEBE ser inferior a 12 px en ninguno de los idiomas. La localización NO DEBE depender únicamente del color para comunicar estados.
- **Diseño adaptable:** La pantalla Ajustes y las vistas localizadas DEBEN funcionar a 360 px y 375 px. Las cadenas inglesas más largas DEBEN envolverse o acotarse visualmente conforme a las reglas vigentes de cada interfaz, sin desbordamiento horizontal ni modificación de los datos subyacentes.
- **Respuesta local:** El cambio de idioma DEBE reflejarse en las superficies visibles en menos de 100 ms desde la selección, sin requerir recarga ni conexión a Internet.
- **Independencia:** La funcionalidad NO DEBE añadir dependencias, cuentas, servicios remotos ni sincronización externa, ni modificar las stores o registros de IndexedDB.
- **Documentación y verificación:** La entrega DEBE actualizar el brief visual, las instrucciones del proyecto y la memoria local. El principio 6 de la Constitución DEBE adoptar exactamente el texto aprobado: «Idioma: Mantén los identificadores internos en inglés (`camelCase`/`PascalCase`); ofrece la interfaz y los mensajes al usuario en español o inglés según la preferencia local, con español como valor inicial. Escribe los comentarios breves del código en español.» La verificación DEBE incluir `npm run build` y Chrome DevTools en escritorio a 1440 px y en móvil a 375 px y 360 px; la consola DEBE quedar sin errores ni advertencias.

## Casos límite

- Si las preferencias de la spec 005 no contienen `language`, o contienen un idioma no admitido, se utilizará español sin perder tema, visibilidad de gráficos ni densidad válidos.
- Si falla el guardado, el idioma elegido seguirá activo hasta cerrar o recargar la sesión y se mostrará el aviso de persistencia; el inventario no se alterará.
- Cambiar de idioma con el inventario abierto no modifica nombres, notas, códigos, categorías ni valores almacenados de estado. El rótulo canónico de la interfaz puede cambiar de idioma; el valor original de un estado desconocido se mantiene intacto. En CSV se conserva el valor persistido del estado, aunque en pantalla se traduzca la etiqueta canónica.
- Las fechas y horas completas de pantalla, CSV existente de Artículos e impresión usan la zona horaria local y las opciones elegidas `DD/MM/AAAA` o `AAAA-MM-DD`, y 12 o 24 horas. Cambiar idioma puede cambiar el indicador de meridiano, pero nunca el instante. El CSV conserva sus tres columnas y valores de usuario fuera de la representación de fecha/hora; no incluye nuevos campos ni costos.
- El idioma activo determina los rótulos, ayudas e instrucciones impresos, pero no altera el aspecto monocromático ni los datos subyacentes impresos o el código de barras. Los costos impresos reflejan solo la moneda de visualización y las tasas locales elegidas; no reescriben el valor USD. La representación visible de una fecha sí puede localizarse, manteniendo el mismo instante subyacente. Los textos generados para datos vacíos también se localizan; esto no cambia el valor almacenado.
- Cambiar idioma no cambia el formato elegido de moneda ni sus tasas. Los importes USD, CRC y EUR mantienen dos decimales; CRC/EUR usan los formatos regionales del idioma activo.
- Cambiar idioma no cambia las preferencias `dateFormat` y `timeFormat`; solo localiza textos e indicador de meridiano. Las cuatro combinaciones de fecha/hora son válidas en español e inglés.
- El diálogo de vaciado muestra `VACIAR` en español y `CLEAR` en inglés. El idioma cambia el texto exigido, no el alcance destructivo ni las preferencias que se conservan.
- La etiqueta mantiene sus dimensiones de 70 × 35 mm y la ficha técnica permanece en una sola página Carta con las reglas de impresión existentes. Si una etiqueta no puede mostrar sus textos localizados dentro de esos límites sin infringir sus reglas, la aplicación avisa y bloquea su impresión conforme a esas reglas.
- Una cadena larga en inglés puede ocupar varias líneas o acotarse visualmente según las reglas vigentes de la superficie en Ajustes, formularios, tablas, diálogos, exportaciones o documentos; nunca debe reducirse por debajo de 12 px ni provocar desbordamiento horizontal de página en 360–375 px, y su presentación no debe modificar el dato original.

- Las etiquetas visibles del eje X conservan el formato compacto existente (por ejemplo, «S 26»); el nombre accesible comunica la fecha completa según la preferencia elegida y la hora según `timeFormat` cuando corresponda.
- El formato visual elegido para costos y fechas/horas en impresión prevalece sobre los formatos predeterminados anteriores, pero no cambia los datos originales, el barcode, las dimensiones de etiqueta, la página única Carta, los límites físicos, la monocromía ni el mínimo tipográfico. Los valores iniciales USD y `DD/MM/AAAA` conservan las presentaciones previas correspondientes.
- «Valor registrado» suma todos los costos no nulos en USD sin redondeo intermedio, convierte una sola vez el total y redondea la presentación a dos decimales; la conversión de importes de artículos individuales se realiza por cada importe.

## Fuera de alcance

- Otros idiomas o selección automática a partir del idioma del navegador o sistema operativo.
- Traducción automática o edición de nombres, notas, códigos, datos de categorías y otros valores introducidos por la persona.
- Cambios en el contenido del inventario, identificadores almacenados, movimientos o formato persistido en IndexedDB.
- Sincronización del idioma entre pestañas, perfiles de navegador, equipos o servicios externos.
- Cambios de tema, visibilidad de gráficos y Valor registrado, densidad, moneda, tasas, tamaño de página, formatos de fecha/hora, vaciado de datos o comportamiento general de restablecimiento que pertenecen a la spec 005.

## Criterios de finalización

- Ajustes permite elegir Español o English; la opción inicial y el fallback ante ausencia o invalidez son Español, preservando otras preferencias válidas.
- La selección persiste conforme a las reglas locales de la spec 005; ante bloqueo de escritura, queda activa durante la sesión y se anuncia el fallo.
- Navegación, páginas, controles, mensajes, estados canónicos, estados vacíos, gráficos, etiquetas accesibles, CSV y documentos impresos presentan todos los textos generados por la aplicación en el idioma activo.
- Números generales usan `es-CR` o `en-US`; fechas y horas completas usan las preferencias elegidas, en zona local y sin alterar sus instantes. USD usa `$1,234.56` en ambos idiomas; CRC/EUR convierten desde el costo canónico mediante tasas locales y dos decimales. El CSV existente de Artículos localiza encabezados y fecha/hora, conserva sus tres columnas y los demás valores de usuario; no incorpora conversiones ni exportaciones nuevas.
- Cambiar idioma o moneda, editar tasas o restablecer preferencias conserva exactamente artículos, categorías y movimientos en IndexedDB; estados desconocidos y demás datos ingresados no se traducen ni modifican. La conversión es solo de presentación. En impresión, los datos subyacentes y barcodes permanecen idénticos; los costos impresos siguen la moneda seleccionada y las fechas pueden cambiar solo su representación regional, preservando el mismo instante. La salida permanece monocromática.
- Los cuatro formatos de fecha/hora se verifican en español e inglés para pantalla, CSV existente e impresión; cambiar cualquiera no altera timestamps. El eje X conserva su etiqueta compacta y expone la fecha completa según el formato elegido. Los controles de idioma y confirmación de vaciado se presentan traducidos, incluida la palabra requerida.
- Las etiquetas impresas siguen midiendo 70 × 35 mm y la ficha técnica cabe en una sola página Carta. Los textos localizados no infringen límites existentes de legibilidad o impresión; si una etiqueta no puede cumplirlos, el sistema comunica el problema y bloquea la impresión conforme a sus reglas vigentes.
- El texto visible conserva un mínimo de 12 px, los controles son accesibles por teclado y las cadenas largas no desbordan la página a 360 px ni 375 px.
- El cambio de idioma se refleja en menos de 100 ms sin recargar la aplicación.
- Las tecnologías de asistencia identifican el idioma activo de la interfaz y el contenido generado, y lo interpretan con pronunciación acorde; el cambio de idioma actualiza esa identificación.
- `npm run build` finaliza correctamente. Chrome DevTools verifica escritorio de 1440 px y móvil de 375 px y 360 px, todos los grupos de interfaz, formatos, CSV, impresión, preservación de IndexedDB, consola sin errores ni advertencias y ausencia de desbordamiento horizontal.
- El brief visual, las instrucciones, la memoria local y el principio 6 de la Constitución quedan actualizados conforme a esta especificación.
- Las monedas se presentan como `$ USD`, `₡ CRC` y `€ EUR`; las conversiones y el total de Valor registrado se redondean solo en la presentación, de acuerdo con RF-9. La moneda y formatos de fecha/hora elegidos prevalecen en impresos sin alterar geometría, barcode o requisitos de una página.
- La confirmación de vaciado conserva el inventario y permite reintentar ante error; el comportamiento inmediatamente visible en otras pestañas y la invalidación de borradores cumplen la spec 005.

## Dudas abiertas

Ninguna. El idioma inicial, los locales, el formato USD, el alcance de las cadenas, la preservación de datos, la compatibilidad de preferencias y los casos de exportación e impresión están definidos.
