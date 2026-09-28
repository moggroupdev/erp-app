"use client";

import { ActionIcon, Button, NumberInput } from "@mantine/core";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import {
  MPO_PAYMENT_VALUE_KIND_LABELS_LIST,
  MPO_PAYMENT_VALUE_KINDS,
  type MpoPaymentValueKind,
} from "@/lib/constants/enums/mpo-payment-value-kinds";
import { MPO_PAYMENT_EVENTS, paymentEventNeedsOffset, type MpoPaymentEvent } from "@/lib/constants/enums/mpo-payment-events";
import SelectMpoPaymentEvent from "@/components/global/selections/enum-based/select-mpo-payment-event";
import SelectMpoPaymentValueKind from "@/components/global/selections/enum-based/select-mpo-payment-value-kind";
import { createPaymentTermDraft, getPaymentCoverage, type PaymentTermDraft } from "./payment-terms";

type PaymentTermsEditorProps = {
  terms: PaymentTermDraft[];
  onChange: (terms: PaymentTermDraft[]) => void;
  totalAmount: number;
  currency: string;
};

const MONEY_SCALE = 1_000_000;

function toScaledAmount(amount: number) {
  return Math.round(amount * MONEY_SCALE);
}

function CoverageFigure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "teal" | "amber" | "red";
}) {
  const toneClass = {
    neutral: "border-gray-200 bg-white text-gray-950",
    teal: "border-teal-200 bg-teal-50 text-teal-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-800",
  }[tone];

  return (
    <div className={`min-w-38 flex-1 rounded-xl px-3 py-2.5 ${toneClass}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function PaymentTermsEditor({ terms, onChange, totalAmount, currency }: PaymentTermsEditorProps) {
  const { translate } = useI18n();
  const scheduleReady = totalAmount > 0;
  const coverage = getPaymentCoverage(terms, totalAmount);
  const remainderUsed = terms.some((term) => term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER);
  const coveredScaled = toScaledAmount(coverage.covered);
  const totalScaled = toScaledAmount(totalAmount);
  const gapScaled = totalScaled - coveredScaled;
  const remainingAmount = gapScaled / MONEY_SCALE;
  const hasRemaining = gapScaled > 0;
  const hasExcess = gapScaled < 0;
  const overAllocated = coverage.remainder == null && coveredScaled > totalScaled;
  const remainderExhausted = coverage.remainder != null && toScaledAmount(coverage.remainder) <= 0;
  const coverageProblem = overAllocated || remainderExhausted;
  const coveragePercent = coverage.valid
    ? 100
    : totalAmount <= 0
      ? 0
      : Math.min((coverage.covered / totalAmount) * 100, 100);
  const percentLabel = coverage.valid ? "100%" : `${Math.round(coveragePercent * 10) / 10}%`;
  const statusTone = coverage.valid ? "text-teal-800" : coverageProblem ? "text-red-700" : "text-amber-800";

  function updateTerm(key: string, patch: Partial<PaymentTermDraft>) {
    onChange(terms.map((term) => (term.key === key ? { ...term, ...patch } : term)));
  }

  function removeTerm(key: string) {
    onChange(terms.filter((term) => term.key !== key));
  }

  function addTerm() {
    if (!scheduleReady) return;
    onChange([...terms, createPaymentTermDraft()]);
  }

  const coverageStatus = coverage.valid
    ? hasRemaining
      ? translate("The remainder row takes the leftover amount.", "صف الباقي يأخذ المبلغ المتبقي.")
      : translate("The schedule covers the full order.", "الجدول يغطي الأمر بالكامل.")
    : hasExcess
      ? translate("These payments are above the order total.", "هذه الدفعات أعلى من إجمالي الأمر.")
      : hasRemaining
        ? translate(
            "Schedule the remaining amount to reach the order total.",
            "جدول المبلغ المتبقي للوصول إلى إجمالي الأمر.",
          )
        : translate("Add rows until the schedule reaches the order total.", "أضف صفوفاً حتى يصل الجدول إلى إجمالي الأمر.");

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-teal-800 text-white">
          <Wallet size={18} />
        </span>
        <div>
          <h4 className="text-base font-semibold text-gray-950">{translate("Payment terms", "شروط السداد")}</h4>
          <p className="text-sm text-gray-500">
            {translate(
              "One row per slice. The rows together must cover the order.",
              "صف لكل دفعة. مجموع الصفوف يجب أن يغطي الأمر.",
            )}
          </p>
        </div>
      </div>

      {!scheduleReady ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-800/15 text-teal-900">
            <Wallet size={26} strokeWidth={1.75} />
          </div>
          <div className="flex max-w-md flex-col gap-1.5">
            <h5 className="text-base font-semibold text-gray-900">
              {translate("Waiting for the order total", "بانتظار إجمالي الأمر")}
            </h5>
            <p className="text-sm leading-relaxed text-gray-500">
              {translate(
                "Payment terms open once you add material items and enter their unit prices.",
                "تُفتح شروط السداد بعد إضافة البنود وإدخال أسعار الوحدة.",
              )}
            </p>
          </div>
        </div>
      ) : terms.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">
          {translate("No payments yet. Add the first slice below.", "لا توجد دفعات بعد. أضف الدفعة الأولى بالأسفل.")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-start text-xs font-medium text-gray-500">
                <th className="w-10 px-3 py-2 text-start font-medium">#</th>
                <th className="px-3 py-2 text-start font-medium">{translate("When", "الموعد")}</th>
                <th className="w-28 px-3 py-2 text-start font-medium">{translate("Days", "الأيام")}</th>
                <th className="w-52 px-3 py-2 text-start font-medium">{translate("Value type", "نوع القيمة")}</th>
                <th className="w-44 px-3 py-2 text-start font-medium">{translate("Amount", "المبلغ")}</th>
                <th className="w-12 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {terms.map((term, index) => {
                const showDays = paymentEventNeedsOffset(term.event);
                const showValue =
                  term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE ||
                  term.valueKind === MPO_PAYMENT_VALUE_KINDS.FIXED_AMOUNT;
                const showRemainder = term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER;
                const valueLabels =
                  remainderUsed && term.valueKind !== MPO_PAYMENT_VALUE_KINDS.REMAINDER
                    ? MPO_PAYMENT_VALUE_KIND_LABELS_LIST.filter((item) => item.value !== MPO_PAYMENT_VALUE_KINDS.REMAINDER)
                    : undefined;

                return (
                  <tr key={term.key} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-3 py-2 text-sm text-gray-400 tabular-nums">{index + 1}</td>
                    <td className="px-3 py-2">
                      <SelectMpoPaymentEvent
                        value={term.event}
                        setValue={(value) => {
                          const next = (typeof value === "function" ? value(term.event) : value) as MpoPaymentEvent | null;
                          updateTerm(term.key, {
                            event: next,
                            offsetDays: paymentEventNeedsOffset(next) ? term.offsetDays : "",
                          });
                        }}
                        placeholder={translate("Advance, on receipt, or after a delay", "مقدمة أو عند الاستلام أو بعد مدة")}
                        aria-label={translate(`When payment ${index + 1} is paid`, `موعد الدفعة ${index + 1}`)}
                        size="sm"
                        radius="md"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {showDays ? (
                        <NumberInput
                          value={term.offsetDays}
                          onChange={(value) => updateTerm(term.key, { offsetDays: value === "" ? "" : Number(value) })}
                          placeholder={translate("30", "٣٠")}
                          aria-label={
                            term.event === MPO_PAYMENT_EVENTS.AFTER_RECEIPT
                              ? translate("Days from receipt", "أيام من الاستلام")
                              : translate("Days from the invoice date", "أيام من تاريخ الفاتورة")
                          }
                          min={1}
                          allowDecimal={false}
                          allowNegative={false}
                          hideControls
                          required
                          size="sm"
                          radius="md"
                        />
                      ) : (
                        <span className="px-1 text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <SelectMpoPaymentValueKind
                        value={term.valueKind}
                        setValue={(value) => {
                          const next = (
                            typeof value === "function" ? value(term.valueKind) : value
                          ) as MpoPaymentValueKind | null;
                          updateTerm(term.key, {
                            valueKind: next,
                            value: next === MPO_PAYMENT_VALUE_KINDS.REMAINDER ? "" : term.value,
                          });
                        }}
                        labelsList={valueLabels}
                        placeholder={translate("Percentage, amount, or remainder", "نسبة أو مبلغ أو الباقي")}
                        aria-label={translate(`Value type for payment ${index + 1}`, `نوع قيمة الدفعة ${index + 1}`)}
                        size="sm"
                        radius="md"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {showValue ? (
                        <div className="flex items-center gap-2">
                          <NumberInput
                            value={term.value}
                            onChange={(value) => updateTerm(term.key, { value: value === "" ? "" : Number(value) })}
                            placeholder={term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE ? "25" : "10000"}
                            aria-label={
                              term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE
                                ? translate("Percentage", "النسبة")
                                : translate("Amount", "المبلغ")
                            }
                            min={0}
                            max={term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE ? 100 : undefined}
                            allowNegative={false}
                            decimalScale={6}
                            hideControls
                            required
                            size="sm"
                            radius="md"
                            className="min-w-0 flex-1"
                          />
                          <span className="shrink-0 text-xs font-medium text-gray-400">
                            {term.valueKind === MPO_PAYMENT_VALUE_KINDS.PERCENTAGE ? "%" : currency}
                          </span>
                        </div>
                      ) : showRemainder ? (
                        <span className="text-sm font-semibold text-teal-900 tabular-nums">
                          {formatMoney(coverage.remainder ?? 0, currency)}
                        </span>
                      ) : (
                        <span className="px-1 text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <ActionIcon
                        type="button"
                        variant="subtle"
                        color="red"
                        radius="md"
                        onClick={() => removeTerm(term.key)}
                        aria-label={translate("Remove payment", "حذف الدفعة")}
                      >
                        <Trash2 size={15} />
                      </ActionIcon>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {scheduleReady && (
        <>
          <div className="border-t border-gray-200 px-4 py-3">
            <Button type="button" color="teal" radius="xl" size="sm" leftSection={<Plus size={14} />} onClick={addTerm}>
              {translate("Add payment", "إضافة دفعة")}
            </Button>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-stretch gap-2">
                <CoverageFigure
                  label={translate("Covered", "المغطى")}
                  value={formatMoney(coverage.covered, currency)}
                  tone={coverage.valid ? "teal" : "neutral"}
                />
                {hasRemaining && (
                  <CoverageFigure
                    label={translate("Remaining", "المتبقي")}
                    value={formatMoney(remainingAmount, currency)}
                    tone="neutral"
                  />
                )}
                {hasExcess && (
                  <CoverageFigure
                    label={translate("Over by", "الزيادة")}
                    value={formatMoney(Math.abs(remainingAmount), currency)}
                    tone="red"
                  />
                )}
                <CoverageFigure
                  label={translate("Order total", "إجمالي الأمر")}
                  value={formatMoney(totalAmount, currency)}
                  tone="neutral"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${coverage.valid ? "bg-teal-700" : coverageProblem ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${statusTone}`}>{percentLabel}</span>
              </div>
              <p className={`text-sm ${statusTone}`}>{coverageStatus}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
