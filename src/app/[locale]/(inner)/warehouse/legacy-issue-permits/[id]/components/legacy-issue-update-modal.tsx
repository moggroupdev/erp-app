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
  LEGACY_ISSUE_PERMIT_TYPES,
  type LegacyIssuePermitType,
} from "@/lib/constants/enums/legacy-issue-permit-types";
import type { LegacyIssuePermitMaintenanceOrderType } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import { type ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Button, Checkbox, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyIssuePermitType from "@/components/global/selections/enum-based/select-legacy-issue-permit-type";
import SelectLegacyIssuePermitMaintenanceOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-maintenance-order-type";
import DatePickerInput from "@/components/ui/date-picker-input";
import { dateTimePickerValueToIso, toDatePickerValue } from "@/lib/helpers/datetime-picker";

export default function LegacyIssuePermitUpdateModal({
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
  const [permitType, setPermitType] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [maintenanceOrderNumber, setMaintenanceOrderNumber] = useState("");
  const [maintenanceOrderType, setMaintenanceOrderType] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [hasMultipleCustomers, setHasMultipleCustomers] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notes, setNotes] = useState("");

  const isContractReview = permitType === LEGACY_ISSUE_PERMIT_TYPES.CONTRACT_REVIEW;
  const isMaintenanceOrder = permitType === LEGACY_ISSUE_PERMIT_TYPES.MAINTENANCE_ORDER;
  const isProductionDepartment = permitType === LEGACY_ISSUE_PERMIT_TYPES.PRODUCTION_DEPARTMENT;
  const showsCustomerFields = isContractReview || isMaintenanceOrder;

  function handlePermitTypeChange(nextType: React.SetStateAction<string | null>) {
    const resolved = typeof nextType === "function" ? nextType(permitType) : nextType;
    setPermitType(resolved);
    setContractNumber("");
    setMaintenanceOrderNumber("");
    setMaintenanceOrderType(null);
    setCustomerId(null);
    setHasMultipleCustomers(false);
  }

  function handleMultipleCustomersChange(checked: boolean) {
    setHasMultipleCustomers(checked);
    if (checked) {
      setCustomerId(null);
      setContractNumber("");
      setMaintenanceOrderNumber("");
    }
  }

  useEffect(() => {
    if (!opened) return;
    setIssuePermitNumber(transaction.issuePermitNumber);
    setIssueOrderNumber(transaction.issueOrderNumber || "");
    setIssueOrderDate(transaction.issueOrderDate ? toDatePickerValue(transaction.issueOrderDate) : null);
    setDate(toDatePickerValue(transaction.date));
    setCreatorId(transaction.creator.id);
    setProductionSubDepartment(transaction.productionSubDepartment);
    setPermitType(transaction.permitType);
    setContractNumber(transaction.contractNumber || "");
    setMaintenanceOrderNumber(transaction.maintenanceOrderNumber || "");
    setMaintenanceOrderType(transaction.maintenanceOrderType);
    setCustomerId(transaction.customer?.id ?? null);
    setHasMultipleCustomers(transaction.hasMultipleCustomers);
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
          issueOrderNumber: issueOrderNumber.trim() || null,
          issueOrderDate: dateTimePickerValueToIso(issueOrderDate),
          date: dateTimePickerValueToIso(date)!,
          creatorId: creatorId!,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          permitType: permitType as LegacyIssuePermitType,
          contractNumber: isContractReview && !hasMultipleCustomers ? contractNumber.trim() || null : null,
          maintenanceOrderNumber:
            isMaintenanceOrder && !hasMultipleCustomers ? maintenanceOrderNumber.trim() || null : null,
          maintenanceOrderType: isMaintenanceOrder
            ? (maintenanceOrderType as LegacyIssuePermitMaintenanceOrderType | null)
            : null,
          customerId: showsCustomerFields && !hasMultipleCustomers ? customerId : null,
          hasMultipleCustomers: showsCustomerFields ? hasMultipleCustomers : false,
          isCancelled,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.all });
      toast.success(translate("Legacy issue permit updated successfully.", "تم تحديث إذن الصرف المرحلي بنجاح."));
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

    const hasIssueOrderNumber = issueOrderNumber.trim() !== "";
    const hasIssueOrderDate = dateTimePickerValueToIso(issueOrderDate) !== null;
    if (hasIssueOrderNumber !== hasIssueOrderDate) {
      return setValidationError(
        translate(
          "Issue order number and issue order date must both be provided or both omitted.",
          "يجب إدخال رقم طلب الصرف وتاريخه معاً أو تركهما فارغين معاً.",
        ),
      );
    }

    if (!dateTimePickerValueToIso(date)) {
      return setValidationError(translate("Date must be valid.", "يجب أن يكون التاريخ صالحاً."));
    }
    if (!creatorId) {
      return setValidationError(translate("Please select a creator.", "يرجى اختيار المحرر."));
    }
    if (!permitType) {
      return setValidationError(translate("Please select a permit type.", "يرجى اختيار نوع الإذن."));
    }
    if (isProductionDepartment && !productionSubDepartment) {
      return setValidationError(
        translate("Please select a production department.", "يرجى اختيار قسم الانتاج."),
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
    issuePermitNumber.trim() !== transaction.issuePermitNumber ||
    (issueOrderNumber.trim() || null) !== (transaction.issueOrderNumber || null) ||
    (transaction.issueOrderDate
      ? dateTimePickerValueToIso(toDatePickerValue(transaction.issueOrderDate))
      : null) !== dateTimePickerValueToIso(issueOrderDate) ||
    dateTimePickerValueToIso(toDatePickerValue(transaction.date)) !== dateTimePickerValueToIso(date) ||
    creatorId !== transaction.creator.id ||
    (productionSubDepartment || null) !== (transaction.productionSubDepartment || null) ||
    permitType !== transaction.permitType ||
    (contractNumber.trim() || null) !== transaction.contractNumber ||
    (maintenanceOrderNumber.trim() || null) !== transaction.maintenanceOrderNumber ||
    (maintenanceOrderType || null) !== (transaction.maintenanceOrderType || null) ||
    (customerId || null) !== (transaction.customer?.id || null) ||
    hasMultipleCustomers !== transaction.hasMultipleCustomers ||
    isCancelled !== transaction.isCancelled ||
    (notes.trim() || null) !== transaction.notes;

  const isReadyToSubmit =
    !!issuePermitNumber.trim() &&
    !!dateTimePickerValueToIso(date) &&
    !!creatorId &&
    !!permitType &&
    (!isProductionDepartment || !!productionSubDepartment) &&
    issueOrderNumber.trim() !== "" === (dateTimePickerValueToIso(issueOrderDate) !== null) &&
    isDataChanged;

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Edit Issue Permit", "تعديل إذن الصرف")} size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            value={issuePermitNumber}
            onChange={(e) => setIssuePermitNumber(e.target.value)}
            label={translate("Issue Permit Number", "رقم إذن الصرف")}
            placeholder={translate("Enter issue permit number", "أدخل رقم إذن الصرف")}
            required
            radius="md"
          />
          <DatePickerInput
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
            placeholder={translate("Optional", "اختياري")}
            radius="md"
          />
          <DatePickerInput
            value={issueOrderDate}
            onChange={setIssueOrderDate}
            label={translate("Issue Order Date", "تاريخ طلب الصرف")}
            placeholder={translate("Optional", "اختياري")}
            clearable
          />
          <SelectUser
            value={creatorId}
            setValue={setCreatorId}
            lookup
            initialUser={transaction.creator}
            label={translate("Creator", "المحرر")}
            placeholder={translate("Search users...", "ابحث عن مستخدم...")}
            required
            radius="md"
          />
          <SelectLegacyIssuePermitType
            value={permitType}
            setValue={handlePermitTypeChange}
            label={translate("Permit Type", "نوع الإذن")}
            placeholder={translate("Select type...", "اختر النوع...")}
            required
            radius="md"
          />
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Department", "قسم الانتاج")}
            placeholder={translate("Select department...", "اختر القسم...")}
            required={isProductionDepartment}
            clearable={!isProductionDepartment}
            radius="md"
          />
          {showsCustomerFields && (
            <div className="col-span-2 flex flex-col gap-3">
              <Checkbox
                checked={hasMultipleCustomers}
                onChange={(e) => handleMultipleCustomersChange(e.currentTarget.checked)}
                label={translate("Multiple customers", "عملاء متعددون")}
              />
              {!hasMultipleCustomers && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {isContractReview && (
                    <TextInput
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      label={translate("Contract review number", "رقم مراجعة العقد")}
                      placeholder={translate("Optional", "اختياري")}
                      radius="md"
                    />
                  )}
                  {isMaintenanceOrder && (
                    <>
                      <TextInput
                        value={maintenanceOrderNumber}
                        onChange={(e) => setMaintenanceOrderNumber(e.target.value)}
                        label={translate("Maintenance Order Number", "رقم أمر الشغل")}
                        placeholder={translate("Optional", "اختياري")}
                        radius="md"
                      />
                      <SelectLegacyIssuePermitMaintenanceOrderType
                        value={maintenanceOrderType}
                        setValue={setMaintenanceOrderType}
                        label={translate("Maintenance Type", "نوع الصيانة")}
                        placeholder={translate("Select type...", "اختر النوع...")}
                        clearable
                        radius="md"
                      />
                    </>
                  )}
                  <SelectCustomer
                    value={customerId}
                    setValue={setCustomerId}
                    label={translate("Customer", "العميل")}
                    placeholder={translate("Search customers...", "ابحث عن عميل...")}
                    clearable
                    radius="md"
                  />
                </div>
              )}
            </div>
          )}
          <div className="col-span-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              label={translate("Notes", "الملاحظات")}
              placeholder={translate("Enter notes", "أدخل الملاحظات")}
              radius="md"
              autosize
              minRows={2}
            />
          </div>
          <Checkbox
            checked={isCancelled}
            onChange={(e) => setIsCancelled(e.currentTarget.checked)}
            label={translate("Set as cancelled", "تعيين كإذن ملغي")}
            color="clay"
          />
        </div>

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
