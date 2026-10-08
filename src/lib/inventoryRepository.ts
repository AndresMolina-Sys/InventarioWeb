import { createSampleSnapshot, readLegacySnapshot } from "../data/demo";
import type {
  AssetLifecycleStatus,
  Category,
  CategoryDraft,
  CreatedMovementV2,
  InventoryItem,
  InventoryMovement,
  InventoryMovementAuditField,
  InventoryMovementAuditSnapshot,
  InventoryMovementAuditSnapshotV2,
  InventoryMovementAuditSummary,
  InventoryMovementAuditFieldV2,
  InventoryMovementChanges,
  InventoryMovementChangesV2,
  InventoryMovementFieldChange,
  InventorySnapshot,
  ItemDraft,
  MovementItemSnapshot,
  NonEmptyInventoryMovementChanges,
  UpdatedMovementV2,
} from "../types";

const DATABASE_NAME = "inventario-web-portfolio";
const DATABASE_VERSION = 1;
const SNAPSHOT_STORE = "snapshots";
const SNAPSHOT_ID = "current";

type SnapshotRecord = {
  id: string;
  value: InventorySnapshot;
};

type SnapshotChange<T> = {
  snapshot: InventorySnapshot;
  result: T;
  persist?: boolean;
};

type SnapshotSource = "indexeddb" | "legacy" | "samples";

type NonEmptyInventoryMovementChangesV2 = {
  [Field in InventoryMovementAuditFieldV2]: Required<Pick<InventoryMovementChangesV2, Field>>
    & Partial<Omit<InventoryMovementChangesV2, Field>>;
}[InventoryMovementAuditFieldV2];

type UpdatedMovementV2WithStatus = Extract<UpdatedMovementV2, { reason: string }>;
type UpdatedMovementV2WithoutStatus = Extract<UpdatedMovementV2, { reason?: never }>;

export type UpdateItemResult = "updated" | "unchanged";

export type UpdateItemDraft = ItemDraft & {
  reason?: string | null;
};

export type ResolvedAssetStatus =
  | { kind: "canonical"; value: AssetLifecycleStatus }
  | { kind: "unknown"; value: string };

const INITIAL_ASSET_LIFECYCLE_STATUSES = ["available", "assigned", "maintenance"] as const satisfies readonly AssetLifecycleStatus[];

const ASSET_LIFECYCLE_STATUSES: readonly AssetLifecycleStatus[] = [
  "available",
  "assigned",
  "maintenance",
  "decommissioned",
];

const ALLOWED_ASSET_STATUS_TRANSITIONS: Record<AssetLifecycleStatus, readonly AssetLifecycleStatus[]> = {
  available: ["assigned", "maintenance", "decommissioned"],
  assigned: ["available", "maintenance", "decommissioned"],
  maintenance: ["available", "decommissioned"],
  decommissioned: [],
};

type AuditableItem = Pick<
  InventoryItem,
  "code" | "name" | "categoryId" | "serialNumber" | "location" | "cost" | "brand" | "model" | "notes"
>;

let databasePromise: Promise<IDBDatabase> | null = null;

type InitialAssetLifecycleStatus = typeof INITIAL_ASSET_LIFECYCLE_STATUSES[number];

type NewInventoryItem = InventoryItem & {
  status: InitialAssetLifecycleStatus;
};

function isInitialAssetLifecycleStatus(value: string): value is InitialAssetLifecycleStatus {
  return INITIAL_ASSET_LIFECYCLE_STATUSES.includes(value as InitialAssetLifecycleStatus);
}

function isAssetLifecycleStatus(value: string): value is AssetLifecycleStatus {
  return ASSET_LIFECYCLE_STATUSES.includes(value as AssetLifecycleStatus);
}

export function resolveAssetStatus(raw: string | null | undefined): ResolvedAssetStatus {
  if (raw == null || raw.trim() === "") {
    return { kind: "canonical", value: "available" };
  }
  return isAssetLifecycleStatus(raw)
    ? { kind: "canonical", value: raw }
    : { kind: "unknown", value: raw };
}

export function getAllowedTransitions(current: string | null | undefined): readonly AssetLifecycleStatus[] {
  const resolvedStatus = resolveAssetStatus(current);
  return resolvedStatus.kind === "unknown"
    ? ASSET_LIFECYCLE_STATUSES
    : ALLOWED_ASSET_STATUS_TRANSITIONS[resolvedStatus.value];
}

export function normalizeAssetStatusReason(
  status: AssetLifecycleStatus,
  reason: string | null | undefined = "",
): string {
  const normalizedReason = reason?.trim() ?? "";
  if (normalizedReason.length > 200) {
    throw new Error("El motivo no puede superar los 200 caracteres.");
  }
  if (status === "decommissioned" && normalizedReason.length === 0) {
    throw new Error("Escribe el motivo de la baja.");
  }
  return normalizedReason;
}

export function assetStatusesMatch(
  before: string | null | undefined,
  after: string | null | undefined,
): boolean {
  const resolvedBefore = resolveAssetStatus(before);
  const resolvedAfter = resolveAssetStatus(after);
  return resolvedBefore.kind === resolvedAfter.kind
    && resolvedBefore.value === resolvedAfter.value;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Este navegador no permite guardar datos locales en IndexedDB."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SNAPSHOT_STORE)) {
        request.result.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("No se pudo abrir la base local."));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("Cierra otras pestañas de InventarioWeb para actualizar la base local."));
    };
  });
  return databasePromise;
}

function isCompleteAuditSnapshot(value: unknown): value is InventoryMovementAuditSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const snapshot = value as Partial<InventoryMovementAuditSnapshot>;
  const isOptionalText = (field: unknown) => field === null || typeof field === "string";

  return typeof snapshot.code === "string"
    && typeof snapshot.name === "string"
    && typeof snapshot.categoryName === "string"
    && isOptionalText(snapshot.serialNumber)
    && isOptionalText(snapshot.location)
    && (snapshot.cost === null || (typeof snapshot.cost === "number" && Number.isFinite(snapshot.cost)))
    && isOptionalText(snapshot.brand)
    && isOptionalText(snapshot.model)
    && isOptionalText(snapshot.notes);
}

function isCompleteAuditSnapshotV2(value: unknown): value is InventoryMovementAuditSnapshotV2 {
  return isCompleteAuditSnapshot(value)
    && typeof (value as Partial<InventoryMovementAuditSnapshotV2>).status === "string";
}

function normalizeAuditChanges(value: unknown): NonEmptyInventoryMovementChanges | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const allowedFields: InventoryMovementAuditField[] = [
    "code",
    "name",
    "categoryName",
    "serialNumber",
    "location",
    "cost",
    "brand",
    "model",
    "notes",
  ];
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([field]) => !allowedFields.includes(field as InventoryMovementAuditField))) {
    return null;
  }

  for (const [field, change] of entries) {
    if (typeof change !== "object" || change === null || Array.isArray(change)) return null;
    const pair = change as { before?: unknown; after?: unknown };
    if (!("before" in change) || !("after" in change)) return null;

    const isCost = field === "cost";
    const validValue = (item: unknown) => isCost
      ? item === null || (typeof item === "number" && Number.isFinite(item))
      : field === "code" || field === "name" || field === "categoryName"
        ? typeof item === "string"
        : item === null || typeof item === "string";
    if (!validValue(pair.before) || !validValue(pair.after)) return null;
  }

  return value as NonEmptyInventoryMovementChanges;
}

function normalizeAuditChangesV2(value: unknown): NonEmptyInventoryMovementChangesV2 | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const allowedFields: InventoryMovementAuditFieldV2[] = [
    "code",
    "name",
    "categoryName",
    "serialNumber",
    "location",
    "cost",
    "brand",
    "model",
    "notes",
    "status",
  ];
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([field]) => !allowedFields.includes(field as InventoryMovementAuditFieldV2))) {
    return null;
  }

  for (const [field, change] of entries) {
    if (typeof change !== "object" || change === null || Array.isArray(change)) return null;
    const pair = change as { before?: unknown; after?: unknown };
    if (!("before" in change) || !("after" in change)) return null;

    const isCost = field === "cost";
    const isRequiredText = field === "code" || field === "name" || field === "categoryName" || field === "status";
    const validValue = (item: unknown) => isCost
      ? item === null || (typeof item === "number" && Number.isFinite(item))
      : isRequiredText
        ? typeof item === "string"
        : item === null || typeof item === "string";
    if (!validValue(pair.before) || !validValue(pair.after)) return null;
  }

  return value as NonEmptyInventoryMovementChangesV2;
}

function normalizeHistoricalAuditSnapshot(value: unknown): Partial<InventoryMovementAuditSnapshot> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const snapshot = value as Partial<Record<keyof InventoryMovementAuditSnapshot, unknown>>;
  const isOptionalText = (field: unknown): field is string | null => field === null || typeof field === "string";

  return {
    ...(typeof snapshot.code === "string" ? { code: snapshot.code } : {}),
    ...(typeof snapshot.name === "string" ? { name: snapshot.name } : {}),
    ...(typeof snapshot.categoryName === "string" ? { categoryName: snapshot.categoryName } : {}),
    ...(isOptionalText(snapshot.serialNumber) ? { serialNumber: snapshot.serialNumber } : {}),
    ...(isOptionalText(snapshot.location) ? { location: snapshot.location } : {}),
    ...(snapshot.cost === null || (typeof snapshot.cost === "number" && Number.isFinite(snapshot.cost))
      ? { cost: snapshot.cost }
      : {}),
    ...(isOptionalText(snapshot.brand) ? { brand: snapshot.brand } : {}),
    ...(isOptionalText(snapshot.model) ? { model: snapshot.model } : {}),
    ...(isOptionalText(snapshot.notes) ? { notes: snapshot.notes } : {}),
  };
}

function normalizeMovement(value: unknown): InventoryMovement | null {
  if (typeof value !== "object" || value === null) return null;
  const movement = value as Partial<InventoryMovement>;
  if (typeof movement.id !== "string"
    || (movement.type !== "created" && movement.type !== "updated" && movement.type !== "deleted")
    || typeof movement.occurredAt !== "string"
    || !Number.isFinite(Date.parse(movement.occurredAt))) return null;

  const itemSnapshot = movement.itemSnapshot;
  const hasCompleteItemSummary = typeof itemSnapshot === "object"
    && itemSnapshot !== null
    && typeof itemSnapshot.code === "string"
    && typeof itemSnapshot.name === "string"
    && typeof itemSnapshot.categoryName === "string";

  if (movement.auditVersion === 2
    && movement.type === "created"
    && isCompleteAuditSnapshotV2(itemSnapshot)) {
    return {
      id: movement.id,
      type: "created",
      occurredAt: movement.occurredAt,
      auditVersion: 2,
      itemSnapshot,
    };
  }

  if (movement.auditVersion === 1
    && (movement.type === "created" || movement.type === "deleted")
    && isCompleteAuditSnapshot(itemSnapshot)) {
    return {
      id: movement.id,
      type: movement.type,
      occurredAt: movement.occurredAt,
      auditVersion: 1,
      itemSnapshot,
    };
  }

  const changes = movement.auditVersion === 1 && movement.type === "updated"
    ? normalizeAuditChanges(movement.changes)
    : null;
  if (movement.auditVersion === 1 && movement.type === "updated" && hasCompleteItemSummary && changes) {
    return {
      id: movement.id,
      type: "updated",
      occurredAt: movement.occurredAt,
      auditVersion: 1,
      itemSnapshot: itemSnapshot as Pick<InventoryMovementAuditSnapshot, "code" | "name" | "categoryName">,
      changes,
    };
  }

  const changesV2 = movement.auditVersion === 2 && movement.type === "updated"
    ? normalizeAuditChangesV2(movement.changes)
    : null;
  const hasStatusChange = changesV2 !== null
    && Object.prototype.hasOwnProperty.call(changesV2, "status");
  if (movement.auditVersion === 2
    && movement.type === "updated"
    && hasCompleteItemSummary
    && changesV2
    && (hasStatusChange ? typeof movement.reason === "string" : movement.reason === undefined)) {
    const base = {
      id: movement.id,
      type: "updated" as const,
      occurredAt: movement.occurredAt,
      auditVersion: 2 as const,
      itemSnapshot: itemSnapshot as InventoryMovementAuditSummary,
    };
    return hasStatusChange
      ? {
          ...base,
          changes: changesV2 as UpdatedMovementV2WithStatus["changes"],
          reason: movement.reason as string,
        }
      : {
          ...base,
          changes: changesV2 as UpdatedMovementV2WithoutStatus["changes"],
        };
  }

  const historicalItemSnapshot = normalizeHistoricalAuditSnapshot(itemSnapshot);
  return {
    id: movement.id,
    type: movement.type,
    occurredAt: movement.occurredAt,
    ...(historicalItemSnapshot ? { itemSnapshot: historicalItemSnapshot } : {}),
  };
}

function normalizeSnapshot(value: unknown): InventorySnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { categories?: unknown; items?: unknown; movements?: unknown };
  if (!Array.isArray(record.categories) || !Array.isArray(record.items)) return null;
  return {
    categories: record.categories as Category[],
    items: record.items as InventoryItem[],
    movements: Array.isArray(record.movements)
      ? record.movements.map(normalizeMovement).filter((movement): movement is InventoryMovement => movement !== null)
      : [],
  };
}

function transactSnapshot<T>(
  change: (snapshot: InventorySnapshot, source: SnapshotSource) => SnapshotChange<T>,
): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOT_STORE);
    const request = store.get(SNAPSHOT_ID);
    let result: T;
    let operationError: unknown;

    request.onsuccess = () => {
      const stored = request.result as SnapshotRecord | undefined;
      const storedSnapshot = stored ? normalizeSnapshot(stored.value) : null;
      const legacySnapshot = storedSnapshot ? null : readLegacySnapshot();
      const source: SnapshotSource = stored
        ? "indexeddb"
        : legacySnapshot
          ? "legacy"
          : "samples";
      const snapshot = storedSnapshot || legacySnapshot || createSampleSnapshot();
      try {
        const update = change(snapshot, source);
        result = update.result;
        if (update.persist !== false) {
          store.put({ id: SNAPSHOT_ID, value: update.snapshot } satisfies SnapshotRecord);
        }
      } catch (error) {
        operationError = error;
        transaction.abort();
      }
    };

    request.onerror = () => {
      operationError = request.error;
      transaction.abort();
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(operationError ?? transaction.error ?? new Error("No se pudo guardar el cambio local."));
    transaction.onerror = () => {
      operationError = transaction.error ?? new Error("No se pudo guardar el cambio local.");
    };
  }));
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("es-CR");
}

function normalizeAuditText(value: string): string {
  return value.trim();
}

function normalizeOptionalAuditText(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function normalizeAuditCost(value: number | null | undefined): number | null {
  return value ?? null;
}

function auditCostsMatch(before: number | null, after: number | null): boolean {
  const normalizedBefore = before === 0 ? null : before;
  const normalizedAfter = after === 0 ? null : after;
  return normalizedBefore === normalizedAfter;
}

function normalizeAuditSnapshot(item: AuditableItem, categoryName: string): InventoryMovementAuditSnapshot {
  return {
    code: normalizeAuditText(item.code),
    name: normalizeAuditText(item.name),
    categoryName: normalizeAuditText(categoryName),
    serialNumber: normalizeOptionalAuditText(item.serialNumber),
    location: normalizeOptionalAuditText(item.location),
    cost: normalizeAuditCost(item.cost),
    brand: normalizeOptionalAuditText(item.brand),
    model: normalizeOptionalAuditText(item.model),
    notes: normalizeOptionalAuditText(item.notes),
  };
}

function auditValuesMatch<Field extends InventoryMovementAuditField>(
  field: Field,
  before: InventoryMovementAuditSnapshot[Field],
  after: InventoryMovementAuditSnapshot[Field],
): boolean {
  if (field === "cost") {
    return auditCostsMatch(before as number | null, after as number | null);
  }
  return before === after;
}

function auditFieldChange<Field extends InventoryMovementAuditField>(
  before: InventoryMovementAuditSnapshot[Field],
  after: InventoryMovementAuditSnapshot[Field],
): InventoryMovementFieldChange<Field> {
  return { before, after };
}

export function createInventoryMovementAuditSnapshot(
  item: AuditableItem,
  categoryName: string,
): InventoryMovementAuditSnapshot {
  return normalizeAuditSnapshot(item, categoryName);
}

export function calculateInventoryMovementChanges(
  beforeItem: AuditableItem,
  beforeCategoryName: string,
  afterItem: AuditableItem,
  afterCategoryName: string,
): NonEmptyInventoryMovementChanges | null {
  const before = normalizeAuditSnapshot(beforeItem, beforeCategoryName);
  const after = normalizeAuditSnapshot(afterItem, afterCategoryName);
  const fields: InventoryMovementAuditField[] = [
    "code",
    "name",
    "categoryName",
    "serialNumber",
    "location",
    "cost",
    "brand",
    "model",
    "notes",
  ];
  const changes: InventoryMovementChanges = {};

  for (const field of fields) {
    const hasChanged = field === "categoryName"
      ? beforeItem.categoryId !== afterItem.categoryId
      : !auditValuesMatch(field, before[field], after[field]);
    if (!hasChanged) continue;

    Object.assign(changes, {
      [field]: auditFieldChange(before[field], after[field]),
    });
  }

  return Object.keys(changes).length > 0
    ? changes as NonEmptyInventoryMovementChanges
    : null;
}

function calculateInventoryMovementChangesV2(
  beforeItem: InventoryItem,
  beforeCategoryName: string,
  afterItem: InventoryItem,
  afterCategoryName: string,
): NonEmptyInventoryMovementChangesV2 | null {
  const changes: InventoryMovementChangesV2 = {
    ...(calculateInventoryMovementChanges(
      beforeItem,
      beforeCategoryName,
      afterItem,
      afterCategoryName,
    ) ?? {}),
  };

  if (!assetStatusesMatch(beforeItem.status, afterItem.status)) {
    changes.status = {
      before: resolveAssetStatus(beforeItem.status).value,
      after: resolveAssetStatus(afterItem.status).value,
    };
  }

  return Object.keys(changes).length > 0
    ? changes as NonEmptyInventoryMovementChangesV2
    : null;
}

function movementItemSnapshot(item: InventoryItem, categories: Category[]): MovementItemSnapshot {
  return {
    code: item.code,
    name: item.name,
    categoryName: categories.find((category) => category.id === item.categoryId)?.name ?? "Sin categoría",
  };
}

function createVersionedMovement(
  type: "created" | "deleted",
  occurredAt: string,
  item: InventoryItem,
  categories: Category[],
): Extract<InventoryMovement, { type: "created" | "deleted" }> {
  const movement = {
    id: crypto.randomUUID(),
    occurredAt,
    auditVersion: 1 as const,
    itemSnapshot: createInventoryMovementAuditSnapshot(
      item,
      movementItemSnapshot(item, categories).categoryName,
    ),
  };

  return type === "created"
    ? { ...movement, type: "created" }
    : { ...movement, type: "deleted" };
}

function createCreatedMovementV2(
  occurredAt: string,
  item: NewInventoryItem,
  categories: Category[],
): CreatedMovementV2 {
  const itemSnapshot = createInventoryMovementAuditSnapshot(
    item,
    movementItemSnapshot(item, categories).categoryName,
  );
  return {
    id: crypto.randomUUID(),
    type: "created",
    occurredAt,
    auditVersion: 2,
    itemSnapshot: { ...itemSnapshot, status: item.status },
  };
}

function validateItemDraft(draft: ItemDraft, items: InventoryItem[], currentId?: string): void {
  if (!draft.code.trim()) throw new Error("Escribe el código del artículo.");
  if (!draft.name.trim()) throw new Error("Escribe el nombre del artículo.");
  if (items.some((item) => item.id !== currentId && normalized(item.code) === normalized(draft.code))) {
    throw new Error("Ya existe un artículo con ese código.");
  }
  const serialNumber = draft.serialNumber.trim();
  if (serialNumber && items.some((item) => item.id !== currentId && normalized(item.serialNumber) === normalized(serialNumber))) {
    throw new Error("Ya existe un artículo con ese número de serie.");
  }
  if (!Number.isFinite(draft.cost) && draft.cost !== null) {
    throw new Error("El costo debe ser un número válido.");
  }
  if (draft.cost !== null && draft.cost < 0) {
    throw new Error("El costo no puede ser negativo.");
  }
}

function validateCategoryName(name: string, categories: Category[], currentId?: string): string {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Escribe el nombre de la categoría.");
  if (categories.some((category) => category.id !== currentId && normalized(category.name) === normalized(trimmedName))) {
    throw new Error("Ya existe una categoría con ese nombre.");
  }
  return trimmedName;
}

export function loadSnapshot(): Promise<InventorySnapshot> {
  return transactSnapshot((snapshot, source) => ({
    snapshot,
    result: snapshot,
    persist: source !== "indexeddb",
  }));
}

export function createItem(draft: ItemDraft): Promise<void> {
  return transactSnapshot((snapshot) => {
    validateItemDraft(draft, snapshot.items);
    const status = draft.status ?? "available";
    if (!isInitialAssetLifecycleStatus(status)) {
      throw new Error("El estado inicial debe ser Disponible, Asignado o En mantenimiento.");
    }
    const now = new Date().toISOString();
    const item: NewInventoryItem = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      serialNumber: draft.serialNumber.trim(),
      brand: draft.brand.trim(),
      model: draft.model.trim(),
      location: draft.location.trim(),
      notes: draft.notes.trim(),
      status,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    return {
      snapshot: {
        ...snapshot,
        items: [item, ...snapshot.items],
        movements: [...snapshot.movements, createCreatedMovementV2(now, item, snapshot.categories)],
      },
      result: undefined,
    };
  });
}

export function updateItem(id: string, draft: UpdateItemDraft): Promise<UpdateItemResult> {
  return transactSnapshot((snapshot) => {
    const currentItem = snapshot.items.find((item) => item.id === id);
    if (!currentItem) throw new Error("El artículo ya no existe.");
    const { reason, ...itemDraft } = draft;
    validateItemDraft(itemDraft, snapshot.items, id);
    const candidateItem: InventoryItem = {
      ...currentItem,
      ...itemDraft,
      status: itemDraft.status === undefined ? currentItem.status : itemDraft.status,
      code: itemDraft.code.trim(),
      name: itemDraft.name.trim(),
      sku: itemDraft.sku.trim(),
      serialNumber: itemDraft.serialNumber.trim(),
      brand: itemDraft.brand.trim(),
      model: itemDraft.model.trim(),
      location: itemDraft.location.trim(),
      notes: itemDraft.notes.trim(),
    };

    const statusChanged = !assetStatusesMatch(currentItem.status, candidateItem.status);
    let statusReason: string | undefined;
    if (statusChanged) {
      const nextStatus = resolveAssetStatus(candidateItem.status);
      if (nextStatus.kind !== "canonical") {
        throw new Error("Selecciona un estado válido para el artículo.");
      }
      if (!getAllowedTransitions(currentItem.status).includes(nextStatus.value)) {
        throw new Error("La transición de estado no está permitida.");
      }
      candidateItem.status = nextStatus.value;
      statusReason = normalizeAssetStatusReason(nextStatus.value, reason);
    }

    const beforeCategoryName = movementItemSnapshot(currentItem, snapshot.categories).categoryName;
    const afterCategoryName = movementItemSnapshot(candidateItem, snapshot.categories).categoryName;
    const changes = calculateInventoryMovementChangesV2(
      currentItem,
      beforeCategoryName,
      candidateItem,
      afterCategoryName,
    );
    if (!changes) {
      return { snapshot, result: "unchanged", persist: false };
    }

    const now = new Date().toISOString();
    const updatedItem = { ...candidateItem, updatedAt: now };
    const auditSnapshot = createInventoryMovementAuditSnapshot(updatedItem, afterCategoryName);
    const movementBase = {
      id: crypto.randomUUID(),
      type: "updated" as const,
      occurredAt: now,
      auditVersion: 2 as const,
      itemSnapshot: {
        code: auditSnapshot.code,
        name: auditSnapshot.name,
        categoryName: auditSnapshot.categoryName,
      },
    };
    const movement: InventoryMovement = statusChanged
      ? {
          ...movementBase,
          changes: changes as UpdatedMovementV2WithStatus["changes"],
          reason: statusReason ?? "",
        }
      : {
          ...movementBase,
          changes: changes as UpdatedMovementV2WithoutStatus["changes"],
        };

    return {
      snapshot: {
        ...snapshot,
        items: snapshot.items.map((item) => item.id === id ? updatedItem : item),
        movements: [...snapshot.movements, movement],
      },
      result: "updated",
    };
  });
}

export function deleteItem(id: string): Promise<void> {
  return transactSnapshot((snapshot) => {
    const deletedItem = snapshot.items.find((item) => item.id === id);
    if (!deletedItem) {
      return { snapshot, result: undefined };
    }
    const now = new Date().toISOString();
    return {
      snapshot: {
        ...snapshot,
        items: snapshot.items.filter((item) => item.id !== id),
        movements: [...snapshot.movements, createVersionedMovement("deleted", now, deletedItem, snapshot.categories)],
      },
      result: undefined,
    };
  });
}

export function createCategory(draft: CategoryDraft): Promise<void> {
  return transactSnapshot((snapshot) => {
    const name = validateCategoryName(draft.name, snapshot.categories);
    const category = { id: crypto.randomUUID(), name };
    return { snapshot: { ...snapshot, categories: [...snapshot.categories, category] }, result: undefined };
  });
}

export function updateCategory(id: string, draft: CategoryDraft): Promise<void> {
  return transactSnapshot((snapshot) => {
    if (!snapshot.categories.some((category) => category.id === id)) throw new Error("La categoría ya no existe.");
    const name = validateCategoryName(draft.name, snapshot.categories, id);
    return {
      snapshot: {
        ...snapshot,
        categories: snapshot.categories.map((category) => category.id === id ? { ...category, name } : category),
      },
      result: undefined,
    };
  });
}

export function deleteCategory(id: string): Promise<void> {
  return transactSnapshot((snapshot) => {
    const category = snapshot.categories.find((entry) => entry.id === id);
    if (!category) throw new Error("La categoría ya no existe.");
    const itemCount = snapshot.items.filter((item) => item.categoryId === id).length;
    if (itemCount > 0) {
      throw new Error(`No se puede borrar «${category.name}» porque tiene ${itemCount} artículo(s) asociado(s).`);
    }
    return {
      snapshot: { ...snapshot, categories: snapshot.categories.filter((entry) => entry.id !== id) },
      result: undefined,
    };
  });
}
