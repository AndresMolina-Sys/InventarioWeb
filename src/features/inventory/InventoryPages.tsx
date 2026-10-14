import { useId } from "react";
import type { AppPreferences, AssetLifecycleStatus, Category, InventoryItem } from "../../types";
import { formatNumber, getLocale } from "../../i18n";
import type { TranslationKey, TranslationParameters } from "../../i18n";
import { AssetStatusBadge, EmptyState, Icon, TablePaginationControls, useTablePagination } from "../../components/AppPrimitives";
import type { TablePageSize } from "../../components/AppPrimitives";
import { ASSET_STATUS_FILTER_OPTIONS, assetStatusLabel, dateLabel, isDecommissioned, translated } from "../../lib/appPresentation";
import type { DisplayFormatting } from "../../lib/appPresentation";

type AssetStatusFilter = "all" | AssetLifecycleStatus;

export function InventoryPage({ items, allItems, categories, categoryFilter, onCategoryFilter, statusFilter, onStatusFilter, onNew, onView, onEdit, onDelete, onExport, pageSize, search, language, formatting }: {
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

export function CategoriesPage({ categories, items, onNew, onView, onEdit, onDelete, pageSize, language }: {
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

export function CategoryDetailPage({ category, items, onBack, onViewItem, onEditItem, onDeleteItem, pageSize, language, formatting }: {
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
