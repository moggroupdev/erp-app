import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const LEGACY_ISSUE_PERMIT_TYPE_VALUES = [
  "contract_review",
  "maintenance_order",
  "production_department",
  "internal_use",
  "executive_personal",
] as const;

export type LegacyIssuePermitType = (typeof LEGACY_ISSUE_PERMIT_TYPE_VALUES)[number];

export const LEGACY_ISSUE_PERMIT_TYPES = Object.fromEntries(
  LEGACY_ISSUE_PERMIT_TYPE_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<LegacyIssuePermitType>]: Lowercase<K>;
};

// ================ Labels ================

export const LEGACY_ISSUE_PERMIT_TYPE_LABELS: LocalizedEntity<LegacyIssuePermitType> = {
  contract_review: {
    value: "contract_review",
    label: {
      en: "Contract Review",
      ar: "مراجعة عقد",
    },
  },
  maintenance_order: {
    value: "maintenance_order",
    label: {
      en: "Maintenance Order",
      ar: "أمر صيانة",
    },
  },
  production_department: {
    value: "production_department",
    label: {
      en: "Production Department",
      ar: "قسم انتاج",
    },
  },
  internal_use: {
    value: "internal_use",
    label: {
      en: "Internal Use (Management / HQ)",
      ar: "استخدام داخلي (الإدارة / المقر)",
    },
  },
  executive_personal: {
    value: "executive_personal",
    label: {
      en: "Executive Personal (Mr. Ahmed Kamel)",
      ar: "خاص بـ أ/أحمد كامل",
    },
  },
};

export const LEGACY_ISSUE_PERMIT_TYPE_LABELS_LIST = Object.values(LEGACY_ISSUE_PERMIT_TYPE_LABELS);

// ================ Helpers ================

export function getLegacyIssuePermitTypeLabel(permitType: LegacyIssuePermitType, locale: Locale) {
  if (!LEGACY_ISSUE_PERMIT_TYPE_LABELS[permitType]) {
    console.warn(`LegacyIssuePermitType \`${permitType}\` does not exist in predefined labels.`);
    return permitType;
  } else
    return translate(
      locale,
      LEGACY_ISSUE_PERMIT_TYPE_LABELS[permitType].label.en,
      LEGACY_ISSUE_PERMIT_TYPE_LABELS[permitType].label.ar,
    );
}

export function isValidLegacyIssuePermitType(permitType: string): permitType is LegacyIssuePermitType {
  return LEGACY_ISSUE_PERMIT_TYPE_VALUES.includes(permitType as LegacyIssuePermitType);
}
