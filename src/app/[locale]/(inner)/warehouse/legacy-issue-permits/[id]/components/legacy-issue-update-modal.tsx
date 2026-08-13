"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import {
  LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES,
  type LegacyIssuePermitWorkOrderType,
} from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { type ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Button, Checkbox, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyIssuePermitWorkOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-work-order-type";
import DateTimePickerInput, {
  dateTimePickerValueToIso,
  toDateTimePickerValue,
} from "@/components/ui/datetime-picker-input";

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
  const [issueOrderDate, setIssueOrderDate] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceWorkOrderType, setMaintenanceWorkOrderType] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!opened) return;
    setIssuePermitNumber(transaction.issuePermitNumber);
    setIssueOrderNumber(transaction.issueOrderNumber);
    setIssueOrderDate(toDateTimePickerValue(transaction.issueOrderDate));
    setDate(toDateTimePickerValue(transaction.date));
    setCreatorId(transaction.creator.id);
    setProductionSubDepartment(transaction.productionSubDepartment);
    setContractNumber(transaction.contractNumber || "");
    setWorkOrderNumber(transaction.workOrderNumber || "");
    setIsMaintenance(transaction.workOrderNumberType !== LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT);
    setMaintenanceWorkOrderType(
      transaction.workOrderNumberType !== LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT
        ? transaction.workOrderNumberType
        : null,
    );
    setIsCancelled(transaction.isCancelled);
    setNotes(transaction.notes || "");
    setValidationError("");
  }, [opened, transaction]);

  const resolvedWorkOrderNumberType = isMaintenance
    ? (maintenanceWorkOrderType as LegacyIssuePermitWorkOrderType)
    : LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT;

  const mutation = useMutation({
    mutationFn: async () => {
      return await legacyIssuePermitsApi.updateHeader({
        privateRequest,
        id: transaction.id,
        dto: {
          issuePermitNumber: issuePermitNumber.trim(),
          issueOrderNumber: issueOrderNumber.trim(),
          issueOrderDate: dateTimePickerValueToIso(issueOrderDate)!,
          date: dateTimePickerValueToIso(date)!,
          creatorId: creatorId!,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          contractNumber: contractNumber.trim() || null,
          workOrderNumber: workOrderNumber.trim() || null,
          workOrderNumberType: resolvedWorkOrderNumberType,
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
      return setValidationError(translate("Issue order number is required.", "رقم طلب الصرف مطلوب."));
    }
    if (!dateTimePickerValueToIso(issueOrderDate)) {
      return setValidationError(translate("Issue order date must be valid.", "يجب أن يكون تاريخ طلب الصرف صالحاً."));
    }
    if (!dateTimePickerValueToIso(date)) {
      return setValidationError(translate("Date must be valid.", "يجب أن يكون التاريخ صالحاً."));
    }
    if (!creatorId) {
      return setValidationError(translate("Please select a creator.", "يرجى اختيار المحرر."));
    }
    if (isMaintenance && !maintenanceWorkOrderType) {
      return setValidationError(translate("Please select a work order type.", "يرجى اختيار نوع أمر الشغل."));
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
    dateTimePickerValueToIso(toDateTimePickerValue(transaction.issueOrderDate)) !== dateTimePickerValueToIso(issueOrderDate) ||
    dateTimePickerValueToIso(toDateTimePickerValue(transaction.date)) !== dateTimePickerValueToIso(date) ||
    creatorId !== transaction.creator.id ||
    (productionSubDepartment || null) !== (transaction.productionSubDepartment || null) ||
    (contractNumber.trim() || null) !== transaction.contractNumber ||
    (workOrderNumber.trim() || null) !== transaction.workOrderNumber ||
    resolvedWorkOrderNumberType !== transaction.workOrderNumberType ||
    isCancelled !== transaction.isCancelled ||
    (notes.trim() || null) !== transaction.notes;

  const isReadyToSubmit =
    !!issuePermitNumber.trim() &&
    !!issueOrderNumber.trim() &&
    !!dateTimePickerValueToIso(issueOrderDate) &&
    !!dateTimePickerValueToIso(date) &&
    !!creatorId &&
    (!isMaintenance || !!maintenanceWorkOrderType) &&
    isDataChanged;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Edit Issue Permit", "تعديل إذن الصرف")}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput
            value={issuePermitNumber}
            onChange={(e) => setIssuePermitNumber(e.target.value)}
            label={translate("Issue Permit Number", "رقم إذن الصرف")}
            placeholder={translate("Enter issue permit number", "أدخل رقم إذن الصرف")}
            required
            radius="md"
          />
          <DateTimePickerInput
            value={date}
            onChange={setDate}
            label={translate("Issue Permit Date", "تاريخ إذن الصرف")}
            placeholder={translate("Select issue permit date", "اختر تاريخ إذن الصرف")}
            required
          />
          <TextInput
            value={issueOrderNumber}
            onChange={(e) => setIssueOrderNumber(e.target.value)}
            label={translate("Issue Order Number", "رقم طلب الصرف")}
            placeholder={translate("Enter issue order number", "أدخل رقم طلب الصرف")}
            required
            radius="md"
          />
          <DateTimePickerInput
            value={issueOrderDate}
            onChange={setIssueOrderDate}
            label={translate("Issue Order Date", "تاريخ طلب الصرف")}
            placeholder={translate("Select issue order date", "اختر تاريخ طلب الصرف")}
            required
          />
          <SelectUser
            value={creatorId}
            setValue={setCreatorId}
            label={translate("Creator", "المحرر")}
            placeholder={translate("Search users...", "ابحث عن مستخدم...")}
            required
            radius="md"
          />
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Sub-Department", "قسم الانتاج")}
            placeholder={translate("Select department...", "اختر القسم...")}
            clearable
            radius="md"
          />
          <TextInput
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            label={translate("Contract Number", "رقم مراجعة العقد")}
            placeholder={translate("Enter contract number", "أدخل رقم مراجعة العقد")}
            radius="md"
          />
          <TextInput
            value={workOrderNumber}
            onChange={(e) => setWorkOrderNumber(e.target.value)}
            label={translate("Work Order Number", "رقم أمر الشغل")}
            placeholder={translate("Enter work order number", "أدخل رقم أمر الشغل")}
            radius="md"
          />

          <div className="flex flex-col gap-2">
            <Checkbox
              checked={isMaintenance}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setIsMaintenance(checked);
                if (!checked) setMaintenanceWorkOrderType(null);
              }}
              label={translate("Maintenance", "صيانة")}
            />
            {isMaintenance && (
              <SelectLegacyIssuePermitWorkOrderType
                value={maintenanceWorkOrderType}
                setValue={setMaintenanceWorkOrderType}
                label={translate("Maintenance Type", "نوع الصيانة")}
                placeholder={translate("Select type...", "اختر النوع...")}
                excludeValues={[LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT]}
                required
                radius="md"
              />
            )}
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Enter notes", "أدخل الملاحظات")}
          radius="md"
          autosize
          minRows={2}
        />

        <Checkbox
          checked={isCancelled}
          onChange={(e) => setIsCancelled(e.currentTarget.checked)}
          label={translate("Cancelled", "تعيين كإذن ملغي")}
          color="red"
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
