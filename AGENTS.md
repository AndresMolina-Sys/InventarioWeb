# AGENTS.md — InventarioWeb Portfolio

InventarioWeb Portfolio es un registro web de control interno para consultar y mantener artículos y categorías. Se ejecuta sin login y guarda los datos localmente en el navegador.

## Stack y estructura

- React 19.3, TypeScript 5.9, Vite 8.3 y Node.js 22+.
- `src/App.tsx`: pantallas y diálogos; `src/types.ts`: modelos compartidos.
- `src/i18n.ts`: catálogos tipados, textos y formatos por idioma; `src/lib/preferencesRepository.ts`: preferencias locales.
- `src/lib/inventoryRepository.ts`: operaciones IndexedDB y validaciones; `src/data/demo.ts`: categorías, artículos de ejemplo y migración desde `localStorage`.
- `docs/figma-brief.md` y `.cursor/rules/inventory-app.mdc` describen diseño y convenciones.
- `supabase/` contiene archivos históricos no usados por Portfolio. No ejecutar su SQL ni conectar recursos remotos desde esta app.

## Comandos

```powershell
npm ci
npm run dev
npm run build
npm run preview
```

`npm run build` valida TypeScript y genera el bundle. No hay scripts de pruebas ni lint configurados. No se requieren variables de entorno.

## Convenciones

- Componentes funcionales; dos espacios, comillas dobles, punto y coma y nombres camelCase.
- Mantén los identificadores internos en inglés. La interfaz y los mensajes al usuario usan español o inglés según la preferencia local, con español inicial; escribe los comentarios breves del código en español. Centraliza textos y formatos en `src/i18n.ts`; sigue `.cursor/rules/inventory-app.mdc` y conserva accesibilidad, teclado y diseño adaptable.
- Mantén la persistencia en el repositorio y el contenido inicial en `src/data/demo.ts`.

## Reglas de dominio / trampas conocidas

- La primera base IndexedDB recibe 3 categorías y 15 artículos; no volver a sembrarlos después.
- Migra `inventario-web-demo-v2` y `inventario-web-demo-v1`; conserva artículos y categorías, `department` pasa a `location` y `price` a `cost`.
- Código y nombre de categoría no se duplican; el número de serie es único si se proporciona. No borrar categorías con artículos asociados.
- La fecha de ingreso se conserva al editar; `updatedAt` usa la hora del navegador en cada modificación.
- El Valor registrado suma los costos no nulos en USD (un registro equivale a un artículo); los costos faltantes se excluyen sin contador.
- Cada alta y baja exitosa, y cada edición con cambios netos auditables, crea un movimiento en la misma transacción IndexedDB; una edición sin cambios netos no persiste ni actualiza `updatedAt`; los cambios de categoría no cuentan por sí solos.
- Auditar Código, Nombre y Categoría como obligatorios; N.º de serie, Ubicación, Costo, Marca, Modelo y Notas como opcionales. Excluir SKU, identificadores, fechas técnicas y metadatos del movimiento. Comparar textos con `.trim()` y costos por valor numérico, considerando vacío/nulo y cero equivalentes.
- Los movimientos nuevos guardan la ficha completa del estado nuevo en altas y del estado previo en bajas; las ediciones guardan solo los valores anterior/posterior de campos auditados con cambios netos. El nombre de categoría representa su valor al momento del evento.
- Los eventos antiguos sin diff conservan solo los datos disponibles; mostrar «Dato no registrado» si falta un dato histórico y «Sin especificar» si un opcional estaba vacío. Nunca inferir el pasado desde el artículo actual.
- **Ciclo de vida de activos:** guardar los identificadores canónicos `available`, `assigned`, `maintenance` y `decommissioned`; mostrarlos como Disponible, Asignado, En mantenimiento y De baja. Las altas nuevas inician en Disponible y permiten elegir solo Disponible, Asignado o En mantenimiento. Ausente, `null`, vacío o espacios se resuelven como Disponible únicamente al presentar el registro; no escribir ese default al leer ni migrar. Conservar exactamente cualquier texto de estado explícito desconocido hasta una corrección elegida por la persona; permitir corregirlo directamente a cualquier estado canónico. Aplicar la matriz Disponible → Asignado/En mantenimiento/De baja; Asignado → Disponible/En mantenimiento/De baja; En mantenimiento → Disponible/De baja. De baja es terminal e inmutable: bloquear edición y borrado en repositorio y UI, pero mantener el artículo, su detalle, impresión e historial disponibles. El motivo de una transición se recorta y limita a 200 caracteres; es obligatorio para De baja (1–200 tras recortar), opcional para otros destinos y se conserva como `""` si queda vacío. Guardarlo como contexto fuera del diff; un cambio de motivo sin cambio de estado no produce movimiento. Los movimientos nuevos v2 incluyen estado en snapshots completos de alta/baja y un diff Estado Antes/Después más motivo separado cuando cambia el estado; conservar la lectura de eventos v1/históricos sin reescribirlos ni inferir datos, y mantener las normalizaciones existentes de los demás campos auditados.
- El detalle local, de solo lectura, abre en menos de 100 ms y muestra acción, nombre, código y hora; altas/bajas muestran ficha y ediciones solo cambios. Usa `role="dialog"`, `aria-modal`, `aria-labelledby` y el cierre con `aria-label="Cerrar detalle de movimiento"`; enfoca el cierre, contiene Tab/Mayús+Tab, cierra con Escape y restaura el foco. El contenido largo desplaza internamente y se apila a 360–375 px. No describir el historial como inviolable ni sincronizado.
- «Imprimir etiqueta» solo aparece en el detalle del artículo. La etiqueta horizontal mide 70 × 35 mm e incluye Código, Nombre, Categoría, Fecha de ingreso y un barcode Code 128-B generado localmente, sin conexión remota ni dependencia externa.
- El barcode codifica el Código completo y admite solo ASCII imprimible 32–126. Si contiene caracteres fuera de ese rango o el símbolo completo no cabe con módulos ≥0,25 mm, zonas libres de 10 módulos por lado y barras de ≥10 mm de alto, avisar y bloquear la impresión; nunca truncar el valor codificado ni ampliar la etiqueta. El texto visible puede truncarse con puntos suspensivos en dos líneas, y esa restricción no cambia la validación ni el guardado de Códigos.
- La vista previa y la impresión son de solo lectura: no persisten etiquetas ni cambian artículos, categorías, fechas o movimientos. La impresión aislada contiene solo la etiqueta; cancelar o no poder iniciar la solicitud deja la vista previa abierta.
- «Imprimir ficha técnica» aparece únicamente en el detalle del artículo y abre en menos de 100 ms una captura inmutable para una ficha Carta formal; solo el botón «Imprimir» solicita `window.print()`. Incluye Código, Nombre, Categoría, Marca, Modelo, N.º de serie, Ubicación, Costo, Fecha de ingreso, Notas y firmas manuscritas; excluye SKU. Código, Nombre y Categoría requieren contenido tras `trim()`; opcionales vacíos muestran «Sin especificar», Notas vacías «Sin observaciones», costo cero «$0.00» y costo ausente «Sin especificar». Si falta Código, mostrar «[No disponible]» y «Código no disponible» en el espacio del barcode. No escribe en IndexedDB, transmite datos ni añade dependencias.
- El diálogo usa `role="dialog"`, `aria-modal` y `aria-labelledby`; enfoca «Cerrar» al abrir. Tab/Mayús+Tab alternan entre Cerrar e Imprimir cuando este está habilitado, y se confinan en Cerrar cuando está deshabilitado. Escape cierra y restaura el foco al disparador. Cancelar la impresión conserva el modal y devuelve el foco a «Imprimir»; un error accesible permite reintentar o cerrar.
- La ficha técnica imprime una sola página Carta vertical en escala de grises, bajo la garantía estándar de escala 100 % y márgenes de 15 mm; cambios manuales de papel, orientación, escala o márgenes quedan fuera de garantía. El contenido mide hasta 180 mm. El barcode conserva el Código legible completo, admite ASCII imprimible 32–126 y se bloquea si no cabe con módulos de 0,25 mm, zonas libres de 10 módulos por lado y barras de al menos 10 mm; ancho natural `(11N + 55) × 0,25 mm`, guía estética 120 mm. Código sigue guardándose aunque no sea compatible. Texto visible mínimo 12 px; campos largos se limitan a tres líneas y Notas hasta 35 mm con truncado, preservando firmas juntas de al menos 30 mm en una página.
- Al evolucionar el historial local, preservar todos los artículos, categorías y movimientos existentes; no reconstruir ni inventar diffs históricos.
- Actividad reciente cuenta movimientos por día local durante los últimos siete días y conserva el historial completo en IndexedDB.
- La sección Movimientos ordena el historial por fecha descendente, filtra altas/ediciones/bajas y pagina 25 filas; eventos antiguos sin instantánea muestran su acción y fecha con un aviso de datos no asociados.
- La cabecera de Movimientos comparte con las tablas la escala de título 16 px/700 y el contador 13 px; en escritorio muestra la etiqueta del filtro junto al selector y en móvil los apila con el selector a ancho completo.
- La etiqueta «CONTROL INTERNO» usa el estilo y color compartidos de `.eyebrow`; evita sobrescribir su tono solo en Movimientos.
- Ningún texto visible baja de 12 px: metadatos, ejes, navegación, badges y etiquetas usan 12 px como mínimo; descripciones, pies KPI, controles y paginación usan 13 px. Mantén los textos largos envolviendo y verifica que los breakpoints no reduzcan la escala.
- En Resumen, Categorías se muestra sin cero inicial; Valor registrado conserva el tamaño de `.stat-value` (24 px escritorio y 20 px móvil), usa formato compacto si el valor USD completo supera 10 caracteres y mantiene el importe exacto accesible.
- En la jerarquía del Resumen, los rótulos KPI usan 13 px/600/1.3 en escritorio y móvil; en móvil el texto largo puede envolverse y el icono conserva su espacio. Títulos de panel y tarjetas de registro usan 16 px/700/1.25, sus conteos 13 px/400/1.4; los títulos de página se mantienen en 26 px escritorio y 22 px móvil.
- Ingresos recientes ordena por `createdAt` descendente y pagina cinco artículos; presenta flechas desde seis artículos, deshabilita los límites y reinicia la página cuando cambia la lista.
- Las tablas de Artículos, Categorías, Movimientos y detalle de categoría comparten `.product-table`: nombres 14 px/600, celdas 13 px, metadatos 12 px, encabezados 12 px/700; celdas 8 × 13 px, filas 68 px, iniciales 32 × 32 px y botones de acción 29 px con iconos de 16 px. Nombres largos se envuelven; cada tabla conserva sus anchos y scroll móvil.
- En escritorio, Actividad reciente y Ingresos recientes comparten la fila superior; Artículos por categoría ocupa la fila inferior completa y usa una columna vertical con filas de ancho completo, nombre a la izquierda, barra debajo y cantidad a la derecha. Mantén 14 px de espacio vertical uniforme. En móvil el orden es Actividad, Ingresos y Categorías.
- Artículos por categoría ofrece `%` por defecto (conteo/total de artículos), con anchuras exactas y etiquetas de hasta un decimal; `#` conserva barras relativas a la categoría más numerosa y muestra el conteo. Total cero produce `0%` y barra vacía.
- El gráfico del Resumen usa ticks enteros: si el máximo es 3 o menor, presenta cada entero hasta cero; con máximos mayores presenta máximo, entero medio y cero. Las guías y números Y comparten la posición proporcional `(máximo − tick) / máximo` y quedan centrados; eje Y mantiene fuente mínima de 12 px. Las barras miden 18–32 px, centradas bajo sus etiquetas y con radio de 7 px; cada barra muestra encima su conteo diario, incluso `0` en días sin movimientos, con fuente mínima de 12 px. Las marcas para días en cero miden 3 px y las etiquetas `S/D/L/M/X/J/V` usan `X` para miércoles.
- En escritorio, el área del gráfico se expande y ancla su leyenda al fondo; en móvil mide 130 px y deja la leyenda debajo.
- Los datos pertenecen al perfil local del navegador y no se sincronizan entre equipos. Portfolio no tiene usuarios ni autenticación.
- **Ajustes y localización (specs 005–006):** guarda `theme`, `language`, visibilidad de Actividad reciente, Artículos por categoría y Valor registrado, `tableDensity`, moneda, tasas CRC/EUR por USD, `tablePageSize`, `dateFormat` y `timeFormat` en `localStorage` bajo `inventarioweb:preferences:v1`, separado de IndexedDB. Defaults: Sistema, español, los tres elementos del Resumen visibles, densidad Cómoda, USD, tasas locales de referencia, 25 filas, DD/MM/AAAA y 12 horas. Normaliza cada campo independientemente. Restablecer requiere confirmación y restaura todos esos valores sin modificar el inventario.
- Los Ajustes se agrupan en Preferencias de Interfaz, Visualización del Resumen, Moneda y formato y Zona de peligro. `system` sigue `prefers-color-scheme`; `light`/`dark` cubren shell, tablas, controles, formularios y diálogos. Gráficos y Valor registrado se pueden ocultar independientemente. Las tablas usan 68/56 px de altura base cómoda/compacta; Artículos, Categorías, Movimientos y detalle de categoría aceptan 10/15/25/50/Ver todos, mientras Ingresos recientes conserva cinco elementos.
- Los costos persistidos siguen en USD; CRC/EUR solo cambian la presentación con tasas locales positivas y finitas. El total de Valor registrado se suma en USD y se convierte una sola vez. Fechas usan DD/MM/AAAA o ISO y reloj de 12/24 h en pantalla, CSV existente de Artículos e impresos, sin alterar instantes. USD conserva `$1,234.56` en ambos idiomas; los datos escritos por la persona no se traducen. Solo se localiza el CSV existente de Artículos. La impresión sigue monocromática. Texto normal mantiene contraste ≥4.5:1, controles/foco ≥3:1 y foco visible; ningún texto visible baja de 12 px.
- Vaciar base de datos es el único flujo de Ajustes que elimina inventario: requiere la palabra localizada `VACIAR`/`CLEAR`; cancelar no modifica datos. La confirmación elimina artículos, categorías, movimientos y copias heredadas, conserva las preferencias y persiste el inventario vacío para no resembrar muestras. Tras el commit, las pestañas descartan datos y borradores obsoletos en menos de 100 ms; no se anuncia éxito si falla una etapa y se permite reintentar.

## Forma de trabajar

Planifica cambios que afecten persistencia o varias pantallas. Mantén el alcance acotado y actualiza `docs/figma-brief.md` ante cambios de interfaz. Al terminar, resume los archivos modificados y cómo verificaste el cambio.

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

## Límites

- ✅ Siempre: conserva la persistencia local con IndexedDB y las versiones fijadas; ejecuta el build después de cambios de código.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
- ✅ Siempre: al terminar cambios, genera el commit en inglés usando estrictamente `<type>(<scope>): <subject>` (<50 chars) y un cuerpo con `<description>` (<100 chars, verbo en presente simple/imperativo respondiendo por qué y cómo; tipos: fix, feat, test, refactor, revert, build, chore).
- ⚠️ Pregunta antes: añadir dependencias o archivos, o cambiar el formato persistido y sus migraciones.
- 🚫 Nunca: agregues líneas de 'Co-authored-by' o atribución en los commits, edites la app WPF, expongas claves, conectes o apliques recursos Supabase desde Portfolio, ni incorpores autenticación o cuentas a esta versión.

## Verificación

- Ejecuta `npm run build`. Si cambia el arranque o la persistencia, comprueba que `npm run dev` abra sin variables de entorno y que los datos sobrevivan una recarga. No hay scripts de pruebas ni lint configurados.
- Despues de cada cambio, verifica con el MCP de Chrome DevTools: abre la web, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
