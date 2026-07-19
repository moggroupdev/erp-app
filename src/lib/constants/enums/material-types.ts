import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MATERIAL_TYPE_VALUES = ["raw_materials", "spare_parts"] as const;

export type MaterialType = (typeof MATERIAL_TYPE_VALUES)[number];

export const MATERIAL_TYPES = Object.fromEntries(
  MATERIAL_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<MaterialType>]: Lowercase<K>;
};

// ================ Labels ================

export const MATERIAL_TYPE_LABELS: LocalizedEntity<MaterialType> = {
  raw_materials: {
    value: "raw_materials",
    label: {
      en: "Raw Materials",
      ar: "مواد خام",
    },
  },
  spare_parts: {
    value: "spare_parts",
    label: {
      en: "Spare Parts",
      ar: "قطع غيار",
    },
  },
};

export const MATERIAL_TYPE_LABELS_LIST = Object.values(MATERIAL_TYPE_LABELS);

// ================ Helpers ================

export function getMaterialTypeLabel(materialType: MaterialType, locale: Locale) {
  if (!MATERIAL_TYPE_LABELS[materialType]) {
    console.warn(`MaterialType \`${materialType}\` does not exist in predefined labels.`);
    return materialType;
  }
  return translate(locale, MATERIAL_TYPE_LABELS[materialType].label.en, MATERIAL_TYPE_LABELS[materialType].label.ar);
}

export function isValidMaterialType(materialType: string): materialType is MaterialType {
  return MATERIAL_TYPE_VALUES.includes(materialType as MaterialType);
}
