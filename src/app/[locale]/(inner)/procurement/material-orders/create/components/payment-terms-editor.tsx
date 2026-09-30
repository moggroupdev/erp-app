"use client";

import { ActionIcon, Button, NumberInput, Table } from "@mantine/core";
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
  invalidTermKeys: string[];
};

const MONEY_SCALE = 1_000_000;

/** Preferred and minimum widths for the payment-terms table. Columns stay at least `minWidth` wide and the table scrolls on small screens. */
const PAYMENT_TERM_COLUMN_WIDTHS = {
  index: { width: "3rem", minWidth: undefined },
  when: { width: undefined, minWidth: undefined },
  days: { width: "12rem", minWidth: undefined },
  valueType: { width: "12rem", minWidth: undefined },
  amount: { width: "12rem", minWidth: undefined },
  remove: { width: "3rem", minWidth: undefined },
} as const;

const borderlessField = {
  variant: "unstyled" as const,
  radius: 0,
  size: "sm" as const,
  classNames: { input: "border-0! bg-transparent! shadow-none" },
  styles: {
    input: {
      minHeight: 32,
      height: 32,
      minWidth: 0,
      paddingInline: 0,
    },
  },
};

function toScaledAmount(amount: number) {
  return Math.round(amount * MONEY_SCALE);
}

export default function PaymentTermsEditor({
  terms,
  onChange,
  totalAmount,
  currency,
  invalidTermKeys,
}: PaymentTermsEditorProps) {
  const { translate } = useI18n();
  const scheduleReady = totalAmount > 0;
  const coverage = getPaymentCoverage(terms, totalAmount);
  const remainderUsed = terms.some((term) => term.valueKind === MPO_PAYMENT_VALUE_KINDS.REMAINDER);
  const remainderAmount = coverage.remainder ?? 0;
  const coveredAmount = remainderAmount > 0 ? coverage.covered + remainderAmount : coverage.covered;
  const coveredScaled = toScaledAmount(coveredAmount);
  const totalScaled = toScaledAmount(totalAmount);
  const gapScaled = totalScaled - coveredScaled;
  const remainingAmount = gapScaled / MONEY_SCALE;
  const hasRemaining = gapScaled > 0;
  const hasExcess = gapScaled < 0;

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
              "One row per slice. The rows together must cover the grand total, including VAT.",
              "صف لكل دفعة. مجموع الصفوف يجب أن يغطي الإجمالي الكلي شاملاً الضريبة.",
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
              {translate("Waiting for the grand total", "بانتظار الإجمالي الكلي")}
            </h5>
            <p className="text-sm leading-[1.75] text-gray-500">
              {translate(
                `Payment terms open once you add material items and enter their unit prices.`,
                `تُفتح شروط السداد بعد إضافة البنود وإدخال أسعار الوحدة.`,
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table withColumnBorders className="w-full min-w-max" horizontalSpacing="xs" verticalSpacing="xs">
            <colgroup>
              {Object.entries(PAYMENT_TERM_COLUMN_WIDTHS).map(([column, size]) => (
                <col key={column} style={{ width: size.width, minWidth: size.minWidth }} />
              ))}
            </colgroup>
            <Table.Thead className="bg-gray-50 whitespace-nowrap">
              <Table.Tr className="h-9">
                <Table.Th
                  className="text-center! text-xs font-medium text-gray-500"
                  style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.index.minWidth }}
                >
                  #
                </Table.Th>
                <Table.Th
                  className="text-xs font-medium text-gray-500"
                  style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.when.minWidth }}
                >
                  {translate("When", "الموعد")}
                </Table.Th>
                <Table.Th
                  className="text-xs font-medium text-gray-500"
                  style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.days.minWidth }}
                >
                  {translate("Days", "الأيام")}
                </Table.Th>
                <Table.Th
                  className="text-xs font-medium text-gray-500"
                  style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.valueType.minWidth }}
                >
                  {translate("Value type", "نوع القيمة")}
                </Table.Th>
                <Table.Th
                  className="text-xs font-medium text-gray-500"
                  style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.amount.minWidth }}
                >
                  {translate("Amount", "المبلغ")}
                </Table.Th>
                <Table.Th style={{ minWidth: PAYMENT_TERM_COLUMN_WIDTHS.remove.minWidth }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {terms.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    {translate(
                      "No payments yet. Add the first slice below.",
                      "لا توجد دفعات بعد. أضف الدفعة الأولى بالأسفل.",
                    )}
                  </Table.Td>
                </Table.Tr>
              ) : null}
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

                const invalid = invalidTermKeys.includes(term.key);

                return (
                  <Table.Tr key={term.key} className={invalid ? "bg-red-50 [&>td]:bg-red-50" : undefined}>
                    <Table.Td className="text-center text-sm text-gray-400 tabular-nums">{index + 1}</Table.Td>
                    <Table.Td>
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
                        {...borderlessField}
                      />
                    </Table.Td>
                    <Table.Td>
                      {showDays ? (
                        <NumberInput
                          value={term.offsetDays}
                          onChange={(value) => updateTerm(term.key, { offsetDays: value === "" ? "" : Number(value) })}
                          placeholder={translate("Number of days", "عدد الأيام")}
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
                          {...borderlessField}
                        />
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </Table.Td>
                    <Table.Td>
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
                        {...borderlessField}
                      />
                    </Table.Td>
                    <Table.Td>
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
                            {...borderlessField}
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
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </Table.Td>
                    <Table.Td className="text-center">
                      <ActionIcon
                        type="button"
                        variant="subtle"
                        color="red"
                        radius="md"
                        onClick={() => removeTerm(term.key)}
                        aria-label={translate("Remove payment", "حذف الدفعة")}
                      >
                        <Trash2 size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              <Table.Tr>
                <Table.Td />
                <Table.Td className="border-t border-gray-200">
                  <Button
                    type="button"
                    color="teal"
                    radius="xl"
                    size="sm"
                    leftSection={<Plus size={14} />}
                    onClick={addTerm}
                  >
                    {translate("Add payment", "إضافة دفعة")}
                  </Button>
                </Table.Td>
                <Table.Td />
                <Table.Td />
                <Table.Td />
                <Table.Td />
              </Table.Tr>
            </Table.Tbody>
            <Table.Tfoot className="border-t border-gray-200 bg-gray-50">
              <Table.Tr className="h-9">
                <Table.Td />
                <Table.Td colSpan={3} className="text-sm text-gray-600">
                  {translate("Covered", "المغطى")}
                </Table.Td>
                <Table.Td>
                  <span className={`text-sm font-medium tabular-nums ${coverage.valid ? "text-teal-800" : "text-gray-800"}`}>
                    {formatMoney(coveredAmount, currency)}
                  </span>
                </Table.Td>
                <Table.Td />
              </Table.Tr>
              {hasRemaining && (
                <Table.Tr className="h-9">
                  <Table.Td />
                  <Table.Td colSpan={3} className="text-sm text-gray-600">
                    {translate("Remaining", "المتبقي")}
                  </Table.Td>
                  <Table.Td>
                    <span className="text-sm font-medium text-amber-800 tabular-nums">
                      {formatMoney(remainingAmount, currency)}
                    </span>
                  </Table.Td>
                  <Table.Td />
                </Table.Tr>
              )}
              {hasExcess && (
                <Table.Tr className="h-9">
                  <Table.Td />
                  <Table.Td colSpan={3} className="text-sm text-gray-600">
                    {translate("Over by", "الزيادة")}
                  </Table.Td>
                  <Table.Td>
                    <span className="text-sm font-medium text-red-700 tabular-nums">
                      {formatMoney(Math.abs(remainingAmount), currency)}
                    </span>
                  </Table.Td>
                  <Table.Td />
                </Table.Tr>
              )}
              <Table.Tr className="h-9">
                <Table.Td />
                <Table.Td colSpan={3} className="text-sm font-semibold text-gray-950">
                  {translate("Grand total", "الإجمالي الكلي")}
                </Table.Td>
                <Table.Td>
                  <span className="text-sm font-semibold text-gray-950 tabular-nums">
                    {formatMoney(totalAmount, currency)}
                  </span>
                </Table.Td>
                <Table.Td />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </section>
  );
}
