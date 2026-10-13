import type { RequestForQuotationStatus } from "@/types/request-for-quotation";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import { resolveDisplayUnit, toBaseUnitPrice, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";

type TimestampFields = {
  closedAt: string | null;
  cancelledAt: string | null;
};

export function getRequestForQuotationStatus(rfq: TimestampFields): RequestForQuotationStatus {
  if (rfq.cancelledAt) return "cancelled";
  if (rfq.closedAt) return "closed";
  return "open";
}

export function getRequestForQuotationStatusLabel(
  status: RequestForQuotationStatus,
  translate: (en: string, ar: string) => string,
) {
  switch (status) {
    case "closed": {
      const tokens = getSemanticStatusColors("success");
      return { label: translate("Closed", "مغلق"), color: tokens.mantineColor };
    }
    case "cancelled": {
      const tokens = getSemanticStatusColors("danger");
      return { label: translate("Cancelled", "ملغي"), color: tokens.mantineColor };
    }
    default: {
      const tokens = getSemanticStatusColors("info");
      return { label: translate("Open", "مفتوح"), color: tokens.mantineColor };
    }
  }
}

export function priceInUnit(
  unitPrice: number,
  fromUnit: MaterialUnit,
  toUnit: MaterialUnit,
  material: {
    unitOfMeasurement: MaterialUnit;
    unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[];
  },
) {
  const from = resolveDisplayUnit(fromUnit, material.unitOfMeasurement, material.unitConversions);
  const to = resolveDisplayUnit(toUnit, material.unitOfMeasurement, material.unitConversions);
  return toDisplayUnitPrice(toBaseUnitPrice(unitPrice, from.factor), to.factor);
}
