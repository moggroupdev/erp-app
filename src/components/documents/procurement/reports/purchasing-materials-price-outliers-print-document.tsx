import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getPriceOutlierCauseLabel,
  PRICE_OUTLIER_CAUSE_VALUES,
  type PriceOutlierCause,
} from "@/lib/constants/enums/derived/price-outlier-causes";
import type { Locale } from "@/lib/i18n/types";
import type { PurchasingMaterialsPriceOutlierRow, PurchasingMaterialsPriceOutlierSummary } from "@/types/reports";

export default function PurchasingMaterialsPriceOutliersPrintDocument({
  title,
  startDate,
  endDate,
  threshold,
  cause,
  summary,
  rows,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  threshold: number;
  cause: PriceOutlierCause | null;
  summary: PurchasingMaterialsPriceOutlierSummary;
  rows: PurchasingMaterialsPriceOutlierRow[];
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

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        {startDate ? (
          <PrintDetail label={translate("Start Date", "تاريخ البداية")} value={formatDate(startDate, locale)} />
        ) : null}
        {endDate ? <PrintDetail label={translate("End Date", "تاريخ النهاية")} value={formatDate(endDate, locale)} /> : null}
        <PrintDetail label={translate("Sensitivity", "الحساسية")} value={translate(`${threshold}x`, `${threshold}×`)} />
        {cause ? (
          <PrintDetail label={translate("Likely cause", "السبب المحتمل")} value={getPriceOutlierCauseLabel(cause, locale)} />
        ) : null}
        <PrintDetail label={translate("Outlier cases", "حالات الانحراف")} value={String(summary.flaggedCount)} />
        <PrintDetail label={translate("Materials affected", "المواد المتأثرة")} value={String(summary.materialsAffected)} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Outlier cases", "حالات الانحراف")}
          subtitle={translate(
            "Each line is compared with the median of nearby purchases of the same material.",
            "يُقارن كل بند بوسيط المشتريات المجاورة لنفس المادة.",
          )}
        />
        <PrintTable
          tableClassName="text-[9px]"
          columnWidths={["3%", "18%", "7%", "10%", "10%", "8%", "10%", "10%", "10%", "6%", "8%"]}
          headers={[
            "#",
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate("MPO Number", "رقم أمر التوريد"),
            translate("Invoice Number", "رقم الفاتورة"),
            translate("Date", "التاريخ"),
            translate("Supplier", "المورد"),
            translate(`Entered price (${currency})`, `السعر المدخل (${currency})`),
            translate(`Neighbour median (${currency})`, `وسيط الجوار (${currency})`),
            translate("Ratio", "النسبة"),
            translate("Likely cause", "السبب"),
          ]}
          rows={rows.map((row, index) => [
            String(index + 1),
            <span className="inline-block leading-normal">{row.materialTitle}</span>,
            row.materialCode,
            row.orderCode,
            row.invoiceNumbers?.join(", ") || "-",
            formatDate(row.orderDate, locale),
            row.supplierName,
            formatPriceWithUnit(row.enteredUnitPrice, row.enteredUnit, locale),
            formatPriceWithUnit(row.referenceMedian, row.enteredUnit, locale),
            formatRatio(row.ratio),
            getPriceOutlierCauseLabel(row.cause, locale),
          ])}
          monoColumnIndexes={[2, 3, 4]}
          emptyLabel={
            cause
              ? translate("No outliers match the selected cause.", "لا توجد انحرافات تطابق السبب المحدد.")
              : translate("No price outliers found for this period.", "لا يوجد انحراف في أسعار الشراء في هذه الفترة.")
          }
        />
      </section>
    </div>
  );
}

function formatPriceWithUnit(amount: number | null, unit: MaterialUnit, locale: Locale) {
  if (amount == null) return "-";
  return `${formatMoney(amount)} / ${getMaterialUnitLabel(unit, locale)}`;
}

function formatRatio(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return "-";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio);
  return `x${formatted}`;
}
