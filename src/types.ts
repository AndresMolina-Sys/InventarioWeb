export type Category = {
  id: string;
  name: string;
};

export type CategoryDraft = Pick<Category, "name">;

export type AssetLifecycleStatus =
  | "available"
  | "assigned"
  | "maintenance"
  | "decommissioned";

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
  status?: string | null;
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

export type InventoryMovementAuditSnapshotV2 = InventoryMovementAuditSnapshot & {
  status: string;
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

export type InventoryMovementAuditFieldV2 = keyof InventoryMovementAuditSnapshotV2;

export type InventoryMovementFieldChangeV2<Field extends InventoryMovementAuditFieldV2> = {
  before: InventoryMovementAuditSnapshotV2[Field];
  after: InventoryMovementAuditSnapshotV2[Field];
};

export type InventoryMovementChangesV2 = {
  [Field in InventoryMovementAuditFieldV2]?: InventoryMovementFieldChangeV2<Field>;
};

type NonEmptyInventoryMovementChangesV2 = {
  [Field in InventoryMovementAuditFieldV2]: Required<Pick<InventoryMovementChangesV2, Field>>
    & Partial<Omit<InventoryMovementChangesV2, Field>>;
}[InventoryMovementAuditFieldV2];

type NonEmptyInventoryMovementChangesV2WithoutStatus = {
  [Field in Exclude<InventoryMovementAuditFieldV2, "status">]: Required<Pick<InventoryMovementChangesV2, Field>>
    & Partial<Omit<InventoryMovementChangesV2, Field>>;
}[Exclude<InventoryMovementAuditFieldV2, "status">];

type VersionedInventoryMovementBase = {
  id: string;
  occurredAt: string;
  auditVersion: 1;
};

type VersionedInventoryMovementV2Base = {
  id: string;
  occurredAt: string;
  auditVersion: 2;
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

export type CreatedMovementV2 = VersionedInventoryMovementV2Base & {
  type: "created";
  itemSnapshot: InventoryMovementAuditSnapshotV2;
};

export type UpdatedMovementV2 = VersionedInventoryMovementV2Base & {
  type: "updated";
  itemSnapshot: InventoryMovementAuditSummary;
} & (
  | {
      changes: NonEmptyInventoryMovementChangesV2 & {
        status: InventoryMovementFieldChangeV2<"status">;
      };
      reason: string;
    }
  | {
      changes: NonEmptyInventoryMovementChangesV2WithoutStatus & {
        status?: never;
      };
      reason?: never;
    }
);

export type DeletedMovementV2 = VersionedInventoryMovementV2Base & {
  type: "deleted";
  itemSnapshot: InventoryMovementAuditSnapshotV2;
};

export type VersionedInventoryMovementV2 =
  | CreatedMovementV2
  | UpdatedMovementV2
  | DeletedMovementV2;

export type HistoricalInventoryMovement = {
  id: string;
  type: InventoryMovementType;
  occurredAt: string;
  auditVersion?: undefined;
  itemSnapshot?: Partial<InventoryMovementAuditSnapshot>;
  changes?: never;
};

export type InventoryMovement =
  | VersionedInventoryMovement
  | VersionedInventoryMovementV2
  | HistoricalInventoryMovement;

export type InventorySnapshot = {
  categories: Category[];
  items: InventoryItem[];
  movements: InventoryMovement[];
};

export type ItemDraft = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;

export type ThemePreference = "system" | "light" | "dark";

export type TableDensityPreference = "comfortable" | "compact";

export type AppLanguage = "es" | "en";

export type AppPreferences = {
  theme: ThemePreference;
  showRecentActivityChart: boolean;
  showCategoryChart: boolean;
  tableDensity: TableDensityPreference;
  language: AppLanguage;
};
