"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button, Radio, Table } from "@mantine/core";
import { FileSearch, X } from "lucide-react";
import Modal from "@/components/ui/modal";
import EmptySection from "@/components/ui/sections/empty";
import ErrorSection from "@/components/ui/sections/error";
import LoadingSection from "@/components/ui/sections/loading";
import useHasPermission from "@/hooks/use-has-permission";
import usePrivateRequest from "@/hooks/use-private-request";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { resolveDisplayUnit, toBaseUnitPrice, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialUnitConversionSummary } from "@/types/material";
import type { SupplierQuotationItemOption } from "@/types/request-for-quotation";

export type QuotationPriceSelection = {
  id: string | null;
  code: string | null;
  /** Converted into the order line unit. Null when the link is cleared, so the typed price stays. */
  unitPrice: number | null;
};

export default function QuotationItemSelect({
  supplierId,
  materialCode,
  materialTitle,
  unitOfMeasurement,
  unitOfMeasurementSelected,
  unitConversions,
  value,
  linkedCode,
  onChange,
}: {
  supplierId: string | null;
  materialCode: string | null;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit | null;
  unitOfMeasurementSelected: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  value: string | null;
  linkedCode?: string | null;
  onChange: (next: QuotationPriceSelection) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const canRead = useHasPermission(PERMISSIONS.READ_REQUEST_FOR_QUOTATIONS);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<string | null>(value);
  const enabled = canRead && opened && !!supplierId && !!materialCode;

  const { data: options = [], isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.requestForQuotations.quotationItems(supplierId ?? "", materialCode ?? undefined),
    queryFn: ({ signal }) =>
      requestForQuotationsApi.listQuotationItems({
        privateRequest,
        supplierId: supplierId!,
        materialCode: materialCode!,
        signal,
      }),
    enabled,
    staleTime: staleTimes.requestForQuotations,
  });

  useEffect(() => {
    if (opened) setSelectedId(value);
  }, [opened, value]);

  if (!canRead) {
    return linkedCode ? <span className="font-mono text-[11px] font-semibold text-gray-700">{linkedCode}</span> : null;
  }

  const canOpen = !!supplierId && !!materialCode && !!unitOfMeasurementSelected;
  const orderUnitLabel = unitOfMeasurementSelected ? getMaterialUnitLabel(unitOfMeasurementSelected, locale) : "";

  function applySelection() {
    const option = options.find((row) => row.id === selectedId);
    if (!option) return;
    onChange({
      id: option.id,
      code: option.requestForQuotationCode,
      unitPrice: priceForOrderUnit(option, unitOfMeasurement, unitOfMeasurementSelected, unitConversions),
    });
    close();
  }

  function clearLink() {
    onChange({ id: null, code: null, unitPrice: null });
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1.5 py-0.5">
        {linkedCode && (
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] font-semibold text-teal-900">{linkedCode}</span>
            <button
              type="button"
              className="rounded-md p-0.5 text-teal-800/50 hover:bg-teal-800/10 hover:text-teal-900"
              onClick={clearLink}
              title={translate("Remove quotation link", "إزالة ربط عرض السعر")}
              aria-label={translate("Remove quotation link", "إزالة ربط عرض السعر")}
            >
              <X size={12} />
            </button>
          </div>
        )}
        <Button
          type="button"
          variant="subtle"
          color="haze"
          size="compact-xs"
          radius="md"
          px={6}
          leftSection={<FileSearch size={12} />}
          disabled={!canOpen}
          title={
            canOpen
              ? undefined
              : translate("Select a supplier and a material first", "اختر المورد والمادة أولا")
          }
          onClick={open}
        >
          {linkedCode ? translate("Change", "تغيير") : translate("From RFQ", "من طلب عرض سعر")}
        </Button>
      </div>

      <Modal
        opened={opened}
        onClose={close}
        title={translate("Select a quotation price", "اختيار سعر من عرض")}
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {translate(
              `Prices for ${materialTitle || materialCode} from this supplier on open or closed requests for quotation. Cancelled requests are omitted.`,
              `أسعار ${materialTitle || materialCode} من هذا المورد في طلبات عروض الأسعار المفتوحة أو المغلقة. الطلبات الملغاة غير معروضة.`,
            )}
          </p>

          {isFetching ? (
            <LoadingSection message={translate("Loading quotation prices", "جاري تحميل أسعار العروض")} />
          ) : error ? (
            <ErrorSection
              errorTitle={translate("Failed to load quotation prices", "تعذر تحميل أسعار العروض")}
              errorMessage={getErrorMessage(locale, error)}
              button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
            />
          ) : options.length === 0 ? (
            <EmptySection
              message={translate(
                "No quotation prices for this material and supplier",
                "لا توجد أسعار عروض لهذه المادة وهذا المورد",
              )}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <Table className="text-nowrap" verticalSpacing="xs" horizontalSpacing="sm">
                <Table.Thead className="bg-gray-50">
                  <Table.Tr>
                    <Table.Th className="w-10" />
                    <Table.Th>{translate("Request", "الطلب")}</Table.Th>
                    <Table.Th>{translate("Quoted price", "السعر المعروض")}</Table.Th>
                    <Table.Th>
                      {translate("Order price", "سعر الأمر")} ({orderUnitLabel})
                    </Table.Th>
                    <Table.Th>{translate("Requested qty", "الكمية المطلوبة")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {options.map((option) => {
                    const selected = option.id === selectedId;
                    const orderPrice = priceForOrderUnit(
                      option,
                      unitOfMeasurement,
                      unitOfMeasurementSelected,
                      unitConversions,
                    );
                    const quotedUnit = getMaterialUnitLabel(option.unitOfMeasurementSelected, locale);
                    const sameUnit = option.unitOfMeasurementSelected === unitOfMeasurementSelected;

                    return (
                      <Table.Tr
                        key={option.id}
                        className={selected ? "cursor-pointer bg-teal-800/[0.07]" : "cursor-pointer"}
                        onClick={() => setSelectedId(option.id)}
                      >
                        <Table.Td>
                          <Radio
                            checked={selected}
                            onChange={() => setSelectedId(option.id)}
                            color="haze"
                            aria-label={option.requestForQuotationCode}
                          />
                        </Table.Td>
                        <Table.Td className="font-mono text-sm font-medium text-gray-800">
                          {option.requestForQuotationCode}
                        </Table.Td>
                        <Table.Td>
                          {formatMoney(option.unitPrice, translation.currency)} / {quotedUnit}
                        </Table.Td>
                        <Table.Td className="font-medium text-gray-800">
                          {sameUnit ? formatMoney(option.unitPrice, translation.currency) : formatMoney(orderPrice, translation.currency)}
                        </Table.Td>
                        <Table.Td>
                          {formatQuantity(option.quantityRequested)} {getMaterialUnitLabel(option.requestedUnit, locale)}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="light" color="dark" radius="md" onClick={close} fullWidth>
              {translation.cancel}
            </Button>
            <Button
              type="button"
              radius="md"
              color="haze"
              onClick={applySelection}
              fullWidth
              disabled={isFetching || !selectedId || !options.some((row) => row.id === selectedId)}
            >
              {translate("Use this price", "استخدام هذا السعر")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function priceForOrderUnit(
  option: SupplierQuotationItemOption,
  baseUnit: MaterialUnit | null,
  orderUnit: MaterialUnit | null,
  unitConversions: MaterialUnitConversionSummary[],
) {
  if (!baseUnit || !orderUnit) return option.unitPrice;
  const from = resolveDisplayUnit(option.unitOfMeasurementSelected, baseUnit, unitConversions);
  const to = resolveDisplayUnit(orderUnit, baseUnit, unitConversions);
  return toDisplayUnitPrice(toBaseUnitPrice(option.unitPrice, from.factor), to.factor);
}
