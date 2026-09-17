"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Radio } from "@mantine/core";
import {
  getItemCostingMethodLabel,
  ITEM_COSTING_METHOD_LABELS_LIST,
  type CostingMethod,
  type ItemCostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import { getMaterialCostPrice, type FlattenedBomRow } from "@/lib/helpers/bom-display";
import { useI18n } from "@/lib/i18n/hooks";
import Modal from "@/components/ui/modal";

type BulkZeroCostingModalProps = {
  opened: boolean;
  onClose: () => void;
  items: FlattenedBomRow[];
  bomCostingMethod: CostingMethod;
  onApply: (method: ItemCostingMethod) => void;
};

export default function BulkZeroCostingModal({
  opened,
  onClose,
  items,
  bomCostingMethod,
  onApply,
}: BulkZeroCostingModalProps) {
  const { locale, translate, translation } = useI18n();
  const [selectedMethod, setSelectedMethod] = useState<ItemCostingMethod | null>(null);

  const methodStats = useMemo(() => {
    return ITEM_COSTING_METHOD_LABELS_LIST.map((method) => {
      let updatableCount = 0;

      for (const item of items) {
        if (getMaterialCostPrice(item.material, method.value) !== 0) updatableCount += 1;
      }

      return {
        value: method.value,
        label: getItemCostingMethodLabel(method.value, locale),
        updatableCount,
        disabled: updatableCount === 0,
      };
    });
  }, [items, locale]);

  useEffect(() => {
    if (!opened) return;

    const preferred =
      methodStats.find((method) => method.value !== bomCostingMethod && !method.disabled) ??
      methodStats.find((method) => !method.disabled) ??
      null;

    setSelectedMethod(preferred?.value ?? null);
  }, [opened, methodStats, bomCostingMethod]);

  const selectedStats = methodStats.find((method) => method.value === selectedMethod) ?? null;
  const canApply = !!selectedStats && !selectedStats.disabled && selectedStats.updatableCount > 0;
  const skippedCount = selectedStats ? items.length - selectedStats.updatableCount : 0;

  function handleApply() {
    if (!selectedMethod || !canApply) return;
    onApply(selectedMethod);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={translate("Update Zero Price Items", "تحديث البنود ذات السعر صفر")}
    >
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {translate(
            `Choose a costing method to apply to all ${items.length} items that currently have a zero unit price.`,
            `اختر أساس تكلفة لتطبيقه على جميع البنود (${items.length}) التي سعر وحدتها صفر حاليًا.`,
          )}
        </p>

        <Radio.Group
          value={selectedMethod ?? undefined}
          onChange={(value) => setSelectedMethod(value as ItemCostingMethod)}
          label={translate("Costing method", "أساس التكلفة")}
        >
          <div className="mt-2 flex flex-col gap-2.5">
            {methodStats.map((method) => (
              <div
                key={method.value}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                  method.disabled ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
                }`}
              >
                <Radio value={method.value} disabled={method.disabled} color="teal" label={method.label} />
                <span className={`shrink-0 text-xs tabular-nums ${method.disabled ? "text-orange-500" : "text-gray-500"}`}>
                  {`${method.updatableCount}/${items.length}`}
                </span>
              </div>
            ))}
          </div>
        </Radio.Group>

        {selectedStats && (
          <p className="text-xs text-gray-500">
            {skippedCount > 0
              ? translate(
                  `${selectedStats.updatableCount} items will be updated. ${skippedCount} items will be skipped because they have no price for this method.`,
                  `سيتم تحديث ${selectedStats.updatableCount} بند. سيتم تخطي ${skippedCount} بند لعدم وجود سعر لهذا الأساس.`,
                )
              : translate(
                  `All ${selectedStats.updatableCount} zero-price items will be updated.`,
                  `سيتم تحديث جميع البنود ذات السعر صفر (${selectedStats.updatableCount}).`,
                )}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={onClose} fullWidth>
            {translation.cancel}
          </Button>
          <Button color="teal" radius="md" onClick={handleApply} disabled={!canApply} fullWidth>
            {translate("Apply", "تطبيق")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
