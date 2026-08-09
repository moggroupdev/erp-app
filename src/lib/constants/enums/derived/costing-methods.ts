import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

// Which material price is used when costing a BOM.
export const COSTING_METHOD_VALUES = ["average_price", "last_purchase_price"] as const;

export type CostingMethod = (typeof COSTING_METHOD_VALUES)[number];

export const COSTING_METHODS = Object.fromEntries(COSTING_METHOD_VALUES.map((method) => [method.toUpperCase(), method])) as {
  [K in Uppercase<CostingMethod>]: Lowercase<K>;
};

// ================ Labels ================

export const COSTING_METHOD_LABELS: LocalizedEntity<CostingMethod> = {
  average_price: {
    value: "average_price",
    label: {
      en: "Average Price",
      ar: "متوسط السعر",
    },
  },
  last_purchase_price: {
    value: "last_purchase_price",
    label: {
      en: "Last Purchase Price",
      ar: "سعر آخر شراء",
    },
  },
};

export const COSTING_METHOD_LABELS_LIST = Object.values(COSTING_METHOD_LABELS);

// ================ Helpers ================

export function getCostingMethodLabel(method: CostingMethod, locale: Locale) {
  if (!COSTING_METHOD_LABELS[method]) {
    console.warn(`CostingMethod \`${method}\` does not exist in predefined labels.`);
    return method;
  }
  return translate(locale, COSTING_METHOD_LABELS[method].label.en, COSTING_METHOD_LABELS[method].label.ar);
}

export function isValidCostingMethod(method: string): method is CostingMethod {
  return COSTING_METHOD_VALUES.includes(method as CostingMethod);
}
