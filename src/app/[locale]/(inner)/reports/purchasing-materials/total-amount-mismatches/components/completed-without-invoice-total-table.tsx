"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { FileWarning } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsCompletedWithoutInvoiceTotalOrder } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function CompletedWithoutInvoiceTotalTable({
  data,
}: {
  data: PurchasingMaterialsCompletedWithoutInvoiceTotalOrder[];
}) {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;
  const totalCalculatedAmount = data.reduce((sum, row) => sum + row.calculatedTotalAmount, 0);

  return (
    <ReportCard
      title={translate("Completed Orders Without Invoice Total", "أوامر مكتملة بدون إجمالي فاتورة")}
      description={translate(
        "Completed purchase orders that have no invoice total purchases value.",
        "أوامر التوريد المكتملة بدون قيمة إجمالي مشتريات الفاتورة.",
      )}
      icon={FileWarning}
      accent="rose"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {translate(
            "No completed orders are missing an invoice total for this period.",
            "لا توجد أوامر مكتملة بدون إجمالي فاتورة في هذه الفترة.",
          )}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Supplier", "المورد")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Calculated Total (${currency})`, `الإجمالي المحسوب (${currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.orderId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={getLocalizedHref(`/procurement/material-orders/${row.orderId}`)}
                        className="font-mono font-medium text-gray-800 hover:underline"
                      >
                        {row.orderCode}
                      </Link>
                      <CopyButton text={row.orderCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {row.legacyInvoiceNumber ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-gray-600">{row.legacyInvoiceNumber}</span>
                        <CopyButton text={row.legacyInvoiceNumber} />
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Link
                      href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                      className="text-gray-800 hover:underline"
                    >
                      {row.supplierName}
                    </Link>
                  </Table.Td>
                  <Table.Td className="font-semibold text-orange-600">{formatMoney(row.calculatedTotalAmount)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th className="font-semibold text-orange-600">{formatMoney(totalCalculatedAmount)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
