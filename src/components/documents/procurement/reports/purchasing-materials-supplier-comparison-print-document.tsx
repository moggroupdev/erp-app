import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import { PrintSectionHeading } from "../../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { SupplierComparisonPriceBasis } from "@/lib/helpers/supplier-comparison-price-basis";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type { Locale } from "@/lib/i18n/types";
import type {
  PurchasingMaterialsSupplierComparison,
  PurchasingMaterialsSupplierComparisonItemSide,
  PurchasingMaterialsSupplierComparisonMutualItem,
} from "@/types/reports";

const COLUMN_WIDTHS_LAST = ["3%", "16%", "5%", "7%", "9%", "7%", "9%", "8%", "6%", "7%", "7%", "11%"];
const COLUMN_WIDTHS_AVG = ["3%", "13%", "5%", "5%", "6%", "7%", "5%", "6%", "7%", "7%", "5%", "7%", "7%", "12%"];

const SIDE_EDGE = "border-s-[0.5px] border-gray-300";
const SIDE_COL = "border-s-[0.5px] border-gray-200";

export default function PurchasingMaterialsSupplierComparisonPrintDocument({
  title,
  startDate,
  endDate,
  data,
  items,
  displayUnit,
  sortLabel,
  priceBasis,
  priceBasisLabel,
}: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  data: PurchasingMaterialsSupplierComparison;
  items: PurchasingMaterialsSupplierComparisonMutualItem[];
  displayUnit?: MaterialUnit | null;
  sortLabel: string;
  priceBasis: SupplierComparisonPriceBasis;
  priceBasisLabel: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);
  const { a, b } = data.suppliers;
  const totalSavings = items.reduce((sum, row) => sum + row.potentialSavings, 0);
  const totalPositiveDiff = items.reduce((sum, row) => {
    const diff = row.priceDifference ?? 0;
    return diff > 0 ? sum + diff : sum;
  }, 0);
  const totalNegativeDiff = items.reduce((sum, row) => {
    const diff = row.priceDifference ?? 0;
    return diff < 0 ? sum + diff : sum;
  }, 0);
  const showAvg = priceBasis === "avg";
  const columnWidths = showAvg ? COLUMN_WIDTHS_AVG : COLUMN_WIDTHS_LAST;
  const sideColSpan = showAvg ? 3 : 2;
  const footerSpacerColSpan = showAvg ? 9 : 7;

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

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-x-3 gap-y-1.5">
          <CompactDetail
            label={translate("Start Date", "تاريخ البداية")}
            value={startDate ? formatDate(startDate, locale) : "-"}
          />
          <CompactDetail
            label={translate("End Date", "تاريخ النهاية")}
            value={endDate ? formatDate(endDate, locale) : "-"}
          />
          <CompactDetail label={translate("Mutual materials", "المواد المشتركة")} value={String(data.counts.mutual)} />
          <CompactDetail label={translate("Only supplier A", "فقط المورد أ")} value={String(data.counts.onlyA)} />
          <CompactDetail label={translate("Only supplier B", "فقط المورد ب")} value={String(data.counts.onlyB)} />
        </div>

        <table className="w-full table-fixed border-collapse overflow-hidden rounded border border-gray-200 text-[9px]">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "39%" }} />
            <col style={{ width: "39%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[8px] font-medium tracking-wide text-gray-500 uppercase">
              <th className="px-2 py-1 text-start">{translate("Metric", "البند")}</th>
              <th className="border-s-[0.5px] border-gray-200 px-2 py-1 text-start">
                <span className="inline-flex items-center gap-1 normal-case">
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-gray-200 text-[8px] font-semibold text-gray-600">
                    A
                  </span>
                  <span className="truncate font-semibold text-gray-800">{a.name}</span>
                </span>
              </th>
              <th className="border-s-[0.5px] border-gray-200 px-2 py-1 text-start">
                <span className="inline-flex items-center gap-1 normal-case">
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-gray-200 text-[8px] font-semibold text-gray-600">
                    B
                  </span>
                  <span className="truncate font-semibold text-gray-800">{b.name}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <OverviewRow
              label={translate("Code", "الكود")}
              aValue={<span className="font-mono text-[8px] text-gray-500">{a.code}</span>}
              bValue={<span className="font-mono text-[8px] text-gray-500">{b.code}</span>}
            />
            <OverviewRow
              label={translate("Total", "الإجمالي")}
              aValue={<span className="font-semibold">{formatMoney(a.totalSpend, currency)}</span>}
              bValue={<span className="font-semibold">{formatMoney(b.totalSpend, currency)}</span>}
            />
            <OverviewRow
              label={translate("Purchase orders", "أوامر التوريد")}
              aValue={String(a.orderCount)}
              bValue={String(b.orderCount)}
            />
            <OverviewRow
              label={translate("Item count", "عدد الأصناف")}
              aValue={String(a.materialCount)}
              bValue={String(b.materialCount)}
              isLast
            />
          </tbody>
        </table>
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading
          title={translate("Mutual Materials", "المواد المشتركة")}
          subtitle={translate(
            `Side-by-side prices from purchase-order lines in the material base unit. Price basis: ${priceBasisLabel}. Sorted by: ${sortLabel}`,
            `أسعار جنباً إلى جنب من بنود أوامر التوريد بوحدة المادة الأساسية. أساس السعر: ${priceBasisLabel}. مرتّب حسب: ${sortLabel}`,
          )}
        />

        {items.length === 0 ? (
          <p className="py-2 text-[10px] text-gray-500">
            {translate("No mutual materials in this period", "لا توجد مواد مشتركة في هذه الفترة")}
          </p>
        ) : (
          <table className="w-full table-fixed border-collapse text-[8px]">
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <thead className="break-inside-avoid break-after-avoid">
              <tr className="border-b border-gray-300 bg-gray-50 text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                <th rowSpan={2} className="px-1.5 py-1.5 text-center align-bottom">
                  #
                </th>
                <th rowSpan={2} className="px-1.5 py-1.5 text-start align-bottom">
                  {translate("Material", "المادة")}
                </th>
                <th rowSpan={2} className="px-1.5 py-1.5 text-center align-bottom">
                  {translate("Unit", "الوحدة")}
                </th>
                <th colSpan={sideColSpan} className={`${SIDE_EDGE} border-b border-gray-200 px-1.5 py-1.5 text-center`}>
                  <span className="inline-flex items-center justify-center gap-1">
                    <span className="font-semibold text-gray-700">A</span>
                    <span className="max-w-28 truncate font-semibold text-gray-800 normal-case">{a.name}</span>
                  </span>
                </th>
                <th colSpan={sideColSpan} className={`${SIDE_EDGE} border-b border-gray-200 px-1.5 py-1.5 text-center`}>
                  <span className="inline-flex items-center justify-center gap-1">
                    <span className="font-semibold text-gray-700">B</span>
                    <span className="max-w-28 truncate font-semibold text-gray-800 normal-case">{b.name}</span>
                  </span>
                </th>
                <th rowSpan={2} className={`${SIDE_EDGE} px-1.5 py-1.5 text-center align-bottom`}>
                  {translate("Cheaper", "الأرخص")}
                </th>
                <th rowSpan={2} className="px-1.5 py-1.5 text-center align-bottom">
                  {translate("Gap %", "الفجوة %")}
                </th>
                <th colSpan={2} className="border-b border-gray-200 px-1.5 py-1.5 text-center">
                  {translate(`Diff (${currency})`, `الفرق (${currency})`)}
                </th>
                <th rowSpan={2} className="px-1.5 py-1.5 text-center align-bottom">
                  {translate(`Savings (${currency})`, `التوفير (${currency})`)}
                </th>
              </tr>
              <tr className="border-b border-gray-300 bg-gray-50 text-[7px] font-medium tracking-wide text-gray-500 uppercase">
                <SideSubHeaders currency={currency} translate={translate} showAvg={showAvg} />
                <SideSubHeaders currency={currency} translate={translate} showAvg={showAvg} />
                <DiffSubHeaders translate={translate} />
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => {
                const { unit, factor } = resolveDisplayUnit(
                  displayUnit ?? null,
                  row.unitOfMeasurement,
                  row.unitConversions ?? [],
                );
                const diff = row.priceDifference ?? 0;
                const positiveDiff = diff > 0 ? diff : null;
                const negativeDiff = diff < 0 ? diff : null;

                return (
                  <tr key={row.materialCode} className="break-inside-avoid border-b border-gray-200">
                    <td className="px-1.5 py-1.5 text-center text-gray-500">{index + 1}</td>
                    <td className="px-1.5 py-1.5 text-start">
                      <span className="block leading-snug font-medium text-gray-800">{row.materialTitle}</span>
                      <span className="mt-0.5 block font-mono text-[7px] text-gray-400">{row.materialCode}</span>
                    </td>
                    <td className="px-1.5 py-1.5 text-center">{getMaterialUnitLabel(unit, locale)}</td>
                    <SideCells side={row.a} factor={factor} locale={locale} showAvg={showAvg} />
                    <SideCells side={row.b} factor={factor} locale={locale} showAvg={showAvg} />
                    <td className={`${SIDE_EDGE} px-1.5 py-1.5 text-center`}>
                      {cheaperLabel(row.cheaper, a.name, b.name, translate)}
                    </td>
                    <td className="px-1.5 py-1.5 text-center">{formatPercent(row.priceGapPercent)}</td>
                    <td className="px-1.5 py-1.5 text-center text-teal-700">
                      {positiveDiff == null ? "-" : formatMoney(toDisplayUnitPrice(positiveDiff, factor))}
                    </td>
                    <td className="px-1.5 py-1.5 text-center text-clay-700">
                      {negativeDiff == null ? "-" : formatMoney(toDisplayUnitPrice(negativeDiff, factor))}
                    </td>
                    <td className="px-1.5 py-1.5 text-center font-semibold">{formatMoney(row.potentialSavings)}</td>
                  </tr>
                );
              })}
              <tr className="break-inside-avoid border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
                <td className="px-1.5 py-1.5" />
                <td className="px-1.5 py-1.5 text-start">{translate("Total", "الإجمالي")}</td>
                <td colSpan={footerSpacerColSpan} className="px-1.5 py-1.5" />
                <td className="px-1.5 py-1.5 text-center text-teal-700">{formatMoney(totalPositiveDiff)}</td>
                <td className="px-1.5 py-1.5 text-center text-clay-700">{formatMoney(totalNegativeDiff)}</td>
                <td className="px-1.5 py-1.5 text-center">{formatMoney(totalSavings)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function CompactDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[8px] text-gray-500">{label}</span>
      <span className="truncate text-[10px] font-medium text-gray-900">{value}</span>
    </div>
  );
}

function OverviewRow({
  label,
  aValue,
  bValue,
  isLast = false,
}: {
  label: string;
  aValue: ReactNode;
  bValue: ReactNode;
  isLast?: boolean;
}) {
  return (
    <tr className={isLast ? undefined : "border-b border-gray-200"}>
      <td className="px-2 py-1 text-gray-500">{label}</td>
      <td className="border-s-[0.5px] border-gray-200 px-2 py-1 text-gray-800">{aValue}</td>
      <td className="border-s-[0.5px] border-gray-200 px-2 py-1 text-gray-800">{bValue}</td>
    </tr>
  );
}

function SideSubHeaders({
  currency,
  translate,
  showAvg,
}: {
  currency: string;
  translate: (en: string, ar: string) => string;
  showAvg: boolean;
}) {
  return (
    <>
      <th className={`${SIDE_EDGE} px-1.5 py-1 text-center`}>{translate("Qty", "الكمية")}</th>
      {showAvg && (
        <th className={`${SIDE_COL} px-1.5 py-1 text-center`}>{translate(`Avg (${currency})`, `المتوسط (${currency})`)}</th>
      )}
      <th className={`${SIDE_COL} px-1.5 py-1 text-center`}>{translate(`Last (${currency})`, `آخر سعر (${currency})`)}</th>
    </>
  );
}

function DiffSubHeaders({ translate }: { translate: (en: string, ar: string) => string }) {
  return (
    <>
      <th className={`${SIDE_COL} px-1.5 py-1 text-center text-teal-700`}>{translate("Positive", "موجب")}</th>
      <th className={`${SIDE_COL} px-1.5 py-1 text-center text-clay-700`}>{translate("Negative", "سالب")}</th>
    </>
  );
}

function SideCells({
  side,
  factor,
  locale,
  showAvg,
}: {
  side: PurchasingMaterialsSupplierComparisonItemSide;
  factor: number;
  locale: Locale;
  showAvg: boolean;
}) {
  return (
    <>
      <td className={`${SIDE_EDGE} px-1.5 py-1.5 text-center`}>{formatBaseQuantityForDisplay(side.quantity, factor)}</td>
      {showAvg && (
        <td className={`${SIDE_COL} px-1.5 py-1.5 text-center`}>
          {formatMoney(toDisplayUnitPrice(side.avgUnitPrice, factor))}
        </td>
      )}
      <td className={`${SIDE_COL} px-1.5 py-1.5 text-center`}>
        {side.lastUnitPrice == null ? (
          "-"
        ) : (
          <span className="inline-flex flex-col items-center gap-0.5 leading-tight">
            <span>{formatMoney(toDisplayUnitPrice(side.lastUnitPrice, factor))}</span>
            {side.lastPurchasedAt ? (
              <span className="text-[7px] text-gray-400">{formatDate(side.lastPurchasedAt, locale)}</span>
            ) : null}
          </span>
        )}
      </td>
    </>
  );
}

function cheaperLabel(
  cheaper: "a" | "b" | "equal",
  supplierAName: string,
  supplierBName: string,
  translate: (en: string, ar: string) => string,
) {
  if (cheaper === "equal") return translate("Equal", "متساوي");
  return cheaper === "a" ? supplierAName : supplierBName;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value) || value === 0) return "0%";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}
