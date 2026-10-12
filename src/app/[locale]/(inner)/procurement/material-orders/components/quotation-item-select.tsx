"use client";

import { useQuery } from "@tanstack/react-query";
import DataSelect from "@/components/ui/data-select";
import useHasPermission from "@/hooks/use-has-permission";
import usePrivateRequest from "@/hooks/use-private-request";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { resolveDisplayUnit, toBaseUnitPrice, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialUnitConversionSummary } from "@/types/material";
import type { SupplierQuotationItemOption } from "@/types/request-for-quotation";

export default function QuotationItemSelect({
  supplierId,
  materialCode,
  unitOfMeasurement,
  unitOfMeasurementSelected,
  unitConversions,
  value,
  linkedCode,
  onChange,
}: {
  supplierId: string | null;
  materialCode: string | null;
  unitOfMeasurement: MaterialUnit | null;
  unitOfMeasurementSelected: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  value: string | null;
  linkedCode?: string | null;
  onChange: (next: { id: string | null; unitPrice: number | null }) => void;
}) {
  const { translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const canRead = useHasPermission(PERMISSIONS.READ_REQUEST_FOR_QUOTATIONS);
  const enabled = canRead && !!supplierId && !!materialCode;

  const { data: options = [] } = useQuery({
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

  if (!canRead) {
    return <span className="text-xs text-gray-500">{linkedCode ?? translate("No quotation", "بدون عرض سعر")}</span>;
  }

  const data = options.map((option) => ({
    value: option.id,
    label: `${option.requestForQuotationCode} · ${formatMoney(option.unitPrice, translation.currency)}`,
  }));

  return (
    <DataSelect
      value={value}
      setValue={(next) => {
        const option = options.find((row) => row.id === next) ?? null;
        onChange({
          id: option?.id ?? null,
          unitPrice: option ? priceForOrderUnit(option, unitOfMeasurement, unitOfMeasurementSelected, unitConversions) : null,
        });
      }}
      data={data}
      clearable
      disabled={!supplierId || !materialCode}
      placeholder={translate("Quotation", "عرض السعر")}
    />
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
