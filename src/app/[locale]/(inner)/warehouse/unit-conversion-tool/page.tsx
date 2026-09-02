"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
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
import { Badge, Button, Divider, NumberInput, Table } from "@mantine/core";
import { Calculator, Layers, Package, Plus, Ruler, Trash2, Wallet } from "lucide-react";
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
  unitPrice: number | "";
};

type RowComputation = {
  key: string;
  baseQuantity: number;
  lineValue: number;
  enteredUnit: MaterialUnit;
  enteredQuantity: number;
  conversions: { unit: MaterialUnit; quantity: number }[];
};

type QuantityByUnit = {
  unit: MaterialUnit;
  quantity: number;
  rowCount: number;
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
    unitPrice: "",
  };
}

function isEmptyRow(row: CalculatorRow) {
  return row.materialCode === null && row.quantity === "" && row.unitPrice === "";
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
  const enteredUnitPrice = row.unitPrice === "" ? 0 : Number(row.unitPrice);
  const lineValue = Number(row.quantity) * enteredUnitPrice;

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
          placeholder={translate("Qty", "الكمية")}
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
            placeholder={translate("Unit", "الوحدة")}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {row.enteredUnit ? getMaterialUnitLabel(row.enteredUnit, locale) : ""}
          </span>
        )}
      </Table.Td>
      <Table.Td className="transition-colors focus-within:bg-teal-50/60">
        <NumberInput
          value={row.unitPrice}
          onChange={(value) => onUpdate(row.key, { unitPrice: value === "" ? "" : Number(value) })}
          min={0}
          allowNegative={false}
          decimalScale={6}
          hideControls
          variant="unstyled"
          radius={0}
          placeholder={translate("Unit price", "سعر الوحدة")}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
          disabled={!row.material}
        />
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

function SummaryStat({
  label,
  value,
  hint,
  icon,
  accent = "teal",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  accent?: "teal" | "indigo" | "amber";
}) {
  const accentClasses = {
    teal: "bg-teal-50 text-teal-600 ring-teal-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  }[accent];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-4 ${accentClasses}`}>{icon}</div>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
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

  const isDirty = useMemo(
    () => rows.length > 1 || rows.some((row) => !isEmptyRow(row)),
    [rows],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty);

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

    const byUnit = new Map<MaterialUnit, QuantityByUnit>();
    for (const row of filled) {
      const existing = byUnit.get(row.enteredUnit);
      if (existing) {
        existing.quantity += row.enteredQuantity;
        existing.rowCount += 1;
      } else {
        byUnit.set(row.enteredUnit, {
          unit: row.enteredUnit,
          quantity: row.enteredQuantity,
          rowCount: 1,
        });
      }
    }

    const quantitiesByUnit = Array.from(byUnit.values()).sort((a, b) =>
      getMaterialUnitLabel(a.unit, locale).localeCompare(getMaterialUnitLabel(b.unit, locale), locale),
    );

    return { totalValue, itemCount, quantitiesByUnit };
  }, [computations, locale]);

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

  function clearAll() {
    if (!isDirty) {
      setRows([createEmptyRow()]);
      return;
    }
    if (
      window.confirm(
        translate("Clear all rows and start over?", "مسح كل الصفوف والبدء من جديد؟"),
      )
    ) {
      setRows([createEmptyRow()]);
    }
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        confirmNavigate: confirmNavigation,
        sideElements: (
          <Button variant="light" color="gray" radius="md" size="sm" onClick={clearAll} disabled={!isDirty}>
            {translate("Clear", "مسح")}
          </Button>
        ),
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/80 via-white to-teal-50/50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Ruler size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900">
                {translate("Live conversion calculator", "حاسبة التحويل المباشرة")}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {translate(
                  "Add materials, enter quantities and unit prices in any supported unit, and see live conversions and totals. Nothing is saved to the database.",
                  "أضف موادًا وأدخل الكميات وأسعار الوحدات بأي وحدة مدعومة لعرض التحويلات والإجماليات مباشرة. لا يتم حفظ أي شيء في قاعدة البيانات.",
                )}
              </p>
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
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
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50">
                <Table.Tr className="h-10">
                  <Table.Th className="w-[2.5%] text-center! text-gray-500">#</Table.Th>
                  <Table.Th className="w-[24%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className="w-[11%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                  </Table.Th>
                  <Table.Th className="w-[24%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Converted Quantities", "الكميات المحوّلة")}
                  </Table.Th>
                  <Table.Th className="w-[17.5%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate(`Line Value (${translation.currency})`, `قيمة البند (${translation.currency})`)}
                  </Table.Th>
                  <Table.Th className="w-[3%]" />
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
                <Table.Tr className="h-10">
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
                  <Table.Td />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Calculator size={16} />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{translate("Totals", "الإجماليات")}</h4>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-br from-slate-50 via-white to-teal-50/40 shadow-sm">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-5 md:border-e md:border-b-0 md:p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <Wallet size={15} />
                  </div>
                  <h5 className="text-sm font-semibold text-gray-800">
                    {translate("Value summary", "ملخص القيمة")}
                  </h5>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Grand total", "الإجمالي الكلي")}
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-teal-700">
                    {formatMoney(totals.totalValue, translation.currency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {translate(
                      "Sum of quantity × entered unit price for all filled rows",
                      "مجموع الكمية × سعر الوحدة المدخل لكل البنود المكتملة",
                    )}
                  </p>
                </div>

                <Divider variant="dashed" />

                <div className="grid grid-cols-2 gap-3">
                  <SummaryStat
                    label={translate("Item Count", "عدد البنود")}
                    value={totals.itemCount}
                    hint={translate("Filled rows", "الصفوف المكتملة")}
                    icon={<Layers size={16} />}
                    accent="indigo"
                  />
                  <SummaryStat
                    label={translate("Unit groups", "مجموعات الوحدات")}
                    value={totals.quantitiesByUnit.length}
                    hint={translate("Distinct entered units", "وحدات الإدخال المختلفة")}
                    icon={<Package size={16} />}
                    accent="amber"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Package size={15} />
                  </div>
                  <h5 className="text-sm font-semibold text-gray-800">
                    {translate("Quantities by unit", "الكميات حسب الوحدة")}
                  </h5>
                </div>

                {totals.quantitiesByUnit.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/60 px-4 py-10 text-center">
                    <Package size={22} className="text-gray-300" />
                    <p className="text-sm text-gray-500">
                      {translate(
                        "Enter quantities to see totals grouped by unit.",
                        "أدخل الكميات لعرض الإجماليات مجمّعة حسب الوحدة.",
                      )}
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {totals.quantitiesByUnit.map((group) => (
                      <li
                        key={group.unit}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Badge size="md" variant="light" color="indigo" radius="md">
                            {getMaterialUnitLabel(group.unit, locale)}
                          </Badge>
                          <span className="truncate text-xs text-gray-500">
                            {group.rowCount}{" "}
                            {group.rowCount === 1
                              ? translate("row", "صف")
                              : translate("rows", "صفوف")}
                          </span>
                        </div>
                        <p className="shrink-0 text-lg font-semibold text-gray-900">
                          {formatQuantity(group.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </LayoutBox>
  );
}
