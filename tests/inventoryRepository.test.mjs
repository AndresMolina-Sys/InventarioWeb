import assert from "node:assert/strict";
import test from "node:test";
import { serializeCsvRows } from "../src/features/inventory/csvExport.ts";
import { clearAndVerifyInventory } from "../src/features/settings/clearInventoryAction.ts";
import { localizeAppError } from "../src/lib/appError.ts";

const memory = {
  database: null,
  failNextPut: false,
  legacy: new Map(),
};

class MemoryTransaction {
  constructor(records) {
    this.records = records;
    this.aborted = false;
    this.oncomplete = null;
    this.onabort = null;
    this.onerror = null;
  }

  objectStore() {
    return {
      get: (key) => {
        const request = { result: undefined, error: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          if (this.aborted) return;
          request.result = this.records.has(key) ? structuredClone(this.records.get(key)) : undefined;
          request.onsuccess?.({ target: request });
          queueMicrotask(() => {
            if (!this.aborted) this.oncomplete?.({ target: this });
          });
        });
        return request;
      },
      put: (record) => {
        if (memory.failNextPut) {
          memory.failNextPut = false;
          throw new Error("Fallo de escritura inyectado por la prueba.");
        }
        const request = { result: record.id, error: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          if (this.aborted) return;
          this.records.set(record.id, structuredClone(record));
          request.onsuccess?.({ target: request });
        });
        return request;
      },
    };
  }

  abort() {
    if (this.aborted) return;
    this.aborted = true;
    queueMicrotask(() => this.onabort?.({ target: this }));
  }
}

class MemoryDatabase {
  constructor() {
    this.records = new Map();
    this.objectStoreNames = { contains: (name) => name === "snapshots" };
  }

  createObjectStore() {
    return {};
  }

  transaction() {
    return new MemoryTransaction(this.records);
  }

  close() {}
}

function installBrowserStorage() {
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open() {
        const request = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          if (!memory.database) {
            memory.database = new MemoryDatabase();
            request.result = memory.database;
            request.onupgradeneeded?.({ target: request });
          }
          request.result = memory.database;
          request.onsuccess?.({ target: request });
        });
        return request;
      },
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => memory.legacy.get(key) ?? null,
      removeItem: (key) => memory.legacy.delete(key),
      setItem: (key, value) => memory.legacy.set(key, String(value)),
    },
  });
  Object.defineProperty(globalThis, "BroadcastChannel", { configurable: true, value: undefined });
}

function resetStorage() {
  memory.database = null;
  memory.failNextPut = false;
  memory.legacy.clear();
}

let repositorySequence = 0;

async function loadRepository() {
  repositorySequence += 1;
  return import(`../src/lib/inventoryRepository.ts?test=${repositorySequence}`);
}

function draftFor(categoryId, overrides = {}) {
  return {
    code: "QA-TEST-001",
    name: "Equipo de prueba",
    sku: "",
    serialNumber: "SER-001",
    brand: "Marca QA",
    model: "Modelo QA",
    location: "Almacén",
    notes: "",
    categoryId,
    cost: 0,
    status: "available",
    ...overrides,
  };
}

installBrowserStorage();

test("el vaciado informa error si falla la verificación posterior al commit", async () => {
  let committed = false;
  const result = await clearAndVerifyInventory(
    async () => { committed = true; },
    async () => {
      assert.equal(committed, true);
      throw new Error("Fallo de lectura simulado.");
    },
  );

  assert.deepEqual(result, { status: "verification-error" });
});

test("el vaciado no informa éxito si la verificación devuelve registros", async () => {
  const snapshot = { categories: [{ id: "cat" }], items: [], movements: [] };
  const result = await clearAndVerifyInventory(async () => {}, async () => snapshot);

  assert.deepEqual(result, { status: "verification-error", snapshot });
});

test("el CSV neutraliza fórmulas y conserva el escape de comillas", () => {
  const csv = serializeCsvRows([[
    "=1+1",
    " +SUM(1,2)",
    "-cmd",
    "@SUM(1,2)",
    "＝1+1",
    'Equipo, "especial"',
  ]]);

  assert.equal(csv, '"\t=1+1","\t +SUM(1,2)","\t-cmd","\t@SUM(1,2)","\t＝1+1","Equipo, ""especial"""');
});

test("localiza el conflicto entre pestañas y el motivo requerido de baja", () => {
  assert.equal(
    localizeAppError("El inventario cambió en otra pestaña. Recarga los datos antes de guardar.", "es"),
    "El inventario cambió en otra pestaña. Recarga los datos antes de guardar.",
  );
  assert.equal(
    localizeAppError("El inventario cambió en otra pestaña. Recarga los datos antes de guardar.", "en"),
    "The inventory changed in another tab. Reload the data before saving.",
  );
  assert.equal(localizeAppError("Escribe el motivo de la baja.", "es"), "Motivo de la baja");
  assert.equal(localizeAppError("Escribe el motivo de la baja.", "en"), "Decommissioning reason");
});

test("resuelve estados y valida transiciones y motivos", async () => {
  resetStorage();
  const repository = await loadRepository();

  for (const missing of [undefined, null, "", "  "]) {
    assert.deepEqual(repository.resolveAssetStatus(missing), { kind: "canonical", value: "available" });
  }
  assert.deepEqual(repository.resolveAssetStatus("En taller"), { kind: "unknown", value: "En taller" });
  assert.deepEqual([...repository.getAllowedTransitions("available")], ["assigned", "maintenance", "decommissioned"]);
  assert.deepEqual([...repository.getAllowedTransitions("assigned")], ["available", "maintenance", "decommissioned"]);
  assert.deepEqual([...repository.getAllowedTransitions("maintenance")], ["available", "decommissioned"]);
  assert.deepEqual([...repository.getAllowedTransitions("decommissioned")], []);
  assert.deepEqual([...repository.getAllowedTransitions("En taller")], ["available", "assigned", "maintenance", "decommissioned"]);
  assert.equal(repository.normalizeAssetStatusReason("assigned", "  Reasignación  "), "Reasignación");
  assert.equal(repository.normalizeAssetStatusReason("maintenance", "   "), "");
  assert.throws(() => repository.normalizeAssetStatusReason("decommissioned", "  "), /motivo de la baja/i);
  assert.throws(() => repository.normalizeAssetStatusReason("assigned", "x".repeat(201)), /200 caracteres/i);
});

test("calcula diffs netos con trim y equivalencia entre costo vacío y cero", async () => {
  resetStorage();
  const repository = await loadRepository();
  const before = draftFor("cat-one", { name: "Equipo", serialNumber: "", cost: null });
  const normalizedOnly = { ...before, name: "  Equipo  ", serialNumber: "   ", cost: 0 };

  assert.equal(repository.calculateInventoryMovementChanges(before, "Electrónica", normalizedOnly, "Electrónica"), null);

  const changed = { ...normalizedOnly, name: " Equipo portátil ", location: "Soporte" };
  assert.deepEqual(repository.calculateInventoryMovementChanges(before, "Electrónica", changed, "Electrónica"), {
    name: { before: "Equipo", after: "Equipo portátil" },
    location: { before: "Almacén", after: "Soporte" },
  });
});

test("persiste altas, transiciones, ediciones sin cambios y bajas con auditoría", async () => {
  resetStorage();
  const repository = await loadRepository();
  const initial = await repository.loadSnapshot();
  assert.equal(initial.categories.length, 25);
  assert.equal(initial.items.length, 500);

  await repository.createItem(draftFor(initial.categories[0].id));
  let snapshot = await repository.loadSnapshot();
  const item = snapshot.items.find((entry) => entry.code === "QA-TEST-001");
  assert.ok(item);
  const created = snapshot.movements.at(-1);
  assert.equal(created.type, "created");
  assert.equal(created.auditVersion, 2);
  assert.equal(created.itemSnapshot.status, "available");

  assert.equal(await repository.updateItem(item.id, {
    ...item,
    location: "Soporte técnico",
    status: "maintenance",
    reason: "  Diagnóstico  ",
  }), "updated");
  snapshot = await repository.loadSnapshot();
  const updatedItem = snapshot.items.find((entry) => entry.id === item.id);
  const update = snapshot.movements.at(-1);
  assert.equal(update.type, "updated");
  assert.deepEqual(update.changes.status, { before: "available", after: "maintenance" });
  assert.deepEqual(update.changes.location, { before: "Almacén", after: "Soporte técnico" });
  assert.equal(update.reason, "Diagnóstico");

  const movementCount = snapshot.movements.length;
  const savedAt = updatedItem.updatedAt;
  assert.equal(await repository.updateItem(item.id, { ...updatedItem, reason: "solo un motivo" }), "unchanged");
  snapshot = await repository.loadSnapshot();
  assert.equal(snapshot.movements.length, movementCount);
  assert.equal(snapshot.items.find((entry) => entry.id === item.id).updatedAt, savedAt);

  await repository.deleteItem(item.id);
  snapshot = await repository.loadSnapshot();
  assert.equal(snapshot.items.some((entry) => entry.id === item.id), false);
  const deleted = snapshot.movements.at(-1);
  assert.equal(deleted.type, "deleted");
  assert.equal(deleted.itemSnapshot.status, "maintenance");
});

test("de baja bloquea el borrado y preserva el artículo y su auditoría", async () => {
  resetStorage();
  const repository = await loadRepository();
  const initial = await repository.loadSnapshot();
  const item = initial.items[0];

  assert.equal(await repository.updateItem(item.id, {
    ...item,
    status: "decommissioned",
    reason: "Fin de vida útil",
  }), "updated");
  const beforeDelete = await repository.loadSnapshot();
  await assert.rejects(repository.deleteItem(item.id), /no se puede borrar.*baja/i);
  const afterDelete = await repository.loadSnapshot();
  assert.ok(afterDelete.items.some((entry) => entry.id === item.id));
  assert.equal(afterDelete.movements.length, beforeDelete.movements.length);
});

test("rechaza borradores de otra pestaña después del vaciado", async () => {
  resetStorage();
  const tabA = await loadRepository();
  const tabB = await loadRepository();
  const snapshotA = await tabA.loadSnapshot();
  await tabB.loadSnapshot();

  await tabA.clearInventorySnapshot();
  await assert.rejects(
    tabB.updateItem(snapshotA.items[0].id, { ...snapshotA.items[0], name: "Borrador antiguo" }),
    /inventario cambió en otra pestaña/i,
  );
  const refreshed = await tabB.loadSnapshot();
  assert.deepEqual(refreshed, { categories: [], items: [], movements: [] });
});

test("el vaciado conserva el estado previo si falla la escritura y persiste vacío si funciona", async () => {
  resetStorage();
  const repository = await loadRepository();
  const initial = await repository.loadSnapshot();
  memory.legacy.set("inventario-web-demo-v2", JSON.stringify({ categories: initial.categories, items: initial.items }));
  memory.legacy.set("inventario-web-demo-v1", "legacy-copy");

  memory.failNextPut = true;
  await assert.rejects(repository.clearInventorySnapshot(), /Fallo de escritura/);
  const preserved = await repository.loadSnapshot();
  assert.equal(preserved.items.length, 500);

  await repository.clearInventorySnapshot();
  assert.equal(globalThis.localStorage.getItem("inventario-web-demo-v2"), null);
  assert.equal(globalThis.localStorage.getItem("inventario-web-demo-v1"), null);
  const reloaded = await (await loadRepository()).loadSnapshot();
  assert.deepEqual(reloaded, { categories: [], items: [], movements: [] });
});
