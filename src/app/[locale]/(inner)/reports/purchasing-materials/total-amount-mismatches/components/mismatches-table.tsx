"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsTotalAmountMismatchOrder } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function MismatchesTable({ data }: { data: PurchasingMaterialsTotalAmountMismatchOrder[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;
  const totalCalculatedAmount = data.reduce((sum, row) => sum + row.calculatedTotalAmount, 0);
  const totalLegacyInvoicePurchases = data.reduce((sum, row) => sum + row.legacyInvoiceTotalPurchases, 0);
  const totalDifference = data.reduce((sum, row) => sum + row.difference, 0);
  const totalAbsoluteDifference = data.reduce((sum, row) => sum + Math.abs(row.difference), 0);

  return (
    <ReportCard
      title={translate("Mismatched Orders", "أوامر ذات فروقات")}
      description={translate(
        "Purchase orders where the calculated total amount differs from the invoice total purchases by at least 1%.",
        "أوامر التوريد التي يختلف فيها الإجمالي المحسوب عن إجمالي مشتريات الفاتورة بنسبة 1% على الأقل.",
      )}
      icon={AlertTriangle}
      accent="amber"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {translate("No mismatches found for this period.", "لا توجد فروقات في هذه الفترة.")}
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
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-center text-gray-600">{translate("Status", "الحالة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Calculated (${currency})`, `المحسوب (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Invoice Purchases (${currency})`, `مشتريات الفاتورة (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate(`Difference (${currency})`, `الفرق (${currency})`)}</Table.Th>
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
                  <Table.Td>
                    {new Date(row.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Table.Td>
                  <Table.Td>
                    {row.completedAt ? (
                      <span className="inline-flex gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle size={12} />
                        {translate("Completed", "مكتمل")}
                      </span>
                    ) : (
                      <span className="inline-flex gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Clock size={12} />
                        {translate("Open", "مفتوح")}
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="font-semibold text-orange-600">{formatMoney(row.calculatedTotalAmount)}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.legacyInvoiceTotalPurchases)}</Table.Td>
                  <Table.Td
                    className={`font-semibold ${
                      row.difference > 0 ? "text-emerald-700" : row.difference < 0 ? "text-rose-700" : "text-gray-800"
                    }`}
                  >
                    {formatMoney(row.difference)}
                  </Table.Td>
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
                <Table.Th className="font-semibold text-orange-600">{formatMoney(totalCalculatedAmount)}</Table.Th>
                <Table.Th className="font-semibold text-gray-800">{formatMoney(totalLegacyInvoicePurchases)}</Table.Th>
                <Table.Th
                  className={`font-semibold ${
                    totalDifference > 0
                      ? "text-emerald-700"
                      : totalDifference < 0
                        ? "text-rose-700"
                        : "text-gray-800"
                  }`}
                >
                  {formatMoney(totalDifference)}
                </Table.Th>
              </Table.Tr>
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Absolute Total", "الإجمالي المطلق")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th className="font-semibold text-orange-600">{formatMoney(totalAbsoluteDifference)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
