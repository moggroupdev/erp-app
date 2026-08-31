"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button, Textarea } from "@mantine/core";
import { CheckCircle, ClipboardList, Clock, XCircle, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import { type MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import { getRequisitionStatus, getRequisitionStatusLabel, isRequisitionTerminal } from "../../helpers";

type Gate = "planning" | "purchasingManager" | "manager";
type ConfirmKind = "approve" | "reject";
type UserRef = MaterialPurchaseRequisitionDetailed["planningDecidedBy"];

function getDecisionMeta(decision: ApprovalDecision, translate: (en: string, ar: string) => string) {
  if (decision === APPROVAL_DECISIONS.APPROVED) {
    return {
      label: translate("Approved", "معتمد"),
      color: "teal" as const,
      Icon: CheckCircle,
      iconClass: "bg-teal-50 text-teal-600 ring-1 ring-teal-100",
    };
  }
  if (decision === APPROVAL_DECISIONS.REJECTED) {
    return {
      label: translate("Rejected", "مرفوض"),
      color: "red" as const,
      Icon: XCircle,
      iconClass: "bg-red-50 text-red-600 ring-1 ring-red-100",
    };
  }
  return {
    label: translate("Pending", "قيد الانتظار"),
    color: "orange" as const,
    Icon: Clock,
    iconClass: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
  };
}

function ApprovalGateRow({
  label,
  decision,
  decidedAt,
  decidedBy,
  reason,
  canAct,
  permission,
  onApprove,
  onReject,
}: {
  label: string;
  decision: ApprovalDecision;
  decidedAt: Date | null;
  decidedBy: UserRef;
  reason: string | null;
  canAct: boolean;
  permission: Permission;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { locale, translate } = useI18n();
  const hasPermission = useHasPermission(permission);
  const meta = getDecisionMeta(decision, translate);
  const Icon: LucideIcon = meta.Icon;
  const showActions = decision === APPROVAL_DECISIONS.PENDING && canAct && hasPermission;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{label}</p>
            {decision !== APPROVAL_DECISIONS.PENDING && (decidedBy || decidedAt) ? (
              <p className="mt-0.5 text-sm text-gray-500">
                {decidedBy ? <CreatorLink creator={decidedBy} /> : null}
                {decidedBy && decidedAt ? " · " : null}
                {decidedAt ? formatDateAndTime(decidedAt, locale) : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="light" color={meta.color} radius="md">
            {meta.label}
          </Badge>
          {showActions && (
            <>
              <Button
                size="sm"
                variant="light"
                color="teal"
                radius="md"
                leftSection={<CheckCircle size={15} />}
                onClick={onApprove}
              >
                {translate("Approve", "اعتماد")}
              </Button>
              <Button
                size="sm"
                variant="light"
                color="red"
                radius="md"
                leftSection={<XCircle size={15} />}
                onClick={onReject}
              >
                {translate("Reject", "رفض")}
              </Button>
            </>
          )}
        </div>
      </div>

      {decision === APPROVAL_DECISIONS.REJECTED && reason ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-normal whitespace-pre-wrap text-red-800">{reason}</p>
      ) : null}
    </div>
  );
}

export default function RequisitionDetails({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [confirmGate, setConfirmGate] = useState<Gate | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectValidationError, setRejectValidationError] = useState("");

  const status = getRequisitionStatusLabel(getRequisitionStatus(requisition), translate);
  const terminal = isRequisitionTerminal(requisition);

  const approveMutation = useMutation({
    mutationFn: async (gate: Gate) => {
      if (gate === "planning") {
        return materialPurchaseRequisitionsApi.approvePlanning({ privateRequest, id: requisition.id });
      }
      if (gate === "purchasingManager") {
        return materialPurchaseRequisitionsApi.approvePurchasingManager({ privateRequest, id: requisition.id });
      }
      return materialPurchaseRequisitionsApi.approveManager({ privateRequest, id: requisition.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
      toast.success(translate("Approval recorded successfully.", "تم تسجيل الاعتماد بنجاح."));
      closeConfirm();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ gate, reason }: { gate: Gate; reason: string }) => {
      const dto = { reason };
      if (gate === "planning") {
        return materialPurchaseRequisitionsApi.rejectPlanning({ privateRequest, id: requisition.id, dto });
      }
      if (gate === "purchasingManager") {
        return materialPurchaseRequisitionsApi.rejectPurchasingManager({ privateRequest, id: requisition.id, dto });
      }
      return materialPurchaseRequisitionsApi.rejectManager({ privateRequest, id: requisition.id, dto });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
      toast.success(translate("Rejection recorded successfully.", "تم تسجيل الرفض بنجاح."));
      closeConfirm();
    },
  });

  const approveError = approveMutation.error ? getErrorMessage(locale, approveMutation.error) : "";
  const rejectError =
    rejectValidationError || (rejectMutation.error ? getErrorMessage(locale, rejectMutation.error) : "");

  const confirmCopy: Record<Gate, { approveTitle: string; approveBody: string; rejectTitle: string }> = {
    planning: {
      approveTitle: translate("Approve as Planning?", "اعتماد التخطيط والمتابعة؟"),
      approveBody: translate(
        "Record planning & follow-up approval for this requisition.",
        "تسجيل اعتماد التخطيط والمتابعة لهذا الطلب.",
      ),
      rejectTitle: translate("Reject as Planning?", "رفض التخطيط والمتابعة؟"),
    },
    purchasingManager: {
      approveTitle: translate("Approve as Purchasing Manager?", "اعتماد مدير المشتريات؟"),
      approveBody: translate("Record purchasing manager approval for this requisition.", "تسجيل اعتماد مدير المشتريات لهذا الطلب."),
      rejectTitle: translate("Reject as Purchasing Manager?", "رفض مدير المشتريات؟"),
    },
    manager: {
      approveTitle: translate("Approve as Manager?", "اعتماد المدير؟"),
      approveBody: translate("Record manager approval for this requisition.", "تسجيل اعتماد المدير لهذا الطلب."),
      rejectTitle: translate("Reject as Manager?", "رفض المدير؟"),
    },
  };

  const gates: {
    id: Gate;
    label: string;
    decision: ApprovalDecision;
    decidedAt: Date | null;
    decidedBy: UserRef;
    reason: string | null;
    permission: Permission;
  }[] = [
    {
      id: "planning",
      label: translate("Planning Approval", "اعتماد التخطيط والمتابعة"),
      decision: requisition.planningDecision,
      decidedAt: requisition.planningDecidedAt,
      decidedBy: requisition.planningDecidedBy,
      reason: requisition.planningDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PLANNING,
    },
    {
      id: "purchasingManager",
      label: translate("Purchasing Manager Approval", "اعتماد مدير المشتريات"),
      decision: requisition.purchasingManagerDecision,
      decidedAt: requisition.purchasingManagerDecidedAt,
      decidedBy: requisition.purchasingManagerDecidedBy,
      reason: requisition.purchasingManagerDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PURCHASING_MANAGER,
    },
    {
      id: "manager",
      label: translate("Manager Approval", "اعتماد المدير"),
      decision: requisition.managerDecision,
      decidedAt: requisition.managerDecidedAt,
      decidedBy: requisition.managerDecidedBy,
      reason: requisition.managerDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_MANAGER,
    },
  ];

  function closeConfirm() {
    setConfirmGate(null);
    setTimeout(() => {
      setRejectionReason("");
      setRejectValidationError("");
      approveMutation.reset();
      rejectMutation.reset();
    }, 250);
  }

  function openConfirm(gate: Gate, kind: ConfirmKind) {
    approveMutation.reset();
    rejectMutation.reset();
    setRejectValidationError("");
    setRejectionReason("");
    setConfirmKind(kind);
    setConfirmGate(gate);
  }

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmGate) return;
    setRejectValidationError("");
    if (!rejectionReason.trim()) {
      return setRejectValidationError(translate("Rejection reason is required.", "سبب الرفض مطلوب."));
    }
    rejectMutation.mutate({ gate: confirmGate, reason: rejectionReason.trim() });
  }

  const rows: DetailRow[] = [
    {
      key: translate("Requisition Code", "كود طلب الشراء"),
      value: requisition.code,
      mono: true,
      copyText: requisition.code,
    },
    {
      key: translate("Status", "الحالة"),
      value: (
        <Badge size="sm" variant="light" color={status.color} radius="md">
          {status.label}
        </Badge>
      ),
    },
    {
      key: translate("Production Sub-Department", "قسم الانتاج"),
      value: getProductionSubDepartmentLabel(requisition.productionSubDepartment, locale),
    },
    {
      key: translate("Department Manager", "مدير القسم"),
      value: <CreatorLink creator={requisition.productionSubDepartmentManager} />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: requisition.notes ? (
        <span className="font-normal whitespace-pre-wrap">{requisition.notes}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={requisition.createdBy} />,
    },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(requisition.createdAt, locale),
    },
  ];

  return (
    <>
      <EntityDetails
        title={requisition.code}
        icon={ClipboardList}
        titleAside={
          <Badge size="lg" variant="light" color={status.color} radius="md">
            {status.label}
          </Badge>
        }
        rows={rows}
      />

      <section className="mt-4 flex flex-col gap-3">
        <h4 className="text-lg font-semibold text-gray-900">{translate("Approvals", "الاعتمادات")}</h4>
        <div className="flex flex-col gap-2 rounded-xl bg-gray-100 p-2">
          {gates.map((gate) => (
            <ApprovalGateRow
              key={gate.id}
              label={gate.label}
              decision={gate.decision}
              decidedAt={gate.decidedAt}
              decidedBy={gate.decidedBy}
              reason={gate.reason}
              canAct={!terminal}
              permission={gate.permission}
              onApprove={() => openConfirm(gate.id, "approve")}
              onReject={() => openConfirm(gate.id, "reject")}
            />
          ))}
        </div>
      </section>

      <Modal
        opened={!!confirmGate && confirmKind === "approve"}
        onClose={closeConfirm}
        title={confirmGate ? confirmCopy[confirmGate].approveTitle : ""}
      >
        {confirmGate && (
          <div className="flex flex-col gap-3">
            <p>{confirmCopy[confirmGate].approveBody}</p>
            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={closeConfirm} fullWidth>
                {translation.cancel}
              </Button>
              <Button
                radius="md"
                color="teal"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(confirmGate)}
                fullWidth
              >
                {translate("Confirm", "تأكيد")}
              </Button>
            </div>
            {approveError && <ErrorAlert error={approveError} />}
          </div>
        )}
      </Modal>

      <Modal
        opened={!!confirmGate && confirmKind === "reject"}
        onClose={closeConfirm}
        title={confirmGate ? confirmCopy[confirmGate].rejectTitle : ""}
      >
        {confirmGate && (
          <form onSubmit={handleRejectSubmit} className="flex flex-col gap-3">
            <p>
              {translate(
                "This requisition will be rejected. Remaining approvals cannot be recorded afterwards.",
                "سيتم رفض طلب الشراء ولن يمكن تسجيل الاعتمادات المتبقية بعد ذلك.",
              )}
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              label={translate("Rejection Reason", "سبب الرفض")}
              placeholder={translate("Enter rejection reason", "أدخل سبب الرفض")}
              required
              radius="md"
              autosize
              minRows={3}
            />
            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={closeConfirm} fullWidth>
                {translation.cancel}
              </Button>
              <Button type="submit" color="red" loading={rejectMutation.isPending} radius="md" fullWidth>
                {translate("Reject", "رفض")}
              </Button>
            </div>
            {rejectError && <ErrorAlert error={rejectError} />}
          </form>
        )}
      </Modal>
    </>
  );
}
