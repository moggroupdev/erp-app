import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";

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
      return { label: translate("Rejected", "مرفوض"), className: "text-red-500 font-bold", color: "red" as const };
    case "approved":
      return { label: translate("Approved", "معتمد"), className: "text-teal-500 font-bold", color: "teal" as const };
    default:
      return {
        label: translate("Pending", "قيد الانتظار"),
        className: "text-orange-500 font-bold",
        color: "orange" as const,
      };
  }
}
