"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Rows3 } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { chartNeutralColors, semanticPalette } from "@/lib/constants/color-palette";
import type { DashboardPeriodStats } from "@/types/reports";
import DashboardPanel from "./dashboard-panel";

const { haze, teal, ochre, clay } = semanticPalette;

type StatusKey = "pending" | "approved" | "rejected" | "open" | "completed" | "cancelled";
type StatusGroup = "requisitions" | "orders";

const SERIES: { key: StatusKey; group: StatusGroup; color: string }[] = [
  { key: "pending", group: "requisitions", color: ochre[600] },
  { key: "approved", group: "requisitions", color: teal[600] },
  { key: "rejected", group: "requisitions", color: clay[600] },
  { key: "open", group: "orders", color: haze[600] },
  { key: "completed", group: "orders", color: teal[700] },
  { key: "cancelled", group: "orders", color: clay[700] },
];

function countFor(stats: DashboardPeriodStats, key: StatusKey) {
  if (key === "pending" || key === "approved" || key === "rejected") return stats.requisitions[key];
  return stats.purchaseOrders[key];
}

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

  const rowTotal = rows.reduce((sum, item) => sum + Number(item.value), 0);

  return (
    <div
      className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm"
      style={{ direction: dir, border: `1px solid ${chartNeutralColors[2]}` }}
    >
      <p className="mb-1 font-medium text-gray-800">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((item) => {
          const key = String(item.dataKey ?? "") as StatusKey;
          const value = Number(item.value);
          const share = rowTotal > 0 ? Math.round((value / rowTotal) * 100) : 0;
          return (
            <li key={key} className="flex items-center justify-between gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {labels[key]}
              </span>
              <span className="font-medium text-gray-800">
                {value}
                <span className="ms-1 font-normal text-gray-400">{share}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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

  const groupLabels: Record<StatusGroup, string> = {
    requisitions: translate("Requisitions", "طلبات الشراء"),
    orders: translate("Purchase orders", "أوامر التوريد"),
  };

  const requisitionTotal = stats.requisitions.pending + stats.requisitions.approved + stats.requisitions.rejected;
  const orderTotal = stats.purchaseOrders.open + stats.purchaseOrders.completed + stats.purchaseOrders.cancelled;
  const total = requisitionTotal + orderTotal;

  const data = [
    {
      name: groupLabels.requisitions,
      pending: stats.requisitions.pending,
      approved: stats.requisitions.approved,
      rejected: stats.requisitions.rejected,
      open: 0,
      completed: 0,
      cancelled: 0,
    },
    {
      name: groupLabels.orders,
      pending: 0,
      approved: 0,
      rejected: 0,
      open: stats.purchaseOrders.open,
      completed: stats.purchaseOrders.completed,
      cancelled: stats.purchaseOrders.cancelled,
    },
  ];

  return (
    <DashboardPanel
      title={translate("Status distribution", "توزيع الحالات")}
      description={translate(
        "Current state of requisitions and purchase orders created in this period.",
        "الحالة الحالية لطلبات الشراء وأوامر التوريد المُنشأة خلال هذه الفترة.",
      )}
      icon={Rows3}
      accent="amber"
      trailing={
        <span className="rounded-full bg-ochre-50 px-2.5 py-1 text-xs font-semibold text-ochre-800">{total}</span>
      }
    >
      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <Rows3 size={18} />
          </div>
          <p className="text-sm text-gray-500">
            {translate("Nothing was created in this period.", "لم يُنشأ شيء خلال هذه الفترة.")}
          </p>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <SummaryChip label={groupLabels.requisitions} value={requisitionTotal} />
            <SummaryChip label={groupLabels.orders} value={orderTotal} />
          </div>

          <div className="h-44" dir={dir}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                style={{ direction: "ltr" }}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartNeutralColors[2]} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: chartNeutralColors[0] }}
                  reversed={isRtl}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={128}
                  tick={{ fontSize: 11, fill: chartNeutralColors[0] }}
                  orientation={isRtl ? "right" : "left"}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: chartNeutralColors[2], opacity: 0.35 }}
                  content={({ active, payload, label }) => (
                    <StatusTooltip active={active} payload={payload} label={label} labels={labels} dir={dir} />
                  )}
                />
                {SERIES.map((series) => (
                  <Bar key={series.key} dataKey={series.key} stackId="status" fill={series.color} maxBarSize={22} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["requisitions", "orders"] as const).map((group) => (
              <div key={group} className="flex flex-col gap-2">
                <p className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">{groupLabels[group]}</p>
                <ul className="flex flex-col gap-1.5">
                  {SERIES.filter((series) => series.group === group).map((series) => {
                    const count = countFor(stats, series.key);
                    return (
                      <li
                        key={series.key}
                        className={`flex items-center justify-between gap-2 text-xs ${count === 0 ? "text-gray-400" : "text-gray-600"}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />
                          <span className="truncate">{labels[series.key]}</span>
                        </span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
      <span className="truncate text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}
