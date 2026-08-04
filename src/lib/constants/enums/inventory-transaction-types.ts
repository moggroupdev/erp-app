import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const INVENTORY_TRANSACTION_TYPE_VALUES = ["receipt", "issue", "return"] as const;

export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPE_VALUES)[number];

export const INVENTORY_TRANSACTION_TYPES = Object.fromEntries(
  INVENTORY_TRANSACTION_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<InventoryTransactionType>]: Lowercase<K>;
};

// ================ Labels ================

export const INVENTORY_TRANSACTION_TYPE_LABELS: LocalizedEntity<InventoryTransactionType> = {
  receipt: {
    value: "receipt",
    label: {
      en: "Receipt",
      ar: "إضافة",
    },
  },
  issue: {
    value: "issue",
    label: {
      en: "Issue",
      ar: "صرف",
    },
  },
  return: {
    value: "return",
    label: {
      en: "Return",
      ar: "مرتجع",
    },
  },
};

export const INVENTORY_TRANSACTION_TYPE_LABELS_LIST = Object.values(INVENTORY_TRANSACTION_TYPE_LABELS);

// ================ Helpers ================

export function getInventoryTransactionTypeLabel(transactionType: InventoryTransactionType, locale: Locale) {
  if (!INVENTORY_TRANSACTION_TYPE_LABELS[transactionType]) {
    console.warn(`InventoryTransactionType \`${transactionType}\` does not exist in predefined labels.`);
    return transactionType;
  } else
    return translate(
      locale,
      INVENTORY_TRANSACTION_TYPE_LABELS[transactionType].label.en,
      INVENTORY_TRANSACTION_TYPE_LABELS[transactionType].label.ar,
    );
}

export function isValidInventoryTransactionType(transactionType: string): transactionType is InventoryTransactionType {
  return INVENTORY_TRANSACTION_TYPE_VALUES.includes(transactionType as InventoryTransactionType);
}
