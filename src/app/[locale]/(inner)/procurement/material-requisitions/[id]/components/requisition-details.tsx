"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button, Textarea } from "@mantine/core";
import { CheckCircle, ClipboardList, XCircle } from "lucide-react";
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

function ApprovalFieldValue({
  decision,
  decidedAt,
  decidedBy,
  reason,
  canAct,
  permission,
  onApprove,
  onReject,
}: {
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

  if (decision === APPROVAL_DECISIONS.APPROVED) {
    return (
      <span className="flex items-center gap-1.5">
        <CheckCircle size={16} className="shrink-0 text-teal-600" />
        <span>
          {decidedBy ? (
            <>
              <CreatorLink creator={decidedBy} />
              {" · "}
            </>
          ) : null}
          {decidedAt ? formatDateAndTime(decidedAt, locale) : null}
        </span>
      </span>
    );
  }

  if (decision === APPROVAL_DECISIONS.REJECTED) {
    return (
      <span className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5">
          <XCircle size={16} className="shrink-0 text-red-600" />
          <span>
            {decidedBy ? (
              <>
                <CreatorLink creator={decidedBy} />
                {" · "}
              </>
            ) : null}
            {decidedAt ? formatDateAndTime(decidedAt, locale) : null}
          </span>
        </span>
        {reason ? <span className="font-normal whitespace-pre-wrap text-gray-600">{reason}</span> : null}
      </span>
    );
  }

  if (canAct && hasPermission) {
    return (
      <span className="flex items-center gap-3">
        <button
          type="button"
          onClick={onApprove}
          className="flex items-center gap-1 text-sm font-semibold! text-blue-500 hover:underline"
        >
          {translate("Approve", "اعتماد")}
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex items-center gap-1 text-sm font-semibold! text-red-500 hover:underline"
        >
          {translate("Reject", "رفض")}
        </button>
      </span>
    );
  }

  return <EmptyValue />;
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
      value: <span className={status.className}>{status.label}</span>,
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
    {
      key: translate("Planning Approval", "اعتماد التخطيط والمتابعة"),
      value: (
        <ApprovalFieldValue
          decision={requisition.planningDecision}
          decidedAt={requisition.planningDecidedAt}
          decidedBy={requisition.planningDecidedBy}
          reason={requisition.planningDecisionReason}
          canAct={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PLANNING}
          onApprove={() => openConfirm("planning", "approve")}
          onReject={() => openConfirm("planning", "reject")}
        />
      ),
    },
    {
      key: translate("Purchasing Manager Approval", "اعتماد مدير المشتريات"),
      value: (
        <ApprovalFieldValue
          decision={requisition.purchasingManagerDecision}
          decidedAt={requisition.purchasingManagerDecidedAt}
          decidedBy={requisition.purchasingManagerDecidedBy}
          reason={requisition.purchasingManagerDecisionReason}
          canAct={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PURCHASING_MANAGER}
          onApprove={() => openConfirm("purchasingManager", "approve")}
          onReject={() => openConfirm("purchasingManager", "reject")}
        />
      ),
    },
    {
      key: translate("Manager Approval", "اعتماد المدير"),
      value: (
        <ApprovalFieldValue
          decision={requisition.managerDecision}
          decidedAt={requisition.managerDecidedAt}
          decidedBy={requisition.managerDecidedBy}
          reason={requisition.managerDecisionReason}
          canAct={!terminal}
          permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_MANAGER}
          onApprove={() => openConfirm("manager", "approve")}
          onReject={() => openConfirm("manager", "reject")}
        />
      ),
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
