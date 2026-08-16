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
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import {
  LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES,
  type LegacyIssuePermitWorkOrderType,
} from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversions } from "@/types/material";
import { Button, Checkbox, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyIssuePermitWorkOrderType from "@/components/global/selections/enum-based/select-legacy-issue-permit-work-order-type";
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
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  if (!row.unitOfMeasurement) return [];
  const altUnits = row.unitConversions.map((conversion) => conversion.unit);
  const allUnits = [row.unitOfMeasurement, ...altUnits.filter((unit) => unit !== row.unitOfMeasurement)];
  return allUnits.map((value) => ({ value, label: getMaterialUnitLabel(value, locale) }));
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
  onMaterialSelect: (key: string, material: MaterialWithUnitConversions | null) => void;
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
          color="red"
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
  const [contractNumber, setContractNumber] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceWorkOrderType, setMaintenanceWorkOrderType] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Legacy Issue Permits", "أذونات الصرف المرحلية")}`,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      return await legacyIssuePermitsApi.create({
        privateRequest,
        dto: {
          issuePermitNumber: issuePermitNumber.trim(),
          issueOrderNumber: issueOrderNumber.trim(),
          issueOrderDate: dateTimePickerValueToIso(issueOrderDate)!,
          date: dateTimePickerValueToIso(date)!,
          creatorId: creatorId!,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          contractNumber: isMaintenance ? null : contractNumber.trim() || null,
          workOrderNumber: isMaintenance ? workOrderNumber.trim() || null : null,
          workOrderNumberType: isMaintenance
            ? (maintenanceWorkOrderType as LegacyIssuePermitWorkOrderType)
            : LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.all });
      router.push(getLocalizedHref(`/warehouse/legacy-issue-permits/${created.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

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

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversions | null) {
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

    if (isMaintenance) {
      if (!workOrderNumber.trim()) {
        return setValidationError(translate("Work order number is required.", "رقم أمر الشغل مطلوب."));
      }
      if (!maintenanceWorkOrderType) {
        return setValidationError(translate("Please select a maintenance type.", "يرجى اختيار نوع الصيانة."));
      }
    } else if (!contractNumber.trim()) {
      return setValidationError(translate("Contract number is required.", "رقم مراجعة العقد مطلوب."));
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (row.quantity === "") continue;

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
        return setValidationError(
          translate(`${rowLabel}: quantity must be greater than zero.`, `${rowLabel}: يجب أن تكون الكمية أكبر من صفر.`),
        );
      }
    }

    mutation.mutate();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/warehouse/legacy-issue-permits"),
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
            placeholder={translate("Enter issue order number", "أدخل رقم طلب الصرف")}
            required
            radius="md"
          />
          <DatePickerInput
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
          <div className="col-span-2 flex flex-col gap-2">
            <Checkbox
              checked={isMaintenance}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setIsMaintenance(checked);
                if (checked) {
                  setContractNumber("");
                } else {
                  setWorkOrderNumber("");
                  setMaintenanceWorkOrderType(null);
                }
              }}
              label={translate("Maintenance", "صيانة")}
            />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            {!isMaintenance ? (
              <TextInput
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                label={translate("Contract Number", "رقم مراجعة العقد")}
                placeholder={translate("Enter contract number", "أدخل رقم مراجعة العقد")}
                required
                radius="md"
              />
            ) : (
              <>
                <TextInput
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  label={translate("Work Order Number", "رقم أمر الشغل")}
                  placeholder={translate("Enter work order number", "أدخل رقم أمر الشغل")}
                  required
                  radius="md"
                />
                <SelectLegacyIssuePermitWorkOrderType
                  value={maintenanceWorkOrderType}
                  setValue={setMaintenanceWorkOrderType}
                  label={translate("Maintenance Type", "نوع الصيانة")}
                  placeholder={translate("Select type...", "اختر النوع...")}
                  excludeValues={[LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT]}
                  required
                  radius="md"
                />
              </>
            )}
          </div>
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
            color="red"
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
            onClick={() => router.push(getLocalizedHref("/warehouse/legacy-issue-permits"))}
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
