"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Checkbox, NumberInput, Table, TextInput } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { MaterialPurchaseRequisitionOpenItem } from "@/types/material-purchase-requisition";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import { convertEnteredQuantityBetweenUnits } from "../../helpers";
import type { AllocationDraft } from "./link-requisitions-modal";

export type OpenItemSelection = {
  openItem: MaterialPurchaseRequisitionOpenItem;
  /** Quantity in the requisition line's selected unit. */
  quantityAllocated: number | "";
};

export type AddedMaterialLine = {
  materialCode: string;
  materialTitle: string;
  materialType: MaterialPurchaseRequisitionOpenItem["materialType"];
  unitOfMeasurement: MaterialUnit;
  unitConversions: MaterialPurchaseRequisitionOpenItem["unitConversions"];
  unitOfMeasurementSelected: MaterialUnit;
  quantity: number;
  allocations: AllocationDraft[];
};

type DraftSelection = OpenItemSelection;

type MaterialGroup = {
  materialCode: string;
  materialTitle: string;
  materialType: MaterialPurchaseRequisitionOpenItem["materialType"];
  unitOfMeasurement: MaterialUnit;
  unitConversions: MaterialPurchaseRequisitionOpenItem["unitConversions"];
  unitOfMeasurementSelected: MaterialUnit;
  items: MaterialPurchaseRequisitionOpenItem[];
  requisitionCodes: string[];
  departments: string[];
  totalRequested: number;
  totalRemaining: number;
};

function buildMaterialGroups(items: MaterialPurchaseRequisitionOpenItem[], locale: Locale): MaterialGroup[] {
  const byMaterial = new Map<string, MaterialPurchaseRequisitionOpenItem[]>();
  for (const item of items) {
    const list = byMaterial.get(item.materialCode) ?? [];
    list.push(item);
    byMaterial.set(item.materialCode, list);
  }

  return [...byMaterial.entries()].map(([, materialItems]) => {
    const first = materialItems[0];
    const lineUnit = first.unitOfMeasurementSelected;
    const requisitionCodes = [...new Set(materialItems.map((item) => item.requisitionCode))];
    const departments = [
      ...new Set(materialItems.map((item) => getProductionSubDepartmentLabel(item.productionSubDepartment, locale))),
    ];

    let totalRequested = 0;
    let totalRemaining = 0;
    for (const item of materialItems) {
      totalRequested += convertEnteredQuantityBetweenUnits(
        item.quantityRequested,
        item.unitOfMeasurementSelected,
        lineUnit,
        first.unitOfMeasurement,
        first.unitConversions,
      );
      totalRemaining += convertEnteredQuantityBetweenUnits(
        item.quantityRemaining,
        item.unitOfMeasurementSelected,
        lineUnit,
        first.unitOfMeasurement,
        first.unitConversions,
      );
    }

    return {
      materialCode: first.materialCode,
      materialTitle: first.materialTitle,
      materialType: first.materialType,
      unitOfMeasurement: first.unitOfMeasurement,
      unitConversions: first.unitConversions,
      unitOfMeasurementSelected: lineUnit,
      items: materialItems,
      requisitionCodes,
      departments,
      totalRequested: Number(totalRequested.toFixed(6)),
      totalRemaining: Number(totalRemaining.toFixed(6)),
    };
  });
}

export default function AddFromRequisitionsModal({
  opened,
  onClose,
  excludedRequisitionItemIds,
  onAdd,
}: {
  opened: boolean;
  onClose: () => void;
  /** Requisition item IDs already linked on the draft order. */
  excludedRequisitionItemIds: string[];
  onAdd: (lines: AddedMaterialLine[]) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const [selections, setSelections] = useState<Record<string, DraftSelection>>({});
  const [groupByMaterial, setGroupByMaterial] = useState(false);
  const [search, setSearch] = useState("");
  const [localError, setLocalError] = useState("");
  const [errorItemId, setErrorItemId] = useState<string | null>(null);

  const {
    data: openItems,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseRequisitions.openItems(),
    queryFn: ({ signal }) => materialPurchaseRequisitionsApi.listOpenItems({ privateRequest, signal }),
    staleTime: staleTimes.materialPurchaseRequisitions,
    enabled: opened,
  });

  useEffect(() => {
    if (!opened) return;
    setLocalError("");
    setErrorItemId(null);
    setSearch("");
    setSelections({});
    setGroupByMaterial(false);
  }, [opened]);

  const excluded = useMemo(() => new Set(excludedRequisitionItemIds), [excludedRequisitionItemIds]);

  const availableItems = useMemo(() => {
    const items = (openItems ?? []).filter((item) => !excluded.has(item.requisitionItemId));
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.requisitionCode.toLowerCase().includes(q) ||
        item.materialCode.toLowerCase().includes(q) ||
        item.materialTitle.toLowerCase().includes(q),
    );
  }, [openItems, excluded, search]);

  const materialGroups = useMemo(
    () => (groupByMaterial ? buildMaterialGroups(availableItems, locale) : []),
    [groupByMaterial, availableItems, locale],
  );

  function setGroupByMaterialMode(checked: boolean) {
    setLocalError("");
    setErrorItemId(null);
    setSelections({});
    setGroupByMaterial(checked);
  }

  function toggleItem(item: MaterialPurchaseRequisitionOpenItem, checked: boolean) {
    setLocalError("");
    setErrorItemId(null);
    setSelections((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[item.requisitionItemId];
        return next;
      }
      next[item.requisitionItemId] = {
        openItem: item,
        quantityAllocated: Number(item.quantityRemaining.toFixed(6)),
      };
      return next;
    });
  }

  function toggleMaterialGroup(group: MaterialGroup, checked: boolean) {
    setLocalError("");
    setErrorItemId(null);
    setSelections((prev) => {
      const next = { ...prev };
      for (const item of group.items) {
        if (!checked) {
          delete next[item.requisitionItemId];
          continue;
        }
        next[item.requisitionItemId] = {
          openItem: item,
          quantityAllocated: Number(item.quantityRemaining.toFixed(6)),
        };
      }
      return next;
    });
  }

  function isMaterialGroupSelected(group: MaterialGroup) {
    return group.items.every((item) => !!selections[item.requisitionItemId]);
  }

  function updateQty(itemId: string, value: number | "") {
    setLocalError("");
    setErrorItemId(null);
    setSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return { ...prev, [itemId]: { ...current, quantityAllocated: value } };
    });
  }

  function handleAdd() {
    setLocalError("");
    setErrorItemId(null);
    const rows = Object.values(selections);
    if (rows.length === 0) {
      return setLocalError(
        groupByMaterial
          ? translate("Select at least one material.", "يرجى اختيار مادة واحدةً على الأقل.")
          : translate("Select at least one requisition line.", "يرجى اختيار بند طلب شراء واحد على الأقل."),
      );
    }

    for (const row of rows) {
      const qty = typeof row.quantityAllocated === "number" ? row.quantityAllocated : NaN;
      const itemLabel = `${row.openItem.requisitionCode} / ${row.openItem.materialTitle}`;
      if (Number.isNaN(qty) || qty <= 0) {
        setErrorItemId(row.openItem.requisitionItemId);
        return setLocalError(
          translate(
            `Order quantity for ${itemLabel} must be greater than zero.`,
            `يجب أن تكون كمية الأمر لـ ${itemLabel} أكبر من صفر.`,
          ),
        );
      }
      if (qty > row.openItem.quantityRemaining + 1e-9) {
        setErrorItemId(row.openItem.requisitionItemId);
        return setLocalError(
          translate(
            `Order quantity for ${itemLabel} exceeds remaining quantity.`,
            `كمية الأمر لـ ${itemLabel} تتجاوز الكمية المتبقية.`,
          ),
        );
      }
    }

    const byMaterial = new Map<string, DraftSelection[]>();
    for (const row of rows) {
      const list = byMaterial.get(row.openItem.materialCode) ?? [];
      list.push(row);
      byMaterial.set(row.openItem.materialCode, list);
    }

    const lines: AddedMaterialLine[] = [];
    for (const [, materialRows] of byMaterial) {
      const first = materialRows[0].openItem;
      const lineUnit = first.unitOfMeasurementSelected;
      const allocations: AllocationDraft[] = materialRows.map((row) => {
        const qtyInLineUnit = convertEnteredQuantityBetweenUnits(
          Number(row.quantityAllocated),
          row.openItem.unitOfMeasurementSelected,
          lineUnit,
          first.unitOfMeasurement,
          first.unitConversions,
        );

        return {
          materialPurchaseRequisitionItemId: row.openItem.requisitionItemId,
          requisitionId: row.openItem.requisitionId,
          requisitionCode: row.openItem.requisitionCode,
          productionSubDepartment: row.openItem.productionSubDepartment,
          unitOfMeasurementSelected: row.openItem.unitOfMeasurementSelected,
          quantityRemaining: row.openItem.quantityRemaining,
          quantityAllocated: Number(qtyInLineUnit.toFixed(6)),
        };
      });

      const quantity = allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0);
      lines.push({
        materialCode: first.materialCode,
        materialTitle: first.materialTitle,
        materialType: first.materialType,
        unitOfMeasurement: first.unitOfMeasurement,
        unitConversions: first.unitConversions,
        unitOfMeasurementSelected: lineUnit,
        quantity: Number(quantity.toFixed(6)),
        allocations,
      });
    }

    onAdd(lines);
    onClose();
  }

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <Modal opened={opened} onClose={onClose} title={translate("Add from requisitions", "إضافة من طلبات الشراء")} size="60%">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          {groupByMaterial
            ? translate(
                "Materials are combined across requisitions. Selecting a material takes its full remaining quantity and links all related requisition lines.",
                "تُجمَّع المواد عبر طلبات الشراء. اختيار المادة يأخذ كامل الكمية المتبقية ويربط كل بنود الطلبات المتعلقة بها.",
              )
            : translate(
                "Select open approved requisition lines. Order lines are grouped by material and quantity is taken from the selected order quantities.",
                "اختر بنود طلبات الشراء المعتمدة المفتوحة. تُجمَّع بنود الأمر حسب المادة وتُؤخذ الكمية من كميات الأمر المحددة.",
              )}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder={translate(
              "Search by requisition, material code, or title...",
              "ابحث برقم الطلب أو كود/اسم المادة...",
            )}
            radius="md"
            className="flex-1"
          />
          <Checkbox
            checked={groupByMaterial}
            onChange={(e) => setGroupByMaterialMode(e.currentTarget.checked)}
            label={translate("Group by material", "تجميع حسب المادة")}
            className="shrink-0"
          />
        </div>

        {isFetching ? (
          <LoadingSection message={translate("Loading open requisition lines", "جاري تحميل بنود طلبات الشراء المفتوحة")} />
        ) : errorMessage ? (
          <ErrorSection
            errorTitle={translate("Failed to load open requisition lines", "تعذر تحميل بنود طلبات الشراء المفتوحة")}
            errorMessage={errorMessage}
            button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
          />
        ) : availableItems.length === 0 ? (
          <EmptySection message={translate("No open requisition lines available", "لا توجد بنود طلب شراء مفتوحة متاحة")} />
        ) : groupByMaterial ? (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
            <Table className="text-nowrap" verticalSpacing="sm" horizontalSpacing="sm">
              <Table.Thead className="sticky top-0 bg-gray-50">
                <Table.Tr>
                  <Table.Th className="w-10" />
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Requisitions", "طلبات الشراء")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Total Requested", "اجمالي الكمية المطلوبة")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {materialGroups.map((group) => {
                  const selected = isMaterialGroupSelected(group);
                  const hasError = group.items.some((item) => errorItemId === item.requisitionItemId);
                  return (
                    <Table.Tr key={group.materialCode} className={`text-gray-600 ${hasError ? "bg-red-50" : ""}`}>
                      <Table.Td>
                        <Checkbox
                          checked={selected}
                          onChange={(e) => toggleMaterialGroup(group, e.currentTarget.checked)}
                          aria-label={group.materialCode}
                        />
                      </Table.Td>
                      <Table.Td>
                        <span className="font-medium text-gray-800">{group.materialTitle}</span>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex flex-wrap gap-1">
                          {group.requisitionCodes.map((code) => (
                            <Badge key={code} size="xs" variant="light" color="gray" radius="sm" className="font-mono">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {group.departments.length === 1 ? group.departments[0] : translate("Multiple", "متعدد")}
                      </Table.Td>
                      <Table.Td>{getMaterialUnitLabel(group.unitOfMeasurementSelected, locale)}</Table.Td>
                      <Table.Td className="font-medium text-gray-800">{formatQuantity(group.totalRemaining)}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
            <Table className="text-nowrap" verticalSpacing="sm" horizontalSpacing="sm">
              <Table.Thead className="sticky top-0 bg-gray-50">
                <Table.Tr>
                  <Table.Th className="w-10" />
                  <Table.Th>{translate("Requisition Number", "رقم طلب الشراء")}</Table.Th>
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Total quantity requested", "اجمالي الكمية المطلوبة")}</Table.Th>
                  <Table.Th>{translate("Quantity on this order", "الكمية في هذا الأمر")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {availableItems.map((item) => {
                  const selected = selections[item.requisitionItemId];
                  const hasError = errorItemId === item.requisitionItemId;
                  return (
                    <Table.Tr key={item.requisitionItemId} className="text-gray-600">
                      <Table.Td>
                        <Checkbox
                          checked={!!selected}
                          onChange={(e) => toggleItem(item, e.currentTarget.checked)}
                          aria-label={`${item.requisitionCode} ${item.materialCode}`}
                        />
                      </Table.Td>
                      <Table.Td className="font-mono font-medium text-gray-800">{item.requisitionCode}</Table.Td>
                      <Table.Td>
                        <span className="font-medium text-gray-800">{item.materialTitle}</span>
                      </Table.Td>
                      <Table.Td>{getProductionSubDepartmentLabel(item.productionSubDepartment, locale)}</Table.Td>
                      <Table.Td>{getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}</Table.Td>
                      <Table.Td>{formatQuantity(item.quantityRequested)}</Table.Td>
                      <Table.Td
                        className={`transition-colors ${
                          hasError ? "bg-red-50 focus-within:bg-red-50" : "focus-within:bg-teal-50/60"
                        }`}
                      >
                        {selected ? (
                          <NumberInput
                            value={selected.quantityAllocated}
                            onChange={(value) => updateQty(item.requisitionItemId, value === "" ? "" : Number(value))}
                            min={0}
                            max={item.quantityRemaining}
                            allowNegative={false}
                            decimalScale={6}
                            hideControls
                            variant="unstyled"
                            radius={0}
                            size="xs"
                            className="w-20"
                            styles={{
                              root: { width: "5rem" },
                              input: {
                                minHeight: 0,
                                height: "1.25rem",
                                lineHeight: 1.25,
                                padding: 0,
                                fontSize: "0.8125rem",
                                color: hasError ? "var(--mantine-color-red-7)" : undefined,
                              },
                            }}
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}

        {localError && <p className="text-sm text-red-600">{localError}</p>}

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={onClose} fullWidth>
            {translation.cancel}
          </Button>
          <Button
            radius="md"
            color="teal"
            onClick={handleAdd}
            fullWidth
            disabled={isFetching}
            className="bg-teal-800! hover:bg-teal-900! data-disabled:bg-teal-800/45!"
          >
            {translate("Add to order", "إضافة إلى الأمر")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
