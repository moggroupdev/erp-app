import type { MpoPaymentEvent } from "@/lib/constants/enums/mpo-payment-events";
import { MPO_PAYMENT_EVENTS, paymentEventNeedsOffset } from "@/lib/constants/enums/mpo-payment-events";
import type { MpoPaymentValueKind } from "@/lib/constants/enums/mpo-payment-value-kinds";
import { MPO_PAYMENT_VALUE_KINDS } from "@/lib/constants/enums/mpo-payment-value-kinds";
import type { CreateMaterialPurchaseOrderPaymentTermDto } from "@/types/material-purchase-order";

export type PaymentTermDraft = {
  key: string;
  event: MpoPaymentEvent | null;
  offsetDays: number | "";
  valueKind: MpoPaymentValueKind | null;
  value: number | "";
};

const MONEY_SCALE = 1_000_000;

function toScaledAmount(amount: number) {
  return Math.round(amount * MONEY_SCALE);
}

export function createPaymentTermDraft(): PaymentTermDraft {
  return {
    key: `mpo-term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event: null,
    offsetDays: "",
    valueKind: null,
    value: "",
  };
}

export function getPaymentCoverage(terms: PaymentTermDraft[], totalAmount: number) {
  let covered = 0;
  let pricedCount = 0;
  let hasRemainder = false;

  for (const term of terms) {
    if (term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER) {
      hasRemainder = true;
      continue;
    }
    if (typeof term.value !== "number" || term.value <= 0) continue;
    pricedCount += 1;
    if (term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE) covered += (totalAmount * term.value) / 100;
    else if (term.valueKind === MPO_PAYMENT_VALUE_KINDS.FIXED_AMOUNT) covered += term.value;
  }

  const coveredScaled = toScaledAmount(covered);
  const totalScaled = toScaledAmount(totalAmount);
  const valid = hasRemainder ? pricedCount > 0 && coveredScaled < totalScaled : coveredScaled === totalScaled && terms.length > 0;

  return {
    covered,
    remainder: hasRemainder ? totalAmount - covered : null,
    valid,
  };
}

type Translate = (en: string, ar: string) => string;

export type PaymentTermsError = {
  message: string;
  termKeys: string[];
};

function paymentTermsError(message: string, termKeys: string[] = []): PaymentTermsError {
  return { message, termKeys };
}

export function validatePaymentTerms(
  terms: PaymentTermDraft[],
  totalAmount: number,
  translate: Translate,
): PaymentTermsError | null {
  if (terms.length === 0) {
    return paymentTermsError(translate("Add at least one payment term.", "أضف شرط سداد واحد على الأقل."));
  }

  const seenDeferred = new Set<string>();
  let advanceCount = 0;
  let onReceiptCount = 0;
  let remainderCount = 0;
  let pricedCount = 0;

  for (let index = 0; index < terms.length; index++) {
    const term = terms[index];
    const rowLabel = translate(`Payment ${index + 1}`, `الدفعة ${index + 1}`);

    if (!term.event) {
      return paymentTermsError(
        translate(`${rowLabel}: choose when this slice is paid.`, `${rowLabel}: اختر موعد السداد.`),
        [term.key],
      );
    }
    if (!term.valueKind) {
      return paymentTermsError(
        translate(`${rowLabel}: choose how this slice is valued.`, `${rowLabel}: اختر نوع قيمة الدفعة.`),
        [term.key],
      );
    }

    if (term.event === MPO_PAYMENT_EVENTS.ADVANCE) advanceCount += 1;
    if (term.event === MPO_PAYMENT_EVENTS.ON_RECEIPT) onReceiptCount += 1;
    if (advanceCount > 1) {
      return paymentTermsError(
        translate("An order can have only one advance payment.", "لا يمكن أن يحتوي الأمر على أكثر من دفعة مقدمة."),
        [term.key],
      );
    }
    if (onReceiptCount > 1) {
      return paymentTermsError(
        translate("An order can have only one on-receipt payment.", "لا يمكن أن يحتوي الأمر على أكثر من دفعة عند الاستلام."),
        [term.key],
      );
    }

    if (paymentEventNeedsOffset(term.event)) {
      if (term.offsetDays === "" || !Number.isInteger(term.offsetDays) || term.offsetDays <= 0) {
        return paymentTermsError(
          translate(`${rowLabel}: enter a positive number of days.`, `${rowLabel}: أدخل عدداً موجباً من الأيام.`),
          [term.key],
        );
      }
      const key = `${term.event}:${term.offsetDays}`;
      if (seenDeferred.has(key)) {
        return paymentTermsError(
          translate(
            "Two payments cannot share the same event and day count.",
            "لا يمكن أن تشترك دفعتان في نفس الحدث وعدد الأيام.",
          ),
          [term.key],
        );
      }
      seenDeferred.add(key);
    }

    if (term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER) {
      remainderCount += 1;
      if (remainderCount > 1) {
        return paymentTermsError(
          translate("An order can have only one remainder payment.", "لا يمكن أن يحتوي الأمر على أكثر من دفعة للباقي."),
          [term.key],
        );
      }
      continue;
    }

    if (term.value === "" || term.value <= 0) {
      return paymentTermsError(
        translate(`${rowLabel}: enter an amount greater than zero.`, `${rowLabel}: أدخل قيمة أكبر من صفر.`),
        [term.key],
      );
    }
    if (term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE && term.value > 100) {
      return paymentTermsError(
        translate(`${rowLabel}: a percentage cannot exceed 100.`, `${rowLabel}: النسبة لا يمكن أن تتجاوز 100.`),
        [term.key],
      );
    }
    pricedCount += 1;
  }

  const coverage = getPaymentCoverage(terms, totalAmount);
  if (coverage.valid) return null;

  const remainderKey = terms.find((term) => term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER)?.key;
  if (remainderCount === 1 && pricedCount === 0) {
    return paymentTermsError(
      translate(
        "A payment schedule cannot be only a remainder. Add the other slices first.",
        "لا يمكن أن تكون شروط السداد باقياً فقط. أضف الدفعات الأخرى أولاً.",
      ),
      remainderKey ? [remainderKey] : [],
    );
  }
  if (remainderCount === 1) {
    return paymentTermsError(
      translate(
        "The remainder must be a positive leftover. Fixed amounts and percentages already cover the grand total.",
        "يجب أن يكون الباقي مبلغاً متبقياً موجباً. المبالغ الثابتة والنسب تغطي الإجمالي الكلي بالفعل.",
      ),
      remainderKey ? [remainderKey] : [],
    );
  }
  return paymentTermsError(
    translate(
      "Payment terms must cover 100% of the grand total, including VAT.",
      "يجب أن تغطي شروط السداد 100٪ من الإجمالي الكلي شاملاً ضريبة القيمة المضافة.",
    ),
    terms.map((term) => term.key),
  );
}

export function toPaymentTermDtos(terms: PaymentTermDraft[]): CreateMaterialPurchaseOrderPaymentTermDto[] {
  return terms.map((term) => ({
    event: term.event!,
    offsetDays: paymentEventNeedsOffset(term.event) ? Number(term.offsetDays) : null,
    valueKind: term.valueKind!,
    value: term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER ? null : Number(term.value),
  }));
}
