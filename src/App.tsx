import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { assetStatusesMatch, createCategory, createItem, deleteCategory, deleteItem, getAllowedTransitions, loadSnapshot, normalizeAssetStatusReason, resolveAssetStatus, updateCategory, updateItem } from "./lib/inventoryRepository";
import { CODE128_MODULE_WIDTH_MM, CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM, encodeCode128B } from "./lib/code128";
import { createDefaultAppPreferences, loadAppPreferences, saveAppPreferences } from "./lib/preferencesRepository";
import type { Code128BBlockedReason, Code128BResult } from "./lib/code128";
import type { UpdateItemDraft, UpdateItemResult } from "./lib/inventoryRepository";
import type { AppPreferences, AssetLifecycleStatus, Category, CategoryDraft, InventoryItem, InventoryMovement, InventoryMovementAuditField, InventoryMovementAuditFieldV2, InventoryMovementAuditSnapshot, InventorySnapshot, ThemePreference } from "./types";

type Page = "dashboard" | "inventory" | "categories" | "movements" | "settings" | "category-detail";
type MovementFilter = "all" | InventoryMovement["type"];
type AssetStatusFilter = "all" | AssetLifecycleStatus;
type IconName = "dashboard" | "box" | "search" | "plus" | "download" | "chevron" | "edit" | "trash" | "view" | "close" | "check" | "spark" | "clock" | "alert" | "layers" | "currency" | "settings";

const ASSET_STATUS_LABELS: Record<AssetLifecycleStatus, string> = {
  available: "Disponible",
  assigned: "Asignado",
  maintenance: "En mantenimiento",
  decommissioned: "De baja",
};

const INITIAL_ASSET_STATUS_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance"];
const ASSET_STATUS_FILTER_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance", "decommissioned"];
const DECOMMISSIONED_PROTECTION_MESSAGE = "Este artículo está dado de baja y no se puede editar ni borrar.";

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 21v-8.9M8 5.3l8 4.5" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  edit: <><path d="m15 5 4 4M4 20l4-.9L19.1 8a2.1 2.1 0 0 0-3-3L5 16.1 4 20Z" /></>,
  trash: <><path d="M4 7h16m-10 4v5m4-5v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  view: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  currency: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.5-.7-1.5-1.1-3-1.1-1.6 0-2.6.7-2.6 1.8 0 3 5.2 1.2 5.2 4.1 0 1.1-1 2-2.7 2-1.4 0-2.5-.4-3.2-1.2M12 6v12" /></>,
  settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
};

function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

function AssetStatusBadge({ status }: { status: string | null | undefined }) {
  const resolved = resolveAssetStatus(status);
  if (resolved.kind === "unknown") {
    return <span className="asset-status-badge is-unknown" aria-label={`Estado desconocido: ${resolved.value}`} title={resolved.value}>Desconocido</span>;
  }
  return <span className={`asset-status-badge is-${resolved.value}`} aria-label={`Estado: ${ASSET_STATUS_LABELS[resolved.value]}`}>{ASSET_STATUS_LABELS[resolved.value]}</span>;
}

function isDecommissioned(item: InventoryItem): boolean {
  return resolveAssetStatus(item.status).value === "decommissioned";
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function costLabel(value: number | null): string {
  if (value === null) return "Sin especificar";
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "USD" }).format(value);
}

function registeredValueLabel(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function compactRegisteredValueLabel(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2,
  }).format(value);
}

type TechnicalSheetRequiredField = "code" | "name" | "category";

export type TechnicalSheetSnapshot = Readonly<{
  code: string | undefined;
  name: string | undefined;
  categoryName: string | undefined;
  brand: string | undefined;
  model: string | undefined;
  serialNumber: string | undefined;
  location: string | undefined;
  cost: number | null | string | undefined;
  createdAt: string | undefined;
  notes: string | undefined;
}>;

export type TechnicalSheetPreviewState = Readonly<{
  snapshot: TechnicalSheetSnapshot;
  display: Readonly<{
    code: string;
    name: string;
    categoryName: string;
    brand: string;
    model: string;
    serialNumber: string;
    location: string;
    cost: string;
    createdAt: string;
    notes: string;
  }>;
  missingRequiredFields: readonly TechnicalSheetRequiredField[];
  barcode: Code128BResult | null;
  canPrint: boolean;
}>;

function hasNonBlankText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalTextLabel(value: string | undefined, emptyLabel: string): string {
  return hasNonBlankText(value) ? value : emptyLabel;
}

function technicalSheetCostLabel(value: number | null | string | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? registeredValueLabel(value)
    : "Sin especificar";
}

export function prepareTechnicalSheetPreview(
  item: InventoryItem,
  categoryName: string | undefined,
): TechnicalSheetPreviewState {
  const itemRecord = item as Partial<InventoryItem>;
  const snapshot = Object.freeze({
    code: itemRecord.code,
    name: itemRecord.name,
    categoryName,
    brand: itemRecord.brand,
    model: itemRecord.model,
    serialNumber: itemRecord.serialNumber,
    location: itemRecord.location,
    cost: itemRecord.cost as number | null | string | undefined,
    createdAt: itemRecord.createdAt,
    notes: itemRecord.notes,
  });
  const hasCode = hasNonBlankText(snapshot.code);
  const hasName = hasNonBlankText(snapshot.name);
  const hasCategory = hasNonBlankText(snapshot.categoryName);
  const missingRequiredFields: TechnicalSheetRequiredField[] = [
    ...(!hasCode ? ["code" as const] : []),
    ...(!hasName ? ["name" as const] : []),
    ...(!hasCategory ? ["category" as const] : []),
  ];
  const barcode = hasCode
    ? encodeCode128B(snapshot.code, { maxWidthMm: CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM })
    : null;

  return Object.freeze({
    snapshot,
    display: Object.freeze({
      code: optionalTextLabel(snapshot.code, "[No disponible]"),
      name: optionalTextLabel(snapshot.name, "[No disponible]"),
      categoryName: optionalTextLabel(snapshot.categoryName, "[No disponible]"),
      brand: optionalTextLabel(snapshot.brand, "Sin especificar"),
      model: optionalTextLabel(snapshot.model, "Sin especificar"),
      serialNumber: optionalTextLabel(snapshot.serialNumber, "Sin especificar"),
      location: optionalTextLabel(snapshot.location, "Sin especificar"),
      cost: technicalSheetCostLabel(snapshot.cost),
      createdAt: snapshot.createdAt ?? "[No disponible]",
      notes: optionalTextLabel(snapshot.notes, "Sin observaciones"),
    }),
    missingRequiredFields,
    barcode,
    canPrint: missingRequiredFields.length === 0 && barcode?.status === "printable",
  });
}

function code128BlockMessage(reason: Code128BBlockedReason): string {
  if (reason === "unsupported-character") return "El código contiene caracteres que no se pueden representar en Code 128-B.";
  if (reason === "width-exceeded") return "El código de barras completo no cabe en una etiqueta de 70 × 35 mm.";
  return "La altura del código de barras no cabe en una etiqueta de 70 × 35 mm.";
}

function technicalSheetBlockMessage(preview: TechnicalSheetPreviewState): string {
  if (preview.missingRequiredFields.length > 0) {
    const labels: Record<TechnicalSheetRequiredField, string> = {
      code: "Código",
      name: "Nombre",
      category: "Categoría",
    };
    const missing = preview.missingRequiredFields.map((field) => labels[field]).join(", ");
    return `Faltan datos obligatorios (${missing}). Completa el registro del artículo antes de imprimir la ficha.`;
  }

  if (preview.barcode?.status !== "blocked") return "";
  if (preview.barcode.reason === "unsupported-character") return "El Código contiene caracteres que no se pueden representar en Code 128-B.";
  if (preview.barcode.reason === "width-exceeded") return "El código de barras completo supera el ancho máximo de 180 mm.";
  return "El código de barras no cumple la altura mínima requerida.";
}

function technicalSheetDateLabel(value: string | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return "[No disponible]";
  return dateLabel(value);
}

const categoryPercentageFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function getGreeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

type EffectiveTheme = Exclude<ThemePreference, "system">;
type PreferencesNotice = "read" | "write" | null;
type PreferencesChange = Partial<AppPreferences> | ((current: AppPreferences) => AppPreferences);

function getSystemTheme(): EffectiveTheme {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useAppPreferences() {
  const [loadResult] = useState(() => loadAppPreferences());
  const [preferences, setPreferences] = useState(loadResult.preferences);
  const preferencesRef = useRef(preferences);
  const pendingWriteRef = useRef(false);
  const [preferencesNotice, setPreferencesNotice] = useState<PreferencesNotice>(
    loadResult.status === "error" ? "read" : null,
  );
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  function updatePreferences(change: PreferencesChange) {
    const nextPreferences = typeof change === "function"
      ? change(preferencesRef.current)
      : { ...preferencesRef.current, ...change };
    preferencesRef.current = nextPreferences;
    pendingWriteRef.current = true;
    setPreferences(nextPreferences);
  }

  useEffect(() => {
    if (!pendingWriteRef.current) return;

    const timeoutId = window.setTimeout(() => {
      pendingWriteRef.current = false;
      const result = saveAppPreferences(preferencesRef.current);
      setPreferencesNotice(result.status === "saved" ? null : "write");
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [preferences]);

  useEffect(() => {
    if (
      preferences.theme !== "system"
      || typeof window === "undefined"
      || typeof window.matchMedia !== "function"
    ) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, [preferences.theme]);

  const effectiveTheme = preferences.theme === "system" ? systemTheme : preferences.theme;

  return { preferences, effectiveTheme, preferencesNotice, updatePreferences };
}

function App() {
  const preferenceState = useAppPreferences();
  const { preferences, effectiveTheme, preferencesNotice } = preferenceState;
  const [page, setPage] = useState<Page>("dashboard");
  const [snapshot, setSnapshot] = useState<InventorySnapshot>({ categories: [], items: [], movements: [] });
  const snapshotRef = useRef(snapshot);
  const [dataLoading, setDataLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AssetStatusFilter>("all");
  const [itemModal, setItemModal] = useState<InventoryItem | "new" | null>(null);
  const itemEditOriginRef = useRef<"inventory" | "category-detail" | null>(null);
  const [pendingItemViewFocusId, setPendingItemViewFocusId] = useState<string | null>(null);
  const [viewedItem, setViewedItem] = useState<InventoryItem | null>(null);
  const [categoryModal, setCategoryModal] = useState<Category | "new" | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPage("inventory");
        window.setTimeout(() => document.querySelector<HTMLInputElement>(".global-search input")?.focus(), 0);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    let active = true;
    void loadSnapshot().then((data) => {
      if (active) {
        snapshotRef.current = data;
        setSnapshot(data);
      }
    }).catch((reason: unknown) => {
      if (active) setError(errorMessage(reason));
    }).finally(() => {
      if (active) setDataLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const categoryName = useMemo(() => new Map(snapshot.categories.map((category) => [category.id, category.name])), [snapshot.categories]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return snapshot.items.filter((item) => {
      const matchesQuery = !query || [item.name, item.code, item.serialNumber, item.sku, item.brand, item.model, item.location, item.notes, categoryName.get(item.categoryId) ?? ""]
        .some((value) => value.toLocaleLowerCase("es").includes(query));
      const resolvedStatus = resolveAssetStatus(item.status);
      const matchesStatus = statusFilter === "all"
        || (resolvedStatus.kind === "canonical" && resolvedStatus.value === statusFilter);
      return matchesQuery
        && (categoryFilter === "all" || item.categoryId === categoryFilter)
        && matchesStatus;
    });
  }, [categoryFilter, categoryName, search, snapshot.items, statusFilter]);

  useEffect(() => {
    if (!pendingItemViewFocusId || page !== "inventory") return;
    const viewButton = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-item-view-id]"))
      .find((button) => button.dataset.itemViewId === pendingItemViewFocusId);
    if (viewButton) {
      viewButton.focus();
      setPendingItemViewFocusId(null);
    }
  }, [filteredItems, page, pendingItemViewFocusId]);

  async function refresh() {
    const data = await loadSnapshot();
    snapshotRef.current = data;
    setSnapshot(data);
  }

  async function mutate(action: () => Promise<void | UpdateItemResult>, successMessage: string): Promise<boolean> {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (result !== "unchanged") await refresh();
      setNotice(result === "unchanged" ? "No hubo cambios para guardar." : successMessage);
      window.setTimeout(() => setNotice(""), 3200);
      return true;
    } catch (reason) {
      setError(errorMessage(reason));
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function saveItem(draft: UpdateItemDraft): Promise<boolean> {
    const existing = itemModal !== "new" && itemModal ? itemModal : null;
    const isDecommissioning = existing !== null
      && resolveAssetStatus(draft.status).value === "decommissioned"
      && !isDecommissioned(existing);
    const saved = await mutate(
      () => existing ? updateItem(existing.id, draft) : createItem(draft),
      existing ? "Artículo actualizado." : "Artículo agregado al registro.",
    );
    if (saved) {
      setItemModal(null);
      if (isDecommissioning && existing) {
        setViewedItem(null);
        setSearch("");
        setCategoryFilter("all");
        setStatusFilter("all");
        setPage("inventory");
        setPendingItemViewFocusId(existing.id);
      }
      itemEditOriginRef.current = null;
    }
    return saved;
  }

  async function removeItem(item: InventoryItem): Promise<boolean> {
    if (!window.confirm(`¿Borrar el artículo «${item.name}»? Esta acción no se puede deshacer.`)) return false;
    return mutate(() => deleteItem(item.id), "Artículo borrado.");
  }

  async function saveCategory(draft: CategoryDraft): Promise<void> {
    const existing = categoryModal !== "new" && categoryModal ? categoryModal : null;
    const saved = await mutate(
      () => existing ? updateCategory(existing.id, draft) : createCategory(draft),
      existing ? "Categoría actualizada." : "Categoría agregada.",
    );
    if (saved) setCategoryModal(null);
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`¿Borrar la categoría «${category.name}»? Esta acción no se puede deshacer.`)) return;
    const deleted = await mutate(() => deleteCategory(category.id), "Categoría borrada.");
    if (deleted && selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
      setPage("categories");
    }
  }

  function exportCsv() {
    const rows = [
      ["Nombre", "Categoría", "Fecha de ingreso"],
      ...filteredItems.map((item) => [item.name, categoryName.get(item.categoryId) ?? "Sin categoría", dateLabel(item.createdAt)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "articulos.csv";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  if (dataLoading) return <LoadingScreen />;
  const selectedCategory = snapshot.categories.find((category) => category.id === selectedCategoryId) ?? null;
  const pageTitle = page === "dashboard" ? "Resumen" : page === "inventory" ? "Artículos" : page === "movements" ? "Movimientos" : page === "settings" ? "Ajustes" : page === "category-detail" ? selectedCategory?.name ?? "Categoría" : "Categorías";
  const preferencesNoticeMessage = preferencesNotice === "read"
    ? "No se pudieron leer las preferencias locales; se usarán los valores iniciales."
    : preferencesNotice === "write"
      ? "No se pudieron guardar las preferencias; este cambio se conservará solo durante esta sesión."
      : null;

  return <div className="app-shell" data-theme={effectiveTheme} data-table-density={preferences.tableDensity}>
    <Sidebar page={page} onPage={setPage} itemCount={snapshot.items.length} categoryCount={snapshot.categories.length} />
    <main className="main-area">
      <div className="topbar">
        <div className="breadcrumb"><span>Control interno</span><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
        <label className="global-search">
          <Icon name="search" size={17} />
          <input id="global-search" name="search" aria-label="Buscar artículos" placeholder="Buscar artículo o código..." value={search} onChange={(event) => { setSearch(event.target.value); setPage("inventory"); }} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-right">
          <span className="connection-pill is-demo"><span className="connection-dot" aria-hidden="true" /><span className="connection-label">Datos locales</span></span>
        </div>
      </div>

      {(error || preferencesNoticeMessage || notice) && <div className={`toast ${error || preferencesNoticeMessage ? "toast-error" : "toast-success"}`} role={error || preferencesNoticeMessage ? "alert" : "status"}>
        <Icon name={error || preferencesNoticeMessage ? "alert" : "check"} size={17} /><span>{error || preferencesNoticeMessage || notice}</span>
        {error && <button className="toast-dismiss" onClick={() => setError("")} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button>}
      </div>}

      {page === "dashboard" && <DashboardPage
        items={snapshot.items}
        categories={snapshot.categories}
        movements={snapshot.movements}
        categoryName={categoryName}
        onViewInventory={() => setPage("inventory")}
        onViewCategories={() => setPage("categories")}
      />}
      {page === "inventory" && <InventoryPage
        items={filteredItems}
        allItems={snapshot.items}
        categories={snapshot.categories}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onNew={() => { setError(""); itemEditOriginRef.current = null; setItemModal("new"); }}
        onView={setViewedItem}
        onEdit={(item) => { setError(""); itemEditOriginRef.current = "inventory"; setItemModal(item); }}
        onDelete={(item) => { void removeItem(item); }}
        onExport={exportCsv}
      />}
      {page === "categories" && <CategoriesPage
        categories={snapshot.categories}
        items={snapshot.items}
        onNew={() => { setError(""); setCategoryModal("new"); }}
        onView={(category) => { setSelectedCategoryId(category.id); setPage("category-detail"); }}
        onEdit={(category) => { setError(""); setCategoryModal(category); }}
        onDelete={(category) => void removeCategory(category)}
      />}
      {page === "category-detail" && selectedCategory && <CategoryDetailPage
        category={selectedCategory}
        items={snapshot.items.filter((item) => item.categoryId === selectedCategory.id)}
        onBack={() => setPage("categories")}
        onViewItem={setViewedItem}
        onEditItem={(item) => { setError(""); itemEditOriginRef.current = "category-detail"; setItemModal(item); }}
        onDeleteItem={(item) => { void removeItem(item); }}
      />}
      {page === "movements" && <MovementsPage movements={snapshot.movements} />}
      {page === "settings" && <SettingsPage preferences={preferences} onChange={preferenceState.updatePreferences} onReset={() => preferenceState.updatePreferences(createDefaultAppPreferences())} />}
    </main>

    {itemModal && <ItemModal
      item={itemModal === "new" ? null : itemModal}
      categories={snapshot.categories}
      error={error}
      saving={working}
      onClose={() => { setItemModal(null); itemEditOriginRef.current = null; }}
      onClearError={() => setError("")}
      onSave={saveItem}
    />}
    {viewedItem && <ItemDetailModal
      item={viewedItem}
      categoryName={categoryName.get(viewedItem.categoryId)}
      onClose={() => setViewedItem(null)}
    />}
    {categoryModal && <CategoryModal
      category={categoryModal === "new" ? null : categoryModal}
      error={error}
      saving={working}
      onClose={() => setCategoryModal(null)}
      onSave={saveCategory}
    />}
  </div>;
}

function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

function Sidebar({ page, onPage, itemCount, categoryCount }: { page: Page; onPage: (page: Page) => void; itemCount: number; categoryCount: number }) {
  const activePage = page === "category-detail" ? "categories" : page;
  const links: Array<{ key: Exclude<Page, "category-detail">; label: string; icon: IconName }> = [
    { key: "dashboard", label: "Resumen", icon: "dashboard" },
    { key: "inventory", label: "Artículos", icon: "box" },
    { key: "categories", label: "Categorías", icon: "layers" },
    { key: "movements", label: "Movimientos", icon: "clock" },
    { key: "settings", label: "Ajustes", icon: "settings" },
  ];
  return <aside className="sidebar">
    <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onPage("dashboard"); }}>
      <span className="brand-symbol"><Icon name="layers" size={19} /></span><span>Control<span> interno</span></span>
    </a>
    <div className="workspace-select"><span className="workspace-mark">I</span><span><strong>InventarioWeb</strong><small>Registro de artículos</small></span><Icon name="chevron" size={15} /></div>
    <div className="nav-label">MENÚ</div>
    <nav className="side-nav" aria-label="Navegación principal">
      {links.map((link) => <button key={link.key} className={`nav-link ${activePage === link.key ? "active" : ""}`} aria-label={link.label} aria-current={activePage === link.key ? "page" : undefined} title={link.label} onClick={() => onPage(link.key)}>
        <Icon name={link.icon} size={18} /><span>{link.label}</span>{link.key === "inventory" ? <span className="nav-count">{itemCount}</span> : link.key === "categories" ? <span className="nav-count">{categoryCount}</span> : null}
      </button>)}
    </nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={16} /></span><strong>Control organizado</strong><p>Consulta los artículos y sus datos en un solo lugar.</p></div>
  </aside>;
}

function SettingsPage({ preferences, onChange, onReset }: {
  preferences: AppPreferences;
  onChange: (change: PreferencesChange) => void;
  onReset: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const cancelResetRef = useRef<HTMLButtonElement>(null);

  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">CONTROL INTERNO</div><h1>Ajustes</h1><p>Personaliza la apariencia y la información visible.</p></div>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div><h2>Preferencias de visualización</h2><p>Los cambios se aplican a esta sesión y se guardan en este navegador.</p></div>
      </div>
      <div className="modal-form">
        <div className="form-grid">
          <label htmlFor="preference-theme">Tema
            <select id="preference-theme" name="theme" value={preferences.theme} onChange={(event) => onChange({ theme: event.target.value as ThemePreference })}>
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </label>
          <label htmlFor="preference-activity-chart">Actividad reciente
            <select id="preference-activity-chart" name="showRecentActivityChart" value={preferences.showRecentActivityChart ? "shown" : "hidden"} onChange={(event) => onChange({ showRecentActivityChart: event.target.value === "shown" })}>
              <option value="shown">Visible</option>
              <option value="hidden">Oculto</option>
            </select>
          </label>
          <label htmlFor="preference-category-chart">Artículos por categoría
            <select id="preference-category-chart" name="showCategoryChart" value={preferences.showCategoryChart ? "shown" : "hidden"} onChange={(event) => onChange({ showCategoryChart: event.target.value === "shown" })}>
              <option value="shown">Visible</option>
              <option value="hidden">Oculto</option>
            </select>
          </label>
          <label htmlFor="preference-table-density">Densidad de tablas
            <select id="preference-table-density" name="tableDensity" value={preferences.tableDensity} onChange={(event) => onChange({ tableDensity: event.target.value as AppPreferences["tableDensity"] })}>
              <option value="comfortable">Cómoda</option>
              <option value="compact">Compacta</option>
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <span className="modal-hint">Las preferencias no modifican los registros del inventario.</span>
          <button className="button button-outline" type="button" onClick={() => setResetOpen(true)}>Restablecer preferencias</button>
        </div>
      </div>
    </section>
    {resetOpen && <ModalFrame
      title="Restablecer preferencias"
      subtitle="Solo se restablecerán el tema, los gráficos y la densidad. Los artículos, categorías y movimientos no cambiarán."
      onClose={() => setResetOpen(false)}
      className="stock-modal"
      badge={<span className="modal-mark"><Icon name="settings" size={18} /></span>}
      closeLabel="Cerrar confirmación"
      manageFocus
      initialFocusRef={cancelResetRef}
    >
      <div className="modal-form">
        <p>Se aplicarán los valores iniciales: tema del sistema, ambos gráficos visibles y densidad cómoda.</p>
        <div className="modal-footer">
          <button ref={cancelResetRef} className="button button-outline" type="button" onClick={() => setResetOpen(false)}>Cancelar</button>
          <button className="button button-primary" type="button" onClick={() => { onReset(); setResetOpen(false); }}>Confirmar restablecimiento</button>
        </div>
      </div>
    </ModalFrame>}
  </section>;
}

type WeeklyActivityDay = {
  dateKey: string;
  label: string;
  longLabel: string;
  count: number;
  isToday: boolean;
};

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildWeeklyActivity(movements: InventoryMovement[]): WeeklyActivityDay[] {
  const today = new Date();
  const weekdayInitials = ["D", "L", "M", "X", "J", "V", "S"];
  const longDate = new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long" });
  const todayKey = localDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    return {
      dateKey: localDateKey(date),
      label: `${weekdayInitials[date.getDay()]} ${date.getDate()}`,
      longLabel: longDate.format(date),
      count: 0,
      isToday: localDateKey(date) === todayKey,
    };
  });
  const counts = new Map(days.map((day) => [day.dateKey, 0]));

  for (const movement of movements) {
    const timestamp = Date.parse(movement.occurredAt);
    if (!Number.isFinite(timestamp)) continue;
    const key = localDateKey(new Date(timestamp));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return days.map((day) => ({ ...day, count: counts.get(day.dateKey) ?? 0 }));
}

function ActivityChart({ movements }: { movements: InventoryMovement[] }) {
  const days = useMemo(() => buildWeeklyActivity(movements), [movements]);
  const maximum = Math.max(1, ...days.map((day) => day.count));
  const yTicks = (maximum <= 3
    ? Array.from({ length: maximum + 1 }, (_, index) => maximum - index)
    : [maximum, Math.floor(maximum / 2), 0]
  ).map((value) => ({
    value,
    position: `${value / maximum * 100}%`,
  }));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activitySummary = days.map((day) => `${day.longLabel}: ${day.count} ${day.count === 1 ? "movimiento" : "movimientos"}`).join(". ");

  return <section className="panel movement-chart-panel activity-chart-panel" aria-labelledby="activity-chart-title">
    <div className="panel-heading">
      <div><h2 id="activity-chart-title">Actividad reciente</h2><p>Altas, ediciones y bajas de artículos en los últimos siete días.</p></div>
      <span className="panel-icon"><Icon name="clock" size={18} /></span>
    </div>
    {total === 0 && <p className="chart-empty-note">Sin movimientos registrados en los últimos siete días.</p>}
    <div className="chart-area" role="img" aria-label={`Movimientos diarios. ${activitySummary}`}>
      <div className="chart-y-labels" aria-hidden="true">{yTicks.map((tick) => <span key={tick.value} style={{ bottom: tick.position }}>{tick.value}</span>)}</div>
      <div className="chart-plot" aria-hidden="true">
        {yTicks.map((tick) => <span className="chart-gridline" key={tick.value} style={{ bottom: tick.position }} />)}
        <div className="chart-bars">
          {days.map((day) => <div className="chart-column" key={day.dateKey}>
            <span className="bar-count-label" aria-hidden="true" style={{ bottom: `calc(${day.count / maximum * 100}% + 6px)` }}>{day.count}</span>
            <div className="bar-rail"><span className={`bar-fill${day.count === 0 ? " inactive" : day.isToday ? " current" : ""}`} style={{ height: `${day.count / maximum * 100}%` }} /></div>
          </div>)}
        </div>
      </div>
      <div className="chart-x-labels" aria-hidden="true">{days.map((day) => <span key={day.dateKey}>{day.label}</span>)}</div>
    </div>
    <div className="chart-legend"><span className="legend-dot" /><span>Movimientos por día</span><strong className="chart-total">{total} {total === 1 ? "movimiento" : "movimientos"} en la semana</strong></div>
  </section>;
}

function movementActionLabel(type: InventoryMovement["type"]): string {
  if (type === "created") return "Alta";
  if (type === "updated") return "Edición";
  return "Baja";
}

function movementActionIcon(type: InventoryMovement["type"]): IconName {
  if (type === "created") return "plus";
  if (type === "updated") return "edit";
  return "trash";
}

const movementAuditFields: Array<{ field: InventoryMovementAuditField; label: string }> = [
  { field: "code", label: "Código" },
  { field: "name", label: "Nombre" },
  { field: "categoryName", label: "Categoría" },
  { field: "serialNumber", label: "N.º de serie" },
  { field: "location", label: "Ubicación" },
  { field: "cost", label: "Costo" },
  { field: "brand", label: "Marca" },
  { field: "model", label: "Modelo" },
  { field: "notes", label: "Notas" },
];

const movementAuditFieldsV2: Array<{ field: InventoryMovementAuditFieldV2; label: string }> = [
  ...movementAuditFields,
  { field: "status", label: "Estado" },
];

function movementAuditValueLabel(value: string | number | null): string {
  if (typeof value === "number") return costLabel(value);
  return value?.trim() || "Sin especificar";
}

function historicalMovementValueLabel(
  snapshot: Partial<InventoryMovementAuditSnapshot> | undefined,
  field: InventoryMovementAuditField,
): string {
  if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, field) || snapshot[field] === undefined) {
    return "Dato no registrado";
  }

  const value = snapshot[field];
  if (value === null) return "Sin especificar";
  if (typeof value === "number") return costLabel(value);

  const trimmedValue = value.trim();
  if (trimmedValue) return trimmedValue;
  return field === "code" || field === "name" || field === "categoryName"
    ? "Dato no registrado"
    : "Sin especificar";
}

function movementStatusValueLabel(value: string): string {
  const resolved = resolveAssetStatus(value);
  return resolved.kind === "canonical"
    ? ASSET_STATUS_LABELS[resolved.value]
    : `Desconocido — ${resolved.value}`;
}

function movementAuditValueLabelV2(value: string | number | null, field: InventoryMovementAuditFieldV2): string {
  return field === "status" ? movementStatusValueLabel(String(value ?? "")) : movementAuditValueLabel(value);
}

function movementItemNameLabel(movement: InventoryMovement): string {
  if (movement.auditVersion === 1) return movement.itemSnapshot.name;
  return historicalMovementValueLabel(movement.itemSnapshot, "name");
}

function movementItemSummaryLabel(movement: InventoryMovement): string {
  if (movement.auditVersion === 1) {
    return `${movement.itemSnapshot.code} · ${movement.itemSnapshot.categoryName}`;
  }
  if (!movement.itemSnapshot) return "Este movimiento no conserva los datos del artículo.";
  return `${historicalMovementValueLabel(movement.itemSnapshot, "code")} · ${historicalMovementValueLabel(movement.itemSnapshot, "categoryName")}`;
}

function MovementDetailContent({ movement }: { movement: InventoryMovement }) {
  if (movement.auditVersion === 2 && movement.type === "updated") {
    const hasStatusChange = Object.prototype.hasOwnProperty.call(movement.changes, "status");
    return <div className="modal-form movement-detail-content">
      <h3>Campos modificados</h3>
      <div className="movement-diff-list">
        <div className="movement-diff-heading"><span>Campo</span><span>Antes</span><span>Después</span></div>
        {movementAuditFieldsV2.map(({ field, label }) => {
          const change = movement.changes[field];
          if (!change) return null;
          return <div className="movement-diff-row" key={field}>
            <strong>{label}</strong>
            <div><span>Antes</span><p>{movementAuditValueLabelV2(change.before, field)}</p></div>
            <div><span>Después</span><p>{movementAuditValueLabelV2(change.after, field)}</p></div>
          </div>;
        })}
      </div>
      {hasStatusChange && <div className="modal-hint movement-reason-context"><strong>Motivo</strong><p>{movement.reason?.trim() || "No registrado"}</p></div>}
    </div>;
  }

  if (movement.auditVersion === 1 && movement.type === "updated") {
    return <div className="modal-form movement-detail-content">
      <h3>Campos modificados</h3>
      <div className="movement-diff-list">
        <div className="movement-diff-heading"><span>Campo</span><span>Antes</span><span>Después</span></div>
        {movementAuditFields.map(({ field, label }) => {
          const change = movement.changes[field];
          if (!change) return null;
          return <div className="movement-diff-row" key={field}>
            <strong>{label}</strong>
            <div><span>Antes</span><p>{movementAuditValueLabel(change.before)}</p></div>
            <div><span>Después</span><p>{movementAuditValueLabel(change.after)}</p></div>
          </div>;
        })}
      </div>
    </div>;
  }

  if (movement.auditVersion === 1) {
    const snapshot = movement.itemSnapshot;
    return <div className="modal-form movement-detail-content">
      <dl className="article-detail-grid movement-audit-fields">
        <div><dt>Código</dt><dd>{snapshot.code}</dd></div>
        <div><dt>Nombre</dt><dd>{snapshot.name}</dd></div>
        <div><dt>Categoría</dt><dd>{snapshot.categoryName}</dd></div>
        <div><dt>N.º de serie</dt><dd>{movementAuditValueLabel(snapshot.serialNumber)}</dd></div>
        <div><dt>Ubicación</dt><dd>{movementAuditValueLabel(snapshot.location)}</dd></div>
        <div><dt>Costo</dt><dd>{costLabel(snapshot.cost)}</dd></div>
        <div><dt>Marca</dt><dd>{movementAuditValueLabel(snapshot.brand)}</dd></div>
        <div><dt>Modelo</dt><dd>{movementAuditValueLabel(snapshot.model)}</dd></div>
        <div className="detail-span"><dt>Notas</dt><dd>{movementAuditValueLabel(snapshot.notes)}</dd></div>
      </dl>
    </div>;
  }

  if (movement.auditVersion === 2 && (movement.type === "created" || movement.type === "deleted")) {
    const snapshot = movement.itemSnapshot;
    const statusLabel = movement.type === "created" ? "Estado inicial" : "Estado previo";
    return <div className="modal-form movement-detail-content">
      <dl className="article-detail-grid movement-audit-fields">
        <div><dt>Código</dt><dd>{snapshot.code}</dd></div>
        <div><dt>Nombre</dt><dd>{snapshot.name}</dd></div>
        <div><dt>Categoría</dt><dd>{snapshot.categoryName}</dd></div>
        <div><dt>N.º de serie</dt><dd>{movementAuditValueLabel(snapshot.serialNumber)}</dd></div>
        <div><dt>Ubicación</dt><dd>{movementAuditValueLabel(snapshot.location)}</dd></div>
        <div><dt>Costo</dt><dd>{costLabel(snapshot.cost)}</dd></div>
        <div><dt>Marca</dt><dd>{movementAuditValueLabel(snapshot.brand)}</dd></div>
        <div><dt>Modelo</dt><dd>{movementAuditValueLabel(snapshot.model)}</dd></div>
        <div className="detail-span"><dt>Notas</dt><dd>{movementAuditValueLabel(snapshot.notes)}</dd></div>
        <div><dt>{statusLabel}</dt><dd>{movementStatusValueLabel(snapshot.status)}</dd></div>
      </dl>
    </div>;
  }

  const snapshot = movement.itemSnapshot;
  return <div className="modal-form movement-detail-content">
    <p>Este movimiento no conserva el detalle histórico completo.</p>
    <dl className="article-detail-grid movement-audit-fields">
      {movementAuditFields.map(({ field, label }) => <div className={field === "notes" ? "detail-span" : undefined} key={field}>
        <dt>{label}</dt>
        <dd>{historicalMovementValueLabel(snapshot, field)}</dd>
      </div>)}
    </dl>
  </div>;
}

function MovementsPage({ movements }: { movements: InventoryMovement[] }) {
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const pageSize = 25;
  const filteredMovements = useMemo(() => movements
    .map((movement, index) => ({ movement, index }))
    .filter(({ movement }) => filter === "all" || movement.type === filter)
    .sort((left, right) => Date.parse(right.movement.occurredAt) - Date.parse(left.movement.occurredAt) || right.index - left.index)
    .map(({ movement }) => movement), [filter, movements]);
  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const firstIndex = (safePage - 1) * pageSize;
  const visibleMovements = filteredMovements.slice(firstIndex, firstIndex + pageSize);
  const rangeStart = filteredMovements.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = Math.min(firstIndex + pageSize, filteredMovements.length);

  function changeFilter(value: MovementFilter) {
    setFilter(value);
    setCurrentPage(1);
  }

  return <section className="page-content">
    <div className="page-heading movement-page-heading">
      <div><div className="eyebrow">CONTROL INTERNO</div><h1>Movimientos</h1><p>Consulta las altas, ediciones y bajas de artículos.</p></div>
    </div>
    <section className="panel inventory-panel movement-history-panel">
      <div className="inventory-toolbar movement-toolbar">
        <div><h2>Historial de actividad</h2><p className="inventory-count">{filteredMovements.length} {filteredMovements.length === 1 ? "movimiento" : "movimientos"} en el historial</p></div>
        <label className="movement-filter"><span>Tipo de acción</span>
          <select id="movement-filter" name="movementFilter" aria-label="Filtrar por tipo de acción" value={filter} onChange={(event) => changeFilter(event.target.value as MovementFilter)}>
            <option value="all">Todos los movimientos</option>
            <option value="created">Altas</option>
            <option value="updated">Ediciones</option>
            <option value="deleted">Bajas</option>
          </select>
        </label>
      </div>
      {visibleMovements.length > 0 ? <div className="table-scroll"><table className="product-table movement-history-table">
        <caption className="sr-only">Historial completo de movimientos de artículos</caption>
        <thead><tr><th scope="col">Acción</th><th scope="col">Artículo</th><th scope="col">Fecha y hora</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{visibleMovements.map((movement) => <tr key={movement.id}>
          <td><span className={`movement-action action-${movement.type}`}><Icon name={movementActionIcon(movement.type)} size={14} />{movementActionLabel(movement.type)}</span></td>
          <td><div className="movement-article"><strong>{movement.itemSnapshot ? movementItemNameLabel(movement) : "Artículo sin datos asociados"}</strong><small>{movementItemSummaryLabel(movement)}</small></div></td>
          <td className="date-cell"><time dateTime={movement.occurredAt}>{dateLabel(movement.occurredAt)}</time></td>
          <td><button className="button button-outline movement-detail-button" type="button" onClick={() => setSelectedMovement(movement)}><Icon name="view" size={15} />Ver detalle</button></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState
        title={movements.length === 0 ? "Todavía no hay movimientos" : "No hay movimientos de este tipo"}
        text={movements.length === 0 ? "Las altas, ediciones y bajas de artículos aparecerán aquí." : "Prueba otro filtro para consultar el historial."}
      />}
      <div className="table-foot movement-table-foot">
        <span>Mostrando <strong>{rangeStart}–{rangeEnd}</strong> de <strong>{filteredMovements.length}</strong> movimientos</span>
        {filteredMovements.length > 0 && <nav className="movement-pagination" aria-label="Paginación de movimientos">
          <button className="movement-page-button" aria-label="Página anterior" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
          <span aria-live="polite">Página {safePage} de {pageCount}</span>
          <button className="movement-page-button" aria-label="Página siguiente" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={safePage === pageCount}><Icon name="chevron" size={15} /></button>
        </nav>}
      </div>
    </section>
    {selectedMovement && <ModalFrame
      title={movementItemNameLabel(selectedMovement)}
      subtitle={`${selectedMovement.auditVersion === 1 ? selectedMovement.itemSnapshot.code : historicalMovementValueLabel(selectedMovement.itemSnapshot, "code")} · ${dateLabel(selectedMovement.occurredAt)}`}
      badge={<span className={`movement-action action-${selectedMovement.type}`}><Icon name={movementActionIcon(selectedMovement.type)} size={14} />{movementActionLabel(selectedMovement.type)}</span>}
      closeLabel="Cerrar detalle de movimiento"
      manageFocus
      onClose={() => setSelectedMovement(null)}
    ><MovementDetailContent movement={selectedMovement} /></ModalFrame>}
  </section>;
}

function DashboardPage({ items, categories, movements, categoryName, onViewInventory, onViewCategories }: {
  items: InventoryItem[];
  categories: Category[];
  movements: InventoryMovement[];
  categoryName: Map<string, string>;
  onViewInventory: () => void;
  onViewCategories: () => void;
}) {
  const [recentPage, setRecentPage] = useState(1);
  const [categoryViewMode, setCategoryViewMode] = useState<"percentage" | "count">("percentage");
  const categoryTotals = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.categoryId === category.id).length,
  })).sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(1, ...categoryTotals.map((category) => category.count));
  const recentItems = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
  const recentPageSize = 5;
  const recentPageCount = Math.max(1, Math.ceil(recentItems.length / recentPageSize));
  const currentRecentPage = Math.min(recentPage, recentPageCount);
  const firstRecentIndex = (currentRecentPage - 1) * recentPageSize;
  const visibleRecentItems = recentItems.slice(firstRecentIndex, firstRecentIndex + recentPageSize);
  useEffect(() => setRecentPage(1), [items]);
  const registeredValue = items.reduce((total, item) => total + (item.cost !== null && Number.isFinite(item.cost) && item.cost >= 0 ? item.cost : 0), 0);
  const fullRegisteredValue = registeredValueLabel(registeredValue);
  const useCompactRegisteredValue = fullRegisteredValue.length > 10;
  const stats: Array<{ label: string; value: string; detail: string; icon: IconName; color: string; currency?: boolean; exactValue?: string; compact?: boolean }> = [
    { label: "Artículos registrados", value: String(items.length).padStart(2, "0"), detail: "En el registro actual", icon: "box", color: "violet" },
    { label: "Categorías", value: String(categories.length), detail: "Para clasificar artículos", icon: "layers", color: "blue" },
    {
      label: "Valor registrado",
      value: useCompactRegisteredValue ? compactRegisteredValueLabel(registeredValue) : fullRegisteredValue,
      detail: "Suma de costos capturados",
      icon: "currency",
      color: "green",
      currency: true,
      exactValue: fullRegisteredValue,
      compact: useCompactRegisteredValue,
    },
  ];
  return <section className="page-content">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">{new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</div><h1>{getGreeting()} <span className="wave">✦</span></h1><p>Resumen del registro interno de artículos.</p></div>
      <div className="dashboard-actions"><button className="button button-outline" onClick={onViewCategories}><Icon name="layers" size={17} />Ver categorías</button><button className="button button-primary" onClick={onViewInventory}><Icon name="box" size={17} />Ver artículos</button></div>
    </div>

    <div className="stats-grid stats-grid-internal">
      {stats.map((stat) => <article className="stat-card" key={stat.label}>
        <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}><Icon name={stat.icon} size={17} /></span></div>
        <strong
          className={`stat-value${stat.currency ? " stat-value-currency" : ""}`}
          aria-label={stat.exactValue}
          title={stat.compact ? stat.exactValue : undefined}
          tabIndex={stat.compact ? 0 : undefined}
        >{stat.value}</strong><span className="stat-detail">{stat.detail}</span>
      </article>)}
    </div>

    <div className="dashboard-grid internal-dashboard-grid">
      <ActivityChart movements={movements} />
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div className="recent-panel-heading-main">
            <h2>Ingresos recientes</h2>
            <p>Artículos agregados más recientemente</p>
          </div>
          <div className="recent-heading-tools">
            {recentItems.length > recentPageSize && <nav className="recent-pagination" aria-label="Paginación de ingresos recientes">
              <button className="quiet-icon recent-page-button" aria-label="Página anterior de ingresos" title="Ingresos anteriores" onClick={() => setRecentPage((page) => Math.max(1, Math.min(page, recentPageCount) - 1))} disabled={currentRecentPage === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
              <span className="sr-only" aria-live="polite">Página {currentRecentPage} de {recentPageCount}</span>
              <button className="quiet-icon recent-page-button" aria-label="Página siguiente de ingresos" title="Más ingresos" onClick={() => setRecentPage((page) => Math.min(recentPageCount, Math.min(page, recentPageCount) + 1))} disabled={currentRecentPage === recentPageCount}><Icon name="chevron" size={15} /></button>
            </nav>}
            <span className="panel-icon"><Icon name="clock" size={18} /></span>
          </div>
        </div>
        {recentItems.length > 0 ? <div className="recent-list">
          {visibleRecentItems.map((item) => <div className="recent-row article-recent-row" key={item.id}>
            <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
            <span className="recent-copy"><strong>{item.name}</strong><small>{categoryName.get(item.categoryId) ?? "Sin categoría"} · {dateLabel(item.createdAt)}</small></span>
          </div>)}
        </div> : <EmptyState title="Sin artículos todavía" text="Los artículos que agregues aparecerán aquí." />}
      </section>
      <section className="panel category-panel">
        <div className="panel-heading category-panel-heading">
          <div className="category-heading-copy"><h2>Artículos por categoría</h2><p>Registros en cada grupo</p></div>
          <div className="category-heading-tools">
            <div className="category-view-toggle" role="group" aria-label="Modo de visualización de artículos por categoría">
              <button type="button" aria-label="Mostrar porcentajes" aria-pressed={categoryViewMode === "percentage"} onClick={() => setCategoryViewMode("percentage")}>%</button>
              <button type="button" aria-label="Mostrar cantidad de artículos" aria-pressed={categoryViewMode === "count"} onClick={() => setCategoryViewMode("count")}>#</button>
            </div>
            <span className="panel-icon" aria-hidden="true"><Icon name="layers" size={18} /></span>
          </div>
        </div>
        <div className="category-list">
          {categoryTotals.map((category, index) => {
            const percentage = items.length > 0 ? category.count / items.length * 100 : 0;
            const barWidth = categoryViewMode === "percentage" ? percentage : category.count / maxCategoryCount * 100;
            const displayValue = categoryViewMode === "percentage"
              ? `${categoryPercentageFormatter.format(percentage)}%`
              : String(category.count);
            return <div className="category-item" key={category.id}>
              <div className="category-label"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><span className="category-name">{category.name}<small>{category.count} artículos</small></span><strong>{displayValue}</strong></div>
              <div className="category-track"><span className={`category-progress progress-${index % 4}`} style={{ width: `${barWidth}%` }} /></div>
            </div>;
          })}
          {categoryTotals.length === 0 && <EmptyState title="Aún no hay categorías" text="Se mostrarán aquí cuando agregues artículos." />}
        </div>
      </section>
    </div>
  </section>;
}

function InventoryPage({ items, allItems, categories, categoryFilter, onCategoryFilter, statusFilter, onStatusFilter, onNew, onView, onEdit, onDelete, onExport }: {
  items: InventoryItem[];
  allItems: InventoryItem[];
  categories: Category[];
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  statusFilter: AssetStatusFilter;
  onStatusFilter: (value: AssetStatusFilter) => void;
  onNew: () => void;
  onView: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onExport: () => void;
}) {
  const protectionDescriptionPrefix = useId();
  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">CONTROL INTERNO</div><h1>Artículos</h1><p>Consulta y administra los artículos registrados.</p></div>
      <button className="button button-primary" onClick={onNew}><Icon name="plus" size={18} />Agregar artículo</button>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div><h2>Registro de artículos</h2><p className="inventory-count">{items.length} de {allItems.length} artículos</p></div>
        <div className="toolbar-actions">
          <select id="category-filter" name="categoryFilter" aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
          <select id="status-filter" name="statusFilter" aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as AssetStatusFilter)}>
            <option value="all">Todos</option>
            {ASSET_STATUS_FILTER_OPTIONS.map((status) => <option value={status} key={status}>{ASSET_STATUS_LABELS[status]}</option>)}
          </select>
          <button className="button button-outline" onClick={onExport} disabled={items.length === 0}><Icon name="download" size={16} />Exportar</button>
        </div>
      </div>
      {items.length > 0 ? <div className="table-scroll"><table className="product-table article-table">
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Estado</th><th>Fecha de ingreso</th><th>Acciones</th></tr></thead>
        <tbody>{items.map((item, index) => {
          const protectedItem = isDecommissioned(item);
          const protectionDescriptionId = `${protectionDescriptionPrefix}-item-${index}`;
          const protectionMessage = DECOMMISSIONED_PROTECTION_MESSAGE;
          return <tr key={item.id}>
            <td><div className="product-cell"><span className={`product-avatar avatar-${index % 5}`}>{item.name.slice(0, 1)}</span><strong>{item.name}</strong></div></td>
            <td><span className="category-chip">{categories.find((category) => category.id === item.categoryId)?.name ?? "Sin categoría"}</span></td>
            <td><AssetStatusBadge status={item.status} /></td>
            <td className="date-cell">{dateLabel(item.createdAt)}</td>
            <td><div className="row-actions">
              <button className="quiet-icon" data-item-view-id={item.id} onClick={() => onView(item)} title={`Ver ${item.name}`} aria-label={`Ver ${item.name}`}><Icon name="view" size={16} /></button>
              <button className="quiet-icon" onClick={() => onEdit(item)} title={protectedItem ? protectionMessage : `Editar ${item.name}`} aria-label={`Editar ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="edit" size={16} /></button>
              <button className="quiet-icon danger-icon" onClick={() => onDelete(item)} title={protectedItem ? protectionMessage : `Borrar ${item.name}`} aria-label={`Borrar ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="trash" size={16} /></button>
              {protectedItem && <span id={protectionDescriptionId} className="sr-only">{protectionMessage}</span>}
            </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title="No hay artículos para mostrar" text="Ajusta el filtro o agrega un artículo para comenzar." />}
      <div className="table-foot"><span>Mostrando <strong>{items.length}</strong> de <strong>{allItems.length}</strong> artículos</span><span className="table-foot-note"><Icon name="layers" size={14} />Guardados en este navegador</span></div>
    </section>
  </section>;
}

function CategoriesPage({ categories, items, onNew, onView, onEdit, onDelete }: {
  categories: Category[];
  items: InventoryItem[];
  onNew: () => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const sortedCategories = [...categories].sort((left, right) => left.name.localeCompare(right.name, "es"));
  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">CONTROL INTERNO</div><h1>Categorías</h1><p>Organiza los artículos por grupos de uso.</p></div>
      <button className="button button-primary" onClick={onNew}><Icon name="plus" size={18} />Agregar categoría</button>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div><h2>Registro de categorías</h2><p className="inventory-count">{categories.length} categorías</p></div></div>
      {sortedCategories.length > 0 ? <div className="table-scroll"><table className="product-table category-table">
        <thead><tr><th>Nombre</th><th>Artículos asociados</th><th>Acciones</th></tr></thead>
        <tbody>{sortedCategories.map((category, index) => {
          const count = items.filter((item) => item.categoryId === category.id).length;
          return <tr key={category.id}>
            <td><div className="product-cell"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><strong>{category.name}</strong></div></td>
            <td>{count} {count === 1 ? "artículo" : "artículos"}</td>
            <td><div className="row-actions">
              <button className="quiet-icon" onClick={() => onView(category)} title={`Ver ${category.name}`} aria-label={`Ver ${category.name}`}><Icon name="view" size={16} /></button>
              <button className="quiet-icon" onClick={() => onEdit(category)} title={`Editar ${category.name}`} aria-label={`Editar ${category.name}`}><Icon name="edit" size={16} /></button>
              <button className="quiet-icon danger-icon" onClick={() => onDelete(category)} title={`Borrar ${category.name}`} aria-label={`Borrar ${category.name}`}><Icon name="trash" size={16} /></button>
            </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title="Aún no hay categorías" text="Agrega una categoría para clasificar artículos." />}
      <div className="table-foot"><span>Mostrando <strong>{categories.length}</strong> categorías</span><span className="table-foot-note"><Icon name="layers" size={14} />Guardadas en este navegador</span></div>
    </section>
  </section>;
}

function CategoryDetailPage({ category, items, onBack, onViewItem, onEditItem, onDeleteItem }: {
  category: Category;
  items: InventoryItem[];
  onBack: () => void;
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}) {
  const protectionDescriptionPrefix = useId();
  const sortedItems = [...items].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  return <section className="page-content">
    <div className="page-heading">
      <div><button className="text-link category-back" onClick={onBack}><Icon name="chevron" size={15} />Volver a categorías</button><div className="eyebrow">DETALLE DE CATEGORÍA</div><h1>{category.name}</h1><p>{items.length} {items.length === 1 ? "artículo asociado" : "artículos asociados"}.</p></div>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div><h2>Artículos de {category.name}</h2><p>La fecha refleja la última modificación.</p></div></div>
      {sortedItems.length > 0 ? <div className="table-scroll"><table className="product-table category-detail-table">
        <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>N.º de serie</th><th>Ubicación</th><th>Última modificación</th><th>Acciones</th></tr></thead>
        <tbody>{sortedItems.map((item, index) => {
          const protectedItem = isDecommissioned(item);
          const protectionDescriptionId = `${protectionDescriptionPrefix}-item-${index}`;
          const protectionMessage = DECOMMISSIONED_PROTECTION_MESSAGE;
          return <tr key={item.id}>
          <td className="sku-code">{item.code}</td>
          <td><strong className="category-item-name">{item.name}</strong></td>
          <td><AssetStatusBadge status={item.status} /></td>
          <td>{item.serialNumber || "—"}</td>
          <td>{item.location || "Sin especificar"}</td>
          <td className="date-cell">{dateLabel(item.updatedAt)}</td>
          <td><div className="row-actions">
            <button className="quiet-icon" data-item-view-id={item.id} onClick={() => onViewItem(item)} title={`Ver ${item.name}`} aria-label={`Ver ${item.name}`}><Icon name="view" size={16} /></button>
            <button className="quiet-icon" onClick={() => onEditItem(item)} title={protectedItem ? protectionMessage : `Editar ${item.name}`} aria-label={`Editar ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="edit" size={16} /></button>
            <button className="quiet-icon danger-icon" onClick={() => onDeleteItem(item)} title={protectedItem ? protectionMessage : `Borrar ${item.name}`} aria-label={`Borrar ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="trash" size={16} /></button>
            {protectedItem && <span id={protectionDescriptionId} className="sr-only">{protectionMessage}</span>}
          </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title="No hay artículos asociados" text="Los artículos de esta categoría aparecerán aquí." />}
      <div className="table-foot"><span>Mostrando <strong>{items.length}</strong> artículos</span><span className="table-foot-note"><Icon name="layers" size={14} />Guardados en este navegador</span></div>
    </section>
  </section>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function LoadingScreen() {
  return <div className="loading-screen"><span className="loading-mark"><Icon name="layers" size={20} /></span><span>Preparando el registro...</span></div>;
}

function CategoryModal({ category, error, saving, onClose, onSave }: { category: Category | null; error: string; saving: boolean; onClose: () => void; onSave: (draft: CategoryDraft) => Promise<void> }) {
  const [name, setName] = useState(category?.name ?? "");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({ name });
  }
  return <ModalFrame title={category ? "Editar categoría" : "Agregar categoría"} subtitle="Escribe un nombre para organizar los artículos." onClose={onClose}>
    <form className="modal-form" onSubmit={(event) => void submit(event)}>
      <label>Nombre<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Equipo audiovisual" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><span className="modal-hint">El nombre debe ser único.</span><button className="button button-outline" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando..." : category ? "Guardar cambios" : "Agregar categoría"}</button></div>
    </form>
  </ModalFrame>;
}

function ModalFrame({ title, subtitle, onClose, children, className = "", badge, closeLabel = "Cerrar", manageFocus = false, hideHeaderClose = false, dismissOnBackdrop = true, initialFocusRef }: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  closeLabel?: string;
  manageFocus?: boolean;
  hideHeaderClose?: boolean;
  dismissOnBackdrop?: boolean;
  initialFocusRef?: { current: HTMLElement | null };
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (manageFocus) return;
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [manageFocus, onClose]);

  useEffect(() => {
    if (!manageFocus) return;

    const dialog = dialogRef.current;
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    (initialFocusRef?.current ?? closeButtonRef.current)?.focus();

    function containKeyboardNavigation(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", containKeyboardNavigation);
    return () => {
      document.removeEventListener("keydown", containKeyboardNavigation);
      if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
    };
  }, [initialFocusRef, manageFocus]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (dismissOnBackdrop && event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="modal-heading"><div>{badge ?? <span className="modal-mark"><Icon name="box" size={18} /></span>}<div><h2 id={titleId}>{title}</h2><p>{subtitle}</p></div></div>{!hideHeaderClose && <button ref={closeButtonRef} className="quiet-icon" onClick={onClose} aria-label={closeLabel}><Icon name="close" size={19} /></button>}</header>
      {children}
    </section>
  </div>;
}

function ItemDetailModal({ item, categoryName, onClose }: {
  item: InventoryItem;
  categoryName: string | undefined;
  onClose: () => void;
}) {
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [technicalSheetPreview, setTechnicalSheetPreview] = useState<TechnicalSheetPreviewState | null>(null);
  const [printError, setPrintError] = useState("");
  const [technicalSheetPrintError, setTechnicalSheetPrintError] = useState("");
  const blockedMessageId = useId();
  const printErrorMessageId = useId();
  const technicalSheetWarningId = useId();
  const technicalSheetPrintErrorId = useId();
  const technicalSheetTriggerRef = useRef<HTMLButtonElement>(null);
  const technicalSheetCloseButtonRef = useRef<HTMLButtonElement>(null);
  const technicalSheetPrintButtonRef = useRef<HTMLButtonElement>(null);
  const afterPrintHandlerRef = useRef<(() => void) | null>(null);
  const barcode = useMemo(() => encodeCode128B(item.code), [item.code]);
  const printButtonDescription = barcode.status === "blocked"
    ? blockedMessageId
    : printError ? printErrorMessageId : undefined;
  useEffect(() => () => {
    if (afterPrintHandlerRef.current) window.removeEventListener("afterprint", afterPrintHandlerRef.current);
  }, []);

  function closeTechnicalSheetPreview() {
    if (afterPrintHandlerRef.current) window.removeEventListener("afterprint", afterPrintHandlerRef.current);
    afterPrintHandlerRef.current = null;
    setTechnicalSheetPreview(null);
    setTechnicalSheetPrintError("");
    window.requestAnimationFrame(() => technicalSheetTriggerRef.current?.focus());
  }

  function openTechnicalSheetPreview() {
    setTechnicalSheetPrintError("");
    setTechnicalSheetPreview(prepareTechnicalSheetPreview(item, categoryName));
  }

  function startTechnicalSheetPrint() {
    if (!technicalSheetPreview?.canPrint) return;
    setTechnicalSheetPrintError("");

    const restorePrintFocus = () => window.requestAnimationFrame(() => technicalSheetPrintButtonRef.current?.focus());
    if (afterPrintHandlerRef.current) window.removeEventListener("afterprint", afterPrintHandlerRef.current);
    const handleAfterPrint = () => {
      afterPrintHandlerRef.current = null;
      restorePrintFocus();
    };
    afterPrintHandlerRef.current = handleAfterPrint;
    window.addEventListener("afterprint", handleAfterPrint, { once: true });

    try {
      window.print();
      restorePrintFocus();
    } catch {
      window.removeEventListener("afterprint", handleAfterPrint);
      afterPrintHandlerRef.current = null;
      setTechnicalSheetPrintError("No fue posible abrir el diálogo de impresión del navegador. Puedes reintentar o cerrar esta vista previa.");
      restorePrintFocus();
    }
  }

  const closeCurrentView = () => {
    if (technicalSheetPreview) {
      closeTechnicalSheetPreview();
      return;
    }
    if (labelPreviewOpen) {
      setLabelPreviewOpen(false);
      setPrintError("");
      return;
    }
    onClose();
  };
  if (technicalSheetPreview) {
    const blockingMessage = technicalSheetBlockMessage(technicalSheetPreview);
    const printableBarcode = technicalSheetPreview.barcode?.status === "printable"
      ? technicalSheetPreview.barcode
      : null;
    const printDescription = blockingMessage
      ? technicalSheetWarningId
      : technicalSheetPrintError ? technicalSheetPrintErrorId : undefined;

    return <ModalFrame
      key="technical-sheet-preview"
      title="Vista previa de ficha técnica"
      subtitle="Revisa la ficha antes de solicitar la impresión."
      onClose={closeTechnicalSheetPreview}
      className="technical-sheet-preview-modal"
      hideHeaderClose
      dismissOnBackdrop={false}
      initialFocusRef={technicalSheetCloseButtonRef}
      manageFocus
    >
      <div className="modal-form">
        <p className="sr-only" role="status">Vista previa de la ficha técnica de {technicalSheetPreview.display.name}.</p>
        {blockingMessage && <p className="form-error" id={technicalSheetWarningId} role="alert">{blockingMessage}</p>}
        {technicalSheetPrintError && <p className="form-error" id={technicalSheetPrintErrorId} role="alert">{technicalSheetPrintError}</p>}
        <article className="technical-sheet-page" aria-label="Ficha técnica y acta de resguardo">
          <header className="technical-sheet-document-header">
            <p>Control interno · InventarioWeb</p>
            <h2>Ficha técnica y acta de resguardo</h2>
          </header>

          <section className="technical-sheet-identification" aria-label="Identificación del artículo">
            <div>
              <span className="technical-sheet-label">Código</span>
              <strong className="technical-sheet-code-value">{technicalSheetPreview.display.code}</strong>
            </div>
            <div className="technical-sheet-barcode-area">
              {printableBarcode ? <svg
                className="technical-sheet-barcode"
                viewBox={`0 0 ${printableBarcode.totalModules} ${printableBarcode.barHeightMm / CODE128_MODULE_WIDTH_MM}`}
                width={`${printableBarcode.widthMm}mm`}
                height={`${printableBarcode.barHeightMm}mm`}
                role="img"
                aria-label={`Código de barras Code 128-B para el Código ${technicalSheetPreview.display.code}`}
              >
                <title>Código de barras Code 128-B</title>
                {printableBarcode.bars.map((bar) => <rect key={bar.x} x={bar.x} y="0" width={bar.width} height={printableBarcode.barHeightMm / CODE128_MODULE_WIDTH_MM} />)}
              </svg> : <p className="technical-sheet-barcode-placeholder">
                {technicalSheetPreview.missingRequiredFields.includes("code") ? "Código no disponible" : "Código de barras no disponible"}
              </p>}
            </div>
          </section>

          <dl className="technical-sheet-specifications">
            <div><dt>Código</dt><dd className="technical-sheet-code-value">{technicalSheetPreview.display.code}</dd></div>
            <div><dt>Nombre</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.name}</dd></div>
            <div><dt>Categoría</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.categoryName}</dd></div>
            <div><dt>Marca</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.brand}</dd></div>
            <div><dt>Modelo</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.model}</dd></div>
            <div><dt>Número de serie</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.serialNumber}</dd></div>
            <div><dt>Ubicación</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.location}</dd></div>
            <div><dt>Costo registrado</dt><dd className="technical-sheet-value">{technicalSheetPreview.display.cost}</dd></div>
            <div><dt>Fecha de ingreso</dt><dd className="technical-sheet-value">{technicalSheetDateLabel(technicalSheetPreview.snapshot.createdAt)}</dd></div>
            <div className="technical-sheet-notes-field"><dt>Observaciones / Notas</dt><dd className="technical-sheet-notes-value">{technicalSheetPreview.display.notes}</dd></div>
          </dl>

          <div className="technical-sheet-signatures">
            <section className="technical-sheet-signature-box" aria-labelledby="technical-sheet-delivered-title">
              <h3 id="technical-sheet-delivered-title">Entregado por</h3>
              <div className="technical-sheet-signature-line"><span>Firma</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Nombre</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Cargo</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Fecha</span><span aria-hidden="true" /></div>
            </section>
            <section className="technical-sheet-signature-box" aria-labelledby="technical-sheet-received-title">
              <h3 id="technical-sheet-received-title">Recibido por / Asignado a</h3>
              <div className="technical-sheet-signature-line"><span>Firma</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Nombre</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Documento de identidad</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>Fecha</span><span aria-hidden="true" /></div>
            </section>
          </div>
        </article>
        <div className="modal-footer">
          <button ref={technicalSheetCloseButtonRef} className="button button-outline" type="button" aria-label="Cerrar vista previa de ficha técnica" onClick={closeTechnicalSheetPreview}>Cerrar</button>
          <button ref={technicalSheetPrintButtonRef} className="button button-primary" type="button" disabled={!technicalSheetPreview.canPrint} aria-describedby={printDescription} onClick={startTechnicalSheetPrint}>Imprimir</button>
        </div>
      </div>
    </ModalFrame>;
  }

  const startPrint = () => {
    if (barcode.status !== "printable") return;
    setPrintError("");
    try {
      window.print();
    } catch {
      setPrintError("No se pudo iniciar el diálogo de impresión. Inténtalo de nuevo.");
    }
  };

  if (labelPreviewOpen) {
    return <ModalFrame key="label-preview" title="Vista previa de etiqueta" subtitle="Revisa los datos antes de imprimir." onClose={closeCurrentView} manageFocus>
      <div className="modal-form label-preview-content">
        <div className="print-label">
          <dl className="article-detail-grid print-label-fields">
            <div><dt>Código</dt><dd className="print-label-code">{item.code}</dd></div>
            <div><dt>Nombre</dt><dd>{item.name}</dd></div>
            <div><dt>Categoría</dt><dd>{categoryName ?? "Sin categoría"}</dd></div>
            <div><dt>Fecha de ingreso</dt><dd>{dateLabel(item.createdAt)}</dd></div>
          </dl>
          {barcode.status === "blocked" ? <p className="form-error print-label-warning" id={blockedMessageId} role="alert">{code128BlockMessage(barcode.reason)}</p> : <svg
            className="print-label-barcode"
            viewBox={`0 0 ${barcode.totalModules} ${barcode.barHeightMm / CODE128_MODULE_WIDTH_MM}`}
            width={barcode.totalModules}
            height={barcode.barHeightMm / CODE128_MODULE_WIDTH_MM}
            role="img"
            aria-label={`Código de barras Code 128-B para el código ${item.code}`}
          >
            {barcode.bars.map((bar) => <rect key={bar.x} x={bar.x} y="0" width={bar.width} height={barcode.barHeightMm / CODE128_MODULE_WIDTH_MM} />)}
          </svg>}
        </div>
        {printError && <p className="form-error print-label-warning" id={printErrorMessageId} role="alert">{printError}</p>}
        <div className="modal-footer">
          <button className="button button-outline" type="button" onClick={() => { setLabelPreviewOpen(false); setPrintError(""); }}>Volver al detalle</button>
          <button className="button button-primary" type="button" disabled={barcode.status !== "printable"} aria-describedby={printButtonDescription} onClick={startPrint}>Imprimir</button>
        </div>
      </div>
    </ModalFrame>;
  }

  return <ModalFrame key="article-detail" title="Detalle del artículo" subtitle="Información del registro interno." onClose={closeCurrentView} manageFocus>
    <div className="modal-form article-detail">
      <div className="article-detail-title">
        <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
        <div className="article-detail-heading">
          <strong>{item.name}</strong>
          <small>{item.code}</small>
        </div>
        <span className="article-detail-header-status"><AssetStatusBadge status={item.status} /></span>
      </div>
      <dl className="article-detail-grid">
        <div><dt>Categoría</dt><dd>{categoryName ?? "Sin categoría"}</dd></div>
        <div><dt>Fecha de ingreso</dt><dd>{dateLabel(item.createdAt)}</dd></div>
        <div><dt>Código</dt><dd>{item.code}</dd></div>
        <div><dt>Última modificación</dt><dd>{dateLabel(item.updatedAt)}</dd></div>
        <div><dt>N.º de serie</dt><dd>{item.serialNumber || "Sin especificar"}</dd></div>
        <div><dt>Ubicación</dt><dd>{item.location || "Sin especificar"}</dd></div>
        <div><dt>Costo</dt><dd>{costLabel(item.cost)}</dd></div>
        <div><dt>Marca y modelo</dt><dd>{[item.brand, item.model].filter(Boolean).join(" · ") || "Sin especificar"}</dd></div>
        <div className="detail-span"><dt>Notas</dt><dd>{item.notes || "Sin notas"}</dd></div>
      </dl>
      <div className="modal-footer">
        <button ref={technicalSheetTriggerRef} className="button button-outline" type="button" onClick={openTechnicalSheetPreview}>Imprimir ficha técnica</button>
        <button className="button button-outline" type="button" onClick={() => setLabelPreviewOpen(true)}>Imprimir etiqueta</button>
        <button className="button button-primary" type="button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </ModalFrame>;
}

function ItemModal({ item, categories, error, saving, onClose, onClearError, onSave }: { item: InventoryItem | null; categories: Category[]; error: string; saving: boolean; onClose: () => void; onClearError: () => void; onSave: (draft: UpdateItemDraft) => Promise<boolean> }) {
  const [draft, setDraft] = useState<UpdateItemDraft>(() => item ? draftFromItem(item) : {
    code: "", name: "", sku: "", serialNumber: "", brand: "", model: "", location: "", notes: "",
    categoryId: categories[0]?.id ?? "", cost: null, status: "available",
  });
  const [selectedStatus, setSelectedStatus] = useState(() => item ? resolveAssetStatus(item.status).value : "available");
  const [decommissionConfirmationOpen, setDecommissionConfirmationOpen] = useState(false);
  const [decommissionReason, setDecommissionReason] = useState("");
  const [formError, setFormError] = useState("");
  const reasonGuidanceId = useId();
  const decommissionReasonGuidanceId = useId();
  const readOnlyNoticeId = useId();
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const decommissionReasonRef = useRef<HTMLTextAreaElement>(null);
  const isReadOnly = item !== null && isDecommissioned(item);
  const statusChanged = item !== null && !assetStatusesMatch(item.status, selectedStatus);
  const decommissionReasonLength = decommissionReason.trim().length;
  const canConfirmDecommission = decommissionReasonLength >= 1 && decommissionReasonLength <= 200;

  function field<K extends keyof UpdateItemDraft>(key: K, value: UpdateItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openDecommissionConfirmation() {
    if (!item || !getAllowedTransitions(item.status).includes("decommissioned")) {
      setFormError("La transición de estado no está permitida.");
      return;
    }
    onClearError();
    setFormError("");
    field("reason", "");
    setSelectedStatus("decommissioned");
    setDecommissionReason("");
    statusSelectRef.current?.focus();
    setDecommissionConfirmationOpen(true);
  }

  function cancelDecommissionConfirmation() {
    if (saving) return;
    setDecommissionConfirmationOpen(false);
    setDecommissionReason("");
    if (item) setSelectedStatus(resolveAssetStatus(item.status).value);
    field("reason", "");
    setFormError("");
    onClearError();
  }

  function closeEditor() {
    if (decommissionConfirmationOpen) {
      cancelDecommissionConfirmation();
      return;
    }
    onClose();
  }

  function selectStatus(value: string) {
    if (value === "decommissioned") {
      openDecommissionConfirmation();
      return;
    }
    setSelectedStatus(value);
    setFormError("");
    if (item && assetStatusesMatch(item.status, value)) field("reason", "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;
    if (!draft.categoryId) { setFormError("Selecciona una categoría antes de guardar."); return; }

    let nextDraft: UpdateItemDraft = {
      ...draft,
      status: item ? draft.status : selectedStatus,
      reason: undefined,
    };

    if (item && statusChanged) {
      const nextStatus = resolveAssetStatus(selectedStatus);
      if (nextStatus.kind !== "canonical") {
        setFormError("Selecciona un estado válido para el artículo.");
        return;
      }
      if (!getAllowedTransitions(item.status).includes(nextStatus.value)) {
        setFormError("La transición de estado no está permitida.");
        return;
      }
      if (nextStatus.value === "decommissioned") {
        openDecommissionConfirmation();
        return;
      }
      try {
        nextDraft = {
          ...draft,
          status: nextStatus.value,
          reason: normalizeAssetStatusReason(nextStatus.value, draft.reason),
        };
      } catch (reason) {
        setFormError(errorMessage(reason));
        return;
      }
    }

    setFormError("");
    await onSave(nextDraft);
  }

  async function confirmDecommission() {
    if (!item || !canConfirmDecommission || saving) return;
    let normalizedReason: string;
    try {
      normalizedReason = normalizeAssetStatusReason("decommissioned", decommissionReason);
    } catch (reason) {
      setFormError(errorMessage(reason));
      return;
    }

    setFormError("");
    onClearError();
    await onSave({
      ...draft,
      status: "decommissioned",
      reason: normalizedReason,
    });
  }

  const originalStatus = item ? resolveAssetStatus(item.status) : null;
  const statusOptions = item ? editableStatusOptions(item) : [];
  return <>
    <ModalFrame title={item ? "Editar artículo" : "Agregar artículo"} subtitle="Completa los datos del registro." onClose={closeEditor}>
      <form className="modal-form" onSubmit={(event) => void submit(event)} aria-describedby={isReadOnly ? readOnlyNoticeId : undefined}>
        <div className="form-grid">
          {isReadOnly && <p className="modal-hint field-span-2" id={readOnlyNoticeId} role="status">Este artículo está dado de baja y no se puede editar ni guardar.</p>}
          <label className="field-span-2">Nombre<input autoFocus={!isReadOnly} disabled={isReadOnly} required maxLength={150} value={draft.name} onChange={(event) => field("name", event.target.value)} placeholder="Ej. Portátil de préstamo" /></label>
          <label>Código<input disabled={isReadOnly} required maxLength={50} value={draft.code} onChange={(event) => field("code", event.target.value)} placeholder="Ej. INT-ELE-016" /></label>
          <label>Categoría<select disabled={isReadOnly} required value={draft.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="" disabled>Seleccionar</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          {item
            ? <label>Estado<select ref={statusSelectRef} disabled={isReadOnly} value={selectedStatus} onChange={(event) => selectStatus(event.target.value)}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            : <label>Estado inicial<select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>{INITIAL_ASSET_STATUS_OPTIONS.map((status) => <option value={status} key={status}>{ASSET_STATUS_LABELS[status]}</option>)}</select></label>}
          {item && originalStatus?.kind === "unknown" && <p className="modal-hint field-span-2">El estado original no es canónico. Puedes corregirlo a Disponible o a otro estado permitido; De baja requiere confirmación.</p>}
          {item && statusChanged && selectedStatus !== "decommissioned" && <>
            <label className="field-span-2">Motivo del cambio (Opcional)<textarea rows={2} disabled={isReadOnly} value={draft.reason ?? ""} aria-describedby={reasonGuidanceId} onChange={(event) => field("reason", event.target.value)} placeholder="Explica brevemente el cambio de estado" /></label>
            <p className="modal-hint field-span-2" id={reasonGuidanceId}>Se recortan los espacios; el límite de 200 caracteres se aplica al texto recortado.</p>
          </>}
          <label>Ubicación (Opcional)<input disabled={isReadOnly} maxLength={100} value={draft.location} onChange={(event) => field("location", event.target.value)} placeholder="Ej. Administración" /></label>
          <label>N.º de serie (Opcional)<input disabled={isReadOnly} maxLength={100} value={draft.serialNumber} onChange={(event) => field("serialNumber", event.target.value)} placeholder="Opcional" /></label>
          <label>Costo $ (Opcional)<input disabled={isReadOnly} type="number" min="0" step="0.01" value={draft.cost ?? ""} onChange={(event) => field("cost", event.target.value === "" ? null : Number(event.target.value))} placeholder="0.00" /></label>
          <label>Marca<input disabled={isReadOnly} maxLength={100} value={draft.brand} onChange={(event) => field("brand", event.target.value)} placeholder="Opcional" /></label>
          <label className="field-span-2">Modelo<input disabled={isReadOnly} maxLength={100} value={draft.model} onChange={(event) => field("model", event.target.value)} placeholder="Opcional" /></label>
          <label className="field-span-2">Notas<textarea disabled={isReadOnly} rows={3} maxLength={500} value={draft.notes} onChange={(event) => field("notes", event.target.value)} placeholder="Detalles útiles para identificar este artículo" /></label>
        </div>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-footer"><span className="modal-hint">La fecha de ingreso se registra al guardar.</span><button className="button button-outline" type="button" onClick={onClose} autoFocus={isReadOnly}>Cancelar</button><button className="button button-primary" disabled={saving || isReadOnly} aria-disabled={isReadOnly} aria-describedby={isReadOnly ? readOnlyNoticeId : undefined}>{saving ? "Guardando..." : item ? "Guardar cambios" : "Agregar artículo"}</button></div>
      </form>
    </ModalFrame>
    {decommissionConfirmationOpen && <ModalFrame
      title="Confirmar baja"
      subtitle="La baja es irreversible para este artículo."
      className="decommission-confirmation"
      onClose={cancelDecommissionConfirmation}
      manageFocus
      initialFocusRef={decommissionReasonRef}
      dismissOnBackdrop={!saving}
      hideHeaderClose={saving}
    >
      <div className="modal-form decommission-confirmation-content">
        <p>Confirma la baja para guardar ahora todos los cambios del artículo y su motivo en un único movimiento.</p>
        <label>Motivo de la baja<textarea
          ref={decommissionReasonRef}
          rows={3}
          required
          value={decommissionReason}
          disabled={saving}
          aria-describedby={decommissionReasonGuidanceId}
          onChange={(event) => setDecommissionReason(event.target.value)}
          placeholder="Escribe el motivo de la baja"
        /></label>
        <p className="modal-hint" id={decommissionReasonGuidanceId}>
          {decommissionReasonLength}/200 caracteres después de recortar. Escribe entre 1 y 200 caracteres para habilitar la confirmación.
        </p>
        {decommissionReasonLength > 200 && <p className="form-error" role="alert">El motivo no puede superar los 200 caracteres después de recortar.</p>}
        {error && <p className="form-error" role="alert">No se pudo guardar en la base local: {error}</p>}
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="modal-footer">
          <button className="button button-outline" type="button" disabled={saving} onClick={cancelDecommissionConfirmation}>Cancelar</button>
          <button className="button button-primary" type="button" disabled={!canConfirmDecommission || saving} onClick={() => void confirmDecommission()}>
            {saving ? "Guardando..." : error ? "Reintentar baja" : "Confirmar baja"}
          </button>
        </div>
      </div>
    </ModalFrame>}
  </>;
}

function editableStatusOptions(item: InventoryItem): Array<{ value: string; label: string }> {
  const current = resolveAssetStatus(item.status);
  const options = new Map<string, string>();
  options.set(
    current.value,
    current.kind === "unknown" ? `Desconocido — ${current.value}` : ASSET_STATUS_LABELS[current.value],
  );
  for (const status of getAllowedTransitions(item.status)) {
    options.set(status, ASSET_STATUS_LABELS[status]);
  }
  return [...options].map(([value, label]) => ({ value, label }));
}

function draftFromItem(item: InventoryItem): UpdateItemDraft {
  return {
    code: item.code, name: item.name, sku: item.sku, serialNumber: item.serialNumber, brand: item.brand, model: item.model,
    location: item.location, notes: item.notes, categoryId: item.categoryId, cost: item.cost, status: item.status,
  };
}

export default App;
