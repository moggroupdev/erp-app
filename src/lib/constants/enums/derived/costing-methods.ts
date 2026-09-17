import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

// Which material price is used when costing a BOM (BOM-wide toggle).
export const COSTING_METHOD_VALUES = ["average_price", "last_purchase_price"] as const;

export type CostingMethod = (typeof COSTING_METHOD_VALUES)[number];

export const COSTING_METHODS = Object.fromEntries(COSTING_METHOD_VALUES.map((method) => [method.toUpperCase(), method])) as {
  [K in Uppercase<CostingMethod>]: Lowercase<K>;
};

// Item-level costing can also use the manually set market price.
export const ITEM_COSTING_METHOD_VALUES = [...COSTING_METHOD_VALUES, "market_price"] as const;

export type ItemCostingMethod = (typeof ITEM_COSTING_METHOD_VALUES)[number];

export const ITEM_COSTING_METHODS = Object.fromEntries(
  ITEM_COSTING_METHOD_VALUES.map((method) => [method.toUpperCase(), method]),
) as {
  [K in Uppercase<ItemCostingMethod>]: Lowercase<K>;
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

export const ITEM_COSTING_METHOD_LABELS: LocalizedEntity<ItemCostingMethod> = {
  ...COSTING_METHOD_LABELS,
  market_price: {
    value: "market_price",
    label: {
      en: "Market Price",
      ar: "سعر السوق",
    },
  },
};

export const COSTING_METHOD_LABELS_LIST = Object.values(COSTING_METHOD_LABELS);
export const ITEM_COSTING_METHOD_LABELS_LIST = Object.values(ITEM_COSTING_METHOD_LABELS);

const ITEM_COSTING_METHOD_SHORT_LABELS: LocalizedEntity<ItemCostingMethod> = {
  average_price: {
    value: "average_price",
    label: { en: "Avg", ar: "متوسط" },
  },
  last_purchase_price: {
    value: "last_purchase_price",
    label: { en: "Last PO", ar: "آخر شراء" },
  },
  market_price: {
    value: "market_price",
    label: { en: "Market", ar: "سوق" },
  },
};

// ================ Helpers ================

export function getCostingMethodLabel(method: CostingMethod, locale: Locale) {
  if (!COSTING_METHOD_LABELS[method]) {
    console.warn(`CostingMethod \`${method}\` does not exist in predefined labels.`);
    return method;
  }
  return translate(locale, COSTING_METHOD_LABELS[method].label.en, COSTING_METHOD_LABELS[method].label.ar);
}

export function getItemCostingMethodLabel(method: ItemCostingMethod, locale: Locale) {
  if (!ITEM_COSTING_METHOD_LABELS[method]) {
    console.warn(`ItemCostingMethod \`${method}\` does not exist in predefined labels.`);
    return method;
  }
  return translate(locale, ITEM_COSTING_METHOD_LABELS[method].label.en, ITEM_COSTING_METHOD_LABELS[method].label.ar);
}

export function getItemCostingMethodShortLabel(method: ItemCostingMethod, locale: Locale) {
  if (!ITEM_COSTING_METHOD_SHORT_LABELS[method]) {
    console.warn(`ItemCostingMethod \`${method}\` does not exist in predefined short labels.`);
    return method;
  }
  return translate(
    locale,
    ITEM_COSTING_METHOD_SHORT_LABELS[method].label.en,
    ITEM_COSTING_METHOD_SHORT_LABELS[method].label.ar,
  );
}

export function isValidCostingMethod(method: string): method is CostingMethod {
  return COSTING_METHOD_VALUES.includes(method as CostingMethod);
}

export function isValidItemCostingMethod(method: string): method is ItemCostingMethod {
  return ITEM_COSTING_METHOD_VALUES.includes(method as ItemCostingMethod);
}
