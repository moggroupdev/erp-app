"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { type ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialPurchaseRequisitionDetailed } from "@/types/material-purchase-requisition";
import { Button, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";

export default function RequisitionUpdateModal({
  opened,
  close,
  requisition,
}: {
  opened: boolean;
  close: () => void;
  requisition: MaterialPurchaseRequisitionDetailed;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!opened) return;
    setProductionSubDepartment(requisition.productionSubDepartment);
    setNotes(requisition.notes || "");
    setValidationError("");
  }, [opened, requisition]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialPurchaseRequisitionsApi.updateHeader({
        privateRequest,
        id: requisition.id,
        dto: {
          productionSubDepartment: productionSubDepartment as ProductionSubDepartment,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
      toast.success(
        translate("Material purchase requisition updated successfully.", "تم تحديث طلب شراء الخامات بنجاح."),
      );
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!productionSubDepartment) {
      return setValidationError(
        translate("Please select a production sub-department.", "يرجى اختيار قسم الانتاج."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const isDataChanged =
    productionSubDepartment !== requisition.productionSubDepartment ||
    (notes.trim() || null) !== requisition.notes;

  const isReadyToSubmit = !!productionSubDepartment && isDataChanged;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Edit Requisition", "تعديل طلب الشراء")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectProductionSubDepartment
          value={productionSubDepartment}
          setValue={setProductionSubDepartment}
          label={translate("Production Sub-Department", "قسم الانتاج")}
          placeholder={translate("Select department...", "اختر القسم...")}
          required
          radius="md"
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Enter notes", "أدخل الملاحظات")}
          radius="md"
          autosize
          minRows={2}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Save Changes", "حفظ التغييرات")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
