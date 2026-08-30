"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Textarea } from "@mantine/core";
import { Ban, X } from "lucide-react";
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

export default function WorkflowActions({ requisition }: { requisition: MaterialPurchaseRequisitionDetailed }) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [rejectOpened, setRejectOpened] = useState(false);
  const [cancelOpened, setCancelOpened] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectValidationError, setRejectValidationError] = useState("");

  const terminal = isRequisitionTerminal(requisition);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
  };

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

  if (terminal) return null;

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

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
