import { formatNumber, translate } from "../i18n.ts";
import type { TranslationKey, TranslationParameters } from "../i18n";
import type { AppPreferences } from "../types";

export function localizeAppError(message: string, language: AppPreferences["language"]): string {
  const patterns: Array<[RegExp, TranslationKey]> = [
    [/El inventario cambió en otra pestaña\. Recarga los datos antes de guardar\./, "inventoryChangedInAnotherTab"],
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
    [/Escribe el motivo de la baja\.|El motivo de la baja es obligatorio\./, "decommissionReasonRequired"],
    [/El motivo no puede superar los 200 caracteres/, "reasonLengthInvalid"],
  ];

  for (const [pattern, key] of patterns) {
    if (pattern.test(message)) return translate(language, key);
  }

  const associated = message.match(/No se puede borrar «(.+?)» porque tiene (\d+) artículo\(s\) asociado\(s\)\./);
  if (associated) {
    return translate(language, "associatedArticleDeleteError", {
      name: associated[1],
      count: formatNumber(Number(associated[2]), language),
    } satisfies TranslationParameters);
  }

  if (/base local|base de datos local|IndexedDB/i.test(message)) return translate(language, "databaseSaveFailure");
  return translate(language, "unexpectedError");
}
