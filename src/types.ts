export type Category = {
  id: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  sku: string;
  brand: string;
  model: string;
  department: string;
  notes: string;
  categoryId: string;
  price: number | null;
  createdAt: string;
  updatedAt: string;
};

export type InventorySnapshot = {
  categories: Category[];
  items: InventoryItem[];
};

export type ItemDraft = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
