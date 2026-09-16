import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const AUDIT_ACTION_VALUES = ["insert", "update", "delete"] as const;

export type AuditAction = (typeof AUDIT_ACTION_VALUES)[number];

export const AUDIT_ACTIONS = Object.fromEntries(
  AUDIT_ACTION_VALUES.map((action) => [action.toUpperCase(), action]),
) as {
  [K in Uppercase<AuditAction>]: Lowercase<K>;
};

// ================ Labels ================

export const AUDIT_ACTION_LABELS: LocalizedEntity<AuditAction> = {
  insert: {
    value: "insert",
    label: {
      en: "Insert",
      ar: "إضافة",
    },
  },
  update: {
    value: "update",
    label: {
      en: "Update",
      ar: "تحديث",
    },
  },
  delete: {
    value: "delete",
    label: {
      en: "Delete",
      ar: "حذف",
    },
  },
};

export const AUDIT_ACTION_LABELS_LIST = Object.values(AUDIT_ACTION_LABELS);

// ================ Helpers ================

export function getAuditActionLabel(action: AuditAction, locale: Locale) {
  if (!AUDIT_ACTION_LABELS[action]) {
    console.warn(`AuditAction \`${action}\` does not exist in predefined labels.`);
    return action;
  }
  return translate(locale, AUDIT_ACTION_LABELS[action].label.en, AUDIT_ACTION_LABELS[action].label.ar);
}

export function isValidAuditAction(action: string): action is AuditAction {
  return AUDIT_ACTION_VALUES.includes(action as AuditAction);
}
