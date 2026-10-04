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
  grandTotal,
  translate,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown; color?: string }>;
  label?: string | number;
  labels: Record<StatusKey, string>;
  dir: "ltr" | "rtl";
  grandTotal: number;
  translate: (en: string, ar: string) => string;
}) {
  if (!active || !payload?.length) return null;

  const seriesOrder = SERIES.map((series) => series.key);
  const rows = payload
    .map((item) => ({
      key: String(item.dataKey ?? "") as StatusKey,
      value: segmentCount(item.value),
      color: item.color,
    }))
    .filter((item) => item.value > 0 && item.key in labels)
    .sort((a, b) => seriesOrder.indexOf(a.key) - seriesOrder.indexOf(b.key));

  if (rows.length === 0) return null;

  const rowTotal = rows.reduce((sum, item) => sum + item.value, 0);
  const periodShare = grandTotal > 0 ? Math.round((rowTotal / grandTotal) * 100) : 0;
  const showPeriodShare = grandTotal > 0 && rowTotal < grandTotal;

  return (
    <div
      className="max-w-80 min-w-52 overflow-hidden rounded-2xl bg-white text-xs shadow-lg ring-1 ring-gray-200/90"
      style={{ direction: dir }}
    >
      <div className="border-b border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
              {translate("Status breakdown", "تفصيل الحالات")}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{label}</p>
          </div>
          <div className="shrink-0 text-end">
            <p className="text-lg leading-none font-semibold text-gray-900 tabular-nums">{rowTotal}</p>
            <p className="mt-1 text-[10px] text-gray-500">
              {showPeriodShare
                ? translate(`${periodShare}% of all in period`, `${periodShare}% من إجمالي الفترة`)
                : translate("In this period", "خلال هذه الفترة")}
            </p>
          </div>
        </div>
      </div>

      <div className="px-3.5 py-3">
        <div className="mb-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-gray-100 p-0.5">
          {rows.map((item) => (
            <span
              key={item.key}
              className="h-full min-w-[3px] rounded-full"
              style={{ flex: item.value, backgroundColor: item.color }}
            />
          ))}
        </div>

        <ul className="flex flex-col gap-2.5">
          {rows.map((item) => {
            const share = rowTotal > 0 ? Math.round((item.value / rowTotal) * 100) : 0;
            return (
              <li key={item.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-gray-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-gray-200/80"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate font-medium">{labels[item.key]}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 tabular-nums">
                      {share}%
                    </span>
                    <span className="min-w-5 text-sm font-semibold text-gray-900 tabular-nums">{item.value}</span>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{ width: `${share}%`, backgroundColor: item.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
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
      trailing={<span className="bg-ochre-50 text-ochre-800 rounded-full px-2.5 py-1 text-xs font-semibold">{total}</span>}
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

          <div className="h-44" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={
                  isRtl
                    ? { top: 8, right: -42, left: 0, bottom: 0 }
                    : { top: 8, right: 0, left: -42, bottom: 0 }
                }
                barGap={-20}
                barSize={15}
              >
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
                    <StatusTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      labels={labels}
                      dir={dir}
                      grandTotal={total}
                      translate={translate}
                    />
                  )}
                />
                {SERIES.map((series) => (
                  <Bar key={series.key} dataKey={series.key} fill={series.color} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
