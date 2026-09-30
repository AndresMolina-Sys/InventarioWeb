# InventarioWeb

Aplicación web para el control interno de artículos de una organización. Permite registrar nombre, categoría, datos de identificación y fecha de ingreso; funciona con Supabase o con datos demo guardados en el navegador.

## Stack

- React 19 + TypeScript + Vite
- Supabase Auth y Postgres con aislamiento por usuario mediante RLS
- Modo demo local persistido en `localStorage`
- Node.js 22 o superior

## Iniciar

```powershell
npm ci
npm run dev
```

Sin `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` se abre el modo demo. Con ambas variables se habilitan el acceso con Supabase y la persistencia remota.

## Supabase

1. Configura las dos variables indicadas en `.env.example` dentro de `.env.local`. Ese archivo está excluido de Git.
2. Revisa el historial remoto antes de aplicar una migración. `supabase/schema.sql` solo sirve para un proyecto nuevo y se ejecuta una vez.
3. La migración `supabase/migrations/*_remove_stock_tracking.sql` quita las columnas y tablas de existencias; conserva artículos, categorías y RLS.
4. Despliega `supabase/functions/registered-user-count` con verificación JWT habilitada. Solo las cuentas con `app_metadata.role = "admin"` reciben el total global de usuarios.

La clave publicable va en el navegador. La clave `service_role` solo la usa el entorno de Edge Functions; nunca la copies a variables `VITE_*`.

## Uso

- El tablero resume artículos y categorías; la cifra de usuarios registrados solo aparece para Admin.
- La tabla muestra Nombre, Categoría, Fecha de ingreso y Acciones (Ver, Editar, Borrar).
- La fecha se asigna al guardar: Postgres usa `created_at default now()` y el demo usa la hora del navegador.
- En Supabase, “Cargar 15 artículos de prueba” agrega solo los códigos que aún no existan en la cuenta actual.

## Diseño y editor

- Archivo Figma: [InventarioWeb](https://www.figma.com/design/FeXK8SXN7C3YYkDi2dzIC7).
- [`docs/figma-brief.md`](docs/figma-brief.md) mantiene el resumen visual y `.cursor/rules/inventory-app.mdc` documenta las convenciones.
- El proyecto WPF InventarioApp es una referencia independiente y no se modifica desde este repositorio.
