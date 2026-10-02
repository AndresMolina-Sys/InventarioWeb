import { createSampleSnapshot, readLegacySnapshot } from "../data/demo";
import type { Category, CategoryDraft, InventoryItem, InventoryMovement, InventorySnapshot, ItemDraft, MovementItemSnapshot } from "../types";

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
};

let databasePromise: Promise<IDBDatabase> | null = null;

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
function normalizeMovement(value: unknown): InventoryMovement | null {
  if (typeof value !== "object" || value === null) return null;
  const movement = value as Partial<InventoryMovement>;
  if (typeof movement.id !== "string"
    || (movement.type !== "created" && movement.type !== "updated" && movement.type !== "deleted")
    || typeof movement.occurredAt !== "string"
    || !Number.isFinite(Date.parse(movement.occurredAt))) return null;

  const itemSnapshot = movement.itemSnapshot;
  const hasValidItemSnapshot = typeof itemSnapshot === "object"
    && itemSnapshot !== null
    && typeof itemSnapshot.code === "string"
    && typeof itemSnapshot.name === "string"
    && typeof itemSnapshot.categoryName === "string";

  return {
    id: movement.id,
    type: movement.type,
    occurredAt: movement.occurredAt,
    ...(hasValidItemSnapshot ? { itemSnapshot: itemSnapshot as MovementItemSnapshot } : {}),
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

function transactSnapshot<T>(change: (snapshot: InventorySnapshot) => SnapshotChange<T>): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOT_STORE);
    const request = store.get(SNAPSHOT_ID);
    let result: T;
    let operationError: unknown;

    request.onsuccess = () => {
      const stored = request.result as SnapshotRecord | undefined;
      const snapshot = (stored && normalizeSnapshot(stored.value))
        || readLegacySnapshot()
        || createSampleSnapshot();
      try {
        const update = change(snapshot);
        result = update.result;
        store.put({ id: SNAPSHOT_ID, value: update.snapshot } satisfies SnapshotRecord);
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

function movementItemSnapshot(item: InventoryItem, categories: Category[]): MovementItemSnapshot {
  return {
    code: item.code,
    name: item.name,
    categoryName: categories.find((category) => category.id === item.categoryId)?.name ?? "Sin categoría",
  };
}

function createMovement(type: InventoryMovement["type"], occurredAt: string, item: InventoryItem, categories: Category[]): InventoryMovement {
  return { id: crypto.randomUUID(), type, occurredAt, itemSnapshot: movementItemSnapshot(item, categories) };
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
  return transactSnapshot((snapshot) => ({ snapshot, result: snapshot }));
}

export function createItem(draft: ItemDraft): Promise<void> {
  return transactSnapshot((snapshot) => {
    validateItemDraft(draft, snapshot.items);
    const now = new Date().toISOString();
    const item: InventoryItem = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      serialNumber: draft.serialNumber.trim(),
      brand: draft.brand.trim(),
      model: draft.model.trim(),
      location: draft.location.trim() || "General",
      notes: draft.notes.trim(),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    return {
      snapshot: {
        ...snapshot,
        items: [item, ...snapshot.items],
        movements: [...snapshot.movements, createMovement("created", now, item, snapshot.categories)],
      },
      result: undefined,
    };
  });
}

export function updateItem(id: string, draft: ItemDraft): Promise<void> {
  return transactSnapshot((snapshot) => {
    const currentItem = snapshot.items.find((item) => item.id === id);
    if (!currentItem) throw new Error("El artículo ya no existe.");
    validateItemDraft(draft, snapshot.items, id);
    const now = new Date().toISOString();
    const updatedItem: InventoryItem = {
      ...currentItem,
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      serialNumber: draft.serialNumber.trim(),
      brand: draft.brand.trim(),
      model: draft.model.trim(),
      location: draft.location.trim() || "General",
      notes: draft.notes.trim(),
      updatedAt: now,
    };
    return {
      snapshot: {
        ...snapshot,
        items: snapshot.items.map((item) => item.id === id ? updatedItem : item),
        movements: [...snapshot.movements, createMovement("updated", now, updatedItem, snapshot.categories)],
      },
      result: undefined,
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
        movements: [...snapshot.movements, createMovement("deleted", now, deletedItem, snapshot.categories)],
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
