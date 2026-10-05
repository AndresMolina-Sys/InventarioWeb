# InventarioWeb — design handoff

## Intención del producto

Registro interno de artículos para consultar qué activos existen, dónde se clasifican y cuándo ingresaron. La interfaz usa español y evita conceptos de venta o seguimiento de existencias.

## Pantallas

### 01 · Resumen — escritorio (1440 × 1024)

- Navegación fija a la izquierda, barra superior y área de contenido adaptable.
- Saludo, fecha actual y accesos a Artículos y Categorías.
- Tarjetas para Artículos registrados, Categorías y Valor registrado.
- El Valor registrado suma los costos informados en USD; cada artículo cuenta como un registro.
- La cifra conserva el tamaño tipográfico de las métricas; si el valor completo supera 10 caracteres se muestra en formato compacto, con el importe exacto disponible de forma accesible.
- En móvil, las tarjetas de conteo comparten dos columnas y Valor registrado ocupa una fila completa.
- En escritorio, Actividad reciente ocupa la columna superior izquierda junto a Ingresos recientes; Artículos por categoría ocupa la fila inferior completa con una lista vertical de una columna y altura según sus filas. Cada fila usa todo el ancho, con nombre a la izquierda, barra debajo y cantidad alineada a la derecha.
- En móvil, los paneles se apilan en este orden: Actividad reciente, Ingresos recientes y Artículos por categoría.
- El panel Artículos por categoría tiene un conmutador [% | #] junto al icono. Inicia en porcentaje, con barras según la proporción sobre todos los artículos y etiquetas con hasta un decimal; el modo cantidad conserva el ancho relativo a la categoría mayor y muestra el conteo.
- Ingresos recientes pagina los artículos en orden descendente por fecha de ingreso, cinco por página; muestra navegación desde seis registros y deshabilita los extremos. Las flechas se agrupan a la derecha con el icono del reloj y quedan centradas verticalmente con él, como los controles de Artículos por categoría.
- El gráfico de actividad resume por día las altas, ediciones y bajas de artículos de los últimos siete días locales.
- Cada columna del gráfico muestra su conteo diario encima de la barra; incluye `0` en los días sin movimientos, centrado y con fuente mínima de 12 px.
- El eje Y usa ticks enteros reales: con máximo de 3 o menos muestra todos los enteros hasta cero; con máximos mayores muestra máximo, entero medio y cero. Cada guía y cifra comparte la posición proporcional exacta `(máximo − tick) / máximo`, y las cifras quedan centradas sobre sus guías.
- Las barras tienen ancho adaptable de 18 a 32 px, centradas con las etiquetas del eje X, y esquinas de 7 px en las cuatro puntas; las marcas tenues de 3 px para días sin actividad usan el mismo radio.
- El área del gráfico crece en escritorio y deja la leyenda anclada al fondo de la tarjeta; en móvil conserva 130 px de alto y la leyenda va debajo.
- Las etiquetas del eje X quedan bajo la línea base y usan la inicial mayúscula del día con su número (`S 26`, `D 27`, `L 28`, `M 29`, `X 30`, `J 1`, `V 2`); miércoles siempre usa `X`.

### 02 · Artículos — escritorio (1440 × 1024)

- Título y botón “Agregar artículo”, filtro de categoría y exportación.
- La tabla presenta solo Nombre, Categoría, Fecha de ingreso y Acciones (Ver, Editar, Borrar).
- La fecha incluye día, mes, año y hora local de ingreso.
- El formulario recoge Código, nombre, categoría, Ubicación opcional, N.º de serie opcional, Costo opcional, marca, modelo y notas. Una ubicación vacía aparece como «Sin especificar».

### 03 · Categorías — escritorio (1440 × 1024)

- Lista con nombre, cantidad de artículos asociados y acciones Ver, Editar y Borrar.
- El alta y la edición solicitan el nombre; una categoría con artículos no se puede borrar.
- El detalle muestra Código, Nombre, N.º de serie, Ubicación, Última modificación y acciones Ver y Borrar.

### 04 · Artículos y categorías — móvil (390 × 844)

- Navegación inferior con Resumen, Artículos, Categorías y Movimientos.
- La tabla puede desplazarse horizontalmente; conserva las cuatro columnas y acciones accesibles.
- Reordena paneles y formulario para una columna; los modales pueden ocupar la parte inferior.

### 05 · Movimientos — escritorio y móvil

- Historial completo ordenado del más reciente al más antiguo, con filtro por altas, ediciones y bajas.
- La cabecera usa el mismo título de 16 px/700 y contador que las barras de Artículos y Categorías; en escritorio la etiqueta «Tipo de acción» comparte una fila con el selector y en móvil queda encima de un selector de ancho completo.
- La tabla muestra acción, artículo (nombre, código y categoría) y fecha/hora local; pagina 25 registros.
- Cada movimiento tiene un botón «Ver detalle» en la columna Acciones; abre el evento seleccionado y al cerrar conserva filtro, página y posición. El encabezado del detalle muestra la acción, artículo, código y fecha/hora.
- La cabecera del modal contiene el badge de acción (Alta, Edición o Baja), nombre, código y fecha/hora local legible. El detalle es de solo lectura.
- Altas muestran la ficha completa del estado nuevo y bajas la ficha completa del estado previo. Las ediciones muestran solo diferencias netas en columnas Campo/Antes/Después.
- Se auditan Código, Nombre y Categoría como obligatorios; N.º de serie, Ubicación, Costo, Marca, Modelo y Notas son opcionales. SKU, identificadores y fechas técnicas quedan fuera.
- Textos se comparan tras quitar espacios externos; costo se compara numéricamente y vacío/nulo equivale a cero. Una edición sin cambios netos no se guarda, no cambia `updatedAt` ni crea movimiento.
- Un opcional vacío se presenta como «Sin especificar»; un campo que no fue conservado en un evento histórico se presenta como «Dato no registrado». Los eventos antiguos usan solo los datos guardados y nunca se completan desde el artículo actual.
- Los nuevos movimientos conservan ficha completa en altas/bajas y los valores anterior/nuevo de campos modificados en ediciones. La categoría mostrada es la vigente al ocurrir el evento.
- El diálogo usa `role="dialog"`, `aria-modal` y `aria-labelledby`; recibe foco inicial en el botón con `aria-label="Cerrar detalle de movimiento"`, contiene el foco con Tab/Mayús+Tab, cierra con Escape y devuelve el foco al botón de origen.
- El detalle se abre desde los datos locales en menos de 100 ms; se presenta como historial local, no inviolable ni sincronizado.
- El encabezado y el cierre permanecen disponibles durante el scroll interno. La altura máxima se ajusta al viewport, notas largas se envuelven y a 360–375 px las comparaciones se apilan sin desbordamiento.
- Ningún texto visible del detalle baja de 12 px. El estilo usa los tokens existentes y mantiene contraste, foco visible y movimiento reducido.
- En pantallas estrechas, el filtro ocupa el ancho disponible y la tabla conserva desplazamiento horizontal.

## Sistema visual

| Token | Valor | Uso |
| --- | --- | --- |
| Fondo | `#F7F8FA` | Lienzo de la aplicación |
| Superficie | `#FFFFFF` | Paneles y navegación |
| Texto | `#1D2433` | Contenido principal |
| Secundario | `#838A98` | Etiquetas y metadatos |
| Borde | `#ECEEF2` | Separadores |
| Primario | `#6055D9` | Acciones y navegación activa |
| Éxito | `#23896B` | Confirmaciones |
| Peligro | `#C45155` | Acción de borrar |

- Tipografía Inter con fallback sans-serif de sistema. Tarjetas con radio de 13 px y sombra sutil.
- Los rótulos KPI usan 13 px/600/1.3 y color `#626a78`; en móvil conservan ese tamaño y pueden ocupar dos líneas, con el icono protegido a la derecha. Los títulos de panel y tarjetas de registro usan 16 px/700/1.25 y color `#303746`; los conteos de registros usan 13 px/400/1.4.
- La escala tipográfica global no usa texto visible por debajo de 12 px: metadatos, etiquetas, navegación y ejes usan al menos 12 px; descripciones, pies KPI, botones y paginación usan 13 px. En móvil se permite envolver metadatos y se apilan pies y leyendas para evitar recortes.
- Los títulos principales de página se mantienen en 26 px en escritorio y 22 px en móvil.
- La etiqueta «CONTROL INTERNO» usa el color compartido de `.eyebrow` (`#989daa`) en Resumen, Artículos, Categorías y Movimientos.
- Las tablas de Artículos, Categorías, Movimientos y detalle de categoría comparten `.product-table`: nombres principales a 14 px/600, celdas a 13 px, metadatos a 12 px y encabezados a 12 px/700 en estilo oración, sin espaciado extra.
- Las tablas usan celdas de 8 × 13 px y filas de 68 px; insignias de inicial de 32 × 32 px con radio de 8 px y texto de 13 px; acciones de 29 px con iconos de 16 px y 3 px entre botones. Los nombres largos se ajustan en líneas y pueden aumentar la fila.
- Cada tabla conserva sus anchos de columna y desplazamiento horizontal interno en móvil; el documento no debe desbordarse horizontalmente.
- Mantén contraste, foco visible, nombres accesibles para iconos y respeto por movimiento reducido.

## Componentes e interacción

- Reutiliza marca, navegación, botones, búsqueda, tarjetas, filtro de categoría, fila de artículo y diálogos.
- “Ver” abre los datos registrados en modo lectura; “Editar” valida y guarda; “Borrar” pide confirmación.
- Guardar una edición sin cambios auditables cierra el formulario y avisa «No hubo cambios para guardar.» sin alterar el registro ni el historial.
- La fecha de ingreso y la última modificación usan la hora del navegador.
- El número de serie es único cuando se proporciona; el costo acepta importes no negativos.
- La app guarda en IndexedDB y migra datos de la demo anterior desde `localStorage`.
- Las altas y bajas exitosas y las ediciones con cambios netos auditables se registran junto con su operación; las categorías no generan movimientos. Una edición sin cambios no persiste ni modifica su fecha.
- Las altas guardan la ficha completa nueva, las bajas la ficha completa previa y las ediciones solo los pares anterior/nuevo que cambiaron entre Código, Nombre, Categoría, N.º de serie, Ubicación, Costo, Marca, Modelo y Notas.
- La comparación recorta espacios externos en textos y compara costo numéricamente; vacío/nulo y cero son equivalentes. El nombre de categoría y los valores del detalle son los guardados al ocurrir el movimiento.
- La evolución del historial es aditiva: conserva artículos, categorías y movimientos existentes, no modifica eventos antiguos y no inventa diffs. Los eventos históricos parciales muestran solo los datos conservados; nunca se infieren valores desde el artículo actual.
- No hay login, perfil de usuario ni sincronización entre dispositivos en Portfolio.

## Accesibilidad y fuente de verdad

- Los botones tienen nombres breves; los iconos solos tienen `aria-label` y los diálogos se cierran con Escape.
- `src/App.tsx` y `src/styles.css` son la referencia de implementación. Mantén este resumen sincronizado con ellos.
