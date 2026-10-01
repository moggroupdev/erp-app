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
    <div
      className="inline-flex h-[calc(2.25rem*var(--mantine-scale))] items-center rounded-(--mantine-radius-md) bg-white p-0.5 max-sm:h-[30px]"
      role="tablist"
    >
      {PERIODS.map((item) => {
        const selected = item === period;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item)}
            className={`h-full rounded-[calc(var(--mantine-radius-md)-2px)] px-2.5 text-sm! transition-colors ${
              selected ? "bg-gray-100 font-medium text-gray-800" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {labels[item]}
          </button>
        );
      })}
    </div>
  );
}
