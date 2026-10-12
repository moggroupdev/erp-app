"use client";

import { Badge, Table } from "@mantine/core";
import { Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { RequestForQuotationDetailed, SupplierQuotation } from "@/types/request-for-quotation";
import { getSupplierQuotationStatus, priceInUnit } from "../../helpers";

export default function ComparisonTable({ request }: { request: RequestForQuotationDetailed }) {
  const { locale, translate, translation } = useI18n();
  const submitted = request.supplierQuotations.filter((quotation) => getSupplierQuotationStatus(quotation) === "submitted");
  const visible = !!request.issuedAt || !!request.closedAt;

  if (!visible) return null;

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-plum-600 text-white">
          <Scale size={18} />
        </span>
        <div>
          <h4 className="text-base font-semibold text-gray-950">{translate("Comparison", "المقارنة")}</h4>
          <p className="text-sm text-gray-500">
            {translate(
              "Prices are shown in each request line's unit. The lowest comparable price is highlighted.",
              "الأسعار معروضة بوحدة كل بند في الطلب. أقل سعر قابل للمقارنة مميز.",
            )}
          </p>
        </div>
      </div>

      <div className="px-5 py-5">
        {submitted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-plum-50/50 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-plum-50 text-plum-700">
              <Scale size={26} strokeWidth={1.75} />
            </div>
            <p className="max-w-md text-sm leading-7 text-gray-500">
              {translate(
                "Submitted quotations appear here so you can compare unit prices.",
                "تظهر عروض الأسعار المقدمة هنا لمقارنة سعر الوحدة.",
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table withColumnBorders className="w-full min-w-max" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50 whitespace-nowrap">
                <Table.Tr className="h-9">
                  <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Requested", "المطلوب")}
                  </Table.Th>
                  {submitted.map((quotation) => (
                    <Table.Th key={quotation.id} className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {quotation.supplier.name}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {request.items.map((item) => {
                  const cells = submitted.map((quotation) => comparablePrice(quotation, item));
                  const lowest = cells.reduce<number | null>((min, price) => {
                    if (price == null) return min;
                    if (min == null || price < min) return price;
                    return min;
                  }, null);
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td className="font-medium text-gray-800">{item.material.title}</Table.Td>
                      <Table.Td className="text-sm text-gray-700">
                        {formatQuantity(item.quantityRequested)} {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                      </Table.Td>
                      {cells.map((price, index) => {
                        const isLowest = price != null && lowest != null && price === lowest;
                        return (
                          <Table.Td key={submitted[index].id} className={isLowest ? "bg-teal-50" : undefined}>
                            {price == null ? (
                              <span className="text-sm text-gray-400">{translate("No price", "بدون سعر")}</span>
                            ) : (
                              <span className={isLowest ? "text-sm font-semibold text-teal-700" : "text-sm text-gray-800"}>
                                {formatMoney(price, translation.currency)}
                                {isLowest && (
                                  <Badge ml={6} size="xs" variant="light" color="teal">
                                    {translate("Lowest", "الأقل")}
                                  </Badge>
                                )}
                              </span>
                            )}
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  );
                })}
                <Table.Tr className="bg-gray-50">
                  <Table.Td colSpan={2} className="text-sm font-medium text-gray-700">
                    {translate("Delivery period", "مدة التوريد")}
                  </Table.Td>
                  {submitted.map((quotation) => (
                    <Table.Td key={quotation.id} className="text-sm text-gray-700">
                      {quotation.deliveryPeriodDays != null
                        ? translate(`${quotation.deliveryPeriodDays} days`, `${quotation.deliveryPeriodDays} يوم`)
                        : "-"}
                    </Table.Td>
                  ))}
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}

function comparablePrice(
  quotation: SupplierQuotation,
  item: RequestForQuotationDetailed["items"][number],
) {
  const line = quotation.items.find((quotationItem) => quotationItem.requestForQuotationItemId === item.id);
  if (!line) return null;
  return priceInUnit(Number(line.unitPrice), line.unitOfMeasurementSelected, item.unitOfMeasurementSelected, item.material);
}
