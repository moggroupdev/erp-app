"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsPriceHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";
import { reportTheme } from "../../components/report-theme";

export default function PriceChart({
  data,
  unitOfMeasurement,
  materialTitle,
  materialCode,
}: {
  data: PurchasingMaterialsPriceHistoryEntry[];
  unitOfMeasurement: MaterialUnit;
  materialTitle?: string;
  materialCode?: string;
}) {
  const { locale, translate, translation } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";
  const currency = translation.currency;
  const unitLabel = getMaterialUnitLabel(unitOfMeasurement, locale);
  const priceLabel = translate(`Unit Price (${currency} / ${unitLabel})`, `سعر الوحدة (${currency} / ${unitLabel})`);

  const materialIdentity =
    materialTitle && materialCode
      ? translate(
          `${materialTitle} (${materialCode}) · base unit: ${unitLabel}`,
          `${materialTitle} (${materialCode}) · الوحدة الأساسية: ${unitLabel}`,
        )
      : translate(`Unit price per base unit (${unitLabel}).`, `سعر الوحدة حسب الوحدة الأساسية (${unitLabel}).`);

  if (data.length === 0) {
    return (
      <ReportCard title={translate("Price Trend", "اتجاه السعر")} icon={TrendingUp} accent="teal">
        <p className="bg-white py-10 text-center text-sm text-stone-500">
          {translate("No purchase history for this material", "لا يوجد تاريخ شراء لهذه المادة")}
        </p>
      </ReportCard>
    );
  }

  const chartData = data.map((entry) => ({
    date: new Date(entry.orderDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    unitPrice: entry.unitPrice,
    supplierName: entry.supplierName,
  }));

  return (
    <ReportCard
      title={translate("Price Trend", "اتجاه السعر")}
      description={translate(
        `Unit price per purchase order over time. ${materialIdentity}`,
        `سعر الوحدة لكل أمر توريد بمرور الوقت. ${materialIdentity}`,
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
              formatter={(value) => [formatMoney(Number(value ?? 0), currency), priceLabel]}
              labelFormatter={(label, payload) => {
                const supplier = payload?.[0]?.payload?.supplierName as string | undefined;
                return supplier ? `${label} · ${supplier}` : String(label);
              }}
              contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
            />
            <Line
              type="monotone"
              dataKey="unitPrice"
              stroke={reportTheme.chart.priceLine}
              strokeWidth={2}
              dot={{ r: 4, fill: reportTheme.chart.priceLine }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
}
