"use client";

import Link from "next/link";
import { Table } from "@mantine/core";
import { ClipboardList } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { REQUISITION_VAT_RATE } from "@/app/[locale]/(inner)/procurement/material-requisitions/helpers";
import type {
  PurchasingMaterialsRequisitionFollowUpItem,
  PurchasingMaterialsRequisitionFollowUpTotals,
} from "@/types/reports";
import ReportCard from "../../components/report-card";

function formatNullableMoney(value: number | null) {
  if (value == null) return "—";
  return formatMoney(value);
}

export default function RequisitionFollowUpTable({
  items,
  totals,
  missingPriceCount,
}: {
  items: PurchasingMaterialsRequisitionFollowUpItem[];
  totals: PurchasingMaterialsRequisitionFollowUpTotals;
  missingPriceCount: number;
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const currency = translation.currency;

  const vatAmount = totals.requestedValue * REQUISITION_VAT_RATE;
  const totalWithVat = totals.requestedValue + vatAmount;

  return (
    <ReportCard
      title={translate("Requisition lines", "بنود طلبات الشراء")}
      description={translate(
        "Approved purchase requisition lines for the selected production department.",
        "بنود طلبات الشراء المعتمدة لقسم الإنتاج المحدد.",
      )}
      icon={ClipboardList}
      accent="teal"
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl">
            <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
              <Table.Thead className="bg-gray-50">
                <Table.Tr>
                  <Table.Th className="text-gray-600">#</Table.Th>
                  <Table.Th className="text-gray-600">{translate("Material", "الصنف")}</Table.Th>
                  <Table.Th className="text-gray-600">{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th className="text-gray-600">{translate("Requested", "المطلوب")}</Table.Th>
                  <Table.Th className="text-gray-600">{translate("Ordered", "تم الطلب")}</Table.Th>
                  <Table.Th className="text-gray-600">{translate("Received", "تم الاستلام")}</Table.Th>
                  <Table.Th className="text-gray-600">
                    {translate(`Last price (${currency})`, `اخر سعر (${currency})`)}
                  </Table.Th>
                  <Table.Th className="text-gray-600">
                    {translate(`Requested value (${currency})`, `قيمة المطلوب (${currency})`)}
                  </Table.Th>
                  <Table.Th className="text-gray-600">
                    {translate("Requisition no.", "رقم الطلب")}
                  </Table.Th>
                  <Table.Th className="text-gray-600">{translate("Notes", "ملاحظات")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((row, index) => (
                  <Table.Tr key={row.requisitionItemId} className="text-gray-600">
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
                    <Table.Td>{getMaterialUnitLabel(row.unitOfMeasurementSelected, locale)}</Table.Td>
                    <Table.Td>{formatQuantity(row.quantityRequested)}</Table.Td>
                    <Table.Td>{formatQuantity(row.quantityOrdered)}</Table.Td>
                    <Table.Td>{formatQuantity(row.quantityReceived)}</Table.Td>
                    <Table.Td>{formatNullableMoney(row.lastPurchasePrice)}</Table.Td>
                    <Table.Td className="font-semibold text-gray-800">
                      {formatNullableMoney(row.requestedValue)}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={getLocalizedHref(`/procurement/material-requisitions/${row.requisitionId}`)}
                          className="font-mono text-xs text-gray-800 hover:underline"
                        >
                          {row.requisitionCode}
                        </Link>
                        <CopyButton text={row.requisitionCode} />
                      </div>
                    </Table.Td>
                    <Table.Td className="max-w-48 truncate text-gray-500" title={row.notes ?? undefined}>
                      {row.notes || "—"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot className="bg-gray-50">
                <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                  <Table.Th />
                  <Table.Th>{translate("Subtotal", "الإجمالي")}</Table.Th>
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th>{formatMoney(totals.requestedValue)}</Table.Th>
                  <Table.Th />
                  <Table.Th />
                </Table.Tr>
                <Table.Tr className="h-10 border-b-0! border-gray-200 text-gray-700">
                  <Table.Th />
                  <Table.Th>{translate("VAT (14%)", "ضريبة القيمة المضافة (14%)")}</Table.Th>
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th>{formatMoney(vatAmount)}</Table.Th>
                  <Table.Th />
                  <Table.Th />
                </Table.Tr>
                <Table.Tr className="h-10 border-b-0! border-gray-200 text-gray-800">
                  <Table.Th />
                  <Table.Th className="font-semibold">
                    {translate("Total incl. VAT", "الإجمالي شامل الضريبة")}
                  </Table.Th>
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th />
                  <Table.Th className="font-semibold">{formatMoney(totalWithVat)}</Table.Th>
                  <Table.Th />
                  <Table.Th />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>

          {missingPriceCount > 0 ? (
            <p className="text-xs leading-relaxed text-amber-700">
              {translate(
                `${missingPriceCount} item(s) without a last purchase price were excluded from this estimate.`,
                `تم استبعاد ${missingPriceCount} بند/بنود بدون آخر سعر شراء من هذا التقدير.`,
              )}
            </p>
          ) : null}
        </div>
      )}
    </ReportCard>
  );
}
