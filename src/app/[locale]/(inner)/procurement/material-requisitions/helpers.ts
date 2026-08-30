export type RequisitionLockFields = {
  planningApprovedAt: Date | null;
  purchasingManagerApprovedAt: Date | null;
  directorApprovedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
};

export function isRequisitionEditable(r: RequisitionLockFields) {
  return !r.planningApprovedAt && !r.purchasingManagerApprovedAt && !r.directorApprovedAt && !r.rejectedAt && !r.cancelledAt;
}

export function isRequisitionTerminal(r: Pick<RequisitionLockFields, "rejectedAt" | "cancelledAt">) {
  return !!r.rejectedAt || !!r.cancelledAt;
}

export type RequisitionStatus = "cancelled" | "rejected" | "approved" | "pending";

export function getRequisitionStatus(r: RequisitionLockFields): RequisitionStatus {
  if (r.cancelledAt) return "cancelled";
  if (r.rejectedAt) return "rejected";
  if (r.planningApprovedAt && r.purchasingManagerApprovedAt && r.directorApprovedAt) return "approved";
  return "pending";
}

export function getRequisitionStatusLabel(status: RequisitionStatus, translate: (en: string, ar: string) => string) {
  switch (status) {
    case "cancelled":
      return { label: translate("Cancelled", "ملغي"), className: "text-red-500 font-bold", color: "red" as const };
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
