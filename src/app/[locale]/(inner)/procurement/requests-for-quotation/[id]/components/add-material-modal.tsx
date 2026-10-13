"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, NumberInput, Textarea, TextInput } from "@mantine/core";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import ErrorAlert from "@/components/ui/error-alert";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import usePrivateRequest from "@/hooks/use-private-request";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { supportsUnitConversions } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";

export default function AddMaterialModal({
  opened,
  onClose,
  requestId,
  excludeCodes,
}: {
  opened: boolean;
  onClose: () => void;
  requestId: string;
  excludeCodes: string[];
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [material, setMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState<MaterialUnit | null>(null);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const showUnitChoices = !!material && supportsUnitConversions(material.materialType) && material.unitConversions.length > 0;

  const addItem = useMutation({
    mutationFn: () => {
      if (!material || quantity === "" || !unit || Number(quantity) <= 0) {
        throw new Error(
          translate("Choose a material, unit, and a quantity greater than zero.", "اختر المادة والوحدة وكمية أكبر من صفر."),
        );
      }
      return requestForQuotationsApi.addItem({
        privateRequest,
        id: requestId,
        dto: {
          materialCode: material.code,
          unitOfMeasurementSelected: unit,
          quantityRequested: Number(quantity),
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requestForQuotations.all });
      handleClose();
    },
  });

  const error = validationError || (addItem.error ? getErrorMessage(locale, addItem.error) : "");

  function reset() {
    setMaterial(null);
    setQuantity("");
    setUnit(null);
    setNotes("");
    setValidationError("");
    addItem.reset();
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 250);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError("");

    if (!material || quantity === "" || !unit || Number(quantity) <= 0) {
      setValidationError(
        translate("Choose a material, unit, and a quantity greater than zero.", "اختر المادة والوحدة وكمية أكبر من صفر."),
      );
      return;
    }

    addItem.mutate();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Add a material", "إضافة مادة")} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectMaterial
          label={translate("Material", "المادة")}
          value={material?.code ?? null}
          setValue={(next) => {
            const resolved = typeof next === "function" ? next(material?.code ?? null) : next;
            if (!resolved) {
              setMaterial(null);
              setUnit(null);
            }
          }}
          onMaterialSelect={(next) => {
            setMaterial(next);
            setUnit(next?.unitOfMeasurement ?? null);
          }}
          excludeCodes={excludeCodes}
          placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
          withBrowseModal
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            label={translate("Quantity", "الكمية")}
            value={quantity}
            onChange={(value) => setQuantity(value === "" ? "" : Number(value))}
            min={0}
            allowNegative={false}
            decimalScale={6}
            hideControls
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            radius="md"
            required
          />
          {showUnitChoices ? (
            <DataSelect
              label={translate("Unit", "الوحدة")}
              value={unit}
              setValue={(next) => setUnit((next as MaterialUnit | null) ?? null)}
              data={getMaterialUnitSelectOptions(material.unitOfMeasurement, material.unitConversions, locale)}
              placeholder={translate("Select unit", "اختر الوحدة")}
              searchable
              required
            />
          ) : (
            <TextInput
              label={translate("Unit", "الوحدة")}
              value={unit ? getMaterialUnitLabel(unit, locale) : ""}
              placeholder={translate("Select a material first", "اختر المادة أولاً")}
              readOnly
              radius="md"
              required
            />
          )}
        </div>

        <Textarea
          label={translate("Notes", "الملاحظات")}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder={translate("Optional note", "ملاحظة اختيارية")}
          radius="md"
          autosize
          minRows={2}
        />

        <div className="flex gap-2">
          <Button type="button" onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" color="haze" radius="md" loading={addItem.isPending} fullWidth>
            {translate("Add", "إضافة")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
