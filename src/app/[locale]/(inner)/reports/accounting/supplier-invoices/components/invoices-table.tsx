"use client";

import ProtectedLink from "@/components/ui/protected-link";
import CopyButton from "@/components/ui/copy-button";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Select, Table } from "@mantine/core";
import { FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import type { AccountingSupplierInvoiceRow } from "@/types/reports";
import ReportCard from "../../components/report-card";
import { getOrderLink, getOrderTypeLabel } from "./order-type-labels";
import { getSupplierInvoicesSortLabel, type SupplierInvoicesSort } from "./sort";

export default function InvoicesTable({
  data,
  sort,
  onSortChange,
}: {
  data: AccountingSupplierInvoiceRow[];
  sort: SupplierInvoicesSort;
  onSortChange: (sort: SupplierInvoicesSort) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;

  function formatMoneyOrBlank(value: number | null) {
    if (value == null) return "";
    return formatMoney(value);
  }

  const totals = data.reduce(
    (acc, row) => ({
      totalPurchases: acc.totalPurchases + (row.totalPurchases ?? 0),
      totalDiscount: acc.totalDiscount + (row.totalDiscount ?? 0),
      vatAmount: acc.vatAmount + (row.vatAmount ?? 0),
      withholdingTaxAmount: acc.withholdingTaxAmount + (row.withholdingTaxAmount ?? 0),
      totalAmount: acc.totalAmount + (row.totalAmount ?? 0),
    }),
    {
      totalPurchases: 0,
      totalDiscount: 0,
      vatAmount: 0,
      withholdingTaxAmount: 0,
      totalAmount: 0,
    },
  );

  return (
    <ReportCard
      title={translate("Invoices", "الفواتير")}
      description={translate(
        "All supplier invoices for the selected supplier and date range.",
        "جميع فواتير المورد للمورد والنطاق الزمني المحددين.",
      )}
      icon={FileText}
      accent="amber"
      headerAction={
        <Select
          value={sort}
          onChange={(value) => {
            if (value) onSortChange(value as SupplierInvoicesSort);
          }}
          label={translate("Sort by", "ترتيب حسب")}
          data={[
            {
              value: "issue-date-desc",
              label: getSupplierInvoicesSortLabel("issue-date-desc", translate),
            },
            {
              value: "issue-date-asc",
              label: getSupplierInvoicesSortLabel("issue-date-asc", translate),
            },
            {
              value: "total-desc",
              label: getSupplierInvoicesSortLabel("total-desc", translate),
            },
            {
              value: "total-asc",
              label: getSupplierInvoicesSortLabel("total-asc", translate),
            },
            {
              value: "invoice-number-asc",
              label: getSupplierInvoicesSortLabel("invoice-number-asc", translate),
            },
            {
              value: "invoice-number-desc",
              label: getSupplierInvoicesSortLabel("invoice-number-desc", translate),
            },
            {
              value: "created-at-desc",
              label: getSupplierInvoicesSortLabel("created-at-desc", translate),
            },
            {
              value: "created-at-asc",
              label: getSupplierInvoicesSortLabel("created-at-asc", translate),
            },
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
                <Table.Th className="text-gray-600">{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Issue Date", "تاريخ الإصدار")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Order Type", "نوع الأمر")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Order Code", "كود الأمر")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Purchases (${currency})`, `المشتريات (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Discount (${currency})`, `الخصم (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate(`VAT (${currency})`, `ضريبة القيمة المضافة (${currency})`)}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(
                    `Tax withholding deduction (${currency})`,
                    `الخصم تحت حساب الضريبة (${currency})`,
                  )}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Total (${currency})`, `الإجمالي (${currency})`)}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => {
                const orderLink = getOrderLink(row.order.type, row.order.id);

                return (
                  <Table.Tr key={row.id} className="text-gray-600">
                    <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <ProtectedLink
                          permission={PERMISSIONS.READ_SUPPLIER_INVOICES}
                          href={`/procurement/supplier-invoices/${row.id}`}
                          className="font-mono font-medium text-gray-800 hover:underline"
                        >
                          {row.invoiceNumber}
                        </ProtectedLink>
                        <CopyButton text={row.invoiceNumber} />
                      </div>
                    </Table.Td>
                    <Table.Td>{row.issuedAt ? formatDate(row.issuedAt, locale) : ""}</Table.Td>
                    <Table.Td>{getOrderTypeLabel(row.order.type, translate)}</Table.Td>
                    <Table.Td>
                      {orderLink ? (
                        <div className="flex items-center gap-1.5">
                          <ProtectedLink
                            permission={orderLink.permission}
                            href={orderLink.href}
                            className="font-mono font-medium text-gray-800 hover:underline"
                          >
                            {row.order.code}
                          </ProtectedLink>
                          <CopyButton text={row.order.code} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-800">{row.order.code}</span>
                          {row.order.code ? <CopyButton text={row.order.code} /> : null}
                        </div>
                      )}
                    </Table.Td>
                    <Table.Td>{formatMoneyOrBlank(row.totalPurchases)}</Table.Td>
                    <Table.Td>{formatMoneyOrBlank(row.totalDiscount)}</Table.Td>
                    <Table.Td>{formatMoneyOrBlank(row.vatAmount)}</Table.Td>
                    <Table.Td>{formatMoneyOrBlank(row.withholdingTaxAmount)}</Table.Td>
                    <Table.Td className="font-medium text-gray-800">{formatMoneyOrBlank(row.totalAmount)}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th />
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th />
                <Table.Th />
                <Table.Th />
                <Table.Th>{formatMoney(totals.totalPurchases)}</Table.Th>
                <Table.Th>{formatMoney(totals.totalDiscount)}</Table.Th>
                <Table.Th>{formatMoney(totals.vatAmount)}</Table.Th>
                <Table.Th>{formatMoney(totals.withholdingTaxAmount)}</Table.Th>
                <Table.Th>{formatMoney(totals.totalAmount)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
