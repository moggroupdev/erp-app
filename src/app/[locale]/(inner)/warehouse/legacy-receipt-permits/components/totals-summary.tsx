"use client";

import { Alert } from "@mantine/core";
import { AlertCircle, Calculator } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";

type TotalsSummaryProps = {
  itemsTotal: number;
  invoicePurchases: number | null;
};

export function hasTotalsMismatch(invoicePurchases: number, itemsTotal: number) {
  return (
    Math.abs(invoicePurchases - itemsTotal) >=
    Math.max(Math.abs(invoicePurchases), Math.abs(itemsTotal)) * 0.01
  );
}

export default function TotalsSummary({ itemsTotal, invoicePurchases }: TotalsSummaryProps) {
  const { translate, translation } = useI18n();
  const mismatch = invoicePurchases != null && hasTotalsMismatch(invoicePurchases, itemsTotal);

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-haze-600 text-white">
          <Calculator size={18} />
        </span>
        <div>
          <h4 className="text-base font-semibold text-gray-950">
            {translate("Totals check", "مراجعة الإجماليات")}
          </h4>
          <p className="text-sm text-gray-500">
            {translate(
              "Compare items total with invoice purchases total.",
              "قارن إجمالي الأصناف بإجمالي مشتريات الفاتورة.",
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-600">
            {translate(
              `Items total (${translation.currency})`,
              `إجمالي الأصناف (${translation.currency})`,
            )}
          </span>
          <span className={`font-semibold ${mismatch ? "text-ochre-600" : "text-gray-900"}`}>
            {formatMoney(itemsTotal)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-600">
            {translate(
              `Invoice purchases (${translation.currency})`,
              `إجمالي مشتريات الفاتورة (${translation.currency})`,
            )}
          </span>
          <span className={`font-semibold ${mismatch ? "text-ochre-600" : "text-gray-900"}`}>
            {invoicePurchases != null ? formatMoney(invoicePurchases) : <span className="text-gray-400">-</span>}
          </span>
        </div>

        {mismatch && (
          <Alert color="ochre" radius="md" icon={<AlertCircle size={15} />}>
            {translate(
              "Invoice purchases and items total differ by 1% or more. Saving will require an extra confirmation step because this entry cannot be changed later.",
              "إجمالي مشتريات الفاتورة وإجمالي الأصناف يختلفان بنسبة 1% أو أكثر. سيتطلب الحفظ خطوة تأكيد إضافية لأن هذا الإدخال لا يمكن تغييره لاحقًا.",
            )}
          </Alert>
        )}
      </div>
    </section>
  );
}
