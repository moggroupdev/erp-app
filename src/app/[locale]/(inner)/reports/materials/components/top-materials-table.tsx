"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { Trophy } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import MoneyViewer from "@/components/ui/money-viewer";
import type { MaterialsInventoryTopMaterial } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopMaterialsTable({ data }: { data: MaterialsInventoryTopMaterial[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <ReportCard
      title={translate("Highest-Value Materials", "أعلى المواد قيمة")}
      description={translate(
        "The ten materials with the largest inventory value (quantity × unit cost). Click a title to open details.",
        "أعلى عشر مواد من حيث قيمة المخزون (الكمية × تكلفة الوحدة). انقر على العنوان لفتح التفاصيل.",
      )}
      icon={Trophy}
      accent="sky"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-stone-50">
              <Table.Tr>
                <Table.Th className="text-stone-600">#</Table.Th>
                <Table.Th className="text-stone-600">{translate("Item Name", "اسم الصنف")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Unit", "الوحدة")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Qty", "الكمية")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Unit Cost", "تكلفة الوحدة")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Total Value", "القيمة الإجمالية")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((material, index) => (
                <Table.Tr key={material.code} className="text-stone-600">
                  <Table.Td className="font-medium text-stone-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[240px] truncate font-medium text-stone-800">
                    <Link
                      href={getLocalizedHref(`/warehouse/materials/${material.code}`)}
                      className="text-gray-800 hover:underline"
                      title={material.title}
                    >
                      {material.title}
                    </Link>
                  </Table.Td>
                  <Table.Td className="font-mono text-xs text-stone-500">{material.code}</Table.Td>
                  <Table.Td>{getMaterialUnitLabel(material.unit, locale)}</Table.Td>
                  <Table.Td>{material.quantity}</Table.Td>
                  <Table.Td>
                    <MoneyViewer amount={material.unitCost} currency={translation.currency} />
                  </Table.Td>
                  <Table.Td className="font-semibold text-stone-800">
                    <MoneyViewer amount={material.value} currency={translation.currency} />
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
