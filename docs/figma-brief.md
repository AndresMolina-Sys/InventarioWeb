# InventarioWeb — design handoff

## Intención del producto

Registro interno de artículos para consultar qué activos existen, dónde se clasifican y cuándo ingresaron. La interfaz usa español y evita conceptos de venta o seguimiento de existencias.

## Pantallas

### 01 · Resumen — escritorio (1440 × 1024)

- Navegación fija a la izquierda, barra superior y área de contenido adaptable.
- Saludo, fecha actual y accesos a Artículos y Categorías.
- Tarjetas para Artículos registrados y Categorías.
- Dos paneles: artículos por categoría e ingresos recientes.

### 02 · Artículos — escritorio (1440 × 1024)

- Título y botón “Agregar artículo”, filtro de categoría y exportación.
- La tabla presenta solo Nombre, Categoría, Fecha de ingreso y Acciones (Ver, Editar, Borrar).
- La fecha incluye día, mes, año y hora local de ingreso.
- El formulario recoge Código, nombre, categoría, Ubicación, N.º de serie opcional, Costo opcional, marca, modelo y notas.

### 03 · Categorías — escritorio (1440 × 1024)

- Lista con nombre, cantidad de artículos asociados y acciones Ver, Editar y Borrar.
- El alta y la edición solicitan el nombre; una categoría con artículos no se puede borrar.
- El detalle muestra Código, Nombre, N.º de serie, Ubicación, Última modificación y acciones Ver y Borrar.

### 04 · Artículos y categorías — móvil (390 × 844)

- Navegación inferior con Resumen, Artículos y Categorías.
- La tabla puede desplazarse horizontalmente; conserva las cuatro columnas y acciones accesibles.
- Reordena paneles y formulario para una columna; los modales pueden ocupar la parte inferior.

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
- Mantén contraste, foco visible, nombres accesibles para iconos y respeto por movimiento reducido.

## Componentes e interacción

- Reutiliza marca, navegación, botones, búsqueda, tarjetas, filtro de categoría, fila de artículo y diálogos.
- “Ver” abre los datos registrados en modo lectura; “Editar” valida y guarda; “Borrar” pide confirmación.
- La fecha de ingreso y la última modificación usan la hora del navegador.
- El número de serie es único cuando se proporciona; el costo acepta importes no negativos.
- La app guarda en IndexedDB y migra datos de la demo anterior desde `localStorage`.
- No hay login, perfil de usuario ni sincronización entre dispositivos en Portfolio.

## Accesibilidad y fuente de verdad

- Los botones tienen nombres breves; los iconos solos tienen `aria-label` y los diálogos se cierran con Escape.
- `src/App.tsx` y `src/styles.css` son la referencia de implementación. Mantén este resumen sincronizado con ellos.
