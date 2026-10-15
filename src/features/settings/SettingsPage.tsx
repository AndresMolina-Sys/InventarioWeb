import { useRef, useState } from "react";
import type { AppPreferences, ThemePreference } from "../../types";
import { getLocale } from "../../i18n";
import type { TranslationKey, TranslationParameters } from "../../i18n";
import { DEFAULT_CRC_PER_USD, DEFAULT_EUR_PER_USD, RATE_REFERENCE_METADATA } from "../../lib/preferencesRepository";
import { translated } from "../../lib/appPresentation";
import { Icon, ModalFrame } from "../../components/AppPrimitives";
import type { ClearInventoryResult } from "./clearInventoryAction";

export type PreferencesChange = Partial<AppPreferences> | ((current: AppPreferences) => AppPreferences);

export type { ClearInventoryResult } from "./clearInventoryAction";
export function SettingsPage({ preferences, onChange, onReset, onClear }: {
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
        {clearError && <p className="form-error" role="alert">{t(clearError === "legacy-error" ? "clearLegacyCleanupFailure" : clearError === "verification-error" ? "clearVerificationFailure" : "clearDatabaseFailure")}</p>}
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
