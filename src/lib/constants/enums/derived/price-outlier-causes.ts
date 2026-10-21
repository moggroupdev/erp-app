import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PRICE_OUTLIER_CAUSE_VALUES = ["decimal_typo", "unit_mismatch", "spike", "missing_conversion"] as const;

export type PriceOutlierCause = (typeof PRICE_OUTLIER_CAUSE_VALUES)[number];

export const PRICE_OUTLIER_CAUSES = Object.fromEntries(
  PRICE_OUTLIER_CAUSE_VALUES.map((cause) => [cause.toUpperCase(), cause]),
) as {
  [K in Uppercase<PriceOutlierCause>]: Lowercase<K>;
};

// ================ Labels ================

export const PRICE_OUTLIER_CAUSE_LABELS: LocalizedEntity<PriceOutlierCause> = {
  decimal_typo: {
    value: "decimal_typo",
    label: {
      en: "Decimal typo",
      ar: "خطأ عشري",
    },
  },
  unit_mismatch: {
    value: "unit_mismatch",
    label: {
      en: "Wrong unit",
      ar: "وحدة خاطئة",
    },
  },
  spike: {
    value: "spike",
    label: {
      en: "Price spike",
      ar: "قفزة سعر",
    },
  },
  missing_conversion: {
    value: "missing_conversion",
    label: {
      en: "Missing conversion",
      ar: "تحويل وحدة مفقود",
    },
  },
};

export const PRICE_OUTLIER_CAUSE_LABELS_LIST = Object.values(PRICE_OUTLIER_CAUSE_LABELS);

// ================ Helpers ================

export function getPriceOutlierCauseLabel(cause: PriceOutlierCause, locale: Locale) {
  if (!PRICE_OUTLIER_CAUSE_LABELS[cause]) {
    console.warn(`PriceOutlierCause \`${cause}\` does not exist in predefined labels.`);
    return cause;
  }
  return translate(locale, PRICE_OUTLIER_CAUSE_LABELS[cause].label.en, PRICE_OUTLIER_CAUSE_LABELS[cause].label.ar);
}

export function isValidPriceOutlierCause(cause: string): cause is PriceOutlierCause {
  return PRICE_OUTLIER_CAUSE_VALUES.includes(cause as PriceOutlierCause);
}
