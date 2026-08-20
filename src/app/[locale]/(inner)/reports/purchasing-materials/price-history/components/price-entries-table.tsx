"use client";

import Link from "next/link";
import { Table2 } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsPriceHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function PriceEntriesTable({ data }: { data: PurchasingMaterialsPriceHistoryEntry[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;

  if (data.length === 0) return null;

  return (
    <ReportCard
      title={translate("Purchase History", "سجل المشتريات")}
      description={translate(
        "Individual purchase order lines for this material.",
        "بنود أوامر الشراء الفردية لهذه المادة.",
      )}
      icon={Table2}
      accent="slate"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-500">
              <th className="px-3 py-2 text-start font-medium">{translate("Code", "الكود")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Date", "التاريخ")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Supplier", "المورد")}</th>
              <th className="px-3 py-2 text-end font-medium">{translate("Qty", "الكمية")}</th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Unit Price", "سعر الوحدة")} ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.orderId}-${row.orderDate}`} className="border-b border-stone-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={getLocalizedHref(`/procurement/material-orders/${row.orderId}`)}
                      className="font-mono font-medium text-stone-800 hover:underline"
                    >
                      {row.orderCode}
                    </Link>
                    <CopyButton text={row.orderCode} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-stone-600">
                  {new Date(row.orderDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                    className="text-stone-600 hover:underline"
                  >
                    {row.supplierName}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-end text-stone-700">{row.quantityOrdered.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-end font-medium text-stone-800">{formatMoney(row.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
