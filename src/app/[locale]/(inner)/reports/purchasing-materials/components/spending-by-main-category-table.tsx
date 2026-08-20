"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsByMainCategory } from "@/types/reports";
import ReportCard from "./report-card";

export default function SpendingByMainCategoryTable({ data }: { data: PurchasingMaterialsByMainCategory[] }) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const totalMaterialCount = data.reduce((sum, row) => sum + row.materialCount, 0);
  const totalQuantity = data.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalSpend = data.reduce((sum, row) => sum + row.totalSpend, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <ReportCard
      title={translate("Spending by Main Category", "الإنفاق حسب الفئة الرئيسية")}
      description={translate(
        "Purchase spend grouped by main material category, sorted from highest to lowest.",
        "إنفاق الشراء مجمّع حسب الفئة الرئيسية للمواد، مرتب من الأعلى إلى الأدنى.",
      )}
      icon={FolderTree}
      accent="teal"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Materials", "المواد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Spend (${translation.currency})`, `إجمالي الإنفاق (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Percentage", "النسبة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.mainCategoryId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[300px] truncate font-medium text-gray-800">
                    <Link
                      href={getLocalizedHref(`/reports/materials/category-stats?mainCategoryId=${row.mainCategoryId}`)}
                      className="text-gray-800 hover:underline"
                      title={row.mainCategoryTitle}
                    >
                      {row.mainCategoryTitle}
                    </Link>
                  </Table.Td>
                  <Table.Td>{row.materialCount}</Table.Td>
                  <Table.Td>{formatQuantity(row.totalQuantity)}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalSpend)}</Table.Td>
                  <Table.Td>
                    {percentageFormatter.format(totalSpend === 0 ? 0 : (row.totalSpend / totalSpend) * 100)}%
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th>{totalMaterialCount}</Table.Th>
                <Table.Th>{formatQuantity(totalQuantity)}</Table.Th>
                <Table.Th>{formatMoney(totalSpend)}</Table.Th>
                <Table.Th>{percentageFormatter.format(data.length === 0 ? 0 : 100)}%</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
