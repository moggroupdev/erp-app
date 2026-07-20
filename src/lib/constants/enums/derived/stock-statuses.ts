import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const STOCK_STATUS_VALUES = ["out_of_stock", "low_stock", "in_stock", "no_minimum_set"] as const;

export type StockStatus = (typeof STOCK_STATUS_VALUES)[number];

export const STOCK_STATUSES = Object.fromEntries(STOCK_STATUS_VALUES.map((status) => [status.toUpperCase(), status])) as {
  [K in Uppercase<StockStatus>]: Lowercase<K>;
};

// ================ Labels ================

export const STOCK_STATUS_LABELS: LocalizedEntity<StockStatus> = {
  out_of_stock: {
    value: "out_of_stock",
    label: {
      en: "Out of Stock",
      ar: "نفد المخزون",
    },
  },
  low_stock: {
    value: "low_stock",
    label: {
      en: "Low Stock",
      ar: "مخزون منخفض",
    },
  },
  in_stock: {
    value: "in_stock",
    label: {
      en: "In Stock",
      ar: "متوفر",
    },
  },
  no_minimum_set: {
    value: "no_minimum_set",
    label: {
      en: "No Minimum Set",
      ar: "بدون حد طلب",
    },
  },
};

export const STOCK_STATUS_LABELS_LIST = Object.values(STOCK_STATUS_LABELS);

// ================ Helpers ================

export function getStockStatusLabel(status: StockStatus, locale: Locale) {
  if (!STOCK_STATUS_LABELS[status]) {
    console.warn(`StockStatus \`${status}\` does not exist in predefined labels.`);
    return status;
  }
  return translate(locale, STOCK_STATUS_LABELS[status].label.en, STOCK_STATUS_LABELS[status].label.ar);
}

export function isValidStockStatus(status: string): status is StockStatus {
  return STOCK_STATUS_VALUES.includes(status as StockStatus);
}
