"use client";

import { AlertTriangle, Calculator, FileDiff, FileWarning, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsTotalAmountMismatchOverview } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function MismatchesOverview({ overview }: { overview: PurchasingMaterialsTotalAmountMismatchOverview }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label={translate("Invoices with Discrepancies", "عدد الفواتير ذات الفروقات")}
        value={overview.mismatchCount}
        hint={translate(
          "Orders where the relative difference is at least 1%.",
          "أوامر يكون فيها الفرق النسبي 1% على الأقل.",
        )}
        icon={<AlertTriangle size={20} />}
        valueClassName={overview.mismatchCount > 0 ? "text-orange-700" : reportTheme.kpi.neutral}
      />
      <KpiCard
        label={translate("Completed Without Invoice Total", "مكتملة بدون إجمالي فاتورة")}
        value={overview.missingInvoiceTotalCount}
        hint={translate(
          "Completed orders with no invoice total purchases value.",
          "أوامر مكتملة بدون قيمة إجمالي مشتريات الفاتورة.",
        )}
        icon={<FileWarning size={20} />}
        valueClassName={overview.missingInvoiceTotalCount > 0 ? "text-rose-700" : reportTheme.kpi.neutral}
      />
      <KpiCard
        label={translate(`Calculated Total (${currency})`, `الإجمالي المحسوب (${currency})`)}
        value={formatMoney(overview.totalCalculatedAmount, currency)}
        hint={translate("Sum of mismatched order line totals.", "مجموع إجماليات بنود الأوامر ذات الفروقات.")}
        icon={<Calculator size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate(`Invoice Total Purchases (${currency})`, `إجمالي مشتريات الفاتورة (${currency})`)}
        value={formatMoney(overview.totalLegacyInvoicePurchases, currency)}
        hint={translate("Sum of legacy invoice totals for mismatches.", "مجموع إجماليات الفواتير للأوامر ذات الفروقات.")}
        icon={<Receipt size={20} />}
      />
      <KpiCard
        label={translate(`Difference (${currency})`, `الفرق (${currency})`)}
        value={formatMoney(overview.totalDifference, currency)}
        hint={translate("Calculated total minus invoice total.", "الإجمالي المحسوب ناقص إجمالي الفاتورة.")}
        icon={<FileDiff size={20} />}
        valueClassName={
          overview.totalDifference === 0
            ? reportTheme.kpi.neutral
            : overview.totalDifference > 0
              ? reportTheme.kpi.positive
              : reportTheme.kpi.negative
        }
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
          {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
