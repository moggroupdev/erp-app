"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import {
  getEnteredQuantityInBaseUnit,
  resolveDisplayUnit,
  toDisplayQuantity,
} from "@/lib/helpers/unit-conversion";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, Table } from "@mantine/core";
import { Calculator, Layers, Package, Plus, Trash2, Wallet } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

const PAGE_TITLE = { en: "Unit Conversion Tool", ar: "أداة تحويل الوحدات" };

type CalculatorRow = {
  key: string;
  materialCode: string | null;
  material: MaterialWithUnitConversionsSelection | null;
  enteredUnit: MaterialUnit | null;
  quantity: number | "";
};

type RowComputation = {
  key: string;
  baseQuantity: number;
  lineValue: number;
  enteredUnit: MaterialUnit;
  enteredQuantity: number;
  conversions: { unit: MaterialUnit; quantity: number }[];
};

function createRowKey() {
  return `uct-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): CalculatorRow {
  return {
    key: createRowKey(),
    materialCode: null,
    material: null,
    enteredUnit: null,
    quantity: "",
  };
}

function isFilledRow(row: CalculatorRow): row is CalculatorRow & {
  material: MaterialWithUnitConversionsSelection;
  enteredUnit: MaterialUnit;
  quantity: number;
} {
  return !!row.material && !!row.enteredUnit && row.quantity !== "" && Number(row.quantity) > 0;
}

function getRowUnitOptions(row: CalculatorRow, locale: Locale) {
  if (!row.material) return [];
  return getMaterialUnitSelectOptions(row.material.unitOfMeasurement, row.material.unitConversions, locale);
}

function showUnitSelect(row: CalculatorRow) {
  return !!row.material && row.material.unitConversions.length > 0;
}

function computeRow(row: CalculatorRow): RowComputation | null {
  if (!isFilledRow(row)) return null;

  const baseQuantity = getEnteredQuantityInBaseUnit(Number(row.quantity), row.enteredUnit, row.material);
  const lineValue = baseQuantity * Number(row.material.unitPrice);

  const knownUnits: MaterialUnit[] = [
    row.material.unitOfMeasurement,
    ...row.material.unitConversions.map((c) => c.unit).filter((u) => u !== row.material!.unitOfMeasurement),
  ];

  const conversions = knownUnits
    .filter((unit) => unit !== row.enteredUnit)
    .map((unit) => {
      const { factor } = resolveDisplayUnit(unit, row.material.unitOfMeasurement, row.material.unitConversions);
      return { unit, quantity: toDisplayQuantity(baseQuantity, factor) };
    });

  return {
    key: row.key,
    baseQuantity,
    lineValue,
    enteredUnit: row.enteredUnit,
    enteredQuantity: Number(row.quantity),
    conversions,
  };
}

function ItemRow({
  row,
  index,
  locale,
  computation,
  canRemove,
  onMaterialSelect,
  onUpdate,
  onRemove,
}: {
  row: CalculatorRow;
  index: number;
  locale: Locale;
  computation: RowComputation | null;
  canRemove: boolean;
  onMaterialSelect: (key: string, material: MaterialWithUnitConversionsSelection | null) => void;
  onUpdate: (key: string, patch: Partial<CalculatorRow>) => void;
  onRemove: (key: string) => void;
}) {
  const { translate, translation } = useI18n();

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
          disabled={!row.material}
        />
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        {showUnitSelect(row) ? (
          <DataSelect
            value={row.enteredUnit}
            setValue={(next) => {
              const resolved = typeof next === "function" ? next(row.enteredUnit) : next;
              onUpdate(row.key, {
                enteredUnit: (resolved as MaterialUnit | null) ?? row.material?.unitOfMeasurement ?? null,
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
            {row.enteredUnit ? getMaterialUnitLabel(row.enteredUnit, locale) : ""}
          </span>
        )}
      </Table.Td>
      <Table.Td>
        {computation && computation.conversions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {computation.conversions.map((item) => (
              <Badge key={item.unit} size="sm" variant="light" color="indigo" radius="md">
                {formatQuantity(item.quantity)} {getMaterialUnitLabel(item.unit, locale)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </Table.Td>
      <Table.Td className="font-medium text-gray-800">
        {computation ? formatMoney(computation.lineValue, translation.currency) : <span className="text-gray-400">—</span>}
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

function CalculationCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-white to-teal-50/40 p-4 sm:p-5">
      <div className="flex h-10 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">{icon}</div>
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const [rows, setRows] = useState<CalculatorRow[]>([createEmptyRow()]);

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Warehouse", "المخازن")}`,
  );

  const computations = useMemo(() => {
    const map = new Map<string, RowComputation>();
    for (const row of rows) {
      const computed = computeRow(row);
      if (computed) map.set(row.key, computed);
    }
    return map;
  }, [rows]);

  const totals = useMemo(() => {
    const filled = Array.from(computations.values());
    const totalValue = filled.reduce((sum, row) => sum + row.lineValue, 0);
    const itemCount = filled.length;

    const sameUnit = filled.length > 0 && filled.every((row) => row.enteredUnit === filled[0].enteredUnit);
    const totalQuantity = sameUnit ? filled.reduce((sum, row) => sum + row.enteredQuantity, 0) : null;
    const totalQuantityUnit = sameUnit ? filled[0].enteredUnit : null;

    return { totalValue, itemCount, totalQuantity, totalQuantityUnit };
  }, [computations]);

  function updateRow(key: string, patch: Partial<CalculatorRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversionsSelection | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      material: material ?? null,
      enteredUnit: material?.unitOfMeasurement ?? null,
    });
  }

  useEffect(() => {
    const incomplete = rows.filter((row) => row.materialCode && !row.material);
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
  }, [rows.map((row) => `${row.key}:${row.materialCode}:${row.material?.code ?? ""}`).join("|")]);

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
      }}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-gray-500">
          {translate(
            "Add materials, enter quantities in any supported unit, and see live conversions and totals. Nothing is saved.",
            "أضف موادًا وأدخل الكميات بأي وحدة مدعومة لعرض التحويلات والإجماليات مباشرة. لا يتم حفظ أي شيء.",
          )}
        </p>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers size={16} />
            </div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {totals.itemCount}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50">
                <Table.Tr className="h-9">
                  <Table.Th className="w-[2.5%] text-center! text-gray-500">#</Table.Th>
                  <Table.Th className="w-[28%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className="w-[27%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Converted Quantities", "الكميات المحوّلة")}
                  </Table.Th>
                  <Table.Th className="w-[20%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate(`Line Value (${translation.currency})`, `قيمة البند (${translation.currency})`)}
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
                    computation={computations.get(row.key) ?? null}
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
                  <Table.Td />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CalculationCard
            label={translate("Total Value", "إجمالي القيمة")}
            value={formatMoney(totals.totalValue, translation.currency)}
            hint={translate(
              "Sum of quantity × unit price for all filled rows",
              "مجموع الكمية × سعر الوحدة لكل البنود المكتملة",
            )}
            icon={<Wallet size={18} />}
          />
          <CalculationCard
            label={translate("Total Quantity", "إجمالي الكمية")}
            value={
              totals.totalQuantity != null && totals.totalQuantityUnit
                ? `${formatQuantity(totals.totalQuantity)} ${getMaterialUnitLabel(totals.totalQuantityUnit, locale)}`
                : "—"
            }
            hint={
              totals.totalQuantity != null
                ? translate("Sum of entered quantities (same unit)", "مجموع الكميات المدخلة (نفس الوحدة)")
                : translate("Available when all filled rows use the same unit", "يظهر عندما تستخدم كل البنود نفس الوحدة")
            }
            icon={<Package size={18} />}
          />
          <CalculationCard
            label={translate("Item Count", "عدد البنود")}
            value={totals.itemCount}
            hint={translate("Number of rows with a valid quantity", "عدد الصفوف ذات الكمية الصالحة")}
            icon={<Calculator size={18} />}
          />
        </section>
      </div>
    </LayoutBox>
  );
}
