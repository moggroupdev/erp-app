"use client";

import { ClipboardList, ShoppingCart, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsCategoryStatsOverview } from "@/types/reports";
import { reportTheme } from "./report-theme";

export default function OverviewStats({ overview }: { overview: PurchasingMaterialsCategoryStatsOverview }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard
        label={translate("Total Value", "إجمالي القيمة")}
        value={formatMoney(overview.totalSpend, currency)}
        hint={translate("Sum of invoice total purchases.", "مجموع إجمالي مشتريات الفواتير.")}
        icon={<ShoppingCart size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate("Total Invoices Count", "إجمالي عدد الفواتير")}
        value={overview.totalOrders}
        hint={translate("Purchase orders in this period.", "أوامر التوريد في هذه الفترة.")}
        icon={<ClipboardList size={20} />}
      />
      <KpiCard
        label={translate("Average Order Value", "متوسط قيمة الطلب")}
        value={formatMoney(overview.avgOrderValue, currency)}
        hint={translate("Total value divided by invoice count.", "إجمالي القيمة مقسوماً على عدد الفواتير.")}
        icon={<TrendingUp size={20} />}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  valueClassName = reportTheme.kpi.neutral,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
      <div className="absolute -end-3 -top-3 opacity-[0.07]">{icon}</div>
      <div className="relative flex flex-col gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
          {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  count,
  amount,
  icon,
  tone,
}: {
  label: string;
  count: number;
  amount: string;
  icon: React.ReactNode;
  tone: "success" | "warning" | "neutral";
}) {
  const tones = {
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800",
    neutral: "bg-stone-50 text-stone-700",
  };

  return (
    <div className={`flex flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 ${tones[tone]}`}>
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      <div className="flex flex-col items-end">
        <span className="text-lg font-semibold">{count}</span>
        <span className="text-xs opacity-75">{amount}</span>
      </div>
    </div>
  );
}
