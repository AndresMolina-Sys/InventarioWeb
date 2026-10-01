export type Category = {
  id: string;
  name: string;
};

export type CategoryDraft = Pick<Category, "name">;

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  sku: string;
  serialNumber: string;
  brand: string;
  model: string;
  location: string;
  notes: string;
  categoryId: string;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
};

export type InventorySnapshot = {
  categories: Category[];
  items: InventoryItem[];
};

export type ItemDraft = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
