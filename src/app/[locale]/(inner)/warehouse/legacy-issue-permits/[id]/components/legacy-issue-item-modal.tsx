"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { LegacyIssuePermitItemDetailed } from "@/types/legacy-issue-permit";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

export default function LegacyIssueItemModal({
  opened,
  close,
  transactionId,
  itemToUpdate,
  setItemToUpdate,
  excludeMaterialCodes = [],
}: {
  opened: boolean;
  close: () => void;
  transactionId: string;
  itemToUpdate: LegacyIssuePermitItemDetailed | null;
  setItemToUpdate: React.Dispatch<React.SetStateAction<LegacyIssuePermitItemDetailed | null>>;
  excludeMaterialCodes?: string[];
}) {
  const { locale, translate, translation } = useI18n();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [unitOfMeasurementSelected, setUnitOfMeasurementSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  const baseUnit = selectedMaterial?.unitOfMeasurement || itemToUpdate?.material?.unitOfMeasurement || null;
  const materialType = selectedMaterial?.materialType || itemToUpdate?.material?.materialType || null;
  const unitConversions = selectedMaterial?.unitConversions ?? [];
  const showUnitSelect = !!materialType && isRawMaterial(materialType) && unitConversions.length > 0;

  const unitOptions = useMemo(
    () => getMaterialUnitSelectOptions(baseUnit, unitConversions, locale),
    [baseUnit, unitConversions, locale],
  );

  function reset() {
    setMaterialCode(null);
    setSelectedMaterial(null);
    setUnitOfMeasurementSelected(null);
    setQuantity("");
    setNotes("");
  }

  useEffect(() => {
    if (!opened) return;

    if (!itemToUpdate) {
      reset();
      setValidationError("");
      return;
    }

    setMaterialCode(itemToUpdate.materialCode);
    setUnitOfMeasurementSelected(itemToUpdate.unitOfMeasurementSelected);
    setQuantity(itemToUpdate.quantity ?? "");
    setNotes(itemToUpdate.notes || "");
    setValidationError("");

    if (!itemToUpdate.materialCode) {
      setSelectedMaterial(null);
      return;
    }

    let cancelled = false;
    materialsApi
      .get({ privateRequest, code: itemToUpdate.materialCode })
      .then((material) => {
        if (!cancelled) setSelectedMaterial(material);
      })
      .catch(() => {
        if (!cancelled) setSelectedMaterial(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, itemToUpdate]);

  useEffect(() => {
    if (!baseUnit) return;
    setUnitOfMeasurementSelected((current) => current || baseUnit);
  }, [baseUnit]);

  const isEditing = !!itemToUpdate;

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = {
        materialCode: materialCode || null,
        unitOfMeasurementSelected: (unitOfMeasurementSelected as MaterialUnit) || null,
        quantity: quantity === "" ? null : Number(quantity),
        notes: notes.trim() || null,
      };

      if (itemToUpdate) {
        return await legacyIssuePermitsApi.updateItem({
          privateRequest,
          id: transactionId,
          itemId: itemToUpdate.id,
          dto,
        });
      }

      return await legacyIssuePermitsApi.addItem({
        privateRequest,
        id: transactionId,
        dto,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.legacyIssuePermits.detail(transactionId) });
      toast.success(
        isEditing
          ? translate("Legacy issue permit item updated successfully.", "تم تحديث بند إذن الصرف المرحلي بنجاح.")
          : translate("Legacy issue permit item added successfully.", "تم إضافة بند إذن الصرف المرحلي بنجاح."),
      );
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const materialName = selectedMaterial?.title || itemToUpdate?.material?.title || materialCode;

    if (materialCode) {
      if (!unitOfMeasurementSelected) {
        return setValidationError(
          translate(`Please select the unit for material ${materialName}.`, `يرجى اختيار الوحدة للمادة ${materialName}.`),
        );
      }

      if (quantity === "") {
        return setValidationError(
          translate(`Please enter the quantity for material ${materialName}.`, `يرجى إدخال الكمية للمادة ${materialName}.`),
        );
      }
    }

    if (quantity !== "") {
      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0) {
        return setValidationError(
          materialName
            ? translate(
                `Quantity for material ${materialName} must be a positive number.`,
                `يجب أن تكون كمية المادة ${materialName} رقماً موجباً.`,
              )
            : translate("Quantity must be a positive number.", "يجب أن تكون الكمية رقماً موجباً."),
        );
      }
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

  const isDataChanged = itemToUpdate
    ? materialCode !== itemToUpdate.materialCode ||
      unitOfMeasurementSelected !== itemToUpdate.unitOfMeasurementSelected ||
      (quantity === "" ? null : Number(quantity)) !==
        (itemToUpdate.quantity == null ? null : Number(itemToUpdate.quantity)) ||
      (notes.trim() || null) !== itemToUpdate.notes
    : true;

  const isReadyToSubmit = isDataChanged;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? translate("Edit Item", "تعديل البند") : translate("Add Item", "إضافة بند")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isEditing && itemToUpdate?.material && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
            <p className="truncate text-sm font-medium text-gray-800">
              {selectedMaterial?.title || itemToUpdate.material.title}
            </p>
            <Badge size="sm" variant="light" color="gray" radius="md" className="font-mono">
              {itemToUpdate.material.code}
            </Badge>
          </div>
        )}

        <SelectMaterial
          value={materialCode}
          setValue={setMaterialCode}
          onMaterialSelect={(material) => {
            setSelectedMaterial(material);
            setUnitOfMeasurementSelected(material?.unitOfMeasurement ?? null);
          }}
          excludeCodes={excludeMaterialCodes.filter((code) => code !== materialCode)}
          label={translate("Material", "المادة")}
          placeholder={translate("Search material by name or code", "ابحث عن مادة بالاسم أو الكود")}
          withBrowseModal
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            value={quantity}
            onChange={setQuantity}
            label={translate("Quantity", "الكمية")}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            required={!!materialCode}
            min={0}
            allowNegative={false}
            decimalScale={6}
            radius="md"
          />

          {showUnitSelect ? (
            <DataSelect
              value={unitOfMeasurementSelected}
              setValue={setUnitOfMeasurementSelected}
              data={unitOptions}
              label={translate("Unit", "الوحدة")}
              placeholder={translate("Select unit", "اختر الوحدة")}
              required={!!materialCode}
              disabled={!baseUnit}
              searchable
            />
          ) : (
            <TextInput
              value={
                unitOfMeasurementSelected ? getMaterialUnitLabel(unitOfMeasurementSelected as MaterialUnit, locale) : ""
              }
              label={translate("Unit", "الوحدة")}
              placeholder={translate("Base unit", "الوحدة الأساسية")}
              required={!!materialCode}
              readOnly
              radius="md"
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
            {isEditing ? translate("Save Changes", "حفظ التغييرات") : translate("Add Item", "إضافة بند")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
