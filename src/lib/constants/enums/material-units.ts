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
  "sheet",
  "roll",
  "box",
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
  sheet: {
    value: "sheet",
    label: {
      en: "Sheet",
      ar: "لوح",
    },
  },
  roll: {
    value: "roll",
    label: {
      en: "Roll",
      ar: "لفة",
    },
  },
  box: {
    value: "box",
    label: {
      en: "Box",
      ar: "صندوق",
    },
  },
};

export const MATERIAL_UNIT_LABELS_LIST = Object.values(MATERIAL_UNIT_LABELS);

// ================ Helpers ================

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
