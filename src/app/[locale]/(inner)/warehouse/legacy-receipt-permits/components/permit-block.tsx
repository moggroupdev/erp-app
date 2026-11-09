"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, NumberInput, Table, TextInput } from "@mantine/core";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { supportsUnitConversions, type MaterialType } from "@/lib/constants/enums/material-types";
import {
  getMaterialUnitLabel,
  getMaterialUnitSelectOptions,
  type MaterialUnit,
} from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";
import { formatMoney } from "@/lib/helpers/format-money";
import DatePickerInput from "@/components/ui/date-picker-input";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

export type PermitItemDraft = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | "";
  unitPrice: number | "";
};

export type PermitDraft = {
  key: string;
  legacyNumber: string;
  receivedAt: string | null;
  items: PermitItemDraft[];
};

type PermitBlockProps = {
  permit: PermitDraft;
  locale: Locale;
  index: number;
  canRemove: boolean;
  onUpdate: (key: string, patch: Partial<Omit<PermitDraft, "key" | "items">>) => void;
  onRemove: (key: string) => void;
  onAddItem: (permitKey: string) => void;
  onUpdateItem: (permitKey: string, itemKey: string, patch: Partial<PermitItemDraft>) => void;
  onRemoveItem: (permitKey: string, itemKey: string) => void;
  onMaterialSelect: (permitKey: string, itemKey: string, material: MaterialWithUnitConversionsSelection | null) => void;
};

const PERMIT_COLUMN_MIN_WIDTH = {
  material: 320,
  unit: 110,
  quantity: 120,
  unitPrice: 140,
  lineTotal: 140,
  remove: 42,
} as const;

type PermitColumnKey = keyof typeof PERMIT_COLUMN_MIN_WIDTH;

function createItemKey() {
  return `legacy-receipt-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyItem(): PermitItemDraft {
  return {
    key: createItemKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unitOfMeasurementSelected: null,
    quantity: "",
    unitPrice: "",
  };
}

export function createEmptyPermit(): PermitDraft {
  return {
    key: `legacy-receipt-permit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    legacyNumber: "",
    receivedAt: null,
    items: [createEmptyItem()],
  };
}

function showUnitSelect(item: PermitItemDraft) {
  return !!item.materialType && supportsUnitConversions(item.materialType) && item.unitConversions.length > 0;
}

function getItemUnitOptions(item: PermitItemDraft, locale: Locale) {
  return getMaterialUnitSelectOptions(item.unitOfMeasurement, item.unitConversions, locale);
}

export default function PermitBlock({
  permit,
  locale,
  index,
  canRemove,
  onUpdate,
  onRemove,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMaterialSelect,
}: PermitBlockProps) {
  const { translate, translation } = useI18n();
  const tableRef = useRef<HTMLDivElement>(null);
  const [pendingFocus, setPendingFocus] = useState<{ itemKey: string; field: "material" | "qty" } | null>(null);

  const usedMaterialCodes = permit.items
    .map((item) => item.materialCode)
    .filter((code): code is string => !!code);

  const itemsTotal = permit.items.reduce((sum, item) => {
    const qty = typeof item.quantity === "number" ? item.quantity : 0;
    const price = typeof item.unitPrice === "number" ? item.unitPrice : 0;
    return sum + qty * price;
  }, 0);

  const draftColumns: { key: PermitColumnKey; label: string; align?: "center" }[] = [
    { key: "material", label: translate("Material", "المادة") },
    { key: "unit", label: translate("Unit", "الوحدة") },
    { key: "quantity", label: translate("Quantity", "الكمية") },
    { key: "unitPrice", label: `${translate("Unit Price", "سعر الوحدة")} (${translation.currency})` },
    { key: "lineTotal", label: `${translate("Line Total", "إجمالي البند")} (${translation.currency})` },
    { key: "remove", label: "", align: "center" },
  ];
  const draftTableMinWidth = draftColumns.reduce((sum, column) => sum + PERMIT_COLUMN_MIN_WIDTH[column.key], 0);

  useEffect(() => {
    if (!pendingFocus) return;

    const selector =
      pendingFocus.field === "material"
        ? `[data-permit-row-key="${pendingFocus.itemKey}"] input`
        : `[data-permit-qty-key="${pendingFocus.itemKey}"] input`;

    const input = tableRef.current?.querySelector<HTMLInputElement>(selector);
    input?.focus();
    input?.select?.();
    setPendingFocus(null);
  }, [pendingFocus, permit.items]);

  function handleAddItem() {
    onAddItem(permit.key);
    setTimeout(() => {
      const rows = tableRef.current?.querySelectorAll<HTMLElement>("[data-permit-row-key]");
      const last = rows?.[rows.length - 1];
      const input = last?.querySelector<HTMLInputElement>("input");
      input?.focus();
    }, 0);
  }

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
    handleAddItem();
  }

  function handleMaterialSelectLocal(itemKey: string, material: MaterialWithUnitConversionsSelection | null) {
    onMaterialSelect(permit.key, itemKey, material);
    if (material) setPendingFocus({ itemKey, field: "qty" });
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-haze-600 text-white">
            <PackagePlus size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold text-gray-950">
              {translate(`Addition permit ${index + 1}`, `إذن إضافة ${index + 1}`)}
            </h4>
            <p className="text-sm text-gray-500">
              {translate(
                "Permit number, date, and material lines received.",
                "رقم الإذن وتاريخه وبنود المواد المستلمة.",
              )}
            </p>
          </div>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="light"
            color="clay"
            radius="md"
            leftSection={<Trash2 size={14} />}
            onClick={() => onRemove(permit.key)}
          >
            {translate("Remove permit", "حذف الإذن")}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label={translate("Permit number", "رقم إذن الإضافة")}
            value={permit.legacyNumber}
            onChange={(e) => onUpdate(permit.key, { legacyNumber: e.currentTarget.value })}
            placeholder={translate("Enter permit number...", "أدخل رقم إذن الإضافة...")}
            radius="md"
            required
          />
          <DatePickerInput
            label={translate("Permit date", "تاريخ الإضافة")}
            value={permit.receivedAt}
            onChange={(value) => onUpdate(permit.key, { receivedAt: value })}
            placeholder={translate("Select permit date", "اختر تاريخ الإضافة")}
            required
          />
        </div>

        <div
          ref={tableRef}
          className="w-full max-w-full overflow-x-auto rounded-xl"
          onKeyDownCapture={handleTableKeyDown}
        >
          <Table
            withColumnBorders
            className="table-fixed"
            style={{ width: "100%", minWidth: draftTableMinWidth }}
            horizontalSpacing="xs"
            verticalSpacing="xs"
          >
            <colgroup>
              {draftColumns.map((column) => (
                <col key={column.key} style={{ width: PERMIT_COLUMN_MIN_WIDTH[column.key] }} />
              ))}
            </colgroup>
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="min-h-9">
                {draftColumns.map((column) => (
                  <Table.Th
                    key={column.key}
                    style={{ minWidth: PERMIT_COLUMN_MIN_WIDTH[column.key], whiteSpace: "nowrap" }}
                    className={`text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase ${
                      column.align === "center" ? "text-center" : ""
                    }`}
                  >
                    {column.label}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {permit.items.map((item) => {
                const qty = typeof item.quantity === "number" ? item.quantity : null;
                const price = typeof item.unitPrice === "number" ? item.unitPrice : null;
                const lineTotal = qty !== null && price !== null ? qty * price : null;
                const excludeCodes = usedMaterialCodes.filter((code) => code !== item.materialCode);

                return (
                  <Table.Tr key={item.key}>
                    <Table.Td data-permit-row-key={item.key} className="transition-colors focus-within:bg-haze-50/60">
                      <SelectMaterial
                        value={item.materialCode}
                        setValue={(next) => {
                          const resolved = typeof next === "function" ? next(item.materialCode) : next;
                          if (!resolved) handleMaterialSelectLocal(item.key, null);
                          else onUpdateItem(permit.key, item.key, { materialCode: resolved });
                        }}
                        onMaterialSelect={(material) => handleMaterialSelectLocal(item.key, material)}
                        excludeCodes={excludeCodes}
                        placeholder={translate("Enter material...", "أدخل المادة...")}
                        variant="unstyled"
                        radius={0}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                        withBrowseModal
                      />
                    </Table.Td>
                    <Table.Td className="transition-colors focus-within:bg-haze-50/60">
                      {showUnitSelect(item) ? (
                        <DataSelect
                          data={getItemUnitOptions(item, locale)}
                          value={item.unitOfMeasurementSelected}
                          setValue={(next) => {
                            const resolved =
                              typeof next === "function" ? next(item.unitOfMeasurementSelected) : next;
                            onUpdateItem(permit.key, item.key, {
                              unitOfMeasurementSelected:
                                (resolved as MaterialUnit | null) ?? item.unitOfMeasurement,
                            });
                          }}
                          placeholder={translate("Select unit", "اختر الوحدة")}
                          variant="unstyled"
                          radius={0}
                          searchable
                          styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
                        />
                      ) : item.unitOfMeasurementSelected ? (
                        <span className="text-sm text-gray-600">
                          {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Td>
                    <Table.Td
                      data-permit-qty-key={item.key}
                      className="transition-colors focus-within:bg-haze-50/60"
                    >
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) =>
                          onUpdateItem(permit.key, item.key, { quantity: typeof value === "number" ? value : "" })
                        }
                        min={0}
                        allowNegative={false}
                        decimalScale={5}
                        hideControls
                        variant="unstyled"
                        radius={0}
                        placeholder={translate("Enter quantity", "أدخل الكمية")}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                      />
                    </Table.Td>
                    <Table.Td className="transition-colors focus-within:bg-haze-50/60">
                      <NumberInput
                        value={item.unitPrice}
                        onChange={(value) =>
                          onUpdateItem(permit.key, item.key, { unitPrice: typeof value === "number" ? value : "" })
                        }
                        min={0}
                        allowNegative={false}
                        decimalScale={5}
                        hideControls
                        variant="unstyled"
                        radius={0}
                        placeholder={translate("Enter unit price", "أدخل سعر الوحدة")}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm font-medium text-gray-600">
                        {lineTotal !== null && lineTotal > 0 ? formatMoney(lineTotal) : ""}
                      </span>
                    </Table.Td>
                    <Table.Td className="px-0">
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="subtle"
                          color="gray"
                          size="xs"
                          radius="md"
                          p={4}
                          disabled={permit.items.length <= 1}
                          onClick={() => onRemoveItem(permit.key, item.key)}
                          title={translate("Remove row", "حذف الصف")}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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
                    color="haze"
                    radius="md"
                    size="xs"
                    leftSection={<Plus size={14} />}
                    onClick={handleAddItem}
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
                  <span className="text-sm font-semibold text-gray-800">{formatMoney(itemsTotal)}</span>
                </Table.Td>
                <Table.Td />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      </div>
    </section>
  );
}
