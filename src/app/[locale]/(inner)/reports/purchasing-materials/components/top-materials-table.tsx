"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsByMaterial } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopMaterialsTable({ data }: { data: PurchasingMaterialsByMaterial[] }) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;

  if (data.length === 0) {
    return (
      <ReportCard
        title={translate("Top Materials by Spend", "أعلى المواد إنفاقاً")}
        icon={Boxes}
        accent="sky"
      >
        <p className="py-10 text-center text-sm text-stone-500">
          {translate("No data available", "لا توجد بيانات")}
        </p>
      </ReportCard>
    );
  }

  return (
    <ReportCard
      title={translate("Top Materials by Spend", "أعلى المواد إنفاقاً")}
      description={translate(
        "Materials ranked by total purchase cost (quantity x unit price).",
        "المواد مرتبة حسب إجمالي تكلفة الشراء (الكمية x سعر الوحدة).",
      )}
      icon={Boxes}
      accent="sky"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-500">
              <th className="px-3 py-2 text-start font-medium">#</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Material", "المادة")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Code", "الكود")}</th>
              <th className="px-3 py-2 text-end font-medium">{translate("Qty Ordered", "الكمية المطلوبة")}</th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Total Spend", "إجمالي الإنفاق")} ({currency})
              </th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Avg Unit Price", "متوسط سعر الوحدة")} ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.materialCode} className="border-b border-stone-50">
                <td className="px-3 py-2.5 text-stone-400">{index + 1}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={getLocalizedHref(`/warehouse/materials/${row.materialCode}`)}
                    className="font-medium text-stone-800 hover:underline"
                    title={row.materialTitle}
                  >
                    {row.materialTitle}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-stone-500">{row.materialCode}</span>
                    <CopyButton text={row.materialCode} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-end text-stone-700">
                  {row.totalQuantity.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-end font-medium text-stone-800">{formatMoney(row.totalSpend)}</td>
                <td className="px-3 py-2.5 text-end text-stone-600">{formatMoney(row.avgUnitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
