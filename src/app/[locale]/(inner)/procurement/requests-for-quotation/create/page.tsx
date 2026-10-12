"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button, NumberInput, Table, Textarea, TextInput } from "@mantine/core";
import { ArrowLeft, CalendarClock, ListPlus, Package, Plus, Trash2 } from "lucide-react";
import DateTimePickerInput from "@/components/ui/datetime-picker-input";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";
import { convertEnteredQuantityBetweenUnits } from "../../material-orders/helpers";
import AddQuotationItemsModal, { type QuotationItemLine } from "../../quotation-requests/components/add-items-modal";

const PAGE_TITLE = { en: "Create Request for Quotation", ar: "إنشاء طلب عرض سعر" };

const cellField = {
  variant: "unstyled" as const,
  radius: 0,
  styles: { input: { minHeight: 0, height: "auto", padding: 0, minWidth: 0 } },
};

type ItemDraft = {
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

function createKey() {
  return `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyRow(): ItemDraft {
  return {
    key: createKey(),
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

function showUnitSelect(row: ItemDraft) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function isEmptyRow(row: ItemDraft) {
  return row.materialCode === null && row.quantity === "" && row.notes.trim() === "";
}

function toIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const href = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [notes, setNotes] = useState("");
  const [responseDeadline, setResponseDeadline] = useState<string | null>(null);
  const [rows, setRows] = useState<ItemDraft[]>([emptyRow()]);
  const [error, setError] = useState("");
  const [addItemsOpened, { open: openAddItems, close: closeAddItems }] = useDisclosure(false);

  const isDirty =
    notes.trim() !== "" ||
    responseDeadline !== null ||
    rows.some((row) => row.materialCode || row.quantity !== "" || row.notes.trim() !== "");
  const confirmNavigation = useUnsavedChangesWarning(isDirty);

  const usedCodes = useMemo(() => rows.map((row) => row.materialCode).filter((code): code is string => !!code), [rows]);

  function updateRow(key: string, patch: Partial<ItemDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.key !== key)));
  }

  function addFromRequisitions(lines: QuotationItemLine[]) {
    setError("");
    setRows((current) => {
      const next = current.filter((row) => !isEmptyRow(row));

      for (const line of lines) {
        const existingIndex = next.findIndex((row) => row.materialCode === line.materialCode);
        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          const existingQty = typeof existing.quantity === "number" ? existing.quantity : 0;
          const addedQty =
            existing.unitOfMeasurementSelected && existing.unitOfMeasurement
              ? convertEnteredQuantityBetweenUnits(
                  line.quantity,
                  line.unitOfMeasurementSelected,
                  existing.unitOfMeasurementSelected,
                  existing.unitOfMeasurement,
                  existing.unitConversions,
                )
              : line.quantity;
          next[existingIndex] = {
            ...existing,
            quantity: Number((existingQty + addedQty).toFixed(6)),
          };
          continue;
        }

        next.push({
          key: createKey(),
          materialCode: line.materialCode,
          materialTitle: line.materialTitle,
          materialType: line.materialType,
          unitOfMeasurement: line.unitOfMeasurement,
          unitConversions: line.unitConversions,
          unitOfMeasurementSelected: line.unitOfMeasurementSelected,
          quantity: line.quantity,
          notes: "",
        });
      }

      return next.length > 0 ? next : [emptyRow()];
    });
  }

  function applyMaterial(key: string, material: MaterialWithUnitConversionsSelection | null) {
    if (!material) {
      updateRow(key, {
        materialCode: null,
        materialTitle: "",
        materialType: null,
        unitOfMeasurement: null,
        unitConversions: [],
        unitOfMeasurementSelected: null,
      });
      return;
    }
    updateRow(key, {
      materialCode: material.code,
      materialTitle: material.title,
      materialType: material.materialType,
      unitOfMeasurement: material.unitOfMeasurement,
      unitConversions: material.unitConversions ?? [],
      unitOfMeasurementSelected: material.unitOfMeasurement,
    });
  }

  const mutation = useMutation({
    mutationFn: () => {
      const items = rows.filter((row) => row.materialCode || row.quantity !== "" || row.notes.trim() !== "");
      if (items.length === 0) {
        throw new Error(translate("Add at least one material.", "أضف مادة واحدة على الأقل."));
      }
      for (const [index, row] of items.entries()) {
        const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
        if (!row.materialCode || !row.unitOfMeasurementSelected || row.quantity === "" || Number(row.quantity) <= 0) {
          throw new Error(
            translate(
              `${rowLabel}: choose a material, a unit, and a quantity greater than zero.`,
              `${rowLabel}: اختر مادة ووحدة وكمية أكبر من صفر.`,
            ),
          );
        }
      }
      return requestForQuotationsApi.create({
        privateRequest,
        dto: {
          notes: notes.trim() || null,
          responseDeadline: toIso(responseDeadline),
          items: items.map((row) => ({
            materialCode: row.materialCode!,
            unitOfMeasurementSelected: row.unitOfMeasurementSelected!,
            quantityRequested: Number(row.quantity),
            notes: row.notes.trim() || null,
          })),
        },
      });
    },
    onSuccess: (created) => {
      router.push(href(`/procurement/requests-for-quotation/${created.id}`));
    },
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  return (
    <div className="flex min-h-full flex-col gap-5">
      <header className="flex items-center gap-3">
        <Button
          type="button"
          variant="light"
          color="dark"
          radius={20}
          p={0}
          h={40}
          w={40}
          onClick={() => {
            if (confirmNavigation()) router.push(href("/procurement/requests-for-quotation"));
          }}
          aria-label={translation.back}
          title={translation.back}
        >
          <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0deg", "180deg")})` }} />
        </Button>
        <h1>{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
      </header>

      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="bg-haze-600 flex size-10 items-center justify-center rounded-2xl text-white">
              <CalendarClock size={18} />
            </span>
            <div>
              <h4 className="text-base font-semibold text-gray-950">{translate("Request details", "بيانات الطلب")}</h4>
              <p className="text-sm text-gray-500">
                {translate(
                  "When suppliers should reply, and any note that goes with the request.",
                  "موعد رد الموردين، وأي ملاحظة ترفق مع الطلب.",
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            <DateTimePickerInput
              label={translate("Response deadline", "آخر موعد للرد")}
              placeholder={translate("Select date and time", "اختر التاريخ والوقت")}
              value={responseDeadline}
              onChange={setResponseDeadline}
              clearable
            />
            <Textarea
              label={translate("Notes", "الملاحظات")}
              placeholder={translate("Optional note for this request", "ملاحظة اختيارية لهذا الطلب")}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              radius="md"
              autosize
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="bg-haze-600 flex size-10 items-center justify-center rounded-2xl text-white">
              <Package size={18} />
            </span>
            <div>
              <h4 className="text-base font-semibold text-gray-950">{translate("Materials", "المواد")}</h4>
              <p className="text-sm text-gray-500">
                {translate("Each row is a material you want suppliers to price.", "كل صف مادة تريد من الموردين تسعيرها.")}
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="overflow-x-auto rounded">
              <Table withColumnBorders className="w-full min-w-184" horizontalSpacing="xs" verticalSpacing="xs">
                <Table.Thead className="bg-gray-50 whitespace-nowrap">
                  <Table.Tr className="h-9">
                    <Table.Th className="w-12 text-center! text-gray-500">#</Table.Th>
                    <Table.Th className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Material", "المادة")}
                    </Table.Th>
                    <Table.Th className="w-36 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Quantity", "الكمية")}
                    </Table.Th>
                    <Table.Th className="w-40 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Unit", "الوحدة")}
                    </Table.Th>
                    <Table.Th className="w-60 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Notes", "الملاحظات")}
                    </Table.Th>
                    <Table.Th className="w-12" />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row, index) => (
                    <ItemRow
                      key={row.key}
                      row={row}
                      index={index}
                      locale={locale}
                      usedCodes={usedCodes}
                      canRemove={rows.length > 1}
                      onMaterialSelect={applyMaterial}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                    />
                  ))}
                </Table.Tbody>
                <Table.Tfoot className="bg-gray-50">
                  <Table.Tr>
                    <Table.Td />
                    <Table.Td colSpan={5}>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="light"
                          color="haze"
                          size="xs"
                          leftSection={<Plus size={14} />}
                          onClick={addRow}
                        >
                          {translate("Add material row", "إضافة صف مادة")}
                        </Button>
                        <Button type="button" color="haze" size="xs" leftSection={<ListPlus size={14} />} onClick={openAddItems}>
                          {translate("Add from requisitions", "إضافة من طلبات الشراء")}
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </div>
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
              if (confirmNavigation()) router.push(href("/procurement/requests-for-quotation"));
            }}
          >
            {translation.cancel}
          </Button>
          <Button type="submit" radius="md" color="haze" loading={mutation.isPending}>
            {translate("Save draft", "حفظ المسودة")}
          </Button>
        </div>
      </form>

      <AddQuotationItemsModal opened={addItemsOpened} onClose={closeAddItems} onAdd={addFromRequisitions} />
    </div>
  );
}

function ItemRow({
  row,
  index,
  locale,
  usedCodes,
  canRemove,
  onMaterialSelect,
  onUpdate,
  onRemove,
}: {
  row: ItemDraft;
  index: number;
  locale: Locale;
  usedCodes: string[];
  canRemove: boolean;
  onMaterialSelect: (key: string, material: MaterialWithUnitConversionsSelection | null) => void;
  onUpdate: (key: string, patch: Partial<ItemDraft>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate } = useI18n();

  return (
    <Table.Tr>
      <Table.Td className="pt-2 text-center align-top! text-xs font-medium text-gray-500">{index + 1}</Table.Td>
      <Table.Td className="focus-within:bg-haze-50/60 align-top! transition-colors">
        <SelectMaterial
          value={row.materialCode}
          setValue={(next) => {
            const resolved = typeof next === "function" ? next(row.materialCode) : next;
            if (!resolved) onMaterialSelect(row.key, null);
          }}
          onMaterialSelect={(material) => onMaterialSelect(row.key, material)}
          excludeCodes={usedCodes.filter((code) => code !== row.materialCode)}
          placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
          variant="unstyled"
          radius={0}
          styles={cellField.styles}
          withBrowseModal
        />
      </Table.Td>
      <Table.Td className="focus-within:bg-haze-50/60 align-top! transition-colors">
        <NumberInput
          value={row.quantity}
          onChange={(value) => onUpdate(row.key, { quantity: value === "" ? "" : Number(value) })}
          min={0}
          allowNegative={false}
          decimalScale={6}
          hideControls
          placeholder={translate("Enter quantity", "أدخل الكمية")}
          aria-label={translate("Quantity", "الكمية")}
          {...cellField}
        />
      </Table.Td>
      <Table.Td className="focus-within:bg-haze-50/60 align-top! transition-colors">
        {showUnitSelect(row) ? (
          <DataSelect
            value={row.unitOfMeasurementSelected}
            setValue={(next) => {
              const resolved = typeof next === "function" ? next(row.unitOfMeasurementSelected) : next;
              if (resolved) onUpdate(row.key, { unitOfMeasurementSelected: resolved as MaterialUnit });
            }}
            data={getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale)}
            searchable
            placeholder={translate("Select unit", "اختر الوحدة")}
            {...cellField}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0, minWidth: 0, cursor: "pointer" } }}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {row.unitOfMeasurementSelected
              ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale)
              : translate("Select a material first", "اختر المادة أولاً")}
          </span>
        )}
      </Table.Td>
      <Table.Td className="focus-within:bg-haze-50/60 align-top! transition-colors">
        <TextInput
          value={row.notes}
          onChange={(event) => onUpdate(row.key, { notes: event.currentTarget.value })}
          placeholder={translate("Optional note", "ملاحظة اختيارية")}
          aria-label={translate("Notes", "الملاحظات")}
          {...cellField}
        />
      </Table.Td>
      <Table.Td className="align-top!">
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
          aria-label={translate("Remove row", "حذف الصف")}
        >
          <Trash2 size={14} />
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}
