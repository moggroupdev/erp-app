"use client";

import Link from "next/link";
import { Select, Table } from "@mantine/core";
import { FileText, CheckCircle, Clock } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsSupplierOrder } from "@/types/reports";
import ReportCard from "../../components/report-card";
import type { SupplierOrdersSort } from "./sort";

export default function SupplierOrdersTable({
  data,
  sort,
  onSortChange,
}: {
  data: PurchasingMaterialsSupplierOrder[];
  sort: SupplierOrdersSort;
  onSortChange: (sort: SupplierOrdersSort) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  function formatDisplayDate(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const totalAmount = data.reduce((sum, row) => sum + row.legacyInvoiceTotalPurchases, 0);

  return (
    <ReportCard
      title={translate("Purchase Orders", "أوامر الشراء")}
      description={translate(
        "All purchase orders from this supplier.",
        "جميع أوامر الشراء من هذا المورد.",
      )}
      icon={FileText}
      accent="amber"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as SupplierOrdersSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            {
              value: "invoice-date-desc",
              label: translate("Invoice date (newest)", "تاريخ الفاتورة (الأحدث)"),
            },
            {
              value: "invoice-date-asc",
              label: translate("Invoice date (oldest)", "تاريخ الفاتورة (الأقدم)"),
            },
            { value: "amount-desc", label: translate("Amount (high to low)", "المبلغ (من الأعلى للأقل)") },
            { value: "amount-asc", label: translate("Amount (low to high)", "المبلغ (من الأقل للأعلى)") },
            {
              value: "invoice-number-asc",
              label: translate("Invoice number (A-Z)", "رقم الفاتورة (أ-ي)"),
            },
            {
              value: "invoice-number-desc",
              label: translate("Invoice number (Z-A)", "رقم الفاتورة (ي-أ)"),
            },
            { value: "code-asc", label: translate("Code (A-Z)", "الكود (أ-ي)") },
            { value: "code-desc", label: translate("Code (Z-A)", "الكود (ي-أ)") },
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
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoice Date", "تاريخ الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate("Addition Permit Numbers", "أرقام إذن الإضافة")}
                </Table.Th>
                <Table.Th className="text-center text-gray-600">{translate("Status", "الحالة")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Amount (${translation.currency})`, `المبلغ (${translation.currency})`)}
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
                  <Table.Td>{formatDisplayDate(row.legacyInvoiceIssuedAt)}</Table.Td>
                  <Table.Td>
                    {row.inventoryTransactionLegacyNumbers.length > 0 ? (
                      <div className="flex max-w-64 flex-wrap gap-1.5">
                        {row.inventoryTransactionLegacyNumbers.map((legacyNumber) => (
                          <div key={legacyNumber} className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-600">{legacyNumber}</span>
                            <CopyButton text={legacyNumber} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {row.completedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle size={12} />
                        {translate("Completed", "مكتمل")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Clock size={12} />
                        {translate("Open", "مفتوح")}
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="font-semibold text-gray-800">
                    {formatMoney(row.legacyInvoiceTotalPurchases)}
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
                <Table.Th>{formatMoney(totalAmount)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
