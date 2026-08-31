import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import { toDisplayUnitPrice, resolveDisplayUnit } from "@/lib/helpers/unit-conversion";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";

export const REQUISITION_VAT_RATE = 0.14;

export type RequisitionLockFields = {
  planningDecision: ApprovalDecision;
  purchasingManagerDecision: ApprovalDecision;
  managerDecision: ApprovalDecision;
};

export function isRequisitionEditable(r: RequisitionLockFields) {
  return (
    r.planningDecision === APPROVAL_DECISIONS.PENDING &&
    r.purchasingManagerDecision === APPROVAL_DECISIONS.PENDING &&
    r.managerDecision === APPROVAL_DECISIONS.PENDING
  );
}

export function isRequisitionTerminal(r: RequisitionLockFields) {
  return (
    r.planningDecision === APPROVAL_DECISIONS.REJECTED ||
    r.purchasingManagerDecision === APPROVAL_DECISIONS.REJECTED ||
    r.managerDecision === APPROVAL_DECISIONS.REJECTED
  );
}

export type RequisitionStatus = "rejected" | "approved" | "pending";

export function getRequisitionStatus(r: RequisitionLockFields): RequisitionStatus {
  if (isRequisitionTerminal(r)) return "rejected";
  if (
    r.planningDecision === APPROVAL_DECISIONS.APPROVED &&
    r.purchasingManagerDecision === APPROVAL_DECISIONS.APPROVED &&
    r.managerDecision === APPROVAL_DECISIONS.APPROVED
  ) {
    return "approved";
  }
  return "pending";
}

export function getRequisitionStatusLabel(status: RequisitionStatus, translate: (en: string, ar: string) => string) {
  switch (status) {
    case "rejected":
      return { label: translate("Rejected", "مرفوض"), className: "text-red-500 font-semibold", color: "red" as const };
    case "approved":
      return { label: translate("Approved", "معتمد"), className: "text-teal-500 font-semibold", color: "teal" as const };
    default:
      return {
        label: translate("Pending", "قيد الانتظار"),
        className: "text-orange-500 font-semibold",
        color: "orange" as const,
      };
  }
}

export function getRequisitionItemLineTotal(item: MaterialPurchaseRequisitionItemDetailed): number | null {
  if (item.lastPurchasePrice == null) return null;

  const { factor } = resolveDisplayUnit(
    item.unitOfMeasurementSelected,
    item.material.unitOfMeasurement,
    item.material.unitConversions,
  );

  return item.quantityRequested * toDisplayUnitPrice(item.lastPurchasePrice, factor);
}

export function computeRequisitionLastPurchaseTotals(items: MaterialPurchaseRequisitionItemDetailed[]) {
  let subtotal = 0;
  let missingPriceCount = 0;

  for (const item of items) {
    const lineTotal = getRequisitionItemLineTotal(item);
    if (lineTotal == null) {
      missingPriceCount++;
      continue;
    }

    subtotal += lineTotal;
  }

  const vat = subtotal * REQUISITION_VAT_RATE;
  const grandTotal = subtotal + vat;

  return { subtotal, vat, grandTotal, missingPriceCount };
}
