"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, NumberInput, SegmentedControl, Table, Textarea, TextInput } from "@mantine/core";
import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, FilePenLine, NotebookPen, Plus, Printer, Trash2, Truck } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import PrintDocument from "@/components/ui/print-document";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import SupplierQuotationRequestPrintDocument from "@/components/documents/supplier-quotation-request-print-document";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import useUser from "@/contexts/user/hook";
import materialsApi from "@/lib/api/materials";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";

const PAGE_TITLE = { en: "Quotation Request", ar: "طلب عرض سعر" };

type SupplierMode = "existing" | "custom";

type ItemDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | "";
  specifications: string;
};

function createRowKey() {
  return `rfq-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
    specifications: "",
  };
}

function showUnitSelect(row: ItemDraftRow) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function isEmptyRow(row: ItemDraftRow) {
  return row.materialCode === null && row.quantity === "" && row.specifications.trim() === "";
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
}

function Section({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-200/25 bg-stone-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 ring-1 ring-stone-200">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-900">{title}</h2>
            {description ? <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ItemRow({
  row,
  index,
  locale,
  usedMaterialCodes,
  canRemove,
  onMaterialSelect,
  onUpdate,
  onRemove,
}: {
  row: ItemDraftRow;
  index: number;
  locale: Locale;
  usedMaterialCodes: string[];
  canRemove: boolean;
  onMaterialSelect: (key: string, material: MaterialWithUnitConversionsSelection | null) => void;
  onUpdate: (key: string, patch: Partial<ItemDraftRow>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate } = useI18n();

  return (
    <Table.Tr>
      <Table.Td className="w-8 min-w-8 text-center text-xs font-medium text-gray-500">{index + 1}</Table.Td>
      <Table.Td className="min-w-56 transition-colors focus-within:bg-teal-50/60">
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
      <Table.Td className="min-w-52 transition-colors focus-within:bg-teal-50/60">
        <TextInput
          value={row.specifications}
          onChange={(e) => onUpdate(row.key, { specifications: e.target.value })}
          placeholder={translate("Optional specifications", "مواصفات اختيارية")}
          variant="unstyled"
          radius={0}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
        />
      </Table.Td>
      <Table.Td className="min-w-20 transition-colors focus-within:bg-teal-50/60">
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
      <Table.Td className="min-w-20 transition-colors focus-within:bg-teal-50/60">
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
      <Table.Td className="w-12 min-w-12">
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
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const { user } = useUser();

  const [supplierMode, setSupplierMode] = useState<SupplierMode>("existing");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [customSupplierName, setCustomSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
  );

  const filledItemCount = useMemo(() => rows.filter((row) => !isEmptyRow(row)).length, [rows]);

  const supplierDisplayName = supplierMode === "existing" ? supplierName.trim() : customSupplierName.trim();

  const isDirty = useMemo(
    () =>
      supplierId !== null ||
      customSupplierName.trim() !== "" ||
      notes.trim() !== "" ||
      rows.length > 1 ||
      rows.some((row) => !isEmptyRow(row)),
    [supplierId, customSupplierName, notes, rows],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty);

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

  function validateForm(): string | null {
    if (!supplierDisplayName) {
      return translate("Please select or enter a supplier name.", "يرجى اختيار أو إدخال اسم المورد.");
    }

    const filledRows = rows.filter((row) => !isEmptyRow(row));
    if (filledRows.length === 0) {
      return translate("Please add at least one item.", "يرجى إضافة بند واحد على الأقل.");
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (isEmptyRow(row)) continue;

      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
      const materialName = row.materialTitle || row.materialCode;

      if (!row.materialCode) {
        return translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`);
      }

      if (!row.unitOfMeasurementSelected) {
        return translate(
          `${rowLabel}: please select the unit for material ${materialName}.`,
          `${rowLabel}: يرجى اختيار الوحدة للمادة ${materialName}.`,
        );
      }

      if (row.quantity === "") {
        return translate(
          `${rowLabel}: please enter the quantity for material ${materialName}.`,
          `${rowLabel}: يرجى إدخال الكمية للمادة ${materialName}.`,
        );
      }

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        return translate(
          `${rowLabel}: quantity for material ${materialName} must be greater than zero.`,
          `${rowLabel}: يجب أن تكون كمية المادة ${materialName} أكبر من صفر.`,
        );
      }
    }

    return null;
  }

  const printItems = useMemo(() => {
    return rows
      .filter((row) => !isEmptyRow(row) && row.materialCode && row.unitOfMeasurementSelected && row.quantity !== "")
      .map((row) => ({
        materialTitle: row.materialTitle || row.materialCode!,
        materialCode: row.materialCode!,
        unitLabel: getMaterialUnitLabel(row.unitOfMeasurementSelected!, locale),
        quantity: Number(row.quantity),
        specifications: row.specifications.trim() || null,
      }));
  }, [rows, locale]);

  const printTitle = translate(
    `Request for Quotation - ${supplierDisplayName || "Supplier"}`,
    `طلب عرض سعر - ${supplierDisplayName || "مورد"}`,
  );

  const preparedBy = {
    name: user?.name ?? "",
    email: user?.email ?? null,
    phone: user?.phone ?? null,
  };

  function handlePrintClick(onClick: () => void) {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError("");
    onClick();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/procurement"),
        confirmNavigate: confirmNavigation,
      }}
    >
      <div className="flex flex-col gap-5">
        <Section
          icon={Truck}
          title={translate("Supplier", "المورد")}
          description={translate(
            "Choose a registered supplier, or type an alternative company name to appear on the letter.",
            "اختر مورداً مسجلاً، أو اكتب اسماً بديلاً للشركة ليظهر في الخطاب.",
          )}
        >
          <div className="flex flex-col gap-4">
            <SegmentedControl
              value={supplierMode}
              onChange={(value) => {
                setSupplierMode(value as SupplierMode);
                setValidationError("");
              }}
              data={[
                {
                  value: "existing",
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={14} />
                      {translate("Existing Supplier", "مورد مسجل")}
                    </span>
                  ),
                },
                {
                  value: "custom",
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <FilePenLine size={14} />
                      {translate("Custom Name", "اسم مخصص")}
                    </span>
                  ),
                },
              ]}
              radius="md"
              className="w-full max-w-lg"
            />

            {supplierMode === "existing" ? (
              <div className="max-w-xl">
                <SelectSupplier
                  value={supplierId}
                  setValue={setSupplierId}
                  onSupplierSelect={(supplier) => {
                    setSupplierName(supplier?.name ?? "");
                    setValidationError("");
                  }}
                  label={translate("Supplier", "المورد")}
                  placeholder={translate("Search or select a supplier...", "ابحث أو اختر مورداً...")}
                  searchable
                  clearable
                  required
                  radius="md"
                />
                {supplierDisplayName ? (
                  <p className="mt-2 text-xs text-stone-500">
                    {translate("Name on letter", "الاسم في الخطاب")}:{" "}
                    <span className="font-medium text-stone-700">{supplierDisplayName}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="max-w-xl">
                <TextInput
                  value={customSupplierName}
                  onChange={(e) => {
                    setCustomSupplierName(e.currentTarget.value);
                    setValidationError("");
                  }}
                  label={translate("Supplier / Company Name", "اسم المورد / الشركة")}
                  description={translate(
                    "Printed exactly as entered in the letter header.",
                    "يُطبع كما هو في ترويسة الخطاب.",
                  )}
                  placeholder={translate("Enter the name as it should appear...", "أدخل الاسم كما سيظهر...")}
                  required
                  radius="md"
                />
              </div>
            )}
          </div>
        </Section>

        <Section
          icon={ClipboardList}
          title={translate("Items", "البنود")}
          description={translate(
            "Add the materials to request prices for. You can include specifications, quantity, and unit per row.",
            "أضف المواد المطلوب تسعيرها. يمكنك إضافة المواصفات والكمية والوحدة لكل صف.",
          )}
          action={
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                {translate(`${filledItemCount} item(s)`, `${filledItemCount} بند`)}
              </span>
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
            </div>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <Table withColumnBorders className="w-full min-w-160" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-stone-50">
                <Table.Tr className="h-9">
                  <Table.Th className="w-8 min-w-8 text-center! text-gray-500">#</Table.Th>
                  <Table.Th className="min-w-56 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="min-w-52 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Specifications", "المواصفات")}
                  </Table.Th>
                  <Table.Th className="min-w-20 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className="min-w-20 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className="w-12 min-w-12" />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, index) => (
                  <ItemRow
                    key={row.key}
                    row={row}
                    index={index}
                    locale={locale}
                    usedMaterialCodes={usedMaterialCodes}
                    canRemove={rows.length > 1}
                    onMaterialSelect={handleMaterialSelect}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Section>

        <Section
          icon={NotebookPen}
          title={translate("Additional Notes", "ملاحظات إضافية")}
          description={translate(
            "Optional notes that will appear in the printed letter after the items table.",
            "ملاحظات اختيارية تظهر في الخطاب المطبوع بعد جدول الأصناف.",
          )}
        >
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={translate(
              "e.g. Please quote CIF prices and include validity period...",
              "مثال: يُرجى ذكر الأسعار شاملاً التسليم ومدة صلاحية العرض...",
            )}
            radius="md"
            autosize
            minRows={3}
            classNames={{ input: "bg-white" }}
          />
        </Section>

        {validationError ? <ErrorAlert error={validationError} /> : null}

        <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-500">
            {supplierDisplayName
              ? translate(
                  `Letter for ${supplierDisplayName} · ${filledItemCount} item(s)`,
                  `خطاب إلى ${supplierDisplayName} · ${filledItemCount} بند`,
                )
              : translate(
                  "Select a supplier and add items, then print the letter.",
                  "اختر مورداً وأضف البنود، ثم اطبع الخطاب.",
                )}
          </p>
          <PrintDocument
            buttonType="button"
            buttonLabel={translate("Print", "طباعة")}
            title={printTitle}
            paperWidth={210}
            paperHeight={297}
            icon={<Printer size={15} />}
            renderTrigger={({ onClick, loading, disabled, label, icon }) => (
              <Button
                onClick={() => handlePrintClick(onClick)}
                loading={loading}
                disabled={disabled}
                leftSection={icon}
                radius="md"
                className="bg-teal-700! text-white! hover:bg-teal-800! disabled:bg-teal-700/60!"
              >
                {label}
              </Button>
            )}
          >
            {supplierDisplayName && printItems.length > 0 && preparedBy.name ? (
              <SupplierQuotationRequestPrintDocument
                supplierDisplayName={supplierDisplayName}
                notes={notes.trim() || null}
                items={printItems}
                preparedBy={preparedBy}
              />
            ) : null}
          </PrintDocument>
        </div>
      </div>
    </LayoutBox>
  );
}
