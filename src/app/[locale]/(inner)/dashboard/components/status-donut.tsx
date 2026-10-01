"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";

export type DonutSlice = {
  key: string;
  name: string;
  count: number;
  color: string;
};

export default function StatusDonut({
  title,
  description,
  icon,
  data,
  embedded = false,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  data: DonutSlice[];
  embedded?: boolean;
}) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const chartData = data.filter((item) => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  const body =
    total === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                  {chartData.map((item) => (
                    <Cell key={item.key} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(count) => {
                    const items = Number(count ?? 0);
                    const pct = total > 0 ? ((items / total) * 100).toFixed(1) : "0";
                    return `${items} · ${pct}%`;
                  }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {data.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="font-medium text-gray-800">{item.count}</span>
              </li>
            ))}
          </ul>
        </>
      );

  if (embedded) return <div className="flex flex-col gap-4">{body}</div>;

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">{icon}</div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </header>
      {body}
    </section>
  );
}
