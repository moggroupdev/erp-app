"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartColumn } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { chartNeutralColors, semanticPalette } from "@/lib/constants/color-palette";
import ReportCard from "../../reports/materials/components/report-card";
import type { DashboardPeriodStats } from "@/types/reports";

const { haze, teal, ochre, clay, plum } = semanticPalette;

type ActivityRow = {
  key: string;
  name: string;
  count: number;
  color: string;
};

export default function ActivityChart({ stats }: { stats: DashboardPeriodStats }) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";

  const requisitionTotal = stats.requisitions.pending + stats.requisitions.approved + stats.requisitions.rejected;
  const orderTotal = stats.purchaseOrders.open + stats.purchaseOrders.completed + stats.purchaseOrders.cancelled;
  const permitTotal = stats.legacyIssuePermits.active + stats.legacyIssuePermits.cancelled;

  const data: ActivityRow[] = [
    { key: "customers", name: translate("Customers", "العملاء"), count: stats.customersCreated, color: haze[600] },
    { key: "suppliers", name: translate("Suppliers", "الموردون"), count: stats.suppliersCreated, color: plum[600] },
    { key: "materials", name: translate("Materials", "المواد"), count: stats.materialsCreated, color: teal[600] },
    { key: "products", name: translate("Products", "المنتجات"), count: stats.productsCreated, color: haze[700] },
    { key: "requisitions", name: translate("Requisitions", "طلبات الشراء"), count: requisitionTotal, color: ochre[600] },
    { key: "orders", name: translate("Orders", "أوامر التوريد"), count: orderTotal, color: plum[700] },
    { key: "permits", name: translate("Issue permits", "أذونات الصرف"), count: permitTotal, color: clay[600] },
  ];

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ReportCard
      title={translate("Selected period activity", "نشاط الفترة المحددة")}
      description={translate(
        "A comparison of totals created in this period. This is not a time trend.",
        "مقارنة للإجماليات المُنشأة خلال هذه الفترة. هذا ليس اتجاهاً زمنياً.",
      )}
      icon={ChartColumn}
      accent="sky"
      className="h-full"
    >
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
      ) : (
        <div className="h-72" dir={dir}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" style={{ direction: "ltr" }} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartNeutralColors[2]} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: chartNeutralColors[0] }} reversed={isRtl} />
              <YAxis
                type="category"
                dataKey="name"
                width={118}
                tick={{ fontSize: 11, fill: chartNeutralColors[0] }}
                orientation={isRtl ? "right" : "left"}
              />
              <Tooltip
                cursor={{ fill: chartNeutralColors[2], opacity: 0.35 }}
                formatter={(count) => [Number(count ?? 0), translate("Count", "العدد")]}
                contentStyle={{ borderRadius: 12, border: `1px solid ${chartNeutralColors[2]}`, direction: dir }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={18} barSize={16}>
                {data.map((item) => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportCard>
  );
}
