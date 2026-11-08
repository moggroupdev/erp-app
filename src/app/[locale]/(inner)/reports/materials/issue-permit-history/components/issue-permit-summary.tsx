"use client";

import { Ban, ClipboardList, FileStack, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { MaterialsIssuePermitHistorySummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function IssuePermitSummary({
  summary,
  unitOfMeasurement,
}: {
  summary: MaterialsIssuePermitHistorySummary;
  unitOfMeasurement: MaterialUnit;
}) {
  const { locale, translate } = useI18n();
  const unitLabel = getMaterialUnitLabel(unitOfMeasurement, locale);
  const missingHint =
    summary.missingConversionCount > 0
      ? translate(
          `${summary.missingConversionCount} line${summary.missingConversionCount === 1 ? "" : "s"} excluded (missing unit conversion).`,
          `${summary.missingConversionCount} بند مستبعد (تحويل وحدة مفقود).`,
        )
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={translate("Lines", "البنود")}
        value={summary.lineCount}
        hint={translate("Issue permit lines that include this material.", "بنود أذونات الصرف التي تتضمن هذه المادة.")}
        icon={<ClipboardList size={20} />}
      />
      <KpiCard
        label={translate("Permits", "الأذونات")}
        value={summary.permitCount}
        hint={translate("Distinct issue permits in the selected range.", "أذونات الصرف المميزة ضمن النطاق المحدد.")}
        icon={<FileStack size={20} />}
      />
      <KpiCard
        label={translate(`Issued Qty (${unitLabel})`, `الكمية المصروفة (${unitLabel})`)}
        value={formatQuantity(summary.issuedQuantity)}
        hint={
          missingHint ??
          translate("Sum of issued quantity in the display unit.", "مجموع الكمية المصروفة بوحدة العرض.")
        }
        icon={<Package size={20} />}
        valueClassName={reportTheme.kpi.positive}
      />
      <KpiCard
        label={translate(`Cancelled Qty (${unitLabel})`, `الكمية الملغاة (${unitLabel})`)}
        value={formatQuantity(summary.cancelledQuantity)}
        hint={
          missingHint ??
          translate("Sum of cancelled quantity in the display unit.", "مجموع الكمية الملغاة بوحدة العرض.")
        }
        icon={<Ban size={20} />}
        valueClassName={reportTheme.kpi.negative}
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
