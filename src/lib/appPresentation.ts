import { DEFAULT_CRC_PER_USD, DEFAULT_EUR_PER_USD } from "./preferencesRepository";
import type { AppPreferences, AssetLifecycleStatus, InventoryItem } from "../types";
import { convertUsdAmount, formatCurrency, formatDateTime, formatNumber, getLocale, translate } from "../i18n";
import type { TranslationKey, TranslationParameters } from "../i18n";
import { resolveAssetStatus } from "./inventoryRepository";

export type DisplayFormatting = Readonly<{
  displayCurrency: NonNullable<AppPreferences["displayCurrency"]>;
  crcPerUsd: number;
  eurPerUsd: number;
  dateFormat: NonNullable<AppPreferences["dateFormat"]>;
  timeFormat: NonNullable<AppPreferences["timeFormat"]>;
}>;

export const INITIAL_ASSET_STATUS_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance"];
export const ASSET_STATUS_FILTER_OPTIONS: readonly AssetLifecycleStatus[] = ["available", "assigned", "maintenance", "decommissioned"];

const ASSET_STATUS_KEYS: Record<AssetLifecycleStatus, TranslationKey> = {
  available: "statusAvailable",
  assigned: "statusAssigned",
  maintenance: "statusMaintenance",
  decommissioned: "statusDecommissioned",
};

export const DEFAULT_DISPLAY_FORMATTING: DisplayFormatting = {
  displayCurrency: "USD",
  crcPerUsd: DEFAULT_CRC_PER_USD,
  eurPerUsd: DEFAULT_EUR_PER_USD,
  dateFormat: "dmy",
  timeFormat: "12h",
};

export function translated(language: AppPreferences["language"], key: TranslationKey, parameters?: TranslationParameters): string {
  return translate(language, key, parameters);
}

export function assetStatusLabel(status: AssetLifecycleStatus, language: AppPreferences["language"]): string {
  return translated(language, ASSET_STATUS_KEYS[status]);
}

export function isDecommissioned(item: InventoryItem): boolean {
  return resolveAssetStatus(item.status).value === "decommissioned";
}

export function dateLabel(value: string | Date, language: AppPreferences["language"] = "es", formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING): string {
  return formatDateTime(value, language, formatting.dateFormat, formatting.timeFormat);
}

export function costLabel(value: number | null, language: AppPreferences["language"] = "es", formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING): string {
  if (value === null) return translated(language, "unspecified");
  return formatCurrency(convertUsdAmount(value, formatting.displayCurrency, formatting), formatting.displayCurrency, language);
}

export function compactRegisteredValueLabel(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2,
  }).format(value);
}

export function compactDisplayValueLabel(value: number, currency: NonNullable<AppPreferences["displayCurrency"]>, language: AppPreferences["language"]): string {
  if (currency === "USD") return compactRegisteredValueLabel(value);
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency", currency, currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 2,
  }).format(value);
}

export function localizedAppError(message: string, language: AppPreferences["language"]): string {
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

export function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
