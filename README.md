# InventarioWeb Portfolio

Aplicación web de control interno para registrar activos físicos, consultar su estado y conservar el historial de sus cambios. Pensada como proyecto de portfolio: se puede probar sin cuentas, credenciales ni configuración de un backend.

Los artículos, categorías y movimientos se guardan en **IndexedDB del navegador**. La interfaz está disponible en español e inglés y se adapta a escritorio y móvil.

## Funcionalidades

| Sección | Qué permite hacer |
| --- | --- |
| Resumen | Consultar artículos y categorías registrados, valor total de los costos capturados, actividad de los últimos siete días e ingresos recientes. Alternar el gráfico de categorías entre porcentaje y conteo. |
| Artículos | Crear, consultar, editar y borrar registros; buscar, filtrar por categoría o estado y exportar la lista filtrada a CSV. |
| Categorías | Administrar categorías, consultar sus cantidades y ver los artículos asociados. Se bloquea el borrado de categorías que contienen artículos. |
| Movimientos | Consultar altas, ediciones y bajas, filtrar por acción e inspeccionar los valores anteriores y nuevos de los campos modificados. Los eventos antiguos muestran únicamente la información conservada. |
| Ajustes | Cambiar tema, idioma, densidad y paginación de tablas, visibilidad de métricas y gráficos, moneda y formatos de fecha y hora. Restablecer preferencias o vaciar el inventario mediante confirmación. |

### Registro y ciclo de vida

Cada artículo incluye código, nombre, categoría, número de serie, ubicación, marca, modelo, costo, notas y fechas de ingreso y modificación. Código y nombre son obligatorios, junto con una categoría; el número de serie debe ser único cuando se informa.

Los estados operativos son **Disponible**, **Asignado**, **En mantenimiento** y **De baja**. Las transiciones se validan al editar. Dar de baja exige confirmación y motivo; después, el artículo queda protegido contra edición y eliminación, conservando su consulta, impresión e historial.

Las operaciones y sus movimientos se guardan en la misma transacción. Guardar una edición sin cambios netos no genera actividad.

### Impresión local

Desde el detalle del artículo se pueden abrir dos vistas previas:

- **Etiqueta adhesiva de 70 × 35 mm:** código, nombre, categoría, fecha de ingreso y código de barras.
- **Ficha técnica y acta de resguardo:** documento Carta vertical con especificaciones y recuadros para firmas manuscritas de entrega y recepción.

El código de barras **Code 128-B** se genera como SVG local, sin librerías externas. Los códigos incompatibles o demasiado largos para el formato bloquean la impresión y muestran un aviso. Imprimir requiere una acción explícita desde la vista previa. La ficha se diseña para una página Carta, escala 100 % y márgenes de 15 mm; los textos extensos pueden truncarse para conservar las firmas en la misma hoja.

## Ejecutar localmente

Requisitos: **Node.js 22.12 o superior** y npm. Se recomienda usar una versión LTS de Node compatible.

```powershell
git clone https://github.com/AndresMolina-Sys/InventarioWeb.git
cd InventarioWeb
npm ci
npm run dev
```

Abre la dirección que indique Vite en la terminal, normalmente `http://localhost:5173`. No se necesita un archivo `.env`.

La primera base local se inicializa con **3 categorías y 15 artículos de ejemplo**. Puedes modificarlos para explorar la aplicación. Después de vaciar el inventario desde Ajustes, los ejemplos no se vuelven a crear al recargar.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm ci` | Instalar las dependencias fijadas en el lockfile. |
| `npm run dev` | Iniciar el servidor de desarrollo con recarga automática. |
| `npm test` | Ejecutar las pruebas con el runner integrado de Node, sin dependencias de pruebas externas. |
| `npm run build` | Validar TypeScript y generar la versión de producción en `dist/`. |
| `npm run preview` | Revisar localmente el resultado de un build. |

No hay un script de lint configurado. Para publicar la demo en un alojamiento estático, usa `npm run build` y publica `dist/`. Si se sirve desde una subruta, hay que ajustar `base` en `vite.config.ts` a esa ubicación.

## Datos y preferencias

- El inventario se conserva por **origen y perfil del navegador**. Cambiar de navegador, equipo, dominio o puerto utiliza otro almacenamiento. No hay sincronización en la nube.
- Las preferencias se guardan por separado en `localStorage`. Restablecerlas conserva el inventario; vaciar la base elimina artículos, categorías y movimientos, y mantiene las preferencias.
- El vaciado exige escribir `VACIAR` o `CLEAR`, según el idioma. Las otras pestañas abiertas descartan los datos y borradores anteriores al vaciado.
- Los costos se capturan y almacenan en **USD**. Mostrar CRC o EUR aplica tasas locales editables; la aplicación no consulta cotizaciones en tiempo real. Los formatos de moneda, fecha e idioma no modifican los datos originales.
- Se migran las versiones demo anteriores de `localStorage`, conservando artículos y categorías. El historial faltante no se reconstruye.
- El CSV exporta la lista de artículos; **no es una copia completa de seguridad** del inventario ni incluye todo el historial. Borrar los datos del sitio en el navegador elimina también el almacenamiento local.

## Stack y organización

React **19.3.0**, TypeScript **5.9.3** y Vite **8.3.1**, con IndexedDB, `localStorage` y APIs nativas del navegador.

```text
src/
  App.tsx                   Coordinación de navegación, datos y acciones
  components/               Primitivas visuales y navegación lateral
  features/
    dashboard/              Resumen y gráficos
    inventory/              Artículos, categorías, diálogos, CSV e impresión
    movements/              Historial y detalle de auditoría
    settings/               Preferencias y verificación del vaciado
  lib/                      Persistencia, validaciones, formatos y barcode
  data/demo.ts              Muestras y migración de datos heredados
  i18n.ts                   Textos tipados y formatos en español e inglés
  types.ts                  Modelos compartidos
  styles.css                Temas, diseño adaptable y estilos de impresión
tests/                      Pruebas Node con IndexedDB simulado en memoria
docs/                       Constitución y documentación de diseño
specs/                      Especificaciones, planes y tareas SDD
graphify-out/               Grafo navegable y reporte de relaciones del proyecto
```

`supabase/` contiene referencias históricas y no participa en la ejecución de Portfolio. Esta versión funciona con almacenamiento local.

## Diseño y verificación

La interfaz incorpora navegación por teclado, gestión de foco en diálogos, temas claro/oscuro y texto visible de al menos 12 px. Las revisiones de navegador se realizan con Chrome DevTools en escritorio y anchos móviles de 360 y 375 px.

Las pruebas automatizadas cubren reglas de estados, diferencias auditables, persistencia y protección de artículos dados de baja, borradores obsoletos tras vaciar, verificación de vaciado, neutralización de fórmulas en CSV y traducción de errores. Usan una simulación en memoria de IndexedDB y complementan la revisión en un navegador real.

- [Referencia de diseño en Figma](https://www.figma.com/design/FeXK8SXN7C3YYkDi2dzIC7)
- [Guía visual y de interacción](docs/figma-brief.md)
- [Principios del proyecto](docs/constitution.md)
- [Reporte de Graphify](graphify-out/GRAPH_REPORT.md)

Para explorar el grafo interactivo, abre `graphify-out/graph.html` en el navegador.
