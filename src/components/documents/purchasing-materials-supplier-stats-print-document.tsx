import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatDisplayQuantity, formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { resolveDisplayUnit, toDisplayQuantity, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type {
  PurchasingMaterialsByMainCategory,
  PurchasingMaterialsByMaterial,
  PurchasingMaterialsByPeriod,
  PurchasingMaterialsCategoryStatsOverview,
  PurchasingMaterialsSupplierBySubCategory,
  PurchasingMaterialsSupplierOrder,
} from "@/types/reports";
import {
  buildSupplierCategoryGroups,
  type SupplierCategoriesSort,
} from "@/app/[locale]/(inner)/reports/purchasing-materials/supplier-stats/components/sort";

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
  subCategories,
  orders,
  materials,
  materialsDisplayUnit,
  categoriesSort = "spend-desc",
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
  subCategories: PurchasingMaterialsSupplierBySubCategory[];
  orders: PurchasingMaterialsSupplierOrder[];
  materials: PurchasingMaterialsByMaterial[];
  materialsDisplayUnit?: MaterialUnit | null;
  categoriesSort?: SupplierCategoriesSort;
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

  const totalCategorySpend = categories.reduce((sum, row) => sum + row.totalSpend, 0);

  const categoryGroups = buildSupplierCategoryGroups(categories, subCategories, categoriesSort);

  const totalOrderAmount = orders.reduce((sum, row) => sum + row.legacyInvoiceTotalPurchases, 0);
  const materialDisplayRows = materials.map((row) => {
    const { unit, factor } = resolveDisplayUnit(materialsDisplayUnit, row.unitOfMeasurement, row.unitConversions);
    return { row, unit, factor, displayQuantity: toDisplayQuantity(row.totalQuantity, factor) };
  });
  const allMaterialUnitsMatch =
    materialDisplayRows.length > 0 && materialDisplayRows.every((item) => item.unit === materialDisplayRows[0].unit);
  const totalMaterialQuantity = allMaterialUnitsMatch
    ? materialDisplayRows.reduce((sum, item) => sum + item.displayQuantity, 0)
    : null;
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
        <PrintDetail label={translate("Total Value", "إجمالي القيمة")} value={formatMoney(overview.totalSpend, currency)} />
        <PrintDetail label={translate("Total Invoices Count", "إجمالي عدد الفواتير")} value={String(overview.totalOrders)} />
        <PrintDetail
          label={translate("Average Invoice Value", "متوسط قيمة الفاتورة")}
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
          title={translate("Value by Period", "القيمة حسب الفترة")}
          subtitle={translate(
            "Total value, invoice count, and average invoice value per period.",
            "إجمالي القيمة وعدد الفواتير ومتوسط قيمة الفاتورة لكل فترة.",
          )}
        />
        <PrintTable
          headers={[
            translate("Period", "الفترة"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Invoices Count", "عدد الفواتير"),
            translate(`Avg Invoice (${currency})`, `متوسط الفاتورة (${currency})`),
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

      <section className="flex flex-col gap-4">
        <PrintSectionHeading
          title={translate("Value by Category", "القيمة حسب الفئة")}
          subtitle={translate(`Sorted by: ${categoriesSortLabel}`, `مرتّب حسب: ${categoriesSortLabel}`)}
        />

        {categoryGroups.length === 0 ? (
          <p className="text-xs text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
        ) : (
          categoryGroups.map(({ main, subs }) => (
            <div key={main.mainCategoryId} className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-gray-700">{main.mainCategoryTitle}</p>
              <PrintTable
                headers={[
                  "#",
                  translate("Subcategory", "الفئة الفرعية"),
                  translate("Materials Count", "عدد الأصناف"),
                  translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
                  translate("% of category", "النسبة من الفئة"),
                  translate("% of supplier", "النسبة من المورد"),
                ]}
                columnWidths={["6%", "34%", "12%", "18%", "15%", "15%"]}
                rows={subs.map((sub, index) => [
                  String(index + 1),
                  sub.subCategoryTitle,
                  String(sub.materialCount),
                  formatMoney(sub.totalSpend),
                  `${percentageFormatter.format(main.totalSpend === 0 ? 0 : (sub.totalSpend / main.totalSpend) * 100)}%`,
                  `${percentageFormatter.format(totalCategorySpend === 0 ? 0 : (sub.totalSpend / totalCategorySpend) * 100)}%`,
                ])}
                footerRow={[
                  "",
                  `${translate("Total", "الإجمالي")} (${main.mainCategoryTitle})`,
                  String(main.materialCount),
                  formatMoney(main.totalSpend),
                  `${percentageFormatter.format(100)}%`,
                  `${percentageFormatter.format(totalCategorySpend === 0 ? 0 : (main.totalSpend / totalCategorySpend) * 100)}%`,
                ]}
                emptyLabel={translate("No subcategories", "لا توجد فئات فرعية")}
              />
            </div>
          ))
        )}
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
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate(`Avg Unit Price (${currency})`, `متوسط سعر الوحدة (${currency})`),
          ]}
          rows={materialDisplayRows.map(({ row, unit, factor }, index) => [
            String(index + 1),
            row.materialTitle,
            row.materialCode,
            getMaterialUnitLabel(unit, locale),
            formatDisplayQuantity(row.totalQuantity, factor),
            formatMoney(row.totalSpend),
            formatMoney(toDisplayUnitPrice(row.avgUnitPrice, factor)),
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            "",
            "",
            totalMaterialQuantity == null ? "" : formatQuantity(totalMaterialQuantity),
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
