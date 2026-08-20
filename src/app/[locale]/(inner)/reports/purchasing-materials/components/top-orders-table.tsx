"use client";

import Link from "next/link";
import { FileText, CheckCircle, Clock } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsTopOrder } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopOrdersTable({ data }: { data: PurchasingMaterialsTopOrder[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;

  if (data.length === 0) {
    return (
      <ReportCard title={translate("Top Purchase Orders", "أكبر أوامر الشراء")} icon={FileText} accent="amber">
        <p className="py-10 text-center text-sm text-stone-500">
          {translate("No data available", "لا توجد بيانات")}
        </p>
      </ReportCard>
    );
  }

  return (
    <ReportCard
      title={translate("Top Purchase Orders", "أكبر أوامر الشراء")}
      description={translate(
        "Largest non-cancelled purchase orders ranked by total amount.",
        "أكبر أوامر الشراء غير الملغاة مرتبة حسب إجمالي المبلغ.",
      )}
      icon={FileText}
      accent="amber"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-500">
              <th className="px-3 py-2 text-start font-medium">#</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Code", "الكود")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Supplier", "المورد")}</th>
              <th className="px-3 py-2 text-start font-medium">{translate("Date", "التاريخ")}</th>
              <th className="px-3 py-2 text-center font-medium">{translate("Status", "الحالة")}</th>
              <th className="px-3 py-2 text-end font-medium">
                {translate("Amount", "المبلغ")} ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.orderId} className="border-b border-stone-50">
                <td className="px-3 py-2.5 text-stone-400">{index + 1}</td>
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
                <td className="px-3 py-2.5">
                  <Link
                    href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                    className="text-stone-600 hover:underline"
                  >
                    {row.supplierName}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-stone-600">
                  {new Date(row.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {row.completedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle size={12} />
                      {translate("Completed", "مكتمل")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Clock size={12} />
                      {translate("Open", "مفتوح")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-end font-medium text-stone-800">
                  {formatMoney(row.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
