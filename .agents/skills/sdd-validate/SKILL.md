---
name: sdd-validate
description: Valida la especificación (spec.md) requisito por requisito (RF por RF) mediante compilación estricta, Chrome DevTools MCP y revisión de criterios de finalización en InventarioWeb Portfolio.
---
# Validación RF por RF (SDD) — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite auditar o verificar el cumplimiento completo de una especificación implementada antes de darla por finalizada.

Identifica en el mensaje del usuario la carpeta de la funcionalidad (por ejemplo `001-movement-diff` o `specs/001-movement-diff/`). Si no se indica, toma la especificación activa más reciente dentro de `specs/`.

## Instrucciones de ejecución

1. **Lectura obligatoria:**
   - Lee `specs/NNN-nombre/spec.md`, `specs/NNN-nombre/plan.md`, `specs/NNN-nombre/tasks.md`, `docs/constitution.md` y `@MEMORY.md`.

2. **Estrategia de verificación constitucional (Principio 4):**
   - El proyecto no utiliza frameworks de prueba externos ni scripts de `node --test`.
   - **Validación técnica y contratos:** Ejecuta `npm run build` para comprobar la compilación estricta de TypeScript y el bundle de Vite.
   - **Validación visual, interacción y accesibilidad:** Utiliza el MCP de Chrome DevTools para interactuar con la aplicación en vivo (`http://localhost:5173` o el puerto activo de `npm run dev`).
   - Prueba obligatoriamente en dos entornos:
     - Escritorio (1440 px o pantalla estándar).
     - Vista móvil estrecha (360 px y 375 px), confirmando la ausencia total de desbordamiento horizontal (`overflow-x`).

3. **Auditoría Requisito por Requisito (RF por RF):**
   - Recorre cada `RF-x` definido en `specs/NNN-nombre/spec.md`.
   - Para cada uno, presenta:
     - **RF-ID y Enunciado:** Criterio original de la spec.
     - **Método de verificación:** Compilación / Inspección de código / Prueba interactiva en Chrome DevTools.
     - **Resultado:** Cumplido / Fallido / No implementado.
     - **Evidencia concreta:** Qué elemento del DOM se verificó, qué tecla se presionó o qué cambio en IndexedDB ocurrió.

4. **Comprobación de Criterios de Finalización:**
   Verifica exhaustivamente los requisitos transversales del proyecto:
   - **Consola 100% limpia:** Cero errores y cero advertencias en la consola de Chrome DevTools (verificar que no exista error 404 de favicon ni advertencias de React).
   - **Accesibilidad y diseño:** Tipografía con piso mínimo de 12 px (13 px en controles y textos secundarios), roles ARIA presentes y foco manejado con teclado.
   - **Preservación de datos:** Integridad de datos en IndexedDB sin mutaciones destructivas en registros existentes.
   - **Sincronización documental:** Verificar que `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` reflejen con exactitud los cambios implementados.

5. **REGLA ESTRICTA DE CIERRE:**
   - Si algún RF no está cubierto, falla o se detecta una advertencia en consola, repórtalo con claridad en una lista de discrepancias.
   - **NO modifiques archivos ni intentes arreglar nada todavía.** Espera la revisión y las instrucciones del usuario para decidir los pasos correctivos.