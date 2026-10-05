---
name: feature
description: Planifica nuevas funcionalidades de InventarioWeb Portfolio con SDD y espera aprobación antes de modificar archivos.
---

# Planificación de funcionalidades

Usa esta skill cuando la persona proponga una funcionalidad nueva para InventarioWeb Portfolio y pida planificarla antes de implementarla.

## Reglas de ejecución

- Toma la idea descrita en el mensaje actual como el alcance de la funcionalidad. No esperes una variable `$ARGUMENTS` ni otros marcadores de plantilla.
- Trabaja en modo de planificación: no escribas código ni crees, edites, muevas o borres archivos. Entrega el plan y espera la aprobación explícita antes de pasar a especificación, implementación u otra fase.
- Antes de proponer el plan, lee `docs/constitution.md`, el `AGENTS.md` de la raíz y `MEMORY.md`. Si existe una especificación activa relacionada en `specs/`, lee su `spec.md`, `plan.md` y `tasks.md`; revisa el código pertinente para basar las responsabilidades en el proyecto real.
- Sigue el flujo y las plantillas de la skill local `sdd`. No asumas decisiones de dominio, persistencia, alcance o interacción que deban resolver las personas usuarias.
- Mantén la aplicación Portfolio local, de usuario único y sin autenticación ni servicios remotos. Cualquier propuesta que afecte IndexedDB debe explicar cómo preserva los registros actuales y evita migraciones destructivas.
- No recomiendes dependencias nuevas ni infraestructura de pruebas. La verificación prevista debe incluir `npm run build`; si cambia la interfaz, contempla Chrome DevTools, escritorio y viewports de 360–375 px, consola y desbordamiento horizontal.

## Formato del plan

Entrega un plan claro y específico de InventarioWeb con estas secciones:

1. **Enfoque funcional y de dominio:** propósito de control interno local, comportamiento esperado y efecto aditivo/no destructivo en IndexedDB.
2. **Alcance y archivos:** archivos que probablemente se crearían o modificarían y la responsabilidad concreta de cada uno. Basa la lista en el código existente y evita inventar archivos innecesarios.
3. **Casos límite y decisiones pendientes:** valores vacíos, normalización, datos históricos, privacidad, accesibilidad y tamaños móviles según correspondan. Enumera solo decisiones que realmente requieran respuesta; formula preguntas concretas y no las resuelvas por cuenta propia.
4. **Documentación y verificación:** impacto en `docs/figma-brief.md` para cambios visibles, notas futuras para `AGENTS.md` y `MEMORY.md`, y pasos de build y revisión en navegador.

Termina indicando que no se ha modificado ningún archivo y que esperas aprobación. Si la persona pide una especificación, auditoría o implementación en lugar de un plan, sigue la fase correspondiente de SDD y sus requisitos de aprobación; no uses esta skill para saltarte el flujo.
