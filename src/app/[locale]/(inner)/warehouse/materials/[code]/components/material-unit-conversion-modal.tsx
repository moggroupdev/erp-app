"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import {
  formatConversionLabel,
  getKnownConversionFactorToBase,
  toStoredConversionFactorToBase,
} from "@/lib/helpers/unit-conversion";
import { queryKeys } from "@/lib/api/query-keys";
import { getMaterialUnitLabel, MATERIAL_UNIT_LABELS_LIST, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";
import { Alert, Button, NumberInput, SegmentedControl } from "@mantine/core";
import { Info } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";

export default function MaterialUnitConversionModal({
  opened,
  close,
  materialCode,
  baseUnit,
  existingConversions,
  existingConversion,
}: {
  opened: boolean;
  close: () => void;
  materialCode: string;
  baseUnit: MaterialUnit;
  existingConversions: MaterialUnitConversionSummary[];
  existingConversion?: MaterialUnitConversionSummary | null;
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const [validationError, setValidationError] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [enteredFactor, setEnteredFactor] = useState<number | string>("");
  const [factorFromBase, setFactorFromBase] = useState(false);

  const isUpdate = !!existingConversion;
  const existingUnits = existingConversions.map((conversion) => conversion.unit);
  const unitOptions = MATERIAL_UNIT_LABELS_LIST.filter((item) => {
    if (item.value === baseUnit) return false;
    if (existingConversion?.unit === item.value) return true;
    return !existingUnits.includes(item.value);
  }).map((item) => ({ value: item.value, label: translate(item.label.en, item.label.ar) }));

  function reset() {
    setUnit(null);
    setEnteredFactor("");
    setFactorFromBase(false);
  }

  function hydrateFromConversion(conversion: MaterialUnitConversionSummary) {
    setUnit(conversion.unit);
    const stored = Number(conversion.conversionFactorToBase);
    if (stored > 0 && stored < 1) {
      setFactorFromBase(true);
      setEnteredFactor(1 / stored);
      return;
    }

    setFactorFromBase(false);
    setEnteredFactor(stored);
  }

  useEffect(() => {
    if (!opened) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (existingConversion) hydrateFromConversion(existingConversion);
    else reset();
  }, [opened, existingConversion]);

  const mutation = useMutation({
    mutationFn: async () => {
      const conversionFactorToBase = toStoredConversionFactorToBase(Number(enteredFactor), factorFromBase);

      if (existingConversion) {
        return await materialsApi.updateUnit({
          privateRequest,
          code: materialCode,
          id: existingConversion.id,
          dto: { conversionFactorToBase },
        });
      }

      return await materialsApi.addUnit({
        privateRequest,
        code: materialCode,
        dto: {
          unit: unit as MaterialUnit,
          conversionFactorToBase,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success(
        isUpdate
          ? translate("Alternate unit updated successfully.", "تم تحديث وحدة القياس البديلة بنجاح.")
          : translate("Alternate unit added successfully.", "تمت إضافة وحدة القياس البديلة بنجاح."),
      );
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
  const conversionsForKnownFactor = existingConversion
    ? existingConversions.filter((conversion) => conversion.id !== existingConversion.id)
    : existingConversions;
  const knownFactor = unit
    ? getKnownConversionFactorToBase(unit as MaterialUnit, baseUnit, conversionsForKnownFactor)
    : null;

  function applyKnownFactor() {
    if (knownFactor == null) return;

    if (knownFactor > 0 && knownFactor < 1) {
      setFactorFromBase(true);
      setEnteredFactor(1 / knownFactor);
      return;
    }

    setFactorFromBase(false);
    setEnteredFactor(knownFactor);
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        isUpdate
          ? translate("Update Alternate Unit", "تحديث وحدة قياس بديلة")
          : translate("Add Alternate Unit", "إضافة وحدة قياس بديلة")
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <DataSelect
          value={unit}
          setValue={setUnit}
          data={unitOptions}
          label={translate("Unit", "الوحدة")}
          placeholder={translate("Select unit", "اختر الوحدة")}
          required
          searchable
          clearable={!isUpdate}
          disabled={isUpdate}
          readOnly={isUpdate}
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

        {knownFactor != null && selectedUnitLabel && (
          <Alert color="haze" variant="light" radius="md" icon={<Info size={16} />}>
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                {translate(
                  `Known conversion: ${formatConversionLabel(knownFactor, selectedUnitLabel, baseUnitLabel)}`,
                  `تحويل معروف: ${formatConversionLabel(knownFactor, selectedUnitLabel, baseUnitLabel)}`,
                )}
              </p>
              <Button type="button" size="xs" color="haze" variant="light" radius="md" onClick={applyKnownFactor}>
                {translate("Use this factor", "استخدام هذا المعامل")}
              </Button>
            </div>
          </Alert>
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
          decimalScale={6}
          required
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" color="haze" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {isUpdate ? translate("Update Unit", "تحديث الوحدة") : translate("Add Unit", "إضافة الوحدة")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
