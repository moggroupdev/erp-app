import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import type { ProductDimension } from "@/types/product";
import { Button, Checkbox, NumberInput, SegmentedControl, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

type DimensionMode = "rectangular" | "cylindrical";

export default function ProductDimensionModal({
  opened,
  close,
  productCode,
  isFirstDimension,
  dimensionToUpdate = null,
  setDimensionToUpdate,
}: {
  opened: boolean;
  close: () => void;
  productCode: string;
  isFirstDimension: boolean;
  dimensionToUpdate?: ProductDimension | null;
  setDimensionToUpdate?: (dimension: ProductDimension | null) => void;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [mode, setMode] = useState<DimensionMode>("rectangular");
  const [length, setLength] = useState<number | string>("");
  const [depth, setDepth] = useState<number | string>("");
  const [diameter, setDiameter] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");

  const isEditMode = !!dimensionToUpdate;

  const initialEditNotes = dimensionToUpdate?.notes ?? null;

  function reset() {
    setMode("rectangular");
    setLength("");
    setDepth("");
    setDiameter("");
    setHeight("");
    setIsDefault(isFirstDimension);
    setNotes("");
  }

  useEffect(() => {
    if (!opened) return;

    if (dimensionToUpdate) {
      const isRectangular = dimensionToUpdate.diameter == null;
      setMode(isRectangular ? "rectangular" : "cylindrical");
      setLength(dimensionToUpdate.length ?? "");
      setDepth(dimensionToUpdate.depth ?? "");
      setDiameter(dimensionToUpdate.diameter ?? "");
      setHeight(dimensionToUpdate.height);
      setIsDefault(dimensionToUpdate.isDefault);
      setNotes(dimensionToUpdate.notes || "");
      return;
    }

    setIsDefault(isFirstDimension);
    setNotes("");
  }, [opened, isFirstDimension, dimensionToUpdate]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const isRectangular = mode === "rectangular";
      return await productsApi.addDimension({
        privateRequest,
        code: productCode,
        dto: {
          length: isRectangular ? Number(length) : null,
          depth: isRectangular ? Number(depth) : null,
          diameter: isRectangular ? null : Number(diameter),
          height: Number(height),
          isDefault: isFirstDimension || isDefault,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productCode) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.dimensions(productCode) });
      if (isFirstDimension || isDefault) await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!dimensionToUpdate) throw new Error("No dimension to update");
      return await productsApi.updateDimension({
        privateRequest,
        code: productCode,
        dimensionId: dimensionToUpdate.id,
        dto: { notes: notes.trim() || null },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productCode) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.dimensions(productCode) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionToUpdate!.id) });
      handleClose();
    },
  });

  const activeMutation = isEditMode ? updateMutation : createMutation;
  const error = validationError || (activeMutation.error ? getErrorMessage(locale, activeMutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (isEditMode) {
      updateMutation.mutate();
      return;
    }

    const normalizedHeight = Number(height);
    if (Number.isNaN(normalizedHeight) || normalizedHeight < 0)
      return setValidationError(translate("Height must be a non-negative number.", "يجب أن يكون الارتفاع رقماً غير سالب."));

    if (mode === "rectangular") {
      const normalizedLength = Number(length);
      const normalizedDepth = Number(depth);
      if (Number.isNaN(normalizedLength) || normalizedLength < 0)
        return setValidationError(translate("Length must be a non-negative number.", "يجب أن يكون الطول رقماً غير سالب."));
      if (Number.isNaN(normalizedDepth) || normalizedDepth < 0)
        return setValidationError(translate("Depth must be a non-negative number.", "يجب أن يكون العمق رقماً غير سالب."));
    } else {
      const normalizedDiameter = Number(diameter);
      if (Number.isNaN(normalizedDiameter) || normalizedDiameter < 0)
        return setValidationError(translate("Diameter must be a non-negative number.", "يجب أن يكون القطر رقماً غير سالب."));
    }

    createMutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setValidationError("");
      createMutation.reset();
      updateMutation.reset();
      setDimensionToUpdate?.(null);
    }, 250);
  }

  const title = isEditMode
    ? translate("Edit Dimension Notes", "تعديل ملاحظات المقاس")
    : translate("Add New Dimension", "إضافة مقاس جديد");
  const unit = translation.productDimensionUnit;

  const isReadyToSubmit = isEditMode
    ? (notes.trim() || null) !== initialEditNotes
    : height !== "" && (mode === "rectangular" ? length !== "" && depth !== "" : diameter !== "");

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {!isEditMode && (
          <SegmentedControl
            value={mode}
            onChange={(value) => setMode(value as DimensionMode)}
            data={[
              { value: "rectangular", label: translate("Length & Depth", "الطول والعمق") },
              { value: "cylindrical", label: translate("Diameter", "القطر") },
            ]}
            fullWidth
            radius="md"
          />
        )}

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {mode === "rectangular" ? (
            <>
              <NumberInput
                value={length}
                onChange={setLength}
                label={`${translate("Length", "الطول")} (${unit})`}
                placeholder={translate("Enter length", "أدخل الطول")}
                min={0}
                allowNegative={false}
                decimalScale={6}
                required
                radius="md"
                disabled={isEditMode}
              />

              <NumberInput
                value={depth}
                onChange={setDepth}
                label={`${translate("Depth", "العمق")} (${unit})`}
                placeholder={translate("Enter depth", "أدخل العمق")}
                min={0}
                allowNegative={false}
                decimalScale={6}
                required
                radius="md"
                disabled={isEditMode}
              />
            </>
          ) : (
            <NumberInput
              value={diameter}
              onChange={setDiameter}
              label={`${translate("Diameter", "القطر")} (${unit})`}
              placeholder={translate("Enter diameter", "أدخل القطر")}
              min={0}
              allowNegative={false}
              decimalScale={6}
              required
              radius="md"
              disabled={isEditMode}
            />
          )}

          <NumberInput
            value={height}
            onChange={setHeight}
            label={`${translate("Height", "الارتفاع")} (${unit})`}
            placeholder={translate("Enter height", "أدخل الارتفاع")}
            min={0}
            allowNegative={false}
            decimalScale={6}
            required
            radius="md"
            disabled={isEditMode}
          />
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Enter notes", "أدخل الملاحظات")}
          radius="md"
          minRows={2}
          autosize
        />

        {!isEditMode && (
          <Checkbox
            checked={isFirstDimension || isDefault}
            onChange={(e) => setIsDefault(e.currentTarget.checked)}
            label={translate("Set as default dimension", "تعيين كمقاس افتراضي")}
            disabled={isFirstDimension}
          />
        )}

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={activeMutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {isEditMode ? translate("Save Changes", "حفظ التغييرات") : title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
