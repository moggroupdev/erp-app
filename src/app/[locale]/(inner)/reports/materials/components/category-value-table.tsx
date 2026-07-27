"use client";

import { Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialsCategoryStatsBySubCategory, MaterialsInventoryByMainCategory } from "@/types/reports";
import ReportCard from "./report-card";
import { formatMoney } from "@/lib/helpers/format-money";

type Props =
  | { level: "main"; data: MaterialsInventoryByMainCategory[] }
  | { level: "sub"; data: MaterialsCategoryStatsBySubCategory[] };

export default function CategoryValueTable(props: Props) {
  const { translate, translation } = useI18n();
  const isMain = props.level === "main";

  const title = isMain
    ? translate("Value by Main Category", "القيمة حسب الفئة الرئيسية")
    : translate("Value by Subcategory", "القيمة حسب الفئة الفرعية");

  const description = isMain
    ? translate(
        "Inventory value grouped by main material category, sorted from highest to lowest.",
        "قيمة المخزون مجمّعة حسب الفئة الرئيسية للمواد، مرتبة من الأعلى إلى الأدنى.",
      )
    : translate(
        "Inventory value grouped by subcategory within the selected main category, sorted from highest to lowest.",
        "قيمة المخزون مجمّعة حسب الفئة الفرعية ضمن الفئة الرئيسية المحددة، مرتبة من الأعلى إلى الأدنى.",
      );

  const categoryColumnLabel = isMain ? translate("Category", "الفئة") : translate("Subcategory", "الفئة الفرعية");

  const rows = isMain
    ? props.data.map((category) => ({
        id: category.mainCategoryId,
        title: category.mainCategoryTitle,
        count: category.count,
        totalValue: category.totalValue,
      }))
    : props.data.map((category) => ({
        id: category.subCategoryId,
        title: category.subCategoryTitle,
        count: category.count,
        totalValue: category.totalValue,
      }));
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.totalValue, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <ReportCard title={title} description={description} icon={FolderTree} accent="teal">
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{categoryColumnLabel}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Items", "العناصر")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Value (${translation.currency})`, `القيمة (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Percentage", "النسبة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => (
                <Table.Tr key={row.id} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[300px] truncate font-medium text-gray-800" title={row.title}>
                    {row.title}
                  </Table.Td>
                  <Table.Td>{row.count}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalValue)}</Table.Td>
                  <Table.Td>
                    {percentageFormatter.format(totalValue === 0 ? 0 : (row.totalValue / totalValue) * 100)}%
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th>{totalCount}</Table.Th>
                <Table.Th>{formatMoney(totalValue)}</Table.Th>
                <Table.Th>{percentageFormatter.format(rows.length === 0 ? 0 : 100)}%</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
