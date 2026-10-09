# Plan técnico — Extensión de Ajustes y mantenimiento local (spec 005)

**Estado: pendiente de aprobación**

La base de la funcionalidad (tareas T01–T10) ya está implementada y se conserva como historial completado. Este plan incorpora el alcance aprobado que falta: moneda y tasas, formatos de fecha/hora, tamaño global de página, visibilidad de Valor registrado, agrupación completa de Ajustes y vaciado local confirmado. La implementación seguirá sin añadir dependencias ni servicios remotos.

## 1. Archivos y responsabilidades

- **src/types.ts:** ampliar AppPreferences con showRegisteredValue, displayCurrency, crcPerUsd, eurPerUsd, tablePageSize, dateFormat y timeFormat; conservar theme, language, los dos gráficos y tableDensity.
- **src/lib/preferencesRepository.ts:** ampliar defaults y normalización por campo para el objeto completo. Validar moneda, tasas positivas y finitas, tamaños permitidos y formatos; una preferencia inválida vuelve a su default sin descartar otras válidas.
- **src/i18n.ts:** centralizar formato de moneda y fecha/hora con locale activo; mantener los importes de captura y auditoría en USD y los textos localizados existentes. Las tasas iniciales tendrán fuente y fecha registradas y se mantendrán locales.
- **src/App.tsx:** agrupar los controles de Ajustes; conectar las tres opciones independientes de visibilidad del Resumen, edición de tasas, formatos, paginación y diálogo de vaciado. Aplicar conversión y formatos en los lugares de presentación existentes.
- **src/lib/inventoryRepository.ts:** ofrecer el vaciado del snapshot local en una transacción IndexedDB y proteger escrituras antiguas con una revisión/generación del snapshot. Publicar la invalidación del inventario para las pestañas abiertas y descartar mutaciones iniciadas con una revisión previa.
- **src/data/demo.ts:** eliminar las dos copias legacy durante el vaciado confirmado y permitir reintentar la limpieza si falla. El snapshot vacío ya guardado debe impedir que el arranque vuelva a cargar muestras.
- **src/styles.css:** diseñar los cuatro grupos, controles de tasas y formatos, estado de guardado/error, diálogo destructivo y reflujo móvil; conservar el piso de 12 px y estilos de impresión existentes.
- **docs/figma-brief.md:** documentar grupos, preferencias, paginación, visibilidad del KPI y flujo/estados del vaciado.
- **AGENTS.md y MEMORY.md:** el coordinador incorporará las reglas de dominio, preferencias y borrado confirmados durante el cierre documental.

No se requiere cambiar los campos de artículo ni los formatos de los movimientos; no se crearán archivos o dependencias nuevos.

## 2. Modelo de preferencias y persistencia

El contrato final AppPreferences conservará los campos actuales y añadirá:

- showRegisteredValue: boolean, default true.
- displayCurrency: USD, CRC o EUR, default USD.
- crcPerUsd y eurPerUsd: tasas numéricas finitas mayores que cero; defaults de referencia capturados durante la implementación, con fuente y fecha visibles.
- tablePageSize: 10, 15, 25, 50 o all, default 25.
- dateFormat: dmy o iso, que representan DD/MM/AAAA y AAAA-MM-DD; default dmy.
- timeFormat: 12h o 24h; default 12h.

El idioma conserva su preferencia y fallback de la spec 006. Todos los campos se guardarán en el registro local de preferencias existente. La normalización será independiente por campo; tasas inválidas usarán su referencia inicial, sin resetear los demás campos. El restablecimiento vuelve a los valores iniciales completos y no toca el inventario.

Los costos de artículos y movimientos siguen siendo USD. El vaciado conserva el mismo almacén y formato de snapshot: reemplaza artículos, categorías y movimientos por arreglos vacíos y no crea object stores ni modifica artículos históricos. El envoltorio del snapshot puede incorporar una revisión opcional de forma aditiva para distinguir operaciones de generaciones previas; registros existentes sin esa propiedad se leen como generación inicial. Las claves legacy se eliminan solo después de guardar correctamente el snapshot vacío.

## 3. Lógica pura y transacciones

- Normalizar cada preferencia por separado, incluido displayCurrency, las dos tasas, tablePageSize, dateFormat y timeFormat.
- Para artículos individuales, convertir costo USD por la tasa elegida. Para Valor registrado, sumar primero costos no nulos en USD, multiplicar el total una vez por la tasa y redondear solo al formato final de dos decimales.
- USD conserva $1,234.56 en ambos idiomas. CRC y EUR presentan los símbolos ₡ y € con separadores, posición y espacio determinados por es-CR/en-US. El cero se presenta como $0.00 en USD y cero en CRC/EUR; costo ausente continúa como «Sin especificar».
- Formatear fecha/hora en la zona local sin alterar el timestamp. El formato corto visible del eje X no cambia; su nombre accesible incluye fecha completa configurada y hora si corresponde.
- Derivar las páginas usando el tamaño global y la lista ya filtrada. Cambio de filtro o tamaño lleva a página 1; si se reducen filas, limitar la página al último índice válido. «Ver todos» representa una página con todos los resultados. Ingresos recientes conserva cinco elementos.
- El vaciado incrementa la revisión del snapshot y guarda el estado vacío dentro de la transacción de escritura. Una mutación captura la revisión cargada; si intenta confirmarse contra otra revisión, se rechaza como obsoleta y no puede reinsertar datos. Una mutación anterior que se complete antes del vaciado queda sobrescrita por el snapshot vacío. Después del commit se notifica a las otras pestañas para que recarguen el snapshot y descarten formularios/borradores antiguos.
- El éxito solo se anuncia tras el commit vacío y la limpieza de las copias legacy. Si falla el commit, los datos anteriores permanecen y se puede reintentar o cancelar. Si falla la limpieza legacy, todas las pestañas siguen vacías, no se anuncia éxito y se ofrece reintentar la limpieza.

## 4. Interfaz, accesibilidad y responsive

Ajustes tendrá estos grupos y orden:

1. Preferencias de Interfaz: Idioma, Tema, Densidad de tablas y Registros por página.
2. Visualización del Resumen: Actividad reciente, Artículos por categoría y Valor registrado.
3. Moneda y formato: Moneda principal, tasas locales, Formato de fecha y Formato de hora.
4. Zona de peligro: Restablecer preferencias y Vaciar base de datos.

Los valores reflejarán el estado persistido y aplicarán cambios sin recarga. Una tasa inválida muestra error accesible y conserva activa la última tasa válida. Al ocultar Valor registrado solo desaparece ese KPI; los otros elementos se reacomodan sin huecos.

El diálogo de vaciado tendrá nombre accesible, foco inicial en la entrada de confirmación, trampa de foco para Tab/Mayús+Tab, Escape para cancelar y restauración de foco. Exige VACIAR o CLEAR según el idioma, comparando sin distinguir mayúsculas y tras recortar espacios externos. Los fallos se anuncian con role alert y dejan acciones de reintento/cancelación utilizables.

Tras confirmar el snapshot vacío, todas las pestañas abiertas reflejan vacío en menos de 100 ms desde el commit. Los borradores cargados anteriormente se descartan con aviso; las mutaciones con generación antigua se rechazan antes de persistirse. Los controles y avisos deben caber a 360–375 px, no bajar de 12 px y conservar foco visible.

## 5. Decisiones técnicas y alternativas descartadas

- Se amplía el registro local de preferencias actual en vez de crear un segundo perfil; así el restablecimiento abarca el conjunto completo.
- Se guardan tasas editables y costos canónicos USD; no se reescriben artículos, movimientos ni auditoría al cambiar la moneda.
- Se agrega la revisión al envoltorio del snapshot en lugar de una nueva store o migración de artículos. Las mutaciones obsoletas fallan explícitamente; no se vuelven a aplicar sobre el inventario vacío.
- Se notifica a pestañas únicamente al confirmar el vaciado; las preferencias continúan sin sincronización en vivo.
- Se guarda el snapshot vacío antes de retirar legacy; se evita borrar el historial si el commit falla y se evita resembrar demo tras recargar.
- «Ver todos» es un valor explícito de tablePageSize; no altera la lista fija de cinco ingresos recientes ni añade paginación al Resumen.
- La presentación de impresos sigue las preferencias de moneda y fecha/hora, pero conserva geometría, barcode, monocromía, una página Carta y piso tipográfico. Los valores iniciales conservan la salida previa.

## 6. Verificación y calidad

- Ejecutar npm run build al final de cada tarea de código; no añadir pruebas ni dependencias externas.
- Verificar la normalización independiente de campos antiguos, parciales e inválidos; tasas cero, negativas, no numéricas e infinitas; persistencia, reset y aviso ante errores de preferencias.
- Comprobar costos vacíos/cero/positivos, USD/CRC/EUR, tasas editadas y total agregado convertido una sola vez.
- Probar las ocho combinaciones de visibilidad del Resumen; los tamaños 10/15/25/50/Todos en las cuatro tablas; filtro, borrado, retorno a primera página y lista reciente fija de cinco.
- Probar las cuatro combinaciones de fecha/hora en pantalla, CSV existente de Artículos e impresos, con el mismo instante local y etiquetas compactas accesibles del gráfico.
- En Chrome DevTools, probar vaciado cancelado, confirmado, sin datos, falla de transacción, falla de legacy y reintento. Abrir dos pestañas, iniciar una escritura anterior y confirmar que ambas muestran vacío en menos de 100 ms desde el commit, borradores se descartan y los datos antiguos no reaparecen tras recargar.
- Revisar foco/trampa/Escape, alertas, errores, consola sin errores ni advertencias, reflujo 1440/375/360 px, texto mínimo 12 px y ausencia de overflow. Registrar resultados por función durante T11–T19 y hacer una comprobación integrada en T20.

## 7. Trazabilidad

| Parte del plan | Requisitos funcionales | Principios |
|---|---|---|
| Contrato y normalización de preferencias | RF-2, RF-3, RF-7, RF-9, RF-10, RF-13, RF-14 | 1, 3, 5, 6 |
| Conversión y formatos puros | RF-9, RF-13, RF-14 | 1, 3, 6 |
| Grupos de Ajustes, controles y resumen | RF-1, RF-2, RF-4, RF-5, RF-12 | 2, 4, 6 |
| Paginación de tablas | RF-10 | 2, 4 |
| Aplicación de moneda/fecha/hora a salidas | RF-6, RF-9, RF-13, RF-14 | 2, 4, 5, 6 |
| Vaciado, compatibilidad y revisión de operaciones | RF-8, RF-11, RF-15 | 3, 5 |
| Diálogo, reflujo y accesibilidad del vaciado | RF-11, RF-12, RF-15 | 2, 4, 6 |
| Build, DevTools y documentación | RF-1–RF-15 | 1, 2, 4, 5, 6 |

## Dependencias

- T01–T10 corresponden a la base ya completada. Las tareas nuevas T11–T20 cubren exclusivamente las ampliaciones aprobadas.
- La localización bilingüe de cambios nuevos se integra mediante las claves existentes y las tareas pendientes de la spec 006.
- No se abre una segunda base local ni se altera la semilla original de la primera instalación.
