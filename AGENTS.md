# AGENTS.md — InventarioWeb

InventarioWeb es un registro web interno de artículos para organizar activos de un negocio. Permite consultar, clasificar y mantener datos de los artículos; usa Supabase o una demo local persistida en el navegador.

## Stack y estructura

- React 19.3.0, TypeScript 5.9.3, Vite 8.3.1, Supabase JS 2.117.1; requiere Node.js 22+.
- `src/App.tsx`: interfaz; `src/types.ts`: modelos compartidos.
- `src/lib/inventoryRepository.ts`: persistencia y mapeo snake_case; `src/data/demo.ts`: catálogo de prueba y `localStorage`.
- `supabase/schema.sql`: esquema inicial y RLS. `supabase/migrations/`: cambios incrementales. `supabase/functions/registered-user-count/`: conteo protegido para Admin.
- `docs/figma-brief.md` y `.cursor/rules/inventory-app.mdc` son referencias de diseño y convenciones.

## Comandos

```powershell
npm ci
npm run dev
npm run build
npm run preview
```

`npm run build` valida TypeScript y genera el bundle. No hay scripts de prueba ni lint.

## Convenciones

- Componentes funcionales; dos espacios, comillas dobles, punto y coma y nombres camelCase.
- Texto visible y errores en español. Usa los tipos compartidos y mantiene el mapeo snake_case en el repositorio.
- Sigue los patrones de `src/App.tsx`; conserva etiquetas accesibles, teclado y diseño adaptable.
- El alta asigna `created_at` en Postgres o la hora del sistema en demo.

## Reglas de dominio / trampas conocidas

- Sin ambas variables Supabase, los datos solo viven en `localStorage`; no informes sincronización remota.
- La primera cuenta recibe tres categorías. La demo incluye 15 artículos y la carga remota es explícita e idempotente por código.
- El total global de usuarios solo se consulta en la Edge Function y para cuentas con `app_metadata.role = "admin"`.
- RLS y `auth.uid()` limitan cada artículo y categoría a su propietario. La clave de servicio nunca va al cliente.
- `schema.sql` no es idempotente: revisa migraciones remotas antes de aplicarlo.

## Forma de trabajar

Planifica cambios de varios módulos, autenticación, seguridad o base de datos. Mantén cambios acotados y actualiza `docs/figma-brief.md` si cambia la composición. Al terminar, explica archivos, comportamiento y verificación.

## Límites

- ✅ Siempre: conserva la demo, RLS, grants mínimos y versiones fijadas; ejecuta `npm run build` tras cambios de código.
- ⚠️ Pregunta antes: añadir dependencias, cambiar contratos persistidos o aplicar migraciones remotas.
- 🚫 Nunca: edites el proyecto WPF, expongas claves, eludas RLS ni muestres el total global a cuentas sin rol Admin.

## Verificación

Ejecuta `npm run build`. Si cambia el arranque, comprueba Supabase y demo local. Para SQL, inspecciona tablas, RLS, políticas, grants y triggers con consultas de solo lectura.
