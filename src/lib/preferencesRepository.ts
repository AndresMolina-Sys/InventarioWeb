import type {
  AppLanguage,
  AppPreferences,
  DateFormatPreference,
  DisplayCurrencyPreference,
  TableDensityPreference,
  TablePageSizePreference,
  TimeFormatPreference,
  ThemePreference,
} from "../types";

export const PREFERENCES_STORAGE_KEY = "inventarioweb:preferences:v1";

export const RATE_REFERENCE_DATE = "2026-10-08";
export const DEFAULT_CRC_PER_USD = 453.92;
export const DEFAULT_EUR_PER_USD = 1 / 1.1186;
export const RATE_REFERENCE_METADATA = Object.freeze({
  crc: Object.freeze({
    source: "BCCR",
    date: RATE_REFERENCE_DATE,
    detail: "Midpoint of CRC 450.8100 purchase and CRC 457.0300 sale per USD.",
  }),
  eur: Object.freeze({
    source: "ECB",
    date: RATE_REFERENCE_DATE,
    detail: "Inverse of the reference rate EUR 1 = USD 1.1186.",
  }),
});

export const DEFAULT_APP_PREFERENCES: Readonly<AppPreferences> = Object.freeze({
  theme: "system",
  showRecentActivityChart: true,
  showCategoryChart: true,
  tableDensity: "comfortable",
  language: "es",
  showRegisteredValue: true,
  displayCurrency: "USD",
  crcPerUsd: DEFAULT_CRC_PER_USD,
  eurPerUsd: DEFAULT_EUR_PER_USD,
  tablePageSize: 25,
  dateFormat: "dmy",
  timeFormat: "12h",
});

export type PreferencesLoadResult =
  | { status: "loaded"; preferences: AppPreferences }
  | { status: "missing"; preferences: AppPreferences }
  | {
      status: "error";
      reason: "storage" | "parse";
      preferences: AppPreferences;
    };

export type PreferencesSaveResult =
  | { status: "saved" }
  | { status: "error"; reason: "storage" | "serialization" };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isTableDensityPreference(value: unknown): value is TableDensityPreference {
  return value === "comfortable" || value === "compact";
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "es" || value === "en";
}

function isDisplayCurrency(value: unknown): value is DisplayCurrencyPreference {
  return value === "USD" || value === "CRC" || value === "EUR";
}

function isPositiveFiniteRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTablePageSize(value: unknown): value is TablePageSizePreference {
  return value === 10 || value === 15 || value === 25 || value === 50 || value === "all";
}

function isDateFormat(value: unknown): value is DateFormatPreference {
  return value === "dmy" || value === "iso";
}

function isTimeFormat(value: unknown): value is TimeFormatPreference {
  return value === "12h" || value === "24h";
}

export function createDefaultAppPreferences(): AppPreferences {
  return { ...DEFAULT_APP_PREFERENCES };
}

export function normalizeAppPreferences(value: unknown): AppPreferences {
  const preferences = isRecord(value) ? value : {};

  return {
    theme: isThemePreference(preferences.theme)
      ? preferences.theme
      : DEFAULT_APP_PREFERENCES.theme,
    showRecentActivityChart:
      typeof preferences.showRecentActivityChart === "boolean"
        ? preferences.showRecentActivityChart
        : DEFAULT_APP_PREFERENCES.showRecentActivityChart,
    showCategoryChart:
      typeof preferences.showCategoryChart === "boolean"
        ? preferences.showCategoryChart
        : DEFAULT_APP_PREFERENCES.showCategoryChart,
    tableDensity: isTableDensityPreference(preferences.tableDensity)
      ? preferences.tableDensity
      : DEFAULT_APP_PREFERENCES.tableDensity,
    language: isAppLanguage(preferences.language)
      ? preferences.language
      : DEFAULT_APP_PREFERENCES.language,
    showRegisteredValue:
      typeof preferences.showRegisteredValue === "boolean"
        ? preferences.showRegisteredValue
        : DEFAULT_APP_PREFERENCES.showRegisteredValue,
    displayCurrency: isDisplayCurrency(preferences.displayCurrency)
      ? preferences.displayCurrency
      : DEFAULT_APP_PREFERENCES.displayCurrency,
    crcPerUsd: isPositiveFiniteRate(preferences.crcPerUsd)
      ? preferences.crcPerUsd
      : DEFAULT_APP_PREFERENCES.crcPerUsd,
    eurPerUsd: isPositiveFiniteRate(preferences.eurPerUsd)
      ? preferences.eurPerUsd
      : DEFAULT_APP_PREFERENCES.eurPerUsd,
    tablePageSize: isTablePageSize(preferences.tablePageSize)
      ? preferences.tablePageSize
      : DEFAULT_APP_PREFERENCES.tablePageSize,
    dateFormat: isDateFormat(preferences.dateFormat)
      ? preferences.dateFormat
      : DEFAULT_APP_PREFERENCES.dateFormat,
    timeFormat: isTimeFormat(preferences.timeFormat)
      ? preferences.timeFormat
      : DEFAULT_APP_PREFERENCES.timeFormat,
  };
}

export function loadAppPreferences(): PreferencesLoadResult {
  let storedValue: string | null;

  try {
    if (typeof window === "undefined") {
      return {
        status: "error",
        reason: "storage",
        preferences: createDefaultAppPreferences(),
      };
    }

    storedValue = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return {
      status: "error",
      reason: "storage",
      preferences: createDefaultAppPreferences(),
    };
  }

  if (storedValue === null) {
    return {
      status: "missing",
      preferences: createDefaultAppPreferences(),
    };
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue) as unknown;
  } catch {
    return {
      status: "error",
      reason: "parse",
      preferences: createDefaultAppPreferences(),
    };
  }

  return {
    status: "loaded",
    preferences: normalizeAppPreferences(parsedValue),
  };
}

export function saveAppPreferences(value: AppPreferences): PreferencesSaveResult {
  let serializedValue: string;

  try {
    serializedValue = JSON.stringify(normalizeAppPreferences(value));
  } catch {
    return { status: "error", reason: "serialization" };
  }

  try {
    if (typeof window === "undefined") {
      return { status: "error", reason: "storage" };
    }

    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, serializedValue);
    return { status: "saved" };
  } catch {
    return { status: "error", reason: "storage" };
  }
}
