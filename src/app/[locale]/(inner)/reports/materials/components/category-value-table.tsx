"use client";

import { Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import MoneyViewer from "@/components/ui/money-viewer";
import type { MaterialsCategoryStatsBySubCategory, MaterialsInventoryByMainCategory } from "@/types/reports";
import ReportCard from "./report-card";

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

  const categoryColumnLabel = isMain
    ? translate("Category", "الفئة")
    : translate("Subcategory", "الفئة الفرعية");

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

  return (
    <ReportCard title={title} description={description} icon={FolderTree} accent="teal">
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-stone-50">
              <Table.Tr>
                <Table.Th className="text-stone-600">#</Table.Th>
                <Table.Th className="text-stone-600">{categoryColumnLabel}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Items", "العناصر")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Value", "القيمة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => (
                <Table.Tr key={row.id} className="text-stone-600">
                  <Table.Td className="font-medium text-stone-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[300px] truncate font-medium text-stone-800" title={row.title}>
                    {row.title}
                  </Table.Td>
                  <Table.Td>{row.count}</Table.Td>
                  <Table.Td className="font-semibold text-stone-800">
                    <MoneyViewer amount={row.totalValue} currency={translation.currency} />
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
