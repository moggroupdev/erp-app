"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import type { LegacyIssuePermitSummaryByMonth } from "@/types/reports";
import ReportCard from "./report-card";
import { reportTheme } from "./report-theme";

function formatMonthLabel(month: string, locale: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function MonthlyChart({ data }: { data: LegacyIssuePermitSummaryByMonth[] }) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";

  if (data.length === 0) {
    return (
      <ReportCard
        title={translate("Monthly Trend", "الاتجاه الشهري")}
        description={translate("Permit volume by month.", "حجم الأذونات حسب الشهر.")}
        icon={TrendingUp}
        accent="teal"
      >
        <p className="py-10 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      </ReportCard>
    );
  }

  const chartData = data.map((row) => ({
    name: formatMonthLabel(row.month, locale),
    permits: row.permitCount,
    cancelled: row.cancelledCount,
    items: row.itemCount,
  }));

  return (
    <ReportCard
      title={translate("Monthly Trend", "الاتجاه الشهري")}
      description={translate(
        "Permit count, cancelled permits, and line items by month.",
        "عدد الأذونات والملغاة والبنود حسب الشهر.",
      )}
      icon={TrendingUp}
      accent="teal"
    >
      <div className="h-72 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed={isRtl} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatCompactNumber(Number(value))} />
            <Tooltip />
            <Legend />
            <Bar dataKey="permits" name={translate("Permits", "الأذونات")} fill={reportTheme.chart.permits} radius={4} />
            <Bar
              dataKey="cancelled"
              name={translate("Cancelled", "ملغاة")}
              fill={reportTheme.chart.cancelled}
              radius={4}
            />
            <Bar dataKey="items" name={translate("Items", "البنود")} fill={reportTheme.chart.items} radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
}
