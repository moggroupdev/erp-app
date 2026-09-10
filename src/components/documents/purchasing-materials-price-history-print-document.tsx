import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "./components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { PurchasingMaterialsPriceHistoryEntry, PurchasingMaterialsPriceHistorySummary } from "@/types/reports";

export default function PurchasingMaterialsPriceHistoryPrintDocument({
  title,
  startDate,
  endDate,
  materialTitle,
  materialCode,
  displayUnit,
  summary,
  entries,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  materialTitle: string;
  materialCode: string;
  displayUnit: MaterialUnit;
  summary: PurchasingMaterialsPriceHistorySummary;
  entries: PurchasingMaterialsPriceHistoryEntry[];
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const unitLabel = getMaterialUnitLabel(displayUnit, locale);
  const priceSuffix = `${currency} / ${unitLabel}`;

  const changePositive = summary.changePercentage >= 0;
  const changeLabel = `${changePositive ? "+" : ""}${summary.changePercentage.toFixed(1)}%`;

  const sortedEntries = [...entries].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  return (
    <div className="flex flex-col gap-8 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Purchases Report", "تقرير المشتريات")} - {title}
          </p>
          <h1 className="text-2xl font-semibold">{materialTitle}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Printing date", "تاريخ الطباعة")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Material Code", "كود الصنف")} value={materialCode} mono />
        <PrintDetail label={translate("Unit of Measurement", "وحدة القياس")} value={unitLabel} />
        <PrintDetail
          label={translate("Start Date", "تاريخ البداية")}
          value={startDate ? formatDate(startDate, locale) : "-"}
        />
        <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={endDate ? formatDate(endDate, locale) : "-"} />
      </section>

      <hr className="border-gray-300" />

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <PrintDetail
          label={translate(`Min Price (${priceSuffix})`, `أقل سعر (${priceSuffix})`)}
          value={formatMoney(summary.minPrice, currency)}
        />
        <PrintDetail
          label={translate(`Max Price (${priceSuffix})`, `أعلى سعر (${priceSuffix})`)}
          value={formatMoney(summary.maxPrice, currency)}
        />
        <PrintDetail
          label={translate(`Average Price (${priceSuffix})`, `متوسط السعر (${priceSuffix})`)}
          value={formatMoney(summary.avgPrice, currency)}
        />
        <PrintDetail label={translate("Price Change", "تغير السعر")} value={changeLabel} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Purchase History", "سجل المشتريات")}
          subtitle={translate(
            "Individual purchase order lines for this material (newest first).",
            "بنود أوامر التوريد الفردية لهذه المادة (الأحدث أولاً).",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("MPO Number", "رقم أمر التوريد"),
            translate("Date", "التاريخ"),
            translate("Supplier", "المورد"),
            translate("Unit of Measurement", "وحدة القياس"),
            translate("Qty", "الكمية"),
            translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`),
          ]}
          rows={sortedEntries.map((row, index) => [
            String(index + 1),
            row.orderCode,
            formatDate(row.orderDate, locale),
            row.supplierName,
            unitLabel,
            formatQuantity(row.quantityOrdered),
            formatMoney(row.unitPrice),
          ])}
          monoColumnIndexes={[1]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
