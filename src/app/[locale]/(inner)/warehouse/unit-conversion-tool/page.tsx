"use client";

import { useEffect, useMemo, useState } from "react";
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
  toDisplayUnitPrice,
} from "@/lib/helpers/unit-conversion";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Button, NumberInput, Table } from "@mantine/core";
import { Calculator, Layers, Plus, Ruler, Scale, Tag, Trash2, Wallet } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

const PAGE_TITLE = { en: "Unit Calculator", ar: "حاسبة الوحدات" };

const TABLE_COLUMN_CLASS = {
  index: "min-w-10 w-10",
  material: "min-w-112",
  quantity: "min-w-20",
  unit: "min-w-20",
  unitPrice: "min-w-28",
  otherUnits: "min-w-100",
  lineValue: "min-w-32",
  actions: "min-w-12 w-12",
} as const;

type CalculatorRow = {
  key: string;
  materialCode: string | null;
  material: MaterialWithUnitConversionsSelection | null;
  enteredUnit: MaterialUnit | null;
  quantity: number | "";
  unitPrice: number | "";
};

type OtherUnitConversion = {
  unit: MaterialUnit;
  quantity: number | null;
  unitPrice: number | null;
};

type RowComputation = {
  key: string;
  baseQuantity: number | null;
  lineValue: number | null;
  enteredUnit: MaterialUnit;
  enteredQuantity: number | null;
  otherUnits: OtherUnitConversion[];
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

function hasConversionInputs(row: CalculatorRow): row is CalculatorRow & {
  material: MaterialWithUnitConversionsSelection;
  enteredUnit: MaterialUnit;
} {
  if (!row.material || !row.enteredUnit) return false;
  const hasQuantity = row.quantity !== "" && Number(row.quantity) > 0;
  const hasUnitPrice = row.unitPrice !== "";
  return hasQuantity || hasUnitPrice;
}

function getRowUnitOptions(row: CalculatorRow, locale: Locale) {
  if (!row.material) return [];
  return getMaterialUnitSelectOptions(row.material.unitOfMeasurement, row.material.unitConversions, locale);
}

function showUnitSelect(row: CalculatorRow) {
  return !!row.material && row.material.unitConversions.length > 0;
}

function getKnownUnits(material: MaterialWithUnitConversionsSelection): MaterialUnit[] {
  return [
    material.unitOfMeasurement,
    ...material.unitConversions.map((c) => c.unit).filter((u) => u !== material.unitOfMeasurement),
  ];
}

function computeOtherUnits(
  row: CalculatorRow & { material: MaterialWithUnitConversionsSelection; enteredUnit: MaterialUnit },
): OtherUnitConversion[] {
  const hasQuantity = row.quantity !== "" && Number(row.quantity) > 0;
  const hasUnitPrice = row.unitPrice !== "";

  const { factor: enteredFactor } = resolveDisplayUnit(
    row.enteredUnit,
    row.material.unitOfMeasurement,
    row.material.unitConversions,
  );

  const baseQuantity = hasQuantity
    ? getEnteredQuantityInBaseUnit(Number(row.quantity), row.enteredUnit, row.material)
    : null;
  const baseUnitPrice = hasUnitPrice ? Number(row.unitPrice) / enteredFactor : null;

  return getKnownUnits(row.material)
    .filter((unit) => unit !== row.enteredUnit)
    .map((unit) => {
      const { factor } = resolveDisplayUnit(unit, row.material.unitOfMeasurement, row.material.unitConversions);
      return {
        unit,
        quantity: baseQuantity != null ? toDisplayQuantity(baseQuantity, factor) : null,
        unitPrice: baseUnitPrice != null ? toDisplayUnitPrice(baseUnitPrice, factor) : null,
      };
    })
    .filter((item) => item.quantity != null || item.unitPrice != null);
}

function computeRow(row: CalculatorRow): RowComputation | null {
  if (!hasConversionInputs(row)) return null;

  const hasQuantity = row.quantity !== "" && Number(row.quantity) > 0;
  const hasUnitPrice = row.unitPrice !== "";

  return {
    key: row.key,
    baseQuantity: hasQuantity ? getEnteredQuantityInBaseUnit(Number(row.quantity), row.enteredUnit, row.material) : null,
    lineValue: hasQuantity && hasUnitPrice ? Number(row.quantity) * Number(row.unitPrice) : null,
    enteredUnit: row.enteredUnit,
    enteredQuantity: hasQuantity ? Number(row.quantity) : null,
    otherUnits: computeOtherUnits(row),
  };
}

function ConversionUnitCard({
  unit,
  quantity,
  unitPrice,
  locale,
  currency,
}: {
  unit: MaterialUnit;
  quantity: number | null;
  unitPrice: number | null;
  locale: Locale;
  currency: string;
}) {
  const { translate } = useI18n();
  const unitLabel = getMaterialUnitLabel(unit, locale);

  return (
    <div className="relative min-w-36 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 px-3 py-2.5 ps-3.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            <Ruler size={11} strokeWidth={2.25} />
          </div>
          <span className="text-xs font-semibold tracking-wide text-indigo-700 uppercase">{unitLabel}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {quantity != null ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Scale size={12} strokeWidth={2} />
                <span className="text-[11px] font-medium">{translate("Qty", "الكمية")}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatQuantity(quantity)}</span>
            </div>
          ) : null}

          {unitPrice != null ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-teal-50/70 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-teal-700/80">
                <Tag size={12} strokeWidth={2} />
                <span className="text-[11px] font-medium">{translate("Unit Price", "سعر الوحدة")}</span>
              </div>
              <span className="text-xs font-semibold text-teal-800 tabular-nums">{formatMoney(unitPrice, currency)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OtherUnitsCell({
  computation,
  locale,
  currency,
}: {
  computation: RowComputation | null;
  locale: Locale;
  currency: string;
}) {
  if (!computation || computation.otherUnits.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto py-0.5">
      {computation.otherUnits.map((item) => (
        <ConversionUnitCard
          key={item.unit}
          unit={item.unit}
          quantity={item.quantity}
          unitPrice={item.unitPrice}
          locale={locale}
          currency={currency}
        />
      ))}
    </div>
  );
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
    <Table.Tr className="text-nowrap">
      <Table.Td className={`${TABLE_COLUMN_CLASS.index} text-center text-xs font-medium text-gray-500`}>{index + 1}</Table.Td>
      <Table.Td className={`${TABLE_COLUMN_CLASS.material} transition-colors focus-within:bg-teal-50/60`}>
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
      <Table.Td className={`${TABLE_COLUMN_CLASS.quantity} transition-colors focus-within:bg-teal-50/60`}>
        {row.material ? (
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
          />
        ) : null}
      </Table.Td>
      <Table.Td className={`${TABLE_COLUMN_CLASS.unit} transition-colors focus-within:bg-teal-50/60`}>
        {row.material ? (
          showUnitSelect(row) ? (
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
          )
        ) : null}
      </Table.Td>
      <Table.Td className={`${TABLE_COLUMN_CLASS.unitPrice} transition-colors focus-within:bg-teal-50/60`}>
        {row.material ? (
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
          />
        ) : null}
      </Table.Td>
      <Table.Td className={`${TABLE_COLUMN_CLASS.otherUnits} py-2! align-top!`}>
        <OtherUnitsCell computation={computation} locale={locale} currency={translation.currency} />
      </Table.Td>
      <Table.Td className={`${TABLE_COLUMN_CLASS.lineValue} font-medium text-gray-800`}>
        {computation?.lineValue != null ? (
          formatMoney(computation.lineValue, translation.currency)
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </Table.Td>
      <Table.Td className={TABLE_COLUMN_CLASS.actions}>
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
  const privateRequest = usePrivateRequest();
  const [rows, setRows] = useState<CalculatorRow[]>([createEmptyRow()]);

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Warehouse", "المخازن")}`);

  const isDirty = useMemo(() => rows.length > 1 || rows.some((row) => !isEmptyRow(row)), [rows]);

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
    const filled = Array.from(computations.values()).filter(
      (row): row is RowComputation & { lineValue: number } => row.lineValue != null,
    );
    const totalValue = filled.reduce((sum, row) => sum + row.lineValue, 0);

    return { totalValue };
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

  function clearAll() {
    if (!isDirty) {
      setRows([createEmptyRow()]);
      return;
    }
    if (window.confirm(translate("Clear all rows and start over?", "مسح كل الصفوف والبدء من جديد؟"))) {
      setRows([createEmptyRow()]);
    }
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate(
          "Add materials, enter quantities and unit prices in any supported unit, and see live conversions and totals.",
          "أضف موادًا وأدخل الكميات وأسعار الوحدات بأي وحدة مدعومة لعرض التحويلات والإجماليات مباشرة.`.",
        ),
        backLink: true,
        confirmNavigate: confirmNavigation,
        sideElements: (
          <Button variant="light" color="gray" radius="md" size="sm" onClick={clearAll} disabled={!isDirty}>
            {translate("Clear", "مسح")}
          </Button>
        ),
      }}
    >
      <div className="flex flex-col gap-8 not-italic">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers size={16} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <Table withColumnBorders className="w-full min-w-max text-nowrap" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50">
                <Table.Tr className="h-10">
                  <Table.Th className={`${TABLE_COLUMN_CLASS.index} text-center! text-gray-500`}>#</Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.material} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.quantity} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.unit} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.unitPrice} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                  </Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.otherUnits} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate("Other Units", "الوحدات الأخرى")}
                  </Table.Th>
                  <Table.Th className={`${TABLE_COLUMN_CLASS.lineValue} text-xs font-medium tracking-wide text-gray-500 uppercase`}>
                    {translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                  </Table.Th>
                  <Table.Th className={TABLE_COLUMN_CLASS.actions} />
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
                  <Table.Td className={TABLE_COLUMN_CLASS.index} />
                  <Table.Td className={TABLE_COLUMN_CLASS.material}>
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
                  <Table.Td className={TABLE_COLUMN_CLASS.quantity} />
                  <Table.Td className={TABLE_COLUMN_CLASS.unit} />
                  <Table.Td className={TABLE_COLUMN_CLASS.unitPrice} />
                  <Table.Td className={TABLE_COLUMN_CLASS.otherUnits} />
                  <Table.Td className={TABLE_COLUMN_CLASS.lineValue} />
                  <Table.Td className={TABLE_COLUMN_CLASS.actions} />
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

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-br from-slate-50 via-white to-teal-50/40">
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <Wallet size={15} />
                </div>
                <h5 className="text-sm font-semibold text-gray-800">{translate("Value summary", "ملخص القيمة")}</h5>
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
            </div>
          </div>
        </section>
      </div>
    </LayoutBox>
  );
}
