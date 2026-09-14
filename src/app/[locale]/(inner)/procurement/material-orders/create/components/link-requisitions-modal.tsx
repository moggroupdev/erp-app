"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Checkbox, NumberInput, Table } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { MaterialUnitConversionSummary } from "@/types/material";
import type { MaterialPurchaseRequisitionOpenItem } from "@/types/material-purchase-requisition";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import { convertEnteredQuantityBetweenUnits } from "../../helpers";

export type AllocationDraft = {
  materialPurchaseRequisitionItemId: string;
  requisitionId: string;
  requisitionCode: string;
  productionSubDepartment: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityRemaining: number;
  /** Allocation qty in the MPO line's selected unit (UI). */
  quantityAllocated: number;
};

type DraftSelection = {
  openItem: MaterialPurchaseRequisitionOpenItem;
  quantityAllocated: number | "";
};

export default function LinkRequisitionsModal({
  opened,
  onClose,
  materialCode,
  materialTitle,
  orderUnit,
  baseUnit,
  unitConversions,
  existingAllocations,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  materialCode: string;
  materialTitle: string;
  orderUnit: MaterialUnit;
  baseUnit: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
  existingAllocations: AllocationDraft[];
  /** Always sets order line quantity to the linked total. Empty allocations remove the line. */
  onSave: (allocations: AllocationDraft[], nextQuantityOrdered: number) => void;
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const [selections, setSelections] = useState<Record<string, DraftSelection>>({});
  const [localError, setLocalError] = useState("");

  const {
    data: openItems,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseRequisitions.openItems(materialCode),
    queryFn: ({ signal }) =>
      materialPurchaseRequisitionsApi.listOpenItems({ privateRequest, materialCode, signal }),
    staleTime: staleTimes.materialPurchaseRequisitions,
    enabled: opened && !!materialCode,
  });

  useEffect(() => {
    if (!opened) return;
    setLocalError("");

    const next: Record<string, DraftSelection> = {};
    for (const allocation of existingAllocations) {
      const openItem = openItems?.find((row) => row.requisitionItemId === allocation.materialPurchaseRequisitionItemId);
      next[allocation.materialPurchaseRequisitionItemId] = {
        openItem: openItem ?? {
          requisitionItemId: allocation.materialPurchaseRequisitionItemId,
          requisitionId: allocation.requisitionId,
          requisitionCode: allocation.requisitionCode,
          productionSubDepartment: allocation.productionSubDepartment as MaterialPurchaseRequisitionOpenItem["productionSubDepartment"],
          materialCode,
          materialTitle,
          materialType: "raw_materials",
          unitOfMeasurement: baseUnit,
          unitConversions,
          unitOfMeasurementSelected: allocation.unitOfMeasurementSelected,
          quantityRequested: allocation.quantityRemaining + allocation.quantityAllocated,
          quantityAllocated: 0,
          quantityRemaining: allocation.quantityRemaining,
        },
        quantityAllocated: allocation.quantityAllocated,
      };
    }
    setSelections(next);
  }, [opened, existingAllocations, openItems, materialCode, materialTitle, baseUnit, unitConversions]);

  const selectedTotal = useMemo(
    () =>
      Object.values(selections).reduce((sum, row) => sum + (typeof row.quantityAllocated === "number" ? row.quantityAllocated : 0), 0),
    [selections],
  );

  function remainingInOrderUnit(item: MaterialPurchaseRequisitionOpenItem) {
    return convertEnteredQuantityBetweenUnits(
      item.quantityRemaining,
      item.unitOfMeasurementSelected,
      orderUnit,
      baseUnit,
      unitConversions,
    );
  }

  function toggleItem(item: MaterialPurchaseRequisitionOpenItem, checked: boolean) {
    setLocalError("");
    setSelections((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[item.requisitionItemId];
        return next;
      }

      const reqRemaining = remainingInOrderUnit(item);
      next[item.requisitionItemId] = {
        openItem: item,
        quantityAllocated: reqRemaining > 0 ? Number(reqRemaining.toFixed(6)) : "",
      };
      return next;
    });
  }

  function updateQty(itemId: string, value: number | "") {
    setLocalError("");
    setSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return { ...prev, [itemId]: { ...current, quantityAllocated: value } };
    });
  }

  function handleSave() {
    setLocalError("");
    const rows = Object.values(selections);

    if (rows.length === 0) {
      onSave([], 0);
      onClose();
      return;
    }

    for (const row of rows) {
      const qty = typeof row.quantityAllocated === "number" ? row.quantityAllocated : NaN;
      if (Number.isNaN(qty) || qty <= 0) {
        return setLocalError(
          translate(
            `Allocation for ${row.openItem.requisitionCode} must be greater than zero.`,
            `يجب أن يكون التوزيع لـ ${row.openItem.requisitionCode} أكبر من صفر.`,
          ),
        );
      }

      const maxInOrderUnit = remainingInOrderUnit(row.openItem);
      if (qty > maxInOrderUnit + 1e-9) {
        return setLocalError(
          translate(
            `Allocation for ${row.openItem.requisitionCode} exceeds remaining requisition quantity.`,
            `التوزيع لـ ${row.openItem.requisitionCode} يتجاوز الكمية المتبقية في طلب الشراء.`,
          ),
        );
      }
    }

    const allocations = rows.map((row) => ({
      materialPurchaseRequisitionItemId: row.openItem.requisitionItemId,
      requisitionId: row.openItem.requisitionId,
      requisitionCode: row.openItem.requisitionCode,
      productionSubDepartment: row.openItem.productionSubDepartment,
      unitOfMeasurementSelected: row.openItem.unitOfMeasurementSelected,
      quantityRemaining: row.openItem.quantityRemaining,
      quantityAllocated: Number(row.quantityAllocated),
    }));

    onSave(allocations, Number(selectedTotal.toFixed(6)));
    onClose();
  }

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <Modal opened={opened} onClose={onClose} title={translate("Link requisitions", "ربط طلبات الشراء")} size="xl">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          {translate(
            `Select approved requisition lines for ${materialTitle || materialCode}. Order quantity will match the linked total (${getMaterialUnitLabel(orderUnit, locale)}).`,
            `اختر بنود طلبات الشراء المعتمدة للمادة ${materialTitle || materialCode}. ستطابق كمية الأمر إجمالي المربوط (${getMaterialUnitLabel(orderUnit, locale)}).`,
          )}
        </p>

        {isFetching ? (
          <LoadingSection message={translate("Loading open requisition lines", "جاري تحميل بنود طلبات الشراء المفتوحة")} />
        ) : errorMessage ? (
          <ErrorSection
            errorTitle={translate("Failed to load open requisition lines", "تعذر تحميل بنود طلبات الشراء المفتوحة")}
            errorMessage={errorMessage}
            button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
          />
        ) : !openItems || openItems.length === 0 ? (
          <EmptySection message={translate("No open requisition lines for this material", "لا توجد بنود طلب شراء مفتوحة لهذه المادة")} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <Table className="text-nowrap" verticalSpacing="xs" horizontalSpacing="sm">
              <Table.Thead className="bg-gray-50">
                <Table.Tr>
                  <Table.Th className="w-10" />
                  <Table.Th>{translate("Requisition", "طلب الشراء")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Remaining", "المتبقي")}</Table.Th>
                  <Table.Th>
                    {translate("Allocate", "توزيع")} ({getMaterialUnitLabel(orderUnit, locale)})
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {openItems.map((item) => {
                  const selected = selections[item.requisitionItemId];
                  const remainingOrderUnit = remainingInOrderUnit(item);

                  return (
                    <Table.Tr key={item.requisitionItemId} className="text-gray-600">
                      <Table.Td>
                        <Checkbox
                          checked={!!selected}
                          onChange={(e) => toggleItem(item, e.currentTarget.checked)}
                          aria-label={item.requisitionCode}
                        />
                      </Table.Td>
                      <Table.Td className="font-medium text-gray-800">{item.requisitionCode}</Table.Td>
                      <Table.Td>{getProductionSubDepartmentLabel(item.productionSubDepartment, locale)}</Table.Td>
                      <Table.Td>
                        {formatQuantity(item.quantityRemaining)} {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                        {item.unitOfMeasurementSelected !== orderUnit && (
                          <span className="mt-0.5 block text-xs text-gray-400">
                            ≈ {formatQuantity(remainingOrderUnit)} {getMaterialUnitLabel(orderUnit, locale)}
                          </span>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {selected ? (
                          <NumberInput
                            value={selected.quantityAllocated}
                            onChange={(value) =>
                              updateQty(item.requisitionItemId, value === "" ? "" : Number(value))
                            }
                            min={0}
                            max={remainingOrderUnit}
                            allowNegative={false}
                            decimalScale={6}
                            hideControls
                            radius="md"
                            size="xs"
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

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <Badge variant="light" color="teal" radius="md">
            {translate("Order qty will be", "ستصبح كمية الأمر")}: {formatQuantity(selectedTotal)}{" "}
            {getMaterialUnitLabel(orderUnit, locale)}
          </Badge>
        </div>

        {localError && <p className="text-sm text-red-600">{localError}</p>}

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={onClose} fullWidth>
            {translation.cancel}
          </Button>
          <Button radius="md" color="teal" onClick={handleSave} fullWidth disabled={isFetching}>
            {translate("Apply links", "تطبيق الربط")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
