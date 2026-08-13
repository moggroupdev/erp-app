"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { type LegacyIssuePermitWorkOrderType } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { type ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Button, Checkbox, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyIssuePermitWorkOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-work-order-type";

function toDateTimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HeaderModal({
  opened,
  close,
  transaction,
}: {
  opened: boolean;
  close: () => void;
  transaction: LegacyIssuePermitDetailed;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [issuePermitNumber, setIssuePermitNumber] = useState("");
  const [issueOrderNumber, setIssueOrderNumber] = useState("");
  const [issueOrderDate, setIssueOrderDate] = useState("");
  const [date, setDate] = useState("");
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [workOrderNumberType, setWorkOrderNumberType] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!opened) return;
    setIssuePermitNumber(transaction.issuePermitNumber);
    setIssueOrderNumber(transaction.issueOrderNumber);
    setIssueOrderDate(toDateTimeLocalValue(transaction.issueOrderDate));
    setDate(toDateTimeLocalValue(transaction.date));
    setCreatorId(transaction.creator.id);
    setProductionSubDepartment(transaction.productionSubDepartment);
    setContractNumber(transaction.contractNumber || "");
    setWorkOrderNumber(transaction.workOrderNumber || "");
    setWorkOrderNumberType(transaction.workOrderNumberType);
    setIsCancelled(transaction.isCancelled);
    setNotes(transaction.notes || "");
    setValidationError("");
  }, [opened, transaction]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await legacyIssuePermitsApi.updateHeader({
        privateRequest,
        id: transaction.id,
        dto: {
          issuePermitNumber: issuePermitNumber.trim(),
          issueOrderNumber: issueOrderNumber.trim(),
          issueOrderDate: new Date(issueOrderDate).toISOString(),
          date: new Date(date).toISOString(),
          creatorId: creatorId!,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          contractNumber: contractNumber.trim() || null,
          workOrderNumber: workOrderNumber.trim() || null,
          workOrderNumberType: workOrderNumberType as LegacyIssuePermitWorkOrderType,
          isCancelled,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.all });
      toast.success(translate("Legacy issue permit updated successfully.", "تم تحديث أذن الصرف المرحلي بنجاح."));
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!issuePermitNumber.trim()) {
      return setValidationError(translate("Issue permit number is required.", "رقم إذن الصرف مطلوب."));
    }
    if (!issueOrderNumber.trim()) {
      return setValidationError(translate("Issue order number is required.", "رقم أمر الصرف مطلوب."));
    }
    if (!issueOrderDate || Number.isNaN(new Date(issueOrderDate).getTime())) {
      return setValidationError(translate("Issue order date must be valid.", "يجب أن يكون تاريخ أمر الصرف صالحاً."));
    }
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return setValidationError(translate("Date must be valid.", "يجب أن يكون التاريخ صالحاً."));
    }
    if (!creatorId) {
      return setValidationError(translate("Please select a creator.", "يرجى اختيار المنشئ."));
    }
    if (!workOrderNumberType) {
      return setValidationError(translate("Please select a work order type.", "يرجى اختيار نوع أمر العمل."));
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
    issuePermitNumber.trim() !== transaction.issuePermitNumber ||
    issueOrderNumber.trim() !== transaction.issueOrderNumber ||
    toDateTimeLocalValue(transaction.issueOrderDate) !== issueOrderDate ||
    toDateTimeLocalValue(transaction.date) !== date ||
    creatorId !== transaction.creator.id ||
    (productionSubDepartment || null) !== (transaction.productionSubDepartment || null) ||
    (contractNumber.trim() || null) !== transaction.contractNumber ||
    (workOrderNumber.trim() || null) !== transaction.workOrderNumber ||
    workOrderNumberType !== transaction.workOrderNumberType ||
    isCancelled !== transaction.isCancelled ||
    (notes.trim() || null) !== transaction.notes;

  const isReadyToSubmit =
    !!issuePermitNumber.trim() &&
    !!issueOrderNumber.trim() &&
    !!issueOrderDate &&
    !!date &&
    !!creatorId &&
    !!workOrderNumberType &&
    isDataChanged;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Edit Transaction Header", "تعديل رأس أذن الصرف")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput
            value={issuePermitNumber}
            onChange={(e) => setIssuePermitNumber(e.target.value)}
            label={translate("Issue Permit Number", "رقم إذن الصرف")}
            required
            radius="md"
          />
          <TextInput
            value={issueOrderNumber}
            onChange={(e) => setIssueOrderNumber(e.target.value)}
            label={translate("Issue Order Number", "رقم أمر الصرف")}
            required
            radius="md"
          />
          <TextInput
            type="datetime-local"
            value={issueOrderDate}
            onChange={(e) => setIssueOrderDate(e.target.value)}
            label={translate("Issue Order Date", "تاريخ أمر الصرف")}
            required
            radius="md"
          />
          <TextInput
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            label={translate("Date", "التاريخ")}
            required
            radius="md"
          />
          <SelectUser
            value={creatorId}
            setValue={setCreatorId}
            label={translate("Creator", "المنشئ")}
            required
            radius="md"
          />
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Sub-Department", "القسم الفرعي للإنتاج")}
            clearable
            radius="md"
          />
          <SelectLegacyIssuePermitWorkOrderType
            value={workOrderNumberType}
            setValue={setWorkOrderNumberType}
            label={translate("Work Order Type", "نوع أمر العمل")}
            required
            radius="md"
          />
          <TextInput
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            label={translate("Contract Number", "رقم العقد")}
            radius="md"
          />
          <TextInput
            value={workOrderNumber}
            onChange={(e) => setWorkOrderNumber(e.target.value)}
            label={translate("Work Order Number", "رقم أمر العمل")}
            radius="md"
          />
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes", "الملاحظات")}
          radius="md"
          autosize
          minRows={2}
        />

        <Checkbox
          checked={isCancelled}
          onChange={(e) => setIsCancelled(e.currentTarget.checked)}
          label={translate("Cancelled", "ملغي")}
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
