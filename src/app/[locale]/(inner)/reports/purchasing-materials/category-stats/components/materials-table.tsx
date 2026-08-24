"use client";

import { useMemo, useState } from "react";
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

type SortOption =
  | "spend-desc"
  | "spend-asc"
  | "qty-desc"
  | "qty-asc"
  | "avg-desc"
  | "avg-asc"
  | "name-asc"
  | "name-desc"
  | "code-asc"
  | "code-desc";

export default function CategoryMaterialsTable({ data }: { data: PurchasingMaterialsByMaterial[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const [sort, setSort] = useState<SortOption>("spend-desc");

  const sorted = useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => {
      switch (sort) {
        case "spend-desc":
          return b.totalSpend - a.totalSpend;
        case "spend-asc":
          return a.totalSpend - b.totalSpend;
        case "qty-desc":
          return b.totalQuantity - a.totalQuantity;
        case "qty-asc":
          return a.totalQuantity - b.totalQuantity;
        case "avg-desc":
          return b.avgUnitPrice - a.avgUnitPrice;
        case "avg-asc":
          return a.avgUnitPrice - b.avgUnitPrice;
        case "name-asc":
          return a.materialTitle.localeCompare(b.materialTitle);
        case "name-desc":
          return b.materialTitle.localeCompare(a.materialTitle);
        case "code-asc":
          return a.materialCode.localeCompare(b.materialCode);
        case "code-desc":
          return b.materialCode.localeCompare(a.materialCode);
        default:
          return 0;
      }
    });
    return rows;
  }, [data, sort]);

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
            if (value) setSort(value as SortOption);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            { value: "spend-desc", label: translate("Spend (high to low)", "الإنفاق (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Spend (low to high)", "الإنفاق (من الأقل للأعلى)") },
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
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="max-h-128 overflow-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="sticky top-0 bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
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
              {sorted.map((row, index) => (
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
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
