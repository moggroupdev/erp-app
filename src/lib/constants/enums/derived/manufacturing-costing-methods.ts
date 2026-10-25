import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

// Which manufacturing fee is used when costing an externally manufactured BOM row.
export const MANUFACTURING_COSTING_METHOD_VALUES = ["last_outsourcing_cost", "market_manufacturing_cost"] as const;

export type ManufacturingCostingMethod = (typeof MANUFACTURING_COSTING_METHOD_VALUES)[number];

export const MANUFACTURING_COSTING_METHODS = Object.fromEntries(
  MANUFACTURING_COSTING_METHOD_VALUES.map((method) => [method.toUpperCase(), method]),
) as {
  [K in Uppercase<ManufacturingCostingMethod>]: Lowercase<K>;
};

export const MANUFACTURING_COSTING_METHOD_LABELS: LocalizedEntity<ManufacturingCostingMethod> = {
  last_outsourcing_cost: {
    value: "last_outsourcing_cost",
    label: {
      en: "Last Outsourcing Cost",
      ar: "آخر تكلفة تصنيع",
    },
  },
  market_manufacturing_cost: {
    value: "market_manufacturing_cost",
    label: {
      en: "Market Manufacturing Cost",
      ar: "تكلفة التصنيع السوقية",
    },
  },
};

export const MANUFACTURING_COSTING_METHOD_LABELS_LIST = Object.values(MANUFACTURING_COSTING_METHOD_LABELS);

const MANUFACTURING_COSTING_METHOD_SHORT_LABELS: LocalizedEntity<ManufacturingCostingMethod> = {
  last_outsourcing_cost: {
    value: "last_outsourcing_cost",
    label: { en: "Last OSO", ar: "آخر تصنيع" },
  },
  market_manufacturing_cost: {
    value: "market_manufacturing_cost",
    label: { en: "Market", ar: "سوق" },
  },
};

export function getManufacturingCostingMethodLabel(method: ManufacturingCostingMethod, locale: Locale) {
  if (!MANUFACTURING_COSTING_METHOD_LABELS[method]) {
    console.warn(`ManufacturingCostingMethod \`${method}\` does not exist in predefined labels.`);
    return method;
  }
  return translate(
    locale,
    MANUFACTURING_COSTING_METHOD_LABELS[method].label.en,
    MANUFACTURING_COSTING_METHOD_LABELS[method].label.ar,
  );
}

export function getManufacturingCostingMethodShortLabel(method: ManufacturingCostingMethod, locale: Locale) {
  if (!MANUFACTURING_COSTING_METHOD_SHORT_LABELS[method]) {
    console.warn(`ManufacturingCostingMethod \`${method}\` does not exist in predefined short labels.`);
    return method;
  }
  return translate(
    locale,
    MANUFACTURING_COSTING_METHOD_SHORT_LABELS[method].label.en,
    MANUFACTURING_COSTING_METHOD_SHORT_LABELS[method].label.ar,
  );
}

export function isValidManufacturingCostingMethod(method: string): method is ManufacturingCostingMethod {
  return MANUFACTURING_COSTING_METHOD_VALUES.includes(method as ManufacturingCostingMethod);
}
