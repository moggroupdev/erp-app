import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { chartNeutralColors, semanticPalette } from "@/lib/constants/color-palette";
import { mapBaseQuantityMaterialRowForDisplay } from "@/lib/helpers/unit-conversion";
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

/** Even steps that stay at or above `maxValue`, matching a compact chart axis. */
function niceAxisTicks(maxValue: number): number[] {
  if (!(maxValue > 0)) return [0, 1];

  const rough = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const count = Math.ceil(maxValue / step - 1e-9);
  return Array.from({ length: count + 1 }, (_, index) => step * index);
}

function monotoneLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";

  const slopes: number[] = [];
  const widths: number[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    widths[index] = points[index + 1].x - points[index].x;
    slopes[index] = widths[index] === 0 ? 0 : (points[index + 1].y - points[index].y) / widths[index];
  }

  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    if (slopes[index - 1] * slopes[index] <= 0) return 0;
    return (slopes[index - 1] + slopes[index]) / 2;
  });

  for (let index = 0; index < slopes.length; index++) {
    if (Math.abs(slopes[index]) < 1e-6) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const start = tangents[index] / slopes[index];
    const end = tangents[index + 1] / slopes[index];
    const magnitude = start * start + end * end;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangents[index] = scale * start * slopes[index];
      tangents[index + 1] = scale * end * slopes[index];
    }
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index++) {
    const width = widths[index];
    const controlStartX = points[index].x + width / 3;
    const controlStartY = points[index].y + (tangents[index] * width) / 3;
    const controlEndX = points[index + 1].x - width / 3;
    const controlEndY = points[index + 1].y - (tangents[index + 1] * width) / 3;
    path += ` C ${controlStartX} ${controlStartY}, ${controlEndX} ${controlEndY}, ${points[index + 1].x} ${points[index + 1].y}`;
  }
  return path;
}

function axisCaption(period: string, locale: string, groupBy: GroupBy): { primary: string; secondary?: string } {
  const parts = parsePeriodParts(period);
  if (!parts) return { primary: period };

  const { year, month } = parts;
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";
  const date = new Date(Date.UTC(year, month - 1, 1));
  const yearLabel = date.toLocaleDateString(localeTag, { year: "numeric", timeZone: "UTC" });

  if (groupBy === "year") return { primary: yearLabel };

  if (groupBy === "quarter") {
    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return {
      primary: locale === "ar" ? ARABIC_QUARTER_LABELS[quarter] : `Q${quarter}`,
      secondary: yearLabel,
    };
  }

  return {
    primary: date.toLocaleDateString(localeTag, { month: "short", timeZone: "UTC" }),
    secondary: yearLabel,
  };
}

function SpendingTrendPrintChart({
  data,
  groupBy,
  locale,
}: {
  data: PurchasingMaterialsByPeriod[];
  groupBy: GroupBy;
  locale: string;
}) {
  if (data.length === 0) return null;

  const isRtl = locale === "ar";
  const width = 720;
  const labelStep = data.length <= 14 ? 1 : data.length <= 28 ? 2 : Math.ceil(data.length / 14);
  const plotTop = 16;
  const plotHeight = 168;
  const plotBottom = plotTop + plotHeight;
  const height = plotBottom + 46;
  const yAxisWidth = 40;
  const plotInset = 4;
  const plotLeft = isRtl ? plotInset : yAxisWidth;
  const plotRight = isRtl ? width - yAxisWidth : width - plotInset;
  const plotWidth = plotRight - plotLeft;

  const ticks = niceAxisTicks(Math.max(...data.map((row) => row.totalSpend), 0));
  const yMax = ticks[ticks.length - 1] || 1;
  const lineColor = semanticPalette.haze[600];
  const points = data.map((row, index) => {
    const slot = data.length === 1 ? 0.5 : index / (data.length - 1);
    const visualSlot = isRtl ? 1 - slot : slot;
    return {
      x: plotLeft + visualSlot * plotWidth,
      y: plotBottom - (row.totalSpend / yMax) * plotHeight,
      caption: axisCaption(row.period, locale, groupBy),
      showLabel: index === 0 || index === data.length - 1 || index % labelStep === 0,
    };
  });

  return (
    <figure className="break-inside-avoid">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" style={{ direction: "ltr" }}>
        {ticks.map((tick) => {
          const y = plotBottom - (tick / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke={chartNeutralColors[2]} strokeDasharray="3 3" />
              <text
                x={isRtl ? width - 2 : 2}
                y={y}
                textAnchor={isRtl ? "end" : "start"}
                dominantBaseline="middle"
                fontSize={11}
                fill={chartNeutralColors[0]}
                direction="ltr"
              >
                {formatCompactNumber(tick)}
              </text>
            </g>
          );
        })}
        <line x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke={chartNeutralColors[1]} />
        <path d={monotoneLinePath(points)} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r={4} fill={lineColor} />
            {point.showLabel && (
              <text
                x={point.x}
                y={plotBottom + 16}
                textAnchor={point.x - plotLeft <= 8 ? "start" : plotRight - point.x <= 8 ? "end" : "middle"}
                fontSize={9}
                fill={chartNeutralColors[0]}
              >
                <tspan x={point.x} dy={0}>
                  {point.caption.primary}
                </tspan>
                {point.caption.secondary && (
                  <tspan x={point.x} dy={12}>
                    {point.caption.secondary}
                  </tspan>
                )}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
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
  materialsDisplayUnit,
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
  materialsDisplayUnit?: MaterialUnit | null;
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
  const totalPeriodSpend = byPeriod.reduce((sum, row) => sum + row.totalSpend, 0);
  const totalPeriodOrders = byPeriod.reduce((sum, row) => sum + row.orderCount, 0);
  const totalSupplierSpend = bySupplier.reduce((sum, row) => sum + row.totalSpend, 0);
  const totalSupplierOrders = bySupplier.reduce((sum, row) => sum + row.orderCount, 0);
  const totalTopOrderAmount = topOrders.reduce((sum, row) => sum + row.invoiceTotalPurchases, 0);
  const totalMaterialSpend = byMaterial.reduce((sum, row) => sum + row.totalSpend, 0);

  function formatShare(value: number, ofTotal: number) {
    return `${percentageFormatter.format(ofTotal === 0 ? 0 : (value / ofTotal) * 100)}%`;
  }

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
        <PrintDetail label={translate("Total Value", "إجمالي القيمة")} value={formatMoney(overview.totalSpend, currency)} />
        <PrintDetail
          label={translate("Total Purchase Orders", "إجمالي عدد أوامر الشراء")}
          value={String(overview.totalOrders)}
        />
        <PrintDetail
          label={translate("Average Purchase Order Value", "متوسط قيمة أمر الشراء")}
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
          title={translate("Value Trend", "اتجاه القيمة")}
          subtitle={translate("Total value per period across purchase orders.", "إجمالي القيمة لكل فترة عبر أوامر الشراء.")}
        />
        <SpendingTrendPrintChart data={byPeriod} groupBy={groupBy} locale={locale} />
        <PrintTable
          headers={[
            translate("Period", "الفترة"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Percentage", "النسبة"),
            translate("Orders", "أوامر الشراء"),
            translate(`Avg Order (${currency})`, `متوسط أمر الشراء (${currency})`),
          ]}
          rows={byPeriod.map((row) => [
            formatPeriodLabel(row.period, locale, groupBy),
            formatMoney(row.totalSpend),
            formatShare(row.totalSpend, totalPeriodSpend),
            String(row.orderCount),
            formatMoney(row.avgOrderValue),
          ])}
          footerRow={
            byPeriod.length === 0
              ? undefined
              : [
                  translate("Total", "الإجمالي"),
                  formatMoney(totalPeriodSpend),
                  `${percentageFormatter.format(100)}%`,
                  String(totalPeriodOrders),
                  formatMoney(totalPeriodOrders > 0 ? totalPeriodSpend / totalPeriodOrders : 0),
                ]
          }
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Value by Category", "القيمة حسب الفئة")}
          subtitle={translate(
            "Purchase value grouped by main material category, sorted from highest to lowest.",
            "قيمة المشتريات مجمّعة حسب الفئة الرئيسية للمواد، مرتبة من الأعلى إلى الأدنى.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Main Category", "الفئة الرئيسية"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Percentage", "النسبة"),
          ]}
          rows={byMainCategory.map((row, index) => [
            String(index + 1),
            row.mainCategoryTitle,
            formatMoney(row.totalSpend),
            formatShare(row.totalSpend, totalCategorySpend),
          ])}
          footerRow={
            byMainCategory.length === 0
              ? undefined
              : ["", translate("Total", "الإجمالي"), formatMoney(totalCategorySpend), `${percentageFormatter.format(100)}%`]
          }
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Suppliers by Value", "الموردون حسب القيمة")}
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
            translate("Orders", "أوامر الشراء"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Percentage", "النسبة"),
            translate(`Avg Order (${currency})`, `متوسط أمر الشراء (${currency})`),
          ]}
          rows={bySupplier.map((row, index) => [
            String(index + 1),
            row.supplierName,
            row.supplierCode,
            String(row.orderCount),
            formatMoney(row.totalSpend),
            formatShare(row.totalSpend, totalSupplierSpend),
            formatMoney(row.avgOrderValue),
          ])}
          footerRow={
            bySupplier.length === 0
              ? undefined
              : [
                  "",
                  translate("Total", "الإجمالي"),
                  "",
                  String(totalSupplierOrders),
                  formatMoney(totalSupplierSpend),
                  `${percentageFormatter.format(100)}%`,
                  formatMoney(totalSupplierOrders > 0 ? totalSupplierSpend / totalSupplierOrders : 0),
                ]
          }
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
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
            translate("Percentage", "النسبة"),
          ]}
          rows={topOrders.map((row, index) => [
            String(index + 1),
            row.orderCode,
            row.invoiceNumbers.join(", ") || "-",
            row.supplierName,
            formatDate(row.createdAt, locale),
            row.completedAt ? translate("Completed", "مكتمل") : translate("Open", "مفتوح"),
            formatMoney(row.invoiceTotalPurchases),
            formatShare(row.invoiceTotalPurchases, overview.totalSpend),
          ])}
          footerRow={
            topOrders.length === 0
              ? undefined
              : [
                  "",
                  translate("Total", "الإجمالي"),
                  "",
                  "",
                  "",
                  "",
                  formatMoney(totalTopOrderAmount),
                  formatShare(totalTopOrderAmount, overview.totalSpend),
                ]
          }
          monoColumnIndexes={[1, 2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Top Materials by Value", "أعلى المواد قيمة")}
          subtitle={translate(
            "Materials ranked by allocated invoice total purchases.",
            "المواد مرتبة حسب إجمالي مشتريات الفواتير الموزعة.",
          )}
        />
        <PrintTable
          headers={[
            "#",
            translate("Material", "المادة"),
            translate("Code", "الكود"),
            translate("Unit", "الوحدة"),
            translate("Qty Ordered", "الكمية"),
            translate(`Total Value (${currency})`, `إجمالي القيمة (${currency})`),
            translate("Percentage", "النسبة"),
            translate(`Avg Unit Price (${currency})`, `متوسط السعر (${currency})`),
          ]}
          rows={byMaterial.map((row, index) => {
            const { unit, factor, displayAvgUnitPrice } = mapBaseQuantityMaterialRowForDisplay(row, materialsDisplayUnit);

            return [
              String(index + 1),
              row.materialTitle,
              row.materialCode,
              getMaterialUnitLabel(unit, locale),
              formatBaseQuantityForDisplay(row.totalQuantity, factor),
              formatMoney(row.totalSpend),
              formatShare(row.totalSpend, overview.totalSpend),
              formatMoney(displayAvgUnitPrice),
            ];
          })}
          footerRow={
            byMaterial.length === 0
              ? undefined
              : [
                  "",
                  translate("Total", "الإجمالي"),
                  "",
                  "",
                  "",
                  formatMoney(totalMaterialSpend),
                  formatShare(totalMaterialSpend, overview.totalSpend),
                  "",
                ]
          }
          monoColumnIndexes={[2]}
          emptyLabel={translate("No data available", "لا توجد بيانات")}
        />
      </section>
    </div>
  );
}
