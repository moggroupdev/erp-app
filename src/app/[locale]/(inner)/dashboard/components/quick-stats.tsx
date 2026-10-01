"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Boxes,
  ClipboardList,
  HandCoins,
  History,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { localeDirections } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatDate } from "@/lib/helpers/date-formaters";
import { chartNeutralColors, semanticPalette } from "@/lib/constants/color-palette";
import { ALL_REPORT_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import { getStockStatusLabel, STOCK_STATUSES } from "@/lib/constants/enums/derived/stock-statuses";
import {
  getProductionSubDepartmentLabel,
  PRODUCTION_SUB_DEPARTMENT_VALUES,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import useHasPermission from "@/hooks/use-has-permission";
import ProtectedLink from "@/components/ui/protected-link";
import ReportCard from "../../reports/materials/components/report-card";
import ReportLinkCard from "../../reports/components/report-link-card";
import type { DashboardPeriod, DashboardPeriodStats, DashboardQuickStats } from "@/types/reports";
import StatusDistribution from "./status-distribution";

const { teal, ochre, clay } = semanticPalette;

export default function QuickStats({ stats, period }: { stats: DashboardQuickStats; period: DashboardPeriod }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;
  const current = stats.periods[period];
  const requisitionTotal = current.requisitions.pending + current.requisitions.approved + current.requisitions.rejected;
  const orderTotal = current.purchaseOrders.open + current.purchaseOrders.completed + current.purchaseOrders.cancelled;
  const permitTotal = current.legacyIssuePermits.active + current.legacyIssuePermits.cancelled;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
          label={translate("Invoice total", "إجمالي الفواتير")}
          value={formatMoney(current.invoices.totalAmount, currency)}
          hint={translate(`${current.invoices.count} invoices`, `${current.invoices.count} فاتورة`)}
          icon={<Wallet size={18} />}
          tone="teal"
          valueClassName="text-haze-800"
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
          label={translate("Issue permits", "أذونات الصرف")}
          value={permitTotal}
          hint={translate(
            `${current.legacyIssuePermits.cancelled} cancelled`,
            `${current.legacyIssuePermits.cancelled} ملغاة`,
          )}
          icon={<History size={18} />}
          tone="clay"
        />
      </div>

      <StatusDistribution stats={current} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <StockHealth stats={current} stock={stats.stock} currency={currency} />
        <RecentPermits permits={stats.recentLegacyIssuePermits} />
      </div>

      <QuickLinks />
    </div>
  );
}

const toneClass = {
  haze: "bg-haze-50 text-haze-700",
  teal: "bg-teal-50 text-teal-700",
  ochre: "bg-ochre-50 text-ochre-700",
  clay: "bg-clay-50 text-clay-700",
  plum: "bg-plum-50 text-plum-700",
} as const;

const accentClass = {
  haze: "bg-haze-600",
  teal: "bg-teal-600",
  ochre: "bg-ochre-600",
  clay: "bg-clay-600",
  plum: "bg-plum-600",
} as const;

function KpiTile({
  label,
  value,
  hint,
  icon,
  tone,
  valueClassName = "text-gray-800",
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  tone: keyof typeof toneClass;
  valueClassName?: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-b-3xl bg-white p-5 sm:p-6">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass[tone]}`} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">{hint}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass[tone]}`}>{icon}</div>
      </div>
    </article>
  );
}

function StockHealth({
  stats,
  stock,
  currency,
}: {
  stats: DashboardPeriodStats;
  stock: DashboardQuickStats["stock"];
  currency: string;
}) {
  const { locale, translate } = useI18n();
  const dir = localeDirections[locale];
  const slices = [
    {
      key: STOCK_STATUSES.IN_STOCK,
      name: getStockStatusLabel(STOCK_STATUSES.IN_STOCK, locale),
      count: stock.inStock,
      color: teal[600],
    },
    {
      key: STOCK_STATUSES.LOW_STOCK,
      name: getStockStatusLabel(STOCK_STATUSES.LOW_STOCK, locale),
      count: stock.lowStock,
      color: ochre[600],
    },
    {
      key: STOCK_STATUSES.OUT_OF_STOCK,
      name: getStockStatusLabel(STOCK_STATUSES.OUT_OF_STOCK, locale),
      count: stock.outOfStock,
      color: clay[600],
    },
  ];
  const chartData = slices.filter((item) => item.count > 0);
  const total = slices.reduce((sum, item) => sum + item.count, 0);

  return (
    <ReportCard
      title={translate("Current stock", "المخزون الحالي")}
      description={translate(
        "On-hand quantity and value, independent of the period.",
        "الكمية والقيمة المتاحة الآن، بغض النظر عن الفترة.",
      )}
      icon={ShieldCheck}
      accent="teal"
      className="h-full"
    >
      <div className="flex flex-col gap-5">
        <p className="text-haze-800 text-2xl font-semibold tracking-tight">{formatMoney(stock.inventoryValue, currency)}</p>

        <div className="grid items-center gap-4 lg:grid-cols-[11rem_1fr]">
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
          ) : (
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    stroke="none"
                  >
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
                    contentStyle={{ borderRadius: 12, border: `1px solid ${chartNeutralColors[2]}`, direction: dir }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold text-gray-800">{total}</span>
                <span className="text-[11px] text-gray-500">{translate("Materials", "مواد")}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <StockPill label={getStockStatusLabel(STOCK_STATUSES.IN_STOCK, locale)} count={stock.inStock} tone="teal" />
            <StockPill label={getStockStatusLabel(STOCK_STATUSES.LOW_STOCK, locale)} count={stock.lowStock} tone="ochre" />
            <StockPill
              label={getStockStatusLabel(STOCK_STATUSES.OUT_OF_STOCK, locale)}
              count={stock.outOfStock}
              tone="clay"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      </div>
    </ReportCard>
  );
}

function StockPill({ label, count, tone }: { label: string; count: number; tone: "teal" | "ochre" | "clay" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-800",
    ochre: "bg-ochre-50 text-ochre-800",
    clay: "bg-clay-50 text-clay-800",
  };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-semibold">{count}</span>
    </div>
  );
}

function RecentPermits({ permits }: { permits: DashboardQuickStats["recentLegacyIssuePermits"] }) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("Recent issue permits", "أحدث أذونات الصرف")}
      description={translate("Latest permits by date.", "أحدث الأذونات حسب التاريخ.")}
      icon={History}
      accent="gray"
      className="h-full"
    >
      {permits.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{translate("No data", "لا توجد بيانات")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {permits.map((permit) => (
            <li key={permit.id}>
              <ProtectedLink
                permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                href={`/warehouse/legacy-issue-permits/${permit.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-gray-800">{permit.issuePermitNumber}</span>
                  <span className="truncate text-xs text-gray-500">
                    {departmentLabel(permit.productionSubDepartment, locale, translate)}
                    {permit.contractNumber ? ` · ${permit.contractNumber}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-end">
                  <span className="text-xs text-gray-500">{formatDate(permit.date, locale)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      permit.isCancelled ? "bg-clay-50 text-clay-700" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {permit.isCancelled ? translate("Cancelled", "ملغاة") : translate("Active", "سارية")}
                  </span>
                </div>
              </ProtectedLink>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
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

const SHORTCUTS: {
  permission: Permission | readonly Permission[];
  label: { en: string; ar: string };
  description: { en: string; ar: string };
  href: string;
}[] = [
  {
    permission: ALL_REPORT_PERMISSIONS,
    label: { en: "Reports", ar: "التقارير" },
    description: { en: "Inventory and purchasing reports.", ar: "تقارير المخزون والمشتريات." },
    href: "/reports",
  },
  {
    permission: PERMISSIONS.READ_MATERIAL_INVENTORY_SUMMARY_REPORT,
    label: { en: "Inventory summary", ar: "ملخص المخزون" },
    description: { en: "Stock value and material health.", ar: "قيمة المخزون وحالة المواد." },
    href: "/reports/materials/inventory-summary",
  },
  {
    permission: PERMISSIONS.READ_MATERIAL_PURCHASE_REQUISITIONS,
    label: { en: "Purchase requisitions", ar: "طلبات شراء الخامات" },
    description: { en: "Open the requisition list.", ar: "الانتقال إلى قائمة طلبات الشراء." },
    href: "/procurement/material-requisitions",
  },
  {
    permission: PERMISSIONS.READ_LEGACY_ISSUE_PERMITS,
    label: { en: "Issue permits", ar: "أذونات الصرف" },
    description: { en: "Open the legacy issue permit list.", ar: "الانتقال إلى قائمة أذونات الصرف." },
    href: "/warehouse/legacy-issue-permits",
  },
];

function QuickLinks() {
  const { translate } = useI18n();
  const allowed = [
    useHasPermission(SHORTCUTS[0].permission),
    useHasPermission(SHORTCUTS[1].permission),
    useHasPermission(SHORTCUTS[2].permission),
    useHasPermission(SHORTCUTS[3].permission),
  ];
  const visible = SHORTCUTS.filter((_, index) => allowed[index]);

  if (visible.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-800">{translate("Shortcuts", "اختصارات")}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((item) => (
          <ReportLinkCard key={item.href} report={item} />
        ))}
      </div>
    </section>
  );
}
