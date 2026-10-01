"use client";

import type { ReactNode } from "react";
import { Boxes, ClipboardList, HandCoins, History, PackageSearch, ShieldCheck, ShoppingCart, Users, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatDate } from "@/lib/helpers/date-formaters";
import { semanticPalette } from "@/lib/constants/color-palette";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getStockStatusLabel, STOCK_STATUSES } from "@/lib/constants/enums/derived/stock-statuses";
import {
  getProductionSubDepartmentLabel,
  PRODUCTION_SUB_DEPARTMENT_VALUES,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import ProtectedLink from "@/components/ui/protected-link";
import type { DashboardPeriod, DashboardPeriodStats, DashboardQuickStats } from "@/types/reports";
import StatusDonut from "./status-donut";

const { haze, teal, ochre, clay, plum } = semanticPalette;

export default function QuickStats({ stats, period }: { stats: DashboardQuickStats; period: DashboardPeriod }) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const current = stats.periods[period];
  const requisitionTotal = current.requisitions.pending + current.requisitions.approved + current.requisitions.rejected;
  const orderTotal = current.purchaseOrders.open + current.purchaseOrders.completed + current.purchaseOrders.cancelled;
  const permitTotal = current.legacyIssuePermits.active + current.legacyIssuePermits.cancelled;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KpiTile
          label={translate("New customers", "عملاء جدد")}
          value={current.customersCreated}
          hint={translate("Created in this period.", "أُضيفوا خلال هذه الفترة.")}
          icon={<Users size={18} />}
          tone="haze"
        />
        <KpiTile
          label={translate("New suppliers", "موردون جدد")}
          value={current.suppliersCreated}
          hint={translate("Created in this period.", "أُضيفوا خلال هذه الفترة.")}
          icon={<HandCoins size={18} />}
          tone="plum"
        />
        <KpiTile
          label={translate("Requisitions", "طلبات الشراء")}
          value={requisitionTotal}
          hint={translate(`${current.requisitions.pending} pending`, `${current.requisitions.pending} قيد الانتظار`)}
          icon={<ClipboardList size={18} />}
          tone="ochre"
        />
        <KpiTile
          label={translate("Purchase orders", "أوامر التوريد")}
          value={orderTotal}
          hint={translate(`${current.purchaseOrders.open} open`, `${current.purchaseOrders.open} مفتوحة`)}
          icon={<ShoppingCart size={18} />}
          tone="haze"
        />
        <KpiTile
          label={translate("Invoice total", "إجمالي الفواتير")}
          value={formatMoney(current.invoices.totalAmount, currency)}
          hint={translate(`${current.invoices.count} invoices`, `${current.invoices.count} فاتورة`)}
          icon={<Wallet size={18} />}
          tone="teal"
        />
        <KpiTile
          label={translate("Issue permits", "أذونات الصرف")}
          value={permitTotal}
          hint={translate(`${current.legacyIssuePermits.cancelled} cancelled`, `${current.legacyIssuePermits.cancelled} ملغاة`)}
          icon={<History size={18} />}
          tone="clay"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <StatusDonut
          title={translate("Requisition status", "حالة طلبات الشراء")}
          description={translate("Current approval state of requisitions created in this period.", "حالة الموافقة الحالية للطلبات المُنشأة خلال هذه الفترة.")}
          icon={<ClipboardList size={18} />}
          data={[
            { key: "pending", name: translate("Pending", "قيد الانتظار"), count: current.requisitions.pending, color: ochre[600] },
            { key: "approved", name: translate("Approved", "معتمدة"), count: current.requisitions.approved, color: teal[600] },
            { key: "rejected", name: translate("Rejected", "مرفوضة"), count: current.requisitions.rejected, color: clay[600] },
          ]}
        />
        <StatusDonut
          title={translate("Order status", "حالة أوامر التوريد")}
          description={translate("Current state of purchase orders created in this period.", "الحالة الحالية لأوامر التوريد المُنشأة خلال هذه الفترة.")}
          icon={<ShoppingCart size={18} />}
          data={[
            { key: "open", name: translate("Open", "مفتوحة"), count: current.purchaseOrders.open, color: haze[600] },
            { key: "completed", name: translate("Completed", "مكتملة"), count: current.purchaseOrders.completed, color: teal[600] },
            { key: "cancelled", name: translate("Cancelled", "ملغاة"), count: current.purchaseOrders.cancelled, color: clay[600] },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <StockCard stats={current} stock={stats.stock} currency={currency} />
        <RecentPermits permits={stats.recentLegacyIssuePermits} locale={locale} />
      </div>
    </div>
  );
}

function StockCard({
  stats,
  stock,
  currency,
}: {
  stats: DashboardPeriodStats;
  stock: DashboardQuickStats["stock"];
  currency: string;
}) {
  const { locale, translate } = useI18n();

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
            <ShieldCheck size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-gray-800">{translate("Current stock", "المخزون الحالي")}</h2>
            <p className="text-xs text-gray-500">
              {translate("On-hand quantity and value, independent of the period.", "الكمية والقيمة المتاحة الآن، بغض النظر عن الفترة.")}
            </p>
          </div>
        </div>
      </header>

      <p className="text-2xl font-semibold text-haze-700">{formatMoney(stock.inventoryValue, currency)}</p>

      <StatusDonut
        embedded
        data={[
          { key: STOCK_STATUSES.IN_STOCK, name: getStockStatusLabel(STOCK_STATUSES.IN_STOCK, locale), count: stock.inStock, color: teal[600] },
          { key: STOCK_STATUSES.LOW_STOCK, name: getStockStatusLabel(STOCK_STATUSES.LOW_STOCK, locale), count: stock.lowStock, color: ochre[600] },
          {
            key: STOCK_STATUSES.OUT_OF_STOCK,
            name: getStockStatusLabel(STOCK_STATUSES.OUT_OF_STOCK, locale),
            count: stock.outOfStock,
            color: clay[600],
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <MiniStat
          icon={<Boxes size={16} />}
          label={translate("Materials added", "مواد مضافة")}
          value={stats.materialsCreated}
        />
        <MiniStat
          icon={<PackageSearch size={16} />}
          label={translate("Products added", "منتجات مضافة")}
          value={stats.productsCreated}
        />
      </div>
    </section>
  );
}

function RecentPermits({
  permits,
  locale,
}: {
  permits: DashboardQuickStats["recentLegacyIssuePermits"];
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  const { translate } = useI18n();

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
          <History size={18} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-800">{translate("Recent issue permits", "أحدث أذونات الصرف")}</h2>
          <p className="text-xs text-gray-500">{translate("Latest permits by date.", "أحدث الأذونات حسب التاريخ.")}</p>
        </div>
      </header>

      {permits.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {permits.map((permit) => (
            <li key={permit.id}>
              <ProtectedLink
                permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                href={`/warehouse/legacy-issue-permits/${permit.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-gray-800">{permit.issuePermitNumber}</span>
                  <span className="truncate text-xs text-gray-500">
                    {departmentLabel(permit.productionSubDepartment, locale, translate)}
                    {permit.contractNumber ? ` · ${permit.contractNumber}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-gray-500">{formatDate(permit.date, locale)}</span>
                  {permit.isCancelled && (
                    <span className="text-xs font-medium text-clay-700">{translate("Cancelled", "ملغاة")}</span>
                  )}
                </div>
              </ProtectedLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function departmentLabel(
  value: string | null,
  locale: ReturnType<typeof useI18n>["locale"],
  translate: (en: string, ar: string) => string,
) {
  if (!value) return translate("Not set", "غير محدد");
  if ((PRODUCTION_SUB_DEPARTMENT_VALUES as readonly string[]).includes(value)) {
    return getProductionSubDepartmentLabel(value as ProductionSubDepartment, locale);
  }
  return value;
}

const toneClass = {
  haze: "bg-haze-50 text-haze-700",
  teal: "bg-teal-50 text-teal-700",
  ochre: "bg-ochre-50 text-ochre-700",
  clay: "bg-clay-50 text-clay-700",
  plum: "bg-plum-50 text-plum-700",
} as const;

function KpiTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  tone: keyof typeof toneClass;
}) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass[tone]}`}>{icon}</div>
      <p className="mt-4 text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
      <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-gray-500">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
      </div>
    </div>
  );
}
