import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type {
  PurchasingMaterialsByMainCategory,
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsByPeriod,
  PurchasingMaterialsCategoryStatsOverview,
  PurchasingMaterialsSupplierOrder,
} from "@/types/reports";

type GroupBy = "month" | "quarter" | "year";

const ARABIC_QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "الربع الأول",
  2: "الربع الثاني",
  3: "الربع الثالث",
  4: "الربع الرابع",
};

function parsePeriodParts(period: string): { year: number; month: number } | null {
  const match = period.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function formatPeriodLabel(period: string, locale: string, groupBy: GroupBy): string {
  const parts = parsePeriodParts(period);
  if (!parts) return period;

  const { year, month } = parts;
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";

  if (groupBy === "year") return String(year);

  if (groupBy === "quarter") {
    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return locale === "ar" ? `${ARABIC_QUARTER_LABELS[quarter]} لعام ${year}` : `Q${quarter} ${year}`;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString(localeTag, { year: "numeric", month: "short", timeZone: "UTC" });
}

export default function PurchasingMaterialsSupplierStatsPrintDocument({
  title,
  supplierName,
  startDate,
  endDate,
  groupBy = "month",
  overview,
  byPeriod,
  categories,
  orders,
  materials,
  categoriesSortLabel,
  ordersSortLabel,
  materialsSortLabel,
}: {
  title: string;
  supplierName: string;
  startDate?: string | null;
  endDate?: string | null;
  groupBy?: GroupBy;
  overview: PurchasingMaterialsCategoryStatsOverview;
  byPeriod: PurchasingMaterialsByPeriod[];
  categories: PurchasingMaterialsByMainCategory[];
  orders: PurchasingMaterialsSupplierOrder[];
  materials: PurchasingMaterialsByMaterial[];
  categoriesSortLabel: string;
  ordersSortLabel: string;
  materialsSortLabel: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalPeriodSpend = byPeriod.reduce((sum, row) => sum + row.totalSpend, 0);
  const totalPeriodOrders = byPeriod.reduce((sum, row) => sum + row.orderCount, 0);
  const avgPeriodOrderValue = totalPeriodOrders === 0 ? 0 : totalPeriodSpend / totalPeriodOrders;

  const totalCategoryMaterials = categories.reduce((sum, row) => sum + row.materialCount, 0);
  const totalCategoryQuantity = categories.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalCategorySpend = categories.reduce((sum, row) => sum + row.totalSpend, 0);

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
        <PrintDetail label={translate("Supplier", "المورد")} value={supplierName} />
        <PrintDetail label={translate("Total Spend", "إجمالي القيمة")} value={formatMoney(overview.totalSpend, currency)} />
        <PrintDetail label={translate("Total Orders", "إجمالي الفواتير")} value={String(overview.totalOrders)} />
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
          title={translate("Spending by Period", "القيمة حسب الفترة")}
          subtitle={translate(
            "Total spend, order count, and average order value per period.",
            "إجمالي القيمة وعدد الفواتير ومتوسط قيمة الطلب لكل فترة.",
          )}
        />
        <PrintTable
          headers={[
            translate("Period", "الفترة"),
            translate(`Total Spend (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Orders", "الفواتير"),
            translate(`Avg Order (${currency})`, `متوسط الطلب (${currency})`),
          ]}
          rows={byPeriod.map((row) => [
            formatPeriodLabel(row.period, locale, groupBy),
            formatMoney(row.totalSpend),
            String(row.orderCount),
            formatMoney(row.avgOrderValue),
          ])}
          footerRow={[
            translate("Total", "الإجمالي"),
            formatMoney(totalPeriodSpend),
            String(totalPeriodOrders),
            formatMoney(avgPeriodOrderValue),
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Spending by Main Category", "القيمة حسب الفئة الرئيسية")}
          subtitle={translate(`Sorted by: ${categoriesSortLabel}`, `مرتّب حسب: ${categoriesSortLabel}`)}
        />
        <PrintTable
          headers={[
            "#",
            translate("Main Category", "الفئة الرئيسية"),
            translate("Materials", "المواد"),
            translate("Qty Ordered", "الكمية المطلوبة"),
            translate(`Total Spend (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Percentage", "النسبة"),
          ]}
          rows={categories.map((row, index) => [
            String(index + 1),
            row.mainCategoryTitle,
            String(row.materialCount),
            formatQuantity(row.totalQuantity),
            formatMoney(row.totalSpend),
            `${percentageFormatter.format(totalCategorySpend === 0 ? 0 : (row.totalSpend / totalCategorySpend) * 100)}%`,
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            String(totalCategoryMaterials),
            formatQuantity(totalCategoryQuantity),
            formatMoney(totalCategorySpend),
            `${percentageFormatter.format(categories.length === 0 ? 0 : 100)}%`,
          ]}
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
            translate("Status", "الحالة"),
            translate(`Amount (${currency})`, `المبلغ (${currency})`),
          ]}
          rows={orders.map((row, index) => [
            String(index + 1),
            row.orderCode,
            row.legacyInvoiceNumber ?? "-",
            row.legacyInvoiceIssuedAt ? formatDate(row.legacyInvoiceIssuedAt, locale) : "-",
            row.inventoryTransactionLegacyNumbers.length > 0 ? row.inventoryTransactionLegacyNumbers.join(", ") : "-",
            row.completedAt ? translate("Completed", "مكتمل") : translate("Open", "مفتوح"),
            formatMoney(row.legacyInvoiceTotalPurchases),
          ])}
          footerRow={["", translate("Total", "الإجمالي"), "", "", "", "", formatMoney(totalOrderAmount)]}
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
            translate(`Total Spend (${currency})`, `إجمالي القيمة (${currency})`),
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
