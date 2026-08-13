import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_VALUES = [
  "base_contract",
  "in_warranty_maintenance",
  "out_of_warranty_maintenance",
  "service_contract",
] as const;

export type LegacyIssuePermitWorkOrderType = (typeof LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_VALUES)[number];

export const LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES = Object.fromEntries(
  LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<LegacyIssuePermitWorkOrderType>]: Lowercase<K>;
};

// ================ Labels ================

export const LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS: LocalizedEntity<LegacyIssuePermitWorkOrderType> = {
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

export const LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS_LIST = Object.values(LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS);

// ================ Helpers ================

export function getLegacyIssuePermitWorkOrderTypeLabel(workOrderType: LegacyIssuePermitWorkOrderType, locale: Locale) {
  if (!LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS[workOrderType]) {
    console.warn(`LegacyIssuePermitWorkOrderType \`${workOrderType}\` does not exist in predefined labels.`);
    return workOrderType;
  } else
    return translate(
      locale,
      LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS[workOrderType].label.en,
      LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS[workOrderType].label.ar,
    );
}

export function isValidLegacyIssuePermitWorkOrderType(workOrderType: string): workOrderType is LegacyIssuePermitWorkOrderType {
  return LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_VALUES.includes(workOrderType as LegacyIssuePermitWorkOrderType);
}
