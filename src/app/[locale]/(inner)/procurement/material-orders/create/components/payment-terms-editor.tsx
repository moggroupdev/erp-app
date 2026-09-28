"use client";

import { Button, NumberInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { MPO_PAYMENT_VALUE_KIND_LABELS_LIST, MPO_PAYMENT_VALUE_KINDS, type MpoPaymentValueKind } from "@/lib/constants/enums/mpo-payment-value-kinds";
import { paymentEventNeedsOffset, type MpoPaymentEvent } from "@/lib/constants/enums/mpo-payment-events";
import SelectMpoPaymentEvent from "@/components/global/selections/enum-based/select-mpo-payment-event";
import SelectMpoPaymentValueKind from "@/components/global/selections/enum-based/select-mpo-payment-value-kind";
import { createPaymentTermDraft, getPaymentCoverage, type PaymentTermDraft } from "./payment-terms";

type PaymentTermsEditorProps = {
  terms: PaymentTermDraft[];
  onChange: (terms: PaymentTermDraft[]) => void;
  totalAmount: number;
  currency: string;
};

export default function PaymentTermsEditor({ terms, onChange, totalAmount, currency }: PaymentTermsEditorProps) {
  const { translate } = useI18n();
  const coverage = getPaymentCoverage(terms, totalAmount);
  const remainderUsed = terms.some((term) => term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER);

  function updateTerm(key: string, patch: Partial<PaymentTermDraft>) {
    onChange(terms.map((term) => (term.key === key ? { ...term, ...patch } : term)));
  }

  function removeTerm(key: string) {
    onChange(terms.filter((term) => term.key !== key));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-gray-900">{translate("Payment terms", "شروط السداد")}</h4>
        <Button
          type="button"
          variant="light"
          color="teal"
          radius="md"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => onChange([...terms, createPaymentTermDraft()])}
        >
          {translate("Add payment", "إضافة دفعة")}
        </Button>
      </div>

      {terms.length === 0 ? (
        <p className="rounded-xl bg-teal-800/2.5 px-4 py-6 text-center text-sm text-gray-500">
          {translate("Add the slices that cover 100% of the order.", "أضف الدفعات التي تغطي 100٪ من الأمر.")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {terms.map((term, index) => {
            const showDays = paymentEventNeedsOffset(term.event);
            const showValue = term.valueKind !== MPO_PAYMENT_VALUE_KINDS.REMAINDER;
            const valueLabels =
              remainderUsed && term.valueKind !== MPO_PAYMENT_VALUE_KINDS.REMAINDER
                ? MPO_PAYMENT_VALUE_KIND_LABELS_LIST.filter((item) => item.value !== MPO_PAYMENT_VALUE_KINDS.REMAINDER)
                : undefined;

            return (
              <div key={term.key} className="grid grid-cols-1 items-end gap-3 rounded-xl bg-teal-800/2.5 p-3 md:grid-cols-[1.4fr_0.7fr_1fr_1fr_auto]">
                <SelectMpoPaymentEvent
                  value={term.event}
                  setValue={(value) => {
                    const next = (typeof value === "function" ? value(term.event) : value) as MpoPaymentEvent | null;
                    updateTerm(term.key, {
                      event: next,
                      offsetDays: paymentEventNeedsOffset(next) ? term.offsetDays : "",
                    });
                  }}
                  label={translate(`Payment ${index + 1}`, `الدفعة ${index + 1}`)}
                  placeholder={translate("When it is paid", "موعد السداد")}
                  required
                  radius="md"
                />
                {showDays ? (
                  <NumberInput
                    value={term.offsetDays}
                    onChange={(value) => updateTerm(term.key, { offsetDays: value === "" ? "" : Number(value) })}
                    label={translate("Days", "الأيام")}
                    min={1}
                    allowDecimal={false}
                    allowNegative={false}
                    required
                    radius="md"
                  />
                ) : (
                  <div className="hidden md:block" />
                )}
                <SelectMpoPaymentValueKind
                  value={term.valueKind}
                  setValue={(value) => {
                    const next = (typeof value === "function" ? value(term.valueKind) : value) as MpoPaymentValueKind | null;
                    updateTerm(term.key, {
                      valueKind: next,
                      value: next === MPO_PAYMENT_VALUE_KINDS.REMAINDER ? "" : term.value,
                    });
                  }}
                  labelsList={valueLabels}
                  label={translate("Value", "القيمة")}
                  placeholder={translate("Percentage, amount, or remainder", "نسبة أو مبلغ أو الباقي")}
                  required
                  radius="md"
                />
                {showValue ? (
                  <NumberInput
                    value={term.value}
                    onChange={(value) => updateTerm(term.key, { value: value === "" ? "" : Number(value) })}
                    label={
                      term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE
                        ? translate("Percentage", "النسبة")
                        : translate(`Amount (${currency})`, `المبلغ (${currency})`)
                    }
                    min={0}
                    max={term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE ? 100 : undefined}
                    allowNegative={false}
                    decimalScale={6}
                    hideControls
                    required
                    radius="md"
                  />
                ) : (
                  <div className="hidden md:block" />
                )}
                <Button
                  type="button"
                  variant="subtle"
                  color="red"
                  radius="md"
                  px={8}
                  onClick={() => removeTerm(term.key)}
                  aria-label={translate("Remove payment", "حذف الدفعة")}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className={coverage.valid ? "text-sm text-teal-800" : "text-sm text-amber-800"}>
        {coverage.remainder == null
          ? translate(
              `Covered ${formatMoney(coverage.covered, currency)} of ${formatMoney(totalAmount, currency)}.`,
              `المغطى ${formatMoney(coverage.covered, currency)} من ${formatMoney(totalAmount, currency)}.`,
            )
          : translate(
              `Covered ${formatMoney(coverage.covered, currency)} of ${formatMoney(totalAmount, currency)}. Remainder ${formatMoney(Math.max(coverage.remainder, 0), currency)}.`,
              `المغطى ${formatMoney(coverage.covered, currency)} من ${formatMoney(totalAmount, currency)}. الباقي ${formatMoney(Math.max(coverage.remainder, 0), currency)}.`,
            )}
      </p>
    </section>
  );
}
