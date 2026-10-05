---
name: sdd-implement
description: Implementa una única tarea atómica de tasks.md en InventarioWeb Portfolio, verificando con npm run build y deteniéndose de inmediato.
---
# Implementación Atómica de Tareas (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite implementar una tarea específica de una funcionalidad (por ejemplo: `T01`, `T02`, etc.).

Identifica en el mensaje del usuario:
1. El identificador de la tarea a implementar (ej. `T01`, `T02`).
2. La carpeta de la funcionalidad (ej. `001-movement-diff`). Si no se especifica, toma la especificación activa dentro de `specs/`.

## Instrucciones de ejecución

1. **Lectura y contexto previo:**
   - Revisa `docs/constitution.md`, `AGENTS.md`, `specs/NNN-nombre/plan.md` y la definición exacta de la tarea en `specs/NNN-nombre/tasks.md`.
   - Lee con atención la línea **«Hecho cuando:»** de la tarea seleccionada.

2. **Alcance atómico:**
   - Modifica o crea ÚNICAMENTE los archivos asignados a esa tarea concreta.
   - **PROHIBIDO** tocar archivos o escribir lógica que corresponda a tareas posteriores.

3. **Política de verificación (Principio 4 de la Constitución):**
   - El proyecto no tiene configurada infraestructura de pruebas externas (no escribas archivos de test ni ejecutes `node --test`).
   - Ejecuta `npm run build` para validar el tipado estricto de TypeScript y la integridad del bundle de Vite.
   - Si la tarea modifica interfaz o estilos, verifica el comportamiento en Chrome DevTools (escritorio y móvil 360–375 px), asegurando consola 100% limpia (cero errores y cero advertencias).

4. **Cierre de la tarea:**
   - Marca la tarea con `[x]` en `specs/NNN-nombre/tasks.md`.
   - Muestra la salida o resumen de la compilación/verificación.
   - Indica qué Requisitos Funcionales (`RF-x`) y principios constitucionales quedaron satisfechos.
   - Si la tarea implicó una decisión técnica o un hito relevante, actualiza brevemente `MEMORY.md`.

5. **PARADA OBLIGATORIA:**
   - **DETENTE POR COMPLETO.** Prohibido continuar con la siguiente tarea sin la aprobación explícita y confirmación del usuario.