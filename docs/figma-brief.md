# InventarioWeb — design handoff

## Intención del producto

Registro interno de artículos para consultar qué activos existen, dónde se clasifican y cuándo ingresaron. La interfaz usa español y evita conceptos de venta o seguimiento de existencias.

## Pantallas

### 01 · Resumen — escritorio (1440 × 1024)

- Navegación fija a la izquierda, barra superior y área de contenido adaptable.
- Saludo, fecha actual y acción “Ver artículos”.
- Tarjetas para Artículos registrados y Categorías; mostrar “Usuarios registrados” solo a Admin.
- Dos paneles: artículos por categoría e ingresos recientes.

### 02 · Artículos — escritorio (1440 × 1024)

- Título y botón “Agregar artículo”. Filtro de categoría, exportación y carga manual de 15 registros de prueba.
- La tabla presenta solo Nombre, Categoría, Fecha de ingreso y Acciones (Ver, Editar, Borrar).
- La fecha incluye día, mes, año y hora local de ingreso.
- El formulario recoge código interno, nombre, categoría, área, marca, modelo y notas.

### 03 · Artículos — móvil (390 × 844)

- Navegación inferior con Resumen y Artículos.
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
- La fecha se asigna al guardar: Postgres usa `now()` y demo usa la hora del navegador.
- La carga remota de datos de prueba es manual e idempotente por código.
- “Usuarios registrados” consulta una Edge Function protegida y solo aparece para Admin.
- Diferencia visualmente Demo local y Supabase sin presentar datos demo como remotos.

## Accesibilidad y fuente de verdad

- Los botones tienen nombres breves; los iconos solos tienen `aria-label` y los diálogos se cierran con Escape.
- `src/App.tsx` y `src/styles.css` son la referencia de implementación. Mantén este resumen sincronizado con ellos.
