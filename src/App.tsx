import { useEffect, useMemo, useRef, useState } from "react";
import { clearInventorySnapshot, createCategory, createItem, deleteCategory, deleteItem, loadSnapshot, resolveAssetStatus, subscribeInventoryInvalidation, updateCategory, updateItem } from "./lib/inventoryRepository";
import { createDefaultAppPreferences, DEFAULT_CRC_PER_USD, DEFAULT_EUR_PER_USD, loadAppPreferences, saveAppPreferences } from "./lib/preferencesRepository";
import type { UpdateItemDraft, UpdateItemResult } from "./lib/inventoryRepository";
import type { AssetLifecycleStatus, Category, CategoryDraft, InventoryItem, InventorySnapshot, ThemePreference } from "./types";
import { getLocale } from "./i18n";
import type { TranslationKey } from "./i18n";
import { Icon, LoadingScreen } from "./components/AppPrimitives";
import { dateLabel, errorMessage, isDecommissioned, localizedAppError, translated } from "./lib/appPresentation";
import type { DisplayFormatting } from "./lib/appPresentation";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { InventoryPage, CategoriesPage, CategoryDetailPage } from "./features/inventory/InventoryPages";
import { CategoryModal, ItemDetailModal, ItemModal } from "./features/inventory/ItemDialogs";
import { MovementsPage } from "./features/movements/MovementsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { clearAndVerifyInventory } from "./features/settings/clearInventoryAction";
import type { ClearInventoryResult, PreferencesChange } from "./features/settings/SettingsPage";
import { serializeCsvRows } from "./features/inventory/csvExport";

type Page = "dashboard" | "inventory" | "categories" | "movements" | "settings" | "category-detail";
type AssetStatusFilter = "all" | AssetLifecycleStatus;
type EffectiveTheme = Exclude<ThemePreference, "system">;
type PreferencesNotice = "read" | "write" | null;

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
    const emptySnapshot = { categories: [], items: [], movements: [] };
    try {
      const outcome = await clearAndVerifyInventory(clearInventorySnapshot, loadSnapshot);
      if (outcome.status === "cleared") {
        snapshotRef.current = outcome.snapshot;
        setSnapshot(outcome.snapshot);
        setNotice("inventoryCleared");
        window.setTimeout(() => setNotice(null), 5000);
      } else if (outcome.status === "legacy-error" || outcome.status === "verification-error") {
        const currentSnapshot = "snapshot" in outcome ? outcome.snapshot ?? emptySnapshot : emptySnapshot;
        snapshotRef.current = currentSnapshot;
        setSnapshot(currentSnapshot);
      }
      return outcome.status;
    } finally {
      localClearInProgressRef.current = false;
    }
  }

  function exportCsv() {
    const rows = [
      [translated(language, "name"), translated(language, "category"), translated(language, "entryDate")],
      ...filteredItems.map((item) => [item.name, categoryName.get(item.categoryId) ?? translated(language, "noCategory"), dateLabel(item.createdAt, language, displayFormatting)]),
    ];
    const csv = serializeCsvRows(rows);
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

export default App;
