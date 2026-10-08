import type {
  AppPreferences,
  TableDensityPreference,
  ThemePreference,
} from "../types";

export const PREFERENCES_STORAGE_KEY = "inventarioweb:preferences:v1";

export const DEFAULT_APP_PREFERENCES: Readonly<AppPreferences> = Object.freeze({
  theme: "system",
  showRecentActivityChart: true,
  showCategoryChart: true,
  tableDensity: "comfortable",
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
