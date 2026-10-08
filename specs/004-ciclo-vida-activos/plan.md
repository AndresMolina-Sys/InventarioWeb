# Plan técnico — Ciclo de vida de los activos

## 1. Archivos y responsabilidades

- **`src/types.ts`**: definir los cuatro estados canónicos, el campo de estado compatible con datos ausentes o desconocidos, el borrador de artículo y los tipos versionados de auditoría. Mantener en inglés los nombres internos.
- **`src/lib/inventoryRepository.ts`**: concentrar la normalización de lectura, la matriz de transiciones, la validación del motivo, la comparación de cambios netos y las escrituras atómicas de artículo y movimiento. Proteger también las operaciones directas contra edición o borrado de un artículo dado de baja.
- **`src/data/demo.ts`**: inicializar los artículos de ejemplo nuevos como disponibles. Las importaciones históricas de `localStorage` conservarán intactos los artículos y el estado ausente; no inferirán ni escribirán una migración de ciclo de vida.
- **`src/App.tsx`**: integrar el estado en creación, tabla, modal de detalle (solo datos/estado e impresión, sin acciones Editar/Borrar), filtro, edición desde las tablas, confirmación de baja y detalle de movimientos. Las tablas mantienen sus acciones conforme a RF-13. Asegurar que un evento de estado sea una edición ordinaria con diff de Estado y motivo contextual; la actividad reciente ya cuenta todos los movimientos.
- **`src/styles.css`**: dar estilo a insignias, selector y filtro, avisos, controles de protección y confirmación; conservar tokens existentes, foco visible, piso tipográfico de 12 px y ajuste sin desbordamiento a 360–375 px.
- **`docs/figma-brief.md`**: documentar las insignias, filtro, selección en edición y diálogo irreversible de baja.
- **`AGENTS.md` y `MEMORY.md`**: consolidar estados, transiciones, incompatibilidades legacy, auditoría, motivo, protección del estado terminal y verificación una vez implementado el cambio.

No se crearán archivos ni dependencias nuevos. El brief, AGENTS y MEMORY se actualizarán en la fase final de implementación; el planner no los modifica.

## 2. Modelo de datos y evolución local

### Estados y artículos

Se usarán identificadores persistidos internos en inglés: `available`, `assigned`, `maintenance` y `decommissioned`, presentados como **Disponible**, **Asignado**, **En mantenimiento** y **De baja**. El campo de artículo admitirá la ausencia histórica (`undefined`, `null`, vacío o espacios) y texto desconocido para preservar exactamente los datos preexistentes. Solo los cuatro identificadores canónicos son valores nuevos válidos.

La lectura resolverá un estado ausente o vacío como `available` únicamente en la vista. No escribirá ese valor en IndexedDB. Un estado textual no canónico se conservará literalmente y se presentará como «Desconocido»; una selección y guardado explícitos adoptará el valor canónico elegido. Las opciones de creación serán los tres estados no terminales y se seleccionará `available` inicialmente.

### Movimientos

Se conserva el almacén actual y se versionan los movimientos nuevos para que puedan convivir con versiones anteriores:

```ts
type AssetLifecycleStatus =
  | "available"
  | "assigned"
  | "maintenance"
  | "decommissioned";

type InventoryItem = {
  // campos actuales
  status?: string | null; // opcional para lectura histórica; puede ser no canónico
};

// InventoryMovementAuditSnapshot conserva la forma actual de auditVersion: 1.
type InventoryMovementAuditSnapshotV2 = InventoryMovementAuditSnapshot & {
  status: string;
};

type Change<T> = { before: T; after: T };
type InventoryMovementChangesV2 = Partial<{
  code: Change<string>;
  name: Change<string>;
  categoryName: Change<string>;
  serialNumber: Change<string | null>;
  location: Change<string | null>;
  cost: Change<number | null>;
  brand: Change<string | null>;
  model: Change<string | null>;
  notes: Change<string | null>;
  status: Change<string>;
}>;

type UpdatedMovementV2Base = {
  auditVersion: 2;
  type: "updated";
  itemSnapshot: { code: string; name: string; categoryName: string };
  changes: NonEmpty<InventoryMovementChangesV2>;
};

type UpdatedMovementV2 =
  | (UpdatedMovementV2Base & {
      changes: NonEmpty<InventoryMovementChangesV2 & {
        status: { before: string; after: string };
      }>;
      reason: string; // obligatorio en toda transición, incluso si es ""
    })
  | (UpdatedMovementV2Base & {
      changes: NonEmpty<Omit<InventoryMovementChangesV2, "status">>;
      reason?: never; // una edición sin transición no tiene motivo de estado
    });

type CreatedMovementV2 = {
  auditVersion: 2;
  type: "created";
  itemSnapshot: InventoryMovementAuditSnapshotV2;
};

type DeletedMovementV2 = {
  auditVersion: 2;
  type: "deleted";
  itemSnapshot: InventoryMovementAuditSnapshotV2;
};
```

El tipo actual `InventoryMovementAuditSnapshot` y las uniones `Created/Updated/Deleted` con `auditVersion: 1` se conservan para leer los registros ya guardados. Se amplían los tipos de forma aditiva con snapshots completos y variantes `CreatedMovementV2`, `UpdatedMovementV2` y `DeletedMovementV2`; los eventos v1 no se reinterpretan ni reescriben. Altas y bajas v2 llevan la ficha completa con el estado inicial o previo. Las ediciones v2 conservan los campos auditados existentes y admiten Estado como campo adicional, sin cambiar las normalizaciones previas. Si el diff contiene Estado, `reason` es obligatorio en el evento y se guarda aparte de `changes`; cuando el motivo opcional está vacío su valor persistido es `""`. Si el diff no contiene Estado, el evento no lleva motivo y el motivo por sí solo nunca crea un movimiento.

Los movimientos de versión 1 e históricos sin versión se leerán y conservarán sin reescritura. Si carecen de snapshot o diff, la vista seguirá el comportamiento de `specs/001-movement-diff/spec.md`: mostrará los datos parciales existentes o indicará que no hay detalle histórico completo; para estado ausente usará «Dato no registrado». Nunca reconstruirá valores anteriores con el artículo actual.

### Compatibilidad y persistencia

No se agregan object stores, índices ni una nueva base. El campo `status` de artículo y los eventos `auditVersion: 2` son una ampliación persistida, no una migración destructiva. La lectura debe evitar una escritura incidental del snapshot completo; las transacciones de mutación tocarán únicamente el artículo objetivo y el movimiento correspondiente dentro de la escritura atómica existente. Un fallo de transacción no dejará artículo ni movimiento parcialmente guardados.

**Alcance de la autorización:** la solicitud original autorizó añadir `status` a los artículos persistidos y registrar los eventos de auditoría de estado descritos aquí. Esa autorización cubre únicamente esta ampliación aditiva y versionada; no volver a pedir autorización para esos cambios. Si la implementación descubre que requiere una migración destructiva o cambios persistidos fuera de ese alcance, detener esa parte y consultar al usuario. No se borrarán ni migrarán datos de usuario durante la verificación.

## 3. Reglas puras y persistencia

Las reglas de dominio se mantendrán en el repositorio existente, separadas de React:

1. `resolveAssetStatus(raw)` devuelve `available` si `raw` está ausente, es nulo, vacío o contiene solo espacios; si es uno de los cuatro valores canónicos, devuelve ese valor; de lo contrario conserva el texto original como desconocido. No muta el artículo ni persiste.
2. `getAllowedTransitions(current)` aplica exactamente la matriz aprobada. Desde un estado desconocido se permite la corrección explícita a cualquiera de los estados canónicos, incluido `decommissioned`; este último requiere el diálogo y motivo. Desde `decommissioned` no hay transiciones ni edición.
3. La comparación de cambios incluye `status` en el campo auditado. El valor anterior desconocido se compara y registra como su texto original; los estados válidos se comparan por identificador. Las reglas de `.trim()`, costos, categoría y demás campos conservan el comportamiento existente.
4. El motivo se recorta antes de persistir y de validar su longitud; vacío o solo espacios equivale a `""`. Para `decommissioned` se exige longitud recortada de 1–200 caracteres. En los otros cambios de estado es opcional y también queda limitado a 200 caracteres. El motivo nunca se agrega al diff ni produce por sí solo un movimiento.
5. Al guardar una edición normal, si no hay ningún cambio auditable, se devuelve `unchanged`: no se actualiza `updatedAt` ni se crea movimiento. Si Estado y/o otros campos cambian, se guardan el artículo y un único movimiento de edición juntos.
6. «Confirmar baja» constituye el guardado inmediato de la edición completa: estado final, otros campos con cambios netos, `updatedAt`, diff y motivo en una operación atómica. Cancelar o pulsar Escape no inicia una transacción.
7. `deleteItem` debe rechazar el borrado si el valor resuelto es `decommissioned`, incluso cuando se invoque sin pasar por la interfaz. Los demás borrados conservan su flujo actual y su snapshot con estado previo.

## 4. Interfaz, interacción y accesibilidad

- **Tabla de artículos**: agregar insignia de Estado y filtro «Todos» más los cuatro estados canónicos. Los filtros se combinan con búsqueda y categoría. Un estado desconocido solo aparece en «Todos» y la insignia muestra «Desconocido» con el valor original disponible como texto accesible; no se agrega un filtro desconocido.
- **Detalle**: mostrar la insignia y conservar consulta, movimientos, etiqueta, ficha técnica y «Cerrar» para todos los estados. El modal no ofrece Editar ni Borrar para ningún estado. La edición y sus cambios de estado se inician desde las tablas; al completar una baja el foco vuelve al botón «Ver» de la fila de origen.
- **Creación**: ofrecer Disponible, Asignado y En mantenimiento; no ofrecer De baja. Un artículo nuevo con selección inicial explícita genera un alta cuyo snapshot refleja ese estado.
- **Edición**: selector solo en «Editar artículo». Muestra el valor actual y los destinos permitidos. Los motivos opcionales aparecen solo cuando el estado seleccionado difiere del original. Un artículo legacy ausente o vacío se muestra como Disponible sin escribirlo por leer; un valor desconocido se ofrece como valor de origen restaurable y permite escoger explícitamente un canónico. Cancelar el formulario descarta todos los borradores.
- **Baja**: seleccionar De baja o guardar con De baja seleccionado abre confirmación irreversible. El motivo se escribe en ese diálogo; Confirmar baja permanece deshabilitado mientras el texto recortado no tenga 1–200 caracteres. Cancelar/Escape descarta solo el intento de baja, restaura el estado original exacto y devuelve foco al selector; los demás campos siguen como borrador. Confirmar persiste inmediatamente todos los cambios y cierra ambos diálogos. Tras éxito, devuelve el foco según el origen definido arriba.
- **Fallo local**: si IndexedDB rechaza la operación, confirmación y edición quedan abiertas con todos los borradores y motivo intactos. El diálogo muestra un `role="alert"` que indica que no se pudo guardar en la base local; permite reintentar o cancelar, sin escritura parcial.
- **Protección terminal**: para un artículo De baja, las acciones Editar y Borrar de las tablas quedan nativas `disabled` y `aria-disabled="true"`, con explicación accesible de la protección de auditoría. El modal de detalle no muestra esas acciones para ningún estado. Accesos directos al editor dejan campos deshabilitados y Guardar bloqueado.
- **Movimientos**: los eventos de estado siguen siendo «Edición». El detalle presenta la fila «Estado» Antes/Después y el motivo como contexto separado. Un valor previo no canónico se presenta como «Desconocido — [valor original]»; si falta en un evento histórico, muestra «Dato no registrado», nunca un valor inferido. Al ser un movimiento ordinario, se suma una vez a Actividad reciente.
- **Visual y adaptable**: badges no dependen solo del color; controles y avisos operan por teclado, con foco visible y texto mínimo de 12 px. Revisar el filtro, la tabla y los dos diálogos a 360 y 375 px sin desbordamiento horizontal. La baja y su confirmación deben conservar Escape, foco y mensajes accesibles.

## 5. Decisiones técnicas y alternativas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Guardar identificadores canónicos estables en inglés y traducirlos al español en la interfaz | Persistir etiquetas visibles localizadas | Mantiene identificadores internos estables y cumple la convención del proyecto; valores legacy no canónicos permanecen intactos. |
| Usar `auditVersion: 2` para las nuevas fichas/diffs con Estado | Cambiar silenciosamente la forma de versión 1 | Distingue campos completos de estado de snapshots anteriores y permite conservar el historial antiguo sin reinterpretarlo. |
| Resolver el default legacy durante lectura/presentación sin escritura | Migrar todos los artículos al abrir la base | Evita escrituras de usuario no solicitadas y preserva los datos byte a byte salvo el artículo guardado explícitamente. |
| Persistir motivo como contexto del movimiento, fuera de `changes` | Tratar el motivo como campo del artículo o diff | El motivo explica una transición, no es una propiedad permanente del activo ni un campo antes/después. |
| Confirmar De baja como guardado atómico e inmediato del formulario completo | Confirmar estado y requerir un segundo Guardar | La decisión aprobada evita una baja parcial o un estado terminal separado de los demás cambios confirmados. |
| Bloquear baja y borrado en UI y repositorio | Confiar únicamente en botones deshabilitados | Protege la irreversibilidad incluso ante llamadas directas a las operaciones locales. |
| Reutilizar IndexedDB y sus stores actuales | Crear un store o servicio nuevo | El snapshot ya transacciona artículos y movimientos juntos; no se justifica infraestructura adicional. |

## 6. Verificación y control de calidad

No hay pruebas automatizadas ni lint configurados y la constitución prohíbe añadir dependencias de pruebas. La verificación de implementación deberá:

1. Ejecutar `npm run build` tras cambios de código.
2. Usar Chrome DevTools con un perfil/dataset de QA aislado, nunca borrar ni alterar los datos reales del usuario. Comprobar escritorio y 360/375 px, consola sin errores/advertencias y ausencia de desbordamiento horizontal.
3. Cubrir alta con los tres destinos disponibles; estado legacy ausente/null/vacío; desconocido y corrección directa; badges, filtros combinados y filtro Todos.
4. Recorrer la matriz completa de transiciones y confirmar cada destino inválido, terminal y protección de editar/borrar De baja.
5. Revisar baja: motivo en blanco/espacios deshabilita Confirmar; motivo válido persiste todos los cambios y un solo movimiento; cancelación/Escape no persiste nada, restaura estado y foco, conserva los otros borradores; error transaccional conserva ambos diálogos y permite reintentar, sin escritura parcial.
6. Verificar creación, edición y baja en Movimientos: snapshots con estado pertinente, diff Estado antes/después, motivo separado, compatibilidad con versiones 1 e históricos sin snapshot, y conteo único de actividad reciente.
7. Verificar que el modal de detalle no muestre Editar/Borrar para ningún estado; que las tablas conserven sus acciones y bloqueen Editar/Borrar en De baja; que consulta e impresión sigan disponibles y que la operación directa de repositorio tampoco permita editar ni borrar una baja.
8. Revisar los cambios documentales de `docs/figma-brief.md`, `AGENTS.md` y `MEMORY.md`, sin cambiar la regla previa de normalización de otros campos auditados.

## 7. Matriz de trazabilidad

| Parte del plan | Requisitos funcionales | Principios constitucionales |
|---|---|---|
| Tipos y valores canónicos | RF-1, RF-2, RF-9, RF-10, RF-14 | P1, P2, P3, P5, P6 |
| Fallback legacy y estado desconocido | RF-1, RF-3, RF-12, RF-13, RF-14 | P2, P3, P5, P6 |
| Selección de alta y ejemplos | RF-2, RF-9, RF-10 | P2, P3, P5 |
| Matriz, normalización y reglas de motivo | RF-5, RF-6, RF-7, RF-8, RF-9 | P2, P3, P5, P6 |
| Transacciones y protección de baja/borrado | RF-6, RF-7, RF-9, RF-13, RF-14 | P2, P3, P5 |
| Tabla, detalle solo de consulta, edición desde tablas y filtro | RF-3, RF-4, RF-5, RF-8, RF-12, RF-13 | P2, P3, P5, P6 |
| Detalle de movimientos y actividad | RF-9, RF-10, RF-11, RF-13 | P2, P3, P5, P6 |
| Accesibilidad, estilos y responsive | RF-3, RF-4, RF-6, RF-7, RF-8, RF-12 | P2, P4, P6 |
| Build, Chrome y documentación final | RF-1–RF-14 | P2, P4, P5, P6 |

**Principios:** P1 stack simple y versiones fijadas; P2 coherencia entre spec y código; P3 separación de lógica e interfaz; P4 política de pruebas sin dependencias externas; P5 protección de los datos locales; P6 convenciones de idioma y nombres.
