import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import { VAT_RATE } from "@/lib/constants/global";
import { toDisplayUnitPrice, resolveDisplayUnit } from "@/lib/helpers/unit-conversion";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";

export type RequisitionLockFields = {
  planningDecision: ApprovalDecision;
  inventoryControlDecision: ApprovalDecision;
  managerDecision: ApprovalDecision;
};

export function isRequisitionEditable(r: RequisitionLockFields) {
  return (
    r.planningDecision === APPROVAL_DECISIONS.PENDING &&
    r.inventoryControlDecision === APPROVAL_DECISIONS.PENDING &&
    r.managerDecision === APPROVAL_DECISIONS.PENDING
  );
}

export function isRequisitionTerminal(r: RequisitionLockFields) {
  return (
    r.planningDecision === APPROVAL_DECISIONS.REJECTED ||
    r.inventoryControlDecision === APPROVAL_DECISIONS.REJECTED ||
    r.managerDecision === APPROVAL_DECISIONS.REJECTED
  );
}

export type RequisitionStatus = "rejected" | "approved" | "pending";

export function getRequisitionStatus(r: RequisitionLockFields): RequisitionStatus {
  if (isRequisitionTerminal(r)) return "rejected";
  if (
    r.planningDecision === APPROVAL_DECISIONS.APPROVED &&
    r.inventoryControlDecision === APPROVAL_DECISIONS.APPROVED &&
    r.managerDecision === APPROVAL_DECISIONS.APPROVED
  ) {
    return "approved";
  }
  return "pending";
}

export function getRequisitionStatusLabel(status: RequisitionStatus, translate: (en: string, ar: string) => string) {
  switch (status) {
    case "rejected": {
      const tokens = getSemanticStatusColors("danger");
      return {
        label: translate("Rejected", "مرفوض"),
        className: `${tokens.textClass} font-medium`,
        color: tokens.mantineColor,
      };
    }
    case "approved": {
      const tokens = getSemanticStatusColors("success");
      return {
        label: translate("Approved", "معتمد"),
        className: `${tokens.textClass} font-medium`,
        color: tokens.mantineColor,
      };
    }
    default: {
      const tokens = getSemanticStatusColors("warning");
      return {
        label: translate("Pending", "قيد الانتظار"),
        className: `${tokens.textClass} font-medium`,
        color: tokens.mantineColor,
      };
    }
  }
}

export function getRequisitionItemDisplayLastPurchasePrice(item: MaterialPurchaseRequisitionItemDetailed): number | null {
  if (item.lastPurchasePrice == null) return null;

  const { factor } = resolveDisplayUnit(
    item.unitOfMeasurementSelected,
    item.material.unitOfMeasurement,
    item.material.unitConversions,
  );

  return toDisplayUnitPrice(item.lastPurchasePrice, factor);
}

export function getRequisitionItemLineTotal(item: MaterialPurchaseRequisitionItemDetailed): number | null {
  const displayLastPurchasePrice = getRequisitionItemDisplayLastPurchasePrice(item);
  if (displayLastPurchasePrice == null) return null;

  return item.quantityRequested * displayLastPurchasePrice;
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

  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  return { subtotal, vat, grandTotal, missingPriceCount };
}
