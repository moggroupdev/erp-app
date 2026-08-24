import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type {
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsBySupplier,
  PurchasingMaterialsCategoryOrder,
  PurchasingMaterialsCategoryStatsOverview,
} from "@/types/reports";

export default function PurchasingMaterialsCategoryStatsPrintDocument({
  title,
  categoryTitle,
  startDate,
  endDate,
  overview,
  suppliers,
  orders,
  materials,
  suppliersSortLabel,
  ordersSortLabel,
  materialsSortLabel,
}: {
  title: string;
  categoryTitle: string;
  startDate?: string | null;
  endDate?: string | null;
  overview: PurchasingMaterialsCategoryStatsOverview;
  suppliers: PurchasingMaterialsBySupplier[];
  orders: PurchasingMaterialsCategoryOrder[];
  materials: PurchasingMaterialsByMaterial[];
  suppliersSortLabel: string;
  ordersSortLabel: string;
  materialsSortLabel: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const totalSupplierOrders = suppliers.reduce((sum, row) => sum + row.orderCount, 0);
  const totalSupplierSpend = suppliers.reduce((sum, row) => sum + row.totalSpend, 0);
  const avgSupplierOrderValue = totalSupplierOrders === 0 ? 0 : totalSupplierSpend / totalSupplierOrders;
  const totalOrderAmount = orders.reduce((sum, row) => sum + row.legacyInvoiceTotalPurchases, 0);
  const totalMaterialQuantity = materials.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalMaterialSpend = materials.reduce((sum, row) => sum + row.totalSpend, 0);

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Purchases Report", "تقرير المشتريات")}
          </p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
        <PrintDetail label={translate("Main Category", "الفئة الرئيسية")} value={categoryTitle} />
        <PrintDetail label={translate("Total Value", "إجمالي القيمة")} value={formatMoney(overview.totalSpend, currency)} />
        <PrintDetail label={translate("Total Invoices", "إجمالي الفواتير")} value={String(overview.totalOrders)} />
        <PrintDetail
          label={translate("Average Order Value", "متوسط قيمة الطلب")}
          value={formatMoney(overview.avgOrderValue, currency)}
        />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Suppliers", "الموردون")}
          subtitle={translate(`Sorted by: ${suppliersSortLabel}`, `مرتّب حسب: ${suppliersSortLabel}`)}
        />
        <PrintTable
          headers={[
            "#",
            translate("Supplier", "المورد"),
            translate("Code", "الكود"),
            translate("Invoices", "الفواتير"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate(`Avg Order (${currency})`, `متوسط الطلب (${currency})`),
          ]}
          rows={suppliers.map((row, index) => [
            String(index + 1),
            row.supplierName,
            row.supplierCode,
            String(row.orderCount),
            formatMoney(row.totalSpend),
            formatMoney(row.avgOrderValue),
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            "",
            String(totalSupplierOrders),
            formatMoney(totalSupplierSpend),
            formatMoney(avgSupplierOrderValue),
          ]}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Purchase Orders", "أوامر الشراء")}
          subtitle={translate(`Sorted by: ${ordersSortLabel}`, `مرتّب حسب: ${ordersSortLabel}`)}
        />
        <PrintTable
          headers={[
            "#",
            translate("Code", "الكود"),
            translate("Invoice Number", "رقم الفاتورة"),
            translate("Invoice Date", "تاريخ الفاتورة"),
            translate("Addition Permit Numbers", "أرقام إذن الإضافة"),
            translate("Supplier", "المورد"),
            translate("Status", "الحالة"),
            translate(`Amount (${currency})`, `المبلغ (${currency})`),
          ]}
          rows={orders.map((row, index) => [
            String(index + 1),
            row.orderCode,
            row.legacyInvoiceNumber ?? "-",
            row.legacyInvoiceIssuedAt ? formatDate(row.legacyInvoiceIssuedAt, locale) : "-",
            row.inventoryTransactionLegacyNumbers.length > 0
              ? row.inventoryTransactionLegacyNumbers.join(", ")
              : "-",
            row.supplierName,
            row.completedAt ? translate("Completed", "مكتمل") : translate("Open", "مفتوح"),
            formatMoney(row.legacyInvoiceTotalPurchases),
          ])}
          footerRow={["", translate("Total", "الإجمالي"), "", "", "", "", "", formatMoney(totalOrderAmount)]}
          monoColumnIndexes={[1, 2, 4]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Purchased Materials", "المواد المشتراة")}
          subtitle={translate(`Sorted by: ${materialsSortLabel}`, `مرتّب حسب: ${materialsSortLabel}`)}
        />
        <PrintTable
          headers={[
            "#",
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Qty Ordered", "الكمية المطلوبة"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate(`Avg Unit Price (${currency})`, `متوسط سعر الوحدة (${currency})`),
          ]}
          rows={materials.map((row, index) => [
            String(index + 1),
            row.materialTitle,
            row.materialCode,
            getMaterialUnitLabel(row.unitOfMeasurement, locale),
            formatQuantity(row.totalQuantity),
            formatMoney(row.totalSpend),
            formatMoney(row.avgUnitPrice),
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            "",
            "",
            formatQuantity(totalMaterialQuantity),
            formatMoney(totalMaterialSpend),
            "",
          ]}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
