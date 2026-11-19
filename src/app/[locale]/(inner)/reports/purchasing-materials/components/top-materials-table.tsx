"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Select, Table } from "@mantine/core";
import { Boxes } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import {
  getMaterialUnitLabel,
  MATERIAL_UNIT_LABELS_LIST,
  type MaterialUnit,
} from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { mapBaseQuantityMaterialRowForDisplay } from "@/lib/helpers/unit-conversion";
import type { PurchasingMaterialsByMaterial } from "@/types/reports";
import ReportCard from "./report-card";

const BASE_UNIT_VALUE = "__base__";

export default function TopMaterialsTable({
  data,
  grandTotal,
  displayUnit,
  onDisplayUnitChange,
}: {
  data: PurchasingMaterialsByMaterial[];
  grandTotal: number;
  displayUnit: MaterialUnit | null;
  onDisplayUnitChange: (unit: MaterialUnit | null) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const totalSpend = data.reduce((sum, row) => sum + row.totalSpend, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatShare(value: number) {
    return `${percentageFormatter.format(grandTotal === 0 ? 0 : (value / grandTotal) * 100)}%`;
  }

  return (
    <ReportCard
      title={translate("Top Materials by Value", "أعلى المواد قيمة")}
      description={translate(
        "Materials ranked by allocated invoice total purchases.",
        "المواد مرتبة حسب إجمالي مشتريات الفواتير الموزعة.",
      )}
      icon={Boxes}
      accent="sky"
      headerAction={
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
          w={180}
        />
      }
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Value (${translation.currency})`, `إجمالي القيمة (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Percentage", "النسبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Avg Unit Price (${translation.currency})`, `متوسط سعر الوحدة (${translation.currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => {
                const { unit, factor, displayAvgUnitPrice } = mapBaseQuantityMaterialRowForDisplay(row, displayUnit);

                return (
                  <Table.Tr key={row.materialCode} className="text-gray-600">
                    <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                    <Table.Td className="max-w-60 truncate font-medium text-gray-800">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="text-gray-800 hover:underline"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </ProtectedLink>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-500">{row.materialCode}</span>
                        <CopyButton text={row.materialCode} />
                      </div>
                    </Table.Td>
                    <Table.Td>{getMaterialUnitLabel(unit, locale)}</Table.Td>
                    <Table.Td>{formatBaseQuantityForDisplay(row.totalQuantity, factor)}</Table.Td>
                    <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalSpend)}</Table.Td>
                    <Table.Td>{formatShare(row.totalSpend)}</Table.Td>
                    <Table.Td>{formatMoney(displayAvgUnitPrice)}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th>{formatMoney(totalSpend)}</Table.Th>
                <Table.Th>{formatShare(totalSpend)}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
