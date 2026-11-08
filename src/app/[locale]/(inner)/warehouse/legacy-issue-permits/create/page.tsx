"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import {
  LEGACY_ISSUE_PERMIT_TYPES,
  type LegacyIssuePermitType,
} from "@/lib/constants/enums/legacy-issue-permit-types";
import type { LegacyIssuePermitMaintenanceOrderType } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import { supportsUnitConversions, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";
import { Button, Checkbox, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyIssuePermitType from "@/components/global/selections/enum-based/select-legacy-issue-permit-type";
import SelectLegacyIssuePermitMaintenanceOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-maintenance-order-type";
import DatePickerInput from "@/components/ui/date-picker-input";
import { dateTimePickerValueToIso } from "@/lib/helpers/datetime-picker";

const PAGE_TITLE = { en: "Create Legacy Issue Permit", ar: "إنشاء إذن صرف مرحلي" };

type ItemDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | "";
  notes: string;
};

function restrictToVerticalAxis({ transform }: Parameters<Modifier>[0]) {
  return { ...transform, x: 0 };
}

function createRowKey() {
  return `legacy-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): ItemDraftRow {
  return {
    key: createRowKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unitOfMeasurementSelected: null,
    quantity: "",
    notes: "",
  };
}

function showUnitSelect(row: ItemDraftRow) {
  return !!row.materialType && supportsUnitConversions(row.materialType) && row.unitConversions.length > 0;
}

function isEmptyRow(row: ItemDraftRow) {
  return row.materialCode === null && row.quantity === "" && row.notes.trim() === "";
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
}

function SortableItemRow({
  row,
  index,
  locale,
  usedMaterialCodes,
  canRemove,
  canReorder,
  onMaterialSelect,
  onUpdate,
  onRemove,
}: {
  row: ItemDraftRow;
  index: number;
  locale: Locale;
  usedMaterialCodes: string[];
  canRemove: boolean;
  canReorder: boolean;
  onMaterialSelect: (key: string, material: MaterialWithUnitConversionsSelection | null) => void;
  onUpdate: (key: string, patch: Partial<ItemDraftRow>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
    disabled: !canReorder,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td className="w-[2.5%]">
        <button
          type="button"
          disabled={!canReorder}
          className={`group relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors ${
            canReorder ? "cursor-grab hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing" : "cursor-default"
          }`}
          title={canReorder ? translate("Reorder row", "إعادة ترتيب الصف") : undefined}
          {...(canReorder ? attributes : {})}
          {...(canReorder ? listeners : {})}
        >
          <span
            className={`text-xs font-medium text-gray-500 ${
              canReorder ? (isDragging ? "opacity-0" : "group-hover:opacity-0") : ""
            }`}
          >
            {index + 1}
          </span>
          {canReorder && (
            <GripVertical
              size={16}
              className={`absolute ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            />
          )}
        </button>
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        <SelectMaterial
          value={row.materialCode}
          setValue={(next) => {
            const resolved = typeof next === "function" ? next(row.materialCode) : next;
            if (!resolved) onMaterialSelect(row.key, null);
            else onUpdate(row.key, { materialCode: resolved });
          }}
          onMaterialSelect={(material) => onMaterialSelect(row.key, material)}
          excludeCodes={usedMaterialCodes.filter((c) => c !== row.materialCode)}
          placeholder={translate("Enter material...", "أدخل المادة...")}
          variant="unstyled"
          radius={0}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
          withBrowseModal
        />
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        <NumberInput
          value={row.quantity}
          onChange={(value) => onUpdate(row.key, { quantity: value === "" ? "" : Number(value) })}
          min={0}
          allowNegative={false}
          decimalScale={6}
          hideControls
          variant="unstyled"
          radius={0}
          placeholder={translate("Enter quantity", "أدخل الكمية")}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
        />
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        {showUnitSelect(row) ? (
          <DataSelect
            value={row.unitOfMeasurementSelected}
            setValue={(next) => {
              const resolved = typeof next === "function" ? next(row.unitOfMeasurementSelected) : next;
              onUpdate(row.key, {
                unitOfMeasurementSelected: (resolved as MaterialUnit | null) ?? row.unitOfMeasurement,
              });
            }}
            data={getRowUnitOptions(row, locale)}
            variant="unstyled"
            radius={0}
            searchable
            placeholder={translate("Select unit", "اختر الوحدة")}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {row.unitOfMeasurementSelected ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale) : ""}
          </span>
        )}
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        <TextInput
          value={row.notes}
          onChange={(e) => onUpdate(row.key, { notes: e.target.value })}
          placeholder={translate("Optional", "اختياري")}
          variant="unstyled"
          radius={0}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
        />
      </Table.Td>
      <Table.Td className="w-[2.5%]">
        <Button
          type="button"
          variant="subtle"
          color="clay"
          size="xs"
          radius="md"
          p={6}
          disabled={!canRemove}
          onClick={() => onRemove(row.key)}
          title={translate("Remove row", "حذف الصف")}
        >
          <Trash2 size={14} />
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

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
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Legacy Issue Permits", "أذونات الصرف المرحلية")}`,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      return await legacyIssuePermitsApi.create({
        privateRequest,
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
          items: rows.map((row) => ({
            materialCode: row.materialCode,
            unitOfMeasurementSelected: row.unitOfMeasurementSelected,
            quantity: row.quantity === "" ? null : Number(row.quantity),
            notes: row.notes.trim() || null,
          })),
        },
      });
    },
    onSuccess: async (created) => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.all });
      router.push(getLocalizedHref(`/warehouse/legacy-issue-permits/${created.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  const isDirty = useMemo(
    () =>
      issuePermitNumber.trim() !== "" ||
      issueOrderNumber.trim() !== "" ||
      issueOrderDate !== null ||
      date !== null ||
      creatorId !== null ||
      productionSubDepartment !== null ||
      permitType !== null ||
      contractNumber.trim() !== "" ||
      maintenanceOrderNumber.trim() !== "" ||
      maintenanceOrderType !== null ||
      customerId !== null ||
      hasMultipleCustomers ||
      isCancelled ||
      notes.trim() !== "" ||
      rows.length > 1 ||
      rows.some((row) => !isEmptyRow(row)),
    [
      issuePermitNumber,
      issueOrderNumber,
      issueOrderDate,
      date,
      creatorId,
      productionSubDepartment,
      permitType,
      contractNumber,
      maintenanceOrderNumber,
      maintenanceOrderType,
      customerId,
      hasMultipleCustomers,
      isCancelled,
      notes,
      rows,
    ],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
  );
  const rowIds = useMemo(() => rows.map((row) => row.key), [rows]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updateRow(key: string, patch: Partial<ItemDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversionsSelection | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      materialTitle: material?.title ?? "",
      materialType: material?.materialType ?? null,
      unitOfMeasurement: material?.unitOfMeasurement ?? null,
      unitConversions: material?.unitConversions ?? [],
      unitOfMeasurementSelected: material?.unitOfMeasurement ?? null,
    });
    setValidationError("");
  }

  useEffect(() => {
    const incomplete = rows.filter((row) => row.materialCode && !row.materialType);
    if (incomplete.length === 0) return;

    let cancelled = false;

    Promise.all(
      incomplete.map(async (row) => {
        try {
          const material = await materialsApi.get({ privateRequest, code: row.materialCode! });
          if (!cancelled) handleMaterialSelect(row.key, material);
        } catch {
          // Leave the row as-is; user can re-select the material.
        }
      }),
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((row) => `${row.key}:${row.materialCode}:${row.materialType}`).join("|")]);

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((row) => row.key === active.id);
      const newIndex = prev.findIndex((row) => row.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

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

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
      const materialName = row.materialTitle || row.materialCode;

      if (row.materialCode) {
        if (!row.unitOfMeasurementSelected) {
          return setValidationError(
            translate(
              `${rowLabel}: please select the unit for material ${materialName}.`,
              `${rowLabel}: يرجى اختيار الوحدة للمادة ${materialName}.`,
            ),
          );
        }

        if (row.quantity === "") {
          return setValidationError(
            translate(
              `${rowLabel}: please enter the quantity for material ${materialName}.`,
              `${rowLabel}: يرجى إدخال الكمية للمادة ${materialName}.`,
            ),
          );
        }
      }

      if (row.quantity === "") continue;

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        return setValidationError(
          materialName
            ? translate(
                `${rowLabel}: quantity for material ${materialName} must be greater than zero.`,
                `${rowLabel}: يجب أن تكون كمية المادة ${materialName} أكبر من صفر.`,
              )
            : translate(
                `${rowLabel}: quantity must be greater than zero.`,
                `${rowLabel}: يجب أن تكون الكمية أكبر من صفر.`,
              ),
        );
      }
    }

    mutation.mutate();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              placeholder={translate("Optional", "اختياري")}
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
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

          <div className="overflow-x-auto rounded-xl">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
                  <Table.Thead className="bg-gray-50">
                    <Table.Tr className="h-9">
                      <Table.Th className="w-[2.5%] text-center! text-gray-500">#</Table.Th>
                      <Table.Th className="w-[47.5%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Material", "المادة")}
                      </Table.Th>
                      <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Quantity", "الكمية")}
                      </Table.Th>
                      <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Unit", "الوحدة")}
                      </Table.Th>
                      <Table.Th className="w-[27.5%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Notes", "الملاحظات")}
                      </Table.Th>
                      <Table.Th className="w-[2.5%]" />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rows.map((row, index) => (
                      <SortableItemRow
                        key={row.key}
                        row={row}
                        index={index}
                        locale={locale}
                        usedMaterialCodes={usedMaterialCodes}
                        canRemove={rows.length > 1}
                        canReorder={rows.length > 1}
                        onMaterialSelect={handleMaterialSelect}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                      />
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot className="bg-gray-50">
                    <Table.Tr className="h-9">
                      <Table.Td />
                      <Table.Td>
                        <Button
                          type="button"
                          variant="light"
                          color="teal"
                          radius="md"
                          size="xs"
                          leftSection={<Plus size={14} />}
                          onClick={addRow}
                        >
                          {translate("Add Row", "إضافة صف")}
                        </Button>
                      </Table.Td>
                      <Table.Td />
                      <Table.Td />
                      <Table.Td />
                      <Table.Td />
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </SortableContext>
            </DndContext>
          </div>
        </section>

        {error && <ErrorAlert error={error} />}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="light"
            color="dark"
            radius="md"
            onClick={() => {
              if (confirmNavigation()) router.push(getLocalizedHref("/warehouse/legacy-issue-permits"));
            }}
          >
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} radius="md" color="teal">
            {translate("Create", "إنشاء")}
          </Button>
        </div>
      </form>
    </LayoutBox>
  );
}
