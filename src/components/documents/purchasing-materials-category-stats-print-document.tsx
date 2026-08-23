import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type {
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsBySupplier,
  PurchasingMaterialsCategoryStatsOverview,
  PurchasingMaterialsSupplierInvoiceCount,
  PurchasingMaterialsTopOrder,
} from "@/types/reports";

export default function PurchasingMaterialsCategoryStatsPrintDocument({
  title,
  categoryTitle,
  startDate,
  endDate,
  overview,
  bySupplier,
  topSuppliersByInvoiceCount,
  latestInvoices,
  topMaterials,
}: {
  title: string;
  categoryTitle: string;
  startDate?: string | null;
  endDate?: string | null;
  overview: PurchasingMaterialsCategoryStatsOverview;
  bySupplier: PurchasingMaterialsBySupplier[];
  topSuppliersByInvoiceCount: PurchasingMaterialsSupplierInvoiceCount[];
  latestInvoices: PurchasingMaterialsTopOrder[];
  topMaterials: PurchasingMaterialsByMaterial[];
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

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
        <PrintDetail label={translate("Total Spend", "إجمالي الإنفاق")} value={formatMoney(overview.totalSpend, currency)} />
        <PrintDetail label={translate("Total Orders", "إجمالي الطلبات")} value={String(overview.totalOrders)} />
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

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Top Suppliers by Spend", "أعلى الموردين إنفاقاً")}
          subtitle={translate(
            "Suppliers ranked by total purchase order value within this category.",
            "الموردون مرتبون حسب إجمالي قيمة أوامر الشراء ضمن هذه الفئة.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Supplier", "المورد"),
            translate("Code", "الكود"),
            translate("Orders", "الطلبات"),
            translate(`Total Spend (${currency})`, `إجمالي الإنفاق (${currency})`),
            translate(`Avg Order (${currency})`, `متوسط الطلب (${currency})`),
          ]}
          rows={bySupplier.map((row, index) => [
            String(index + 1),
            row.supplierName,
            row.supplierCode,
            String(row.orderCount),
            formatMoney(row.totalSpend),
            formatMoney(row.avgOrderValue),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Most Invoices by Supplier", "أكثر الموردين فواتير")}
          subtitle={translate(
            "Suppliers ranked by number of purchase orders containing materials from this category.",
            "الموردون مرتبون حسب عدد أوامر الشراء التي تضم مواداً من هذه الفئة.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Supplier", "المورد"),
            translate("Code", "الكود"),
            translate("Invoices", "الفواتير"),
            translate(`Total Spend (${currency})`, `إجمالي الإنفاق (${currency})`),
          ]}
          rows={topSuppliersByInvoiceCount.map((row, index) => [
            String(index + 1),
            row.supplierName,
            row.supplierCode,
            String(row.invoiceCount),
            formatMoney(row.totalSpend),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Latest Invoices", "أحدث الفواتير")}
          subtitle={translate(
            "Most recent purchase orders that include materials from this category.",
            "أحدث أوامر الشراء التي تتضمن مواداً من هذه الفئة.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Code", "الكود"),
            translate("Invoice Number", "رقم الفاتورة"),
            translate("Supplier", "المورد"),
            translate("Date", "التاريخ"),
            translate("Status", "الحالة"),
            translate(`Amount (${currency})`, `المبلغ (${currency})`),
          ]}
          rows={latestInvoices.map((row, index) => [
            String(index + 1),
            row.orderCode,
            row.legacyInvoiceNumber ?? "-",
            row.supplierName,
            formatDate(row.createdAt, locale),
            row.completedAt ? translate("Completed", "مكتمل") : translate("Open", "مفتوح"),
            formatMoney(row.totalAmount),
          ])}
          monoColumnIndexes={[1, 2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Top Materials by Spend", "أعلى المواد إنفاقاً")}
          subtitle={translate(
            "Materials ranked by total purchase cost (quantity x unit price).",
            "المواد مرتبة حسب إجمالي تكلفة الشراء (الكمية x سعر الوحدة).",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Qty Ordered", "الكمية المطلوبة"),
            translate(`Total Spend (${currency})`, `إجمالي الإنفاق (${currency})`),
            translate(`Avg Unit Price (${currency})`, `متوسط سعر الوحدة (${currency})`),
          ]}
          rows={topMaterials.map((row, index) => [
            String(index + 1),
            row.materialTitle,
            row.materialCode,
            getMaterialUnitLabel(row.unitOfMeasurement, locale),
            formatQuantity(row.totalQuantity),
            formatMoney(row.totalSpend),
            formatMoney(row.avgUnitPrice),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
