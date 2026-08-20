"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { Table2 } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { PurchasingMaterialsPriceHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function PriceEntriesTable({ data }: { data: PurchasingMaterialsPriceHistoryEntry[] }) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  if (data.length === 0) return null;

  return (
    <ReportCard
      title={translate("Purchase History", "سجل المشتريات")}
      description={translate(
        "Individual purchase order lines for this material.",
        "بنود أوامر الشراء الفردية لهذه المادة.",
      )}
      icon={Table2}
      accent="slate"
    >
      <div className="overflow-x-auto rounded-xl">
        <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
              <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
              <Table.Th className="text-gray-600">{translate("Supplier", "المورد")}</Table.Th>
              <Table.Th className="text-gray-600">{translate("Qty", "الكمية")}</Table.Th>
              <Table.Th className="text-gray-600">
                {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={`${row.orderId}-${row.orderDate}`} className="text-gray-600">
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
                  {new Date(row.orderDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Table.Td>
                <Table.Td>
                  <Link
                    href={getLocalizedHref(`/procurement/suppliers/${row.supplierId}`)}
                    className="text-gray-800 hover:underline"
                  >
                    {row.supplierName}
                  </Link>
                </Table.Td>
                <Table.Td>{formatQuantity(row.quantityOrdered)}</Table.Td>
                <Table.Td className="font-semibold text-gray-800">{formatMoney(row.unitPrice)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </ReportCard>
  );
}
