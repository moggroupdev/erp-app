"use client";

import { Badge, Table } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { RequestForQuotationDetailed, SupplierQuotation } from "@/types/request-for-quotation";
import { getSupplierQuotationStatus, priceInUnit } from "../../helpers";

export default function ComparisonTable({ request }: { request: RequestForQuotationDetailed }) {
  const { locale, translate, translation } = useI18n();
  const submitted = request.supplierQuotations.filter((quotation) => getSupplierQuotationStatus(quotation) === "submitted");

  if (submitted.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{translate("Comparison", "المقارنة")}</h2>
        <p className="text-sm text-gray-500">
          {translate(
            "Prices are shown in each request line's unit. The lowest comparable price is highlighted.",
            "الأسعار معروضة بوحدة كل بند في الطلب. أقل سعر قابل للمقارنة مميز.",
          )}
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{translate("Material", "المادة")}</Table.Th>
              <Table.Th>{translate("Requested", "المطلوب")}</Table.Th>
              {submitted.map((quotation) => (
                <Table.Th key={quotation.id}>{quotation.supplier.name}</Table.Th>
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
                  <Table.Td className="font-medium">{item.material.title}</Table.Td>
                  <Table.Td>
                    {formatQuantity(item.quantityRequested)} {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                  </Table.Td>
                  {cells.map((price, index) => {
                    const isLowest = price != null && lowest != null && price === lowest;
                    return (
                      <Table.Td key={submitted[index].id}>
                        {price == null ? (
                          <span className="text-gray-400">{translate("No price", "بدون سعر")}</span>
                        ) : (
                          <span className={isLowest ? "font-semibold text-teal-700" : ""}>
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
            <Table.Tr>
              <Table.Td colSpan={2} className="font-medium">
                {translate("Delivery period", "مدة التوريد")}
              </Table.Td>
              {submitted.map((quotation) => (
                <Table.Td key={quotation.id}>
                  {quotation.deliveryPeriodDays != null
                    ? translate(`${quotation.deliveryPeriodDays} days`, `${quotation.deliveryPeriodDays} يوم`)
                    : "-"}
                </Table.Td>
              ))}
            </Table.Tr>
          </Table.Tbody>
        </Table>
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
