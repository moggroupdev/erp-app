"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { MaterialsIssuePermitHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";
import { reportTheme } from "../../components/report-theme";

type ChartEntry = MaterialsIssuePermitHistoryEntry & {
  displayQuantity: number | null;
};

export default function IssuePermitChart({
  data,
  unitOfMeasurement,
  materialTitle,
  materialCode,
}: {
  data: ChartEntry[];
  unitOfMeasurement: MaterialUnit;
  materialTitle?: string;
  materialCode?: string;
}) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";
  const unitLabel = getMaterialUnitLabel(unitOfMeasurement, locale);
  const quantityLabel = translate(`Issued Qty (${unitLabel})`, `الكمية المصروفة (${unitLabel})`);

  const materialIdentity =
    materialTitle && materialCode
      ? translate(
          `${materialTitle} (${materialCode}) · unit: ${unitLabel}`,
          `${materialTitle} (${materialCode}) · الوحدة: ${unitLabel}`,
        )
      : translate(`Quantity per ${unitLabel}.`, `الكمية حسب ${unitLabel}.`);

  const chartSource = data.filter((entry) => !entry.isCancelled && entry.displayQuantity != null);

  if (chartSource.length === 0) {
    return (
      <ReportCard title={translate("Issued Quantity Trend", "اتجاه الكمية المصروفة")} icon={TrendingUp} accent="teal">
        <p className="bg-white py-10 text-center text-sm text-stone-500">
          {translate("No convertible issued history for this material", "لا يوجد سجل صرف قابل للتحويل لهذه المادة")}
        </p>
      </ReportCard>
    );
  }

  const chartData = chartSource.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    quantity: entry.displayQuantity!,
    issuePermitNumber: entry.issuePermitNumber,
  }));

  return (
    <ReportCard
      title={translate("Issued Quantity Trend", "اتجاه الكمية المصروفة")}
      description={translate(
        `Issued quantity per issue permit over time. ${materialIdentity}`,
        `الكمية المصروفة لكل إذن صرف بمرور الوقت. ${materialIdentity}`,
      )}
      icon={TrendingUp}
      accent="teal"
    >
      <div className="h-64" dir={dir}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} style={{ direction: "ltr" }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} reversed={isRtl} />
            <YAxis
              tick={{ fontSize: 11 }}
              orientation={isRtl ? "right" : "left"}
              tickFormatter={formatCompactNumber}
              width={48}
            />
            <Tooltip
              formatter={(value) => [formatQuantity(Number(value ?? 0)), quantityLabel]}
              labelFormatter={(label, payload) => {
                const number = payload?.[0]?.payload?.issuePermitNumber as string | undefined;
                return number ? `${label} · ${number}` : String(label);
              }}
              contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
            />
            <Line
              type="monotone"
              dataKey="quantity"
              stroke={reportTheme.accent}
              strokeWidth={2}
              dot={{ r: 4, fill: reportTheme.accent }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
}
