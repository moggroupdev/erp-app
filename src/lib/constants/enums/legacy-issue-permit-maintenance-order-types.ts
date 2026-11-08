import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_VALUES = [
  "in_warranty_maintenance",
  "out_of_warranty_maintenance",
  "service_contract",
  "sold_goods",
] as const;

export type LegacyIssuePermitMaintenanceOrderType =
  (typeof LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_VALUES)[number];

export const LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPES = Object.fromEntries(
  LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<LegacyIssuePermitMaintenanceOrderType>]: Lowercase<K>;
};

// ================ Labels ================

export const LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS: LocalizedEntity<LegacyIssuePermitMaintenanceOrderType> = {
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
  sold_goods: {
    value: "sold_goods",
    label: {
      en: "Sold Goods",
      ar: "بضاعة مباعة",
    },
  },
};

export const LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS_LIST = Object.values(
  LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS,
);

// ================ Helpers ================

export function getLegacyIssuePermitMaintenanceOrderTypeLabel(
  maintenanceOrderType: LegacyIssuePermitMaintenanceOrderType,
  locale: Locale,
) {
  if (!LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS[maintenanceOrderType]) {
    console.warn(
      `LegacyIssuePermitMaintenanceOrderType \`${maintenanceOrderType}\` does not exist in predefined labels.`,
    );
    return maintenanceOrderType;
  } else
    return translate(
      locale,
      LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS[maintenanceOrderType].label.en,
      LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS[maintenanceOrderType].label.ar,
    );
}

export function isValidLegacyIssuePermitMaintenanceOrderType(
  maintenanceOrderType: string,
): maintenanceOrderType is LegacyIssuePermitMaintenanceOrderType {
  return LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_VALUES.includes(
    maintenanceOrderType as LegacyIssuePermitMaintenanceOrderType,
  );
}