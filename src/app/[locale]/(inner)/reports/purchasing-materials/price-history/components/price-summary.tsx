"use client";

import { ArrowDownRight, ArrowUpRight, ChartNoAxesColumn, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsPriceHistorySummary } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function PriceSummary({
  summary,
  unitOfMeasurement,
  purchaseCount,
}: {
  summary: PurchasingMaterialsPriceHistorySummary;
  unitOfMeasurement: MaterialUnit;
  purchaseCount?: number;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const unitLabel = getMaterialUnitLabel(unitOfMeasurement, locale);
  const priceSuffix = `${currency} / ${unitLabel}`;

  const changePositive = summary.changePercentage >= 0;
  const ChangeIcon = changePositive ? ArrowUpRight : ArrowDownRight;
  const changeTone = changePositive ? reportTheme.kpi.negative : reportTheme.kpi.positive;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={translate(`Min Price (${priceSuffix})`, `أقل سعر (${priceSuffix})`)}
        value={formatMoney(summary.minPrice, currency)}
        hint={translate("Lowest unit price in the selected period.", "أقل سعر وحدة في الفترة المحددة.")}
        icon={<TrendingDown size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate(`Max Price (${priceSuffix})`, `أعلى سعر (${priceSuffix})`)}
        value={formatMoney(summary.maxPrice, currency)}
        hint={translate("Highest unit price in the selected period.", "أعلى سعر وحدة في الفترة المحددة.")}
        icon={<TrendingUp size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate(`Average Price (${priceSuffix})`, `متوسط السعر (${priceSuffix})`)}
        value={formatMoney(summary.avgPrice, currency)}
        hint={
          purchaseCount != null
            ? translate(
                `Mean unit price across ${purchaseCount} purchase${purchaseCount === 1 ? "" : "s"}.`,
                `متوسط سعر الوحدة عبر ${purchaseCount} عملية شراء.`,
              )
            : translate("Mean unit price across purchases in range.", "متوسط سعر الوحدة عبر المشتريات في الفترة.")
        }
        icon={<ChartNoAxesColumn size={20} />}
      />
      <KpiCard
        label={translate("Price Change", "تغير السعر")}
        value={
          <span className="inline-flex items-center gap-1">
            <ChangeIcon size={20} />
            {changePositive ? "+" : ""}
            {summary.changePercentage.toFixed(1)}%
          </span>
        }
        hint={translate(
          "Change from first to last purchase order in range.",
          "التغير من أول أمر توريد إلى آخر أمر في الفترة.",
        )}
        icon={<ChangeIcon size={20} />}
        valueClassName={changeTone}
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
          {hint && <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
