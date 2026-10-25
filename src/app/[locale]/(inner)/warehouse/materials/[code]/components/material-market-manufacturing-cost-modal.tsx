"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { resolveDisplayUnit, toBaseUnitPrice, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";
import { Button, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";

export default function MaterialMarketManufacturingCostModal({
  opened,
  close,
  materialCode,
  currentValue,
  baseUnit,
  unitConversions,
}: {
  opened: boolean;
  close: () => void;
  materialCode: string;
  currentValue: number | null;
  baseUnit: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [validationError, setValidationError] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(baseUnit);
  const [marketManufacturingCost, setMarketManufacturingCost] = useState<number | string>("");

  const unitOptions = useMemo(
    () => getMaterialUnitSelectOptions(baseUnit, unitConversions, locale),
    [baseUnit, unitConversions, locale],
  );
  const showUnitSelect = unitConversions.length > 0;
  const activeUnit = (selectedUnit as MaterialUnit | null) ?? baseUnit;
  const { factor } = resolveDisplayUnit(activeUnit, baseUnit, unitConversions);
  const unitLabel = getMaterialUnitLabel(activeUnit, locale);

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUnit(baseUnit);
    setMarketManufacturingCost(currentValue ?? "");
    setValidationError("");
  }, [opened, currentValue, baseUnit]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialsApi.setMarketManufacturingCost({
        privateRequest,
        code: materialCode,
        dto: { marketManufacturingCost: toBaseUnitPrice(Number(marketManufacturingCost), factor) },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boms.all }),
      ]);
      toast.success(translate("Market manufacturing cost saved successfully.", "تم حفظ تكلفة التصنيع السوقية بنجاح."));
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleUnitChange(nextUnit: string | null) {
    if (!nextUnit || nextUnit === selectedUnit) {
      setSelectedUnit(nextUnit);
      return;
    }

    const { factor: nextFactor } = resolveDisplayUnit(nextUnit as MaterialUnit, baseUnit, unitConversions);

    if (marketManufacturingCost !== "" && !Number.isNaN(Number(marketManufacturingCost))) {
      const baseCost = toBaseUnitPrice(Number(marketManufacturingCost), factor);
      setMarketManufacturingCost(toDisplayUnitPrice(baseCost, nextFactor));
    }

    setSelectedUnit(nextUnit);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const value = Number(marketManufacturingCost);
    if (Number.isNaN(value) || value < 0) {
      return setValidationError(
        translate(
          "Market manufacturing cost must be a non-negative number.",
          "يجب أن تكون تكلفة التصنيع السوقية رقماً غير سالب.",
        ),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const isReadyToSubmit =
    marketManufacturingCost !== "" &&
    !Number.isNaN(Number(marketManufacturingCost)) &&
    Number(marketManufacturingCost) >= 0;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translate("Set Market Manufacturing Cost", "تعيين تكلفة التصنيع السوقية")}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {showUnitSelect && (
          <DataSelect
            value={selectedUnit}
            setValue={(value) => handleUnitChange(typeof value === "function" ? value(selectedUnit) : value)}
            data={unitOptions}
            label={translate("Cost Unit", "وحدة التكلفة")}
            placeholder={translate("Select unit", "اختر الوحدة")}
            required
          />
        )}

        <NumberInput
          value={marketManufacturingCost}
          onChange={setMarketManufacturingCost}
          label={translate("Market Manufacturing Cost", "تكلفة التصنيع السوقية")}
          placeholder={translate("Enter manufacturing cost", "أدخل تكلفة التصنيع")}
          min={0}
          allowNegative={false}
          decimalScale={6}
          required
          radius="md"
          suffix={` ${translation.currency} / ${unitLabel}`}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Save Manufacturing Cost", "حفظ تكلفة التصنيع")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
