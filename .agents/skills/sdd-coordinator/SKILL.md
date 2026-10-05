---
name: sdd-coordinator
description: Coordina explícitamente el flujo SDD completo de InventarioWeb Portfolio en la sesión principal, delegando las fases a planner, implementer y reviewer.
---

# Coordinador SDD

Usa esta skill cuando la persona invoque `$sdd-coordinator` para coordinar una funcionalidad o una spec de InventarioWeb Portfolio.

1. Lee y sigue el guion del coordinador en `.codex/agents/coordinator.md`.
2. Opera como la sesión principal: pregunta a la persona, gestiona aprobaciones y delega en los perfiles Codex `planner`, `implementer` y `reviewer` definidos en `.codex/agents/`. Si el cliente no permite seleccionar perfiles al crear subagentes, pasa sus instrucciones de rol explícitamente.
3. Sigue las skills SDD locales correspondientes a cada fase y respeta las paradas obligatorias. Esta skill no concede permisos ni sustituye las aprobaciones del sandbox.
4. Para una solicitud pequeña que no requiera SDD, recomienda `$feature`.
