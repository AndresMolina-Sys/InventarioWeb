---
name: sdd-constitution
description: Propone o audita los principios innegociables de docs/constitution.md para InventarioWeb Portfolio siguiendo Spec-Driven Development (SDD).
---
# Constitución del Proyecto — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite redactar, revisar o actualizar `docs/constitution.md`. Toma en cuenta el contexto adicional o los requerimientos indicados por el usuario en el mensaje actual.

## Instrucciones de ejecución

1. **Lectura previa obligatoria:**
   - Antes de formular propuestas, revisa en detalle `AGENTS.md`, `MEMORY.md` y la estructura base del código (`src/types.ts`, `src/lib/inventoryRepository.ts`, `src/App.tsx`).

2. **Propuesta de principios innegociables:**
   - Redacta exactamente **6 principios innegociables**, redactados de forma corta, imperativa y verificable (máximo 15 líneas en total).
   - Deben cubrir estrictamente estas 6 áreas:
     1. **Simplicidad del stack:** React, TypeScript y Vite fijados; prohibición de dependencias externas sin aprobación previa.
     2. **Relación entre spec y código:** Sincronización obligatoria de `docs/figma-brief.md` ante cualquier modificación visible de interfaz.
     3. **Separación de lógica e interfaz:** Persistencia y validaciones aisladas en `src/lib/inventoryRepository.ts`, UI y componentes en `src/App.tsx`.
     4. **Política de verificación:** Verificación mediante `npm run build` y validación visual/consola con Chrome DevTools (escritorio y móvil 360–375 px), sin instalar librerías de pruebas externas.
     5. **Protección y persistencia de datos:** Registros persistidos localmente en IndexedDB (local-first, aditivo, sin login ni conexiones remotas), garantizando que ninguna migración destruya datos existentes.
     6. **Convención de idioma:** Identificadores y nombres internos de código en inglés (`camelCase`/`PascalCase`); textos visibles al usuario, mensajes de error y comentarios breves en español.

3. **Regla estricta:**
   - **NO escribas ni modifiques `docs/constitution.md` todavía.** Presenta la propuesta en el chat y espera la aprobación explícita del usuario antes de tocar el sistema de archivos.