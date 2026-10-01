"use client";

import type { DashboardPeriod } from "@/types/reports";
import { useI18n } from "@/lib/i18n/hooks";

const PERIODS: DashboardPeriod[] = ["week", "month", "overall"];

export default function PeriodSwitch({
  period,
  onChange,
}: {
  period: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}) {
  const { translate } = useI18n();

  const labels: Record<DashboardPeriod, string> = {
    week: translate("Last week", "الأسبوع الماضي"),
    month: translate("Last month", "الشهر الماضي"),
    overall: translate("Overall", "الإجمالي"),
  };

  return (
    <div className="flex rounded-2xl bg-gray-100 p-1" role="tablist">
      {PERIODS.map((item) => {
        const selected = item === period;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item)}
            className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
              selected ? "bg-white font-medium text-haze-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {labels[item]}
          </button>
        );
      })}
    </div>
  );
}
