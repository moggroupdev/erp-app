"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Checkbox, Table, TextInput } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { MaterialPurchaseRequisitionOpenItem } from "@/types/material-purchase-requisition";
import type { MaterialUnitConversionSummary } from "@/types/material";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import { convertEnteredQuantityBetweenUnits } from "../../material-orders/helpers";

export type QuotationItemLine = {
  materialCode: string;
  materialTitle: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit;
  quantity: number;
};

type RequisitionSelection = {
  openItem: MaterialPurchaseRequisitionOpenItem;
  quantity: number | "";
};

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

    let totalRemaining = 0;
    for (const item of materialItems) {
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
      totalRemaining: Number(totalRemaining.toFixed(6)),
    };
  });
}

function buildLinesFromRequisitionSelections(selections: RequisitionSelection[]): QuotationItemLine[] {
  const byMaterial = new Map<string, RequisitionSelection[]>();
  for (const row of selections) {
    const list = byMaterial.get(row.openItem.materialCode) ?? [];
    list.push(row);
    byMaterial.set(row.openItem.materialCode, list);
  }

  const lines: QuotationItemLine[] = [];
  for (const [, materialRows] of byMaterial) {
    const first = materialRows[0].openItem;
    const lineUnit = first.unitOfMeasurementSelected;
    let quantity = 0;
    for (const row of materialRows) {
      const qty = Number(row.quantity);
      quantity += convertEnteredQuantityBetweenUnits(
        qty,
        row.openItem.unitOfMeasurementSelected,
        lineUnit,
        first.unitOfMeasurement,
        first.unitConversions,
      );
    }

    lines.push({
      materialCode: first.materialCode,
      materialTitle: first.materialTitle,
      materialType: first.materialType,
      unitOfMeasurement: first.unitOfMeasurement,
      unitConversions: first.unitConversions,
      unitOfMeasurementSelected: lineUnit,
      quantity: Number(quantity.toFixed(6)),
    });
  }

  return lines;
}

export default function AddQuotationItemsModal({
  opened,
  onClose,
  onAdd,
}: {
  opened: boolean;
  onClose: () => void;
  onAdd: (lines: QuotationItemLine[]) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();

  const [search, setSearch] = useState("");
  const [selections, setSelections] = useState<Record<string, RequisitionSelection>>({});
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
    setSearch("");
    setSelections({});
    setLocalError("");
    setErrorItemId(null);
  }, [opened]);

  const availableItems = useMemo(() => {
    const items = openItems ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.requisitionCode.toLowerCase().includes(q) ||
        item.materialCode.toLowerCase().includes(q) ||
        item.materialTitle.toLowerCase().includes(q),
    );
  }, [openItems, search]);

  const materialGroups = useMemo(() => buildMaterialGroups(availableItems, locale), [availableItems, locale]);

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
          quantity: Number(item.quantityRemaining.toFixed(6)),
        };
      }
      return next;
    });
  }

  function isMaterialGroupSelected(group: MaterialGroup) {
    return group.items.every((item) => !!selections[item.requisitionItemId]);
  }

  function handleAdd() {
    setLocalError("");
    setErrorItemId(null);

    const rows = Object.values(selections);
    if (rows.length === 0) {
      return setLocalError(translate("Select at least one material.", "يرجى اختيار مادة واحدةً على الأقل."));
    }

    for (const row of rows) {
      const qty = typeof row.quantity === "number" ? row.quantity : NaN;
      const itemLabel = `${row.openItem.requisitionCode} / ${row.openItem.materialTitle}`;
      if (Number.isNaN(qty) || qty <= 0) {
        setErrorItemId(row.openItem.requisitionItemId);
        return setLocalError(
          translate(
            `Quantity for ${itemLabel} must be greater than zero.`,
            `يجب أن تكون كمية ${itemLabel} أكبر من صفر.`,
          ),
        );
      }
      if (qty > row.openItem.quantityRemaining + 1e-9) {
        setErrorItemId(row.openItem.requisitionItemId);
        return setLocalError(
          translate(
            `Quantity for ${itemLabel} exceeds remaining quantity.`,
            `كمية ${itemLabel} تتجاوز الكمية المتبقية.`,
          ),
        );
      }
    }

    onAdd(buildLinesFromRequisitionSelections(rows));
    onClose();
  }

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <Modal opened={opened} onClose={onClose} title={translate("Add from requisitions", "إضافة من طلبات الشراء")} size="60%">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          {translate(
            "Materials are combined across requisitions. Selecting a material takes its full remaining quantity.",
            "تُجمَّع المواد عبر طلبات الشراء. اختيار المادة يأخذ كامل الكمية المتبقية.",
          )}
        </p>

        <TextInput
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={translate(
            "Search by requisition, material code, or title...",
            "ابحث برقم الطلب أو كود/اسم المادة...",
          )}
          radius="md"
        />

        {isFetching ? (
          <LoadingSection message={translate("Loading open requisition lines", "جاري تحميل بنود طلبات الشراء المفتوحة")} />
        ) : errorMessage ? (
          <ErrorSection
            errorTitle={translate("Failed to load open requisition lines", "تعذر تحميل بنود طلبات الشراء المفتوحة")}
            errorMessage={errorMessage}
            button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
          />
        ) : materialGroups.length === 0 ? (
          <EmptySection message={translate("No open requisition lines available", "لا توجد بنود طلب شراء مفتوحة متاحة")} />
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
            <Table className="text-nowrap" verticalSpacing="sm" horizontalSpacing="sm">
              <Table.Thead className="sticky top-0 bg-gray-50">
                <Table.Tr>
                  <Table.Th className="w-10" />
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Requisitions", "طلبات الشراء")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Remaining", "المتبقي")}</Table.Th>
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
          >
            {translate("Add to quotation", "إضافة إلى طلب عرض السعر")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
