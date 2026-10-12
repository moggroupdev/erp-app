import type { RequestForQuotationStatus, SupplierQuotationStatus } from "@/types/request-for-quotation";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import { resolveDisplayUnit, toBaseUnitPrice, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";

type TimestampFields = {
  issuedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
};

export function getRequestForQuotationStatus(rfq: TimestampFields): RequestForQuotationStatus {
  if (rfq.cancelledAt) return "cancelled";
  if (rfq.closedAt) return "closed";
  if (rfq.issuedAt) return "issued";
  return "draft";
}

export function isRequestDraft(rfq: TimestampFields) {
  return getRequestForQuotationStatus(rfq) === "draft";
}

export function isRequestIssued(rfq: TimestampFields) {
  return getRequestForQuotationStatus(rfq) === "issued";
}

export function getRequestForQuotationStatusLabel(
  status: RequestForQuotationStatus,
  translate: (en: string, ar: string) => string,
) {
  switch (status) {
    case "issued": {
      const tokens = getSemanticStatusColors("info");
      return { label: translate("Issued", "صادر"), color: tokens.mantineColor };
    }
    case "closed": {
      const tokens = getSemanticStatusColors("success");
      return { label: translate("Closed", "مغلق"), color: tokens.mantineColor };
    }
    case "cancelled": {
      const tokens = getSemanticStatusColors("danger");
      return { label: translate("Cancelled", "ملغي"), color: tokens.mantineColor };
    }
    default: {
      const tokens = getSemanticStatusColors("warning");
      return { label: translate("Draft", "مسودة"), color: tokens.mantineColor };
    }
  }
}

export function getSupplierQuotationStatus(quotation: {
  submittedAt: string | null;
  declinedAt: string | null;
}): SupplierQuotationStatus {
  if (quotation.declinedAt) return "declined";
  if (quotation.submittedAt) return "submitted";
  return "invited";
}

export function getSupplierQuotationStatusLabel(
  status: SupplierQuotationStatus,
  translate: (en: string, ar: string) => string,
) {
  switch (status) {
    case "submitted": {
      const tokens = getSemanticStatusColors("success");
      return { label: translate("Submitted", "مقدم"), color: tokens.mantineColor };
    }
    case "declined": {
      const tokens = getSemanticStatusColors("danger");
      return { label: translate("Declined", "مرفوض"), color: tokens.mantineColor };
    }
    default: {
      const tokens = getSemanticStatusColors("warning");
      return { label: translate("Invited", "مدعو"), color: tokens.mantineColor };
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
