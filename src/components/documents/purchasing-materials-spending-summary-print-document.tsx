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
  PurchasingMaterialsBySupplier,
  PurchasingMaterialsOverview,
  PurchasingMaterialsTopOrder,
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

export default function PurchasingMaterialsSpendingSummaryPrintDocument({
  title,
  startDate,
  endDate,
  groupBy = "month",
  overview,
  byPeriod,
  bySupplier,
  byMaterial,
  byMainCategory,
  topOrders,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  groupBy?: GroupBy;
  overview: PurchasingMaterialsOverview;
  byPeriod: PurchasingMaterialsByPeriod[];
  bySupplier: PurchasingMaterialsBySupplier[];
  byMaterial: PurchasingMaterialsByMaterial[];
  byMainCategory: PurchasingMaterialsByMainCategory[];
  topOrders: PurchasingMaterialsTopOrder[];
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const totalCategorySpend = byMainCategory.reduce((sum, row) => sum + row.totalSpend, 0);

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
          title={translate("Spending by Period", "الإنفاق حسب الفترة")}
          subtitle={translate(
            "Total spend, order count, and average order value per period.",
            "إجمالي الإنفاق وعدد الطلبات ومتوسط قيمة الطلب لكل فترة.",
          )}
        />
        <PrintTable
          headers={[
            translate("Period", "الفترة"),
            translate(`Total Spend (${currency})`, `إجمالي الإنفاق (${currency})`),
            translate("Orders", "الطلبات"),
            translate(`Avg Order (${currency})`, `متوسط الطلب (${currency})`),
          ]}
          rows={byPeriod.map((row) => [
            formatPeriodLabel(row.period, locale, groupBy),
            formatMoney(row.totalSpend),
            String(row.orderCount),
            formatMoney(row.avgOrderValue),
          ])}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Top Purchase Orders", "أعلى أوامر الشراء قيمة")}
          subtitle={translate(
            "Largest purchase orders ranked by total amount.",
            "أكبر أوامر الشراء مرتبة حسب إجمالي المبلغ.",
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
          rows={topOrders.map((row, index) => [
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
          title={translate("Top Suppliers by Spend", "أعلى الموردين إنفاقاً")}
          subtitle={translate(
            "Suppliers ranked by total purchase order value.",
            "الموردون مرتبون حسب إجمالي قيمة أوامر الشراء.",
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
          rows={byMaterial.map((row, index) => [
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

      <section className="flex break-inside-avoid flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Spending by Main Category", "الإنفاق حسب الفئة الرئيسية")}
          subtitle={translate(
            "Purchase spend grouped by main material category, sorted from highest to lowest.",
            "إنفاق المشتريات مجمّع حسب الفئة الرئيسية للمواد، مرتب من الأعلى إلى الأدنى.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Main Category", "الفئة الرئيسية"),
            translate(`Total Spend (${currency})`, `إجمالي الإنفاق (${currency})`),
            translate("Percentage", "النسبة"),
          ]}
          rows={byMainCategory.map((row, index) => [
            String(index + 1),
            row.mainCategoryTitle,
            formatMoney(row.totalSpend),
            `${percentageFormatter.format(totalCategorySpend === 0 ? 0 : (row.totalSpend / totalCategorySpend) * 100)}%`,
          ])}
          footerRow={[
            "",
            translate("Total", "الإجمالي"),
            formatMoney(totalCategorySpend),
            `${percentageFormatter.format(byMainCategory.length === 0 ? 0 : 100)}%`,
          ]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
