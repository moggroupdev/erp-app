"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Textarea } from "@mantine/core";
import { Ban, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import PermissionGuard from "@/components/guards/permission";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";
import DeleteModal from "@/components/ui/delete-modal";
import { isRequisitionTerminal } from "../../helpers";

type ConfirmAction = "planning" | "purchasingManager" | "director";

export default function WorkflowActions({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [rejectOpened, setRejectOpened] = useState(false);
  const [cancelOpened, setCancelOpened] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectValidationError, setRejectValidationError] = useState("");

  const terminal = isRequisitionTerminal(requisition);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
  };

  const approveMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action === "planning") {
        return materialPurchaseRequisitionsApi.approvePlanning({ privateRequest, id: requisition.id });
      }
      if (action === "purchasingManager") {
        return materialPurchaseRequisitionsApi.approvePurchasingManager({ privateRequest, id: requisition.id });
      }
      return materialPurchaseRequisitionsApi.approveDirector({ privateRequest, id: requisition.id });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(translate("Approval recorded successfully.", "تم تسجيل الاعتماد بنجاح."));
      setConfirmAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      materialPurchaseRequisitionsApi.reject({
        privateRequest,
        id: requisition.id,
        dto: { rejectionReason: rejectionReason.trim() },
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success(translate("Requisition rejected successfully.", "تم رفض طلب الشراء بنجاح."));
      handleCloseReject();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => materialPurchaseRequisitionsApi.cancel({ privateRequest, id: requisition.id }),
    onSuccess: async () => {
      await invalidate();
      toast.success(translate("Requisition cancelled successfully.", "تم إلغاء طلب الشراء بنجاح."));
      setCancelOpened(false);
    },
  });

  const approveError = approveMutation.error ? getErrorMessage(locale, approveMutation.error) : "";
  const rejectError =
    rejectValidationError || (rejectMutation.error ? getErrorMessage(locale, rejectMutation.error) : "");
  const cancelError = cancelMutation.error ? getErrorMessage(locale, cancelMutation.error) : "";

  function handleCloseReject() {
    setRejectOpened(false);
    setTimeout(() => {
      setRejectionReason("");
      setRejectValidationError("");
      rejectMutation.reset();
    }, 250);
  }

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRejectValidationError("");
    if (!rejectionReason.trim()) {
      return setRejectValidationError(translate("Rejection reason is required.", "سبب الرفض مطلوب."));
    }
    rejectMutation.mutate();
  }

  const confirmCopy: Record<ConfirmAction, { title: string; body: string }> = {
    planning: {
      title: translate("Approve as Planning?", "اعتماد التخطيط والمتابعة؟"),
      body: translate(
        "Record planning & follow-up approval for this requisition.",
        "تسجيل اعتماد التخطيط والمتابعة لهذا الطلب.",
      ),
    },
    purchasingManager: {
      title: translate("Approve as Purchasing Manager?", "اعتماد مدير المشتريات؟"),
      body: translate(
        "Record purchasing manager approval for this requisition.",
        "تسجيل اعتماد مدير المشتريات لهذا الطلب.",
      ),
    },
    director: {
      title: translate("Approve as Director?", "اعتماد المدير؟"),
      body: translate("Record director approval for this requisition.", "تسجيل اعتماد المدير لهذا الطلب."),
    },
  };

  const showPlanning = !terminal && !requisition.planningApprovedAt;
  const showPurchasingManager = !terminal && !requisition.purchasingManagerApprovedAt;
  const showDirector = !terminal && !requisition.directorApprovedAt;
  const showReject = !terminal;
  const showCancel = !terminal;

  if (!showPlanning && !showPurchasingManager && !showDirector && !showReject && !showCancel) {
    return null;
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {showPlanning && (
          <PermissionGuard permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PLANNING}>
            <Button
              variant="light"
              color="teal"
              radius="md"
              leftSection={<Check size={15} />}
              onClick={() => {
                approveMutation.reset();
                setConfirmAction("planning");
              }}
            >
              {translate("Approve Planning", "اعتماد التخطيط")}
            </Button>
          </PermissionGuard>
        )}
        {showPurchasingManager && (
          <PermissionGuard permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_PURCHASING_MANAGER}>
            <Button
              variant="light"
              color="teal"
              radius="md"
              leftSection={<Check size={15} />}
              onClick={() => {
                approveMutation.reset();
                setConfirmAction("purchasingManager");
              }}
            >
              {translate("Approve Purchasing Manager", "اعتماد مدير المشتريات")}
            </Button>
          </PermissionGuard>
        )}
        {showDirector && (
          <PermissionGuard permission={PERMISSIONS.APPROVE_MATERIAL_PURCHASE_REQUISITION_DIRECTOR}>
            <Button
              variant="light"
              color="teal"
              radius="md"
              leftSection={<Check size={15} />}
              onClick={() => {
                approveMutation.reset();
                setConfirmAction("director");
              }}
            >
              {translate("Approve Director", "اعتماد المدير")}
            </Button>
          </PermissionGuard>
        )}
        {showReject && (
          <PermissionGuard permission={PERMISSIONS.REJECT_MATERIAL_PURCHASE_REQUISITION}>
            <Button
              variant="light"
              color="red"
              radius="md"
              leftSection={<X size={15} />}
              onClick={() => {
                rejectMutation.reset();
                setRejectValidationError("");
                setRejectOpened(true);
              }}
            >
              {translate("Reject", "رفض")}
            </Button>
          </PermissionGuard>
        )}
        {showCancel && (
          <PermissionGuard permission={PERMISSIONS.CANCEL_MATERIAL_PURCHASE_REQUISITION}>
            <Button
              variant="light"
              color="red"
              radius="md"
              leftSection={<Ban size={15} />}
              onClick={() => {
                cancelMutation.reset();
                setCancelOpened(true);
              }}
            >
              {translate("Cancel", "إلغاء")}
            </Button>
          </PermissionGuard>
        )}
      </div>

      <Modal
        opened={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          approveMutation.reset();
        }}
        title={confirmAction ? confirmCopy[confirmAction].title : ""}
      >
        {confirmAction && (
          <div className="flex flex-col gap-3">
            <p>{confirmCopy[confirmAction].body}</p>
            <div className="flex gap-2">
              <Button
                variant="light"
                color="dark"
                radius="md"
                onClick={() => {
                  setConfirmAction(null);
                  approveMutation.reset();
                }}
                fullWidth
              >
                {translation.cancel}
              </Button>
              <Button
                radius="md"
                color="teal"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(confirmAction)}
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
        opened={rejectOpened}
        onClose={handleCloseReject}
        title={translate("Reject requisition?", "رفض طلب الشراء؟")}
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-3">
          <p>
            {translate(
              "This requisition will be rejected and can no longer be edited or approved.",
              "سيتم رفض طلب الشراء ولن يمكن تعديله أو اعتماده بعد ذلك.",
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
            <Button variant="light" color="dark" radius="md" onClick={handleCloseReject} fullWidth>
              {translation.cancel}
            </Button>
            <Button type="submit" color="red" loading={rejectMutation.isPending} radius="md" fullWidth>
              {translate("Reject", "رفض")}
            </Button>
          </div>
          {rejectError && <ErrorAlert error={rejectError} />}
        </form>
      </Modal>

      <DeleteModal
        opened={cancelOpened}
        onClose={() => {
          setCancelOpened(false);
          cancelMutation.reset();
        }}
        title={translate("Cancel requisition?", "إلغاء طلب الشراء؟")}
        subTitle={translate(
          `You're about to cancel "${requisition.code}". It will no longer be editable or approvable.`,
          `أنت على وشك إلغاء "${requisition.code}". لن يمكن تعديله أو اعتماده بعد ذلك.`,
        )}
        warning={translate("This action cannot be undone.", "هذا الإجراء لا يمكن التراجع عنه.")}
        action={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
        error={cancelError}
      />
    </>
  );
}
