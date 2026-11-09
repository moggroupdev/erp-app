"use client";

import { Button, NumberInput, Table, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
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
  canRemove: boolean;
  onUpdate: (key: string, patch: Partial<Omit<PermitDraft, "key" | "items">>) => void;
  onRemove: (key: string) => void;
  onAddItem: (permitKey: string) => void;
  onUpdateItem: (permitKey: string, itemKey: string, patch: Partial<PermitItemDraft>) => void;
  onRemoveItem: (permitKey: string, itemKey: string) => void;
  onMaterialSelect: (permitKey: string, itemKey: string, material: MaterialWithUnitConversionsSelection | null) => void;
};

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
  canRemove,
  onUpdate,
  onRemove,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMaterialSelect,
}: PermitBlockProps) {
  const { translate, translation } = useI18n();
  const usedMaterialCodes = permit.items
    .map((item) => item.materialCode)
    .filter((code): code is string => !!code);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          {translate("Addition permit", "إذن إضافة")}
        </h3>
        {canRemove && (
          <Button
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextInput
          label={translate("Permit number", "رقم إذن الإضافة")}
          value={permit.legacyNumber}
          onChange={(e) => onUpdate(permit.key, { legacyNumber: e.currentTarget.value })}
          radius="md"
          required
        />
        <DatePickerInput
          label={translate("Permit date", "تاريخ الإضافة")}
          value={permit.receivedAt}
          onChange={(value) => onUpdate(permit.key, { receivedAt: value })}
          required
        />
      </div>

      <div className="overflow-x-auto">
        <Table className="text-nowrap" verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-10">#</Table.Th>
              <Table.Th>{translate("Material", "المادة")}</Table.Th>
              <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
              <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
              <Table.Th>
                {translate(`Unit price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
              </Table.Th>
              <Table.Th>
                {translate(`Line total (${translation.currency})`, `إجمالي البند (${translation.currency})`)}
              </Table.Th>
              <Table.Th className="w-12" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {permit.items.map((item, index) => {
              const qty = typeof item.quantity === "number" ? item.quantity : 0;
              const price = typeof item.unitPrice === "number" ? item.unitPrice : 0;
              const lineTotal = qty * price;
              const unitOptions = getItemUnitOptions(item, locale);
              const excludeCodes = usedMaterialCodes.filter((code) => code !== item.materialCode);

              return (
                <Table.Tr key={item.key} className="text-gray-700">
                  <Table.Td className="text-gray-500">{index + 1}</Table.Td>
                  <Table.Td className="min-w-56">
                    <SelectMaterial
                      value={item.materialCode}
                      setValue={(next) => {
                        const resolved = typeof next === "function" ? next(item.materialCode) : next;
                        if (!resolved) onMaterialSelect(permit.key, item.key, null);
                        else onUpdateItem(permit.key, item.key, { materialCode: resolved });
                      }}
                      onMaterialSelect={(material) => onMaterialSelect(permit.key, item.key, material)}
                      excludeCodes={excludeCodes}
                      placeholder={translate("Enter material...", "أدخل المادة...")}
                      withBrowseModal
                      radius="md"
                    />
                  </Table.Td>
                  <Table.Td className="min-w-36">
                    {showUnitSelect(item) ? (
                      <DataSelect
                        data={unitOptions}
                        value={item.unitOfMeasurementSelected}
                        setValue={(next) => {
                          const resolved =
                            typeof next === "function" ? next(item.unitOfMeasurementSelected) : next;
                          onUpdateItem(permit.key, item.key, {
                            unitOfMeasurementSelected:
                              (resolved as MaterialUnit | null) ?? item.unitOfMeasurement,
                          });
                        }}
                        radius="md"
                      />
                    ) : item.unitOfMeasurementSelected ? (
                      <span className="text-sm">
                        {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td className="min-w-28">
                    <NumberInput
                      value={item.quantity}
                      onChange={(value) =>
                        onUpdateItem(permit.key, item.key, { quantity: typeof value === "number" ? value : "" })
                      }
                      min={0}
                      decimalScale={5}
                      hideControls
                      radius="md"
                    />
                  </Table.Td>
                  <Table.Td className="min-w-32">
                    <NumberInput
                      value={item.unitPrice}
                      onChange={(value) =>
                        onUpdateItem(permit.key, item.key, { unitPrice: typeof value === "number" ? value : "" })
                      }
                      min={0}
                      decimalScale={5}
                      hideControls
                      radius="md"
                    />
                  </Table.Td>
                  <Table.Td className="font-medium text-gray-800">
                    {lineTotal > 0 ? formatMoney(lineTotal) : <span className="text-gray-400">-</span>}
                  </Table.Td>
                  <Table.Td>
                    {permit.items.length > 1 && (
                      <Button
                        variant="subtle"
                        color="clay"
                        size="compact-sm"
                        radius="md"
                        onClick={() => onRemoveItem(permit.key, item.key)}
                        aria-label={translate("Remove item", "حذف البند")}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </div>

      <div>
        <Button
          variant="light"
          color="haze"
          radius="md"
          leftSection={<Plus size={14} />}
          onClick={() => onAddItem(permit.key)}
        >
          {translate("Add item", "إضافة بند")}
        </Button>
      </div>
    </section>
  );
}
