import type { Category, InventoryItem, InventorySnapshot } from "../types";

const STORAGE_KEY = "inventario-web-demo-v2";
const LEGACY_STORAGE_KEY = "inventario-web-demo-v1";

type LegacyInventoryItem = Partial<InventoryItem> & {
  department?: string;
  price?: number | string | null;
};

function normalizeSnapshot(value: unknown): InventorySnapshot | null {
  if (typeof value !== "object" || value === null || !("items" in value) || !Array.isArray(value.items)) return null;
  const record = value as { categories?: unknown; items: unknown[] };
  const categories = Array.isArray(record.categories) ? record.categories as Category[] : [];
  const items = record.items.flatMap((entry): InventoryItem[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const item = entry as LegacyInventoryItem;
    if (!item.id || !item.code || !item.name || !item.categoryId) return [];
    const createdAt = item.createdAt ?? new Date().toISOString();
    const rawCost = item.cost !== undefined ? item.cost : item.price ?? null;
    const parsedCost = rawCost === null || rawCost === "" ? null : Number(rawCost);
    return [{
      id: item.id,
      code: item.code,
      name: item.name,
      sku: item.sku ?? "",
      serialNumber: item.serialNumber ?? "",
      brand: item.brand ?? "",
      model: item.model ?? "",
      location: item.location ?? item.department ?? "",
      notes: item.notes ?? "",
      categoryId: item.categoryId,
      cost: parsedCost !== null && Number.isFinite(parsedCost) && parsedCost >= 0 ? parsedCost : null,
      ...(item.status !== undefined ? { status: item.status } : {}),
      createdAt,
      updatedAt: item.updatedAt ?? createdAt,
    }];
  });

  return { categories, items, movements: [] };
}

export function readLegacySnapshot(): InventorySnapshot | null {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const migrated = normalizeSnapshot(JSON.parse(current) as unknown);
      if (migrated) return migrated;
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return normalizeSnapshot(JSON.parse(legacy) as unknown);
  } catch {
    // Un dato heredado inválido no debe impedir que la base local inicie vacía.
  }
  return null;
}

export function clearLegacySnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
