# MEMORY.md — Inventario Web
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Este repositorio contiene la versión Portfolio: una aplicación de control interno para administrar artículos y categorías sin inicio de sesión.
- La interfaz está en `src/App.tsx`, los modelos compartidos en `src/types.ts`, la persistencia IndexedDB en `src/lib/inventoryRepository.ts` y los datos iniciales/migración en `src/data/demo.ts`.
- La base local nueva se inicializa con 3 categorías y 15 artículos. Los datos quedan en el navegador y no se sincronizan entre equipos.
- Skills disponibles en el proyecto: `vercel-react-best-practices`, `frontend-design`, `webapp-testing`, `accessibility` y `grill-me`.
- Chrome DevTools MCP está instalado y disponible para inspeccionar páginas, consola, red, accesibilidad y rendimiento.

## Decisiones (y por qué)
- Usar IndexedDB sin Supabase ni cuentas para que cualquier persona pueda probar Portfolio localmente; la versión de Empresa se hará en otro repositorio.
- Diseñar las interfaces primero en Figma y usar `figma-design-to-code` para llevarlas a React; `frontend-design` aporta criterio visual al código, pero no se conecta directamente a Figma.
- Importar registros previos de `localStorage`, conservando `price` como `cost` y `department` como `location` para no perder datos.
- Mantener campos opcionales `serialNumber` y `cost`; los números de serie informados son únicos.
- Impedir borrar categorías con artículos asociados para evitar registros huérfanos.
- Conservar la fecha de ingreso al editar y actualizar `updatedAt` con la fecha y hora del navegador.
- No incluir cantidades, estados de stock, usuarios ni autenticación en Portfolio.

## Aprendizajes y errores a evitar
- (vacío por ahora)

## Próximos pasos
- (vacío por ahora)
