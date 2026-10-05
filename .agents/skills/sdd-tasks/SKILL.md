---
name: sdd-tasks
description: Divide el plan técnico (plan.md) en un desglose secuencial de tareas pequeñas, atómicas y verificables (tasks.md) para InventarioWeb Portfolio.
---
# Desglose de Tareas (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite generar el archivo de tareas (`tasks.md`) a partir de una especificación y un plan técnico aprobados.

Identifica en el mensaje del usuario la carpeta de la funcionalidad (por ejemplo `001-movement-diff` o `specs/001-movement-diff/`). Si no se indica, toma la especificación activa más reciente dentro de `specs/`.

## Validación previa
Antes de generar el desglose, comprueba que existan y estén acordados tanto `specs/NNN-nombre/spec.md` como `specs/NNN-nombre/plan.md`.
- Si alguno de los dos archivos está incompleto, contiene dudas abiertas (`[NECESITA ACLARACIÓN]`) o no ha sido aprobado por el usuario, **DETENTE**, avisa la situación y no generes las tareas.
- **REGLA ESTRICTA:** NO escribas código de la aplicación. Tu única salida en esta fase es estructurar el archivo `specs/NNN-nombre/tasks.md`.

## Reglas de descomposición de tareas

1. **Atomicidad y duración:**
   - Cada tarea debe ser pequeña y ejecutable en un lapso de 20 a 30 minutos.
   - Si el desglose supera las **8 a 10 tareas**, propón formalmente al usuario dividir la funcionalidad en dos especificaciones más pequeñas antes de continuar.

2. **Orden estricto de dependencias:**
   Organiza las tareas en fases lógicas sin adelantar pasos:
   - **Fase 1: Contratos y tipos** (`src/types.ts`).
   - **Fase 2: Lógica pura y persistencia** (`src/lib/inventoryRepository.ts`, IndexedDB aditivo y migraciones no destructivas).
   - **Fase 3: Interfaz y flujo de usuario** (`src/App.tsx`, modales, botones y eventos).
   - **Fase 4: Estilos, tokens y accesibilidad** (`src/styles.css`, responsive a 360–375 px, piso de 12 px, scroll interno).
   - **Fase 5: Verificación en navegador y documentación** (`npm run build`, Chrome DevTools, `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md`).

3. **Formato obligatorio por tarea:**
   Cada tarea debe usar casillas de verificación markdown (`- [ ]`) y especificar con precisión:

   ```markdown
   - [ ] **T01. [Nombre del módulo/archivo a modificar].** RF-x, RF-y (Principio N)
     - Descripción puntual del cambio a implementar.
     - Hecho cuando: [Criterio técnico de verificación medible, objetivo y sin ambigüedades].