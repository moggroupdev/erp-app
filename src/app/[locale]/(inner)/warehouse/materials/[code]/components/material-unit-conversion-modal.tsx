"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialUnitLabel, MATERIAL_UNIT_LABELS_LIST, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { Button, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";

export default function MaterialUnitConversionModal({
  opened,
  close,
  materialCode,
  baseUnit,
  existingUnits,
}: {
  opened: boolean;
  close: () => void;
  materialCode: string;
  baseUnit: MaterialUnit;
  existingUnits: MaterialUnit[];
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [validationError, setValidationError] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [conversionFactorToBase, setConversionFactorToBase] = useState<number | string>("");

  const unitOptions = MATERIAL_UNIT_LABELS_LIST.filter(
    (item) => item.value !== baseUnit && !existingUnits.includes(item.value),
  ).map((item) => ({ value: item.value, label: translate(item.label.en, item.label.ar) }));

  function reset() {
    setUnit(null);
    setConversionFactorToBase("");
  }

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [opened]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await materialsApi.addUnit({
        privateRequest,
        code: materialCode,
        dto: {
          unit: unit as MaterialUnit,
          conversionFactorToBase: Number(conversionFactorToBase),
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(translate("Alternate unit added successfully.", "تمت إضافة وحدة القياس البديلة بنجاح."));
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!unit) {
      return setValidationError(translate("Please select a unit.", "يرجى اختيار وحدة قياس."));
    }

    const factor = Number(conversionFactorToBase);
    if (Number.isNaN(factor) || factor <= 0) {
      return setValidationError(
        translate("Conversion factor must be a positive number.", "يجب أن يكون معامل التحويل رقماً موجباً."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      reset();
    }, 250);
  }

  const isReadyToSubmit = !!unit && conversionFactorToBase !== "" && Number(conversionFactorToBase) > 0;
  const baseUnitLabel = getMaterialUnitLabel(baseUnit, locale);
  const selectedUnitLabel = unit ? getMaterialUnitLabel(unit as MaterialUnit, locale) : null;

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Add Alternate Unit", "إضافة وحدة قياس بديلة")} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <DataSelect
          value={unit}
          setValue={setUnit}
          data={unitOptions}
          label={translate("Unit", "الوحدة")}
          placeholder={translate("Select unit", "اختر الوحدة")}
          required
          searchable
          clearable
        />

        <NumberInput
          value={conversionFactorToBase}
          onChange={setConversionFactorToBase}
          label={
            selectedUnitLabel
              ? translate(
                  `Conversion factor (1 ${selectedUnitLabel} = ? ${baseUnitLabel})`,
                  `معامل التحويل (1 ${selectedUnitLabel} = ؟ ${baseUnitLabel})`,
                )
              : translate(
                  `Conversion factor (1 unit = ? ${baseUnitLabel})`,
                  `معامل التحويل (1 وحدة = ؟ ${baseUnitLabel})`,
                )
          }
          placeholder={translate("Enter conversion factor", "أدخل معامل التحويل")}
          description={
            selectedUnitLabel
              ? translate(
                  `How many ${baseUnitLabel} equal 1 ${selectedUnitLabel}.`,
                  `كم ${baseUnitLabel} تعادل 1 ${selectedUnitLabel}.`,
                )
              : translate(
                  `How many ${baseUnitLabel} equal one of the selected unit.`,
                  `كم ${baseUnitLabel} تعادل وحدة واحدة من الوحدة المختارة.`,
                )
          }
          min={0}
          allowNegative={false}
          decimalScale={5}
          required
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Add Unit", "إضافة الوحدة")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
