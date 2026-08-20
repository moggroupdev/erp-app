"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import type { PurchasingMaterialsByPeriod } from "@/types/reports";
import ReportCard from "./report-card";
import { reportTheme } from "./report-theme";
import type { GroupBy } from "./date-range-filter";

const ARABIC_QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "الربع الأول",
  2: "الربع الثاني",
  3: "الربع الثالث",
  4: "الربع الرابع",
};

/** Parse calendar year/month from a date_trunc bucket (avoids timezone shifts from UTC conversion). */
function parsePeriodParts(period: string): { year: number; month: number } | null {
  const match = period.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function formatPeriodLabel(period: string, locale: string, groupBy: GroupBy): string {
  const parts = parsePeriodParts(period);
  if (!parts) return period;

  const { year, month } = parts;
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";

  if (groupBy === "year") {
    return String(year);
  }

  if (groupBy === "quarter") {
    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return locale === "ar" ? `${ARABIC_QUARTER_LABELS[quarter]} لعام ${year}` : `Q${quarter} ${year}`;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString(localeTag, { year: "numeric", month: "short", timeZone: "UTC" });
}

export default function SpendingTrendChart({ data, groupBy }: { data: PurchasingMaterialsByPeriod[]; groupBy: GroupBy }) {
  const { locale, translate, translation } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";
  const currency = translation.currency;

  if (data.length === 0) {
    return (
      <ReportCard
        title={translate("Spending Trend", "اتجاه الإنفاق")}
        description={translate("Total spend per period.", "إجمالي الإنفاق لكل فترة.")}
        icon={TrendingUp}
        accent="teal"
      >
        <p className="bg-white py-10 text-center text-sm text-stone-500">
          {translate("No data available", "لا توجد بيانات")}
        </p>
      </ReportCard>
    );
  }

  const chartData = data.map((d) => ({
    name: formatPeriodLabel(d.period, locale, groupBy),
    totalSpend: d.totalSpend,
    orderCount: d.orderCount,
  }));

  return (
    <ReportCard
      title={translate("Spending Trend", "اتجاه الإنفاق")}
      description={translate(
        "Total spend per period across non-cancelled purchase orders.",
        "إجمالي الإنفاق لكل فترة عبر أوامر الشراء غير الملغاة.",
      )}
      icon={TrendingUp}
      accent="teal"
    >
      <div className="h-64" dir={dir}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} style={{ direction: "ltr" }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed={isRtl} />
            <YAxis
              tick={{ fontSize: 11 }}
              orientation={isRtl ? "right" : "left"}
              tickFormatter={formatCompactNumber}
              width={48}
            />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value ?? 0), currency), translate("Spend", "الإنفاق")]}
              contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
            />
            <Line
              type="monotone"
              dataKey="totalSpend"
              stroke={reportTheme.chart.period}
              strokeWidth={2}
              dot={{ r: 4, fill: reportTheme.chart.period }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
}
