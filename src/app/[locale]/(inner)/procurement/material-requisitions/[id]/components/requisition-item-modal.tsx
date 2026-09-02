"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";

export default function RequisitionItemModal({
  opened,
  close,
  requisitionId,
  itemToUpdate,
  setItemToUpdate,
  excludeMaterialCodes = [],
}: {
  opened: boolean;
  close: () => void;
  requisitionId: string;
  itemToUpdate: MaterialPurchaseRequisitionItemDetailed | null;
  setItemToUpdate: React.Dispatch<React.SetStateAction<MaterialPurchaseRequisitionItemDetailed | null>>;
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
    setQuantity(itemToUpdate.quantityRequested);
    setNotes(itemToUpdate.notes || "");
    setValidationError("");

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
        materialCode: materialCode!,
        unitOfMeasurementSelected: unitOfMeasurementSelected as MaterialUnit,
        quantityRequested: Number(quantity),
        notes: notes.trim() || null,
      };

      if (itemToUpdate) {
        return await materialPurchaseRequisitionsApi.updateItem({
          privateRequest,
          id: requisitionId,
          itemId: itemToUpdate.id,
          dto,
        });
      }

      return await materialPurchaseRequisitionsApi.addItem({
        privateRequest,
        id: requisitionId,
        dto,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.detail(requisitionId) });
      toast.success(
        isEditing
          ? translate("Requisition item updated successfully.", "تم تحديث بند طلب الشراء بنجاح.")
          : translate("Requisition item added successfully.", "تم إضافة بند طلب الشراء بنجاح."),
      );
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const materialName = selectedMaterial?.title || itemToUpdate?.material?.title || materialCode;

    if (!materialCode) {
      return setValidationError(translate("Please select a material.", "يرجى اختيار مادة."));
    }

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

    const normalizedQuantity = Number(quantity);
    if (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0) {
      return setValidationError(
        translate(
          `Quantity for material ${materialName} must be a positive number.`,
          `يجب أن تكون كمية المادة ${materialName} رقماً موجباً.`,
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
      setItemToUpdate(null);
      reset();
    }, 250);
  }

  const isDataChanged = itemToUpdate
    ? materialCode !== itemToUpdate.materialCode ||
      unitOfMeasurementSelected !== itemToUpdate.unitOfMeasurementSelected ||
      Number(quantity) !== Number(itemToUpdate.quantityRequested) ||
      (notes.trim() || null) !== itemToUpdate.notes
    : true;

  const isReadyToSubmit = isDataChanged && !!materialCode;

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
          required
          withBrowseModal
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            value={quantity}
            onChange={setQuantity}
            label={translate("Quantity", "الكمية")}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            required
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
              required
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
              required
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
