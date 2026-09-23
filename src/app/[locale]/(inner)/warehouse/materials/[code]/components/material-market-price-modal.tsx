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

export default function MaterialMarketPriceModal({
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
  const [marketUnitPrice, setMarketUnitPrice] = useState<number | string>("");

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
    setMarketUnitPrice(currentValue ?? "");
    setValidationError("");
  }, [opened, currentValue, baseUnit]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialsApi.setMarketPrice({
        privateRequest,
        code: materialCode,
        dto: { marketUnitPrice: toBaseUnitPrice(Number(marketUnitPrice), factor) },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(translate("Market price saved successfully.", "تم حفظ سعر السوق بنجاح."));
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

    if (marketUnitPrice !== "" && !Number.isNaN(Number(marketUnitPrice))) {
      const basePrice = toBaseUnitPrice(Number(marketUnitPrice), factor);
      setMarketUnitPrice(toDisplayUnitPrice(basePrice, nextFactor));
    }

    setSelectedUnit(nextUnit);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const value = Number(marketUnitPrice);
    if (Number.isNaN(value) || value < 0) {
      return setValidationError(
        translate("Market price must be a non-negative number.", "يجب أن يكون سعر السوق رقماً غير سالب."),
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

  const isReadyToSubmit = marketUnitPrice !== "" && !Number.isNaN(Number(marketUnitPrice)) && Number(marketUnitPrice) >= 0;

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Set Market Price", "تعيين سعر السوق")} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {showUnitSelect && (
          <DataSelect
            value={selectedUnit}
            setValue={(value) => handleUnitChange(typeof value === "function" ? value(selectedUnit) : value)}
            data={unitOptions}
            label={translate("Price Unit", "وحدة السعر")}
            placeholder={translate("Select unit", "اختر الوحدة")}
            required
          />
        )}

        <NumberInput
          value={marketUnitPrice}
          onChange={setMarketUnitPrice}
          label={translate("Market Price", "سعر السوق")}
          placeholder={translate("Enter market price", "أدخل سعر السوق")}
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
            {translate("Save Market Price", "حفظ سعر السوق")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
