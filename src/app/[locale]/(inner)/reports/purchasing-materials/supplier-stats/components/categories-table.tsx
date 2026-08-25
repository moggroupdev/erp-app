"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Select, Table } from "@mantine/core";
import { FolderTree } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type {
  PurchasingMaterialsByMainCategory,
  PurchasingMaterialsSupplierBySubCategory,
} from "@/types/reports";
import ReportCard from "../../components/report-card";
import { buildSupplierCategoryGroups, type SupplierCategoriesSort } from "./sort";

const COL = {
  index: "w-[6%]",
  name: "w-[34%]",
  materials: "w-[12%]",
  value: "w-[18%]",
  percentCategory: "w-[15%]",
  percentSupplier: "w-[15%]",
} as const;

export default function SupplierCategoriesTable({
  categories,
  subCategories,
  sort,
  onSortChange,
}: {
  categories: PurchasingMaterialsByMainCategory[];
  subCategories: PurchasingMaterialsSupplierBySubCategory[];
  sort: SupplierCategoriesSort;
  onSortChange: (sort: SupplierCategoriesSort) => void;
}) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const groups = useMemo(
    () => buildSupplierCategoryGroups(categories, subCategories, sort),
    [categories, subCategories, sort],
  );

  const totalSpend = categories.reduce((sum, row) => sum + row.totalSpend, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatPercent(value: number, ofTotal: number) {
    return `${percentageFormatter.format(ofTotal === 0 ? 0 : (value / ofTotal) * 100)}%`;
  }

  return (
    <ReportCard
      title={translate("Value by Category", "القيمة حسب الفئة")}
      description={translate(
        "One table per main category. Rows are its subcategories; the total row is the category itself.",
        "جدول لكل فئة رئيسية. الصفوف هي فئاتها الفرعية، وصف الإجمالي يمثل الفئة نفسها.",
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
            { value: "spend-desc", label: translate("Value (high to low)", "القيمة (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Value (low to high)", "القيمة (من الأقل للأعلى)") },
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
      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ main, subs }) => (
            <section key={main.mainCategoryId} className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-stone-800">
                <Link
                  href={getLocalizedHref(
                    `/reports/purchasing-materials/category-stats?mainCategoryId=${main.mainCategoryId}`,
                  )}
                  className="text-stone-800 hover:underline"
                  title={main.mainCategoryTitle}
                >
                  {main.mainCategoryTitle}
                </Link>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-stone-100">
                <Table className="w-full table-fixed text-nowrap" verticalSpacing="sm" highlightOnHover>
                  <Table.Thead className="bg-gray-50">
                    <Table.Tr>
                      <Table.Th className={`${COL.index} text-gray-600`}>#</Table.Th>
                      <Table.Th className={`${COL.name} text-gray-600`}>
                        {translate("Subcategory", "الفئة الفرعية")}
                      </Table.Th>
                      <Table.Th className={`${COL.materials} text-gray-600`}>
                        {translate("Materials", "المواد")}
                      </Table.Th>
                      <Table.Th className={`${COL.value} text-gray-600`}>
                        {translate(
                          `Total Value (${translation.currency})`,
                          `إجمالي القيمة (${translation.currency})`,
                        )}
                      </Table.Th>
                      <Table.Th className={`${COL.percentCategory} text-gray-600`}>
                        {translate("% of category", "% من الفئة")}
                      </Table.Th>
                      <Table.Th className={`${COL.percentSupplier} text-gray-600`}>
                        {translate("% of supplier", "% من المورد")}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {subs.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                          {translate("No subcategories", "لا توجد فئات فرعية")}
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      subs.map((sub, index) => (
                        <Table.Tr key={sub.subCategoryId} className="text-gray-700">
                          <Table.Td className={`${COL.index} font-medium text-gray-400`}>{index + 1}</Table.Td>
                          <Table.Td className={`${COL.name} truncate font-medium`} title={sub.subCategoryTitle}>
                            {sub.subCategoryTitle}
                          </Table.Td>
                          <Table.Td className={`${COL.materials} font-medium`}>{sub.materialCount}</Table.Td>
                          <Table.Td className={`${COL.value} font-semibold text-gray-900`}>
                            {formatMoney(sub.totalSpend)}
                          </Table.Td>
                          <Table.Td className={`${COL.percentCategory} font-medium`}>
                            {formatPercent(sub.totalSpend, main.totalSpend)}
                          </Table.Td>
                          <Table.Td className={`${COL.percentSupplier} font-medium`}>
                            {formatPercent(sub.totalSpend, totalSpend)}
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                  <Table.Tfoot className="bg-gray-50">
                    <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                      <Table.Th className={COL.index} />
                      <Table.Th className={COL.name}>
                        {translate("Total", "الإجمالي")}
                        <span className="ms-1 font-normal text-stone-500">({main.mainCategoryTitle})</span>
                      </Table.Th>
                      <Table.Th className={COL.materials}>{main.materialCount}</Table.Th>
                      <Table.Th className={COL.value}>{formatMoney(main.totalSpend)}</Table.Th>
                      <Table.Th className={`${COL.percentCategory} font-medium`}>
                        {percentageFormatter.format(100)}%
                      </Table.Th>
                      <Table.Th className={`${COL.percentSupplier} font-medium`}>
                        {formatPercent(main.totalSpend, totalSpend)}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}
    </ReportCard>
  );
}
