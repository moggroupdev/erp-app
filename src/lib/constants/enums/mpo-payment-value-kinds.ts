import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MPO_PAYMENT_VALUE_KIND_VALUES = ["percentage", "fixed_amount", "remainder"] as const;

export type MpoPaymentValueKind = (typeof MPO_PAYMENT_VALUE_KIND_VALUES)[number];

export const MPO_PAYMENT_VALUE_KINDS = Object.fromEntries(
  MPO_PAYMENT_VALUE_KIND_VALUES.map((kind) => [kind.toUpperCase(), kind]),
) as {
  [K in Uppercase<MpoPaymentValueKind>]: Lowercase<K>;
};

export const MPO_PAYMENT_VALUE_KIND_LABELS: LocalizedEntity<MpoPaymentValueKind> = {
  percentage: {
    value: "percentage",
    label: { en: "Percentage", ar: "نسبة مئوية" },
  },
  fixed_amount: {
    value: "fixed_amount",
    label: { en: "Fixed amount", ar: "مبلغ ثابت" },
  },
  remainder: {
    value: "remainder",
    label: { en: "Remainder", ar: "الباقي" },
  },
};

export const MPO_PAYMENT_VALUE_KIND_LABELS_LIST = Object.values(MPO_PAYMENT_VALUE_KIND_LABELS);

export function getMpoPaymentValueKindLabel(kind: MpoPaymentValueKind, locale: Locale) {
  const entry = MPO_PAYMENT_VALUE_KIND_LABELS[kind];
  if (!entry) return kind;
  return translate(locale, entry.label.en, entry.label.ar);
}
