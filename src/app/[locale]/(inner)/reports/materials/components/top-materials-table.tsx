"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { Trophy } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { MaterialsInventoryTopMaterial } from "@/types/reports";
import ReportCard from "./report-card";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";

type TopMaterialsTableProps = {
  data: MaterialsInventoryTopMaterial[];
  rankBy?: "value" | "quantity";
};

export default function TopMaterialsTable({ data, rankBy = "value" }: TopMaterialsTableProps) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const byQuantity = rankBy === "quantity";

  return (
    <ReportCard
      title={
        byQuantity
          ? translate("Highest-Quantity Materials", "أعلى المواد كمية")
          : translate("Highest-Value Materials", "أعلى المواد قيمة")
      }
      description={
        byQuantity
          ? translate(
              "The ten materials with the largest on-hand quantity. Click a title to open details.",
              "أعلى عشر مواد من حيث الكمية المتوفرة. انقر على العنوان لفتح التفاصيل.",
            )
          : translate(
              "The ten materials with the largest inventory value (quantity × unit price). Click a title to open details.",
              "أعلى عشر مواد من حيث قيمة المخزون (الكمية × سعر الوحدة). انقر على العنوان لفتح التفاصيل.",
            )
      }
      icon={Trophy}
      accent={byQuantity ? "amber" : "sky"}
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Item Name", "اسم الصنف")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty", "الكمية")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Value (${translation.currency})`, `القيمة الإجمالية (${translation.currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((material, index) => (
                <Table.Tr key={material.code} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-60 truncate font-medium text-gray-800">
                    <Link
                      href={getLocalizedHref(`/warehouse/materials/${material.code}`)}
                      className="text-gray-800 hover:underline"
                      title={material.title}
                    >
                      {material.title}
                    </Link>
                  </Table.Td>
                  <Table.Td className="font-mono text-xs text-gray-500">{material.code}</Table.Td>
                  <Table.Td>{getMaterialUnitLabel(material.unitOfMeasurement, locale)}</Table.Td>
                  <Table.Td>{formatQuantity(material.quantity)}</Table.Td>
                  <Table.Td>{formatMoney(material.unitPrice)}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(material.value)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
