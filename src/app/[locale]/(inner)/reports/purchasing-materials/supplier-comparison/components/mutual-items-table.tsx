"use client";

import { useMemo } from "react";
import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Select, Table } from "@mantine/core";
import { Boxes } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, MATERIAL_UNIT_LABELS_LIST, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import type { SupplierComparisonPriceBasis } from "@/lib/helpers/supplier-comparison-price-basis";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import type { PurchasingMaterialsSupplierComparisonMutualItem } from "@/types/reports";
import ReportCard from "../../components/report-card";

const BASE_UNIT_VALUE = "__base__";

export type MutualItemsSort =
  | "savings-desc"
  | "savings-asc"
  | "gap-desc"
  | "gap-asc"
  | "name-asc"
  | "name-desc"
  | "code-asc"
  | "code-desc";

export default function MutualItemsTable({
  items,
  supplierAName,
  supplierBName,
  sort,
  onSortChange,
  displayUnit,
  onDisplayUnitChange,
  priceBasis,
  onPriceBasisChange,
}: {
  items: PurchasingMaterialsSupplierComparisonMutualItem[];
  supplierAName: string;
  supplierBName: string;
  sort: MutualItemsSort;
  onSortChange: (sort: MutualItemsSort) => void;
  displayUnit: MaterialUnit | null;
  onDisplayUnitChange: (unit: MaterialUnit | null) => void;
  priceBasis: SupplierComparisonPriceBasis;
  onPriceBasisChange: (basis: SupplierComparisonPriceBasis) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const showAvg = priceBasis === "avg";
  const sideColSpan = showAvg ? 3 : 2;
  const footerSpacerColSpan = showAvg ? 9 : 7;

  const sortedItems = useMemo(() => sortMutualItems(items, sort), [items, sort]);
  const totalUnitDiffA = items.reduce((sum, row) => {
    const diff = row.priceDifference ?? 0;
    return diff > 0 ? sum + diff : sum;
  }, 0);
  const totalUnitDiffB = items.reduce((sum, row) => {
    const diff = row.priceDifference ?? 0;
    return diff < 0 ? sum + Math.abs(diff) : sum;
  }, 0);
  const totalSavingsA = items.reduce((sum, row) => sum + (row.potentialSavingsA ?? 0), 0);
  const totalSavingsB = items.reduce((sum, row) => sum + (row.potentialSavingsB ?? 0), 0);

  return (
    <ReportCard
      title={translate("Mutual Materials", "المواد المشتركة")}
      description={translate(
        "Materials both suppliers have supplied in the selected period, with side-by-side prices.",
        "المواد التي وردها كلا الموردين في الفترة المحددة، مع أسعار جنباً إلى جنب.",
      )}
      icon={Boxes}
      accent="sky"
      headerAction={
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
          <Select
            value={priceBasis}
            onChange={(value) => {
              if (value === "last" || value === "avg") onPriceBasisChange(value);
            }}
            label={translate("Price basis", "أساس السعر")}
            data={[
              {
                value: "last",
                label: translate("Last price", "آخر سعر"),
              },
              {
                value: "avg",
                label: translate("Average price", "متوسط السعر"),
              },
            ]}
            allowDeselect={false}
            radius="md"
            className="min-w-40 flex-1 sm:w-[180px] sm:flex-none"
          />
          <Select
            value={displayUnit ?? BASE_UNIT_VALUE}
            onChange={(value) => {
              if (!value || value === BASE_UNIT_VALUE) onDisplayUnitChange(null);
              else onDisplayUnitChange(value as MaterialUnit);
            }}
            label={translate("Display unit", "وحدة العرض")}
            data={[
              { value: BASE_UNIT_VALUE, label: translate("Base unit", "الوحدة الأساسية") },
              ...MATERIAL_UNIT_LABELS_LIST.map((item) => ({
                value: item.value,
                label: locale === "ar" ? item.label.ar : item.label.en,
              })),
            ]}
            allowDeselect={false}
            radius="md"
            className="min-w-40 flex-1 sm:w-[180px] sm:flex-none"
          />
          <Select
            value={sort}
            onChange={(value) => {
              if (value) onSortChange(value as MutualItemsSort);
            }}
            label={translate("Sort by", "ترتيب حسب")}
            data={[
              {
                value: "savings-desc",
                label: translate("Savings (high to low)", "التوفير (من الأعلى للأقل)"),
              },
              {
                value: "savings-asc",
                label: translate("Savings (low to high)", "التوفير (من الأقل للأعلى)"),
              },
              {
                value: "gap-desc",
                label: translate("Price gap % (high to low)", "فجوة السعر % (من الأعلى للأقل)"),
              },
              {
                value: "gap-asc",
                label: translate("Price gap % (low to high)", "فجوة السعر % (من الأقل للأعلى)"),
              },
              { value: "name-asc", label: translate("Name (A-Z)", "الاسم (أ-ي)") },
              { value: "name-desc", label: translate("Name (Z-A)", "الاسم (ي-أ)") },
              { value: "code-asc", label: translate("Code (A-Z)", "الكود (أ-ي)") },
              { value: "code-desc", label: translate("Code (Z-A)", "الكود (ي-أ)") },
            ]}
            allowDeselect={false}
            radius="md"
            className="min-w-48 flex-1 sm:w-60 sm:flex-none"
          />
        </div>
      }
    >
      {sortedItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {translate("No mutual materials in this period", "لا توجد مواد مشتركة في هذه الفترة")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr className="border-b border-gray-200">
                <Table.Th rowSpan={2} className="bg-gray-50 text-center! align-bottom text-xs font-semibold text-gray-500">
                  #
                </Table.Th>
                <Table.Th rowSpan={2} className="bg-gray-50 text-start! align-bottom text-xs font-semibold text-gray-500">
                  {translate("Material", "المادة")}
                </Table.Th>
                <Table.Th rowSpan={2} className="bg-gray-50 text-center! align-bottom text-xs font-semibold text-gray-500">
                  {translate("Unit", "الوحدة")}
                </Table.Th>
                <Table.Th colSpan={sideColSpan} className="bg-gray-50 py-2.5 text-center!">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-200/80 text-[10px] font-semibold text-gray-600">
                      A
                    </span>
                    <span className="max-w-48 truncate text-xs font-semibold text-gray-800" title={supplierAName}>
                      {supplierAName}
                    </span>
                  </div>
                </Table.Th>
                <Table.Th colSpan={sideColSpan} className="bg-gray-50 py-2.5 text-center!">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-200/80 text-[10px] font-semibold text-gray-600">
                      B
                    </span>
                    <span className="max-w-48 truncate text-xs font-semibold text-gray-800" title={supplierBName}>
                      {supplierBName}
                    </span>
                  </div>
                </Table.Th>
                <Table.Th rowSpan={2} className="bg-gray-50 text-center! align-bottom text-xs font-semibold text-gray-500">
                  {translate("Cheaper", "الأرخص")}
                </Table.Th>
                <Table.Th rowSpan={2} className="bg-gray-50 text-center! align-bottom text-xs font-semibold text-gray-500">
                  {translate("Gap %", "الفجوة %")}
                </Table.Th>
                <Table.Th colSpan={2} className="bg-gray-50 py-2.5 text-center! text-xs font-semibold text-gray-500">
                  {translate(`Unit Diff (${currency})`, `فرق الوحدة (${currency})`)}
                </Table.Th>
                <Table.Th colSpan={2} className="bg-gray-50 py-2.5 text-center! text-xs font-semibold text-gray-500">
                  {translate(`Savings (${currency})`, `التوفير (${currency})`)}
                </Table.Th>
              </Table.Tr>
              <Table.Tr className="border-b border-gray-200">
                <SideSubHeaders showAvg={showAvg} />
                <SideSubHeaders showAvg={showAvg} />
                <SupplierSideSubHeaders supplierAName={supplierAName} supplierBName={supplierBName} tone="clay" />
                <SupplierSideSubHeaders supplierAName={supplierAName} supplierBName={supplierBName} tone="teal" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedItems.map((row, index) => {
                const { unit, factor } = resolveDisplayUnit(displayUnit, row.unitOfMeasurement, row.unitConversions ?? []);
                const unitDiff = row.priceDifference ?? 0;
                const unitDiffA = unitDiff > 0 ? unitDiff : null;
                const unitDiffB = unitDiff < 0 ? Math.abs(unitDiff) : null;
                const savingsA = row.potentialSavingsA ?? 0;
                const savingsB = row.potentialSavingsB ?? 0;

                return (
                  <Table.Tr key={row.materialCode} className="text-gray-600">
                    <Table.Td className="text-center font-medium text-gray-400">{index + 1}</Table.Td>
                    <Table.Td className="max-w-60 text-start">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="block truncate font-medium text-gray-800 hover:underline"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </ProtectedLink>
                      <span className="mt-0.5 block font-mono text-xs text-gray-500">{row.materialCode}</span>
                    </Table.Td>
                    <Table.Td className="text-center">{getMaterialUnitLabel(unit, locale)}</Table.Td>
                    <SideCells side={row.a} factor={factor} locale={locale} showAvg={showAvg} />
                    <SideCells side={row.b} factor={factor} locale={locale} showAvg={showAvg} />
                    <Table.Td className="text-center">
                      <CheaperBadge cheaper={row.cheaper} supplierAName={supplierAName} supplierBName={supplierBName} />
                    </Table.Td>
                    <Table.Td className="text-center">{formatPercent(row.priceGapPercent)}</Table.Td>
                    <Table.Td className="text-center text-clay-700">
                      {unitDiffA == null ? "-" : formatMoney(toDisplayUnitPrice(unitDiffA, factor))}
                    </Table.Td>
                    <Table.Td className="text-center text-clay-700">
                      {unitDiffB == null ? "-" : formatMoney(toDisplayUnitPrice(unitDiffB, factor))}
                    </Table.Td>
                    <Table.Td className="text-center font-semibold text-teal-700">
                      {savingsA > 0 ? formatMoney(savingsA) : "-"}
                    </Table.Td>
                    <Table.Td className="text-center font-semibold text-teal-700">
                      {savingsB > 0 ? formatMoney(savingsB) : "-"}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th className="text-start">{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th colSpan={footerSpacerColSpan} />
                <Table.Th className="text-center! font-semibold text-clay-700">{formatMoney(totalUnitDiffA)}</Table.Th>
                <Table.Th className="text-center! font-semibold text-clay-700">{formatMoney(totalUnitDiffB)}</Table.Th>
                <Table.Th className="text-center! font-semibold text-teal-700">{formatMoney(totalSavingsA)}</Table.Th>
                <Table.Th className="text-center! font-semibold text-teal-700">{formatMoney(totalSavingsB)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}

function SideSubHeaders({ showAvg }: { showAvg: boolean }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <>
      <Table.Th className="bg-gray-50 py-2 text-center! text-[11px] font-semibold text-gray-500">
        {translate("Qty", "الكمية")}
      </Table.Th>
      {showAvg && (
        <Table.Th className="bg-gray-50 py-2 text-center! text-[11px] font-semibold text-gray-500">
          {translate(`Avg (${currency})`, `المتوسط (${currency})`)}
        </Table.Th>
      )}
      <Table.Th className="bg-gray-50 py-2 text-center! text-[11px] font-semibold text-gray-500">
        {translate(`Last (${currency})`, `آخر سعر (${currency})`)}
      </Table.Th>
    </>
  );
}

function SupplierSideSubHeaders({
  supplierAName,
  supplierBName,
  tone,
}: {
  supplierAName: string;
  supplierBName: string;
  tone: "teal" | "clay";
}) {
  const toneClass = tone === "teal" ? "text-teal-700" : "text-clay-700";

  return (
    <>
      <Table.Th className={`bg-gray-50 py-2 text-center! text-[11px] font-semibold ${toneClass}`} title={supplierAName}>
        <span className="inline-flex max-w-28 items-center justify-center gap-1 truncate">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-200/80 text-[9px] font-semibold text-gray-600">
            A
          </span>
          <span className="truncate">{supplierAName}</span>
        </span>
      </Table.Th>
      <Table.Th className={`bg-gray-50 py-2 text-center! text-[11px] font-semibold ${toneClass}`} title={supplierBName}>
        <span className="inline-flex max-w-28 items-center justify-center gap-1 truncate">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-200/80 text-[9px] font-semibold text-gray-600">
            B
          </span>
          <span className="truncate">{supplierBName}</span>
        </span>
      </Table.Th>
    </>
  );
}

function SideCells({
  side,
  factor,
  locale,
  showAvg,
}: {
  side: PurchasingMaterialsSupplierComparisonMutualItem["a"];
  factor: number;
  locale: "en" | "ar";
  showAvg: boolean;
}) {
  return (
    <>
      <Table.Td className="text-center">{formatBaseQuantityForDisplay(side.quantity, factor)}</Table.Td>
      {showAvg && (
        <Table.Td className="text-center">{formatMoney(toDisplayUnitPrice(side.avgUnitPrice, factor))}</Table.Td>
      )}
      <Table.Td className="text-center">
        {side.lastUnitPrice == null ? (
          "-"
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span>{formatMoney(toDisplayUnitPrice(side.lastUnitPrice, factor))}</span>
            {side.lastPurchasedAt && (
              <span className="text-[11px] text-gray-400">{formatDate(side.lastPurchasedAt, locale)}</span>
            )}
          </div>
        )}
      </Table.Td>
    </>
  );
}

function CheaperBadge({
  cheaper,
  supplierAName,
  supplierBName,
}: {
  cheaper: "a" | "b" | "equal";
  supplierAName: string;
  supplierBName: string;
}) {
  const { translate } = useI18n();

  if (cheaper === "equal") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        {translate("Equal", "متساوي")}
      </span>
    );
  }

  const colors = getSemanticStatusColors("success");
  const label = cheaper === "a" ? supplierAName : supplierBName;

  return (
    <span
      className={`inline-flex max-w-40 truncate rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.surfaceClass} ${colors.textClass}`}
      title={label}
    >
      {label}
    </span>
  );
}

function formatPercent(value: number) {
  if (!Number.isFinite(value) || value === 0) return "0%";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

export function sortMutualItems(items: PurchasingMaterialsSupplierComparisonMutualItem[], sort: MutualItemsSort) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    switch (sort) {
      case "savings-desc":
        return right.potentialSavings - left.potentialSavings;
      case "savings-asc":
        return left.potentialSavings - right.potentialSavings;
      case "gap-desc":
        return right.priceGapPercent - left.priceGapPercent;
      case "gap-asc":
        return left.priceGapPercent - right.priceGapPercent;
      case "name-asc":
        return left.materialTitle.localeCompare(right.materialTitle);
      case "name-desc":
        return right.materialTitle.localeCompare(left.materialTitle);
      case "code-asc":
        return left.materialCode.localeCompare(right.materialCode);
      case "code-desc":
        return right.materialCode.localeCompare(left.materialCode);
      default:
        return 0;
    }
  });

  return sorted;
}
