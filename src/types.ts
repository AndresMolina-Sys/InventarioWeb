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

export type MovementItemSnapshot = Pick<InventoryItem, "code" | "name"> & {
  categoryName: string;
};

export type InventoryMovementType = "created" | "updated" | "deleted";

export type InventoryMovementAuditSnapshot = {
  code: string;
  name: string;
  categoryName: string;
  serialNumber: string | null;
  location: string | null;
  cost: number | null;
  brand: string | null;
  model: string | null;
  notes: string | null;
};

export type InventoryMovementAuditSummary = Pick<
  InventoryMovementAuditSnapshot,
  "code" | "name" | "categoryName"
>;

export type InventoryMovementAuditField = keyof InventoryMovementAuditSnapshot;

export type InventoryMovementFieldChange<Field extends InventoryMovementAuditField> = {
  before: InventoryMovementAuditSnapshot[Field];
  after: InventoryMovementAuditSnapshot[Field];
};

export type InventoryMovementChanges = {
  [Field in InventoryMovementAuditField]?: InventoryMovementFieldChange<Field>;
};

export type NonEmptyInventoryMovementChanges = {
  [Field in InventoryMovementAuditField]: Required<Pick<InventoryMovementChanges, Field>>
    & Partial<Omit<InventoryMovementChanges, Field>>;
}[InventoryMovementAuditField];

type VersionedInventoryMovementBase = {
  id: string;
  occurredAt: string;
  auditVersion: 1;
};

export type CreatedInventoryMovement = VersionedInventoryMovementBase & {
  type: "created";
  itemSnapshot: InventoryMovementAuditSnapshot;
};

export type UpdatedInventoryMovement = VersionedInventoryMovementBase & {
  type: "updated";
  itemSnapshot: InventoryMovementAuditSummary;
  changes: NonEmptyInventoryMovementChanges;
};

export type DeletedInventoryMovement = VersionedInventoryMovementBase & {
  type: "deleted";
  itemSnapshot: InventoryMovementAuditSnapshot;
};

export type VersionedInventoryMovement =
  | CreatedInventoryMovement
  | UpdatedInventoryMovement
  | DeletedInventoryMovement;

export type HistoricalInventoryMovement = {
  id: string;
  type: InventoryMovementType;
  occurredAt: string;
  auditVersion?: undefined;
  itemSnapshot?: Partial<InventoryMovementAuditSnapshot>;
  changes?: never;
};

export type InventoryMovement = VersionedInventoryMovement | HistoricalInventoryMovement;

export type InventorySnapshot = {
  categories: Category[];
  items: InventoryItem[];
  movements: InventoryMovement[];
};

export type ItemDraft = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
