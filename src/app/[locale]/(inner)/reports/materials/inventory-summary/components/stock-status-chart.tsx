"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ShieldCheck } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { getStockStatusLabel } from "@/lib/constants/enums/derived/stock-statuses";
import type { MaterialsInventoryStockStatus } from "@/types/reports";
import ReportCard from "./report-card";
import { reportTheme } from "./report-theme";
import { formatMoney } from "@/lib/helpers/format-money";

export default function StockStatusChart({ data }: { data: MaterialsInventoryStockStatus[] }) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const currency = translate("EGP", "ج.م");

  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: getStockStatusLabel(item.status, locale),
      count: item.count,
      value: item.totalValue,
      status: item.status,
    }));

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  if (chartData.length === 0) {
    return (
      <ReportCard
        title={translate("Stock Status Distribution", "توزيع حالة المخزون")}
        description={translate(
          "How materials are classified by quantity relative to their minimum stock level.",
          "تصنيف المواد حسب الكمية مقارنةً بالحد الأدنى للمخزون.",
        )}
        icon={ShieldCheck}
        accent="amber"
      >
        <p className="py-10 text-center text-sm text-stone-500">{translate("No data available", "لا توجد بيانات")}</p>
      </ReportCard>
    );
  }

  return (
    <ReportCard
      title={translate("Stock Status Distribution", "توزيع حالة المخزون")}
      description={translate(
        "How materials are classified by quantity relative to their minimum stock level.",
        "تصنيف المواد حسب الكمية مقارنةً بالحد الأدنى للمخزون.",
      )}
      icon={ShieldCheck}
      accent="amber"
    >
      <div className="flex flex-col gap-4 bg-white">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((item) => (
                  <Cell
                    key={item.status}
                    fill={
                      reportTheme.chart.stockStatus[item.status as keyof typeof reportTheme.chart.stockStatus] ?? "#a8a29e"
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(count, _name, item) => {
                  const items = Number(count ?? 0);
                  const pct = totalCount > 0 ? ((items / totalCount) * 100).toFixed(1) : "0";
                  return [
                    `${items} ${translate("items", "عنصر")} · ${pct}% · ${formatMoney(item.payload.value, currency)}`,
                    item.payload.name,
                  ];
                }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex-center gap-4">
          {chartData.map((item) => (
            <li key={item.status} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-stone-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      reportTheme.chart.stockStatus[item.status as keyof typeof reportTheme.chart.stockStatus] ?? "#a8a29e",
                  }}
                />
                {item.name}
              </span>
              <span className="font-medium text-stone-800">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </ReportCard>
  );
}
