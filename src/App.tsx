import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getDemoSnapshot } from "./data/demo";
import { createItem, deleteItem, loadSnapshot, seedTestItems, updateItem } from "./lib/inventoryRepository";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import type { Category, InventoryItem, InventorySnapshot, ItemDraft } from "./types";

type Page = "dashboard" | "inventory";
type IconName = "dashboard" | "box" | "search" | "plus" | "download" | "chevron" | "edit" | "trash" | "view" | "close" | "check" | "mail" | "lock" | "spark" | "logout" | "clock" | "alert" | "layers";

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
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
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

function getGreeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [snapshot, setSnapshot] = useState<InventorySnapshot>({ categories: [], items: [] });
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState(isSupabaseConfigured);
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemModal, setItemModal] = useState<InventoryItem | "new" | null>(null);
  const [viewedItem, setViewedItem] = useState<InventoryItem | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<number | null>(null);
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
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setAuthChecked(true);
    }).catch(() => {
      if (active) setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSnapshot(getDemoSnapshot());
      setDataLoading(false);
      return;
    }
    if (!authChecked) return;
    if (!user) {
      setDataLoading(false);
      return;
    }
    let active = true;
    setDataLoading(true);
    void loadSnapshot().then((data) => {
      if (active) {
        setSnapshot(data);
        setError("");
      }
    }).catch((reason: unknown) => {
      if (active) setError(errorMessage(reason));
    }).finally(() => {
      if (active) setDataLoading(false);
    });
    return () => { active = false; };
  }, [authChecked, user]);

  const isAdmin = user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (!supabase || !user || !isAdmin) {
      setRegisteredUsers(null);
      return;
    }
    let active = true;
    void supabase.functions.invoke<{ count: number }>("registered-user-count").then(({ data, error: functionError }) => {
      if (functionError) throw functionError;
      if (typeof data?.count !== "number") throw new Error("Respuesta no válida al consultar las cuentas.");
      if (active) setRegisteredUsers(data.count);
    }).catch(() => {
      if (active) setError("No se pudo consultar el total de usuarios registrados.");
    });
    return () => { active = false; };
  }, [isAdmin, user]);

  const categoryName = useMemo(() => new Map(snapshot.categories.map((category) => [category.id, category.name])), [snapshot.categories]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return snapshot.items.filter((item) => {
      const matchesQuery = !query || [item.name, item.code, item.sku, item.brand, item.model, item.department, item.notes, categoryName.get(item.categoryId) ?? ""]
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

  async function addTestItems() {
    if (!window.confirm("Se agregarán los artículos de prueba que aún no existen en tu cuenta. ¿Continuar?")) return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const added = await seedTestItems();
      await refresh();
      setNotice(added ? `Se agregaron ${added} artículos de prueba.` : "Los 15 artículos de prueba ya están registrados.");
      window.setTimeout(() => setNotice(""), 3200);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setWorking(false);
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

  if (isSupabaseConfigured && !authChecked) return <LoadingScreen />;
  if (isSupabaseConfigured && !user) return <AuthScreen error={error} onError={setError} />;
  if (dataLoading) return <LoadingScreen />;

  const userName = user?.email?.split("@")[0] ?? "Cuenta demo";

  return <div className="app-shell">
    <Sidebar page={page} onPage={setPage} userName={userName} itemCount={snapshot.items.length} />
    <main className="main-area">
      <div className="topbar">
        <div className="breadcrumb"><span>Control interno</span><Icon name="chevron" size={14} /><strong>{page === "dashboard" ? "Resumen" : "Artículos"}</strong></div>
        <label className="global-search">
          <Icon name="search" size={17} />
          <input aria-label="Buscar artículos" placeholder="Buscar artículo o código..." value={search} onChange={(event) => { setSearch(event.target.value); setPage("inventory"); }} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-right">
          <span className={`connection-pill ${isSupabaseConfigured ? "is-live" : "is-demo"}`}><span className="connection-dot" />{isSupabaseConfigured ? "Supabase" : "Demo local"}</span>
          <div className="user-avatar" aria-label="Perfil de usuario">{userName.slice(0, 1).toUpperCase()}</div>
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
        userName={userName}
        isAdmin={isAdmin}
        registeredUsers={registeredUsers}
        onViewInventory={() => setPage("inventory")}
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
        onSeed={addTestItems}
        showSeedButton={isSupabaseConfigured}
        working={working}
      />}
    </main>

    {itemModal && <ItemModal
      item={itemModal === "new" ? null : itemModal}
      categories={snapshot.categories}
      saving={working}
      onClose={() => setItemModal(null)}
      onSave={saveItem}
    />}
    {viewedItem && <ItemDetailModal item={viewedItem} categoryName={categoryName.get(viewedItem.categoryId) ?? "Sin categoría"} onClose={() => setViewedItem(null)} />}
  </div>;
}

function errorMessage(reason: unknown): string {
  const code = typeof reason === "object" && reason !== null && "code" in reason && typeof reason.code === "string" ? reason.code : "";
  if (code === "23505") return "Ya existe un artículo con ese código interno.";
  if (code === "23503") return "La categoría ya no está disponible. Actualiza la página e inténtalo de nuevo.";
  if (code === "42501") return "Tu cuenta no tiene permiso para realizar esta acción.";
  if (code === "42P01" || code === "PGRST205") return "Falta configurar el esquema de Supabase. Consulta la guía de instalación.";
  if (reason instanceof Error) return reason.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

function Sidebar({ page, onPage, userName, itemCount }: { page: Page; onPage: (page: Page) => void; userName: string; itemCount: number }) {
  const links: Array<{ key: Page; label: string; icon: IconName }> = [
    { key: "dashboard", label: "Resumen", icon: "dashboard" },
    { key: "inventory", label: "Artículos", icon: "box" },
  ];
  return <aside className="sidebar">
    <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onPage("dashboard"); }}>
      <span className="brand-symbol"><Icon name="layers" size={19} /></span><span>Control<span> interno</span></span>
    </a>
    <div className="workspace-select"><span className="workspace-mark">I</span><span><strong>InventarioWeb</strong><small>Registro de artículos</small></span><Icon name="chevron" size={15} /></div>
    <div className="nav-label">MENÚ</div>
    <nav className="side-nav" aria-label="Navegación principal">
      {links.map((link) => <button key={link.key} className={`nav-link ${page === link.key ? "active" : ""}`} aria-label={link.label} title={link.label} onClick={() => onPage(link.key)}>
        <Icon name={link.icon} size={18} /><span>{link.label}</span>{link.key === "inventory" && <span className="nav-count">{itemCount}</span>}
      </button>)}
    </nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={16} /></span><strong>Control organizado</strong><p>Consulta los artículos y sus datos en un solo lugar.</p></div>
    <button className="profile-row" onClick={() => { if (supabase) void supabase.auth.signOut(); }} title={isSupabaseConfigured ? "Cerrar sesión" : "Sesión demo local"}>
      <span className="profile-avatar">{userName.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{userName}</strong><small>{isSupabaseConfigured ? "Cuenta conectada" : "Modo de demostración"}</small></span>
      {isSupabaseConfigured && <Icon name="logout" size={16} />}
    </button>
  </aside>;
}

function DashboardPage({ items, categories, categoryName, userName, isAdmin, registeredUsers, onViewInventory }: {
  items: InventoryItem[];
  categories: Category[];
  categoryName: Map<string, string>;
  userName: string;
  isAdmin: boolean;
  registeredUsers: number | null;
  onViewInventory: () => void;
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
    ...(isAdmin ? [{ label: "Usuarios registrados", value: registeredUsers === null ? "—" : String(registeredUsers), detail: "Cuentas del sistema", icon: "view" as const, color: "green" }] : []),
  ];
  return <section className="page-content">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">{new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</div><h1>{getGreeting()}, {userName} <span className="wave">✦</span></h1><p>Resumen del registro interno de artículos.</p></div>
      <button className="button button-primary" onClick={onViewInventory}><Icon name="box" size={17} />Ver artículos</button>
    </div>

    <div className={`stats-grid stats-grid-internal ${isAdmin ? "" : "stats-grid-nonadmin"}`}>
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

function InventoryPage({ items, allItems, categories, categoryFilter, onCategoryFilter, onNew, onView, onEdit, onDelete, onExport, onSeed, showSeedButton, working }: {
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
  onSeed: () => void;
  showSeedButton: boolean;
  working: boolean;
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
          {showSeedButton && <button className="button button-outline seed-button" onClick={onSeed} disabled={working}>Cargar 15 artículos de prueba</button>}
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
      <div className="table-foot"><span>Mostrando <strong>{items.length}</strong> de <strong>{allItems.length}</strong> artículos</span><span className="table-foot-note"><Icon name="lock" size={14} />Tus datos están protegidos</span></div>
    </section>
  </section>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function LoadingScreen() {
  return <div className="loading-screen"><span className="loading-mark"><Icon name="layers" size={20} /></span><span>Preparando el registro...</span></div>;
}

function AuthScreen({ error, onError }: { error: string; onError: (message: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    onError("");
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) setMessage("Revisa tu correo para confirmar la cuenta y volver a iniciar sesión.");
    } catch (reason) {
      onError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <div className="auth-card">
      <a className="brand auth-brand" href="#inicio"><span className="brand-symbol"><Icon name="layers" size={19} /></span><span>Control<span> interno</span></span></a>
      <div className="auth-eyebrow">REGISTRO INTERNO DE ARTÍCULOS</div>
      <h1>{mode === "login" ? "Qué bueno verte." : "Crea tu espacio."}</h1>
      <p className="auth-intro">{mode === "login" ? "Inicia sesión para consultar los artículos registrados." : "Registra una cuenta para empezar a organizar los artículos."}</p>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>Correo electrónico<span className="input-with-icon"><Icon name="mail" size={17} /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" /></span></label>
        <label>Contraseña<span className="input-with-icon"><Icon name="lock" size={17} /><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Al menos 8 caracteres" /></span></label>
        {error && <div className="inline-error" role="alert"><Icon name="alert" size={16} />{error}</div>}
        {message && <div className="inline-success" role="status"><Icon name="check" size={16} />{message}</div>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Un momento..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}<Icon name="chevron" size={16} /></button>
      </form>
      <div className="auth-switch">{mode === "login" ? "¿Primera vez aquí?" : "¿Ya tienes cuenta?"}<button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); onError(""); }}>{mode === "login" ? "Crear cuenta" : "Iniciar sesión"}</button></div>
      <div className="auth-secure"><Icon name="lock" size={14} />Conexión protegida con Supabase Auth</div>
    </div>
    <div className="auth-side-note"><span className="note-star">✳</span><span>Un registro claro.<br /><strong>Una consulta más simple.</strong></span></div>
  </main>;
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
        <div><dt>Área responsable</dt><dd>{item.department || "General"}</dd></div>
        <div><dt>Marca y modelo</dt><dd>{[item.brand, item.model].filter(Boolean).join(" · ") || "Sin especificar"}</dd></div>
        <div className="detail-span"><dt>Notas</dt><dd>{item.notes || "Sin notas"}</dd></div>
      </dl>
      <div className="modal-footer"><span className="modal-hint">Código interno: {item.code}</span><button className="button button-primary" onClick={onClose}>Cerrar</button></div>
    </div>
  </ModalFrame>;
}

function ItemModal({ item, categories, saving, onClose, onSave }: { item: InventoryItem | null; categories: Category[]; saving: boolean; onClose: () => void; onSave: (draft: ItemDraft) => Promise<void> }) {
  const [draft, setDraft] = useState<ItemDraft>(() => item ? draftFromItem(item) : {
    code: "", name: "", sku: "", brand: "", model: "", department: "General", notes: "",
    categoryId: categories[0]?.id ?? "", price: null,
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
        <label>Código interno<input required maxLength={50} value={draft.code} onChange={(event) => field("code", event.target.value)} placeholder="Ej. INT-ELE-016" /></label>
        <label>Categoría<select required value={draft.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="" disabled>Seleccionar</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label>Área responsable<input maxLength={100} value={draft.department} onChange={(event) => field("department", event.target.value)} placeholder="Ej. Administración" /></label>
        <label>Marca<input maxLength={100} value={draft.brand} onChange={(event) => field("brand", event.target.value)} placeholder="Opcional" /></label>
        <label className="field-span-2">Modelo<input maxLength={100} value={draft.model} onChange={(event) => field("model", event.target.value)} placeholder="Opcional" /></label>
        <label className="field-span-2">Notas<textarea rows={3} maxLength={500} value={draft.notes} onChange={(event) => field("notes", event.target.value)} placeholder="Detalles útiles para identificar este artículo" /></label>
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="modal-footer"><span className="modal-hint">La fecha de ingreso se registra al guardar.</span><button className="button button-outline" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando..." : item ? "Guardar cambios" : "Agregar artículo"}</button></div>
    </form>
  </ModalFrame>;
}

function draftFromItem(item: InventoryItem): ItemDraft {
  return {
    code: item.code, name: item.name, sku: item.sku, brand: item.brand, model: item.model,
    department: item.department, notes: item.notes, categoryId: item.categoryId, price: item.price,
  };
}

export default App;
