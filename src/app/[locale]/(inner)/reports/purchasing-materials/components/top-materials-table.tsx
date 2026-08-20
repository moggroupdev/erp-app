"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { Boxes } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsByMaterial } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopMaterialsTable({ data }: { data: PurchasingMaterialsByMaterial[] }) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <ReportCard
      title={translate("Top Materials by Spend", "أعلى المواد إنفاقاً")}
      description={translate(
        "Materials ranked by total purchase cost (quantity x unit price).",
        "المواد مرتبة حسب إجمالي تكلفة الشراء (الكمية x سعر الوحدة).",
      )}
      icon={Boxes}
      accent="sky"
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
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Spend (${translation.currency})`, `إجمالي الإنفاق (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Avg Unit Price (${translation.currency})`, `متوسط سعر الوحدة (${translation.currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.materialCode} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-60 truncate font-medium text-gray-800">
                    <Link
                      href={getLocalizedHref(`/warehouse/materials/${row.materialCode}`)}
                      className="text-gray-800 hover:underline"
                      title={row.materialTitle}
                    >
                      {row.materialTitle}
                    </Link>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-500">{row.materialCode}</span>
                      <CopyButton text={row.materialCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>{formatQuantity(row.totalQuantity)}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalSpend)}</Table.Td>
                  <Table.Td>{formatMoney(row.avgUnitPrice)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
