"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatMoney } from "@/lib/helpers/format-money";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { isManufacturedMaterial, isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { BomItemWithMaterial } from "@/types/bom";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, Table, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import MmComponentsSection from "./mm-components-section";

export type BomDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unit: MaterialUnit | null;
  unitPrice: number;
  quantityRequired: number | "";
  notes: string;
};

export type BomDraftSubmitItem = {
  materialCode: string;
  quantityRequired: number;
  unitOfMeasurementSelected: MaterialUnit;
  notes: string | null;
};

export function createRowKey() {
  return `bom-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyRow(): BomDraftRow {
  return {
    key: createRowKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unit: null,
    unitPrice: 0,
    quantityRequired: "",
    notes: "",
  };
}

export function mapBomItemToDraftRow(item: BomItemWithMaterial): BomDraftRow {
  return {
    key: item.id,
    materialCode: item.materialCode,
    materialTitle: item.material.title,
    materialType: item.material.materialType,
    unitOfMeasurement: item.material.unitOfMeasurement,
    unitConversions: item.material.unitConversions ?? [],
    unit: item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement,
    unitPrice: item.material.unitPrice,
    quantityRequired: item.quantityRequired,
    notes: item.notes || "",
  };
}

function showUnitSelect(row: BomDraftRow) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function getRowUnitOptions(row: BomDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
}

function getRowFactor(row: BomDraftRow) {
  if (!row.unit || !row.unitOfMeasurement) return 1;
  return resolveDisplayUnit(row.unit, row.unitOfMeasurement, row.unitConversions).factor;
}

function serializeRowsSnapshot(rows: BomDraftRow[]) {
  return JSON.stringify(
    rows.map((row) => ({
      materialCode: row.materialCode,
      unit: row.unit,
      quantityRequired: row.quantityRequired === "" ? "" : Number(row.quantityRequired),
      notes: row.notes.trim(),
    })),
  );
}

export default function BomDraftForm({
  mode,
  title,
  subTitle,
  cancelHref,
  initialDepartment,
  initialRows,
  lockDepartment = false,
  excludeDepartments = [],
  departmentsWithBom = [],
  isSubmitting,
  submitError,
  onSubmit,
}: {
  mode: "create" | "edit";
  title: string;
  subTitle?: string;
  cancelHref: string;
  initialDepartment: string | null;
  initialRows: BomDraftRow[];
  lockDepartment?: boolean;
  excludeDepartments?: ProductionSubDepartment[];
  departmentsWithBom?: ProductionSubDepartment[];
  isSubmitting: boolean;
  submitError?: unknown;
  onSubmit: (payload: {
    productionSubDepartment: ProductionSubDepartment;
    items: BomDraftSubmitItem[];
  }) => Promise<void>;
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();

  const [rows, setRows] = useState<BomDraftRow[]>(initialRows);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(initialDepartment);
  const [validationError, setValidationError] = useState("");
  const [duplicateCodes, setDuplicateCodes] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<{ rowKey: string; field: "material" | "qty" } | null>(null);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const initialRowsSnapshot = useMemo(() => serializeRowsSnapshot(initialRows), [initialRows]);
  const departmentsWithBomSet = useMemo(() => new Set(departmentsWithBom), [departmentsWithBom]);
  const selectedDepartmentHasBom =
    mode === "create" &&
    !!productionSubDepartment &&
    departmentsWithBomSet.has(productionSubDepartment as ProductionSubDepartment);

  const error = validationError || (submitError ? getErrorMessage(locale, submitError) : "");
  const currency = translation.currency;

  const isDirty = useMemo(() => {
    if (mode === "edit") {
      return (
        productionSubDepartment !== initialDepartment || serializeRowsSnapshot(rows) !== initialRowsSnapshot
      );
    }

    return (
      productionSubDepartment !== null ||
      rows.length > 1 ||
      rows.some((row) => !!row.materialCode || row.quantityRequired !== "" || row.notes.trim() !== "")
    );
  }, [mode, productionSubDepartment, initialDepartment, rows, initialRowsSnapshot]);

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
  );

  const mmRows = useMemo(
    () =>
      rows.filter(
        (row): row is BomDraftRow & { materialCode: string; materialType: MaterialType } =>
          !!row.materialCode && row.materialType !== null && isManufacturedMaterial(row.materialType),
      ),
    [rows],
  );

  const grandTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = typeof row.quantityRequired === "number" ? row.quantityRequired : 0;
        return sum + qty * toDisplayUnitPrice(row.unitPrice, getRowFactor(row));
      }, 0),
    [rows],
  );

  function updateRow(key: string, patch: Partial<BomDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversionsSelection | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      materialTitle: material?.title ?? "",
      materialType: material?.materialType ?? null,
      unitOfMeasurement: material?.unitOfMeasurement ?? null,
      unitConversions: material?.unitConversions ?? [],
      unit: material?.unitOfMeasurement ?? null,
      unitPrice: material?.unitPrice ?? 0,
    });
    setDuplicateCodes(new Set());
    setValidationError("");
    if (material) setPendingFocus({ rowKey: key, field: "qty" });
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
    const newRow = createEmptyRow();
    setRows((prev) => [...prev, newRow]);
    setPendingFocus({ rowKey: newRow.key, field: "material" });
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
    setDuplicateCodes(new Set());
  }

  useEffect(() => {
    if (!pendingFocus) return;

    const selector =
      pendingFocus.field === "material"
        ? `[data-bom-row-key="${pendingFocus.rowKey}"] input`
        : `[data-bom-qty-key="${pendingFocus.rowKey}"] input`;

    const input = tableRef.current?.querySelector<HTMLInputElement>(selector);
    input?.focus();
    input?.select?.();
    setPendingFocus(null);
  }, [pendingFocus, rows]);

  function isOpenListboxTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return target.closest('[aria-expanded="true"]') !== null;
  }

  function handleTableKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    if ((e.target as HTMLElement).closest("button")) return;
    if (isOpenListboxTarget(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    addRow();
  }

  function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    setValidationError("");
    setDuplicateCodes(new Set());

    if (!productionSubDepartment) {
      return setValidationError(
        translate("Please select a production department.", "يرجى اختيار قسم الانتاج."),
      );
    }

    if (selectedDepartmentHasBom) {
      return setValidationError(
        translate(
          "A BOM already exists for this production department.",
          "توجد بالفعل قائمة مواد لقسم الانتاج هذا.",
        ),
      );
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);

      if (!row.materialCode)
        return setValidationError(translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`));

      if (row.quantityRequired === "")
        return setValidationError(translate(`${rowLabel}: quantity is required.`, `${rowLabel}: الكمية مطلوبة.`));

      const qty = Number(row.quantityRequired);
      if (Number.isNaN(qty))
        return setValidationError(
          translate(`${rowLabel}: quantity must be a valid number.`, `${rowLabel}: يجب أن تكون الكمية رقماً صالحاً.`),
        );

      if (qty < 0)
        return setValidationError(
          translate(`${rowLabel}: quantity cannot be negative.`, `${rowLabel}: لا يمكن أن تكون الكمية سالبة.`),
        );

      if (qty === 0)
        return setValidationError(
          translate(`${rowLabel}: quantity must be greater than zero.`, `${rowLabel}: يجب أن تكون الكمية أكبر من صفر.`),
        );
    }

    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const row of rows) {
      const materialCode = row.materialCode!;
      if (seen.has(materialCode)) duplicates.add(materialCode);
      else seen.add(materialCode);
    }

    if (duplicates.size > 0) {
      setDuplicateCodes(duplicates);
      return setValidationError(
        translate("Duplicate materials are not allowed in the same BOM.", "لا يُسمح بتكرار المواد في نفس قائمة المواد."),
      );
    }

    openConfirm();
  }

  async function handleConfirmSubmit() {
    try {
      await onSubmit({
        productionSubDepartment: productionSubDepartment as ProductionSubDepartment,
        items: rows.map((row) => ({
          materialCode: row.materialCode!,
          quantityRequired: Number(row.quantityRequired),
          unitOfMeasurementSelected: row.unit as MaterialUnit,
          notes: row.notes.trim() || null,
        })),
      });
      setSubmitted(true);
    } catch {
      // Parent surfaces the error via submitError; keep the modal open.
    }
  }

  const submitLabel =
    mode === "edit"
      ? translate("Update BOM", "تحديث قائمة المواد")
      : translate("Create BOM", "إنشاء قائمة المواد");

  const confirmTitle =
    mode === "edit"
      ? translate("Confirm update BOM", "تأكيد تحديث قائمة المواد")
      : translate("Confirm create BOM", "تأكيد إنشاء قائمة المواد");

  const confirmMessage =
    mode === "edit"
      ? translate("Are you sure you want to update this BOM?", "هل أنت متأكد من تحديث قائمة المواد هذه؟")
      : translate("Are you sure you want to create this BOM?", "هل أنت متأكد من إنشاء قائمة المواد هذه؟");

  const confirmActionLabel =
    mode === "edit"
      ? translate("Confirm & Update", "تأكيد وتحديث")
      : translate("Confirm & Create", "تأكيد وإنشاء");

  return (
    <LayoutBox
      header={{
        title,
        subTitle,
        backLink: true,
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SelectProductionSubDepartment
          value={productionSubDepartment}
          setValue={setProductionSubDepartment}
          label={translate("Production Department", "قسم الانتاج")}
          placeholder={translate("Select department", "اختر القسم")}
          excludeValues={excludeDepartments}
          required
          disabled={lockDepartment}
        />

        <div ref={tableRef} className="overflow-x-auto rounded-xl" onKeyDownCapture={handleTableKeyDown}>
          <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="h-9">
                <Table.Th className="w-[34%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Material", "المادة")}
                </Table.Th>
                <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Quantity", "الكمية")}
                </Table.Th>
                <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit", "الوحدة")}
                </Table.Th>
                <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit Price", "سعر الوحدة")} ({currency})
                </Table.Th>
                <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Line Total", "إجمالي البند")} ({currency})
                </Table.Th>
                <Table.Th className="w-[20%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Notes", "الملاحظات")}
                </Table.Th>
                <Table.Th className="w-[6%]" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const quantity = typeof row.quantityRequired === "number" ? row.quantityRequired : null;
                const displayUnitPrice = toDisplayUnitPrice(row.unitPrice, getRowFactor(row));
                const lineTotal = quantity !== null ? quantity * displayUnitPrice : null;
                const isDuplicate = !!row.materialCode && duplicateCodes.has(row.materialCode);

                return (
                  <Table.Tr key={row.key} className={isDuplicate ? "bg-red-50/70" : undefined}>
                    <Table.Td data-bom-row-key={row.key} className="transition-colors focus-within:bg-teal-50/60">
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
                    <Table.Td data-bom-qty-key={row.key} className="transition-colors focus-within:bg-teal-50/60">
                      <NumberInput
                        value={row.quantityRequired}
                        onChange={(value) => updateRow(row.key, { quantityRequired: value === "" ? "" : Number(value) })}
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
                          value={row.unit}
                          setValue={(next) => {
                            const resolved = typeof next === "function" ? next(row.unit) : next;
                            updateRow(row.key, { unit: (resolved as MaterialUnit | null) ?? row.unitOfMeasurement });
                          }}
                          data={getRowUnitOptions(row, locale)}
                          variant="unstyled"
                          radius={0}
                          searchable
                          styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {row.unitOfMeasurement ? getMaterialUnitLabel(row.unitOfMeasurement, locale) : ""}
                        </span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm text-gray-600">
                        {row.materialCode ? formatMoney(displayUnitPrice) : ""}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm font-medium text-gray-600">
                        {lineTotal !== null ? formatMoney(lineTotal) : ""}
                      </span>
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
                );
              })}
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
                <Table.Td>
                  <Badge size="sm" variant="light" color="dark" radius="md">
                    {translate("Total", "الإجمالي")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm font-semibold text-gray-800">{formatMoney(grandTotal)}</span>
                </Table.Td>
                <Table.Td />
                <Table.Td />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>

        {error && !confirmOpened && <ErrorAlert error={error} />}

        <MmComponentsSection mmRows={mmRows} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {translate(
              "Add all materials required to manufacture one unit of this dimension.",
              "أضف كل المواد المطلوبة لتصنيع وحدة واحدة من هذا المقاس.",
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="light"
              color="dark"
              radius="md"
              onClick={() => {
                if (confirmNavigation()) router.push(getLocalizedHref(cancelHref));
              }}
            >
              {translation.cancel}
            </Button>
            <Button type="button" radius="md" color="teal" disabled={isSubmitting} onClick={handleSubmit}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        opened={confirmOpened}
        onClose={() => {
          if (!isSubmitting) closeConfirm();
        }}
        title={confirmTitle}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">{confirmMessage}</p>
          <div className="flex gap-2">
            <Button
              variant="light"
              color="dark"
              radius="md"
              onClick={closeConfirm}
              disabled={isSubmitting}
              fullWidth
            >
              {translation.cancel}
            </Button>
            <Button radius="md" color="teal" loading={isSubmitting} onClick={handleConfirmSubmit} fullWidth>
              {confirmActionLabel}
            </Button>
          </div>
          {error && <ErrorAlert error={error} />}
        </div>
      </Modal>
    </LayoutBox>
  );
}
