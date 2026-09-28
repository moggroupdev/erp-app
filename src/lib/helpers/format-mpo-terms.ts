import { getMpoDeliveryLocationLabel, type MpoDeliveryLocation } from "@/lib/constants/enums/mpo-delivery-locations";
import { MPO_DELIVERY_TIMINGS, type MpoDeliveryTiming } from "@/lib/constants/enums/mpo-delivery-timings";
import { MPO_PAYMENT_EVENTS, paymentEventNeedsOffset, type MpoPaymentEvent } from "@/lib/constants/enums/mpo-payment-events";
import { MPO_PAYMENT_VALUE_KINDS, type MpoPaymentValueKind } from "@/lib/constants/enums/mpo-payment-value-kinds";
import type { Locale } from "@/lib/i18n/types";
import { formatMoney } from "./format-money";

type PaymentTermSlice = {
  event: MpoPaymentEvent;
  offsetDays: number | null;
  valueKind: MpoPaymentValueKind;
  value: number | null;
};

type Translate = (en: string, ar: string) => string;

export function formatDeliveryLocationLine(location: MpoDeliveryLocation, locale: Locale, translate: Translate) {
  const place = getMpoDeliveryLocationLabel(location, locale);
  return translate(`Delivery location: ${place}.`, `مكان التسليم: ${place}.`);
}

export function formatDeliveryPeriodLine(timing: MpoDeliveryTiming, days: number | null, translate: Translate) {
  if (timing === MPO_DELIVERY_TIMINGS.IMMEDIATE) {
    return translate("Delivery period: immediately.", "مدة التوريد: فوراً.");
  }
  return translate(`Delivery period: within ${days ?? "—"} days.`, `مدة التوريد: خلال ${days ?? "—"} يوم.`);
}

export function formatPaymentTermLine(term: PaymentTermSlice, translate: Translate, currency?: string) {
  const share =
    term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER
      ? translate("the remainder", "الباقي")
      : term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE
        ? `${term.value}%`
        : formatMoney(Number(term.value), currency);

  if (term.event === MPO_PAYMENT_EVENTS.ADVANCE) return translate(`${share} in advance`, `${share} دفعة مقدمة`);
  if (term.event === MPO_PAYMENT_EVENTS.ON_RECEIPT) return translate(`${share} on receipt`, `${share} عند الاستلام`);
  if (term.event === MPO_PAYMENT_EVENTS.AFTER_RECEIPT) {
    return translate(`${share} after ${term.offsetDays} days from receipt`, `${share} بعد ${term.offsetDays} يوم من الاستلام`);
  }
  if (paymentEventNeedsOffset(term.event)) {
    return translate(
      `${share} after ${term.offsetDays} days from the invoice date`,
      `${share} بعد ${term.offsetDays} يوم من تاريخ الفاتورة`,
    );
  }
  return share;
}

