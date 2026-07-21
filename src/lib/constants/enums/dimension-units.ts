import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const DIMENSION_UNIT_VALUES = ["m", "cm", "mm"] as const;

export type DimensionUnit = (typeof DIMENSION_UNIT_VALUES)[number];

export const DIMENSION_UNITS = Object.fromEntries(DIMENSION_UNIT_VALUES.map((unit) => [unit.toUpperCase(), unit])) as {
  [K in Uppercase<DimensionUnit>]: Lowercase<K>;
};

// ================ Labels ================

export const DIMENSION_UNIT_LABELS: LocalizedEntity<DimensionUnit> = {
  m: {
    value: "m",
    label: {
      en: "Meter",
      ar: "متر",
    },
  },
  cm: {
    value: "cm",
    label: {
      en: "Centimeter",
      ar: "سنتيمتر",
    },
  },
  mm: {
    value: "mm",
    label: {
      en: "Millimeter",
      ar: "مليمتر",
    },
  },
};

export const DIMENSION_UNIT_LABELS_LIST = Object.values(DIMENSION_UNIT_LABELS);

// ================ Helpers ================

export function getDimensionUnitLabel(dimensionUnit: DimensionUnit, locale: Locale) {
  if (!DIMENSION_UNIT_LABELS[dimensionUnit]) {
    console.warn(`DimensionUnit \`${dimensionUnit}\` does not exist in predefined labels.`);
    return dimensionUnit;
  } else
    return translate(
      locale,
      DIMENSION_UNIT_LABELS[dimensionUnit].label.en,
      DIMENSION_UNIT_LABELS[dimensionUnit].label.ar,
    );
}

export function isValidDimensionUnit(dimensionUnit: string): dimensionUnit is DimensionUnit {
  return DIMENSION_UNIT_VALUES.includes(dimensionUnit as DimensionUnit);
}
