import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PRODUCT_SOURCE_TYPE_VALUES = ["manufactured", "imported"] as const;

export type ProductSourceType = (typeof PRODUCT_SOURCE_TYPE_VALUES)[number];

export const PRODUCT_SOURCE_TYPES = Object.fromEntries(
  PRODUCT_SOURCE_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<ProductSourceType>]: Lowercase<K>;
};

// ================ Labels ================

export const PRODUCT_SOURCE_TYPE_LABELS: LocalizedEntity<ProductSourceType> = {
  manufactured: {
    value: "manufactured",
    label: {
      en: "Manufactured",
      ar: "مُصنع",
    },
  },
  imported: {
    value: "imported",
    label: {
      en: "Imported",
      ar: "مستورد",
    },
  },
};

export const PRODUCT_SOURCE_TYPE_LABELS_LIST = Object.values(PRODUCT_SOURCE_TYPE_LABELS);

// ================ Helpers ================

export function getProductSourceTypeLabel(productSourceType: ProductSourceType, locale: Locale) {
  if (!PRODUCT_SOURCE_TYPE_LABELS[productSourceType]) {
    console.warn(`ProductSourceType \`${productSourceType}\` does not exist in predefined labels.`);
    return productSourceType; // Return the value itself
  } else
    return translate(
      locale,
      PRODUCT_SOURCE_TYPE_LABELS[productSourceType].label.en,
      PRODUCT_SOURCE_TYPE_LABELS[productSourceType].label.ar,
    );
}

export function isValidProductSourceType(productSourceType: string): productSourceType is ProductSourceType {
  return PRODUCT_SOURCE_TYPE_VALUES.includes(productSourceType as ProductSourceType);
}

export function isManufactured(productSourceType: ProductSourceType) {
  return productSourceType === PRODUCT_SOURCE_TYPES.MANUFACTURED;
}

export function isEquity(productSourceType: ProductSourceType) {
  return productSourceType === PRODUCT_SOURCE_TYPES.IMPORTED;
}
