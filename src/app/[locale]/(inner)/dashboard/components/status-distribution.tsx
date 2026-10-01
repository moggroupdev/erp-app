"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Rows3 } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { chartNeutralColors, semanticPalette } from "@/lib/constants/color-palette";
import ReportCard from "../../reports/materials/components/report-card";
import type { DashboardPeriodStats } from "@/types/reports";

const { haze, teal, ochre, clay } = semanticPalette;

type StatusKey = "pending" | "approved" | "rejected" | "open" | "completed" | "cancelled";

function StatusTooltip({
  active,
  payload,
  label,
  labels,
  dir,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown; color?: string }>;
  label?: string | number;
  labels: Record<StatusKey, string>;
  dir: "ltr" | "rtl";
}) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((item) => Number(item.value) > 0);
  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm"
      style={{ direction: dir, border: `1px solid ${chartNeutralColors[2]}` }}
    >
      <p className="mb-1 font-medium text-gray-800">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((item) => {
          const key = String(item.dataKey ?? "") as StatusKey;
          return (
            <li key={key} className="flex items-center justify-between gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {labels[key]}
              </span>
              <span className="font-medium text-gray-800">{Number(item.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SERIES: { key: StatusKey; color: string }[] = [
  { key: "pending", color: ochre[600] },
  { key: "approved", color: teal[600] },
  { key: "rejected", color: clay[600] },
  { key: "open", color: haze[600] },
  { key: "completed", color: teal[700] },
  { key: "cancelled", color: clay[700] },
];

export default function StatusDistribution({ stats }: { stats: DashboardPeriodStats }) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";

  const labels: Record<StatusKey, string> = {
    pending: translate("Pending", "قيد الانتظار"),
    approved: translate("Approved", "معتمدة"),
    rejected: translate("Rejected", "مرفوضة"),
    open: translate("Open", "مفتوحة"),
    completed: translate("Completed", "مكتملة"),
    cancelled: translate("Cancelled", "ملغاة"),
  };

  const data = [
    {
      name: translate("Requisitions", "طلبات الشراء"),
      pending: stats.requisitions.pending,
      approved: stats.requisitions.approved,
      rejected: stats.requisitions.rejected,
      open: 0,
      completed: 0,
      cancelled: 0,
    },
    {
      name: translate("Purchase orders", "أوامر التوريد"),
      pending: 0,
      approved: 0,
      rejected: 0,
      open: stats.purchaseOrders.open,
      completed: stats.purchaseOrders.completed,
      cancelled: stats.purchaseOrders.cancelled,
    },
  ];

  const total = data.reduce(
    (sum, row) => sum + row.pending + row.approved + row.rejected + row.open + row.completed + row.cancelled,
    0,
  );

  return (
    <ReportCard
      title={translate("Status distribution", "توزيع الحالات")}
      description={translate(
        "Current state of requisitions and purchase orders created in this period.",
        "الحالة الحالية لطلبات الشراء وأوامر التوريد المُنشأة خلال هذه الفترة.",
      )}
      icon={Rows3}
      accent="amber"
      className="h-full"
    >
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
      ) : (
        <div className="flex h-full flex-col gap-5">
          <div className="h-52" dir={dir}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" style={{ direction: "ltr" }} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
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
                  content={({ active, payload, label }) => (
                    <StatusTooltip active={active} payload={payload} label={label} labels={labels} dir={dir} />
                  )}
                />
                {SERIES.map((series) => (
                  <Bar key={series.key} dataKey={series.key} stackId="status" fill={series.color} maxBarSize={28} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />
                <span>{labels[series.key]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReportCard>
  );
}
