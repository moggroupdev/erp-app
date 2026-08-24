"use client";

import Link from "next/link";
import { Select, Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsByMainCategory } from "@/types/reports";
import ReportCard from "../../components/report-card";
import type { SupplierCategoriesSort } from "./sort";

export default function SupplierCategoriesTable({
  data,
  sort,
  onSortChange,
}: {
  data: PurchasingMaterialsByMainCategory[];
  sort: SupplierCategoriesSort;
  onSortChange: (sort: SupplierCategoriesSort) => void;
}) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const totalMaterials = data.reduce((sum, row) => sum + row.materialCount, 0);
  const totalQuantity = data.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalSpend = data.reduce((sum, row) => sum + row.totalSpend, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <ReportCard
      title={translate("Spending by Main Category", "القيمة حسب الفئة الرئيسية")}
      description={translate(
        "Purchase spend from this supplier grouped by main material category.",
        "قيمة المشتريات من هذا المورد مجمّع حسب الفئة الرئيسية للمواد.",
      )}
      icon={FolderTree}
      accent="teal"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as SupplierCategoriesSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            { value: "spend-desc", label: translate("Spend (high to low)", "القيمة (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Spend (low to high)", "القيمة (من الأقل للأعلى)") },
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
            { value: "name-asc", label: translate("Name (A-Z)", "الاسم (أ-ي)") },
            { value: "name-desc", label: translate("Name (Z-A)", "الاسم (ي-أ)") },
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
                <Table.Th className="text-gray-600">{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Materials", "المواد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Spend (${translation.currency})`, `إجمالي القيمة (${translation.currency})`)}
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
                      href={getLocalizedHref(
                        `/reports/purchasing-materials/category-stats?mainCategoryId=${row.mainCategoryId}`,
                      )}
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
