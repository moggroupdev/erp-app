"use client";

import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsPriceHistorySummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function PriceSummary({ summary }: { summary: PurchasingMaterialsPriceHistorySummary }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;

  const changePositive = summary.changePercentage >= 0;
  const ChangeIcon = changePositive ? ArrowUpRight : ArrowDownRight;
  const changeTone = changePositive ? reportTheme.kpi.negative : reportTheme.kpi.positive;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <SummaryCard
        label={translate("Min Price", "أقل سعر")}
        value={formatMoney(summary.minPrice, currency)}
        icon={<TrendingDown size={18} />}
      />
      <SummaryCard
        label={translate("Max Price", "أعلى سعر")}
        value={formatMoney(summary.maxPrice, currency)}
        icon={<TrendingUp size={18} />}
      />
      <SummaryCard
        label={translate("Average Price", "متوسط السعر")}
        value={formatMoney(summary.avgPrice, currency)}
      />
      <SummaryCard
        label={translate("Price Change", "تغير السعر")}
        value={
          <span className="inline-flex items-center gap-1">
            <ChangeIcon size={16} />
            {changePositive ? "+" : ""}
            {summary.changePercentage.toFixed(1)}%
          </span>
        }
        valueClassName={changeTone}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  valueClassName = reportTheme.kpi.neutral,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <div className="flex flex-col gap-2">
        {icon && <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600">{icon}</div>}
        <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</p>
        <p className={`text-xl font-semibold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}
