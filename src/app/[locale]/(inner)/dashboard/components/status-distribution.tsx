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

function segmentCount(value: unknown) {
  if (Array.isArray(value) && value.length === 2) return Number(value[1]) - Number(value[0]);
  return Number(value ?? 0);
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

  const rows = payload
    .map((item) => ({
      key: String(item.dataKey ?? "") as StatusKey,
      value: segmentCount(item.value),
      color: item.color,
    }))
    .filter((item) => item.value > 0 && item.key in labels);

  if (rows.length === 0) return null;

  const rowTotal = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      className="min-w-48 rounded-xl bg-white px-3 py-2.5 text-xs shadow-md"
      style={{ direction: dir, border: `1px solid ${chartNeutralColors[2]}` }}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="font-semibold text-gray-800">{rowTotal}</p>
      </div>
      <div className="mb-2 flex h-1.5 overflow-hidden rounded-full">
        {rows.map((item) => (
          <span
            key={item.key}
            className="h-full"
            style={{ width: `${(item.value / rowTotal) * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map((item) => {
          const share = Math.round((item.value / rowTotal) * 100);
          return (
            <li key={item.key} className="flex items-center justify-between gap-4 text-gray-600">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{labels[item.key]}</span>
              </span>
              <span className="shrink-0 font-medium text-gray-800">
                {item.value}
                <span className="ms-1 font-normal text-gray-400">{share}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function statusRanges(counts: number[]): [number, number][] {
  let cursor = 0;
  return counts.map((count) => {
    const start = cursor;
    cursor += count;
    return [start, cursor];
  });
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

  const [pendingRange, approvedRange, rejectedRange] = statusRanges([
    stats.requisitions.pending,
    stats.requisitions.approved,
    stats.requisitions.rejected,
  ]);
  const [openRange, completedRange, cancelledRange] = statusRanges([
    stats.purchaseOrders.open,
    stats.purchaseOrders.completed,
    stats.purchaseOrders.cancelled,
  ]);
  const axisMax = Math.max(requisitionTotal, orderTotal);

  const data = [
    {
      name: groupLabels.requisitions,
      pending: pendingRange,
      approved: approvedRange,
      rejected: rejectedRange,
      open: [0, 0],
      completed: [0, 0],
      cancelled: [0, 0],
    },
    {
      name: groupLabels.orders,
      pending: [0, 0],
      approved: [0, 0],
      rejected: [0, 0],
      open: openRange,
      completed: completedRange,
      cancelled: cancelledRange,
    },
  ];

  return (
    <DashboardPanel
      title={translate("Requisition and order status", "حالة الطلبات وأوامر التوريد")}
      description={translate(
        "How many are still open, finished, or closed in this period.",
        "كم منها ما زال مفتوحاً أو مكتملاً أو مغلقاً خلال هذه الفترة.",
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

          <div className="h-36" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartNeutralColors[2]} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, axisMax]}
                  allowDataOverflow
                  allowDecimals={false}
                  padding={{ left: 0, right: 0 }}
                  tick={{ fontSize: 11, fill: chartNeutralColors[0] }}
                  reversed={isRtl}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={112}
                  tick={{ fontSize: 11, fill: chartNeutralColors[0] }}
                  orientation={isRtl ? "right" : "left"}
                  axisLine={false}
                  tickLine={false}
                  padding={{ top: 0, bottom: 0 }}
                />
                <Tooltip
                  cursor={{ fill: chartNeutralColors[2], opacity: 0.35 }}
                  content={({ active, payload, label }) => (
                    <StatusTooltip active={active} payload={payload} label={label} labels={labels} dir={dir} />
                  )}
                />
                {SERIES.map((series) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    fill={series.color}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />
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
