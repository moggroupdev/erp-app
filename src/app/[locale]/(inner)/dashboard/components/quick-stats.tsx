"use client";

import type { ReactNode } from "react";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  HandCoins,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { DashboardQuickStats } from "@/types/reports";

export default function QuickStats({ stats }: { stats: DashboardQuickStats }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <div className="flex flex-col gap-8">
      <StatsGroup
        title={translate("Directory", "الدليل")}
        description={translate("Customers and suppliers currently on file.", "العملاء والموردون المسجلون حالياً.")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricTile
            label={translate("Customers", "العملاء")}
            value={stats.directory.customers.total}
            hint={translate(
              `${stats.directory.customers.blacklisted} blacklisted`,
              `${stats.directory.customers.blacklisted} في القائمة السوداء`,
            )}
            icon={<Users size={18} />}
          />
          <MetricTile
            label={translate("Suppliers", "الموردون")}
            value={stats.directory.suppliers.total}
            hint={translate(
              `${stats.directory.suppliers.blacklisted} blacklisted`,
              `${stats.directory.suppliers.blacklisted} في القائمة السوداء`,
            )}
            icon={<HandCoins size={18} />}
          />
        </div>
      </StatsGroup>

      <StatsGroup
        title={translate("Catalog and stock", "الكتالوج والمخزون")}
        description={translate(
          "Active materials and products, with current stock value.",
          "المواد والمنتجات النشطة، مع قيمة المخزون الحالية.",
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricTile
            label={translate("Materials", "المواد")}
            value={stats.catalog.materials.total}
            hint={translate("Active materials in the catalog.", "المواد النشطة في سجل المواد.")}
            icon={<Boxes size={18} />}
          />
          <MetricTile
            label={translate("Products", "المنتجات")}
            value={stats.catalog.products.total}
            hint={translate("Active products in the catalog.", "المنتجات النشطة في الكتالوج.")}
            icon={<PackageSearch size={18} />}
          />
          <MetricTile
            label={translate("Inventory value", "قيمة المخزون")}
            value={formatMoney(stats.catalog.materials.inventoryValue, currency)}
            hint={translate("Quantity times unit price.", "الكمية مضروبة في سعر الوحدة.")}
            icon={<Wallet size={18} />}
            valueClassName="text-haze-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricTile
            label={translate("Low stock", "مخزون منخفض")}
            value={stats.catalog.materials.lowStock}
            hint={translate("Above zero and at or below the minimum.", "أعلى من الصفر وعند حد الطلب أو دونه.")}
            icon={<TriangleAlert size={18} />}
            valueClassName="text-ochre-700"
          />
          <MetricTile
            label={translate("Out of stock", "نفد من المخزون")}
            value={stats.catalog.materials.outOfStock}
            hint={translate("Quantity is zero.", "الكمية تساوي صفراً.")}
            icon={<XCircle size={18} />}
            valueClassName="text-clay-700"
          />
        </div>
      </StatsGroup>

      <StatsGroup
        title={translate("Procurement", "المشتريات")}
        description={translate(
          "Material requisitions, purchase orders, and linked invoices.",
          "طلبات شراء الخامات وأوامر التوريد والفواتير المرتبطة بها.",
        )}
      >
        <StatusRow title={translate("Requisitions", "طلبات الشراء")}>
          <MetricTile
            label={translate("Pending", "قيد الانتظار")}
            value={stats.procurement.requisitions.pending}
            hint={translate("Waiting on one or more approvals.", "بانتظار موافقة واحدة أو أكثر.")}
            icon={<Clock size={18} />}
            valueClassName="text-ochre-700"
          />
          <MetricTile
            label={translate("Approved", "معتمدة")}
            value={stats.procurement.requisitions.approved}
            hint={translate("All three approvals granted.", "تمت الموافقات الثلاث.")}
            icon={<CheckCircle2 size={18} />}
            valueClassName="text-teal-700"
          />
          <MetricTile
            label={translate("Rejected", "مرفوضة")}
            value={stats.procurement.requisitions.rejected}
            hint={translate("At least one approval was rejected.", "رُفضت موافقة واحدة على الأقل.")}
            icon={<XCircle size={18} />}
            valueClassName="text-clay-700"
          />
        </StatusRow>

        <StatusRow title={translate("Purchase orders", "أوامر التوريد")}>
          <MetricTile
            label={translate("Open", "مفتوحة")}
            value={stats.procurement.purchaseOrders.open}
            hint={translate("Not completed or cancelled.", "لم تكتمل ولم تُلغَ.")}
            icon={<ShoppingCart size={18} />}
          />
          <MetricTile
            label={translate("Completed", "مكتملة")}
            value={stats.procurement.purchaseOrders.completed}
            hint={translate("Fully received.", "تم استلامها بالكامل.")}
            icon={<CheckCircle2 size={18} />}
            valueClassName="text-teal-700"
          />
          <MetricTile
            label={translate("Cancelled", "ملغاة")}
            value={stats.procurement.purchaseOrders.cancelled}
            hint={translate("Cancelled before completion.", "أُلغيت قبل الاكتمال.")}
            icon={<XCircle size={18} />}
            valueClassName="text-clay-700"
          />
        </StatusRow>

        <StatusRow title={translate("Invoices", "الفواتير")} columns={2}>
          <MetricTile
            label={translate("Invoice count", "عدد الفواتير")}
            value={stats.procurement.invoices.count}
            hint={translate("Linked to material purchase orders.", "مرتبطة بأوامر توريد الخامات.")}
            icon={<ClipboardList size={18} />}
          />
          <MetricTile
            label={translate("Invoice total", "إجمالي الفواتير")}
            value={formatMoney(stats.procurement.invoices.totalAmount, currency)}
            hint={translate("Sum of invoice totals.", "مجموع إجمالي الفواتير.")}
            icon={<ReceiptText size={18} />}
            valueClassName="text-haze-700"
          />
        </StatusRow>
      </StatsGroup>
    </div>
  );
}

function StatsGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function StatusRow({ title, columns = 3, children }: { title: string; columns?: 2 | 3; children: ReactNode }) {
  const gridClass = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">{title}</h3>
      <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>{children}</div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon,
  valueClassName = "text-gray-800",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600">{icon}</div>
      <p className="mt-4 text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
