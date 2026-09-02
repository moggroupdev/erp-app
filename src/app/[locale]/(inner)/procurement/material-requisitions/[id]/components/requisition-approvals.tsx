"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button, Divider, Textarea } from "@mantine/core";
import { CheckCircle, Clock, Lock, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { APPROVAL_DECISIONS, type ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import { type MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import { CreatorLink } from "@/components/ui/entity-details";
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
      stepClass: "border-teal-600 bg-teal-600 text-white",
      badgeVariant: "light" as const,
    };
  }
  if (decision === APPROVAL_DECISIONS.REJECTED) {
    return {
      label: translate("Rejected", "مرفوض"),
      color: "red" as const,
      Icon: XCircle,
      stepClass: "border-red-600 bg-red-600 text-white",
      badgeVariant: "light" as const,
    };
  }
  return {
    label: translate("Pending", "قيد الانتظار"),
    color: "dark" as const,
    Icon: Clock,
    stepClass: "border-gray-300 bg-white text-gray-500",
    badgeVariant: "light" as const,
  };
}

function DecisionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">{label}</span>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function SupersededGateContent() {
  const { translate } = useI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-slate-50/80 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
        <Lock size={18} />
      </div>
      <p className="max-w-[220px] text-xs leading-relaxed text-gray-400">
        {translate(
          "This stage was not reached because the requisition was rejected at a previous approval stage.",
          "لم تُستكمل هذه المرحلة لأن الطلب رُفض في مرحلة اعتماد سابقة.",
        )}
      </p>
    </div>
  );
}

function ApprovalGateCard({
  step,
  title,
  subtitle,
  decision,
  decidedAt,
  decidedBy,
  reason,
  canAct,
  hidePendingState,
  permission,
  onApprove,
  onReject,
}: {
  step: number;
  title: string;
  subtitle: string;
  decision: ApprovalDecision;
  decidedAt: Date | null;
  decidedBy: UserRef;
  reason: string | null;
  canAct: boolean;
  hidePendingState: boolean;
  permission: Permission;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { locale, translate } = useI18n();
  const hasPermission = useHasPermission(permission);
  const meta = getDecisionMeta(decision, translate);
  const Icon: LucideIcon = meta.Icon;
  const showActions = decision === APPROVAL_DECISIONS.PENDING && canAct && hasPermission;
  const showStatusBadge = !(decision === APPROVAL_DECISIONS.PENDING && hidePendingState);
  const isDecided = decision !== APPROVAL_DECISIONS.PENDING;
  const isSuperseded = decision === APPROVAL_DECISIONS.PENDING && hidePendingState;

  return (
    <article
      className={`flex min-w-0 flex-1 flex-col rounded-2xl border bg-white ${
        isSuperseded ? "border-gray-200/60 opacity-90" : "border-gray-200/75"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
            isSuperseded ? "border-gray-200 bg-gray-50 text-gray-400" : meta.stepClass
          }`}
        >
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isSuperseded ? "text-gray-500" : "text-gray-900"}`}>{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        {showStatusBadge ? (
          <Badge variant={meta.badgeVariant} color={meta.color} leftSection={<Icon size={12} />}>
            {meta.label}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        {isDecided ? (
          <>
            <DecisionField label={translate("Decided By", "قرر بواسطة")}>
              {decidedBy ? <CreatorLink creator={decidedBy} /> : <span className="text-gray-400">-</span>}
            </DecisionField>
            <DecisionField label={translate("Decision Date", "تاريخ القرار")}>
              {decidedAt ? formatDateAndTime(decidedAt, locale) : <span className="text-gray-400">-</span>}
            </DecisionField>
            {decision === APPROVAL_DECISIONS.REJECTED && reason ? (
              <DecisionField label={translate("Rejection Reason", "سبب الرفض")}>
                <p className="text-sm font-normal whitespace-pre-wrap text-red-800">{reason}</p>
              </DecisionField>
            ) : null}
          </>
        ) : isSuperseded ? (
          <SupersededGateContent />
        ) : (
          <div className="flex flex-1 flex-col gap-1 py-2">
            <p className="text-sm text-gray-600">{translate("Awaiting formal decision", "بانتظار القرار الرسمي")}</p>
            <p className="text-xs text-gray-400">
              {translate("No record has been submitted yet.", "لم يُسجَّل أي قرار بعد.")}
            </p>
          </div>
        )}
      </div>

      {showActions ? (
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <Button size="xs" variant="light" color="teal" leftSection={<CheckCircle size={14} />} onClick={onApprove}>
            {translate("Record Approval", "تسجيل الاعتماد")}
          </Button>
          <Button size="xs" variant="light" color="red" leftSection={<XCircle size={14} />} onClick={onReject}>
            {translate("Record Rejection", "تسجيل الرفض")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function RequisitionApprovals({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [confirmGate, setConfirmGate] = useState<Gate | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectValidationError, setRejectValidationError] = useState("");

  const terminal = isRequisitionTerminal(requisition);
  const overallStatus = getRequisitionStatusLabel(getRequisitionStatus(requisition), translate);

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
  const rejectError = rejectValidationError || (rejectMutation.error ? getErrorMessage(locale, rejectMutation.error) : "");

  const confirmCopy: Record<Gate, { approveTitle: string; approveBody: string; rejectTitle: string }> = {
    planning: {
      approveTitle: translate("Confirm Planning Approval", "تأكيد اعتماد التخطيط والمتابعة"),
      approveBody: translate(
        "You are about to record the formal approval of the Planning & Follow-up department for this requisition.",
        "أنت على وشك تسجيل الاعتماد الرسمي من قسم التخطيط والمتابعة على هذا الطلب.",
      ),
      rejectTitle: translate("Confirm Planning Rejection", "تأكيد رفض التخطيط والمتابعة"),
    },
    purchasingManager: {
      approveTitle: translate("Confirm Purchasing Manager Approval", "تأكيد اعتماد مدير المشتريات"),
      approveBody: translate(
        "You are about to record the formal approval of the Purchasing Manager for this requisition.",
        "أنت على وشك تسجيل الاعتماد الرسمي من مدير المشتريات على هذا الطلب.",
      ),
      rejectTitle: translate("Confirm Purchasing Manager Rejection", "تأكيد رفض مدير المشتريات"),
    },
    manager: {
      approveTitle: translate("Confirm Manager Approval", "تأكيد اعتماد المدير"),
      approveBody: translate(
        "You are about to record the formal approval of the Manager for this requisition.",
        "أنت على وشك تسجيل الاعتماد الرسمي من المدير على هذا الطلب.",
      ),
      rejectTitle: translate("Confirm Manager Rejection", "تأكيد رفض المدير"),
    },
  };

  const gates: {
    id: Gate;
    title: string;
    subtitle: string;
    decision: ApprovalDecision;
    decidedAt: Date | null;
    decidedBy: UserRef;
    reason: string | null;
    permission: Permission;
  }[] = [
    {
      id: "planning",
      title: translate("Planning & Follow-up", "التخطيط والمتابعة"),
      subtitle: translate("Planning department review", "مراجعة قسم التخطيط والمتابعة"),
      decision: requisition.planningDecision,
      decidedAt: requisition.planningDecidedAt,
      decidedBy: requisition.planningDecidedBy,
      reason: requisition.planningDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PLANNING,
    },
    {
      id: "purchasingManager",
      title: translate("Purchasing Manager", "مدير المشتريات"),
      subtitle: translate("Procurement authority review", "مراجعة قسم المشتريات"),
      decision: requisition.purchasingManagerDecision,
      decidedAt: requisition.purchasingManagerDecidedAt,
      decidedBy: requisition.purchasingManagerDecidedBy,
      reason: requisition.purchasingManagerDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PURCHASING_MANAGER,
    },
    {
      id: "manager",
      title: translate("Manager", "المدير"),
      subtitle: translate("Final management review", "المراجعة الإدارية النهائية"),
      decision: requisition.managerDecision,
      decidedAt: requisition.managerDecidedAt,
      decidedBy: requisition.managerDecidedBy,
      reason: requisition.managerDecisionReason,
      permission: PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_MANAGER,
    },
  ];

  const approvedCount = gates.filter((gate) => gate.decision === APPROVAL_DECISIONS.APPROVED).length;

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

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-slate-50/50">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{translate("Approval Workflow", "سير عمل الاعتماد")}</h4>
              <p className="text-sm text-gray-500">
                {translate(
                  "Formal review and decision record for each authorized party.",
                  "المراجعة الرسمية وسجل القرار لكل جهة مخوّلة.",
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
              {translate(`${approvedCount} of 3 approved`, `${approvedCount} من 3 معتمد`)}
            </span>
            <Badge size="md" variant="light" color={overallStatus.color} radius="sm">
              {overallStatus.label}
            </Badge>
          </div>
        </header>

        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-stretch">
          {gates.map((gate, index) => (
            <ApprovalGateCard
              key={gate.id}
              step={index + 1}
              title={gate.title}
              subtitle={gate.subtitle}
              decision={gate.decision}
              decidedAt={gate.decidedAt}
              decidedBy={gate.decidedBy}
              reason={gate.reason}
              canAct={!terminal}
              hidePendingState={terminal && gate.decision === APPROVAL_DECISIONS.PENDING}
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
            <p className="text-sm text-gray-600">{confirmCopy[confirmGate].approveBody}</p>
            <Divider />
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
                {translate("Confirm Approval", "تأكيد الاعتماد")}
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
            <p className="text-sm text-gray-600">
              {translate(
                "Recording a rejection will close this requisition. Remaining approval stages will no longer accept decisions.",
                "تسجيل الرفض سيُغلق هذا الطلب. لن تقبل مراحل الاعتماد المتبقية أي قرارات.",
              )}
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              label={translate("Rejection Reason", "سبب الرفض")}
              description={translate(
                "Provide a clear justification. This will be recorded permanently.",
                "قدّم مبرراً واضحاً. سيتم تسجيله بشكل دائم.",
              )}
              placeholder={translate("Enter the reason for rejection", "أدخل سبب الرفض")}
              required
              radius="md"
              autosize
              minRows={3}
            />
            <Divider />
            <div className="flex gap-2">
              <Button variant="light" color="dark" radius="md" onClick={closeConfirm} fullWidth>
                {translation.cancel}
              </Button>
              <Button type="submit" color="red" loading={rejectMutation.isPending} radius="md" fullWidth>
                {translate("Confirm Rejection", "تأكيد الرفض")}
              </Button>
            </div>
            {rejectError && <ErrorAlert error={rejectError} />}
          </form>
        )}
      </Modal>
    </>
  );
}
