import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const LEGACY_WORK_ORDER_TYPE_VALUES = [
  "base_contract",
  "in_warranty_maintenance",
  "out_of_warranty_maintenance",
  "service_contract",
] as const;

export type LegacyWorkOrderType = (typeof LEGACY_WORK_ORDER_TYPE_VALUES)[number];

export const LEGACY_WORK_ORDER_TYPES = Object.fromEntries(
  LEGACY_WORK_ORDER_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<LegacyWorkOrderType>]: Lowercase<K>;
};

// ================ Labels ================

export const LEGACY_WORK_ORDER_TYPE_LABELS: LocalizedEntity<LegacyWorkOrderType> = {
  base_contract: {
    value: "base_contract",
    label: {
      en: "Base Contract",
      ar: "عقد أساسي",
    },
  },
  in_warranty_maintenance: {
    value: "in_warranty_maintenance",
    label: {
      en: "In-Warranty Maintenance",
      ar: "صيانة داخل الضمان",
    },
  },
  out_of_warranty_maintenance: {
    value: "out_of_warranty_maintenance",
    label: {
      en: "Out-of-Warranty Maintenance",
      ar: "صيانة خارج الضمان",
    },
  },
  service_contract: {
    value: "service_contract",
    label: {
      en: "Service Contract",
      ar: "عقد خدمة",
    },
  },
};

export const LEGACY_WORK_ORDER_TYPE_LABELS_LIST = Object.values(LEGACY_WORK_ORDER_TYPE_LABELS);

// ================ Helpers ================

export function getLegacyWorkOrderTypeLabel(workOrderType: LegacyWorkOrderType, locale: Locale) {
  if (!LEGACY_WORK_ORDER_TYPE_LABELS[workOrderType]) {
    console.warn(`LegacyWorkOrderType \`${workOrderType}\` does not exist in predefined labels.`);
    return workOrderType;
  } else
    return translate(
      locale,
      LEGACY_WORK_ORDER_TYPE_LABELS[workOrderType].label.en,
      LEGACY_WORK_ORDER_TYPE_LABELS[workOrderType].label.ar,
    );
}

export function isValidLegacyWorkOrderType(workOrderType: string): workOrderType is LegacyWorkOrderType {
  return LEGACY_WORK_ORDER_TYPE_VALUES.includes(workOrderType as LegacyWorkOrderType);
}
