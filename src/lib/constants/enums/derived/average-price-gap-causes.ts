import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const AVERAGE_PRICE_GAP_CAUSE_VALUES = ["decimal_typo", "unit_mismatch", "drift"] as const;

export type AveragePriceGapCause = (typeof AVERAGE_PRICE_GAP_CAUSE_VALUES)[number];

export const AVERAGE_PRICE_GAP_CAUSES = Object.fromEntries(
  AVERAGE_PRICE_GAP_CAUSE_VALUES.map((cause) => [cause.toUpperCase(), cause]),
) as {
  [K in Uppercase<AveragePriceGapCause>]: Lowercase<K>;
};

// ================ Labels ================

export const AVERAGE_PRICE_GAP_CAUSE_LABELS: LocalizedEntity<AveragePriceGapCause> = {
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
  drift: {
    value: "drift",
    label: {
      en: "Price drift",
      ar: "انحراف سعري",
    },
  },
};

export const AVERAGE_PRICE_GAP_CAUSE_LABELS_LIST = Object.values(AVERAGE_PRICE_GAP_CAUSE_LABELS);

// ================ Helpers ================

export function getAveragePriceGapCauseLabel(cause: AveragePriceGapCause, locale: Locale) {
  if (!AVERAGE_PRICE_GAP_CAUSE_LABELS[cause]) {
    console.warn(`AveragePriceGapCause \`${cause}\` does not exist in predefined labels.`);
    return cause;
  }
  return translate(locale, AVERAGE_PRICE_GAP_CAUSE_LABELS[cause].label.en, AVERAGE_PRICE_GAP_CAUSE_LABELS[cause].label.ar);
}

export function isValidAveragePriceGapCause(cause: string): cause is AveragePriceGapCause {
  return AVERAGE_PRICE_GAP_CAUSE_VALUES.includes(cause as AveragePriceGapCause);
}
