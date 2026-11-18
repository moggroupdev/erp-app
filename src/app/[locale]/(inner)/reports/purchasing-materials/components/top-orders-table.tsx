"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Table } from "@mantine/core";
import { FileText, CheckCircle, Clock } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsTopOrder } from "@/types/reports";
import ReportCard from "./report-card";

export default function TopOrdersTable({ data, grandTotal }: { data: PurchasingMaterialsTopOrder[]; grandTotal: number }) {
  const { locale, translate, translation } = useI18n();
  const totalAmount = data.reduce((sum, row) => sum + row.invoiceTotalPurchases, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatShare(value: number) {
    return `${percentageFormatter.format(grandTotal === 0 ? 0 : (value / grandTotal) * 100)}%`;
  }

  return (
    <ReportCard
      title={translate("Top Purchase Orders", "أعلى أوامر الشراء قيمة")}
      description={translate(
        "Largest purchase orders ranked by total amount.",
        "أكبر أوامر الشراء مرتبة حسب إجمالي المبلغ.",
      )}
      icon={FileText}
      accent="amber"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Supplier", "المورد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-center text-gray-600">{translate("Status", "الحالة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Amount (${translation.currency})`, `المبلغ (${translation.currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Share", "الحصة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.orderId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS}
                        href={`/procurement/material-orders/${row.orderId}`}
                        className="font-mono font-medium text-gray-800 hover:underline"
                      >
                        {row.orderCode}
                      </ProtectedLink>
                      <CopyButton text={row.orderCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {row.invoiceNumbers.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-gray-600">{row.invoiceNumbers.join(", ")}</span>
                        <CopyButton text={row.invoiceNumbers.join(", ")} />
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ProtectedLink
                      permission={PERMISSIONS.READ_SUPPLIERS}
                      href={`/procurement/suppliers/${row.supplierId}`}
                      className="text-gray-800 hover:underline"
                    >
                      {row.supplierName}
                    </ProtectedLink>
                  </Table.Td>
                  <Table.Td>
                    {new Date(row.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Table.Td>
                  <Table.Td>
                    {row.completedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                        <CheckCircle size={12} />
                        {translate("Completed", "مكتمل")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ochre-50 px-2 py-0.5 text-xs font-medium text-ochre-700">
                        <Clock size={12} />
                        {translate("Open", "مفتوح")}
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.invoiceTotalPurchases)}</Table.Td>
                  <Table.Td>{formatShare(row.invoiceTotalPurchases)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th>{formatMoney(totalAmount)}</Table.Th>
                <Table.Th>{formatShare(totalAmount)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
