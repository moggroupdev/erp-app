"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyInventoryTransactionsApi from "@/lib/api/legacy-inventory-transactions";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { LEGACY_WORK_ORDER_TYPES, type LegacyWorkOrderType } from "@/lib/constants/enums/legacy-work-order-types";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversions } from "@/types/material";
import { Button, Checkbox, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectLegacyWorkOrderType from "@/components/global/selections/enum-based/select-legacy-work-order-type";

const PAGE_TITLE = { en: "Create Legacy Inventory Transaction", ar: "إنشاء حركة مخزون قديمة" };

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

function toDateTimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [issuePermitNumber, setIssuePermitNumber] = useState("");
  const [issueOrderNumber, setIssueOrderNumber] = useState("");
  const [issueOrderDate, setIssueOrderDate] = useState(toDateTimeLocalValue());
  const [date, setDate] = useState(toDateTimeLocalValue());
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [workOrderNumberType, setWorkOrderNumberType] = useState<string | null>(LEGACY_WORK_ORDER_TYPES.BASE_CONTRACT);
  const [isCancelled, setIsCancelled] = useState(false);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Legacy Inventory Transactions", "حركات المخزون القديمة")}`,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      return await legacyInventoryTransactionsApi.create({
        privateRequest,
        dto: {
          issuePermitNumber: issuePermitNumber.trim(),
          issueOrderNumber: issueOrderNumber.trim(),
          issueOrderDate: new Date(issueOrderDate).toISOString(),
          date: new Date(date).toISOString(),
          creatorId: creatorId!,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          contractNumber: contractNumber.trim() || null,
          workOrderNumber: workOrderNumber.trim() || null,
          workOrderNumberType: (workOrderNumberType as LegacyWorkOrderType) || LEGACY_WORK_ORDER_TYPES.BASE_CONTRACT,
          isCancelled,
          notes: notes.trim() || null,
          items: rows.map((row) => ({
            materialCode: row.materialCode!,
            unitOfMeasurementSelected: row.unitOfMeasurementSelected!,
            quantity: Number(row.quantity),
            notes: row.notes.trim() || null,
          })),
        },
      });
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyInventoryTransactions.all });
      router.push(getLocalizedHref(`/warehouse/legacy-transactions/${created.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!issuePermitNumber.trim()) {
      return setValidationError(translate("Issue permit number is required.", "رقم إذن الصرف مطلوب."));
    }

    if (!issueOrderNumber.trim()) {
      return setValidationError(translate("Issue order number is required.", "رقم أمر الصرف مطلوب."));
    }

    if (!issueOrderDate) {
      return setValidationError(translate("Issue order date is required.", "تاريخ أمر الصرف مطلوب."));
    }

    if (Number.isNaN(new Date(issueOrderDate).getTime())) {
      return setValidationError(translate("Issue order date must be valid.", "يجب أن يكون تاريخ أمر الصرف صالحاً."));
    }

    if (!date) {
      return setValidationError(translate("Date is required.", "التاريخ مطلوب."));
    }

    if (Number.isNaN(new Date(date).getTime())) {
      return setValidationError(translate("Date must be valid.", "يجب أن يكون التاريخ صالحاً."));
    }

    if (!creatorId) {
      return setValidationError(translate("Please select a creator.", "يرجى اختيار المنشئ."));
    }

    if (!workOrderNumberType) {
      return setValidationError(translate("Please select a work order type.", "يرجى اختيار نوع أمر العمل."));
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);

      if (!row.materialCode) {
        return setValidationError(translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`));
      }

      if (!row.unitOfMeasurementSelected) {
        return setValidationError(translate(`${rowLabel}: please select a unit.`, `${rowLabel}: يرجى اختيار وحدة قياس.`));
      }

      if (row.quantity === "") {
        return setValidationError(translate(`${rowLabel}: quantity is required.`, `${rowLabel}: الكمية مطلوبة.`));
      }

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
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
        backLink: getLocalizedHref("/warehouse/legacy-transactions"),
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
          <TextInput
            value={issueOrderNumber}
            onChange={(e) => setIssueOrderNumber(e.target.value)}
            label={translate("Issue Order Number", "رقم أمر الصرف")}
            placeholder={translate("Enter issue order number", "أدخل رقم أمر الصرف")}
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
            placeholder={translate("Search users...", "ابحث عن مستخدم...")}
            required
            radius="md"
          />
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Sub-Department", "القسم الفرعي للإنتاج")}
            placeholder={translate("Select department...", "اختر القسم...")}
            clearable
            radius="md"
          />
          <SelectLegacyWorkOrderType
            value={workOrderNumberType}
            setValue={setWorkOrderNumberType}
            label={translate("Work Order Type", "نوع أمر العمل")}
            placeholder={translate("Select type...", "اختر النوع...")}
            required
            radius="md"
          />
          <TextInput
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            label={translate("Contract Number", "رقم العقد")}
            placeholder={translate("Optional", "اختياري")}
            radius="md"
          />
          <TextInput
            value={workOrderNumber}
            onChange={(e) => setWorkOrderNumber(e.target.value)}
            label={translate("Work Order Number", "رقم أمر العمل")}
            placeholder={translate("Optional", "اختياري")}
            radius="md"
          />
          <div className="md:col-span-2">
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
            label={translate("Cancelled", "ملغي")}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

          <div className="overflow-x-auto rounded-xl">
            <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50">
                <Table.Tr className="h-9">
                  <Table.Th className="w-[38%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="w-[14%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className="w-[16%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className="w-[26%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Notes", "الملاحظات")}
                  </Table.Th>
                  <Table.Th className="w-[6%]" />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.key}>
                    <Table.Td className="transition-colors focus-within:bg-teal-50/60">
                      <SelectMaterial
                        value={row.materialCode}
                        setValue={(next) => {
                          const resolved = typeof next === "function" ? next(row.materialCode) : next;
                          if (!resolved) handleMaterialSelect(row.key, null);
                          else updateRow(row.key, { materialCode: resolved });
                        }}
                        onMaterialSelect={(material) => handleMaterialSelect(row.key, material)}
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
                        onChange={(value) => updateRow(row.key, { quantity: value === "" ? "" : Number(value) })}
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
                            updateRow(row.key, {
                              unitOfMeasurementSelected:
                                (resolved as MaterialUnit | null) ?? row.unitOfMeasurement,
                            });
                          }}
                          data={getRowUnitOptions(row, locale)}
                          variant="unstyled"
                          radius={0}
                          searchable
                          styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {row.unitOfMeasurementSelected
                            ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale)
                            : ""}
                        </span>
                      )}
                    </Table.Td>
                    <Table.Td className="transition-colors focus-within:bg-teal-50/60">
                      <TextInput
                        value={row.notes}
                        onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                        placeholder={translate("Optional", "اختياري")}
                        variant="unstyled"
                        radius={0}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        type="button"
                        variant="subtle"
                        color="gray"
                        size="xs"
                        radius="md"
                        p={6}
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(row.key)}
                        title={translate("Remove row", "حذف الصف")}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot className="bg-gray-50">
                <Table.Tr className="h-9">
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
          </div>
        </section>

        {error && <ErrorAlert error={error} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {translate(
              "Enter the legacy issue header and line items. These records are used for seeding only.",
              "أدخل رأس إذن الصرف القديم وبنوده. تُستخدم هذه السجلات لأغراض التهيئة فقط.",
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="light"
              color="dark"
              radius="md"
              onClick={() => router.push(getLocalizedHref("/warehouse/legacy-transactions"))}
            >
              {translation.cancel}
            </Button>
            <Button type="submit" loading={mutation.isPending} radius="md" color="teal">
              {translate("Create", "إنشاء")}
            </Button>
          </div>
        </div>
      </form>
    </LayoutBox>
  );
}
