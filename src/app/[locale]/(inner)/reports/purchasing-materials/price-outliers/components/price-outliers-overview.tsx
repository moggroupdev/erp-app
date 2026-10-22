"use client";

import { AlertTriangle, Boxes } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import {
  getPriceOutlierCauseLabel,
  PRICE_OUTLIER_CAUSE_VALUES,
  type PriceOutlierCause,
} from "@/lib/constants/enums/derived/price-outlier-causes";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import type { PurchasingMaterialsPriceOutlierSummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function PriceOutliersOverview({ summary }: { summary: PurchasingMaterialsPriceOutlierSummary }) {
  const { locale, translate } = useI18n();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard
          label={translate("Outlier cases", "حالات الانحراف")}
          value={summary.flaggedCount}
          hint={translate(
            "Purchase order lines whose unit price diverges from nearby purchases of the same material.",
            "بنود أوامر التوريد التي يختلف سعر وحدتها عن المشتريات المجاورة لنفس المادة.",
          )}
          icon={<AlertTriangle size={20} />}
          valueClassName={summary.flaggedCount > 0 ? "text-clay-700" : reportTheme.kpi.neutral}
        />
        <KpiCard
          label={translate("Materials affected", "المواد المتأثرة")}
          value={summary.materialsAffected}
          hint={translate("Distinct materials with at least one outlier case.", "مواد مختلفة لها حالة انحراف واحدة على الأقل.")}
          icon={<Boxes size={20} />}
          valueClassName={summary.materialsAffected > 0 ? "text-ochre-700" : reportTheme.kpi.neutral}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {PRICE_OUTLIER_CAUSE_VALUES.map((cause) => (
          <CauseChip key={cause} cause={cause} count={summary.byCause[cause]} label={getPriceOutlierCauseLabel(cause, locale)} />
        ))}
      </div>
    </div>
  );
}

function CauseChip({ cause, count, label }: { cause: PriceOutlierCause; count: number; label: string }) {
  const colors = getCauseChipClasses(cause);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colors.surfaceClass} ${colors.textClass}`}
    >
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </span>
  );
}

function getCauseChipClasses(cause: PriceOutlierCause) {
  if (cause === "missing_conversion") {
    return {
      textClass: "text-gray-700",
      surfaceClass: "bg-gray-50",
      borderClass: "border-gray-200",
    };
  }

  return getSemanticStatusColors(cause === "spike" ? "warning" : "danger");
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
