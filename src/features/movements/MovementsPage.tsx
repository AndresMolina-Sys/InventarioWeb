import { useMemo, useState } from "react";
import type { AppPreferences, InventoryMovement, InventoryMovementAuditField, InventoryMovementAuditFieldV2, InventoryMovementAuditSnapshot } from "../../types";
import { formatNumber, getLocale, presentAssetStatus } from "../../i18n";
import type { TranslationKey, TranslationParameters } from "../../i18n";
import { EmptyState, Icon, ModalFrame, TablePaginationControls, useTablePagination } from "../../components/AppPrimitives";
import type { IconName, TablePageSize } from "../../components/AppPrimitives";
import { costLabel, dateLabel, DEFAULT_DISPLAY_FORMATTING, translated } from "../../lib/appPresentation";
import type { DisplayFormatting } from "../../lib/appPresentation";

type MovementFilter = "all" | InventoryMovement["type"];

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

export function MovementsPage({ movements, pageSize, language, formatting }: { movements: InventoryMovement[]; pageSize: TablePageSize; language: AppPreferences["language"]; formatting: DisplayFormatting }) {
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
