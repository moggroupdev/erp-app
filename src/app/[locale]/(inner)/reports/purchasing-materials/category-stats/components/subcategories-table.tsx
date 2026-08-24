"use client";

import { Select, Table } from "@mantine/core";
import { Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsBySubCategory } from "@/types/reports";
import ReportCard from "../../components/report-card";
import type { CategorySubCategoriesSort } from "./sort";

export default function CategorySubCategoriesTable({
  data,
  sort,
  onSortChange,
}: {
  data: PurchasingMaterialsBySubCategory[];
  sort: CategorySubCategoriesSort;
  onSortChange: (sort: CategorySubCategoriesSort) => void;
}) {
  const { translate, translation } = useI18n();

  const totalMaterials = data.reduce((sum, row) => sum + row.materialCount, 0);
  const totalQuantity = data.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalSpend = data.reduce((sum, row) => sum + row.totalSpend, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <ReportCard
      title={translate("Value by Subcategory", "القيمة حسب الفئة الفرعية")}
      description={translate(
        "Purchase value in this main category broken down by subcategory.",
        "قيمة المشتريات ضمن هذه الفئة الرئيسية مفصّلة حسب الفئة الفرعية.",
      )}
      icon={Layers}
      accent="teal"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as CategorySubCategoriesSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            { value: "spend-desc", label: translate("Value (high to low)", "القيمة (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Value (low to high)", "القيمة (من الأقل للأعلى)") },
            { value: "qty-desc", label: translate("Quantity (high to low)", "الكمية (من الأعلى للأقل)") },
            { value: "qty-asc", label: translate("Quantity (low to high)", "الكمية (من الأقل للأعلى)") },
            {
              value: "materials-desc",
              label: translate("Materials (high to low)", "المواد (من الأعلى للأقل)"),
            },
            {
              value: "materials-asc",
              label: translate("Materials (low to high)", "المواد (من الأقل للأعلى)"),
            },
            { value: "name-asc", label: translate("Name (A–Z)", "الاسم (أ–ي)") },
            { value: "name-desc", label: translate("Name (Z–A)", "الاسم (ي–أ)") },
          ]}
          allowDeselect={false}
          radius="md"
          w={240}
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
                <Table.Th className="text-gray-600">{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Materials", "المواد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Value (${translation.currency})`, `إجمالي القيمة (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Percentage", "النسبة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.subCategoryId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-[300px] truncate font-medium text-gray-800" title={row.subCategoryTitle}>
                    {row.subCategoryTitle}
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
                <Table.Th>{totalMaterials}</Table.Th>
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
