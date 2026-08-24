"use client";

import Link from "next/link";
import { Select, Table } from "@mantine/core";
import { Truck } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsBySupplier } from "@/types/reports";
import ReportCard from "../../components/report-card";
import type { CategorySuppliersSort } from "./sort";

export default function CategorySuppliersTable({
  data,
  sort,
  onSortChange,
}: {
  data: PurchasingMaterialsBySupplier[];
  sort: CategorySuppliersSort;
  onSortChange: (sort: CategorySuppliersSort) => void;
}) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <ReportCard
      title={translate("Suppliers", "الموردون")}
      description={translate(
        "All suppliers with purchase orders that include materials from this category.",
        "جميع الموردين الذين لديهم أوامر شراء تتضمن مواداً من هذه الفئة.",
      )}
      icon={Truck}
      accent="amber"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as CategorySuppliersSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            { value: "spend-desc", label: translate("Spend (high to low)", "الإنفاق (من الأعلى للأقل)") },
            { value: "spend-asc", label: translate("Spend (low to high)", "الإنفاق (من الأقل للأعلى)") },
            { value: "orders-desc", label: translate("Orders (high to low)", "الطلبات (من الأعلى للأقل)") },
            { value: "orders-asc", label: translate("Orders (low to high)", "الطلبات (من الأقل للأعلى)") },
            { value: "avg-desc", label: translate("Avg order (high to low)", "متوسط الطلب (من الأعلى للأقل)") },
            { value: "avg-asc", label: translate("Avg order (low to high)", "متوسط الطلب (من الأقل للأعلى)") },
            { value: "name-asc", label: translate("Name (A–Z)", "الاسم (أ–ي)") },
            { value: "name-desc", label: translate("Name (Z–A)", "الاسم (ي–أ)") },
          ]}
          allowDeselect={false}
          radius="md"
          w={220}
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
                <Table.Th className="text-gray-600">{translate("Supplier", "المورد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Orders", "الطلبات")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total Spend (${translation.currency})`, `إجمالي الإنفاق (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Avg Order (${translation.currency})`, `متوسط الطلب (${translation.currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.supplierId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="max-w-60 truncate font-medium text-gray-800">
                    <Link
                      href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                      className="text-gray-800 hover:underline"
                    >
                      {row.supplierName}
                    </Link>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-500">{row.supplierCode}</span>
                      <CopyButton text={row.supplierCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>{row.orderCount}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalSpend)}</Table.Td>
                  <Table.Td>{formatMoney(row.avgOrderValue)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
