---
name: sdd-spec
description: Entrevista al usuario paso a paso y genera la especificación formal (spec.md) con requisitos EARS para InventarioWeb Portfolio.
---
# Entrevista y Generación de Spec — InventarioWeb Portfolio

Usa esta skill cuando el usuario solicite definir una nueva funcionalidad en el formato Spec-Driven Development (SDD). 

Identifica en el mensaje del usuario:
1. El identificador y nombre de la carpeta (por ejemplo `002-nombre-funcionalidad`). Si no lo indica, propón uno con el formato `NNN-nombre-kebab-case`.
2. La idea inicial o requerimiento general.

## Instrucciones de trabajo

1. **Lectura de contexto inicial:**
   - Lee y respeta `docs/constitution.md`, `AGENTS.md` y `@MEMORY.md`.
   - Recuerda que InventarioWeb Portfolio es una app de control interno monousuario, local-first (IndexedDB), sin login ni backend.

2. **Entrevista de clarificación (Paso a paso):**
   - Haz preguntas de **UNA en UNA** para resolver ambigüedades (casos límite, errores, datos faltantes, reglas de dominio y qué queda explícitamente fuera de alcance).
   - Máximo **5 preguntas** en total.
   - Espera la respuesta del usuario antes de formular la siguiente pregunta.
   - NO asumas decisiones de producto por tu cuenta.

3. **Generación del documento (`specs/NNN-nombre/spec.md`):**
   Una vez respondidas las preguntas y aclarados los casos límite, genera el archivo `specs/NNN-nombre/spec.md` con:
   - `Estado: borrador`
   - Contexto y objetivo (control interno local).
   - Usuarios (contexto de usuario local/demostración; sin roles ni cuentas).
   - Historias de usuario (`HU-x`).
   - Definiciones (solo si aplica).
   - Requisitos funcionales numerados (`RF-x`) con criterios en **notación EARS en español**:
     - *CUANDO [evento], EL SISTEMA [acción].*
     - *SI [condición], ENTONCES EL SISTEMA [acción].*
     - *MIENTRAS [estado], EL SISTEMA [restricción].*
     - *EL SISTEMA [capacidad/regla].*
   - Requisitos no funcionales (rendimiento local <100 ms, accesibilidad por teclado/ARIA, tokens visuales, piso mínimo de 12 px, responsividad 360–375 px).
   - Casos límite.
   - Fuera de alcance (excluir login, cuentas, sincronización externa o persistencia remota).
   - Criterios de finalización (compilación `npm run build`, Chrome DevTools, consola en cero y sincronización de `docs/figma-brief.md`).
   - Dudas abiertas (marcadas como `[NECESITA ACLARACIÓN]` si quedara algún punto pendiente).

4. **Regla de oro:**
   - Describe estrictamente el **QUÉ** y el **POR QUÉ**.
   - Prohibido incluir stack técnico, arquitectura interna, nombres de componentes o archivos de código: eso corresponde exclusivamente a `plan.md`.
   - NO escribas código en ningún momento durante esta fase.