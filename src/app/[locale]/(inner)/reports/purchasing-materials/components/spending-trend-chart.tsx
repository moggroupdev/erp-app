"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsByPeriod } from "@/types/reports";
import ReportCard from "./report-card";
import { reportTheme } from "./report-theme";

function formatPeriodLabel(period: string, locale: string): string {
  const date = new Date(period);
  if (isNaN(date.getTime())) return period;
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short" });
}

export default function SpendingTrendChart({ data }: { data: PurchasingMaterialsByPeriod[] }) {
  const { locale, translate, translation } = useI18n();
  const dir = localeDirections[locale];
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
    name: formatPeriodLabel(d.period, locale),
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
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
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
