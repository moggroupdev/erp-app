"use client";

import { FileText, Percent, ReceiptText, ShoppingCart, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { AccountingSupplierInvoicesOverview } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function OverviewStats({ overview }: { overview: AccountingSupplierInvoicesOverview }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;
  const pdfCoverage =
    overview.invoiceCount > 0 ? Math.round((overview.withPdfCount / overview.invoiceCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={translate("Invoice Count", "عدد الفواتير")}
        value={overview.invoiceCount}
        hint={translate("Invoices in the selected range", "الفواتير في النطاق المحدد")}
        icon={<FileText size={20} />}
      />
      <KpiCard
        label={translate("Total Purchases", "إجمالي المشتريات")}
        value={formatMoney(overview.totalPurchases, currency)}
        hint={translate("Sum of invoice total purchases", "مجموع إجمالي مشتريات الفواتير")}
        icon={<ShoppingCart size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate("Total Discount", "إجمالي الخصم")}
        value={formatMoney(overview.totalDiscount, currency)}
        hint={translate("Sum of invoice discounts", "مجموع خصومات الفواتير")}
        icon={<Percent size={20} />}
      />
      <KpiCard
        label={translate("VAT Amount", "ضريبة القيمة المضافة")}
        value={formatMoney(overview.vatAmount, currency)}
        hint={translate("Sum of VAT amounts", "مجموع مبالغ ضريبة القيمة المضافة")}
        icon={<ReceiptText size={20} />}
      />
      <KpiCard
        label={translate("Withholding Tax", "ضريبة الاستقطاع")}
        value={formatMoney(overview.withholdingTaxAmount, currency)}
        hint={translate("Sum of withholding tax amounts", "مجموع مبالغ ضريبة الاستقطاع")}
        icon={<Percent size={20} />}
      />
      <KpiCard
        label={translate("Invoice Total", "إجمالي الفاتورة")}
        value={formatMoney(overview.totalAmount, currency)}
        hint={
          overview.missingTotalCount > 0
            ? translate(
                `${overview.missingTotalCount} invoice(s) missing total`,
                `${overview.missingTotalCount} فاتورة بدون إجمالي`,
              )
            : translate("Sum of invoice totals", "مجموع إجماليات الفواتير")
        }
        icon={<ReceiptText size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate("Average Invoice Total", "متوسط إجمالي الفاتورة")}
        value={formatMoney(overview.avgTotalAmount, currency)}
        hint={translate("Invoice total divided by invoice count", "إجمالي الفاتورة مقسوماً على عدد الفواتير")}
        icon={<TrendingUp size={20} />}
      />
      <KpiCard
        label={translate("PDF Coverage", "تغطية ملفات PDF")}
        value={`${overview.withPdfCount}/${overview.invoiceCount} (${pdfCoverage}%)`}
        hint={translate("Invoices that have an uploaded PDF", "الفواتير التي لديها ملف PDF مرفوع")}
        icon={<FileText size={20} />}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  valueClassName = reportTheme.kpi.neutral,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
      <div className="absolute -end-3 -top-3 opacity-[0.07]">{icon}</div>
      <div className="relative flex flex-col gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
          {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
