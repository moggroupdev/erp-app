"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { toStoredConversionFactorToBase } from "@/lib/helpers/unit-conversion";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialUnitLabel, MATERIAL_UNIT_LABELS_LIST, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { Button, NumberInput, SegmentedControl } from "@mantine/core";
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
  const [enteredFactor, setEnteredFactor] = useState<number | string>("");
  const [factorFromBase, setFactorFromBase] = useState(false);

  const unitOptions = MATERIAL_UNIT_LABELS_LIST.filter(
    (item) => item.value !== baseUnit && !existingUnits.includes(item.value),
  ).map((item) => ({ value: item.value, label: translate(item.label.en, item.label.ar) }));

  function reset() {
    setUnit(null);
    setEnteredFactor("");
    setFactorFromBase(false);
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
          conversionFactorToBase: toStoredConversionFactorToBase(Number(enteredFactor), factorFromBase),
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

    const entered = Number(enteredFactor);
    if (Number.isNaN(entered) || entered <= 0) {
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

  const isReadyToSubmit = !!unit && enteredFactor !== "" && Number(enteredFactor) > 0;
  const baseUnitLabel = getMaterialUnitLabel(baseUnit, locale);
  const selectedUnitLabel = unit ? getMaterialUnitLabel(unit as MaterialUnit, locale) : null;
  const leftUnitLabel = factorFromBase ? baseUnitLabel : (selectedUnitLabel ?? translate("unit", "وحدة"));
  const rightUnitLabel = factorFromBase ? (selectedUnitLabel ?? translate("unit", "وحدة")) : baseUnitLabel;

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

        {unit && (
          <SegmentedControl
            value={factorFromBase ? "fromBase" : "toBase"}
            onChange={(value) => setFactorFromBase(value === "fromBase")}
            data={[
              {
                value: "toBase",
                label: selectedUnitLabel
                  ? `1 ${selectedUnitLabel} = ? ${baseUnitLabel}`
                  : translate(`1 unit = ? ${baseUnitLabel}`, `1 وحدة = ؟ ${baseUnitLabel}`),
              },
              {
                value: "fromBase",
                label: selectedUnitLabel
                  ? `1 ${baseUnitLabel} = ? ${selectedUnitLabel}`
                  : translate(`1 ${baseUnitLabel} = ? unit`, `1 ${baseUnitLabel} = ؟ وحدة`),
              },
            ]}
            fullWidth
            radius="md"
          />
        )}

        <NumberInput
          value={enteredFactor}
          onChange={setEnteredFactor}
          label={translate(`Conversion factor`, `معامل التحويل`)}
          placeholder={translate("Enter conversion factor", "أدخل معامل التحويل")}
          description={translate(
            `How many ${rightUnitLabel} equal 1 ${leftUnitLabel}.`,
            `كم ${rightUnitLabel} تعادل 1 ${leftUnitLabel}.`,
          )}
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
