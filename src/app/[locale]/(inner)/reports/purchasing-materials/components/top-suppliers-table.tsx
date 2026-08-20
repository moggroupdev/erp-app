"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsBySupplier } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopSuppliersTable({ data }: { data: PurchasingMaterialsBySupplier[] }) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;

  if (data.length === 0) {
    return (
      <ReportCard
        title={translate("Top Suppliers by Spend", "أعلى الموردين إنفاقاً")}
        icon={Truck}
        accent="amber"
      >
        <p className="py-10 text-center text-sm text-stone-500">
          {translate("No data available", "لا توجد بيانات")}
        </p>
      </ReportCard>
    );
  }

  return (
    <ReportCard
      title={translate("Top Suppliers by Spend", "أعلى الموردين إنفاقاً")}
      description={translate(
        "Suppliers ranked by total non-cancelled purchase order value.",
        "الموردون مرتبون حسب إجمالي قيمة أوامر الشراء غير الملغاة.",
      )}
      icon={Truck}
      accent="amber"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-500">
              <th className="px-3 py-2 text-start font-medium">#</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Supplier", "المورد")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Code", "الكود")}</th>
              <th className="px-3 py-2 text-end font-medium">{translate("Orders", "الطلبات")}</th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Total Spend", "إجمالي الإنفاق")} ({currency})
              </th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Avg Order", "متوسط الطلب")} ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.supplierId} className="border-b border-stone-50">
                <td className="px-3 py-2.5 text-stone-400">{index + 1}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                    className="font-medium text-stone-800 hover:underline"
                  >
                    {row.supplierName}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-stone-500">{row.supplierCode}</span>
                    <CopyButton text={row.supplierCode} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-end text-stone-700">{row.orderCount}</td>
                <td className="px-3 py-2.5 text-end font-medium text-stone-800">{formatMoney(row.totalSpend)}</td>
                <td className="px-3 py-2.5 text-end text-stone-600">{formatMoney(row.avgOrderValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
