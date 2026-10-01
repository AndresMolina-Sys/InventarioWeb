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
- Los datos pertenecen al perfil local del navegador y no se sincronizan entre equipos. Portfolio no tiene usuarios ni autenticación.

## Forma de trabajar

Planifica cambios que afecten persistencia o varias pantallas. Mantén el alcance acotado y actualiza `docs/figma-brief.md` ante cambios de interfaz. Al terminar, resume los archivos modificados y cómo verificaste el cambio.

## Límites

- ✅ Siempre: conserva la persistencia local con IndexedDB y las versiones fijadas; ejecuta el build después de cambios de código.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
- ✅ Siempre: al terminar cambios, genera el commit en inglés usando estrictamente `<type>(<scope>): <subject>` (<50 chars) y un cuerpo con `<description>` (<100 chars, verbo en presente simple/imperativo respondiendo por qué y cómo; tipos: fix, feat, test, refactor, revert, build, chore).
- ⚠️ Pregunta antes: añadir dependencias o archivos, o cambiar el formato persistido y sus migraciones.
- 🚫 Nunca: edites la app WPF, expongas claves, conectes o apliques recursos Supabase desde Portfolio, ni incorpores autenticación o cuentas a esta versión.

## Verificación

Ejecuta `npm run build`. Si cambia el arranque o la persistencia, comprueba que `npm run dev` abra sin variables de entorno y que los datos sobrevivan una recarga. No hay scripts de pruebas ni lint configurados.
