import type { Category, InventoryItem, InventorySnapshot } from "../types";

export const defaultCategories: Category[] = [
  { id: "cat-electronica", name: "Electrónica" },
  { id: "cat-hogar", name: "Hogar y Cocina" },
  { id: "cat-oficina", name: "Oficina y Papelería" },
];

export const testArticles = [
  { code: "INT-ELE-001", name: "Portátil de préstamo", category: "Electrónica", brand: "Lenovo", model: "ThinkPad E14", location: "Administración", notes: "Asignado al puesto de recepción." },
  { code: "INT-ELE-002", name: "Monitor para sala de reuniones", category: "Electrónica", brand: "Dell", model: "P2422H", location: "Salas", notes: "Sala de reuniones principal." },
  { code: "INT-ELE-003", name: "Proyector de capacitación", category: "Electrónica", brand: "Epson", model: "CO-W01", location: "Capacitación", notes: "Incluye control remoto y estuche." },
  { code: "INT-ELE-004", name: "Router de respaldo", category: "Electrónica", brand: "TP-Link", model: "Archer AX55", location: "Tecnología", notes: "Guardado en el gabinete de comunicaciones." },
  { code: "INT-ELE-005", name: "Tableta para inspecciones", category: "Electrónica", brand: "Samsung", model: "Galaxy Tab A9", location: "Operaciones", notes: "Uso interno del equipo de inspección." },
  { code: "INT-HOG-001", name: "Cafetera de sala común", category: "Hogar y Cocina", brand: "Oster", model: "BVSTEM7300", location: "Servicios generales", notes: "Sala de descanso." },
  { code: "INT-HOG-002", name: "Microondas del comedor", category: "Hogar y Cocina", brand: "Panasonic", model: "NN-SB458S", location: "Servicios generales", notes: "Comedor del personal." },
  { code: "INT-HOG-003", name: "Refrigeradora de oficina", category: "Hogar y Cocina", brand: "Mabe", model: "RMA1025VMXE", location: "Servicios generales", notes: "Área de comedor." },
  { code: "INT-HOG-004", name: "Dispensador de agua", category: "Hogar y Cocina", brand: "Primo", model: "Bottom Load", location: "Recepción", notes: "Recepción principal." },
  { code: "INT-HOG-005", name: "Ventilador de sala de archivo", category: "Hogar y Cocina", brand: "Lasko", model: "T42950", location: "Archivo", notes: "Torre oscilante." },
  { code: "INT-OFI-001", name: "Silla ergonómica de recepción", category: "Oficina y Papelería", brand: "ErgoSit", model: "LX-200", location: "Recepción", notes: "Respaldo ajustable." },
  { code: "INT-OFI-002", name: "Escritorio de coordinación", category: "Oficina y Papelería", brand: "OfficePro", model: "Desk-140", location: "Coordinación", notes: "Puesto de coordinación." },
  { code: "INT-OFI-003", name: "Archivador de contratos", category: "Oficina y Papelería", brand: "MetalOffice", model: "File-4", location: "Administración", notes: "Documentos de uso interno." },
  { code: "INT-OFI-004", name: "Impresora del área administrativa", category: "Oficina y Papelería", brand: "Brother", model: "MFC-L8900CDW", location: "Administración", notes: "Conectada a la red interna." },
  { code: "INT-OFI-005", name: "Pizarra móvil de capacitación", category: "Oficina y Papelería", brand: "Quartet", model: "Mobile 120", location: "Capacitación", notes: "Incluye bandeja para marcadores." },
] as const;

const STORAGE_KEY = "inventario-web-demo-v2";
const LEGACY_STORAGE_KEY = "inventario-web-demo-v1";

type LegacyInventoryItem = Partial<InventoryItem> & {
  department?: string;
  price?: number | string | null;
};

export function buildDemoItems(categories: Category[]): InventoryItem[] {
  const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
  const now = Date.now();
  return testArticles.map((article, index) => {
    const createdAt = new Date(now - index * 86_400_000).toISOString();
    return {
      id: `demo-${article.code.toLowerCase()}`,
      code: article.code,
      name: article.name,
      sku: "",
      serialNumber: "",
      brand: article.brand,
      model: article.model,
      location: article.location,
      notes: article.notes,
      categoryId: categoryIds.get(article.category) ?? categories[0]?.id ?? "",
      cost: null,
      status: "available",
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function normalizeSnapshot(value: unknown, categoriesFallback: Category[], addMissingSamples: boolean): InventorySnapshot | null {
  if (typeof value !== "object" || value === null || !("items" in value) || !Array.isArray(value.items)) return null;
  const record = value as { categories?: unknown; items: unknown[] };
  const categories = Array.isArray(record.categories) ? record.categories as Category[] : categoriesFallback;
  const savedItems = record.items.flatMap((entry): InventoryItem[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const item = entry as LegacyInventoryItem;
    if (!item.id || !item.code || !item.name || !item.categoryId) return [];
    if (addMissingSamples && item.id.startsWith("demo-")) return [];
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
  if (!addMissingSamples) return { categories, items: savedItems, movements: [] };

  const categoriesWithDefaults = [...categories];
  for (const defaultCategory of defaultCategories) {
    if (!categoriesWithDefaults.some((category) => category.name.trim().toLocaleLowerCase("es-CR") === defaultCategory.name.toLocaleLowerCase("es-CR"))) {
      categoriesWithDefaults.push(defaultCategory);
    }
  }
  const knownCodes = new Set(savedItems.map((item) => item.code.trim().toLocaleLowerCase("es-CR")));
  const sampleItems = buildDemoItems(categoriesWithDefaults).filter((item) => !knownCodes.has(item.code.toLocaleLowerCase("es-CR")));
  return { categories: categoriesWithDefaults, items: [...savedItems, ...sampleItems], movements: [] };
}

export function createSampleSnapshot(): InventorySnapshot {
  return { categories: defaultCategories, items: buildDemoItems(defaultCategories), movements: [] };
}

export function readLegacySnapshot(): InventorySnapshot | null {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const migrated = normalizeSnapshot(JSON.parse(current) as unknown, defaultCategories, false);
      if (migrated) return migrated;
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = normalizeSnapshot(JSON.parse(legacy) as unknown, defaultCategories, true);
      if (migrated) return migrated;
    }
  } catch {
    // A malformed or blocked legacy value must not prevent a fresh local database.
  }
  return null;
}
