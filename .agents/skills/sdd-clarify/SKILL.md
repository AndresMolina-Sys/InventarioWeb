---
name: sdd-clarify
description: Audita specs/NNN-nombre/spec.md como un QA estricto: detecta ambigüedades, contradicciones, casos límite no cubiertos y conflictos con docs/constitution.md sin proponer soluciones.
---
# Auditoría QA de Especificación — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite revisar una especificación (`specs/NNN-nombre/spec.md`) antes de pasar a la fase de planificación o desarrollo.

Identifica en el mensaje del usuario la carpeta o ruta de la especificación a revisar (por ejemplo `001-movement-diff` o `specs/001-movement-diff/spec.md`). Si no se indica, toma la especificación activa más reciente dentro de `specs/`.

## Instrucciones de ejecución

1. **Lectura obligatoria:**
   - Lee detalladamente `docs/constitution.md`, `AGENTS.md`, `@MEMORY.md` y el archivo `spec.md` indicado.

2. **Rol y postura de auditoría:**
   - Actúa con la rigurosidad de un QA senior enfocado en prevención de defectos tempranos.
   - **REGLA ESTRICTA: NO propongas soluciones todavía.** Tu labor en esta fase es exclusivamente detectar, señalar y clasificar brechas, sin resolverlas ni sugerir código.

3. **Estructura del reporte a entregar:**
   Genera una respuesta estructurada con listas numeradas dividida exactamente en cuatro apartados:

   1. **Ambigüedades restantes:**
      - Requisitos sin criterio verificable o medible (por ejemplo: términos subjetivos como "rápido", "limpio" o "adecuado").
      - Campos u operaciones donde falte definir tipo de dato, valor por defecto o comportamiento en caso de ausencia.

   2. **Contradicciones entre requisitos:**
      - Requisitos dentro de la misma spec que chocan entre sí o con flujos descritos en otras secciones.
      - Reglas de dominio de la spec que contradigan el comportamiento histórico o pactado en `AGENTS.md`.

   3. **Casos límite no cubiertos:**
      - Manejo de textos vacíos, espacios en blanco iniciales/finales (`.trim()`) o formatos especiales.
      - Costos numéricos en cero versus nulo/vacío.
      - Contención de datos extensos (notas largas, desbordamientos en pantalla, modales con scroll).
      - Comportamiento responsive en dispositivos móviles reducidos (360–375 px).

   4. **Conflictos con docs/constitution.md:**
      - Incumplimiento del principio de stack simple (propuesta implícita de librerías externas o tests automatizados no autorizados).
      - Falta de contemplación de la actualización de `docs/figma-brief.md`.
      - Violación de la separación de lógica e interfaz o del piso tipográfico mínimo absoluto de 12 px.
      - Riesgo de persistencia destructiva o pérdida de datos en IndexedDB.
      - Suposiciones de usuarios, cuentas o autenticación (el proyecto es 100% monousuario y local).

4. **Cierre:**
   - Concluye solicitando al usuario su decisión o aclaración sobre los hallazgos para proceder a resolverlos en la spec.