"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Layers } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import type { MaterialsInventoryByMaterialType } from "@/types/reports";
import ReportCard from "./report-card";
import { reportTheme } from "./report-theme";
import MoneyViewer from "@/components/ui/money-viewer";
import { formatMoney } from "@/lib/helpers/format-money";

export default function MaterialTypeChart({ data }: { data: MaterialsInventoryByMaterialType[] }) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const currency = translate("EGP", "ج.م");

  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: getMaterialTypeLabel(item.materialType, locale),
      count: item.count,
      value: item.totalValue,
    }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <ReportCard
        title={translate("Inventory by Type", "المخزون حسب النوع")}
        description={translate(
          "Share of total inventory value between raw materials and spare parts.",
          "حصة قيمة المخزون الإجمالية بين المواد الخام وقطع الغيار.",
        )}
        icon={Layers}
        accent="teal"
      >
        <p className="bg-white py-10 text-center text-sm text-stone-500">
          {translate("No data available", "لا توجد بيانات")}
        </p>
      </ReportCard>
    );
  }

  return (
    <ReportCard
      title={translate("Inventory by Type", "المخزون حسب النوع")}
      description={translate(
        "Share of total inventory value between raw materials and spare parts.",
        "حصة قيمة المخزون الإجمالية بين المواد الخام وقطع الغيار.",
      )}
      icon={Layers}
      accent="teal"
    >
      <div className="flex flex-col gap-6 bg-white">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={reportTheme.chart.materialTypes[index % reportTheme.chart.materialTypes.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const amount = Number(value ?? 0);
                  const pct = totalValue > 0 ? ((amount / totalValue) * 100).toFixed(1) : "0";
                  return [
                    `${formatMoney(amount, currency)} · ${pct}% · ${item.payload.count} ${translate("items", "عنصر")}`,
                    item.payload.name,
                  ];
                }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex-center gap-4">
          {chartData.map((item, index) => (
            <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-stone-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: reportTheme.chart.materialTypes[index % reportTheme.chart.materialTypes.length],
                  }}
                />
                {item.name}
              </span>
              <span className="font-medium text-stone-800">
                <MoneyViewer amount={item.value} currency={currency} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ReportCard>
  );
}
