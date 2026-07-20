"use client";

import { Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import MoneyViewer from "@/components/ui/money-viewer";
import type { MaterialsInventoryByMainCategory } from "@/types/reports";
import ReportCard from "./report-card";

export default function MainCategoryTable({ data }: { data: MaterialsInventoryByMainCategory[] }) {
  const { translate, translation } = useI18n();

  return (
    <ReportCard
      title={translate("Value by Main Category", "القيمة حسب الفئة الرئيسية")}
      description={translate(
        "Inventory value grouped by main material category, sorted from highest to lowest.",
        "قيمة المخزون مجمّعة حسب الفئة الرئيسية للمواد، مرتبة من الأعلى إلى الأدنى.",
      )}
      icon={FolderTree}
      accent="teal"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-stone-50">
              <Table.Tr>
                <Table.Th className="text-stone-600">#</Table.Th>
                <Table.Th className="text-stone-600">{translate("Category", "الفئة")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Items", "العناصر")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Value", "القيمة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((category, index) => (
                <Table.Tr key={category.mainCategoryId} className="text-stone-600">
                  <Table.Td className="font-medium text-stone-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[300px] truncate font-medium text-stone-800" title={category.mainCategoryTitle}>
                    {category.mainCategoryTitle}
                  </Table.Td>
                  <Table.Td>{category.count}</Table.Td>
                  <Table.Td className="font-semibold text-stone-800">
                    <MoneyViewer amount={category.totalValue} currency={translation.currency} />
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
