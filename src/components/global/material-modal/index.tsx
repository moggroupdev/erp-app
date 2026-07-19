import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import type { Material, MaterialWithCreator } from "@/types/material";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import usePrivateRequest from "@/hooks/use-private-request";
import useCategories from "@/hooks/use-categories";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { TextInput, Button, Textarea, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectMaterialMain from "@/components/global/select-material-main";
import SelectMaterialSub from "@/components/global/select-material-sub";
import SelectMaterialType from "@/components/global/select-material-type";
import SelectMaterialUnit from "@/components/global/select-material-unit";

type MaterialFormEntity = Material | MaterialWithCreator;

export default function MaterialModal({
  opened,
  close,
  materialToUpdate,
  setMaterialToUpdate,
  isForList = false,
  onSuccess,
}: {
  opened: boolean;
  close: () => void;
  materialToUpdate: MaterialFormEntity | null;
  setMaterialToUpdate: React.Dispatch<React.SetStateAction<Material | null>>;
  isForList?: boolean;
  onSuccess?: () => void;
}) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useCategories();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [materialType, setMaterialType] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [legacyCode, setLegacyCode] = useState("");
  const [minimumStock, setMinimumStock] = useState<number | string>("");

  function reset() {
    setTitle("");
    setDescription("");
    setMainCategoryId(null);
    setSubCategoryId(null);
    setMaterialType(null);
    setUnit(null);
    setLegacyCode("");
    setMinimumStock("");
  }

  function handleMainCategoryChange(id: string | null) {
    setMainCategoryId(id);
    setSubCategoryId(null);
  }

  useEffect(() => {
    if (materialToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(materialToUpdate.title);
      setDescription(materialToUpdate.description || "");
      setSubCategoryId(materialToUpdate.subCategoryId);
      const sub = helpers.getMaterialCategorySubById(materialToUpdate.subCategoryId);
      setMainCategoryId(sub?.mainCategoryId ?? null);
      setMaterialType(materialToUpdate.materialType);
      setUnit(materialToUpdate.unit);
      setLegacyCode(materialToUpdate.legacyCode || "");
      setMinimumStock(materialToUpdate.minimumStock ?? "");
    } else reset();
  }, [materialToUpdate, helpers]);

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedMinimumStock =
        minimumStock === "" || minimumStock === null || minimumStock === undefined ? null : Number(minimumStock);

      const dto = {
        title: title.trim(),
        description: description.trim() || null,
        subCategoryId: subCategoryId!,
        materialType: materialType as MaterialType,
        unit: unit as MaterialUnit,
        legacyCode: legacyCode.trim() || null,
        minimumStock: normalizedMinimumStock,
      };

      return materialToUpdate
        ? await materialsApi.update({ privateRequest, code: materialToUpdate.code, dto })
        : await materialsApi.create({ privateRequest, dto });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      onSuccess?.();
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!title.trim())
      return setValidationError(translate("Please enter the material title.", "يرجى إدخال عنوان المادة."));
    if (!mainCategoryId)
      return setValidationError(translate("Please select a main category.", "يرجى اختيار الفئة الرئيسية."));
    if (!subCategoryId)
      return setValidationError(translate("Please select a subcategory.", "يرجى اختيار الفئة الفرعية."));
    if (!materialType)
      return setValidationError(translate("Please select a material type.", "يرجى اختيار نوع المادة."));
    if (!unit) return setValidationError(translate("Please select a unit.", "يرجى اختيار الوحدة."));

    const normalizedMinimumStock =
      minimumStock === "" || minimumStock === null || minimumStock === undefined ? null : Number(minimumStock);
    if (normalizedMinimumStock !== null && (Number.isNaN(normalizedMinimumStock) || normalizedMinimumStock < 0)) {
      return setValidationError(
        translate("Minimum stock must be a non-negative number.", "يجب أن يكون الحد الأدنى للمخزون رقماً غير سالب."),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      if (isForList) {
        if (materialToUpdate) setMaterialToUpdate(null);
        else reset();
      }
    }, 250);
  }

  const titleLabel = translate(
    `${materialToUpdate ? "Edit" : "Add"} Material`,
    `${materialToUpdate ? "تعديل المادة" : "إضافة مادة"}`,
  );

  const normalizedMinimumStock =
    minimumStock === "" || minimumStock === null || minimumStock === undefined ? null : Number(minimumStock);

  const isRequiredInputFilled = !!(title.trim() && mainCategoryId && subCategoryId && materialType && unit);

  const isDataChanged = materialToUpdate
    ? title.trim() !== materialToUpdate.title ||
      (description.trim() || null) !== materialToUpdate.description ||
      subCategoryId !== materialToUpdate.subCategoryId ||
      materialType !== materialToUpdate.materialType ||
      unit !== materialToUpdate.unit ||
      (legacyCode.trim() || null) !== materialToUpdate.legacyCode ||
      normalizedMinimumStock !== materialToUpdate.minimumStock
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (materialToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={titleLabel}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          label={translate("Title", "العنوان")}
          placeholder={translate("Enter material title", "أدخل عنوان المادة")}
          required
          autoFocus
          radius="md"
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label={translate("Description (Optional)", "الوصف (اختياري)")}
          placeholder={translate("Enter description", "أدخل الوصف")}
          radius="md"
          autosize
        />

        <SelectMaterialMain
          value={mainCategoryId}
          setValue={handleMainCategoryChange}
          label={translate("Main Category", "الفئة الرئيسية")}
          placeholder={translate("Select main category", "اختر الفئة الرئيسية")}
          searchable
          required
        />

        <SelectMaterialSub
          value={subCategoryId}
          setValue={setSubCategoryId}
          mainCategoryScope={mainCategoryId}
          label={translate("Subcategory", "الفئة الفرعية")}
          placeholder={translate("Select subcategory", "اختر الفئة الفرعية")}
          searchable
          required
        />

        <SelectMaterialType
          value={materialType}
          setValue={setMaterialType}
          label={translate("Material Type", "نوع المادة")}
          placeholder={translate("Select material type", "اختر نوع المادة")}
          required
        />

        <SelectMaterialUnit
          value={unit}
          setValue={setUnit}
          label={translate("Unit", "الوحدة")}
          placeholder={translate("Select unit", "اختر الوحدة")}
          searchable
          required
        />

        <TextInput
          value={legacyCode}
          onChange={(e) => setLegacyCode(e.target.value)}
          label={translate("Legacy Code (Optional)", "الكود القديم (اختياري)")}
          placeholder={translate("Enter legacy code", "أدخل الكود القديم")}
          radius="md"
        />

        <NumberInput
          value={minimumStock}
          onChange={setMinimumStock}
          label={translate("Minimum Stock (Optional)", "الحد الأدنى للمخزون (اختياري)")}
          placeholder={translate("Enter minimum stock", "أدخل الحد الأدنى للمخزون")}
          min={0}
          allowNegative={false}
          decimalScale={3}
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {titleLabel}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
