"use client";

import { Alert } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";

type TotalsSummaryProps = {
  itemsTotal: number;
  invoicePurchases: number | null;
};

function hasMismatch(invoicePurchases: number, itemsTotal: number) {
  return (
    Math.abs(invoicePurchases - itemsTotal) >=
    Math.max(Math.abs(invoicePurchases), Math.abs(itemsTotal)) * 0.01
  );
}

export default function TotalsSummary({ itemsTotal, invoicePurchases }: TotalsSummaryProps) {
  const { translate, translation } = useI18n();
  const mismatch = invoicePurchases != null && hasMismatch(invoicePurchases, itemsTotal);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
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
            "Invoice purchases and items total differ by 1% or more. You can still submit.",
            "إجمالي مشتريات الفاتورة وإجمالي الأصناف يختلفان بنسبة 1% أو أكثر. ما زال بإمكانك الإرسال.",
          )}
        </Alert>
      )}
    </div>
  );
}
