"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversions } from "@/types/material";
import { Button, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";

const PAGE_TITLE = { en: "Create Material Purchase Requisition", ar: "إنشاء طلب شراء خامات" };

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
  return `mpq-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function isEmptyRow(row: ItemDraftRow) {
  return row.materialCode === null && row.quantity === "" && row.notes.trim() === "";
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  if (!row.unitOfMeasurement) return [];
  const altUnits = row.unitConversions.map((conversion) => conversion.unit);
  const allUnits = [row.unitOfMeasurement, ...altUnits.filter((unit) => unit !== row.unitOfMeasurement)];
  return allUnits.map((value) => ({ value, label: getMaterialUnitLabel(value, locale) }));
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
  onMaterialSelect: (key: string, material: MaterialWithUnitConversions | null) => void;
  onUpdate: (key: string, patch: Partial<ItemDraftRow>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate } = useI18n();

  return (
    <Table.Tr>
      <Table.Td className="w-[2.5%] text-center text-xs font-medium text-gray-500">{index + 1}</Table.Td>
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

  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Requisitions", "طلبات شراء الخامات")}`,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const items = rows
        .filter((row) => !isEmptyRow(row))
        .map((row) => ({
          materialCode: row.materialCode!,
          unitOfMeasurementSelected: row.unitOfMeasurementSelected!,
          quantityRequested: Number(row.quantity),
          notes: row.notes.trim() || null,
        }));

      return await materialPurchaseRequisitionsApi.create({
        privateRequest,
        dto: {
          productionSubDepartment: productionSubDepartment as ProductionSubDepartment,
          notes: notes.trim() || null,
          items,
        },
      });
    },
    onSuccess: async (created) => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all });
      router.push(getLocalizedHref(`/procurement/material-requisitions/${created.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  const isDirty = useMemo(
    () => productionSubDepartment !== null || notes.trim() !== "" || rows.length > 1 || rows.some((row) => !isEmptyRow(row)),
    [productionSubDepartment, notes, rows],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

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

    if (!productionSubDepartment) {
      return setValidationError(
        translate("Please select a production department.", "يرجى اختيار قسم الانتاج."),
      );
    }

    const filledRows = rows.filter((row) => !isEmptyRow(row));
    if (filledRows.length === 0) {
      return setValidationError(
        translate("Please add at least one item.", "يرجى إضافة بند واحد على الأقل."),
      );
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (isEmptyRow(row)) continue;

      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
      const materialName = row.materialTitle || row.materialCode;

      if (!row.materialCode) {
        return setValidationError(
          translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`),
        );
      }

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

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        return setValidationError(
          translate(
            `${rowLabel}: quantity for material ${materialName} must be greater than zero.`,
            `${rowLabel}: يجب أن تكون كمية المادة ${materialName} أكبر من صفر.`,
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
        backLink: getLocalizedHref("/procurement/material-requisitions"),
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Department", "قسم الانتاج")}
            placeholder={translate("Select department...", "اختر القسم...")}
            required
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
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

          <div className="overflow-x-auto rounded-xl">
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
              if (confirmNavigation()) router.push(getLocalizedHref("/procurement/material-requisitions"));
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
