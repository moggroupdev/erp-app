import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MATERIAL_UNIT_VALUES = [
  "count",
  "kg",
  "gram",
  "ton",
  "cm",
  "meter",
  "square_meter",
  "cubic_meter",
  "liter",
] as const;

export type MaterialUnit = (typeof MATERIAL_UNIT_VALUES)[number];

export const MATERIAL_UNITS = Object.fromEntries(MATERIAL_UNIT_VALUES.map((unit) => [unit.toUpperCase(), unit])) as {
  [K in Uppercase<MaterialUnit>]: Lowercase<K>;
};

// ================ Labels ================

export const MATERIAL_UNIT_LABELS: LocalizedEntity<MaterialUnit> = {
  count: {
    value: "count",
    label: {
      en: "Count",
      ar: "عدد",
    },
  },
  gram: {
    value: "gram",
    label: {
      en: "Gram",
      ar: "جرام",
    },
  },
  kg: {
    value: "kg",
    label: {
      en: "Kilogram",
      ar: "كيلوجرام",
    },
  },
  ton: {
    value: "ton",
    label: {
      en: "Ton",
      ar: "طن",
    },
  },
  cm: {
    value: "cm",
    label: {
      en: "Centimeter",
      ar: "سنتيمتر",
    },
  },
  meter: {
    value: "meter",
    label: {
      en: "Meter",
      ar: "متر",
    },
  },
  square_meter: {
    value: "square_meter",
    label: {
      en: "Meter²",
      ar: "متر²",
    },
  },
  cubic_meter: {
    value: "cubic_meter",
    label: {
      en: "Meter³",
      ar: "متر³",
    },
  },
  liter: {
    value: "liter",
    label: {
      en: "Liter",
      ar: "لتر",
    },
  },
};

export const MATERIAL_UNIT_LABELS_LIST = Object.values(MATERIAL_UNIT_LABELS);

// ================ Helpers ================

export function getMaterialUnitSelectOptions(
  baseUnit: MaterialUnit | null | undefined,
  unitConversions: { unit: MaterialUnit }[] = [],
  locale: Locale,
): { value: MaterialUnit; label: string }[] {
  if (!baseUnit) return [];

  const altUnits = unitConversions.map((row) => row.unit);
  const allUnits = [baseUnit, ...altUnits.filter((unit) => unit !== baseUnit)];

  return allUnits.map((value) => ({ value, label: getMaterialUnitLabel(value, locale) }));
}

export function getMaterialUnitLabel(materialUnit: MaterialUnit, locale: Locale) {
  if (!MATERIAL_UNIT_LABELS[materialUnit]) {
    console.warn(`MaterialUnit \`${materialUnit}\` does not exist in predefined labels.`);
    return materialUnit;
  }
  return translate(locale, MATERIAL_UNIT_LABELS[materialUnit].label.en, MATERIAL_UNIT_LABELS[materialUnit].label.ar);
}

export function isValidMaterialUnit(materialUnit: string): materialUnit is MaterialUnit {
  return MATERIAL_UNIT_VALUES.includes(materialUnit as MaterialUnit);
}
