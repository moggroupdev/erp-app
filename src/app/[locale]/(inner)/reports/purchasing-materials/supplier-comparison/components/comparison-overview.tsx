"use client";

import { Boxes, ClipboardList, ShoppingCart } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsSupplierComparison } from "@/types/reports";
import { reportTheme } from "../../components/report-theme";

export default function ComparisonOverview({ data }: { data: PurchasingMaterialsSupplierComparison }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;
  const { a, b } = data.suppliers;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SupplierSummaryCard
          side="a"
          label={translate("Supplier A", "المورد أ")}
          name={a.name}
          code={a.code}
          totalSpend={formatMoney(a.totalSpend, currency)}
          orderCount={a.orderCount}
          materialCount={a.materialCount}
        />
        <SupplierSummaryCard
          side="b"
          label={translate("Supplier B", "المورد ب")}
          name={b.name}
          code={b.code}
          totalSpend={formatMoney(b.totalSpend, currency)}
          orderCount={b.orderCount}
          materialCount={b.materialCount}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={translate("Mutual materials", "المواد المشتركة")}
          value={data.counts.mutual}
          hint={translate("Supplied by both suppliers", "وردها كلا الموردين")}
          icon={<Boxes size={18} />}
        />
        <KpiCard
          label={translate("Only supplier A", "فقط المورد أ")}
          value={data.counts.onlyA}
          hint={translate("Not supplied by B in this period", "لم يوردها ب في هذه الفترة")}
          icon={<ClipboardList size={18} />}
        />
        <KpiCard
          label={translate("Only supplier B", "فقط المورد ب")}
          value={data.counts.onlyB}
          hint={translate("Not supplied by A in this period", "لم يوردها أ في هذه الفترة")}
          icon={<ClipboardList size={18} />}
        />
      </div>
    </div>
  );
}

function SupplierSummaryCard({
  side,
  label,
  name,
  code,
  totalSpend,
  orderCount,
  materialCount,
}: {
  side: "a" | "b";
  label: string;
  name: string;
  code: string;
  totalSpend: string;
  orderCount: number;
  materialCount: number;
}) {
  const { translate } = useI18n();

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[11px] font-semibold text-gray-600">
              {side === "a" ? "A" : "B"}
            </span>
            <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          </div>
          <h3 className="mt-1.5 truncate text-base font-semibold text-gray-800" title={name}>
            {name}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-gray-500">{code}</p>
        </div>

        <div className="shrink-0 sm:text-end">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 sm:justify-end">
            <ShoppingCart size={13} />
            {translate("Total", "الإجمالي")}
          </p>
          <p className={`mt-1 text-lg font-semibold ${reportTheme.kpi.value}`}>{totalSpend}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed border-gray-200 pt-3 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <ClipboardList size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-800">{orderCount}</span>
          <span className="text-xs text-gray-500">{translate("Purchase orders", "أوامر التوريد")}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Boxes size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-800">{materialCount}</span>
          <span className="text-xs text-gray-500">{translate("Item count", "عدد الأصناف")}</span>
        </span>
      </div>
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
    <div className="rounded-3xl bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          <p className={`mt-0.5 text-xl font-semibold ${valueClassName}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
