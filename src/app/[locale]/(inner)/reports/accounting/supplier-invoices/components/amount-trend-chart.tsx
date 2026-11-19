"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import type { AccountingSupplierInvoicesByPeriod } from "@/types/reports";
import type { GroupBy } from "../../../purchasing-materials/components/date-range-filter";
import ReportCard from "../../components/report-card";
import { reportTheme } from "../../components/report-theme";
import { formatPeriodLabel } from "./period-label";

export default function AmountTrendChart({
  data,
  groupBy,
}: {
  data: AccountingSupplierInvoicesByPeriod[];
  groupBy: GroupBy;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";
  const chartData = data.map((row) => ({
    name: formatPeriodLabel(row.period, locale, groupBy),
    totalAmount: row.totalAmount,
  }));

  return (
    <ReportCard
      title={translate("Invoice Total Trend", "اتجاه إجمالي الفاتورة")}
      description={translate(
        "Invoice totals grouped by issue date period.",
        "إجماليات الفواتير مجمعة حسب فترة تاريخ الإصدار.",
      )}
      icon={TrendingUp}
      accent="teal"
    >
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
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
                formatter={(value) => [formatMoney(Number(value ?? 0), currency), translate("Total", "الإجمالي")]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
              />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke={reportTheme.chart.period}
                strokeWidth={2}
                dot={{ r: 4, fill: reportTheme.chart.period }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportCard>
  );
}
