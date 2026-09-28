import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MPO_PAYMENT_EVENT_VALUES = ["advance", "on_receipt", "after_receipt", "after_invoice"] as const;

export type MpoPaymentEvent = (typeof MPO_PAYMENT_EVENT_VALUES)[number];

export const MPO_PAYMENT_EVENTS = Object.fromEntries(
  MPO_PAYMENT_EVENT_VALUES.map((event) => [event.toUpperCase(), event]),
) as {
  [K in Uppercase<MpoPaymentEvent>]: Lowercase<K>;
};

export const MPO_PAYMENT_EVENT_LABELS: LocalizedEntity<MpoPaymentEvent> = {
  advance: {
    value: "advance",
    label: { en: "Advance", ar: "دفعة مقدمة" },
  },
  on_receipt: {
    value: "on_receipt",
    label: { en: "On receipt", ar: "عند الاستلام" },
  },
  after_receipt: {
    value: "after_receipt",
    label: { en: "After receipt", ar: "بعد الاستلام" },
  },
  after_invoice: {
    value: "after_invoice",
    label: { en: "After the invoice date", ar: "بعد تاريخ الفاتورة" },
  },
};

export const MPO_PAYMENT_EVENT_LABELS_LIST = Object.values(MPO_PAYMENT_EVENT_LABELS);

export function getMpoPaymentEventLabel(event: MpoPaymentEvent, locale: Locale) {
  const entry = MPO_PAYMENT_EVENT_LABELS[event];
  if (!entry) return event;
  return translate(locale, entry.label.en, entry.label.ar);
}

export function paymentEventNeedsOffset(event: MpoPaymentEvent | null) {
  return event === MPO_PAYMENT_EVENTS.AFTER_RECEIPT || event === MPO_PAYMENT_EVENTS.AFTER_INVOICE;
}
