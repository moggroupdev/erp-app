"use client";

import { Table } from "@mantine/core";
import { Layers3 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { AccountingSupplierInvoicesByOrderType } from "@/types/reports";
import ReportCard from "../../components/report-card";
import { getOrderTypeLabel } from "./order-type-labels";

export default function OrderTypeBreakdown({ data }: { data: AccountingSupplierInvoicesByOrderType[] }) {
  const { translate, translation } = useI18n();
  const currency = translation.currency;
  const hasRows = data.some((row) => row.invoiceCount > 0);

  return (
    <ReportCard
      title={translate("By Order Type", "حسب نوع الأمر")}
      description={translate(
        "Invoice counts and money totals split by the linked order type.",
        "عدد الفواتير وإجماليات المبالغ مقسمة حسب نوع الأمر المرتبط.",
      )}
      icon={Layers3}
      accent="sky"
    >
      {!hasRows ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">{translate("Order Type", "نوع الأمر")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoices", "الفواتير")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Purchases (${currency})`, `المشتريات (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Discount (${currency})`, `الخصم (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate(`VAT (${currency})`, `ضريبة القيمة المضافة (${currency})`)}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Withholding (${currency})`, `الاستقطاع (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total (${currency})`, `الإجمالي (${currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.orderType} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-800">{getOrderTypeLabel(row.orderType, translate)}</Table.Td>
                  <Table.Td>{row.invoiceCount}</Table.Td>
                  <Table.Td>{formatMoney(row.totalPurchases, currency)}</Table.Td>
                  <Table.Td>{formatMoney(row.totalDiscount, currency)}</Table.Td>
                  <Table.Td>{formatMoney(row.vatAmount, currency)}</Table.Td>
                  <Table.Td>{formatMoney(row.withholdingTaxAmount, currency)}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{formatMoney(row.totalAmount, currency)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
