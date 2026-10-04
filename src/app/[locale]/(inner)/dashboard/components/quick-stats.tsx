"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  Banknote,
  HandCoins,
  History,
  LayoutGrid,
  PackageSearch,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
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
import type { DashboardPeriod, DashboardPeriodStats, DashboardQuickStats } from "@/types/reports";
import DashboardPanel from "./dashboard-panel";
import StatusDistribution from "./status-distribution";

const { teal, ochre, clay } = semanticPalette;

const SHORTCUTS: {
  permission: Permission | readonly Permission[];
  label: { en: string; ar: string };
  description: { en: string; ar: string };
  href: string;
  icon: typeof FileBarChart;
}[] = [
  {
    permission: ALL_REPORT_PERMISSIONS,
    label: { en: "Reports", ar: "التقارير" },
    description: { en: "Inventory and purchasing reports.", ar: "تقارير المخزون والمشتريات." },
    href: "/reports",
    icon: FileBarChart,
  },
  {
    permission: PERMISSIONS.READ_MATERIALS,
    label: { en: "Materials list", ar: "قائمة المواد" },
    description: { en: "Open the warehouse materials list.", ar: "الانتقال إلى قائمة مواد المخزن." },
    href: "/warehouse/materials",
    icon: Boxes,
  },
  {
    permission: PERMISSIONS.READ_PRODUCTS,
    label: { en: "Product catalog", ar: "كتالوج المنتجات" },
    description: { en: "Open the product catalog.", ar: "الانتقال إلى كتالوج المنتجات." },
    href: "/products",
    icon: PackageSearch,
  },
  {
    permission: PERMISSIONS.READ_MATERIAL_PURCHASE_REQUISITIONS,
    label: { en: "Purchase requisitions", ar: "طلبات شراء الخامات" },
    description: { en: "Open the requisition list.", ar: "الانتقال إلى قائمة طلبات الشراء." },
    href: "/procurement/material-requisitions",
    icon: ClipboardList,
  },
  {
    permission: PERMISSIONS.READ_LEGACY_ISSUE_PERMITS,
    label: { en: "Issue permits", ar: "أذونات الصرف" },
    description: { en: "Open the legacy issue permit list.", ar: "الانتقال إلى قائمة أذونات الصرف." },
    href: "/warehouse/legacy-issue-permits",
    icon: ScrollText,
  },
];

function useVisibleShortcuts() {
  const reports = useHasPermission(SHORTCUTS[0].permission);
  const materials = useHasPermission(SHORTCUTS[1].permission);
  const products = useHasPermission(SHORTCUTS[2].permission);
  const requisitions = useHasPermission(SHORTCUTS[3].permission);
  const permits = useHasPermission(SHORTCUTS[4].permission);
  const allowed = [reports, materials, products, requisitions, permits];
  return SHORTCUTS.filter((_, index) => allowed[index]);
}

export default function QuickStats({ stats, period }: { stats: DashboardQuickStats; period: DashboardPeriod }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;
  const current = stats.periods[period];
  const shortcuts = useVisibleShortcuts();
  const requisitionTotal = current.requisitions.pending + current.requisitions.approved + current.requisitions.rejected;
  const orderTotal = current.purchaseOrders.open + current.purchaseOrders.completed + current.purchaseOrders.cancelled;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiTile
          label={translate("Requisitions", "طلبات الشراء")}
          value={requisitionTotal}
          hint={translate(`${current.requisitions.pending} pending`, `${current.requisitions.pending} قيد الانتظار`)}
          icon={<ClipboardList size={18} />}
          tone="teal"
        />
        <KpiTile
          label={translate("Purchase orders", "أوامر التوريد")}
          value={orderTotal}
          hint={translate(`${current.purchaseOrders.open} open`, `${current.purchaseOrders.open} مفتوحة`)}
          icon={<ShoppingCart size={18} />}
          tone="clay"
        />
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
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <StatusDistribution stats={current} />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <StockHealth stats={current} stock={stats.stock} currency={currency} />
        </div>
        <div className={shortcuts.length > 0 ? "min-w-0 xl:col-span-8" : "min-w-0 xl:col-span-12"}>
          <RecentPermits permits={stats.recentLegacyIssuePermits} />
        </div>
        {shortcuts.length > 0 && (
          <div className="min-w-0 xl:col-span-4">
            <QuickLinks shortcuts={shortcuts} />
          </div>
        )}
      </div>
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
    <article className="relative min-w-0 overflow-hidden rounded-b-3xl bg-white p-4 xl:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass[tone]}`} />

      <div className="relative flex min-w-0 flex-col gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[11px] leading-snug font-medium tracking-wide text-gray-500 uppercase sm:text-xs">
            {label}
          </p>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 xl:h-7 xl:w-7 2xl:h-9 2xl:w-9 [&_svg]:size-3.5 sm:[&_svg]:size-4 2xl:[&_svg]:size-[18px] ${toneClass[tone]}`}
          >
            {icon}
          </div>
        </div>
        <p
          className={`text-xl leading-none font-semibold tracking-tight wrap-break-word sm:text-2xl xl:text-lg 2xl:text-2xl ${valueClassName}`}
        >
          {value}
        </p>
        <p className="text-[11px] leading-snug text-gray-500 sm:text-xs">{hint}</p>
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
      bar: "bg-teal-600",
    },
    {
      key: STOCK_STATUSES.LOW_STOCK,
      name: getStockStatusLabel(STOCK_STATUSES.LOW_STOCK, locale),
      count: stock.lowStock,
      color: ochre[600],
      bar: "bg-ochre-600",
    },
    {
      key: STOCK_STATUSES.OUT_OF_STOCK,
      name: getStockStatusLabel(STOCK_STATUSES.OUT_OF_STOCK, locale),
      count: stock.outOfStock,
      color: clay[600],
      bar: "bg-clay-600",
    },
  ];
  const chartData = slices.filter((item) => item.count > 0);
  const total = slices.reduce((sum, item) => sum + item.count, 0);

  return (
    <DashboardPanel
      title={translate("Current stock", "المخزون الحالي")}
      description={translate(
        "On-hand quantity and value, independent of the period.",
        "الكمية والقيمة المتاحة الآن، بغض النظر عن الفترة.",
      )}
      icon={ShieldCheck}
      accent="teal"
    >
      <div className="flex h-full flex-col gap-5">
        <InventoryValueHighlight value={stock.inventoryValue} currency={currency} translate={translate} />

        <div className="grid items-center gap-4 sm:grid-cols-[9.5rem_1fr]">
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 sm:col-span-2">
              {translate("No stocked materials.", "لا توجد مواد في المخزون.")}
            </p>
          ) : (
            <>
              <div className="relative mx-auto h-36 w-full max-w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
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
                  <span className="text-lg font-semibold text-gray-800">{total}</span>
                  <span className="text-[11px] text-gray-500">{translate("Items", "صنف")}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {slices.map((slice) => (
                  <StockMeter
                    key={slice.key}
                    label={slice.name}
                    count={slice.count}
                    total={total}
                    color={slice.color}
                    barClassName={slice.bar}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
          <MiniStat
            icon={<Boxes size={15} />}
            label={translate("New Materials", "مواد جديدة")}
            value={stats.materialsCreated}
          />
          <MiniStat
            icon={<PackageSearch size={15} />}
            label={translate("New Products", "منتجات جديدة")}
            value={stats.productsCreated}
          />
        </div>
      </div>
    </DashboardPanel>
  );
}

function InventoryValueHighlight({
  value,
  currency,
  translate,
}: {
  value: number;
  currency: string;
  translate: (en: string, ar: string) => string;
}) {
  const amount = formatMoney(value);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-teal-50/45 px-2.5 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
        <Banknote size={14} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
        <span className="truncate text-[10px] font-medium tracking-wide text-teal-900/55 uppercase sm:text-[11px]">
          {translate("Inventory value", "قيمة المخزون")}
        </span>
        <p className="shrink-0 leading-none">
          <span className="text-base font-semibold tracking-tight text-gray-900 tabular-nums sm:text-lg">{amount}</span>
          {currency ? <span className="ms-1 text-[10px] font-medium text-gray-500 sm:text-[11px]">{currency}</span> : null}
        </p>
      </div>
    </div>
  );
}

function StockMeter({
  label,
  count,
  total,
  color,
  barClassName,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  barClassName: string;
}) {
  const width = total > 0 ? Math.max((count / total) * 100, count > 0 ? 4 : 0) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-gray-600">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate">{label}</span>
        </span>
        <span className="font-semibold text-gray-800">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function RecentPermits({ permits }: { permits: DashboardQuickStats["recentLegacyIssuePermits"] }) {
  const { locale, translate } = useI18n();

  return (
    <DashboardPanel
      title={translate("Recent issue permits", "أحدث أذونات الصرف")}
      description={translate("Latest permits by date.", "أحدث الأذونات حسب التاريخ.")}
      icon={History}
      accent="gray"
      trailing={
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{permits.length}</span>
      }
    >
      {permits.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <History size={18} />
          </div>
          <p className="text-sm text-gray-500">{translate("No issue permits yet.", "لا توجد أذونات صرف بعد.")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {permits.map((permit) => (
            <li key={permit.id}>
              <ProtectedLink
                permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                href={`/warehouse/legacy-issue-permits/${permit.id}`}
                className="group hover:border-haze-200 flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-3 py-3 transition-colors hover:bg-white"
              >
                <span
                  className={`h-9 w-1 shrink-0 rounded-full ${permit.isCancelled ? "bg-clay-600" : "bg-teal-600"}`}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="group-hover:text-haze-800 truncate text-sm font-semibold text-gray-800">
                      {permit.issuePermitNumber}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {departmentLabel(permit.productionSubDepartment, locale, translate)}
                      {permit.contractNumber ? ` · ${permit.contractNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                    <span className="text-xs text-gray-500">{formatDate(permit.date, locale)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        permit.isCancelled ? "bg-clay-50 text-clay-700" : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {permit.isCancelled ? translate("Cancelled", "ملغاة") : translate("Active", "سارية")}
                    </span>
                  </div>
                </div>
              </ProtectedLink>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
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
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function QuickLinks({ shortcuts }: { shortcuts: typeof SHORTCUTS }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const isRtl = localeDirections[locale] === "rtl";

  return (
    <DashboardPanel
      title={translate("Shortcuts", "اختصارات")}
      description={translate("Open a related list or report.", "الانتقال إلى قائمة أو تقرير مرتبط.")}
      icon={LayoutGrid}
      accent="sky"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={getLocalizedHref(item.href)}
              className="group hover:border-haze-200 hover:bg-haze-50/60 flex items-center gap-3 rounded-2xl border border-gray-100 px-3 py-3 transition-colors"
            >
              <span className="group-hover:text-haze-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors group-hover:bg-white">
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="group-hover:text-haze-800 block truncate text-sm font-medium text-gray-800">
                  {translate(item.label.en, item.label.ar)}
                </span>
                <span className="mt-1 block truncate text-xs text-gray-500">
                  {translate(item.description.en, item.description.ar)}
                </span>
              </span>
              <ChevronRight
                size={16}
                className={`group-hover:text-haze-600 shrink-0 text-gray-300 ${isRtl ? "rotate-180" : ""}`}
              />
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
