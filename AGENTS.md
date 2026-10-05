# AGENTS.md — InventarioWeb Portfolio

InventarioWeb Portfolio es un registro web de control interno para consultar y mantener artículos y categorías. Se ejecuta sin login y guarda los datos localmente en el navegador.

## Stack y estructura

- React 19.3, TypeScript 5.9, Vite 8.3 y Node.js 22+.
- `src/App.tsx`: pantallas y diálogos; `src/types.ts`: modelos compartidos.
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

- Tests: `node --test

`npm run build` valida TypeScript y genera el bundle. No hay scripts de pruebas ni lint. No se requieren variables de entorno.

## Convenciones

- Componentes funcionales; dos espacios, comillas dobles, punto y coma y nombres camelCase.
- Texto visible, errores y comentarios breves en español. Reutiliza los tipos compartidos y sigue `.cursor/rules/inventory-app.mdc`; conserva accesibilidad, teclado y diseño adaptable.
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
- El detalle local, de solo lectura, abre en menos de 100 ms y muestra acción, nombre, código y hora; altas/bajas muestran ficha y ediciones solo cambios. Usa `role="dialog"`, `aria-modal`, `aria-labelledby` y el cierre con `aria-label="Cerrar detalle de movimiento"`; enfoca el cierre, contiene Tab/Mayús+Tab, cierra con Escape y restaura el foco. El contenido largo desplaza internamente y se apila a 360–375 px. No describir el historial como inviolable ni sincronizado.
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

## Forma de trabajar

Planifica cambios que afecten persistencia o varias pantallas. Mantén el alcance acotado y actualiza `docs/figma-brief.md` ante cambios de interfaz. Al terminar, resume los archivos modificados y cómo verificaste el cambio.

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

## Límites

- ✅ Siempre: conserva la persistencia local con IndexedDB y las versiones fijadas; ejecuta el build después de cambios de código.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
- ✅ Siempre: al terminar cambios, genera el commit en inglés usando estrictamente `<type>(<scope>): <subject>` (<50 chars) y un cuerpo con `<description>` (<100 chars, verbo en presente simple/imperativo respondiendo por qué y cómo; tipos: fix, feat, test, refactor, revert, build, chore).
- ⚠️ Pregunta antes: añadir dependencias o archivos, o cambiar el formato persistido y sus migraciones.
- 🚫 Nunca: edites la app WPF, expongas claves, conectes o apliques recursos Supabase desde Portfolio, ni incorpores autenticación o cuentas a esta versión.

## Verificación

- Ejecuta `npm run build`. Si cambia el arranque o la persistencia, comprueba que `npm run dev` abra sin variables de entorno y que los datos sobrevivan una recarga. No hay scripts de pruebas ni lint configurados.
- Despues de cada cambio, verifica con el MCP de Chrome DevTools: abre la web, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
