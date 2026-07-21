import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import type { DimensionUnit } from "@/lib/constants/enums/dimension-units";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { Button, Checkbox, NumberInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectDimensionUnit from "@/components/global/selections/enum-based/select-dimension-unit";

export default function ProductDimensionModal({
  opened,
  close,
  productCode,
  isFirstDimension,
}: {
  opened: boolean;
  close: () => void;
  productCode: string;
  isFirstDimension: boolean;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [length, setLength] = useState<number | string>("");
  const [width, setWidth] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const [dimensionUnit, setDimensionUnit] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  function reset() {
    setLength("");
    setWidth("");
    setHeight("");
    setDimensionUnit(null);
    setIsDefault(isFirstDimension);
  }

  useEffect(() => {
    if (opened) setIsDefault(isFirstDimension);
  }, [opened, isFirstDimension]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await productsApi.addDimension({
        privateRequest,
        code: productCode,
        dto: {
          length: Number(length),
          width: Number(width),
          height: Number(height),
          dimensionUnit: dimensionUnit as DimensionUnit,
          isDefault: isFirstDimension || isDefault,
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

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const normalizedLength = Number(length);
    const normalizedWidth = Number(width);
    const normalizedHeight = Number(height);

    if (Number.isNaN(normalizedLength) || normalizedLength < 0)
      return setValidationError(translate("Length must be a non-negative number.", "يجب أن يكون الطول رقماً غير سالب."));
    if (Number.isNaN(normalizedWidth) || normalizedWidth < 0)
      return setValidationError(translate("Width must be a non-negative number.", "يجب أن يكون العرض رقماً غير سالب."));
    if (Number.isNaN(normalizedHeight) || normalizedHeight < 0)
      return setValidationError(translate("Height must be a non-negative number.", "يجب أن يكون الارتفاع رقماً غير سالب."));
    if (!dimensionUnit) return setValidationError(translate("Please select a unit.", "يرجى اختيار الوحدة."));

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = translate("Add New Dimension", "إضافة مقاس جديد");

  const isReadyToSubmit = length !== "" && width !== "" && height !== "" && !!dimensionUnit;

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <NumberInput
            value={length}
            onChange={setLength}
            label={translate("Length", "الطول")}
            placeholder={translate("Enter length", "أدخل الطول")}
            min={0}
            allowNegative={false}
            decimalScale={4}
            required
            radius="md"
          />

          <NumberInput
            value={width}
            onChange={setWidth}
            label={translate("Width", "العرض")}
            placeholder={translate("Enter width", "أدخل العرض")}
            min={0}
            allowNegative={false}
            decimalScale={4}
            required
            radius="md"
          />

          <NumberInput
            value={height}
            onChange={setHeight}
            label={translate("Height", "الارتفاع")}
            placeholder={translate("Enter height", "أدخل الارتفاع")}
            min={0}
            allowNegative={false}
            decimalScale={4}
            required
            radius="md"
          />
        </div>

        <SelectDimensionUnit
          value={dimensionUnit}
          setValue={setDimensionUnit}
          label={translate("Unit", "الوحدة")}
          placeholder={translate("Select unit", "اختر الوحدة")}
          required
        />

        <Checkbox
          checked={isFirstDimension || isDefault}
          onChange={(e) => setIsDefault(e.currentTarget.checked)}
          label={translate("Set as default dimension", "تعيين كمقاس افتراضي")}
          disabled={isFirstDimension}
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
