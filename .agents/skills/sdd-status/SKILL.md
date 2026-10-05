---
name: sdd-status
description: Informa de forma concisa la fase actual del flujo SDD, el progreso de tareas (x de y) y el siguiente paso exacto a ejecutar en una spec de InventarioWeb Portfolio.
---
# Estado y Próximo Paso (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario pregunte en qué punto se encuentra una funcionalidad o cuál es el paso inmediato a seguir.

Identifica en el mensaje del usuario la carpeta de la funcionalidad (ej. `001-movement-diff` o `specs/001-movement-diff/`). Si no se indica, toma la especificación activa más reciente dentro de `specs/`.

## Reglas obligatorias
- **MODO SOLO LECTURA:** No modifiques ni crees ningún archivo en el proyecto.
- Sé extremadamente breve y directo (máximo 10–12 líneas en total).

## Instrucciones de análisis

1. **Revisión de artefactos:**
   Inspecciona en `specs/NNN-nombre/` los archivos que existan:
   - `spec.md`: Revisa el encabezado `Estado:` (borrador, aprobada, implementada) y si contiene marcas `[NECESITA ACLARACIÓN]`.
   - `plan.md`: Comprueba si existe y si está aprobado.
   - `tasks.md`: Comprueba si existe y cuenta las casillas marcadas (`- [x]`) frente al total (`- [ ]`).
   - `MEMORY.md`: Revisa el último estado registrado en la memoria del proyecto.

2. **Diagnóstico de la fase activa del flujo SDD:**
   Determina en cuál de las etapas se encuentra el desarrollo:
   - *Fase 1: Especificación* (creando o aclarando `spec.md`).
   - *Fase 2: Auditoría QA* (`spec.md` lista, esperando revisión de casos límite y ambigüedades).
   - *Fase 3: Planificación técnica* (`spec.md` aprobada, generando o revisando `plan.md`).
   - *Fase 4: Desglose de tareas* (`plan.md` aprobado, generando `tasks.md`).
   - *Fase 5: Implementación atómica* (`tasks.md` en progreso, ejecutando tareas `Txx`).
   - *Fase 6: Validación RF por RF* (todas las tareas completadas, verificando con Chrome DevTools y consola limpia).
   - *Fase 7: Cierre y consolidación* (funcionalidad terminada y documentada).

## Formato de respuesta (Conciso)

Entrega el reporte estructurado exactamente con estos tres puntos:

1. **Fase actual y estado:**
   Indica la fase del flujo SDD y el estado formal del documento evaluado.
2. **Progreso de tareas:**
   Presenta el conteo exacto: `x de y tareas completadas` (y el porcentaje o lista breve de la tarea en curso).
3. **Siguiente paso exacto:**
   Indica la acción concreta inmediata que corresponde realizar y la skill de Codex sugerida para invocarla (ej. *«Invoca `sdd-implement` para ejecutar la tarea T01»* o *«Invoca `sdd-validate` para verificar la spec completa»*).