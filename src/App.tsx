import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createCategory, createItem, deleteCategory, deleteItem, loadSnapshot, updateCategory, updateItem } from "./lib/inventoryRepository";
import type { Category, CategoryDraft, InventoryItem, InventorySnapshot, ItemDraft } from "./types";

type Page = "dashboard" | "inventory" | "categories" | "category-detail";
type IconName = "dashboard" | "box" | "search" | "plus" | "download" | "chevron" | "edit" | "trash" | "view" | "close" | "check" | "spark" | "clock" | "alert" | "layers";

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
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
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

function getGreeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [snapshot, setSnapshot] = useState<InventorySnapshot>({ categories: [], items: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemModal, setItemModal] = useState<InventoryItem | "new" | null>(null);
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
      if (active) setSnapshot(data);
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
      return matchesQuery && (categoryFilter === "all" || item.categoryId === categoryFilter);
    });
  }, [categoryFilter, categoryName, search, snapshot.items]);

  async function refresh() {
    setSnapshot(await loadSnapshot());
  }

  async function mutate(action: () => Promise<void>, successMessage: string): Promise<boolean> {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice(successMessage);
      window.setTimeout(() => setNotice(""), 3200);
      return true;
    } catch (reason) {
      setError(errorMessage(reason));
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function saveItem(draft: ItemDraft): Promise<void> {
    const existing = itemModal !== "new" && itemModal ? itemModal : null;
    const saved = await mutate(
      () => existing ? updateItem(existing.id, draft) : createItem(draft),
      existing ? "Artículo actualizado." : "Artículo agregado al registro.",
    );
    if (saved) setItemModal(null);
  }

  async function removeItem(item: InventoryItem) {
    if (!window.confirm(`¿Borrar el artículo «${item.name}»? Esta acción no se puede deshacer.`)) return;
    await mutate(() => deleteItem(item.id), "Artículo borrado.");
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
  const pageTitle = page === "dashboard" ? "Resumen" : page === "inventory" ? "Artículos" : page === "category-detail" ? selectedCategory?.name ?? "Categoría" : "Categorías";

  return <div className="app-shell">
    <Sidebar page={page} onPage={setPage} itemCount={snapshot.items.length} categoryCount={snapshot.categories.length} />
    <main className="main-area">
      <div className="topbar">
        <div className="breadcrumb"><span>Control interno</span><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
        <label className="global-search">
          <Icon name="search" size={17} />
          <input aria-label="Buscar artículos" placeholder="Buscar artículo o código..." value={search} onChange={(event) => { setSearch(event.target.value); setPage("inventory"); }} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-right">
          <span className="connection-pill is-demo"><span className="connection-dot" />Datos locales</span>
        </div>
      </div>

      {(error || notice) && <div className={`toast ${error ? "toast-error" : "toast-success"}`} role={error ? "alert" : "status"}>
        <Icon name={error ? "alert" : "check"} size={17} /><span>{error || notice}</span>
        {error && <button className="toast-dismiss" onClick={() => setError("")} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button>}
      </div>}

      {page === "dashboard" && <DashboardPage
        items={snapshot.items}
        categories={snapshot.categories}
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
        onNew={() => { setError(""); setItemModal("new"); }}
        onView={setViewedItem}
        onEdit={(item) => { setError(""); setItemModal(item); }}
        onDelete={removeItem}
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
        onDeleteItem={removeItem}
      />}
    </main>

    {itemModal && <ItemModal
      item={itemModal === "new" ? null : itemModal}
      categories={snapshot.categories}
      error={error}
      saving={working}
      onClose={() => setItemModal(null)}
      onSave={saveItem}
    />}
    {viewedItem && <ItemDetailModal item={viewedItem} categoryName={categoryName.get(viewedItem.categoryId) ?? "Sin categoría"} onClose={() => setViewedItem(null)} />}
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
  ];
  return <aside className="sidebar">
    <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onPage("dashboard"); }}>
      <span className="brand-symbol"><Icon name="layers" size={19} /></span><span>Control<span> interno</span></span>
    </a>
    <div className="workspace-select"><span className="workspace-mark">I</span><span><strong>InventarioWeb</strong><small>Registro de artículos</small></span><Icon name="chevron" size={15} /></div>
    <div className="nav-label">MENÚ</div>
    <nav className="side-nav" aria-label="Navegación principal">
      {links.map((link) => <button key={link.key} className={`nav-link ${activePage === link.key ? "active" : ""}`} aria-label={link.label} title={link.label} onClick={() => onPage(link.key)}>
        <Icon name={link.icon} size={18} /><span>{link.label}</span>{link.key !== "dashboard" && <span className="nav-count">{link.key === "inventory" ? itemCount : categoryCount}</span>}
      </button>)}
    </nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={16} /></span><strong>Control organizado</strong><p>Consulta los artículos y sus datos en un solo lugar.</p></div>
  </aside>;
}

function DashboardPage({ items, categories, categoryName, onViewInventory, onViewCategories }: {
  items: InventoryItem[];
  categories: Category[];
  categoryName: Map<string, string>;
  onViewInventory: () => void;
  onViewCategories: () => void;
}) {
  const categoryTotals = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.categoryId === category.id).length,
  })).sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(1, ...categoryTotals.map((category) => category.count));
  const recentItems = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);
  const stats: Array<{ label: string; value: string; detail: string; icon: IconName; color: string }> = [
    { label: "Artículos registrados", value: String(items.length).padStart(2, "0"), detail: "En el registro actual", icon: "box", color: "violet" },
    { label: "Categorías", value: String(categories.length).padStart(2, "0"), detail: "Para clasificar artículos", icon: "layers", color: "blue" },
  ];
  return <section className="page-content">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">{new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</div><h1>{getGreeting()} <span className="wave">✦</span></h1><p>Resumen del registro interno de artículos.</p></div>
      <div className="dashboard-actions"><button className="button button-outline" onClick={onViewCategories}><Icon name="layers" size={17} />Ver categorías</button><button className="button button-primary" onClick={onViewInventory}><Icon name="box" size={17} />Ver artículos</button></div>
    </div>

    <div className="stats-grid stats-grid-internal">
      {stats.map((stat) => <article className="stat-card" key={stat.label}>
        <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}><Icon name={stat.icon} size={17} /></span></div>
        <strong className="stat-value">{stat.value}</strong><span className="stat-detail">{stat.detail}</span>
      </article>)}
    </div>

    <div className="dashboard-grid internal-dashboard-grid">
      <section className="panel category-panel">
        <div className="panel-heading"><div><h2>Artículos por categoría</h2><p>Registros en cada grupo</p></div><span className="panel-icon"><Icon name="layers" size={18} /></span></div>
        <div className="category-list">
          {categoryTotals.map((category, index) => <div className="category-item" key={category.id}>
            <div className="category-label"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><span className="category-name">{category.name}<small>{category.count} artículos</small></span><strong>{category.count}</strong></div>
            <div className="category-track"><span className={`category-progress progress-${index % 4}`} style={{ width: `${category.count / maxCategoryCount * 100}%` }} /></div>
          </div>)}
          {categoryTotals.length === 0 && <EmptyState title="Aún no hay categorías" text="Se mostrarán aquí cuando agregues artículos." />}
        </div>
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading"><div><h2>Ingresos recientes</h2><p>Artículos agregados más recientemente</p></div><span className="panel-icon"><Icon name="clock" size={18} /></span></div>
        {recentItems.length > 0 ? <div className="recent-list">
          {recentItems.map((item) => <div className="recent-row article-recent-row" key={item.id}>
            <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
            <span className="recent-copy"><strong>{item.name}</strong><small>{categoryName.get(item.categoryId) ?? "Sin categoría"} · {dateLabel(item.createdAt)}</small></span>
          </div>)}
        </div> : <EmptyState title="Sin artículos todavía" text="Los artículos que agregues aparecerán aquí." />}
      </section>
    </div>
  </section>;
}

function InventoryPage({ items, allItems, categories, categoryFilter, onCategoryFilter, onNew, onView, onEdit, onDelete, onExport }: {
  items: InventoryItem[];
  allItems: InventoryItem[];
  categories: Category[];
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  onNew: () => void;
  onView: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onExport: () => void;
}) {
  return <section className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow">CONTROL INTERNO</div><h1>Artículos</h1><p>Consulta y administra los artículos registrados.</p></div>
      <button className="button button-primary" onClick={onNew}><Icon name="plus" size={18} />Agregar artículo</button>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div><h2>Registro de artículos</h2><p>{items.length} de {allItems.length} artículos</p></div>
        <div className="toolbar-actions">
          <select aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
          <button className="button button-outline" onClick={onExport} disabled={items.length === 0}><Icon name="download" size={16} />Exportar</button>
        </div>
      </div>
      {items.length > 0 ? <div className="table-scroll"><table className="product-table article-table">
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Fecha de ingreso</th><th>Acciones</th></tr></thead>
        <tbody>{items.map((item, index) => <tr key={item.id}>
          <td><div className="product-cell"><span className={`product-avatar avatar-${index % 5}`}>{item.name.slice(0, 1)}</span><strong>{item.name}</strong></div></td>
          <td><span className="category-chip">{categories.find((category) => category.id === item.categoryId)?.name ?? "Sin categoría"}</span></td>
          <td className="date-cell">{dateLabel(item.createdAt)}</td>
          <td><div className="row-actions">
            <button className="quiet-icon" onClick={() => onView(item)} title={`Ver ${item.name}`} aria-label={`Ver ${item.name}`}><Icon name="view" size={16} /></button>
            <button className="quiet-icon" onClick={() => onEdit(item)} title={`Editar ${item.name}`} aria-label={`Editar ${item.name}`}><Icon name="edit" size={16} /></button>
            <button className="quiet-icon danger-icon" onClick={() => onDelete(item)} title={`Borrar ${item.name}`} aria-label={`Borrar ${item.name}`}><Icon name="trash" size={16} /></button>
          </div></td>
        </tr>)}</tbody>
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
      <div className="inventory-toolbar"><div><h2>Registro de categorías</h2><p>{categories.length} categorías</p></div></div>
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

function CategoryDetailPage({ category, items, onBack, onViewItem, onDeleteItem }: {
  category: Category;
  items: InventoryItem[];
  onBack: () => void;
  onViewItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}) {
  const sortedItems = [...items].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  return <section className="page-content">
    <div className="page-heading">
      <div><button className="text-link category-back" onClick={onBack}><Icon name="chevron" size={15} />Volver a categorías</button><div className="eyebrow">DETALLE DE CATEGORÍA</div><h1>{category.name}</h1><p>{items.length} {items.length === 1 ? "artículo asociado" : "artículos asociados"}.</p></div>
    </div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div><h2>Artículos de {category.name}</h2><p>La fecha refleja la última modificación.</p></div></div>
      {sortedItems.length > 0 ? <div className="table-scroll"><table className="product-table category-detail-table">
        <thead><tr><th>Código</th><th>Nombre</th><th>N.º de serie</th><th>Ubicación</th><th>Última modificación</th><th>Acciones</th></tr></thead>
        <tbody>{sortedItems.map((item) => <tr key={item.id}>
          <td className="sku-code">{item.code}</td>
          <td><strong className="category-item-name">{item.name}</strong></td>
          <td>{item.serialNumber || "—"}</td>
          <td>{item.location || "General"}</td>
          <td className="date-cell">{dateLabel(item.updatedAt)}</td>
          <td><div className="row-actions">
            <button className="quiet-icon" onClick={() => onViewItem(item)} title={`Ver ${item.name}`} aria-label={`Ver ${item.name}`}><Icon name="view" size={16} /></button>
            <button className="quiet-icon danger-icon" onClick={() => onDeleteItem(item)} title={`Borrar ${item.name}`} aria-label={`Borrar ${item.name}`}><Icon name="trash" size={16} /></button>
          </div></td>
        </tr>)}</tbody>
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

function ModalFrame({ title, subtitle, onClose, children, className = "" }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-heading"><div><span className="modal-mark"><Icon name="box" size={18} /></span><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div></div><button className="quiet-icon" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={19} /></button></header>
      {children}
    </section>
  </div>;
}

function ItemDetailModal({ item, categoryName, onClose }: { item: InventoryItem; categoryName: string; onClose: () => void }) {
  return <ModalFrame title="Detalle del artículo" subtitle="Información del registro interno." onClose={onClose}>
    <div className="modal-form article-detail">
      <div className="article-detail-title"><span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{item.code}</small></div></div>
      <dl className="article-detail-grid">
        <div><dt>Categoría</dt><dd>{categoryName}</dd></div>
        <div><dt>Fecha de ingreso</dt><dd>{dateLabel(item.createdAt)}</dd></div>
        <div><dt>Código</dt><dd>{item.code}</dd></div>
        <div><dt>N.º de serie</dt><dd>{item.serialNumber || "Sin especificar"}</dd></div>
        <div><dt>Ubicación</dt><dd>{item.location || "General"}</dd></div>
        <div><dt>Costo</dt><dd>{costLabel(item.cost)}</dd></div>
        <div><dt>Marca y modelo</dt><dd>{[item.brand, item.model].filter(Boolean).join(" · ") || "Sin especificar"}</dd></div>
        <div className="detail-span"><dt>Notas</dt><dd>{item.notes || "Sin notas"}</dd></div>
      </dl>
      <div className="modal-footer"><span className="modal-hint">Última modificación: {dateLabel(item.updatedAt)}</span><button className="button button-primary" onClick={onClose}>Cerrar</button></div>
    </div>
  </ModalFrame>;
}

function ItemModal({ item, categories, error, saving, onClose, onSave }: { item: InventoryItem | null; categories: Category[]; error: string; saving: boolean; onClose: () => void; onSave: (draft: ItemDraft) => Promise<void> }) {
  const [draft, setDraft] = useState<ItemDraft>(() => item ? draftFromItem(item) : {
    code: "", name: "", sku: "", serialNumber: "", brand: "", model: "", location: "General", notes: "",
    categoryId: categories[0]?.id ?? "", cost: null,
  });
  const [formError, setFormError] = useState("");
  function field<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.categoryId) { setFormError("Selecciona una categoría antes de guardar."); return; }
    setFormError("");
    await onSave(draft);
  }
  return <ModalFrame title={item ? "Editar artículo" : "Agregar artículo"} subtitle="Completa los datos del registro." onClose={onClose}>
    <form className="modal-form" onSubmit={(event) => void submit(event)}>
      <div className="form-grid">
        <label className="field-span-2">Nombre<input autoFocus required maxLength={150} value={draft.name} onChange={(event) => field("name", event.target.value)} placeholder="Ej. Portátil de préstamo" /></label>
        <label>Código<input required maxLength={50} value={draft.code} onChange={(event) => field("code", event.target.value)} placeholder="Ej. INT-ELE-016" /></label>
        <label>Categoría<select required value={draft.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="" disabled>Seleccionar</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label>Ubicación<input maxLength={100} value={draft.location} onChange={(event) => field("location", event.target.value)} placeholder="Ej. Administración" /></label>
        <label>N.º de serie (Opcional)<input maxLength={100} value={draft.serialNumber} onChange={(event) => field("serialNumber", event.target.value)} placeholder="Opcional" /></label>
        <label>Costo $ (Opcional)<input type="number" min="0" step="0.01" value={draft.cost ?? ""} onChange={(event) => field("cost", event.target.value === "" ? null : Number(event.target.value))} placeholder="0.00" /></label>
        <label>Marca<input maxLength={100} value={draft.brand} onChange={(event) => field("brand", event.target.value)} placeholder="Opcional" /></label>
        <label className="field-span-2">Modelo<input maxLength={100} value={draft.model} onChange={(event) => field("model", event.target.value)} placeholder="Opcional" /></label>
        <label className="field-span-2">Notas<textarea rows={3} maxLength={500} value={draft.notes} onChange={(event) => field("notes", event.target.value)} placeholder="Detalles útiles para identificar este artículo" /></label>
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><span className="modal-hint">La fecha de ingreso se registra al guardar.</span><button className="button button-outline" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando..." : item ? "Guardar cambios" : "Agregar artículo"}</button></div>
    </form>
  </ModalFrame>;
}

function draftFromItem(item: InventoryItem): ItemDraft {
  return {
    code: item.code, name: item.name, sku: item.sku, serialNumber: item.serialNumber, brand: item.brand, model: item.model,
    location: item.location, notes: item.notes, categoryId: item.categoryId, cost: item.cost,
  };
}

export default App;
