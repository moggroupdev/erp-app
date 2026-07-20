"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, Package, TrendingUp, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import MoneyViewer from "@/components/ui/money-viewer";
import type { MaterialsInventoryOverview } from "@/types/reports";
import { reportTheme } from "./report-theme";

export default function OverviewStats({ overview }: { overview: MaterialsInventoryOverview }) {
  const { locale, translate } = useI18n();

  const currency = translate("EGP", "ج.م");

  const valueChangePositive = overview.valueChangeAmount >= 0;
  const ValueChangeIcon = valueChangePositive ? ArrowUpRight : ArrowDownRight;
  const valueChangeClass = valueChangePositive ? reportTheme.kpi.positive : reportTheme.kpi.negative;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label={translate("Total Inventory Value", "إجمالي قيمة المخزون")}
          value={<MoneyViewer amount={overview.totalInventoryValue} currency={currency} />}
          hint={translate(
            "Current stock value based on quantity × unit cost.",
            "قيمة المخزون الحالية بناءً على الكمية × تكلفة الوحدة.",
          )}
          icon={<Wallet size={20} />}
          valueClassName={reportTheme.kpi.value}
        />
        <KpiCard
          label={translate("Total Registered Materials", "إجمالي عدد المواد المسجلة")}
          value={overview.totalMaterials}
          hint={translate("Total non-deleted materials in the catalog.", "إجمالي المواد غير المحذوفة في سجل المواد.")}
          icon={<Boxes size={20} />}
        />
        <KpiCard
          label={translate("Current vs. Openning", "القيمة الحالية مقابل الافتتاحية")}
          value={
            <span className="inline-flex items-center gap-1">
              <ValueChangeIcon size={20} />
              {valueChangePositive ? "+" : "-"}
              <MoneyViewer amount={Math.abs(overview.valueChangeAmount)} currency={currency} />
            </span>
          }
          hint={`${translate("Opening", "افتتاحية")}: ${overview.totalOpeningValue.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })} ${currency} · ${valueChangePositive ? "+" : ""}${overview.valueChangePercentage.toFixed(2)}%`}
          icon={<TrendingUp size={20} />}
          valueClassName={valueChangeClass}
        />
      </div>

      <div className="rounded-3xl bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-stone-800">
              {translate("Stock Health Snapshot", "لمحة عن صحة المخزون")}
            </h3>
            <p className="text-xs text-stone-500">
              {translate(
                "Quick counts of materials that may need attention.",
                "أعداد سريعة للمواد التي قد تحتاج إلى متابعة.",
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <AlertPill
            label={translate("No Minimum Set", "عناصر بدون حد طلب")}
            count={overview.noMinimumStockCount}
            tone="info"
          />
          <AlertPill label={translate("Low Stock", "عناصر منخفضة المخزون")} count={overview.lowStockCount} tone="warning" />
          <AlertPill
            label={translate("Out of Stock", "عناصر نفذت من المخزون")}
            count={overview.outOfStockCount}
            tone="neutral"
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================

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

function AlertPill({ label, count, tone }: { label: string; count: number; tone: "neutral" | "warning" | "info" }) {
  const tones = {
    neutral: " bg-stone-50 text-stone-700",
    warning: " bg-amber-50 text-amber-800",
    info: " bg-sky-50 text-sky-800",
  };

  return (
    <div className={`flex flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-semibold">{count}</span>
    </div>
  );
}
