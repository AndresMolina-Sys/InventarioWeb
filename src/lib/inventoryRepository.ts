import { getDemoSnapshot, saveDemoSnapshot, testArticles } from "../data/demo";
import { supabase } from "./supabase";
import type { Category, InventoryItem, InventorySnapshot, ItemDraft } from "../types";

type ItemRow = {
  id: string;
  code: string;
  name: string;
  sku: string | null;
  brand: string | null;
  model: string | null;
  department: string;
  notes: string | null;
  category_id: string;
  price: number | string | null;
  created_at: string;
  updated_at: string;
};

function toItem(row: ItemRow): InventoryItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    sku: row.sku ?? "",
    brand: row.brand ?? "",
    model: row.model ?? "",
    department: row.department,
    notes: row.notes ?? "",
    categoryId: row.category_id,
    price: row.price === null ? null : Number(row.price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function itemValues(draft: ItemDraft) {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    sku: draft.sku.trim() || null,
    brand: draft.brand.trim() || null,
    model: draft.model.trim() || null,
    department: draft.department.trim() || "General",
    notes: draft.notes.trim() || null,
    category_id: draft.categoryId,
    price: draft.price,
  };
}

async function ensureDefaultCategories(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from("inventory_categories").select("id").limit(1);
  if (error) throw error;
  if (data.length > 0) return;

  const { error: insertError } = await supabase.from("inventory_categories").insert([
    { name: "Electrónica" },
    { name: "Hogar y Cocina" },
    { name: "Oficina y Papelería" },
  ]);
  if (insertError && insertError.code !== "23505") throw insertError;
}

export async function loadSnapshot(): Promise<InventorySnapshot> {
  if (!supabase) return getDemoSnapshot();

  await ensureDefaultCategories();
  const [categoriesResult, itemsResult] = await Promise.all([
    supabase.from("inventory_categories").select("id, name").order("name"),
    supabase.from("inventory_items").select("*").order("created_at", { ascending: false }),
  ]);
  if (categoriesResult.error) throw categoriesResult.error;
  if (itemsResult.error) throw itemsResult.error;

  const categories: Category[] = categoriesResult.data.map((row) => ({ id: row.id, name: row.name }));
  const items = (itemsResult.data as ItemRow[]).map(toItem);
  return { categories, items };
}

export async function createItem(draft: ItemDraft): Promise<void> {
  if (!supabase) {
    const snapshot = getDemoSnapshot();
    const now = new Date().toISOString();
    const item: InventoryItem = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    saveDemoSnapshot({ ...snapshot, items: [item, ...snapshot.items] });
    return;
  }
  const { error } = await supabase.from("inventory_items").insert(itemValues(draft));
  if (error) throw error;
}

export async function updateItem(id: string, draft: ItemDraft): Promise<void> {
  if (!supabase) {
    const snapshot = getDemoSnapshot();
    const now = new Date().toISOString();
    saveDemoSnapshot({
      ...snapshot,
      items: snapshot.items.map((item) => item.id === id ? { ...item, ...draft, updatedAt: now } : item),
    });
    return;
  }
  const { error } = await supabase.from("inventory_items").update(itemValues(draft)).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  if (!supabase) {
    const snapshot = getDemoSnapshot();
    saveDemoSnapshot({ ...snapshot, items: snapshot.items.filter((item) => item.id !== id) });
    return;
  }
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}

export async function seedTestItems(): Promise<number> {
  if (!supabase) return 0;

  await ensureDefaultCategories();
  const { data: categoryRows, error: categoriesError } = await supabase
    .from("inventory_categories")
    .select("id, name");
  if (categoriesError) throw categoriesError;
  const categoryIds = new Map(categoryRows.map((category) => [category.name, category.id]));
  const missingCategory = testArticles.find((article) => !categoryIds.has(article.category));
  if (missingCategory) throw new Error(`Falta la categoría «${missingCategory.category}».`);

  const codes = testArticles.map((article) => article.code);
  const { data: existingRows, error: existingError } = await supabase
    .from("inventory_items")
    .select("code")
    .in("code", codes);
  if (existingError) throw existingError;
  const existingCodes = new Set(existingRows.map((item) => item.code));
  const rows = testArticles
    .filter((article) => !existingCodes.has(article.code))
    .map((article) => ({
      code: article.code,
      name: article.name,
      sku: null,
      brand: article.brand,
      model: article.model,
      department: article.department,
      notes: article.notes,
      category_id: categoryIds.get(article.category)!,
      price: null,
    }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("inventory_items").insert(rows);
  if (error) throw error;
  return rows.length;
}
