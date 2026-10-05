---
name: sdd
description: Úsala siempre que trabajes con Spec-Driven Development en InventarioWeb Portfolio (docs/constitution.md o cualquier archivo dentro de specs/) — redactar, auditar o cambiar specs, planes y tareas, o implementar y verificar tareas de una spec.
---
# Spec-Driven Development (SDD) — InventarioWeb Portfolio

## Flujo de trabajo
Constitución → Spec → Auditoría QA/Clarificación → Plan → Tareas → Implementación Atómica → Verificación → Commit & Memoria.

- **Aprobación obligatoria:** Nunca pases a la siguiente fase sin la aprobación explícita del usuario.
- **La spec manda:** Si algo no está en la spec, no se escribe código. Si surge una duda o caso límite no previsto, para y pregunta antes de asumir.
- **Cascada de cambios:** Cualquier cambio de requisitos se aplica primero en `spec.md`, luego se ajusta en `plan.md` y `tasks.md`, y por último se traslada al código.
- **Aislamiento por funcionalidad:** Cada ciclo vive en su propia carpeta: `specs/NNN-nombre/` con `spec.md`, `plan.md` y `tasks.md`.
- **Cierre de ciclo:** Al terminar cada fase o tarea aprobada, actualiza `MEMORY.md` (y `AGENTS.md` si cambian reglas de dominio).

---

## 1. Plantilla de Especificación (`spec.md`)

```markdown
# Spec NNN — [Nombre de la Funcionalidad]
Estado: borrador | aprobada | implementada

## Contexto y objetivo
[Qué problema o necesidad resuelve dentro de InventarioWeb Portfolio y por qué]

## Usuarios
[Contexto de usuario local/demostración; sin roles ni cuentas de usuario]

## Historias de usuario
- HU-1. Como usuario del inventario local, quiero [acción] para [beneficio].

## Definiciones
[Solo si hay términos técnicos o de dominio que puedan interpretarse de varias formas]

## Requisitos funcionales (EARS en español)
- RF-01: CUANDO [evento del usuario o sistema], EL SISTEMA [respuesta esperada].
- RF-02: SI [condición de datos], ENTONCES EL SISTEMA [comportamiento específico].
- RF-03: MIENTRAS [estado activo], EL SISTEMA [restricción continua].
- RF-04: EL SISTEMA [capacidad o regla permanente de datos].

## Requisitos no funcionales
- Rendimiento local: operaciones en IndexedDB imperceptibles (<100 ms).
- Accesibilidad: navegación por teclado, roles ARIA y gestión de foco.
- Diseño y tokens: apego estricto a tokens de diseño, paleta de colores y piso tipográfico mínimo absoluto de 12 px (13 px en textos descriptivos/controles).
- Responsividad: soporte fluido en viewports móviles de 360–375 px sin desbordamiento horizontal (`overflow-x`).

## Casos límite
[Valores vacíos, textos con espacios residuales `.trim()`, costo cero vs nulo, concurrencia o límites de pantalla]

## Fuera de alcance
[Excluir explícitamente backend remoto, login/usuarios, dependencias externas no autorizadas o funciones secundarias]

## Criterios de finalización
- Verificación técnica: `npm run build` sin errores de compilación ni advertencias.
- Verificación UI: prueba con Chrome DevTools en escritorio y móvil (360 px y 375 px) con consola 100% limpia.
- Sincronización documental: `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md` actualizados.

## Dudas abiertas
- [NECESITA ACLARACIÓN] [Preguntas pendientes antes de aprobar la spec]