---
name: sdd-plan
description: Genera el plan técnico detallado (plan.md) a partir de una spec aprobada en InventarioWeb Portfolio, respetando docs/constitution.md y AGENTS.md sin escribir código.
---
# Planificación Técnica (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite redactar el plan de implementación técnico (`plan.md`) para una especificación funcional. 

Identifica en el mensaje del usuario la carpeta de la especificación (por ejemplo `001-movement-diff` o `specs/001-movement-diff/`). Si no se indica, toma la especificación activa más reciente dentro de `specs/`.

## Validación previa obligatoria
Antes de estructurar el plan, lee `docs/constitution.md`, `AGENTS.md`, `@MEMORY.md` y `specs/NNN-nombre/spec.md`.
- **Comprobación de estado:** Si la spec NO tiene `Estado: aprobada` o contiene secciones marcadas con `[NECESITA ACLARACIÓN]`, **DETENTE DE INMEDIATO**, avisa al usuario y no redactes el plan hasta que las dudas estén resueltas.
- **REGLA ESTRICTA:** NO escribas código de la aplicación en ningún momento durante esta fase.

## Estructura de `specs/NNN-nombre/plan.md`

Genera el archivo con los siguientes apartados:

1. **Archivos y responsabilidades:**
   - Detalle de cada archivo a crear o modificar (`src/types.ts`, `src/lib/inventoryRepository.ts`, `src/App.tsx`, `src/styles.css`, `docs/figma-brief.md`, etc.) y qué lógica específica asume.

2. **Modelo de datos y evolución en IndexedDB:**
   - Contratos en TypeScript con identificadores en inglés (`src/types.ts`).
   - Estrategia de persistencia aditiva: garantizar que ninguna modificación altere, reescriba o destruya datos de artículos, categorías o movimientos históricos previos.

3. **Lógica pura y algoritmos:**
   - Funciones desacopladas para validación, normalización de datos (`.trim()`, equivalencias numéricas en costos) y cálculo de diferencias.
   - Pseudocódigo claro para flujos de decisión o transformaciones de datos complejas.

4. **Interfaz, interacción y accesibilidad:**
   - Componentes o diálogos a renderizar en `src/App.tsx`.
   - Accesibilidad: roles ARIA (`role="dialog"`, `aria-labelledby`), foco inicial, ciclo de foco y cierre accesible por tecla `Escape`.
   - Reglas visuales: apego a tokens existentes, piso tipográfico mínimo absoluto de 12 px (13 px en controles y textos secundarios) y diseño adaptativo a 360–375 px sin desbordamiento horizontal.

5. **Decisiones técnicas y alternativas descartadas:**
   - Justificación de cada decisión técnica clave acompañada obligatoriamente de la alternativa descartada y el motivo de su descarte.

6. **Estrategia de verificación y control de calidad:**
   - Protocolo según Principio 4 de la constitución (sin librerías de tests externas): validación estricta de compilación y bundle con `npm run build`.
   - Pruebas manuales con Chrome DevTools en escritorio y vista móvil (360–375 px), validación de navegación por teclado y comprobación de consola limpia (cero errores y cero advertencias).

7. **Matriz de trazabilidad:**
   - Tabla que mapee cada bloque del plan con los Requisitos Funcionales (`RF-x`) que cubre y los principios de la constitución que cumple.