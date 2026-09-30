# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- InventarioWeb es un registro interno de artículos, separado del programa WPF.
- Stack fijado: React 19.3.0, TypeScript 5.9.3, Vite 8.3.1, Supabase JS 2.117.1, Node.js 22+.
- Interfaz/modelos: `src/App.tsx`, `src/types.ts`; persistencia: `src/lib/inventoryRepository.ts`; demo: `src/data/demo.ts`.
- Supabase usa RLS por propietario, migraciones en `supabase/migrations/` y la Edge Function `registered-user-count`.
- Dashboard: artículos y categorías; el conteo global solo lo consulta Admin. Demo con 3 categorías y 15 artículos.

## Decisiones (y por qué)
- Mantener demo local cuando falten variables Supabase; esos datos no se presentan como remotos.
- El registro conserva nombre, categoría, fecha de ingreso y acciones Ver/Editar/Borrar.
- No guardar cantidades ni movimientos de stock. La migración elimina el seguimiento de existencias.
- Usar modelos camelCase y mapear snake_case solo en el repositorio.
- El total de usuarios se consulta del lado servidor y requiere `app_metadata.role = "admin"`.
- Cargar los 15 artículos en Supabase solo mediante acción explícita e idempotente por código.
- Conservar versiones fijadas, grants mínimos y claves secretas solo en el servidor.

## Aprendizajes y errores a evitar
- `supabase/schema.sql` es inicial y no idempotente; revisar el historial remoto antes de aplicarlo.
- En demo, migrar la clave `inventario-web-demo-v1` para conservar artículos personalizados.

## Próximos pasos
- Al cambiar código TypeScript/UI, ejecutar `npm run build`; no hay scripts de prueba ni lint.
