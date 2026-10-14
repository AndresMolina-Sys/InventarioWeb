import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { assetStatusesMatch, getAllowedTransitions, normalizeAssetStatusReason, resolveAssetStatus } from "../../lib/inventoryRepository";
import { CODE128_MODULE_WIDTH_MM, encodeCode128B } from "../../lib/code128";
import type { UpdateItemDraft } from "../../lib/inventoryRepository";
import type { AppPreferences, Category, CategoryDraft, InventoryItem } from "../../types";
import { formatNumber } from "../../i18n";
import type { TranslationKey, TranslationParameters } from "../../i18n";
import { AssetStatusBadge, ModalFrame } from "../../components/AppPrimitives";
import { INITIAL_ASSET_STATUS_OPTIONS, assetStatusLabel, costLabel, dateLabel, errorMessage, isDecommissioned, localizedAppError, translated } from "../../lib/appPresentation";
import type { DisplayFormatting } from "../../lib/appPresentation";
import { code128BlockMessage, prepareTechnicalSheetPreview, technicalSheetBlockMessage } from "./technicalSheet";
import type { TechnicalSheetPreviewState } from "./technicalSheet";
export function CategoryModal({ category, error, saving, onClose, onSave, language }: { category: Category | null; error: string; saving: boolean; onClose: () => void; onSave: (draft: CategoryDraft) => Promise<void>; language: AppPreferences["language"] }) {
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

export function ItemDetailModal({ item, categoryName, onClose, language, formatting }: {
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
    const display = technicalSheetPreview.display;
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

export function ItemModal({ item, categories, error, saving, onClose, onClearError, onSave, language }: { item: InventoryItem | null; categories: Category[]; error: string; saving: boolean; onClose: () => void; onClearError: () => void; onSave: (draft: UpdateItemDraft) => Promise<boolean>; language: AppPreferences["language"] }) {
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

export function editableStatusOptions(item: InventoryItem, language: AppPreferences["language"]): Array<{ value: string; label: string }> {
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

export function draftFromItem(item: InventoryItem): UpdateItemDraft {
  return {
    code: item.code, name: item.name, sku: item.sku, serialNumber: item.serialNumber, brand: item.brand, model: item.model,
    location: item.location, notes: item.notes, categoryId: item.categoryId, cost: item.cost, status: item.status,
  };
}
