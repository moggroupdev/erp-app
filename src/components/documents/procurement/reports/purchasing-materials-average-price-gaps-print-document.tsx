import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getAveragePriceGapCauseLabel,
  getAveragePriceGapDirectionLabel,
  type AveragePriceGapCause,
} from "@/lib/constants/enums/derived/average-price-gap-causes";
import type { Locale } from "@/lib/i18n/types";
import type { PurchasingMaterialsAveragePriceGapRow, PurchasingMaterialsAveragePriceGapSummary } from "@/types/reports";

export default function PurchasingMaterialsAveragePriceGapsPrintDocument({
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
  cause: AveragePriceGapCause | null;
  summary: PurchasingMaterialsAveragePriceGapSummary;
  rows: PurchasingMaterialsAveragePriceGapRow[];
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
          <PrintDetail label={translate("Likely cause", "السبب المحتمل")} value={getAveragePriceGapCauseLabel(cause, locale)} />
        ) : null}
        <PrintDetail label={translate("Flagged materials", "المواد المعلمة")} value={String(summary.flaggedCount)} />
        <PrintDetail label={translate("Stored price higher", "السعر المخزن أعلى")} value={String(summary.aboveCount)} />
        <PrintDetail label={translate("Stored price lower", "السعر المخزن أدنى")} value={String(summary.belowCount)} />
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Flagged materials", "المواد المعلمة")}
          subtitle={translate(
            "Each stored average price is compared with the quantity-weighted purchase price in the material base unit.",
            "يُقارن كل سعر متوسط مخزن بمتوسط أسعار الشراء المرجح بالكمية بوحدة المادة الأساسية.",
          )}
        />
        <PrintTable
          tableClassName="text-[9px]"
          columnWidths={["3%", "14%", "8%", "10%", "10%", "6%", "9%", "5%", "6%", "9%", "8%", "12%"]}
          headers={[
            "#",
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate(`Stored average (${currency})`, `السعر المتوسط (${currency})`),
            translate(`Weighted purchase (${currency})`, `متوسط الشراء المرجح (${currency})`),
            translate("Ratio", "النسبة"),
            translate("Direction", "الاتجاه"),
            translate("Lines", "البنود"),
            translate("Excluded", "مستبعد"),
            translate("Quantity purchased", "الكمية المشتراة"),
            translate("Last purchase", "آخر شراء"),
            translate("Likely cause", "السبب"),
          ]}
          rows={rows.map((row, index) => [
            String(index + 1),
            <span key={row.materialCode} className="inline-block leading-normal">
              {row.materialTitle}
            </span>,
            row.materialCode,
            formatPriceWithUnit(row.unitPrice, row.unitOfMeasurement, locale),
            formatPriceWithUnit(row.weightedAveragePurchasePrice, row.unitOfMeasurement, locale),
            formatRatio(row.ratio),
            getAveragePriceGapDirectionLabel(row.direction, locale),
            String(row.lineCount),
            String(row.excludedLineCount),
            `${formatQuantity(row.totalQuantityPurchased)} ${getMaterialUnitLabel(row.unitOfMeasurement, locale)}`,
            row.lastPurchaseDate ? formatDate(row.lastPurchaseDate, locale) : "-",
            getAveragePriceGapCauseLabel(row.cause, locale),
          ])}
          monoColumnIndexes={[2]}
          emptyLabel={
            cause
              ? translate("No gaps match the selected cause.", "لا توجد فروقات تطابق السبب المحدد.")
              : translate("No average price gaps found for this period.", "لا توجد فروقات في السعر المتوسط في هذه الفترة.")
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
