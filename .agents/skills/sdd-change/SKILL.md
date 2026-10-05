---
name: sdd-change
description: Incorpora o modifica requisitos en una spec activa siguiendo el flujo SDD en InventarioWeb Portfolio (actualiza spec.md con notación EARS, evalúa impacto en plan/tareas y muestra el diff antes de tocar código).
---
# Gestión de Cambios de Requisitos (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario plantee un cambio de alcance, un nuevo requisito o un ajuste de reglas sobre una funcionalidad ya especificada o en desarrollo.

Identifica en el mensaje del usuario:
1. La carpeta de la funcionalidad (ej. `001-movement-diff` o `specs/001-movement-diff/`). Si no se indica, toma la especificación activa más reciente en `specs/`.
2. El requerimiento nuevo o modificado que se desea incorporar.

## Reglas obligatorias
- **REGLA ESTRICTA: NO toques código de la aplicación.** 
- La spec manda: los cambios nunca se programan directamente. Todo ajuste viaja en cascada: primero `spec.md`, luego `plan.md`, después `tasks.md` y al final el código.
- Respeta `docs/constitution.md`, `AGENTS.md` y `@MEMORY.md`.

## Procedimiento de ejecución

1. **Actualización de la especificación (`specs/NNN-nombre/spec.md`):**
   - Incorpora el nuevo requisito funcional o edita el existente bajo **notación EARS estricta en español**:
     - *CUANDO [evento], EL SISTEMA [acción].*
     - *SI [condición], ENTONCES EL SISTEMA [acción].*
     - *MIENTRAS [estado], EL SISTEMA [restricción].*
     - *EL SISTEMA [capacidad/regla].*
   - Define los casos límite asociados (valores nulos/vacíos, normalización `.trim()`, costo cero vs. vacío, anchos móviles 360–375 px, etc.).
   - Actualiza la sección de *Fuera de alcance* si el cambio introduce tentaciones de extenderse más allá de los límites acordados.

2. **Proyección del impacto en cascada:**
   - Lista puntualmente qué secciones de `specs/NNN-nombre/plan.md` requerirán reajuste técnico (tipos en `src/types.ts`, lógica en `src/lib/inventoryRepository.ts`, UI en `src/App.tsx`, etc.).
   - Indica qué tareas de `specs/NNN-nombre/tasks.md` quedan invalidadas, cuáles deben modificarse o qué nuevas tareas atómicas deberán añadirse (cuidando el tope de 20–30 min por tarea).

3. **Presentación de diferencias y parada obligatoria:**
   - Muestra el diff exacto o un bloque claro con el «Antes / Después» de las secciones modificadas en `spec.md`.
   - **DETENTE POR COMPLETO.** No modifiques `plan.md`, `tasks.md` ni código hasta que el usuario revise y apruebe formalmente la nueva redacción de la spec.