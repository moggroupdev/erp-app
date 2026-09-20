import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MM_SOURCING_TYPE_VALUES = ["purchased", "internally_manufactured", "externally_manufactured"] as const;

export type MmSourcingType = (typeof MM_SOURCING_TYPE_VALUES)[number];

export const MM_SOURCING_TYPES = Object.fromEntries(
  MM_SOURCING_TYPE_VALUES.map((sourcingType) => [sourcingType.toUpperCase(), sourcingType]),
) as {
  [K in Uppercase<MmSourcingType>]: Lowercase<K>;
};

// ================ Labels ================

export const MM_SOURCING_TYPE_LABELS: LocalizedEntity<MmSourcingType> = {
  purchased: {
    value: "purchased",
    label: {
      en: "Purchased",
      ar: "مشتراة جاهزة",
    },
  },
  internally_manufactured: {
    value: "internally_manufactured",
    label: {
      en: "Internally Manufactured",
      ar: "تصنيع داخلي",
    },
  },
  externally_manufactured: {
    value: "externally_manufactured",
    label: {
      en: "Externally Manufactured",
      ar: "تصنيع لدى الغير",
    },
  },
};

export const MM_SOURCING_TYPE_LABELS_LIST = Object.values(MM_SOURCING_TYPE_LABELS);

// ================ Helpers ================

export function getMmSourcingTypeLabel(sourcingType: MmSourcingType, locale: Locale) {
  if (!MM_SOURCING_TYPE_LABELS[sourcingType]) {
    console.warn(`MmSourcingType \`${sourcingType}\` does not exist in predefined labels.`);
    return sourcingType;
  }
  return translate(locale, MM_SOURCING_TYPE_LABELS[sourcingType].label.en, MM_SOURCING_TYPE_LABELS[sourcingType].label.ar);
}

export function isValidMmSourcingType(sourcingType: string): sourcingType is MmSourcingType {
  return MM_SOURCING_TYPE_VALUES.includes(sourcingType as MmSourcingType);
}

export function isPurchasedMmSourcing(sourcingType: MmSourcingType | null | undefined) {
  return sourcingType === MM_SOURCING_TYPES.PURCHASED;
}

export function isInternallyManufacturedMmSourcing(sourcingType: MmSourcingType | null | undefined) {
  return sourcingType === MM_SOURCING_TYPES.INTERNALLY_MANUFACTURED;
}

export function isExternallyManufacturedMmSourcing(sourcingType: MmSourcingType | null | undefined) {
  return sourcingType === MM_SOURCING_TYPES.EXTERNALLY_MANUFACTURED;
}

/** Internal or external: expand the MM recipe for costing / component display. */
export function usesMmRecipe(sourcingType: MmSourcingType | null | undefined) {
  return (
    sourcingType === MM_SOURCING_TYPES.INTERNALLY_MANUFACTURED || sourcingType === MM_SOURCING_TYPES.EXTERNALLY_MANUFACTURED
  );
}
