# InventarioWeb Portfolio

Aplicación web de control interno para registrar artículos y categorías. Esta versión funciona sin login ni configuración de servicios y guarda los datos en IndexedDB del navegador.

## Stack

- React 19, TypeScript 5.9 y Vite 8
- IndexedDB nativo para persistencia local
- Node.js 22 o superior

## Iniciar

```powershell
npm ci
npm run dev
```

No se requieren credenciales ni archivos `.env`. La primera ejecución crea 3 categorías y 15 artículos de ejemplo. Los cambios persisten en el perfil del navegador y no se sincronizan entre dispositivos.

## Uso

- El resumen muestra las cantidades locales de artículos y categorías.
- La tabla de artículos presenta Nombre, Categoría, Fecha de ingreso y Acciones (Ver, Editar, Borrar).
- En Categorías se pueden crear, editar, consultar y borrar categorías; una categoría con artículos asociados no se puede borrar.
- El formulario incluye Código y Ubicación, además de N.º de serie y Costo opcionales. Los números de serie informados deben ser únicos.
- Los datos de versiones demo anteriores en `localStorage` se migran al abrir la nueva base local: `department` pasa a Ubicación y `price` a Costo.

La aplicación de Empresa con acceso autenticado y datos compartidos entre equipos se desarrollará en otro repositorio. Los archivos de `supabase/` permanecen como referencia histórica y no participan en el arranque de Portfolio.

## Diseño

- Archivo Figma: [InventarioWeb](https://www.figma.com/design/FeXK8SXN7C3YYkDi2dzIC7).
- [`docs/figma-brief.md`](docs/figma-brief.md) describe las pantallas y `.cursor/rules/inventory-app.mdc` las convenciones.
- El proyecto WPF InventarioApp es independiente y no se modifica desde este repositorio.
