"use client";

import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import {
  getAveragePriceGapCauseLabel,
  AVERAGE_PRICE_GAP_CAUSE_VALUES,
  type AveragePriceGapCause,
} from "@/lib/constants/enums/derived/average-price-gap-causes";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import type { PurchasingMaterialsAveragePriceGapSummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function AveragePriceGapsOverview({ summary }: { summary: PurchasingMaterialsAveragePriceGapSummary }) {
  const { locale, translate } = useI18n();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label={translate("Flagged materials", "المواد المعلمة")}
          value={summary.flaggedCount}
          hint={translate(
            "Materials whose stored average price diverges from the quantity-weighted purchase price.",
            "مواد يختلف سعرها المتوسط المخزن عن متوسط أسعار الشراء المرجح بالكمية.",
          )}
          icon={<Scale size={20} />}
          valueClassName={summary.flaggedCount > 0 ? "text-clay-700" : reportTheme.kpi.neutral}
        />
        <KpiCard
          label={translate("Stored price higher", "السعر المخزن أعلى")}
          value={summary.aboveCount}
          hint={translate("Stored average is above what was paid.", "السعر المتوسط المخزن أعلى مما تم دفعه.")}
          icon={<ArrowUpRight size={20} />}
          valueClassName={summary.aboveCount > 0 ? "text-clay-700" : reportTheme.kpi.neutral}
        />
        <KpiCard
          label={translate("Stored price lower", "السعر المخزن أدنى")}
          value={summary.belowCount}
          hint={translate("Stored average is below what was paid.", "السعر المتوسط المخزن أدنى مما تم دفعه.")}
          icon={<ArrowDownRight size={20} />}
          valueClassName={summary.belowCount > 0 ? "text-ochre-700" : reportTheme.kpi.neutral}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {AVERAGE_PRICE_GAP_CAUSE_VALUES.map((cause) => (
          <CauseChip
            key={cause}
            cause={cause}
            count={summary.byCause[cause]}
            label={getAveragePriceGapCauseLabel(cause, locale)}
          />
        ))}
      </div>
    </div>
  );
}

function CauseChip({ cause, count, label }: { cause: AveragePriceGapCause; count: number; label: string }) {
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

function getCauseChipClasses(cause: AveragePriceGapCause) {
  return getSemanticStatusColors(cause === "drift" ? "warning" : "danger");
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
