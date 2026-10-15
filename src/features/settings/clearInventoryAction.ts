export type ClearInventoryResult = "cleared" | "database-error" | "legacy-error" | "verification-error";

export type InventoryClearSnapshot = {
  categories: readonly unknown[];
  items: readonly unknown[];
  movements: readonly unknown[];
};

export type ClearInventoryOutcome<T> =
  | { status: "cleared"; snapshot: T }
  | { status: "verification-error"; snapshot?: T }
  | { status: "database-error" }
  | { status: "legacy-error" };

export async function clearAndVerifyInventory<T extends InventoryClearSnapshot>(
  clear: () => Promise<void>,
  load: () => Promise<T>,
): Promise<ClearInventoryOutcome<T>> {
  let clearCommitted = false;

  try {
    await clear();
    clearCommitted = true;
    const snapshot = await load();
    const isEmpty = snapshot.categories.length === 0
      && snapshot.items.length === 0
      && snapshot.movements.length === 0;
    return isEmpty ? { status: "cleared", snapshot } : { status: "verification-error", snapshot };
  } catch (reason) {
    if (reason instanceof Error && /inventario quedó vacío/i.test(reason.message)) {
      return { status: "legacy-error" };
    }
    return { status: clearCommitted ? "verification-error" : "database-error" };
  }
}
