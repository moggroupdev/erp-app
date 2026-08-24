"use client";

import Link from "next/link";
import { Select, Table } from "@mantine/core";
import { Boxes } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsByMaterial } from "@/types/reports";
import ReportCard from "../../components/report-card";
import type { CategoryMaterialsSort } from "./sort";

export default function CategoryMaterialsTable({
  data,
  sort,
  onSortChange,
}: {
  data: PurchasingMaterialsByMaterial[];
  sort: CategoryMaterialsSort;
  onSortChange: (sort: CategoryMaterialsSort) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const totalQuantity = data.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalSpend = data.reduce((sum, row) => sum + row.totalSpend, 0);

  return (
    <ReportCard
      title={translate("Purchased Materials", "المواد المشتراة")}
      description={translate(
        "All materials purchased within this category.",
        "جميع المواد المشتراة ضمن هذه الفئة.",
      )}
      icon={Boxes}
      accent="sky"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as CategoryMaterialsSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            { value: "spend-desc", label: translate("Spend (high to low)", "القيمة (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Spend (low to high)", "القيمة (من الأقل للأعلى)") },
            { value: "qty-desc", label: translate("Quantity (high to low)", "الكمية (من الأعلى للأقل)") },
            { value: "qty-asc", label: translate("Quantity (low to high)", "الكمية (من الأقل للأعلى)") },
            {
              value: "avg-desc",
              label: translate("Avg unit price (high to low)", "متوسط سعر الوحدة (من الأعلى للأقل)"),
            },
            {
              value: "avg-asc",
              label: translate("Avg unit price (low to high)", "متوسط سعر الوحدة (من الأقل للأعلى)"),
            },
            { value: "name-asc", label: translate("Name (A–Z)", "الاسم (أ–ي)") },
            { value: "name-desc", label: translate("Name (Z–A)", "الاسم (ي–أ)") },
            { value: "code-asc", label: translate("Code (A–Z)", "الكود (أ–ي)") },
            { value: "code-desc", label: translate("Code (Z–A)", "الكود (ي–أ)") },
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
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty Ordered", "الكمية المطلوبة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Spend (${translation.currency})`, `إجمالي القيمة (${translation.currency})`)}
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
                  <Table.Td>{getMaterialUnitLabel(row.unitOfMeasurement, locale)}</Table.Td>
                  <Table.Td>{formatQuantity(row.totalQuantity)}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalSpend)}</Table.Td>
                  <Table.Td>{formatMoney(row.avgUnitPrice)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th>{formatQuantity(totalQuantity)}</Table.Th>
                <Table.Th>{formatMoney(totalSpend)}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
