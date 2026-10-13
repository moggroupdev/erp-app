"use client";

import { Alert, Badge, Table } from "@mantine/core";
import { Check, Info, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { RequestForQuotationDetailed, SupplierQuotation } from "@/types/request-for-quotation";
import { priceInUnit } from "../../helpers";
import RfqFixedTable from "../../components/rfq-fixed-table";
import { RFQ_SECTION_ICON_SHELL_CLASS } from "../../components/section-icon-shell";
import {
  RFQ_COMPARISON_COLUMN_MIN_WIDTH,
  columnMinWidthStyle,
  comparisonTableColumnWidths,
  rfqTableHeaderClass,
} from "../../table-layout";

export default function ComparisonTable({ request }: { request: RequestForQuotationDetailed }) {
  const { translate } = useI18n();
  const quotations = request.supplierQuotations;

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className={`bg-plum-600 ${RFQ_SECTION_ICON_SHELL_CLASS}`}>
          <Scale size={18} />
        </span>
        <div>
          <h4 className="text-base font-semibold text-gray-950">{translate("Comparison", "المقارنة")}</h4>
          <p className="text-sm text-gray-500">
            {translate(
              "Unit prices and line totals use each request line's unit. The lowest comparable price is highlighted.",
              "أسعار الوحدة وإجماليات البنود تستخدم وحدة كل بند في الطلب. أقل سعر قابل للمقارنة مميز.",
            )}
          </p>
        </div>
      </div>

      <div className="px-5 py-5">
        {quotations.length === 0 ? (
          <div className="bg-plum-50/50 flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 text-center">
            <div className="bg-plum-50 text-plum-700 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Scale size={26} strokeWidth={1.75} />
            </div>
            <p className="max-w-md text-sm leading-7 text-gray-500">
              {translate(
                "Quotations appear here so you can compare unit prices.",
                "تظهر عروض الأسعار هنا لمقارنة سعر الوحدة.",
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {quotations.length === 1 && (
              <Alert color="haze" variant="light" radius="md" icon={<Info size={16} />}>
                {translate(
                  "Only one supplier is on this request. Add another supplier quotation to compare prices side by side.",
                  "يوجد مورد واحد فقط في هذا الطلب. أضف عرض سعر من مورد آخر لمقارنة الأسعار جنباً إلى جنب.",
                )}
              </Alert>
            )}
            <ComparisonGrid request={request} quotations={quotations} />
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonGrid({ request, quotations }: { request: RequestForQuotationDetailed; quotations: SupplierQuotation[] }) {
  const { locale, translate, translation } = useI18n();
  const grandTotals = quotations.map((quotation) => quotationGrandTotal(quotation, request.items));
  const lowestGrand = grandTotals.reduce<number | null>((min, entry) => {
    if (!entry?.complete) return min;
    if (min == null || entry.total < min) return entry.total;
    return min;
  }, null);
  const detailRows = [
    {
      key: "payment",
      label: translate("Payment terms", "شروط الدفع"),
      values: quotations.map((quotation) => textOrNull(quotation.paymentTerms)),
    },
    {
      key: "delivery-terms",
      label: translate("Delivery terms", "شروط التوريد"),
      values: quotations.map((quotation) => textOrNull(quotation.deliveryTerms)),
    },
    {
      key: "valid-until",
      label: translate("Valid until", "صالح حتى"),
      values: quotations.map((quotation) => (quotation.validUntil ? formatDateAndTime(quotation.validUntil, locale) : null)),
    },
    {
      key: "notes",
      label: translate("Notes", "الملاحظات"),
      values: quotations.map((quotation) => textOrNull(quotation.notes)),
    },
  ].filter((row) => row.values.some((value) => value != null));

  const comparisonColumns = RFQ_COMPARISON_COLUMN_MIN_WIDTH;
  const columnWidths = comparisonTableColumnWidths(quotations.length);

  return (
    <RfqFixedTable columnWidths={columnWidths} verticalSpacing="xs">
      <Table.Thead className="bg-gray-50">
        <Table.Tr className="h-9">
          <Table.Th style={columnMinWidthStyle(comparisonColumns.material)} className={rfqTableHeaderClass}>
            {translate("Material", "المادة")}
          </Table.Th>
          <Table.Th style={columnMinWidthStyle(comparisonColumns.unit)} className={rfqTableHeaderClass}>
            {translate("Unit", "الوحدة")}
          </Table.Th>
          <Table.Th style={columnMinWidthStyle(comparisonColumns.quantityRequested)} className={rfqTableHeaderClass}>
            {translate("Requested quantity", "الكمية المطلوبة")}
          </Table.Th>
          {quotations.map((quotation) => (
            <Table.Th
              key={quotation.id}
              style={columnMinWidthStyle(comparisonColumns.supplier)}
              className={rfqTableHeaderClass}
            >
              {quotation.supplier.name}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {request.items.map((item) => {
          const prices = quotations.map((quotation) => comparablePrice(quotation, item));
          const lowest = prices.reduce<number | null>((min, price) => {
            if (price == null) return min;
            if (min == null || price < min) return price;
            return min;
          }, null);
          return (
            <Table.Tr key={item.id}>
              <Table.Td className="text-sm font-medium wrap-break-word text-gray-800">{item.material.title}</Table.Td>
              <Table.Td className="text-sm whitespace-nowrap text-gray-700">
                {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
              </Table.Td>
              <Table.Td className="text-sm whitespace-nowrap text-gray-700">
                {formatQuantity(item.quantityRequested)}
              </Table.Td>
              {prices.map((price, index) => {
                const isLowest = price != null && lowest != null && price === lowest;
                const total = price == null ? null : price * Number(item.quantityRequested);
                return (
                  <Table.Td key={quotations[index].id}>
                    {price == null || total == null ? (
                      <span className="text-sm text-gray-400">{translate("No price", "بدون سعر")}</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={
                            isLowest
                              ? "flex items-center gap-1 text-sm font-semibold text-teal-700"
                              : "flex items-center gap-1 text-sm text-gray-800"
                          }
                        >
                          {formatMoney(price, translation.currency)}
                          {isLowest && <LowestBadge />}
                        </span>
                        <span className="text-xs text-gray-500">
                          {translate("Total", "الإجمالي")}: {formatMoney(total, translation.currency)}
                        </span>
                      </div>
                    )}
                  </Table.Td>
                );
              })}
            </Table.Tr>
          );
        })}
        <Table.Tr className="bg-gray-50!">
          <Table.Td className="text-sm font-semibold text-gray-800">{translate("Grand total", "الإجمالي الكلي")}</Table.Td>
          <Table.Td />
          <Table.Td />
          {grandTotals.map((entry, index) => {
            const isLowest = entry?.complete === true && lowestGrand != null && Math.abs(entry.total - lowestGrand) < 0.005;
            return (
              <Table.Td key={quotations[index].id} className={isLowest ? "bg-teal-50" : undefined}>
                {entry == null ? (
                  <span className="text-sm text-gray-400">-</span>
                ) : (
                  <span
                    className={
                      isLowest
                        ? "flex items-center gap-1 text-sm font-semibold text-teal-700"
                        : "flex items-center gap-1 text-sm font-semibold text-gray-900"
                    }
                  >
                    {formatMoney(entry.total, translation.currency)}
                    {isLowest && <LowestBadge />}
                    {!entry.complete && (
                      <Badge ml={6} size="xs" variant="light" color="ochre">
                        {translate("Partial", "جزئي")}
                      </Badge>
                    )}
                  </span>
                )}
              </Table.Td>
            );
          })}
        </Table.Tr>
        <Table.Tr>
          <Table.Td className="text-sm font-medium text-gray-700">{translate("Delivery period", "مدة التوريد")}</Table.Td>
          <Table.Td />
          <Table.Td />
          {quotations.map((quotation) => (
            <Table.Td key={quotation.id} className="text-sm text-gray-700">
              {quotation.deliveryPeriodDays != null
                ? translate(`${quotation.deliveryPeriodDays} days`, `${quotation.deliveryPeriodDays} يوم`)
                : "-"}
            </Table.Td>
          ))}
        </Table.Tr>
        {detailRows.map((row) => (
          <Table.Tr key={row.key}>
            <Table.Td className="text-sm font-medium text-gray-700">{row.label}</Table.Td>
            <Table.Td />
            <Table.Td />
            {row.values.map((value, index) => (
              <Table.Td key={quotations[index].id} className="text-sm wrap-break-word text-gray-700">
                {value ?? <span className="text-gray-400">-</span>}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </RfqFixedTable>
  );
}

function LowestBadge() {
  const { translate } = useI18n();
  const label = translate("Lowest", "الأقل");

  return (
    <Badge ml={6} size="xs" variant="light" color="teal" circle aria-label={label} title={label}>
      <Check size={10} strokeWidth={3} />
    </Badge>
  );
}

function textOrNull(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function quotationGrandTotal(quotation: SupplierQuotation, items: RequestForQuotationDetailed["items"]) {
  let total = 0;
  let quoted = 0;
  for (const item of items) {
    const price = comparablePrice(quotation, item);
    if (price == null) continue;
    total += price * Number(item.quantityRequested);
    quoted += 1;
  }
  if (quoted === 0) return null;
  return { total, complete: quoted === items.length };
}

function comparablePrice(quotation: SupplierQuotation, item: RequestForQuotationDetailed["items"][number]) {
  const line = quotation.items.find((quotationItem) => quotationItem.requestForQuotationItemId === item.id);
  if (!line) return null;
  return priceInUnit(Number(line.unitPrice), line.unitOfMeasurementSelected, item.unitOfMeasurementSelected, item.material);
}
