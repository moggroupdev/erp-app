"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { queryKeys } from "@/lib/api/query-keys";
import { isManufacturedMaterial, isRawMaterial } from "@/lib/constants/enums/material-types";
import { isPurchasedMmSourcing, type MmSourcingType } from "@/lib/constants/enums/mm-sourcing-types";
import { getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { BomItemWithMaterial } from "@/types/bom";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import { Alert, Button, NumberInput, Textarea } from "@mantine/core";
import { Info } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectMmSourcingType from "@/components/global/selections/enum-based/select-mm-sourcing-type";

export default function BomItemModal({
  opened,
  close,
  dimensionId,
  itemToUpdate,
  setItemToUpdate,
  existingItems = [],
}: {
  opened: boolean;
  close: () => void;
  dimensionId: string;
  itemToUpdate: BomItemWithMaterial | null;
  setItemToUpdate: React.Dispatch<React.SetStateAction<BomItemWithMaterial | null>>;
  existingItems?: BomItemWithMaterial[];
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [quantityRequired, setQuantityRequired] = useState<number | string>("");
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [mmSourcingType, setMmSourcingType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const isUpdate = !!itemToUpdate;
  const activeMaterial = selectedMaterial ?? itemToUpdate?.material;
  const baseUnit = activeMaterial?.unitOfMeasurement ?? null;
  const unitConversions = activeMaterial?.unitConversions ?? [];
  const materialType = activeMaterial?.materialType ?? null;
  const showUnitSelect = !!materialType && isRawMaterial(materialType);
  const isMmMaterial = !!materialType && isManufacturedMaterial(materialType);

  const departmentMaterialCodes = useMemo(() => {
    if (!productionSubDepartment) return [];
    return existingItems
      .filter((item) => item.productionSubDepartment === productionSubDepartment && item.id !== itemToUpdate?.id)
      .map((item) => item.materialCode);
  }, [productionSubDepartment, existingItems, itemToUpdate?.id]);

  const unitOptions = useMemo(
    () => getMaterialUnitSelectOptions(baseUnit, unitConversions, locale),
    [baseUnit, unitConversions, locale],
  );

  function reset() {
    setMaterialCode(null);
    setSelectedMaterial(null);
    setUnit(null);
    setQuantityRequired("");
    setProductionSubDepartment(null);
    setMmSourcingType(null);
    setNotes("");
  }

  const initialEditValues = useMemo(() => {
    if (!itemToUpdate) return null;

    return {
      materialCode: itemToUpdate.materialCode,
      unit: itemToUpdate.unitOfMeasurementSelected ?? itemToUpdate.material.unitOfMeasurement,
      quantityRequired: itemToUpdate.quantityRequired,
      productionSubDepartment: itemToUpdate.productionSubDepartment,
      mmSourcingType: itemToUpdate.mmSourcingType,
      notes: itemToUpdate.notes,
    };
  }, [itemToUpdate]);

  useEffect(() => {
    if (initialEditValues) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMaterialCode(initialEditValues.materialCode);
      setSelectedMaterial(null);
      setQuantityRequired(initialEditValues.quantityRequired);
      setProductionSubDepartment(initialEditValues.productionSubDepartment);
      setMmSourcingType(initialEditValues.mmSourcingType);
      setNotes(initialEditValues.notes || "");
      setUnit(initialEditValues.unit);
    } else reset();
  }, [initialEditValues]);

  useEffect(() => {
    if (!baseUnit) return;
    setUnit((current) => current || baseUnit);
  }, [baseUnit]);

  const resolvedMmSourcingType = isMmMaterial ? (mmSourcingType as MmSourcingType | null) : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = {
        materialCode: materialCode!,
        quantityRequired: Number(quantityRequired),
        unitOfMeasurementSelected: unit as MaterialUnit,
        productionSubDepartment: productionSubDepartment as ProductionSubDepartment,
        mmSourcingType: resolvedMmSourcingType,
        notes: notes.trim() || null,
      };

      if (itemToUpdate) {
        return await bomsApi.updateItem({
          privateRequest,
          itemId: itemToUpdate.id,
          dto,
        });
      }

      return await bomsApi.appendItem({
        privateRequest,
        dimensionId,
        dto,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionId) });
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

    if (!materialCode) {
      return setValidationError(translate("Please select a material.", "يرجى اختيار مادة."));
    }

    if (!productionSubDepartment) {
      return setValidationError(
        translate("Please select a production department.", "يرجى اختيار قسم الانتاج."),
      );
    }

    if (!unit) {
      return setValidationError(translate("Please select a unit.", "يرجى اختيار وحدة قياس."));
    }

    if (isMmMaterial && !mmSourcingType) {
      return setValidationError(
        translate("Please select a manufacturing source.", "يرجى اختيار مصدر التصنيع."),
      );
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
    ? materialCode !== initialEditValues.materialCode ||
      formatQuantity(Number(quantityRequired)) !== formatQuantity(initialEditValues.quantityRequired) ||
      productionSubDepartment !== initialEditValues.productionSubDepartment ||
      unit !== initialEditValues.unit ||
      (mmSourcingType ?? null) !== (initialEditValues.mmSourcingType ?? null) ||
      (notes.trim() || null) !== initialEditValues.notes
    : true;

  const isReadyToSubmit =
    !!materialCode &&
    quantityRequired !== "" &&
    Number(quantityRequired) > 0 &&
    !!productionSubDepartment &&
    !!unit &&
    (!isMmMaterial || !!mmSourcingType) &&
    isDataChanged;

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectMaterial
          value={materialCode}
          setValue={setMaterialCode}
          onMaterialSelect={(material) => {
            setSelectedMaterial(material);
            setUnit(material?.unitOfMeasurement ?? null);
            setMmSourcingType(null);
          }}
          excludeCodes={departmentMaterialCodes}
          label={translate("Material", "المادة")}
          placeholder={translate("Search material by name or code", "ابحث عن مادة بالاسم أو الكود")}
          required
          withBrowseModal
        />

        {isMmMaterial && (
          <>
            <SelectMmSourcingType
              value={mmSourcingType}
              setValue={setMmSourcingType}
              label={translate("Manufacturing Source", "مصدر التصنيع")}
              placeholder={translate("Select source", "اختر المصدر")}
              required
              clearable={false}
            />

            {isPurchasedMmSourcing(mmSourcingType as MmSourcingType | null) && (
              <Alert color="blue" variant="light" radius="md" icon={<Info size={16} />}>
                <p className="text-sm leading-relaxed">
                  {translate(
                    "This manufactured material will be treated like a normal material in this BOM. Its recipe components will not be expanded, and raw-material costs from its bill of materials will not be included — only this material’s own unit price is counted.",
                    "ستُعامل هذه المادة المصنّعة كأي مادة عادية في قائمة المواد هذه. لن يتم تفكيك مكوّنات وصفتها، ولن تُحتسب تكاليف المواد الأولية من قائمة موادها؛ يُحتسب سعر وحدتها فقط.",
                  )}
                </p>
              </Alert>
            )}
          </>
        )}

        <SelectProductionSubDepartment
          value={productionSubDepartment}
          setValue={setProductionSubDepartment}
          label={translate("Production Department", "قسم الانتاج")}
          placeholder={translate("Select department", "اختر القسم")}
          required
        />

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
