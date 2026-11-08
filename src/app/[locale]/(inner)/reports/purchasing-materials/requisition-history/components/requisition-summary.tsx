"use client";

import { CheckCircle2, ClipboardList, Clock3, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsRequisitionHistorySummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function RequisitionSummary({
  summary,
  unitOfMeasurement,
}: {
  summary: PurchasingMaterialsRequisitionHistorySummary;
  unitOfMeasurement: MaterialUnit;
}) {
  const { locale, translate } = useI18n();
  const unitLabel = getMaterialUnitLabel(unitOfMeasurement, locale);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={translate("Requisitions", "الطلبات")}
        value={summary.requisitionCount}
        hint={translate("Purchase requisitions that include this material.", "طلبات الشراء التي تتضمن هذه المادة.")}
        icon={<ClipboardList size={20} />}
      />
      <KpiCard
        label={translate(`Total Qty (${unitLabel})`, `إجمالي الكمية (${unitLabel})`)}
        value={formatQuantity(summary.totalQuantity)}
        hint={
          summary.missingConversionCount > 0
            ? translate(
                `${summary.missingConversionCount} line${summary.missingConversionCount === 1 ? "" : "s"} excluded (missing unit conversion).`,
                `${summary.missingConversionCount} بند مستبعد (تحويل وحدة مفقود).`,
              )
            : translate("Sum of requested quantity in the display unit.", "مجموع الكمية المطلوبة بوحدة العرض.")
        }
        icon={<Package size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate(`Approved Qty (${unitLabel})`, `الكمية المعتمدة (${unitLabel})`)}
        value={formatQuantity(summary.approvedQuantity)}
        hint={translate("Requested quantity on fully approved requisitions.", "الكمية المطلوبة على الطلبات المعتمدة بالكامل.")}
        icon={<CheckCircle2 size={20} />}
        valueClassName={reportTheme.kpi.positive}
      />
      <KpiCard
        label={translate(`Pending Qty (${unitLabel})`, `الكمية قيد الانتظار (${unitLabel})`)}
        value={formatQuantity(summary.pendingQuantity)}
        hint={translate("Requested quantity still awaiting approval.", "الكمية المطلوبة التي ما زالت بانتظار الاعتماد.")}
        icon={<Clock3 size={20} />}
        valueClassName="text-ochre-700"
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
          {hint && <p className="mt-1.5 text-xs leading-[1.75] text-gray-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
