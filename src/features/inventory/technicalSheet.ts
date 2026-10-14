import { CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM, encodeCode128B } from "../../lib/code128";
import type { Code128BBlockedReason, Code128BResult } from "../../lib/code128";
import type { AppPreferences, InventoryItem } from "../../types";
import { costLabel, dateLabel, DEFAULT_DISPLAY_FORMATTING, translated } from "../../lib/appPresentation";
import type { DisplayFormatting } from "../../lib/appPresentation";
export type TechnicalSheetRequiredField = "code" | "name" | "category";

export type TechnicalSheetSnapshot = Readonly<{
  code: string | undefined;
  name: string | undefined;
  categoryName: string | undefined;
  brand: string | undefined;
  model: string | undefined;
  serialNumber: string | undefined;
  location: string | undefined;
  cost: number | null | string | undefined;
  createdAt: string | undefined;
  notes: string | undefined;
}>;

export type TechnicalSheetPreviewState = Readonly<{
  snapshot: TechnicalSheetSnapshot;
  display: Readonly<{
    code: string;
    name: string;
    categoryName: string;
    brand: string;
    model: string;
    serialNumber: string;
    location: string;
    cost: string;
    createdAt: string;
    notes: string;
  }>;
  missingRequiredFields: readonly TechnicalSheetRequiredField[];
  barcode: Code128BResult | null;
  canPrint: boolean;
}>;

function hasNonBlankText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalTextLabel(value: string | undefined, emptyLabel: string): string {
  return hasNonBlankText(value) ? value : emptyLabel;
}

function technicalSheetCostLabel(value: number | null | string | undefined, language: AppPreferences["language"], formatting: DisplayFormatting): string {
  return typeof value === "number" && Number.isFinite(value)
    ? costLabel(value, language, formatting)
    : translated(language, "unspecified");
}

function technicalSheetDisplay(snapshot: TechnicalSheetSnapshot, language: AppPreferences["language"], formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING) {
  return Object.freeze({
    code: optionalTextLabel(snapshot.code, translated(language, "unavailableInBrackets")),
    name: optionalTextLabel(snapshot.name, translated(language, "unavailableInBrackets")),
    categoryName: optionalTextLabel(snapshot.categoryName, translated(language, "unavailableInBrackets")),
    brand: optionalTextLabel(snapshot.brand, translated(language, "unspecified")),
    model: optionalTextLabel(snapshot.model, translated(language, "unspecified")),
    serialNumber: optionalTextLabel(snapshot.serialNumber, translated(language, "unspecified")),
    location: optionalTextLabel(snapshot.location, translated(language, "unspecified")),
    cost: technicalSheetCostLabel(snapshot.cost, language, formatting),
    createdAt: snapshot.createdAt && !Number.isNaN(Date.parse(snapshot.createdAt))
      ? dateLabel(snapshot.createdAt, language, formatting)
      : translated(language, "unavailableInBrackets"),
    notes: optionalTextLabel(snapshot.notes, translated(language, "noObservations")),
  });
}

export function prepareTechnicalSheetPreview(
  item: InventoryItem,
  categoryName: string | undefined,
  language: AppPreferences["language"] = "es",
  formatting: DisplayFormatting = DEFAULT_DISPLAY_FORMATTING,
): TechnicalSheetPreviewState {
  const itemRecord = item as Partial<InventoryItem>;
  const snapshot = Object.freeze({
    code: itemRecord.code,
    name: itemRecord.name,
    categoryName,
    brand: itemRecord.brand,
    model: itemRecord.model,
    serialNumber: itemRecord.serialNumber,
    location: itemRecord.location,
    cost: itemRecord.cost as number | null | string | undefined,
    createdAt: itemRecord.createdAt,
    notes: itemRecord.notes,
  });
  const hasCode = hasNonBlankText(snapshot.code);
  const hasName = hasNonBlankText(snapshot.name);
  const hasCategory = hasNonBlankText(snapshot.categoryName);
  const missingRequiredFields: TechnicalSheetRequiredField[] = [
    ...(!hasCode ? ["code" as const] : []),
    ...(!hasName ? ["name" as const] : []),
    ...(!hasCategory ? ["category" as const] : []),
  ];
  const barcode = hasCode
    ? encodeCode128B(snapshot.code, { maxWidthMm: CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM })
    : null;

  return Object.freeze({
    snapshot,
    display: technicalSheetDisplay(snapshot, language, formatting),
    missingRequiredFields,
    barcode,
    canPrint: missingRequiredFields.length === 0 && barcode?.status === "printable",
  });
}

export function code128BlockMessage(reason: Code128BBlockedReason, language: AppPreferences["language"]): string {
  if (reason === "unsupported-character") return translated(language, "barcodeUnsupportedCharacters");
  if (reason === "width-exceeded") return translated(language, "barcodeTooWideLabel");
  return translated(language, "barcodeTooShort");
}

export function technicalSheetBlockMessage(preview: TechnicalSheetPreviewState, language: AppPreferences["language"]): string {
  if (preview.missingRequiredFields.length > 0) {
    const labels: Record<TechnicalSheetRequiredField, string> = {
      code: translated(language, "code"),
      name: translated(language, "name"),
      category: translated(language, "category"),
    };
    const missing = preview.missingRequiredFields.map((field) => labels[field]).join(", ");
    return translated(language, "missingRequiredFields", { fields: missing });
  }

  if (preview.barcode?.status !== "blocked") return "";
  if (preview.barcode.reason === "unsupported-character") return translated(language, "barcodeUnsupportedUppercase");
  if (preview.barcode.reason === "width-exceeded") return translated(language, "barcodeTooWideSheet");
  return translated(language, "barcodeMinimumHeight");
}
