"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import mmBomsApi from "@/lib/api/mm-boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { queryKeys } from "@/lib/api/query-keys";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import { getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MmBomItemWithMaterial } from "@/types/mm-bom";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

export default function MmBomItemModal({
  opened,
  close,
  manufacturedMaterialCode,
  itemToUpdate,
  setItemToUpdate,
  excludeMaterialCodes = [],
}: {
  opened: boolean;
  close: () => void;
  manufacturedMaterialCode: string;
  itemToUpdate: MmBomItemWithMaterial | null;
  setItemToUpdate: React.Dispatch<React.SetStateAction<MmBomItemWithMaterial | null>>;
  excludeMaterialCodes?: string[];
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [quantityRequired, setQuantityRequired] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  const isUpdate = !!itemToUpdate;
  const baseUnit = itemToUpdate?.material.unitOfMeasurement || selectedMaterial?.unitOfMeasurement || null;
  const unitConversions = itemToUpdate?.material.unitConversions ?? selectedMaterial?.unitConversions ?? [];
  const materialType = itemToUpdate?.material.materialType || selectedMaterial?.materialType || null;
  const showUnitSelect = !!materialType && isRawMaterial(materialType);

  const allExcludeCodes = useMemo(
    () => [...excludeMaterialCodes, manufacturedMaterialCode],
    [excludeMaterialCodes, manufacturedMaterialCode],
  );

  const unitOptions = useMemo(
    () => getMaterialUnitSelectOptions(baseUnit, unitConversions, locale),
    [baseUnit, unitConversions, locale],
  );

  function reset() {
    setMaterialCode(null);
    setSelectedMaterial(null);
    setUnit(null);
    setQuantityRequired("");
    setNotes("");
  }

  const initialEditValues = useMemo(() => {
    if (!itemToUpdate) return null;

    return {
      unit: itemToUpdate.unitOfMeasurementSelected ?? itemToUpdate.material.unitOfMeasurement,
      quantityRequired: itemToUpdate.quantityRequired,
      notes: itemToUpdate.notes,
    };
  }, [itemToUpdate]);

  useEffect(() => {
    if (initialEditValues) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantityRequired(initialEditValues.quantityRequired);
      setNotes(initialEditValues.notes || "");
      setUnit(initialEditValues.unit);
    } else reset();
  }, [initialEditValues]);

  useEffect(() => {
    if (!baseUnit) return;
    setUnit((current) => current || baseUnit);
  }, [baseUnit]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (itemToUpdate) {
        return await mmBomsApi.updateItem({
          privateRequest,
          itemId: itemToUpdate.id,
          dto: {
            quantityRequired: Number(quantityRequired),
            unitOfMeasurementSelected: unit as MaterialUnit,
            notes: notes.trim() || null,
          },
        });
      }

      return await mmBomsApi.appendItem({
        privateRequest,
        manufacturedMaterialCode,
        dto: {
          materialCode: materialCode!,
          quantityRequired: Number(quantityRequired),
          unitOfMeasurementSelected: unit as MaterialUnit,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mmBoms.detail(manufacturedMaterialCode) });
      toast.success(
        isUpdate
          ? translate("BOM item updated successfully.", "تم تحديث بند قائمة المواد بنجاح.")
          : translate("BOM item added successfully.", "تمت إضافة بند قائمة المواد بنجاح."),
      );
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!isUpdate && !materialCode) {
      return setValidationError(translate("Please select a material.", "يرجى اختيار مادة."));
    }

    if (!unit) {
      return setValidationError(translate("Please select a unit.", "يرجى اختيار وحدة قياس."));
    }

    const normalizedQuantity = Number(quantityRequired);
    if (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0) {
      return setValidationError(translate("Quantity must be a positive number.", "يجب أن تكون الكمية رقماً موجباً."));
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      setItemToUpdate(null);
      reset();
    }, 250);
  }

  const title = isUpdate
    ? translate("Edit BOM Item", "تعديل بند قائمة المواد")
    : translate("Add BOM Item", "إضافة بند لقائمة المواد");

  const isDataChanged = initialEditValues
    ? formatQuantity(Number(quantityRequired)) !== formatQuantity(initialEditValues.quantityRequired) ||
      unit !== initialEditValues.unit ||
      (notes.trim() || null) !== initialEditValues.notes
    : true;

  const isReadyToSubmit =
    quantityRequired !== "" &&
    Number(quantityRequired) > 0 &&
    !!unit &&
    isDataChanged &&
    (isUpdate || !!materialCode);

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isUpdate && itemToUpdate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
            <p className="truncate text-sm font-medium text-gray-800">{itemToUpdate.material.title}</p>
            <Badge size="sm" variant="light" color="gray" radius="md" className="font-mono">
              {itemToUpdate.material.code}
            </Badge>
          </div>
        ) : (
          <SelectMaterial
            value={materialCode}
            setValue={setMaterialCode}
            onMaterialSelect={(material) => {
              setSelectedMaterial(material);
              setUnit(material?.unitOfMeasurement ?? null);
            }}
            excludeCodes={allExcludeCodes}
            label={translate("Material", "المادة")}
            placeholder={translate("Search material by name or code", "ابحث عن مادة بالاسم أو الكود")}
            required
            withBrowseModal
          />
        )}

        <div className={showUnitSelect ? "grid gap-3 sm:grid-cols-2" : undefined}>
          <NumberInput
            value={quantityRequired}
            onChange={setQuantityRequired}
            label={translate("Quantity Required", "الكمية المطلوبة")}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            min={0}
            allowNegative={false}
            decimalScale={6}
            required
            radius="md"
          />

          {showUnitSelect && (
            <DataSelect
              value={unit}
              setValue={setUnit}
              data={unitOptions}
              label={translate("Unit", "الوحدة")}
              placeholder={translate("Select unit", "اختر الوحدة")}
              required
              disabled={!baseUnit}
              searchable
            />
          )}
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes (Optional)", "الملاحظات (اختياري)")}
          placeholder={translate("Enter notes", "أدخل الملاحظات")}
          radius="md"
          autosize
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
