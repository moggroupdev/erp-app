"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Table } from "@mantine/core";
import { History, Scale } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { Locale } from "@/lib/i18n/types";
import { getAveragePriceGapCauseLabel, type AveragePriceGapCause } from "@/lib/constants/enums/derived/average-price-gap-causes";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsAveragePriceGapRow } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function AveragePriceGapsTable({
  data,
  emptyMessage,
}: {
  data: PurchasingMaterialsAveragePriceGapRow[];
  emptyMessage: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <ReportCard
      title={translate("Flagged materials", "المواد المعلمة")}
      description={translate(
        "Each stored average price is compared with the quantity-weighted purchase price in the material base unit. Open the price history to review it.",
        "يُقارن كل سعر متوسط مخزن بمتوسط أسعار الشراء المرجح بالكمية بوحدة المادة الأساسية. افتح تاريخ الأسعار للمراجعة.",
      )}
      icon={Scale}
      accent="rose"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Stored average (${currency})`, `السعر المتوسط (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Weighted purchase (${currency})`, `متوسط الشراء المرجح (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Ratio", "النسبة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Lines", "البنود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Quantity purchased", "الكمية المشتراة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Likely cause", "السبب")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.materialCode} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="max-w-56 truncate font-medium text-gray-800 hover:underline"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </ProtectedLink>
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIAL_PURCHASING_PRICE_HISTORY_REPORT}
                        href={`/reports/purchasing-materials/price-history?materialCode=${row.materialCode}`}
                        className="hover:text-haze-700 shrink-0 text-gray-400"
                        title={translate("Price history", "تاريخ الأسعار")}
                      >
                        <History size={14} />
                      </ProtectedLink>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-500">{row.materialCode}</span>
                      <CopyButton text={row.materialCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <PriceWithUnit amount={row.unitPrice} unit={row.unitOfMeasurement} locale={locale} />
                  </Table.Td>
                  <Table.Td>
                    <PriceWithUnit amount={row.weightedAveragePurchasePrice} unit={row.unitOfMeasurement} locale={locale} />
                  </Table.Td>
                  <Table.Td className="font-medium text-gray-800">{formatRatio(row.ratio)}</Table.Td>
                  <Table.Td className="tabular-nums">{row.lineCount}</Table.Td>
                  <Table.Td>
                    {formatQuantity(row.totalQuantityPurchased)}
                    <span className="ms-1 text-xs text-gray-400">{getMaterialUnitLabel(row.unitOfMeasurement, locale)}</span>
                  </Table.Td>
                  <Table.Td>
                    <CauseBadge cause={row.cause} label={getAveragePriceGapCauseLabel(row.cause, locale)} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}

function PriceWithUnit({ amount, unit, locale }: { amount: number; unit: MaterialUnit; locale: Locale }) {
  return (
    <>
      {formatMoney(amount)}
      <span className="ms-1 text-xs text-gray-400">/ {getMaterialUnitLabel(unit, locale)}</span>
    </>
  );
}

function formatRatio(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return "-";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio);
  return `x${formatted}`;
}

function CauseBadge({ cause, label }: { cause: AveragePriceGapCause; label: string }) {
  const colors = getSemanticStatusColors(cause === "drift" ? "warning" : "danger");

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.surfaceClass} ${colors.textClass}`}
    >
      {label}
    </span>
  );
}
