import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { assetStatusesMatch, clearInventorySnapshot, createCategory, createItem, deleteCategory, deleteItem, getAllowedTransitions, loadSnapshot, normalizeAssetStatusReason, resolveAssetStatus, subscribeInventoryInvalidation, updateCategory, updateItem } from "./lib/inventoryRepository";
import { CODE128_MODULE_WIDTH_MM, CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM, encodeCode128B } from "./lib/code128";
import { createDefaultAppPreferences, DEFAULT_CRC_PER_USD, DEFAULT_EUR_PER_USD, loadAppPreferences, RATE_REFERENCE_METADATA, saveAppPreferences } from "./lib/preferencesRepository";
import type { Code128BBlockedReason, Code128BResult } from "./lib/code128";
import type { UpdateItemDraft, UpdateItemResult } from "./lib/inventoryRepository";
import type { AppPreferences, AssetLifecycleStatus, Category, CategoryDraft, InventoryItem, InventoryMovement, InventoryMovementAuditField, InventoryMovementAuditFieldV2, InventoryMovementAuditSnapshot, InventorySnapshot, ThemePreference } from "./types";
import { convertUsdAmount, formatCalendarDate, formatCurrency, formatDate, formatDateTime, formatGreeting, formatNumber, getLocale, presentAssetStatus, sumAndConvertUsdCosts, translate } from "./i18n";
import type { TranslationKey, TranslationParameters } from "./i18n";

type Page = "dashboard" | "inventory" | "categories" | "movements" | "settings" | "category-detail";
type MovementFilter = "all" | InventoryMovement["type"];
type AssetStatusFilter = "all" | AssetLifecycleStatus;
type TablePageSize = NonNullable<AppPreferences["tablePageSize"]>;
type DisplayFormatting = Readonly<{
  displayCurrency: NonNullable<AppPreferences["displayCurrency"]>;
  crcPerUsd: number;
  eurPerUsd: number;
  dateFormat: NonNullable<AppPreferences["dateFormat"]>;
  timeFormat: NonNullable<AppPreferences["timeFormat"]>;
}>;
type IconName = "dashboard" | "box" | "search" | "plus" | "download" | "chevron" | "edit" | "trash" | "view" | "close" | "check" | "spark" | "clock" | "alert" | "layers" | "currency" | "settings";

const ASSET_STATUS_KEYS: Record<AssetLifecycleStatus, TranslationKey> = {
  available: "statusAvailable",
  assigned: "statusAssigned",
  maintenance: "statusMaintenance",
  decommissioned: "statusDecommissioned",
};

const INITIAL_ASSET_STATUS_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance"];
const ASSET_STATUS_FILTER_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance", "decommissioned"];

function useTablePagination<T>(rows: T[], pageSize: TablePageSize, resetKey = "") {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, pageSize === "all" ? 1 : Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageLength = pageSize === "all" ? rows.length : pageSize;
  const firstIndex = pageSize === "all" ? 0 : (safePage - 1) * pageLength;
  const visibleRows = pageSize === "all" ? rows : rows.slice(firstIndex, firstIndex + pageLength);
  const rangeStart = rows.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = Math.min(firstIndex + pageLength, rows.length);
  const previousState = useRef({ pageSize, resetKey, rowCount: rows.length });

  useEffect(() => {
    const shouldReset = previousState.current.pageSize !== pageSize || previousState.current.resetKey !== resetKey;
    const rowsShrank = rows.length < previousState.current.rowCount;
    previousState.current = { pageSize, resetKey, rowCount: rows.length };
    if (shouldReset) setCurrentPage(1);
    else if (rowsShrank) setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount, pageSize, resetKey, rows.length]);

  return { currentPage: safePage, pageCount, rangeStart, rangeEnd, rows: visibleRows, setCurrentPage };
}

function TablePaginationControls({ page, pageCount, onPageChange, language }: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  language: AppPreferences["language"];
}) {
  return <nav className="movement-pagination" aria-label={translated(language, "pageLabel")}>
    <button className="movement-page-button" type="button" aria-label={translated(language, "previousPage")} onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
    <span aria-live="polite">{translated(language, "movementPageCount", { page: formatNumber(page, language), pages: formatNumber(pageCount, language) })}</span>
    <button className="movement-page-button" type="button" aria-label={translated(language, "nextPage")} onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount}><Icon name="chevron" size={15} /></button>
  </nav>;
}

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

function assetStatusLabel(status: AssetLifecycleStatus, language: AppPreferences["language"]): string {
  return translated(language, ASSET_STATUS_KEYS[status]);
}

function AssetStatusBadge({ status, language = "es" }: { status: string | null | undefined; language?: AppPreferences["language"] }) {
  const resolved = presentAssetStatus(status, language);
  if (resolved.kind === "unknown") {
    const label = `${resolved.label} — ${resolved.rawValue}`;
    return <span className="asset-status-badge is-unknown" aria-label={translated(language, "unknownStatusAccessible", { value: resolved.rawValue })} title={resolved.rawValue}>{label}</span>;
  }
  return <span className={`asset-status-badge is-${resolveAssetStatus(status).value}`} aria-label={translated(language, "canonicalStatusAccessible", { value: resolved.label })}>{resolved.label}</span>;
}

function isDecommissioned(item: InventoryItem): boolean {
  return resolveAssetStatus(item.status).value === "decommissioned";
}

const DEFAULT_DISPLAY_FORMATTING: DisplayFormatting = {
  displayCurrency: "USD",
  crcPerUsd: DEFAULT_CRC_PER_USD,
  eurPerUsd: DEFAULT_EUR_PER_USD,
  dateFormat: "dmy",
  timeFormat: "12h",
};

function dateLabel(value: string | Date, language: AppPreferences["language"] = "es", formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING): string {
  return formatDateTime(value, language, formatting.dateFormat, formatting.timeFormat);
}

function costLabel(value: number | null, language: AppPreferences["language"] = "es", formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING): string {
  if (value === null) return translated(language, "unspecified");
  return formatCurrency(convertUsdAmount(value, formatting.displayCurrency, formatting), formatting.displayCurrency, language);
}

function compactRegisteredValueLabel(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2,
  }).format(value);
}

function compactDisplayValueLabel(value: number, currency: NonNullable<AppPreferences["displayCurrency"]>, language: AppPreferences["language"]): string {
  if (currency === "USD") return compactRegisteredValueLabel(value);
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency", currency, currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 2,
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

function technicalSheetCostLabel(value: number | null | string | undefined, language: AppPreferences["language"], formatting: DisplayFormatting): string {
  return typeof value === "number" && Number.isFinite(value)
    ? costLabel(value, language, formatting)
    : translated(language, "unspecified");
}

function technicalSheetDisplay(snapshot: TechnicalSheetSnapshot, language: AppPreferences["language"], formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING) {
  return Object.freeze({
    code: optionalTextLabel(snapshot.code, translated(language, "unavailableInBrackets")),
    name: optionalTextLabel(snapshot.name, translated(language, "unavailableInBrackets")),
    categoryName: optionalTextLabel(snapshot.categoryName, translated(language, "unavailableInBrackets")),
    brand: optionalTextLabel(snapshot.brand, translated(language, "unspecified")),
    model: optionalTextLabel(snapshot.model, translated(language, "unspecified")),
    serialNumber: optionalTextLabel(snapshot.serialNumber, translated(language, "unspecified")),
    location: optionalTextLabel(snapshot.location, translated(language, "unspecified")),
    cost: technicalSheetCostLabel(snapshot.cost, language, formatting),
    createdAt: snapshot.createdAt && !Number.isNaN(Date.parse(snapshot.createdAt))
      ? dateLabel(snapshot.createdAt, language, formatting)
      : translated(language, "unavailableInBrackets"),
    notes: optionalTextLabel(snapshot.notes, translated(language, "noObservations")),
  });
}

export function prepareTechnicalSheetPreview(
  item: InventoryItem,
  categoryName: string | undefined,
  language: AppPreferences["language"] = "es",
  formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING,
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
    display: technicalSheetDisplay(snapshot, language, formatting),
    missingRequiredFields,
    barcode,
    canPrint: missingRequiredFields.length === 0 && barcode?.status === "printable",
  });
}

function code128BlockMessage(reason: Code128BBlockedReason, language: AppPreferences["language"]): string {
  if (reason === "unsupported-character") return translated(language, "barcodeUnsupportedCharacters");
  if (reason === "width-exceeded") return translated(language, "barcodeTooWideLabel");
  return translated(language, "barcodeTooShort");
}

function technicalSheetBlockMessage(preview: TechnicalSheetPreviewState, language: AppPreferences["language"]): string {
  if (preview.missingRequiredFields.length > 0) {
    const labels: Record<TechnicalSheetRequiredField, string> = {
      code: translated(language, "code"),
      name: translated(language, "name"),
      category: translated(language, "category"),
    };
    const missing = preview.missingRequiredFields.map((field) => labels[field]).join(", ");
    return translated(language, "missingRequiredFields", { fields: missing });
  }

  if (preview.barcode?.status !== "blocked") return "";
  if (preview.barcode.reason === "unsupported-character") return translated(language, "barcodeUnsupportedUppercase");
  if (preview.barcode.reason === "width-exceeded") return translated(language, "barcodeTooWideSheet");
  return translated(language, "barcodeMinimumHeight");
}

function translated(language: AppPreferences["language"], key: TranslationKey, parameters?: TranslationParameters): string {
  return translate(language, key, parameters);
}

type EffectiveTheme = Exclude<ThemePreference, "system">;
type PreferencesNotice = "read" | "write" | null;
type PreferencesChange = Partial<AppPreferences> | ((current: AppPreferences) => AppPreferences);
type ClearInventoryResult = "cleared" | "database-error" | "legacy-error";

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
  const language = preferences.language;
  const tablePageSize = preferences.tablePageSize ?? 25;
  const displayFormatting: DisplayFormatting = {
    displayCurrency: preferences.displayCurrency ?? "USD",
    crcPerUsd: preferences.crcPerUsd ?? DEFAULT_CRC_PER_USD,
    eurPerUsd: preferences.eurPerUsd ?? DEFAULT_EUR_PER_USD,
    dateFormat: preferences.dateFormat ?? "dmy",
    timeFormat: preferences.timeFormat ?? "12h",
  };
  const [page, setPage] = useState<Page>("dashboard");
  const [snapshot, setSnapshot] = useState<InventorySnapshot>({ categories: [], items: [], movements: [] });
  const snapshotRef = useRef(snapshot);
  const localClearInProgressRef = useRef(false);
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
  const [notice, setNotice] = useState<TranslationKey | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${translated(language, "appName")} — ${translated(language, "internalControl")}`;
  }, [language]);

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

  useEffect(() => subscribeInventoryInvalidation(() => {
    const emptySnapshot: InventorySnapshot = { categories: [], items: [], movements: [] };
    snapshotRef.current = emptySnapshot;
    setSnapshot(emptySnapshot);
    setItemModal(null);
    setViewedItem(null);
    setCategoryModal(null);
    setSelectedCategoryId(null);
    setPendingItemViewFocusId(null);
    itemEditOriginRef.current = null;
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setError("");

    if (!localClearInProgressRef.current) {
      setNotice("inventoryClearedElsewhere");
      window.setTimeout(() => setNotice(null), 5000);
    }

    // Actualiza la revisión del repositorio antes de aceptar nuevas escrituras.
    void loadSnapshot().then((data) => {
      snapshotRef.current = data;
      setSnapshot(data);
    }).catch((reason: unknown) => setError(errorMessage(reason)));
  }), []);

  const categoryName = useMemo(() => new Map(snapshot.categories.map((category) => [category.id, category.name])), [snapshot.categories]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(getLocale(language));
    return snapshot.items.filter((item) => {
      const matchesQuery = !query || [item.name, item.code, item.serialNumber, item.sku, item.brand, item.model, item.location, item.notes, categoryName.get(item.categoryId) ?? ""]
        .some((value) => value.toLocaleLowerCase(getLocale(language)).includes(query));
      const resolvedStatus = resolveAssetStatus(item.status);
      const matchesStatus = statusFilter === "all"
        || (resolvedStatus.kind === "canonical" && resolvedStatus.value === statusFilter);
      return matchesQuery
        && (categoryFilter === "all" || item.categoryId === categoryFilter)
        && matchesStatus;
    });
  }, [categoryFilter, categoryName, language, search, snapshot.items, statusFilter]);

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

  async function mutate(action: () => Promise<void | UpdateItemResult>, successMessage: TranslationKey): Promise<boolean> {
    setWorking(true);
    setError("");
    setNotice(null);
    try {
      const result = await action();
      if (result !== "unchanged") await refresh();
      setNotice(result === "unchanged" ? "noChangesToSave" : successMessage);
      window.setTimeout(() => setNotice(null), 3200);
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
      existing ? "itemUpdated" : "itemAdded",
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
    if (!window.confirm(translated(language, "confirmDeleteArticle", { name: item.name }))) return false;
    return mutate(() => deleteItem(item.id), "itemDeleted");
  }

  async function saveCategory(draft: CategoryDraft): Promise<void> {
    const existing = categoryModal !== "new" && categoryModal ? categoryModal : null;
    const saved = await mutate(
      () => existing ? updateCategory(existing.id, draft) : createCategory(draft),
      existing ? "categoryUpdated" : "categoryAdded",
    );
    if (saved) setCategoryModal(null);
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(translated(language, "confirmDeleteCategory", { name: category.name }))) return;
    const deleted = await mutate(() => deleteCategory(category.id), "categoryDeleted");
    if (deleted && selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
      setPage("categories");
    }
  }

  async function clearInventory(): Promise<ClearInventoryResult> {
    localClearInProgressRef.current = true;
    setError("");
    setNotice(null);
    try {
      await clearInventorySnapshot();
      const data = await loadSnapshot().catch(() => ({ categories: [], items: [], movements: [] }));
      snapshotRef.current = data;
      setSnapshot(data);
      setNotice("inventoryCleared");
      window.setTimeout(() => setNotice(null), 5000);
      return "cleared";
    } catch (reason) {
      if (reason instanceof Error && /inventario quedó vacío/i.test(reason.message)) {
        return "legacy-error";
      }
      return "database-error";
    } finally {
      localClearInProgressRef.current = false;
    }
  }

  function exportCsv() {
    const rows = [
      [translated(language, "name"), translated(language, "category"), translated(language, "entryDate")],
      ...filteredItems.map((item) => [item.name, categoryName.get(item.categoryId) ?? translated(language, "noCategory"), dateLabel(item.createdAt, language, displayFormatting)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "articulos.csv";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  if (dataLoading) return <LoadingScreen language={language} />;
  const selectedCategory = snapshot.categories.find((category) => category.id === selectedCategoryId) ?? null;
  const pageTitle = page === "category-detail"
    ? selectedCategory?.name ?? translated(language, "categoryDetail")
    : translated(language, page === "dashboard" ? "dashboard" : page === "inventory" ? "articles" : page === "movements" ? "movements" : page === "settings" ? "settings" : "categories");
  const preferencesNoticeMessage = preferencesNotice === "read"
    ? translated(language, "preferencesReadError")
    : preferencesNotice === "write"
      ? translated(language, "preferencesWriteError")
      : null;

  return <div className="app-shell" lang={language} data-theme={effectiveTheme} data-table-density={preferences.tableDensity}>
    <Sidebar page={page} onPage={setPage} itemCount={snapshot.items.length} categoryCount={snapshot.categories.length} language={language} />
    <main className="main-area">
      <div className="topbar">
        <div className="breadcrumb"><span>{translated(language, "internalControl")}</span><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
        <label className="global-search">
          <Icon name="search" size={17} />
          <input id="global-search" name="search" aria-label={translated(language, "searchArticles")} placeholder={translated(language, "searchArticleOrCode")} value={search} onChange={(event) => { setSearch(event.target.value); setPage("inventory"); }} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-right">
          <span className="connection-pill is-demo"><span className="connection-dot" aria-hidden="true" /><span className="connection-label">{translated(language, "localData")}</span></span>
        </div>
      </div>

      {(error || preferencesNoticeMessage || notice) && <div className={`toast ${error || preferencesNoticeMessage ? "toast-error" : "toast-success"}`} role={error || preferencesNoticeMessage ? "alert" : "status"}>
        <Icon name={error || preferencesNoticeMessage ? "alert" : "check"} size={17} /><span>{error ? localizedAppError(error, language) : preferencesNoticeMessage ?? (notice ? translated(language, notice) : "")}</span>
        {error && <button className="toast-dismiss" onClick={() => setError("")} aria-label={translated(language, "closeNotice")}><Icon name="close" size={16} /></button>}
      </div>}

      {page === "dashboard" && <DashboardPage
        items={snapshot.items}
        categories={snapshot.categories}
        movements={snapshot.movements}
        categoryName={categoryName}
        language={language}
        formatting={displayFormatting}
        showRecentActivityChart={preferences.showRecentActivityChart}
        showCategoryChart={preferences.showCategoryChart}
        showRegisteredValue={preferences.showRegisteredValue ?? true}
        displayCurrency={preferences.displayCurrency ?? "USD"}
        crcPerUsd={preferences.crcPerUsd ?? DEFAULT_CRC_PER_USD}
        eurPerUsd={preferences.eurPerUsd ?? DEFAULT_EUR_PER_USD}
        onViewInventory={() => setPage("inventory")}
        onViewCategories={() => setPage("categories")}
      />}
      {page === "inventory" && <InventoryPage
        language={language}
        formatting={displayFormatting}
        pageSize={tablePageSize}
        search={search}
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
        language={language}
        pageSize={tablePageSize}
        categories={snapshot.categories}
        items={snapshot.items}
        onNew={() => { setError(""); setCategoryModal("new"); }}
        onView={(category) => { setSelectedCategoryId(category.id); setPage("category-detail"); }}
        onEdit={(category) => { setError(""); setCategoryModal(category); }}
        onDelete={(category) => void removeCategory(category)}
      />}
      {page === "category-detail" && selectedCategory && <CategoryDetailPage
        language={language}
        formatting={displayFormatting}
        pageSize={tablePageSize}
        category={selectedCategory}
        items={snapshot.items.filter((item) => item.categoryId === selectedCategory.id)}
        onBack={() => setPage("categories")}
        onViewItem={setViewedItem}
        onEditItem={(item) => { setError(""); itemEditOriginRef.current = "category-detail"; setItemModal(item); }}
        onDeleteItem={(item) => { void removeItem(item); }}
      />}
      {page === "movements" && <MovementsPage movements={snapshot.movements} pageSize={tablePageSize} language={language} formatting={displayFormatting} />}
      {page === "settings" && <SettingsPage preferences={preferences} onChange={preferenceState.updatePreferences} onReset={() => preferenceState.updatePreferences(createDefaultAppPreferences())} onClear={clearInventory} />}
    </main>

    {itemModal && <ItemModal
      language={language}
      item={itemModal === "new" ? null : itemModal}
      categories={snapshot.categories}
      error={error}
      saving={working}
      onClose={() => { setItemModal(null); itemEditOriginRef.current = null; }}
      onClearError={() => setError("")}
      onSave={saveItem}
    />}
    {viewedItem && <ItemDetailModal
      language={language}
      formatting={displayFormatting}
      item={viewedItem}
      categoryName={categoryName.get(viewedItem.categoryId)}
      onClose={() => setViewedItem(null)}
    />}
    {categoryModal && <CategoryModal
      language={language}
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

function localizedAppError(message: string, language: AppPreferences["language"]): string {
  const patterns: Array<[RegExp, TranslationKey]> = [
    [/Escribe el código del artículo\./, "writeItemCode"],
    [/Escribe un nombre para el artículo\.|Escribe el nombre del artículo\./, "writeItemName"],
    [/Ya existe un artículo con ese código\./, "duplicateItemCode"],
    [/Ya existe un artículo con ese número de serie\./, "duplicateSerialNumber"],
    [/El costo debe ser un número válido\.|El costo no puede ser negativo\./, "invalidCost"],
    [/Escribe el nombre de la categoría\./, "writeCategoryName"],
    [/Ya existe una categoría con ese nombre\./, "duplicateCategoryName"],
    [/El artículo ya no existe\./, "itemNoLongerExists"],
    [/La categoría ya no existe\./, "categoryNoLongerExists"],
    [/No se puede editar un artículo dado de baja\./, "cannotEditDecommissioned"],
    [/No se puede borrar un artículo dado de baja\./, "cannotDeleteDecommissioned"],
    [/Selecciona un estado válido para el artículo\./, "invalidAssetStatus"],
    [/La transición de estado no está permitida\./, "invalidStatusTransition"],
    [/Selecciona una categoría antes de guardar\./, "selectCategoryBeforeSave"],
    [/El motivo de la baja es obligatorio\./, "decommissionReasonRequired"],
    [/El motivo no puede superar los 200 caracteres/, "reasonLengthInvalid"],
  ];
  for (const [pattern, key] of patterns) {
    if (pattern.test(message)) return translated(language, key);
  }
  const associated = message.match(/No se puede borrar «(.+?)» porque tiene (\d+) artículo\(s\) asociado\(s\)\./);
  if (associated) return translated(language, "associatedArticleDeleteError", { name: associated[1], count: formatNumber(Number(associated[2]), language) });
  if (/base local|base de datos local|IndexedDB/i.test(message)) return translated(language, "databaseSaveFailure");
  return translated(language, "unexpectedError");
}

function Sidebar({ page, onPage, itemCount, categoryCount, language }: { page: Page; onPage: (page: Page) => void; itemCount: number; categoryCount: number; language: AppPreferences["language"] }) {
  const activePage = page === "category-detail" ? "categories" : page;
  const links: Array<{ key: Exclude<Page, "category-detail">; labelKey: TranslationKey; icon: IconName }> = [
    { key: "dashboard", labelKey: "dashboard", icon: "dashboard" },
    { key: "inventory", labelKey: "articles", icon: "box" },
    { key: "categories", labelKey: "categories", icon: "layers" },
    { key: "movements", labelKey: "movements", icon: "clock" },
    { key: "settings", labelKey: "settings", icon: "settings" },
  ];
  const t = (key: TranslationKey) => translated(language, key);
  return <aside className="sidebar">
    <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onPage("dashboard"); }}>
      <span className="brand-symbol"><Icon name="layers" size={19} /></span><span>{t("internalControl")}</span>
    </a>
    <div className="workspace-select"><span className="workspace-mark">I</span><span><strong>InventarioWeb</strong><small>{t("appDescription")}</small></span><Icon name="chevron" size={15} /></div>
    <div className="nav-label">{t("menu")}</div>
    <nav className="side-nav" aria-label={t("mainNavigation")}>
      {links.map((link) => {
        const label = t(link.labelKey);
        return <button key={link.key} className={`nav-link ${activePage === link.key ? "active" : ""}`} aria-label={label} aria-current={activePage === link.key ? "page" : undefined} title={label} onClick={() => onPage(link.key)}>
          <Icon name={link.icon} size={18} /><span>{label}</span>{link.key === "inventory" ? <span className="nav-count">{formatNumber(itemCount, language)}</span> : link.key === "categories" ? <span className="nav-count">{formatNumber(categoryCount, language)}</span> : null}
        </button>;
      })}
    </nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={16} /></span><strong>{t("controlOrganized")}</strong><p>{t("inventoryDescription")}</p></div>
  </aside>;
}

function SettingsPage({ preferences, onChange, onReset, onClear }: {
  preferences: AppPreferences;
  onChange: (change: PreferencesChange) => void;
  onReset: () => void;
  onClear: () => Promise<ClearInventoryResult>;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const cancelResetRef = useRef<HTMLButtonElement>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState("");
  const [clearError, setClearError] = useState<Exclude<ClearInventoryResult, "cleared"> | null>(null);
  const [clearing, setClearing] = useState(false);
  const clearConfirmationRef = useRef<HTMLInputElement>(null);
  const formatRateInput = (rate: number) => String(Number(rate.toFixed(8)));
  const [rateDrafts, setRateDrafts] = useState(() => ({
    crcPerUsd: formatRateInput(preferences.crcPerUsd ?? DEFAULT_CRC_PER_USD),
    eurPerUsd: formatRateInput(preferences.eurPerUsd ?? DEFAULT_EUR_PER_USD),
  }));
  const [rateErrors, setRateErrors] = useState({ crcPerUsd: false, eurPerUsd: false });
  const t = (key: TranslationKey) => translated(preferences.language, key);
  const tWith = (key: TranslationKey, parameters: TranslationParameters) => translated(preferences.language, key, parameters);
  const dateFormat = preferences.dateFormat ?? "dmy";
  const timeFormat = preferences.timeFormat ?? "12h";
  const clearKeyword = preferences.language === "es" ? "VACIAR" : "CLEAR";
  const canConfirmClear = clearConfirmation.trim().toLocaleUpperCase() === clearKeyword;

  function formatReferenceDate(value: string): string {
    const [year, month, day] = value.split("-");
    return dateFormat === "iso" ? value : `${day}/${month}/${year}`;
  }

  function updateRate(field: "crcPerUsd" | "eurPerUsd", value: string) {
    setRateDrafts((current) => ({ ...current, [field]: value }));
    const parsed = Number(value.trim());
    const isValid = value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;
    setRateErrors((current) => ({ ...current, [field]: !isValid }));
    if (!isValid) return;
    if (field === "crcPerUsd") onChange({ crcPerUsd: parsed });
    else onChange({ eurPerUsd: parsed });
  }

  function resetPreferences() {
    setRateDrafts({
      crcPerUsd: formatRateInput(DEFAULT_CRC_PER_USD),
      eurPerUsd: formatRateInput(DEFAULT_EUR_PER_USD),
    });
    setRateErrors({ crcPerUsd: false, eurPerUsd: false });
    onReset();
    setResetOpen(false);
  }

  function openClearConfirmation() {
    setClearConfirmation("");
    setClearError(null);
    setClearOpen(true);
  }

  function closeClearConfirmation() {
    if (clearing) return;
    setClearOpen(false);
    setClearConfirmation("");
    setClearError(null);
  }

  async function confirmInventoryClear() {
    if (!canConfirmClear || clearing) return;
    setClearing(true);
    setClearError(null);
    try {
      const result = await onClear();
      if (result === "cleared") {
        setClearOpen(false);
        setClearConfirmation("");
      } else {
        setClearError(result);
      }
    } finally {
      setClearing(false);
    }
  }

  const crcRate = preferences.crcPerUsd ?? DEFAULT_CRC_PER_USD;
  const eurRate = preferences.eurPerUsd ?? DEFAULT_EUR_PER_USD;
  const crcReferenceDate = formatReferenceDate(RATE_REFERENCE_METADATA.crc.date);
  const eurReferenceDate = formatReferenceDate(RATE_REFERENCE_METADATA.eur.date);
  const crcRateDescriptionId = "preference-crc-rate-description";
  const eurRateDescriptionId = "preference-eur-rate-description";

  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">{t("internalControl").toLocaleUpperCase(getLocale(preferences.language))}</div><h1>{t("settings")}</h1><p>{t("settingsDescription")}</p></div>
    </div>
    <section className="panel inventory-panel settings-group" aria-labelledby="settings-interface-heading">
      <div className="inventory-toolbar">
        <div><h2 id="settings-interface-heading">{t("interfacePreferences")}</h2><p>{t("localSettingsNote")}</p></div>
      </div>
      <div className="modal-form">
        <div className="form-grid">
          <label htmlFor="preference-language">{t("languagePreference")}
            <select id="preference-language" name="language" value={preferences.language} onChange={(event) => onChange({ language: event.target.value as AppPreferences["language"] })}>
              <option value="es">{t("languageSpanish")}</option>
              <option value="en">{t("languageEnglish")}</option>
            </select>
          </label>
          <label htmlFor="preference-theme">{t("theme")}
            <select id="preference-theme" name="theme" value={preferences.theme} onChange={(event) => onChange({ theme: event.target.value as ThemePreference })}>
              <option value="system">{t("themeSystem")}</option>
              <option value="light">{t("themeLight")}</option>
              <option value="dark">{t("themeDark")}</option>
            </select>
          </label>
          <label htmlFor="preference-table-density">{t("tableDensity")}
            <select id="preference-table-density" name="tableDensity" value={preferences.tableDensity} onChange={(event) => onChange({ tableDensity: event.target.value as AppPreferences["tableDensity"] })}>
              <option value="comfortable">{t("densityComfortable")}</option>
              <option value="compact">{t("densityCompact")}</option>
            </select>
          </label>
          <label htmlFor="preference-page-size">{t("tablePageSize")}
            <select id="preference-page-size" name="tablePageSize" value={preferences.tablePageSize ?? 25} onChange={(event) => onChange({ tablePageSize: event.target.value === "all" ? "all" : Number(event.target.value) as 10 | 15 | 25 | 50 })}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">{t("showAllRecords")}</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section className="panel inventory-panel settings-group" aria-labelledby="settings-summary-heading">
      <div className="inventory-toolbar"><div><h2 id="settings-summary-heading">{t("summaryVisibility")}</h2><p>{t("summaryVisibilityDescription")}</p></div></div>
      <div className="modal-form">
        <div className="form-grid">
          <label htmlFor="preference-activity-chart">{t("activityChartPreference")}
            <select id="preference-activity-chart" name="showRecentActivityChart" value={preferences.showRecentActivityChart ? "shown" : "hidden"} onChange={(event) => onChange({ showRecentActivityChart: event.target.value === "shown" })}>
              <option value="shown">{t("visible")}</option>
              <option value="hidden">{t("hidden")}</option>
            </select>
          </label>
          <label htmlFor="preference-category-chart">{t("categoryChartPreference")}
            <select id="preference-category-chart" name="showCategoryChart" value={preferences.showCategoryChart ? "shown" : "hidden"} onChange={(event) => onChange({ showCategoryChart: event.target.value === "shown" })}>
              <option value="shown">{t("visible")}</option>
              <option value="hidden">{t("hidden")}</option>
            </select>
          </label>
          <label htmlFor="preference-registered-value">{t("registeredValuePreference")}
            <select id="preference-registered-value" name="showRegisteredValue" value={(preferences.showRegisteredValue ?? true) ? "shown" : "hidden"} onChange={(event) => onChange({ showRegisteredValue: event.target.value === "shown" })}>
              <option value="shown">{t("visible")}</option>
              <option value="hidden">{t("hidden")}</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section className="panel inventory-panel settings-group" aria-labelledby="settings-currency-heading">
      <div className="inventory-toolbar"><div><h2 id="settings-currency-heading">{t("currencyAndFormat")}</h2><p>{t("currencyAndFormatDescription")}</p></div></div>
      <div className="modal-form">
        <div className="form-grid">
          <label htmlFor="preference-currency">{t("mainCurrency")}
            <select id="preference-currency" name="displayCurrency" value={preferences.displayCurrency ?? "USD"} onChange={(event) => onChange({ displayCurrency: event.target.value as NonNullable<AppPreferences["displayCurrency"]> })}>
              <option value="USD">$ USD</option>
              <option value="CRC">₡ CRC</option>
              <option value="EUR">€ EUR</option>
            </select>
          </label>
          <div className="form-grid field-span-2 settings-rate-fields">
            <label htmlFor="preference-crc-rate">{t("crcRateLabel")}
              <input id="preference-crc-rate" name="crcPerUsd" type="text" inputMode="decimal" value={rateDrafts.crcPerUsd} aria-invalid={rateErrors.crcPerUsd} aria-describedby={crcRateDescriptionId} onChange={(event) => updateRate("crcPerUsd", event.target.value)} />
              <span id={crcRateDescriptionId} className={rateErrors.crcPerUsd ? "form-error" : "modal-hint"} role={rateErrors.crcPerUsd ? "alert" : undefined}>
                {rateErrors.crcPerUsd
                  ? tWith("rateInvalid", { rate: crcRate })
                  : <>{tWith("crcRateReference", { date: crcReferenceDate })} {crcRate !== DEFAULT_CRC_PER_USD ? t("rateModifiedLocally") : t("rateReferenceDefault")}</>}
              </span>
            </label>
            <label htmlFor="preference-eur-rate">{t("eurRateLabel")}
              <input id="preference-eur-rate" name="eurPerUsd" type="text" inputMode="decimal" value={rateDrafts.eurPerUsd} aria-invalid={rateErrors.eurPerUsd} aria-describedby={eurRateDescriptionId} onChange={(event) => updateRate("eurPerUsd", event.target.value)} />
              <span id={eurRateDescriptionId} className={rateErrors.eurPerUsd ? "form-error" : "modal-hint"} role={rateErrors.eurPerUsd ? "alert" : undefined}>
                {rateErrors.eurPerUsd
                  ? tWith("rateInvalid", { rate: eurRate })
                  : <>{tWith("eurRateReference", { date: eurReferenceDate })} {eurRate !== DEFAULT_EUR_PER_USD ? t("rateModifiedLocally") : t("rateReferenceDefault")}</>}
              </span>
            </label>
          </div>
          <label htmlFor="preference-date-format">{t("dateFormatPreference")}
            <select id="preference-date-format" name="dateFormat" value={dateFormat} onChange={(event) => onChange({ dateFormat: event.target.value as NonNullable<AppPreferences["dateFormat"]> })}>
              <option value="dmy">{t("dateFormatDmy")}</option>
              <option value="iso">{t("dateFormatIso")}</option>
            </select>
          </label>
          <label htmlFor="preference-time-format">{t("timeFormatPreference")}
            <select id="preference-time-format" name="timeFormat" value={timeFormat} onChange={(event) => onChange({ timeFormat: event.target.value as NonNullable<AppPreferences["timeFormat"]> })}>
              <option value="12h">{t("timeFormat12h")}</option>
              <option value="24h">{t("timeFormat24h")}</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section className="panel inventory-panel settings-group" aria-labelledby="settings-danger-heading">
      <div className="inventory-toolbar"><div><h2 id="settings-danger-heading">{t("dangerZone")}</h2><p>{t("dangerZoneDescription")}</p></div></div>
      <div className="modal-form">
        <div className="modal-footer">
          <div className="settings-danger-preference">
            <span className="modal-hint">{t("inventoryDataUnaffected")}</span>
            <button className="button button-outline" type="button" onClick={() => setResetOpen(true)}>{t("resetPreferences")}</button>
          </div>
          <button className="button button-outline" type="button" onClick={openClearConfirmation}>{t("clearDatabase")}</button>
        </div>
      </div>
    </section>

    {resetOpen && <ModalFrame
      title={t("confirmResetPreferences")}
      subtitle={t("resetPreferencesWarning")}
      onClose={() => setResetOpen(false)}
      className="stock-modal"
      badge={<span className="modal-mark"><Icon name="settings" size={18} /></span>}
      closeLabel={t("closeConfirmation")}
      manageFocus
      initialFocusRef={cancelResetRef}
    >
      <div className="modal-form">
        <p>{t("resetPreferencesSummary")}</p>
        <div className="modal-footer">
          <button ref={cancelResetRef} className="button button-outline" type="button" onClick={() => setResetOpen(false)}>{t("cancel")}</button>
          <button className="button button-primary" type="button" onClick={resetPreferences}>{t("confirmResetPreferences")}</button>
        </div>
      </div>
    </ModalFrame>}
    {clearOpen && <ModalFrame
      title={t("clearDatabaseTitle")}
      subtitle={t("clearDatabaseWarning")}
      onClose={closeClearConfirmation}
      className="stock-modal"
      badge={<span className="modal-mark"><Icon name="alert" size={18} /></span>}
      closeLabel={t("closeConfirmation")}
      manageFocus
      dismissOnBackdrop={false}
      initialFocusRef={clearConfirmationRef}
    >
      <div className="modal-form">
        <label htmlFor="clear-database-confirmation">{t("clearDatabaseLabel")}
          <input
            ref={clearConfirmationRef}
            id="clear-database-confirmation"
            name="clearConfirmation"
            type="text"
            autoComplete="off"
            value={clearConfirmation}
            aria-describedby="clear-database-instruction"
            onChange={(event) => { setClearConfirmation(event.target.value); setClearError(null); }}
          />
        </label>
        <p id="clear-database-instruction" className="modal-hint">{tWith("clearDatabaseInstruction", { keyword: clearKeyword })}</p>
        {clearError && <p className="form-error" role="alert">{t(clearError === "legacy-error" ? "clearLegacyCleanupFailure" : "clearDatabaseFailure")}</p>}
        <div className="modal-footer">
          <button className="button button-outline" type="button" disabled={clearing} onClick={closeClearConfirmation}>{t("cancel")}</button>
          <button className="button button-primary" type="button" disabled={!canConfirmClear || clearing} onClick={() => void confirmInventoryClear()}>
            {clearing ? t("saving") : clearError ? t("retryClearDatabase") : t("confirmClearDatabase")}
          </button>
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

function buildWeeklyActivity(movements: InventoryMovement[], language: AppPreferences["language"], formatting: DisplayFormatting): WeeklyActivityDay[] {
  const today = new Date();
  const weekdayKeys: TranslationKey[] = ["weekdaySunday", "weekdayMonday", "weekdayTuesday", "weekdayWednesday", "weekdayThursday", "weekdayFriday", "weekdaySaturday"];
  const todayKey = localDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    return {
      dateKey: localDateKey(date),
      label: `${translated(language, weekdayKeys[date.getDay()])} ${formatNumber(date.getDate(), language, { useGrouping: false })}`,
      longLabel: `${formatDate(date, language, { weekday: "long" })} ${dateLabel(date, language, formatting)}`,
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

function ActivityChart({ movements, language, formatting }: { movements: InventoryMovement[]; language: AppPreferences["language"]; formatting: DisplayFormatting }) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const days = useMemo(() => buildWeeklyActivity(movements, language, formatting), [movements, formatting, language]);
  const maximum = Math.max(1, ...days.map((day) => day.count));
  const yTicks = (maximum <= 3
    ? Array.from({ length: maximum + 1 }, (_, index) => maximum - index)
    : [maximum, Math.floor(maximum / 2), 0]
  ).map((value) => ({
    value,
    position: `${value / maximum * 100}%`,
  }));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const weekSuffix = t("movementsThisWeek").replace(t("movementPlural"), "").trim();
  const activitySummary = days.map((day) => t("recentMovementSummary", {
    date: day.longLabel,
    count: formatNumber(day.count, language),
    movementLabel: t(day.count === 1 ? "movementSingular" : "movementPlural"),
  })).join(". ");

  return <section className="panel movement-chart-panel activity-chart-panel" aria-labelledby="activity-chart-title">
    <div className="panel-heading">
      <div><h2 id="activity-chart-title">{t("recentActivity")}</h2><p>{t("recentActivityDescription")}</p></div>
      <span className="panel-icon"><Icon name="clock" size={18} /></span>
    </div>
    {total === 0 && <p className="chart-empty-note">{t("noRecentMovements")}</p>}
    <div className="chart-area" role="img" aria-label={t("activityChartAccessibleName", { summary: activitySummary })}>
      <div className="chart-y-labels" aria-hidden="true">{yTicks.map((tick) => <span key={tick.value} style={{ bottom: tick.position }}>{formatNumber(tick.value, language)}</span>)}</div>
      <div className="chart-plot" aria-hidden="true">
        {yTicks.map((tick) => <span className="chart-gridline" key={tick.value} style={{ bottom: tick.position }} />)}
        <div className="chart-bars">
          {days.map((day) => <div className="chart-column" key={day.dateKey}>
            <span className="bar-count-label" aria-hidden="true" style={{ bottom: `calc(${day.count / maximum * 100}% + 6px)` }}>{formatNumber(day.count, language)}</span>
            <div className="bar-rail"><span className={`bar-fill${day.count === 0 ? " inactive" : day.isToday ? " current" : ""}`} style={{ height: `${day.count / maximum * 100}%` }} /></div>
          </div>)}
        </div>
      </div>
      <div className="chart-x-labels" aria-hidden="true">{days.map((day) => <span key={day.dateKey}>{day.label}</span>)}</div>
    </div>
    <div className="chart-legend"><span className="legend-dot" /><span>{t("activityByDay")}</span><strong className="chart-total">{formatNumber(total, language)} {t(total === 1 ? "movementSingular" : "movementPlural")} {weekSuffix}</strong></div>
  </section>;
}

function movementActionLabel(type: InventoryMovement["type"], language: AppPreferences["language"]): string {
  return translated(language, type === "created" ? "entry" : type === "updated" ? "edit" : "removal");
}

function movementActionIcon(type: InventoryMovement["type"]): IconName {
  if (type === "created") return "plus";
  if (type === "updated") return "edit";
  return "trash";
}

const movementAuditFields: Array<{ field: InventoryMovementAuditField; label: TranslationKey }> = [
  { field: "code", label: "code" },
  { field: "name", label: "name" },
  { field: "categoryName", label: "category" },
  { field: "serialNumber", label: "serialNumber" },
  { field: "location", label: "location" },
  { field: "cost", label: "cost" },
  { field: "brand", label: "brand" },
  { field: "model", label: "model" },
  { field: "notes", label: "notes" },
];

const movementAuditFieldsV2: Array<{ field: InventoryMovementAuditFieldV2; label: TranslationKey }> = [
  ...movementAuditFields,
  { field: "status", label: "statusLabel" },
];

function movementAuditValueLabel(value: string | number | null, language: AppPreferences["language"], formatting: DisplayFormatting): string {
  if (typeof value === "number") return costLabel(value, language, formatting);
  return value?.trim() || translated(language, "unspecified");
}

function historicalMovementValueLabel(
  snapshot: Partial<InventoryMovementAuditSnapshot> | undefined,
  field: InventoryMovementAuditField,
  language: AppPreferences["language"],
  formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING,
): string {
  if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, field) || snapshot[field] === undefined) {
    return translated(language, "noHistoricalData");
  }

  const value = snapshot[field];
  if (value === null) return translated(language, "unspecified");
  if (typeof value === "number") return costLabel(value, language, formatting);

  const trimmedValue = value.trim();
  if (trimmedValue) return trimmedValue;
  return field === "code" || field === "name" || field === "categoryName"
    ? translated(language, "noHistoricalData")
    : translated(language, "unspecified");
}

function movementStatusValueLabel(value: string, language: AppPreferences["language"]): string {
  const resolved = presentAssetStatus(value, language);
  return resolved.kind === "canonical"
    ? resolved.label
    : `${resolved.label} — ${resolved.rawValue}`;
}

function movementAuditValueLabelV2(value: string | number | null, field: InventoryMovementAuditFieldV2, language: AppPreferences["language"], formatting: DisplayFormatting): string {
  return field === "status" ? movementStatusValueLabel(String(value ?? ""), language) : movementAuditValueLabel(value, language, formatting);
}

function movementItemNameLabel(movement: InventoryMovement, language: AppPreferences["language"]): string {
  if (movement.auditVersion === 1) return movement.itemSnapshot.name;
  return historicalMovementValueLabel(movement.itemSnapshot, "name", language);
}

function movementItemSummaryLabel(movement: InventoryMovement, language: AppPreferences["language"]): string {
  if (movement.auditVersion === 1) {
    return `${movement.itemSnapshot.code} · ${movement.itemSnapshot.categoryName}`;
  }
  if (!movement.itemSnapshot) return translated(language, "movementWithoutArticleData");
  return `${historicalMovementValueLabel(movement.itemSnapshot, "code", language)} · ${historicalMovementValueLabel(movement.itemSnapshot, "categoryName", language)}`;
}

function MovementDetailContent({ movement, language, formatting }: { movement: InventoryMovement; language: AppPreferences["language"]; formatting: DisplayFormatting }) {
  const t = (key: TranslationKey) => translated(language, key);
  if (movement.auditVersion === 2 && movement.type === "updated") {
    const hasStatusChange = Object.prototype.hasOwnProperty.call(movement.changes, "status");
    return <div className="modal-form movement-detail-content">
      <h3>{t("modifiedFields")}</h3>
      <div className="movement-diff-list">
        <div className="movement-diff-heading"><span>{t("field")}</span><span>{t("before")}</span><span>{t("after")}</span></div>
        {movementAuditFieldsV2.map(({ field, label }) => {
          const change = movement.changes[field];
          if (!change) return null;
          return <div className="movement-diff-row" key={field}>
            <strong>{t(label)}</strong>
            <div><span>{t("before")}</span><p>{movementAuditValueLabelV2(change.before, field, language, formatting)}</p></div>
            <div><span>{t("after")}</span><p>{movementAuditValueLabelV2(change.after, field, language, formatting)}</p></div>
          </div>;
        })}
      </div>
      {hasStatusChange && <div className="modal-hint movement-reason-context"><strong>{t("reason")}</strong><p>{movement.reason?.trim() || t("noHistoricalData")}</p></div>}
    </div>;
  }

  if (movement.auditVersion === 1 && movement.type === "updated") {
    return <div className="modal-form movement-detail-content">
      <h3>{t("modifiedFields")}</h3>
      <div className="movement-diff-list">
        <div className="movement-diff-heading"><span>{t("field")}</span><span>{t("before")}</span><span>{t("after")}</span></div>
        {movementAuditFields.map(({ field, label }) => {
          const change = movement.changes[field];
          if (!change) return null;
          return <div className="movement-diff-row" key={field}>
            <strong>{t(label)}</strong>
            <div><span>{t("before")}</span><p>{movementAuditValueLabel(change.before, language, formatting)}</p></div>
            <div><span>{t("after")}</span><p>{movementAuditValueLabel(change.after, language, formatting)}</p></div>
          </div>;
        })}
      </div>
    </div>;
  }

  if (movement.auditVersion === 1) {
    const snapshot = movement.itemSnapshot;
    return <div className="modal-form movement-detail-content">
      <dl className="article-detail-grid movement-audit-fields">
        <div><dt>{t("code")}</dt><dd>{snapshot.code}</dd></div>
        <div><dt>{t("name")}</dt><dd>{snapshot.name}</dd></div>
        <div><dt>{t("category")}</dt><dd>{snapshot.categoryName}</dd></div>
        <div><dt>{t("serialNumber")}</dt><dd>{movementAuditValueLabel(snapshot.serialNumber, language, formatting)}</dd></div>
        <div><dt>{t("location")}</dt><dd>{movementAuditValueLabel(snapshot.location, language, formatting)}</dd></div>
        <div><dt>{t("cost")}</dt><dd>{costLabel(snapshot.cost, language, formatting)}</dd></div>
        <div><dt>{t("brand")}</dt><dd>{movementAuditValueLabel(snapshot.brand, language, formatting)}</dd></div>
        <div><dt>{t("model")}</dt><dd>{movementAuditValueLabel(snapshot.model, language, formatting)}</dd></div>
        <div className="detail-span"><dt>{t("notes")}</dt><dd>{movementAuditValueLabel(snapshot.notes, language, formatting)}</dd></div>
      </dl>
    </div>;
  }

  if (movement.auditVersion === 2 && (movement.type === "created" || movement.type === "deleted")) {
    const snapshot = movement.itemSnapshot;
    const statusLabel = t(movement.type === "created" ? "statusInitial" : "previousStatus");
    return <div className="modal-form movement-detail-content">
      <dl className="article-detail-grid movement-audit-fields">
        <div><dt>{t("code")}</dt><dd>{snapshot.code}</dd></div>
        <div><dt>{t("name")}</dt><dd>{snapshot.name}</dd></div>
        <div><dt>{t("category")}</dt><dd>{snapshot.categoryName}</dd></div>
        <div><dt>{t("serialNumber")}</dt><dd>{movementAuditValueLabel(snapshot.serialNumber, language, formatting)}</dd></div>
        <div><dt>{t("location")}</dt><dd>{movementAuditValueLabel(snapshot.location, language, formatting)}</dd></div>
        <div><dt>{t("cost")}</dt><dd>{costLabel(snapshot.cost, language, formatting)}</dd></div>
        <div><dt>{t("brand")}</dt><dd>{movementAuditValueLabel(snapshot.brand, language, formatting)}</dd></div>
        <div><dt>{t("model")}</dt><dd>{movementAuditValueLabel(snapshot.model, language, formatting)}</dd></div>
        <div className="detail-span"><dt>{t("notes")}</dt><dd>{movementAuditValueLabel(snapshot.notes, language, formatting)}</dd></div>
        <div><dt>{statusLabel}</dt><dd>{movementStatusValueLabel(snapshot.status, language)}</dd></div>
      </dl>
    </div>;
  }

  const snapshot = movement.itemSnapshot;
  return <div className="modal-form movement-detail-content">
    <p>{t("historicalDetailsUnavailable")}</p>
    <dl className="article-detail-grid movement-audit-fields">
      {movementAuditFields.map(({ field, label }) => <div className={field === "notes" ? "detail-span" : undefined} key={field}>
        <dt>{t(label)}</dt>
        <dd>{historicalMovementValueLabel(snapshot, field, language, formatting)}</dd>
      </div>)}
    </dl>
  </div>;
}

function MovementsPage({ movements, pageSize, language, formatting }: { movements: InventoryMovement[]; pageSize: TablePageSize; language: AppPreferences["language"]; formatting: DisplayFormatting }) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const filteredMovements = useMemo(() => movements
    .map((movement, index) => ({ movement, index }))
    .filter(({ movement }) => filter === "all" || movement.type === filter)
    .sort((left, right) => Date.parse(right.movement.occurredAt) - Date.parse(left.movement.occurredAt) || right.index - left.index)
    .map(({ movement }) => movement), [filter, movements]);
  const pagination = useTablePagination(filteredMovements, pageSize, filter);

  function changeFilter(value: MovementFilter) {
    setFilter(value);
  }

  return <section className="page-content">
    <div className="page-heading movement-page-heading">
      <div><div className="eyebrow">{t("internalControl").toLocaleUpperCase(getLocale(language))}</div><h1>{t("movements")}</h1><p>{t("movementsDescription")}</p></div>
    </div>
    <section className="panel inventory-panel movement-history-panel">
      <div className="inventory-toolbar movement-toolbar">
        <div><h2>{t("fullMovementHistory")}</h2><p className="inventory-count">{t("movementCountInHistory", { count: formatNumber(filteredMovements.length, language) })}</p></div>
        <label className="movement-filter"><span>{t("typeOfAction")}</span>
          <select id="movement-filter" name="movementFilter" aria-label={t("filterByAction")} value={filter} onChange={(event) => changeFilter(event.target.value as MovementFilter)}>
            <option value="all">{t("allMovements")}</option>
            <option value="created">{t("newEntries")}</option>
            <option value="updated">{t("edits")}</option>
            <option value="deleted">{t("removals")}</option>
          </select>
        </label>
      </div>
      {pagination.rows.length > 0 ? <div className="table-scroll"><table className="product-table movement-history-table">
        <caption className="sr-only">{t("fullMovementHistory")}</caption>
        <thead><tr><th scope="col">{t("action")}</th><th scope="col">{t("article")}</th><th scope="col">{t("dateAndTime")}</th><th scope="col">{t("actions")}</th></tr></thead>
        <tbody>{pagination.rows.map((movement) => <tr key={movement.id}>
          <td><span className={`movement-action action-${movement.type}`}><Icon name={movementActionIcon(movement.type)} size={14} />{movementActionLabel(movement.type, language)}</span></td>
          <td><div className="movement-article"><strong>{movement.itemSnapshot ? movementItemNameLabel(movement, language) : t("itemWithoutAssociatedData")}</strong><small>{movementItemSummaryLabel(movement, language)}</small></div></td>
          <td className="date-cell"><time dateTime={movement.occurredAt}>{dateLabel(movement.occurredAt, language, formatting)}</time></td>
          <td><button className="button button-outline movement-detail-button" type="button" aria-label={t("viewDetails")} onClick={() => setSelectedMovement(movement)}><Icon name="view" size={15} />{t("viewDetails")}</button></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState
        title={movements.length === 0 ? t("noMovementsYet") : t("noMovementsForType")}
        text={movements.length === 0 ? t("recentMovementsEmpty") : t("tryAnotherMovementFilter")}
      />}
      <div className="table-foot movement-table-foot">
        <span>{t("showing")} <strong>{formatNumber(pagination.rangeStart, language)}–{formatNumber(pagination.rangeEnd, language)}</strong> {t("of")} <strong>{formatNumber(filteredMovements.length, language)}</strong> {t("movementPlural")}</span>
        {filteredMovements.length > 0 && <TablePaginationControls page={pagination.currentPage} pageCount={pagination.pageCount} onPageChange={(page) => pagination.setCurrentPage(page)} language={language} />}
      </div>
    </section>
    {selectedMovement && <ModalFrame
      title={movementItemNameLabel(selectedMovement, language)}
      subtitle={`${selectedMovement.auditVersion === 1 ? selectedMovement.itemSnapshot.code : historicalMovementValueLabel(selectedMovement.itemSnapshot, "code", language, formatting)} · ${dateLabel(selectedMovement.occurredAt, language, formatting)}`}
      badge={<span className={`movement-action action-${selectedMovement.type}`}><Icon name={movementActionIcon(selectedMovement.type)} size={14} />{movementActionLabel(selectedMovement.type, language)}</span>}
      closeLabel={translated(language, "close")}
      manageFocus
      onClose={() => setSelectedMovement(null)}
    ><MovementDetailContent movement={selectedMovement} language={language} formatting={formatting} /></ModalFrame>}
  </section>;
}

function DashboardPage({ items, categories, movements, categoryName, language, formatting, showRecentActivityChart, showCategoryChart, showRegisteredValue, displayCurrency, crcPerUsd, eurPerUsd, onViewInventory, onViewCategories }: {
  items: InventoryItem[];
  categories: Category[];
  movements: InventoryMovement[];
  categoryName: Map<string, string>;
  language: AppPreferences["language"];
  formatting: DisplayFormatting;
  showRecentActivityChart: boolean;
  showCategoryChart: boolean;
  showRegisteredValue: boolean;
  displayCurrency: NonNullable<AppPreferences["displayCurrency"]>;
  crcPerUsd: number;
  eurPerUsd: number;
  onViewInventory: () => void;
  onViewCategories: () => void;
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
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
  const registeredCosts = items.map((item) => item.cost !== null && Number.isFinite(item.cost) && item.cost >= 0 ? item.cost : null);
  const registeredValue = sumAndConvertUsdCosts(registeredCosts, displayCurrency, { crcPerUsd, eurPerUsd });
  const fullRegisteredValue = formatCurrency(registeredValue, displayCurrency, language);
  const useCompactRegisteredValue = fullRegisteredValue.length > 10;
  const registeredValueStat = {
    label: t("registeredValue"),
    value: useCompactRegisteredValue ? compactDisplayValueLabel(registeredValue, displayCurrency, language) : fullRegisteredValue,
    detail: t("capturedCostsSum"),
    icon: "currency" as const,
    color: "green",
    currency: true,
    exactValue: fullRegisteredValue,
    compact: useCompactRegisteredValue,
  };
  const stats: Array<{ label: string; value: string; detail: string; icon: IconName; color: string; currency?: boolean; exactValue?: string; compact?: boolean }> = [
    { label: t("registeredArticles"), value: formatNumber(items.length, language), detail: t("currentRegister"), icon: "box", color: "violet" },
    { label: t("categories"), value: formatNumber(categories.length, language), detail: t("toClassifyArticles"), icon: "layers", color: "blue" },
    ...(showRegisteredValue ? [registeredValueStat] : []),
  ];
  return <section className="page-content">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">{formatDate(new Date(), language, { weekday: "long" })} · {formatCalendarDate(new Date(), language, formatting.dateFormat)}</div><h1>{formatGreeting(new Date().getHours(), language)} <span className="wave">✦</span></h1><p>{t("dashboardDescription")}</p></div>
      <div className="dashboard-actions"><button className="button button-outline" onClick={onViewCategories}><Icon name="layers" size={17} />{t("view")} {t("categories")}</button><button className="button button-primary" onClick={onViewInventory}><Icon name="box" size={17} />{t("view")} {t("articles")}</button></div>
    </div>

    <div className="stats-grid stats-grid-internal" style={stats.length === 2 ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } : undefined}>
      {stats.map((stat) => <article className="stat-card" key={stat.label} style={stats.length === 2 ? { gridColumn: "auto" } : undefined}>
        <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}><Icon name={stat.icon} size={17} /></span></div>
        <strong
          className={`stat-value${stat.currency ? " stat-value-currency" : ""}`}
          aria-label={stat.exactValue}
          title={stat.compact ? stat.exactValue : undefined}
          tabIndex={stat.compact ? 0 : undefined}
        >{stat.value}</strong><span className="stat-detail">{stat.detail}</span>
      </article>)}
    </div>

    <div className="dashboard-grid internal-dashboard-grid" data-show-activity-chart={showRecentActivityChart} data-show-category-chart={showCategoryChart}>
      {showRecentActivityChart && <ActivityChart movements={movements} language={language} formatting={formatting} />}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div className="recent-panel-heading-main">
            <h2>{t("recentEntries")}</h2>
            <p>{t("recentlyAddedArticles")}</p>
          </div>
          <div className="recent-heading-tools">
            {recentItems.length > recentPageSize && <nav className="recent-pagination" aria-label={t("recentItemsPagination")}>
              <button className="quiet-icon recent-page-button" aria-label={t("previousPage")} title={t("previousEntries")} onClick={() => setRecentPage((page) => Math.max(1, Math.min(page, recentPageCount) - 1))} disabled={currentRecentPage === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
              <span className="sr-only" aria-live="polite">{t("movementPageCount", { page: formatNumber(currentRecentPage, language), pages: formatNumber(recentPageCount, language) })}</span>
              <button className="quiet-icon recent-page-button" aria-label={t("nextPage")} title={t("moreEntries")} onClick={() => setRecentPage((page) => Math.min(recentPageCount, Math.min(page, recentPageCount) + 1))} disabled={currentRecentPage === recentPageCount}><Icon name="chevron" size={15} /></button>
            </nav>}
            <span className="panel-icon"><Icon name="clock" size={18} /></span>
          </div>
        </div>
        {recentItems.length > 0 ? <div className="recent-list">
          {visibleRecentItems.map((item) => <div className="recent-row article-recent-row" key={item.id}>
            <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
            <span className="recent-copy"><strong>{item.name}</strong><small>{categoryName.get(item.categoryId) ?? t("noCategory")} · {dateLabel(item.createdAt, language, formatting)}</small></span>
          </div>)}
        </div> : <EmptyState title={t("noArticlesYet")} text={t("articlesWillAppear")} />}
      </section>
      {showCategoryChart && <section className="panel category-panel">
        <div className="panel-heading category-panel-heading">
          <div className="category-heading-copy"><h2>{t("articlesByCategory")}</h2><p>{t("categoryItemsCountDescription")}</p></div>
          <div className="category-heading-tools">
            <div className="category-view-toggle" role="group" aria-label={t("categoryChartMode")}>
              <button type="button" aria-label={t("showPercentages")} aria-pressed={categoryViewMode === "percentage"} onClick={() => setCategoryViewMode("percentage")}>%</button>
              <button type="button" aria-label={t("showArticleCount")} aria-pressed={categoryViewMode === "count"} onClick={() => setCategoryViewMode("count")}>#</button>
            </div>
            <span className="panel-icon" aria-hidden="true"><Icon name="layers" size={18} /></span>
          </div>
        </div>
        <div className="category-list">
          {categoryTotals.map((category, index) => {
            const percentage = items.length > 0 ? category.count / items.length * 100 : 0;
            const barWidth = categoryViewMode === "percentage" ? percentage : category.count / maxCategoryCount * 100;
            const displayValue = categoryViewMode === "percentage"
              ? `${formatNumber(percentage, language, { maximumFractionDigits: 1 })}%`
              : formatNumber(category.count, language);
            return <div className="category-item" key={category.id}>
              <div className="category-label"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><span className="category-name">{category.name}<small>{t(category.count === 1 ? "categoryCountSingular" : "categoryCountPlural", { count: formatNumber(category.count, language) })}</small></span><strong>{displayValue}</strong></div>
              <div className="category-track"><span className={`category-progress progress-${index % 4}`} style={{ width: `${barWidth}%` }} /></div>
            </div>;
          })}
          {categoryTotals.length === 0 && <EmptyState title={t("noCategoriesYet")} text={t("categoriesWillAppear")} />}
        </div>
      </section>}
    </div>
  </section>;
}

function InventoryPage({ items, allItems, categories, categoryFilter, onCategoryFilter, statusFilter, onStatusFilter, onNew, onView, onEdit, onDelete, onExport, pageSize, search, language, formatting }: {
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
  pageSize: TablePageSize;
  search: string;
  language: AppPreferences["language"];
  formatting: DisplayFormatting;
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const protectionDescriptionPrefix = useId();
  const pagination = useTablePagination(items, pageSize, `${categoryFilter}:${statusFilter}:${search}`);
  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">{t("internalControl").toLocaleUpperCase(getLocale(language))}</div><h1>{t("articles")}</h1><p>{t("inventoryDescription")}</p></div>
      <button className="button button-primary" onClick={(event) => { event.currentTarget.focus(); onNew(); }}><Icon name="plus" size={18} />{t("addArticle")}</button>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div><h2>{t("articleRegistry")}</h2><p className="inventory-count">{t("articleRecordSummary", { visible: formatNumber(items.length, language), total: formatNumber(allItems.length, language) })}</p></div>
        <div className="toolbar-actions">
          <select id="category-filter" name="categoryFilter" aria-label={t("filterByCategory")} value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="all">{t("allCategories")}</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
          <select id="status-filter" name="statusFilter" aria-label={t("filterByStatus")} value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as AssetStatusFilter)}>
            <option value="all">{t("all")}</option>
            {ASSET_STATUS_FILTER_OPTIONS.map((status) => <option value={status} key={status}>{assetStatusLabel(status, language)}</option>)}
          </select>
          <button className="button button-outline" onClick={onExport} disabled={items.length === 0}><Icon name="download" size={16} />{t("export")}</button>
        </div>
      </div>
      {pagination.rows.length > 0 ? <div className="table-scroll"><table className="product-table article-table">
        <thead><tr><th>{t("name")}</th><th>{t("categoryColumn")}</th><th>{t("statusLabel")}</th><th>{t("entryDate")}</th><th>{t("actions")}</th></tr></thead>
        <tbody>{pagination.rows.map((item, index) => {
          const protectedItem = isDecommissioned(item);
          const protectionDescriptionId = `${protectionDescriptionPrefix}-item-${index}`;
          const protectionMessage = t("decommissionedProtection");
          return <tr key={item.id}>
            <td><div className="product-cell"><span className={`product-avatar avatar-${index % 5}`}>{item.name.slice(0, 1)}</span><strong>{item.name}</strong></div></td>
            <td><span className="category-chip">{categories.find((category) => category.id === item.categoryId)?.name ?? t("noCategory")}</span></td>
            <td><AssetStatusBadge status={item.status} language={language} /></td>
            <td className="date-cell">{dateLabel(item.createdAt, language, formatting)}</td>
            <td><div className="row-actions">
              <button className="quiet-icon" data-item-view-id={item.id} onClick={() => onView(item)} title={`${t("view")} ${item.name}`} aria-label={`${t("view")} ${item.name}`}><Icon name="view" size={16} /></button>
              <button className="quiet-icon" onClick={(event) => { event.currentTarget.focus(); onEdit(item); }} title={protectedItem ? protectionMessage : `${t("edit")} ${item.name}`} aria-label={`${t("edit")} ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="edit" size={16} /></button>
              <button className="quiet-icon danger-icon" onClick={() => onDelete(item)} title={protectedItem ? protectionMessage : t("confirmDeleteArticle", { name: item.name })} aria-label={t("confirmDeleteArticle", { name: item.name })} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="trash" size={16} /></button>
              {protectedItem && <span id={protectionDescriptionId} className="sr-only">{protectionMessage}</span>}
            </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title={t("noArticlesToShow")} text={t("adjustArticleFilter")} />}
      <div className="table-foot"><span>{t("allItemCount", { visible: formatNumber(items.length, language), total: formatNumber(allItems.length, language) })}</span><span className="table-foot-note"><Icon name="layers" size={14} />{t(items.length === 1 ? "savedInBrowserSingular" : "savedInBrowserPlural")}</span>{items.length > 0 && <TablePaginationControls page={pagination.currentPage} pageCount={pagination.pageCount} onPageChange={(page) => pagination.setCurrentPage(page)} language={language} />}</div>
    </section>
  </section>;
}

function CategoriesPage({ categories, items, onNew, onView, onEdit, onDelete, pageSize, language }: {
  categories: Category[];
  items: InventoryItem[];
  onNew: () => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  pageSize: TablePageSize;
  language: AppPreferences["language"];
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const sortedCategories = [...categories].sort((left, right) => left.name.localeCompare(right.name, getLocale(language)));
  const pagination = useTablePagination(sortedCategories, pageSize);
  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">{t("internalControl").toLocaleUpperCase(getLocale(language))}</div><h1>{t("categories")}</h1><p>{t("categoryDescription")}</p></div>
      <button className="button button-primary" onClick={(event) => { event.currentTarget.focus(); onNew(); }}><Icon name="plus" size={18} />{t("addCategory")}</button>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div><h2>{t("categoryRegistry")}</h2><p className="inventory-count">{t("allCategoryCount", { count: formatNumber(categories.length, language) })}</p></div></div>
      {pagination.rows.length > 0 ? <div className="table-scroll"><table className="product-table category-table">
        <thead><tr><th>{t("name")}</th><th>{t("associatedArticles")}</th><th>{t("actions")}</th></tr></thead>
        <tbody>{pagination.rows.map((category, index) => {
          const count = items.filter((item) => item.categoryId === category.id).length;
          return <tr key={category.id}>
            <td><div className="product-cell"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><strong>{category.name}</strong></div></td>
            <td>{t(count === 1 ? "associatedArticleSingular" : "associatedArticlePlural", { count: formatNumber(count, language) })}</td>
            <td><div className="row-actions">
              <button className="quiet-icon" onClick={() => onView(category)} title={`${t("view")} ${category.name}`} aria-label={`${t("view")} ${category.name}`}><Icon name="view" size={16} /></button>
              <button className="quiet-icon" onClick={(event) => { event.currentTarget.focus(); onEdit(category); }} title={`${t("edit")} ${category.name}`} aria-label={`${t("edit")} ${category.name}`}><Icon name="edit" size={16} /></button>
              <button className="quiet-icon danger-icon" onClick={() => onDelete(category)} title={t("confirmDeleteCategory", { name: category.name })} aria-label={t("confirmDeleteCategory", { name: category.name })}><Icon name="trash" size={16} /></button>
            </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title={t("noCategoriesYet")} text={t("addCategoryToClassify")} />}
      <div className="table-foot"><span>{t("allCategoryCount", { count: formatNumber(categories.length, language) })}</span><span className="table-foot-note"><Icon name="layers" size={14} />{t(categories.length === 1 ? "savedInBrowserSingular" : "savedInBrowserPlural")}</span>{categories.length > 0 && <TablePaginationControls page={pagination.currentPage} pageCount={pagination.pageCount} onPageChange={(page) => pagination.setCurrentPage(page)} language={language} />}</div>
    </section>
  </section>;
}

function CategoryDetailPage({ category, items, onBack, onViewItem, onEditItem, onDeleteItem, pageSize, language, formatting }: {
  category: Category;
  items: InventoryItem[];
  onBack: () => void;
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  pageSize: TablePageSize;
  language: AppPreferences["language"];
  formatting: DisplayFormatting;
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const protectionDescriptionPrefix = useId();
  const sortedItems = [...items].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  const pagination = useTablePagination(sortedItems, pageSize, category.id);
  return <section className="page-content">
    <div className="page-heading">
      <div><button className="text-link category-back" onClick={onBack}><Icon name="chevron" size={15} />{t("backToCategories")}</button><div className="eyebrow">{t("categoryDetailEyebrow")}</div><h1>{category.name}</h1><p>{t(items.length === 1 ? "associatedArticleSingular" : "associatedArticlePlural", { count: formatNumber(items.length, language) })}.</p></div>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div><h2>{t("articleListForCategory", { category: category.name })}</h2><p>{t("lastModificationDescription")}</p></div></div>
      {pagination.rows.length > 0 ? <div className="table-scroll"><table className="product-table category-detail-table">
        <thead><tr><th>{t("code")}</th><th>{t("name")}</th><th>{t("statusLabel")}</th><th>{t("serialNumber")}</th><th>{t("location")}</th><th>{t("lastModified")}</th><th>{t("actions")}</th></tr></thead>
        <tbody>{pagination.rows.map((item, index) => {
          const protectedItem = isDecommissioned(item);
          const protectionDescriptionId = `${protectionDescriptionPrefix}-item-${index}`;
          const protectionMessage = t("decommissionedProtection");
          return <tr key={item.id}>
          <td className="sku-code">{item.code}</td>
          <td><strong className="category-item-name">{item.name}</strong></td>
          <td><AssetStatusBadge status={item.status} language={language} /></td>
          <td>{item.serialNumber || "—"}</td>
          <td>{item.location || t("unspecified")}</td>
          <td className="date-cell">{dateLabel(item.updatedAt, language, formatting)}</td>
          <td><div className="row-actions">
            <button className="quiet-icon" data-item-view-id={item.id} onClick={() => onViewItem(item)} title={`${t("view")} ${item.name}`} aria-label={`${t("view")} ${item.name}`}><Icon name="view" size={16} /></button>
            <button className="quiet-icon" onClick={(event) => { event.currentTarget.focus(); onEditItem(item); }} title={protectedItem ? protectionMessage : `${t("edit")} ${item.name}`} aria-label={`${t("edit")} ${item.name}`} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="edit" size={16} /></button>
            <button className="quiet-icon danger-icon" onClick={() => onDeleteItem(item)} title={protectedItem ? protectionMessage : t("confirmDeleteArticle", { name: item.name })} aria-label={t("confirmDeleteArticle", { name: item.name })} disabled={protectedItem} aria-disabled={protectedItem} aria-describedby={protectedItem ? protectionDescriptionId : undefined}><Icon name="trash" size={16} /></button>
            {protectedItem && <span id={protectionDescriptionId} className="sr-only">{protectionMessage}</span>}
          </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyState title={t("noAssociatedArticles")} text={t("categoryArticlesWillAppear")} />}
      <div className="table-foot"><span>{t("categoryDetailItemCount", { count: formatNumber(items.length, language) })}</span><span className="table-foot-note"><Icon name="layers" size={14} />{t(items.length === 1 ? "savedInBrowserSingular" : "savedInBrowserPlural")}</span>{items.length > 0 && <TablePaginationControls page={pagination.currentPage} pageCount={pagination.pageCount} onPageChange={(page) => pagination.setCurrentPage(page)} language={language} />}</div>
    </section>
  </section>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function LoadingScreen({ language }: { language: AppPreferences["language"] }) {
  return <div className="loading-screen" lang={language}><span className="loading-mark"><Icon name="layers" size={20} /></span><span>{translated(language, "loadingRegistry")}</span></div>;
}

function CategoryModal({ category, error, saving, onClose, onSave, language }: { category: Category | null; error: string; saving: boolean; onClose: () => void; onSave: (draft: CategoryDraft) => Promise<void>; language: AppPreferences["language"] }) {
  const t = (key: TranslationKey) => translated(language, key);
  const [name, setName] = useState(category?.name ?? "");
  const nameInputRef = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({ name });
  }
  return <ModalFrame title={t(category ? "editCategory" : "addCategory")} subtitle={t("writeCategoryName")} closeLabel={t("close")} onClose={onClose} manageFocus initialFocusRef={nameInputRef}>
    <form className="modal-form" onSubmit={(event) => void submit(event)}>
      <label>{t("name")}<input ref={nameInputRef} required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("categoryNamePlaceholder")} /></label>
      {error && <p className="form-error" role="alert">{localizedAppError(error, language)}</p>}
      <div className="modal-footer"><span className="modal-hint">{t("categoryNameMustBeUnique")}</span><button className="button button-outline" type="button" onClick={onClose}>{t("cancel")}</button><button className="button button-primary" disabled={saving}>{saving ? t("saving") : category ? t("saveChanges") : t("addCategory")}</button></div>
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
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
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
    if (!previouslyFocusedElementRef.current && document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }
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
      if (dialog && !dialog.isConnected) {
        const previouslyFocusedElement = previouslyFocusedElementRef.current;
        if (previouslyFocusedElement?.isConnected) {
          window.requestAnimationFrame(() => previouslyFocusedElement.focus());
        }
      }
    };
  }, [initialFocusRef, manageFocus]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (dismissOnBackdrop && event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="modal-heading"><div>{badge ?? <span className="modal-mark"><Icon name="box" size={18} /></span>}<div><h2 id={titleId}>{title}</h2><p>{subtitle}</p></div></div>{!hideHeaderClose && <button ref={closeButtonRef} className="quiet-icon" onClick={onClose} aria-label={closeLabel}><Icon name="close" size={19} /></button>}</header>
      {children}
    </section>
  </div>;
}

function ItemDetailModal({ item, categoryName, onClose, language, formatting }: {
  item: InventoryItem;
  categoryName: string | undefined;
  onClose: () => void;
  language: AppPreferences["language"];
  formatting: DisplayFormatting;
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [technicalSheetPreview, setTechnicalSheetPreview] = useState<TechnicalSheetPreviewState | null>(null);
  const [printError, setPrintError] = useState<"printDialogFailed" | "">("");
  const [technicalSheetPrintError, setTechnicalSheetPrintError] = useState<"printDialogUnavailable" | "">("");
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
    setTechnicalSheetPreview(prepareTechnicalSheetPreview(item, categoryName, language, formatting));
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
      setTechnicalSheetPrintError("printDialogUnavailable");
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
    const display = technicalSheetDisplay(technicalSheetPreview.snapshot, language, formatting);
    const blockingMessage = technicalSheetBlockMessage(technicalSheetPreview, language);
    const printableBarcode = technicalSheetPreview.barcode?.status === "printable"
      ? technicalSheetPreview.barcode
      : null;
    const printDescription = blockingMessage
      ? technicalSheetWarningId
      : technicalSheetPrintError ? technicalSheetPrintErrorId : undefined;

    return <ModalFrame
      key="technical-sheet-preview"
      title={t("printTechnicalSheetPreview")}
      subtitle={t("reviewBeforePrintSheet")}
      onClose={closeTechnicalSheetPreview}
      className="technical-sheet-preview-modal"
      hideHeaderClose
      dismissOnBackdrop={false}
      initialFocusRef={technicalSheetCloseButtonRef}
      manageFocus
    >
      <div className="modal-form">
        <p className="sr-only" role="status">{t("technicalSheetPreviewFor", { name: display.name })}</p>
        {blockingMessage && <p className="form-error" id={technicalSheetWarningId} role="alert">{blockingMessage}</p>}
        {technicalSheetPrintError && <p className="form-error" id={technicalSheetPrintErrorId} role="alert">{t(technicalSheetPrintError)}</p>}
        <article className="technical-sheet-page" aria-label={t("technicalSheetTitle")}>
          <header className="technical-sheet-document-header">
            <p>{t("institutionalHeading")}</p>
            <h2>{t("technicalSheetTitle")}</h2>
          </header>

          <section className="technical-sheet-identification" aria-label={t("itemIdentification")}>
            <div>
              <span className="technical-sheet-label">{t("code")}</span>
              <strong className="technical-sheet-code-value">{display.code}</strong>
            </div>
            <div className="technical-sheet-barcode-area">
              {printableBarcode ? <svg
                className="technical-sheet-barcode"
                viewBox={`0 0 ${printableBarcode.totalModules} ${printableBarcode.barHeightMm / CODE128_MODULE_WIDTH_MM}`}
                width={`${printableBarcode.widthMm}mm`}
                height={`${printableBarcode.barHeightMm}mm`}
                role="img"
                aria-label={t("barcodeForUppercaseCode", { code: display.code })}
              >
                <title>{t("barcodeTitle")}</title>
                {printableBarcode.bars.map((bar) => <rect key={bar.x} x={bar.x} y="0" width={bar.width} height={printableBarcode.barHeightMm / CODE128_MODULE_WIDTH_MM} />)}
              </svg> : <p className="technical-sheet-barcode-placeholder">
                {technicalSheetPreview.missingRequiredFields.includes("code") ? t("codeUnavailable") : t("barcodeUnavailable")}
              </p>}
            </div>
          </section>

          <dl className="technical-sheet-specifications">
            <div><dt>{t("code")}</dt><dd className="technical-sheet-code-value">{display.code}</dd></div>
            <div><dt>{t("name")}</dt><dd className="technical-sheet-value">{display.name}</dd></div>
            <div><dt>{t("category")}</dt><dd className="technical-sheet-value">{display.categoryName}</dd></div>
            <div><dt>{t("brand")}</dt><dd className="technical-sheet-value">{display.brand}</dd></div>
            <div><dt>{t("model")}</dt><dd className="technical-sheet-value">{display.model}</dd></div>
            <div><dt>{t("serialNumber")}</dt><dd className="technical-sheet-value">{display.serialNumber}</dd></div>
            <div><dt>{t("location")}</dt><dd className="technical-sheet-value">{display.location}</dd></div>
            <div><dt>{t("registeredCost")}</dt><dd className="technical-sheet-value">{display.cost}</dd></div>
            <div><dt>{t("entryDate")}</dt><dd className="technical-sheet-value">{display.createdAt}</dd></div>
            <div className="technical-sheet-notes-field"><dt>{t("observations")}</dt><dd className="technical-sheet-notes-value">{display.notes}</dd></div>
          </dl>

          <div className="technical-sheet-signatures">
            <section className="technical-sheet-signature-box" aria-labelledby="technical-sheet-delivered-title">
              <h3 id="technical-sheet-delivered-title">{t("deliveredBy")}</h3>
              <div className="technical-sheet-signature-line"><span>{t("signature")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("name")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("role")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("dateOfSignature")}</span><span aria-hidden="true" /></div>
            </section>
            <section className="technical-sheet-signature-box" aria-labelledby="technical-sheet-received-title">
              <h3 id="technical-sheet-received-title">{t("receivedBy")}</h3>
              <div className="technical-sheet-signature-line"><span>{t("signature")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("name")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("identityDocument")}</span><span aria-hidden="true" /></div>
              <div className="technical-sheet-signature-field"><span>{t("dateOfSignature")}</span><span aria-hidden="true" /></div>
            </section>
          </div>
        </article>
        <div className="modal-footer">
          <button ref={technicalSheetCloseButtonRef} className="button button-outline" type="button" aria-label={`${t("close")} ${t("printTechnicalSheetPreview")}`} onClick={closeTechnicalSheetPreview}>{t("close")}</button>
          <button ref={technicalSheetPrintButtonRef} className="button button-primary" type="button" disabled={!technicalSheetPreview.canPrint} aria-describedby={printDescription} onClick={startTechnicalSheetPrint}>{t("print")}</button>
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
      setPrintError("printDialogFailed");
    }
  };

  if (labelPreviewOpen) {
    return <ModalFrame key="label-preview" title={t("printLabelPreview")} subtitle={t("reviewBeforePrintLabel")} closeLabel={t("close")} onClose={closeCurrentView} manageFocus>
      <div className="modal-form label-preview-content">
        <div className="print-label">
          <dl className="article-detail-grid print-label-fields">
            <div><dt>{t("code")}</dt><dd className="print-label-code">{item.code}</dd></div>
            <div><dt>{t("name")}</dt><dd>{item.name}</dd></div>
            <div><dt>{t("category")}</dt><dd>{categoryName ?? t("noCategory")}</dd></div>
            <div><dt>{t("entryDate")}</dt><dd>{dateLabel(item.createdAt, language, formatting)}</dd></div>
          </dl>
          {barcode.status === "blocked" ? <p className="form-error print-label-warning" id={blockedMessageId} role="alert">{code128BlockMessage(barcode.reason, language)}</p> : <svg
            className="print-label-barcode"
            viewBox={`0 0 ${barcode.totalModules} ${barcode.barHeightMm / CODE128_MODULE_WIDTH_MM}`}
            width={barcode.totalModules}
            height={barcode.barHeightMm / CODE128_MODULE_WIDTH_MM}
            role="img"
            aria-label={t("barcodeForCode", { code: item.code })}
          >
            <title>{t("barcodeTitle")}</title>
            {barcode.bars.map((bar) => <rect key={bar.x} x={bar.x} y="0" width={bar.width} height={barcode.barHeightMm / CODE128_MODULE_WIDTH_MM} />)}
          </svg>}
        </div>
        {printError && <p className="form-error print-label-warning" id={printErrorMessageId} role="alert">{t(printError)}</p>}
        <div className="modal-footer">
          <button className="button button-outline" type="button" onClick={() => { setLabelPreviewOpen(false); setPrintError(""); }}>{t("returnToDetails")}</button>
          <button className="button button-primary" type="button" disabled={barcode.status !== "printable"} aria-describedby={printButtonDescription} onClick={startPrint}>{t("print")}</button>
        </div>
      </div>
    </ModalFrame>;
  }

  return <ModalFrame key="article-detail" title={t("itemDetails")} subtitle={t("internalRecordInformation")} closeLabel={t("close")} onClose={closeCurrentView} manageFocus>
    <div className="modal-form article-detail">
      <div className="article-detail-title">
        <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
        <div className="article-detail-heading">
          <strong>{item.name}</strong>
          <small>{item.code}</small>
        </div>
        <span className="article-detail-header-status"><AssetStatusBadge status={item.status} language={language} /></span>
      </div>
      <dl className="article-detail-grid">
        <div><dt>{t("category")}</dt><dd>{categoryName ?? t("noCategory")}</dd></div>
        <div><dt>{t("entryDate")}</dt><dd>{dateLabel(item.createdAt, language, formatting)}</dd></div>
        <div><dt>{t("code")}</dt><dd>{item.code}</dd></div>
        <div><dt>{t("lastModified")}</dt><dd>{dateLabel(item.updatedAt, language, formatting)}</dd></div>
        <div><dt>{t("serialNumber")}</dt><dd>{item.serialNumber || t("unspecified")}</dd></div>
        <div><dt>{t("location")}</dt><dd>{item.location || t("unspecified")}</dd></div>
        <div><dt>{t("cost")}</dt><dd>{costLabel(item.cost, language, formatting)}</dd></div>
        <div><dt>{t("brand")} &amp; {t("model")}</dt><dd>{[item.brand, item.model].filter(Boolean).join(" · ") || t("unspecified")}</dd></div>
        <div className="detail-span"><dt>{t("notes")}</dt><dd>{item.notes || t("noNotes")}</dd></div>
      </dl>
      <div className="modal-footer">
        <button ref={technicalSheetTriggerRef} className="button button-outline" type="button" onClick={openTechnicalSheetPreview}>{t("printTechnicalSheet")}</button>
        <button className="button button-outline" type="button" onClick={() => setLabelPreviewOpen(true)}>{t("printLabel")}</button>
        <button className="button button-primary" type="button" onClick={onClose}>{t("close")}</button>
      </div>
    </div>
  </ModalFrame>;
}

function ItemModal({ item, categories, error, saving, onClose, onClearError, onSave, language }: { item: InventoryItem | null; categories: Category[]; error: string; saving: boolean; onClose: () => void; onClearError: () => void; onSave: (draft: UpdateItemDraft) => Promise<boolean>; language: AppPreferences["language"] }) {
  const t = (key: TranslationKey) => translated(language, key);
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
  const nameInputRef = useRef<HTMLInputElement>(null);
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
      setFormError(t("invalidStatusTransition"));
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
    window.requestAnimationFrame(() => statusSelectRef.current?.focus());
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
    if (!draft.categoryId) { setFormError(t("selectCategoryBeforeSave")); return; }

    let nextDraft: UpdateItemDraft = {
      ...draft,
      status: item ? draft.status : selectedStatus,
      reason: undefined,
    };

    if (item && statusChanged) {
      const nextStatus = resolveAssetStatus(selectedStatus);
      if (nextStatus.kind !== "canonical") {
        setFormError(t("invalidAssetStatus"));
        return;
      }
      if (!getAllowedTransitions(item.status).includes(nextStatus.value)) {
        setFormError(t("invalidStatusTransition"));
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
  const statusOptions = item ? editableStatusOptions(item, language) : [];
  return <>
    <ModalFrame title={t(item ? "editArticle" : "addArticle")} subtitle={t("completeRecordDetails")} closeLabel={t("close")} onClose={closeEditor} manageFocus={!decommissionConfirmationOpen} initialFocusRef={isReadOnly ? undefined : nameInputRef}>
      <form className="modal-form" onSubmit={(event) => void submit(event)} aria-describedby={isReadOnly ? readOnlyNoticeId : undefined}>
        <div className="form-grid">
          {isReadOnly && <p className="modal-hint field-span-2" id={readOnlyNoticeId} role="status">{t("readOnlyDecommissioned")}</p>}
          <label className="field-span-2">{t("name")}<input ref={nameInputRef} disabled={isReadOnly} required maxLength={150} value={draft.name} onChange={(event) => field("name", event.target.value)} placeholder={t("itemNamePlaceholder")} /></label>
          <label>{t("code")}<input disabled={isReadOnly} required maxLength={50} value={draft.code} onChange={(event) => field("code", event.target.value)} placeholder={t("itemCodePlaceholder")} /></label>
          <label>{t("category")}<select disabled={isReadOnly} required value={draft.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="" disabled>{t("categoryPlaceholder")}</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          {item
            ? <label>{t("statusLabel")}<select ref={statusSelectRef} disabled={isReadOnly} value={selectedStatus} onChange={(event) => selectStatus(event.target.value)}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            : <label>{t("statusInitial")}<select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>{INITIAL_ASSET_STATUS_OPTIONS.map((status) => <option value={status} key={status}>{assetStatusLabel(status, language)}</option>)}</select></label>}
          {item && originalStatus?.kind === "unknown" && <p className="modal-hint field-span-2">{t("unknownStatusCorrection")}</p>}
          {item && statusChanged && selectedStatus !== "decommissioned" && <>
            <label className="field-span-2">{t("changeReasonOptional")}<textarea rows={2} disabled={isReadOnly} value={draft.reason ?? ""} aria-describedby={reasonGuidanceId} onChange={(event) => field("reason", event.target.value)} placeholder={t("statusReasonPlaceholder")} /></label>
            <p className="modal-hint field-span-2" id={reasonGuidanceId}>{t("reasonLengthGuidance")}</p>
          </>}
          <label>{t("locationOptional")}<input disabled={isReadOnly} maxLength={100} value={draft.location} onChange={(event) => field("location", event.target.value)} placeholder={t("locationPlaceholder")} /></label>
          <label>{t("serialNumberOptional")}<input disabled={isReadOnly} maxLength={100} value={draft.serialNumber} onChange={(event) => field("serialNumber", event.target.value)} placeholder={t("optionalPlaceholder")} /></label>
          <label>{t("costOptional")}<input disabled={isReadOnly} type="number" min="0" step="0.01" value={draft.cost ?? ""} onChange={(event) => field("cost", event.target.value === "" ? null : Number(event.target.value))} placeholder="0.00" /></label>
          <label>{t("brand")}<input disabled={isReadOnly} maxLength={100} value={draft.brand} onChange={(event) => field("brand", event.target.value)} placeholder={t("optionalPlaceholder")} /></label>
          <label className="field-span-2">{t("model")}<input disabled={isReadOnly} maxLength={100} value={draft.model} onChange={(event) => field("model", event.target.value)} placeholder={t("optionalPlaceholder")} /></label>
          <label className="field-span-2">{t("notes")}<textarea disabled={isReadOnly} rows={3} maxLength={500} value={draft.notes} onChange={(event) => field("notes", event.target.value)} placeholder={t("modelNotesPlaceholder")} /></label>
        </div>
        {formError && <p className="form-error" role="alert">{localizedAppError(formError, language)}</p>}
        {error && <p className="form-error" role="alert">{localizedAppError(error, language)}</p>}
        <div className="modal-footer"><span className="modal-hint">{t("editDateSavedHint")}</span><button className="button button-outline" type="button" onClick={onClose} autoFocus={isReadOnly}>{t("cancel")}</button><button className="button button-primary" disabled={saving || isReadOnly} aria-disabled={isReadOnly} aria-describedby={isReadOnly ? readOnlyNoticeId : undefined}>{saving ? t("saving") : item ? t("saveChanges") : t("addArticle")}</button></div>
      </form>
    </ModalFrame>
    {decommissionConfirmationOpen && <ModalFrame
      title={t("decommissionConfirmation")}
      subtitle={t("decommissionIrreversible")}
      closeLabel={t("close")}
      className="decommission-confirmation"
      onClose={cancelDecommissionConfirmation}
      manageFocus
      initialFocusRef={decommissionReasonRef}
      dismissOnBackdrop={!saving}
      hideHeaderClose={saving}
    >
      <div className="modal-form decommission-confirmation-content">
        <p>{t("confirmDecommissionSave")}</p>
        <label>{t("decommissionReasonRequired")}<textarea
          ref={decommissionReasonRef}
          rows={3}
          required
          value={decommissionReason}
          disabled={saving}
          aria-describedby={decommissionReasonGuidanceId}
          onChange={(event) => setDecommissionReason(event.target.value)}
          placeholder={t("decommissionReasonPlaceholder")}
        /></label>
        <p className="modal-hint" id={decommissionReasonGuidanceId}>
          {formatNumber(decommissionReasonLength, language)}{t("reasonLengthRemaining")}
        </p>
        {decommissionReasonLength > 200 && <p className="form-error" role="alert">{t("reasonLengthInvalid")}</p>}
        {error && <p className="form-error" role="alert">{t("databaseSaveFailure")}</p>}
        {formError && <p className="form-error" role="alert">{localizedAppError(formError, language)}</p>}
        <div className="modal-footer">
          <button className="button button-outline" type="button" disabled={saving} onClick={cancelDecommissionConfirmation}>{t("cancel")}</button>
          <button className="button button-primary" type="button" disabled={!canConfirmDecommission || saving} onClick={() => void confirmDecommission()}>
            {saving ? t("saving") : error ? t("retryDecommission") : t("decommissionConfirmation")}
          </button>
        </div>
      </div>
    </ModalFrame>}
  </>;
}

function editableStatusOptions(item: InventoryItem, language: AppPreferences["language"]): Array<{ value: string; label: string }> {
  const current = resolveAssetStatus(item.status);
  const options = new Map<string, string>();
  options.set(
    current.value,
    current.kind === "unknown" ? `${translated(language, "unknown")} — ${current.value}` : assetStatusLabel(current.value, language),
  );
  for (const status of getAllowedTransitions(item.status)) {
    options.set(status, assetStatusLabel(status, language));
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
